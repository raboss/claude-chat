/* ============================================================
   NouRion — form-types.test.js
   ============================================================ */

var L = (typeof require !== 'undefined')
  ? require('./form-types.logic.js')
  : window.NouRion.FormTypesLogic;

var passed = 0, failed = 0, failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log('  ✔ ' + name); }
  catch (e) { failed++; failures.push({ name: name, error: e.message }); console.log('  ✘ ' + name + '\n     → ' + e.message); }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' expected=' + JSON.stringify(b) + ' actual=' + JSON.stringify(a)); }
function near(a, b, tol, msg) { if (Math.abs(a - b) > (tol || 0.001)) throw new Error((msg || '') + ' expected≈' + b + ' actual=' + a); }
function notNull(v, msg) { if (v == null) throw new Error((msg || 'expected non-null') + ' got=' + v); }
function isNull(v, msg) { if (v != null) throw new Error((msg || 'expected null') + ' got=' + JSON.stringify(v)); }
function group(n, fn) { console.log('\n── ' + n + ' ──'); fn(); }


// ============================================================
group('fmDescKey', function () {
  test('trims whitespace', function () { eq(L.fmDescKey('  hello  '), 'hello'); });
  test('null → ""', function () { eq(L.fmDescKey(null), ''); });
  test('undefined → ""', function () { eq(L.fmDescKey(undefined), ''); });
  test('empty → ""', function () { eq(L.fmDescKey(''), ''); });
});


// ============================================================
group('fmSecImgKey', function () {
  test('starts with prefix', function () {
    var k = L.fmSecImgKey('حلق سحاب قلف 12 سم');
    eq(k.indexOf(L.FM_SEC_IMG_PREFIX), 0);
  });

  test('deterministic — same input → same key', function () {
    eq(L.fmSecImgKey('abc'), L.fmSecImgKey('abc'));
  });

  test('⚠ KNOWN QUIRK: long Arabic prefixes may collide (40-char truncation)', function () {
    // السلوك الأصلي في 12-form-types.js:73 — slice(0,40) بعد base64 يُسبّب collision
    // لنصوص عربية مختلفة تبدأ بنفس الحروف. هذا موجود في الأصل ولم نصلحه.
    // Logged in docs/KNOWN_QUIRKS.md for future fix.
    var a = L.fmSecImgKey('حلق سحاب قلف 12 سم');
    var b = L.fmSecImgKey('حلق سحاب سرايا 10 سم');
    // Assert the collision exists (documenting current behavior)
    eq(a, b, 'expected collision to demonstrate original quirk');
  });

  test('different Latin inputs → different keys', function () {
    // Latin strings are shorter after encoding — collision less likely
    var a = L.fmSecImgKey('ABC');
    var b = L.fmSecImgKey('XYZ');
    if (a === b) throw new Error('Latin collision unexpected');
  });

  test('only alphanumeric after prefix', function () {
    var k = L.fmSecImgKey('حلق!@#$%');
    var tail = k.slice(L.FM_SEC_IMG_PREFIX.length);
    if (!/^[a-zA-Z0-9]*$/.test(tail)) throw new Error('non-alnum chars in tail: ' + tail);
  });

  test('max length 40 after prefix', function () {
    var k = L.fmSecImgKey('a'.repeat(200));
    var tail = k.slice(L.FM_SEC_IMG_PREFIX.length);
    if (tail.length > 40) throw new Error('tail length=' + tail.length);
  });
});


// ============================================================
group('fmGetCode', function () {
  var catalogs = [
    { id: 'cat1', name: 'العاصمة', codes: { 'حلق سحاب قلف': 'AC-12' } },
    { id: 'cat2', name: 'الوبكو',   codes: { 'حلق سحاب قلف': 'WB-12' } }
  ];

  test('no active catalog → fallback', function () {
    eq(L.fmGetCode('حلق سحاب قلف', 'FB', '', catalogs), 'FB');
  });

  test('active catalog + match → catalog code', function () {
    eq(L.fmGetCode('حلق سحاب قلف', 'FB', 'cat1', catalogs), 'AC-12');
  });

  test('different active catalog → different code', function () {
    eq(L.fmGetCode('حلق سحاب قلف', 'FB', 'cat2', catalogs), 'WB-12');
  });

  test('active catalog + no match → fallback', function () {
    eq(L.fmGetCode('غير موجود', 'FB', 'cat1', catalogs), 'FB');
  });

  test('active catalog not found → fallback', function () {
    eq(L.fmGetCode('حلق سحاب قلف', 'FB', 'cat99', catalogs), 'FB');
  });

  test('no fallback → ""', function () {
    eq(L.fmGetCode('غير موجود', '', 'cat1', catalogs), '');
    eq(L.fmGetCode('حلق سحاب قلف', undefined, '', catalogs), '');
  });
});


// ============================================================
group('fmCalcBarWeight', function () {
  test('6000mm × 2.29 kg/m = 13.74', function () {
    near(L.fmCalcBarWeight(6000, 2.29), 13.74);
  });

  test('5800mm × 0.821 = 4.762 (rounded to 3dp)', function () {
    near(L.fmCalcBarWeight(5800, 0.821), 4.762);
  });

  test('0 kgM → 0', function () { eq(L.fmCalcBarWeight(6000, 0), 0); });
  test('null kgM → 0', function () { eq(L.fmCalcBarWeight(6000, null), 0); });
  test('undefined kgM → 0', function () { eq(L.fmCalcBarWeight(6000, undefined), 0); });
});


// ============================================================
group('fmCalcBarPrice', function () {
  test('with explicit kgPrice', function () {
    // weight = 6 * 2 = 12 kg, price = 12 * 15 = 180.00
    near(L.fmCalcBarPrice(6000, 2, 15), 180.00, 0.01);
  });

  test('without kgPrice → default 10', function () {
    // weight = 6 * 1 = 6 kg, price = 6 * 10 = 60
    near(L.fmCalcBarPrice(6000, 1), 60.00, 0.01);
  });

  test('kgPrice=0 → fallback to default (original `||` behavior)', function () {
    // Original: `kgPrice || fmKgPriceGet()` — 0 is falsy, so uses default 10
    near(L.fmCalcBarPrice(6000, 1, 0), 60.00, 0.01);
  });

  test('realistic: 902 bar (2.29 kg/m × 6m × 10)', function () {
    near(L.fmCalcBarPrice(6000, 2.29, 10), 137.40, 0.01);
  });
});


// ============================================================
group('fmResolveType', function () {
  var types = [
    { id: 'wt1', name: 'نوافذ سحاب قلف 12 سم' },
    { id: 'wt2', name: 'نوافذ سحاب سرايا 10 سم' },
    { id: 'wt3', name: 'واجهات استركشر SG50' }
  ];
  var addons = [
    { id: 'ad1', label: 'مع قوس', keyword: 'مع قوس' },
    { id: 'ad2', label: 'مع ثابت', keyword: 'مع ثابت' },
    { id: 'ad3', label: '4 درف',   keyword: '4 درف' }
  ];

  test('direct match', function () {
    var r = L.fmResolveType('نوافذ سحاب قلف 12 سم', types, addons);
    notNull(r);
    eq(r.baseType.id, 'wt1');
    eq(r.addons.length, 0);
  });

  test('direct match + addon', function () {
    var r = L.fmResolveType('نوافذ سحاب قلف 12 سم مع قوس', types, addons);
    notNull(r);
    // No direct match, but partial "نوافذ سحاب قلف 12 سم" ⊂ input
    eq(r.baseType.id, 'wt1');
    eq(r.addons.length, 1);
    eq(r.addons[0].id, 'ad1');
  });

  test('partial match picks longest', function () {
    var r = L.fmResolveType('نوافذ سحاب قلف 12 سم شيء اضافي', types, addons);
    notNull(r);
    eq(r.baseType.id, 'wt1');
  });

  test('multiple addons matched', function () {
    var r = L.fmResolveType('نوافذ سحاب قلف 12 سم مع ثابت 4 درف', types, addons);
    notNull(r);
    eq(r.addons.length, 2);
  });

  test('no base & no addons → null', function () {
    var r = L.fmResolveType('شيء غير موجود تماماً', types, addons);
    isNull(r);
  });

  test('no base but addon matches → base=null, addons>0', function () {
    var r = L.fmResolveType('شيء مع قوس', types, addons);
    notNull(r);
    isNull(r.baseType);
    eq(r.addons.length, 1);
  });

  test('⚠ KNOWN QUIRK: empty name matches longest type (String.includes("") == true)', function () {
    // في الأصل: `t.name.includes(typeName)` حيث typeName='' → دائماً true
    // فكل الأنواع تُعدّ candidates والأطول يفوز.
    // هذا موجود في 12-form-types.js:104 ولم نصلحه.
    var r = L.fmResolveType('', types, addons);
    notNull(r, 'expected non-null to document quirk');
    eq(r.baseType.id, 'wt2'); // الأطول اسماً بين الأنواع الثلاثة
    eq(r.addons.length, 0);
  });

  test('null name → same as empty (quirk)', function () {
    var r = L.fmResolveType(null, types, addons);
    notNull(r);
    eq(r.baseType.id, 'wt2');
  });

  test('addon without keyword is ignored', function () {
    var bad = [{ id: 'bad', label: 'x', keyword: '' }];
    var r = L.fmResolveType('نوافذ سحاب قلف 12 سم', types, bad);
    notNull(r);
    eq(r.addons.length, 0);
  });
});


// ============================================================
group('computeTypeTotal', function () {
  var type = {
    aluminum: [
      { barLen: 6000, kgM: 2.29, qty: 1 },
      { barLen: 6000, kgM: 1.0,  qty: 2 }
    ],
    accessories: [{}, {}, {}],
    installation: [{}]
  };

  test('null type → zeros', function () {
    var t = L.computeTypeTotal(null, 10);
    eq(t.aluminumKg, 0);
    eq(t.aluminumPrice, 0);
    eq(t.barsCount, 0);
  });

  test('counts bars/acc/inst', function () {
    var t = L.computeTypeTotal(type, 10);
    eq(t.barsCount, 2);
    eq(t.accCount, 3);
    eq(t.instCount, 1);
  });

  test('weight = 13.74 + 12.0 = 25.74', function () {
    var t = L.computeTypeTotal(type, 10);
    near(t.aluminumKg, 25.74, 0.01);
  });

  test('price = 137.40 + 120.0 = 257.40', function () {
    var t = L.computeTypeTotal(type, 10);
    near(t.aluminumPrice, 257.40, 0.01);
  });

  test('default kgPrice when missing', function () {
    var t = L.computeTypeTotal(type); // uses DEFAULT_KG_PRICE=10
    near(t.aluminumPrice, 257.40, 0.01);
  });
});


// ============================================================
group('default data', function () {
  test('getDefaultTypes returns 3 types', function () {
    var t = L.getDefaultTypes();
    eq(t.length, 3);
    eq(t[0].id, 'wt1');
    eq(t[1].id, 'wt2');
    eq(t[2].id, 'wt3');
  });

  test('getDefaultTypes is not shared (new copy each call)', function () {
    var a = L.getDefaultTypes();
    a[0].name = 'mutated';
    var b = L.getDefaultTypes();
    eq(b[0].name, 'نوافذ سحاب قلف 12 سم');
  });

  test('getDefaultAddons returns 4 addons', function () {
    var a = L.getDefaultAddons();
    eq(a.length, 4);
    eq(a[0].id, 'ad_arc');
  });

  test('default type wt1 has 5 aluminum bars', function () {
    var t = L.getDefaultTypes()[0];
    eq(t.aluminum.length, 5);
  });

  test('default type wt1 first bar weight matches original', function () {
    var b = L.getDefaultTypes()[0].aluminum[0];
    near(L.fmCalcBarWeight(b.barLen, b.kgM), 13.74, 0.01);
  });
});


// ============================================================
console.log('\n════════════════════════════════════════');
console.log('  NouRion — form-types.logic.js test results');
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
