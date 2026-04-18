/* ============================================================
   NouRion — manufacturing.test.js
   Integration tests for core/manufacturing.js
   CutList, BOM, GlassCalculator, AccessoryPlacer, ManufacturingReport
   ============================================================ */

var geometry = (typeof require !== 'undefined') ? require('../../core/geometry.js') : null;
var assembly = (typeof require !== 'undefined') ? require('../../core/assembly.js') : null;
var mfg      = (typeof require !== 'undefined') ? require('../../core/manufacturing.js') : null;

var ClosedShape, ProfileSection, JointRule, SweepEngine;
var CutListItem, BOMRow, CutList, GlassCalculator, AccessoryPlacer, ManufacturingReport;

if (geometry) {
  ClosedShape = geometry.ClosedShape;
  ProfileSection = geometry.ProfileSection;
  JointRule = geometry.JointRule;
}
if (assembly) SweepEngine = assembly.SweepEngine;
if (mfg) {
  CutListItem = mfg.CutListItem;
  BOMRow = mfg.BOMRow;
  CutList = mfg.CutList;
  GlassCalculator = mfg.GlassCalculator;
  AccessoryPlacer = mfg.AccessoryPlacer;
  ManufacturingReport = mfg.ManufacturingReport;
}

var passed = 0, failed = 0, failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log('  ✔ ' + name); }
  catch (e) { failed++; failures.push({ name: name, error: e.message }); console.log('  ✘ ' + name + '\n     → ' + e.message); }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' expected=' + JSON.stringify(b) + ' actual=' + JSON.stringify(a)); }
function near(a, b, tol, msg) { if (Math.abs(a - b) > (tol || 0.1)) throw new Error((msg || '') + ' expected≈' + b + ' actual=' + a); }
function truthy(v, msg) { if (!v) throw new Error(msg || 'expected truthy'); }
function group(n, fn) { console.log('\n── ' + n + ' ──'); fn(); }

// ── helper: build a test assembly ──
function buildTestAssembly(w, h) {
  var profile = new ProfileSection({ id: 'cas-50', name: 'CAS-50', width: 50, weight: 0.6 });
  var joint = new JointRule({ type: 'miter' });
  var rect = ClosedShape.rect(w, h);
  rect.autoLabel();
  return {
    assembly: SweepEngine.sweep(rect, profile, joint),
    profile:  profile
  };
}


// ============================================================
group('CutListItem', function () {
  test('built from piece', function () {
    var ctx = buildTestAssembly(2000, 1500);
    var item = new CutListItem(ctx.assembly.pieces[0]);
    truthy(item.label);
    truthy(item.profileName);
    truthy(item.cutLength > 0);
    truthy(item.quantity >= 1);
  });

  test('cutInstruction formatted', function () {
    var ctx = buildTestAssembly(2000, 1500);
    var item = new CutListItem(ctx.assembly.pieces[0]);
    var s = item.cutInstruction;
    truthy(s.length > 0);
  });

  test('toJSON has required fields', function () {
    var ctx = buildTestAssembly(2000, 1500);
    var item = new CutListItem(ctx.assembly.pieces[0]);
    var j = item.toJSON();
    truthy(j.label);
    truthy(j.profile);
    truthy(j.cutLength > 0);
    truthy(j.vertices);
  });
});


// ============================================================
group('BOMRow', function () {
  test('quantity sums from items', function () {
    var ctx = buildTestAssembly(1000, 1000); // square → 1 unique group × 4
    var cl = new CutList(ctx.assembly);
    var bom = cl.bom;
    eq(bom.length, 1);
    eq(bom[0].quantity, 4);
  });

  test('2000×1500 → 2 rows × 2', function () {
    var ctx = buildTestAssembly(2000, 1500);
    var cl = new CutList(ctx.assembly);
    var bom = cl.bom;
    eq(bom.length, 2);
    bom.forEach(function (row) { eq(row.quantity, 2); });
  });

  test('totalLength per row', function () {
    var ctx = buildTestAssembly(1000, 1000);
    var cl = new CutList(ctx.assembly);
    var row = cl.bom[0];
    near(row.totalLength, row.quantity * row.cutLength, 0.1);
  });

  test('toJSON has labels', function () {
    var ctx = buildTestAssembly(1000, 1000);
    var cl = new CutList(ctx.assembly);
    var j = cl.bom[0].toJSON();
    truthy(j.labels);
    truthy(j.totalLength > 0);
  });
});


// ============================================================
group('CutList', function () {
  test('items count = pieces count', function () {
    var ctx = buildTestAssembly(2000, 1500);
    var cl = new CutList(ctx.assembly);
    eq(cl.items.length, 4);
  });

  test('totalPieces', function () {
    var ctx = buildTestAssembly(2000, 1500);
    var cl = new CutList(ctx.assembly);
    eq(cl.totalPieces, 4);
  });

  test('grandTotalLength matches assembly total', function () {
    var ctx = buildTestAssembly(2000, 1500);
    var cl = new CutList(ctx.assembly);
    near(cl.grandTotalLength, ctx.assembly.totalCutLength, 1);
  });

  test('totalsByProfile', function () {
    var ctx = buildTestAssembly(2000, 1500);
    var cl = new CutList(ctx.assembly);
    var totals = cl.totalsByProfile;
    eq(totals.length, 1); // single profile
    eq(totals[0].profileId, 'cas-50');
    eq(totals[0].count, 4);
    truthy(totals[0].totalLength > 0);
  });

  test('toTable has 11 columns per row', function () {
    var ctx = buildTestAssembly(2000, 1500);
    var cl = new CutList(ctx.assembly);
    var rows = cl.toTable();
    eq(rows.length, 4);
    rows.forEach(function (r) {
      truthy(r.no);
      truthy(r.label);
      truthy(r.profile);
      truthy(r.cutLength > 0);
    });
  });

  test('toJSON serializable', function () {
    var ctx = buildTestAssembly(2000, 1500);
    var cl = new CutList(ctx.assembly);
    var j = cl.toJSON();
    eq(j.items.length, 4);
    eq(j.bom.length, 2);
    eq(j.totalPieces, 4);
  });
});


// ============================================================
group('GlassCalculator', function () {
  test('calculates glass for rect frame', function () {
    var ctx = buildTestAssembly(2000, 1500);
    var glass = GlassCalculator.calculate(ctx.assembly, { rebate: 15, gap: 3 });
    eq(glass.length, 1);
    eq(glass[0].label, 'G1');
    // glass W = 2000 - 2 × (15 + 3) = 1964
    near(glass[0].width, 1964, 0.5);
    near(glass[0].height, 1464, 0.5);
  });

  test('area in m²', function () {
    var ctx = buildTestAssembly(2000, 1500);
    var glass = GlassCalculator.calculate(ctx.assembly);
    // default rebate 15 + gap 3 = 18 each side
    // W = 2000 - 36 = 1964, H = 1500 - 36 = 1464
    // area = 1964 × 1464 / 1e6 ≈ 2.875
    near(glass[0].area, 2.875, 0.01);
  });

  test('custom rebate', function () {
    var ctx = buildTestAssembly(1000, 1000);
    var glass = GlassCalculator.calculate(ctx.assembly, { rebate: 10, gap: 2 });
    // W = 1000 - 24 = 976
    near(glass[0].width, 976);
  });

  test('default thickness 6mm', function () {
    var ctx = buildTestAssembly(1000, 1000);
    var glass = GlassCalculator.calculate(ctx.assembly);
    eq(glass[0].thickness, 6);
  });

  test('no path → empty', function () {
    var glass = GlassCalculator.calculate({ path: null });
    eq(glass.length, 0);
  });
});


// ============================================================
group('AccessoryPlacer', function () {
  test('places hinges + handle + lock by default', function () {
    var ctx = buildTestAssembly(1000, 2200);
    var accs = AccessoryPlacer.place(ctx.assembly);
    var hinges = accs.filter(function (a) { return a.type === 'hinge'; });
    var handles = accs.filter(function (a) { return a.type === 'handle'; });
    var locks = accs.filter(function (a) { return a.type === 'lock'; });
    truthy(hinges.length >= 2);
    eq(handles.length, 1);
    eq(locks.length, 1);
  });

  test('hinge count depends on hingeSpacing', function () {
    var ctx = buildTestAssembly(1000, 2200);
    var a1 = AccessoryPlacer.place(ctx.assembly, { hingeSpacing: 600 });
    var a2 = AccessoryPlacer.place(ctx.assembly, { hingeSpacing: 300 });
    var h1 = a1.filter(function (a) { return a.type === 'hinge'; }).length;
    var h2 = a2.filter(function (a) { return a.type === 'hinge'; }).length;
    truthy(h2 > h1); // smaller spacing = more hinges
  });

  test('disable handles via options', function () {
    var ctx = buildTestAssembly(1000, 2200);
    var accs = AccessoryPlacer.place(ctx.assembly, { handle: false, lock: false });
    eq(accs.filter(function (a) { return a.type === 'handle'; }).length, 0);
    eq(accs.filter(function (a) { return a.type === 'lock'; }).length, 0);
  });

  test('rollers option adds 2 rollers', function () {
    var ctx = buildTestAssembly(2000, 1500);
    var accs = AccessoryPlacer.place(ctx.assembly, { rollers: true });
    var rollers = accs.filter(function (a) { return a.type === 'roller'; });
    eq(rollers.length, 2);
  });

  test('empty assembly → empty result', function () {
    var emptyAsm = { pieces: [] };
    var accs = AccessoryPlacer.place(emptyAsm);
    eq(accs.length, 0);
  });
});


// ============================================================
group('ManufacturingReport', function () {
  test('summary for 2000×1500', function () {
    var ctx = buildTestAssembly(2000, 1500);
    var report = new ManufacturingReport(ctx.assembly, ctx.profile);
    var s = report.summary;
    eq(s.totalPieces, 4);
    truthy(s.totalLength_mm > 6000);
    truthy(s.totalLength_m > 6);
    truthy(s.weight_kg > 0);
    truthy(s.glassArea_m2 > 2);
    truthy(s.accessoryCount > 0);
  });

  test('weight = perimeter × profile.weight / 1000', function () {
    var ctx = buildTestAssembly(2000, 1500);
    var report = new ManufacturingReport(ctx.assembly, ctx.profile);
    // totalCutLength ≈ 6800 mm, profile.weight = 0.6 kg/m
    // weight = 6.8 × 0.6 = 4.08 kg
    near(report.summary.weight_kg, 4.08, 0.1);
  });

  test('createdAt is ISO string', function () {
    var ctx = buildTestAssembly(1000, 1000);
    var report = new ManufacturingReport(ctx.assembly, ctx.profile);
    truthy(/^\d{4}-\d{2}-\d{2}T/.test(report.createdAt));
  });

  test('toJSON has all sections', function () {
    var ctx = buildTestAssembly(2000, 1500);
    var report = new ManufacturingReport(ctx.assembly, ctx.profile);
    var j = report.toJSON();
    truthy(j.summary);
    truthy(j.cutList);
    truthy(j.glass);
    truthy(j.accessories);
    truthy(j.createdAt);
  });

  test('toHTML contains table and summary', function () {
    var ctx = buildTestAssembly(2000, 1500);
    var report = new ManufacturingReport(ctx.assembly, ctx.profile);
    var html = report.toHTML();
    truthy(html.indexOf('<table') !== -1);
    truthy(html.indexOf('قائمة القطع') !== -1);
    truthy(html.indexOf('إجمالي القطع') !== -1);
  });

  test('glass options passed through', function () {
    var ctx = buildTestAssembly(2000, 1500);
    var report = new ManufacturingReport(ctx.assembly, ctx.profile, { rebate: 20, gap: 5, thickness: 10 });
    eq(report.glass[0].thickness, 10);
    eq(report.glass[0].rebate, 20);
    eq(report.glass[0].gap, 5);
  });

  test('accessory options passed through', function () {
    var ctx = buildTestAssembly(2000, 1500);
    var r1 = new ManufacturingReport(ctx.assembly, ctx.profile, {}, { hingeSpacing: 300 });
    var r2 = new ManufacturingReport(ctx.assembly, ctx.profile, {}, { hingeSpacing: 1000 });
    truthy(r1.accessories.length >= r2.accessories.length);
  });
});


// ============================================================
console.log('\n════════════════════════════════════════');
console.log('  NouRion — core/manufacturing.js test results');
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
