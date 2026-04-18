// ═══════════════════════════════════════════════════════════════
// NourMetal — Store Utilities — nm-store.js
// Provides: NM.store.get, NM.store.list, NM.store.set,
//           NM.store.sync, NM.store.remove, NM.store.genId
// Must load AFTER: 02-storage.js
// ═══════════════════════════════════════════════════════════════

window.NM = window.NM || {};

/* ════════════════════════════════════════════════════════════════
   DATA STORE
   All keys follow the pm_* convention used in the project.
 ════════════════════════════════════════════════════════════════ */
NM.store = {

  /* ── Read any value from localStorage ───────────────────────
     NM.store.get('pm_settings', {})
     Returns parsed JSON or def if missing/invalid.
  ──────────────────────────────────────────────────────────── */
  get: function(key, def) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) {
        return (def !== undefined ? def : null);
      }
      return JSON.parse(raw);
    } catch(e) {
      return (def !== undefined ? def : null);
    }
  },

  /* ── Read an array from localStorage ────────────────────────
     NM.store.list('pm_installations')
     Always returns an array (never null).
  ──────────────────────────────────────────────────────────── */
  list: function(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]') || [];
    } catch(e) {
      return [];
    }
  },

  /* ── Save any value to localStorage only ────────────────────
     NM.store.set('pm_theme', {dark: true})
  ──────────────────────────────────────────────────────────── */
  set: function(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch(e) {}
  },

  /* ── Save and sync to server ─────────────────────────────────
     NM.store.sync('pm_custody', records)
     .then(ok => notify(ok ? '✅ حفظ' : '⚠️ حفظ محلي فقط'))
     Returns Promise<boolean>.
  ──────────────────────────────────────────────────────────── */
  sync: function(key, data) {
    NM.store.set(key, data);
    return fetch('/api/data/' + key, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ value: data })
    })
    .then(function(r) { return r.ok ? r.json() : { ok: false }; })
    .then(function(j) { return !!(j && j.ok); })
    .catch(function()  { return false; });
  },

  /* ── Remove a key from localStorage ─────────────────────────
     NM.store.remove('pm_draft')
  ──────────────────────────────────────────────────────────── */
  remove: function(key) {
    try { localStorage.removeItem(key); } catch(e) {}
  },

  /* ── Generate a short unique ID ──────────────────────────────
     NM.store.genId()  →  'nm_1718023400123'
  ──────────────────────────────────────────────────────────── */
  genId: function(prefix) {
    return (prefix || 'nm') + '_' + Date.now() + Math.random().toString(36).slice(2, 6);
  },

  /* ── Find item in stored array by id ────────────────────────
     NM.store.findById('pm_employees', empId)
  ──────────────────────────────────────────────────────────── */
  findById: function(key, id) {
    var arr = NM.store.list(key);
    return arr.find(function(x) { return x.id === id; }) || null;
  },

  /* ── Update/insert item in stored array ─────────────────────
     NM.store.upsert('pm_employees', {id:'e1', name:'...'})
     Inserts if new, replaces if id exists.
     Does NOT sync to server — call NM.store.sync() after.
  ──────────────────────────────────────────────────────────── */
  upsert: function(key, item) {
    var arr = NM.store.list(key);
    var idx = arr.findIndex(function(x) { return x.id === item.id; });
    if (idx >= 0) {
      arr[idx] = item;
    } else {
      arr.unshift(item);
    }
    NM.store.set(key, arr);
    return arr;
  },

  /* ── Remove item from stored array by id ────────────────────
     NM.store.deleteById('pm_employees', empId)
     Does NOT sync to server — call NM.store.sync() after.
  ──────────────────────────────────────────────────────────── */
  deleteById: function(key, id) {
    var arr = NM.store.list(key).filter(function(x) { return x.id !== id; });
    NM.store.set(key, arr);
    return arr;
  }
};
