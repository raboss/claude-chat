/**
 * contracts/routes.js — Express router for العقود.
 * Mounted at /api/contracts.
 *
 * Data keys: pm_contracts (array), pm_payments (array for cross-module linkage)
 */
const express = require('express');
const { readJSON, writeJSON, uid, nowISO } = require('../../api/_store');
const Model = require('./model');

module.exports = function (DATA_DIR) {
  const router = express.Router();
  const KEY = 'pm_contracts';
  const PAY_KEY = 'pm_payments';

  const load = () => readJSON(DATA_DIR, KEY, []);
  const save = (arr) => writeJSON(DATA_DIR, KEY, arr);

  router.get('/', (req, res) => {
    // TODO: require perm 'contracts.read'
    let arr = load();
    const { status, customer, project_id } = req.query;
    if (status)     arr = arr.filter(c => c.status === status);
    if (project_id) arr = arr.filter(c => c.project_id === project_id);
    if (customer)   arr = arr.filter(c => (c.parties?.customer?.name||'').toLowerCase().includes(String(customer).toLowerCase()));
    res.json(arr);
  });

  router.get('/:id', (req, res) => {
    // TODO: require perm 'contracts.read'
    const c = load().find(x => x.id === req.params.id);
    if (!c) return res.status(404).json({ error: 'not found' });
    res.json(c);
  });

  router.post('/', (req, res) => {
    // TODO: require perm 'contracts.create'
    const arr = load();
    const c = Model.normalize(req.body, String(arr.length + 1).padStart(4, '0'));
    const v = Model.validate(c);
    if (!v.ok) return res.status(400).json({ error: 'validation', details: v.errors });
    c.id = uid('ctr');
    c.createdAt = c.updatedAt = nowISO();
    arr.push(c);
    save(arr);
    res.status(201).json(c);
  });

  router.patch('/:id', (req, res) => {
    // TODO: require perm 'contracts.update'
    const arr = load();
    const idx = arr.findIndex(x => x.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'not found' });
    const next = Object.assign({}, arr[idx], req.body);
    const v = Model.validate(next);
    if (!v.ok) return res.status(400).json({ error: 'validation', details: v.errors });
    next.updatedAt = nowISO();
    arr[idx] = next;
    save(arr);
    res.json(next);
  });

  router.delete('/:id', (req, res) => {
    // TODO: require perm 'contracts.delete'
    const arr = load();
    const idx = arr.findIndex(x => x.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'not found' });
    const removed = arr.splice(idx, 1)[0];
    save(arr);
    res.json({ ok: true, removed });
  });

  // register-extract: records a milestone / مستخلص against the contract schedule
  router.post('/:id/register-extract', (req, res) => {
    // TODO: require perm 'contracts.extract'
    const arr = load();
    const idx = arr.findIndex(x => x.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'not found' });
    const c = arr[idx];
    const extract = {
      id: uid('ext'),
      name: req.body.name || 'مستخلص',
      pct:  Number(req.body.pct) || 0,
      amount: Number(req.body.amount) || 0,
      registered_at: nowISO(),
      status: 'pending',
    };
    c.extracts = c.extracts || [];
    c.extracts.push(extract);
    // If we matched a payment_schedule row, mark it 'invoiced'
    const row = (c.payment_schedule || []).find(r => r.status === 'pending' && Math.abs((r.pct||0) - extract.pct) < 0.1);
    if (row) row.status = 'invoiced';
    c.updatedAt = nowISO();
    save(arr);
    res.status(201).json({ contract: c, extract });
  });

  // record-payment: adds a payment and updates status; also appends to pm_payments
  router.post('/:id/record-payment', (req, res) => {
    // TODO: require perm 'contracts.payment'
    const arr = load();
    const idx = arr.findIndex(x => x.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'not found' });
    const c = arr[idx];
    const pay = {
      id: uid('pay'),
      amount: Number(req.body.amount) || 0,
      method: req.body.method || 'bank',
      ref:    req.body.ref || '',
      at:     nowISO(),
      note:   req.body.note || '',
    };
    if (pay.amount <= 0) return res.status(400).json({ error: 'amount must be > 0' });
    c.payments = c.payments || [];
    c.payments.push(pay);
    // activate contract on first payment
    if (c.status === 'draft') c.status = 'active';
    if (Model.remaining(c) === 0 && c.value > 0) c.status = 'completed';
    c.updatedAt = nowISO();
    save(arr);

    // cross-module log
    const payLog = readJSON(DATA_DIR, PAY_KEY, []);
    payLog.push({ contract_id: c.id, ...pay });
    writeJSON(DATA_DIR, PAY_KEY, payLog);

    res.status(201).json({ contract: c, payment: pay, remaining: Model.remaining(c) });
  });

  return router;
};
