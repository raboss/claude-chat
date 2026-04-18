/* ============================================================
   NouRion — modules/installations/installations.logic.js
   ------------------------------------------------------------
   Pure logic for the Installations module.
   NO DOM, NO localStorage, NO fetch.

   🚫 القاعدة الحمراء:
   كل الحسابات منقولة حرفياً من pm_server/public/js/13-installations.js.
   هذا الـ module أضخم من كل ما استخرجناه حتى الآن.

   Five sub-systems:
   1. Installation entries (new client measurements from field technicians)
   2. Defects (missing items after installation)
   3. Maintenance orders
   4. Site delivery orders
   5. Measurement orders
   6. Team distribution + history

   المصادر:
   - loadInstallations / statuses → 13-installations.js:7
   - _checkInstNotifications      → 13-installations.js:673
   - _doMergeToProject            → 13-installations.js:493
   - maintenance status flow      → 13-installations.js:1715+
   - delivery status flow         → 13-installations.js:2345+
   - team distribution            → 13-installations.js:3057+
   ============================================================ */

(function (global) {
  'use strict';

  // ==========================================================
  // 1. Status constants (منقولة من 13-installations.js)
  // ==========================================================
  var INSTALLATION_STATUSES = {
    NEW:       'new',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled'
  };

  var MAINT_STATUSES = {
    PENDING:    'pending',
    IN_PROGRESS:'in_progress',
    COMPLETED:  'completed',
    CANCELLED:  'cancelled'
  };

  var DELIVERY_STATUSES = {
    PENDING:   'pending',
    SIGNED:    'signed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  };

  var MEAS_ORDER_STATUSES = {
    PENDING:    'pending',
    IN_PROGRESS:'in_progress',
    COMPLETED:  'completed'
  };

  var DEFECT_TYPES = [
    'ناقص','مكسور','خطأ في المقاس','تلف','نقص أكسسوارات','زجاج ناقص','سيلكون','دهان','أخرى'
  ];

  // ==========================================================
  // 2. filterInstallationsByStatus — مستخرج من النمط المتكرر
  //    منقول من 13-installations.js:680
  // ==========================================================
  function filterInstallationsByStatus(entries, status) {
    if (!entries) return [];
    return entries.filter(function (e) { return e.status === status; });
  }

  function countByStatus(entries, status) {
    return filterInstallationsByStatus(entries, status).length;
  }

  // ==========================================================
  // 3. countFilledMeasurements — منقول من 13-installations.js:498, 580
  //    يعدّ الصفوف التي فيها width أو height
  // ==========================================================
  function countFilledMeasurements(entry) {
    if (!entry || !entry.measurements) return 0;
    return entry.measurements.filter(function (r) { return r.width || r.height; }).length;
  }

  // ==========================================================
  // 4. computeInstallationsSummary — KPIs شامل
  // ==========================================================
  function computeInstallationsSummary(entries) {
    if (!entries) return { total: 0, new: 0, confirmed: 0, cancelled: 0, totalMeas: 0 };
    var totalMeas = 0;
    entries.forEach(function (e) { totalMeas += countFilledMeasurements(e); });
    return {
      total:      entries.length,
      new:        countByStatus(entries, INSTALLATION_STATUSES.NEW),
      confirmed:  countByStatus(entries, INSTALLATION_STATUSES.CONFIRMED),
      cancelled:  countByStatus(entries, INSTALLATION_STATUSES.CANCELLED),
      totalMeas:  totalMeas
    };
  }

  // ==========================================================
  // 5. computeUnseenCount — إشعارات المقاسات الجديدة
  //    منقول من 13-installations.js:680-682
  // ==========================================================
  function computeUnseenCount(entries, lastSeenTimestamp) {
    if (!entries) return 0;
    var lastSeen = parseInt(lastSeenTimestamp, 10) || 0;
    return entries.filter(function (e) {
      if (e.status !== INSTALLATION_STATUSES.NEW) return false;
      var ts = new Date(e.createdAt || 0).getTime();
      return ts > lastSeen;
    }).length;
  }

  // ==========================================================
  // 6. searchProjects — البحث لإيجاد مشروع للدمج
  //    منقول من 13-installations.js:558-569
  // ==========================================================
  function searchProjects(projects, query) {
    if (!projects) return [];
    var visible = projects.filter(function (p) { return !p.pendingReview; });
    if (!query) return visible;
    var q = String(query).toLowerCase().trim();
    return visible.filter(function (p) {
      var txt = ((p.name || '') + ' ' + (p.contractNo || '') + ' ' + (p.company || '') + ' ' + (p.gallery || '')).toLowerCase();
      return txt.indexOf(q) !== -1;
    });
  }

  // ==========================================================
  // 7. mergeMeasurementsToProject — pure version of _doMergeToProject
  //    منقول من 13-installations.js:493-508
  //    يُرجع { entry (updated), existingMeas (updated), mergedCount }
  // ==========================================================
  function mergeMeasurementsToProject(entry, existingMeasurements, projectId, dateNow) {
    if (!entry) return { entry: entry, measurements: existingMeasurements || [], mergedCount: 0 };
    var existing = Array.isArray(existingMeasurements) ? existingMeasurements.slice() : [];
    var newMeas = (entry.measurements || []).filter(function (r) { return r.width || r.height; });
    var merged = existing.concat(newMeas);

    var updatedEntry = Object.assign({}, entry, {
      status:          INSTALLATION_STATUSES.CONFIRMED,
      confirmedAt:     (dateNow || new Date()).toISOString(),
      linkedProjectId: projectId
    });

    return {
      entry:        updatedEntry,
      measurements: merged,
      mergedCount:  newMeas.length
    };
  }

  // ==========================================================
  // 8. computeMaintenanceSummary — KPIs للصيانة
  // ==========================================================
  function computeMaintenanceSummary(orders, currentUserName) {
    if (!orders) return { total: 0, pending: 0, inProgress: 0, completed: 0, myPending: 0 };
    var total = orders.length;
    var pending     = orders.filter(function (o) { return o.status === MAINT_STATUSES.PENDING; }).length;
    var inProgress  = orders.filter(function (o) { return o.status === MAINT_STATUSES.IN_PROGRESS; }).length;
    var completed   = orders.filter(function (o) { return o.status === MAINT_STATUSES.COMPLETED; }).length;
    var myPending   = currentUserName ?
      orders.filter(function (o) {
        return o.assignedTo === currentUserName && o.status === MAINT_STATUSES.PENDING;
      }).length : 0;

    return { total: total, pending: pending, inProgress: inProgress, completed: completed, myPending: myPending };
  }

  // ==========================================================
  // 9. computeDeliverySummary — KPIs لأوامر التسليم
  // ==========================================================
  function computeDeliverySummary(orders) {
    if (!orders) return { total: 0, pending: 0, signed: 0, completed: 0 };
    return {
      total:     orders.length,
      pending:   orders.filter(function (o) { return o.status === DELIVERY_STATUSES.PENDING;   }).length,
      signed:    orders.filter(function (o) { return o.status === DELIVERY_STATUSES.SIGNED;    }).length,
      completed: orders.filter(function (o) { return o.status === DELIVERY_STATUSES.COMPLETED; }).length
    };
  }

  // ==========================================================
  // 10. transitionMaintStatus — pure status transition
  //     منقول من 13-installations.js:2104 (maintStart), 2116 (maintComplete)
  // ==========================================================
  function transitionMaintStatus(order, newStatus, dateNow) {
    if (!order) return null;
    var out = Object.assign({}, order, { status: newStatus });
    var now = (dateNow || new Date()).toISOString();
    if (newStatus === MAINT_STATUSES.IN_PROGRESS) out.startedAt   = now;
    if (newStatus === MAINT_STATUSES.COMPLETED)   out.completedAt = now;
    if (newStatus === MAINT_STATUSES.CANCELLED)   out.cancelledAt = now;
    return out;
  }

  // ==========================================================
  // 11. transitionDeliveryStatus — pure
  // ==========================================================
  function transitionDeliveryStatus(order, newStatus, dateNow) {
    if (!order) return null;
    var out = Object.assign({}, order, { status: newStatus });
    var now = (dateNow || new Date()).toISOString();
    if (newStatus === DELIVERY_STATUSES.SIGNED)    out.signedAt    = now;
    if (newStatus === DELIVERY_STATUSES.COMPLETED) out.completedAt = now;
    return out;
  }

  // ==========================================================
  // 12. computeTeamLoad — حساب تحميل فرقة العمل
  //     مستخرج من renderTeamDist (13-installations.js:3065)
  // ==========================================================
  function computeTeamLoad(team) {
    if (!team) return { projectCount: 0, workerCount: 0, avgPerWorker: 0 };
    var projectCount = (team.projects || []).length;
    var workerCount  = (team.workers  || []).length;
    var avg = workerCount > 0 ? Math.round(projectCount / workerCount * 100) / 100 : 0;
    return {
      projectCount: projectCount,
      workerCount:  workerCount,
      avgPerWorker: avg
    };
  }

  // ==========================================================
  // 13. computeTeamsSummary — KPIs لتوزيع الفرق
  // ==========================================================
  function computeTeamsSummary(teams) {
    if (!teams) return { teamCount: 0, totalWorkers: 0, totalProjects: 0, avgTeamSize: 0 };
    var totalWorkers = 0;
    var totalProjects = 0;
    teams.forEach(function (team) {
      var load = computeTeamLoad(team);
      totalWorkers  += load.workerCount;
      totalProjects += load.projectCount;
    });
    return {
      teamCount:    teams.length,
      totalWorkers: totalWorkers,
      totalProjects:totalProjects,
      avgTeamSize:  teams.length > 0 ? Math.round(totalWorkers / teams.length * 100) / 100 : 0
    };
  }

  // ==========================================================
  // 14. addProjectToTeam / removeProjectFromTeam — pure
  //     منقول من 13-installations.js:3193-3243
  // ==========================================================
  function addProjectToTeam(team, projectId) {
    if (!team || !projectId) return team;
    var projects = (team.projects || []).slice();
    if (projects.indexOf(projectId) !== -1) return team; // avoid duplicates
    projects.push(projectId);
    return Object.assign({}, team, { projects: projects });
  }

  function removeProjectFromTeam(team, projectIndex) {
    if (!team) return team;
    var projects = (team.projects || []).slice();
    projects.splice(projectIndex, 1);
    return Object.assign({}, team, { projects: projects });
  }

  // ==========================================================
  // 15. computeDefectsSummary — KPIs للنواقص
  // ==========================================================
  function computeDefectsSummary(defects) {
    if (!defects) return { total: 0, open: 0, confirmed: 0, totalItems: 0 };
    var totalItems = 0;
    defects.forEach(function (d) {
      totalItems += (d.items || d.measurements || []).length;
    });
    return {
      total:      defects.length,
      open:       defects.filter(function (d) { return d.status !== 'confirmed' && d.status !== 'cancelled'; }).length,
      confirmed:  defects.filter(function (d) { return d.status === 'confirmed'; }).length,
      totalItems: totalItems
    };
  }

  // ==========================================================
  // 16. computeMeasOrderSummary — KPIs لأوامر المقاسات
  // ==========================================================
  function computeMeasOrderSummary(orders) {
    if (!orders) return { total: 0, pending: 0, inProgress: 0, completed: 0 };
    return {
      total:      orders.length,
      pending:    orders.filter(function (o) { return o.status === MEAS_ORDER_STATUSES.PENDING;     }).length,
      inProgress: orders.filter(function (o) { return o.status === MEAS_ORDER_STATUSES.IN_PROGRESS; }).length,
      completed:  orders.filter(function (o) { return o.status === MEAS_ORDER_STATUSES.COMPLETED;   }).length
    };
  }

  // ==========================================================
  // 17. buildTeamHistorySnapshot — للأرشفة
  //     منقول من 13-installations.js:3312 (teamDistSaveHistory)
  // ==========================================================
  function buildTeamHistorySnapshot(teams, date) {
    var snapshot = {
      id:     Date.now().toString(),
      date:   (date || new Date()).toISOString(),
      teams:  (teams || []).map(function (t) {
        return {
          id:       t.id,
          name:     t.name,
          workers:  (t.workers || []).slice(),
          projects: (t.projects || []).slice(),
          note:     t.note || ''
        };
      })
    };
    var summary = computeTeamsSummary(teams);
    snapshot.teamCount     = summary.teamCount;
    snapshot.totalWorkers  = summary.totalWorkers;
    snapshot.totalProjects = summary.totalProjects;
    return snapshot;
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================
  var api = {
    // Constants
    INSTALLATION_STATUSES:      INSTALLATION_STATUSES,
    MAINT_STATUSES:             MAINT_STATUSES,
    DELIVERY_STATUSES:          DELIVERY_STATUSES,
    MEAS_ORDER_STATUSES:        MEAS_ORDER_STATUSES,
    DEFECT_TYPES:               DEFECT_TYPES,
    // Installations
    filterInstallationsByStatus:filterInstallationsByStatus,
    countByStatus:              countByStatus,
    countFilledMeasurements:    countFilledMeasurements,
    computeInstallationsSummary:computeInstallationsSummary,
    computeUnseenCount:         computeUnseenCount,
    searchProjects:             searchProjects,
    mergeMeasurementsToProject: mergeMeasurementsToProject,
    // Maintenance
    computeMaintenanceSummary:  computeMaintenanceSummary,
    transitionMaintStatus:      transitionMaintStatus,
    // Delivery
    computeDeliverySummary:     computeDeliverySummary,
    transitionDeliveryStatus:   transitionDeliveryStatus,
    // Measurement orders
    computeMeasOrderSummary:    computeMeasOrderSummary,
    // Defects
    computeDefectsSummary:      computeDefectsSummary,
    // Teams
    computeTeamLoad:            computeTeamLoad,
    computeTeamsSummary:        computeTeamsSummary,
    addProjectToTeam:           addProjectToTeam,
    removeProjectFromTeam:      removeProjectFromTeam,
    buildTeamHistorySnapshot:   buildTeamHistorySnapshot
  };

  global.NouRion = global.NouRion || {};
  global.NouRion.InstallationsLogic = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
