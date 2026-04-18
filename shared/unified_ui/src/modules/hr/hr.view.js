/* ============================================================
   NouRion — modules/hr/hr.view.js
   Pure DOM builders for HR module: org chart, employees, salary, attendance.
   ============================================================ */

(function (global) {
  'use strict';

  var L = (global.NouRion && global.NouRion.HrLogic) || null;

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
  // 1. HR Overview KPIs
  // ==========================================================
  function renderOverview(employees, depts) {
    var active = L.filterActiveEmployees(employees);
    var managers = active.filter(L.isManager).length;

    var grid = el('div', { class: 'nr-grid-4' });
    [
      { label: 'Active Employees', value: active.length },
      { label: 'Departments', value: depts.length },
      { label: 'Managers', value: managers, trend: 'مدراء + رؤساء + مشرفين', trendClass: 'nr-stat__trend--up' },
      { label: 'Workforce', value: active.length - managers }
    ].forEach(function (k) {
      grid.appendChild(el('div', { class: 'nr-stat' }, [
        el('div', { class: 'nr-stat__label', text: k.label }),
        el('div', { class: 'nr-stat__value', text: String(k.value) }),
        k.trend ? el('div', { class: 'nr-stat__trend ' + (k.trendClass || ''), text: k.trend }) : null
      ]));
    });
    return grid;
  }

  // ==========================================================
  // 2. Department tree (recursive)
  // ==========================================================
  function _renderDeptNode(node, employees) {
    var stats = L.countDeptStats(employees, node.id);
    var card = el('div', {
      class: 'nr-card',
      style: 'border-inline-start: 3px solid ' + (node.color || 'var(--nr-accent)') + '; margin-bottom: var(--nr-sp-3);'
    });

    var header = el('div', { class: 'nr-card__header' }, [
      el('div', { class: 'nr-row', style: 'gap: var(--nr-sp-3);' }, [
        el('span', { text: node.icon || '📁', style: 'font-size: 20px;' }),
        el('div', {}, [
          el('div', {
            class: 'nr-card__title',
            text: node.name,
            style: 'color: ' + (node.color || 'var(--nr-text-primary)') + ';'
          }),
          el('div', { class: 'nr-card__subtitle', text: stats.total + ' موظف · ' + stats.managers + ' مدير · ' + stats.staff + ' عامل' })
        ])
      ]),
      el('span', { class: 'nr-badge nr-badge--primary', text: String(stats.total) })
    ]);
    card.appendChild(header);

    // Show employees
    if (stats.total > 0) {
      var body = el('div', { class: 'nr-card__body' });
      var deptEmps = L.groupEmployeesByDept(employees, node.id);
      var grid = el('div', { class: 'nr-grid-3', style: 'gap: var(--nr-sp-2);' });
      deptEmps.forEach(function (e) {
        var isMgr = L.isManager(e);
        var box = el('div', {
          style: 'padding: var(--nr-sp-2) var(--nr-sp-3); background: ' +
                 (isMgr ? 'var(--nr-accent-soft)' : 'var(--nr-bg-3)') +
                 '; border-radius: var(--nr-r-sm); border-top: 2px solid ' + (node.color || 'var(--nr-border)') + ';'
        });
        box.appendChild(el('div', { class: 'nr-row', style: 'gap: var(--nr-sp-2); margin-bottom: var(--nr-sp-1);' }, [
          el('span', { text: isMgr ? '🧑‍💼' : '👷' }),
          el('div', {
            text: e.name,
            style: 'font-size: var(--nr-fs-sm); font-weight: 500;'
          })
        ]));
        if (e.role) box.appendChild(el('small', {
          text: e.role,
          style: 'color: ' + (node.color || 'var(--nr-text-tertiary)') + ';'
        }));
        grid.appendChild(box);
      });
      body.appendChild(grid);
      card.appendChild(body);
    }

    var wrap = el('div', {});
    wrap.appendChild(card);

    // Recursive children
    if (node.children && node.children.length) {
      var childWrap = el('div', { style: 'padding-inline-start: var(--nr-sp-6); border-inline-start: 1px dashed var(--nr-border);' });
      node.children.forEach(function (c) {
        childWrap.appendChild(_renderDeptNode(c, employees));
      });
      wrap.appendChild(childWrap);
    }

    return wrap;
  }

  function renderOrgTree(depts, employees) {
    var tree = L.buildDeptTree(depts);
    var wrap = el('div', { class: 'nr-stack' });
    if (!tree.length) {
      wrap.appendChild(el('div', { class: 'nr-help', text: 'لا توجد أقسام.' }));
      return wrap;
    }
    tree.forEach(function (root) {
      wrap.appendChild(_renderDeptNode(root, employees));
    });
    return wrap;
  }

  // ==========================================================
  // 3. Employees list table
  // ==========================================================
  function renderEmployeesList(employees, depts) {
    var wrap = el('div', { class: 'nr-table-wrap' });
    var table = el('table', { class: 'nr-table nr-table--compact' });

    var thead = el('thead');
    var hr = el('tr');
    ['#', 'الاسم', 'الإقامة', 'القسم', 'الوظيفة', 'النوع'].forEach(function (h) {
      hr.appendChild(el('th', { text: h }));
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var deptMap = {};
    (depts || []).forEach(function (d) { deptMap[d.id] = d; });

    var active = L.filterActiveEmployees(employees);
    var tbody = el('tbody');
    active.forEach(function (e, i) {
      var dept = deptMap[e.departmentId];
      var isMgr = L.isManager(e);
      var tr = el('tr');
      tr.appendChild(el('td', { text: String(i + 1) }));
      tr.appendChild(el('td', { text: e.name, style: 'font-weight: 500;' }));
      tr.appendChild(el('td', {
        text: e.iqama || '—',
        style: 'font-family: var(--nr-font-mono); direction: ltr;'
      }));
      tr.appendChild(el('td', {
        text: dept ? dept.name : '—',
        style: dept ? 'color: ' + (dept.color || 'var(--nr-text-primary)') + ';' : ''
      }));
      tr.appendChild(el('td', { text: e.role || '—' }));
      var typeCell = el('td');
      typeCell.appendChild(el('span', {
        class: 'nr-badge ' + (isMgr ? 'nr-badge--primary' : ''),
        text: isMgr ? '🧑‍💼 مدير' : '👷 عامل'
      }));
      tr.appendChild(typeCell);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  // ==========================================================
  // 4. Salary table
  // ==========================================================
  function renderSalaryTable(rows) {
    var wrap = el('div', { class: 'nr-table-wrap' });
    var table = el('table', { class: 'nr-table nr-table--compact' });

    var thead = el('thead');
    var hr = el('tr');
    ['#', 'الاسم', 'الأيام', 'الراتب', 'السكن', 'بدلات', 'الإجمالي', 'ذمم', 'الصافي', 'تسويات', 'المستحق'].forEach(function (h) {
      hr.appendChild(el('th', { text: h }));
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el('tbody');
    rows.forEach(function (r, i) {
      var c = L.computeSalaryRow(r);
      var tr = el('tr');
      tr.appendChild(el('td', { text: String(i + 1) }));
      tr.appendChild(el('td', { text: r.name || '—', style: 'font-weight: 500;' }));
      tr.appendChild(el('td', { text: String(r.days || 30), style: 'font-family: var(--nr-font-mono); text-align: center;' }));
      tr.appendChild(el('td', { text: fmtNum(r.basic), style: 'font-family: var(--nr-font-mono);' }));
      tr.appendChild(el('td', { text: fmtNum(r.housing), style: 'font-family: var(--nr-font-mono);' }));
      tr.appendChild(el('td', { text: fmtNum(r.other), style: 'font-family: var(--nr-font-mono);' }));
      tr.appendChild(el('td', {
        text: fmtNum(c.gross),
        style: 'font-family: var(--nr-font-mono); color: var(--nr-accent); font-weight: 500;'
      }));
      tr.appendChild(el('td', {
        text: r.debts ? fmtNum(r.debts) : '—',
        style: 'font-family: var(--nr-font-mono); color: var(--nr-warning);'
      }));
      tr.appendChild(el('td', {
        text: fmtNum(c.net),
        style: 'font-family: var(--nr-font-mono);'
      }));
      tr.appendChild(el('td', {
        text: r.adjustments ? fmtNum(r.adjustments) : '—',
        style: 'font-family: var(--nr-font-mono);'
      }));
      tr.appendChild(el('td', {
        text: fmtNum(c.due),
        style: 'font-family: var(--nr-font-mono); color: var(--nr-success); font-weight: 600;'
      }));
      tbody.appendChild(tr);
    });

    // Total row
    var t = L.computeSalaryTotals(rows);
    var totalRow = el('tr', { style: 'background: var(--nr-bg-3); font-weight: 600;' });
    totalRow.appendChild(el('td', { colspan: '3', text: 'الإجمالي', style: 'text-align: left;' }));
    totalRow.appendChild(el('td', { text: fmtNum(t.basic), style: 'font-family: var(--nr-font-mono);' }));
    totalRow.appendChild(el('td', { text: fmtNum(t.housing), style: 'font-family: var(--nr-font-mono);' }));
    totalRow.appendChild(el('td', { text: fmtNum(t.other), style: 'font-family: var(--nr-font-mono);' }));
    totalRow.appendChild(el('td', { text: fmtNum(t.gross), style: 'font-family: var(--nr-font-mono); color: var(--nr-accent);' }));
    totalRow.appendChild(el('td', { text: '' }));
    totalRow.appendChild(el('td', { text: fmtNum(t.net), style: 'font-family: var(--nr-font-mono);' }));
    totalRow.appendChild(el('td', { text: '' }));
    totalRow.appendChild(el('td', { text: fmtNum(t.due), style: 'font-family: var(--nr-font-mono); color: var(--nr-success);' }));
    tbody.appendChild(totalRow);

    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  // ==========================================================
  // 5. Attendance table — interactive cells
  // ==========================================================
  function renderAttendanceTable(rows, year, month, onCellClick) {
    var wrap = el('div', { class: 'nr-table-wrap', style: 'overflow-x: auto;' });
    var table = el('table', { class: 'nr-table nr-table--compact', style: 'min-width: 100%;' });

    var daysInMonth = L.getDaysInMonth(year, month);

    var thead = el('thead');
    var hr = el('tr');
    hr.appendChild(el('th', { text: '#' }));
    hr.appendChild(el('th', { text: 'الاسم', style: 'text-align: right; min-width: 120px;' }));
    for (var d = 1; d <= daysInMonth; d++) {
      var dayName = L.DAY_NAMES_AR[new Date(year, month - 1, d).getDay()];
      var isFri = L.isFriday(year, month, d);
      hr.appendChild(el('th', {
        text: String(d),
        title: dayName,
        style: 'min-width: 26px; text-align: center; ' + (isFri ? 'color: var(--nr-danger);' : '')
      }));
    }
    hr.appendChild(el('th', { text: 'مجموع' }));
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el('tbody');
    rows.forEach(function (row, ri) {
      var tr = el('tr');
      tr.appendChild(el('td', { text: String(ri + 1) }));
      tr.appendChild(el('td', { text: row.name, style: 'font-weight: 500; text-align: right;' }));
      for (var dd = 1; dd <= daysInMonth; dd++) {
        var v = (row.days || {})[dd] || '';
        var sym = '', clr = '', bg = '';
        if (v === '1') { sym = '✓'; clr = 'var(--nr-success)'; bg = 'rgba(16,185,129,0.1)'; }
        else if (v === 'L') { sym = '⏰'; clr = 'var(--nr-warning)'; bg = 'rgba(245,158,11,0.1)'; }
        else if (v === 'X') { sym = '✗'; clr = 'var(--nr-danger)'; bg = 'rgba(239,68,68,0.1)'; }
        if (L.isFriday(year, month, dd) && !v) bg = 'rgba(239,68,68,0.05)';

        var cell = el('td', {
          text: sym,
          style: 'cursor: pointer; text-align: center; color: ' + clr + '; background: ' + bg + '; user-select: none;',
          'data-row': String(ri),
          'data-day': String(dd)
        });
        if (onCellClick) {
          cell.addEventListener('click', function (e) {
            var ri2 = parseInt(e.currentTarget.getAttribute('data-row'), 10);
            var d2  = parseInt(e.currentTarget.getAttribute('data-day'), 10);
            onCellClick(ri2, d2);
          });
        }
        tr.appendChild(cell);
      }
      var total = L.computeAttendanceTotal(row.days || {});
      tr.appendChild(el('td', {
        text: String(total),
        style: 'font-family: var(--nr-font-mono); font-weight: 600; color: var(--nr-accent); text-align: center;'
      }));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  // ==========================================================
  // 6. Attendance summary card
  // ==========================================================
  function renderAttendanceSummary(rows, year, month) {
    var s = L.computeAttendanceMonthSummary(rows, year, month);
    var grid = el('div', { class: 'nr-grid-4' });
    [
      { label: 'الموظفون', value: s.totalEmployees },
      { label: 'حاضر', value: s.totalPresent, c: 'var(--nr-success)' },
      { label: 'تأخر', value: s.totalLate, c: 'var(--nr-warning)' },
      { label: 'غياب', value: s.totalAbsent, c: 'var(--nr-danger)' }
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

  global.NouRion = global.NouRion || {};
  global.NouRion.HrView = {
    renderOverview:           renderOverview,
    renderOrgTree:            renderOrgTree,
    renderEmployeesList:      renderEmployeesList,
    renderSalaryTable:        renderSalaryTable,
    renderAttendanceTable:    renderAttendanceTable,
    renderAttendanceSummary:  renderAttendanceSummary
  };
})(typeof window !== 'undefined' ? window : globalThis);
