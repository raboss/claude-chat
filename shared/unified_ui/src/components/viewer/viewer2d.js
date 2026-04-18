'use strict';
/**
 * VIEWER 2D — Professional Canvas Renderer
 * Reads from FrameAssembly data (data is truth, viewer is display only)
 *
 * Usage:
 *   var v = new Viewer2D(canvasElement);
 *   v.setAssembly(assembly);
 *   v.render();
 */

class Viewer2D {
  constructor(canvas, options) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.assembly = null;
    this.glass = [];
    this.accessories = [];
    this.options = Object.assign({
      showDimensions: true,
      showLabels: true,
      showGlass: true,
      showAccessories: false,
      showCutAngles: false,
      showGrid: false,
      padding: 40,
      frameColor: '#2c3e50',
      frameHighlight: '#4a6a8a',
      glassGradient: true,
      labelFont: 'bold 10px Cairo, sans-serif',
      dimFont: 'bold 11px Cairo, sans-serif',
      thumbnailMode: false,
    }, options || {});
  }

  setAssembly(assembly) { this.assembly = assembly; }
  setGlass(glass) { this.glass = glass || []; }
  setAccessories(accs) { this.accessories = accs || []; }

  /** Main render — reads all data from assembly, draws on canvas */
  render() {
    if (!this.assembly || !this.assembly.path) return;
    var ctx = this.ctx, cv = this.canvas, o = this.options;
    var cw = cv.width, ch = cv.height, pad = o.padding;
    var bbox = this.assembly.path.bbox;
    var w = bbox.width, h = bbox.height;
    if (w <= 0 || h <= 0) return;

    var scale = Math.min((cw - pad * 2) / w, (ch - pad * 2) / h);
    var fw = w * scale, fh = h * scale;
    var ox = (cw - fw) / 2, oy = (ch - fh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.save();

    // Store transform for reuse
    this._scale = scale;
    this._ox = ox;
    this._oy = oy;
    this._fw = fw;
    this._fh = fh;
    this._bbox = bbox;

    // Grid
    if (o.showGrid) this._drawGrid(ctx, cw, ch);

    // Glass fill
    if (o.showGlass) this._drawGlass(ctx, ox, oy, fw, fh, scale);

    // Frame pieces
    this._drawFrame(ctx, ox, oy, scale);

    // Corner dots
    this._drawCorners(ctx, ox, oy, scale);

    // Dimensions
    if (o.showDimensions && !o.thumbnailMode) this._drawDimensions(ctx, ox, oy, fw, fh, w, h);

    // Labels
    if (o.showLabels && !o.thumbnailMode) this._drawLabels(ctx, ox, oy, scale);

    // Cut angle indicators
    if (o.showCutAngles && !o.thumbnailMode) this._drawCutAngles(ctx, ox, oy, scale);

    // Accessories
    if (o.showAccessories && this.accessories.length) this._drawAccessories(ctx, ox, oy, scale);

    ctx.restore();
  }

  // ── Frame pieces as thick rectangles ──
  _drawFrame(ctx, ox, oy, scale) {
    var profile = this.assembly.profile;
    var fr = profile ? Math.max(3, Math.min(15, profile.width * scale * 0.8)) : 8;
    var pieces = this.assembly.pieces;
    var bbox = this._bbox;

    // Draw each piece
    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      var x1 = ox + (p.startPoint.x - bbox.minX) * scale;
      var y1 = oy + this._fh - (p.startPoint.y - bbox.minY) * scale;
      var x2 = ox + (p.endPoint.x - bbox.minX) * scale;
      var y2 = oy + this._fh - (p.endPoint.y - bbox.minY) * scale;

      var dx = x2 - x1, dy = y2 - y1;
      var len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1) continue;
      var nx = -dy / len * fr / 2, ny = dx / len * fr / 2;

      // Frame piece as filled polygon
      ctx.fillStyle = this.options.frameColor;
      ctx.beginPath();
      ctx.moveTo(x1 - nx, y1 - ny);
      ctx.lineTo(x1 + nx, y1 + ny);
      ctx.lineTo(x2 + nx, y2 + ny);
      ctx.lineTo(x2 - nx, y2 - ny);
      ctx.closePath();
      ctx.fill();

      // Inner edge
      var fr2 = fr * 0.7;
      var nx2 = -dy / len * fr2 / 2, ny2 = dx / len * fr2 / 2;
      ctx.strokeStyle = this.options.frameHighlight;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x1 + nx2, y1 + ny2);
      ctx.lineTo(x2 + nx2, y2 + ny2);
      ctx.stroke();
    }
  }

  // ── Glass panel ──
  _drawGlass(ctx, ox, oy, fw, fh, scale) {
    var profile = this.assembly.profile;
    var fr = profile ? Math.max(3, Math.min(15, profile.width * scale * 0.8)) : 8;

    var grd = ctx.createLinearGradient(ox + fr, oy + fr, ox + fw - fr, oy + fh - fr);
    grd.addColorStop(0, 'rgba(173,216,230,0.3)');
    grd.addColorStop(0.5, 'rgba(200,235,245,0.2)');
    grd.addColorStop(1, 'rgba(173,216,230,0.3)');
    ctx.fillStyle = grd;
    ctx.fillRect(ox + fr, oy + fr, fw - fr * 2, fh - fr * 2);

    // Reflection
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox + fr + 6, oy + fh - fr - 6);
    ctx.lineTo(ox + fw - fr - 6, oy + fr + 6);
    ctx.stroke();
  }

  // ── Corner points ──
  _drawCorners(ctx, ox, oy, scale) {
    var pts = this.assembly.path.points;
    var bbox = this._bbox;
    ctx.fillStyle = '#e74c3c';
    for (var i = 0; i < pts.length; i++) {
      var px = ox + (pts[i].x - bbox.minX) * scale;
      var py = oy + this._fh - (pts[i].y - bbox.minY) * scale;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Dimension lines ──
  _drawDimensions(ctx, ox, oy, fw, fh, w, h) {
    ctx.fillStyle = '#1a3a5c';
    ctx.font = this.options.dimFont;
    ctx.textAlign = 'center';

    // Width (top)
    ctx.fillText(Math.round(w) + '', ox + fw / 2, oy - 12);
    ctx.strokeStyle = '#1a3a5c';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(ox, oy - 6); ctx.lineTo(ox + fw, oy - 6);
    ctx.stroke();
    // Ticks
    ctx.beginPath();
    ctx.moveTo(ox, oy - 10); ctx.lineTo(ox, oy - 2);
    ctx.moveTo(ox + fw, oy - 10); ctx.lineTo(ox + fw, oy - 2);
    ctx.stroke();

    // Height (left)
    ctx.save();
    ctx.translate(ox - 12, oy + fh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(Math.round(h) + '', 0, 0);
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(ox - 6, oy); ctx.lineTo(ox - 6, oy + fh);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ox - 10, oy); ctx.lineTo(ox - 2, oy);
    ctx.moveTo(ox - 10, oy + fh); ctx.lineTo(ox - 2, oy + fh);
    ctx.stroke();
  }

  // ── Piece labels ──
  _drawLabels(ctx, ox, oy, scale) {
    var pieces = this.assembly.pieces;
    var bbox = this._bbox;
    ctx.font = this.options.labelFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      var mx = ox + ((p.startPoint.x + p.endPoint.x) / 2 - bbox.minX) * scale;
      var my = oy + this._fh - ((p.startPoint.y + p.endPoint.y) / 2 - bbox.minY) * scale;

      // Background
      var text = p.label + ' (' + Math.round(p.cutLength) + ')';
      var tw = ctx.measureText(text).width + 8;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(mx - tw / 2, my - 7, tw, 14);
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(mx - tw / 2, my - 7, tw, 14);

      ctx.fillStyle = '#1a3a5c';
      ctx.fillText(text, mx, my);
    }
  }

  // ── Cut angle arcs ──
  _drawCutAngles(ctx, ox, oy, scale) {
    var pieces = this.assembly.pieces;
    var bbox = this._bbox;
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 1;

    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      if (p.startCutAngle > 0) {
        var px = ox + (p.startPoint.x - bbox.minX) * scale;
        var py = oy + this._fh - (p.startPoint.y - bbox.minY) * scale;
        ctx.beginPath();
        ctx.arc(px, py, 12, 0, p.startCutAngle * Math.PI / 180);
        ctx.stroke();
      }
    }
  }

  // ── Accessories markers ──
  _drawAccessories(ctx, ox, oy, scale) {
    var accs = this.accessories;
    var pieces = this.assembly.pieces;
    var bbox = this._bbox;

    for (var a = 0; a < accs.length; a++) {
      var acc = accs[a];
      var piece = pieces.find(function(p) { return p.label === acc.pieceLabel; });
      if (!piece) continue;

      var t = acc.offset_mm / piece.cutLength;
      var px = ox + (piece.startPoint.x + (piece.endPoint.x - piece.startPoint.x) * t - bbox.minX) * scale;
      var py = oy + this._fh - (piece.startPoint.y + (piece.endPoint.y - piece.startPoint.y) * t - bbox.minY) * scale;

      if (acc.type === 'hinge') {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px - 4, py - 6, 8, 12);
      } else if (acc.type === 'handle') {
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (acc.type === 'lock') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px - 3, py - 3, 6, 6);
      }
    }
  }

  _drawGrid(ctx, cw, ch) {
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 0.5;
    for (var x = 0; x < cw; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke(); }
    for (var y = 0; y < ch; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke(); }
  }
}

// ── Export ──
if (typeof module !== 'undefined' && module.exports) module.exports = { Viewer2D };
else Object.assign(typeof window !== 'undefined' ? window : this, { Viewer2D });
