/* ============================================================
   NouRion — modules/reports/reports.logic.js
   ------------------------------------------------------------
   Pure logic for the Reports module.
   NO DOM, NO Chart.js, NO localStorage.

   🚫 القاعدة الحمراء:
   كل الحسابات منقولة حرفياً من pm_server/public/js/05-reports.js.

   المصادر:
   - _userFilteredProjects     → 05-reports.js:2
   - status counts             → 05-reports.js:48-53
   - statusColors              → 05-reports.js:66
   - breakdown by company      → 05-reports.js:122-164
   - materials totals          → 05-reports.js:551-561 (buildMaterialsTable)
   - material stages           → 05-reports.js:499
   - reportNo generators       → 05-reports.js:504, 22 (production), 774 (weekly)
   ============================================================ */

(function (global) {
  'use strict';

  // Reuse from other modules where possible
  var ProjectsLogic = (global.NouRion && global.NouRion.ProjectsLogic) || null;
  if (!ProjectsLogic && typeof require !== 'undefined') {
    try { ProjectsLogic = require('../projects/projects.logic.js'); } catch (e) {}
  }
  var SavedLogic = (global.NouRion && global.NouRion.SavedLogic) || null;
  if (!SavedLogic && typeof require !== 'undefined') {
    try { SavedLogic = require('../saved/saved.logic.js'); } catch (e) {}
  }

  // ==========================================================
  // 1. STATUS_COLORS — منقول حرفياً من 05-reports.js:66
  // ==========================================================
  var STATUS_COLORS = {
    'جاري':                          '#4ec94e',
    'تركيب':                         '#4f8ef7',
    'موقوف - انتظار سداد العميل':    '#e85d5d',
    'تأخير من العميل':               '#f4a261',
    'تأخير من الشركة':               '#e96060',
    'تم التسليم':                    '#c9a84c',
    'ملغى':                          '#888',
    'توقيع العقد':                   '#9b59b6',
    'موقوف':                         '#e74c3c'
  };

  // ==========================================================
  // 2. MATERIAL_STAGES — منقول حرفياً من 05-reports.js:499
  // ==========================================================
  var MATERIAL_STAGES = ['طلب الخامات', 'طلب المواد', 'طلب الزجاج'];

  // ==========================================================
  // 3. filterByUser — منقولة حرفياً من 05-reports.js:2-10
  //    pure: حقن user بدل getCurrentUser()
  // ==========================================================
  function filterByUser(projects, user) {
    if (!projects) return [];
    if (!user || user.isAdmin) return projects;
    var fp = projects;
    if (user.filterCompany) fp = fp.filter(function (p) { return p.company === user.filterCompany; });
    if (user.filterRegion)  fp = fp.filter(function (p) { return (p.region || '') === user.filterRegion; });
    if (user.filterGallery) fp = fp.filter(function (p) { return (p.gallery || '') === user.filterGallery; });
    return fp;
  }

  // ==========================================================
  // 4. computeStatusCounts — منقول حرفياً من 05-reports.js:48-53
  //    تُرجع: { total, jaari, tarkib, mawqof, done }
  // ==========================================================
  function computeStatusCounts(projects) {
    var withStatus = (projects || []).map(function (p) {
      return { autoStatus: ProjectsLogic ? ProjectsLogic.calcStatusFromStage(p.stage) : (p.status || '') };
    });
    var total  = withStatus.length;
    var jaari  = withStatus.filter(function (p) { return p.autoStatus === 'جاري'; }).length;
    var tarkib = withStatus.filter(function (p) { return p.autoStatus === 'تركيب'; }).length;
    var mawqof = withStatus.filter(function (p) { return p.autoStatus.indexOf('موقوف') !== -1 || p.autoStatus.indexOf('تأخير') !== -1; }).length;
    var done   = withStatus.filter(function (p) { return p.autoStatus === 'تم التسليم'; }).length;
    return { total: total, jaari: jaari, tarkib: tarkib, mawqof: mawqof, done: done };
  }

  // ==========================================================
  // 5. computeStatusDistribution — كل الحالات (للـ doughnut chart)
  //    منقول من 05-reports.js:62-71
  // ==========================================================
  function computeStatusDistribution(projects) {
    var defaultStatuses = (ProjectsLogic && ProjectsLogic.DEFAULT_STATUSES) || [
      'توقيع العقد','جاري','تأخير من العميل','تأخير من الشركة',
      'تركيب','موقوف - انتظار سداد العميل','موقوف','تم التسليم','ملغى'
    ];
    var counts = {};
    defaultStatuses.forEach(function (s) { counts[s] = 0; });
    (projects || []).forEach(function (p) {
      var s = ProjectsLogic ? ProjectsLogic.calcStatusFromStage(p.stage) : (p.status || '');
      counts[s] = (counts[s] || 0) + 1;
    });
    var nonZero = Object.keys(counts)
      .filter(function (k) { return counts[k] > 0; })
      .map(function (k) { return { status: k, count: counts[k], color: STATUS_COLORS[k] || '#666' }; });
    return { all: counts, nonZero: nonZero, total: (projects || []).length };
  }

  // ==========================================================
  // 6. computeBreakdownByCompany — جدول Company × Region
  //    منقول حرفياً من 05-reports.js:122-164
  // ==========================================================
  function computeBreakdownByCompany(projects) {
    if (!projects || !projects.length) return [];
    var defaultStatuses = (ProjectsLogic && ProjectsLogic.DEFAULT_STATUSES) || [];

    var withStatus = projects.map(function (p) {
      return Object.assign({}, p, { autoStatus: ProjectsLogic ? ProjectsLogic.calcStatusFromStage(p.stage) : (p.status || '') });
    });

    var allCos = [];
    var seen = {};
    withStatus.forEach(function (p) {
      if (p.company && !seen[p.company]) { seen[p.company] = true; allCos.push(p.company); }
    });

    var allRegs = [];
    var seenR = {};
    withStatus.forEach(function (p) {
      var reg = SavedLogic ? SavedLogic.getRegion(p) : (p.region || '');
      if (reg && !seenR[reg]) { seenR[reg] = true; allRegs.push(reg); }
    });

    return allCos.map(function (co) {
      var coProjects = withStatus.filter(function (p) { return p.company === co; });
      var byRegion = (allRegs.length ? allRegs : ['—']).map(function (reg) {
        var rp = (reg === '—')
          ? coProjects
          : coProjects.filter(function (p) { return (SavedLogic ? SavedLogic.getRegion(p) : p.region || '') === reg; });
        if (!rp.length && reg !== '—') return null;
        var byStatus = {};
        defaultStatuses.forEach(function (s) {
          byStatus[s] = rp.filter(function (p) { return p.autoStatus === s; }).length;
        });
        return { region: reg, count: rp.length, byStatus: byStatus };
      }).filter(Boolean);

      var totalByStatus = {};
      defaultStatuses.forEach(function (s) {
        totalByStatus[s] = coProjects.filter(function (p) { return p.autoStatus === s; }).length;
      });

      return {
        company:       co,
        count:         coProjects.length,
        regions:       byRegion,
        totalByStatus: totalByStatus
      };
    });
  }

  // ==========================================================
  // 7. computeMaterialsTotals — منقولة حرفياً من 05-reports.js:551-561
  // ==========================================================
  function computeMaterialsTotals(rows) {
    var totals = {
      ext: 0, down: 0, net: 0,
      mats: 0, purchased: 0, matRem: 0,
      ops: 0, alum: 0, glass: 0,
      grandOps: 0  // ops + alum + glass
    };
    if (!rows || !rows.length) return totals;
    rows.forEach(function (p) {
      var ext   = parseFloat(p.extractValue)       || 0;
      var down  = parseFloat(p.downPayment)        || 0;
      var mats  = parseFloat(p.materialsValue)     || 0;
      var purch = parseFloat(p.materialsPurchased) || 0;
      totals.ext       += ext;
      totals.down      += down;
      totals.net       += ext - down;
      totals.mats      += mats;
      totals.purchased += purch;
      totals.matRem    += mats - purch;
      totals.ops       += parseFloat(p.opsValue)   || 0;
      totals.alum      += parseFloat(p.alumValue)  || 0;
      totals.glass     += parseFloat(p.glassValue) || 0;
    });
    totals.grandOps = totals.ops + totals.alum + totals.glass;
    return totals;
  }

  // ==========================================================
  // 8. filterMaterialStages — فلتر المشاريع التي في مرحلة طلب مواد/زجاج
  //    منقول من 05-reports.js:499-502
  // ==========================================================
  function filterMaterialStages(projects) {
    if (!projects) return [];
    return projects.filter(function (p) { return MATERIAL_STAGES.indexOf(p.stage) !== -1; });
  }

  // ==========================================================
  // 9. isMaterialStage — تُحدّد إذا كانت المرحلة مرحلة "طلب مواد"
  //    منقول من 05-reports.js:592 (نمط داخل buildMaterialsTable)
  // ==========================================================
  function isMaterialStage(stage) {
    if (!stage) return false;
    return ['الخامات', 'المواد', 'الزجاج'].some(function (s) {
      return stage.indexOf(s) !== -1;
    });
  }

  // ==========================================================
  // 10. generateMaterialsReportNo — منقول من 05-reports.js:504
  //     مع DI للوقت
  // ==========================================================
  function generateMaterialsReportNo(date) {
    var d = date || new Date();
    return 'MAT-' + d.getFullYear() + '-' + String(d.getTime()).slice(-5);
  }

  // ==========================================================
  // 11. computeProjectByCompanyMatrix — للـ stacked bar chart
  //     منقول من 05-reports.js:94-100
  // ==========================================================
  function computeProjectByCompanyMatrix(projects, statusList) {
    if (!projects) return { companies: [], datasets: [] };
    statusList = statusList || ['جاري', 'تركيب', 'موقوف - انتظار سداد العميل', 'تأخير من الشركة', 'تأخير من العميل', 'تم التسليم', 'ملغى'];

    var withStatus = projects.map(function (p) {
      return Object.assign({}, p, { autoStatus: ProjectsLogic ? ProjectsLogic.calcStatusFromStage(p.stage) : (p.status || '') });
    });

    var companies = [];
    var seen = {};
    withStatus.forEach(function (p) {
      if (p.company && !seen[p.company]) { seen[p.company] = true; companies.push(p.company); }
    });

    var datasets = statusList.map(function (s) {
      return {
        label: s,
        color: STATUS_COLORS[s] || '#666',
        data:  companies.map(function (c) {
          return withStatus.filter(function (p) { return p.company === c && p.autoStatus === s; }).length;
        })
      };
    });

    return { companies: companies, datasets: datasets };
  }

  // ==========================================================
  // 12. computeFinancialSnapshot — مجموع شامل لكل المشاريع
  //     مستخدم في أعلى الـ topbar / hero stats
  // ==========================================================
  function computeFinancialSnapshot(projects) {
    if (!projects) return { contract: 0, extract: 0, down: 0, production: 0, remaining: 0 };
    var snap = { contract: 0, extract: 0, down: 0, production: 0, remaining: 0 };
    projects.forEach(function (p) {
      var contr = parseFloat(p.contractValue) || 0;
      var ext   = parseFloat(p.extractValue)  || 0;
      var down  = parseFloat(p.downPayment)   || 0;
      var prog  = parseFloat(p.progress)      || 0;
      var base  = ext > 0 ? ext : contr;
      var prod  = Math.round(base * prog / 100);
      snap.contract   += contr;
      snap.extract    += ext;
      snap.down       += down;
      snap.production += prod;
      snap.remaining  += base - down;
    });
    return snap;
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================
  var api = {
    // Constants
    STATUS_COLORS:              STATUS_COLORS,
    MATERIAL_STAGES:            MATERIAL_STAGES,
    // Filters
    filterByUser:               filterByUser,
    filterMaterialStages:       filterMaterialStages,
    isMaterialStage:            isMaterialStage,
    // Aggregations
    computeStatusCounts:        computeStatusCounts,
    computeStatusDistribution:  computeStatusDistribution,
    computeBreakdownByCompany:  computeBreakdownByCompany,
    computeMaterialsTotals:     computeMaterialsTotals,
    computeProjectByCompanyMatrix: computeProjectByCompanyMatrix,
    computeFinancialSnapshot:   computeFinancialSnapshot,
    // Helpers
    generateMaterialsReportNo:  generateMaterialsReportNo
  };

  global.NouRion = global.NouRion || {};
  global.NouRion.ReportsLogic = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
