/**
 * inventory/routes.js — Router for المخزون + أوامر الصرف.
 * Mounted at /api/inventory.
 *
 * Sub-paths:
 *   /items      (CRUD)
 *   /moves      (list/create; creating a move adjusts item stock_qty)
 *   /issuance   (CRUD + state change; approve issues stock out automatically)
 *
 * Data keys: pm_inventory_items, pm_inventory_moves, pm_issuance_notes
 */
const express = require('express');
const { readJSON, writeJSON, uid, nowISO } = require('../../api/_store');
const Model = require('./model');

module.exports = function (DATA_DIR) {
  const router = express.Router();
  const ITEMS = 'pm_inventory_items';
  const MOVES = 'pm_inventory_moves';
  const ISS   = 'pm_issuance_notes';

  const loadI = () => readJSON(DATA_DIR, ITEMS, []);
  const saveI = (v) => writeJSON(DATA_DIR, ITEMS, v);
  const loadM = () => readJSON(DATA_DIR, MOVES, []);
  const saveM = (v) => writeJSON(DATA_DIR, MOVES, v);
  const loadIss = () => readJSON(DATA_DIR, ISS, []);
  const saveIss = (v) => writeJSON(DATA_DIR, ISS, v);

  // ────── ITEMS ──────
  router.get('/items', (req, res) => {
    // TODO: require perm 'inventory.items.read'
    let items = loadI();
    const { category, low } = req.query;
    if (category) items = items.filter(i => i.category === category);
    if (low === '1') items = Model.lowStock(items);
    res.json(items);
  });

  router.post('/items', (req, res) => {
    // TODO: require perm 'inventory.items.create'
    const items = loadI();
    const it = Object.assign({ unit:'pcs', stock_qty:0, reorder_point:0 }, req.body);
    const v = Model.validateItem(it);
    if (!v.ok) return res.status(400).json({ error:'validation', details:v.errors });
    it.id = uid('inv');
    it.createdAt = nowISO();
    items.push(it);
    saveI(items);
    res.status(201).json(it);
  });

  router.patch('/items/:id', (req, res) => {
    // TODO: require perm 'inventory.items.update'
    const items = loadI();
    const idx = items.findIndex(i => i.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error:'not found' });
    items[idx] = Object.assign({}, items[idx], req.body, { updatedAt: nowISO() });
    saveI(items);
    res.json(items[idx]);
  });

  router.delete('/items/:id', (req, res) => {
    // TODO: require perm 'inventory.items.delete'
    const items = loadI();
    const idx = items.findIndex(i => i.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error:'not found' });
    const removed = items.splice(idx,1)[0];
    saveI(items);
    res.json({ ok:true, removed });
  });

  // ────── MOVEMENTS ──────
  router.get('/moves', (req, res) => {
    // TODO: require perm 'inventory.moves.read'
    let arr = loadM();
    const { item_id, type } = req.query;
    if (item_id) arr = arr.filter(m => m.item_id === item_id);
    if (type)    arr = arr.filter(m => m.type === type);
    res.json(arr.slice(-500)); // cap
  });

  function applyMove(items, m) {
    const idx = items.findIndex(i => i.id === m.item_id);
    if (idx < 0) throw new Error('item not found');
    const qty = Number(m.qty) || 0;
    if (m.type === 'in')  items[idx].stock_qty = (Number(items[idx].stock_qty)||0) + qty;
    if (m.type === 'out' || m.type === 'transfer') {
      const cur = Number(items[idx].stock_qty)||0;
      if (cur < qty) throw new Error('insufficient stock');
      items[idx].stock_qty = +(cur - qty).toFixed(3);
    }
    items[idx].updatedAt = nowISO();
    return items;
  }

  router.post('/moves', (req, res) => {
    // TODO: require perm 'inventory.moves.create'
    const m = Object.assign({ type:'in' }, req.body);
    const v = Model.validateMove(m);
    if (!v.ok) return res.status(400).json({ error:'validation', details:v.errors });
    let items = loadI();
    try { items = applyMove(items, m); } catch(e) { return res.status(400).json({ error: e.message }); }
    m.id = uid('mov');
    m.ts = nowISO();
    const moves = loadM(); moves.push(m); saveM(moves);
    saveI(items);
    res.status(201).json({ move: m, item: items.find(i=>i.id===m.item_id) });
  });

  // ────── ISSUANCE NOTES (إذن صرف) ──────
  router.get('/issuance', (req, res) => {
    // TODO: require perm 'inventory.issuance.read'
    let arr = loadIss();
    const { project_id, status } = req.query;
    if (project_id) arr = arr.filter(x => x.project_id === project_id);
    if (status)     arr = arr.filter(x => x.status === status);
    res.json(arr);
  });

  router.post('/issuance', (req, res) => {
    // TODO: require perm 'inventory.issuance.create'
    const arr = loadIss();
    const iss = Object.assign({ status:'draft', items:[] }, req.body);
    const v = Model.validateIssuance(iss);
    if (!v.ok) return res.status(400).json({ error:'validation', details:v.errors });
    iss.id = uid('iss');
    iss.number = iss.number || 'ISS-' + String(arr.length+1).padStart(4,'0');
    iss.date = iss.date || nowISO();
    arr.push(iss);
    saveIss(arr);
    res.status(201).json(iss);
  });

  router.patch('/issuance/:id', (req, res) => {
    // TODO: require perm 'inventory.issuance.update'
    const arr = loadIss();
    const idx = arr.findIndex(x => x.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error:'not found' });
    const prev = arr[idx];
    const next = Object.assign({}, prev, req.body);

    // If transitioning to 'approved' OR 'issued' — deduct from stock atomically
    if ((next.status === 'approved' || next.status === 'issued') && prev.status === 'draft') {
      let items = loadI();
      const moves = loadM();
      try {
        for (const line of (next.items || [])) {
          const m = { type:'out', item_id: line.item_id, qty: Number(line.qty)||0,
                       ref_type:'issuance', ref_id: next.id, ts: nowISO(),
                       by_user: next.requested_by || '', note: `من إذن صرف ${next.number}` };
          items = applyMove(items, m);
          m.id = uid('mov'); moves.push(m);
        }
      } catch(e) { return res.status(400).json({ error: e.message }); }
      saveI(items); saveM(moves);
    }

    next.updatedAt = nowISO();
    arr[idx] = next;
    saveIss(arr);
    res.json(next);
  });

  router.delete('/issuance/:id', (req, res) => {
    // TODO: require perm 'inventory.issuance.delete'
    const arr = loadIss();
    const idx = arr.findIndex(x => x.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error:'not found' });
    const removed = arr.splice(idx,1)[0];
    saveIss(arr);
    res.json({ ok:true, removed });
  });

  return router;
};
