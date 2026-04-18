// ═══════════════════════════════════════════════════════════════
// NourMetal — UI Utilities — nm-ui.js
// Provides: NM.modal, NM.confirm, NM.closeModal, NM.badge,
//           NM.empty, NM.spinner, NM.btn, NM.field, NM.row
// Must load AFTER: 00-i18n.js
// ═══════════════════════════════════════════════════════════════

window.NM = window.NM || {};

// ─── Translation helper shim (safe fallback if t() not ready) ───
function _t(s) { return (typeof t === 'function') ? t(s) : s; }

/* ════════════════════════════════════════════════════════════════
   MODAL FACTORY
   ════════════════════════════════════════════════════════════════
   NM.modal(opts) → returns modal element id (string)

   opts = {
     title      : string | false     — header title; false = no header
     body       : string             — HTML for modal-body
     footer     : string             — HTML for modal-footer (optional)
     size       : 'sm'|'md'|'lg'|'xl'|'full'  — appends .modal-{size}
     maxWidth   : '500px'            — inline max-width override
     id         : 'my-modal'         — custom id (auto-generated if omitted)
     noPad      : true               — remove body padding (for tables etc.)
     noClose    : true               — hide the × close button
     headerActions : string          — extra HTML buttons in header (before ×)
     closeOnBackdrop : false         — disable backdrop click closing
     onClose    : function           — callback when modal is removed
   }
 ════════════════════════════════════════════════════════════════ */
NM.modal = function(opts) {
  opts = opts || {};
  var id = opts.id || ('nm-m-' + Date.now());
  var sizeClass = opts.size ? ' modal-' + opts.size : '';
  var styleStr = opts.maxWidth ? 'max-width:' + opts.maxWidth : '';

  var closeX = opts.noClose ? '' :
    '<button class="btn btn-sm btn-secondary btn-icon" onclick="NM.closeModal(\'' + id + '\')" title="' + _t('إغلاق') + '">✕</button>';

  // Build header
  var headerHtml = '';
  if (opts.title !== false) {
    var extraBtns = opts.headerActions ? opts.headerActions + ' ' : '';
    headerHtml =
      '<div class="modal-header">' +
        '<div class="modal-title">' + (opts.title || '') + '</div>' +
        '<div style="display:flex;gap:6px;align-items:center">' + extraBtns + closeX + '</div>' +
      '</div>';
  }

  // Build footer
  var footerHtml = opts.footer
    ? '<div class="modal-footer">' + opts.footer + '</div>'
    : '';

  // Build body
  var bodyStyle = opts.noPad ? 'style="padding:0"' : '';
  var bodyHtml = '<div class="modal-body" ' + bodyStyle + '>' + (opts.body || '') + '</div>';

  // Assemble
  var el = document.createElement('div');
  el.className = 'modal-bg';
  el.id = id;
  el.innerHTML =
    '<div class="modal' + sizeClass + '" style="' + styleStr + '">' +
      headerHtml +
      bodyHtml +
      footerHtml +
    '</div>';

  // Backdrop click
  if (opts.closeOnBackdrop !== false) {
    el.addEventListener('click', function(e) {
      if (e.target === el) NM.closeModal(id);
    });
  }

  // Store callback
  if (typeof opts.onClose === 'function') {
    el._nmOnClose = opts.onClose;
  }

  document.body.appendChild(el);

  // Auto-focus first interactive field
  setTimeout(function() {
    var f = el.querySelector('input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
    if (f) f.focus();
  }, 60);

  return id;
};

/* ── Close modal by id or child element ──────────────────────── */
NM.closeModal = function(idOrEl) {
  var el;
  if (!idOrEl) return;
  if (typeof idOrEl === 'string') {
    el = document.getElementById(idOrEl);
  } else if (idOrEl.closest) {
    el = idOrEl.closest('.modal-bg');
  } else {
    el = idOrEl;
  }
  if (!el) return;
  if (typeof el._nmOnClose === 'function') el._nmOnClose();
  el.remove();
};

/* ── Close all open modals ───────────────────────────────────── */
NM.closeAllModals = function() {
  document.querySelectorAll('.modal-bg').forEach(function(m) { m.remove(); });
};

/* ════════════════════════════════════════════════════════════════
   CONFIRM DIALOG
   NM.confirm(msg, onOk, opts?)
   opts = { title, okLabel, cancelLabel, danger }
 ════════════════════════════════════════════════════════════════ */
NM.confirm = function(msg, onOk, opts) {
  opts = opts || {};
  var _id = 'nm-confirm-' + Date.now();
  var okLabel     = opts.okLabel     || _t('تأكيد');
  var cancelLabel = opts.cancelLabel || _t('إلغاء');
  var btnClass    = opts.danger ? 'btn-danger' : 'btn-primary';
  var title       = opts.title !== undefined ? opts.title : _t('تأكيد');

  NM.modal({
    id     : _id,
    title  : title,
    size   : 'sm',
    body   : '<p style="text-align:center;padding:12px 0 4px;font-size:14px;color:var(--text);line-height:1.6">' + msg + '</p>',
    footer :
      '<button class="btn btn-secondary" onclick="NM.closeModal(\'' + _id + '\')">' + cancelLabel + '</button>' +
      '<button class="btn ' + btnClass + '" id="' + _id + '-ok">' + okLabel + '</button>'
  });

  // Attach handler after DOM insertion
  setTimeout(function() {
    var okBtn = document.getElementById(_id + '-ok');
    if (okBtn) {
      okBtn.onclick = function() {
        NM.closeModal(_id);
        if (typeof onOk === 'function') onOk();
      };
    }
  }, 10);

  return _id;
};

/* ════════════════════════════════════════════════════════════════
   NOTIFICATION SYSTEM
   notify(msg, type?)         — global function (backward compat)
   NM.notify(msg, type?)      — same, via namespace

   type: 'error' | 'warn' | 'success' | default (accent)
   duration: ms (optional, default 3200)
 ════════════════════════════════════════════════════════════════ */

// Border colors per type
var _notifColors = {
  error  : 'var(--accent3)',
  warn   : 'var(--accent2)',
  success: 'var(--accent4)',
  default: 'var(--accent)'
};

function notify(msg, type, duration) {
  var el = document.getElementById('notif');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.style.borderColor = _notifColors[type] || _notifColors.default;
  clearTimeout(el._t);
  el._t = setTimeout(function() { el.style.display = 'none'; }, duration || 3200);
}

NM.notify = notify;

/* ════════════════════════════════════════════════════════════════
   STATUS BADGE
   NM.badge(text, type)
   type: 'new'|'active'|'done'|'paused'|'error'|'warn'|'info'
 ════════════════════════════════════════════════════════════════ */
NM.badge = function(text, type) {
  return '<span class="badge status-' + (type || 'default') + '">' + (text || '') + '</span>';
};

/* ════════════════════════════════════════════════════════════════
   EMPTY STATE
   NM.empty(icon, msg, sub?, actionHtml?)
 ════════════════════════════════════════════════════════════════ */
NM.empty = function(icon, msg, sub, actionHtml) {
  return (
    '<div class="empty-state">' +
      '<div class="empty-icon">' + (icon || '📭') + '</div>' +
      '<div class="empty-msg">' + (msg || _t('لا توجد بيانات')) + '</div>' +
      (sub ? '<div class="empty-sub">' + sub + '</div>' : '') +
      (actionHtml ? '<div style="margin-top:16px">' + actionHtml + '</div>' : '') +
    '</div>'
  );
};

/* ════════════════════════════════════════════════════════════════
   LOADING SPINNER HTML
   NM.spinner(size?)  — size in px, default 24
 ════════════════════════════════════════════════════════════════ */
NM.spinner = function(size) {
  var s = size || 24;
  return (
    '<div style="width:' + s + 'px;height:' + s + 'px;' +
    'border:2px solid var(--border);border-top-color:var(--accent);' +
    'border-radius:50%;animation:tlspin .75s linear infinite;' +
    'display:inline-block;vertical-align:middle"></div>'
  );
};

/* ════════════════════════════════════════════════════════════════
   BUTTON HTML HELPERS
   NM.btn.primary(text, onclick?, extraAttrs?)
   NM.btn.secondary(...)
   NM.btn.danger(...)
   NM.btn.ghost(...)
   NM.btn.success(...)
   NM.btn.sm(baseClass, text, onclick?, extra?)
 ════════════════════════════════════════════════════════════════ */
NM.btn = {
  _make: function(cls, text, onclick, extra) {
    var oc = onclick ? ' onclick="' + onclick + '"' : '';
    return '<button class="btn ' + cls + '"' + oc + ' ' + (extra || '') + '>' + text + '</button>';
  },
  primary  : function(text, oc, extra) { return NM.btn._make('btn-primary',   text, oc, extra); },
  secondary: function(text, oc, extra) { return NM.btn._make('btn-secondary', text, oc, extra); },
  danger   : function(text, oc, extra) { return NM.btn._make('btn-danger',    text, oc, extra); },
  ghost    : function(text, oc, extra) { return NM.btn._make('btn-ghost',     text, oc, extra); },
  success  : function(text, oc, extra) { return NM.btn._make('btn-success',   text, oc, extra); },
  warn     : function(text, oc, extra) { return NM.btn._make('btn-warning',   text, oc, extra); },
  // Small variant: NM.btn.sm('primary', 'حفظ', 'save()')
  sm       : function(type, text, oc, extra) { return NM.btn._make('btn-' + type + ' btn-sm', text, oc, extra); }
};

/* ════════════════════════════════════════════════════════════════
   FORM FIELD HTML HELPER
   NM.field(label, inputHtml, opts?)
   opts = { mb, hint, required }
 ════════════════════════════════════════════════════════════════ */
NM.field = function(label, inputHtml, opts) {
  opts = opts || {};
  var req = opts.required ? ' <span style="color:var(--accent3)">*</span>' : '';
  return (
    '<div class="nm-field" style="margin-bottom:' + (opts.mb || '14') + 'px">' +
      (label ? '<label class="nm-label">' + label + req + '</label>' : '') +
      inputHtml +
      (opts.hint ? '<div class="nm-hint">' + opts.hint + '</div>' : '') +
    '</div>'
  );
};

/* ════════════════════════════════════════════════════════════════
   FORM ROW GRID HELPERS
   NM.row2(field1, field2)
   NM.row3(field1, field2, field3)
   NM.rowN(...fields)   — auto-fit columns
 ════════════════════════════════════════════════════════════════ */
NM.row2 = function(a, b) {
  return '<div class="nm-row-2">' + a + b + '</div>';
};
NM.row3 = function(a, b, c) {
  return '<div class="nm-row-3">' + a + b + c + '</div>';
};
NM.rowN = function() {
  var cols = Array.prototype.slice.call(arguments);
  return '<div class="nm-row-auto">' + cols.join('') + '</div>';
};

/* ════════════════════════════════════════════════════════════════
   SECTION DIVIDER (inside modal body)
   NM.section(label)
 ════════════════════════════════════════════════════════════════ */
NM.section = function(label) {
  return '<div class="nm-section">' + (label || '') + '</div>';
};

/* ════════════════════════════════════════════════════════════════
   TABLE BUILDER
   NM.table(columns, rows, opts?)
   columns = [{key, label, width?, align?}]
   rows    = array of objects
   opts    = { id, emptyMsg, emptyIcon, rowClass(row) }
 ════════════════════════════════════════════════════════════════ */
NM.table = function(columns, rows, opts) {
  opts = opts || {};

  if (!rows || !rows.length) {
    return NM.empty(
      opts.emptyIcon || '📋',
      opts.emptyMsg  || _t('لا توجد بيانات')
    );
  }

  var thead = '<thead><tr>' +
    columns.map(function(c) {
      var w = c.width ? ' style="width:' + c.width + '"' : '';
      return '<th' + w + '>' + (c.label || '') + '</th>';
    }).join('') +
  '</tr></thead>';

  var tbody = '<tbody>' +
    rows.map(function(row) {
      var rowClass = opts.rowClass ? opts.rowClass(row) : '';
      var tds = columns.map(function(c) {
        var align = c.align ? ' style="text-align:' + c.align + '"' : '';
        var val = c.render ? c.render(row) : (row[c.key] !== undefined ? row[c.key] : '—');
        return '<td' + align + '>' + val + '</td>';
      }).join('');
      return '<tr class="' + rowClass + '">' + tds + '</tr>';
    }).join('') +
  '</tbody>';

  var tableId = opts.id ? ' id="' + opts.id + '"' : '';
  return '<div class="table-wrap"><table' + tableId + '>' + thead + tbody + '</table></div>';
};
