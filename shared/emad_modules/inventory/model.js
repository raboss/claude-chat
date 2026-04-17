/**
 * inventory/model.js — Stock items, movements, issuance notes (إذن صرف).
 *
 * Items:       { id, code, name, category, unit, cost, stock_qty, reorder_point, supplier }
 * Movements:   { id, type:'in'|'out'|'transfer', item_id, qty, ref_type, ref_id, ts, by_user, note }
 * Issuance:    { id, number, date, project_id, requested_by, approved_by,
 *                items:[{item_id, qty}], status:'draft'|'approved'|'issued'|'cancelled' }
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NRInventoryModel = factory();
}(typeof self !== 'undefined' ? self : this, function () {

  const UNITS     = ['pcs', 'kg', 'm', 'm2', 'm3', 'l', 'box'];
  const MOV_TYPES = ['in', 'out', 'transfer'];
  const ISS_STATUS= ['draft', 'approved', 'issued', 'cancelled'];

  function validateItem(it) {
    const errs = [];
    if (!it.code) errs.push('code required');
    if (!it.name) errs.push('name required');
    if (it.unit && !UNITS.includes(it.unit)) errs.push('bad unit');
    if (it.stock_qty != null && Number(it.stock_qty) < 0) errs.push('stock_qty negative');
    return { ok: errs.length === 0, errors: errs };
  }

  function validateMove(m) {
    const errs = [];
    if (!m.item_id) errs.push('item_id required');
    if (!MOV_TYPES.includes(m.type)) errs.push('bad type');
    if (!(Number(m.qty) > 0)) errs.push('qty > 0');
    return { ok: errs.length === 0, errors: errs };
  }

  function validateIssuance(iss) {
    const errs = [];
    if (!iss.items || !iss.items.length) errs.push('items required');
    if (iss.status && !ISS_STATUS.includes(iss.status)) errs.push('bad status');
    return { ok: errs.length === 0, errors: errs };
  }

  /** low-stock helper: returns items at or below reorder_point */
  function lowStock(items) {
    return items.filter(it => Number(it.stock_qty||0) <= Number(it.reorder_point||0));
  }

  return { UNITS, MOV_TYPES, ISS_STATUS, validateItem, validateMove, validateIssuance, lowStock };
}));
