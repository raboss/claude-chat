/* ============================================================
   NouRion — designs.test.js
   ============================================================ */

var L = (typeof require !== 'undefined')
  ? require('./designs.logic.js')
  : window.NouRion.DesignsLogic;

var passed = 0, failed = 0, failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log('  ✔ ' + name); }
  catch (e) { failed++; failures.push({ name: name, error: e.message }); console.log('  ✘ ' + name + '\n     → ' + e.message); }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' expected=' + JSON.stringify(b) + ' actual=' + JSON.stringify(a)); }
function near(a, b, tol, msg) { if (Math.abs(a - b) > (tol || 0.001)) throw new Error((msg || '') + ' expected≈' + b + ' actual=' + a); }
function truthy(v, msg) { if (!v) throw new Error(msg || 'expected truthy'); }
function falsy(v, msg) { if (v) throw new Error(msg || 'expected falsy'); }
function group(n, fn) { console.log('\n── ' + n + ' ──'); fn(); }

var SAMPLE_MEAS = [
  { code: 'W01', width: 1200, height: 1800, sectionName: 'نوافذ قلف 12', description: 'نافذة', notes: '' },
  { code: 'W02', width: 1500, height: 2200, sectionName: 'نوافذ قلف 12', description: 'نافذة كبيرة' },
  { code: 'W03', width: 800,  height: 2000, sectionName: 'سرايا 10', description: 'باب' },
  { code: 'W04', width: 0,    height: 1800, sectionName: 'نوافذ قلف 12' }, // skipped (no width)
  { code: 'W05', width: 600,  height: 0,    sectionName: 'سرايا 10' },     // skipped (no height)
  { code: 'W06', width: 2000, height: 2500, sectionName: 'استركشر SG50', description: 'واجهة' }
];


// ============================================================
group('constants', function () {
  test('DEFAULT_PROFILE_ID', function () {
    eq(L.DEFAULT_PROFILE_ID, 'cas-frame-50');
  });
  test('JOINT_TYPES', function () {
    truthy(L.JOINT_TYPES.length >= 3);
    truthy(L.JOINT_TYPES.indexOf('miter') !== -1);
  });
});


// ============================================================
group('filterActiveMeasurements', function () {
  test('filters rows with both width and height', function () {
    var r = L.filterActiveMeasurements(SAMPLE_MEAS);
    eq(r.length, 4);
  });

  test('excludes zero-width rows', function () {
    var r = L.filterActiveMeasurements(SAMPLE_MEAS);
    truthy(r.every(function (x) { return +x.width > 0; }));
  });

  test('excludes zero-height rows', function () {
    var r = L.filterActiveMeasurements(SAMPLE_MEAS);
    truthy(r.every(function (x) { return +x.height > 0; }));
  });

  test('null safety', function () {
    eq(L.filterActiveMeasurements(null).length, 0);
    eq(L.filterActiveMeasurements([]).length, 0);
  });
});


// ============================================================
group('groupBySection', function () {
  test('groups by sectionName', function () {
    var g = L.groupBySection(SAMPLE_MEAS);
    truthy(g['نوافذ قلف 12']);
    truthy(g['سرايا 10']);
    truthy(g['استركشر SG50']);
  });

  test('uses "غير محدد" for missing section', function () {
    var g = L.groupBySection([{ width: 1000, height: 2000 }]);
    truthy(g['غير محدد']);
    eq(g['غير محدد'].length, 1);
  });

  test('counts per group', function () {
    var active = L.filterActiveMeasurements(SAMPLE_MEAS);
    var g = L.groupBySection(active);
    eq(g['نوافذ قلف 12'].length, 2); // W01, W02
    eq(g['سرايا 10'].length, 1);     // W03
    eq(g['استركشر SG50'].length, 1); // W06
  });

  test('null safety', function () {
    var g = L.groupBySection(null);
    eq(Object.keys(g).length, 0);
  });
});


// ============================================================
group('buildSectionsTree', function () {
  test('returns structured tree', function () {
    var tree = L.buildSectionsTree(SAMPLE_MEAS);
    truthy(tree.length >= 3);
    tree.forEach(function (section) {
      truthy(section.sectionName);
      truthy(section.rows.length >= 1);
      eq(section.count, section.rows.length);
    });
  });

  test('each row has globalIndex', function () {
    var tree = L.buildSectionsTree(SAMPLE_MEAS);
    var indices = [];
    tree.forEach(function (s) { s.rows.forEach(function (r) { indices.push(r.globalIndex); }); });
    // 4 active rows, indices 0..3
    eq(indices.length, 4);
    indices.sort();
    eq(indices[0], 0);
    eq(indices[3], 3);
  });

  test('areaM2 calculated', function () {
    var tree = L.buildSectionsTree(SAMPLE_MEAS);
    var firstRow = tree[0].rows[0];
    // 1200 × 1800 = 2.16 m²
    near(firstRow.areaM2, 2.16, 0.01);
  });

  test('excludes inactive', function () {
    var tree = L.buildSectionsTree(SAMPLE_MEAS);
    var allCodes = [];
    tree.forEach(function (s) { s.rows.forEach(function (r) { allCodes.push(r.code); }); });
    truthy(allCodes.indexOf('W04') === -1);
    truthy(allCodes.indexOf('W05') === -1);
  });
});


// ============================================================
group('frameCodeFor', function () {
  test('uses existing code', function () {
    eq(L.frameCodeFor({ code: 'X99' }, 5), 'X99');
  });

  test('generates W## fallback', function () {
    eq(L.frameCodeFor({}, 0), 'W01');
    eq(L.frameCodeFor({}, 9), 'W10');
  });
});


// ============================================================
group('findFrameByCode', function () {
  test('finds existing', function () {
    var r = L.findFrameByCode(SAMPLE_MEAS, 'W02');
    truthy(r);
    eq(r.frame.width, 1500);
  });

  test('returns null for missing', function () {
    eq(L.findFrameByCode(SAMPLE_MEAS, 'XX'), null);
  });

  test('skips inactive rows', function () {
    var r = L.findFrameByCode(SAMPLE_MEAS, 'W04');
    eq(r, null);
  });
});


// ============================================================
group('computeFrameSummary', function () {
  test('counts active only', function () {
    var s = L.computeFrameSummary(SAMPLE_MEAS);
    eq(s.count, 4);
  });

  test('sections count', function () {
    var s = L.computeFrameSummary(SAMPLE_MEAS);
    eq(s.sections, 3);
  });

  test('total area calculation', function () {
    var s = L.computeFrameSummary(SAMPLE_MEAS);
    // W01: 2.16, W02: 3.3, W03: 1.6, W06: 5.0 = 12.06
    near(s.totalAreaM2, 12.06, 0.01);
  });

  test('max dimensions', function () {
    var s = L.computeFrameSummary(SAMPLE_MEAS);
    eq(s.maxW, 2000);
    eq(s.maxH, 2500);
  });

  test('empty', function () {
    var s = L.computeFrameSummary([]);
    eq(s.count, 0);
    eq(s.totalAreaM2, 0);
  });
});


// ============================================================
group('validateFrameDimensions', function () {
  test('valid dimensions', function () {
    var r = L.validateFrameDimensions(1200, 1800);
    eq(r.valid, true);
    eq(r.errors.length, 0);
  });

  test('string numbers', function () {
    var r = L.validateFrameDimensions('1000', '2000');
    eq(r.valid, true);
  });

  test('zero or negative', function () {
    eq(L.validateFrameDimensions(0, 1000).valid, false);
    eq(L.validateFrameDimensions(1000, -50).valid, false);
  });

  test('NaN', function () {
    eq(L.validateFrameDimensions('abc', 1000).valid, false);
  });

  test('below minimum', function () {
    var r = L.validateFrameDimensions(100, 1000);
    eq(r.valid, false);
  });

  test('above maximum', function () {
    var r = L.validateFrameDimensions(15000, 1000);
    eq(r.valid, false);
  });

  test('custom min/max', function () {
    var r = L.validateFrameDimensions(150, 150, { minDim: 100, maxDim: 500 });
    eq(r.valid, true);
  });
});


// ============================================================
group('prepareEngineInput', function () {
  test('valid input', function () {
    var r = L.prepareEngineInput(1200, 1800);
    eq(r.valid, true);
    eq(r.width, 1200);
    eq(r.profileId, 'cas-frame-50');
    eq(r.jointType, 'miter');
    eq(r.shape, 'rectangle');
  });

  test('custom profile and joint', function () {
    var r = L.prepareEngineInput(1200, 1800, 'my-profile', 'butt');
    eq(r.profileId, 'my-profile');
    eq(r.jointType, 'butt');
  });

  test('invalid dimensions', function () {
    var r = L.prepareEngineInput(50, 1000);
    eq(r.valid, false);
    truthy(r.errors.length > 0);
  });
});


// ============================================================
group('computeShapesBounds', function () {
  test('single shape with points {x, y}', function () {
    var shape = { points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 200 }, { x: 0, y: 200 }] };
    var b = L.computeShapesBounds([shape]);
    eq(b.width, 100);
    eq(b.height, 200);
  });

  test('single shape with points [x, y]', function () {
    var shape = { points: [[0, 0], [50, 50]] };
    var b = L.computeShapesBounds([shape]);
    eq(b.width, 50);
    eq(b.height, 50);
  });

  test('multiple shapes combined bounds', function () {
    var shapes = [
      { points: [{ x: 0, y: 0 }, { x: 100, y: 100 }] },
      { points: [{ x: 200, y: 200 }, { x: 300, y: 400 }] }
    ];
    var b = L.computeShapesBounds(shapes);
    eq(b.minX, 0);
    eq(b.maxX, 300);
    eq(b.width, 300);
    eq(b.height, 400);
  });

  test('vertices field also supported', function () {
    var shape = { vertices: [{ x: 10, y: 20 }, { x: 40, y: 80 }] };
    var b = L.computeShapesBounds([shape]);
    eq(b.width, 30);
    eq(b.height, 60);
  });

  test('empty → zeros', function () {
    var b = L.computeShapesBounds([]);
    eq(b.width, 0);
    eq(b.height, 0);
  });

  test('null → zeros', function () {
    var b = L.computeShapesBounds(null);
    eq(b.width, 0);
  });
});


// ============================================================
console.log('\n════════════════════════════════════════');
console.log('  NouRion — designs.logic.js test results');
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
