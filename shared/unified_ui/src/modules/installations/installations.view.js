/* ============================================================
   NouRion — modules/installations/installations.view.js
   Pure DOM builders for the Installations module.
   ============================================================ */

(function (global) {
  'use strict';

  var L = (global.NouRion && global.NouRion.InstallationsLogic) || null;

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

  var STATUS_LABELS = {
    new:         'جديد',
    confirmed:   'مؤكَّد',
    cancelled:   'ملغى',
    pending:     'بانتظار',
    in_progress: 'قيد العمل',
    completed:   'مُكتمل',
    signed:      'موقَّع'
  };

  var STATUS_VARIANTS = {
    new:         'primary',
    confirmed:   'success',
    cancelled:   'danger',
    pending:     'warning',
    in_progress: 'info',
    completed:   'success',
    signed:      'info'
  };

  // ==========================================================
  // 1. Summary KPIs for installations
  // ==========================================================
  function renderInstallationsSummary(entries, maintOrders, deliveries) {
    var iSum = L.computeInstallationsSummary(entries);
    var mSum = L.computeMaintenanceSummary(maintOrders);
    var dSum = L.computeDeliverySummary(deliveries);

    var grid = el('div', { class: 'nr-grid-4' });
    [
      { label: 'Installations', value: iSum.total,     trend: iSum.new + ' جديدة', trendClass: iSum.new > 0 ? 'nr-stat__trend--up' : '' },
      { label: 'Total Meas',    value: iSum.totalMeas, trend: 'مقاس مُدخَل' },
      { label: 'Maint Orders',  value: mSum.total,     trend: mSum.pending + ' بانتظار', trendClass: mSum.pending > 0 ? 'nr-stat__trend--down' : '' },
      { label: 'Deliveries',    value: dSum.total,     trend: dSum.pending + ' بانتظار' }
    ].forEach(function (k) {
      grid.appendChild(el('div', { class: 'nr-stat' }, [
        el('div', { class: 'nr-stat__label', text: k.label }),
        el('div', { class: 'nr-stat__value', text: String(k.value) }),
        el('div', { class: 'nr-stat__trend ' + (k.trendClass || ''), text: k.trend })
      ]));
    });
    return grid;
  }

  // ==========================================================
  // 2. Installation entries list
  // ==========================================================
  function renderEntriesList(entries, onAction) {
    var wrap = el('div', { class: 'nr-stack' });
    if (!entries || !entries.length) {
      wrap.appendChild(el('div', { class: 'nr-help', text: 'لا توجد مُدخلات تركيب.' }));
      return wrap;
    }

    entries.forEach(function (e) {
      var count = L.countFilledMeasurements(e);
      var variant = STATUS_VARIANTS[e.status] || '';
      var label   = STATUS_LABELS[e.status]   || e.status;

      var card = el('div', { class: 'nr-card', style: 'border-inline-start: 3px solid var(--nr-' + (variant === 'primary' ? 'accent' : variant === 'success' ? 'success' : variant === 'danger' ? 'danger' : 'border') + ');' });
      var header = el('div', { class: 'nr-card__header' }, [
        el('div', {}, [
          el('div', { class: 'nr-card__title', text: '👤 ' + e.clientName }),
          el('div', { class: 'nr-card__subtitle', text: count + ' مقاس · ' + (e.createdAt ? e.createdAt.slice(0, 10) : '—') })
        ]),
        el('span', { class: 'nr-badge nr-badge--' + variant + ' nr-badge--dot', text: label })
      ]);
      card.appendChild(header);

      if (e.status === 'new' && count > 0) {
        var footer = el('div', { class: 'nr-card__footer' });
        var mergeBtn = el('button', { class: 'nr-btn nr-btn--sm nr-btn--primary', text: '🔗 دمج مع مشروع' });
        var confirmBtn = el('button', { class: 'nr-btn nr-btn--sm nr-btn--success', text: '✓ تأكيد ونقل' });
        if (onAction) {
          mergeBtn.addEventListener('click', function () { onAction('merge', e); });
          confirmBtn.addEventListener('click', function () { onAction('confirm', e); });
        }
        footer.appendChild(mergeBtn);
        footer.appendChild(confirmBtn);
        card.appendChild(footer);
      } else if (e.status === 'confirmed') {
        card.appendChild(el('div', { class: 'nr-card__footer' }, [
          el('small', {
            text: 'ربط بمشروع: ' + (e.linkedProjectId || '—'),
            style: 'color: var(--nr-text-tertiary); font-family: var(--nr-font-mono);'
          })
        ]));
      }

      wrap.appendChild(card);
    });

    return wrap;
  }

  // ==========================================================
  // 3. Maintenance orders table
  // ==========================================================
  function renderMaintenanceTable(orders, onTransition) {
    var wrap = el('div', { class: 'nr-table-wrap' });
    var table = el('table', { class: 'nr-table nr-table--compact' });

    var thead = el('thead');
    var hr = el('tr');
    ['#', 'العميل', 'المشكلة', 'مُسند إلى', 'الحالة', ''].forEach(function (h) {
      hr.appendChild(el('th', { text: h }));
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el('tbody');
    (orders || []).forEach(function (o, i) {
      var variant = STATUS_VARIANTS[o.status] || '';
      var tr = el('tr');
      tr.appendChild(el('td', { text: String(i + 1) }));
      tr.appendChild(el('td', { text: o.clientName || '—', style: 'font-weight: 500;' }));
      tr.appendChild(el('td', { text: o.description || '—' }));
      tr.appendChild(el('td', { text: o.assignedTo || '—' }));
      tr.appendChild(el('td', {}).appendChild(el('span', {
        class: 'nr-badge nr-badge--' + variant + ' nr-badge--dot',
        text: STATUS_LABELS[o.status] || o.status
      })).parentNode);

      var actions = el('td');
      if (o.status === 'pending') {
        var startBtn = el('button', { class: 'nr-btn nr-btn--sm nr-btn--primary', text: 'ابدأ' });
        if (onTransition) startBtn.addEventListener('click', function () { onTransition(o.id, 'in_progress'); });
        actions.appendChild(startBtn);
      } else if (o.status === 'in_progress') {
        var doneBtn = el('button', { class: 'nr-btn nr-btn--sm nr-btn--success', text: 'إنهاء' });
        if (onTransition) doneBtn.addEventListener('click', function () { onTransition(o.id, 'completed'); });
        actions.appendChild(doneBtn);
      }
      tr.appendChild(actions);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  // ==========================================================
  // 4. Delivery orders table
  // ==========================================================
  function renderDeliveryTable(orders, onTransition) {
    var wrap = el('div', { class: 'nr-table-wrap' });
    var table = el('table', { class: 'nr-table nr-table--compact' });

    var thead = el('thead');
    var hr = el('tr');
    ['#', 'المشروع', 'تاريخ التسليم', 'الحالة', ''].forEach(function (h) {
      hr.appendChild(el('th', { text: h }));
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el('tbody');
    (orders || []).forEach(function (o, i) {
      var variant = STATUS_VARIANTS[o.status] || '';
      var tr = el('tr');
      tr.appendChild(el('td', { text: String(i + 1) }));
      tr.appendChild(el('td', { text: o.projectName || '—', style: 'font-weight: 500;' }));
      tr.appendChild(el('td', { text: o.date || '—' }));
      var statusCell = el('td');
      statusCell.appendChild(el('span', {
        class: 'nr-badge nr-badge--' + variant + ' nr-badge--dot',
        text: STATUS_LABELS[o.status] || o.status
      }));
      tr.appendChild(statusCell);

      var actions = el('td');
      if (o.status === 'pending') {
        var signBtn = el('button', { class: 'nr-btn nr-btn--sm nr-btn--primary', text: 'توقيع' });
        if (onTransition) signBtn.addEventListener('click', function () { onTransition(o.id, 'signed'); });
        actions.appendChild(signBtn);
      } else if (o.status === 'signed') {
        var completeBtn = el('button', { class: 'nr-btn nr-btn--sm nr-btn--success', text: '✓ تم التسليم' });
        if (onTransition) completeBtn.addEventListener('click', function () { onTransition(o.id, 'completed'); });
        actions.appendChild(completeBtn);
      }
      tr.appendChild(actions);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  // ==========================================================
  // 5. Teams distribution grid
  // ==========================================================
  function renderTeamsGrid(teams, onAddProject, onRemoveProject) {
    var wrap = el('div', { class: 'nr-grid-2' });
    if (!teams || !teams.length) {
      wrap.appendChild(el('div', { class: 'nr-help', text: 'لا توجد فرق.' }));
      return wrap;
    }

    teams.forEach(function (team, ti) {
      var load = L.computeTeamLoad(team);

      var card = el('div', { class: 'nr-card nr-card--accent' });
      card.appendChild(el('div', { class: 'nr-card__header' }, [
        el('div', {}, [
          el('div', { class: 'nr-card__title', text: '👥 ' + team.name }),
          el('div', { class: 'nr-card__subtitle', text: load.workerCount + ' عامل · ' + load.projectCount + ' مشروع · متوسط: ' + load.avgPerWorker })
        ]),
        el('span', { class: 'nr-badge nr-badge--primary', text: String(load.projectCount) + ' مشاريع' })
      ]));

      var body = el('div', { class: 'nr-card__body' });

      // Workers
      if ((team.workers || []).length) {
        body.appendChild(el('small', { text: 'العمّال:', style: 'display: block; margin-bottom: var(--nr-sp-1);' }));
        var workersRow = el('div', { class: 'nr-row', style: 'flex-wrap: wrap; margin-bottom: var(--nr-sp-3);' });
        team.workers.forEach(function (w) {
          workersRow.appendChild(el('span', { class: 'nr-badge', text: w }));
        });
        body.appendChild(workersRow);
      }

      // Projects
      body.appendChild(el('small', { text: 'المشاريع:', style: 'display: block; margin-bottom: var(--nr-sp-1);' }));
      var projectsStack = el('div', { class: 'nr-stack-sm', style: 'margin-bottom: var(--nr-sp-3);' });
      (team.projects || []).forEach(function (p, pi) {
        var row = el('div', {
          class: 'nr-row-between',
          style: 'padding: var(--nr-sp-2) var(--nr-sp-3); background: var(--nr-bg-3); border-radius: var(--nr-r-sm);'
        });
        row.appendChild(el('span', { text: p, style: 'font-family: var(--nr-font-mono); font-size: var(--nr-fs-sm);' }));
        var rmBtn = el('button', {
          class: 'nr-btn nr-btn--ghost nr-btn--sm',
          text: '✕',
          'aria-label': 'حذف'
        });
        if (onRemoveProject) rmBtn.addEventListener('click', function () { onRemoveProject(ti, pi); });
        row.appendChild(rmBtn);
        projectsStack.appendChild(row);
      });
      body.appendChild(projectsStack);

      if (onAddProject) {
        var addBtn = el('button', { class: 'nr-btn nr-btn--outline nr-btn--sm nr-btn--block', text: '+ إضافة مشروع' });
        addBtn.addEventListener('click', function () { onAddProject(ti); });
        body.appendChild(addBtn);
      }

      card.appendChild(body);
      wrap.appendChild(card);
    });

    return wrap;
  }

  // ==========================================================
  // 6. Teams summary strip
  // ==========================================================
  function renderTeamsSummary(teams) {
    var s = L.computeTeamsSummary(teams);
    var grid = el('div', { class: 'nr-grid-4' });
    [
      { label: 'Teams', value: s.teamCount },
      { label: 'Workers', value: s.totalWorkers },
      { label: 'Projects Assigned', value: s.totalProjects, trendClass: 'nr-stat__trend--up' },
      { label: 'Avg team size', value: s.avgTeamSize }
    ].forEach(function (k) {
      grid.appendChild(el('div', { class: 'nr-stat' }, [
        el('div', { class: 'nr-stat__label', text: k.label }),
        el('div', { class: 'nr-stat__value', text: String(k.value) })
      ]));
    });
    return grid;
  }

  global.NouRion = global.NouRion || {};
  global.NouRion.InstallationsView = {
    renderInstallationsSummary: renderInstallationsSummary,
    renderEntriesList:          renderEntriesList,
    renderMaintenanceTable:     renderMaintenanceTable,
    renderDeliveryTable:        renderDeliveryTable,
    renderTeamsGrid:            renderTeamsGrid,
    renderTeamsSummary:         renderTeamsSummary
  };
})(typeof window !== 'undefined' ? window : globalThis);
