/* ============================================================
   NouRion — modules/projects/projects.view.js
   ------------------------------------------------------------
   Pure DOM builders. No event handlers, no data fetching.
   Every function takes data → returns HTMLElement or string.

   Depends on:
   - NouRion.ProjectsLogic (for calculations)
   - NouRion Design System CSS (nr-* classes)
   ============================================================ */

(function (global) {
  'use strict';

  var L = (global.NouRion && global.NouRion.ProjectsLogic) || null;

  // ==========================================================
  // Helpers
  // ==========================================================
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k.indexOf('data-') === 0) node.setAttribute(k, attrs[k]);
        else node.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      for (var i = 0; i < children.length; i++) {
        var c = children[i];
        if (c == null) continue;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      }
    }
    return node;
  }

  function fmtNumber(n) {
    if (n == null || isNaN(n)) return '—';
    return new Intl.NumberFormat('en-US').format(Math.round(n));
  }

  function fmtCurrency(n) {
    if (n == null || isNaN(n) || n === 0) return '—';
    return fmtNumber(n);
  }

  function statusVariant(status) {
    switch (status) {
      case 'جاري':                        return 'primary';
      case 'تركيب':                       return 'info';
      case 'تم التسليم':                  return 'success';
      case 'تأخير من العميل':             return 'warning';
      case 'تأخير من الشركة':             return 'warning';
      case 'موقوف - انتظار سداد العميل':  return 'danger';
      case 'موقوف':                       return 'danger';
      case 'ملغى':                        return 'danger';
      default:                             return '';
    }
  }

  // ==========================================================
  // 1. Summary cards (KPIs)
  // ==========================================================
  function renderSummary(projects) {
    var s = L.computeProjectSummary(projects);

    var cards = [
      { label: 'Total Projects', value: s.total,        trend: '', trendClass: '' },
      { label: 'Active',         value: s.active,       trend: 'قيد التنفيذ', trendClass: 'nr-stat__trend--up' },
      { label: 'Installing',     value: s.installing,   trend: 'في مرحلة التركيب', trendClass: '' },
      { label: 'Delivered',      value: s.delivered,    trend: 'مكتمل', trendClass: 'nr-stat__trend--up' },
      { label: 'Contract Value', value: fmtCurrency(s.totalContract),   trend: 'إجمالي', trendClass: '' },
      { label: 'Production',     value: fmtCurrency(s.totalProduction), trend: 'محقّق', trendClass: 'nr-stat__trend--up' }
    ];

    var container = el('div', { class: 'nr-grid-4', style: 'grid-template-columns: repeat(6, 1fr);' });

    cards.forEach(function (c) {
      var card = el('div', { class: 'nr-stat' }, [
        el('div', { class: 'nr-stat__label', text: c.label }),
        el('div', { class: 'nr-stat__value', text: String(c.value) }),
        c.trend ? el('div', { class: 'nr-stat__trend ' + c.trendClass, text: c.trend }) : null
      ]);
      container.appendChild(card);
    });

    return container;
  }

  // ==========================================================
  // 2. Project row (for table)
  // ==========================================================
  function renderProjectRow(project, index) {
    var fin    = L.computeProjectFinancials(project);
    var status = L.calcStatusFromStage(project.stage);
    var variant = statusVariant(status);

    var tr = el('tr', { 'data-project-id': project.id || '' });

    tr.appendChild(el('td', { text: String(index + 1) }));
    tr.appendChild(el('td', { text: project.contractNo || '—' }));
    tr.appendChild(el('td', { text: project.name || '—' }));
    tr.appendChild(el('td', { text: project.company || '—' }));
    tr.appendChild(el('td', { text: fmtCurrency(fin.baseValue) }));
    tr.appendChild(el('td', { text: fmtCurrency(fin.productionValue) }));
    tr.appendChild(el('td', { text: fmtCurrency(fin.remaining) }));

    // status badge
    var badgeCell = el('td');
    var badgeClass = 'nr-badge nr-badge--dot' + (variant ? (' nr-badge--' + variant) : '');
    badgeCell.appendChild(el('span', { class: badgeClass, text: status }));
    tr.appendChild(badgeCell);

    // progress bar
    var progCell = el('td');
    var progWrap = el('div', { class: 'nr-progress', style: 'width: 100px;' });
    progWrap.appendChild(el('div', { class: 'nr-progress__fill', style: 'width: ' + fin.progress + '%;' }));
    progCell.appendChild(progWrap);
    progCell.appendChild(el('small', {
      text: ' ' + fin.progress + '%',
      style: 'font-family: var(--nr-font-mono); color: var(--nr-text-tertiary);'
    }));
    tr.appendChild(progCell);

    // delivery date (smart)
    var smartDate = L.calcSmartDeliveryDate(project) || project.deliveryDate || '—';
    tr.appendChild(el('td', { text: smartDate }));

    // actions
    var actionsCell = el('td');
    var viewBtn = el('button', {
      class: 'nr-btn nr-btn--ghost nr-btn--sm',
      text: 'عرض',
      'data-action': 'view',
      'data-project-id': project.id || ''
    });
    actionsCell.appendChild(viewBtn);
    tr.appendChild(actionsCell);

    return tr;
  }

  // ==========================================================
  // 3. Full table
  // ==========================================================
  function renderTable(projects) {
    var wrap = el('div', { class: 'nr-table-wrap' });
    var table = el('table', { class: 'nr-table' });

    // head
    var thead = el('thead');
    var headRow = el('tr');
    var headers = ['#', 'رقم العقد', 'اسم العميل', 'الشركة', 'قيمة العقد', 'الإنتاج', 'المتبقّي', 'الحالة', 'التقدّم', 'موعد التسليم', ''];
    headers.forEach(function (h) {
      headRow.appendChild(el('th', { text: h }));
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    // body
    var tbody = el('tbody');
    if (!projects || projects.length === 0) {
      var emptyRow = el('tr');
      emptyRow.appendChild(el('td', {
        colspan: headers.length,
        text: 'لا توجد مشاريع بعد.',
        style: 'text-align: center; color: var(--nr-text-tertiary); padding: var(--nr-sp-8);'
      }));
      tbody.appendChild(emptyRow);
    } else {
      projects.forEach(function (p, i) {
        tbody.appendChild(renderProjectRow(p, i));
      });
    }
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  // ==========================================================
  // 4. Project card (compact)
  // ==========================================================
  function renderProjectCard(project) {
    var fin    = L.computeProjectFinancials(project);
    var status = L.calcStatusFromStage(project.stage);
    var variant = statusVariant(status);

    var card = el('div', { class: 'nr-card nr-card--hoverable nr-card--accent' });
    var header = el('div', { class: 'nr-card__header' }, [
      el('div', {}, [
        el('div', { class: 'nr-card__title', text: project.name || 'مشروع بلا اسم' }),
        el('div', { class: 'nr-card__subtitle', text: (project.contractNo || '') + ' · ' + (project.company || '') })
      ]),
      el('span', {
        class: 'nr-badge nr-badge--dot' + (variant ? (' nr-badge--' + variant) : ''),
        text: status
      })
    ]);

    var body = el('div', { class: 'nr-card__body' });

    // progress
    var progWrap = el('div', { style: 'margin-bottom: var(--nr-sp-4);' });
    progWrap.appendChild(el('div', { class: 'nr-row-between', style: 'margin-bottom: var(--nr-sp-2);' }, [
      el('small', { text: 'نسبة الإنجاز' }),
      el('small', {
        text: fin.progress + '%',
        style: 'font-family: var(--nr-font-mono); color: var(--nr-accent);'
      })
    ]));
    var bar = el('div', { class: 'nr-progress' });
    bar.appendChild(el('div', { class: 'nr-progress__fill', style: 'width: ' + fin.progress + '%;' }));
    progWrap.appendChild(bar);
    body.appendChild(progWrap);

    // financial grid
    var grid = el('div', { class: 'nr-grid-2' });

    function kv(label, value) {
      return el('div', {}, [
        el('small', { text: label, style: 'display: block; margin-bottom: 2px;' }),
        el('div', {
          text: fmtCurrency(value),
          style: 'font-family: var(--nr-font-mono); font-size: var(--nr-fs-md); color: var(--nr-text-primary);'
        })
      ]);
    }

    grid.appendChild(kv('قيمة العقد', fin.baseValue));
    grid.appendChild(kv('الدفعة المقدمة', fin.downPayment));
    grid.appendChild(kv('قيمة الإنتاج', fin.productionValue));
    grid.appendChild(kv('المبلغ المتبقّي', fin.remaining));

    body.appendChild(grid);

    card.appendChild(header);
    card.appendChild(body);

    // footer: smart delivery + pause reasons
    var reasons = L.getDeliveryPauseReasons(project);
    var smartDate = L.calcSmartDeliveryDate(project);

    var footer = el('div', { class: 'nr-card__footer', style: 'justify-content: space-between;' });
    if (smartDate) {
      footer.appendChild(el('small', {}));
      footer.appendChild(el('div', {}, [
        el('small', { text: 'موعد التسليم الذكي: ' }),
        el('span', {
          text: smartDate,
          style: 'font-family: var(--nr-font-mono); color: var(--nr-accent); font-weight: 500;'
        })
      ]));
    } else if (reasons.length > 0) {
      footer.appendChild(el('small', {
        text: '⚠ ' + reasons[0],
        style: 'color: var(--nr-warning);'
      }));
    }
    card.appendChild(footer);

    return card;
  }

  // ==========================================================
  // 5. Cards grid
  // ==========================================================
  function renderCardsGrid(projects) {
    var grid = el('div', { class: 'nr-grid-3' });
    if (!projects || projects.length === 0) {
      grid.appendChild(el('p', {
        text: 'لا توجد مشاريع بعد.',
        style: 'color: var(--nr-text-tertiary);'
      }));
      return grid;
    }
    projects.forEach(function (p) {
      grid.appendChild(renderProjectCard(p));
    });
    return grid;
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================
  global.NouRion = global.NouRion || {};
  global.NouRion.ProjectsView = {
    renderSummary:     renderSummary,
    renderTable:       renderTable,
    renderProjectRow:  renderProjectRow,
    renderProjectCard: renderProjectCard,
    renderCardsGrid:   renderCardsGrid,
    // helpers exposed for reuse
    fmtNumber:         fmtNumber,
    fmtCurrency:       fmtCurrency,
    statusVariant:     statusVariant
  };
})(typeof window !== 'undefined' ? window : globalThis);
