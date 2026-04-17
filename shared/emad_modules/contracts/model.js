/**
 * contracts/model.js — Contract data model and helpers.
 *
 * Shape: {
 *   id, number, status: 'draft'|'active'|'completed'|'cancelled',
 *   parties: { customer:{name,...}, company:{name,vat,...} },
 *   value, down_payment,
 *   payment_schedule: [{ name, pct, amount, due_date, status:'pending'|'invoiced'|'paid' }],
 *   terms, signed_date, start_date, end_date,
 *   attached_quote_id, project_id,
 *   extracts: [{ id, name, pct, amount, registered_at, status:'pending'|'approved'|'paid' }],
 *   payments: [{ id, amount, method, ref, at, note }],
 *   createdAt, updatedAt
 * }
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NRContractsModel = factory();
}(typeof self !== 'undefined' ? self : this, function () {

  const STATUSES = ['draft', 'active', 'completed', 'cancelled'];

  function sumPaid(c) {
    return (c.payments || []).reduce((a, p) => a + (Number(p.amount) || 0), 0);
  }
  function remaining(c) {
    return Math.max(0, +((Number(c.value)||0) - sumPaid(c)).toFixed(2));
  }
  function progress(c) {
    const v = Number(c.value) || 0;
    if (!v) return 0;
    return Math.min(100, +((sumPaid(c) / v) * 100).toFixed(1));
  }

  function validate(c) {
    const errs = [];
    if (!c || typeof c !== 'object') return { ok: false, errors: ['invalid payload'] };
    if (!c.parties || !c.parties.customer || !c.parties.customer.name) errs.push('parties.customer.name required');
    if (!(Number(c.value) >= 0)) errs.push('value must be >= 0');
    if (c.status && !STATUSES.includes(c.status)) errs.push('bad status');
    if (Array.isArray(c.payment_schedule)) {
      const totalPct = c.payment_schedule.reduce((s,r)=>s+(Number(r.pct)||0),0);
      if (totalPct > 0 && Math.abs(totalPct - 100) > 1) errs.push('payment_schedule pct must sum to 100');
    }
    return { ok: errs.length === 0, errors: errs };
  }

  function normalize(c, nextNumber) {
    const out = Object.assign({
      status:'draft', parties:{customer:{},company:{}}, value:0, down_payment:0,
      payment_schedule:[], terms:'', signed_date:null, start_date:null, end_date:null,
      attached_quote_id:null, project_id:null, extracts:[], payments:[]
    }, c || {});
    if (!out.number) out.number = 'C-' + (nextNumber || Date.now().toString().slice(-6));
    return out;
  }

  return { STATUSES, sumPaid, remaining, progress, validate, normalize };
}));
