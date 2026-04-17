/**
 * quotations/model.js — Quote data model, validation, and calculation helpers.
 *
 * Shape of a Quote:
 *   {
 *     id, number, status: 'draft'|'sent'|'approved'|'rejected'|'converted',
 *     customer: { name, phone, email, address },
 *     company:  { name, vat, address },
 *     projectId: string|null,
 *     items: [{ id, profile, description, qty, length, width, height, unit_price, discount_pct }],
 *     terms, validity_days, notes,
 *     vat_rate: 0.15,
 *     totals: { subtotal, discount, net, vat, total },  // derived
 *     createdAt, updatedAt, sentAt, approvedAt, convertedContractId
 *   }
 *
 * UMD wrap: works as CommonJS in Node and as window.NRQuotationsModel in the browser.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NRQuotationsModel = factory();
}(typeof self !== 'undefined' ? self : this, function () {

  const VAT_RATE = 0.15;
  const STATUSES = ['draft', 'sent', 'approved', 'rejected', 'converted'];

  /** Compute a single line's net (after discount) */
  function lineNet(item) {
    const qty  = Number(item.qty) || 0;
    const unit = Number(item.unit_price) || 0;
    const disc = Number(item.discount_pct) || 0;
    const gross = qty * unit;
    return +(gross * (1 - disc / 100)).toFixed(2);
  }

  /** Compute quote totals from items. */
  function computeTotals(quote) {
    const items = Array.isArray(quote.items) ? quote.items : [];
    let subtotal = 0, discount = 0;
    for (const it of items) {
      const qty  = Number(it.qty) || 0;
      const unit = Number(it.unit_price) || 0;
      const disc = Number(it.discount_pct) || 0;
      subtotal += qty * unit;
      discount += qty * unit * (disc / 100);
    }
    const net   = +(subtotal - discount).toFixed(2);
    const vat   = +(net * (quote.vat_rate || VAT_RATE)).toFixed(2);
    const total = +(net + vat).toFixed(2);
    return {
      subtotal: +subtotal.toFixed(2),
      discount: +discount.toFixed(2),
      net, vat, total
    };
  }

  /** Validate quote; returns {ok, errors[]} */
  function validate(q) {
    const errs = [];
    if (!q || typeof q !== 'object') return { ok: false, errors: ['invalid payload'] };
    if (!q.customer || !q.customer.name) errs.push('customer.name required');
    if (!Array.isArray(q.items) || q.items.length === 0) errs.push('items must be non-empty');
    if (q.status && !STATUSES.includes(q.status)) errs.push('bad status');
    (q.items || []).forEach((it, i) => {
      if (!it.profile && !it.description) errs.push(`items[${i}].profile required`);
      if (!(Number(it.qty) > 0)) errs.push(`items[${i}].qty > 0 required`);
    });
    return { ok: errs.length === 0, errors: errs };
  }

  /** Fill defaults on a new quote */
  function normalize(q, nextNumber) {
    const out = Object.assign({
      status: 'draft',
      vat_rate: VAT_RATE,
      items: [],
      terms: '',
      notes: '',
      validity_days: 30,
      customer: {},
      company: {},
      projectId: null,
    }, q || {});
    if (!out.number) out.number = 'Q-' + (nextNumber || Date.now().toString().slice(-6));
    out.totals = computeTotals(out);
    return out;
  }

  /** Allowed transitions (simple state machine) */
  const TRANSITIONS = {
    draft:     ['sent', 'rejected'],
    sent:      ['approved', 'rejected', 'draft'],
    approved:  ['converted', 'rejected'],
    rejected:  ['draft'],
    converted: [],
  };
  function canTransition(from, to) {
    return Array.isArray(TRANSITIONS[from]) && TRANSITIONS[from].includes(to);
  }

  return { VAT_RATE, STATUSES, lineNet, computeTotals, validate, normalize, canTransition, TRANSITIONS };
}));
