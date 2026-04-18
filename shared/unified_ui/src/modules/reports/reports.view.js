/* ============================================================
   NouRion — modules/reports/reports.view.js
   Pure DOM builders + lightweight CSS-based charts (no Chart.js).
   ============================================================ */

(function (global) {
  'use strict';

  var L = (global.NouRion && global.NouRion.ReportsLogic) || null;

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
  // 1. Status counts strip (4 KPIs)
  // ==========================================================
  function renderStatusCounts(projects) {
    var c = L.computeStatusCounts(projects);
    var grid = el('div', { class: 'nr-grid-4' });
    [
      { label: 'Total Projects', value: c.total },
      { label: 'Active',         value: c.jaari, trendClass: 'nr-stat__trend--up', trend: 'قيد التنفيذ' },
      { label: 'Installing',     value: c.tarkib, trend: 'في مرحلة التركيب' },
      { label: 'Stalled / Late', value: c.mawqof,
        trendClass: c.mawqof > 0 ? 'nr-stat__trend--down' : '',
        trend: c.mawqof > 0 ? 'يحتاج متابعة' : 'سليم' }
    ].forEach(function (k) {
      grid.appendChild(el('div', { class: 'nr-stat' }, [
        el('div', { class: 'nr-stat__label', text: k.label }),
        el('div', { class: 'nr-stat__value', text: String(k.value) }),
        el('div', { class: 'nr-stat__trend ' + (k.trendClass || ''), text: k.trend || '' })
      ]));
    });
    return grid;
  }

  // ==========================================================
  // 2. Status distribution — horizontal bars (لا Chart.js)
  // ==========================================================
  function renderStatusDistribution(projects) {
    var d = L.computeStatusDistribution(projects);
    var card = el('div', { class: 'nr-card' });
    card.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', { class: 'nr-card__title', text: 'توزيع الحالات' }),
      el('span', { class: 'nr-badge', text: d.total + ' مشروع' })
    ]));

    var body = el('div', { class: 'nr-card__body' });
    if (!d.nonZero.length) {
      body.appendChild(el('div', { class: 'nr-help', text: 'لا توجد بيانات.' }));
    } else {
      var stack = el('div', { class: 'nr-stack-sm' });
      var max = d.nonZero.reduce(function (m, e) { return Math.max(m, e.count); }, 1);
      d.nonZero.forEach(function (e) {
        var pct = (e.count / max * 100).toFixed(1);
        var row = el('div', {});
        row.appendChild(el('div', { class: 'nr-row-between', style: 'margin-bottom: var(--nr-sp-1);' }, [
          el('small', { text: e.status }),
          el('small', {
            text: String(e.count),
            style: 'font-family: var(--nr-font-mono); color: var(--nr-text-primary);'
          })
        ]));
        var bar = el('div', { class: 'nr-progress' });
        bar.appendChild(el('div', {
          class: 'nr-progress__fill',
          style: 'width: ' + pct + '%; background: ' + e.color + ';'
        }));
        row.appendChild(bar);
        stack.appendChild(row);
      });
      body.appendChild(stack);
    }

    card.appendChild(body);
    return card;
  }

  // ==========================================================
  // 3. Stacked bar chart (CSS) — Company × Status
  // ==========================================================
  function renderCompanyStackedBars(projects) {
    var m = L.computeProjectByCompanyMatrix(projects);
    var card = el('div', { class: 'nr-card' });
    card.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', { class: 'nr-card__title', text: 'المشاريع حسب الشركة والحالة' })
    ]));

    var body = el('div', { class: 'nr-card__body' });

    if (!m.companies.length) {
      body.appendChild(el('div', { class: 'nr-help', text: 'لا توجد بيانات.' }));
      card.appendChild(body);
      return card;
    }

    // For each company → row with stacked segments
    var maxTotal = 0;
    m.companies.forEach(function (_, ci) {
      var sum = m.datasets.reduce(function (s, ds) { return s + ds.data[ci]; }, 0);
      if (sum > maxTotal) maxTotal = sum;
    });

    var stack = el('div', { class: 'nr-stack' });
    m.companies.forEach(function (co, ci) {
      var coTotal = m.datasets.reduce(function (s, ds) { return s + ds.data[ci]; }, 0);
      var widthPct = maxTotal > 0 ? (coTotal / maxTotal * 100).toFixed(1) : 0;

      var row = el('div', {});
      row.appendChild(el('div', { class: 'nr-row-between', style: 'margin-bottom: var(--nr-sp-1);' }, [
        el('small', { text: co, style: 'font-weight: 500;' }),
        el('small', { text: String(coTotal) + ' مشروع', style: 'color: var(--nr-text-tertiary);' })
      ]));

      var bar = el('div', {
        style: 'display: flex; height: 24px; border-radius: var(--nr-r-md); overflow: hidden; ' +
               'border: 1px solid var(--nr-border); width: ' + widthPct + '%;'
      });
      m.datasets.forEach(function (ds) {
        var v = ds.data[ci];
        if (!v) return;
        var seg = el('div', {
          title: ds.label + ': ' + v,
          style: 'flex: ' + v + ' 0 0; background: ' + ds.color + '; ' +
                 'display: flex; align-items: center; justify-content: center; color: #fff; font-size: var(--nr-fs-xs); font-weight: 500;'
        });
        seg.textContent = v;
        bar.appendChild(seg);
      });
      row.appendChild(bar);
      stack.appendChild(row);
    });
    body.appendChild(stack);

    // Legend
    var legend = el('div', {
      class: 'nr-row',
      style: 'flex-wrap: wrap; gap: var(--nr-sp-3); margin-top: var(--nr-sp-4); padding-top: var(--nr-sp-3); border-top: 1px solid var(--nr-border-subtle);'
    });
    m.datasets.forEach(function (ds) {
      var item = el('div', { class: 'nr-row', style: 'gap: var(--nr-sp-2);' });
      item.appendChild(el('span', {
        style: 'width: 10px; height: 10px; background: ' + ds.color + '; border-radius: 2px; display: inline-block;'
      }));
      item.appendChild(el('small', { text: ds.label }));
      legend.appendChild(item);
    });
    body.appendChild(legend);

    card.appendChild(body);
    return card;
  }

  // ==========================================================
  // 4. Breakdown table (Company × Region)
  // ==========================================================
  function renderBreakdownTable(projects) {
    var b = L.computeBreakdownByCompany(projects);
    var wrap = el('div', { class: 'nr-stack' });

    if (!b.length) {
      wrap.appendChild(el('div', { class: 'nr-help', text: 'لا توجد بيانات.' }));
      return wrap;
    }

    b.forEach(function (co) {
      var card = el('div', { class: 'nr-card' });
      card.appendChild(el('div', { class: 'nr-card__header' }, [
        el('div', { class: 'nr-card__title', text: co.company }),
        el('span', { class: 'nr-badge nr-badge--primary', text: co.count + ' مشروع' })
      ]));

      var body = el('div', { class: 'nr-card__body' });
      var tw = el('div', { class: 'nr-table-wrap' });
      var tbl = el('table', { class: 'nr-table nr-table--compact' });

      // header
      var thead = el('thead');
      var hr = el('tr');
      hr.appendChild(el('th', { text: 'المنطقة' }));
      hr.appendChild(el('th', { text: 'الإجمالي' }));
      var statusKeys = Object.keys(co.totalByStatus);
      statusKeys.forEach(function (s) {
        hr.appendChild(el('th', { text: s, style: 'font-size: 9px;' }));
      });
      thead.appendChild(hr);
      tbl.appendChild(thead);

      var tbody = el('tbody');
      co.regions.forEach(function (r) {
        var tr = el('tr');
        tr.appendChild(el('td', { text: r.region, style: 'font-weight: 500;' }));
        tr.appendChild(el('td', {
          text: String(r.count),
          style: 'font-family: var(--nr-font-mono); color: var(--nr-accent);'
        }));
        statusKeys.forEach(function (s) {
          var cnt = r.byStatus[s] || 0;
          var color = L.STATUS_COLORS[s] || '#666';
          tr.appendChild(el('td', cnt > 0 ? {
            text: String(cnt),
            style: 'color: ' + color + '; font-weight: 500; text-align: center;'
          } : { text: '—', style: 'color: var(--nr-text-tertiary); text-align: center;' }));
        });
        tbody.appendChild(tr);
      });

      // total row
      var totalRow = el('tr', { style: 'background: var(--nr-bg-3); font-weight: 500;' });
      totalRow.appendChild(el('td', { text: 'المجموع', style: 'font-weight: 600;' }));
      totalRow.appendChild(el('td', {
        text: String(co.count),
        style: 'font-family: var(--nr-font-mono); color: var(--nr-accent); font-weight: 600;'
      }));
      statusKeys.forEach(function (s) {
        var cnt = co.totalByStatus[s] || 0;
        totalRow.appendChild(el('td', {
          text: cnt > 0 ? String(cnt) : '—',
          style: 'text-align: center; font-weight: 600;'
        }));
      });
      tbody.appendChild(totalRow);

      tbl.appendChild(tbody);
      tw.appendChild(tbl);
      body.appendChild(tw);
      card.appendChild(body);
      wrap.appendChild(card);
    });

    return wrap;
  }

  // ==========================================================
  // 5. Materials totals card
  // ==========================================================
  function renderMaterialsTotals(projects) {
    var t = L.computeMaterialsTotals(projects);
    var card = el('div', { class: 'nr-card nr-card--accent' });
    card.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', { class: 'nr-card__title', text: '📦 إجماليات المواد' }),
      el('span', { class: 'nr-badge nr-badge--success', text: 'الإجمالي الشامل: ' + fmtNum(t.grandOps) + ' ر' })
    ]));

    var body = el('div', { class: 'nr-card__body nr-grid-3' });
    [
      { l: 'قيمة المستخلص', v: t.ext, c: 'var(--nr-accent)' },
      { l: 'الدفعات المقدّمة', v: t.down, c: 'var(--nr-success)' },
      { l: 'الصافي', v: t.net, c: 'var(--nr-warning)' },
      { l: 'قيمة المواد', v: t.mats, c: 'var(--nr-accent)' },
      { l: 'تم شراؤه', v: t.purchased, c: 'var(--nr-success)' },
      { l: 'متبقّي المواد', v: t.matRem, c: 'var(--nr-danger)' },
      { l: 'الألمنيوم', v: t.alum, c: 'var(--nr-accent)' },
      { l: 'الزجاج', v: t.glass, c: 'var(--nr-info)' },
      { l: 'عهدة التشغيل', v: t.ops, c: 'var(--nr-warning)' }
    ].forEach(function (kpi) {
      body.appendChild(el('div', {
        style: 'padding: var(--nr-sp-3); background: var(--nr-bg-3); border-radius: var(--nr-r-md);'
      }, [
        el('small', { text: kpi.l, style: 'display: block; margin-bottom: var(--nr-sp-1);' }),
        el('div', {
          text: fmtNum(kpi.v),
          style: 'font-family: var(--nr-font-mono); font-size: var(--nr-fs-lg); color: ' + kpi.c + '; font-weight: 500;'
        })
      ]));
    });
    card.appendChild(body);
    return card;
  }

  // ==========================================================
  // 6. Financial snapshot strip
  // ==========================================================
  function renderFinancialSnapshot(projects) {
    var s = L.computeFinancialSnapshot(projects);
    var grid = el('div', { class: 'nr-grid-4', style: 'grid-template-columns: repeat(5, 1fr);' });
    [
      { label: 'Contracts', value: s.contract },
      { label: 'Extracts',  value: s.extract },
      { label: 'Down',      value: s.down },
      { label: 'Production',value: s.production, trendClass: 'nr-stat__trend--up' },
      { label: 'Remaining', value: s.remaining }
    ].forEach(function (k) {
      grid.appendChild(el('div', { class: 'nr-stat' }, [
        el('div', { class: 'nr-stat__label', text: k.label }),
        el('div', {
          class: 'nr-stat__value',
          text: fmtNum(k.value),
          style: 'font-size: var(--nr-fs-xl);'
        })
      ]));
    });
    return grid;
  }

  global.NouRion = global.NouRion || {};
  global.NouRion.ReportsView = {
    renderStatusCounts:        renderStatusCounts,
    renderStatusDistribution:  renderStatusDistribution,
    renderCompanyStackedBars:  renderCompanyStackedBars,
    renderBreakdownTable:      renderBreakdownTable,
    renderMaterialsTotals:     renderMaterialsTotals,
    renderFinancialSnapshot:   renderFinancialSnapshot
  };
})(typeof window !== 'undefined' ? window : globalThis);
