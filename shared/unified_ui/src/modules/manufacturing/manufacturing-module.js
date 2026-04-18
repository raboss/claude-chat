'use strict';
/**
 * MANUFACTURING ENGINE
 * CutList · BOM · GlassCalculator · ManufacturingReport
 * Transforms assembly pieces into shop-ready documents
 */

// ─── CUT LIST ITEM ───────────────────────────────────────────
class CutListItem {
  constructor(piece) {
    this.pieceId        = piece.id;
    this.label          = piece.label;
    this.profileId      = piece.profileId;
    this.profileName    = piece.profileName;
    this.cutLength      = +piece.cutLength.toFixed(2);
    this.nominalLength  = +piece.nominalLength.toFixed(2);
    this.startCutAngle  = +piece.startCutAngle.toFixed(2);
    this.endCutAngle    = +piece.endCutAngle.toFixed(2);
    this.startCutDir    = piece.startCutDir;
    this.endCutDir      = piece.endCutDir;
    this.startJointType = piece.startJointType;
    this.endJointType   = piece.endJointType;
    this.position       = piece.position;
    this.startVertex    = piece.startVertex;
    this.endVertex      = piece.endVertex;
    this.quantity       = piece.quantity || 1;
    this.groupKey       = piece.groupKey;
  }

  /** Human-readable cut instruction */
  get cutInstruction() {
    const sa = this.startCutAngle, ea = this.endCutAngle;
    const st = this.startJointType, et = this.endJointType;
    const fmtAngle = (a, dir) => a === 0 ? '90° (مستقيم)' : `${(90-a).toFixed(1)}° ${dir==='right'?'يمين':'يسار'}`;
    return `قطع بداية: ${fmtAngle(sa, this.startCutDir)} | قطع نهاية: ${fmtAngle(ea, this.endCutDir)}`;
  }

  toJSON() {
    return {
      label: this.label,
      profile: this.profileName,
      profileId: this.profileId,
      cutLength: this.cutLength,
      nominalLength: this.nominalLength,
      startCutAngle: this.startCutAngle,
      endCutAngle: this.endCutAngle,
      startCutDir: this.startCutDir,
      endCutDir: this.endCutDir,
      startJointType: this.startJointType,
      endJointType: this.endJointType,
      position: this.position,
      vertices: `${this.startVertex}→${this.endVertex}`,
      quantity: this.quantity,
      cutInstruction: this.cutInstruction,
    };
  }
}

// ─── BOM ROW ─────────────────────────────────────────────────
class BOMRow {
  constructor(groupKey, items) {
    this.groupKey    = groupKey;
    this.items       = items;                         // [CutListItem]
    this.quantity    = items.reduce((s, x) => s + x.quantity, 0);
    this.profileId   = items[0].profileId;
    this.profileName = items[0].profileName;
    this.cutLength   = items[0].cutLength;
    this.startCutAngle = items[0].startCutAngle;
    this.endCutAngle   = items[0].endCutAngle;
    this.labels      = items.map(x => x.label).join(', ');
  }

  /** Total linear length for this row */
  get totalLength() { return this.quantity * this.cutLength; }

  toJSON() {
    return {
      quantity:    this.quantity,
      profileId:   this.profileId,
      profileName: this.profileName,
      cutLength:   this.cutLength,
      startCut:    this.startCutAngle,
      endCut:      this.endCutAngle,
      totalLength: +this.totalLength.toFixed(2),
      labels:      this.labels,
    };
  }
}

// ─── CUT LIST ────────────────────────────────────────────────
class CutList {
  constructor(assembly) {
    this.assembly = assembly;
    this.items    = assembly.pieces.map(p => new CutListItem(p));
  }

  /** Group identical pieces */
  get bom() {
    const groups = new Map();
    for (const item of this.items) {
      if (!groups.has(item.groupKey)) groups.set(item.groupKey, []);
      groups.get(item.groupKey).push(item);
    }
    return [...groups.values()].map(grp => new BOMRow(grp[0].groupKey, grp));
  }

  /** Total cut length per profile series */
  get totalsByProfile() {
    const totals = {};
    for (const item of this.items) {
      if (!totals[item.profileId]) totals[item.profileId] = { profileId: item.profileId, profileName: item.profileName, totalLength: 0, count: 0 };
      totals[item.profileId].totalLength += item.cutLength * item.quantity;
      totals[item.profileId].count       += item.quantity;
    }
    for (const k in totals) totals[k].totalLength = +totals[k].totalLength.toFixed(2);
    return Object.values(totals);
  }

  /** Total pieces count */
  get totalPieces() { return this.items.reduce((s, x) => s + x.quantity, 0); }

  /** Grand total cut length */
  get grandTotalLength() { return +this.items.reduce((s, x) => s + x.cutLength * x.quantity, 0).toFixed(2); }

  /** Print-ready table rows */
  toTable() {
    return this.items.map((item, idx) => ({
      no:           idx + 1,
      label:        item.label,
      vertices:     `${item.startVertex}→${item.endVertex}`,
      profile:      item.profileName,
      position:     item.position,
      nominal:      item.nominalLength,
      cutLength:    item.cutLength,
      startCut:     `${(90-item.startCutAngle).toFixed(1)}° (${item.startCutDir})`,
      endCut:       `${(90-item.endCutAngle).toFixed(1)}° (${item.endCutDir})`,
      jointType:    `${item.startJointType}/${item.endJointType}`,
      qty:          item.quantity,
    }));
  }

  toJSON() {
    return {
      items:           this.items.map(x => x.toJSON()),
      bom:             this.bom.map(r => r.toJSON()),
      totalsByProfile: this.totalsByProfile,
      totalPieces:     this.totalPieces,
      grandTotalLength:this.grandTotalLength,
    };
  }
}

// ─── GLASS CALCULATOR ────────────────────────────────────────
class GlassCalculator {
  /**
   * Given a frame assembly + profile, compute glass pane sizes
   * with proper rebate deduction on all four sides.
   * @param {FrameAssembly} assembly
   * @param {object} glassOptions  { rebate:mm, gap:mm, thickness:mm }
   */
  static calculate(assembly, glassOptions = {}) {
    const rebate    = glassOptions.rebate    || 15;
    const gap       = glassOptions.gap       || 3;
    const thickness = glassOptions.thickness || 6;

    if (!assembly.path) return [];
    const bbox = assembly.path.bbox;
    if (!bbox) return [];

    // For a simple rectangular frame, glass = bbox minus 2× rebate each side
    const glassW = Math.max(0, bbox.width  - (rebate + gap) * 2);
    const glassH = Math.max(0, bbox.height - (rebate + gap) * 2);

    return [{
      id:        1,
      label:     'G1',
      type:      'clear',
      thickness,
      width:     +glassW.toFixed(1),
      height:    +glassH.toFixed(1),
      area:      +(glassW * glassH / 1e6).toFixed(4),   // m²
      quantity:  1,
      position:  'main',
      rebate,
      gap,
      note:      `${glassW.toFixed(0)}×${glassH.toFixed(0)} mm — ربات ${rebate}mm كل جانب`,
    }];
  }
}

// ─── ACCESSORY PLACEMENT ─────────────────────────────────────
class AccessoryPlacer {
  /**
   * Auto-place hinges, handle, lock on an assembly
   * @returns Array of { type, pieceLabel, offset_mm, position, qty }
   */
  static place(assembly, options = {}) {
    const {
      hinges       = true,
      hingeSpacing = 600,
      handle       = true,
      handlePos    = 0.5,      // fraction along the piece
      lock         = true,
      lockPos      = 0.4,
      rollers      = false,
    } = options;

    const accs = [];
    const pieces = assembly.pieces;
    if (!pieces.length) return accs;

    // Find vertical pieces (left/right) for hinges
    const verticals = pieces.filter(p => p.position === 'left' || p.position === 'right' || p.position === 'vertical-left' || p.position === 'vertical-right');
    const hingeSide = verticals.find(p => p.position === 'left' || p.position === 'vertical-left') || verticals[0];

    if (hinges && hingeSide) {
      const count = Math.max(2, Math.floor(hingeSide.cutLength / hingeSpacing) + 1);
      for (let i = 0; i < count; i++) {
        const offset = (hingeSide.cutLength / (count - 1)) * i;
        accs.push({
          type:       'hinge',
          pieceLabel: hingeSide.label,
          offset_mm:  +offset.toFixed(1),
          position:   `hinge-${i+1}`,
          qty:        1,
          spec:       'Standard hinge 100mm',
        });
      }
    }

    // Handle on opposite vertical
    const handleSide = verticals.find(p => p !== hingeSide) || pieces[1];
    if (handle && handleSide) {
      accs.push({
        type:       'handle',
        pieceLabel: handleSide.label,
        offset_mm:  +(handleSide.cutLength * handlePos).toFixed(1),
        position:   'handle',
        qty:        1,
        spec:       'Lever handle 200mm',
      });
    }

    // Lock
    if (lock && handleSide) {
      accs.push({
        type:       'lock',
        pieceLabel: handleSide.label,
        offset_mm:  +(handleSide.cutLength * lockPos).toFixed(1),
        position:   'lock',
        qty:        1,
        spec:       'Multipoint lock',
      });
    }

    // Rollers on bottom for slide
    if (rollers) {
      const bottom = pieces.find(p => p.position === 'bottom');
      if (bottom) {
        accs.push({ type:'roller', pieceLabel:bottom.label, offset_mm:150, position:'roller-l', qty:1, spec:'Nylon roller' });
        accs.push({ type:'roller', pieceLabel:bottom.label, offset_mm:bottom.cutLength-150, position:'roller-r', qty:1, spec:'Nylon roller' });
      }
    }

    return accs;
  }
}

// ─── MANUFACTURING REPORT ────────────────────────────────────
class ManufacturingReport {
  constructor(assembly, profile, glassOpts = {}, accessoryOpts = {}) {
    this.assembly    = assembly;
    this.profile     = profile;
    this.cutList     = new CutList(assembly);
    this.glass       = GlassCalculator.calculate(assembly, glassOpts);
    this.accessories = AccessoryPlacer.place(assembly, accessoryOpts);
    this.createdAt   = new Date().toISOString();
  }

  get summary() {
    return {
      totalPieces:     this.cutList.totalPieces,
      totalLength_mm:  this.cutList.grandTotalLength,
      totalLength_m:   +(this.cutList.grandTotalLength / 1000).toFixed(3),
      weight_kg:       +this.assembly.estimatedWeight.toFixed(2),
      glassArea_m2:    +this.glass.reduce((s, g) => s + g.area * g.quantity, 0).toFixed(4),
      accessoryCount:  this.accessories.length,
      profileId:       this.profile?.id || '',
      profileName:     this.profile?.name || '',
    };
  }

  toJSON() {
    return {
      createdAt:   this.createdAt,
      summary:     this.summary,
      cutList:     this.cutList.toJSON(),
      glass:       this.glass,
      accessories: this.accessories,
    };
  }

  /** Render as HTML table string */
  toHTML() {
    const tbl = this.cutList.toTable();
    const rows = tbl.map(r =>
      `<tr><td>${r.no}</td><td>${r.label}</td><td>${r.vertices}</td><td>${r.profile}</td>` +
      `<td>${r.position}</td><td>${r.nominal}</td><td><strong>${r.cutLength}</strong></td>` +
      `<td>${r.startCut}</td><td>${r.endCut}</td><td>${r.jointType}</td><td>${r.qty}</td></tr>`
    ).join('');

    const s = this.summary;
    return `
<table border="1" cellpadding="4" style="border-collapse:collapse;font-size:12px;width:100%">
  <caption style="font-weight:bold;padding:6px">قائمة القطع التصنيعية</caption>
  <thead style="background:#1E2028;color:#E8EAF0">
    <tr>
      <th>#</th><th>الضلع</th><th>الرأسان</th><th>القطاع</th><th>الموضع</th>
      <th>الطول الاسمي</th><th>طول القطع</th><th>قطع البداية</th><th>قطع النهاية</th>
      <th>نوع الوصلة</th><th>الكمية</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<p style="font-size:12px;margin-top:8px">
  <strong>إجمالي القطع:</strong> ${s.totalPieces} |
  <strong>الطول الكلي:</strong> ${s.totalLength_m} م |
  <strong>الوزن:</strong> ${s.weight_kg} كجم |
  <strong>مساحة الزجاج:</strong> ${s.glassArea_m2} م²
</p>`;
  }
}

// ─── EXPORT ──────────────────────────────────────────────────
if(typeof module!=='undefined'&&module.exports) module.exports={CutListItem,BOMRow,CutList,GlassCalculator,AccessoryPlacer,ManufacturingReport};
else Object.assign(typeof window!=='undefined'?window:this,{CutListItem,BOMRow,CutList,GlassCalculator,AccessoryPlacer,ManufacturingReport});
