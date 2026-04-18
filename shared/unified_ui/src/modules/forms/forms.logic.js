/* ============================================================
   NouRion — modules/forms/forms.logic.js
   ------------------------------------------------------------
   Pure logic for the Manufacturing Form module.
   NO DOM, NO localStorage.

   🚫 القاعدة الحمراء:
   كل الحسابات منقولة حرفياً من pm_server/public/js/11-forms.js.
   هذا الـ module يحتوي على معادلات مالية حرجة — لا تُمسّ أرقام أو شروط.

   المصادر:
   - fmBuildFormData          → 11-forms.js:282
   - fmSumRows                → 11-forms.js:358
   - fmGetExtractValues       → 11-forms.js:362
   - fmCalcProdWorkers        → 11-forms.js:563
   - install allocations      → 11-forms.js:570-612 (fmBuildInstall)
   - update rates             → 11-forms.js:721-760 (fmUpdAutoRates)
   - project study            → 11-forms.js:796-810 (fmCalcStudy)
   ============================================================ */

(function (global) {
  'use strict';

  // Reuse from FormTypesLogic for bar weight/price
  var FormTypesLogic = (global.NouRion && global.NouRion.FormTypesLogic) || null;
  if (!FormTypesLogic && typeof require !== 'undefined') {
    try { FormTypesLogic = require('../form-types/form-types.logic.js'); } catch (e) {}
  }

  // ==========================================================
  // 1. CONSTANTS — منقولة حرفياً من 11-forms.js
  // ==========================================================
  var DEFAULT_RATES = {
    admin:             10,  // المصاريف الإدارية %
    sales:             10,  // المبيعات %
    company:           20,  // الشركة %
    wagesPct:          10,  // أجور العمال من المستخلص %
    fixedPct:           5   // مصارف ثابتة من المستخلص %
  };

  var DEFAULT_INSTALL_WORKERS    = 5;   // فرقة التركيب ثابتة 5 عمال
  var DEFAULT_MAX_INSTALL_DAYS   = 8;   // حد أقصى 8 أيام تركيب
  var DEFAULT_MONTHLY_SALARY     = 2500;
  var DEFAULT_WORK_DAYS_PER_MONTH= 26;
  var VAT_RATE                   = 0.15; // نفس documents.logic.js

  // ==========================================================
  // 2. fmSumRows — منقولة حرفياً من 11-forms.js:358
  //    تجمع quantity × unitPrice لكل الصفوف (ليست مجموعات)
  // ==========================================================
  function sumRows(rows) {
    if (!rows) return 0;
    return rows.reduce(function (s, r) {
      if (r.isGroup) return s;
      var q = parseFloat(r.quantity)  || 0;
      var p = parseFloat(r.unitPrice) || 0;
      return s + (q * p);
    }, 0);
  }

  // ==========================================================
  // 3. computeExtractValues — منقولة حرفياً من 11-forms.js:362-391
  //    تُرجع { before, after } حيث:
  //    - before = بدون VAT
  //    - after  = مع VAT (×1.15)
  //    المصادر بترتيب الأولوية:
  //    1. project.extractValue (مخزَّن شامل 15%)
  //    2. plRows (عرض الأسعار)
  //    3. fallback: contract × 0.9 و × 1.15
  // ==========================================================
  function computeExtractValues(project, plRows) {
    var proj   = project || {};
    var contrV = parseFloat(proj.contractValue) || 0;

    // 1. storedExt (من بيانات المشروع)
    var storedExt = parseFloat(proj.extractValue) || 0;
    if (storedExt > 0) {
      return {
        before: Math.round(storedExt / (1 + VAT_RATE) * 100) / 100,
        after:  storedExt,
        source: 'stored'
      };
    }

    // 2. plRows
    var plTotal = (plRows || []).reduce(function (s, r) {
      var t = parseFloat(r.totalBefore || r.totalValue || r.total || 0) || 0;
      if (t > 0) return s + t;
      // fallback: count × pricePerM2 | pricePerUnit | unitPrice
      var cnt  = parseFloat(r.count || r.quantity || 1) || 1;
      var prc  = parseFloat(r.pricePerM2 || r.pricePerUnit || r.unitPrice || 0) || 0;
      var area = parseFloat(r.area || r.totalArea || 0) || 0;
      return s + (area > 0 ? area * prc : cnt * prc);
    }, 0);

    if (plTotal > 0) {
      return {
        before: plTotal,
        after:  Math.round(plTotal * (1 + VAT_RATE) * 100) / 100,
        source: 'priceList'
      };
    }

    // 3. fallback
    return {
      before: contrV * 0.9,
      after:  contrV * (1 + VAT_RATE),
      source: 'fallback'
    };
  }

  // ==========================================================
  // 4. computeProdWorkers — منقولة حرفياً من 11-forms.js:563-568
  //    جدول عمال الإنتاج حسب قيمة العقد
  // ==========================================================
  function computeProdWorkers(contractValue) {
    var v = parseFloat(contractValue) || 0;
    if (v < 50000)  return 3;
    if (v < 150000) return 5;
    if (v < 300000) return 8;
    return 12;
  }

  // ==========================================================
  // 5. computeInstallAllocations — منقولة حرفياً من 11-forms.js:578-601
  //    توزيع الأجور بين عمال الإنتاج وفرقة التركيب
  //    يُرجع: { dailyRate, wagesAmt, fixedAmt, wages1Amt, wages2Amt,
  //             prodWorkers, prodDays, installWorkers, installDays,
  //             totalAuto }
  // ==========================================================
  function computeInstallAllocations(project, extBase, rates) {
    var proj = project || {};
    var contrV = parseFloat(proj.contractValue) || 0;
    var r = rates || {};

    var monthlySal = parseFloat(r.monthlySal != null ? r.monthlySal : DEFAULT_MONTHLY_SALARY);
    var workDays   = parseFloat(r.workDays   != null ? r.workDays   : DEFAULT_WORK_DAYS_PER_MONTH);
    var dailyRate  = Math.round(monthlySal / workDays * 100) / 100;

    var wagesPct = parseFloat(r.wagesPct != null ? r.wagesPct : DEFAULT_RATES.wagesPct);
    var fixedPct = parseFloat(r.fixedPct != null ? r.fixedPct : DEFAULT_RATES.fixedPct);

    var wagesAmt = (extBase || 0) * wagesPct / 100;
    var fixedAmt = (extBase || 0) * fixedPct / 100;

    var INSTALL_WORKERS  = DEFAULT_INSTALL_WORKERS;
    var MAX_INSTALL_DAYS = DEFAULT_MAX_INSTALL_DAYS;

    // أيام التركيب = حدّاها 8 أيام، تُحسب كـ ceil((wagesAmt / 2) / (5 × dailyRate))
    var installDays = 0;
    if (wagesAmt > 0 && dailyRate > 0) {
      installDays = Math.min(MAX_INSTALL_DAYS, Math.ceil((wagesAmt / 2) / (INSTALL_WORKERS * dailyRate)));
    }
    var wages2Amt = installDays * INSTALL_WORKERS * dailyRate;

    // أجور الإنتاج = الباقي
    var wages1Amt = Math.max(0, wagesAmt - wages2Amt);

    var autoProdWorkers = computeProdWorkers(contrV);
    var prodWorkers     = parseFloat(r.manualProdWorkers) || autoProdWorkers;
    var prodDays = 0;
    if (wages1Amt > 0 && dailyRate > 0) {
      prodDays = Math.ceil(wages1Amt / (prodWorkers * dailyRate));
    }

    return {
      monthlySal:      monthlySal,
      workDays:        workDays,
      dailyRate:       dailyRate,
      wagesPct:        wagesPct,
      fixedPct:        fixedPct,
      wagesAmt:        wagesAmt,
      fixedAmt:        fixedAmt,
      wages1Amt:       wages1Amt,
      wages2Amt:       wages2Amt,
      installWorkers:  INSTALL_WORKERS,
      installDays:     installDays,
      maxInstallDays:  MAX_INSTALL_DAYS,
      installAtMax:    installDays >= MAX_INSTALL_DAYS,
      autoProdWorkers: autoProdWorkers,
      prodWorkers:     prodWorkers,
      prodDays:        prodDays,
      totalAuto:       wagesAmt + fixedAmt
    };
  }

  // ==========================================================
  // 6. buildAutoWagesAndFixed — يُنتج صفوف fd.wages + fd.fixed
  //    منقول من 11-forms.js:605-612 (fd.wages = [...])
  // ==========================================================
  function buildAutoWagesAndFixed(allocations, extBase) {
    var a = allocations || {};
    return {
      wages: [
        { id: 'w1', desc: 'عمال الإنتاج', unit: 'يوم',
          quantity:  a.prodDays,
          unitPrice: Math.round(a.prodWorkers * a.dailyRate * 100) / 100,
          _auto: true },
        { id: 'w2', desc: 'عمال التركيب', unit: 'يوم',
          quantity:  a.installDays,
          unitPrice: Math.round(a.installWorkers * a.dailyRate * 100) / 100,
          _auto: true }
      ],
      fixed: [
        { id: 'f1', desc: 'مصارف ثابتة للمصنع', unit: '%',
          quantity:  a.fixedPct,
          unitPrice: (extBase || 0) / 100,
          _auto: true }
      ]
    };
  }

  // ==========================================================
  // 7. computeProjectStudy — منقولة حرفياً من 11-forms.js:796-810
  //    تحسب كل بنود دراسة المشروع:
  //    - إجماليات المواد والأجور
  //    - المصاريف الإدارية
  //    - النسب من المستخلص
  //    - النسبة الإجمالية
  // ==========================================================
  function computeProjectStudy(formData, project, plRows) {
    var fd = formData || {};
    var proj = project || {};
    var rates = fd.rates || DEFAULT_RATES;

    var tA  = sumRows(fd.aluminum);
    var tAc = sumRows(fd.accessories);
    var tM  = sumRows(fd.installation);
    var tW  = sumRows(fd.wages);
    var tF  = sumRows(fd.fixed);
    var tMat = tA + tAc + tM;

    var contrV = parseFloat(proj.contractValue) || 0;
    var extractValues = computeExtractValues(proj, plRows);
    var extB = extractValues.before;

    var adminPct   = parseFloat(rates.admin)   || 0;
    var salesPct   = parseFloat(rates.sales)   || 0;
    var companyPct = parseFloat(rates.company) || 0;

    var adminAmt = tMat * adminPct / 100;
    var grand    = tMat + tW + tF + adminAmt;

    var pMat = extB > 0 ? (tMat / extB * 100) : 0;
    var pW   = extB > 0 ? (tW   / extB * 100) : 0;
    var pF   = extB > 0 ? (tF   / extB * 100) : 0;

    var pTot  = pMat + adminPct + pW + pF;
    var pFull = pTot + salesPct + companyPct;

    // margin = المستخلص − كل التكاليف
    var totalCosts = grand;
    var margin     = extB - totalCosts;
    var marginPct  = extB > 0 ? (margin / extB * 100) : 0;

    return {
      // Totals
      totalAluminum:     tA,
      totalAccessories:  tAc,
      totalMaterials:    tM,
      totalMat:          tMat,
      totalWages:        tW,
      totalFixed:        tF,
      adminPct:          adminPct,
      adminAmt:          adminAmt,
      grandTotal:        grand,
      // Ratios
      pctMat:            pMat,
      pctWages:          pW,
      pctFixed:          pF,
      pctTotal:          pTot,
      pctFull:           pFull,
      // Context
      contractValue:     contrV,
      extractBefore:     extB,
      extractAfter:      extractValues.after,
      extractSource:     extractValues.source,
      // Margin
      margin:            margin,
      marginPct:         marginPct
    };
  }

  // ==========================================================
  // 8. buildFormData — منقولة حرفياً من 11-forms.js:282-356
  //    تبني formData من types + priceList rows
  //    يدمج الأنواع النشطة في عرض الأسعار (أو كل الأنواع لو ما في PL)
  // ==========================================================
  function buildFormData(project, plRows, allTypes, kgPrice) {
    var proj = project || {};
    var plR  = plRows || [];
    var types = allTypes || [];
    if (!FormTypesLogic) throw new Error('FormTypesLogic required for buildFormData');

    // 1. أسماء الأنواع النشطة
    var activeNames = [];
    var seen = {};
    plR.forEach(function (r) {
      if (r.sectionName && !seen[r.sectionName]) {
        seen[r.sectionName] = true;
        activeNames.push(r.sectionName);
      }
    });
    var namesToUse = activeNames.length > 0 ? activeNames : types.map(function (t) { return t.name; });

    // 2. دمج الألمنيوم — مفتاح = الرمز أو الوصف
    var alumMap = {};
    var alumOrder = [];
    namesToUse.forEach(function (name) {
      var typeObj = types.find(function (t) { return t.name === name; });
      if (!typeObj) return;
      var plMatch = plR.find(function (r) { return r.sectionName === name; });
      var typeQty = plMatch ? (plMatch.count || 1) : 1;
      (typeObj.aluminum || []).forEach(function (sec) {
        var secQty = ((parseFloat(sec.qty) || 1)) * typeQty;
        var key = (sec.code || '').trim() || (sec.desc || '').trim();
        if (!key) return;
        if (!alumMap[key]) {
          alumMap[key] = Object.assign({}, sec, {
            quantity:    0,
            unitPrice:   FormTypesLogic.fmCalcBarPrice(sec.barLen, sec.kgM, kgPrice),
            barWeightKg: FormTypesLogic.fmCalcBarWeight(sec.barLen, sec.kgM)
          });
          alumOrder.push(key);
        }
        alumMap[key].quantity += secQty;
      });
    });

    // 3. دمج الأكسسوارات — مفتاح = الوصف
    var accMap = {};
    var accOrder = [];
    namesToUse.forEach(function (name) {
      var typeObj = types.find(function (t) { return t.name === name; });
      if (!typeObj) return;
      var plMatch = plR.find(function (r) { return r.sectionName === name; });
      var typeQty = plMatch ? (plMatch.count || 1) : 1;
      (typeObj.accessories || []).forEach(function (acc) {
        var accQty = ((parseFloat(acc.qty) || 1)) * typeQty;
        var key = (acc.desc || '').trim();
        if (!key) return;
        if (!accMap[key]) {
          accMap[key] = Object.assign({}, acc, {
            quantity:  0,
            unitPrice: parseFloat(acc.unitPrice) || 0
          });
          accOrder.push(key);
        }
        accMap[key].quantity += accQty;
        if (!accMap[key].unitPrice && parseFloat(acc.unitPrice)) {
          accMap[key].unitPrice = parseFloat(acc.unitPrice);
        }
      });
    });

    // 4. دمج التركيب — بدون تكرار
    var instMap = {};
    var instOrder = [];
    namesToUse.forEach(function (name) {
      var typeObj = types.find(function (t) { return t.name === name; });
      if (!typeObj) return;
      (typeObj.installation || []).forEach(function (it) {
        var key = (it.desc || '').trim();
        if (!key || instMap[key]) return;
        instMap[key] = Object.assign({}, it, { quantity: it.quantity || 1 });
        instOrder.push(key);
      });
    });

    return {
      aluminum:     alumOrder.map(function (k) { return alumMap[k]; }),
      accessories:  accOrder.map(function (k) { return accMap[k]; }),
      installation: instOrder.map(function (k) { return instMap[k]; }),
      wages:        [],
      fixed:        [],
      rates:        Object.assign({}, DEFAULT_RATES)
    };
  }

  // ==========================================================
  // 9. mergeManualEdits — منقول من 11-forms.js:250
  //    دمج بيانات محفوظة مع بيانات جديدة (الحفاظ على التعديلات اليدوية)
  // ==========================================================
  function mergeManualEdits(fresh, saved) {
    if (!saved) return fresh;
    if (!fresh) return saved;

    var out = {
      aluminum:     (fresh.aluminum     || []).slice(),
      accessories:  (fresh.accessories  || []).slice(),
      installation: (fresh.installation || []).slice(),
      wages:        (saved.wages        || []).slice(),
      fixed:        (saved.fixed        || []).slice(),
      rates:        Object.assign({}, fresh.rates || {}, saved.rates || {})
    };

    // For aluminum/accessories: إذا كان في الـ saved صف بنفس المفتاح، نحتفظ بالتعديلات اليدوية (unitPrice/notes)
    function mergeList(freshList, savedList, keyFn) {
      var savedMap = {};
      (savedList || []).forEach(function (r) { savedMap[keyFn(r)] = r; });
      return (freshList || []).map(function (r) {
        var k = keyFn(r);
        if (savedMap[k]) {
          // نحتفظ بالسعر اليدوي وكل حقل كان معدّلاً
          return Object.assign({}, r, {
            unitPrice: savedMap[k].unitPrice != null ? savedMap[k].unitPrice : r.unitPrice,
            notes:     savedMap[k].notes != null ? savedMap[k].notes : r.notes
          });
        }
        return r;
      });
    }

    out.aluminum    = mergeList(fresh.aluminum,    saved.aluminum,    function (r) { return (r.code || r.desc || '').trim(); });
    out.accessories = mergeList(fresh.accessories, saved.accessories, function (r) { return (r.desc || '').trim(); });

    return out;
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================
  var api = {
    // Constants
    DEFAULT_RATES:              DEFAULT_RATES,
    DEFAULT_INSTALL_WORKERS:    DEFAULT_INSTALL_WORKERS,
    DEFAULT_MAX_INSTALL_DAYS:   DEFAULT_MAX_INSTALL_DAYS,
    DEFAULT_MONTHLY_SALARY:     DEFAULT_MONTHLY_SALARY,
    DEFAULT_WORK_DAYS_PER_MONTH:DEFAULT_WORK_DAYS_PER_MONTH,
    VAT_RATE:                   VAT_RATE,
    // Core calculations
    sumRows:                    sumRows,
    computeExtractValues:       computeExtractValues,
    computeProdWorkers:         computeProdWorkers,
    computeInstallAllocations:  computeInstallAllocations,
    buildAutoWagesAndFixed:     buildAutoWagesAndFixed,
    computeProjectStudy:        computeProjectStudy,
    buildFormData:              buildFormData,
    mergeManualEdits:           mergeManualEdits
  };

  global.NouRion = global.NouRion || {};
  global.NouRion.FormsLogic = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
