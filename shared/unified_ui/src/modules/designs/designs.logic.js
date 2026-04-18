/* ============================================================
   NouRion — modules/designs/designs.logic.js
   ------------------------------------------------------------
   Pure logic for the Designs module.
   NO DOM, NO canvas, NO THREE.js, NO localStorage.

   🚫 القاعدة الحمراء:
   كل الحسابات منقولة حرفياً من pm_server/public/js/16-designs.js.

   هذا الـ module مختصر لأن معظمه UI wrapper حول core/assembly.js
   و core/manufacturing.js. الـ logic النقي يحتوي على:
   - فلترة المقاسات النشطة
   - تجميع بحسب القطاع
   - معرّفات الأشكال
   - helper للـ engine

   المصادر:
   - _dsSelectProject  → 16-designs.js:428-434
   - _dsRunEngine      → 16-designs.js:615-623
   - default profile   → 16-designs.js:609-613
   - frame code fallback → 16-designs.js:472
   ============================================================ */

(function (global) {
  'use strict';

  // ==========================================================
  // 1. CONSTANTS
  // ==========================================================
  var DEFAULT_PROFILE_ID = 'cas-frame-50';
  var DEFAULT_JOINT_TYPE = 'miter';
  var JOINT_TYPES = ['miter', 'butt', 'cope'];

  // ==========================================================
  // 2. filterActiveMeasurements — فقط الصفوف التي فيها width & height
  //    منقول من 16-designs.js:428
  // ==========================================================
  function filterActiveMeasurements(measRows) {
    if (!measRows) return [];
    return measRows.filter(function (r) {
      return (+r.width > 0) && (+r.height > 0);
    });
  }

  // ==========================================================
  // 3. groupBySection — تجميع المقاسات حسب sectionName
  //    منقول حرفياً من 16-designs.js:430-434
  // ==========================================================
  function groupBySection(measRows) {
    if (!measRows) return {};
    var sections = {};
    measRows.forEach(function (r) {
      var sn = r.sectionName || 'غير محدد';
      if (!sections[sn]) sections[sn] = [];
      sections[sn].push(r);
    });
    return sections;
  }

  // ==========================================================
  // 4. buildSectionsTree — مصفوفة منظَّمة للـ view (section → rows with global indices)
  // ==========================================================
  function buildSectionsTree(measRows) {
    var active = filterActiveMeasurements(measRows);
    var groups = groupBySection(active);
    var tree = [];
    var globalIdx = 0;
    Object.keys(groups).forEach(function (sn) {
      var rows = groups[sn].map(function (r) {
        return {
          globalIndex: globalIdx++,
          code:    r.code || ('W' + String(globalIdx).padStart(2, '0')),
          width:   +r.width,
          height:  +r.height,
          sectionName: sn,
          description: r.description || '',
          notes:       r.notes || '',
          areaM2:      Math.round((r.width / 1000) * (r.height / 1000) * 1000) / 1000
        };
      });
      tree.push({
        sectionName: sn,
        count: rows.length,
        rows: rows
      });
    });
    return tree;
  }

  // ==========================================================
  // 5. frameCodeFor — توليد رمز صف إذا لم يكن موجوداً
  //    منقول من 16-designs.js:472
  // ==========================================================
  function frameCodeFor(row, globalIndex) {
    return row.code || ('W' + String(globalIndex + 1).padStart(2, '0'));
  }

  // ==========================================================
  // 6. computeFrameSummary — KPIs لمجموعة مقاسات مشروع
  // ==========================================================
  function computeFrameSummary(measRows) {
    var active = filterActiveMeasurements(measRows);
    if (!active.length) return { count: 0, sections: 0, totalAreaM2: 0, maxW: 0, maxH: 0 };

    var totalArea = 0;
    var maxW = 0;
    var maxH = 0;
    active.forEach(function (r) {
      var w = +r.width;
      var h = +r.height;
      totalArea += (w / 1000) * (h / 1000);
      if (w > maxW) maxW = w;
      if (h > maxH) maxH = h;
    });

    return {
      count:       active.length,
      sections:    Object.keys(groupBySection(active)).length,
      totalAreaM2: Math.round(totalArea * 1000) / 1000,
      maxW:        maxW,
      maxH:        maxH
    };
  }

  // ==========================================================
  // 7. findFrameByCode — لإيجاد fram specific
  // ==========================================================
  function findFrameByCode(measRows, code) {
    var active = filterActiveMeasurements(measRows);
    for (var i = 0; i < active.length; i++) {
      if (active[i].code === code) return { index: i, frame: active[i] };
    }
    return null;
  }

  // ==========================================================
  // 8. validateFrameDimensions — تحقّق من سلامة الأبعاد قبل الـ engine
  // ==========================================================
  function validateFrameDimensions(width, height, opts) {
    opts = opts || {};
    var minDim = opts.minDim || 200;
    var maxDim = opts.maxDim || 10000;
    var errors = [];

    var w = parseFloat(width);
    var h = parseFloat(height);

    if (isNaN(w) || w <= 0) errors.push('العرض غير صالح');
    else if (w < minDim) errors.push('العرض أقل من الحد الأدنى (' + minDim + ' مم)');
    else if (w > maxDim) errors.push('العرض أكبر من الحد الأقصى (' + maxDim + ' مم)');

    if (isNaN(h) || h <= 0) errors.push('الارتفاع غير صالح');
    else if (h < minDim) errors.push('الارتفاع أقل من الحد الأدنى (' + minDim + ' مم)');
    else if (h > maxDim) errors.push('الارتفاع أكبر من الحد الأقصى (' + maxDim + ' مم)');

    return { valid: errors.length === 0, errors: errors };
  }

  // ==========================================================
  // 9. prepareEngineInput — تحضير المدخلات للـ SweepEngine
  //    منقول من 16-designs.js:615-623 (pure subset)
  //    الأصل كان يعتمد على ClosedShape.rect و SweepEngine.sweep
  //    هذه الدالة تُحضّر البيانات فقط، لا تُشغّل الـ engine
  // ==========================================================
  function prepareEngineInput(width, height, profileId, jointType) {
    var validation = validateFrameDimensions(width, height);
    if (!validation.valid) {
      return { valid: false, errors: validation.errors };
    }
    return {
      valid:     true,
      width:     +width,
      height:    +height,
      profileId: profileId || DEFAULT_PROFILE_ID,
      jointType: jointType || DEFAULT_JOINT_TYPE,
      shape:     'rectangle'
    };
  }

  // ==========================================================
  // 10. Bounding box for DXF shape (من _dsDrawDXFShapes pattern)
  // ==========================================================
  function computeShapesBounds(shapes) {
    if (!shapes || !shapes.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    var minX =  Infinity, minY =  Infinity;
    var maxX = -Infinity, maxY = -Infinity;
    shapes.forEach(function (shape) {
      var pts = shape.points || shape.vertices || [];
      pts.forEach(function (p) {
        var x = p.x != null ? p.x : p[0];
        var y = p.y != null ? p.y : p[1];
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      });
    });
    if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    return {
      minX: minX, minY: minY, maxX: maxX, maxY: maxY,
      width:  maxX - minX,
      height: maxY - minY
    };
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================
  var api = {
    // Constants
    DEFAULT_PROFILE_ID:       DEFAULT_PROFILE_ID,
    DEFAULT_JOINT_TYPE:       DEFAULT_JOINT_TYPE,
    JOINT_TYPES:              JOINT_TYPES,
    // Filters
    filterActiveMeasurements: filterActiveMeasurements,
    groupBySection:           groupBySection,
    buildSectionsTree:        buildSectionsTree,
    // Frame helpers
    frameCodeFor:             frameCodeFor,
    findFrameByCode:          findFrameByCode,
    // Calculations
    computeFrameSummary:      computeFrameSummary,
    validateFrameDimensions:  validateFrameDimensions,
    prepareEngineInput:       prepareEngineInput,
    // DXF
    computeShapesBounds:      computeShapesBounds
  };

  global.NouRion = global.NouRion || {};
  global.NouRion.DesignsLogic = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
