/* ============================================================
   NouRion — modules/custody/custody.view.js
   Pure DOM builders for the Custody module.
   ============================================================ */

(function (global) {
  'use strict';

  var L = (global.NouRion && global.NouRion.CustodyLogic) || null;

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
  // 1. Global summary KPIs
  // ==========================================================
  function renderGlobalSummary(records, dists, invoices) {
    var s = L.computeGlobalSummary(records, dists, invoices);
    var grid = el('div', { class: 'nr-grid-4', style: 'grid-template-columns: repeat(5, 1fr);' });
    [
      { label: 'Received',     value: s.totalReceived,    c: 'var(--nr-accent)' },
      { label: 'Distributed',  value: s.totalDistributed, c: 'var(--nr-info)' },
      { label: 'In Vault',     value: s.remaining,        c: 'var(--nr-success)' },
      { label: 'Settled Inv',  value: s.totalSettled,     c: 'var(--nr-success)' },
      { label: 'Pending Inv',  value: s.totalPending,     c: 'var(--nr-warning)' }
    ].forEach(function (k) {
      grid.appendChild(el('div', { class: 'nr-stat' }, [
        el('div', { class: 'nr-stat__label', text: k.label }),
        el('div', {
          class: 'nr-stat__value',
          text: fmtNum(k.value),
          style: 'font-size: var(--nr-fs-xl); color: ' + k.c + ';'
        })
      ]));
    });
    return grid;
  }

  // ==========================================================
  // 2. Records (received custody) table
  // ==========================================================
  function renderRecordsTable(records, dists) {
    var wrap = el('div', { class: 'nr-table-wrap' });
    var table = el('table', { class: 'nr-table nr-table--compact' });

    var thead = el('thead');
    var hr = el('tr');
    ['#', 'التاريخ', 'المصدر', 'المبلغ', 'الموزَّع', 'المتبقّي', 'الحالة'].forEach(function (h) {
      hr.appendChild(el('th', { text: h }));
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el('tbody');
    records.forEach(function (r, i) {
      var totals = L.computeCustodyTotals(r.id, dists, []);
      var remaining = (Number(r.amount) || 0) - totals.distributed;
      var pct = r.amount > 0 ? Math.round(totals.distributed / r.amount * 100) : 0;

      var tr = el('tr');
      tr.appendChild(el('td', { text: String(i + 1) }));
      tr.appendChild(el('td', { text: r.date || '—' }));
      tr.appendChild(el('td', { text: r.source || '—', style: 'font-weight: 500;' }));
      tr.appendChild(el('td', {
        text: fmtNum(r.amount),
        style: 'font-family: var(--nr-font-mono); color: var(--nr-accent);'
      }));
      tr.appendChild(el('td', {
        text: fmtNum(totals.distributed),
        style: 'font-family: var(--nr-font-mono); color: var(--nr-info);'
      }));
      tr.appendChild(el('td', {
        text: fmtNum(remaining),
        style: 'font-family: var(--nr-font-mono); color: ' + (remaining > 0 ? 'var(--nr-success)' : 'var(--nr-text-tertiary)') + '; font-weight: 500;'
      }));
      var statusCell = el('td');
      statusCell.appendChild(el('span', {
        class: 'nr-badge ' + (pct >= 100 ? 'nr-badge--danger' : pct >= 80 ? 'nr-badge--warning' : 'nr-badge--success'),
        text: pct + '%'
      }));
      tr.appendChild(statusCell);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  // ==========================================================
  // 3. Employee accounts grid (cards)
  // ==========================================================
  function renderEmployeeAccountsGrid(dists, invoices, onSelect) {
    var empMap = L.buildEmployeeAccountsMap(dists, invoices);
    var emps = Object.values(empMap);

    var grid = el('div', { class: 'nr-grid-3' });
    if (!emps.length) {
      grid.appendChild(el('div', { class: 'nr-help', text: 'لا يوجد موظفون لديهم عهدة.' }));
      return grid;
    }

    emps.forEach(function (emp) {
      var b = L.computeEmployeeBalance(emp);
      var barColor = b.percentSpent >= 100 ? 'var(--nr-success)' :
                     b.percentSpent >= 50  ? 'var(--nr-warning)' :
                                              'var(--nr-danger)';

      var card = el('div', {
        class: 'nr-card nr-card--hoverable',
        style: 'cursor: pointer;',
        'data-emp-id': emp.id
      });

      var body = el('div', { class: 'nr-card__body' });

      // Avatar + name + remaining
      var topRow = el('div', { class: 'nr-row', style: 'gap: var(--nr-sp-3); margin-bottom: var(--nr-sp-3);' });
      topRow.appendChild(el('div', {
        text: (emp.name || '?').charAt(0),
        style: 'width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, var(--nr-accent), var(--nr-brand-blue-bright)); ' +
               'display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; font-size: 18px;'
      }));
      var info = el('div', { style: 'flex: 1;' });
      info.appendChild(el('div', { text: emp.name || '—', style: 'font-weight: 500; font-size: var(--nr-fs-md);' }));
      info.appendChild(el('small', { text: emp.dists.length + ' عهدة · ' + emp.transfers.length + ' تحويل' }));
      topRow.appendChild(info);
      topRow.appendChild(el('div', { style: 'text-align: end;' }, [
        el('small', { text: 'متبقّي' }),
        el('div', {
          text: fmtNum(b.remaining),
          style: 'font-family: var(--nr-font-mono); font-size: var(--nr-fs-lg); color: ' + (b.remaining > 0 ? 'var(--nr-warning)' : 'var(--nr-success)') + '; font-weight: 600;'
        })
      ]));
      body.appendChild(topRow);

      // Progress bar
      var bar = el('div', { class: 'nr-progress' });
      bar.appendChild(el('div', {
        class: 'nr-progress__fill',
        style: 'width: ' + b.percentSpent + '%; background: ' + barColor + ';'
      }));
      body.appendChild(bar);

      // Stats row
      body.appendChild(el('div', {
        class: 'nr-row-between',
        style: 'margin-top: var(--nr-sp-2); font-size: var(--nr-fs-xs);'
      }, [
        el('span', {
          text: 'الإجمالي: ' + fmtNum(b.totalDist),
          style: 'color: var(--nr-text-tertiary);'
        }),
        el('span', {
          text: 'المنفَق: ' + fmtNum(b.totalInvoices) + ' (' + b.percentSpent + '%)',
          style: 'color: var(--nr-text-tertiary);'
        })
      ]));

      card.appendChild(body);

      if (onSelect) {
        card.addEventListener('click', function () { onSelect(emp.id); });
      }
      grid.appendChild(card);
    });

    return grid;
  }

  // ==========================================================
  // 4. Single employee detail view
  // ==========================================================
  function renderEmployeeDetail(empId, dists, invoices) {
    var emp = L.buildEmployeeAccountsMap(dists, invoices)[empId];
    if (!emp) return el('div', { class: 'nr-help', text: 'الموظف غير موجود.' });

    var b = L.computeEmployeeBalance(emp);

    var card = el('div', { class: 'nr-card nr-card--accent' });
    card.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', {}, [
        el('div', { class: 'nr-card__title', text: '👤 ' + emp.name }),
        el('div', { class: 'nr-card__subtitle', text: emp.dists.length + ' عهدة · ' + emp.transfers.length + ' تحويل' })
      ]),
      el('span', {
        class: 'nr-badge ' + (b.remaining > 0 ? 'nr-badge--warning' : 'nr-badge--success'),
        text: 'متبقّي: ' + fmtNum(b.remaining)
      })
    ]));

    var body = el('div', { class: 'nr-card__body' });

    // Balance row (3 KPIs)
    var balRow = el('div', { class: 'nr-grid-3', style: 'margin-bottom: var(--nr-sp-4);' });
    [
      { l: 'إجمالي العهدة', v: b.totalDist, c: 'var(--nr-accent)' },
      { l: 'إجمالي المصروف', v: b.totalInvoices, c: 'var(--nr-info)' },
      { l: 'المتبقّي', v: b.remaining, c: b.remaining > 0 ? 'var(--nr-warning)' : 'var(--nr-success)' }
    ].forEach(function (kpi) {
      balRow.appendChild(el('div', {
        style: 'padding: var(--nr-sp-3); background: var(--nr-bg-3); border-radius: var(--nr-r-md);'
      }, [
        el('small', { text: kpi.l, style: 'display: block; margin-bottom: var(--nr-sp-1);' }),
        el('div', {
          text: fmtNum(kpi.v),
          style: 'font-family: var(--nr-font-mono); font-size: var(--nr-fs-xl); color: ' + kpi.c + '; font-weight: 500;'
        })
      ]));
    });
    body.appendChild(balRow);

    // Distributions list
    if (emp.dists.length) {
      body.appendChild(el('h6', { text: 'العهد المستلَمة', class: 'nr-section-title' }));
      var distsWrap = el('div', { class: 'nr-stack-sm', style: 'margin-bottom: var(--nr-sp-4);' });
      emp.dists.forEach(function (d) {
        var rem = L.computeDistRemaining(d, invoices);
        distsWrap.appendChild(el('div', {
          class: 'nr-row-between',
          style: 'padding: var(--nr-sp-2) var(--nr-sp-3); background: var(--nr-bg-3); border-radius: var(--nr-r-sm);'
        }, [
          el('div', {}, [
            el('div', { text: d.date || '—', style: 'font-size: var(--nr-fs-sm); font-weight: 500;' }),
            el('small', { text: d.reason || 'بدون سبب', style: 'color: var(--nr-text-tertiary);' })
          ]),
          el('div', { class: 'nr-row', style: 'gap: var(--nr-sp-3);' }, [
            el('span', { class: 'nr-badge nr-badge--primary', text: fmtNum(d.amount) }),
            el('small', {
              text: 'متبقّي: ' + fmtNum(rem),
              style: 'font-family: var(--nr-font-mono); color: ' + (rem > 0 ? 'var(--nr-warning)' : 'var(--nr-success)') + ';'
            })
          ])
        ]));
      });
      body.appendChild(distsWrap);
    }

    // Transfers
    if (emp.transfers.length) {
      body.appendChild(el('h6', { text: 'التحويلات الصادرة', class: 'nr-section-title' }));
      var trWrap = el('div', { class: 'nr-stack-sm' });
      emp.transfers.forEach(function (tr) {
        trWrap.appendChild(el('div', {
          class: 'nr-row-between',
          style: 'padding: var(--nr-sp-2) var(--nr-sp-3); background: var(--nr-bg-3); border-radius: var(--nr-r-sm);'
        }, [
          el('span', { text: '↪ إلى: ' + (tr.employeeName || '—') }),
          el('span', { class: 'nr-badge nr-badge--info', text: fmtNum(tr.amount) })
        ]));
      });
      body.appendChild(trWrap);
    }

    card.appendChild(body);
    return card;
  }

  // ==========================================================
  // 5. Invoices table with settle/reject actions
  // ==========================================================
  function renderInvoicesTable(invoices, onSettle, onReject) {
    var wrap = el('div', { class: 'nr-table-wrap' });
    var table = el('table', { class: 'nr-table nr-table--compact' });

    var thead = el('thead');
    var hr = el('tr');
    ['#', 'الموظف', 'العهدة', 'المبلغ', 'الحالة', ''].forEach(function (h) {
      hr.appendChild(el('th', { text: h }));
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el('tbody');
    var visible = (invoices || []).filter(function (v) { return !v.isTransfer; });
    visible.forEach(function (v, i) {
      var tr = el('tr');
      tr.appendChild(el('td', { text: String(i + 1) }));
      tr.appendChild(el('td', { text: v.employeeName || v.employeeId || '—' }));
      tr.appendChild(el('td', { text: v.distId || '—', style: 'font-family: var(--nr-font-mono); font-size: var(--nr-fs-xs);' }));
      tr.appendChild(el('td', {
        text: fmtNum(v.amount),
        style: 'font-family: var(--nr-font-mono); font-weight: 500;'
      }));

      var statusCell = el('td');
      var status, variant;
      if (v.adminSettled) { status = '✓ مسوّاة'; variant = 'success'; }
      else if (v.rejected) { status = '✕ مرفوضة'; variant = 'danger'; }
      else { status = '⏳ بانتظار'; variant = 'warning'; }
      statusCell.appendChild(el('span', { class: 'nr-badge nr-badge--' + variant, text: status }));
      tr.appendChild(statusCell);

      var actionsCell = el('td');
      if (!v.adminSettled) {
        var settleBtn = el('button', { class: 'nr-btn nr-btn--sm nr-btn--success', text: 'تسوية' });
        settleBtn.addEventListener('click', function () { if (onSettle) onSettle(v.id); });
        actionsCell.appendChild(settleBtn);
        if (!v.rejected) {
          var rejectBtn = el('button', { class: 'nr-btn nr-btn--sm nr-btn--danger', text: 'رفض', style: 'margin-inline-start: 4px;' });
          rejectBtn.addEventListener('click', function () { if (onReject) onReject(v.id); });
          actionsCell.appendChild(rejectBtn);
        }
      }
      tr.appendChild(actionsCell);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  // ==========================================================
  // 6. Notepad calculator
  // ==========================================================
  function renderNotepadCalc(text) {
    var r = L.computeNotepadCalc(text);
    if (!r.results.length) return el('div', { class: 'nr-help', text: 'اكتب أرقاماً أو معادلات بسيطة.' });

    var card = el('div', { class: 'nr-card' });
    card.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', { class: 'nr-card__title', text: '🧮 الحاسبة الذكية' }),
      el('span', {
        class: 'nr-badge nr-badge--primary',
        text: 'الإجمالي: ' + fmtNum(r.total)
      })
    ]));

    var body = el('div', { class: 'nr-card__body' });
    var stack = el('div', { class: 'nr-stack-sm' });
    r.results.forEach(function (item) {
      stack.appendChild(el('div', {
        class: 'nr-row-between',
        style: 'padding: var(--nr-sp-2) var(--nr-sp-3); background: var(--nr-bg-3); border-radius: var(--nr-r-sm);'
      }, [
        el('span', { text: item.line, style: 'font-family: var(--nr-font-mono); font-size: var(--nr-fs-sm);' }),
        el('span', {
          text: '= ' + fmtNum(item.val),
          style: 'font-family: var(--nr-font-mono); color: var(--nr-accent); font-weight: 500;'
        })
      ]));
    });
    body.appendChild(stack);
    card.appendChild(body);
    return card;
  }

  global.NouRion = global.NouRion || {};
  global.NouRion.CustodyView = {
    renderGlobalSummary:        renderGlobalSummary,
    renderRecordsTable:         renderRecordsTable,
    renderEmployeeAccountsGrid: renderEmployeeAccountsGrid,
    renderEmployeeDetail:       renderEmployeeDetail,
    renderInvoicesTable:        renderInvoicesTable,
    renderNotepadCalc:          renderNotepadCalc
  };
})(typeof window !== 'undefined' ? window : globalThis);
