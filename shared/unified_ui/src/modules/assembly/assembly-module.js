'use strict';
/**
 * ASSEMBLY ENGINE
 * PieceDef · FrameAssembly · SweepEngine
 * Sweeps a profile cross-section along a polyline path,
 * extracts real cut pieces with angles, lengths, and manufacturing data.
 */

// ─── PIECE DEFINITION ────────────────────────────────────────
class PieceDef {
  /**
   * One physical aluminum piece ready for the shop.
   */
  constructor(opts = {}) {
    this.id            = PieceDef._id++;
    this.label         = opts.label        || '';       // e.g. 'AB', 'CD'
    this.segmentIndex  = opts.segmentIndex ?? -1;       // which path segment
    this.profileId     = opts.profileId    || '';
    this.profileName   = opts.profileName  || '';

    // Geometry
    this.nominalLength = opts.nominalLength || 0;       // path segment length (mm)
    this.cutLength     = opts.cutLength     || 0;       // after deductions (mm)
    this.direction     = opts.direction     || null;    // Vec2 unit vector along piece

    // Cut angles (degrees from perpendicular to piece axis)
    // 0° = square cut, 45° = 45-degree miter
    this.startCutAngle = opts.startCutAngle ?? 0;
    this.endCutAngle   = opts.endCutAngle   ?? 0;
    this.startCutDir   = opts.startCutDir   || 'right'; // which way the miter faces
    this.endCutDir     = opts.endCutDir     || 'right';

    // Joint info
    this.startJointType = opts.startJointType || 'miter';
    this.endJointType   = opts.endJointType   || 'miter';

    // World position
    this.startPoint    = opts.startPoint   || null;   // Vec2 in model space
    this.endPoint      = opts.endPoint     || null;   // Vec2 in model space
    this.startVertex   = opts.startVertex  || '';     // 'A', 'B', ...
    this.endVertex     = opts.endVertex    || '';

    // Assembly data
    this.quantity      = opts.quantity     || 1;
    this.group         = opts.group        || '';     // for grouping identical pieces
    this.position      = opts.position     || '';     // 'top','bottom','left','right','mullion',...

    // AR / 3D data
    this.transform     = opts.transform    || null;   // { origin, xAxis, yAxis, zAxis }
    this.meta          = opts.meta         || {};
  }

  /** Unique group key for BOM deduplication */
  get groupKey() {
    return `${this.profileId}|${this.cutLength.toFixed(1)}|${this.startCutAngle.toFixed(1)}|${this.endCutAngle.toFixed(1)}`;
  }

  toJSON() {
    return {
      id:             this.id,
      label:          this.label,
      segmentIndex:   this.segmentIndex,
      profileId:      this.profileId,
      profileName:    this.profileName,
      nominalLength:  +this.nominalLength.toFixed(2),
      cutLength:      +this.cutLength.toFixed(2),
      startCutAngle:  +this.startCutAngle.toFixed(2),
      endCutAngle:    +this.endCutAngle.toFixed(2),
      startCutDir:    this.startCutDir,
      endCutDir:      this.endCutDir,
      startJointType: this.startJointType,
      endJointType:   this.endJointType,
      startVertex:    this.startVertex,
      endVertex:      this.endVertex,
      quantity:       this.quantity,
      position:       this.position,
      group:          this.group,
    };
  }

  toString() {
    return `Piece[${this.label}] ${this.profileName} L=${this.cutLength.toFixed(1)}mm ` +
           `cuts: ${this.startCutAngle.toFixed(1)}°/${this.endCutAngle.toFixed(1)}°`;
  }
}
PieceDef._id = 1;

// ─── FRAME ASSEMBLY ──────────────────────────────────────────
class FrameAssembly {
  constructor(opts = {}) {
    this.id       = FrameAssembly._id++;
    this.name     = opts.name     || 'Frame';
    this.path     = opts.path     || null;     // Polyline or ClosedShape
    this.profile  = opts.profile  || null;     // ProfileSection
    this.jointRule = opts.jointRule || null;   // JointRule
    this.pieces   = [];
    this.openings = [];   // detected inner openings
    this.meta     = {};
  }

  /** Has the assembly been built? */
  get isBuilt() { return this.pieces.length > 0; }

  /** Total cut length of all pieces */
  get totalCutLength() { return this.pieces.reduce((s, p) => s + p.cutLength, 0); }

  /** Total nominal (path) length */
  get totalNominalLength() { return this.path ? this.path.totalLength : 0; }

  /** Estimated weight kg */
  get estimatedWeight() {
    if (!this.profile) return 0;
    return this.totalCutLength / 1000 * this.profile.weight;
  }

  toString() {
    return `Assembly[${this.name}] ${this.pieces.length} pieces, L=${this.totalCutLength.toFixed(0)}mm`;
  }
}
FrameAssembly._id = 1;

// ─── SWEEP ENGINE ────────────────────────────────────────────
class SweepEngine {
  /**
   * Main API:
   *   const assembly = SweepEngine.sweep(polyline, profile, jointRule, options)
   *
   * Returns a FrameAssembly with:
   *   - pieces[] each containing full manufacturing data
   *   - The 3D/2D frame geometry for the viewer
   */

  static sweep(polyline, profile, jointRule, options = {}) {
    if (!polyline || polyline.points.length < 2) {
      throw new Error('SweepEngine: path must have at least 2 points');
    }
    if (!profile) throw new Error('SweepEngine: profile is required');

    const jr    = jointRule;
    const segs  = polyline.segments;
    const n     = segs.length;
    const pts   = polyline.points;
    const closed = polyline.closed;

    const assembly = new FrameAssembly({ path: polyline, profile, jointRule });

    for (let i = 0; i < n; i++) {
      const seg       = segs[i];
      const nomLen    = seg.length;
      const segLabel  = (pts[i] ? pts[i].label : String.fromCharCode(65+i)) +
                        (pts[(i+1)%pts.length] ? pts[(i+1)%pts.length].label : String.fromCharCode(66+i));

      // ── Joint at START of this segment (vertex i) ──
      let startAngle = 0, startJType = 'square', startDeduct = 0;
      if (closed || i > 0) {
        const prevSeg = segs[(i - 1 + n) % n];
        const interior = SweepEngine._interiorAngle(prevSeg, seg);
        const cuts     = jr ? jr.cutAngles(interior) : { inEnd: 0, outStart: 0 };
        startAngle  = cuts.outStart;
        startJType  = jr ? jr.type : 'square';
        startDeduct = jr ? jr.deductionOut(profile, interior) : 0;
      }

      // ── Joint at END of this segment (vertex i+1) ──
      let endAngle = 0, endJType = 'square', endDeduct = 0;
      if (closed || i < n - 1) {
        const nextSeg  = segs[(i + 1) % n];
        const interior = SweepEngine._interiorAngle(seg, nextSeg);
        const cuts     = jr ? jr.cutAngles(interior) : { inEnd: 0, outStart: 0 };
        endAngle  = cuts.inEnd;
        endJType  = jr ? jr.type : 'square';
        endDeduct = jr ? jr.deductionIn(profile, interior) : 0;
      }

      // ── Effective cut length ──
      const cutLen = Math.max(0, nomLen - startDeduct - endDeduct);

      // ── Transform matrix for this piece in model space ──
      const dir     = seg.direction;
      const normal  = seg.normal;
      const origin  = seg.start.pos;

      const piece = new PieceDef({
        label:          segLabel,
        segmentIndex:   i,
        profileId:      profile.id,
        profileName:    profile.name,
        nominalLength:  nomLen,
        cutLength:      cutLen,
        direction:      dir,
        startPoint:     seg.start.pos.clone(),
        endPoint:       seg.end.pos.clone(),
        startVertex:    pts[i]?.label || '',
        endVertex:      pts[(i+1)%pts.length]?.label || '',
        startCutAngle:  +startAngle.toFixed(4),
        endCutAngle:    +endAngle.toFixed(4),
        startCutDir:    SweepEngine._miterDir(seg, -1),
        endCutDir:      SweepEngine._miterDir(seg,  1),
        startJointType: startJType,
        endJointType:   endJType,
        position:       SweepEngine._guessPosition(seg, i, n),
        transform: {
          origin:  origin,
          xAxis:   dir,
          yAxis:   normal,
        },
      });

      assembly.pieces.push(piece);
    }

    // Auto-assign position hints
    SweepEngine._labelPositions(assembly);

    return assembly;
  }

  /** Interior angle (degrees) between incoming and outgoing segments */
  static _interiorAngle(segIn, segOut) {
    const d1 = segIn.direction;
    const d2 = segOut.direction;
    const dot  = Math.max(-1, Math.min(1, d1.dot(d2)));
    const full = Math.acos(dot) * 180 / Math.PI;
    // Interior angle of frame corner = supplement
    return 180 - full;
  }

  /** Miter face direction */
  static _miterDir(seg, side) {
    const cross = seg.direction.cross({ x: 1, y: 0 });
    return (side * cross) >= 0 ? 'right' : 'left';
  }

  /** Guess position based on segment direction */
  static _guessPosition(seg, i, total) {
    const deg = ((seg.angleDeg % 360) + 360) % 360;
    if (deg > 315 || deg <= 45)  return 'horizontal-bottom';
    if (deg > 45  && deg <= 135) return 'vertical-left';
    if (deg > 135 && deg <= 225) return 'horizontal-top';
    if (deg > 225 && deg <= 315) return 'vertical-right';
    return `segment-${i}`;
  }

  /** Label positions for rectangular-ish frames */
  static _labelPositions(assembly) {
    // Find the lowest/highest/leftmost/rightmost segments
    const pieces = assembly.pieces;
    if (pieces.length < 3) return;
    let minY=Infinity, maxY=-Infinity, minX=Infinity, maxX=-Infinity;
    for (const p of pieces) {
      const my = (p.startPoint.y + p.endPoint.y) / 2;
      const mx = (p.startPoint.x + p.endPoint.x) / 2;
      minY=Math.min(minY,my); maxY=Math.max(maxY,my);
      minX=Math.min(minX,mx); maxX=Math.max(maxX,mx);
    }
    const tol = (maxY - minY) * 0.15 + 1;
    for (const p of pieces) {
      const my = (p.startPoint.y + p.endPoint.y) / 2;
      const mx = (p.startPoint.x + p.endPoint.x) / 2;
      const isH = Math.abs(p.direction.y) < 0.3;
      const isV = Math.abs(p.direction.x) < 0.3;
      if (isH && my < minY + tol)  p.position = 'bottom';
      else if (isH && my > maxY - tol) p.position = 'top';
      else if (isV && mx < minX + tol) p.position = 'left';
      else if (isV && mx > maxX - tol) p.position = 'right';
      else if (isH) p.position = 'mullion-h';
      else if (isV) p.position = 'mullion-v';
    }
  }
}

// ─── EXPORT ──────────────────────────────────────────────────
if(typeof module!=='undefined'&&module.exports) module.exports={PieceDef,FrameAssembly,SweepEngine};
else Object.assign(typeof window!=='undefined'?window:this,{PieceDef,FrameAssembly,SweepEngine});
