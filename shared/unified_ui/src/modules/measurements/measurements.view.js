/* ============================================================
   NouRion — modules/measurements/measurements.view.js
   Pure DOM builders for the Measurements module.
   NO inline event handlers, no localStorage access.
   ============================================================ */

(function (global) {
  'use strict';

  var L = (global.NouRion && global.NouRion.MeasurementsLogic) || null;

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

  function fmtNum(n) {
    if (n == null || isNaN(n)) return '—';
    return new Intl.NumberFormat('en-US').format(Math.round(n));
  }

  function fmtArea(m2) {
    if (m2 == null || isNaN(m2) || m2 === 0) return '—';
    return m2.toFixed(2) + ' m²';
  }

  // ==========================================================
  // 1. Summary KPIs
  // ==========================================================
  function renderSummary(rows) {
    var s = L.computeMeasurementSummary(rows);
    var grid = el('div', { class: 'nr-grid-4' });
    [
      { label: 'Rows', value: s.count },
      { label: 'Filled', value: s.filled, trend: s.filled === s.count ? 'مكتمل' : (s.count - s.filled) + ' فارغة', trendClass: s.filled === s.count ? 'nr-stat__trend--up' : '' },
      { label: 'Total Area', value: s.totalArea ? s.totalArea.toFixed(2) + ' m²' : '—' },
      { label: 'With Photos', value: s.withPhotos }
    ].forEach(function (c) {
      grid.appendChild(el('div', { class: 'nr-stat' }, [
        el('div', { class: 'nr-stat__label', text: c.label }),
        el('div', { class: 'nr-stat__value', text: String(c.value), style: 'font-size: var(--nr-fs-2xl);' }),
        c.trend ? el('div', { class: 'nr-stat__trend ' + (c.trendClass || ''), text: c.trend }) : null
      ]));
    });
    return grid;
  }

  // ==========================================================
  // 2. Editable measurements table
  //    onChange(rowIndex, field, value) — receives all updates
  // ==========================================================
  function renderEditableTable(rows, onChange) {
    var wrap = el('div', { class: 'nr-table-wrap' });
    var table = el('table', { class: 'nr-table nr-table--compact' });

    var thead = el('thead');
    var headRow = el('tr');
    ['#', 'الرمز', 'العرض (مم)', 'الارتفاع (مم)', 'القطاع', 'الوصف', 'ملاحظات', 'المساحة', ''].forEach(function (h) {
      headRow.appendChild(el('th', { text: h }));
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = el('tbody');
    rows.forEach(function (r, i) {
      var tr = el('tr', { 'data-row-idx': String(i) });
      var area = L.computeRowArea(r);
      var isEmpty = !r.width && !r.height;

      // # column
      tr.appendChild(el('td', {
        text: String(i + 1),
        style: 'opacity: ' + (isEmpty ? '0.4' : '1') + ';'
      }));

      // code (read-only)
      tr.appendChild(el('td', {
        text: r.code || '',
        style: 'font-family: var(--nr-font-mono); color: var(--nr-accent); font-weight: 500;'
      }));

      // editable fields
      function makeInput(field, type) {
        var input = el('input', {
          class: 'nr-input',
          type: type || 'text',
          value: r[field] || '',
          style: 'height: 30px; padding: 0 var(--nr-sp-2); font-size: var(--nr-fs-sm);'
        });
        if (onChange) {
          input.addEventListener('input', function () {
            onChange(i, field, type === 'number' ? parseFloat(input.value) || '' : input.value);
          });
        }
        return input;
      }

      var widthCell = el('td');
      widthCell.appendChild(makeInput('width', 'number'));
      tr.appendChild(widthCell);

      var heightCell = el('td');
      heightCell.appendChild(makeInput('height', 'number'));
      tr.appendChild(heightCell);

      var sectionCell = el('td');
      sectionCell.appendChild(makeInput('sectionName', 'text'));
      tr.appendChild(sectionCell);

      var descCell = el('td');
      descCell.appendChild(makeInput('description', 'text'));
      tr.appendChild(descCell);

      var notesCell = el('td');
      notesCell.appendChild(makeInput('notes', 'text'));
      tr.appendChild(notesCell);

      // area (calculated)
      tr.appendChild(el('td', {
        text: fmtArea(area),
        style: 'font-family: var(--nr-font-mono); color: var(--nr-success); text-align: center; min-width: 80px;'
      }));

      // delete button
      var delCell = el('td');
      var delBtn = el('button', {
        class: 'nr-btn nr-btn--ghost nr-btn--sm nr-btn--icon',
        text: '✕',
        'aria-label': 'حذف صف ' + (i + 1)
      });
      delBtn.addEventListener('click', function () {
        if (onChange) onChange(i, '__delete__', true);
      });
      delCell.appendChild(delBtn);
      tr.appendChild(delCell);

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  // ==========================================================
  // 3. Region totals report (aggregated)
  // ==========================================================
  function renderRegionReport(projects) {
    var totals = L.computeRegionTotals(projects);
    var overall = L.computeOverallTotals(projects);

    var wrap = el('div', { class: 'nr-stack' });

    if (totals.length === 0) {
      wrap.appendChild(el('div', { class: 'nr-help', text: 'لا توجد مشاريع.' }));
      return wrap;
    }

    // Overall card
    var overallCard = el('div', { class: 'nr-card nr-card--accent' });
    overallCard.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', {}, [
        el('div', { class: 'nr-card__title', text: '📊 الإجمالي العام' }),
        el('div', { class: 'nr-card__subtitle', text: projects.length + ' مشروع · ' + totals.length + ' منطقة' })
      ]),
      el('span', { class: 'nr-badge nr-badge--primary', text: L.generateWeeklyReportNo() })
    ]));
    var overallBody = el('div', { class: 'nr-card__body nr-grid-3' });
    [
      { l: 'إجمالي العقود', v: overall.c, c: 'var(--nr-accent)' },
      { l: 'إجمالي الإنتاج', v: overall.p, c: 'var(--nr-success)' },
      { l: 'إجمالي المتبقي', v: overall.c - overall.d, c: 'var(--nr-warning)' }
    ].forEach(function (kpi) {
      overallBody.appendChild(el('div', {}, [
        el('small', { text: kpi.l, style: 'display: block; margin-bottom: var(--nr-sp-1);' }),
        el('div', {
          text: fmtNum(kpi.v),
          style: 'font-family: var(--nr-font-mono); font-size: var(--nr-fs-xl); color: ' + kpi.c + '; font-weight: 500;'
        })
      ]));
    });
    overallCard.appendChild(overallBody);
    wrap.appendChild(overallCard);

    // Per-region cards
    totals.forEach(function (r) {
      var card = el('div', { class: 'nr-card' });
      card.appendChild(el('div', { class: 'nr-card__header' }, [
        el('div', {}, [
          el('div', { class: 'nr-card__title', text: '📍 ' + r.region }),
          el('div', { class: 'nr-card__subtitle', text: r.count + ' مشروع' })
        ]),
        el('div', { class: 'nr-row' }, [
          el('span', { class: 'nr-badge nr-badge--primary', text: fmtNum(r.totalContract) + ' عقد' }),
          el('span', { class: 'nr-badge nr-badge--success', text: fmtNum(r.totalProduction) + ' إنتاج' })
        ])
      ]));

      var body = el('div', { class: 'nr-card__body' });
      var tw = el('div', { class: 'nr-table-wrap' });
      var tbl = el('table', { class: 'nr-table nr-table--compact' });

      var th = el('thead');
      var thr = el('tr');
      ['#', 'العميل', 'الشركة', 'القيمة', 'النسبة', 'الإنتاج', 'المتبقي'].forEach(function (h) {
        thr.appendChild(el('th', { text: h }));
      });
      th.appendChild(thr);
      tbl.appendChild(th);

      var tb = el('tbody');
      r.projects.forEach(function (p, i) {
        var ext = parseFloat(p.extractValue) || 0;
        var contr = parseFloat(p.contractValue) || 0;
        var base = ext > 0 ? ext : contr;
        var prog = parseFloat(p.progress) || 0;
        var prod = Math.round(base * prog / 100);
        var down = parseFloat(p.downPayment) || 0;
        var remain = base - down;

        var trow = el('tr');
        trow.appendChild(el('td', { text: String(i + 1) }));
        trow.appendChild(el('td', { text: p.name || '—' }));
        trow.appendChild(el('td', { text: p.company || '—' }));
        trow.appendChild(el('td', { text: fmtNum(base) }));
        trow.appendChild(el('td', {
          text: prog + '%',
          style: 'font-family: var(--nr-font-mono); color: var(--nr-accent);'
        }));
        trow.appendChild(el('td', {
          text: fmtNum(prod),
          style: 'font-family: var(--nr-font-mono); color: var(--nr-success);'
        }));
        trow.appendChild(el('td', {
          text: fmtNum(remain),
          style: 'font-family: var(--nr-font-mono); color: var(--nr-warning);'
        }));
        tb.appendChild(trow);
      });

      tbl.appendChild(tb);
      tw.appendChild(tbl);
      body.appendChild(tw);
      card.appendChild(body);
      wrap.appendChild(card);
    });

    return wrap;
  }

  // ==========================================================
  // 4. Excel preview (parsed rows preview)
  // ==========================================================
  function renderExcelPreview(parsedRows) {
    var card = el('div', { class: 'nr-card' });
    card.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', { class: 'nr-card__title', text: 'Excel Import Preview' }),
      el('span', { class: 'nr-badge nr-badge--primary', text: parsedRows.length + ' صف' })
    ]));

    var body = el('div', { class: 'nr-card__body' });
    if (parsedRows.length === 0) {
      body.appendChild(el('div', { class: 'nr-help', text: 'لا توجد بيانات مفسّرة.' }));
    } else {
      body.appendChild(renderEditableTable(parsedRows, null));
    }
    card.appendChild(body);
    return card;
  }

  global.NouRion = global.NouRion || {};
  global.NouRion.MeasurementsView = {
    renderSummary:        renderSummary,
    renderEditableTable:  renderEditableTable,
    renderRegionReport:   renderRegionReport,
    renderExcelPreview:   renderExcelPreview,
    fmtArea:              fmtArea
  };
})(typeof window !== 'undefined' ? window : globalThis);
