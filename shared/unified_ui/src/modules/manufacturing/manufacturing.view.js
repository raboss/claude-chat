/* ============================================================
   NouRion — modules/manufacturing/manufacturing.view.js
   Pure DOM builders for core/assembly.js + core/manufacturing.js
   ============================================================ */

(function (global) {
  'use strict';

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
  // 1. Report summary KPIs
  // ==========================================================
  function renderSummary(report) {
    if (!report) return el('div', { class: 'nr-help', text: 'لا يوجد تقرير.' });
    var s = report.summary;
    var grid = el('div', { class: 'nr-grid-4', style: 'grid-template-columns: repeat(6, 1fr);' });
    [
      { label: 'Pieces', value: s.totalPieces },
      { label: 'Total length', value: fmtNum(s.totalLength_m, 2) + ' m', c: 'var(--nr-accent)' },
      { label: 'Weight', value: fmtNum(s.weight_kg, 2) + ' kg', c: 'var(--nr-info)' },
      { label: 'Glass area', value: fmtNum(s.glassArea_m2, 2) + ' m²', c: 'var(--nr-success)' },
      { label: 'Accessories', value: s.accessoryCount },
      { label: 'Profile', value: s.profileName || s.profileId, small: true }
    ].forEach(function (k) {
      grid.appendChild(el('div', { class: 'nr-stat' }, [
        el('div', { class: 'nr-stat__label', text: k.label }),
        el('div', {
          class: 'nr-stat__value',
          text: String(k.value),
          style: 'font-size: ' + (k.small ? 'var(--nr-fs-md);' : 'var(--nr-fs-xl);') +
                 (k.c ? ' color: ' + k.c + ';' : '')
        })
      ]));
    });
    return grid;
  }

  // ==========================================================
  // 2. Cut list table
  // ==========================================================
  function renderCutList(cutList) {
    if (!cutList) return el('div', { class: 'nr-help', text: 'لا توجد قطع.' });
    var rows = cutList.toTable();

    var wrap = el('div', { class: 'nr-table-wrap' });
    var table = el('table', { class: 'nr-table nr-table--compact' });

    var thead = el('thead');
    var hr = el('tr');
    ['#', 'الضلع', 'الرأسان', 'القطاع', 'الموضع', 'الطول الاسمي', 'طول القطع', 'قطع البداية', 'قطع النهاية', 'الوصلة', 'الكمية'].forEach(function (h) {
      hr.appendChild(el('th', { text: h }));
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el('tbody');
    rows.forEach(function (r) {
      var tr = el('tr');
      tr.appendChild(el('td', { text: String(r.no) }));
      tr.appendChild(el('td', { text: r.label, style: 'font-weight: 500; color: var(--nr-accent);' }));
      tr.appendChild(el('td', { text: r.vertices, style: 'font-family: var(--nr-font-mono);' }));
      tr.appendChild(el('td', { text: r.profile }));
      tr.appendChild(el('td', {}, [el('span', { class: 'nr-badge', text: r.position })]));
      tr.appendChild(el('td', { text: fmtNum(r.nominal, 1), style: 'font-family: var(--nr-font-mono);' }));
      tr.appendChild(el('td', {
        text: fmtNum(r.cutLength, 1),
        style: 'font-family: var(--nr-font-mono); color: var(--nr-success); font-weight: 500;'
      }));
      tr.appendChild(el('td', { text: r.startCut, style: 'font-family: var(--nr-font-mono); font-size: var(--nr-fs-xs);' }));
      tr.appendChild(el('td', { text: r.endCut, style: 'font-family: var(--nr-font-mono); font-size: var(--nr-fs-xs);' }));
      tr.appendChild(el('td', { text: r.jointType, style: 'font-family: var(--nr-font-mono);' }));
      tr.appendChild(el('td', { text: String(r.qty), style: 'text-align: center; font-weight: 500;' }));
      tbody.appendChild(tr);
    });

    // Total row
    var totalRow = el('tr', { style: 'background: var(--nr-bg-3); font-weight: 600;' });
    totalRow.appendChild(el('td', { colspan: '6', text: 'الإجمالي' }));
    totalRow.appendChild(el('td', {
      text: fmtNum(cutList.grandTotalLength, 1) + ' mm',
      style: 'font-family: var(--nr-font-mono); color: var(--nr-success);'
    }));
    totalRow.appendChild(el('td', { colspan: '3' }));
    totalRow.appendChild(el('td', {
      text: String(cutList.totalPieces),
      style: 'text-align: center;'
    }));
    tbody.appendChild(totalRow);

    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  // ==========================================================
  // 3. BOM table (grouped)
  // ==========================================================
  function renderBOM(cutList) {
    if (!cutList) return el('div', { class: 'nr-help' });
    var bom = cutList.bom;

    var wrap = el('div', { class: 'nr-table-wrap' });
    var table = el('table', { class: 'nr-table nr-table--compact' });

    var thead = el('thead');
    var hr = el('tr');
    ['#', 'الكمية', 'القطاع', 'طول القطع', 'قطع البداية', 'قطع النهاية', 'الطول الكلي', 'الأضلاع'].forEach(function (h) {
      hr.appendChild(el('th', { text: h }));
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el('tbody');
    bom.forEach(function (row, i) {
      var j = row.toJSON();
      var tr = el('tr');
      tr.appendChild(el('td', { text: String(i + 1) }));
      tr.appendChild(el('td', {
        text: String(j.quantity) + '×',
        style: 'font-weight: 600; color: var(--nr-accent); text-align: center;'
      }));
      tr.appendChild(el('td', { text: j.profileName }));
      tr.appendChild(el('td', {
        text: fmtNum(j.cutLength, 1) + ' mm',
        style: 'font-family: var(--nr-font-mono); font-weight: 500;'
      }));
      tr.appendChild(el('td', {
        text: fmtNum(j.startCut, 1) + '°',
        style: 'font-family: var(--nr-font-mono);'
      }));
      tr.appendChild(el('td', {
        text: fmtNum(j.endCut, 1) + '°',
        style: 'font-family: var(--nr-font-mono);'
      }));
      tr.appendChild(el('td', {
        text: fmtNum(j.totalLength, 1) + ' mm',
        style: 'font-family: var(--nr-font-mono); color: var(--nr-success);'
      }));
      tr.appendChild(el('td', { text: j.labels, style: 'color: var(--nr-text-tertiary); font-size: var(--nr-fs-xs);' }));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  // ==========================================================
  // 4. Glass list
  // ==========================================================
  function renderGlassList(glassArr) {
    if (!glassArr || !glassArr.length) return el('div', { class: 'nr-help', text: 'لا يوجد زجاج.' });

    var wrap = el('div', { class: 'nr-table-wrap' });
    var table = el('table', { class: 'nr-table nr-table--compact' });
    var thead = el('thead');
    var hr = el('tr');
    ['#', 'المعرّف', 'النوع', 'العرض', 'الارتفاع', 'السماكة', 'المساحة', 'الكمية', 'الملاحظات'].forEach(function (h) {
      hr.appendChild(el('th', { text: h }));
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el('tbody');
    glassArr.forEach(function (g, i) {
      var tr = el('tr');
      tr.appendChild(el('td', { text: String(i + 1) }));
      tr.appendChild(el('td', { text: g.label, style: 'font-weight: 500; color: var(--nr-info);' }));
      tr.appendChild(el('td', { text: g.type }));
      tr.appendChild(el('td', { text: fmtNum(g.width, 0), style: 'font-family: var(--nr-font-mono);' }));
      tr.appendChild(el('td', { text: fmtNum(g.height, 0), style: 'font-family: var(--nr-font-mono);' }));
      tr.appendChild(el('td', { text: g.thickness + ' mm' }));
      tr.appendChild(el('td', {
        text: fmtNum(g.area, 3) + ' m²',
        style: 'font-family: var(--nr-font-mono); color: var(--nr-success); font-weight: 500;'
      }));
      tr.appendChild(el('td', { text: String(g.quantity), style: 'text-align: center;' }));
      tr.appendChild(el('td', { text: g.note || '—', style: 'color: var(--nr-text-tertiary); font-size: var(--nr-fs-xs);' }));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  // ==========================================================
  // 5. Accessories list
  // ==========================================================
  function renderAccessoriesList(accArr) {
    if (!accArr || !accArr.length) return el('div', { class: 'nr-help', text: 'لا توجد إكسسوارات.' });

    var iconMap = { hinge: '⚙️', handle: '🤚', lock: '🔒', roller: '⭕' };

    var wrap = el('div', { class: 'nr-table-wrap' });
    var table = el('table', { class: 'nr-table nr-table--compact' });
    var thead = el('thead');
    var hr = el('tr');
    ['#', 'النوع', 'الضلع', 'الإزاحة', 'الموضع', 'الكمية', 'المواصفات'].forEach(function (h) {
      hr.appendChild(el('th', { text: h }));
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el('tbody');
    accArr.forEach(function (a, i) {
      var tr = el('tr');
      tr.appendChild(el('td', { text: String(i + 1) }));
      tr.appendChild(el('td', {}, [
        el('span', { text: (iconMap[a.type] || '•') + ' ' + a.type, style: 'font-weight: 500;' })
      ]));
      tr.appendChild(el('td', { text: a.pieceLabel, style: 'font-family: var(--nr-font-mono); color: var(--nr-accent);' }));
      tr.appendChild(el('td', {
        text: fmtNum(a.offset_mm, 1) + ' mm',
        style: 'font-family: var(--nr-font-mono);'
      }));
      tr.appendChild(el('td', { text: a.position }));
      tr.appendChild(el('td', { text: String(a.qty), style: 'text-align: center;' }));
      tr.appendChild(el('td', { text: a.spec, style: 'color: var(--nr-text-tertiary); font-size: var(--nr-fs-xs);' }));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  // ==========================================================
  // 6. Pieces detail cards (assembly view)
  // ==========================================================
  function renderPiecesDetail(assembly) {
    if (!assembly || !assembly.pieces.length) return el('div', { class: 'nr-help' });

    var grid = el('div', { class: 'nr-grid-2' });
    assembly.pieces.forEach(function (piece) {
      var card = el('div', { class: 'nr-card nr-card--accent' });
      card.appendChild(el('div', { class: 'nr-card__header' }, [
        el('div', {}, [
          el('div', { class: 'nr-card__title', text: piece.label, style: 'font-family: var(--nr-font-mono);' }),
          el('div', { class: 'nr-card__subtitle', text: piece.position + ' · ' + piece.profileName })
        ]),
        el('span', { class: 'nr-badge nr-badge--primary', text: fmtNum(piece.cutLength, 1) + ' mm' })
      ]));

      var body = el('div', { class: 'nr-card__body' });
      var info = [
        { label: 'الطول الاسمي', value: fmtNum(piece.nominalLength, 1) + ' mm' },
        { label: 'طول القطع', value: fmtNum(piece.cutLength, 1) + ' mm', c: 'var(--nr-success)' },
        { label: 'قطع البداية', value: fmtNum(piece.startCutAngle, 1) + '°' },
        { label: 'قطع النهاية', value: fmtNum(piece.endCutAngle, 1) + '°' },
        { label: 'نوع وصلة البداية', value: piece.startJointType },
        { label: 'نوع وصلة النهاية', value: piece.endJointType }
      ];
      var tbl = el('table', { class: 'nr-table nr-table--compact' });
      var tb = el('tbody');
      info.forEach(function (i) {
        tb.appendChild(el('tr', {}, [
          el('td', { text: i.label, style: 'color: var(--nr-text-tertiary); width: 45%;' }),
          el('td', {
            text: i.value,
            style: 'font-family: var(--nr-font-mono); font-weight: 500;' + (i.c ? ' color: ' + i.c + ';' : '')
          })
        ]));
      });
      tbl.appendChild(tb);
      body.appendChild(tbl);
      card.appendChild(body);
      grid.appendChild(card);
    });

    return grid;
  }

  global.NouRion = global.NouRion || {};
  global.NouRion.ManufacturingView = {
    renderSummary:          renderSummary,
    renderCutList:          renderCutList,
    renderBOM:              renderBOM,
    renderGlassList:        renderGlassList,
    renderAccessoriesList:  renderAccessoriesList,
    renderPiecesDetail:     renderPiecesDetail
  };
})(typeof window !== 'undefined' ? window : globalThis);
