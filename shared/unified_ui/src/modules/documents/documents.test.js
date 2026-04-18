/* ============================================================
   NouRion — documents.test.js
   ============================================================ */

var L = (typeof require !== 'undefined')
  ? require('./documents.logic.js')
  : window.NouRion.DocumentsLogic;

var passed = 0, failed = 0, failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log('  ✔ ' + name); }
  catch (e) { failed++; failures.push({ name: name, error: e.message }); console.log('  ✘ ' + name + '\n     → ' + e.message); }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' expected=' + JSON.stringify(b) + ' actual=' + JSON.stringify(a)); }
function near(a, b, tol, msg) { if (Math.abs(a - b) > (tol || 0.001)) throw new Error((msg || '') + ' expected≈' + b + ' actual=' + a); }
function truthy(v, msg) { if (!v) throw new Error(msg || 'expected truthy, got ' + JSON.stringify(v)); }
function group(n, fn) { console.log('\n── ' + n + ' ──'); fn(); }


// ============================================================
group('VAT_RATE constant', function () {
  test('is 0.15 (15%)', function () {
    eq(L.VAT_RATE, 0.15);
  });
});


// ============================================================
group('computeExtractFinancials', function () {
  test('null project → zeros', function () {
    var f = L.computeExtractFinancials(null);
    eq(f.base, 0);
    eq(f.total, 0);
    eq(f.net, 0);
  });

  test('with extractValue (115k → base 100k + vat 15k)', function () {
    var f = L.computeExtractFinancials({ extractValue: '115000', downPayment: '50000' });
    eq(f.base, 100000);
    eq(f.vat, 15000);
    eq(f.total, 115000);
    eq(f.net, 65000);
    eq(f.isFromExtract, true);
  });

  test('without extractValue → adds VAT to contract', function () {
    var f = L.computeExtractFinancials({ contractValue: '100000', downPayment: '20000' });
    eq(f.base, 100000);
    eq(f.vat, 15000);   // 100k × 15%
    eq(f.total, 115000); // 100k + 15k
    eq(f.net, 95000);    // 115k - 20k
    eq(f.isFromExtract, false);
  });

  test('zero values', function () {
    var f = L.computeExtractFinancials({});
    eq(f.base, 0);
    eq(f.vat, 0);
  });

  test('precise rounding (115000 / 1.15 = 100000)', function () {
    var f = L.computeExtractFinancials({ extractValue: '115000' });
    eq(f.base, 100000);
    eq(f.vat, 15000);
  });

  test('non-round VAT (e.g. 230000 inclusive)', function () {
    var f = L.computeExtractFinancials({ extractValue: '230000', downPayment: '0' });
    eq(f.base, 200000);
    eq(f.vat, 30000);
    eq(f.total, 230000);
  });
});


// ============================================================
group('computeFinancialDistribution', function () {
  test('null → zeros', function () {
    var d = L.computeFinancialDistribution(null);
    eq(d.paid, 0);
    eq(d.prod, 0);
    eq(d.rem, 0);
  });

  test('100k contract, 30k down, 50% progress', function () {
    var d = L.computeFinancialDistribution({
      contractValue: '100000',
      downPayment: '30000',
      progress: '50'
    });
    eq(d.paid, 30000);    // = down
    eq(d.prod, 20000);    // = max(0, 50000 - 30000)
    eq(d.rem, 50000);     // = max(0, 100000 - 50000)
    eq(d.total, 100000);
  });

  test('extract overrides contract', function () {
    var d = L.computeFinancialDistribution({
      contractValue: '100000',
      extractValue: '120000',
      downPayment: '0',
      progress: '50'
    });
    // base = 120k, prodVal = 60k
    eq(d.prod, 60000);   // 60k - 0
    eq(d.rem, 60000);    // 120k - 60k
  });

  test('100% progress, no down', function () {
    var d = L.computeFinancialDistribution({
      contractValue: '100000',
      downPayment: '0',
      progress: '100'
    });
    eq(d.prod, 100000);
    eq(d.rem, 0);
  });

  test('percentages add to ~100', function () {
    var d = L.computeFinancialDistribution({
      contractValue: '100000',
      downPayment: '20000',
      progress: '40'
    });
    var sum = parseFloat(d.paidPct) + parseFloat(d.prodPct) + parseFloat(d.remPct);
    near(sum, 100, 0.5);
  });
});


// ============================================================
group('getCompanyLogoKey', function () {
  test('known companies', function () {
    eq(L.getCompanyLogoKey('السلطان'), 'sultan');
    eq(L.getCompanyLogoKey('عالم المعادن'), 'metal');
    eq(L.getCompanyLogoKey('الراجحي'), 'rajhi');
    eq(L.getCompanyLogoKey('الفوزان'), 'fozan');
  });

  test('unknown company → none', function () {
    eq(L.getCompanyLogoKey('شركة مجهولة'), 'none');
  });

  test('null/empty → none', function () {
    eq(L.getCompanyLogoKey(null), 'none');
    eq(L.getCompanyLogoKey(''), 'none');
  });
});


// ============================================================
group('getWatermarkColor', function () {
  test('named colors', function () {
    eq(L.getWatermarkColor('dark'), '#1a1a2e');
    eq(L.getWatermarkColor('red'), '#8b0000');
    eq(L.getWatermarkColor('blue'), '#1a3a6a');
  });

  test('auto fallback', function () {
    eq(L.getWatermarkColor('auto'), '#b0b8c8');
    eq(L.getWatermarkColor('unknown'), '#b0b8c8');
  });

  test('custom uses provided color', function () {
    eq(L.getWatermarkColor('custom', '#ff0000'), '#ff0000');
  });

  test('custom without color → default', function () {
    eq(L.getWatermarkColor('custom'), '#1e3a5f');
  });
});


// ============================================================
group('resolveWatermarkVisibility', function () {
  test('hideWatermark wins over everything', function () {
    eq(L.resolveWatermarkVisibility({ hideWatermark: true, useWatermark: true, forceWatermark: true }), false);
  });

  test('forceWatermark even if useWatermark is false', function () {
    eq(L.resolveWatermarkVisibility({ forceWatermark: true }), true);
  });

  test('useWatermark normal', function () {
    eq(L.resolveWatermarkVisibility({ useWatermark: true }), true);
    eq(L.resolveWatermarkVisibility({ useWatermark: false }), false);
  });

  test('empty opts → false', function () {
    eq(L.resolveWatermarkVisibility(), false);
    eq(L.resolveWatermarkVisibility({}), false);
  });
});


// ============================================================
group('computeMeasItemArea', function () {
  test('1000mm × 2000mm = 2.0 m²', function () {
    near(L.computeMeasItemArea(1000, 2000), 2.0);
  });

  test('zero-zero subtracts 8mm from both', function () {
    var area = L.computeMeasItemArea(1000, 2000, { zeroZero: true });
    near(area, ((1000 - 8) / 1000) * ((2000 - 8) / 1000), 0.000001);
  });

  test('addW/addH adds before division', function () {
    var area = L.computeMeasItemArea(1000, 2000, { addW: 50, addH: 100 });
    near(area, ((1050) / 1000) * ((2100) / 1000), 0.000001);
  });

  test('min threshold applies when raw < min', function () {
    var area = L.computeMeasItemArea(500, 500, { minThreshold: 1.0, minValue: 1.5 });
    eq(area, 1.5);
  });

  test('min threshold not applied when raw >= min', function () {
    var area = L.computeMeasItemArea(2000, 2000, { minThreshold: 1.0, minValue: 1.5 });
    eq(area, 4.0); // not 1.5
  });

  test('zero width or height → 0', function () {
    eq(L.computeMeasItemArea(0, 2000), 0);
    eq(L.computeMeasItemArea(2000, 0), 0);
  });
});


// ============================================================
group('groupMeasurementsByPriceList', function () {
  var measRows = [
    { width: 1000, height: 2000, sectionName: 'سحاب قلف 12 سم' },
    { width: 1500, height: 2200, sectionName: 'سحاب قلف 12 سم' },
    { width: 800,  height: 2000, sectionName: 'سرايا 10 سم' },
    { width: 0,    height: 2000, sectionName: 'سحاب قلف 12 سم' } // skipped (no width)
  ];
  var plRows = [
    { sectionName: 'سحاب قلف 12 سم', pricePerM2: '450', addWidth: 0, addHeight: 0 },
    { sectionName: 'سرايا 10 سم',    pricePerM2: '380' }
  ];

  test('skips inactive rows', function () {
    var r = L.groupMeasurementsByPriceList(measRows, plRows);
    eq(r.activeCount, 3);
  });

  test('groups by sectionName', function () {
    var r = L.groupMeasurementsByPriceList(measRows, plRows);
    eq(r.items.length, 2);
  });

  test('totalArea per section', function () {
    var r = L.groupMeasurementsByPriceList(measRows, plRows);
    var golf = r.items.find(function (x) { return x.sectionName === 'سحاب قلف 12 سم'; });
    near(golf.totalArea, 2.0 + 3.3, 0.01); // 1×2 + 1.5×2.2
    eq(golf.count, 2);
    eq(golf.price, 450);
  });

  test('grandTotal sum', function () {
    var r = L.groupMeasurementsByPriceList(measRows, plRows);
    // golf: (2 + 3.3) × 450 = 2385
    // saraya: 1.6 × 380 = 608
    near(r.grandTotal, 2385 + 608, 5);
  });

  test('empty meas → empty result', function () {
    var r = L.groupMeasurementsByPriceList([], []);
    eq(r.items.length, 0);
    eq(r.grandTotal, 0);
  });

  test('null safe', function () {
    var r = L.groupMeasurementsByPriceList(null, null);
    eq(r.items.length, 0);
  });

  test('zero-zero option subtracts 8mm', function () {
    var r1 = L.groupMeasurementsByPriceList([{ width: 1000, height: 2000, sectionName: 'X' }], []);
    var r2 = L.groupMeasurementsByPriceList([{ width: 1000, height: 2000, sectionName: 'X' }], [], { zeroZero: true });
    truthy(r2.items[0].totalArea < r1.items[0].totalArea);
  });

  test('section without price → price 0, no contribution to grandTotal', function () {
    var r = L.groupMeasurementsByPriceList(
      [{ width: 1000, height: 2000, sectionName: 'بدون سعر' }],
      []
    );
    eq(r.items[0].price, 0);
    eq(r.grandTotal, 0);
  });
});


// ============================================================
group('filterProjectsByPeriod', function () {
  // Use fixed "now" so tests are deterministic
  var fixedNow = new Date(2026, 3, 15); // April 15, 2026

  var projects = [
    { name: 'A', contractDate: '2026-04-10' }, // within last week
    { name: 'B', contractDate: '2026-04-01' }, // within last month
    { name: 'C', contractDate: '2026-02-15' }, // older
    { name: 'D', contractDate: '2026-04-12' }, // within last week
    { name: 'E' }                              // no date
  ];

  test('all → all', function () {
    var r = L.filterProjectsByPeriod(projects, 'all');
    eq(r.length, 5);
  });

  test('week → only last 7 days', function () {
    var r = L.filterProjectsByPeriod(projects, 'week', { now: fixedNow });
    eq(r.length, 2); // A + D
    truthy(r.some(function (p) { return p.name === 'A'; }));
    truthy(r.some(function (p) { return p.name === 'D'; }));
  });

  test('month → last month from now', function () {
    var r = L.filterProjectsByPeriod(projects, 'month', { now: fixedNow });
    truthy(r.length >= 2);
    truthy(r.some(function (p) { return p.name === 'A'; }));
    truthy(r.some(function (p) { return p.name === 'B'; }));
  });

  test('month with explicit selMonth filter', function () {
    var r = L.filterProjectsByPeriod(projects, 'month', { now: fixedNow, month: 4 });
    // April only
    truthy(r.every(function (p) { return p.contractDate && p.contractDate.indexOf('2026-04') === 0; }));
  });

  test('skips projects without contractDate when filtering', function () {
    var r = L.filterProjectsByPeriod(projects, 'week', { now: fixedNow });
    truthy(r.every(function (p) { return p.name !== 'E'; }));
  });

  test('null projects → []', function () {
    eq(L.filterProjectsByPeriod(null, 'all').length, 0);
  });
});


// ============================================================
group('DOC_TYPES catalog', function () {
  test('contains 8 doc types', function () {
    eq(L.DOC_TYPES.length, 8);
  });

  test('every entry has key + label', function () {
    L.DOC_TYPES.forEach(function (t) {
      truthy(t.key);
      truthy(t.label);
    });
  });

  test('contains مستخلص', function () {
    truthy(L.DOC_TYPES.find(function (t) { return t.key === 'مستخلص'; }));
  });
});


// ============================================================
console.log('\n════════════════════════════════════════');
console.log('  NouRion — documents.logic.js test results');
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
