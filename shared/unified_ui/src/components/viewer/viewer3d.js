'use strict';
/**
 * VIEWER 3D — Three.js Professional Renderer
 * يعرض القطاع كمقطع حقيقي ممتد (extruded) على المسار
 * يدعم: دوران + زوم + تحريك + تحديد قطعة + push/pull
 *
 * Usage:
 *   var v = new Viewer3D(container);
 *   v.setAssembly(assembly, profile);
 *   v.render();
 */

class Viewer3D {
  constructor(container, options) {
    this.container = container;
    this.assembly = null;
    this.profile = null;
    this.glass = [];
    this.options = Object.assign({
      background: 0xf0f2f5,
      frameColor: 0x6b7b8d,
      glassColor: 0x87ceeb,
      glassOpacity: 0.2,
      selectedColor: 0xff6600,
      enableOrbit: true,
      autoRotate: false,
      showGrid: true,
      showAxes: false,
    }, options || {});

    this._scene = null;
    this._camera = null;
    this._renderer = null;
    this._controls = null;
    this._animId = null;
    this._meshes = [];
    this._raycaster = null;
    this._mouse = null;
    this._selectedPiece = null;
  }

  setAssembly(assembly, profile) {
    this.assembly = assembly;
    this.profile = profile || (assembly ? assembly.profile : null);
  }
  setGlass(glass) { this.glass = glass || []; }

  render() {
    if (!this.assembly || typeof THREE === 'undefined') {
      this.container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:13px">⚠️ Three.js غير محمل</div>';
      return;
    }
    this._cleanup();
    this._initScene();
    this._buildFrame();
    this._buildGlass();
    if (this.options.showGrid) this._addGrid();
    this._fitCamera();
    this._addInteraction();
    this._animate();
  }

  _initScene() {
    var w = this.container.clientWidth || 600;
    var h = this.container.clientHeight || 400;

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(this.options.background);

    this._camera = new THREE.PerspectiveCamera(50, w / h, 1, 100000);

    this._renderer = new THREE.WebGLRenderer({ antialias: true });
    this._renderer.setSize(w, h);
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.innerHTML = '';
    this.container.appendChild(this._renderer.domElement);

    // Lights
    var ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this._scene.add(ambient);

    var dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(500, 800, 600);
    dir.castShadow = true;
    this._scene.add(dir);

    var dir2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dir2.position.set(-400, -200, -400);
    this._scene.add(dir2);

    var hemi = new THREE.HemisphereLight(0xddeeff, 0x333333, 0.3);
    this._scene.add(hemi);

    // Orbit controls
    if (this.options.enableOrbit && typeof THREE.OrbitControls !== 'undefined') {
      this._controls = new THREE.OrbitControls(this._camera, this._renderer.domElement);
      this._controls.enableDamping = true;
      this._controls.dampingFactor = 0.08;
      this._controls.autoRotate = this.options.autoRotate;
      this._controls.autoRotateSpeed = 1.0;
      this._controls.minDistance = 100;
      this._controls.maxDistance = 20000;
    }

    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();
  }

  /** بناء الإطار — كل قطعة = مقطع القطاع الحقيقي ممتد بالاتجاه الصحيح */
  _buildFrame() {
    var pieces = this.assembly.pieces;
    var profile = this.profile;
    if (!pieces.length || !profile) return;

    var bbox = this.assembly.path.bbox;
    var cx = bbox.minX + bbox.width / 2;
    var cy = bbox.minY + bbox.height / 2;

    var pw = profile.width;
    var pd = profile.depth;
    var th = profile.thickness || 1.5;
    var crossSection = this._buildCrossSection(pw, pd, th, profile);

    var alumMat = new THREE.MeshStandardMaterial({
      color: this.options.frameColor,
      metalness: 0.7,
      roughness: 0.3,
    });

    // Enable clipping for miter cuts
    if (this._renderer) this._renderer.localClippingEnabled = true;

    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      var len = p.cutLength;
      if (len <= 0) continue;

      var mesh = this._buildMiteredPiece(crossSection, p, profile, cx, cy);
      mesh.userData = { pieceIndex: i, piece: p, type: 'frame' };
      this._scene.add(mesh);
      this._meshes.push(mesh);
    }

    // علامات الزوايا
    var pts = this.assembly.path.points;
    for (var j = 0; j < pts.length; j++) {
      this._addCornerMarker(pts[j].x - cx, pts[j].y - cy, pd);
    }
  }

  /**
   * بناء شكل المقطع — أنواع متعددة
   * الأنواع: hollow (مجوف) | U (مع ربات) | C | Z | L | T | solid
   * rotation: 0, 90, 180, 270 — تدوير المقطع
   */
  _buildCrossSection(pw, pd, th, profile) {
    var shape = new THREE.Shape();
    var rebate = (profile && profile.rebateDepth) || 0;
    var rw = (profile && profile.rebateWidth) || rebate;
    var sectionType = (profile && profile.meta && profile.meta.sectionType) || (rebate > 0 ? 'U' : 'hollow');
    var rot = (profile && profile.meta && profile.meta.sectionRotation) || 0;

    if (sectionType === 'U') {
      // ╔═══════╗
      // ║       ║  مع مجرى زجاج (rebate) من الأمام
      // ║  ┌─┐  ║
      // ╚══╧═╧══╝
      shape.moveTo(-pw/2, -pd/2);
      shape.lineTo(pw/2, -pd/2);
      shape.lineTo(pw/2, pd/2);
      shape.lineTo(pw/2 - th, pd/2);
      shape.lineTo(pw/2 - th, -pd/2 + th);
      shape.lineTo(pw/2 - th - rw, -pd/2 + th);
      shape.lineTo(pw/2 - th - rw, -pd/2 + th + rebate);
      shape.lineTo(-pw/2 + th + rw, -pd/2 + th + rebate);
      shape.lineTo(-pw/2 + th + rw, -pd/2 + th);
      shape.lineTo(-pw/2 + th, -pd/2 + th);
      shape.lineTo(-pw/2 + th, pd/2);
      shape.lineTo(-pw/2, pd/2);
      shape.closePath();
    }
    else if (sectionType === 'C') {
      // C-shape — مفتوح من جهة
      shape.moveTo(-pw/2, -pd/2);
      shape.lineTo(pw/2, -pd/2);
      shape.lineTo(pw/2, -pd/2 + th);
      shape.lineTo(-pw/2 + th, -pd/2 + th);
      shape.lineTo(-pw/2 + th, pd/2 - th);
      shape.lineTo(pw/2, pd/2 - th);
      shape.lineTo(pw/2, pd/2);
      shape.lineTo(-pw/2, pd/2);
      shape.closePath();
    }
    else if (sectionType === 'Z') {
      // Z-shape
      shape.moveTo(-pw/2, -pd/2);
      shape.lineTo(pw/4, -pd/2);
      shape.lineTo(pw/4, -pd/2 + th);
      shape.lineTo(-pw/2 + th, -pd/2 + th);
      shape.lineTo(-pw/2 + th, pd/2 - th);
      shape.lineTo(-pw/4, pd/2 - th);
      shape.lineTo(-pw/4, pd/2);
      shape.lineTo(-pw/2, pd/2);
      shape.closePath();
      // الجزء الثاني
      var s2 = new THREE.Shape();
      s2.moveTo(pw/2 - th, -pd/2 + th);
      s2.lineTo(pw/2, -pd/2 + th);
      s2.lineTo(pw/2, pd/2);
      s2.lineTo(-pw/4, pd/2);
      s2.lineTo(-pw/4, pd/2 - th);
      s2.lineTo(pw/2 - th, pd/2 - th);
      s2.closePath();
      // Z صعب بشكل واحد — نرجع لـ C
      shape = new THREE.Shape();
      shape.moveTo(-pw/2, -pd/2);
      shape.lineTo(0, -pd/2);
      shape.lineTo(0, -pd/2 + th);
      shape.lineTo(-pw/2 + th, -pd/2 + th);
      shape.lineTo(-pw/2 + th, pd/2 - th);
      shape.lineTo(0, pd/2 - th);
      shape.lineTo(0, pd/2);
      shape.lineTo(-pw/2, pd/2);
      shape.closePath();
    }
    else if (sectionType === 'L') {
      // L-shape — زاوية
      shape.moveTo(-pw/2, -pd/2);
      shape.lineTo(pw/2, -pd/2);
      shape.lineTo(pw/2, -pd/2 + th);
      shape.lineTo(-pw/2 + th, -pd/2 + th);
      shape.lineTo(-pw/2 + th, pd/2);
      shape.lineTo(-pw/2, pd/2);
      shape.closePath();
    }
    else if (sectionType === 'T') {
      // T-shape — قاطع
      var fw = pw * 0.4; // عرض الفلانج
      shape.moveTo(-pw/2, -pd/2);
      shape.lineTo(pw/2, -pd/2);
      shape.lineTo(pw/2, -pd/2 + th);
      shape.lineTo(fw/2, -pd/2 + th);
      shape.lineTo(fw/2, pd/2);
      shape.lineTo(-fw/2, pd/2);
      shape.lineTo(-fw/2, -pd/2 + th);
      shape.lineTo(-pw/2, -pd/2 + th);
      shape.closePath();
    }
    else if (sectionType === 'solid') {
      // مصمت بالكامل
      shape.moveTo(-pw/2, -pd/2);
      shape.lineTo(pw/2, -pd/2);
      shape.lineTo(pw/2, pd/2);
      shape.lineTo(-pw/2, pd/2);
      shape.closePath();
    }
    else {
      // hollow — مربع مجوف (الافتراضي)
      shape.moveTo(-pw/2, -pd/2);
      shape.lineTo(pw/2, -pd/2);
      shape.lineTo(pw/2, pd/2);
      shape.lineTo(-pw/2, pd/2);
      shape.closePath();
      var hole = new THREE.Path();
      hole.moveTo(-pw/2 + th, -pd/2 + th);
      hole.lineTo(pw/2 - th, -pd/2 + th);
      hole.lineTo(pw/2 - th, pd/2 - th);
      hole.lineTo(-pw/2 + th, pd/2 - th);
      hole.closePath();
      shape.holes.push(hole);
    }

    return shape;
  }

  /**
   * بناء قطعة مع قص 45° عند الأطراف (miter)
   * يقص نهايات القطعة بزاوية باستخدام clipping planes
   */
  _buildMiteredPiece(crossSection, piece, profile, cx, cy) {
    var len = piece.cutLength;
    var pw = profile.width;
    var pd = profile.depth;

    // نمد القطعة أطول شوي من القص — ثم نقصها بـ clipping planes
    var extra = pw; // إضافة بحجم عرض القطاع من كل طرف
    var geo = new THREE.ExtrudeGeometry(crossSection, {
      steps: 1, depth: len + extra * 2, bevelEnabled: false
    });

    var alumMat = new THREE.MeshStandardMaterial({
      color: this.options.frameColor,
      metalness: 0.7,
      roughness: 0.3,
      side: THREE.DoubleSide,
    });

    // قص بالـ clipping planes عند كل طرف
    var startAngle = piece.startCutAngle * Math.PI / 180;
    var endAngle = piece.endCutAngle * Math.PI / 180;

    if (startAngle > 0 || endAngle > 0) {
      // Clipping planes — تقص الأطراف بزاوية 45
      var planes = [];
      if (startAngle > 0) {
        // مستوى القص عند البداية
        var normal1 = new THREE.Vector3(Math.cos(startAngle), Math.sin(startAngle), 0);
        planes.push(new THREE.Plane(normal1, 0));
      }
      if (endAngle > 0) {
        var normal2 = new THREE.Vector3(-Math.cos(endAngle), Math.sin(endAngle), 0);
        planes.push(new THREE.Plane(normal2, -len));
      }
      alumMat.clippingPlanes = planes;
      alumMat.clipShadows = true;
      if (this._renderer) this._renderer.localClippingEnabled = true;
    }

    var mesh = new THREE.Mesh(geo, alumMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Matrix لوضع القطعة بالمكان والاتجاه الصحيح
    var dx = piece.direction.x;
    var dy = piece.direction.y;
    var sx = piece.startPoint.x - cx;
    var sy = piece.startPoint.y - cy;

    var mat4 = new THREE.Matrix4();
    mat4.set(
      -dy,  0,  dx,  sx - dx * extra,
       dx,  0,  dy,  sy - dy * extra,
        0,  1,   0,   0,
        0,  0,   0,   1
    );
    mesh.applyMatrix4(mat4);

    return mesh;
  }

  _addCornerMarker(x, y, pd) {
    var geo = new THREE.SphereGeometry(2, 8, 8);
    var mat = new THREE.MeshBasicMaterial({ color: 0xe74c3c });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, pd / 2 + 3);
    this._scene.add(mesh);
    this._meshes.push(mesh);
  }

  /** بناء الزجاج — لوح شفاف */
  _buildGlass() {
    if (!this.glass.length && typeof GlassCalculator !== 'undefined') {
      this.glass = GlassCalculator.calculate(this.assembly);
    }
    var bbox = this.assembly.path.bbox;
    var cx = bbox.minX + bbox.width / 2;
    var cy = bbox.minY + bbox.height / 2;

    var glassMat = new THREE.MeshPhysicalMaterial({
      color: this.options.glassColor,
      transparent: true,
      opacity: this.options.glassOpacity,
      roughness: 0.02,
      metalness: 0,
      side: THREE.DoubleSide,
    });

    for (var i = 0; i < this.glass.length; i++) {
      var g = this.glass[i];
      var geo = new THREE.PlaneGeometry(g.width, g.height);
      var mesh = new THREE.Mesh(geo, glassMat);
      mesh.position.set(0, 0, 0);
      mesh.userData = { type: 'glass', glassIndex: i };
      this._scene.add(mesh);
      this._meshes.push(mesh);
    }
  }

  _addGrid() {
    var bbox = this.assembly.path.bbox;
    var size = Math.max(bbox.width, bbox.height) * 1.5;
    var divisions = 20;
    var grid = new THREE.GridHelper(size, divisions, 0xbbbbbb, 0xdddddd);
    // الشبكة خلف الإطار
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -(this.profile ? this.profile.depth : 40);
    this._scene.add(grid);
  }

  _fitCamera() {
    if (!this.assembly.path) return;
    var bbox = this.assembly.path.bbox;
    var maxDim = Math.max(bbox.width, bbox.height);
    // كاميرا بزاوية أمامية مائلة قليلاً — تعطي منظور واقعي
    var dist = maxDim * 1.2;
    this._camera.position.set(0, -dist * 0.3, dist * 0.9);
    this._camera.lookAt(0, 0, 0);
    this._camera.up.set(0, 1, 0);
    if (this._controls) {
      this._controls.target.set(0, 0, 0);
      this._controls.minDistance = maxDim * 0.3;
      this._controls.maxDistance = maxDim * 5;
    }
  }

  /** تفاعل — نقر لتحديد قطعة */
  _addInteraction() {
    var self = this;
    this._renderer.domElement.addEventListener('click', function(e) {
      var rect = self._renderer.domElement.getBoundingClientRect();
      self._mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      self._mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      self._raycaster.setFromCamera(self._mouse, self._camera);

      var intersects = self._raycaster.intersectObjects(self._meshes);
      // Reset all
      self._meshes.forEach(function(m) {
        if (m.userData.type === 'frame' && m.material && m.material.emissive) {
          m.material.emissive.setHex(0x000000);
        }
      });
      self._selectedPiece = null;

      if (intersects.length > 0) {
        var obj = intersects[0].object;
        if (obj.userData.type === 'frame') {
          obj.material.emissive.setHex(0x332200);
          self._selectedPiece = obj.userData.piece;
          // Dispatch event
          if (self.onPieceSelected) self.onPieceSelected(obj.userData.piece, obj.userData.pieceIndex);
        }
      }
    });
  }

  _animate() {
    var self = this;
    function loop() {
      self._animId = requestAnimationFrame(loop);
      if (self._controls) self._controls.update();
      if (self._renderer && self._scene && self._camera) {
        self._renderer.render(self._scene, self._camera);
      }
    }
    loop();
  }

  _cleanup() {
    if (this._animId) cancelAnimationFrame(this._animId);
    this._meshes.forEach(function(m) {
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        if (m.material.dispose) m.material.dispose();
      }
    });
    this._meshes = [];
    if (this._renderer) this._renderer.dispose();
    if (this._controls) this._controls.dispose();
    this._scene = null;
    this._camera = null;
    this._renderer = null;
    this._controls = null;
  }

  dispose() { this._cleanup(); this.container.innerHTML = ''; }

  resize() {
    if (!this._renderer || !this._camera) return;
    var w = this.container.clientWidth;
    var h = this.container.clientHeight;
    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(w, h);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) module.exports = { Viewer3D };
else Object.assign(typeof window !== 'undefined' ? window : this, { Viewer3D });
