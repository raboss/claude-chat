/**
 * orders/model.js — Polymorphic work orders (Cut / Manufacturing / Glass).
 *
 * Common fields: { id, type: 'cut'|'mfg'|'glass', number, status, priority,
 *                  project_id, assigned_to, created_at, updated_at }
 *
 * CutOrder:           { cut_list:[{profile,length,qty,angles}] }
 * ManufacturingOrder: { assembly_specs, frames_count, glass_list:[] }
 * GlassOrder:         { items:[{type,width,height,qty}], supplier, eta }
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NROrdersModel = factory();
}(typeof self !== 'undefined' ? self : this, function () {

  const TYPES      = ['cut', 'mfg', 'glass'];
  const STATUSES   = ['draft', 'sent', 'in_progress', 'completed', 'cancelled'];
  const PRIORITIES = ['low', 'normal', 'high', 'urgent'];

  const TRANSITIONS = {
    draft:       ['sent', 'cancelled'],
    sent:        ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed:   [],
    cancelled:   [],
  };

  function validate(o) {
    const errs = [];
    if (!o || typeof o !== 'object') return { ok:false, errors:['invalid payload'] };
    if (!TYPES.includes(o.type)) errs.push('type must be cut|mfg|glass');
    if (o.status && !STATUSES.includes(o.status)) errs.push('bad status');
    if (o.priority && !PRIORITIES.includes(o.priority)) errs.push('bad priority');
    if (o.type === 'cut'   && (!o.cut_list || !o.cut_list.length)) errs.push('cut_list required');
    if (o.type === 'glass' && (!o.items    || !o.items.length))    errs.push('glass items required');
    if (o.type === 'mfg'   && !(Number(o.frames_count) > 0))       errs.push('frames_count > 0');
    return { ok: errs.length === 0, errors: errs };
  }

  function normalize(o, nextNumber) {
    const out = Object.assign({ status:'draft', priority:'normal', project_id:null, assigned_to:null }, o || {});
    if (!out.number) {
      const pfx = { cut:'CO', mfg:'MO', glass:'GO' }[out.type] || 'WO';
      out.number = pfx + '-' + (nextNumber || Date.now().toString().slice(-6));
    }
    return out;
  }

  function canTransition(from, to) { return (TRANSITIONS[from] || []).includes(to); }

  /** Aggregate totals for cut list: total cuts, total linear meters */
  function cutSummary(o) {
    if (o.type !== 'cut' || !o.cut_list) return null;
    let cuts=0, m=0;
    for (const r of o.cut_list) { cuts += Number(r.qty)||0; m += (Number(r.qty)||0) * (Number(r.length)||0); }
    return { cuts, meters: +m.toFixed(2) };
  }

  return { TYPES, STATUSES, PRIORITIES, TRANSITIONS, validate, normalize, canTransition, cutSummary };
}));
