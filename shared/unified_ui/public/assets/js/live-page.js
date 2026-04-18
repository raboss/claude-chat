/* ============================================================
   NouRion — public/assets/js/live-page.js   (Phase 8)
   ------------------------------------------------------------
   Generic "live" page renderer: given a config, builds a full
   CRUD page on top of Repository + any CrudService subclass.

   Expected globals (loaded by the HTML before this file):
     - window.NouRionRepo          (Phase 5)
     - window.NouRionCrudService   (Phase 8)
   ============================================================ */

(function () {
  'use strict';

  var Repo = window.NouRionRepo;
  var Crud = window.NouRionCrudService;

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // i18n helper — falls back to raw string if NouRionI18n not loaded
  function t(key, fallback) {
    if (window.NouRionI18n && window.NouRionI18n.t) return window.NouRionI18n.t(key, fallback);
    return fallback || key;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ==========================================================
  // LivePage(config) — create and return a controller instance
  //
  // config = {
  //   key:         'pm_customers',        // backend storage key
  //   ServiceClass: Crud.CustomerService,  // service constructor
  //   entityLabel: 'عميل',
  //   columns:     [ { field, label, width?, align?, render? } ],
  //   formFields:  [ { field, label, type, required?, placeholder? } ],
  //   searchable:  true,
  //   filters:     [ { field, label, values?: async fn or array } ],
  //   statsFn:     (svc) => [ { label, value } ],
  //   seed:        [ ... ]   // optional initial data if empty
  // }
  // ==========================================================
  function LivePage(config) {
    if (!config || !config.key || !config.ServiceClass) {
      throw new Error('LivePage: config.key and config.ServiceClass required');
    }
    this.cfg = config;
    this.svc = null;
    this.filters = {};
    this.search = '';
  }

  LivePage.prototype.bootstrap = async function () {
    var transport = new Repo.HttpTransport({ credentials: 'same-origin' });
    var repo = new Repo.Repository({
      key:       this.cfg.key,
      transport: transport,
      store:     (typeof localStorage !== 'undefined' ? localStorage : null)
    });
    this.svc = new this.cfg.ServiceClass(repo);
    await this.svc.load();

    if (this.svc.list().length === 0 && Array.isArray(this.cfg.seed)) {
      for (var i = 0; i < this.cfg.seed.length; i++) {
        try { await this.svc.create(this.cfg.seed[i]); }
        catch (e) { /* ignore individual seed failures */ }
      }
    }

    this._wire();
    this._render();
    this.svc.on('changed', this._render.bind(this));
  };

  LivePage.prototype._currentList = function () {
    var list = this.svc.list();
    var cfg = this.cfg;
    var self = this;

    if (cfg.filters && cfg.filters.length) {
      cfg.filters.forEach(function (f) {
        var v = self.filters[f.field];
        if (v) list = list.filter(function (x) { return x[f.field] === v; });
      });
    }
    if (cfg.searchable && this.search) {
      var q = this.search.toLowerCase();
      var fields = cfg.columns.map(function (c) { return c.field; });
      list = list.filter(function (x) {
        for (var i = 0; i < fields.length; i++) {
          var v = x[fields[i]];
          if (v != null && String(v).toLowerCase().indexOf(q) !== -1) return true;
        }
        return false;
      });
    }
    return list;
  };

  LivePage.prototype._render = function () {
    this._renderStats();
    this._renderFilters();
    this._renderTable();
  };

  LivePage.prototype._renderStats = function () {
    var host = $('#livepageStats');
    if (!host || !this.cfg.statsFn) return;
    var items = this.cfg.statsFn(this.svc) || [];
    host.innerHTML = items.map(function (s) {
      var trend = s.trend ? '<div class="nr-stat__trend">' + escapeHtml(s.trend) + '</div>' : '';
      return '<div class="nr-stat">' +
        '<div class="nr-stat__label">' + escapeHtml(s.label) + '</div>' +
        '<div class="nr-stat__value">' + escapeHtml(String(s.value)) + '</div>' +
        trend +
      '</div>';
    }).join('');
  };

  LivePage.prototype._renderFilters = function () {
    var host = $('#livepageFilters');
    if (!host) return;
    var self = this;
    var all  = this.svc.list();

    var parts = [];
    if (this.cfg.searchable !== false) {
      parts.push(
        '<div class="nr-field">' +
          '<label class="nr-label">' + t('ui.search', 'بحث') + '</label>' +
          '<input class="nr-input" id="lpSearch" type="text" placeholder="' + t('ui.search_hint', 'اكتب للبحث…') + '" value="' + escapeHtml(this.search) + '">' +
        '</div>'
      );
    }
    (this.cfg.filters || []).forEach(function (f) {
      var values;
      if (typeof f.values === 'function') values = f.values(self.svc) || [];
      else if (Array.isArray(f.values))   values = f.values;
      else {
        var seen = Object.create(null);
        values = [];
        all.forEach(function (x) {
          var v = x[f.field];
          if (v != null && v !== '' && !seen[v]) { seen[v] = 1; values.push(v); }
        });
      }
      parts.push(
        '<div class="nr-field">' +
          '<label class="nr-label">' + escapeHtml(f.label) + '</label>' +
          '<select class="nr-select" data-filter="' + escapeHtml(f.field) + '">' +
            '<option value="">' + t('ui.all', 'الكل') + '</option>' +
            values.map(function (v) {
              var sel = (self.filters[f.field] === v) ? ' selected' : '';
              return '<option value="' + escapeHtml(v) + '"' + sel + '>' + escapeHtml(v) + '</option>';
            }).join('') +
          '</select>' +
        '</div>'
      );
    });

    host.innerHTML =
      '<div class="nr-card"><div class="nr-card__body">' +
        '<div class="nr-grid-4" style="align-items:end;">' + parts.join('') + '</div>' +
      '</div></div>';
  };

  LivePage.prototype._renderTable = function () {
    var tbody = $('#livepageTbody');
    var thead = $('#livepageThead');
    if (!tbody || !thead) return;
    var cols = this.cfg.columns || [];
    var list = this._currentList();

    thead.innerHTML = '<tr>' +
      cols.map(function (c) {
        var style = '';
        if (c.width) style += 'width:' + c.width + ';';
        if (c.align) style += 'text-align:' + c.align + ';';
        return '<th' + (style ? ' style="' + style + '"' : '') + '>' + escapeHtml(c.label) + '</th>';
      }).join('') +
      '<th>إجراءات</th>' +
    '</tr>';

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="' + (cols.length + 1) + '" style="text-align:center; padding:var(--nr-sp-8); color:var(--nr-text-muted);">' + t('ui.no_records', '— لا توجد سجلات —') + '</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (item) {
      return '<tr data-id="' + escapeHtml(item.id) + '">' +
        cols.map(function (c) {
          var raw = item[c.field];
          var text = (typeof c.render === 'function') ? c.render(item) : (raw == null ? '—' : String(raw));
          var style = '';
          if (c.align) style += 'text-align:' + c.align + ';';
          if (c.mono)  style += 'font-family:var(--nr-font-mono);';
          return '<td' + (style ? ' style="' + style + '"' : '') + '>' + (c.raw ? text : escapeHtml(text)) + '</td>';
        }).join('') +
        '<td>' +
          '<div class="nr-row" style="gap:var(--nr-sp-1);">' +
            '<button class="nr-btn nr-btn--ghost nr-btn--sm" data-act="edit">' + t('ui.edit', 'تعديل') + '</button>' +
            '<button class="nr-btn nr-btn--ghost nr-btn--sm" data-act="delete">' + t('ui.delete', 'حذف') + '</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');
  };

  LivePage.prototype._openModal = function (existing) {
    var modal = $('#livepageModal');
    modal.classList.add('is-open');
    $('#livepageModalTitle').textContent = existing
      ? ('تعديل ' + (this.cfg.entityLabel || 'سجل'))
      : (this.cfg.entityLabel ? ((this.cfg.entityLabel || 'سجل') + ' جديد') : 'جديد');
    $('#livepageErr').style.display = 'none';

    var fields = this.cfg.formFields || [];
    var host = $('#livepageFormBody');
    host.innerHTML = fields.map(function (f) {
      var full = (f.full ? ' style="grid-column:1/-1;"' : '');
      var required = f.required ? ' <span class="nr-label__required">*</span>' : '';
      var val = existing ? (existing[f.field] == null ? '' : existing[f.field]) : '';
      var type = f.type || 'text';
      var ctrl;
      if (type === 'textarea') {
        ctrl = '<textarea class="nr-textarea" name="' + escapeHtml(f.field) + '" placeholder="' + escapeHtml(f.placeholder || '') + '">' + escapeHtml(String(val)) + '</textarea>';
      } else if (type === 'select') {
        var opts = (f.options || []).map(function (o) {
          var sel = (String(val) === String(o.value || o)) ? ' selected' : '';
          var label = o.label || o;
          var value = o.value != null ? o.value : o;
          return '<option value="' + escapeHtml(value) + '"' + sel + '>' + escapeHtml(label) + '</option>';
        }).join('');
        ctrl = '<select class="nr-select" name="' + escapeHtml(f.field) + '"><option value="">—</option>' + opts + '</select>';
      } else {
        ctrl = '<input class="nr-input" name="' + escapeHtml(f.field) + '" type="' + escapeHtml(type) + '"' +
          (type === 'number' ? ' step="any"' : '') +
          ' value="' + escapeHtml(String(val)) + '"' +
          ' placeholder="' + escapeHtml(f.placeholder || '') + '">';
      }
      return '<div class="nr-field"' + full + '>' +
        '<label class="nr-label">' + escapeHtml(f.label) + required + '</label>' +
        ctrl +
      '</div>';
    }).join('');

    $('#livepageForm').dataset.editId = existing ? existing.id : '';
    setTimeout(function () {
      var first = host.querySelector('input, textarea, select');
      if (first) first.focus();
    }, 50);
  };

  LivePage.prototype._closeModal = function () { $('#livepageModal').classList.remove('is-open'); };

  LivePage.prototype._collectForm = function () {
    var out = {};
    var fields = this.cfg.formFields || [];
    var host = $('#livepageFormBody');
    fields.forEach(function (f) {
      var el = host.querySelector('[name="' + f.field + '"]');
      if (!el) return;
      var v = el.value;
      if (f.type === 'number') {
        out[f.field] = v === '' ? null : Number(v);
      } else {
        out[f.field] = v == null ? '' : String(v).trim();
      }
    });
    return out;
  };

  LivePage.prototype._wire = function () {
    var self = this;

    $('#livepageNewBtn').addEventListener('click', function () { self._openModal(null); });

    $('#livepageFormHost').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) self._closeModal();
    });
    $$('#livepageModal [data-close-modal]').forEach(function (el) {
      el.addEventListener('click', function () { self._closeModal(); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') self._closeModal();
    });

    $('#livepageForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var err = $('#livepageErr');
      err.style.display = 'none';
      var data = self._collectForm();
      var id = e.currentTarget.dataset.editId;
      try {
        if (id) await self.svc.update(id, data);
        else    await self.svc.create(data);
        self._closeModal();
      } catch (ex) {
        err.textContent = ex.message || 'خطأ';
        err.style.display = 'block';
      }
    });

    // Filters + search delegation
    $('#livepageFilters').addEventListener('input', function (e) {
      if (e.target && e.target.id === 'lpSearch') {
        self.search = e.target.value;
        self._renderTable();
      }
    });
    $('#livepageFilters').addEventListener('change', function (e) {
      var t = e.target;
      if (t && t.dataset && t.dataset.filter) {
        self.filters[t.dataset.filter] = t.value;
        self._renderTable();
      }
    });

    // Table actions
    $('#livepageTbody').addEventListener('click', async function (e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      var tr = btn.closest('tr[data-id]');
      if (!tr) return;
      var id = tr.getAttribute('data-id');
      var act = btn.getAttribute('data-act');
      try {
        if (act === 'edit') {
          self._openModal(self.svc.get(id));
        } else if (act === 'delete') {
          if (confirm(t('ui.confirm_delete', 'هل أنت متأكد من حذف هذا السجل؟'))) {
            await self.svc.remove(id);
          }
        }
      } catch (ex) {
        alert(ex.message || 'خطأ');
      }
    });
  };

  // Expose
  window.NouRionLivePage = { LivePage: LivePage, create: function (cfg) { return new LivePage(cfg); } };
})();
