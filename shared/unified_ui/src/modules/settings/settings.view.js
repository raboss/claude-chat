/* ============================================================
   NouRion — modules/settings/settings.view.js
   Pure DOM builders for Settings/Permissions module.
   ============================================================ */

(function (global) {
  'use strict';

  var L = (global.NouRion && global.NouRion.SettingsLogic) || null;

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

  // ==========================================================
  // 1. Users overview cards
  // ==========================================================
  function renderUsersOverview(users) {
    var totalUsers = users.length;
    var admins = users.filter(function (u) { return u.isAdmin; }).length;
    var withPerms = users.filter(function (u) { return !u.isAdmin && (u.perms || []).length > 0; }).length;
    var noPerms = users.filter(function (u) { return !u.isAdmin && (!u.perms || !u.perms.length); }).length;

    var grid = el('div', { class: 'nr-grid-4' });
    [
      { label: 'Total Users', value: totalUsers },
      { label: 'Admins', value: admins, trend: 'وصول كامل', trendClass: 'nr-stat__trend--up' },
      { label: 'With Permissions', value: withPerms },
      { label: 'No Permissions', value: noPerms,
        trend: noPerms > 0 ? 'يحتاج مراجعة' : 'كل المستخدمين مكوّنون',
        trendClass: noPerms > 0 ? 'nr-stat__trend--down' : 'nr-stat__trend--up' }
    ].forEach(function (c) {
      grid.appendChild(el('div', { class: 'nr-stat' }, [
        el('div', { class: 'nr-stat__label', text: c.label }),
        el('div', { class: 'nr-stat__value', text: String(c.value) }),
        c.trend ? el('div', { class: 'nr-stat__trend ' + (c.trendClass || ''), text: c.trend }) : null
      ]));
    });
    return grid;
  }

  // ==========================================================
  // 2. User card
  // ==========================================================
  function renderUserCard(user, idx) {
    var card = el('div', { class: 'nr-card nr-card--accent', 'data-user-idx': idx, style: 'margin-bottom: var(--nr-sp-3);' });

    var counts = L.countUserPerms(user);
    var groups = L.groupUserPerms(user);

    var header = el('div', { class: 'nr-card__header' }, [
      el('div', {}, [
        el('div', { class: 'nr-card__title', text: '👤 ' + (user.name || '—') }),
        el('div', { class: 'nr-card__subtitle' }, [
          user.isAdmin ? '🔑 Admin · وصول كامل' : (counts.count + ' / ' + counts.total + ' صلاحية'),
          user.filterCompany ? ' · 🏢 ' + user.filterCompany : '',
          user.filterRegion ? ' · 📍 ' + user.filterRegion : ''
        ].filter(Boolean).join(''))
      ]),
      user.isAdmin
        ? el('span', { class: 'nr-badge nr-badge--success nr-badge--dot', text: 'Admin' })
        : el('span', {
            class: 'nr-badge ' + (counts.count > 0 ? 'nr-badge--primary' : 'nr-badge--warning'),
            text: counts.count > 0 ? 'مفعّل' : 'بلا صلاحيات'
          })
    ]);
    card.appendChild(header);

    var body = el('div', { class: 'nr-card__body' });

    if (user.isAdmin) {
      body.appendChild(el('div', { class: 'nr-help', text: 'المدير لديه وصول كامل لكل الصفحات والأزرار.' }));
    } else if (groups.every(function (g) { return g.active === 0; })) {
      body.appendChild(el('div', {
        class: 'nr-alert nr-alert--warning',
        html: '<span class="nr-alert__icon">!</span><div class="nr-alert__body"><div class="nr-alert__msg">هذا المستخدم بدون أي صلاحيات.</div></div>'
      }));
    } else {
      var groupsWrap = el('div', { class: 'nr-stack-sm' });
      groups.forEach(function (g) {
        if (g.active === 0) return;
        var row = el('div', {
          class: 'nr-row-between',
          style: 'padding: var(--nr-sp-2) var(--nr-sp-3); background: var(--nr-bg-3); border-radius: var(--nr-r-sm);'
        });
        row.appendChild(el('span', {
          text: g.group,
          style: 'font-size: var(--nr-fs-sm);'
        }));
        if (g.isAll) {
          row.appendChild(el('span', { class: 'nr-badge nr-badge--success', text: '✓ الكل (' + g.total + ')' }));
        } else {
          row.appendChild(el('span', { class: 'nr-badge nr-badge--primary', text: g.active + ' / ' + g.total }));
        }
        groupsWrap.appendChild(row);
      });
      body.appendChild(groupsWrap);
    }

    card.appendChild(body);
    return card;
  }

  // ==========================================================
  // 3. Permission group editor (read-only display)
  // ==========================================================
  function renderPermGroupGrid(user, onTogglePerm) {
    var perms = {};
    if (user && user.perms) user.perms.forEach(function (p) { perms[p] = true; });
    var isAdmin = user && user.isAdmin;

    var wrap = el('div', { class: 'nr-stack' });

    Object.keys(L.PERM_GROUPS).forEach(function (groupName) {
      var keys = L.PERM_GROUPS[groupName];

      var groupCard = el('div', { class: 'nr-card' });
      groupCard.appendChild(el('div', { class: 'nr-card__header' }, [
        el('div', { class: 'nr-card__title', text: groupName, style: 'font-size: var(--nr-fs-sm);' }),
        el('span', { class: 'nr-badge', text: keys.length + ' صلاحية' })
      ]));

      var body = el('div', { class: 'nr-card__body' });
      var grid = el('div', {
        class: 'nr-grid-3',
        style: 'gap: var(--nr-sp-2);'
      });

      keys.forEach(function (k) {
        var label = L.ALL_PERMS[k] || k;
        var isChecked = isAdmin || perms[k];
        var item = el('label', {
          class: 'nr-check',
          style: 'padding: var(--nr-sp-2) var(--nr-sp-3); background: ' +
                 (isChecked ? 'var(--nr-accent-soft)' : 'var(--nr-bg-3)') +
                 '; border-radius: var(--nr-r-sm); transition: background var(--nr-t-fast);'
        });
        var input = el('input', { type: 'checkbox', value: k });
        if (isChecked) input.setAttribute('checked', 'checked');
        if (isAdmin) input.setAttribute('disabled', 'disabled');
        if (onTogglePerm) {
          input.addEventListener('change', function () { onTogglePerm(k, input.checked); });
        }
        item.appendChild(input);
        item.appendChild(el('span', {
          text: label,
          style: 'font-size: var(--nr-fs-xs);'
        }));
        grid.appendChild(item);
      });

      body.appendChild(grid);
      groupCard.appendChild(body);
      wrap.appendChild(groupCard);
    });

    return wrap;
  }

  // ==========================================================
  // 4. Implied perms preview — يُظهر ما يُضاف تلقائياً
  // ==========================================================
  function renderImpliedPermsPreview(user) {
    var card = el('div', { class: 'nr-card' });
    card.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', { class: 'nr-card__title', text: 'Implied Permissions Preview' })
    ]));

    var body = el('div', { class: 'nr-card__body' });

    if (!user || user.isAdmin) {
      body.appendChild(el('div', { class: 'nr-help', text: 'لا تنطبق على المدير.' }));
      card.appendChild(body);
      return card;
    }

    var original = (user.perms || []).slice();
    var expanded = L.expandImpliedPerms(user);
    var added = (expanded.perms || []).filter(function (p) { return original.indexOf(p) === -1; });

    if (added.length === 0) {
      body.appendChild(el('div', {
        class: 'nr-alert nr-alert--info',
        html: '<span class="nr-alert__icon">ⓘ</span><div class="nr-alert__body"><div class="nr-alert__msg">لا توجد صلاحيات تلقائية مضافة.</div></div>'
      }));
    } else {
      body.appendChild(el('div', {
        class: 'nr-alert nr-alert--success',
        html: '<span class="nr-alert__icon">✓</span><div class="nr-alert__body"><div class="nr-alert__title">' + added.length + ' صلاحية ستُضاف تلقائياً</div><div class="nr-alert__msg">عندما يكون لدى المستخدم صلاحيات فرعية، تُفعَّل صلاحية الصفحة الأم تلقائياً.</div></div>'
      }));

      var chips = el('div', { class: 'nr-row', style: 'flex-wrap: wrap; gap: var(--nr-sp-2); margin-top: var(--nr-sp-3);' });
      added.forEach(function (p) {
        chips.appendChild(el('span', {
          class: 'nr-badge nr-badge--success',
          text: L.ALL_PERMS[p] || p
        }));
      });
      body.appendChild(chips);
    }

    card.appendChild(body);
    return card;
  }

  // ==========================================================
  // 5. Action filter preview
  // ==========================================================
  function renderActionFilterPreview(user, allActions) {
    var filtered = L.filterActionsByPerms(allActions, user);

    var card = el('div', { class: 'nr-card' });
    card.appendChild(el('div', { class: 'nr-card__header' }, [
      el('div', {}, [
        el('div', { class: 'nr-card__title', text: 'Visible Actions' }),
        el('div', { class: 'nr-card__subtitle', text: filtered.length + ' من ' + allActions.length + ' فعل ظاهر لهذا المستخدم' })
      ])
    ]));

    var body = el('div', { class: 'nr-card__body' });
    var grid = el('div', { class: 'nr-grid-3' });

    allActions.forEach(function (a) {
      var visible = filtered.indexOf(a) !== -1;
      var btn = el('div', {
        class: 'nr-row',
        style: 'padding: var(--nr-sp-2) var(--nr-sp-3); background: var(--nr-bg-3); border-radius: var(--nr-r-sm); ' +
               'opacity: ' + (visible ? '1' : '0.35') + ';'
      });
      btn.appendChild(el('span', {
        text: visible ? '✓' : '✕',
        style: 'color: var(--' + (visible ? 'nr-success' : 'nr-text-tertiary') + '); font-family: var(--nr-font-mono);'
      }));
      btn.appendChild(el('span', { text: a.label, style: 'font-size: var(--nr-fs-sm);' }));
      grid.appendChild(btn);
    });

    body.appendChild(grid);
    card.appendChild(body);
    return card;
  }

  global.NouRion = global.NouRion || {};
  global.NouRion.SettingsView = {
    renderUsersOverview:      renderUsersOverview,
    renderUserCard:           renderUserCard,
    renderPermGroupGrid:      renderPermGroupGrid,
    renderImpliedPermsPreview:renderImpliedPermsPreview,
    renderActionFilterPreview:renderActionFilterPreview
  };
})(typeof window !== 'undefined' ? window : globalThis);
