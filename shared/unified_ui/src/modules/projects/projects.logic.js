/* ============================================================
   NouRion — modules/projects/projects.logic.js
   ------------------------------------------------------------
   Pure business logic for the Projects module.
   NO DOM. NO localStorage direct access. NO side effects.

   🚫 القاعدة الحمراء:
   كل الدوال هنا منقولة *حرفياً* من مصدرها الأصلي في pm_server،
   ولم يُغيَّر أي شرط أو رقم أو شرط منطقي.
   تغليفها فقط داخل namespace يدعى NouRion.ProjectsLogic.

   المصادر:
   - calcStatusFromStage       → pm_server/public/js/01-config.js:133
   - calcDeliveryDate          → pm_server/public/js/06-saved.js:529
   - calcSmartDeliveryDate     → pm_server/public/js/06-saved.js:551
   - getDeliveryPauseReasons   → pm_server/public/js/06-saved.js:574
   - calculateProgressFromStage→ pm_server/public/js/03-projects.js:514
   - _parseDate                → pm_server/public/js/06-saved.js:493
   ============================================================ */

(function (global) {
  'use strict';

  // ==========================================================
  // 1. Default statuses (منقولة من 01-config.js:120)
  // ==========================================================
  var DEFAULT_STATUSES = [
    'توقيع العقد',
    'جاري',
    'تأخير من العميل',
    'تأخير من الشركة',
    'تركيب',
    'موقوف - انتظار سداد العميل',
    'موقوف',
    'تم التسليم',
    'ملغى'
  ];

  // ==========================================================
  // 2. calcStatusFromStage — Auto-calculate status from stage
  //    منقولة حرفياً من 01-config.js:133
  // ==========================================================
  function calcStatusFromStage(stageName) {
    if (!stageName) return 'توقيع العقد';
    var s = stageName.trim();
    // متوقف - سداد
    if (s.includes('سداد الدفعة') || s.includes('سداد')) return 'موقوف - انتظار سداد العميل';
    // تأخير شركة - طلب مواد/زجاج
    if (s.includes('طلب الزجاج') || s.includes('طلب الخامات') || s.includes('طلب المواد')) return 'تأخير من الشركة';
    // تركيب
    if (s.includes('أمر تركيب') || s.includes('امر تركيب') || s.includes('توريد') || s.includes('بدأ التركيب') || s.includes('تركيب الزجاج') || s.includes('تشطيب') || s.includes('اختبار')) return 'تركيب';
    // تسليم
    if (s.includes('تسليم الموقع')) return 'تم التسليم';
    // جاري - من رفع مقاسات إلى اصدار مستخلص
    var jaariStages = ['رفع مقاسات', 'عمل مخططات', 'اعتماد المخططات', 'اعداد استمارة', 'طلب الخامات', 'دهان الخامات', 'البدء بالتصنيع', 'البدا بالتصنيع', 'اصدار مستخلص', 'استلام الزجاج', 'استلام'];
    if (jaariStages.some(function (j) { return s.includes(j); })) return 'جاري';
    // default
    return 'جاري';
  }

  // ==========================================================
  // 3. _parseDate — منقولة حرفياً من 06-saved.js:493
  //    يتعامل مع عدّة صيغ (ISO, D-M-Y, Excel serial)
  // ==========================================================
  function _parseDate(str) {
    if (!str) return null;
    var date;
    if (String(str).match(/^\d{4}-\d{2}-\d{2}$/)) {
      date = new Date(str);
    } else if (String(str).match(/\d+-\d+-\d+/)) {
      var parts = String(str).split('-');
      if (parts[0].length === 4) date = new Date(parts[0], parts[1] - 1, parts[2]);
      else date = new Date(parts[2], parts[1] - 1, parts[0]);
    } else if (!isNaN(str)) {
      date = new Date((parseInt(str, 10) - 25569) * 86400000);
    } else {
      return null;
    }
    return isNaN(date.getTime()) ? null : date;
  }

  // ==========================================================
  // 4. calcDeliveryDate — منقولة حرفياً من 06-saved.js:529
  //    يضيف durationDays إلى startDate متجاوزاً الجمعات والعطل
  //    ------------------------------------------------------
  //    NOTE: في النسخة الأصلية كانت تقرأ من localStorage.
  //    هنا نحقنها كـ parameters اختيارية — هذا تحسّن هيكلي لا يغيّر الدلالة.
  //    الافتراضي نفس الأصل: skipFridays=true, skipHolidays=true, holidays=[].
  // ==========================================================
  function calcDeliveryDate(startDateStr, durationDays, opts) {
    if (!startDateStr || !durationDays) return '';
    var date = _parseDate(startDateStr);
    if (!date) return '';

    opts = opts || {};
    var skipFridays = opts.skipFridays !== false; // default true
    var skipHolidays = opts.skipHolidays !== false; // default true
    var holidays = new Set(opts.holidays || []);

    var added = 0;
    while (added < durationDays) {
      date.setDate(date.getDate() + 1);
      var dayStr = date.toISOString().slice(0, 10);
      if (skipFridays && date.getDay() === 5) continue;
      if (skipHolidays && holidays.has(dayStr)) continue;
      added++;
    }
    return date.toISOString().slice(0, 10);
  }

  // ==========================================================
  // 5. calcSmartDeliveryDate — منقولة حرفياً من 06-saved.js:551
  //    يختار أحدث تاريخ بين (approvalDate, siteReadyDate) ثم يضيف contractDuration
  // ==========================================================
  function calcSmartDeliveryDate(project, opts) {
    var dur = parseInt(project.contractDuration, 10);
    if (!dur) return '';

    var approval = _parseDate(project.approvalDate);
    var siteReady = _parseDate(project.siteReadyDate);

    var startDate = null;
    if (approval && siteReady) {
      startDate = approval > siteReady ? approval : siteReady;
    } else if (approval) {
      startDate = approval;
    } else if (siteReady) {
      startDate = siteReady;
    } else {
      return '';
    }

    return calcDeliveryDate(startDate.toISOString().slice(0, 10), dur, opts);
  }

  // ==========================================================
  // 6. getDeliveryPauseReasons — منقولة حرفياً من 06-saved.js:574
  //    تُرجع قائمة أسباب تعليق حساب موعد التسليم
  // ==========================================================
  function getDeliveryPauseReasons(project) {
    var reasons = [];
    if (!project.siteReadyDate) reasons.push('لم يتم تحديد تاريخ جاهزية الموقع');
    if (!project.approvalDate) reasons.push('لم يتم اعتماد المخططات');
    if (!project.secondPaymentDate) reasons.push('لم يتم سداد الدفعة الثانية');
    return reasons;
  }

  // ==========================================================
  // 7. calculateProgressFromStage — منقولة حرفياً من 03-projects.js:514
  //    يحسب % الإنجاز بجمع pct كل المراحل حتى المرحلة الحالية
  // ==========================================================
  function calculateProgressFromStage(stageName, stages) {
    if (!stageName) return 0;
    var total = 0;
    for (var i = 0; i < stages.length; i++) {
      total += (stages[i].pct || 0);
      if (stages[i].name === stageName) break;
    }
    return Math.min(100, total);
  }

  // ==========================================================
  // 8. حسابات مالية للبطاقات (مستخرجة من _buildProjectCard في 03-projects.js:129)
  //    هذه ليست دالة واحدة في الأصل — بل منطق مضمّن في رسم الـ card.
  //    نفصّلها هنا بنفس الحسابات تماماً، بدون تغيير أي رقم.
  // ==========================================================
  function computeProjectFinancials(p) {
    var extVal   = parseFloat(p.extractValue)  || 0;
    var contrVal = parseFloat(p.contractValue) || 0;
    var down     = parseFloat(p.downPayment)   || 0;
    // baseVal: الأصل يستخدم extVal إذا كان > 0، وإلا contrVal (راجع السطر 134-135 في 03-projects.js)
    var baseVal  = extVal > 0 ? extVal : contrVal;
    var progress = parseFloat(p.progress) || 0;
    var prodVal  = Math.round(baseVal * (progress / 100));
    var remaining = Math.max(0, baseVal - down - prodVal);

    return {
      extractValue:    extVal,
      contractValue:   contrVal,
      downPayment:     down,
      baseValue:       baseVal,
      progress:        progress,
      productionValue: prodVal,
      remaining:       remaining
    };
  }

  // ==========================================================
  // 9. computeProjectSummary — aggregate لكل المشاريع
  //    المنطق الأصلي في renderStats (03-projects.js:89)
  // ==========================================================
  function computeProjectSummary(projects) {
    var active = 0, install = 0, done = 0;
    var totalContract = 0, totalProduction = 0;

    for (var i = 0; i < projects.length; i++) {
      var p = projects[i];
      var status = calcStatusFromStage(p.stage);
      if (status === 'جاري') active++;
      else if (status === 'تركيب') install++;
      else if (status === 'تم التسليم') done++;

      var fin = computeProjectFinancials(p);
      totalContract += fin.baseValue;
      totalProduction += fin.productionValue;
    }

    return {
      total:            projects.length,
      active:           active,
      installing:       install,
      delivered:        done,
      totalContract:    totalContract,
      totalProduction:  totalProduction
    };
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================
  var api = {
    DEFAULT_STATUSES:          DEFAULT_STATUSES,
    calcStatusFromStage:       calcStatusFromStage,
    calcDeliveryDate:          calcDeliveryDate,
    calcSmartDeliveryDate:     calcSmartDeliveryDate,
    getDeliveryPauseReasons:   getDeliveryPauseReasons,
    calculateProgressFromStage:calculateProgressFromStage,
    computeProjectFinancials:  computeProjectFinancials,
    computeProjectSummary:     computeProjectSummary,
    _parseDate:                _parseDate    // exposed for testing only
  };

  // Attach to namespace
  global.NouRion = global.NouRion || {};
  global.NouRion.ProjectsLogic = api;

  // CommonJS / Node export (for testing via node)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
