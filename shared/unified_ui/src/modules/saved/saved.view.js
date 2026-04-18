/* ============================================================
   NouRion — modules/saved/saved.view.js
   Pure DOM builders for Saved Reports module.
   ============================================================ */

(function (global) {
  'use strict';

  var L = (global.NouRion && global.NouRion.SavedLogic) || null;

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

  var MONTH_NAMES_AR = [
    '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  // ==========================================================
  // 1. Summary strip (6 KPIs)
  // ==========================================================
  function renderOverview(projects) {
    var all = L.computeAllMonths(projects);
    var totalProduction = 0;
    var totalMonths = all.length;
    for (var i = 0; i < all.length; i++) totalProduction += all[i].total;

    var migrated = L.migrateProjectList(projects);

    var cards = [
      { label: 'Projects',        value: projects.length },
      { label: 'Tracked Months',  value: totalMonths },
      { label: 'Total Production', value: fmtNum(totalProduction) },
      { label: 'Need Migration',  value: migrated.changedCount,
        trend: migrated.changedCount > 0 ? 'حقول قديمة مكتشفة' : 'كل البيانات نظيفة',
        trendClass: migrated.changedCount > 0 ? 'nr-stat__trend--down' : 'nr-stat__trend--up' }
    ];

    var grid = el('div', { class: 'nr-grid-4' });
    cards.forEach(function (c) {
      grid.appendChild(el('div', { class: 'nr-stat' }, [
        el('div', { class: 'nr-stat__label', text: c.label }),
        el('div', { class: 'nr-stat__value', text: String(c.value) }),
        c.trend ? el('div', { class: 'nr-stat__trend ' + (c.trendClass || ''), text: c.trend }) : null
      ]));
    });
    return grid;
  }

  // ==========================================================
  // 2. Monthly production table
  // ==========================================================
  function renderMonthlyReport(projects, year, month) {
    var r = L.computeMonthlyProduction(projects, year, month);

    var card = el('div', { class: 'nr-card' });

    var header = el('div', { class: 'nr-card__header' }, [
      el('div', {}, [
        el('div', { class: 'nr-card__title', text: '📈 تقرير إنتاج — ' + (MONTH_NAMES_AR[month] || month) + ' ' + year }),
        el('div', { class: 'nr-card__subtitle', text: r.count + ' مشروع ساهم · إجمالي: ' + fmtNum(r.total) + ' ر' })
      ]),
      el('span', { class: 'nr-badge nr-badge--primary', text: L.generateReportNo(new Date(year, month - 1, 1)) })
    ]);
    card.appendChild(header);

    var body = el('div', { class: 'nr-card__body' });

    if (!r.rows.length) {
      body.appendChild(el('div', {
        class: 'nr-help',
        text: 'لا توجد بيانات إنتاج في هذا الشهر.',
        style: 'text-align: center; padding: var(--nr-sp-8);'
      }));
    } else {
      var wrap = el('div', { class: 'nr-table-wrap' });
      var table = el('table', { class: 'nr-table nr-table--compact' });

      var thead = el('thead');
      var head = el('tr');
      ['العميل', 'الشركة', 'المنطقة', 'الأساس', 'سابق %', 'الآن %', 'Δ %', 'الإنتاج'].forEach(function (h) {
        head.appendChild(el('th', { text: h }));
      });
      thead.appendChild(head);
      table.appendChild(thead);

      var tbody = el('tbody');
      r.rows.forEach(function (row) {
        var tr = el('tr');
        tr.appendChild(el('td', { text: row.name }));
        tr.appendChild(el('td', { text: row.company }));
        tr.appendChild(el('td', { text: row.region || '—' }));
        tr.appendChild(el('td', { text: fmtNum(row.baseVal) }));
        tr.appendChild(el('td', { text: row.prevProgress + '%' }));
        tr.appendChild(el('td', { text: row.thisProgress + '%' }));
        tr.appendChild(el('td', {
          text: '+' + row.delta + '%',
          style: 'color: var(--nr-success); font-family: var(--nr-font-mono);'
        }));
        tr.appendChild(el('td', {
          text: fmtNum(row.prodValue),
          style: 'font-family: var(--nr-font-mono); color: var(--nr-accent);'
        }));
        tbody.appendChild(tr);
      });

      // total row
      var totalRow = el('tr', { style: 'background: var(--nr-bg-3); font-weight: 500;' });
      totalRow.appendChild(el('td', { colspan: '7', text: 'إجمالي الإنتاج', style: 'text-align: left;' }));
      totalRow.appendChild(el('td', {
        text: fmtNum(r.total) + ' ر',
        style: 'font-family: var(--nr-font-mono); color: var(--nr-accent); font-weight: 600;'
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
  // 3. Months list selector
  // ==========================================================
  function renderMonthsList(projects, onSelect) {
    var months = L.computeAllMonths(projects);
    var wrap = el('div', { class: 'nr-stack-sm' });

    if (!months.length) {
      wrap.appendChild(el('div', {
        class: 'nr-help',
        text: 'لا توجد أشهر مسجّلة بعد.'
      }));
      return wrap;
    }

    months.forEach(function (m) {
      var row = el('div', {
        class: 'nr-row-between nr-card',
        style: 'padding: var(--nr-sp-3) var(--nr-sp-4); cursor: pointer;',
        'data-year': m.year,
        'data-month': m.month
      });
      row.appendChild(el('div', {}, [
        el('div', {
          text: (MONTH_NAMES_AR[m.month] || m.month) + ' ' + m.year,
          style: 'font-weight: 500;'
        }),
        el('small', { text: m.count + ' مشروع' })
      ]));
      row.appendChild(el('div', {
        text: fmtNum(m.total) + ' ر',
        style: 'font-family: var(--nr-font-mono); color: var(--nr-accent); font-size: var(--nr-fs-lg);'
      }));
      if (onSelect) {
        row.addEventListener('click', function () { onSelect(m.year, m.month); });
      }
      wrap.appendChild(row);
    });

    return wrap;
  }

  // ==========================================================
  // 4. Migration report
  // ==========================================================
  function renderMigrationReport(projects) {
    var r = L.migrateProjectList(projects);

    var card = el('div', { class: 'nr-card' });
    card.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', {}, [
        el('div', { class: 'nr-card__title', text: 'Data Migration Preview' }),
        el('div', { class: 'nr-card__subtitle',
          text: r.changedCount + ' من ' + projects.length + ' مشروع يحتاج ترحيل' })
      ]),
      el('span', {
        class: r.changedCount > 0 ? 'nr-badge nr-badge--warning' : 'nr-badge nr-badge--success',
        text: r.changedCount > 0 ? 'يحتاج عمل' : 'نظيف'
      })
    ]));

    var body = el('div', { class: 'nr-card__body' });

    if (r.changedCount === 0) {
      body.appendChild(el('div', {
        class: 'nr-alert nr-alert--success',
        html: '<span class="nr-alert__icon">✓</span><div class="nr-alert__body"><div class="nr-alert__title">كل البيانات حديثة</div><div class="nr-alert__msg">لا توجد حقول قديمة تحتاج ترحيل.</div></div>'
      }));
    } else {
      var list = el('div', { class: 'nr-stack-sm' });
      for (var i = 0; i < projects.length; i++) {
        var single = L.migrateProjectFields(projects[i]);
        if (!single.changed) continue;
        list.appendChild(el('div', {
          class: 'nr-row-between',
          style: 'padding: var(--nr-sp-2) var(--nr-sp-3); background: var(--nr-bg-3); border-radius: var(--nr-r-sm);'
        }, [
          el('span', { text: projects[i].name || projects[i].id || '—' }),
          el('span', {
            text: single.changes.join(' · '),
            style: 'font-family: var(--nr-font-mono); font-size: var(--nr-fs-xs); color: var(--nr-accent);'
          })
        ]));
      }
      body.appendChild(list);
    }

    card.appendChild(body);
    return card;
  }

  global.NouRion = global.NouRion || {};
  global.NouRion.SavedView = {
    renderOverview:        renderOverview,
    renderMonthlyReport:   renderMonthlyReport,
    renderMonthsList:      renderMonthsList,
    renderMigrationReport: renderMigrationReport,
    MONTH_NAMES_AR:        MONTH_NAMES_AR,
    fmtNum:                fmtNum
  };
})(typeof window !== 'undefined' ? window : globalThis);
