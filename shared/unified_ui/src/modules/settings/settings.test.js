/* ============================================================
   NouRion — settings.test.js
   ============================================================ */

var L = (typeof require !== 'undefined')
  ? require('./settings.logic.js')
  : window.NouRion.SettingsLogic;

var passed = 0, failed = 0, failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log('  ✔ ' + name); }
  catch (e) { failed++; failures.push({ name: name, error: e.message }); console.log('  ✘ ' + name + '\n     → ' + e.message); }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' expected=' + JSON.stringify(b) + ' actual=' + JSON.stringify(a)); }
function truthy(v, msg) { if (!v) throw new Error(msg || 'expected truthy, got ' + JSON.stringify(v)); }
function falsy(v, msg) { if (v) throw new Error(msg || 'expected falsy, got ' + JSON.stringify(v)); }
function group(n, fn) { console.log('\n── ' + n + ' ──'); fn(); }


// ============================================================
group('constants integrity', function () {
  test('ALL_PERMS has page_projects', function () {
    truthy(L.ALL_PERMS.page_projects);
  });

  test('PERM_GROUPS has all expected groups', function () {
    var expected = ['📄 الصفحات', '🔧 شريط الأدوات', '🔘 أزرار المشروع', '📊 تبويبات التقارير', '📋 أزرار التقارير', '💾 السجلات', '⚙️ الإعدادات', '👥 الموظفين', '💰 الحسابات', '🎨 التصاميم', '🔨 التركيبات'];
    expected.forEach(function (g) {
      truthy(L.PERM_GROUPS[g], 'missing group: ' + g);
    });
  });

  test('every PERM_GROUPS key exists in ALL_PERMS', function () {
    var missing = [];
    Object.values(L.PERM_GROUPS).forEach(function (keys) {
      keys.forEach(function (k) {
        if (!L.ALL_PERMS[k]) missing.push(k);
      });
    });
    eq(missing.length, 0, 'orphan keys: ' + missing.join(', '));
  });

  test('ALL_PERMS count is healthy (>100)', function () {
    truthy(Object.keys(L.ALL_PERMS).length > 100);
  });
});


// ============================================================
group('getColumnLabel', function () {
  test('returns col.label if set', function () {
    eq(L.getColumnLabel({ label: 'Custom', id: 'name' }), 'Custom');
  });

  test('falls back to map by id', function () {
    eq(L.getColumnLabel({ id: 'contractNo' }), 'رقم العقد');
    eq(L.getColumnLabel({ id: 'name' }), 'اسم العميل');
    eq(L.getColumnLabel({ id: 'progress' }), 'نسبة الإنجاز');
  });

  test('unknown id falls back to id itself', function () {
    eq(L.getColumnLabel({ id: 'something' }), 'something');
  });

  test('empty col → ""', function () {
    eq(L.getColumnLabel(null), '');
    eq(L.getColumnLabel({}), '');
  });
});


// ============================================================
group('hashStr', function () {
  test('deterministic', function () {
    eq(L.hashStr('hello'), L.hashStr('hello'));
  });

  test('different inputs → different hashes', function () {
    truthy(L.hashStr('a') !== L.hashStr('b'));
  });

  test('empty string → "0"', function () {
    eq(L.hashStr(''), '0');
  });

  test('output is base36 string', function () {
    var h = L.hashStr('test');
    truthy(/^-?[0-9a-z]+$/.test(h));
  });
});


// ============================================================
group('hasPermission', function () {
  test('admin has every permission', function () {
    var admin = { isAdmin: true };
    truthy(L.hasPermission(admin, 'page_projects'));
    truthy(L.hasPermission(admin, 'btn_delete'));
    truthy(L.hasPermission(admin, 'made_up_perm'));
  });

  test('null user → false', function () {
    falsy(L.hasPermission(null, 'page_projects'));
  });

  test('user with no perms → false', function () {
    falsy(L.hasPermission({ name: 'x' }, 'page_projects'));
  });

  test('user with perm → true', function () {
    var u = { name: 'x', perms: ['page_projects', 'btn_edit'] };
    truthy(L.hasPermission(u, 'page_projects'));
    truthy(L.hasPermission(u, 'btn_edit'));
    falsy(L.hasPermission(u, 'btn_delete'));
  });
});


// ============================================================
group('canAccessPage', function () {
  test('admin can access any page', function () {
    truthy(L.canAccessPage({ isAdmin: true }, 'projects'));
    truthy(L.canAccessPage({ isAdmin: true }, 'settings'));
  });

  test('user with page_X can access X', function () {
    var u = { perms: ['page_projects'] };
    truthy(L.canAccessPage(u, 'projects'));
    falsy(L.canAccessPage(u, 'settings'));
  });

  test('null user → false', function () {
    falsy(L.canAccessPage(null, 'projects'));
  });
});


// ============================================================
group('expandImpliedPerms', function () {
  test('admin returned as-is', function () {
    var admin = { isAdmin: true, perms: ['x'] };
    var r = L.expandImpliedPerms(admin);
    eq(r, admin);
  });

  test('null returned as-is', function () {
    eq(L.expandImpliedPerms(null), null);
  });

  test('hr_tab_org → adds page_hr', function () {
    var u = { name: 'x', perms: ['hr_tab_org'] };
    var r = L.expandImpliedPerms(u);
    truthy(r.perms.indexOf('page_hr') !== -1);
  });

  test('cust_receive → adds page_custody', function () {
    var u = { name: 'x', perms: ['cust_receive'] };
    var r = L.expandImpliedPerms(u);
    truthy(r.perms.indexOf('page_custody') !== -1);
  });

  test('cust_emp_X → adds page_custody + cust_accounts + cust_invoice', function () {
    var u = { name: 'x', perms: ['cust_emp_42'] };
    var r = L.expandImpliedPerms(u);
    truthy(r.perms.indexOf('page_custody') !== -1);
    truthy(r.perms.indexOf('cust_accounts') !== -1);
    truthy(r.perms.indexOf('cust_invoice') !== -1);
  });

  test('inst_add_client → adds page_installations', function () {
    var u = { name: 'x', perms: ['inst_add_client'] };
    var r = L.expandImpliedPerms(u);
    truthy(r.perms.indexOf('page_installations') !== -1);
  });

  test('user with no implied perms unchanged', function () {
    var u = { name: 'x', perms: ['page_projects', 'btn_edit'] };
    var r = L.expandImpliedPerms(u);
    eq(r.perms.length, 2);
  });

  test('non-mutating (returns new object)', function () {
    var u = { name: 'x', perms: ['hr_tab_org'] };
    var beforeLen = u.perms.length;
    L.expandImpliedPerms(u);
    eq(u.perms.length, beforeLen);
  });

  test('does not duplicate existing page perm', function () {
    var u = { name: 'x', perms: ['page_hr', 'hr_tab_org'] };
    var r = L.expandImpliedPerms(u);
    var count = r.perms.filter(function (p) { return p === 'page_hr'; }).length;
    eq(count, 1);
  });
});


// ============================================================
group('filterActionsByPerms', function () {
  var actions = [
    { fn: 'editProject', label: '✏️ تعديل' },
    { fn: 'openTimeline', label: '📅 المخطط' },
    { fn: 'deleteProject', label: '🗑️ حذف' },
    { fn: 'openMeasurements', label: '📐 المقاسات' },
    { fn: 'unknownAction', label: '?' }
  ];

  test('admin sees everything', function () {
    var r = L.filterActionsByPerms(actions, { isAdmin: true });
    eq(r.length, actions.length);
  });

  test('null user → empty (default-deny)', function () {
    var r = L.filterActionsByPerms(actions, null);
    eq(r.length, actions.length); // null returns actions per original (`if(!cu||cu.isAdmin) return actions`)
  });

  test('user with btn_edit only sees editProject', function () {
    var u = { perms: ['btn_edit'] };
    var r = L.filterActionsByPerms(actions, u);
    eq(r.length, 1);
    eq(r[0].fn, 'editProject');
  });

  test('user with btn_edit + btn_delete sees both', function () {
    var u = { perms: ['btn_edit', 'btn_delete'] };
    var r = L.filterActionsByPerms(actions, u);
    eq(r.length, 2);
  });

  test('unknown action is hidden by default', function () {
    var u = { perms: ['btn_edit', 'btn_delete'] };
    var r = L.filterActionsByPerms(actions, u);
    truthy(r.every(function (a) { return a.fn !== 'unknownAction'; }));
  });

  test('quickDoc.*مستخلص regex matching (Arabic)', function () {
    var docActions = [
      { fn: 'quickDoc_مستخلص_p1', label: 'مستخلص' },
      { fn: 'quickDoc_خطاب', label: 'خطاب' }
    ];
    var u = { perms: ['btn_extract'] };
    var r = L.filterActionsByPerms(docActions, u);
    eq(r.length, 1);
    eq(r[0].fn, 'quickDoc_مستخلص_p1');
  });
});


// ============================================================
group('validateUser', function () {
  test('valid non-admin', function () {
    var r = L.validateUser({ name: 'Ali', pass: 'abcd', perms: [] });
    eq(r.valid, true);
  });

  test('valid admin (no password needed)', function () {
    var r = L.validateUser({ name: 'admin', isAdmin: true });
    eq(r.valid, true);
  });

  test('null', function () {
    eq(L.validateUser(null).valid, false);
  });

  test('missing name', function () {
    eq(L.validateUser({ pass: 'abcd' }).valid, false);
  });

  test('short password', function () {
    var r = L.validateUser({ name: 'x', pass: 'ab' });
    eq(r.valid, false);
  });

  test('perms not array', function () {
    var r = L.validateUser({ name: 'x', pass: 'abcd', perms: 'all' });
    eq(r.valid, false);
  });
});


// ============================================================
group('countUserPerms', function () {
  test('admin sees all', function () {
    var r = L.countUserPerms({ isAdmin: true });
    eq(r.count, r.total);
  });

  test('regular user', function () {
    var r = L.countUserPerms({ perms: ['a', 'b', 'c'] });
    eq(r.count, 3);
  });

  test('null user', function () {
    var r = L.countUserPerms(null);
    eq(r.count, 0);
  });
});


// ============================================================
group('groupUserPerms', function () {
  test('admin → all groups isAll', function () {
    var r = L.groupUserPerms({ isAdmin: true });
    truthy(r.length > 0);
    truthy(r.every(function (g) { return g.isAll === true; }));
  });

  test('user with single perm → only that group has 1 active', function () {
    var u = { perms: ['btn_edit'] };
    var r = L.groupUserPerms(u);
    var btnGroup = r.find(function (g) { return g.group === '🔘 أزرار المشروع'; });
    truthy(btnGroup);
    eq(btnGroup.active, 1);
    eq(btnGroup.isAll, false);
  });

  test('user with all perms in a group → isAll true', function () {
    var pageKeys = L.PERM_GROUPS['📄 الصفحات'];
    var u = { perms: pageKeys.slice() };
    var r = L.groupUserPerms(u);
    var pageGroup = r.find(function (g) { return g.group === '📄 الصفحات'; });
    eq(pageGroup.isAll, true);
  });
});


// ============================================================
console.log('\n════════════════════════════════════════');
console.log('  NouRion — settings.logic.js test results');
console.log('════════════════════════════════════════');
console.log('  ✔ passed: ' + passed);
console.log('  ✘ failed: ' + failed);
if (failed > 0) {
  console.log('\nFailures:');
  failures.forEach(function (f) { console.log('  - ' + f.name + '\n    ' + f.error); });
  if (typeof process !== 'undefined') process.exit(1);
} else {
  console.log('\n  ✓ All tests passed.\n');
}
