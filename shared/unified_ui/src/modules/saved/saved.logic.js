/* ============================================================
   NouRion — modules/saved/saved.logic.js
   ------------------------------------------------------------
   Pure logic for Saved Reports (production + materials).
   NO DOM. NO localStorage. NO XLSX export.

   🚫 القاعدة الحمراء:
   كل الحسابات منقولة حرفياً من pm_server/public/js/06-saved.js.
   الدوال المتعلّقة بالتواريخ (_parseDate / calcDeliveryDate / calcSmartDeliveryDate
   / getDeliveryPauseReasons) موجودة بالفعل في NouRion.ProjectsLogic ولا تُكرَّر هنا.

   المصادر:
   - getRegion                    → 06-saved.js:454
   - migration logic              → 06-saved.js:459 (migrateRegionField)
   - production total aggregation → 06-saved.js:24  (inside saveProductionReport)
   - reportNo generator           → 06-saved.js:22
   ============================================================ */

(function (global) {
  'use strict';

  // Reuse calcStatusFromStage + calcSmartDeliveryDate from ProjectsLogic
  // (both in browser via window.NouRion.ProjectsLogic, or via require in Node)
  var ProjectsLogic = (global.NouRion && global.NouRion.ProjectsLogic) || null;
  if (!ProjectsLogic && typeof require !== 'undefined') {
    try { ProjectsLogic = require('../projects/projects.logic.js'); } catch (e) { /* ignore */ }
  }

  // ==========================================================
  // 1. getRegion — منقولة حرفياً من 06-saved.js:454
  //    تتعامل مع مفتاح قديم 'المناطق' ومفتاح جديد 'region'
  // ==========================================================
  function getRegion(p) {
    if (!p) return '';
    return p.region || p['المناطق'] || '';
  }

  // ==========================================================
  // 2. migrateProjectFields — نسخة pure من migrateRegionField
  //    منقولة من 06-saved.js:459
  //    الأصل كان يعمل mutation على localStorage مباشرة؛
  //    هذه النسخة تأخذ project → تُرجِع {project, changed, changes[]}
  //    السلوك التعديلي هو نفسه بالضبط:
  //    - ينقل 'المناطق' → region (إذا region غير موجود)
  //    - ينقل 'رقم العقد' → contractNo (إذا contractNo غير موجود)
  //    - يحسب status من stage (إذا status غير موجود)
  //    - يحسب deliveryDate ذكياً (إذا contractDuration + (approvalDate || siteReadyDate))
  // ==========================================================
  function migrateProjectFields(project, opts) {
    if (!project) return { project: project, changed: false, changes: [] };

    // Shallow clone so caller's object is not mutated unexpectedly
    var p = {};
    for (var k in project) p[k] = project[k];
    var changed = false;
    var changes = [];

    // 1. Region key migration
    if (p['المناطق'] !== undefined) {
      if (!p.region) {
        p.region = p['المناطق'];
        changes.push('region ← المناطق');
      }
      delete p['المناطق'];
      changed = true;
    }

    // 2. Contract number key migration
    if (p['رقم العقد'] !== undefined && !p.contractNo) {
      p.contractNo = p['رقم العقد'];
      delete p['رقم العقد'];
      changed = true;
      changes.push('contractNo ← رقم العقد');
    }

    // 3. Auto-set status from stage if missing
    if (!p.status && p.stage && ProjectsLogic) {
      p.status = ProjectsLogic.calcStatusFromStage(p.stage);
      changed = true;
      changes.push('status (from stage)');
    }

    // 4. Auto-calc smart delivery date (same condition as original)
    if (p.contractDuration && (p.approvalDate || p.siteReadyDate) && ProjectsLogic) {
      var smart = ProjectsLogic.calcSmartDeliveryDate(p, opts);
      if (smart && smart !== p.deliveryDate) {
        p.deliveryDate = smart;
        changed = true;
        changes.push('deliveryDate (smart)');
      }
    }

    return { project: p, changed: changed, changes: changes };
  }

  // ==========================================================
  // 3. migrateProjectList — يُطبّق migration على قائمة كاملة
  // ==========================================================
  function migrateProjectList(projects, opts) {
    if (!projects || !projects.length) return { projects: projects || [], changedCount: 0 };
    var out = [];
    var changedCount = 0;
    for (var i = 0; i < projects.length; i++) {
      var r = migrateProjectFields(projects[i], opts);
      out.push(r.project);
      if (r.changed) changedCount++;
    }
    return { projects: out, changedCount: changedCount };
  }

  // ==========================================================
  // 4. findPreviousLogEntry — آخر entry قبل (year, month)
  //    مستخرج من logic داخل saveProductionReport (06-saved.js:30)
  // ==========================================================
  function findPreviousLogEntry(log, year, month) {
    if (!log || !log.length) return null;
    var prev = log.filter(function (e) {
      return (e.year < year) || (e.year === year && e.month < month);
    }).sort(function (a, b) {
      return b.year - a.year || b.month - a.month;
    })[0];
    return prev || null;
  }

  // ==========================================================
  // 5. findLogEntry — البحث عن entry محدَّد
  // ==========================================================
  function findLogEntry(log, year, month) {
    if (!log || !log.length) return null;
    for (var i = 0; i < log.length; i++) {
      if (log[i].year === year && log[i].month === month) return log[i];
    }
    return null;
  }

  // ==========================================================
  // 6. computeProductionDelta — حساب delta progress للمشروع
  //    منقول حرفياً من 06-saved.js:24-34
  //    يُرجع { delta, baseValue, prodValue, hasEntry, thisProgress, prevProgress }
  // ==========================================================
  function computeProductionDelta(project, year, month) {
    var log = project.productionLog || [];
    var thisE = findLogEntry(log, year, month);

    if (!thisE) {
      return {
        hasEntry:     false,
        delta:        0,
        baseValue:    parseFloat(project.extractValue) || parseFloat(project.contractValue) || 0,
        prodValue:    0,
        thisProgress: 0,
        prevProgress: 0
      };
    }

    var prevE = findPreviousLogEntry(log, year, month);
    var thisProgress = thisE.progress || 0;
    var prevProgress = prevE ? (prevE.progress || 0) : 0;
    var delta = Math.max(0, thisProgress - prevProgress);
    var baseValue = parseFloat(project.extractValue) || parseFloat(project.contractValue) || 0;
    var prodValue = Math.round(baseValue * delta / 100);

    return {
      hasEntry:     true,
      delta:        delta,
      baseValue:    baseValue,
      prodValue:    prodValue,
      thisProgress: thisProgress,
      prevProgress: prevProgress
    };
  }

  // ==========================================================
  // 7. computeMonthlyProduction — إجمالي إنتاج قائمة مشاريع في شهر
  //    نفس المنطق في saveProductionReport (06-saved.js:23-34)
  // ==========================================================
  function computeMonthlyProduction(projects, year, month) {
    if (!projects) return { total: 0, rows: [], count: 0 };
    var total = 0;
    var rows = [];
    for (var i = 0; i < projects.length; i++) {
      var p = projects[i];
      var d = computeProductionDelta(p, year, month);
      if (!d.hasEntry) continue;
      total += d.prodValue;
      rows.push({
        id:           p.id,
        name:         p.name || '',
        company:      p.company || '',
        region:       getRegion(p),
        baseVal:      d.baseValue,
        prevProgress: d.prevProgress,
        thisProgress: d.thisProgress,
        delta:        d.delta,
        prodValue:    d.prodValue
      });
    }
    return { total: total, rows: rows, count: rows.length };
  }

  // ==========================================================
  // 8. computeAllMonths — aggregate لكل الأشهر الموجودة في أي productionLog
  // ==========================================================
  function computeAllMonths(projects) {
    if (!projects) return [];
    var monthsSet = {};
    for (var i = 0; i < projects.length; i++) {
      var log = projects[i].productionLog || [];
      for (var j = 0; j < log.length; j++) {
        var key = log[j].year + '-' + log[j].month;
        monthsSet[key] = { year: log[j].year, month: log[j].month };
      }
    }
    var result = [];
    for (var k in monthsSet) {
      var m = monthsSet[k];
      var r = computeMonthlyProduction(projects, m.year, m.month);
      result.push({ year: m.year, month: m.month, total: r.total, count: r.count });
    }
    // sort newest first
    result.sort(function (a, b) { return b.year - a.year || b.month - a.month; });
    return result;
  }

  // ==========================================================
  // 9. generateReportNo — توليد رقم تقرير
  //    منقول حرفياً من 06-saved.js:22
  // ==========================================================
  function generateReportNo(date) {
    var d = date || new Date();
    return 'PR-' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  // ==========================================================
  // 10. validateProductionLog — تحقّق من سلامة productionLog
  //     (ليس في الأصل — utility مفيد للـ view وللاختبار)
  // ==========================================================
  function validateProductionLog(log) {
    if (!Array.isArray(log)) return { valid: false, errors: ['not an array'] };
    var errors = [];
    for (var i = 0; i < log.length; i++) {
      var e = log[i];
      if (typeof e.year !== 'number') errors.push('row ' + i + ': year not number');
      if (typeof e.month !== 'number') errors.push('row ' + i + ': month not number');
      if (e.month < 1 || e.month > 12) errors.push('row ' + i + ': month out of range');
      if (e.progress != null && (e.progress < 0 || e.progress > 100)) errors.push('row ' + i + ': progress out of range');
    }
    return { valid: errors.length === 0, errors: errors };
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================
  var api = {
    getRegion:              getRegion,
    migrateProjectFields:   migrateProjectFields,
    migrateProjectList:     migrateProjectList,
    findLogEntry:           findLogEntry,
    findPreviousLogEntry:   findPreviousLogEntry,
    computeProductionDelta: computeProductionDelta,
    computeMonthlyProduction: computeMonthlyProduction,
    computeAllMonths:       computeAllMonths,
    generateReportNo:       generateReportNo,
    validateProductionLog:  validateProductionLog
  };

  global.NouRion = global.NouRion || {};
  global.NouRion.SavedLogic = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
