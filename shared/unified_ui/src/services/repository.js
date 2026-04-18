/* ============================================================
   NouRion — src/services/repository.js   (Phase 5 — Data Layer)
   ------------------------------------------------------------
   A unified Repository pattern over the /api/data/:key backend.

   - Single source of truth: the HTTP server
   - Local cache (in-memory + optional localStorage mirror)
   - Typed sub-repositories per collection (Projects, Forms, ...)
   - Change events (subscribe/unsubscribe) — no DOM coupling
   - Works in Node (for tests) and in the browser
   - Framework-free, no external deps
   ============================================================ */

'use strict';

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NouRionRepo = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  // ==========================================================
  // 1. EventBus — minimal publish/subscribe
  // ==========================================================
  function EventBus() { this._listeners = new Map(); }

  EventBus.prototype.on = function (event, fn) {
    if (typeof fn !== 'function') return function () {};
    var arr = this._listeners.get(event);
    if (!arr) { arr = []; this._listeners.set(event, arr); }
    arr.push(fn);
    var self = this;
    return function () { self.off(event, fn); };
  };

  EventBus.prototype.off = function (event, fn) {
    var arr = this._listeners.get(event);
    if (!arr) return;
    var i = arr.indexOf(fn);
    if (i !== -1) arr.splice(i, 1);
  };

  EventBus.prototype.emit = function (event, payload) {
    var arr = this._listeners.get(event);
    if (!arr) return;
    // Copy to guard against mutation during iteration
    var snap = arr.slice();
    for (var i = 0; i < snap.length; i++) {
      try { snap[i](payload); } catch (e) { /* listener error — ignore */ }
    }
  };

  EventBus.prototype.clear = function () { this._listeners.clear(); };

  // ==========================================================
  // 2. HTTP transport — fetch-based, configurable
  // ==========================================================
  function HttpTransport(opts) {
    opts = opts || {};
    this.baseUrl = (opts.baseUrl || '').replace(/\/$/, '');
    // IMPORTANT: wrap in a closure so the browser's global fetch is called
    // with the right `this` (window) — avoids "Illegal invocation" errors
    // when fetchFn is invoked as a method on the transport instance.
    var nativeFetch = opts.fetch || (typeof fetch !== 'undefined' ? fetch : null);
    this.fetchFn = nativeFetch
      ? function (url, init) { return nativeFetch(url, init); }
      : null;
    this.csrfToken = opts.csrfToken || null;
    this.credentials = opts.credentials || 'same-origin';
  }

  HttpTransport.prototype.setCsrf = function (token) { this.csrfToken = token; };

  HttpTransport.prototype._headers = function (mutating) {
    var h = { 'Accept': 'application/json' };
    if (mutating) h['Content-Type'] = 'application/json';
    if (mutating && this.csrfToken) h['X-CSRF-Token'] = this.csrfToken;
    return h;
  };

  HttpTransport.prototype.get = async function (path) {
    if (!this.fetchFn) throw new Error('no fetch impl configured');
    var r = await this.fetchFn(this.baseUrl + path, {
      method: 'GET',
      headers: this._headers(false),
      credentials: this.credentials
    });
    if (!r.ok) throw httpError(r.status, 'GET ' + path);
    return r.json();
  };

  HttpTransport.prototype.post = async function (path, body) {
    if (!this.fetchFn) throw new Error('no fetch impl configured');
    var r = await this.fetchFn(this.baseUrl + path, {
      method: 'POST',
      headers: this._headers(true),
      credentials: this.credentials,
      body: JSON.stringify(body || {})
    });
    if (!r.ok) throw httpError(r.status, 'POST ' + path);
    return r.json();
  };

  HttpTransport.prototype.del = async function (path) {
    if (!this.fetchFn) throw new Error('no fetch impl configured');
    var r = await this.fetchFn(this.baseUrl + path, {
      method: 'DELETE',
      headers: this._headers(true),
      credentials: this.credentials
    });
    if (!r.ok) throw httpError(r.status, 'DELETE ' + path);
    return r.json();
  };

  function httpError(status, op) {
    var e = new Error(op + ' failed: ' + status);
    e.status = status;
    return e;
  }

  // ==========================================================
  // 3. Base Repository — generic CRUD over one storage key
  //    Each repo owns ONE pm_* key (e.g. pm_forms)
  //    Items must have an `id` property — the repo enforces it.
  // ==========================================================
  function Repository(opts) {
    if (!opts || !opts.key) throw new Error('Repository: opts.key required');
    this.key = opts.key;
    this.idField = opts.idField || 'id';
    this.transport = opts.transport;     // optional HttpTransport
    this.store = opts.store || null;     // optional localStorage-like
    this.bus = new EventBus();
    this._cache = [];                    // in-memory list
    this._loaded = false;
  }

  // ----- internal: generate unique id -----
  Repository.prototype._genId = function () {
    return 'r_' + Date.now().toString(36) + '_' +
           Math.random().toString(36).slice(2, 8);
  };

  // ----- load from transport (or store fallback) -----
  Repository.prototype.load = async function () {
    if (this.transport) {
      try {
        var resp = await this.transport.get('/api/data/' + encodeURIComponent(this.key));
        var list = (resp && resp.value) || [];
        if (!Array.isArray(list)) list = [];
        this._cache = list;
        this._loaded = true;
        this._mirrorToStore();
        this.bus.emit('loaded', { items: this._cache.slice() });
        return this._cache.slice();
      } catch (e) {
        // fall through to local store
      }
    }
    // Fallback: read from local store
    if (this.store) {
      try {
        var raw = this.store.getItem(this.key);
        var arr = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(arr)) arr = [];
        this._cache = arr;
        this._loaded = true;
        this.bus.emit('loaded', { items: this._cache.slice() });
        return this._cache.slice();
      } catch (e) { /* ignore */ }
    }
    this._cache = [];
    this._loaded = true;
    this.bus.emit('loaded', { items: [] });
    return [];
  };

  // ----- read API -----
  Repository.prototype.all = function () { return this._cache.slice(); };

  Repository.prototype.size = function () { return this._cache.length; };

  Repository.prototype.find = function (id) {
    var f = this.idField;
    for (var i = 0; i < this._cache.length; i++) {
      if (this._cache[i][f] === id) return this._cache[i];
    }
    return null;
  };

  Repository.prototype.where = function (predicate) {
    if (typeof predicate !== 'function') return [];
    return this._cache.filter(predicate);
  };

  // ----- write API -----
  Repository.prototype.create = async function (partial) {
    var f = this.idField;
    var item = Object.assign({}, partial || {});
    if (!item[f]) item[f] = this._genId();
    if (this.find(item[f])) {
      throw new Error('create: id already exists (' + item[f] + ')');
    }
    this._cache.push(item);
    await this._persist();
    this.bus.emit('created', { item: item });
    this.bus.emit('changed', { reason: 'create', item: item });
    return item;
  };

  Repository.prototype.update = async function (id, patch) {
    var f = this.idField;
    var idx = -1;
    for (var i = 0; i < this._cache.length; i++) {
      if (this._cache[i][f] === id) { idx = i; break; }
    }
    if (idx === -1) throw new Error('update: not found (' + id + ')');
    var merged = Object.assign({}, this._cache[idx], patch || {}, { [f]: id });
    this._cache[idx] = merged;
    await this._persist();
    this.bus.emit('updated', { item: merged });
    this.bus.emit('changed', { reason: 'update', item: merged });
    return merged;
  };

  Repository.prototype.upsert = async function (item) {
    var f = this.idField;
    if (!item || item[f] == null) {
      return this.create(item || {});
    }
    if (this.find(item[f])) {
      return this.update(item[f], item);
    }
    this._cache.push(item);
    await this._persist();
    this.bus.emit('created', { item: item });
    this.bus.emit('changed', { reason: 'upsert', item: item });
    return item;
  };

  Repository.prototype.remove = async function (id) {
    var f = this.idField;
    var idx = -1;
    for (var i = 0; i < this._cache.length; i++) {
      if (this._cache[i][f] === id) { idx = i; break; }
    }
    if (idx === -1) return false;
    var removed = this._cache.splice(idx, 1)[0];
    await this._persist();
    this.bus.emit('removed', { item: removed });
    this.bus.emit('changed', { reason: 'remove', item: removed });
    return true;
  };

  Repository.prototype.clear = async function () {
    this._cache = [];
    await this._persist();
    this.bus.emit('cleared', {});
    this.bus.emit('changed', { reason: 'clear' });
  };

  // ----- events -----
  Repository.prototype.on = function (event, fn) { return this.bus.on(event, fn); };
  Repository.prototype.off = function (event, fn) { this.bus.off(event, fn); };

  // ----- internal: persist cache to transport + store -----
  Repository.prototype._persist = async function () {
    this._mirrorToStore();
    if (this.transport) {
      try {
        await this.transport.post(
          '/api/data/' + encodeURIComponent(this.key),
          { value: this._cache }
        );
      } catch (e) {
        this.bus.emit('syncError', { error: e });
        // Keep local cache; caller may retry
      }
    }
  };

  Repository.prototype._mirrorToStore = function () {
    if (!this.store) return;
    try { this.store.setItem(this.key, JSON.stringify(this._cache)); }
    catch (e) { /* quota / serialize error — ignore */ }
  };

  // ==========================================================
  // 4. RepositoryFactory — one place to build repos per entity
  //    All share the same transport + optional store.
  // ==========================================================
  function RepositoryFactory(opts) {
    opts = opts || {};
    this.transport = opts.transport || null;
    this.store = opts.store || null;
    this._repos = new Map();
  }

  RepositoryFactory.prototype.forKey = function (key, opts) {
    if (this._repos.has(key)) return this._repos.get(key);
    var r = new Repository(Object.assign({
      key: key,
      transport: this.transport,
      store: this.store
    }, opts || {}));
    this._repos.set(key, r);
    return r;
  };

  RepositoryFactory.prototype.projects  = function () { return this.forKey('pm_projects'); };
  RepositoryFactory.prototype.forms     = function () { return this.forKey('pm_forms'); };
  RepositoryFactory.prototype.formTypes = function () { return this.forKey('pm_form_types'); };
  RepositoryFactory.prototype.sections  = function () { return this.forKey('pm_sections'); };
  RepositoryFactory.prototype.companies = function () { return this.forKey('pm_companies'); };
  RepositoryFactory.prototype.regions   = function () { return this.forKey('pm_regions'); };
  RepositoryFactory.prototype.galleries = function () { return this.forKey('pm_galleries'); };
  RepositoryFactory.prototype.employees = function () { return this.forKey('pm_employees'); };
  RepositoryFactory.prototype.custody   = function () { return this.forKey('pm_custody'); };
  RepositoryFactory.prototype.designs   = function () { return this.forKey('pm_designs'); };

  // ==========================================================
  // EXPORTS
  // ==========================================================
  return {
    EventBus: EventBus,
    HttpTransport: HttpTransport,
    Repository: Repository,
    RepositoryFactory: RepositoryFactory
  };

});
