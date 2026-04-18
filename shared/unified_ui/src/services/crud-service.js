/* ============================================================
   NouRion — src/services/crud-service.js  (Phase 8)
   ------------------------------------------------------------
   Generic CRUD service that wraps a Repository with:
     - validation hook
     - createdAt / updatedAt timestamps
     - optional enrich function (derived fields)
     - stats (total + groupings)
     - filters (by any field) + full-text search

   Domain-specific services (Customer, Employee, Form, ...) should
   extend this by passing a config:

       new CrudService(repo, {
         entity:     'customer',
         requiredFields: ['name', 'phone'],
         searchableFields: ['name', 'phone', 'city'],
         enrich: fn
       });
   ============================================================ */

'use strict';

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NouRionCrudService = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  function CrudService(repository, opts) {
    if (!repository) throw new Error('CrudService: repository required');
    opts = opts || {};
    this.repo             = repository;
    this.entity           = opts.entity || 'item';
    this.requiredFields   = opts.requiredFields   || ['name'];
    this.searchableFields = opts.searchableFields || ['name'];
    this.enrichFn         = opts.enrich           || null;
    this.validateFn       = opts.validate         || null;
    this.groupBy          = opts.groupBy          || []; // array of field names for stats
  }

  CrudService.prototype.load = function () { return this.repo.load(); };

  CrudService.prototype._enrich = function (item) {
    if (!item) return item;
    return this.enrichFn ? this.enrichFn(item) : item;
  };

  CrudService.prototype._validate = function (item) {
    var errors = [];
    if (!item || typeof item !== 'object') {
      errors.push(this.entity + ' must be an object');
      return { valid: false, errors: errors };
    }
    for (var i = 0; i < this.requiredFields.length; i++) {
      var f = this.requiredFields[i];
      var v = item[f];
      if (v == null || (typeof v === 'string' && !v.trim())) {
        errors.push(f + ' is required');
      }
    }
    if (this.validateFn) {
      var custom = this.validateFn(item) || [];
      if (Array.isArray(custom)) errors = errors.concat(custom);
    }
    return { valid: errors.length === 0, errors: errors };
  };

  CrudService.prototype.list = function () {
    var self = this;
    return this.repo.all().map(function (x) { return self._enrich(x); });
  };

  CrudService.prototype.get = function (id) {
    var r = this.repo.find(id);
    return r ? this._enrich(r) : null;
  };

  CrudService.prototype.create = async function (partial) {
    var check = this._validate(partial);
    if (!check.valid) {
      var e = new Error(this.entity + ' validation failed: ' + check.errors.join('; '));
      e.errors = check.errors;
      throw e;
    }
    var now = new Date().toISOString();
    var full = Object.assign({ createdAt: now, updatedAt: now }, partial);
    var created = await this.repo.create(full);
    return this._enrich(created);
  };

  CrudService.prototype.update = async function (id, patch) {
    var cur = this.repo.find(id);
    if (!cur) throw new Error(this.entity + ' not found: ' + id);
    var merged = Object.assign({}, cur, patch || {});
    var check = this._validate(merged);
    if (!check.valid) {
      var e = new Error(this.entity + ' validation failed: ' + check.errors.join('; '));
      e.errors = check.errors;
      throw e;
    }
    var p = Object.assign({}, patch || {}, { updatedAt: new Date().toISOString() });
    var u = await this.repo.update(id, p);
    return this._enrich(u);
  };

  CrudService.prototype.remove = function (id) { return this.repo.remove(id); };

  CrudService.prototype.search = function (query) {
    if (!query) return this.list();
    var q = String(query).toLowerCase();
    var fields = this.searchableFields;
    var self = this;
    return this.repo.where(function (x) {
      for (var i = 0; i < fields.length; i++) {
        var v = x[fields[i]];
        if (v != null && String(v).toLowerCase().indexOf(q) !== -1) return true;
      }
      return false;
    }).map(function (x) { return self._enrich(x); });
  };

  CrudService.prototype.filterBy = function (field, value) {
    if (!field || value == null || value === '') return this.list();
    var self = this;
    return this.repo.where(function (x) { return x[field] === value; })
                    .map(function (x) { return self._enrich(x); });
  };

  CrudService.prototype.stats = function () {
    var all = this.repo.all();
    var out = { total: all.length };
    for (var g = 0; g < this.groupBy.length; g++) {
      var field = this.groupBy[g];
      var bucket = {};
      for (var i = 0; i < all.length; i++) {
        var v = all[i][field];
        if (v == null || v === '') continue;
        bucket[v] = (bucket[v] || 0) + 1;
      }
      out['by_' + field] = bucket;
    }
    return out;
  };

  CrudService.prototype.on  = function (ev, fn) { return this.repo.on(ev, fn); };
  CrudService.prototype.off = function (ev, fn) { this.repo.off(ev, fn); };

  // ==========================================================
  // Concrete services built on CrudService
  // ==========================================================

  function CustomerService(repo) {
    CrudService.call(this, repo, {
      entity: 'customer',
      requiredFields:   ['name'],
      searchableFields: ['name', 'phone', 'email', 'city', 'company'],
      groupBy:          ['city', 'type']
    });
  }
  CustomerService.prototype = Object.create(CrudService.prototype);
  CustomerService.prototype.constructor = CustomerService;

  function EmployeeService(repo) {
    CrudService.call(this, repo, {
      entity: 'employee',
      requiredFields:   ['name'],
      searchableFields: ['name', 'role', 'phone', 'department'],
      groupBy:          ['department', 'role'],
      enrich: function (e) {
        if (!e) return e;
        var active = e.status !== 'inactive';
        return Object.assign({}, e, { isActive: active });
      }
    });
  }
  EmployeeService.prototype = Object.create(CrudService.prototype);
  EmployeeService.prototype.constructor = EmployeeService;

  function FormTypeService(repo) {
    CrudService.call(this, repo, {
      entity: 'form_type',
      requiredFields:   ['name'],
      searchableFields: ['name', 'code', 'category'],
      groupBy:          ['category']
    });
  }
  FormTypeService.prototype = Object.create(CrudService.prototype);
  FormTypeService.prototype.constructor = FormTypeService;

  return {
    CrudService:     CrudService,
    CustomerService: CustomerService,
    EmployeeService: EmployeeService,
    FormTypeService: FormTypeService
  };

});
