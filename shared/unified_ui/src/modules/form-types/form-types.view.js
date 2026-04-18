/* ============================================================
   NouRion — modules/form-types/form-types.view.js
   Pure DOM builders. No events, no data access.
   Depends on NouRion.FormTypesLogic + NouRion Design System.
   ============================================================ */

(function (global) {
  'use strict';

  var L = (global.NouRion && global.NouRion.FormTypesLogic) || null;

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'class') n.className = attrs[k];
        else if (k === 'text') n.textContent = attrs[k];
        else if (k === 'html') n.innerHTML = attrs[k];
        else n.setAttribute(k, attrs[k]);
      }
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
    return n.toFixed(decimals != null ? decimals : 2);
  }

  // ==========================================================
  // 1. Type header card — summary of one type
  // ==========================================================
  function renderTypeHeader(type, kgPrice) {
    var totals = L.computeTypeTotal(type, kgPrice);
    var card = el('div', { class: 'nr-card nr-card--accent', style: 'margin-bottom: var(--nr-sp-4);' });

    var header = el('div', { class: 'nr-card__header' }, [
      el('div', {}, [
        el('div', { class: 'nr-card__title', text: type.name }),
        el('div', { class: 'nr-card__subtitle', text: type.id + ' · ' + totals.barsCount + ' قطاعات · ' + totals.accCount + ' إكسسوار · ' + totals.instCount + ' مواد تركيب' })
      ]),
      el('div', { class: 'nr-row' }, [
        el('span', { class: 'nr-badge nr-badge--primary', text: fmtNum(totals.aluminumKg, 2) + ' كغ' }),
        el('span', { class: 'nr-badge nr-badge--success', text: fmtNum(totals.aluminumPrice, 0) + ' ريال' })
      ])
    ]);

    card.appendChild(header);
    return card;
  }

  // ==========================================================
  // 2. Aluminum bars table
  // ==========================================================
  function renderAluminumTable(type, kgPrice) {
    if (!type || !type.aluminum || !type.aluminum.length) return el('div', { class: 'nr-help', text: 'لا توجد قطاعات ألمنيوم.' });

    var wrap = el('div', { class: 'nr-table-wrap' });
    var table = el('table', { class: 'nr-table nr-table--compact' });

    var thead = el('thead');
    var headRow = el('tr');
    ['#', 'الكود', 'الوصف', 'طول البار', 'كغ/م', 'الكمية', 'الوزن', 'السعر'].forEach(function (h) {
      headRow.appendChild(el('th', { text: h }));
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = el('tbody');
    type.aluminum.forEach(function (b, i) {
      var qty = parseFloat(b.qty) || 1;
      var w = L.fmCalcBarWeight(b.barLen, b.kgM) * qty;
      var p = L.fmCalcBarPrice(b.barLen, b.kgM, kgPrice) * qty;

      var tr = el('tr');
      tr.appendChild(el('td', { text: String(i + 1) }));
      tr.appendChild(el('td', {
        text: b.code || '—',
        style: 'font-family: var(--nr-font-mono); color: var(--nr-accent);'
      }));
      tr.appendChild(el('td', { text: b.desc }));
      tr.appendChild(el('td', { text: b.barLen + ' مم' }));
      tr.appendChild(el('td', { text: fmtNum(b.kgM, 3) }));
      tr.appendChild(el('td', { text: String(qty) }));
      tr.appendChild(el('td', { text: fmtNum(w, 2) + ' كغ' }));
      tr.appendChild(el('td', { text: fmtNum(p, 0) + ' ر' }));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  // ==========================================================
  // 3. Accessories list (chips)
  // ==========================================================
  function renderAccessoriesList(type) {
    if (!type || !type.accessories || !type.accessories.length) {
      return el('div', { class: 'nr-help', text: 'لا توجد إكسسوارات.' });
    }
    var grid = el('div', { class: 'nr-stack-sm' });
    type.accessories.forEach(function (a, i) {
      var row = el('div', {
        class: 'nr-row-between',
        style: 'padding: var(--nr-sp-2) var(--nr-sp-3); background: var(--nr-bg-3); border-radius: var(--nr-r-sm);'
      });
      row.appendChild(el('span', { text: (i + 1) + '. ' + a.desc, style: 'font-size: var(--nr-fs-sm);' }));
      row.appendChild(el('span', { class: 'nr-badge', text: a.unit + (a.qty ? ' × ' + a.qty : '') }));
      grid.appendChild(row);
    });
    return grid;
  }

  // ==========================================================
  // 4. Installation materials list
  // ==========================================================
  function renderInstallationList(type) {
    if (!type || !type.installation || !type.installation.length) {
      return el('div', { class: 'nr-help', text: 'لا توجد مواد تركيب.' });
    }
    var grid = el('div', { class: 'nr-stack-sm' });
    type.installation.forEach(function (inst, i) {
      var row = el('div', {
        class: 'nr-row-between',
        style: 'padding: var(--nr-sp-2) var(--nr-sp-3); background: var(--nr-bg-3); border-radius: var(--nr-r-sm);'
      });
      row.appendChild(el('span', { text: (i + 1) + '. ' + inst.desc, style: 'font-size: var(--nr-fs-sm);' }));
      var meta = el('span', { class: 'nr-row', style: 'gap: var(--nr-sp-2);' });
      meta.appendChild(el('span', { class: 'nr-badge', text: inst.unit }));
      if (inst.unitPrice != null) {
        meta.appendChild(el('span', {
          text: fmtNum(inst.unitPrice, 0) + ' ر',
          style: 'font-family: var(--nr-font-mono); color: var(--nr-success);'
        }));
      }
      row.appendChild(meta);
      grid.appendChild(row);
    });
    return grid;
  }

  // ==========================================================
  // 5. Full type panel — header + 3 sections
  // ==========================================================
  function renderTypePanel(type, kgPrice) {
    var wrap = el('div', { style: 'margin-bottom: var(--nr-sp-8);' });
    wrap.appendChild(renderTypeHeader(type, kgPrice));

    var sectionWrap = el('div', { class: 'nr-stack' });

    var alumCard = el('div', { class: 'nr-card' });
    alumCard.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', { class: 'nr-card__title', text: '◎ قطاعات الألمنيوم' })
    ]));
    var alumBody = el('div', { class: 'nr-card__body' });
    alumBody.appendChild(renderAluminumTable(type, kgPrice));
    alumCard.appendChild(alumBody);
    sectionWrap.appendChild(alumCard);

    var accCard = el('div', { class: 'nr-card' });
    accCard.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', { class: 'nr-card__title', text: '◇ الإكسسوارات' })
    ]));
    var accBody = el('div', { class: 'nr-card__body' });
    accBody.appendChild(renderAccessoriesList(type));
    accCard.appendChild(accBody);
    sectionWrap.appendChild(accCard);

    var instCard = el('div', { class: 'nr-card' });
    instCard.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', { class: 'nr-card__title', text: '◈ مواد التركيب' })
    ]));
    var instBody = el('div', { class: 'nr-card__body' });
    instBody.appendChild(renderInstallationList(type));
    instCard.appendChild(instBody);
    sectionWrap.appendChild(instCard);

    wrap.appendChild(sectionWrap);
    return wrap;
  }

  // ==========================================================
  // 6. Addon chip (for resolve demo)
  // ==========================================================
  function renderAddonChip(addon) {
    return el('span', {
      class: 'nr-badge nr-badge--info',
      text: addon.label + ' (keyword: ' + addon.keyword + ')'
    });
  }

  // ==========================================================
  // 7. Resolve result panel
  // ==========================================================
  function renderResolveResult(typeName, result) {
    var card = el('div', { class: 'nr-card' });
    var body = el('div', { class: 'nr-card__body' });

    body.appendChild(el('div', {
      html: '<small>الإدخال:</small> <code style="color: var(--nr-accent);">' +
            (typeName || '<empty>') + '</code>'
    }));

    if (!result) {
      body.appendChild(el('div', {
        text: 'لم يُطابَق أي نوع أو إضافة — نتيجة: null',
        style: 'color: var(--nr-danger); margin-top: var(--nr-sp-2);'
      }));
    } else {
      var baseDiv = el('div', { style: 'margin-top: var(--nr-sp-3);' });
      baseDiv.appendChild(el('small', { text: 'النوع الأساسي:' }));
      if (result.baseType) {
        baseDiv.appendChild(el('div', {
          html: '<strong style="color: var(--nr-text-primary);">' + result.baseType.name +
                '</strong> <code>' + result.baseType.id + '</code>'
        }));
      } else {
        baseDiv.appendChild(el('div', { text: 'null', style: 'color: var(--nr-text-tertiary);' }));
      }
      body.appendChild(baseDiv);

      var addonsDiv = el('div', { style: 'margin-top: var(--nr-sp-3);' });
      addonsDiv.appendChild(el('small', { text: 'الإضافات المطابقة: ' + result.addons.length }));
      if (result.addons.length) {
        var chips = el('div', { class: 'nr-row', style: 'flex-wrap: wrap; margin-top: var(--nr-sp-2);' });
        result.addons.forEach(function (a) { chips.appendChild(renderAddonChip(a)); });
        addonsDiv.appendChild(chips);
      }
      body.appendChild(addonsDiv);
    }

    card.appendChild(body);
    return card;
  }

  global.NouRion = global.NouRion || {};
  global.NouRion.FormTypesView = {
    renderTypeHeader:      renderTypeHeader,
    renderAluminumTable:   renderAluminumTable,
    renderAccessoriesList: renderAccessoriesList,
    renderInstallationList:renderInstallationList,
    renderTypePanel:       renderTypePanel,
    renderAddonChip:       renderAddonChip,
    renderResolveResult:   renderResolveResult,
    fmtNum:                fmtNum
  };
})(typeof window !== 'undefined' ? window : globalThis);
