/* ============================================================
   NouRion — reports.test.js
   ============================================================ */

var L = (typeof require !== 'undefined')
  ? require('./reports.logic.js')
  : window.NouRion.ReportsLogic;

var passed = 0, failed = 0, failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log('  ✔ ' + name); }
  catch (e) { failed++; failures.push({ name: name, error: e.message }); console.log('  ✘ ' + name + '\n     → ' + e.message); }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' expected=' + JSON.stringify(b) + ' actual=' + JSON.stringify(a)); }
function truthy(v, msg) { if (!v) throw new Error(msg || 'expected truthy, got ' + JSON.stringify(v)); }
function group(n, fn) { console.log('\n── ' + n + ' ──'); fn(); }

var SAMPLE = [
  { name: 'A', company: 'الراجحي',  region: 'الوسطى',  gallery: 'الياسمين',  stage: 'رفع مقاسات',     contractValue: '100000', extractValue: '120000', downPayment: '20000', progress: '40' },
  { name: 'B', company: 'الراجحي',  region: 'الشرقية', gallery: 'الياسمين',  stage: 'أمر تركيب',       contractValue: '200000', downPayment: '50000', progress: '80' },
  { name: 'C', company: 'السلطان',  region: 'الوسطى',  gallery: 'النخيل',    stage: 'تسليم الموقع',    contractValue: '150000', downPayment: '50000', progress: '100' },
  { name: 'D', company: 'السلطان',  region: 'الغربية', gallery: 'النخيل',    stage: 'سداد الدفعة الثانية', contractValue: '80000', downPayment: '15000', progress: '30' },
  { name: 'E', company: 'الفوزان',  region: 'الوسطى',  gallery: 'البلاد',    stage: 'طلب الزجاج',      contractValue: '60000', downPayment: '10000', progress: '50' },
  { name: 'F', company: 'الفوزان',  region: 'الوسطى',  gallery: 'البلاد',    stage: 'طلب الخامات',    contractValue: '90000', downPayment: '20000', progress: '20',
    materialsValue: '40000', materialsPurchased: '15000', alumValue: '20000', glassValue: '12000', opsValue: '5000' }
];


// ============================================================
group('STATUS_COLORS / MATERIAL_STAGES constants', function () {
  test('all 9 statuses have colors', function () {
    ['جاري','تركيب','موقوف - انتظار سداد العميل','تأخير من العميل','تأخير من الشركة','تم التسليم','ملغى','توقيع العقد','موقوف'].forEach(function (s) {
      truthy(L.STATUS_COLORS[s], 'missing color for ' + s);
    });
  });

  test('material stages array', function () {
    eq(L.MATERIAL_STAGES.length, 3);
    truthy(L.MATERIAL_STAGES.indexOf('طلب الخامات') !== -1);
    truthy(L.MATERIAL_STAGES.indexOf('طلب الزجاج') !== -1);
  });
});


// ============================================================
group('filterByUser', function () {
  test('admin sees everything', function () {
    var r = L.filterByUser(SAMPLE, { isAdmin: true });
    eq(r.length, SAMPLE.length);
  });

  test('null user sees everything', function () {
    var r = L.filterByUser(SAMPLE, null);
    eq(r.length, SAMPLE.length);
  });

  test('filter by company', function () {
    var r = L.filterByUser(SAMPLE, { filterCompany: 'الراجحي' });
    eq(r.length, 2);
    truthy(r.every(function (p) { return p.company === 'الراجحي'; }));
  });

  test('filter by region', function () {
    var r = L.filterByUser(SAMPLE, { filterRegion: 'الوسطى' });
    truthy(r.every(function (p) { return p.region === 'الوسطى'; }));
  });

  test('filter by gallery', function () {
    var r = L.filterByUser(SAMPLE, { filterGallery: 'البلاد' });
    eq(r.length, 2);
  });

  test('combined filters AND together', function () {
    var r = L.filterByUser(SAMPLE, { filterCompany: 'الراجحي', filterRegion: 'الوسطى' });
    eq(r.length, 1);
    eq(r[0].name, 'A');
  });

  test('null projects → []', function () {
    var r = L.filterByUser(null, { isAdmin: true });
    eq(r.length, 0);
  });
});


// ============================================================
group('computeStatusCounts', function () {
  test('counts all 5 categories', function () {
    var c = L.computeStatusCounts(SAMPLE);
    eq(c.total, 6);
    eq(c.jaari, 1);   // A
    eq(c.tarkib, 1);  // B (أمر تركيب)
    eq(c.done, 1);    // C (تسليم الموقع)
    // D = موقوف (سداد), E = تأخير الشركة (الزجاج), F = تأخير الشركة (الخامات)
    truthy(c.mawqof >= 3);
  });

  test('empty list', function () {
    var c = L.computeStatusCounts([]);
    eq(c.total, 0);
    eq(c.jaari, 0);
  });

  test('null safety', function () {
    var c = L.computeStatusCounts(null);
    eq(c.total, 0);
  });
});


// ============================================================
group('computeStatusDistribution', function () {
  test('returns nonZero entries with colors', function () {
    var d = L.computeStatusDistribution(SAMPLE);
    truthy(d.nonZero.length > 0);
    d.nonZero.forEach(function (e) {
      truthy(e.status);
      truthy(e.count > 0);
      truthy(e.color);
    });
  });

  test('sum of counts == total', function () {
    var d = L.computeStatusDistribution(SAMPLE);
    var sum = d.nonZero.reduce(function (s, e) { return s + e.count; }, 0);
    eq(sum, d.total);
  });

  test('empty list', function () {
    var d = L.computeStatusDistribution([]);
    eq(d.nonZero.length, 0);
    eq(d.total, 0);
  });
});


// ============================================================
group('computeBreakdownByCompany', function () {
  test('returns one entry per company', function () {
    var b = L.computeBreakdownByCompany(SAMPLE);
    eq(b.length, 3); // الراجحي + السلطان + الفوزان
  });

  test('per-company count is correct', function () {
    var b = L.computeBreakdownByCompany(SAMPLE);
    var rajhi = b.find(function (x) { return x.company === 'الراجحي'; });
    eq(rajhi.count, 2);
  });

  test('regions sub-breakdown', function () {
    var b = L.computeBreakdownByCompany(SAMPLE);
    var rajhi = b.find(function (x) { return x.company === 'الراجحي'; });
    truthy(rajhi.regions.length > 0);
    var totalInRegions = rajhi.regions.reduce(function (s, r) { return s + r.count; }, 0);
    eq(totalInRegions, rajhi.count);
  });

  test('totalByStatus contains all statuses', function () {
    var b = L.computeBreakdownByCompany(SAMPLE);
    var rajhi = b.find(function (x) { return x.company === 'الراجحي'; });
    truthy(rajhi.totalByStatus['جاري'] != null);
    truthy(rajhi.totalByStatus['تركيب'] != null);
  });

  test('empty list', function () {
    eq(L.computeBreakdownByCompany([]).length, 0);
    eq(L.computeBreakdownByCompany(null).length, 0);
  });
});


// ============================================================
group('computeMaterialsTotals', function () {
  test('aggregates extract, down, net', function () {
    var t = L.computeMaterialsTotals(SAMPLE);
    eq(t.ext, 120000); // only A has extractValue
    eq(t.down, 20000 + 50000 + 50000 + 15000 + 10000 + 20000);
  });

  test('aggregates materials values', function () {
    var t = L.computeMaterialsTotals(SAMPLE);
    eq(t.mats, 40000);
    eq(t.purchased, 15000);
    eq(t.matRem, 25000);
  });

  test('aggregates ops/alum/glass + grandOps', function () {
    var t = L.computeMaterialsTotals(SAMPLE);
    eq(t.ops, 5000);
    eq(t.alum, 20000);
    eq(t.glass, 12000);
    eq(t.grandOps, 5000 + 20000 + 12000);
  });

  test('empty', function () {
    var t = L.computeMaterialsTotals([]);
    eq(t.ext, 0);
    eq(t.grandOps, 0);
  });
});


// ============================================================
group('filterMaterialStages', function () {
  test('returns only material stage projects', function () {
    var r = L.filterMaterialStages(SAMPLE);
    // E (طلب الزجاج) + F (طلب الخامات)
    eq(r.length, 2);
  });

  test('empty', function () {
    eq(L.filterMaterialStages([]).length, 0);
    eq(L.filterMaterialStages(null).length, 0);
  });
});


// ============================================================
group('isMaterialStage', function () {
  test('hits substring match', function () {
    truthy(L.isMaterialStage('طلب الخامات'));
    truthy(L.isMaterialStage('طلب الزجاج'));
    truthy(L.isMaterialStage('طلب المواد الإضافية')); // partial
  });

  test('non-material stages', function () {
    eq(L.isMaterialStage('رفع مقاسات'), false);
    eq(L.isMaterialStage('أمر تركيب'), false);
    eq(L.isMaterialStage(''), false);
    eq(L.isMaterialStage(null), false);
  });
});


// ============================================================
group('generateMaterialsReportNo', function () {
  test('format MAT-YYYY-XXXXX', function () {
    var n = L.generateMaterialsReportNo(new Date(2026, 3, 15));
    truthy(/^MAT-2026-\d{5}$/.test(n));
  });

  test('default uses now', function () {
    var n = L.generateMaterialsReportNo();
    truthy(/^MAT-\d{4}-\d{5}$/.test(n));
  });
});


// ============================================================
group('computeProjectByCompanyMatrix', function () {
  test('returns companies + datasets', function () {
    var m = L.computeProjectByCompanyMatrix(SAMPLE);
    truthy(m.companies.length > 0);
    truthy(m.datasets.length > 0);
  });

  test('every dataset has data per company', function () {
    var m = L.computeProjectByCompanyMatrix(SAMPLE);
    m.datasets.forEach(function (ds) {
      eq(ds.data.length, m.companies.length);
    });
  });

  test('every dataset has color', function () {
    var m = L.computeProjectByCompanyMatrix(SAMPLE);
    m.datasets.forEach(function (ds) {
      truthy(ds.color);
    });
  });

  test('null safety', function () {
    var m = L.computeProjectByCompanyMatrix(null);
    eq(m.companies.length, 0);
    eq(m.datasets.length, 0);
  });
});


// ============================================================
group('computeFinancialSnapshot', function () {
  test('aggregates all financials', function () {
    var s = L.computeFinancialSnapshot(SAMPLE);
    eq(s.contract, 100000 + 200000 + 150000 + 80000 + 60000 + 90000);
    eq(s.extract, 120000); // only A
  });

  test('production uses base = ext > 0 ? ext : contract', function () {
    // A: base 120000 × 40% = 48000
    // B: base 200000 × 80% = 160000
    // C: base 150000 × 100% = 150000
    // D: base 80000 × 30% = 24000
    // E: base 60000 × 50% = 30000
    // F: base 90000 × 20% = 18000
    var s = L.computeFinancialSnapshot(SAMPLE);
    eq(s.production, 48000 + 160000 + 150000 + 24000 + 30000 + 18000);
  });

  test('null safety', function () {
    var s = L.computeFinancialSnapshot(null);
    eq(s.contract, 0);
  });
});


// ============================================================
console.log('\n════════════════════════════════════════');
console.log('  NouRion — reports.logic.js test results');
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
