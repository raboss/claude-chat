/* ============================================================
   NouRion — modules/documents/documents.view.js
   Pure DOM builders for the Documents module.
   ============================================================ */

(function (global) {
  'use strict';

  var L = (global.NouRion && global.NouRion.DocumentsLogic) || null;

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

  // ==========================================================
  // 1. Extract financial card (مستخلص — مع VAT)
  // ==========================================================
  function renderExtractFinancials(project) {
    var f = L.computeExtractFinancials(project);

    var card = el('div', { class: 'nr-card nr-card--accent' });
    card.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', {}, [
        el('div', { class: 'nr-card__title', text: '🧾 ملخّص المستخلص المالي' }),
        el('div', { class: 'nr-card__subtitle', text: f.isFromExtract ? 'من قيمة المستخلص (شاملة VAT)' : 'من قيمة العقد + إضافة VAT' })
      ]),
      el('span', { class: 'nr-badge nr-badge--primary', text: 'VAT 15%' })
    ]));

    var body = el('div', { class: 'nr-card__body' });
    var table = el('table', { class: 'nr-table' });
    var tbody = el('tbody');

    function row(label, value, color) {
      var tr = el('tr');
      tr.appendChild(el('td', { text: label }));
      tr.appendChild(el('td', {
        text: fmtNum(value) + ' ر',
        style: 'font-family: var(--nr-font-mono); text-align: left; ' + (color ? 'color: ' + color + '; font-weight: 500;' : '')
      }));
      tbody.appendChild(tr);
    }

    row('الإجمالي قبل الضريبة', f.base);
    row('ضريبة القيمة المضافة (15%)', f.vat, 'var(--nr-warning)');
    row('الإجمالي بعد الضريبة', f.total, 'var(--nr-accent)');
    row('الدفعة المقدمة (المسددة)', -f.downPayment, 'var(--nr-success)');
    row('الصافي المستحق للتحصيل', f.net, f.net > 0 ? 'var(--nr-danger)' : 'var(--nr-success)');

    table.appendChild(tbody);
    body.appendChild(table);
    card.appendChild(body);
    return card;
  }

  // ==========================================================
  // 2. Financial distribution bar
  // ==========================================================
  function renderFinancialDistribution(project) {
    var d = L.computeFinancialDistribution(project);

    var card = el('div', { class: 'nr-card' });
    card.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', { class: 'nr-card__title', text: '📊 التوزيع المالي' }),
      el('span', { class: 'nr-badge', text: 'إجمالي: ' + fmtNum(d.total) })
    ]));

    var body = el('div', { class: 'nr-card__body' });

    // bar
    var bar = el('div', {
      style: 'display: flex; height: 32px; border-radius: var(--nr-r-md); overflow: hidden; border: 1px solid var(--nr-border);'
    });
    if (d.paid > 0) bar.appendChild(el('div', {
      text: d.paidPct + '%',
      style: 'flex: 0 0 ' + d.paidPct + '%; background: var(--nr-success); color: #fff; ' +
             'display: flex; align-items: center; justify-content: center; font-size: var(--nr-fs-xs); font-weight: 500;'
    }));
    if (d.prod > 0) bar.appendChild(el('div', {
      text: d.prodPct + '%',
      style: 'flex: 0 0 ' + d.prodPct + '%; background: var(--nr-accent); color: #fff; ' +
             'display: flex; align-items: center; justify-content: center; font-size: var(--nr-fs-xs); font-weight: 500;'
    }));
    if (d.rem > 0) bar.appendChild(el('div', {
      text: d.remPct + '%',
      style: 'flex: 0 0 ' + d.remPct + '%; background: var(--nr-danger); color: #fff; ' +
             'display: flex; align-items: center; justify-content: center; font-size: var(--nr-fs-xs); font-weight: 500;'
    }));
    body.appendChild(bar);

    // legend
    var legend = el('div', { class: 'nr-row', style: 'flex-wrap: wrap; gap: var(--nr-sp-4); margin-top: var(--nr-sp-3);' });
    [
      { color: 'var(--nr-success)', label: 'الدفعة المقدمة', value: d.paid },
      { color: 'var(--nr-accent)',  label: 'الإنتاج الإضافي', value: d.prod },
      { color: 'var(--nr-danger)',  label: 'المتبقّي',          value: d.rem }
    ].forEach(function (item) {
      var row = el('div', { class: 'nr-row', style: 'gap: var(--nr-sp-2);' });
      row.appendChild(el('span', { style: 'width: 12px; height: 12px; background: ' + item.color + '; border-radius: 2px; display: inline-block;' }));
      row.appendChild(el('small', { text: item.label + ': ' + fmtNum(item.value) }));
      legend.appendChild(row);
    });
    body.appendChild(legend);

    card.appendChild(body);
    return card;
  }

  // ==========================================================
  // 3. Measurements aggregation table
  // ==========================================================
  function renderMeasItemsTable(measRows, plRows, opts) {
    var r = L.groupMeasurementsByPriceList(measRows, plRows, opts);

    var card = el('div', { class: 'nr-card' });
    card.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', {}, [
        el('div', { class: 'nr-card__title', text: '📐 بنود المقاسات' }),
        el('div', { class: 'nr-card__subtitle', text: r.activeCount + ' وحدة → ' + r.items.length + ' نوع قطاع' })
      ]),
      el('span', { class: 'nr-badge nr-badge--success', text: 'إجمالي: ' + fmtNum(r.grandTotal) + ' ر' })
    ]));

    var body = el('div', { class: 'nr-card__body' });

    if (r.items.length === 0) {
      body.appendChild(el('div', { class: 'nr-help', text: 'لا توجد بنود مقاسات.' }));
    } else {
      var wrap = el('div', { class: 'nr-table-wrap' });
      var table = el('table', { class: 'nr-table nr-table--compact' });

      var thead = el('thead');
      var headRow = el('tr');
      ['#', 'القطاع', 'العدد', 'المساحة (m²)', 'سعر الـ m²', 'القيمة (ر)'].forEach(function (h) {
        headRow.appendChild(el('th', { text: h }));
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      var tbody = el('tbody');
      r.items.forEach(function (it, i) {
        var val = it.price ? Math.round(it.totalArea * it.price * 100) / 100 : 0;
        var tr = el('tr');
        tr.appendChild(el('td', { text: String(i + 1) }));
        tr.appendChild(el('td', { text: it.sectionName }));
        tr.appendChild(el('td', { text: String(it.count) }));
        tr.appendChild(el('td', {
          text: it.totalArea.toFixed(2),
          style: 'font-family: var(--nr-font-mono); color: var(--nr-warning);'
        }));
        tr.appendChild(el('td', {
          text: it.price ? fmtNum(it.price) : '—',
          style: 'font-family: var(--nr-font-mono);'
        }));
        tr.appendChild(el('td', {
          text: it.price ? fmtNum(val) : '—',
          style: 'font-family: var(--nr-font-mono); color: var(--nr-success); font-weight: 500;'
        }));
        tbody.appendChild(tr);
      });

      // Total row
      var totalRow = el('tr', { style: 'background: var(--nr-bg-3); font-weight: 500;' });
      totalRow.appendChild(el('td', { colspan: '3', text: 'الإجمالي', style: 'text-align: left;' }));
      totalRow.appendChild(el('td', {
        text: r.grandArea.toFixed(2) + ' m²',
        style: 'font-family: var(--nr-font-mono); color: var(--nr-warning);'
      }));
      totalRow.appendChild(el('td', { text: '' }));
      totalRow.appendChild(el('td', {
        text: fmtNum(r.grandTotal) + ' ر',
        style: 'font-family: var(--nr-font-mono); color: var(--nr-success); font-weight: 600;'
      }));
      tbody.appendChild(totalRow);

      table.appendChild(tbody);
      wrap.appendChild(table);
      body.appendChild(wrap);
    }

    card.appendChild(body);
    return card;
  }

  // ==========================================================
  // 4. Logo + watermark preview
  // ==========================================================
  function renderDocSettings(opts) {
    var card = el('div', { class: 'nr-card' });
    card.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', { class: 'nr-card__title', text: 'إعدادات المستند' })
    ]));

    var body = el('div', { class: 'nr-card__body nr-grid-2' });

    // Logo
    var logoKey = L.getCompanyLogoKey(opts.company);
    body.appendChild(el('div', {}, [
      el('small', { text: 'الشعار التلقائي:', style: 'display: block; margin-bottom: var(--nr-sp-1);' }),
      el('div', {}, [
        el('span', { class: 'nr-badge nr-badge--primary', text: logoKey === 'none' ? 'لا يوجد' : logoKey }),
        el('small', { text: ' (من اسم الشركة: ' + (opts.company || '—') + ')', style: 'margin-inline-start: var(--nr-sp-2);' })
      ])
    ]));

    // Watermark color
    var wmColor = L.getWatermarkColor(opts.wmColorName, opts.wmCustomColor);
    body.appendChild(el('div', {}, [
      el('small', { text: 'لون العلامة المائية:', style: 'display: block; margin-bottom: var(--nr-sp-1);' }),
      el('div', { class: 'nr-row', style: 'gap: var(--nr-sp-2);' }, [
        el('span', { style: 'width: 24px; height: 24px; background: ' + wmColor + '; border-radius: var(--nr-r-sm); border: 1px solid var(--nr-border); display: inline-block;' }),
        el('small', { text: wmColor, style: 'font-family: var(--nr-font-mono);' })
      ])
    ]));

    // Visibility
    var visible = L.resolveWatermarkVisibility(opts);
    body.appendChild(el('div', {}, [
      el('small', { text: 'العلامة ظاهرة؟', style: 'display: block; margin-bottom: var(--nr-sp-1);' }),
      el('span', {
        class: 'nr-badge ' + (visible ? 'nr-badge--success' : 'nr-badge--warning'),
        text: visible ? '✓ نعم' : '✕ لا'
      })
    ]));

    card.appendChild(body);
    return card;
  }

  // ==========================================================
  // 5. Document type selector grid
  // ==========================================================
  function renderDocTypesGrid(currentKey, onSelect) {
    var grid = el('div', { class: 'nr-grid-4' });
    L.DOC_TYPES.forEach(function (t) {
      var isActive = t.key === currentKey;
      var btn = el('button', {
        class: 'nr-btn ' + (isActive ? 'nr-btn--primary' : ''),
        text: t.label,
        style: 'justify-content: flex-start; height: 48px;'
      });
      if (onSelect) btn.addEventListener('click', function () { onSelect(t.key); });
      grid.appendChild(btn);
    });
    return grid;
  }

  global.NouRion = global.NouRion || {};
  global.NouRion.DocumentsView = {
    renderExtractFinancials:    renderExtractFinancials,
    renderFinancialDistribution:renderFinancialDistribution,
    renderMeasItemsTable:       renderMeasItemsTable,
    renderDocSettings:          renderDocSettings,
    renderDocTypesGrid:         renderDocTypesGrid
  };
})(typeof window !== 'undefined' ? window : globalThis);
