/* ============================================================
   NouRion — modules/documents/documents.logic.js
   ------------------------------------------------------------
   Pure logic for the Documents module.
   NO DOM, NO localStorage, NO printing.

   🚫 القاعدة الحمراء:
   كل الحسابات منقولة حرفياً من pm_server/public/js/04-documents.js.
   هذا الـ module يحتوي على حسابات ضريبة قيمة مضافة (VAT) — لا تُمسّ.

   المصادر:
   - VAT computation              → 04-documents.js:343-349 (_buildExtractDoc)
   - Financial distribution       → 04-documents.js:243-263 (_buildClientReportDoc)
   - Watermark color resolver     → 04-documents.js:49
   - Company → logo map           → 04-documents.js:11
   - Period filter                → 04-documents.js:996
   - Measurement items grouping   → 04-documents.js:271 (_buildMeasItemsForExtract)
   ============================================================ */

(function (global) {
  'use strict';

  // ==========================================================
  // 1. VAT_RATE — منقول من 04-documents.js:344-345
  // ==========================================================
  var VAT_RATE = 0.15;

  // ==========================================================
  // 2. computeExtractFinancials — منقول حرفياً من 04-documents.js:340-349
  //    حسابات الضريبة المعقّدة:
  //    - إذا extVal > 0 → نفترض أنه شامل الضريبة، نعكس: base = ext / 1.15
  //    - إذا extVal == 0 → نضيف الضريبة على contractValue
  // ==========================================================
  function computeExtractFinancials(project) {
    if (!project) return { base: 0, vat: 0, total: 0, net: 0, downPayment: 0 };
    var extVal   = parseFloat(project.extractValue)  || 0;
    var contrVal = parseFloat(project.contractValue) || 0;
    var down     = parseFloat(project.downPayment)   || 0;

    var baseExtract  = extVal > 0 ? Math.round(extVal / (1 + VAT_RATE)) : 0;
    var vatAmount    = extVal > 0 ? (extVal - baseExtract) : 0;
    var vatOnContract = Math.round(contrVal * VAT_RATE);

    var base = extVal > 0 ? baseExtract : contrVal;
    var vat  = extVal > 0 ? vatAmount   : vatOnContract;
    var tot  = extVal > 0 ? extVal      : (contrVal + vatOnContract);
    var net  = tot - down;

    return {
      base:        base,
      vat:         vat,
      total:       tot,
      net:         net,
      downPayment: down,
      isFromExtract: extVal > 0
    };
  }

  // ==========================================================
  // 3. computeFinancialDistribution — منقول حرفياً من 04-documents.js:243-263
  //    paid / prod / rem → percentages
  // ==========================================================
  function computeFinancialDistribution(project) {
    if (!project) return { paid: 0, prod: 0, rem: 0, paidPct: '0.0', prodPct: '0.0', remPct: '0.0', total: 0 };

    var extVal   = parseFloat(project.extractValue)  || 0;
    var contrVal = parseFloat(project.contractValue) || 0;
    var down     = parseFloat(project.downPayment)   || 0;
    var progress = parseFloat(project.progress)      || 0;
    var baseVal  = extVal > 0 ? extVal : contrVal;
    var prodVal  = Math.round(baseVal * progress / 100);

    var paid = down;
    var prod = Math.max(0, prodVal - down);
    var rem  = Math.max(0, baseVal - prodVal);
    var total = paid + prod + rem || 1;

    return {
      paid:    paid,
      prod:    prod,
      rem:     rem,
      total:   total,
      paidPct: (paid / total * 100).toFixed(1),
      prodPct: (prod / total * 100).toFixed(1),
      remPct:  (rem  / total * 100).toFixed(1)
    };
  }

  // ==========================================================
  // 4. COMPANY_LOGO_MAP — منقول من 04-documents.js:15-18
  // ==========================================================
  var COMPANY_LOGO_MAP = {
    'السلطان':      'sultan',
    'عالم المعادن': 'metal',
    'الراجحي':      'rajhi',
    'الفوزان':      'fozan'
  };

  function getCompanyLogoKey(companyName) {
    if (!companyName) return 'none';
    return COMPANY_LOGO_MAP[companyName] || 'none';
  }

  // ==========================================================
  // 5. WATERMARK_COLORS — منقول من 04-documents.js:49-63
  // ==========================================================
  var WATERMARK_COLORS = {
    dark:   '#1a1a2e',
    light:  '#c0c8d8',
    red:    '#8b0000',
    blue:   '#1a3a6a',
    auto:   '#b0b8c8'
  };

  function getWatermarkColor(name, customColor) {
    if (name === 'custom') return customColor || '#1e3a5f';
    return WATERMARK_COLORS[name] || WATERMARK_COLORS.auto;
  }

  // ==========================================================
  // 6. resolveWatermarkVisibility — منطق إظهار العلامة المائية
  //    منقول من 04-documents.js:99-110
  // ==========================================================
  function resolveWatermarkVisibility(opts) {
    opts = opts || {};
    var useWatermark   = !!opts.useWatermark;
    var forceWatermark = !!opts.forceWatermark;
    var hideWatermark  = !!opts.hideWatermark;
    if (hideWatermark) return false;
    return useWatermark || forceWatermark;
  }

  // ==========================================================
  // 7. computeMeasItemArea — حساب مساحة بند مع تطبيق zero-zero و min-area
  //    منقول من 04-documents.js:284-297
  // ==========================================================
  function computeMeasItemArea(width, height, opts) {
    opts = opts || {};
    var zz     = !!opts.zeroZero;
    var addW   = parseFloat(opts.addW) || 0;
    var addH   = parseFloat(opts.addH) || 0;
    var minThr = opts.minThreshold != null ? opts.minThreshold : 0;
    var minVal = opts.minValue     != null ? opts.minValue     : minThr;

    var w = parseFloat(width)  || 0;
    var h = parseFloat(height) || 0;
    if (!w || !h) return 0;

    var zzSub = zz ? 8 : 0;
    var Wm = (w - zzSub + addW) / 1000;
    var Hm = (h - zzSub + addH) / 1000;
    var rawArea = Math.round(Wm * Hm * 1000000) / 1000000;

    if (minThr > 0 && rawArea < minThr) return minVal;
    return rawArea;
  }

  // ==========================================================
  // 8. groupMeasurementsByPriceList — تجميع المقاسات حسب القطاع + تطبيق الأسعار
  //    منقول حرفياً من 04-documents.js:271-306 (_buildMeasItemsForExtract)
  //    pure: يأخذ measRows + plRows + opts ويُرجع { items, grandTotal, grandArea }
  // ==========================================================
  function groupMeasurementsByPriceList(measRows, plRows, opts) {
    opts = opts || {};
    var sections = opts.sections || []; // [{name, minArea, minAreaVal}]
    var zz       = !!opts.zeroZero;

    if (!measRows || !measRows.length) return { items: [], grandTotal: 0, grandArea: 0, activeCount: 0 };
    var active = measRows.filter(function (r) { return (+r.width > 0) && (+r.height > 0); });
    if (!active.length) return { items: [], grandTotal: 0, grandArea: 0, activeCount: 0 };

    // Build price map from PL rows (نفس الأصل)
    var prMap = {};
    (plRows || []).forEach(function (r) {
      if (r.sectionName && +r.pricePerM2 > 0) {
        prMap[r.sectionName] = {
          price: +r.pricePerM2,
          addW:  +r.addWidth  || 0,
          addH:  +r.addHeight || 0
        };
      }
    });

    var groups = {};
    active.forEach(function (r) {
      var sn = r.sectionName || 'غير محدد';
      var pr = prMap[r.sectionName];
      var addW = pr ? pr.addW : 0;
      var addH = pr ? pr.addH : 0;
      var secDef = sections.find(function (s) { return s.name === (r.sectionName || ''); }) || null;
      var minThr = secDef && secDef.minArea    != null ? secDef.minArea    : 0;
      var minVal = secDef && secDef.minAreaVal != null ? secDef.minAreaVal : minThr;

      var area = computeMeasItemArea(r.width, r.height, {
        zeroZero:     zz,
        addW:         addW,
        addH:         addH,
        minThreshold: minThr,
        minValue:     minVal
      });

      if (!groups[sn]) {
        groups[sn] = {
          sectionName: sn,
          totalArea:   0,
          count:       0,
          price:       pr ? pr.price : 0,
          addW:        addW,
          addH:        addH
        };
      }
      groups[sn].totalArea = Math.round((groups[sn].totalArea + area) * 1000000) / 1000000;
      groups[sn].count++;
    });

    var items = Object.keys(groups).map(function (k) { return groups[k]; });
    var grandTotal = Math.round(items.reduce(function (s, x) {
      return s + (x.price ? Math.round(x.totalArea * x.price * 100) / 100 : 0);
    }, 0) * 100) / 100;
    var grandArea = Math.round(items.reduce(function (s, x) { return s + x.totalArea; }, 0) * 1000000) / 1000000;

    return { items: items, grandTotal: grandTotal, grandArea: grandArea, activeCount: active.length };
  }

  // ==========================================================
  // 9. filterProjectsByPeriod — منقول حرفياً من 04-documents.js:996-1011
  //    period: 'all' | 'week' | 'month'
  //    options.month: 1-12 (للشهر المحدّد)
  //    options.now:   Date (للاختبار)
  // ==========================================================
  function filterProjectsByPeriod(projects, period, options) {
    if (!projects) return [];
    options = options || {};
    var now = options.now || new Date();
    var selMonth = +options.month || 0;

    if (period === 'week') {
      var weekAgo = new Date(now - 7 * 864e5);
      return projects.filter(function (p) {
        if (!p.contractDate) return false;
        var d = new Date(p.contractDate);
        return d >= weekAgo && d <= now;
      });
    }

    if (period === 'month') {
      if (selMonth) {
        return projects.filter(function (p) {
          if (!p.contractDate) return false;
          var d = new Date(p.contractDate);
          return (d.getMonth() + 1) === selMonth && d.getFullYear() === now.getFullYear();
        });
      }
      var monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      return projects.filter(function (p) {
        if (!p.contractDate) return false;
        var d = new Date(p.contractDate);
        return d >= monthAgo && d <= now;
      });
    }

    return projects;
  }

  // ==========================================================
  // 10. DOC_TYPES — قائمة أنواع المستندات المدعومة
  // ==========================================================
  var DOC_TYPES = [
    { key: 'تقرير العميل',      label: 'تقرير العميل' },
    { key: 'مستخلص',            label: 'مستخلص (مع VAT)' },
    { key: 'استمارة',           label: 'استمارة تصنيع' },
    { key: 'طلب شراء',          label: 'طلب شراء' },
    { key: 'مراحل العمل',       label: 'مراحل العمل' },
    { key: 'المخطط الزمني',     label: 'المخطط الزمني' },
    { key: 'المقاسات',          label: 'المقاسات' },
    { key: 'مؤشرات',            label: 'المؤشرات' }
  ];

  // ==========================================================
  // PUBLIC API
  // ==========================================================
  var api = {
    // Constants
    VAT_RATE:                    VAT_RATE,
    COMPANY_LOGO_MAP:            COMPANY_LOGO_MAP,
    WATERMARK_COLORS:            WATERMARK_COLORS,
    DOC_TYPES:                   DOC_TYPES,
    // Financial calculations
    computeExtractFinancials:    computeExtractFinancials,
    computeFinancialDistribution:computeFinancialDistribution,
    // Helpers
    getCompanyLogoKey:           getCompanyLogoKey,
    getWatermarkColor:           getWatermarkColor,
    resolveWatermarkVisibility:  resolveWatermarkVisibility,
    // Measurement aggregation
    computeMeasItemArea:         computeMeasItemArea,
    groupMeasurementsByPriceList:groupMeasurementsByPriceList,
    // Filters
    filterProjectsByPeriod:      filterProjectsByPeriod
  };

  global.NouRion = global.NouRion || {};
  global.NouRion.DocumentsLogic = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
