/* ============================================================
   NouRion — saved.test.js
   ============================================================ */

var L = (typeof require !== 'undefined')
  ? require('./saved.logic.js')
  : window.NouRion.SavedLogic;

var passed = 0, failed = 0, failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log('  ✔ ' + name); }
  catch (e) { failed++; failures.push({ name: name, error: e.message }); console.log('  ✘ ' + name + '\n     → ' + e.message); }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' expected=' + JSON.stringify(b) + ' actual=' + JSON.stringify(a)); }
function near(a, b, tol, msg) { if (Math.abs(a - b) > (tol || 0.001)) throw new Error((msg || '') + ' expected≈' + b + ' actual=' + a); }
function truthy(v, msg) { if (!v) throw new Error(msg || 'expected truthy, got ' + JSON.stringify(v)); }
function isNull(v, msg) { if (v != null) throw new Error((msg || 'expected null') + ' got ' + JSON.stringify(v)); }
function group(n, fn) { console.log('\n── ' + n + ' ──'); fn(); }


// ============================================================
group('getRegion', function () {
  test('new key region', function () {
    eq(L.getRegion({ region: 'الوسطى' }), 'الوسطى');
  });

  test('legacy key المناطق (old data)', function () {
    eq(L.getRegion({ 'المناطق': 'الشرقية' }), 'الشرقية');
  });

  test('new key wins over legacy', function () {
    eq(L.getRegion({ region: 'الوسطى', 'المناطق': 'الشرقية' }), 'الوسطى');
  });

  test('empty project → ""', function () {
    eq(L.getRegion({}), '');
  });

  test('null → ""', function () {
    eq(L.getRegion(null), '');
    eq(L.getRegion(undefined), '');
  });
});


// ============================================================
group('migrateProjectFields', function () {
  test('non-mutating (returns new object)', function () {
    var original = { 'المناطق': 'الوسطى', name: 'test' };
    var r = L.migrateProjectFields(original);
    // original should still have old key
    truthy(original['المناطق'] !== undefined, 'original mutated');
    // new one should have migrated key
    eq(r.project.region, 'الوسطى');
    truthy(r.project['المناطق'] === undefined, 'new obj still has old key');
  });

  test('migrates المناطق → region', function () {
    var r = L.migrateProjectFields({ 'المناطق': 'الشرقية' });
    eq(r.project.region, 'الشرقية');
    eq(r.changed, true);
  });

  test('migrates رقم العقد → contractNo', function () {
    var r = L.migrateProjectFields({ 'رقم العقد': '123' });
    eq(r.project.contractNo, '123');
    eq(r.changed, true);
  });

  test('preserves existing region if set', function () {
    var r = L.migrateProjectFields({ region: 'X', 'المناطق': 'Y' });
    eq(r.project.region, 'X');
    // old key is still deleted per original logic
    truthy(r.project['المناطق'] === undefined);
  });

  test('no-op on clean project', function () {
    var r = L.migrateProjectFields({
      name: 'clean',
      region: 'الوسطى',
      contractNo: '999',
      status: 'جاري',
      stage: 'رفع مقاسات'
    });
    eq(r.changed, false);
    eq(r.changes.length, 0);
  });

  test('calculates status from stage when missing', function () {
    var r = L.migrateProjectFields({ stage: 'رفع مقاسات' });
    eq(r.project.status, 'جاري');
    eq(r.changed, true);
  });

  test('calculates smart delivery when data present', function () {
    var r = L.migrateProjectFields({
      contractDuration: '30',
      approvalDate: '2026-01-01',
      stage: 'رفع مقاسات'
    });
    truthy(r.project.deliveryDate, 'expected deliveryDate');
    eq(typeof r.project.deliveryDate, 'string');
    eq(r.project.deliveryDate.length, 10);
  });

  test('null input is safe', function () {
    var r = L.migrateProjectFields(null);
    eq(r.changed, false);
  });
});


// ============================================================
group('migrateProjectList', function () {
  test('empty list', function () {
    var r = L.migrateProjectList([]);
    eq(r.projects.length, 0);
    eq(r.changedCount, 0);
  });

  test('counts changed projects', function () {
    var r = L.migrateProjectList([
      { 'المناطق': 'الوسطى' },
      { region: 'الشرقية', stage: 'رفع مقاسات', status: 'جاري' },
      { 'رقم العقد': '100' }
    ]);
    eq(r.projects.length, 3);
    eq(r.changedCount, 2);
  });

  test('null safe', function () {
    var r = L.migrateProjectList(null);
    eq(r.projects.length, 0);
  });
});


// ============================================================
group('findLogEntry / findPreviousLogEntry', function () {
  var log = [
    { year: 2026, month: 1, progress: 10 },
    { year: 2026, month: 2, progress: 25 },
    { year: 2026, month: 3, progress: 40 },
    { year: 2025, month: 12, progress: 5 }
  ];

  test('findLogEntry hit', function () {
    var e = L.findLogEntry(log, 2026, 2);
    eq(e.progress, 25);
  });

  test('findLogEntry miss', function () {
    isNull(L.findLogEntry(log, 2025, 1));
  });

  test('findPreviousLogEntry — returns previous month', function () {
    var e = L.findPreviousLogEntry(log, 2026, 3);
    eq(e.month, 2);
    eq(e.progress, 25);
  });

  test('findPreviousLogEntry — crosses year boundary', function () {
    var e = L.findPreviousLogEntry(log, 2026, 1);
    eq(e.year, 2025);
    eq(e.month, 12);
  });

  test('findPreviousLogEntry — none → null', function () {
    isNull(L.findPreviousLogEntry(log, 2025, 1));
  });

  test('empty log → null', function () {
    isNull(L.findPreviousLogEntry([], 2026, 1));
    isNull(L.findPreviousLogEntry(null, 2026, 1));
  });
});


// ============================================================
group('computeProductionDelta', function () {
  var project = {
    name: 'Test Project',
    contractValue: '100000',
    extractValue: '120000',
    productionLog: [
      { year: 2026, month: 1, progress: 20 },
      { year: 2026, month: 2, progress: 50 },
      { year: 2026, month: 3, progress: 65 }
    ]
  };

  test('no entry for target month', function () {
    var d = L.computeProductionDelta(project, 2026, 12);
    eq(d.hasEntry, false);
    eq(d.delta, 0);
    eq(d.prodValue, 0);
    eq(d.baseValue, 120000); // from extractValue
  });

  test('first month (no previous)', function () {
    var d = L.computeProductionDelta(project, 2026, 1);
    eq(d.hasEntry, true);
    eq(d.delta, 20);          // 20 - 0
    eq(d.baseValue, 120000);  // extract > 0 → extract
    eq(d.prodValue, 24000);   // 120000 * 0.20
  });

  test('second month (uses previous)', function () {
    var d = L.computeProductionDelta(project, 2026, 2);
    eq(d.delta, 30);          // 50 - 20
    eq(d.prodValue, 36000);   // 120000 * 0.30
  });

  test('third month', function () {
    var d = L.computeProductionDelta(project, 2026, 3);
    eq(d.delta, 15);          // 65 - 50
    eq(d.prodValue, 18000);   // 120000 * 0.15
  });

  test('regression (thisProgress < prevProgress) → delta clamped to 0', function () {
    var weird = {
      contractValue: '50000',
      productionLog: [
        { year: 2026, month: 1, progress: 50 },
        { year: 2026, month: 2, progress: 30 } // regression
      ]
    };
    var d = L.computeProductionDelta(weird, 2026, 2);
    eq(d.delta, 0);
    eq(d.prodValue, 0);
  });

  test('no extract → contract used as base', function () {
    var p2 = {
      contractValue: '80000',
      productionLog: [{ year: 2026, month: 1, progress: 50 }]
    };
    var d = L.computeProductionDelta(p2, 2026, 1);
    eq(d.baseValue, 80000);
    eq(d.prodValue, 40000);
  });
});


// ============================================================
group('computeMonthlyProduction', function () {
  var projects = [
    {
      id: 'a',
      name: 'Alpha',
      company: 'Alpha Co',
      contractValue: '100000',
      productionLog: [
        { year: 2026, month: 1, progress: 30 },
        { year: 2026, month: 2, progress: 60 }
      ]
    },
    {
      id: 'b',
      name: 'Beta',
      company: 'Beta Co',
      extractValue: '200000',
      productionLog: [
        { year: 2026, month: 2, progress: 10 }
      ]
    },
    {
      id: 'c',
      name: 'Gamma (no log)',
      contractValue: '50000',
      productionLog: []
    }
  ];

  test('month with no data', function () {
    var r = L.computeMonthlyProduction(projects, 2025, 1);
    eq(r.total, 0);
    eq(r.count, 0);
  });

  test('Jan 2026 — only Alpha', function () {
    var r = L.computeMonthlyProduction(projects, 2026, 1);
    eq(r.count, 1);
    eq(r.rows[0].id, 'a');
    eq(r.total, 30000); // 100000 * 30%
  });

  test('Feb 2026 — Alpha + Beta', function () {
    var r = L.computeMonthlyProduction(projects, 2026, 2);
    eq(r.count, 2);
    eq(r.total, 30000 + 20000); // 100k*30% (delta 30) + 200k*10%
  });

  test('null projects → 0', function () {
    var r = L.computeMonthlyProduction(null, 2026, 1);
    eq(r.total, 0);
    eq(r.count, 0);
  });
});


// ============================================================
group('computeAllMonths', function () {
  var projects = [
    { productionLog: [{ year: 2026, month: 1, progress: 20 }, { year: 2026, month: 2, progress: 40 }], contractValue: '100000' },
    { productionLog: [{ year: 2025, month: 12, progress: 30 }], contractValue: '50000' }
  ];

  test('returns all unique months sorted newest first', function () {
    var r = L.computeAllMonths(projects);
    eq(r.length, 3);
    eq(r[0].year, 2026);
    eq(r[0].month, 2);
    eq(r[1].year, 2026);
    eq(r[1].month, 1);
    eq(r[2].year, 2025);
    eq(r[2].month, 12);
  });

  test('empty → []', function () {
    eq(L.computeAllMonths([]).length, 0);
    eq(L.computeAllMonths(null).length, 0);
  });
});


// ============================================================
group('generateReportNo', function () {
  test('fixed date', function () {
    eq(L.generateReportNo(new Date(2026, 2, 15)), 'PR-2026-03');
  });

  test('January padded', function () {
    eq(L.generateReportNo(new Date(2026, 0, 1)), 'PR-2026-01');
  });

  test('no argument uses now', function () {
    var r = L.generateReportNo();
    truthy(/^PR-\d{4}-\d{2}$/.test(r));
  });
});


// ============================================================
group('validateProductionLog', function () {
  test('valid log', function () {
    var r = L.validateProductionLog([{ year: 2026, month: 3, progress: 50 }]);
    eq(r.valid, true);
    eq(r.errors.length, 0);
  });

  test('not an array', function () {
    var r = L.validateProductionLog(null);
    eq(r.valid, false);
  });

  test('bad month', function () {
    var r = L.validateProductionLog([{ year: 2026, month: 13, progress: 50 }]);
    eq(r.valid, false);
  });

  test('bad progress', function () {
    var r = L.validateProductionLog([{ year: 2026, month: 1, progress: 150 }]);
    eq(r.valid, false);
  });

  test('year as string is invalid', function () {
    var r = L.validateProductionLog([{ year: '2026', month: 1, progress: 50 }]);
    eq(r.valid, false);
  });
});


// ============================================================
console.log('\n════════════════════════════════════════');
console.log('  NouRion — saved.logic.js test results');
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
