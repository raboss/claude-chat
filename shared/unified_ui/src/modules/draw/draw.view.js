/* ============================================================
   NouRion — modules/draw/draw.view.js
   Pure SVG renderer for the Drawing module.
   No canvas, no DOM state — takes a model → returns SVG element.
   ============================================================ */

(function (global) {
  'use strict';

  var L = (global.NouRion && global.NouRion.DrawLogic) || null;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function svg(tag, attrs, children) {
    var n = document.createElementNS(SVG_NS, tag);
    if (attrs) for (var k in attrs) {
      if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    }
    if (children) for (var i = 0; i < children.length; i++) {
      if (children[i] != null) n.appendChild(children[i]);
    }
    return n;
  }

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    if (children) for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (c == null) continue;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return n;
  }

  function fmtNum(n, decimals) {
    if (n == null || isNaN(n)) return '—';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals != null ? decimals : 0,
      maximumFractionDigits: decimals != null ? decimals : 2
    }).format(n);
  }

  // ==========================================================
  // 1. SVG renderer — model → SVG element
  // ==========================================================
  function renderModel(model, options) {
    options = options || {};
    var padding = options.padding || 80;
    var showDims = options.showDims !== false;
    var showLabels = options.showLabels !== false;
    var glassColor = options.glassColor || '#4dd4ff22';
    var frameColor = options.frameColor || '#8a8a92';
    var accentColor = options.accentColor || '#0099ff';
    var textColor = options.textColor || '#c8c8cf';

    if (!model || !model.frame) {
      return svg('svg', { viewBox: '0 0 400 200' }, [
        svg('text', {
          x: 200, y: 100, 'text-anchor': 'middle',
          fill: textColor, 'font-size': '14', 'font-family': 'Space Grotesk'
        }, [document.createTextNode('لا يوجد نموذج للرسم')])
      ]);
    }

    var W = model.frame.W;
    var H = model.frame.H;
    var vbW = W + padding * 2;
    var vbH = H + padding * 2;

    var root = svg('svg', {
      xmlns: SVG_NS,
      viewBox: '0 0 ' + vbW + ' ' + vbH,
      'font-family': 'Space Grotesk, sans-serif'
    });

    // Translate all content by padding
    var g = svg('g', { transform: 'translate(' + padding + ',' + padding + ')' });
    root.appendChild(g);

    // === 1. Glass panels (background layer) ===
    (model.glassPieces || []).forEach(function (gl) {
      g.appendChild(svg('rect', {
        x: gl.x, y: gl.y, width: gl.w, height: gl.h,
        fill: glassColor,
        stroke: '#4dd4ff',
        'stroke-width': 1
      }));
    });

    // === 2. Frame (outer) ===
    var sec = model.frame.sec;
    g.appendChild(svg('rect', {
      x: 0, y: 0, width: W, height: H,
      fill: 'none',
      stroke: frameColor,
      'stroke-width': sec,
      'stroke-linejoin': 'miter'
    }));

    // === 3. T-Bars ===
    (model.tBars || []).forEach(function (t) {
      g.appendChild(svg('rect', {
        x: t.x, y: t.y, width: t.w, height: t.h,
        fill: frameColor,
        stroke: '#555',
        'stroke-width': 1
      }));
    });

    // === 4. Panel labels ===
    if (showLabels) {
      (model.panels || []).forEach(function (p) {
        var cx = p.x + p.w / 2;
        var cy = p.y + p.h / 2;
        // Label circle
        g.appendChild(svg('circle', {
          cx: cx, cy: cy, r: 36,
          fill: accentColor + '22',
          stroke: accentColor,
          'stroke-width': 2
        }));
        // Letter
        g.appendChild(svg('text', {
          x: cx, y: cy + 14,
          'text-anchor': 'middle',
          fill: accentColor,
          'font-size': '46',
          'font-weight': '500'
        }, [document.createTextNode(p.name)]));
        // Dimensions inside panel
        g.appendChild(svg('text', {
          x: cx, y: cy + 60,
          'text-anchor': 'middle',
          fill: textColor,
          'font-size': '20',
          'font-family': 'JetBrains Mono, monospace'
        }, [document.createTextNode(Math.round(p.w) + ' × ' + Math.round(p.h))]));
      });
    }

    // === 5. Dimension lines (outer) ===
    if (showDims) {
      var dimColor = textColor;
      var dimFont = 24;
      var dimOffset = 50;

      // Bottom: total width
      var dimY = H + dimOffset;
      g.appendChild(svg('line', {
        x1: 0, y1: dimY, x2: W, y2: dimY,
        stroke: dimColor, 'stroke-width': 1
      }));
      // Arrows
      g.appendChild(svg('line', {
        x1: 0, y1: dimY - 8, x2: 0, y2: dimY + 8,
        stroke: dimColor, 'stroke-width': 1
      }));
      g.appendChild(svg('line', {
        x1: W, y1: dimY - 8, x2: W, y2: dimY + 8,
        stroke: dimColor, 'stroke-width': 1
      }));
      // Label
      g.appendChild(svg('text', {
        x: W / 2, y: dimY + 30,
        'text-anchor': 'middle',
        fill: accentColor,
        'font-size': dimFont,
        'font-weight': '500',
        'font-family': 'JetBrains Mono, monospace'
      }, [document.createTextNode(W + ' mm')]));

      // Right: total height
      var dimX = W + dimOffset;
      g.appendChild(svg('line', {
        x1: dimX, y1: 0, x2: dimX, y2: H,
        stroke: dimColor, 'stroke-width': 1
      }));
      g.appendChild(svg('line', {
        x1: dimX - 8, y1: 0, x2: dimX + 8, y2: 0,
        stroke: dimColor, 'stroke-width': 1
      }));
      g.appendChild(svg('line', {
        x1: dimX - 8, y1: H, x2: dimX + 8, y2: H,
        stroke: dimColor, 'stroke-width': 1
      }));
      g.appendChild(svg('text', {
        x: dimX + 30, y: H / 2 + 8,
        fill: accentColor,
        'font-size': dimFont,
        'font-weight': '500',
        'font-family': 'JetBrains Mono, monospace',
        transform: 'rotate(90 ' + (dimX + 30) + ' ' + (H / 2 + 8) + ')'
      }, [document.createTextNode(H + ' mm')]));

      // Per-panel widths (top)
      var xAcc = sec;
      (model.pWidths || []).forEach(function (pw, i) {
        var topDimY = -dimOffset;
        g.appendChild(svg('line', {
          x1: xAcc, y1: topDimY, x2: xAcc + pw, y2: topDimY,
          stroke: dimColor, 'stroke-width': 1
        }));
        g.appendChild(svg('text', {
          x: xAcc + pw / 2, y: topDimY - 12,
          'text-anchor': 'middle',
          fill: textColor,
          'font-size': '20',
          'font-family': 'JetBrains Mono, monospace'
        }, [document.createTextNode(Math.round(pw))]));
        xAcc += pw + (i < model.pWidths.length - 1 ? model.frame.tBarW : 0);
      });
    }

    return root;
  }

  // ==========================================================
  // 2. Stats strip
  // ==========================================================
  function renderStats(model) {
    var s = L.computeModelStats(model);
    var grid = el('div', { class: 'nr-grid-4', style: 'grid-template-columns: repeat(6, 1fr);' });
    [
      { label: 'Panels', value: s.panels },
      { label: 'Glass pieces', value: s.glass },
      { label: 'Total area', value: fmtNum(s.totalAreaM2, 2) + ' m²', c: 'var(--nr-accent)' },
      { label: 'Glass area', value: fmtNum(s.glassAreaM2, 2) + ' m²', c: 'var(--nr-info)' },
      { label: 'Frame perimeter', value: fmtNum(s.frameTotalMm) + ' mm' },
      { label: 'Beads total', value: fmtNum(s.beadTotalMm) + ' mm' }
    ].forEach(function (k) {
      grid.appendChild(el('div', { class: 'nr-stat' }, [
        el('div', { class: 'nr-stat__label', text: k.label }),
        el('div', {
          class: 'nr-stat__value',
          text: String(k.value),
          style: 'font-size: var(--nr-fs-xl); ' + (k.c ? 'color: ' + k.c + ';' : '')
        })
      ]));
    });
    return grid;
  }

  // ==========================================================
  // 3. Cut list (BOM)
  // ==========================================================
  function renderCutList(model) {
    var wrap = el('div', { class: 'nr-stack' });
    if (!model) return wrap;

    // Frame sides
    var frameCard = el('div', { class: 'nr-card' });
    frameCard.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', { class: 'nr-card__title', text: '🔩 الحلق (Frame)' }),
      el('span', { class: 'nr-badge nr-badge--primary', text: (model.frameSides || []).length + ' قطعة' })
    ]));
    var frameBody = el('div', { class: 'nr-card__body' });
    var frameTable = el('table', { class: 'nr-table nr-table--compact' });
    frameTable.appendChild(el('thead', {}, [el('tr', {}, [
      el('th', { text: '#' }),
      el('th', { text: 'الاسم' }),
      el('th', { text: 'الطول الخارجي' }),
      el('th', { text: 'الطول الداخلي' }),
      el('th', { text: 'قطع البداية' }),
      el('th', { text: 'قطع النهاية' })
    ])]));
    var frameTbody = el('tbody');
    (model.frameSides || []).forEach(function (f, i) {
      frameTbody.appendChild(el('tr', {}, [
        el('td', { text: String(i + 1) }),
        el('td', { text: f.name }),
        el('td', { text: fmtNum(f.outerLength), style: 'font-family: var(--nr-font-mono); color: var(--nr-accent);' }),
        el('td', { text: fmtNum(f.innerLength), style: 'font-family: var(--nr-font-mono); color: var(--nr-success);' }),
        el('td', { text: f.cutStart }),
        el('td', { text: f.cutEnd })
      ]));
    });
    frameTable.appendChild(frameTbody);
    frameBody.appendChild(frameTable);
    frameCard.appendChild(frameBody);
    wrap.appendChild(frameCard);

    // T-Bars
    if ((model.tBars || []).length > 0) {
      var tCard = el('div', { class: 'nr-card' });
      tCard.appendChild(el('div', { class: 'nr-card__header' }, [
        el('div', { class: 'nr-card__title', text: '◎ القاطعات (T-Bars)' }),
        el('span', { class: 'nr-badge nr-badge--primary', text: model.tBars.length + ' قطعة' })
      ]));
      var tBody = el('div', { class: 'nr-card__body' });
      var tTable = el('table', { class: 'nr-table nr-table--compact' });
      tTable.appendChild(el('thead', {}, [el('tr', {}, [
        el('th', { text: '#' }),
        el('th', { text: 'الاسم' }),
        el('th', { text: 'الاتجاه' }),
        el('th', { text: 'الطول' })
      ])]));
      var tTbody = el('tbody');
      model.tBars.forEach(function (t, i) {
        tTbody.appendChild(el('tr', {}, [
          el('td', { text: String(i + 1) }),
          el('td', { text: t.name }),
          el('td', { text: t.orientation === 'vertical' ? 'رأسي' : 'أفقي' }),
          el('td', { text: fmtNum(t.length), style: 'font-family: var(--nr-font-mono); color: var(--nr-accent);' })
        ]));
      });
      tTable.appendChild(tTbody);
      tBody.appendChild(tTable);
      tCard.appendChild(tBody);
      wrap.appendChild(tCard);
    }

    // Glass pieces
    var gCard = el('div', { class: 'nr-card' });
    gCard.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', { class: 'nr-card__title', text: '◇ الزجاج (Glass)' }),
      el('span', { class: 'nr-badge nr-badge--info', text: (model.glassPieces || []).length + ' قطعة' })
    ]));
    var gBody = el('div', { class: 'nr-card__body' });
    var gTable = el('table', { class: 'nr-table nr-table--compact' });
    gTable.appendChild(el('thead', {}, [el('tr', {}, [
      el('th', { text: '#' }),
      el('th', { text: 'الاسم' }),
      el('th', { text: 'العرض' }),
      el('th', { text: 'الارتفاع' }),
      el('th', { text: 'المساحة (m²)' })
    ])]));
    var gTbody = el('tbody');
    (model.glassPieces || []).forEach(function (gl, i) {
      var area = (gl.w / 1000) * (gl.h / 1000);
      gTbody.appendChild(el('tr', {}, [
        el('td', { text: String(i + 1) }),
        el('td', { text: gl.name }),
        el('td', { text: fmtNum(gl.w), style: 'font-family: var(--nr-font-mono);' }),
        el('td', { text: fmtNum(gl.h), style: 'font-family: var(--nr-font-mono);' }),
        el('td', { text: fmtNum(area, 3), style: 'font-family: var(--nr-font-mono); color: var(--nr-info); font-weight: 500;' })
      ]));
    });
    gTable.appendChild(gTbody);
    gBody.appendChild(gTable);
    gCard.appendChild(gBody);
    wrap.appendChild(gCard);

    // Beads
    var groupedBeads = L.groupBeadsByOrientation(model);
    var bCard = el('div', { class: 'nr-card' });
    bCard.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', { class: 'nr-card__title', text: '— البكلوز (Beads)' }),
      el('span', { class: 'nr-badge', text: (model.beads || []).length + ' قطعة' })
    ]));
    var bBody = el('div', { class: 'nr-card__body' });
    bBody.appendChild(el('small', { text: 'أفقي: ' + groupedBeads.horizontal.length + ' · رأسي: ' + groupedBeads.vertical.length, style: 'display: block; margin-bottom: var(--nr-sp-2);' }));
    var bTable = el('table', { class: 'nr-table nr-table--compact' });
    bTable.appendChild(el('thead', {}, [el('tr', {}, [
      el('th', { text: '#' }),
      el('th', { text: 'الاسم' }),
      el('th', { text: 'الاتجاه' }),
      el('th', { text: 'الطول' })
    ])]));
    var bTbody = el('tbody');
    (model.beads || []).forEach(function (b, i) {
      bTbody.appendChild(el('tr', {}, [
        el('td', { text: String(i + 1) }),
        el('td', { text: b.name }),
        el('td', { text: b.orientation === 'h' ? 'أفقي' : 'رأسي' }),
        el('td', { text: fmtNum(b.length), style: 'font-family: var(--nr-font-mono);' })
      ]));
    });
    bTable.appendChild(bTbody);
    bBody.appendChild(bTable);
    bCard.appendChild(bBody);
    wrap.appendChild(bCard);

    return wrap;
  }

  global.NouRion = global.NouRion || {};
  global.NouRion.DrawView = {
    renderModel:   renderModel,
    renderStats:   renderStats,
    renderCutList: renderCutList
  };
})(typeof window !== 'undefined' ? window : globalThis);
