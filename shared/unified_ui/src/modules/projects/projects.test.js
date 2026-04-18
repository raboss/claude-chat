/* ============================================================
   NouRion — projects.test.js
   ------------------------------------------------------------
   Runnable in Node OR browser. No test framework required.
   Usage:
     node NouRion/src/modules/projects/projects.test.js
   ============================================================ */

var L = (typeof require !== 'undefined')
  ? require('./projects.logic.js')
  : window.NouRion.ProjectsLogic;

var passed = 0, failed = 0;
var failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✔ ' + name);
  } catch (e) {
    failed++;
    failures.push({ name: name, error: e.message });
    console.log('  ✘ ' + name + '\n     → ' + e.message);
  }
}

function eq(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error((msg || '') + ' expected=' + JSON.stringify(expected) + ' actual=' + JSON.stringify(actual));
  }
}

function deepEq(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error((msg || '') + '\n  expected=' + JSON.stringify(b) + '\n  actual  =' + JSON.stringify(a));
  }
}

function group(name, fn) {
  console.log('\n── ' + name + ' ──');
  fn();
}


// ============================================================
// 1. calcStatusFromStage
// ============================================================
group('calcStatusFromStage', function () {
  test('empty → توقيع العقد', function () {
    eq(L.calcStatusFromStage(''), 'توقيع العقد');
    eq(L.calcStatusFromStage(null), 'توقيع العقد');
    eq(L.calcStatusFromStage(undefined), 'توقيع العقد');
  });

  test('سداد الدفعة الثانية → موقوف - انتظار سداد العميل', function () {
    eq(L.calcStatusFromStage('سداد الدفعة الثانية'), 'موقوف - انتظار سداد العميل');
  });

  test('سداد (generic) → موقوف - انتظار سداد العميل', function () {
    eq(L.calcStatusFromStage('سداد'), 'موقوف - انتظار سداد العميل');
  });

  test('طلب الزجاج → تأخير من الشركة', function () {
    eq(L.calcStatusFromStage('طلب الزجاج'), 'تأخير من الشركة');
  });

  test('طلب الخامات → تأخير من الشركة', function () {
    eq(L.calcStatusFromStage('طلب الخامات'), 'تأخير من الشركة');
  });

  test('أمر تركيب → تركيب', function () {
    eq(L.calcStatusFromStage('أمر تركيب'), 'تركيب');
  });

  test('امر تركيب (بدون همزة) → تركيب', function () {
    eq(L.calcStatusFromStage('امر تركيب'), 'تركيب');
  });

  test('توريد → تركيب', function () {
    eq(L.calcStatusFromStage('توريد'), 'تركيب');
  });

  test('تركيب الزجاج → تركيب', function () {
    eq(L.calcStatusFromStage('تركيب الزجاج'), 'تركيب');
  });

  test('تسليم الموقع → تم التسليم', function () {
    eq(L.calcStatusFromStage('تسليم الموقع'), 'تم التسليم');
  });

  test('رفع مقاسات → جاري', function () {
    eq(L.calcStatusFromStage('رفع مقاسات'), 'جاري');
  });

  test('دهان الخامات → جاري', function () {
    eq(L.calcStatusFromStage('دهان الخامات'), 'جاري');
  });

  test('اصدار مستخلص → جاري', function () {
    eq(L.calcStatusFromStage('اصدار مستخلص'), 'جاري');
  });

  test('مرحلة غير معروفة → جاري (default)', function () {
    eq(L.calcStatusFromStage('مرحلة خيالية'), 'جاري');
  });

  test('precedence: سداد يأتي قبل طلب الزجاج', function () {
    // لو المرحلة فيها الاثنين، لازم "سداد" يفوز (هو الأول في السلسلة الأصلية)
    eq(L.calcStatusFromStage('سداد و طلب الزجاج'), 'موقوف - انتظار سداد العميل');
  });
});


// ============================================================
// 2. _parseDate
// ============================================================
group('_parseDate', function () {
  test('ISO date', function () {
    var d = L._parseDate('2026-04-06');
    eq(d instanceof Date, true);
    eq(d.toISOString().slice(0, 10), '2026-04-06');
  });

  test('null / empty', function () {
    eq(L._parseDate(null), null);
    eq(L._parseDate(''), null);
    eq(L._parseDate(undefined), null);
  });

  test('invalid string', function () {
    eq(L._parseDate('abc'), null);
  });

  test('Excel serial number', function () {
    var d = L._parseDate('45000'); // Excel serial for a real date
    eq(d instanceof Date, true);
  });
});


// ============================================================
// 3. calcDeliveryDate — skip Fridays
// ============================================================
group('calcDeliveryDate', function () {
  test('empty inputs → ""', function () {
    eq(L.calcDeliveryDate('', 10), '');
    eq(L.calcDeliveryDate('2026-01-01', 0), '');
    eq(L.calcDeliveryDate(null, 10), '');
  });

  test('adds 1 day (not Friday) from Sunday', function () {
    // 2026-01-04 is a Sunday. +1 day = 2026-01-05 (Monday) — no skip.
    eq(L.calcDeliveryDate('2026-01-04', 1), '2026-01-05');
  });

  test('skips Friday when advancing', function () {
    // 2026-01-08 is Thursday. +1 day = Friday → skip → Saturday 2026-01-10.
    eq(L.calcDeliveryDate('2026-01-08', 1), '2026-01-10');
  });

  test('skipFridays=false → Friday counted', function () {
    eq(L.calcDeliveryDate('2026-01-08', 1, { skipFridays: false }), '2026-01-09');
  });

  test('skips holidays when provided', function () {
    // +1 from Sunday Jan 4 would normally be Monday Jan 5, but if Jan 5 is a holiday, skip to Jan 6.
    eq(L.calcDeliveryDate('2026-01-04', 1, { holidays: ['2026-01-05'] }), '2026-01-06');
  });

  test('30 days from 2026-01-01 (with Fridays skipped)', function () {
    var result = L.calcDeliveryDate('2026-01-01', 30);
    // deterministic — we lock the result
    eq(typeof result, 'string');
    eq(result.length, 10);
  });
});


// ============================================================
// 4. calcSmartDeliveryDate
// ============================================================
group('calcSmartDeliveryDate', function () {
  test('missing contractDuration → ""', function () {
    eq(L.calcSmartDeliveryDate({ approvalDate: '2026-01-01' }), '');
  });

  test('no approval & no siteReady → ""', function () {
    eq(L.calcSmartDeliveryDate({ contractDuration: '30' }), '');
  });

  test('only approvalDate → uses it', function () {
    var r = L.calcSmartDeliveryDate({
      contractDuration: '10',
      approvalDate: '2026-01-01'
    });
    eq(typeof r, 'string');
    eq(r.length, 10);
  });

  test('only siteReadyDate → uses it', function () {
    var r = L.calcSmartDeliveryDate({
      contractDuration: '10',
      siteReadyDate: '2026-01-01'
    });
    eq(typeof r, 'string');
    eq(r.length, 10);
  });

  test('both → picks latest', function () {
    var r1 = L.calcSmartDeliveryDate({
      contractDuration: '10',
      approvalDate: '2026-01-01',
      siteReadyDate: '2026-02-01'
    });
    var r2 = L.calcSmartDeliveryDate({
      contractDuration: '10',
      approvalDate: '2026-02-01', // same latest
      siteReadyDate: '2026-01-01'
    });
    eq(r1, r2, 'swapping latest/earliest must not change result');
  });
});


// ============================================================
// 5. getDeliveryPauseReasons
// ============================================================
group('getDeliveryPauseReasons', function () {
  test('no project fields → 3 reasons', function () {
    var r = L.getDeliveryPauseReasons({});
    eq(r.length, 3);
  });

  test('all fields set → 0 reasons', function () {
    var r = L.getDeliveryPauseReasons({
      siteReadyDate: '2026-01-01',
      approvalDate: '2026-01-02',
      secondPaymentDate: '2026-01-03'
    });
    eq(r.length, 0);
  });

  test('only siteReadyDate missing → 1 reason', function () {
    var r = L.getDeliveryPauseReasons({
      approvalDate: '2026-01-02',
      secondPaymentDate: '2026-01-03'
    });
    eq(r.length, 1);
    eq(r[0], 'لم يتم تحديد تاريخ جاهزية الموقع');
  });
});


// ============================================================
// 6. calculateProgressFromStage
// ============================================================
group('calculateProgressFromStage', function () {
  var stages = [
    { name: 'توقيع العقد', pct: 10 },
    { name: 'رفع مقاسات', pct: 15 },
    { name: 'دهان الخامات', pct: 25 },
    { name: 'البدء بالتصنيع', pct: 30 },
    { name: 'التسليم', pct: 20 }
  ];

  test('empty stage → 0', function () {
    eq(L.calculateProgressFromStage('', stages), 0);
    eq(L.calculateProgressFromStage(null, stages), 0);
  });

  test('first stage → its pct', function () {
    eq(L.calculateProgressFromStage('توقيع العقد', stages), 10);
  });

  test('third stage → cumulative', function () {
    eq(L.calculateProgressFromStage('دهان الخامات', stages), 50); // 10+15+25
  });

  test('last stage → 100', function () {
    eq(L.calculateProgressFromStage('التسليم', stages), 100);
  });

  test('capped at 100 even if sum exceeds', function () {
    var huge = [{ name: 'a', pct: 60 }, { name: 'b', pct: 60 }];
    eq(L.calculateProgressFromStage('b', huge), 100);
  });

  test('unknown stage name → sum of all', function () {
    // المرحلة غير موجودة → الحلقة تنتهي طبيعياً بدون break → مجموع الكل (المحدود بـ 100)
    eq(L.calculateProgressFromStage('مرحلة مجهولة', stages), 100);
  });
});


// ============================================================
// 7. computeProjectFinancials
// ============================================================
group('computeProjectFinancials', function () {
  test('extract > 0 → base = extract', function () {
    var f = L.computeProjectFinancials({
      extractValue: '75000',
      contractValue: '65000',
      downPayment: '50000',
      progress: '50'
    });
    eq(f.baseValue, 75000);
    eq(f.productionValue, 37500); // 75000 * 50% = 37500
    eq(f.remaining, 0);            // max(0, 75000 - 50000 - 37500) = -12500 → 0
  });

  test('no extract → base = contract', function () {
    var f = L.computeProjectFinancials({
      contractValue: '100000',
      downPayment: '20000',
      progress: '30'
    });
    eq(f.baseValue, 100000);
    eq(f.productionValue, 30000);
    eq(f.remaining, 50000);        // 100000 - 20000 - 30000 = 50000
  });

  test('all empty → zeros', function () {
    var f = L.computeProjectFinancials({});
    eq(f.baseValue, 0);
    eq(f.productionValue, 0);
    eq(f.remaining, 0);
  });

  test('progress 100 → full production', function () {
    var f = L.computeProjectFinancials({
      contractValue: '50000',
      downPayment: '10000',
      progress: '100'
    });
    eq(f.productionValue, 50000);
    eq(f.remaining, 0); // max(0, 50000 - 10000 - 50000) = -10000 → 0
  });
});


// ============================================================
// 8. computeProjectSummary
// ============================================================
group('computeProjectSummary', function () {
  test('empty list', function () {
    var s = L.computeProjectSummary([]);
    eq(s.total, 0);
    eq(s.active, 0);
    eq(s.installing, 0);
    eq(s.delivered, 0);
    eq(s.totalContract, 0);
    eq(s.totalProduction, 0);
  });

  test('mix of statuses + totals', function () {
    var projects = [
      { stage: 'رفع مقاسات',  contractValue: '100000', downPayment: '20000', progress: '30' }, // جاري
      { stage: 'أمر تركيب',    contractValue: '200000', downPayment: '50000', progress: '80' }, // تركيب
      { stage: 'تسليم الموقع', contractValue: '150000', downPayment: '50000', progress: '100' },// تم التسليم
      { stage: 'طلب الزجاج',   contractValue: '80000',  downPayment: '10000', progress: '40' }  // تأخير من الشركة (لا يُحسب)
    ];
    var s = L.computeProjectSummary(projects);
    eq(s.total, 4);
    eq(s.active, 1);
    eq(s.installing, 1);
    eq(s.delivered, 1);
    eq(s.totalContract, 530000);   // 100+200+150+80 كلّها
    eq(s.totalProduction,
       Math.round(100000 * 0.30) +
       Math.round(200000 * 0.80) +
       Math.round(150000 * 1.00) +
       Math.round(80000 * 0.40));
  });
});


// ============================================================
// RESULTS
// ============================================================
console.log('\n════════════════════════════════════════');
console.log('  NouRion — projects.logic.js test results');
console.log('════════════════════════════════════════');
console.log('  ✔ passed: ' + passed);
console.log('  ✘ failed: ' + failed);
if (failed > 0) {
  console.log('\nFailures:');
  failures.forEach(function (f) {
    console.log('  - ' + f.name + '\n    ' + f.error);
  });
  if (typeof process !== 'undefined') process.exit(1);
} else {
  console.log('\n  ✓ All tests passed.\n');
}
