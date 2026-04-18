/* ============================================================
   NouRion — modules/draw/draw.logic.js
   ------------------------------------------------------------
   Pure geometric logic for the Drawing module.
   NO DOM, NO canvas, NO localStorage.

   🚫 القاعدة الحمراء:
   كل الحسابات الهندسية منقولة حرفياً من pm_server/public/js/14-draw.js
   (4,356 سطر — أكبر module في النظام).
   هذا الـ module حسّاس جداً — أي تغيير يغيّر الرسومات الإنتاجية.

   المصادر:
   - _calcConstrainedSizes → 14-draw.js:349
   - _dwgBuildModel        → 14-draw.js:155
   - panel geometry        → 14-draw.js:276-334
   - glass deductions      → 14-draw.js:304-315
   - beads per panel       → 14-draw.js:317-329
   - tBar width resolver   → 14-draw.js:160-164
   ============================================================ */

(function (global) {
  'use strict';

  // ==========================================================
  // 1. CONSTANTS — القيم الافتراضية من 14-draw.js
  // ==========================================================
  var DEFAULT_SECTION_WIDTH = 23;   // عرض الحلق
  var DEFAULT_DECO          = 40;   // ديكوريشن خارجي
  var DEFAULT_TBAR_WIDTH    = 28;   // عرض قاطع T
  var DEFAULT_BEAD_WIDTH    = 22;   // البكلوز
  var DEFAULT_GLASS_DED     = 8;    // خصم الزجاج

  // ==========================================================
  // 2. resolveTBarWidth — حساب عرض T-bar من ملف القطاع
  //    منقول من 14-draw.js:160-164
  // ==========================================================
  function resolveTBarWidth(profile, fallback) {
    if (!profile || !profile.tBarLines || !profile.tBarLines.length) {
      return fallback != null ? fallback : DEFAULT_TBAR_WIDTH;
    }
    var lines = profile.tBarLines.filter(function (l) { return (l.wW || l.w || 0) > 0; });
    if (!lines.length) return fallback != null ? fallback : DEFAULT_TBAR_WIDTH;
    return lines.reduce(function (s, l) { return s + (l.wW || l.w || 0); }, 0);
  }

  // ==========================================================
  // 3. calcConstrainedSizes — توزيع مساحة مع overrides
  //    منقول حرفياً من 14-draw.js:349-362
  // ==========================================================
  function calcConstrainedSizes(available, count, overrides) {
    if (available <= 0 || count <= 0) {
      var zeros = [];
      for (var z = 0; z < count; z++) zeros.push(0);
      return zeros;
    }
    overrides = overrides || [];
    var sizes = [];
    var fixedSum = 0, fixedCount = 0;
    for (var i = 0; i < count; i++) {
      if (overrides[i] != null) {
        fixedSum += +overrides[i];
        fixedCount++;
      }
    }
    var autoVal = fixedCount < count
      ? Math.max(0, (available - fixedSum) / (count - fixedCount))
      : 0;
    for (var j = 0; j < count; j++) {
      sizes.push(overrides[j] != null ? +overrides[j] : Math.round(autoVal * 10) / 10);
    }
    return sizes;
  }

  // ==========================================================
  // 4. sashLetter — توليد حرف اللوح (A, B, C, ...)
  //    منقول من 14-draw.js:297 (String.fromCharCode(65 + idx))
  // ==========================================================
  function sashLetter(index) {
    return String.fromCharCode(65 + index);
  }

  // ==========================================================
  // 5. computeFrameSides — الأضلاع الأربعة للحلق
  //    منقول من 14-draw.js:176-189
  // ==========================================================
  function computeFrameSides(W, H, sec) {
    var innerW = W - 2 * sec;
    var innerH = H - 2 * sec;
    return [
      { id: 'frame_top',    type: 'frame', name: 'حلق علوي', orientation: 'horizontal',
        x: 0, y: 0, outerLength: W, innerLength: innerW,
        width: sec, cutStart: 'miter45', cutEnd: 'miter45' },
      { id: 'frame_bottom', type: 'frame', name: 'حلق سفلي', orientation: 'horizontal',
        x: 0, y: H - sec, outerLength: W, innerLength: innerW,
        width: sec, cutStart: 'miter45', cutEnd: 'miter45' },
      { id: 'frame_left',   type: 'frame', name: 'حلق أيسر', orientation: 'vertical',
        x: 0, y: 0, outerLength: H, innerLength: innerH,
        width: sec, cutStart: 'miter45', cutEnd: 'miter45' },
      { id: 'frame_right',  type: 'frame', name: 'حلق أيمن', orientation: 'vertical',
        x: W - sec, y: 0, outerLength: H, innerLength: innerH,
        width: sec, cutStart: 'miter45', cutEnd: 'miter45' }
    ];
  }

  // ==========================================================
  // 6. computePanelGrid — صف/عمود panels مع مواقعها
  //    مستخرج من 14-draw.js:282-334 (double loop)
  // ==========================================================
  function computePanelGrid(opts) {
    var sec    = opts.sec;
    var tBarW  = opts.tBarW;
    var bkz    = opts.bkz;
    var glassDed = opts.glassDed;
    var pWidths  = opts.pWidths;
    var pHeights = opts.pHeights;
    var divW   = pWidths.length;
    var divH   = pHeights.length;
    var doorBottom = opts.doorBottom !== false;
    var sashTypeFn = opts.sashTypeFn || function () { return 'fixed'; };

    var panels = [];
    var glassPieces = [];
    var beads = [];
    var bId = 0;

    var py = sec;
    for (var r = 0; r < divH; r++) {
      var px = sec;
      for (var c = 0; c < divW; c++) {
        var pw  = pWidths[c];
        var ph  = pHeights[r];
        var idx = r * divW + c;
        var sashType = sashTypeFn(r, c);
        var isDoor = doorBottom === false && r === divH - 1;

        // Panel opening
        var glassW = pw - 2 * bkz;
        var glassH = ph - (isDoor ? bkz : 2 * bkz);

        panels.push({
          id: 'panel_' + r + '_' + c, type: 'panel',
          name: sashLetter(idx),
          row: r, col: c, index: idx,
          x: px, y: py, w: pw, h: ph,
          glassW: Math.max(0, glassW),
          glassH: Math.max(0, glassH),
          sashType: sashType
        });

        // Glass (with deduction)
        var gw = glassW - glassDed;
        var gh = glassH - glassDed;
        glassPieces.push({
          id: 'glass_' + r + '_' + c, type: 'glass',
          name: 'زجاج ' + sashLetter(idx),
          row: r, col: c, index: idx,
          x: px + bkz, y: py + bkz,
          rawW: Math.max(0, glassW),
          rawH: Math.max(0, glassH),
          w:    Math.max(0, gw),
          h:    Math.max(0, gh),
          deductionW: glassDed,
          deductionH: glassDed
        });

        // Beads (4 per panel, 3 if door bottom)
        var beadNames = isDoor
          ? [
              { n: 'بكلوز علوي', o: 'h', l: pw - 2 * bkz },
              { n: 'بكلوز أيمن', o: 'v', l: ph - bkz },
              { n: 'بكلوز أيسر', o: 'v', l: ph - bkz }
            ]
          : [
              { n: 'بكلوز علوي', o: 'h', l: pw - 2 * bkz },
              { n: 'بكلوز سفلي', o: 'h', l: pw - 2 * bkz },
              { n: 'بكلوز أيمن', o: 'v', l: ph - 2 * bkz },
              { n: 'بكلوز أيسر', o: 'v', l: ph - 2 * bkz }
            ];

        beadNames.forEach(function (b) {
          beads.push({
            id: 'bead_' + (bId++), type: 'bead',
            name: b.n + ' ' + sashLetter(idx),
            panelIndex: idx,
            orientation: b.o,
            length: Math.max(0, b.l),
            cutStart: 'miter45', cutEnd: 'miter45'
          });
        });

        px += pw + (c < divW - 1 ? tBarW : 0);
      }
      py += pHeights[r] + (r < divH - 1 ? tBarW : 0);
    }

    return { panels: panels, glassPieces: glassPieces, beads: beads };
  }

  // ==========================================================
  // 7. computeTBars — منقول من 14-draw.js:200-274
  //    T-bars العمودية والأفقية مع منطق vFull
  // ==========================================================
  function computeTBars(opts) {
    var sec    = opts.sec;
    var tBarW  = opts.tBarW;
    var innerH = opts.innerH;
    var innerW = opts.innerW;
    var pWidths  = opts.pWidths;
    var pHeights = opts.pHeights;
    var divW   = pWidths.length;
    var divH   = pHeights.length;
    var vFull  = opts.vFull !== false;

    var tBars = [];
    var vBars = [];
    var hBars = [];

    // Vertical T-bars
    var xAccum = sec;
    for (var c = 0; c < divW - 1; c++) {
      xAccum += pWidths[c];
      if (vFull) {
        tBars.push({
          id: 'tbar_v_' + c, type: 'mullion', name: 'قاطع رأسي ' + (c + 1),
          orientation: 'vertical', isFull: true,
          x: xAccum, y: sec, w: tBarW, h: innerH, length: innerH,
          cutStart: 'miter45', cutEnd: 'miter45', index: c
        });
        vBars.push({ x: xAccum, y: sec, w: tBarW, h: innerH, index: c });
      } else {
        var yStart = sec;
        for (var r = 0; r < divH; r++) {
          var segH = pHeights[r];
          if (segH > 0) {
            tBars.push({
              id: 'tbar_v_' + c + '_seg_' + r, type: 'mullion',
              name: 'قاطع رأسي ' + (c + 1) + ' جزء ' + (r + 1),
              orientation: 'vertical', isFull: false, segment: r,
              x: xAccum, y: yStart, w: tBarW, h: segH, length: segH,
              cutStart: r === 0        ? 'miter45' : 'straight',
              cutEnd:   r === divH - 1 ? 'miter45' : 'straight',
              index: c
            });
          }
          yStart += segH + (r < divH - 1 ? tBarW : 0);
        }
        vBars.push({ x: xAccum, y: sec, w: tBarW, h: innerH, index: c });
      }
      xAccum += tBarW;
    }

    // Horizontal T-bars
    var yAccum = sec;
    for (var rr = 0; rr < divH - 1; rr++) {
      yAccum += pHeights[rr];
      if (!vFull) {
        tBars.push({
          id: 'tbar_h_' + rr, type: 'mullion', name: 'قاطع أفقي ' + (rr + 1),
          orientation: 'horizontal', isFull: true,
          x: sec, y: yAccum, w: innerW, h: tBarW, length: innerW,
          cutStart: 'miter45', cutEnd: 'miter45', index: rr
        });
        hBars.push({ x: sec, y: yAccum, w: innerW, h: tBarW, index: rr });
      } else {
        var xStart = sec;
        for (var cc = 0; cc < divW; cc++) {
          var segW = pWidths[cc];
          if (segW > 0) {
            tBars.push({
              id: 'tbar_h_' + rr + '_seg_' + cc, type: 'mullion',
              name: 'قاطع أفقي ' + (rr + 1) + ' جزء ' + (cc + 1),
              orientation: 'horizontal', isFull: false, segment: cc,
              x: xStart, y: yAccum, w: segW, h: tBarW, length: segW,
              cutStart: cc === 0        ? 'miter45' : 'straight',
              cutEnd:   cc === divW - 1 ? 'miter45' : 'straight',
              index: rr
            });
          }
          xStart += segW + (cc < divW - 1 ? tBarW : 0);
        }
        hBars.push({ x: sec, y: yAccum, w: innerW, h: tBarW, index: rr });
      }
      yAccum += tBarW;
    }

    return { tBars: tBars, vBars: vBars, hBars: hBars };
  }

  // ==========================================================
  // 8. buildModel — النموذج الكامل
  //    منقول حرفياً من 14-draw.js:155-345
  //    يأخذ حالة الرسم → يُرجع model كامل بكل العناصر الهندسية
  // ==========================================================
  function buildModel(dw, profile) {
    var W   = dw.W;
    var H   = dw.H;
    var sec = dw.sec || DEFAULT_SECTION_WIDTH;
    var deco = dw.deco || DEFAULT_DECO;
    var tBarW = resolveTBarWidth(profile, dw.tBarW);
    var divW = Math.max(1, dw.divW || 1);
    var divH = Math.max(1, dw.divH || 1);
    var bkz = dw.bead || DEFAULT_BEAD_WIDTH;
    var glassDed = dw.glassDed != null ? dw.glassDed : DEFAULT_GLASS_DED;
    var vFull = dw.vFull !== false;
    var doorBottom = dw.doorBottom !== false;

    var innerW = W - 2 * sec;
    var innerH = H - 2 * sec;

    // Frame sides
    var frameSides = computeFrameSides(W, H, sec);

    // Panel sizes
    var totalVBars = (divW - 1) * tBarW;
    var totalHBars = (divH - 1) * tBarW;
    var availW = innerW - totalVBars;
    var availH = innerH - totalHBars;
    var pWidths  = calcConstrainedSizes(availW, divW, dw.panelWidths);
    var pHeights = calcConstrainedSizes(availH, divH, dw.panelHeights);

    // T-bars
    var bars = computeTBars({
      sec: sec, tBarW: tBarW,
      innerW: innerW, innerH: innerH,
      pWidths: pWidths, pHeights: pHeights,
      vFull: vFull
    });

    // Panels + glass + beads
    var grid = computePanelGrid({
      sec: sec, tBarW: tBarW, bkz: bkz, glassDed: glassDed,
      pWidths: pWidths, pHeights: pHeights,
      doorBottom: doorBottom,
      sashTypeFn: dw.sashTypeFn
    });

    return {
      frame: { W: W, H: H, sec: sec, deco: deco, tBarW: tBarW, bkz: bkz, glassDed: glassDed, innerW: innerW, innerH: innerH, vFull: vFull },
      frameSides:  frameSides,
      pWidths:     pWidths,
      pHeights:    pHeights,
      tBars:       bars.tBars,
      vBars:       bars.vBars,
      hBars:       bars.hBars,
      panels:      grid.panels,
      glassPieces: grid.glassPieces,
      beads:       grid.beads,
      divW:        divW,
      divH:        divH
    };
  }

  // ==========================================================
  // 9. computeModelStats — إحصاءات للـ BOM
  // ==========================================================
  function computeModelStats(model) {
    if (!model) return { panels: 0, glass: 0, beads: 0, tBars: 0, totalArea: 0 };
    var totalArea = 0;
    (model.panels || []).forEach(function (p) {
      totalArea += (p.w / 1000) * (p.h / 1000);
    });
    var glassArea = 0;
    (model.glassPieces || []).forEach(function (g) {
      glassArea += (g.w / 1000) * (g.h / 1000);
    });
    var beadLength = 0;
    (model.beads || []).forEach(function (b) {
      beadLength += b.length;
    });
    var tBarLength = 0;
    (model.tBars || []).forEach(function (t) {
      tBarLength += t.length || 0;
    });
    var frameLength = 0;
    (model.frameSides || []).forEach(function (f) {
      frameLength += f.outerLength || 0;
    });
    return {
      panels:        (model.panels || []).length,
      glass:         (model.glassPieces || []).length,
      beads:         (model.beads || []).length,
      tBars:         (model.tBars || []).length,
      totalAreaM2:   Math.round(totalArea * 1000) / 1000,
      glassAreaM2:   Math.round(glassArea * 1000) / 1000,
      beadTotalMm:   beadLength,
      tBarTotalMm:   tBarLength,
      frameTotalMm:  frameLength
    };
  }

  // ==========================================================
  // 10. groupBeadsByOrientation — للـ cut list
  // ==========================================================
  function groupBeadsByOrientation(model) {
    if (!model || !model.beads) return { horizontal: [], vertical: [] };
    return {
      horizontal: model.beads.filter(function (b) { return b.orientation === 'h'; }),
      vertical:   model.beads.filter(function (b) { return b.orientation === 'v'; })
    };
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================
  var api = {
    // Constants
    DEFAULT_SECTION_WIDTH: DEFAULT_SECTION_WIDTH,
    DEFAULT_DECO:          DEFAULT_DECO,
    DEFAULT_TBAR_WIDTH:    DEFAULT_TBAR_WIDTH,
    DEFAULT_BEAD_WIDTH:    DEFAULT_BEAD_WIDTH,
    DEFAULT_GLASS_DED:     DEFAULT_GLASS_DED,
    // Geometry
    resolveTBarWidth:      resolveTBarWidth,
    calcConstrainedSizes:  calcConstrainedSizes,
    sashLetter:            sashLetter,
    computeFrameSides:     computeFrameSides,
    computePanelGrid:      computePanelGrid,
    computeTBars:          computeTBars,
    buildModel:            buildModel,
    // Stats
    computeModelStats:     computeModelStats,
    groupBeadsByOrientation:groupBeadsByOrientation
  };

  global.NouRion = global.NouRion || {};
  global.NouRion.DrawLogic = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
