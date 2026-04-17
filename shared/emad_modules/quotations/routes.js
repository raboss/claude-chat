/**
 * quotations/routes.js — Express router for عروض الأسعار.
 * Mounted at /api/quotations via src/api/routes-v2.js.
 *
 * Data key: pm_quotations (array)
 * When a quote is converted, a matching record is appended to pm_contracts.
 */
const express = require('express');
const { readJSON, writeJSON, uid, nowISO } = require('../../api/_store');
const Model = require('./model');

module.exports = function (DATA_DIR) {
  const router = express.Router();
  const KEY = 'pm_quotations';
  const CONTRACTS_KEY = 'pm_contracts';

  const load  = () => readJSON(DATA_DIR, KEY, []);
  const save  = (arr) => writeJSON(DATA_DIR, KEY, arr);

  // ── GET list (supports ?status=&customer=&from=&to=) ──
  router.get('/', (req, res) => {
    // TODO: require perm 'quotations.read'
    let arr = load();
    const { status, customer, from, to, projectId } = req.query;
    if (status)    arr = arr.filter(q => q.status === status);
    if (customer)  arr = arr.filter(q => (q.customer?.name||'').toLowerCase().includes(String(customer).toLowerCase()));
    if (projectId) arr = arr.filter(q => q.projectId === projectId);
    if (from)      arr = arr.filter(q => (q.createdAt||'') >= from);
    if (to)        arr = arr.filter(q => (q.createdAt||'') <= to);
    res.json(arr);
  });

  // ── GET single ──
  router.get('/:id', (req, res) => {
    // TODO: require perm 'quotations.read'
    const q = load().find(x => x.id === req.params.id);
    if (!q) return res.status(404).json({ error: 'not found' });
    res.json(q);
  });

  // ── POST create ──
  router.post('/', (req, res) => {
    // TODO: require perm 'quotations.create'
    const arr = load();
    const q   = Model.normalize(req.body, String(arr.length + 1).padStart(4, '0'));
    const v   = Model.validate(q);
    if (!v.ok) return res.status(400).json({ error: 'validation', details: v.errors });
    q.id = uid('quote');
    q.createdAt = q.updatedAt = nowISO();
    arr.push(q);
    save(arr);
    res.status(201).json(q);
  });

  // ── PATCH update / status change ──
  router.patch('/:id', (req, res) => {
    // TODO: require perm 'quotations.update'
    const arr = load();
    const idx = arr.findIndex(x => x.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'not found' });
    const prev = arr[idx];
    const next = Object.assign({}, prev, req.body);

    // Status transition guard
    if (req.body.status && req.body.status !== prev.status) {
      if (!Model.canTransition(prev.status, req.body.status)) {
        return res.status(400).json({ error: `illegal transition ${prev.status}→${req.body.status}` });
      }
      if (req.body.status === 'sent')     next.sentAt = nowISO();
      if (req.body.status === 'approved') next.approvedAt = nowISO();
    }
    next.totals = Model.computeTotals(next);
    next.updatedAt = nowISO();
    arr[idx] = next;
    save(arr);
    res.json(next);
  });

  // ── DELETE ──
  router.delete('/:id', (req, res) => {
    // TODO: require perm 'quotations.delete'
    const arr = load();
    const idx = arr.findIndex(x => x.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'not found' });
    const removed = arr.splice(idx, 1)[0];
    save(arr);
    res.json({ ok: true, removed });
  });

  // ── POST convert-to-contract ──
  router.post('/:id/convert-to-contract', (req, res) => {
    // TODO: require perm 'quotations.convert' AND 'contracts.create'
    const quotes = load();
    const qIdx = quotes.findIndex(x => x.id === req.params.id);
    if (qIdx < 0) return res.status(404).json({ error: 'quote not found' });
    const q = quotes[qIdx];
    if (!Model.canTransition(q.status, 'converted')) {
      return res.status(400).json({ error: `cannot convert from ${q.status}; must be approved first` });
    }

    const contracts = readJSON(DATA_DIR, CONTRACTS_KEY, []);
    const contract = {
      id: uid('ctr'),
      number: 'C-' + String(contracts.length + 1).padStart(4, '0'),
      status: 'draft',
      parties: {
        customer: q.customer,
        company:  q.company,
      },
      value: q.totals?.total || 0,
      down_payment: 0,
      payment_schedule: req.body?.payment_schedule || [
        { name: 'دفعة مقدمة', pct: 30, amount: +(((q.totals?.total||0) * 0.30).toFixed(2)), due_date: null, status: 'pending' },
        { name: 'دفعة التسليم',   pct: 70, amount: +(((q.totals?.total||0) * 0.70).toFixed(2)), due_date: null, status: 'pending' },
      ],
      terms: q.terms || '',
      attached_quote_id: q.id,
      project_id: q.projectId || null,
      signed_date: null,
      start_date:  null,
      end_date:    null,
      createdAt:   nowISO(),
      updatedAt:   nowISO(),
    };
    contracts.push(contract);
    writeJSON(DATA_DIR, CONTRACTS_KEY, contracts);

    q.status = 'converted';
    q.convertedContractId = contract.id;
    q.updatedAt = nowISO();
    quotes[qIdx] = q;
    save(quotes);

    res.status(201).json({ quote: q, contract });
  });

  return router;
};
