/* ============================================================
   NouRion — forms.test.js
   ============================================================ */

var L = (typeof require !== 'undefined')
  ? require('./forms.logic.js')
  : window.NouRion.FormsLogic;

var passed = 0, failed = 0, failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log('  ✔ ' + name); }
  catch (e) { failed++; failures.push({ name: name, error: e.message }); console.log('  ✘ ' + name + '\n     → ' + e.message); }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' expected=' + JSON.stringify(b) + ' actual=' + JSON.stringify(a)); }
function near(a, b, tol, msg) { if (Math.abs(a - b) > (tol || 0.001)) throw new Error((msg || '') + ' expected≈' + b + ' actual=' + a); }
function truthy(v, msg) { if (!v) throw new Error(msg || 'expected truthy'); }
function group(n, fn) { console.log('\n── ' + n + ' ──'); fn(); }


// ============================================================
group('constants', function () {
  test('VAT_RATE = 0.15', function () { eq(L.VAT_RATE, 0.15); });
  test('install workers = 5', function () { eq(L.DEFAULT_INSTALL_WORKERS, 5); });
  test('max install days = 8', function () { eq(L.DEFAULT_MAX_INSTALL_DAYS, 8); });
  test('monthly salary = 2500', function () { eq(L.DEFAULT_MONTHLY_SALARY, 2500); });
  test('work days = 26', function () { eq(L.DEFAULT_WORK_DAYS_PER_MONTH, 26); });
  test('default rates', function () {
    eq(L.DEFAULT_RATES.admin, 10);
    eq(L.DEFAULT_RATES.sales, 10);
    eq(L.DEFAULT_RATES.company, 20);
    eq(L.DEFAULT_RATES.wagesPct, 10);
    eq(L.DEFAULT_RATES.fixedPct, 5);
  });
});


// ============================================================
group('sumRows', function () {
  test('simple sum', function () {
    eq(L.sumRows([
      { quantity: 2, unitPrice: 100 },
      { quantity: 3, unitPrice: 50 }
    ]), 350);
  });

  test('skips isGroup rows', function () {
    eq(L.sumRows([
      { quantity: 2, unitPrice: 100 },
      { isGroup: true, quantity: 999, unitPrice: 999 },
      { quantity: 3, unitPrice: 50 }
    ]), 350);
  });

  test('handles missing fields', function () {
    eq(L.sumRows([{ quantity: 5 }, { unitPrice: 10 }, {}]), 0);
  });

  test('null / empty', function () {
    eq(L.sumRows(null), 0);
    eq(L.sumRows([]), 0);
  });

  test('string numbers', function () {
    eq(L.sumRows([{ quantity: '2', unitPrice: '50' }]), 100);
  });
});


// ============================================================
group('computeExtractValues', function () {
  test('stored extract (شامل VAT)', function () {
    var r = L.computeExtractValues({ extractValue: '115000' }, []);
    eq(r.before, 100000);
    eq(r.after, 115000);
    eq(r.source, 'stored');
  });

  test('stored extract with rounding', function () {
    var r = L.computeExtractValues({ extractValue: '230000' }, []);
    eq(r.before, 200000);
    eq(r.after, 230000);
  });

  test('from plRows total', function () {
    var r = L.computeExtractValues(
      { contractValue: '50000' },
      [{ sectionName: 'X', totalBefore: '80000' }]
    );
    eq(r.before, 80000);
    near(r.after, 92000, 1); // 80k × 1.15
    eq(r.source, 'priceList');
  });

  test('from plRows area × price', function () {
    var r = L.computeExtractValues(
      {},
      [{ sectionName: 'X', area: 10, pricePerM2: 500 }]
    );
    eq(r.before, 5000);
  });

  test('from plRows count × price when no area', function () {
    var r = L.computeExtractValues(
      {},
      [{ sectionName: 'X', count: 3, pricePerM2: 200 }]
    );
    eq(r.before, 600);
  });

  test('fallback: contract × 0.9 and × 1.15', function () {
    var r = L.computeExtractValues({ contractValue: '100000' }, []);
    eq(r.before, 90000);
    near(r.after, 115000, 1);
    eq(r.source, 'fallback');
  });

  test('empty project → 0', function () {
    var r = L.computeExtractValues(null, null);
    eq(r.before, 0);
    eq(r.after, 0);
  });

  test('stored wins over priceList', function () {
    var r = L.computeExtractValues(
      { extractValue: '115000', contractValue: '50000' },
      [{ totalBefore: '999999' }]
    );
    eq(r.source, 'stored');
    eq(r.before, 100000);
  });
});


// ============================================================
group('computeProdWorkers', function () {
  test('< 50k → 3', function () {
    eq(L.computeProdWorkers(30000), 3);
    eq(L.computeProdWorkers(49999), 3);
  });

  test('50k-150k → 5', function () {
    eq(L.computeProdWorkers(50000), 5);
    eq(L.computeProdWorkers(100000), 5);
    eq(L.computeProdWorkers(149999), 5);
  });

  test('150k-300k → 8', function () {
    eq(L.computeProdWorkers(150000), 8);
    eq(L.computeProdWorkers(299999), 8);
  });

  test('>= 300k → 12', function () {
    eq(L.computeProdWorkers(300000), 12);
    eq(L.computeProdWorkers(1000000), 12);
  });

  test('zero / null', function () {
    eq(L.computeProdWorkers(0), 3);
    eq(L.computeProdWorkers(null), 3);
  });

  test('string number', function () {
    eq(L.computeProdWorkers('75000'), 5);
  });
});


// ============================================================
group('computeInstallAllocations — CRITICAL', function () {
  test('daily rate = 2500/26', function () {
    var a = L.computeInstallAllocations({ contractValue: 100000 }, 50000, {});
    near(a.dailyRate, Math.round(2500 / 26 * 100) / 100);
  });

  test('install days capped at 8', function () {
    // حالة يكون فيها wagesAmt ضخم → المفروض يتوقف عند 8
    var a = L.computeInstallAllocations(
      { contractValue: 5000000 },
      5000000, // extBase ضخم
      {}
    );
    eq(a.installDays, 8);
    eq(a.installAtMax, true);
  });

  test('install days 0 when no wages', function () {
    var a = L.computeInstallAllocations({ contractValue: 50000 }, 0, {});
    eq(a.installDays, 0);
    eq(a.wages1Amt, 0);
    eq(a.wages2Amt, 0);
  });

  test('wages1Amt + wages2Amt = wagesAmt', function () {
    // إذا لم يصل للحد الأقصى
    var a = L.computeInstallAllocations({ contractValue: 50000 }, 30000, {});
    near(a.wages1Amt + a.wages2Amt, a.wagesAmt, 0.01);
  });

  test('auto prodWorkers from contract value', function () {
    var a1 = L.computeInstallAllocations({ contractValue: 30000 },  10000, {});
    var a2 = L.computeInstallAllocations({ contractValue: 100000 }, 10000, {});
    var a3 = L.computeInstallAllocations({ contractValue: 500000 }, 10000, {});
    eq(a1.autoProdWorkers, 3);
    eq(a2.autoProdWorkers, 5);
    eq(a3.autoProdWorkers, 12);
  });

  test('manual prodWorkers override', function () {
    var a = L.computeInstallAllocations(
      { contractValue: 30000 },
      10000,
      { manualProdWorkers: 15 }
    );
    eq(a.prodWorkers, 15);
    eq(a.autoProdWorkers, 3); // auto still computed
  });

  test('custom rates', function () {
    var a = L.computeInstallAllocations(
      { contractValue: 100000 },
      50000,
      { wagesPct: 20, fixedPct: 10 }
    );
    eq(a.wagesAmt, 10000); // 50k × 20%
    eq(a.fixedAmt, 5000);  // 50k × 10%
    eq(a.totalAuto, 15000);
  });

  test('fd.rates.monthlySal override', function () {
    var a = L.computeInstallAllocations(
      { contractValue: 100000 },
      50000,
      { monthlySal: 3000, workDays: 25 }
    );
    eq(a.dailyRate, Math.round(3000 / 25 * 100) / 100);
  });
});


// ============================================================
group('buildAutoWagesAndFixed', function () {
  test('wages array has 2 entries', function () {
    var a = L.computeInstallAllocations({ contractValue: 100000 }, 50000, {});
    var rows = L.buildAutoWagesAndFixed(a, 50000);
    eq(rows.wages.length, 2);
    eq(rows.wages[0].desc, 'عمال الإنتاج');
    eq(rows.wages[1].desc, 'عمال التركيب');
  });

  test('fixed array has 1 entry', function () {
    var a = L.computeInstallAllocations({ contractValue: 100000 }, 50000, {});
    var rows = L.buildAutoWagesAndFixed(a, 50000);
    eq(rows.fixed.length, 1);
    eq(rows.fixed[0].desc, 'مصارف ثابتة للمصنع');
  });

  test('fixed unitPrice = extBase / 100', function () {
    var a = L.computeInstallAllocations({ contractValue: 100000 }, 60000, {});
    var rows = L.buildAutoWagesAndFixed(a, 60000);
    eq(rows.fixed[0].unitPrice, 600);
  });

  test('all auto flagged', function () {
    var a = L.computeInstallAllocations({ contractValue: 100000 }, 50000, {});
    var rows = L.buildAutoWagesAndFixed(a, 50000);
    rows.wages.forEach(function (w) { eq(w._auto, true); });
    rows.fixed.forEach(function (f) { eq(f._auto, true); });
  });
});


// ============================================================
group('computeProjectStudy', function () {
  var fd = {
    aluminum:    [{ quantity: 5, unitPrice: 1000 }],  // 5000
    accessories: [{ quantity: 10, unitPrice: 50 }],   // 500
    installation:[{ quantity: 3, unitPrice: 200 }],   // 600
    wages:       [{ quantity: 5, unitPrice: 400 }],   // 2000
    fixed:       [{ quantity: 5, unitPrice: 100 }],   // 500
    rates:       { admin: 10, sales: 10, company: 20 }
  };
  var proj = { contractValue: 50000, extractValue: 46000 };

  test('totals calculated', function () {
    var s = L.computeProjectStudy(fd, proj, []);
    eq(s.totalAluminum, 5000);
    eq(s.totalAccessories, 500);
    eq(s.totalMaterials, 600);
    eq(s.totalMat, 6100);
    eq(s.totalWages, 2000);
    eq(s.totalFixed, 500);
  });

  test('adminAmt = tMat × admin%', function () {
    var s = L.computeProjectStudy(fd, proj, []);
    eq(s.adminPct, 10);
    eq(s.adminAmt, 610);
  });

  test('grandTotal = mat + wages + fixed + admin', function () {
    var s = L.computeProjectStudy(fd, proj, []);
    eq(s.grandTotal, 6100 + 2000 + 500 + 610);
  });

  test('extractBefore from storedExtractValue', function () {
    var s = L.computeProjectStudy(fd, proj, []);
    eq(s.extractBefore, 40000);  // 46000 / 1.15 = 40000
    eq(s.extractAfter, 46000);
  });

  test('percentages from extract', function () {
    var s = L.computeProjectStudy(fd, proj, []);
    near(s.pctMat, 6100 / 40000 * 100, 0.01);
    near(s.pctWages, 2000 / 40000 * 100, 0.01);
  });

  test('margin = extract − grand', function () {
    var s = L.computeProjectStudy(fd, proj, []);
    eq(s.margin, 40000 - s.grandTotal);
  });

  test('empty formData', function () {
    var s = L.computeProjectStudy({}, proj, []);
    eq(s.totalMat, 0);
    eq(s.grandTotal, 0);
  });
});


// ============================================================
group('mergeManualEdits', function () {
  var fresh = {
    aluminum:    [{ code: 'A1', unitPrice: 100 }],
    accessories: [{ desc: 'B',  unitPrice: 10 }],
    wages: [],
    fixed: [],
    rates: { admin: 10 }
  };

  test('no saved → returns fresh', function () {
    eq(L.mergeManualEdits(fresh, null), fresh);
  });

  test('no fresh → returns saved', function () {
    var saved = { aluminum: [] };
    eq(L.mergeManualEdits(null, saved), saved);
  });

  test('preserves manual unitPrice in aluminum', function () {
    var saved = {
      aluminum: [{ code: 'A1', unitPrice: 999 }]  // manual override
    };
    var merged = L.mergeManualEdits(fresh, saved);
    eq(merged.aluminum[0].unitPrice, 999);
  });

  test('preserves manual unitPrice in accessories', function () {
    var saved = {
      accessories: [{ desc: 'B', unitPrice: 50 }]
    };
    var merged = L.mergeManualEdits(fresh, saved);
    eq(merged.accessories[0].unitPrice, 50);
  });

  test('merges rates', function () {
    var saved = { rates: { admin: 15, sales: 5 } };
    var merged = L.mergeManualEdits(fresh, saved);
    eq(merged.rates.admin, 15);
    eq(merged.rates.sales, 5);
  });

  test('preserves saved wages/fixed (not regenerated)', function () {
    var saved = {
      wages: [{ id: 'w1', quantity: 100 }],
      fixed: [{ id: 'f1', quantity: 5 }]
    };
    var merged = L.mergeManualEdits(fresh, saved);
    eq(merged.wages[0].quantity, 100);
    eq(merged.fixed[0].quantity, 5);
  });

  test('non-mutating', function () {
    var freshCopy = JSON.parse(JSON.stringify(fresh));
    L.mergeManualEdits(fresh, { aluminum: [{ code: 'A1', unitPrice: 999 }] });
    eq(fresh.aluminum[0].unitPrice, freshCopy.aluminum[0].unitPrice);
  });
});


// ============================================================
group('buildFormData', function () {
  var types = [
    {
      name: 'نافذة سحاب',
      aluminum: [
        { code: '902', desc: 'حلق قلف', barLen: 6000, kgM: 2.29, qty: 1 },
        { code: '940', desc: 'درفة',   barLen: 6000, kgM: 0.889, qty: 2 }
      ],
      accessories: [
        { desc: 'غطاء', unit: 'حبة', qty: 2, unitPrice: 5 }
      ],
      installation: [
        { desc: 'سيلكون', unit: 'حبة', unitPrice: 6 }
      ]
    },
    {
      name: 'باب استركشر',
      aluminum: [
        { code: 'SG50', desc: 'قطاع T', barLen: 6000, kgM: 2.8, qty: 1 }
      ],
      accessories: [
        { desc: 'مفصل', unit: 'حبة', qty: 4, unitPrice: 15 }
      ],
      installation: [
        { desc: 'سيلكون', unit: 'حبة', unitPrice: 6 } // مكرر مع النوع الأول
      ]
    }
  ];

  test('uses plRows section names when provided', function () {
    var fd = L.buildFormData({}, [{ sectionName: 'نافذة سحاب', count: 2 }], types, 10);
    eq(fd.aluminum.length, 2);
    // qty = sec.qty × typeQty → 1×2 = 2 for حلق، 2×2 = 4 for درفة
    var halq = fd.aluminum.find(function (r) { return r.code === '902'; });
    eq(halq.quantity, 2);
    var darfa = fd.aluminum.find(function (r) { return r.code === '940'; });
    eq(darfa.quantity, 4);
  });

  test('uses all types when no plRows', function () {
    var fd = L.buildFormData({}, [], types, 10);
    eq(fd.aluminum.length, 3); // all 3 from both types
    eq(fd.accessories.length, 2);
    eq(fd.installation.length, 1); // deduped
  });

  test('dedupes installation by desc', function () {
    var fd = L.buildFormData({}, [], types, 10);
    eq(fd.installation.length, 1);
    eq(fd.installation[0].desc, 'سيلكون');
  });

  test('default rates', function () {
    var fd = L.buildFormData({}, [], types, 10);
    eq(fd.rates.admin, 10);
    eq(fd.rates.company, 20);
  });

  test('empty types → empty arrays', function () {
    var fd = L.buildFormData({}, [], [], 10);
    eq(fd.aluminum.length, 0);
  });
});


// ============================================================
console.log('\n════════════════════════════════════════');
console.log('  NouRion — forms.logic.js test results');
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
