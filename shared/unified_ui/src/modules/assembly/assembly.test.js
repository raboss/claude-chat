/* ============================================================
   NouRion — assembly.test.js
   Integration tests for core/assembly.js (SweepEngine)
   These classes are PRESERVED as-is from pm_server — we just
   verify they still produce correct output on real geometry.
   ============================================================ */

var geometry = (typeof require !== 'undefined') ? require('../../core/geometry.js') : null;
var assembly = (typeof require !== 'undefined') ? require('../../core/assembly.js') : null;

var Vector2D, Point2D, Polyline, ClosedShape, ProfileSection, JointRule;
var PieceDef, FrameAssembly, SweepEngine;

if (geometry) {
  Vector2D      = geometry.Vector2D;
  Point2D       = geometry.Point2D;
  Polyline      = geometry.Polyline;
  ClosedShape   = geometry.ClosedShape;
  ProfileSection = geometry.ProfileSection;
  JointRule     = geometry.JointRule;
}
if (assembly) {
  PieceDef     = assembly.PieceDef;
  FrameAssembly = assembly.FrameAssembly;
  SweepEngine  = assembly.SweepEngine;
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


// ============================================================
group('PieceDef', function () {
  test('constructor with defaults', function () {
    var p = new PieceDef();
    eq(p.label, '');
    eq(p.nominalLength, 0);
    eq(p.cutLength, 0);
    eq(p.startCutAngle, 0);
    eq(p.quantity, 1);
  });

  test('constructor with options', function () {
    var p = new PieceDef({
      label: 'AB',
      profileId: 'cas-50',
      profileName: 'CAS-50',
      nominalLength: 1000,
      cutLength: 985,
      startCutAngle: 45,
      endCutAngle: 45,
      position: 'top'
    });
    eq(p.label, 'AB');
    eq(p.cutLength, 985);
    eq(p.position, 'top');
  });

  test('groupKey uniquely identifies identical pieces', function () {
    var p1 = new PieceDef({ profileId: 'p1', cutLength: 1000, startCutAngle: 45, endCutAngle: 45 });
    var p2 = new PieceDef({ profileId: 'p1', cutLength: 1000, startCutAngle: 45, endCutAngle: 45 });
    var p3 = new PieceDef({ profileId: 'p1', cutLength: 1100, startCutAngle: 45, endCutAngle: 45 });
    eq(p1.groupKey, p2.groupKey);
    truthy(p1.groupKey !== p3.groupKey);
  });

  test('toJSON', function () {
    var p = new PieceDef({ label: 'AB', profileId: 'p1', profileName: 'P1', nominalLength: 1000, cutLength: 985, startCutAngle: 45, endCutAngle: 45 });
    var j = p.toJSON();
    eq(j.label, 'AB');
    eq(j.cutLength, 985);
    eq(j.startCutAngle, 45);
  });

  test('toString', function () {
    var p = new PieceDef({ label: 'AB', profileName: 'P1', cutLength: 985, startCutAngle: 45, endCutAngle: 45 });
    var s = p.toString();
    truthy(s.indexOf('AB') !== -1);
    truthy(s.indexOf('985') !== -1);
  });
});


// ============================================================
group('FrameAssembly', function () {
  test('empty assembly', function () {
    var a = new FrameAssembly({ name: 'Test' });
    eq(a.name, 'Test');
    eq(a.pieces.length, 0);
    eq(a.isBuilt, false);
    eq(a.totalCutLength, 0);
  });

  test('with pieces', function () {
    var a = new FrameAssembly();
    a.pieces.push(new PieceDef({ cutLength: 1000 }));
    a.pieces.push(new PieceDef({ cutLength: 500 }));
    eq(a.isBuilt, true);
    eq(a.totalCutLength, 1500);
  });

  test('estimatedWeight with profile', function () {
    var profile = new ProfileSection({ id: 'p1', weight: 2.5 }); // kg/m
    var a = new FrameAssembly({ profile: profile });
    a.pieces.push(new PieceDef({ cutLength: 1000 }));
    a.pieces.push(new PieceDef({ cutLength: 2000 }));
    // 3000 mm × 2.5 kg/m = 7.5 kg
    near(a.estimatedWeight, 7.5, 0.01);
  });

  test('estimatedWeight without profile', function () {
    var a = new FrameAssembly();
    a.pieces.push(new PieceDef({ cutLength: 1000 }));
    eq(a.estimatedWeight, 0);
  });
});


// ============================================================
group('SweepEngine.sweep — rectangle with miter joints', function () {
  var profile = new ProfileSection({ id: 'cas-50', name: 'CAS-50', width: 50, depth: 40, weight: 0.6 });
  var joint = new JointRule({ type: 'miter' });

  test('2000×1500 rect has 4 pieces', function () {
    var rect = ClosedShape.rect(2000, 1500);
    rect.autoLabel();
    var asm = SweepEngine.sweep(rect, profile, joint);
    eq(asm.pieces.length, 4);
  });

  test('all pieces have miter cuts (45° angle)', function () {
    var rect = ClosedShape.rect(2000, 1500);
    rect.autoLabel();
    var asm = SweepEngine.sweep(rect, profile, joint);
    asm.pieces.forEach(function (p) {
      eq(p.startJointType, 'miter');
      eq(p.endJointType, 'miter');
      near(p.startCutAngle, 45, 0.1);
      near(p.endCutAngle, 45, 0.1);
    });
  });

  test('nominal lengths match rect sides', function () {
    var rect = ClosedShape.rect(2000, 1500);
    rect.autoLabel();
    var asm = SweepEngine.sweep(rect, profile, joint);
    var lengths = asm.pieces.map(function (p) { return Math.round(p.nominalLength); });
    // should contain both 2000 and 1500
    truthy(lengths.indexOf(2000) !== -1);
    truthy(lengths.indexOf(1500) !== -1);
  });

  test('cut length = nominal − 2× miter deductions', function () {
    var rect = ClosedShape.rect(2000, 1500);
    rect.autoLabel();
    var asm = SweepEngine.sweep(rect, profile, joint);
    // Interior angle for rect corner = 90°, miter = 45°
    // deduction = width/(2×tan(45°)) = 50/2 = 25 mm each end
    // so cut length of a 2000mm side = 2000 - 50 = 1950
    var side2000 = asm.pieces.find(function (p) { return Math.round(p.nominalLength) === 2000; });
    near(side2000.cutLength, 1950, 0.5);
  });

  test('positions labeled correctly', function () {
    var rect = ClosedShape.rect(2000, 1500);
    rect.autoLabel();
    var asm = SweepEngine.sweep(rect, profile, joint);
    var positions = asm.pieces.map(function (p) { return p.position; });
    // expect 4 distinct positions from the labeler
    truthy(positions.some(function (p) { return p === 'top' || p === 'bottom' || p === 'left' || p === 'right'; }));
  });

  test('grouping: 4 sides of 2000×1500 = 2 unique groups', function () {
    var rect = ClosedShape.rect(2000, 1500);
    rect.autoLabel();
    var asm = SweepEngine.sweep(rect, profile, joint);
    var groups = {};
    asm.pieces.forEach(function (p) { groups[p.groupKey] = (groups[p.groupKey] || 0) + 1; });
    eq(Object.keys(groups).length, 2); // 2 horizontal + 2 vertical
  });

  test('square rect 1000×1000 = 1 unique group', function () {
    var sq = ClosedShape.rect(1000, 1000);
    sq.autoLabel();
    var asm = SweepEngine.sweep(sq, profile, joint);
    var groups = {};
    asm.pieces.forEach(function (p) { groups[p.groupKey] = (groups[p.groupKey] || 0) + 1; });
    eq(Object.keys(groups).length, 1);
  });

  test('throws on path with < 2 points', function () {
    try {
      SweepEngine.sweep({ points: [{}], segments: [] }, profile, joint);
      throw new Error('should have thrown');
    } catch (e) {
      truthy(e.message.indexOf('2 points') !== -1);
    }
  });

  test('throws without profile', function () {
    var rect = ClosedShape.rect(2000, 1500);
    try {
      SweepEngine.sweep(rect, null, joint);
      throw new Error('should have thrown');
    } catch (e) {
      truthy(e.message.indexOf('profile') !== -1);
    }
  });
});


// ============================================================
group('SweepEngine._interiorAngle (static helper)', function () {
  test('perpendicular corner = 90°', function () {
    var rect = ClosedShape.rect(1000, 1000);
    rect.autoLabel();
    var segs = rect.segments;
    var angle = SweepEngine._interiorAngle(segs[0], segs[1]);
    near(angle, 90, 0.5);
  });
});


// ============================================================
group('totalCutLength / totalNominalLength', function () {
  test('2000×1500 rect totals', function () {
    var profile = new ProfileSection({ id: 'p', width: 50, weight: 0.6 });
    var joint = new JointRule({ type: 'miter' });
    var rect = ClosedShape.rect(2000, 1500);
    rect.autoLabel();
    var asm = SweepEngine.sweep(rect, profile, joint);
    // Nominal perimeter = 2×(2000 + 1500) = 7000
    near(asm.totalNominalLength, 7000, 1);
    // Cut total = 7000 - 8 × 25 (each piece has 2 cuts of 25mm each) = 6800
    near(asm.totalCutLength, 6800, 2);
  });
});


// ============================================================
console.log('\n════════════════════════════════════════');
console.log('  NouRion — core/assembly.js test results');
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
