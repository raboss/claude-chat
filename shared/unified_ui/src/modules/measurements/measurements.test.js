/* ============================================================
   NouRion — measurements.test.js
   ============================================================ */

var L = (typeof require !== 'undefined')
  ? require('./measurements.logic.js')
  : window.NouRion.MeasurementsLogic;

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
group('makeRowCode', function () {
  test('1 → W01', function () { eq(L.makeRowCode(1), 'W01'); });
  test('9 → W09', function () { eq(L.makeRowCode(9), 'W09'); });
  test('10 → W10', function () { eq(L.makeRowCode(10), 'W10'); });
  test('99 → W99', function () { eq(L.makeRowCode(99), 'W99'); });
  test('100 → W100 (no truncation)', function () { eq(L.makeRowCode(100), 'W100'); });
});


// ============================================================
group('createEmptyRow', function () {
  test('has all required fields', function () {
    var r = L.createEmptyRow(1);
    eq(r.code, 'W01');
    eq(r.width, '');
    eq(r.height, '');
    eq(r.sectionName, '');
    eq(r.description, '');
    eq(r.notes, '');
  });
});


// ============================================================
group('addRow / delRow', function () {
  test('addRow on empty', function () {
    var r = L.addRow([]);
    eq(r.length, 1);
    eq(r[0].code, 'W01');
  });

  test('addRow non-mutating', function () {
    var orig = [];
    L.addRow(orig);
    eq(orig.length, 0);
  });

  test('addRow uses next index', function () {
    var r = L.addRow([{ code: 'W01' }, { code: 'W02' }]);
    eq(r.length, 3);
    eq(r[2].code, 'W03');
  });

  test('delRow removes by index', function () {
    var r = L.delRow([{ code: 'a' }, { code: 'b' }, { code: 'c' }], 1);
    eq(r.length, 2);
    eq(r[0].code, 'a');
    eq(r[1].code, 'c');
  });
});


// ============================================================
group('ensureMinRows', function () {
  test('default min = 15', function () {
    var r = L.ensureMinRows([]);
    eq(r.length, 15);
  });

  test('custom min', function () {
    var r = L.ensureMinRows([], 5);
    eq(r.length, 5);
  });

  test('does not shrink if already > min', function () {
    var r = L.ensureMinRows(new Array(20).fill({ code: 'x' }));
    eq(r.length, 20);
  });

  test('appended rows have correct codes', function () {
    var r = L.ensureMinRows([{ code: 'W01' }], 3);
    eq(r[1].code, 'W02');
    eq(r[2].code, 'W03');
  });
});


// ============================================================
group('countFilledRows', function () {
  test('empty list', function () {
    eq(L.countFilledRows([]), 0);
    eq(L.countFilledRows(null), 0);
  });

  test('counts only rows with width or height', function () {
    var rows = [
      { width: 100, height: 200 },
      { width: '', height: '' },
      { width: 50, height: '' },
      { width: '', height: 80 },
      { width: '', height: '', notes: 'just notes' }
    ];
    eq(L.countFilledRows(rows), 3);
  });
});


// ============================================================
group('cleanRowForSave', function () {
  test('strips _localPhoto', function () {
    var r = L.cleanRowForSave({
      code: 'W01', width: 100, height: 200,
      sectionName: 'x', description: 'd', notes: 'n',
      _localPhoto: 'data:image/png;base64,...',
      photo: 'old'
    });
    eq(r._localPhoto, undefined);
    eq(r.photo, undefined);
    eq(r.code, 'W01');
  });

  test('keeps serverPhoto if present', function () {
    var r = L.cleanRowForSave({
      code: 'W01', width: 100, height: 200,
      sectionName: '', description: '', notes: '',
      serverPhoto: '/uploads/img1.jpg'
    });
    eq(r.serverPhoto, '/uploads/img1.jpg');
  });

  test('omits serverPhoto when not present', function () {
    var r = L.cleanRowForSave({ code: 'W01', width: 100, height: 200, sectionName: '', description: '', notes: '' });
    truthy(!('serverPhoto' in r));
  });
});


// ============================================================
group('computeRowArea', function () {
  test('1000mm × 2000mm = 2 m²', function () {
    near(L.computeRowArea({ width: 1000, height: 2000 }), 2);
  });

  test('1500mm × 2200mm = 3.3 m²', function () {
    near(L.computeRowArea({ width: 1500, height: 2200 }), 3.3, 0.01);
  });

  test('missing width → 0', function () {
    eq(L.computeRowArea({ height: 1000 }), 0);
  });

  test('string values', function () {
    near(L.computeRowArea({ width: '1000', height: '2000' }), 2);
  });

  test('zero/empty → 0', function () {
    eq(L.computeRowArea({ width: 0, height: 1000 }), 0);
    eq(L.computeRowArea({ width: '', height: '' }), 0);
  });
});


// ============================================================
group('computeTotalArea + summary', function () {
  var rows = [
    { width: 1000, height: 2000 },               // 2 m²
    { width: 1500, height: 2000 },               // 3 m²
    { width: '', height: '' },                    // 0
    { width: 800, height: 1500, serverPhoto: 'a.jpg' }, // 1.2 m²
    { width: 600, height: 1000, _localPhoto: 'data:...' } // 0.6 m²
  ];

  test('total area = 6.8 m²', function () {
    near(L.computeTotalArea(rows), 6.8, 0.01);
  });

  test('summary fields', function () {
    var s = L.computeMeasurementSummary(rows);
    eq(s.count, 5);
    eq(s.filled, 4);
    near(s.totalArea, 6.8, 0.01);
    eq(s.withPhotos, 2);
  });

  test('null safety', function () {
    var s = L.computeMeasurementSummary(null);
    eq(s.count, 0);
    eq(s.totalArea, 0);
  });
});


// ============================================================
group('detectExcelColumns', function () {
  test('Arabic headers', function () {
    var c = L.detectExcelColumns(['الرمز', 'العرض', 'الارتفاع', 'القطاع', 'الوصف', 'ملاحظات']);
    eq(c.codeIdx, 0);
    eq(c.wIdx, 1);
    eq(c.hIdx, 2);
    eq(c.secIdx, 3);
    eq(c.descIdx, 4);
    eq(c.noteIdx, 5);
    eq(c.dataStart, 1);
  });

  test('English headers', function () {
    var c = L.detectExcelColumns(['code', 'width', 'height', 'section', 'desc', 'notes']);
    truthy(c.codeIdx >= 0);
    truthy(c.wIdx >= 0);
    truthy(c.hIdx >= 0);
    eq(c.dataStart, 1);
  });

  test('no header → dataStart = 0', function () {
    var c = L.detectExcelColumns(['1000', '2000', 'Type A']);
    eq(c.dataStart, 0);
  });

  test('empty header row', function () {
    var c = L.detectExcelColumns([]);
    eq(c.dataStart, 0);
    eq(c.wC, 0);
    eq(c.hC, 1);
  });
});


// ============================================================
group('parseExcelData', function () {
  var sections = [{ name: 'سحاب قلف 12 سم' }, { name: 'سرايا 10 سم' }];

  test('with headers', function () {
    var aoa = [
      ['الرمز', 'العرض', 'الارتفاع', 'القطاع', 'الوصف', 'ملاحظات'],
      ['A1', 1000, 2000, 'سحاب قلف 12 سم', 'نافذة', 'مهم'],
      ['A2', 1500, 2200, 'سرايا 10 سم', 'باب', '']
    ];
    var rows = L.parseExcelData(aoa, { sections: sections });
    eq(rows.length, 2);
    eq(rows[0].code, 'A1');
    eq(rows[0].width, 1000);
    eq(rows[0].height, 2000);
    eq(rows[0].sectionName, 'سحاب قلف 12 سم');
    eq(rows[0].description, 'نافذة');
  });

  test('skips empty rows', function () {
    var aoa = [
      ['width', 'height'],
      [1000, 2000],
      ['', ''],
      [1500, 2200]
    ];
    var rows = L.parseExcelData(aoa);
    eq(rows.length, 2);
  });

  test('section without match → empty', function () {
    var aoa = [
      ['width', 'height', 'section'],
      [1000, 2000, 'غير موجود']
    ];
    var rows = L.parseExcelData(aoa, { sections: sections });
    eq(rows[0].sectionName, '');
  });

  test('auto-generated codes when missing', function () {
    var aoa = [
      ['width', 'height'],
      [1000, 2000],
      [1500, 2200]
    ];
    var rows = L.parseExcelData(aoa);
    eq(rows[0].code, 'W01');
    eq(rows[1].code, 'W02');
  });

  test('empty input', function () {
    eq(L.parseExcelData([]).length, 0);
    eq(L.parseExcelData(null).length, 0);
  });
});


// ============================================================
group('isoWeekNumber', function () {
  test('2026-01-01 is week 1', function () {
    // Thursday — first ISO week of 2026
    var w = L.isoWeekNumber(new Date(2026, 0, 1));
    eq(w, 1);
  });

  test('mid-year week', function () {
    var w = L.isoWeekNumber(new Date(2026, 5, 15));
    truthy(w >= 24 && w <= 26);
  });

  test('December rollover', function () {
    var w = L.isoWeekNumber(new Date(2025, 11, 31));
    truthy(w >= 1 && w <= 53);
  });
});


// ============================================================
group('weekRange', function () {
  test('parse YYYY-Www', function () {
    var r = L.weekRange('2026-W10');
    truthy(r);
    truthy(r.start instanceof Date);
    truthy(r.end instanceof Date);
    eq((r.end - r.start) / 86400000, 6); // 6-day span (Mon → Sun)
  });

  test('Monday is start', function () {
    var r = L.weekRange('2026-W01');
    eq(r.start.getDay(), 1);
  });

  test('Sunday is end', function () {
    var r = L.weekRange('2026-W01');
    eq(r.end.getDay(), 0);
  });

  test('null/empty', function () {
    isNull(L.weekRange(''));
    isNull(L.weekRange(null));
    isNull(L.weekRange('not-a-week'));
  });
});


// ============================================================
group('projInRange', function () {
  var start = new Date(2026, 0, 1);
  var end   = new Date(2026, 0, 31);

  test('project with stageDate in range', function () {
    truthy(L.projInRange({ stageDate: '2026-01-15' }, start, end));
  });

  test('project with stageDate before range', function () {
    eq(L.projInRange({ stageDate: '2025-12-15' }, start, end), false);
  });

  test('falls back to contractDate', function () {
    truthy(L.projInRange({ contractDate: '2026-01-10' }, start, end));
  });

  test('no date → include by default', function () {
    truthy(L.projInRange({ name: 'no date' }, start, end));
  });
});


// ============================================================
group('projInMonthRange', function () {
  test('YYYY-MM range hit', function () {
    truthy(L.projInMonthRange({ contractDate: '2026-02-15' }, '2026-01', '2026-03'));
  });

  test('out of range', function () {
    eq(L.projInMonthRange({ contractDate: '2025-12-15' }, '2026-01', '2026-03'), false);
  });

  test('no date → include', function () {
    truthy(L.projInMonthRange({}, '2026-01', '2026-03'));
  });
});


// ============================================================
group('groupProjectsByRegion', function () {
  test('groups by region', function () {
    var groups = L.groupProjectsByRegion([
      { name: 'a', region: 'الوسطى' },
      { name: 'b', region: 'الوسطى' },
      { name: 'c', region: 'الشرقية' }
    ]);
    eq(groups['الوسطى'].length, 2);
    eq(groups['الشرقية'].length, 1);
  });

  test('uses "غير محدد" for empty region', function () {
    var groups = L.groupProjectsByRegion([{ name: 'x' }]);
    eq(groups['غير محدد'].length, 1);
  });

  test('handles legacy المناطق key (via SavedLogic)', function () {
    var groups = L.groupProjectsByRegion([{ name: 'old', 'المناطق': 'الوسطى' }]);
    eq(groups['الوسطى'].length, 1);
  });
});


// ============================================================
group('computeRegionTotals', function () {
  var projects = [
    { name: 'A', region: 'R1', extractValue: '100000', downPayment: '20000', progress: '50' },
    { name: 'B', region: 'R1', contractValue: '50000', downPayment: '10000', progress: '100' },
    { name: 'C', region: 'R2', extractValue: '200000', downPayment: '50000', progress: '25' }
  ];

  test('total contracts per region', function () {
    var r = L.computeRegionTotals(projects);
    var r1 = r.find(function (x) { return x.region === 'R1'; });
    var r2 = r.find(function (x) { return x.region === 'R2'; });
    eq(r1.totalContract, 150000); // 100k + 50k
    eq(r2.totalContract, 200000);
  });

  test('production calculated correctly', function () {
    var r = L.computeRegionTotals(projects);
    var r1 = r.find(function (x) { return x.region === 'R1'; });
    eq(r1.totalProduction, 50000 + 50000); // 100k*50% + 50k*100%
  });

  test('remaining calculated correctly', function () {
    var r = L.computeRegionTotals(projects);
    var r1 = r.find(function (x) { return x.region === 'R1'; });
    eq(r1.totalRemaining, (100000 - 20000) + (50000 - 10000)); // base - downPayment
  });

  test('count per region', function () {
    var r = L.computeRegionTotals(projects);
    var r1 = r.find(function (x) { return x.region === 'R1'; });
    eq(r1.count, 2);
  });
});


// ============================================================
group('computeOverallTotals', function () {
  test('aggregates all projects', function () {
    var projects = [
      { extractValue: '100000', downPayment: '20000', progress: '50' },
      { contractValue: '50000', downPayment: '10000', progress: '100' }
    ];
    var t = L.computeOverallTotals(projects);
    eq(t.c, 150000);
    eq(t.p, 50000 + 50000);
    eq(t.d, 30000);
  });

  test('null safety', function () {
    var t = L.computeOverallTotals(null);
    eq(t.c, 0);
    eq(t.p, 0);
    eq(t.d, 0);
  });
});


// ============================================================
group('generateWeeklyReportNo', function () {
  test('format', function () {
    var n = L.generateWeeklyReportNo(new Date(2026, 0, 1));
    truthy(/^WK-\d{4}-W\d{2}$/.test(n));
  });

  test('default uses now', function () {
    var n = L.generateWeeklyReportNo();
    truthy(/^WK-\d{4}-W\d{2}$/.test(n));
  });
});


// ============================================================
console.log('\n════════════════════════════════════════');
console.log('  NouRion — measurements.logic.js test results');
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
