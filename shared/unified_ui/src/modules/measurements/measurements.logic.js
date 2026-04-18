/* ============================================================
   NouRion — modules/measurements/measurements.logic.js
   ------------------------------------------------------------
   Pure logic for the Measurements module.
   NO DOM, NO localStorage, NO XLSX, NO fetch.

   🚫 القاعدة الحمراء:
   كل الحسابات منقولة حرفياً من pm_server/public/js/07-measurements.js.

   المصادر:
   - row code generation (W01, W02, ...)  → 07-measurements.js:265
   - mAddRow logic                          → 07-measurements.js:265
   - mExcelImport column detection         → 07-measurements.js:333-373
   - cleanRowForSave                        → 07-measurements.js:280
   - _wkn (ISO week number)                 → 07-measurements.js:767
   - _weekRange                              → 07-measurements.js:937
   - _projInRange / _projInMonthRange       → 07-measurements.js:947
   - _buildRegionReport (data shape)        → 07-measurements.js:966
   ============================================================ */

(function (global) {
  'use strict';

  // Reuse ProjectsLogic for status calculations
  var ProjectsLogic = (global.NouRion && global.NouRion.ProjectsLogic) || null;
  if (!ProjectsLogic && typeof require !== 'undefined') {
    try { ProjectsLogic = require('../projects/projects.logic.js'); } catch (e) { /* ignore */ }
  }
  // Reuse SavedLogic for getRegion
  var SavedLogic = (global.NouRion && global.NouRion.SavedLogic) || null;
  if (!SavedLogic && typeof require !== 'undefined') {
    try { SavedLogic = require('../saved/saved.logic.js'); } catch (e) { /* ignore */ }
  }

  // ==========================================================
  // 1. makeRowCode — توليد رمز صف "W01" بتنسيق ثابت
  //    منقول من 07-measurements.js:265 (mAddRow)
  // ==========================================================
  function makeRowCode(index1Based) {
    return 'W' + String(index1Based).padStart(2, '0');
  }

  // ==========================================================
  // 2. createEmptyRow — صف فارغ بنفس بنية الأصل
  //    منقول من 07-measurements.js:265
  // ==========================================================
  function createEmptyRow(index1Based) {
    return {
      code:        makeRowCode(index1Based),
      width:       '',
      height:      '',
      sectionName: '',
      description: '',
      notes:       ''
    };
  }

  // ==========================================================
  // 3. addRow — يأخذ rows[] → يُرجع rows[] جديدة بصف مضاف
  //    منقول من 07-measurements.js:265
  // ==========================================================
  function addRow(rows) {
    var out = (rows || []).slice();
    var n = out.length + 1;
    out.push(createEmptyRow(n));
    return out;
  }

  // ==========================================================
  // 4. delRow — نسخة pure من mDelRow
  // ==========================================================
  function delRow(rows, index) {
    var out = (rows || []).slice();
    out.splice(index, 1);
    return out;
  }

  // ==========================================================
  // 5. ensureMinRows — يملأ القائمة حتى يصل minCount (default 15)
  //    منقول من 07-measurements.js:374-375 (داخل mExcelImport)
  // ==========================================================
  function ensureMinRows(rows, minCount) {
    var out = (rows || []).slice();
    var min = minCount || 15;
    while (out.length < min) {
      out.push(createEmptyRow(out.length + 1));
    }
    return out;
  }

  // ==========================================================
  // 6. countFilledRows — عدّ الصفوف التي فيها width أو height
  //    منقول من 07-measurements.js:263
  // ==========================================================
  function countFilledRows(rows) {
    if (!rows) return 0;
    var n = 0;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].width || rows[i].height) n++;
    }
    return n;
  }

  // ==========================================================
  // 7. cleanRowForSave — تجريد الحقول الإضافية قبل الحفظ
  //    منقول حرفياً من 07-measurements.js:280
  // ==========================================================
  function cleanRowForSave(r) {
    var clean = {
      code:        r.code,
      width:       r.width,
      height:      r.height,
      sectionName: r.sectionName,
      description: r.description,
      notes:       r.notes
    };
    if (r.serverPhoto) clean.serverPhoto = r.serverPhoto;
    return clean;
  }

  function cleanRowsForSave(rows) {
    return (rows || []).map(cleanRowForSave);
  }

  // ==========================================================
  // 8. computeRowArea — مساحة صف بالـ m² (width × height بالملم)
  //    NOTE: ليست في الأصل كدالة منفصلة، لكنها مستخرجة من
  //    الحسابات الضمنية التي يستخدمها _buildRegionReport.
  //    تحويل: (mm × mm) → m² = (w/1000) × (h/1000)
  // ==========================================================
  function computeRowArea(row) {
    var w = parseFloat(row.width) || 0;
    var h = parseFloat(row.height) || 0;
    if (!w || !h) return 0;
    return (w / 1000) * (h / 1000);
  }

  // ==========================================================
  // 9. computeTotalArea — مجموع مساحة كل الصفوف
  // ==========================================================
  function computeTotalArea(rows) {
    if (!rows) return 0;
    var sum = 0;
    for (var i = 0; i < rows.length; i++) sum += computeRowArea(rows[i]);
    return Math.round(sum * 1000) / 1000;
  }

  // ==========================================================
  // 10. computeMeasurementSummary — ملخّص شامل
  // ==========================================================
  function computeMeasurementSummary(rows) {
    if (!rows) return { count: 0, filled: 0, totalArea: 0, withPhotos: 0 };
    var withPhotos = 0;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].serverPhoto || rows[i]._localPhoto || rows[i].photo) withPhotos++;
    }
    return {
      count:      rows.length,
      filled:     countFilledRows(rows),
      totalArea:  computeTotalArea(rows),
      withPhotos: withPhotos
    };
  }

  // ==========================================================
  // 11. detectExcelColumns — كشف أعمدة Excel من أول صف
  //     منقول حرفياً من 07-measurements.js:344-355
  // ==========================================================
  function detectExcelColumns(headerRow) {
    if (!headerRow || !headerRow.length) {
      return { wIdx: -1, hIdx: -1, secIdx: -1, descIdx: -1, noteIdx: -1, codeIdx: -1, dataStart: 0, wC: 0, hC: 1 };
    }
    var hdrs = headerRow.map(function (h) { return (h + '').toLowerCase(); });
    var wIdx    = hdrs.findIndex(function (h) { return h.includes('عرض')   || h.includes('width')   || h.includes('w'); });
    var hIdx    = hdrs.findIndex(function (h) { return h.includes('ارتفاع') || h.includes('height')  || h.includes('h'); });
    var secIdx  = hdrs.findIndex(function (h) { return h.includes('قطاع')   || h.includes('section') || h.includes('type'); });
    var descIdx = hdrs.findIndex(function (h) { return h.includes('وصف')    || h.includes('desc'); });
    var noteIdx = hdrs.findIndex(function (h) { return h.includes('ملاحظ')  || h.includes('note'); });
    var codeIdx = hdrs.findIndex(function (h) { return h.includes('رمز')    || h.includes('code'); });
    var dataStart = (wIdx >= 0 || hIdx >= 0) ? 1 : 0;
    var wC = wIdx >= 0 ? wIdx : 0;
    var hC = hIdx >= 0 ? hIdx : 1;
    return { wIdx: wIdx, hIdx: hIdx, secIdx: secIdx, descIdx: descIdx, noteIdx: noteIdx, codeIdx: codeIdx, dataStart: dataStart, wC: wC, hC: hC };
  }

  // ==========================================================
  // 12. parseExcelData — تحويل aoa من Excel إلى rows
  //     منقول حرفياً من 07-measurements.js:359-373
  //     opts.sections: قائمة sections للمطابقة
  // ==========================================================
  function parseExcelData(aoaData, opts) {
    if (!aoaData || !aoaData.length) return [];
    opts = opts || {};
    var sections = opts.sections || [];
    var cols = detectExcelColumns(aoaData[0] || []);
    var rows = [];

    aoaData.slice(cols.dataStart).forEach(function (row /*, ri*/) {
      var w = parseFloat(row[cols.wC]);
      var h = parseFloat(row[cols.hC]);
      if (!w && !h) return;
      var secRaw = (cols.secIdx >= 0 ? (row[cols.secIdx] + '').trim() : '');
      var secMatch = sections.find(function (s) { return s.name === secRaw; }) || null;
      rows.push({
        code:        cols.codeIdx >= 0 ? (row[cols.codeIdx] || makeRowCode(rows.length + 1)) : makeRowCode(rows.length + 1),
        width:       w || '',
        height:      h || '',
        sectionName: secMatch ? secMatch.name : '',
        description: cols.descIdx >= 0 ? (row[cols.descIdx] || '') : '',
        notes:       cols.noteIdx >= 0 ? (row[cols.noteIdx] || '') : ''
      });
    });

    return rows;
  }

  // ==========================================================
  // 13. _wkn — ISO week number
  //     منقول حرفياً من 07-measurements.js:767
  // ==========================================================
  function _wkn(d) {
    var dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    dt.setUTCDate(dt.getUTCDate() + 4 - (dt.getUTCDay() || 7));
    var ys = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
    return Math.ceil((((dt - ys) / 86400000) + 1) / 7);
  }

  // ==========================================================
  // 14. weekRange — parse "YYYY-Www" → {start, end}
  //     منقول حرفياً من 07-measurements.js:937
  // ==========================================================
  function weekRange(wStr) {
    if (!wStr) return null;
    var parts = String(wStr).split('-W');
    if (parts.length !== 2) return null;
    var y = parseInt(parts[0], 10);
    var w = parseInt(parts[1], 10);
    if (isNaN(y) || isNaN(w)) return null;
    var jan4 = new Date(y, 0, 4);
    var monday = new Date(jan4);
    monday.setDate(jan4.getDate() - ((jan4.getDay() || 7) - 1) + (w - 1) * 7);
    var sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: monday, end: sunday };
  }

  // ==========================================================
  // 15. projInRange — هل المشروع نشط في نطاق تاريخ
  //     منقول حرفياً من 07-measurements.js:947
  // ==========================================================
  function projInRange(p, start, end) {
    var dateStr = p.stageDate || p.contractDate || p.approvalDate || '';
    if (!dateStr) return true;
    var d = new Date(dateStr);
    if (isNaN(d)) return true;
    return d >= start && d <= end;
  }

  // ==========================================================
  // 16. projInMonthRange — هل المشروع في نطاق شهري YYYY-MM
  //     منقول حرفياً من 07-measurements.js:955
  // ==========================================================
  function projInMonthRange(p, fromYM, toYM) {
    var dateStr = p.stageDate || p.contractDate || p.approvalDate || '';
    if (!dateStr) return true;
    var d = new Date(dateStr);
    if (isNaN(d)) return true;
    var ym = d.getFullYear() * 100 + (d.getMonth() + 1);
    var from = fromYM ? parseInt(String(fromYM).replace('-', ''), 10) : -Infinity;
    var to   = toYM   ? parseInt(String(toYM).replace('-', ''),   10) : -Infinity;
    return ym >= from && ym <= to;
  }

  // ==========================================================
  // 17. groupProjectsByRegion — منطق التجميع المستخرج من _buildRegionReport
  //     منقول من 07-measurements.js:968-973
  // ==========================================================
  function groupProjectsByRegion(projects) {
    if (!projects) return {};
    var groups = {};
    for (var i = 0; i < projects.length; i++) {
      var p = projects[i];
      var reg = (SavedLogic ? SavedLogic.getRegion(p) : (p.region || '')) || 'غير محدد';
      if (!groups[reg]) groups[reg] = [];
      groups[reg].push(p);
    }
    return groups;
  }

  // ==========================================================
  // 18. computeRegionTotals — totals لكل region
  //     مستخرج من _buildRegionReport (07-measurements.js:978-794)
  //     يستخدم نفس صيغة الحساب: base = ext > 0 ? ext : contr
  //     prod = base * progress / 100
  //     remain = base - downPayment
  // ==========================================================
  function computeRegionTotals(projects) {
    var groups = groupProjectsByRegion(projects);
    var result = [];
    Object.keys(groups).forEach(function (region) {
      var ps = groups[region];
      var totC = 0, totP = 0, totR = 0;
      ps.forEach(function (p) {
        var ext   = parseFloat(p.extractValue)  || 0;
        var contr = parseFloat(p.contractValue) || 0;
        var base  = ext > 0 ? ext : contr;
        var prog  = parseFloat(p.progress) || 0;
        var prod  = Math.round(base * prog / 100);
        var down  = parseFloat(p.downPayment) || 0;
        var remain = base - down;
        totC += base;
        totP += prod;
        totR += remain;
      });
      result.push({
        region:           region,
        count:            ps.length,
        totalContract:    totC,
        totalProduction:  totP,
        totalRemaining:   totR,
        projects:         ps
      });
    });
    return result;
  }

  // ==========================================================
  // 19. computeWeeklyOverallTotals — totals لكل المشاريع (للـ KPIs أعلى التقرير)
  //     منقول حرفياً من 07-measurements.js:809
  // ==========================================================
  function computeOverallTotals(projects) {
    if (!projects) return { c: 0, p: 0, d: 0 };
    return projects.reduce(function (a, p) {
      var ext   = parseFloat(p.extractValue)  || 0;
      var contr = parseFloat(p.contractValue) || 0;
      var base  = ext > 0 ? ext : contr;
      a.c += base;
      a.p += Math.round(base * (parseFloat(p.progress) || 0) / 100);
      a.d += parseFloat(p.downPayment) || 0;
      return a;
    }, { c: 0, p: 0, d: 0 });
  }

  // ==========================================================
  // 20. generateWeeklyReportNo — مفتاح "WK-YYYY-Www"
  //     منقول من 07-measurements.js:774
  // ==========================================================
  function generateWeeklyReportNo(date) {
    var d = date || new Date();
    var wn = _wkn(d);
    return 'WK-' + d.getFullYear() + '-W' + String(wn).padStart(2, '0');
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================
  var api = {
    // Row management
    makeRowCode:           makeRowCode,
    createEmptyRow:        createEmptyRow,
    addRow:                addRow,
    delRow:                delRow,
    ensureMinRows:         ensureMinRows,
    countFilledRows:       countFilledRows,
    cleanRowForSave:       cleanRowForSave,
    cleanRowsForSave:      cleanRowsForSave,
    // Area calculations
    computeRowArea:        computeRowArea,
    computeTotalArea:      computeTotalArea,
    computeMeasurementSummary: computeMeasurementSummary,
    // Excel parsing
    detectExcelColumns:    detectExcelColumns,
    parseExcelData:        parseExcelData,
    // Date / week helpers
    isoWeekNumber:         _wkn,
    weekRange:             weekRange,
    projInRange:           projInRange,
    projInMonthRange:      projInMonthRange,
    generateWeeklyReportNo:generateWeeklyReportNo,
    // Reports / aggregations
    groupProjectsByRegion: groupProjectsByRegion,
    computeRegionTotals:   computeRegionTotals,
    computeOverallTotals:  computeOverallTotals
  };

  global.NouRion = global.NouRion || {};
  global.NouRion.MeasurementsLogic = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
