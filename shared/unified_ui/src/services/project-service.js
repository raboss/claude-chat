/* ============================================================
   NouRion — src/services/project-service.js  (Phase 6 — Services)
   ------------------------------------------------------------
   Business logic layer for projects.
   - Builds on the Repository (Phase 5)
   - Pure domain logic: validation, derived fields, statistics
   - No DOM, no global state, no fetch — fully testable in Node

   A ProjectService wraps a Repository<project> and exposes
   higher-level operations:
     create / update / advanceStage / computeTotals /
     stats / filterByCompany / ...
   ============================================================ */

'use strict';

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NouRionProjectService = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  // ==========================================================
  // Stage machine — allowed transitions between project stages
  // Mirrors the legacy DEFAULT_STAGES order used in NourMetal.
  // ==========================================================
  var DEFAULT_STAGES = [
    'draft',          // مسودة
    'measured',       // مقاسات
    'quoted',         // عرض سعر
    'approved',       // موافقة
    'manufacturing',  // تصنيع
    'installed',      // تركيب
    'delivered',      // تسليم
    'archived'        // أرشيف
  ];

  function stageIndex(stage) {
    var i = DEFAULT_STAGES.indexOf(stage);
    return i === -1 ? 0 : i;
  }

  // ==========================================================
  // Validation — returns { valid, errors }
  // ==========================================================
  function validate(proj) {
    var errors = [];
    if (!proj || typeof proj !== 'object') {
      return { valid: false, errors: ['project must be an object'] };
    }
    if (!proj.name || typeof proj.name !== 'string' || !proj.name.trim()) {
      errors.push('name is required');
    }
    if (proj.area != null && (typeof proj.area !== 'number' || proj.area < 0 || !isFinite(proj.area))) {
      errors.push('area must be a non-negative number');
    }
    if (proj.value != null && (typeof proj.value !== 'number' || proj.value < 0 || !isFinite(proj.value))) {
      errors.push('value must be a non-negative number');
    }
    if (proj.stage && DEFAULT_STAGES.indexOf(proj.stage) === -1) {
      errors.push('stage must be one of: ' + DEFAULT_STAGES.join(', '));
    }
    return { valid: errors.length === 0, errors: errors };
  }

  // ==========================================================
  // Derived fields — used when reading
  // ==========================================================
  function enrich(proj) {
    if (!proj) return proj;
    var stage = proj.stage || DEFAULT_STAGES[0];
    var idx   = stageIndex(stage);
    return Object.assign({}, proj, {
      stage: stage,
      stageIndex: idx,
      progress: Math.round((idx / (DEFAULT_STAGES.length - 1)) * 100),
      isFinal: idx === DEFAULT_STAGES.length - 1
    });
  }

  // ==========================================================
  // Statistics over a list of projects
  // ==========================================================
  function computeStats(list) {
    var out = {
      total:         0,
      totalArea:     0,
      totalValue:    0,
      avgValue:      0,
      byStage:       {},
      byCompany:     {},
      byRegion:      {},
      activeCount:   0,
      finishedCount: 0
    };
    if (!Array.isArray(list) || list.length === 0) return out;

    DEFAULT_STAGES.forEach(function (s) { out.byStage[s] = 0; });

    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (!p) continue;
      out.total += 1;
      if (typeof p.area  === 'number' && isFinite(p.area))  out.totalArea  += p.area;
      if (typeof p.value === 'number' && isFinite(p.value)) out.totalValue += p.value;
      var st = p.stage || DEFAULT_STAGES[0];
      out.byStage[st] = (out.byStage[st] || 0) + 1;
      if (p.company) out.byCompany[p.company] = (out.byCompany[p.company] || 0) + 1;
      if (p.region)  out.byRegion[p.region]   = (out.byRegion[p.region]   || 0) + 1;
      if (st === 'delivered' || st === 'archived') out.finishedCount += 1;
      else out.activeCount += 1;
    }
    out.avgValue = out.total > 0 ? out.totalValue / out.total : 0;
    return out;
  }

  // ==========================================================
  // ProjectService — wraps a Repository
  // ==========================================================
  function ProjectService(repository) {
    if (!repository) throw new Error('ProjectService: repository required');
    this.repo = repository;
  }

  ProjectService.prototype.load = function () { return this.repo.load(); };

  ProjectService.prototype.list = function () {
    return this.repo.all().map(enrich);
  };

  ProjectService.prototype.get = function (id) {
    var p = this.repo.find(id);
    return p ? enrich(p) : null;
  };

  ProjectService.prototype.create = async function (partial) {
    var check = validate(partial);
    if (!check.valid) {
      var e = new Error('validation failed: ' + check.errors.join('; '));
      e.errors = check.errors;
      throw e;
    }
    var now = new Date().toISOString();
    var full = Object.assign({
      stage:     DEFAULT_STAGES[0],
      createdAt: now,
      updatedAt: now
    }, partial);
    var created = await this.repo.create(full);
    return enrich(created);
  };

  ProjectService.prototype.update = async function (id, patch) {
    var current = this.repo.find(id);
    if (!current) throw new Error('project not found: ' + id);
    var merged = Object.assign({}, current, patch || {});
    var check = validate(merged);
    if (!check.valid) {
      var e = new Error('validation failed: ' + check.errors.join('; '));
      e.errors = check.errors;
      throw e;
    }
    patch = Object.assign({}, patch || {}, { updatedAt: new Date().toISOString() });
    var updated = await this.repo.update(id, patch);
    return enrich(updated);
  };

  ProjectService.prototype.remove = function (id) { return this.repo.remove(id); };

  // Advance to the next stage in the workflow. Refuses to go backwards.
  ProjectService.prototype.advanceStage = async function (id) {
    var p = this.repo.find(id);
    if (!p) throw new Error('project not found: ' + id);
    var cur = stageIndex(p.stage || DEFAULT_STAGES[0]);
    if (cur >= DEFAULT_STAGES.length - 1) {
      throw new Error('project already at final stage');
    }
    return this.update(id, { stage: DEFAULT_STAGES[cur + 1] });
  };

  // Explicitly set a stage (validated against the list).
  ProjectService.prototype.setStage = async function (id, stage) {
    if (DEFAULT_STAGES.indexOf(stage) === -1) {
      throw new Error('invalid stage: ' + stage);
    }
    return this.update(id, { stage: stage });
  };

  ProjectService.prototype.filterByCompany = function (company) {
    if (!company) return this.list();
    return this.repo.where(function (p) { return p.company === company; }).map(enrich);
  };

  ProjectService.prototype.filterByStage = function (stage) {
    if (!stage) return this.list();
    return this.repo.where(function (p) { return (p.stage || DEFAULT_STAGES[0]) === stage; }).map(enrich);
  };

  ProjectService.prototype.filterByRegion = function (region) {
    if (!region) return this.list();
    return this.repo.where(function (p) { return p.region === region; }).map(enrich);
  };

  ProjectService.prototype.search = function (query) {
    if (!query) return this.list();
    var q = String(query).toLowerCase();
    return this.repo.where(function (p) {
      return (p.name && String(p.name).toLowerCase().indexOf(q) !== -1) ||
             (p.id   && String(p.id).toLowerCase().indexOf(q) !== -1) ||
             (p.company && String(p.company).toLowerCase().indexOf(q) !== -1);
    }).map(enrich);
  };

  ProjectService.prototype.stats = function () {
    return computeStats(this.repo.all());
  };

  // Subscribe to repo-level events (passthrough)
  ProjectService.prototype.on  = function (ev, fn) { return this.repo.on(ev, fn); };
  ProjectService.prototype.off = function (ev, fn) { this.repo.off(ev, fn); };

  // ==========================================================
  // EXPORTS
  // ==========================================================
  return {
    ProjectService: ProjectService,
    DEFAULT_STAGES: DEFAULT_STAGES,
    validate:       validate,
    enrich:         enrich,
    computeStats:   computeStats,
    stageIndex:     stageIndex
  };

});
