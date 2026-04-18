/* ============================================================
   NouRion — draw.test.js
   ============================================================ */

var L = (typeof require !== 'undefined')
  ? require('./draw.logic.js')
  : window.NouRion.DrawLogic;

var passed = 0, failed = 0, failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log('  ✔ ' + name); }
  catch (e) { failed++; failures.push({ name: name, error: e.message }); console.log('  ✘ ' + name + '\n     → ' + e.message); }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' expected=' + JSON.stringify(b) + ' actual=' + JSON.stringify(a)); }
function near(a, b, tol, msg) { if (Math.abs(a - b) > (tol || 0.001)) throw new Error((msg || '') + ' expected≈' + b + ' actual=' + a); }
function truthy(v, msg) { if (!v) throw new Error(msg || 'expected truthy'); }
function group(n, fn) { console.log('\n── ' + n + ' ──'); fn(); }


// ============================================================
group('constants', function () {
  test('defaults', function () {
    eq(L.DEFAULT_SECTION_WIDTH, 23);
    eq(L.DEFAULT_DECO, 40);
    eq(L.DEFAULT_TBAR_WIDTH, 28);
    eq(L.DEFAULT_BEAD_WIDTH, 22);
    eq(L.DEFAULT_GLASS_DED, 8);
  });
});


// ============================================================
group('resolveTBarWidth', function () {
  test('null profile → fallback', function () {
    eq(L.resolveTBarWidth(null, 30), 30);
    eq(L.resolveTBarWidth(null), 28);
  });

  test('profile without tBarLines → fallback', function () {
    eq(L.resolveTBarWidth({ name: 'X' }, 25), 25);
  });

  test('profile with tBarLines sums wW', function () {
    eq(L.resolveTBarWidth({ tBarLines: [{ wW: 15 }, { wW: 20 }] }), 35);
  });

  test('profile with legacy .w field', function () {
    eq(L.resolveTBarWidth({ tBarLines: [{ w: 25 }] }), 25);
  });

  test('wW takes precedence over w', function () {
    eq(L.resolveTBarWidth({ tBarLines: [{ w: 10, wW: 30 }] }), 30);
  });

  test('filters out zero widths', function () {
    eq(L.resolveTBarWidth({ tBarLines: [{ wW: 0 }, { wW: 20 }] }), 20);
  });

  test('all zeros → fallback', function () {
    eq(L.resolveTBarWidth({ tBarLines: [{ wW: 0 }] }, 50), 50);
  });
});


// ============================================================
group('calcConstrainedSizes', function () {
  test('3 equal panels from 900mm', function () {
    var r = L.calcConstrainedSizes(900, 3);
    eq(r.length, 3);
    near(r[0], 300);
    near(r[1], 300);
    near(r[2], 300);
  });

  test('one fixed override, rest auto', function () {
    var r = L.calcConstrainedSizes(1000, 3, [400, null, null]);
    eq(r[0], 400);
    near(r[1], 300);
    near(r[2], 300);
  });

  test('multiple fixed', function () {
    var r = L.calcConstrainedSizes(1000, 4, [200, null, 300, null]);
    eq(r[0], 200);
    near(r[1], 250); // (1000 - 200 - 300) / 2 = 250
    eq(r[2], 300);
    near(r[3], 250);
  });

  test('all fixed', function () {
    var r = L.calcConstrainedSizes(1000, 3, [300, 400, 300]);
    eq(r[0], 300);
    eq(r[1], 400);
    eq(r[2], 300);
  });

  test('available ≤ 0 → zeros', function () {
    eq(L.calcConstrainedSizes(0, 3)[0], 0);
    eq(L.calcConstrainedSizes(-10, 3)[0], 0);
  });

  test('count = 0 → []', function () {
    eq(L.calcConstrainedSizes(100, 0).length, 0);
  });

  test('rounds to 1 decimal', function () {
    var r = L.calcConstrainedSizes(1000, 3);
    // 1000/3 = 333.333... → 333.3
    eq(r[0], 333.3);
  });

  test('over-fixed → autoVal clamped to 0', function () {
    var r = L.calcConstrainedSizes(500, 3, [300, null, null]);
    // remaining = 200, avail per auto = 100
    near(r[1], 100);
    near(r[2], 100);
  });
});


// ============================================================
group('sashLetter', function () {
  test('0 → A', function () { eq(L.sashLetter(0), 'A'); });
  test('1 → B', function () { eq(L.sashLetter(1), 'B'); });
  test('25 → Z', function () { eq(L.sashLetter(25), 'Z'); });
});


// ============================================================
group('computeFrameSides', function () {
  test('4 sides with correct dimensions', function () {
    var sides = L.computeFrameSides(2000, 1500, 23);
    eq(sides.length, 4);

    var top = sides[0];
    eq(top.id, 'frame_top');
    eq(top.outerLength, 2000);
    eq(top.innerLength, 2000 - 46);
    eq(top.width, 23);
    eq(top.cutStart, 'miter45');
    eq(top.cutEnd, 'miter45');

    var bottom = sides[1];
    eq(bottom.y, 1500 - 23);
    eq(bottom.outerLength, 2000);

    var left = sides[2];
    eq(left.orientation, 'vertical');
    eq(left.outerLength, 1500);

    var right = sides[3];
    eq(right.x, 2000 - 23);
  });
});


// ============================================================
group('computePanelGrid', function () {
  var baseOpts = {
    sec: 23, tBarW: 28, bkz: 22, glassDed: 8,
    pWidths:  [500, 500],
    pHeights: [1000],
    doorBottom: true
  };

  test('2 panels × 1 row', function () {
    var r = L.computePanelGrid(baseOpts);
    eq(r.panels.length, 2);
    eq(r.glassPieces.length, 2);
    eq(r.beads.length, 8); // 4 per panel
  });

  test('panel names A, B', function () {
    var r = L.computePanelGrid(baseOpts);
    eq(r.panels[0].name, 'A');
    eq(r.panels[1].name, 'B');
  });

  test('glass dimensions = panel − 2×bkz − glassDed', function () {
    var r = L.computePanelGrid(baseOpts);
    var g = r.glassPieces[0];
    eq(g.w, 500 - 2 * 22 - 8); // 448
    eq(g.h, 1000 - 2 * 22 - 8); // 948
  });

  test('door bottom row has 3 beads per panel', function () {
    var opts = Object.assign({}, baseOpts, {
      pHeights: [500, 1000],
      doorBottom: false  // means last row IS door (per original logic)
    });
    var r = L.computePanelGrid(opts);
    // row 0 = normal (4 beads each), row 1 = door (3 beads each)
    // 2 panels × 4 beads (row 0) + 2 panels × 3 beads (row 1) = 14
    eq(r.beads.length, 14);
  });

  test('panel positions advance correctly', function () {
    var r = L.computePanelGrid(baseOpts);
    eq(r.panels[0].x, 23); // sec
    eq(r.panels[1].x, 23 + 500 + 28); // sec + pw[0] + tBarW
  });

  test('zero panels when dims are 0', function () {
    var r = L.computePanelGrid(Object.assign({}, baseOpts, { pWidths: [0], pHeights: [0] }));
    eq(r.panels.length, 1);
    eq(r.panels[0].w, 0);
    eq(r.panels[0].glassW, 0);
  });

  test('bead lengths for normal panel', function () {
    var r = L.computePanelGrid(baseOpts);
    var beadsA = r.beads.filter(function (b) { return b.panelIndex === 0; });
    // horizontal beads length = pw - 2×bkz
    var hBead = beadsA.find(function (b) { return b.orientation === 'h'; });
    eq(hBead.length, 500 - 2 * 22); // 456
    // vertical beads length = ph - 2×bkz
    var vBead = beadsA.find(function (b) { return b.orientation === 'v'; });
    eq(vBead.length, 1000 - 2 * 22); // 956
  });

  test('custom sashTypeFn', function () {
    var r = L.computePanelGrid(Object.assign({}, baseOpts, {
      sashTypeFn: function (row, col) { return col === 0 ? 'fixed' : 'sliding'; }
    }));
    eq(r.panels[0].sashType, 'fixed');
    eq(r.panels[1].sashType, 'sliding');
  });
});


// ============================================================
group('computeTBars', function () {
  var base = {
    sec: 23, tBarW: 28,
    innerW: 2000 - 46, innerH: 1500 - 46,
    pWidths:  [600, 600, 600],
    pHeights: [700, 700],
    vFull: true
  };

  test('vFull=true: 2 vertical + 1 horizontal', function () {
    var r = L.computeTBars(base);
    // vFull vertical = single piece, divW=3 → 2 vertical
    var vs = r.tBars.filter(function (t) { return t.orientation === 'vertical'; });
    eq(vs.length, 2);
    eq(vs[0].isFull, true);

    // horizontal with vFull=true are split per column → divH-1 rows × divW columns = 1×3 = 3
    var hs = r.tBars.filter(function (t) { return t.orientation === 'horizontal'; });
    eq(hs.length, 3);
  });

  test('vFull=false: horizontal is full, vertical is split', function () {
    var opts = Object.assign({}, base, { vFull: false });
    var r = L.computeTBars(opts);
    // horizontal full: divH-1 = 1
    var hs = r.tBars.filter(function (t) { return t.orientation === 'horizontal'; });
    eq(hs.length, 1);
    eq(hs[0].isFull, true);

    // vertical split: (divW-1) × divH = 2 × 2 = 4
    var vs = r.tBars.filter(function (t) { return t.orientation === 'vertical'; });
    eq(vs.length, 4);
  });

  test('1 division = no tBars', function () {
    var opts = Object.assign({}, base, { pWidths: [1800], pHeights: [1400] });
    var r = L.computeTBars(opts);
    eq(r.tBars.length, 0);
  });
});


// ============================================================
group('buildModel (integration)', function () {
  var dw = {
    W: 2000, H: 1500,
    sec: 23, tBarW: 28, bead: 22, glassDed: 8,
    divW: 2, divH: 1,
    panelWidths: [], panelHeights: [],
    vFull: true,
    doorBottom: true
  };

  test('returns complete model', function () {
    var m = L.buildModel(dw, null);
    truthy(m.frame);
    truthy(m.frameSides);
    truthy(m.panels);
    truthy(m.glassPieces);
    truthy(m.beads);
    truthy(m.tBars);
  });

  test('frame properties', function () {
    var m = L.buildModel(dw, null);
    eq(m.frame.W, 2000);
    eq(m.frame.H, 1500);
    eq(m.frame.innerW, 2000 - 46);
    eq(m.frame.innerH, 1500 - 46);
  });

  test('2 panels', function () {
    var m = L.buildModel(dw, null);
    eq(m.panels.length, 2);
  });

  test('1 vertical tBar', function () {
    var m = L.buildModel(dw, null);
    eq(m.tBars.length, 1);
  });

  test('panel widths sum correctly', function () {
    var m = L.buildModel(dw, null);
    // innerW = 1954, tBar = 28, avail = 1926, each = 963
    near(m.pWidths[0], 963);
    near(m.pWidths[1], 963);
  });

  test('profile overrides tBarW', function () {
    var m = L.buildModel(dw, { tBarLines: [{ wW: 40 }] });
    eq(m.frame.tBarW, 40);
  });

  test('3×2 grid = 6 panels', function () {
    var grid = Object.assign({}, dw, { divW: 3, divH: 2 });
    var m = L.buildModel(grid, null);
    eq(m.panels.length, 6);
    eq(m.glassPieces.length, 6);
    // panels A..F
    eq(m.panels[0].name, 'A');
    eq(m.panels[5].name, 'F');
  });
});


// ============================================================
group('computeModelStats', function () {
  var dw = {
    W: 2000, H: 1500, sec: 23, tBarW: 28, bead: 22, glassDed: 8,
    divW: 2, divH: 1, panelWidths: [], panelHeights: []
  };

  test('basic stats', function () {
    var m = L.buildModel(dw, null);
    var s = L.computeModelStats(m);
    eq(s.panels, 2);
    eq(s.glass, 2);
    truthy(s.beads > 0);
    truthy(s.totalAreaM2 > 0);
    truthy(s.glassAreaM2 > 0);
    truthy(s.frameTotalMm > 0);
  });

  test('frameTotalMm = perimeter', function () {
    var m = L.buildModel(dw, null);
    var s = L.computeModelStats(m);
    // 2×W + 2×H = 2×2000 + 2×1500 = 7000
    eq(s.frameTotalMm, 7000);
  });

  test('null model', function () {
    var s = L.computeModelStats(null);
    eq(s.panels, 0);
  });
});


// ============================================================
group('groupBeadsByOrientation', function () {
  test('splits horizontal/vertical', function () {
    var m = L.buildModel({
      W: 1500, H: 1500, sec: 23, tBarW: 28, bead: 22, glassDed: 8,
      divW: 1, divH: 1, panelWidths: [], panelHeights: []
    }, null);
    var g = L.groupBeadsByOrientation(m);
    eq(g.horizontal.length, 2); // top + bottom
    eq(g.vertical.length, 2);   // left + right
  });

  test('null model', function () {
    var g = L.groupBeadsByOrientation(null);
    eq(g.horizontal.length, 0);
  });
});


// ============================================================
console.log('\n════════════════════════════════════════');
console.log('  NouRion — draw.logic.js test results');
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
