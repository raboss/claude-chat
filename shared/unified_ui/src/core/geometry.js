'use strict';
/**
 * GEOMETRY CORE — النواة الهندسية
 * Point2D · Vector2D · Segment2D · Polyline · ClosedShape · BoundingBox · Opening
 */

// ─── VECTOR 2D ──────────────────────────────────────────────
class Vector2D {
  constructor(x=0, y=0) { this.x=x; this.y=y; }
  clone() { return new Vector2D(this.x, this.y); }
  add(v) { return new Vector2D(this.x+v.x, this.y+v.y); }
  sub(v) { return new Vector2D(this.x-v.x, this.y-v.y); }
  scale(s) { return new Vector2D(this.x*s, this.y*s); }
  dot(v) { return this.x*v.x + this.y*v.y; }
  cross(v) { return this.x*v.y - this.y*v.x; }
  get length() { return Math.sqrt(this.x*this.x + this.y*this.y); }
  get lengthSq() { return this.x*this.x + this.y*this.y; }
  normalize() { var l=this.length; return l>0 ? new Vector2D(this.x/l,this.y/l) : new Vector2D(0,0); }
  rotate(rad) { var c=Math.cos(rad),s=Math.sin(rad); return new Vector2D(this.x*c-this.y*s, this.x*s+this.y*c); }
  perpCW() { return new Vector2D(this.y, -this.x); }
  perpCCW() { return new Vector2D(-this.y, this.x); }
  angleTo(v) { return Math.atan2(this.cross(v), this.dot(v)); }
  get angleDeg() { return Math.atan2(this.y, this.x) * 180 / Math.PI; }
  distanceTo(v) { return this.sub(v).length; }
  lerp(v, t) { return new Vector2D(this.x+(v.x-this.x)*t, this.y+(v.y-this.y)*t); }
  equals(v, tol) { tol=tol||0.001; return Math.abs(this.x-v.x)<tol && Math.abs(this.y-v.y)<tol; }
  toJSON() { return {x:+this.x.toFixed(4), y:+this.y.toFixed(4)}; }
  toString() { return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`; }
}

// ─── POINT 2D ───────────────────────────────────────────────
class Point2D extends Vector2D {
  constructor(x=0, y=0, label='') { super(x,y); this.label=label; }
  clone() { return new Point2D(this.x, this.y, this.label); }
  get pos() { return new Vector2D(this.x, this.y); }
}

// ─── BOUNDING BOX ───────────────────────────────────────────
class BoundingBox {
  constructor(minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity) {
    this.minX=minX; this.minY=minY; this.maxX=maxX; this.maxY=maxY;
  }
  get width() { return this.maxX - this.minX; }
  get height() { return this.maxY - this.minY; }
  get center() { return new Point2D((this.minX+this.maxX)/2, (this.minY+this.maxY)/2); }
  get area() { return this.width * this.height; }
  expand(pt) {
    this.minX=Math.min(this.minX, pt.x);
    this.minY=Math.min(this.minY, pt.y);
    this.maxX=Math.max(this.maxX, pt.x);
    this.maxY=Math.max(this.maxY, pt.y);
    return this;
  }
  contains(pt) { return pt.x>=this.minX && pt.x<=this.maxX && pt.y>=this.minY && pt.y<=this.maxY; }
  intersects(other) { return !(other.minX>this.maxX || other.maxX<this.minX || other.minY>this.maxY || other.maxY<this.minY); }
  merge(other) { return new BoundingBox(Math.min(this.minX,other.minX),Math.min(this.minY,other.minY),Math.max(this.maxX,other.maxX),Math.max(this.maxY,other.maxY)); }
  pad(p) { return new BoundingBox(this.minX-p, this.minY-p, this.maxX+p, this.maxY+p); }
  toJSON() { return {minX:this.minX,minY:this.minY,maxX:this.maxX,maxY:this.maxY,width:+this.width.toFixed(2),height:+this.height.toFixed(2)}; }
}

// ─── SEGMENT 2D ─────────────────────────────────────────────
class Segment2D {
  constructor(start, end) { this.start=start; this.end=end; }
  get direction() { return this.end.sub(this.start).normalize(); }
  get normal() { return this.direction.perpCW(); }
  get length() { return this.start.distanceTo(this.end); }
  get midpoint() { return this.start.lerp(this.end, 0.5); }
  get angleDeg() { return this.direction.angleDeg; }
  get bbox() { var b=new BoundingBox(); b.expand(this.start); b.expand(this.end); return b; }

  /** Point at parameter t (0=start, 1=end) */
  pointAt(t) { return this.start.lerp(this.end, t); }

  /** Closest point on segment to given point */
  closestPoint(pt) {
    var d=this.end.sub(this.start);
    var t=Math.max(0, Math.min(1, pt.sub(this.start).dot(d) / d.lengthSq));
    return this.start.add(d.scale(t));
  }

  /** Distance from point to segment */
  distanceToPoint(pt) { return pt.distanceTo(this.closestPoint(pt)); }

  /** Intersect with another segment — returns {point, t1, t2} or null */
  intersect(other) {
    var d1=this.end.sub(this.start), d2=other.end.sub(other.start);
    var denom=d1.cross(d2);
    if(Math.abs(denom)<1e-10) return null; // parallel
    var d=other.start.sub(this.start);
    var t1=d.cross(d2)/denom;
    var t2=d.cross(d1)/denom;
    if(t1>=0 && t1<=1 && t2>=0 && t2<=1) {
      return { point: this.pointAt(t1), t1:t1, t2:t2 };
    }
    return null;
  }

  /** Offset segment by distance (positive = left/CCW) */
  offset(dist) {
    var n=this.normal.scale(dist);
    return new Segment2D(
      new Point2D(this.start.x+n.x, this.start.y+n.y, this.start.label),
      new Point2D(this.end.x+n.x, this.end.y+n.y, this.end.label)
    );
  }

  reverse() { return new Segment2D(this.end.clone(), this.start.clone()); }
  toJSON() { return {start:this.start.toJSON(), end:this.end.toJSON(), length:+this.length.toFixed(2)}; }
}

// ─── POLYLINE ───────────────────────────────────────────────
class Polyline {
  constructor(points, closed) {
    this.points = points || [];
    this.closed = closed || false;
  }

  /** Auto-label points A, B, C... */
  autoLabel() {
    this.points.forEach(function(p,i) { p.label = String.fromCharCode(65+i); });
    return this;
  }

  get segments() {
    var segs=[], pts=this.points, n=pts.length;
    for(var i=0; i<n-1; i++) segs.push(new Segment2D(pts[i], pts[i+1]));
    if(this.closed && n>2) segs.push(new Segment2D(pts[n-1], pts[0]));
    return segs;
  }

  get totalLength() { return this.segments.reduce(function(s,seg){return s+seg.length;},0); }

  get bbox() {
    var b=new BoundingBox();
    this.points.forEach(function(p){b.expand(p);});
    return b;
  }

  get centroid() {
    var sx=0,sy=0,n=this.points.length;
    this.points.forEach(function(p){sx+=p.x;sy+=p.y;});
    return new Point2D(sx/n, sy/n);
  }

  /** Interior angle at vertex i (degrees) */
  angleAt(i) {
    var pts=this.points, n=pts.length;
    if(n<3) return 0;
    var prev=this.closed ? pts[(i-1+n)%n] : (i>0?pts[i-1]:null);
    var curr=pts[i];
    var next=this.closed ? pts[(i+1)%n] : (i<n-1?pts[i+1]:null);
    if(!prev||!next) return 0;
    var v1=prev.sub(curr).normalize();
    var v2=next.sub(curr).normalize();
    var dot=Math.max(-1, Math.min(1, v1.dot(v2)));
    return Math.acos(dot) * 180 / Math.PI;
  }

  /** All interior angles */
  get angles() {
    var self=this, arr=[];
    this.points.forEach(function(_,i){arr.push(self.angleAt(i));});
    return arr;
  }

  /** Offset entire polyline */
  offset(dist) {
    var segs=this.segments;
    var offSegs=segs.map(function(s){return s.offset(dist);});
    // Intersect consecutive offset segments to get new vertices
    var pts=[];
    for(var i=0; i<offSegs.length; i++) {
      var next=(i+1)%offSegs.length;
      if(i<offSegs.length-1 || this.closed) {
        var d1=offSegs[i].end.sub(offSegs[i].start);
        var d2=offSegs[next].end.sub(offSegs[next].start);
        var denom=d1.cross(d2);
        if(Math.abs(denom)>1e-10) {
          var d=offSegs[next].start.sub(offSegs[i].start);
          var t=d.cross(d2)/denom;
          pts.push(new Point2D(offSegs[i].start.x+d1.x*t, offSegs[i].start.y+d1.y*t, this.points[i]?.label||''));
        } else {
          pts.push(offSegs[i].end.clone());
        }
      }
    }
    if(!this.closed && offSegs.length>0) {
      pts.unshift(offSegs[0].start.clone());
      pts.push(offSegs[offSegs.length-1].end.clone());
    }
    return new Polyline(pts, this.closed);
  }

  reverse() {
    return new Polyline(this.points.slice().reverse(), this.closed);
  }

  /** Area (signed — positive=CCW) */
  get signedArea() {
    var pts=this.points, n=pts.length, a=0;
    for(var i=0; i<n; i++) { var j=(i+1)%n; a+=(pts[i].x*pts[j].y - pts[j].x*pts[i].y); }
    return a/2;
  }

  get area() { return Math.abs(this.signedArea); }
  get isClockwise() { return this.signedArea < 0; }

  toJSON() { return {points:this.points.map(function(p){return p.toJSON();}), closed:this.closed, totalLength:+this.totalLength.toFixed(2)}; }
}

// ─── CLOSED SHAPE ───────────────────────────────────────────
class ClosedShape extends Polyline {
  constructor(points) { super(points, true); }

  /** Create rectangle */
  static rect(w, h, origin) {
    origin = origin || new Point2D(0,0);
    return new ClosedShape([
      new Point2D(origin.x,     origin.y,     'A'),
      new Point2D(origin.x+w,   origin.y,     'B'),
      new Point2D(origin.x+w,   origin.y+h,   'C'),
      new Point2D(origin.x,     origin.y+h,   'D'),
    ]);
  }

  /** Create from width/height centered */
  static rectCentered(w, h) {
    return ClosedShape.rect(w, h, new Point2D(-w/2, -h/2));
  }
}

// ─── OPENING ────────────────────────────────────────────────
class Opening {
  constructor(opts) {
    this.id       = Opening._id++;
    this.shape    = opts.shape    || null;  // ClosedShape
    this.type     = opts.type     || 'fixed'; // fixed|sash|door|slide
    this.label    = opts.label    || '';
    this.parent   = opts.parent   || null;  // parent ClosedShape
    this.mullionW = opts.mullionW || 0;     // mullion width if divided
    this.children = [];
  }
  get bbox() { return this.shape ? this.shape.bbox : new BoundingBox(); }
  get width() { return this.bbox.width; }
  get height() { return this.bbox.height; }
  get area() { return this.width * this.height; }
}
Opening._id = 1;

// ─── PANEL ──────────────────────────────────────────────────
class Panel {
  constructor(opts) {
    this.id       = Panel._id++;
    this.opening  = opts.opening  || null;
    this.type     = opts.type     || 'glass';  // glass|solid|louver
    this.width    = opts.width    || 0;
    this.height   = opts.height   || 0;
    this.thickness= opts.thickness|| 6;
    this.rebate   = opts.rebate   || 15;
    this.gap      = opts.gap      || 3;
    this.label    = opts.label    || '';
  }
  get clearWidth() { return Math.max(0, this.width - (this.rebate+this.gap)*2); }
  get clearHeight(){ return Math.max(0, this.height - (this.rebate+this.gap)*2); }
  get area() { return (this.clearWidth * this.clearHeight) / 1e6; } // m²
  toJSON() { return {id:this.id,label:this.label,type:this.type,width:this.width,height:this.height,clearWidth:+this.clearWidth.toFixed(1),clearHeight:+this.clearHeight.toFixed(1),area:+this.area.toFixed(4),thickness:this.thickness}; }
}
Panel._id = 1;

// ─── PROFILE SECTION ────────────────────────────────────────
class ProfileSection {
  constructor(opts) {
    // هوية القطاع
    this.id          = opts.id          || '';
    this.name        = opts.name        || '';       // اسم القطاع
    this.code        = opts.code        || '';       // كود القطاع
    this.description = opts.description || '';       // وصف
    this.system      = opts.system      || '';       // النظام: سحب، شباك، أبواب، واجهات

    // الأبعاد الأساسية (mm)
    this.width       = opts.width       || 50;      // عرض الوجه (face width)
    this.depth       = opts.depth       || 40;      // عمق القطاع (depth)
    this.thickness   = opts.thickness   || 1.5;     // سماكة الجدار
    this.weight      = opts.weight      || 0.6;     // وزن بالمتر (كغ/م)

    // اتجاهات القطاع — أي جهة تواجه أين
    this.faceDir     = opts.faceDir     || 'out';   // الوجه: out=خارجي, in=داخلي
    this.wallSide    = opts.wallSide    || 'back';  // جهة الجدار: back=الخلف
    this.glassSide   = opts.glassSide   || 'front'; // جهة الزجاج: front=الأمام

    // ربات الزجاج (rebate) — المجرى اللي يدخل فيه الزجاج
    this.rebateDepth = opts.rebateDepth || 15;      // عمق الربات (mm)
    this.rebateWidth = opts.rebateWidth || 20;      // عرض الربات (mm)
    this.glassGap    = opts.glassGap    || 3;       // فراغ حراري بين الزجاج والقطاع (mm)

    // طريقة التجميع
    this.assemblyType = opts.assemblyType || 'screw'; // screw=برغي, crimp=كبس, weld=لحام, clip=مشبك
    this.screwSpacing = opts.screwSpacing || 300;     // المسافة بين البراغي (mm)

    // طريقة التركيب بالجدار
    this.mountType    = opts.mountType    || 'frame';  // frame=إطار بالحائط, face=وجه, embed=مدفون
    this.mountDepth   = opts.mountDepth   || 0;        // عمق الدخول بالجدار (mm)

    // نوع الحركة — للضلف
    this.motionType   = opts.motionType   || 'fixed';  // fixed=ثابت, hinge=مفصلات, slide=سلايد, pivot=محوري, tilt=ميلان, fold=طي
    this.hingeSide    = opts.hingeSide    || 'left';   // جهة المفصلات: left/right/top/bottom

    // خصائص تصنيعية
    this.barLength    = opts.barLength    || 6000;     // طول البار الخام (mm) — عادة 6 متر
    this.cutMethod    = opts.cutMethod    || 'saw';    // saw=منشار, router=فريزة
    this.material     = opts.material     || 'aluminum 6063-T5';
    this.color        = opts.color        || '';
    this.finish       = opts.finish       || 'anodized'; // anodized, powder, wood-grain, raw

    // حساب إضافي
    this.momentOfInertia = opts.momentOfInertia || 0;  // عزم القصور (cm⁴) — للحسابات الإنشائية
    this.sectionArea     = opts.sectionArea     || 0;  // مساحة المقطع (mm²)

    this.meta        = opts.meta        || {};
  }

  /** وزن قطعة بطول معين */
  weightForLength(mm) { return (mm / 1000) * this.weight; }

  /** عدد البراغي لطول معين */
  screwCount(mm) { return Math.max(2, Math.ceil(mm / this.screwSpacing) + 1); }

  /** عدد البارات الخام المطلوبة لمجموعة أطوال */
  barsNeeded(lengths) {
    if (!lengths.length) return 0;
    var sorted = lengths.slice().sort(function(a,b){return b-a;});
    var bars = [];
    var barLen = this.barLength;
    sorted.forEach(function(l) {
      var placed = false;
      for (var i = 0; i < bars.length; i++) {
        if (bars[i] >= l) { bars[i] -= l; placed = true; break; }
      }
      if (!placed) bars.push(barLen - l);
    });
    return bars.length;
  }

  toJSON() {
    return {
      id:this.id, name:this.name, code:this.code, description:this.description, system:this.system,
      width:this.width, depth:this.depth, thickness:this.thickness, weight:this.weight,
      faceDir:this.faceDir, wallSide:this.wallSide, glassSide:this.glassSide,
      rebateDepth:this.rebateDepth, rebateWidth:this.rebateWidth, glassGap:this.glassGap,
      assemblyType:this.assemblyType, screwSpacing:this.screwSpacing,
      mountType:this.mountType, mountDepth:this.mountDepth,
      motionType:this.motionType, hingeSide:this.hingeSide,
      barLength:this.barLength, cutMethod:this.cutMethod,
      material:this.material, color:this.color, finish:this.finish,
    };
  }
}

// ─── JOINT RULE ─────────────────────────────────────────────
class JointRule {
  constructor(opts) {
    this.type         = opts.type         || 'miter'; // miter|butt|custom
    this.defaultAngle = opts.defaultAngle || 45;
  }

  /** Calculate cut angles for an interior angle at a vertex */
  cutAngles(interiorAngle) {
    if(this.type === 'miter') {
      var half = interiorAngle / 2;
      return { inEnd: 90-half, outStart: 90-half };
    }
    if(this.type === 'butt') {
      return { inEnd: 0, outStart: 0 }; // square cuts
    }
    return { inEnd: 0, outStart: 0 };
  }

  /** Deduction on incoming segment end */
  deductionIn(profile, interiorAngle) {
    if(this.type === 'miter') {
      var half = (interiorAngle/2) * Math.PI / 180;
      return profile.width / (2 * Math.tan(half));
    }
    if(this.type === 'butt') return profile.width / 2;
    return 0;
  }

  /** Deduction on outgoing segment start */
  deductionOut(profile, interiorAngle) {
    return this.deductionIn(profile, interiorAngle);
  }

  toJSON() { return {type:this.type, defaultAngle:this.defaultAngle}; }
}

// ─── EXPORT ─────────────────────────────────────────────────
if(typeof module!=='undefined'&&module.exports) {
  module.exports = {Vector2D,Point2D,BoundingBox,Segment2D,Polyline,ClosedShape,Opening,Panel,ProfileSection,JointRule};
} else {
  Object.assign(typeof window!=='undefined'?window:this, {Vector2D,Point2D,BoundingBox,Segment2D,Polyline,ClosedShape,Opening,Panel,ProfileSection,JointRule});
}
