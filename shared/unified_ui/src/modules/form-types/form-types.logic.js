/* ============================================================
   NouRion — modules/form-types/form-types.logic.js
   ------------------------------------------------------------
   Pure logic for the Form-Types module (aluminum sections tree).
   NO DOM. NO localStorage. NO prompts.

   🚫 القاعدة الحمراء:
   كل الحسابات هنا منقولة حرفياً من pm_server/public/js/12-form-types.js
   التعديل الوحيد هو حقن الاعتماديات (DI) بدل قراءة localStorage.

   المصادر:
   - fmResolveType       → 12-form-types.js:98
   - fmCalcBarWeight     → 12-form-types.js:195
   - fmCalcBarPrice      → 12-form-types.js:198
   - fmDescKey           → 12-form-types.js:44
   - fmGetCode           → 12-form-types.js:34
   - fmSecImgKey         → 12-form-types.js:73
   - _fmDefaultTypes()   → 12-form-types.js:203
   - _fmDefaultAddons()  → 12-form-types.js:154
   ============================================================ */

(function (global) {
  'use strict';

  // ==========================================================
  // 1. Constants (منقولة من الأصل)
  // ==========================================================
  var DEFAULT_KG_PRICE = 10; // من 12-form-types.js:14 `|| '10'`
  var FM_SEC_IMG_PREFIX = 'pm_sec_img_';

  // ==========================================================
  // 2. fmDescKey — تطبيع مفتاح الوصف
  //    منقولة حرفياً من 12-form-types.js:44
  // ==========================================================
  function fmDescKey(desc) {
    return (desc || '').trim();
  }

  // ==========================================================
  // 3. fmSecImgKey — توليد مفتاح آمن لصورة القطاع
  //    منقولة حرفياً من 12-form-types.js:73
  //    استخدام btoa — يعمل في المتصفّح مباشرة. في Node نحتاج polyfill.
  // ==========================================================
  function fmSecImgKey(desc) {
    var s = (desc || '').trim();
    var encoded;
    if (typeof btoa === 'function') {
      encoded = btoa(encodeURIComponent(s));
    } else {
      // Node fallback — same algorithm
      encoded = Buffer.from(encodeURIComponent(s), 'binary').toString('base64');
    }
    return FM_SEC_IMG_PREFIX + encoded.replace(/[^a-zA-Z0-9]/g, '').slice(0, 40);
  }

  // ==========================================================
  // 4. fmGetCode — lookup code for a description in a catalog
  //    منقولة من 12-form-types.js:34 مع حقن (activeCatId + catalogs)
  //    الأصل كان يقرأ من localStorage؛ هنا نحقنها.
  // ==========================================================
  function fmGetCode(descKey, fallback, activeCatId, catalogs) {
    if (!activeCatId) return fallback || '';
    var cats = catalogs || [];
    var cat = cats.find(function (c) { return c.id === activeCatId; });
    if (!cat) return fallback || '';
    return (cat.codes && cat.codes[descKey]) || fallback || '';
  }

  // ==========================================================
  // 5. fmResolveType — smart matching: name → { baseType, addons }
  //    منقولة حرفياً من 12-form-types.js:98
  // ==========================================================
  function fmResolveType(typeName, allTypes, allAddons) {
    typeName = (typeName || '').trim();
    allTypes = allTypes || [];
    allAddons = allAddons || [];

    // 1) تطابق مباشر
    var base = allTypes.find(function (t) { return t.name === typeName; });

    // 2) تطابق جزئي — نجرّب كل الأنواع ونأخذ أطولها تطابقاً
    if (!base) {
      var candidates = allTypes.filter(function (t) {
        return typeName.includes(t.name) || t.name.includes(typeName);
      });
      if (candidates.length) {
        base = candidates.reduce(function (a, b) {
          return b.name.length > a.name.length ? b : a;
        });
      }
    }

    // 3) الإضافات — الكلمة المفتاحية موجودة في الاسم
    var matchedAddons = allAddons.filter(function (ad) {
      return ad.keyword && typeName.includes(ad.keyword);
    });

    // 4) إذا ما في base ولا إضافات — null
    if (!base && !matchedAddons.length) return null;

    return { baseType: base || null, addons: matchedAddons };
  }

  // ==========================================================
  // 6. fmCalcBarWeight — وزن بار بالكيلو (3 decimals)
  //    منقولة حرفياً من 12-form-types.js:195
  // ==========================================================
  function fmCalcBarWeight(barLenMm, kgPerM) {
    return Math.round((barLenMm / 1000) * (kgPerM || 0) * 1000) / 1000;
  }

  // ==========================================================
  // 7. fmCalcBarPrice — سعر بار (2 decimals)
  //    منقولة من 12-form-types.js:198 مع حقن kgPrice
  //    الأصل: `kgPrice || fmKgPriceGet()`
  //    هنا: إذا لم يُمرَّر kgPrice → نستخدم DEFAULT_KG_PRICE = 10 (نفس الأصل بدون LS)
  // ==========================================================
  function fmCalcBarPrice(barLenMm, kgPerM, kgPrice) {
    var price = kgPrice || DEFAULT_KG_PRICE;
    return Math.round(fmCalcBarWeight(barLenMm, kgPerM) * price * 100) / 100;
  }

  // ==========================================================
  // 8. computeTypeTotal — aggregate لنوع قطاع كامل
  //    مستخرج من منطق عرض الأسعار في 11-forms.js (pure subset)
  // ==========================================================
  function computeTypeTotal(type, kgPrice) {
    if (!type) return { aluminumKg: 0, aluminumPrice: 0, barsCount: 0, accCount: 0, instCount: 0 };

    var aluminumKg = 0;
    var aluminumPrice = 0;
    var bars = (type.aluminum || []);
    for (var i = 0; i < bars.length; i++) {
      var b = bars[i];
      var qty = parseFloat(b.qty) || 1;
      aluminumKg    += fmCalcBarWeight(b.barLen, b.kgM) * qty;
      aluminumPrice += fmCalcBarPrice(b.barLen, b.kgM, kgPrice) * qty;
    }

    return {
      aluminumKg:    Math.round(aluminumKg * 1000) / 1000,
      aluminumPrice: Math.round(aluminumPrice * 100) / 100,
      barsCount:     bars.length,
      accCount:      (type.accessories || []).length,
      instCount:     (type.installation || []).length
    };
  }

  // ==========================================================
  // 9. Default types — منقولة حرفياً من 12-form-types.js:203
  // ==========================================================
  function getDefaultTypes() {
    return [
      {
        id: 'wt1',
        name: 'نوافذ سحاب قلف 12 سم',
        aluminum: [
          { id: 'a1', code: '902',  desc: 'حلق سحاب قلف 12 سم 1.8مم ط6م',    unit: 'بار', barLen: 6000, kgM: 2.29,  qty: 1 },
          { id: 'a2', code: '940',  desc: 'درفة جنب قلف 1.5مم ط6م',           unit: 'بار', barLen: 6000, kgM: 0.889, qty: 1 },
          { id: 'a3', code: '950',  desc: 'درفة شنكل قلف 1.5مم ط6م',          unit: 'بار', barLen: 6000, kgM: 0.778, qty: 1 },
          { id: 'a4', code: '960',  desc: 'درفة كعب قلف 1.5مم ط6م',           unit: 'بار', barLen: 6000, kgM: 0.781, qty: 1 },
          { id: 'a5', code: '3770', desc: 'زاوية 40x40x40مم (غ.م) ط5.8م',     unit: 'بار', barLen: 5800, kgM: 0.821, qty: 1 }
        ],
        accessories: [
          { id: 'ac1', desc: 'غطاء درفة شنكل قلف (10-12سم) اسود', unit: 'حبة', qty: 1 },
          { id: 'ac2', desc: 'زاوية زنك حلق قلف 12سم (رقم 902)',  unit: 'حبة', qty: 1 },
          { id: 'ac3', desc: 'كفر قلف 12سم ايطالي MARO',          unit: 'حبة', qty: 1 },
          { id: 'ac4', desc: 'مسكة مخفية ماسح LAVAL مدهون',       unit: 'حبة', qty: 1 },
          { id: 'ac5', desc: 'سلك سحاب (80سم) اسود بحريني',       unit: 'لفة' },
          { id: 'ac6', desc: 'فرش 5.5مم 550-PB6 رمادي 170م',      unit: 'لفة' }
        ],
        installation: [
          { id: 'i1', desc: 'براغي حسب حاجة العمل',     unit: 'علبة',  unitPrice: 200 },
          { id: 'i2', desc: 'سيلكون',                    unit: 'حبة',   unitPrice: 6 },
          { id: 'i3', desc: 'زجاج دبل + سيلكون الزجاج', unit: 'متر',   unitPrice: 145 },
          { id: 'i4', desc: 'نقل',                       unit: 'سيارة', unitPrice: 1000 }
        ]
      },
      {
        id: 'wt2',
        name: 'نوافذ سحاب سرايا 10 سم',
        aluminum: [
          { id: 'a6',  code: '40',   desc: 'حلق سحاب سرايا 10سم 1.5مم ط6م',   unit: 'بار', barLen: 6000, kgM: 1.649, qty: 1 },
          { id: 'a7',  code: '220',  desc: 'درفة جنب سرايا دبل 1.4مم ط5.8م',  unit: 'بار', barLen: 5800, kgM: 0.782, qty: 1 },
          { id: 'a8',  code: '230',  desc: 'درفة شنكل سرايا دبل 1.4مم ط5.8م', unit: 'بار', barLen: 5800, kgM: 0.746, qty: 1 },
          { id: 'a9',  code: '240',  desc: 'درفة كعب سرايا 1.4مم ط5.8م',      unit: 'بار', barLen: 5800, kgM: 0.755, qty: 1 },
          { id: 'a10', code: '3770', desc: 'زاوية 40x40x40مم (غ.م) ط5.8م',    unit: 'بار', barLen: 5800, kgM: 0.821, qty: 1 }
        ],
        accessories: [
          { id: 'ac7',  desc: 'غطاء درفة شنكل سرايا (10سم) اسود', unit: 'حبة', qty: 1 },
          { id: 'ac8',  desc: 'زاوية زنك حلق سرايا 10سم (رقم 40)', unit: 'حبة', qty: 1 },
          { id: 'ac9',  desc: 'كفر سرايا 10سم ايطالي',             unit: 'حبة', qty: 1 },
          { id: 'ac10', desc: 'مسكة مخفية ماسح LAVAL مدهون',       unit: 'حبة', qty: 1 },
          { id: 'ac11', desc: 'سلك سحاب (80سم) اسود بحريني',       unit: 'لفة' },
          { id: 'ac12', desc: 'فرش 5.5مم 550-PB7 رمادي 170م',      unit: 'لفة' }
        ],
        installation: [
          { id: 'i5', desc: 'براغي حسب حاجة العمل',     unit: 'علبة',  unitPrice: 200 },
          { id: 'i6', desc: 'سيلكون',                    unit: 'حبة',   unitPrice: 6 },
          { id: 'i7', desc: 'زجاج دبل + سيلكون الزجاج', unit: 'متر',   unitPrice: 145 },
          { id: 'i8', desc: 'نقل',                       unit: 'سيارة', unitPrice: 1000 }
        ]
      },
      {
        id: 'wt3',
        name: 'واجهات استركشر SG50',
        aluminum: [
          { id: 'a11', code: 'SG50-T', desc: 'قطاع T استركشر SG50 ط6م',         unit: 'بار', barLen: 6000, kgM: 2.8,   qty: 1 },
          { id: 'a12', code: 'SG50-P', desc: 'قطاع ضغاطة استركشر SG50 ط6م',     unit: 'بار', barLen: 6000, kgM: 1.2,   qty: 1 },
          { id: 'a13', code: '3770',   desc: 'زاوية 40x40x40مم (غ.م) ط5.8م',    unit: 'بار', barLen: 5800, kgM: 0.821, qty: 1 }
        ],
        accessories: [
          { id: 'ac13', desc: 'مسكة استركشر LAVAL مع الاكسسوار مدهون', unit: 'حبة', qty: 1 },
          { id: 'ac14', desc: 'ذراع رباعي CADWELL ستانلس 55سم',         unit: 'حبة', qty: 1 },
          { id: 'ac15', desc: 'كاوتش SG50 سماكة 8مم (50متر)',           unit: 'لفة' }
        ],
        installation: [
          { id: 'i9',  desc: 'براغي حسب حاجة العمل',       unit: 'علبة',  unitPrice: 200 },
          { id: 'i10', desc: 'سيلكون استركشر',              unit: 'حبة',   unitPrice: 8 },
          { id: 'i11', desc: 'زجاج دبل استركشر + سيلكون',  unit: 'متر',   unitPrice: 155 },
          { id: 'i12', desc: 'نقل',                         unit: 'سيارة', unitPrice: 1000 }
        ]
      }
    ];
  }

  // ==========================================================
  // 10. Default addons — منقولة حرفياً من 12-form-types.js:154
  // ==========================================================
  function getDefaultAddons() {
    return [
      {
        id: 'ad_arc', label: 'مع قوس', keyword: 'مع قوس',
        aluminum: [
          { id: 'aa1', code: '', desc: 'حلق مفصلات سرايا 10.5سم مفتوح SOFT غ.م', unit: 'بار', barLen: 6000, kgM: 1.8, qty: 1 },
          { id: 'aa2', code: '', desc: 'بركلوز 18مم SOFT غ.م',                    unit: 'بار', barLen: 6000, kgM: 1.2, qty: 1 }
        ],
        accessories: [],
        installation: [
          { id: 'ai1', desc: 'أجور لف اقواس', unit: 'حبة', unitPrice: 0 }
        ]
      },
      {
        id: 'ad_fixed', label: 'مع ثابت', keyword: 'مع ثابت',
        aluminum: [
          { id: 'aa3', code: 'G5', desc: 'قاطع سحاب مع ثابت قطاع جولف 10-12 سم سماكة 1.5مم ط6م',   unit: 'بار', barLen: 6000, kgM: 1.782, qty: 1 },
          { id: 'aa4', code: 'G6', desc: 'ادابتر قاطع سحاب مع ثابت قطاع جولف 10-12سم سماكة 1.5 ط6م', unit: 'بار', barLen: 6000, kgM: 0.868, qty: 1 },
          { id: 'aa5', code: 'G7', desc: 'بركلوز قطاع مفصلات 14.5مم سماكة 1.5مم ط6م',                 unit: 'بار', barLen: 6000, kgM: 0.282, qty: 1 },
          { id: 'aa6', code: 'G8', desc: 'قاطع تي 44 سماكة 1.50 ط6م',                                   unit: 'بار', barLen: 6000, kgM: 1.145, qty: 1 }
        ],
        accessories: [], installation: []
      },
      {
        id: 'ad_4fixed', label: '4 درف مع ثابت', keyword: '4 درف مع ثابت',
        aluminum: [
          { id: 'aa7', code: 'G9', desc: 'مشترك 4 درف قطاع جولف 12 سم سحاب سماكة 1.6 مم ط6م', unit: 'بار', barLen: 6000, kgM: 0.342, qty: 1 }
        ],
        accessories: [], installation: []
      },
      {
        id: 'ad_4leaf', label: '4 درف', keyword: '4 درف',
        aluminum: [
          { id: 'aa8', code: 'G10', desc: 'مشترك 4 درف قطاع جولف 12 سم سحاب سماكة 1.6 مم ط6م', unit: 'بار', barLen: 6000, kgM: 0.342, qty: 1 }
        ],
        accessories: [], installation: []
      }
    ];
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================
  var api = {
    DEFAULT_KG_PRICE:     DEFAULT_KG_PRICE,
    FM_SEC_IMG_PREFIX:    FM_SEC_IMG_PREFIX,
    fmDescKey:            fmDescKey,
    fmSecImgKey:          fmSecImgKey,
    fmGetCode:            fmGetCode,
    fmResolveType:        fmResolveType,
    fmCalcBarWeight:      fmCalcBarWeight,
    fmCalcBarPrice:       fmCalcBarPrice,
    computeTypeTotal:     computeTypeTotal,
    getDefaultTypes:      getDefaultTypes,
    getDefaultAddons:     getDefaultAddons
  };

  global.NouRion = global.NouRion || {};
  global.NouRion.FormTypesLogic = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
