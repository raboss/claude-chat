/**
 * orders/routes.js — Router for production work orders.
 * Mounted at /api/orders.
 *
 * Three sub-resources, each stored in its own pm_* file:
 *   /cut   → pm_cut_orders
 *   /mfg   → pm_mfg_orders
 *   /glass → pm_glass_orders
 *
 * Common CRUD per type. A 'type' field is injected on save so the Kanban UI
 * can merge them into one pipeline view.
 */
const express = require('express');
const { readJSON, writeJSON, uid, nowISO } = require('../../api/_store');
const Model = require('./model');

const CFG = {
  cut:   { key:'pm_cut_orders',   numPrefix:'CO' },
  mfg:   { key:'pm_mfg_orders',   numPrefix:'MO' },
  glass: { key:'pm_glass_orders', numPrefix:'GO' },
};

module.exports = function (DATA_DIR) {
  const router = express.Router();

  function makeHandlers(type) {
    const { key } = CFG[type];
    const load = () => readJSON(DATA_DIR, key, []);
    const save = (v) => writeJSON(DATA_DIR, key, v);

    return {
      list: (req, res) => {
        // TODO: require perm `orders.${type}.read`
        let arr = load();
        const { status, project_id, assigned_to } = req.query;
        if (status)      arr = arr.filter(o => o.status === status);
        if (project_id)  arr = arr.filter(o => o.project_id === project_id);
        if (assigned_to) arr = arr.filter(o => o.assigned_to === assigned_to);
        res.json(arr);
      },
      get: (req, res) => {
        // TODO: require perm `orders.${type}.read`
        const o = load().find(x => x.id === req.params.id);
        if (!o) return res.status(404).json({ error:'not found' });
        res.json(o);
      },
      create: (req, res) => {
        // TODO: require perm `orders.${type}.create`
        const arr = load();
        const o = Model.normalize(Object.assign({ type }, req.body), String(arr.length+1).padStart(4,'0'));
        const v = Model.validate(o);
        if (!v.ok) return res.status(400).json({ error:'validation', details:v.errors });
        o.id = uid('ord');
        o.created_at = o.updated_at = nowISO();
        arr.push(o);
        save(arr);
        res.status(201).json(o);
      },
      patch: (req, res) => {
        // TODO: require perm `orders.${type}.update`
        const arr = load();
        const idx = arr.findIndex(x => x.id === req.params.id);
        if (idx < 0) return res.status(404).json({ error:'not found' });
        const prev = arr[idx];
        const next = Object.assign({}, prev, req.body);
        if (req.body.status && req.body.status !== prev.status && !Model.canTransition(prev.status, req.body.status)) {
          return res.status(400).json({ error: `illegal transition ${prev.status}→${req.body.status}` });
        }
        next.type = type;
        next.updated_at = nowISO();
        arr[idx] = next;
        save(arr);
        res.json(next);
      },
      remove: (req, res) => {
        // TODO: require perm `orders.${type}.delete`
        const arr = load();
        const idx = arr.findIndex(x => x.id === req.params.id);
        if (idx < 0) return res.status(404).json({ error:'not found' });
        const removed = arr.splice(idx,1)[0];
        save(arr);
        res.json({ ok:true, removed });
      },
    };
  }

  for (const t of Object.keys(CFG)) {
    const h = makeHandlers(t);
    router.get(`/${t}`,     h.list);
    router.get(`/${t}/:id`, h.get);
    router.post(`/${t}`,    h.create);
    router.patch(`/${t}/:id`, h.patch);
    router.delete(`/${t}/:id`, h.remove);
  }

  // Unified view — merged pipeline across types
  router.get('/all', (req, res) => {
    // TODO: require perm 'orders.read'
    const all = [];
    for (const t of Object.keys(CFG)) {
      const rows = readJSON(DATA_DIR, CFG[t].key, []);
      rows.forEach(r => all.push(Object.assign({}, r, { type: t })));
    }
    res.json(all);
  });

  return router;
};
