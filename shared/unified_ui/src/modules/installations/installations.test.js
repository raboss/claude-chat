/* ============================================================
   NouRion — installations.test.js
   ============================================================ */

var L = (typeof require !== 'undefined')
  ? require('./installations.logic.js')
  : window.NouRion.InstallationsLogic;

var passed = 0, failed = 0, failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log('  ✔ ' + name); }
  catch (e) { failed++; failures.push({ name: name, error: e.message }); console.log('  ✘ ' + name + '\n     → ' + e.message); }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' expected=' + JSON.stringify(b) + ' actual=' + JSON.stringify(a)); }
function truthy(v, msg) { if (!v) throw new Error(msg || 'expected truthy'); }
function group(n, fn) { console.log('\n── ' + n + ' ──'); fn(); }

// Sample installations
var INSTALLATIONS = [
  { id: 'i1', clientName: 'علي',  status: 'new',       createdAt: '2026-04-01T10:00:00Z', measurements: [
    { width: 1000, height: 2000 }, { width: 1500, height: 2200 }, { width: '', height: '' }
  ]},
  { id: 'i2', clientName: 'محمد', status: 'new',       createdAt: '2026-04-05T10:00:00Z', measurements: [] },
  { id: 'i3', clientName: 'سعد',  status: 'confirmed', createdAt: '2026-03-20T10:00:00Z', measurements: [
    { width: 800, height: 1800 }
  ]},
  { id: 'i4', clientName: 'ياسر', status: 'cancelled', createdAt: '2026-03-15T10:00:00Z', measurements: [] }
];

var PROJECTS = [
  { id: 'p1', name: 'فيلا الخالدية',  contractNo: '240100001', company: 'الراجحي', gallery: 'الياسمين' },
  { id: 'p2', name: 'برج الأعمال',    contractNo: '240200002', company: 'السلطان' },
  { id: 'p3', name: 'مشروع معلَّق',    contractNo: '240300003', pendingReview: true }
];


// ============================================================
group('constants', function () {
  test('INSTALLATION_STATUSES', function () {
    eq(L.INSTALLATION_STATUSES.NEW, 'new');
    eq(L.INSTALLATION_STATUSES.CONFIRMED, 'confirmed');
  });
  test('MAINT_STATUSES', function () {
    eq(L.MAINT_STATUSES.PENDING, 'pending');
    eq(L.MAINT_STATUSES.COMPLETED, 'completed');
  });
  test('DEFECT_TYPES is array', function () {
    truthy(L.DEFECT_TYPES.length > 0);
  });
});


// ============================================================
group('filterInstallationsByStatus', function () {
  test('new entries', function () {
    eq(L.filterInstallationsByStatus(INSTALLATIONS, 'new').length, 2);
  });

  test('confirmed', function () {
    eq(L.filterInstallationsByStatus(INSTALLATIONS, 'confirmed').length, 1);
  });

  test('null safety', function () {
    eq(L.filterInstallationsByStatus(null, 'new').length, 0);
  });
});


// ============================================================
group('countFilledMeasurements', function () {
  test('counts rows with width OR height', function () {
    eq(L.countFilledMeasurements(INSTALLATIONS[0]), 2); // 3 rows, 1 empty
  });

  test('empty measurements', function () {
    eq(L.countFilledMeasurements(INSTALLATIONS[1]), 0);
  });

  test('null entry', function () {
    eq(L.countFilledMeasurements(null), 0);
  });
});


// ============================================================
group('computeInstallationsSummary', function () {
  test('full summary', function () {
    var s = L.computeInstallationsSummary(INSTALLATIONS);
    eq(s.total, 4);
    eq(s.new, 2);
    eq(s.confirmed, 1);
    eq(s.cancelled, 1);
    eq(s.totalMeas, 3); // 2 + 0 + 1 + 0
  });

  test('empty', function () {
    var s = L.computeInstallationsSummary([]);
    eq(s.total, 0);
  });
});


// ============================================================
group('computeUnseenCount', function () {
  test('all new are unseen if lastSeen=0', function () {
    var c = L.computeUnseenCount(INSTALLATIONS, 0);
    eq(c, 2);
  });

  test('lastSeen after all → 0 unseen', function () {
    var c = L.computeUnseenCount(INSTALLATIONS, Date.now() + 10000);
    eq(c, 0);
  });

  test('lastSeen after first new → 1 unseen', function () {
    var t1 = new Date('2026-04-02T00:00:00Z').getTime();
    var c = L.computeUnseenCount(INSTALLATIONS, t1);
    eq(c, 1); // only i2 (April 5)
  });

  test('only counts "new" (not confirmed)', function () {
    var recent = new Date('2026-03-01').getTime();
    var c = L.computeUnseenCount(INSTALLATIONS, recent);
    // i1 + i2 are new; i3 is confirmed (not counted); i4 cancelled (not counted)
    eq(c, 2);
  });

  test('null entries', function () {
    eq(L.computeUnseenCount(null, 0), 0);
  });
});


// ============================================================
group('searchProjects', function () {
  test('excludes pendingReview', function () {
    var r = L.searchProjects(PROJECTS, '');
    eq(r.length, 2); // p3 has pendingReview
  });

  test('search by name', function () {
    var r = L.searchProjects(PROJECTS, 'الخالدية');
    eq(r.length, 1);
    eq(r[0].id, 'p1');
  });

  test('search by contract number', function () {
    var r = L.searchProjects(PROJECTS, '240200002');
    eq(r.length, 1);
    eq(r[0].id, 'p2');
  });

  test('search by company', function () {
    var r = L.searchProjects(PROJECTS, 'الراجحي');
    eq(r.length, 1);
  });

  test('no match', function () {
    eq(L.searchProjects(PROJECTS, 'xyz').length, 0);
  });

  test('null safety', function () {
    eq(L.searchProjects(null, '').length, 0);
  });
});


// ============================================================
group('mergeMeasurementsToProject — pure', function () {
  test('merges filled measurements into existing', function () {
    var entry = INSTALLATIONS[0];
    var existing = [{ width: 500, height: 500 }];
    var fixed = new Date(2026, 3, 15);
    var r = L.mergeMeasurementsToProject(entry, existing, 'p1', fixed);

    eq(r.measurements.length, 3); // 1 existing + 2 filled from entry
    eq(r.mergedCount, 2);
    eq(r.entry.status, 'confirmed');
    eq(r.entry.linkedProjectId, 'p1');
    eq(r.entry.confirmedAt, fixed.toISOString());
  });

  test('skips empty measurements', function () {
    var entry = { measurements: [{ width: '', height: '' }, { width: 100, height: 200 }] };
    var r = L.mergeMeasurementsToProject(entry, [], 'pX');
    eq(r.mergedCount, 1);
  });

  test('non-mutating: original entry unchanged', function () {
    var entry = Object.assign({}, INSTALLATIONS[0]);
    var originalStatus = entry.status;
    L.mergeMeasurementsToProject(entry, [], 'p1');
    eq(entry.status, originalStatus);
  });

  test('null entry', function () {
    var r = L.mergeMeasurementsToProject(null, [], 'p1');
    eq(r.mergedCount, 0);
  });
});


// ============================================================
group('computeMaintenanceSummary', function () {
  var orders = [
    { id: '1', status: 'pending',     assignedTo: 'علي' },
    { id: '2', status: 'pending',     assignedTo: 'محمد' },
    { id: '3', status: 'in_progress', assignedTo: 'علي' },
    { id: '4', status: 'completed',   assignedTo: 'سعد' },
    { id: '5', status: 'pending',     assignedTo: 'علي' }
  ];

  test('totals', function () {
    var s = L.computeMaintenanceSummary(orders);
    eq(s.total, 5);
    eq(s.pending, 3);
    eq(s.inProgress, 1);
    eq(s.completed, 1);
  });

  test('myPending for specific user', function () {
    var s = L.computeMaintenanceSummary(orders, 'علي');
    eq(s.myPending, 2);
  });

  test('myPending=0 without username', function () {
    var s = L.computeMaintenanceSummary(orders);
    eq(s.myPending, 0);
  });

  test('empty', function () {
    var s = L.computeMaintenanceSummary([]);
    eq(s.total, 0);
  });
});


// ============================================================
group('transitionMaintStatus', function () {
  test('pending → in_progress adds startedAt', function () {
    var fixed = new Date(2026, 3, 15);
    var r = L.transitionMaintStatus({ id: '1', status: 'pending' }, 'in_progress', fixed);
    eq(r.status, 'in_progress');
    eq(r.startedAt, fixed.toISOString());
  });

  test('in_progress → completed adds completedAt', function () {
    var fixed = new Date(2026, 3, 16);
    var r = L.transitionMaintStatus({ id: '1', status: 'in_progress' }, 'completed', fixed);
    eq(r.completedAt, fixed.toISOString());
  });

  test('→ cancelled adds cancelledAt', function () {
    var fixed = new Date(2026, 3, 17);
    var r = L.transitionMaintStatus({ id: '1' }, 'cancelled', fixed);
    eq(r.cancelledAt, fixed.toISOString());
  });

  test('non-mutating', function () {
    var orig = { id: '1', status: 'pending' };
    L.transitionMaintStatus(orig, 'completed');
    eq(orig.status, 'pending');
  });

  test('null order', function () {
    eq(L.transitionMaintStatus(null, 'completed'), null);
  });
});


// ============================================================
group('computeDeliverySummary + transition', function () {
  var orders = [
    { id: '1', status: 'pending' },
    { id: '2', status: 'signed' },
    { id: '3', status: 'completed' },
    { id: '4', status: 'pending' }
  ];

  test('delivery summary', function () {
    var s = L.computeDeliverySummary(orders);
    eq(s.total, 4);
    eq(s.pending, 2);
    eq(s.signed, 1);
    eq(s.completed, 1);
  });

  test('delivery transition → signed adds signedAt', function () {
    var r = L.transitionDeliveryStatus({ id: '1', status: 'pending' }, 'signed', new Date(2026, 3, 15));
    eq(r.status, 'signed');
    truthy(r.signedAt);
  });

  test('delivery transition → completed adds completedAt', function () {
    var r = L.transitionDeliveryStatus({ id: '1' }, 'completed', new Date(2026, 3, 16));
    truthy(r.completedAt);
  });
});


// ============================================================
group('computeMeasOrderSummary', function () {
  var orders = [
    { status: 'pending' }, { status: 'in_progress' }, { status: 'completed' }
  ];
  test('all statuses', function () {
    var s = L.computeMeasOrderSummary(orders);
    eq(s.total, 3);
    eq(s.pending, 1);
    eq(s.inProgress, 1);
    eq(s.completed, 1);
  });
});


// ============================================================
group('computeDefectsSummary', function () {
  var defects = [
    { status: 'open',      items: [{}, {}, {}] },
    { status: 'open',      items: [{}] },
    { status: 'confirmed', items: [{}, {}] }
  ];

  test('counts + total items', function () {
    var s = L.computeDefectsSummary(defects);
    eq(s.total, 3);
    eq(s.open, 2);
    eq(s.confirmed, 1);
    eq(s.totalItems, 6);
  });

  test('empty', function () {
    var s = L.computeDefectsSummary([]);
    eq(s.total, 0);
  });
});


// ============================================================
group('Teams — computeTeamLoad / Summary / addProject / removeProject', function () {
  var team = { id: 't1', name: 'فرقة ١', workers: ['w1', 'w2', 'w3'], projects: ['p1', 'p2'] };
  var teams = [
    team,
    { id: 't2', name: 'فرقة ٢', workers: ['w4', 'w5'], projects: ['p3'] }
  ];

  test('computeTeamLoad', function () {
    var load = L.computeTeamLoad(team);
    eq(load.workerCount, 3);
    eq(load.projectCount, 2);
    eq(load.avgPerWorker, Math.round(2 / 3 * 100) / 100);
  });

  test('computeTeamLoad null', function () {
    var load = L.computeTeamLoad(null);
    eq(load.projectCount, 0);
  });

  test('computeTeamsSummary', function () {
    var s = L.computeTeamsSummary(teams);
    eq(s.teamCount, 2);
    eq(s.totalWorkers, 5);
    eq(s.totalProjects, 3);
  });

  test('addProjectToTeam adds new', function () {
    var r = L.addProjectToTeam(team, 'p99');
    eq(r.projects.length, 3);
  });

  test('addProjectToTeam skips duplicate', function () {
    var r = L.addProjectToTeam(team, 'p1');
    eq(r.projects.length, 2);
  });

  test('addProjectToTeam non-mutating', function () {
    var orig = Object.assign({}, team, { projects: team.projects.slice() });
    L.addProjectToTeam(team, 'p99');
    eq(team.projects.length, orig.projects.length);
  });

  test('removeProjectFromTeam by index', function () {
    var r = L.removeProjectFromTeam(team, 0);
    eq(r.projects.length, 1);
    eq(r.projects[0], 'p2');
  });
});


// ============================================================
group('buildTeamHistorySnapshot', function () {
  var teams = [
    { id: 't1', name: 'فرقة ١', workers: ['w1', 'w2'], projects: ['p1'], note: 'ملاحظة' }
  ];

  test('builds snapshot with metadata', function () {
    var fixed = new Date(2026, 3, 15);
    var snap = L.buildTeamHistorySnapshot(teams, fixed);
    truthy(snap.id);
    eq(snap.date, fixed.toISOString());
    eq(snap.teamCount, 1);
    eq(snap.totalWorkers, 2);
    eq(snap.totalProjects, 1);
  });

  test('deep copies workers/projects arrays', function () {
    var snap = L.buildTeamHistorySnapshot(teams);
    snap.teams[0].workers.push('w_bad');
    eq(teams[0].workers.length, 2); // original unchanged
  });
});


// ============================================================
console.log('\n════════════════════════════════════════');
console.log('  NouRion — installations.logic.js test results');
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
