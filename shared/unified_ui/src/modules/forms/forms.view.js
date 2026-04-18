/* ============================================================
   NouRion — modules/forms/forms.view.js
   Pure DOM builders for the Manufacturing Form module.
   ============================================================ */

(function (global) {
  'use strict';

  var L = (global.NouRion && global.NouRion.FormsLogic) || null;

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
      maximumFractionDigits: decimals != null ? decimals : 0
    }).format(n);
  }

  // ==========================================================
  // 1. Extract values panel
  // ==========================================================
  function renderExtractValues(project, plRows) {
    var ev = L.computeExtractValues(project, plRows);
    var card = el('div', { class: 'nr-card nr-card--accent' });
    card.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', {}, [
        el('div', { class: 'nr-card__title', text: '💰 قيمة المستخلص' }),
        el('div', { class: 'nr-card__subtitle', text: 'المصدر: ' + (
          ev.source === 'stored'    ? 'مخزَّن في بيانات المشروع' :
          ev.source === 'priceList' ? 'محسوب من عرض الأسعار' :
                                       'fallback (90% من قيمة العقد)'
        )})
      ]),
      el('span', { class: 'nr-badge nr-badge--primary', text: 'VAT 15%' })
    ]));
    var body = el('div', { class: 'nr-card__body nr-grid-3' });
    [
      { l: 'قيمة العقد', v: parseFloat(project.contractValue) || 0, c: 'var(--nr-text-secondary)' },
      { l: 'قبل الضريبة', v: ev.before, c: 'var(--nr-accent)' },
      { l: 'بعد الضريبة', v: ev.after, c: 'var(--nr-success)' }
    ].forEach(function (kpi) {
      body.appendChild(el('div', {
        style: 'padding: var(--nr-sp-3); background: var(--nr-bg-3); border-radius: var(--nr-r-md);'
      }, [
        el('small', { text: kpi.l, style: 'display: block; margin-bottom: var(--nr-sp-1);' }),
        el('div', {
          text: fmtNum(kpi.v, 2),
          style: 'font-family: var(--nr-font-mono); font-size: var(--nr-fs-xl); color: ' + kpi.c + '; font-weight: 500;'
        })
      ]));
    });
    card.appendChild(body);
    return card;
  }

  // ==========================================================
  // 2. Install allocations — the critical wage calculation
  // ==========================================================
  function renderInstallAllocations(project, extBase, rates, onRateChange) {
    var a = L.computeInstallAllocations(project, extBase, rates);

    var card = el('div', { class: 'nr-card nr-card--accent' });
    card.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', {}, [
        el('div', { class: 'nr-card__title', text: '⚡ الأجور والمصارف' }),
        el('div', { class: 'nr-card__subtitle', text: 'تلقائي من قيمة المستخلص — قابل للتعديل' })
      ]),
      el('span', { class: 'nr-badge nr-badge--success', text: 'الإجمالي: ' + fmtNum(a.totalAuto, 0) + ' ر' })
    ]));

    var body = el('div', { class: 'nr-card__body' });

    // Input strip (rates)
    var inputs = el('div', {
      class: 'nr-grid-4',
      style: 'grid-template-columns: repeat(5, 1fr); margin-bottom: var(--nr-sp-4);'
    });
    [
      { label: 'الراتب الشهري', key: 'monthlySal', value: a.monthlySal, suffix: 'ر' },
      { label: 'أيام العمل', key: 'workDays', value: a.workDays, suffix: 'يوم' },
      { label: 'عمال الإنتاج', key: 'manualProdWorkers', value: a.prodWorkers, suffix: 'عامل' },
      { label: 'أجور %', key: 'wagesPct', value: a.wagesPct, suffix: '%' },
      { label: 'ثابتة %', key: 'fixedPct', value: a.fixedPct, suffix: '%' }
    ].forEach(function (f) {
      var group = el('div');
      group.appendChild(el('label', { class: 'nr-label', text: f.label }));
      var input = el('input', {
        class: 'nr-input',
        type: 'number',
        value: String(f.value),
        step: '0.5',
        style: 'height: 32px;'
      });
      if (onRateChange) {
        input.addEventListener('input', function () {
          onRateChange(f.key, parseFloat(input.value) || 0);
        });
      }
      group.appendChild(input);
      group.appendChild(el('small', {
        class: 'nr-help',
        text: f.suffix
      }));
      inputs.appendChild(group);
    });
    body.appendChild(inputs);

    // Daily rate display
    body.appendChild(el('div', {
      style: 'padding: var(--nr-sp-3); background: var(--nr-bg-3); border-radius: var(--nr-r-md); margin-bottom: var(--nr-sp-4); text-align: center;'
    }, [
      el('small', { text: 'الراتب اليومي = ' + fmtNum(a.monthlySal, 0) + ' / ' + a.workDays + ' = ' }),
      el('strong', {
        text: fmtNum(a.dailyRate, 2) + ' ر/يوم',
        style: 'color: var(--nr-accent); font-family: var(--nr-font-mono); font-weight: 500;'
      })
    ]));

    // Allocation table
    var wrap = el('div', { class: 'nr-table-wrap' });
    var table = el('table', { class: 'nr-table nr-table--compact' });
    var thead = el('thead');
    var hr = el('tr');
    ['البيان', 'القيمة', 'العمال', 'الأيام'].forEach(function (h) {
      hr.appendChild(el('th', { text: h }));
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el('tbody');

    // Row 1: Production workers
    var row1 = el('tr');
    row1.appendChild(el('td', {}, [
      el('div', { text: '👷 عمال الإنتاج / التصنيع' }),
      el('small', { text: 'تلقائي حسب قيمة العقد: ' + a.autoProdWorkers + ' عامل' })
    ]));
    row1.appendChild(el('td', {
      text: fmtNum(a.wages1Amt, 0) + ' ر',
      style: 'font-family: var(--nr-font-mono); color: var(--nr-accent);'
    }));
    row1.appendChild(el('td', { text: String(a.prodWorkers) }));
    row1.appendChild(el('td', {
      text: String(a.prodDays) + ' يوم',
      style: 'font-family: var(--nr-font-mono); color: var(--nr-info); font-weight: 500;'
    }));
    tbody.appendChild(row1);

    // Row 2: Install team
    var row2 = el('tr');
    row2.appendChild(el('td', {}, [
      el('div', { text: '🔧 فرقة التركيب' }),
      el('small', { text: a.installWorkers + ' عمال ثابت — حد أقصى ' + a.maxInstallDays + ' أيام' })
    ]));
    row2.appendChild(el('td', {
      text: fmtNum(a.wages2Amt, 0) + ' ر',
      style: 'font-family: var(--nr-font-mono); color: var(--nr-accent);'
    }));
    row2.appendChild(el('td', { text: String(a.installWorkers) + ' ثابت' }));
    var daysCell = el('td');
    daysCell.appendChild(el('span', {
      text: String(a.installDays) + ' يوم',
      style: 'font-family: var(--nr-font-mono); color: var(--nr-info); font-weight: 500;'
    }));
    if (a.installAtMax) {
      daysCell.appendChild(el('div', {
        text: '⚠️ الحد الأقصى',
        style: 'font-size: var(--nr-fs-xs); color: var(--nr-warning); margin-top: 2px;'
      }));
    }
    row2.appendChild(daysCell);
    tbody.appendChild(row2);

    // Row 3: Fixed expenses
    var row3 = el('tr');
    row3.appendChild(el('td', { text: '🏭 مصارف ثابتة للمصنع' }));
    row3.appendChild(el('td', {
      text: fmtNum(a.fixedAmt, 0) + ' ر',
      style: 'font-family: var(--nr-font-mono); color: var(--nr-accent);'
    }));
    row3.appendChild(el('td', { colspan: '2' }));
    tbody.appendChild(row3);

    // Total row
    var totalRow = el('tr', { style: 'background: var(--nr-bg-3); font-weight: 600;' });
    totalRow.appendChild(el('td', { text: 'الإجمالي' }));
    totalRow.appendChild(el('td', {
      text: fmtNum(a.totalAuto, 0) + ' ر',
      style: 'font-family: var(--nr-font-mono); color: var(--nr-success); font-weight: 600;'
    }));
    totalRow.appendChild(el('td', { colspan: '2' }));
    tbody.appendChild(totalRow);

    table.appendChild(tbody);
    wrap.appendChild(table);
    body.appendChild(wrap);

    card.appendChild(body);
    return card;
  }

  // ==========================================================
  // 3. Project study — final financial analysis
  // ==========================================================
  function renderProjectStudy(formData, project, plRows) {
    var s = L.computeProjectStudy(formData, project, plRows);

    var wrap = el('div', { class: 'nr-stack' });

    // Top KPIs
    var kpis = el('div', { class: 'nr-grid-4' });
    [
      { label: 'المستخلص قبل VAT', value: s.extractBefore, c: 'var(--nr-accent)' },
      { label: 'إجمالي التكاليف', value: s.grandTotal, c: 'var(--nr-warning)' },
      { label: 'الربح / الخسارة', value: s.margin, c: s.margin > 0 ? 'var(--nr-success)' : 'var(--nr-danger)' },
      { label: 'هامش الربح %', value: s.marginPct.toFixed(1), c: s.marginPct > 0 ? 'var(--nr-success)' : 'var(--nr-danger)', isPct: true }
    ].forEach(function (k) {
      kpis.appendChild(el('div', { class: 'nr-stat' }, [
        el('div', { class: 'nr-stat__label', text: k.label }),
        el('div', {
          class: 'nr-stat__value',
          text: k.isPct ? k.value + '%' : fmtNum(k.value, 0),
          style: 'color: ' + k.c + ';'
        })
      ]));
    });
    wrap.appendChild(kpis);

    // Cost breakdown
    var breakdown = el('div', { class: 'nr-card' });
    breakdown.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', { class: 'nr-card__title', text: '📊 ملخص التكاليف' })
    ]));
    var body = el('div', { class: 'nr-card__body' });

    var tbl = el('table', { class: 'nr-table' });
    var tbody = el('tbody');

    function row(label, value, color) {
      var tr = el('tr');
      tr.appendChild(el('td', { text: label }));
      tr.appendChild(el('td', {
        text: fmtNum(value, 0) + ' ر',
        style: 'font-family: var(--nr-font-mono); text-align: left; ' + (color ? 'color: ' + color + '; font-weight: 500;' : '')
      }));
      tbody.appendChild(tr);
    }

    row('إجمالي الألمنيوم', s.totalAluminum);
    row('إجمالي الأكسسوارات', s.totalAccessories);
    row('مواد التركيب', s.totalMaterials);
    row('إجمالي المواد', s.totalMat, 'var(--nr-accent)');
    row('الأجور', s.totalWages);
    row('المصاريف الثابتة', s.totalFixed);
    row('المصاريف الإدارية (' + s.adminPct + '%)', s.adminAmt);

    var grandRow = el('tr', { style: 'background: var(--nr-bg-3); font-weight: 600;' });
    grandRow.appendChild(el('td', { text: 'الإجمالي الكلي', style: 'font-weight: 600;' }));
    grandRow.appendChild(el('td', {
      text: fmtNum(s.grandTotal, 0) + ' ر',
      style: 'font-family: var(--nr-font-mono); text-align: left; color: var(--nr-warning); font-weight: 600;'
    }));
    tbody.appendChild(grandRow);

    tbl.appendChild(tbody);
    body.appendChild(tbl);
    breakdown.appendChild(body);
    wrap.appendChild(breakdown);

    // Percentages card
    var pctCard = el('div', { class: 'nr-card' });
    pctCard.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', { class: 'nr-card__title', text: '📈 النسب من المستخلص' })
    ]));
    var pctBody = el('div', { class: 'nr-card__body nr-stack-sm' });
    [
      { label: 'المواد', value: s.pctMat },
      { label: 'الأجور', value: s.pctWages },
      { label: 'الثابتة', value: s.pctFixed },
      { label: 'إجمالي التكاليف', value: s.pctTotal, strong: true },
      { label: 'مع المبيعات + الشركة', value: s.pctFull, strong: true, max: 100 }
    ].forEach(function (p) {
      var rowEl = el('div', {});
      rowEl.appendChild(el('div', { class: 'nr-row-between', style: 'margin-bottom: var(--nr-sp-1);' }, [
        el('small', { text: p.label, style: p.strong ? 'font-weight: 500; color: var(--nr-text-primary);' : '' }),
        el('small', {
          text: p.value.toFixed(1) + '%',
          style: 'font-family: var(--nr-font-mono); ' + (p.strong ? 'font-weight: 500; color: var(--nr-accent);' : '')
        })
      ]));
      var bar = el('div', { class: 'nr-progress' });
      var width = Math.min(100, p.value);
      var color = p.value > 90 ? 'var(--nr-danger)' : p.value > 70 ? 'var(--nr-warning)' : 'var(--nr-success)';
      bar.appendChild(el('div', {
        class: 'nr-progress__fill',
        style: 'width: ' + width + '%; background: ' + color + ';'
      }));
      rowEl.appendChild(bar);
      pctBody.appendChild(rowEl);
    });
    pctCard.appendChild(pctBody);
    wrap.appendChild(pctCard);

    return wrap;
  }

  // ==========================================================
  // 4. Materials table (aluminum/accessories/installation)
  // ==========================================================
  function renderMaterialsTable(title, rows, emptyLabel) {
    var card = el('div', { class: 'nr-card' });
    card.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', { class: 'nr-card__title', text: title }),
      el('span', { class: 'nr-badge nr-badge--primary', text: (rows || []).length + ' بند' })
    ]));

    var body = el('div', { class: 'nr-card__body' });

    if (!rows || !rows.length) {
      body.appendChild(el('div', { class: 'nr-help', text: emptyLabel || 'لا توجد بيانات.' }));
      card.appendChild(body);
      return card;
    }

    var wrap = el('div', { class: 'nr-table-wrap' });
    var table = el('table', { class: 'nr-table nr-table--compact' });

    var thead = el('thead');
    var hr = el('tr');
    ['#', 'الكود', 'الوصف', 'الوحدة', 'الكمية', 'سعر الوحدة', 'الإجمالي'].forEach(function (h) {
      hr.appendChild(el('th', { text: h }));
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el('tbody');
    var total = 0;
    rows.forEach(function (r, i) {
      var q = parseFloat(r.quantity) || 0;
      var p = parseFloat(r.unitPrice) || 0;
      var sum = q * p;
      total += sum;

      var tr = el('tr');
      tr.appendChild(el('td', { text: String(i + 1) }));
      tr.appendChild(el('td', {
        text: r.code || '—',
        style: 'font-family: var(--nr-font-mono); color: var(--nr-accent);'
      }));
      tr.appendChild(el('td', { text: r.desc || r.description || '—' }));
      tr.appendChild(el('td', { text: r.unit || '—' }));
      tr.appendChild(el('td', {
        text: q.toString(),
        style: 'font-family: var(--nr-font-mono); text-align: center;'
      }));
      tr.appendChild(el('td', {
        text: fmtNum(p, 2),
        style: 'font-family: var(--nr-font-mono);'
      }));
      tr.appendChild(el('td', {
        text: fmtNum(sum, 0),
        style: 'font-family: var(--nr-font-mono); color: var(--nr-success); font-weight: 500;'
      }));
      tbody.appendChild(tr);
    });

    // Total row
    var totalRow = el('tr', { style: 'background: var(--nr-bg-3); font-weight: 600;' });
    totalRow.appendChild(el('td', { colspan: '6', text: 'الإجمالي' }));
    totalRow.appendChild(el('td', {
      text: fmtNum(total, 0) + ' ر',
      style: 'font-family: var(--nr-font-mono); color: var(--nr-success); font-weight: 600;'
    }));
    tbody.appendChild(totalRow);

    table.appendChild(tbody);
    wrap.appendChild(table);
    body.appendChild(wrap);
    card.appendChild(body);
    return card;
  }

  global.NouRion = global.NouRion || {};
  global.NouRion.FormsView = {
    renderExtractValues:      renderExtractValues,
    renderInstallAllocations: renderInstallAllocations,
    renderProjectStudy:       renderProjectStudy,
    renderMaterialsTable:     renderMaterialsTable
  };
})(typeof window !== 'undefined' ? window : globalThis);
