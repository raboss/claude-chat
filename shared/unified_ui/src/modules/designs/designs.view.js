/* ============================================================
   NouRion — modules/designs/designs.view.js
   Pure DOM builders for the Designs module.
   Uses SVG for frame preview (via DrawLogic which is already pure).
   ============================================================ */

(function (global) {
  'use strict';

  var L = (global.NouRion && global.NouRion.DesignsLogic) || null;
  var DL = (global.NouRion && global.NouRion.DrawLogic) || null;
  var DV = (global.NouRion && global.NouRion.DrawView) || null;

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
  // 1. Project summary KPIs
  // ==========================================================
  function renderSummary(measRows) {
    var s = L.computeFrameSummary(measRows);
    var grid = el('div', { class: 'nr-grid-4' });
    [
      { label: 'Frames', value: s.count },
      { label: 'Sections', value: s.sections },
      { label: 'Total area', value: fmtNum(s.totalAreaM2, 2) + ' m²', c: 'var(--nr-accent)' },
      { label: 'Max size', value: fmtNum(s.maxW) + '×' + fmtNum(s.maxH) }
    ].forEach(function (k) {
      grid.appendChild(el('div', { class: 'nr-stat' }, [
        el('div', { class: 'nr-stat__label', text: k.label }),
        el('div', {
          class: 'nr-stat__value',
          text: String(k.value),
          style: k.c ? 'color: ' + k.c + ';' : ''
        })
      ]));
    });
    return grid;
  }

  // ==========================================================
  // 2. Frames explorer (tree by section)
  // ==========================================================
  function renderFramesTree(measRows, selectedGlobalIdx, onSelect) {
    var tree = L.buildSectionsTree(measRows);
    var wrap = el('div', { class: 'nr-stack-sm' });

    if (!tree.length) {
      wrap.appendChild(el('div', { class: 'nr-help', text: 'لا توجد مقاسات فعلية.' }));
      return wrap;
    }

    tree.forEach(function (section) {
      var card = el('div', { class: 'nr-card' });
      card.appendChild(el('div', { class: 'nr-card__header' }, [
        el('div', {}, [
          el('div', { class: 'nr-card__title', text: '📁 ' + section.sectionName }),
          el('div', { class: 'nr-card__subtitle', text: section.count + ' فتحة' })
        ]),
        el('span', { class: 'nr-badge nr-badge--primary', text: String(section.count) })
      ]));

      var body = el('div', { class: 'nr-card__body', style: 'padding: var(--nr-sp-2);' });
      var stack = el('div', { class: 'nr-stack-sm' });

      section.rows.forEach(function (row) {
        var isActive = row.globalIndex === selectedGlobalIdx;
        var item = el('div', {
          class: 'nr-row-between',
          style: 'padding: var(--nr-sp-2) var(--nr-sp-3); ' +
                 'background: ' + (isActive ? 'var(--nr-accent-soft)' : 'var(--nr-bg-3)') + '; ' +
                 'border-radius: var(--nr-r-sm); cursor: pointer; ' +
                 'transition: background var(--nr-t-fast);' +
                 (isActive ? 'border-inline-start: 3px solid var(--nr-accent);' : ''),
          'data-idx': String(row.globalIndex)
        });
        item.appendChild(el('div', {}, [
          el('div', {
            text: row.code,
            style: 'font-family: var(--nr-font-mono); font-weight: 500; color: ' + (isActive ? 'var(--nr-accent)' : 'var(--nr-text-primary)') + ';'
          }),
          row.description ? el('small', { text: row.description, style: 'color: var(--nr-text-tertiary);' }) : null
        ]));
        item.appendChild(el('div', { style: 'text-align: end;' }, [
          el('small', {
            text: row.width + ' × ' + row.height,
            style: 'font-family: var(--nr-font-mono);'
          }),
          el('div', {
            text: row.areaM2 + ' m²',
            style: 'font-family: var(--nr-font-mono); color: var(--nr-success); font-size: var(--nr-fs-xs);'
          })
        ]));

        if (onSelect) {
          item.addEventListener('click', function () { onSelect(row.globalIndex); });
        }
        stack.appendChild(item);
      });

      body.appendChild(stack);
      card.appendChild(body);
      wrap.appendChild(card);
    });

    return wrap;
  }

  // ==========================================================
  // 3. Frame preview (uses DrawLogic + SVG)
  // ==========================================================
  function renderFramePreview(frame) {
    var card = el('div', { class: 'nr-card' });

    if (!frame) {
      card.appendChild(el('div', { class: 'nr-card__body' }, [
        el('div', { class: 'nr-help', text: 'اختر فتحة لعرض تصميمها.' })
      ]));
      return card;
    }

    card.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', {}, [
        el('div', { class: 'nr-card__title', text: '📐 ' + frame.code }),
        el('div', { class: 'nr-card__subtitle', text: frame.sectionName + ' · ' + frame.width + '×' + frame.height + ' · ' + frame.areaM2 + ' m²' })
      ])
    ]));

    var body = el('div', { class: 'nr-card__body', style: 'background: var(--nr-bg-1); padding: var(--nr-sp-6);' });

    if (DL && DV) {
      // Simple single-panel frame from DrawLogic
      var model = DL.buildModel({
        W: frame.width,
        H: frame.height,
        divW: 1, divH: 1,
        sec: 23, tBarW: 28, bead: 22, glassDed: 8,
        panelWidths: [], panelHeights: [],
        vFull: true, doorBottom: true
      }, null);

      var svg = DV.renderModel(model, {});
      svg.style.width = '100%';
      svg.style.maxHeight = '400px';
      svg.style.height = 'auto';
      body.appendChild(svg);
    } else {
      body.appendChild(el('div', { class: 'nr-help', text: 'DrawLogic غير محمَّل.' }));
    }

    card.appendChild(body);
    return card;
  }

  // ==========================================================
  // 4. Frame properties panel
  // ==========================================================
  function renderFrameProperties(frame) {
    var card = el('div', { class: 'nr-card' });
    card.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', { class: 'nr-card__title', text: 'الخصائص' })
    ]));

    var body = el('div', { class: 'nr-card__body' });

    if (!frame) {
      body.appendChild(el('div', { class: 'nr-help', text: 'لا توجد فتحة محدَّدة.' }));
      card.appendChild(body);
      return card;
    }

    var validation = L.validateFrameDimensions(frame.width, frame.height);

    var props = [
      { label: 'الرمز', value: frame.code, mono: true, color: 'var(--nr-accent)' },
      { label: 'القطاع', value: frame.sectionName },
      { label: 'العرض', value: frame.width + ' مم', mono: true },
      { label: 'الارتفاع', value: frame.height + ' مم', mono: true },
      { label: 'المساحة', value: frame.areaM2 + ' m²', mono: true, color: 'var(--nr-success)' },
      { label: 'المحيط', value: 2 * (frame.width + frame.height) + ' مم', mono: true },
      { label: 'الوصف', value: frame.description || '—' }
    ];

    var tbl = el('table', { class: 'nr-table' });
    var tbody = el('tbody');
    props.forEach(function (p) {
      tbody.appendChild(el('tr', {}, [
        el('td', { text: p.label, style: 'width: 40%; color: var(--nr-text-tertiary);' }),
        el('td', {
          text: String(p.value),
          style: (p.mono ? 'font-family: var(--nr-font-mono); ' : '') +
                 (p.color ? 'color: ' + p.color + ';' : '') +
                 'font-weight: 500;'
        })
      ]));
    });
    tbl.appendChild(tbody);
    body.appendChild(tbl);

    // Validation badge
    if (validation.valid) {
      body.appendChild(el('div', {
        class: 'nr-alert nr-alert--success',
        style: 'margin-top: var(--nr-sp-3);',
        html: '<span class="nr-alert__icon">✓</span><div class="nr-alert__body"><div class="nr-alert__msg">الأبعاد ضمن النطاق المسموح.</div></div>'
      }));
    } else {
      var msg = validation.errors.join(' · ');
      body.appendChild(el('div', {
        class: 'nr-alert nr-alert--warning',
        style: 'margin-top: var(--nr-sp-3);',
        html: '<span class="nr-alert__icon">!</span><div class="nr-alert__body"><div class="nr-alert__msg">' + msg + '</div></div>'
      }));
    }

    card.appendChild(body);
    return card;
  }

  // ==========================================================
  // 5. Section overview table (all sections)
  // ==========================================================
  function renderSectionsTable(measRows) {
    var tree = L.buildSectionsTree(measRows);
    var wrap = el('div', { class: 'nr-table-wrap' });
    var table = el('table', { class: 'nr-table nr-table--compact' });

    var thead = el('thead');
    var hr = el('tr');
    ['#', 'القطاع', 'عدد الفتحات', 'مجموع المساحة (m²)', 'أكبر فتحة', 'أصغر فتحة'].forEach(function (h) {
      hr.appendChild(el('th', { text: h }));
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el('tbody');
    tree.forEach(function (section, i) {
      var totalArea = 0;
      var maxArea = 0;
      var minArea = Infinity;
      section.rows.forEach(function (r) {
        totalArea += r.areaM2;
        if (r.areaM2 > maxArea) maxArea = r.areaM2;
        if (r.areaM2 < minArea) minArea = r.areaM2;
      });
      if (!isFinite(minArea)) minArea = 0;

      var tr = el('tr');
      tr.appendChild(el('td', { text: String(i + 1) }));
      tr.appendChild(el('td', { text: section.sectionName, style: 'font-weight: 500;' }));
      tr.appendChild(el('td', { text: String(section.count), style: 'font-family: var(--nr-font-mono); text-align: center;' }));
      tr.appendChild(el('td', {
        text: fmtNum(totalArea, 2),
        style: 'font-family: var(--nr-font-mono); color: var(--nr-accent); font-weight: 500;'
      }));
      tr.appendChild(el('td', { text: fmtNum(maxArea, 2), style: 'font-family: var(--nr-font-mono);' }));
      tr.appendChild(el('td', { text: fmtNum(minArea, 2), style: 'font-family: var(--nr-font-mono);' }));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  global.NouRion = global.NouRion || {};
  global.NouRion.DesignsView = {
    renderSummary:        renderSummary,
    renderFramesTree:     renderFramesTree,
    renderFramePreview:   renderFramePreview,
    renderFrameProperties:renderFrameProperties,
    renderSectionsTable:  renderSectionsTable
  };
})(typeof window !== 'undefined' ? window : globalThis);
