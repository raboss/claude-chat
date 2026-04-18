/* ============================================================
   NouRion — hr.test.js
   ============================================================ */

var L = (typeof require !== 'undefined')
  ? require('./hr.logic.js')
  : window.NouRion.HrLogic;

var passed = 0, failed = 0, failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log('  ✔ ' + name); }
  catch (e) { failed++; failures.push({ name: name, error: e.message }); console.log('  ✘ ' + name + '\n     → ' + e.message); }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' expected=' + JSON.stringify(b) + ' actual=' + JSON.stringify(a)); }
function near(a, b, tol, msg) { if (Math.abs(a - b) > (tol || 0.001)) throw new Error((msg || '') + ' expected≈' + b + ' actual=' + a); }
function truthy(v, msg) { if (!v) throw new Error(msg || 'expected truthy, got ' + JSON.stringify(v)); }
function falsy(v, msg) { if (v) throw new Error(msg || 'expected falsy, got ' + JSON.stringify(v)); }
function group(n, fn) { console.log('\n── ' + n + ' ──'); fn(); }


// ============================================================
group('HR_DEFAULT_DEPTS', function () {
  test('contains 9 default departments', function () {
    eq(L.HR_DEFAULT_DEPTS.length, 9);
  });

  test('root department is dept_mgmt', function () {
    var roots = L.HR_DEFAULT_DEPTS.filter(function (d) { return d.parentId === null; });
    eq(roots.length, 1);
    eq(roots[0].id, 'dept_mgmt');
  });

  test('every dept has color and icon', function () {
    L.HR_DEFAULT_DEPTS.forEach(function (d) {
      truthy(d.color);
      truthy(d.icon);
      truthy(d.name);
    });
  });

  test('getDefaultDepts returns fresh copies', function () {
    var a = L.getDefaultDepts();
    a[0].name = 'mutated';
    var b = L.getDefaultDepts();
    truthy(b[0].name !== 'mutated');
  });
});


// ============================================================
group('isManager', function () {
  test('مدير → true', function () {
    truthy(L.isManager({ role: 'مدير المصنع' }));
    truthy(L.isManager({ role: 'مدير الإنتاج' }));
  });

  test('رئيس → true', function () {
    truthy(L.isManager({ role: 'رئيس قسم' }));
  });

  test('مشرف → true', function () {
    truthy(L.isManager({ role: 'مشرف العمليات' }));
  });

  test('عامل → false', function () {
    falsy(L.isManager({ role: 'عامل تجميع' }));
    falsy(L.isManager({ role: 'فني تركيب' }));
  });

  test('null/empty role → false', function () {
    falsy(L.isManager({}));
    falsy(L.isManager({ role: null }));
    falsy(L.isManager({ role: '' }));
    falsy(L.isManager(null));
  });
});


// ============================================================
group('filterActiveEmployees', function () {
  test('removes terminated', function () {
    var r = L.filterActiveEmployees([
      { id: 1, status: 'active' },
      { id: 2, status: 'terminated' },
      { id: 3 } // no status = active
    ]);
    eq(r.length, 2);
  });

  test('null safety', function () {
    eq(L.filterActiveEmployees(null).length, 0);
    eq(L.filterActiveEmployees([]).length, 0);
  });
});


// ============================================================
group('groupEmployeesByDept', function () {
  var emps = [
    { id: 1, departmentId: 'dept_a' },
    { id: 2, departmentId: 'dept_a' },
    { id: 3, departmentId: 'dept_b' },
    { id: 4, departmentId: 'dept_a', status: 'terminated' }
  ];

  test('groups correctly + filters terminated', function () {
    eq(L.groupEmployeesByDept(emps, 'dept_a').length, 2);
    eq(L.groupEmployeesByDept(emps, 'dept_b').length, 1);
  });

  test('unknown dept → []', function () {
    eq(L.groupEmployeesByDept(emps, 'dept_x').length, 0);
  });
});


// ============================================================
group('countDeptStats', function () {
  var emps = [
    { id: 1, departmentId: 'd1', role: 'مدير عام' },
    { id: 2, departmentId: 'd1', role: 'مشرف' },
    { id: 3, departmentId: 'd1', role: 'عامل' },
    { id: 4, departmentId: 'd1', role: 'فني' }
  ];

  test('total / managers / staff', function () {
    var s = L.countDeptStats(emps, 'd1');
    eq(s.total, 4);
    eq(s.managers, 2); // مدير + مشرف
    eq(s.staff, 2);
  });
});


// ============================================================
group('buildDeptTree', function () {
  test('builds tree from flat list', function () {
    var tree = L.buildDeptTree(L.HR_DEFAULT_DEPTS);
    eq(tree.length, 1);
    eq(tree[0].id, 'dept_mgmt');
    truthy(tree[0].children.length > 0);
  });

  test('respects order property', function () {
    var custom = [
      { id: 'a', parentId: null, order: 2 },
      { id: 'b', parentId: null, order: 1 },
      { id: 'c', parentId: null, order: 3 }
    ];
    var tree = L.buildDeptTree(custom);
    eq(tree[0].id, 'b');
    eq(tree[1].id, 'a');
    eq(tree[2].id, 'c');
  });

  test('nests correctly', function () {
    var tree = L.buildDeptTree(L.HR_DEFAULT_DEPTS);
    var prod = tree[0].children.find(function (c) { return c.id === 'dept_production'; });
    truthy(prod);
    var hall = prod.children.find(function (c) { return c.id === 'dept_hall'; });
    truthy(hall);
    truthy(hall.children.length === 3); // cutting + milling + assembly
  });

  test('null safety', function () {
    eq(L.buildDeptTree(null).length, 0);
    eq(L.buildDeptTree([]).length, 0);
  });
});


// ============================================================
group('createEmptySalaryRow', function () {
  test('all fields present', function () {
    var r = L.createEmptySalaryRow({ id: 'e1', name: 'علي', iqama: '1234', role: 'فني' });
    eq(r.empId, 'e1');
    eq(r.name, 'علي');
    eq(r.iqama, '1234');
    eq(r.job, 'فني');
    eq(r.days, 30);
    eq(r.basic, 0);
    eq(r.notes, '');
  });

  test('null employee', function () {
    eq(L.createEmptySalaryRow(null), null);
  });
});


// ============================================================
group('computeSalaryRow — CRITICAL', function () {
  test('basic 3000 + housing 500 + other 200, 30 days, no debts', function () {
    // gross = (3000 + 500 + 200) / 30 × 30 = 3700
    var r = L.computeSalaryRow({ basic: 3000, housing: 500, other: 200, days: 30 });
    eq(r.gross, 3700);
    eq(r.net, 3700);
    eq(r.due, 3700);
  });

  test('partial month: 15 days of 30', function () {
    // gross = 3000 / 30 × 15 = 1500
    var r = L.computeSalaryRow({ basic: 3000, housing: 0, other: 0, days: 15 });
    eq(r.gross, 1500);
  });

  test('with debts', function () {
    // gross = 3700, net = 3700 - 200 = 3500
    var r = L.computeSalaryRow({ basic: 3000, housing: 500, other: 200, days: 30, debts: 200 });
    eq(r.gross, 3700);
    eq(r.net, 3500);
  });

  test('with adjustments (positive)', function () {
    // gross = 3700, net = 3700, due = 3700 - 100 = 3600
    var r = L.computeSalaryRow({ basic: 3000, housing: 500, other: 200, days: 30, adjustments: 100 });
    eq(r.due, 3600);
  });

  test('negative adjustments (bonus)', function () {
    // adjustments = -200 → due = 3700 - (-200) = 3900
    var r = L.computeSalaryRow({ basic: 3000, housing: 500, other: 200, days: 30, adjustments: -200 });
    eq(r.due, 3900);
  });

  test('null row → zeros', function () {
    var r = L.computeSalaryRow(null);
    eq(r.gross, 0);
    eq(r.due, 0);
  });

  test('missing fields default to 0', function () {
    var r = L.computeSalaryRow({});
    eq(r.gross, 0);
  });
});


// ============================================================
group('computeSalaryTotals', function () {
  test('aggregates 3 rows', function () {
    var t = L.computeSalaryTotals([
      { basic: 3000, housing: 500, other: 0, days: 30 },                  // gross 3500
      { basic: 4000, housing: 600, other: 100, days: 30, debts: 100 },    // gross 4700, net 4600
      { basic: 5000, housing: 800, other: 0, days: 30, adjustments: 200 } // gross 5800, due 5600
    ]);
    eq(t.basic, 12000);
    eq(t.housing, 1900);
    eq(t.other, 100);
    eq(t.gross, 3500 + 4700 + 5800);
    eq(t.net, 3500 + 4600 + 5800);
    eq(t.due, 3500 + 4600 + 5600);
  });

  test('null safety', function () {
    var t = L.computeSalaryTotals(null);
    eq(t.gross, 0);
  });
});


// ============================================================
group('toggleAttendanceCell', function () {
  test('cycle: empty → 1 → L → X → empty', function () {
    eq(L.toggleAttendanceCell(''),  '1');
    eq(L.toggleAttendanceCell('1'), 'L');
    eq(L.toggleAttendanceCell('L'), 'X');
    eq(L.toggleAttendanceCell('X'), '');
  });

  test('null/undefined treated as empty', function () {
    eq(L.toggleAttendanceCell(null), '1');
    eq(L.toggleAttendanceCell(undefined), '1');
  });
});


// ============================================================
group('computeAttendanceTotal — CRITICAL', function () {
  test('full month present (30 days)', function () {
    var days = {};
    for (var i = 1; i <= 30; i++) days[i] = '1';
    eq(L.computeAttendanceTotal(days), 30);
  });

  test('mixed: 20 present + 4 late + 6 absent', function () {
    var days = {};
    for (var i = 1; i <= 20; i++) days[i] = '1';
    for (var j = 21; j <= 24; j++) days[j] = 'L';
    for (var k = 25; k <= 30; k++) days[k] = 'X';
    // 20 + 4×0.5 = 22
    eq(L.computeAttendanceTotal(days), 22);
  });

  test('all absent', function () {
    var days = {};
    for (var i = 1; i <= 30; i++) days[i] = 'X';
    eq(L.computeAttendanceTotal(days), 0);
  });

  test('all late = half month', function () {
    var days = {};
    for (var i = 1; i <= 30; i++) days[i] = 'L';
    eq(L.computeAttendanceTotal(days), 15);
  });

  test('empty days', function () {
    eq(L.computeAttendanceTotal({}), 0);
    eq(L.computeAttendanceTotal(null), 0);
  });
});


// ============================================================
group('computeAttendanceMonthSummary', function () {
  test('aggregates across rows', function () {
    var rows = [
      { name: 'A', days: { 1: '1', 2: '1', 3: 'L', 4: 'X' } },
      { name: 'B', days: { 1: '1', 2: 'X', 3: 'X' } }
    ];
    var s = L.computeAttendanceMonthSummary(rows, 2026, 4);
    eq(s.totalEmployees, 2);
    eq(s.totalPresent, 3); // 2 + 1
    eq(s.totalLate, 1);
    eq(s.totalAbsent, 3); // 1 + 2
  });

  test('null', function () {
    var s = L.computeAttendanceMonthSummary(null, 2026, 4);
    eq(s.totalEmployees, 0);
  });
});


// ============================================================
group('syncRowsWithEmployees', function () {
  var emps = [
    { id: 'e1', name: 'علي' },
    { id: 'e2', name: 'محمد' },
    { id: 'e3', name: 'سعد' }
  ];

  test('empty rows → adds all employees', function () {
    var r = L.syncRowsWithEmployees([], emps);
    eq(r.rows.length, 3);
    eq(r.changed, true);
  });

  test('removes terminated rows', function () {
    var existing = [
      { empId: 'e1', name: 'علي' },
      { empId: 'e2', name: 'محمد' },
      { empId: 'eX', name: 'محذوف' }
    ];
    var r = L.syncRowsWithEmployees(existing, emps);
    eq(r.rows.find(function (x) { return x.empId === 'eX'; }), undefined);
    eq(r.changed, true);
  });

  test('adds new + keeps existing', function () {
    var existing = [{ empId: 'e1', name: 'علي', basic: 3000 }];
    var r = L.syncRowsWithEmployees(existing, emps);
    eq(r.rows.length, 3);
    var ali = r.rows.find(function (x) { return x.empId === 'e1'; });
    eq(ali.basic, 3000); // preserved
  });

  test('legacy match by name (no empId)', function () {
    var existing = [{ name: 'علي', basic: 3500 }];
    var r = L.syncRowsWithEmployees(existing, emps);
    eq(r.rows.length, 3);
    var ali = r.rows.find(function (x) { return x.name === 'علي'; });
    eq(ali.basic, 3500);
  });

  test('no changes when in sync', function () {
    var existing = [
      { empId: 'e1', name: 'علي' },
      { empId: 'e2', name: 'محمد' },
      { empId: 'e3', name: 'سعد' }
    ];
    var r = L.syncRowsWithEmployees(existing, emps);
    eq(r.changed, false);
  });
});


// ============================================================
group('Date utilities', function () {
  test('getDaysInMonth', function () {
    eq(L.getDaysInMonth(2026, 1), 31);   // January
    eq(L.getDaysInMonth(2026, 2), 28);   // February (not leap)
    eq(L.getDaysInMonth(2024, 2), 29);   // leap year
    eq(L.getDaysInMonth(2026, 4), 30);   // April
  });

  test('isFriday', function () {
    // 2026-01-02 is a Friday
    truthy(L.isFriday(2026, 1, 2));
    falsy(L.isFriday(2026, 1, 1));
  });

  test('parseMonthKey', function () {
    var p = L.parseMonthKey('2026-04');
    eq(p.year, 2026);
    eq(p.month, 4);
  });

  test('parseMonthKey invalid', function () {
    eq(L.parseMonthKey(''), null);
    eq(L.parseMonthKey('2026'), null);
    eq(L.parseMonthKey('not-a-date'), null);
  });

  test('formatMonthKey', function () {
    eq(L.formatMonthKey(new Date(2026, 0, 15)), '2026-01');
    eq(L.formatMonthKey(new Date(2026, 11, 31)), '2026-12');
  });

  test('formatMonthLabel', function () {
    eq(L.formatMonthLabel('2026-04'), 'أبريل 2026');
    eq(L.formatMonthLabel('2026-01'), 'يناير 2026');
  });
});


// ============================================================
console.log('\n════════════════════════════════════════');
console.log('  NouRion — hr.logic.js test results');
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
