// ═══════════════════════════════════════════════════════════════
// 14-draw.js  — NourMetal Draw v3  (RA Workshop style)
// ═══════════════════════════════════════════════════════════════
'use strict';

// ── ألوان RAL الشائعة للألمنيوم ─────────────────────────────
const _RAL = [
  { code:'9010', name:'Pure White',       hex:'#F4F4F4' },
  { code:'9016', name:'Traffic White',    hex:'#F1F0EB' },
  { code:'9003', name:'Signal White',     hex:'#ECECE7' },
  { code:'9001', name:'Cream',            hex:'#FDF4E3' },
  { code:'1013', name:'Oyster White',     hex:'#EAE6CA' },
  { code:'7035', name:'Light Grey',       hex:'#CBD0CC' },
  { code:'7015', name:'Slate Grey',       hex:'#5B6469' },
  { code:'7016', name:'Anthracite Grey',  hex:'#383E42' },
  { code:'7021', name:'Black Grey',       hex:'#2B3235' },
  { code:'9005', name:'Jet Black',        hex:'#0A0A0A' },
  { code:'9006', name:'White Aluminium',  hex:'#A8A9AD' },
  { code:'9007', name:'Grey Aluminium',   hex:'#878681' },
  { code:'8017', name:'Chocolate Brown',  hex:'#442F29' },
  { code:'8019', name:'Grey Brown',       hex:'#3D3635' },
  { code:'6005', name:'Moss Green',       hex:'#2F4538' },
  { code:'6009', name:'Fir Green',        hex:'#27352A' },
  { code:'5010', name:'Gentian Blue',     hex:'#1F447C' },
  { code:'5015', name:'Sky Blue',         hex:'#2278AC' },
  { code:'3000', name:'Flame Red',        hex:'#AB2524' },
  { code:'1019', name:'Grey Beige',       hex:'#9D9282' },
  { code:'1035', name:'Pearl Beige',      hex:'#6A5D4D' },
];

// ── كتالوج الزجاج ───────────────────────────────────────────
const _GLASS_CAT = [
  { code:'SGL-4',      name:'أحادي 4مم',         config:'4',           thick:4,  color:'rgba(185,228,238,0.72)' },
  { code:'SGL-5',      name:'أحادي 5مم',         config:'5',           thick:5,  color:'rgba(185,228,238,0.72)' },
  { code:'SGL-6',      name:'أحادي 6مم',         config:'6',           thick:6,  color:'rgba(185,228,238,0.72)' },
  { code:'SGL-8',      name:'أحادي 8مم',         config:'8',           thick:8,  color:'rgba(185,228,238,0.72)' },
  { code:'DGL-4-12-4', name:'مزدوج 4+12+4',      config:'4+12+4',      thick:20, color:'rgba(185,228,238,0.72)' },
  { code:'DGL-4-16-4', name:'مزدوج 4+16+4',      config:'4+16+4',      thick:24, color:'rgba(185,228,238,0.72)' },
  { code:'DGL-4-16-6', name:'مزدوج 4+16+6',      config:'4+16+6',      thick:26, color:'rgba(185,228,238,0.72)' },
  { code:'DGL-6-16-6', name:'مزدوج 6+16+6',      config:'6+16+6',      thick:28, color:'rgba(185,228,238,0.72)' },
  { code:'TGL-4-12-4', name:'ثلاثي 4+12+4+12+4', config:'4+12+4+12+4', thick:36, color:'rgba(185,228,238,0.72)' },
  { code:'LAM-33',     name:'لامينيت 33.1',       config:'33.1',        thick:7,  color:'rgba(185,228,238,0.72)' },
  { code:'LAM-44',     name:'لامينيت 44.2',       config:'44.2',        thick:10, color:'rgba(185,228,238,0.72)' },
];

// ── لوحة ألوان الزجاج ────────────────────────────────────────
const _GLASS_COLORS = [
  { id:'clear',   name:'شفاف',       color:'rgba(185,228,238,0.72)' },
  { id:'blue',    name:'أزرق',       color:'rgba(100,155,220,0.70)' },
  { id:'green',   name:'أخضر',       color:'rgba(120,195,135,0.68)' },
  { id:'grey',    name:'رمادي',      color:'rgba(155,162,170,0.72)' },
  { id:'bronze',  name:'برونزي',     color:'rgba(190,148,100,0.68)' },
  { id:'solar',   name:'سولار',      color:'rgba(80,105,135,0.80)'  },
  { id:'mirror',  name:'مرآة',       color:'rgba(200,212,220,0.86)' },
  { id:'opal',    name:'أوبال أبيض', color:'rgba(238,238,238,0.90)' },
];

// يحسب لون أفتح للبركلوز والحدود الداخلية
function _ralLighter(hex, pct) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, ((n>>16)&0xff) + Math.round(pct*255));
  const g = Math.min(255, ((n>>8) &0xff) + Math.round(pct*255));
  const b = Math.min(255, ( n     &0xff) + Math.round(pct*255));
  return '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function _ralDarker(hex, pct) { return _ralLighter(hex, -pct); }

// ── الألوان الثابتة (بغض النظر عن RAL) ──────────────────────
const _DC = {
  glass      : 'rgba(185,228,238,0.72)',
  crosshair  : '#7888cc',
  dim        : '#333',
  dimTxt     : '#333',
  grid       : '#dde0e8',
  gridFaint  : '#eceef3',
  bg         : '#f4f5f7',
  panelBg    : '#ffffff',
  sectionHdr : '#f0f1f5',
  border     : '#d0d3de',
  selected   : '#22cc44',          // الإطار المحدد
};

// ── الحالة ──────────────────────────────────────────────────
let _dw = {
  // الفتحة الحالية
  type    : 'fixed',
  pid     : null,
  name    : 'Frame',
  ref     : 'F1',
  panelType: 'Fixed',
  qty     : 1,
  W       : 1000,
  H       : 1500,
  // قطاعات
  deco    : 40,
  sec     : 23,
  bead    : 22,
  bite    : 8,
  corner  : 45,
  profileSystem: 'PRD 2011.11',
  profileCode  : 'PRD254-110',
  color        : '9007',       // كود RAL
  ralHex       : '#878681',    // hex تبع RAL
  // عرض
  showDims     : true,
  showDecosDim : true,   // مقاس الديكور (الخارجي)
  showSectionDim: true,  // مقاس الحلق (الداخلي)
  showGrid : true,
  viewMode : 'Inside',    // Inside / Outside
  zoom     : 1,
  panX     : 0,
  panY     : 0,
  // DOM
  cv       : null,
  ctx      : null,
  selected : 'frame',   // 'frame' | 'bead' | 'glass'
  // بيانات الزجاج
  glassCode    : 'DGL-4-16-4',
  glassThick   : 24,
  glassColor   : 'rgba(185,228,238,0.72)',
  // اسم الحلق
  profileName  : 'حلق سرايا',
  beadName     : 'بركلوز 22مم',
  profileId    : '',     // id القطاع المختار من الكتالوج
  // تقسيمات الفتحة
  divW         : 1,      // عدد التقسيمات الأفقية (عدد الألواح العرضية)
  divH         : 1,      // عدد التقسيمات الرأسية
  tBarW        : 28,     // عرض عارضة T بالواجهة (قابل للتغيير)
  panelWidths  : [],     // تخصيص عرض كل لوح [null=تلقائي, رقم=مثبت]
  panelHeights : [],     // تخصيص ارتفاع كل لوح
  overlapH     : true,   // true=أفقي كامل العرض، false=رأسي كامل الارتفاع
  doorBottom   : true,   // false = باب (بلكلوز 3 أطراف فقط، بدون أسفل)
  vFull        : true,   // true = القواطع الرأسية كاملة، false = الأفقية كاملة
  glassDed     : 8,      // خصم الزجاج بالمم
  activeTool   : 'select', // select | splitH | splitV
  // أنواع الدرف لكل لوح (مصفوفة ثنائية [row][col])
  panelSashTypes : [],   // 'fixed'|'casementL'|'casementR'|'slidingL'|'slidingR'|'awning'|'tiltIn'
  // مناطق النقر (تُحدَّث بعد كل رسم)
  _z : null,
  // نموذج البيانات الكامل (يُحدَّث بعد كل رسم)
  _model : null,
  // مناطق عارضات T (للسحب) — تُحدَّث بعد كل رسم
  _tBarZones : [],   // [{axis,index,x,y,w,h}]
  // مناطق الألواح (للنقر) — تُحدَّث بعد كل رسم
  _panelZones : [],  // [{row,col,x,y,w,h}]
  // مناطق الأبعاد (للنقر المزدوج) — تُحدَّث بعد كل رسم
  _dimZones : [],    // [{x,y,w,h,field,value,axis}]
  // حالة السحب
  _dragging : null,  // {axis,index,startMouse,startSizes}
  // معرف الرسم المحفوظ الحالي
  drawingId : null,
};

// ── بناء نموذج بيانات كامل (يُستدعى قبل كل رسم) ─────────────
function _dwgBuildModel() {
  const W = _dw.W, H = _dw.H;
  const sec = _dw.sec || 23;
  const deco = _dw.deco || 40;
  const selProf = _dwProfiles.find(p => p.id === _dw.profileId);
  const tblRaw = selProf && selProf.tBarLines && selProf.tBarLines.length
    ? selProf.tBarLines.filter(l => (l.wW||l.w||0) > 0) : null;
  const tBarW = tblRaw
    ? tblRaw.reduce((s,l) => s + (l.wW||l.w||0), 0)
    : (_dw.tBarW || 28);
  const divW = Math.max(1, _dw.divW || 1);
  const divH = Math.max(1, _dw.divH || 1);
  const bkz = _dw.bead || 22;
  const glassDed = _dw.glassDed || 8;
  const vFull = _dw.vFull !== false;

  // === FRAME DIMENSIONS ===
  const innerW = W - 2 * sec;
  const innerH = H - 2 * sec;

  // === FRAME SIDES (4 pieces, each with 45 degree miter cuts) ===
  const frameSides = [
    { id:'frame_top', type:'frame', name:'حلق علوي', orientation:'horizontal',
      x: 0, y: 0, outerLength: W, innerLength: innerW,
      width: sec, cutStart:'miter45', cutEnd:'miter45' },
    { id:'frame_bottom', type:'frame', name:'حلق سفلي', orientation:'horizontal',
      x: 0, y: H - sec, outerLength: W, innerLength: innerW,
      width: sec, cutStart:'miter45', cutEnd:'miter45' },
    { id:'frame_left', type:'frame', name:'حلق أيسر', orientation:'vertical',
      x: 0, y: 0, outerLength: H, innerLength: innerH,
      width: sec, cutStart:'miter45', cutEnd:'miter45' },
    { id:'frame_right', type:'frame', name:'حلق أيمن', orientation:'vertical',
      x: W - sec, y: 0, outerLength: H, innerLength: innerH,
      width: sec, cutStart:'miter45', cutEnd:'miter45' }
  ];

  // === PANEL SIZES (constraint-based) ===
  const totalVBars = (divW - 1) * tBarW;
  const totalHBars = (divH - 1) * tBarW;
  const availW = innerW - totalVBars;
  const availH = innerH - totalHBars;

  const pWidths = _calcConstrainedSizes(availW, divW, _dw.panelWidths);
  const pHeights = _calcConstrainedSizes(availH, divH, _dw.panelHeights);

  // === T-BARS (vertical and horizontal) ===
  const tBars = [];
  // Also keep legacy vBars/hBars for backward compatibility
  const vBars = [];
  const hBars = [];

  // Vertical T-bars
  let xAccum = sec;
  for (let c = 0; c < divW - 1; c++) {
    xAccum += pWidths[c];
    if (vFull) {
      // Vertical is FULL piece
      tBars.push({
        id: 'tbar_v_' + c, type: 'mullion', name: 'قاطع رأسي ' + (c+1),
        orientation: 'vertical', isFull: true,
        x: xAccum, y: sec, w: tBarW, h: innerH, length: innerH,
        cutStart: 'miter45', cutEnd: 'miter45', index: c
      });
      vBars.push({ x: xAccum, y: sec, w: tBarW, h: innerH, index: c });
    } else {
      // Vertical is SPLIT by horizontal bars
      let yStart = sec;
      for (let r = 0; r < divH; r++) {
        const segH = pHeights[r];
        if (segH > 0) {
          tBars.push({
            id: 'tbar_v_' + c + '_seg_' + r, type: 'mullion',
            name: 'قاطع رأسي ' + (c+1) + ' جزء ' + (r+1),
            orientation: 'vertical', isFull: false, segment: r,
            x: xAccum, y: yStart, w: tBarW, h: segH, length: segH,
            cutStart: r === 0 ? 'miter45' : 'straight',
            cutEnd: r === divH-1 ? 'miter45' : 'straight', index: c
          });
        }
        yStart += segH + (r < divH - 1 ? tBarW : 0);
      }
      vBars.push({ x: xAccum, y: sec, w: tBarW, h: innerH, index: c });
    }
    xAccum += tBarW;
  }

  // Horizontal T-bars
  let yAccum = sec;
  for (let r = 0; r < divH - 1; r++) {
    yAccum += pHeights[r];
    if (!vFull) {
      // Horizontal is FULL piece
      tBars.push({
        id: 'tbar_h_' + r, type: 'mullion', name: 'قاطع أفقي ' + (r+1),
        orientation: 'horizontal', isFull: true,
        x: sec, y: yAccum, w: innerW, h: tBarW, length: innerW,
        cutStart: 'miter45', cutEnd: 'miter45', index: r
      });
      hBars.push({ x: sec, y: yAccum, w: innerW, h: tBarW, index: r });
    } else {
      // Horizontal is SPLIT by vertical bars
      let xStart = sec;
      for (let c = 0; c < divW; c++) {
        const segW = pWidths[c];
        if (segW > 0) {
          tBars.push({
            id: 'tbar_h_' + r + '_seg_' + c, type: 'mullion',
            name: 'قاطع أفقي ' + (r+1) + ' جزء ' + (c+1),
            orientation: 'horizontal', isFull: false, segment: c,
            x: xStart, y: yAccum, w: segW, h: tBarW, length: segW,
            cutStart: c === 0 ? 'miter45' : 'straight',
            cutEnd: c === divW-1 ? 'miter45' : 'straight', index: r
          });
        }
        xStart += segW + (c < divW - 1 ? tBarW : 0);
      }
      hBars.push({ x: sec, y: yAccum, w: innerW, h: tBarW, index: r });
    }
    yAccum += tBarW;
  }

  // === PANELS (openings) + GLASS + BEADS ===
  const panels = [];
  const glassPieces = [];
  const beads = [];
  let bId = 0;

  let py = sec;
  for (let r = 0; r < divH; r++) {
    let px = sec;
    for (let c = 0; c < divW; c++) {
      const pw = pWidths[c], ph = pHeights[r];
      const idx = r * divW + c;
      const sashType = _dwgGetSashType(r, c);
      const isDoor = _dw.doorBottom === false && r === divH - 1;

      // Panel (opening)
      const glassW = pw - 2 * bkz;
      const glassH = ph - (isDoor ? bkz : 2 * bkz);
      panels.push({
        id: 'panel_' + r + '_' + c, type: 'panel',
        name: String.fromCharCode(65 + idx),
        row: r, col: c, index: idx,
        x: px, y: py, w: pw, h: ph,
        glassW: Math.max(0, glassW),
        glassH: Math.max(0, glassH),
        sashType: sashType
      });

      // Glass (with deduction)
      const gw = glassW - glassDed;
      const gh = glassH - glassDed;
      glassPieces.push({
        id: 'glass_' + r + '_' + c, type: 'glass',
        name: 'زجاج ' + String.fromCharCode(65 + idx),
        row: r, col: c, index: idx,
        x: px + bkz, y: py + bkz,
        rawW: Math.max(0, glassW), rawH: Math.max(0, glassH),
        w: Math.max(0, gw), h: Math.max(0, gh),
        deductionW: glassDed, deductionH: glassDed
      });

      // Beads (4 per panel, 3 if door bottom)
      const beadNames = isDoor ?
        [{n:'بكلوز علوي',o:'h',l:pw-2*bkz}, {n:'بكلوز أيمن',o:'v',l:ph-bkz}, {n:'بكلوز أيسر',o:'v',l:ph-bkz}] :
        [{n:'بكلوز علوي',o:'h',l:pw-2*bkz}, {n:'بكلوز سفلي',o:'h',l:pw-2*bkz}, {n:'بكلوز أيمن',o:'v',l:ph-2*bkz}, {n:'بكلوز أيسر',o:'v',l:ph-2*bkz}];

      beadNames.forEach(function(b) {
        beads.push({
          id: 'bead_' + (bId++), type: 'bead',
          name: b.n + ' ' + String.fromCharCode(65 + idx),
          panelIndex: idx, orientation: b.o, length: Math.max(0, b.l),
          cutStart: 'miter45', cutEnd: 'miter45'
        });
      });

      px += pw + (c < divW - 1 ? tBarW : 0);
    }
    py += pHeights[r] + (r < divH - 1 ? tBarW : 0);
  }

  // Store the model
  _dw._model = {
    frame: { W, H, sec, deco, tBarW, bkz, glassDed, innerW, innerH, vFull },
    frameSides, pWidths, pHeights,
    tBars, vBars, hBars,
    panels, glassPieces, beads,
    divW, divH
  };

  return _dw._model;
}

// Constraint-based size calculator
function _calcConstrainedSizes(available, count, overrides) {
  if (available <= 0 || count <= 0) return Array(count).fill(0);
  overrides = overrides || [];
  var sizes = [];
  var fixedSum = 0, fixedCount = 0;
  for (var i = 0; i < count; i++) {
    if (overrides[i] != null) { fixedSum += +overrides[i]; fixedCount++; }
  }
  var autoVal = fixedCount < count ? Math.max(0, (available - fixedSum) / (count - fixedCount)) : 0;
  for (var j = 0; j < count; j++) {
    sizes.push(overrides[j] != null ? +overrides[j] : Math.round(autoVal * 10) / 10);
  }
  return sizes;
}

// ── بيانات الكتالوج (تُحمّل من الخادم) ─────────────────────
let _dwProfiles = [];   // القطاعات
let _dwGlassDB  = [];   // أنواع الزجاج (تُكمل _GLASS_CAT)
let _dwRalDB    = [];   // ألوان RAL مخصصة (تُضاف للقائمة الثابتة)

const _DW_KEYS = {
  profiles : 'pm_draw_profiles',
  glass    : 'pm_draw_glass',
  ral      : 'pm_draw_ral',
};

// ════════════════════════════════════════════════════════════
// ENTRY POINT
// ════════════════════════════════════════════════════════════
function dwgInitPage() {
  _dwgBuildLayout();
  // نحمّل الإعدادات أولاً ثم نرسم
  _dwgLoadSettings().finally(() => {
    requestAnimationFrame(() => {
      _dwgResizeCanvas();
      _dwgRefreshRightPanel();   // ← تحديث اللوحة اليمنى بعد تحميل القطاعات
      _dwgDrawAllThumbs();
      _dwgDraw();
      if (_dw.cv) {
        _dw.cv.addEventListener('click',     _dwgOnCanvasClick);
        _dw.cv.addEventListener('mousemove', _dwgOnCanvasHover);
        _dw.cv.addEventListener('mouseleave', _dwgHideTip);
        // سحب عارضات T
        _dw.cv.addEventListener('mousedown', _dwgOnMouseDown);
        _dw.cv.addEventListener('mousemove', _dwgOnMouseDrag);
        _dw.cv.addEventListener('mouseup',   _dwgOnMouseUp);
        // نقر مزدوج لتعديل الأبعاد
        _dw.cv.addEventListener('dblclick',  _dwgOnDblClick);
      }
    });
  });
  window.addEventListener('resize', _dwgOnResize);
  // تحميل قائمة الرسومات المحفوظة
  _dwgLoadDrawingsList();
}

// ── كشف العنصر المنقور ──────────────────────────────────────
function _dwgOnCanvasClick(e) {
  const z = _dw._z;
  if (!z) return;
  const r  = _dw.cv.getBoundingClientRect();
  const mx = e.clientX - r.left;
  const my = e.clientY - r.top;
  const model = _dw._model;

  // ── كشف نقر على عناصر النموذج (الأكثر تحديداً أولاً) ──
  let clickedElement = null;

  // 1. كشف نقر على عارضة T
  if (model && model.tBars && !clickedElement) {
    for (var ti = 0; ti < _dw._tBarZones.length; ti++) {
      var tb = _dw._tBarZones[ti];
      if (mx >= tb.x && mx <= tb.x + tb.w && my >= tb.y && my <= tb.y + tb.h) {
        // Find the matching tBar in model
        var matchBar = model.tBars.find(function(b) { return b.index === tb.index && ((tb.axis === 'W' && b.orientation === 'vertical') || (tb.axis === 'H' && b.orientation === 'horizontal')); });
        if (matchBar) clickedElement = matchBar;
        break;
      }
    }
  }

  // 2. كشف نقر على لوح محدد (من _panelZones)
  var clickedPanel = null;
  if (_dw._panelZones && _dw._panelZones.length > 0 && !clickedElement) {
    for (var pi = 0; pi < _dw._panelZones.length; pi++) {
      var pz = _dw._panelZones[pi];
      if (mx >= pz.x && mx <= pz.x + pz.w && my >= pz.y && my <= pz.y + pz.h) {
        clickedPanel = pz;
        break;
      }
    }
  }

  // 3. Find detailed element from model for clicked panel
  if (clickedPanel && model) {
    var mp = model.panels.find(function(p) { return p.row === clickedPanel.row && p.col === clickedPanel.col; });
    if (mp) {
      // Check if click is on glass or bead area
      var gp = model.glassPieces ? model.glassPieces.find(function(g) { return g.row === mp.row && g.col === mp.col; }) : null;
      if (gp) {
        clickedElement = gp;
      } else {
        clickedElement = mp;
      }

      var letter = String.fromCharCode(65 + mp.index);
      var info = letter + ': ' + _dwgFmt(mp.w) + '\u00d7' + _dwgFmt(mp.h) + ' | زجاج: ' + _dwgFmt(mp.glassW) + '\u00d7' + _dwgFmt(mp.glassH) + ' | ' + mp.sashType;
      var tip = document.getElementById('dwgPanelInfo');
      if (tip) { tip.textContent = info; tip.style.display = 'block'; }
    }
  }

  // 4. Check frame sides
  if (!clickedElement && model && model.frameSides) {
    if (mx >= z.ox && mx <= z.ox + z.OW && my >= z.oy && my <= z.oy + z.OH) {
      // Determine which frame side was clicked
      var secPx = z.fw || ((_dw.deco + _dw.sec) * (z.OW / (_dw.W + 2 * _dw.deco)));
      if (my < z.oy + secPx) clickedElement = model.frameSides[0]; // top
      else if (my > z.oy + z.OH - secPx) clickedElement = model.frameSides[1]; // bottom
      else if (mx < z.ox + secPx) clickedElement = model.frameSides[2]; // left
      else if (mx > z.ox + z.OW - secPx) clickedElement = model.frameSides[3]; // right
      else clickedElement = model.frameSides[0]; // fallback to top
    }
  }

  // Show element info
  if (clickedElement) {
    _dwgShowElementInfo(clickedElement);
  }

  // Legacy hit detection for selection highlighting
  var hit = null;
  if (mx>=z.gx && mx<=z.gx+z.GW && my>=z.gy && my<=z.gy+z.GH) {
    hit = 'glass';
  }
  else if (z.isInside &&
           mx>=z.ix && mx<=z.ix+z.iw && my>=z.iy && my<=z.iy+z.ih) {
    hit = 'bead';
  }
  else if (mx>=z.ox && mx<=z.ox+z.OW && my>=z.oy && my<=z.oy+z.OH) {
    hit = 'frame';
  }

  if (!hit) return;
  _dw.selected = hit;
  _dwgDraw();                    // يرسم مع التمييز الأخضر
  _dwgRefreshRightPanel();       // يحدّث اللوحة اليمنى
  _dwgRefreshTree();             // يحدّث الشجرة اليسرى
}

// ── عرض بيانات العنصر المنقور ───────────────────────────────
function _dwgShowElementInfo(element) {
  var infoEl = document.getElementById('dwgElementInfo');
  if (!infoEl) return;
  var _ir = function(lbl,val) { return '<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;border-bottom:1px solid rgba(0,0,0,0.04)"><span style="color:#666">'+lbl+'</span><span style="color:#222;font-weight:500">'+val+'</span></div>'; };

  var html = '<div style="font-weight:700;margin-bottom:8px;color:#1e2760;font-size:13px;border-bottom:2px solid #e0e3f0;padding-bottom:6px">' + element.name + '</div>';

  switch(element.type) {
    case 'frame':
      html += _ir(t('النوع'), t('حلق') + ' — ' + (element.orientation==='horizontal'?t('أفقي'):t('رأسي')));
      html += _ir(t('الطول الخارجي'), _dwgFmt(element.outerLength) + ' '+t('مم'));
      html += _ir(t('الطول الداخلي'), _dwgFmt(element.innerLength) + ' '+t('مم'));
      html += _ir(t('عرض القطاع'), element.width + ' '+t('مم'));
      html += _ir(t('قص البداية'), (element.cutStart === 'miter45' ? '45°' : '90°'));
      html += _ir(t('قص النهاية'), (element.cutEnd === 'miter45' ? '45°' : '90°'));
      break;
    case 'mullion':
      html += _ir(t('النوع'), t('قاطع') + ' ' + (element.orientation === 'vertical' ? t('رأسي') : t('أفقي')));
      html += _ir(t('الحالة'), element.isFull ? '<b style="color:#1e8c3a">'+t('كامل')+'</b>' : '<b style="color:#c0392b">'+t('مقسوم — جزء')+' ' + ((element.segment||0)+1) + '</b>');
      html += _ir(t('الطول'), _dwgFmt(element.length) + ' '+t('مم'));
      html += _ir(t('العرض'), element.w + ' '+t('مم'));
      html += _ir(t('قص البداية'), (element.cutStart === 'miter45' ? '45°' : '90°'));
      html += _ir(t('قص النهاية'), (element.cutEnd === 'miter45' ? '45°' : '90°'));
      break;
    case 'glass':
      var glassDed = _dw.glassDed || 8;
      html += _ir(t('النوع'), t('زجاج') + ' — ' + (_dw.glassCode||''));
      html += _ir(t('السماكة'), (_dw.glassThick||0) + ' '+t('مم'));
      html += '<div style="height:1px;background:#e0e3f0;margin:6px 0"></div>';
      html += '<div style="font-weight:600;color:#1e2760;margin:4px 0;font-size:11px">'+t('مقاس الفتحة (قبل الخصم)')+'</div>';
      html += _ir(t('عرض الفتحة'), _dwgFmt(element.rawW) + ' '+t('مم'));
      html += _ir(t('ارتفاع الفتحة'), _dwgFmt(element.rawH) + ' '+t('مم'));
      html += '<div style="height:1px;background:#e0e3f0;margin:6px 0"></div>';
      html += '<div style="font-weight:600;color:#c0392b;margin:4px 0;font-size:11px">'+t('الخصم')+'</div>';
      html += _ir(t('خصم العرض'), element.deductionW + ' '+t('مم'));
      html += _ir(t('خصم الارتفاع'), element.deductionH + ' '+t('مم'));
      html += '<div style="height:1px;background:#e0e3f0;margin:6px 0"></div>';
      html += '<div style="font-weight:600;color:#1e2760;margin:4px 0;font-size:11px">'+t('المقاس النهائي للزجاج')+'</div>';
      html += _ir(t('العرض'), '<b style="color:#1e2760">' + _dwgFmt(element.w) + ' '+t('مم')+'</b>');
      html += _ir(t('الارتفاع'), '<b style="color:#1e2760">' + _dwgFmt(element.h) + ' '+t('مم')+'</b>');
      html += _ir(t('المساحة'), (element.w * element.h / 1e6).toFixed(3) + ' '+t('م²'));
      break;
    case 'bead':
      html += _ir(t('النوع'), t('بكلوز'));
      html += _ir(t('الطول'), _dwgFmt(element.length) + ' '+t('مم'));
      html += _ir(t('الاتجاه'), (element.orientation === 'h' ? t('أفقي') : t('رأسي')));
      html += _ir(t('قص البداية'), (element.cutStart === 'miter45' ? '45°' : '90°'));
      html += _ir(t('قص النهاية'), (element.cutEnd === 'miter45' ? '45°' : '90°'));
      break;
    case 'panel':
      html += _ir(t('النوع'), t('فتحة'));
      html += _ir(t('العرض'), _dwgFmt(element.w) + ' '+t('مم'));
      html += _ir(t('الارتفاع'), _dwgFmt(element.h) + ' '+t('مم'));
      html += _ir(t('زجاج'), _dwgFmt(element.glassW) + ' × ' + _dwgFmt(element.glassH) + ' '+t('مم'));
      html += _ir(t('الدرفة'), element.sashType);
      break;
  }
  infoEl.innerHTML = html;
}

// ── Hover — عرض بيانات العنصر عند مرور الماوس ─────────────────
let _dwgTipTimer = null;
function _dwgOnCanvasHover(e) {
  const z = _dw._z;
  if (!z) return;
  if (_dw._dragging) return;
  const r  = _dw.cv.getBoundingClientRect();
  const mx = e.clientX - r.left;
  const my = e.clientY - r.top;
  const model = _dw._model;

  // 1. كشف مرور على عارضة T
  if (model && _dw._tBarZones) {
    for (var ti = 0; ti < _dw._tBarZones.length; ti++) {
      var tb = _dw._tBarZones[ti];
      if (mx >= tb.x && mx <= tb.x + tb.w && my >= tb.y && my <= tb.y + tb.h) {
        _dw.cv.style.cursor = 'pointer';
        _dwgHideTip();
        // عرض بيانات القاطع في اللوحة الجانبية
        var matchBar = model.tBars.find(function(b) { return b.index === tb.index && ((tb.axis === 'W' && b.orientation === 'vertical') || (tb.axis === 'H' && b.orientation === 'horizontal')); });
        if (matchBar) _dwgShowElementInfo(matchBar);
        return;
      }
    }
  }

  // 2. كشف مرور على لوح زجاج
  if (model && _dw._panelZones) {
    for (var pi = 0; pi < _dw._panelZones.length; pi++) {
      var pz = _dw._panelZones[pi];
      if (mx >= pz.x && mx <= pz.x + pz.w && my >= pz.y && my <= pz.y + pz.h) {
        _dw.cv.style.cursor = 'pointer';
        _dwgHideTip();
        var gp = model.glassPieces ? model.glassPieces.find(function(g) { return g.row === pz.row && g.col === pz.col; }) : null;
        if (gp) _dwgShowElementInfo(gp);
        return;
      }
    }
  }

  // 3. كشف مرور على الإطار
  const onFrame = mx>=z.ox && mx<=z.ox+z.OW && my>=z.oy && my<=z.oy+z.OH;
  const onInner = mx>=z.ix && mx<=z.ix+z.iw && my>=z.iy && my<=z.iy+z.ih;

  if (onFrame && !onInner) {
    _dw.cv.style.cursor = 'pointer';
    clearTimeout(_dwgTipTimer);
    _dwgTipTimer = setTimeout(() => _dwgShowTip(e.clientX, e.clientY), 120);
    // عرض بيانات ضلع الحلق
    if (model && model.frameSides) {
      var secPx = z.fw || ((_dw.deco + _dw.sec) * (z.OW / (_dw.W + 2 * _dw.deco)));
      var side = null;
      if (my < z.oy + secPx) side = model.frameSides[0];
      else if (my > z.oy + z.OH - secPx) side = model.frameSides[1];
      else if (mx < z.ox + secPx) side = model.frameSides[2];
      else if (mx > z.ox + z.OW - secPx) side = model.frameSides[3];
      if (side) _dwgShowElementInfo(side);
    }
  } else if (onInner) {
    _dw.cv.style.cursor = 'pointer';
    _dwgHideTip();
  } else {
    _dw.cv.style.cursor = 'default';
    _dwgHideTip();
  }
}

function _dwgShowTip(cx, cy) {
  // الحصول على القطاع المختار
  const p = _dwProfiles.find(x => x.id === _dw.profileId);
  if (!p && !_dw.profileId) {
    // عرض مقطع تخطيطي إذا لم توجد صورة
    _dwgShowTipCanvas(cx, cy);
    return;
  }
  if (!p || !p.image) { _dwgHideTip(); return; }

  let tip = document.getElementById('_dwgHoverTip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = '_dwgHoverTip';
    tip.style.cssText = `position:fixed;z-index:9999;background:#fff;border:1px solid #d0d3de;
      border-radius:8px;padding:10px;box-shadow:0 4px 20px rgba(0,0,0,0.18);
      pointer-events:none;font-family:Cairo,sans-serif;font-size:11px;max-width:200px;
      transition:opacity 0.15s`;
    document.body.appendChild(tip);
  }
  tip.innerHTML = `
    <div style="font-weight:700;color:#1e2760;margin-bottom:6px;font-size:12px">${p.name}</div>
    <img src="${p.image}" style="max-width:180px;max-height:120px;object-fit:contain;
         border:1px solid #eee;border-radius:4px;display:block;margin-bottom:6px">
    <div style="color:#666;font-size:10px;display:flex;flex-direction:column;gap:2px">
      <span>ديكور: <b>${p.deco}مم</b></span>
      <span>قطاع: <b>${p.sec}مم</b></span>
      <span>بركلوز: <b>${p.bead}مم</b></span>
      <span>إجمالي: <b style="color:#1e2760">${p.deco+p.sec}مم</b></span>
    </div>`;
  // موضع: يسار الماوس إذا كان المساحة كافية
  const offset = 14;
  const tW = 200, tH = 200;
  const left = cx + offset + tW > window.innerWidth ? cx - tW - offset : cx + offset;
  const top  = cy + offset + tH > window.innerHeight ? cy - tH - offset : cy + offset;
  tip.style.left    = left + 'px';
  tip.style.top     = top  + 'px';
  tip.style.opacity = '1';
  tip.style.display = 'block';
}

function _dwgShowTipCanvas(cx, cy) {
  // عرض مقطع تخطيطي بسيط إذا لم توجد صورة للقطاع
  let tip = document.getElementById('_dwgHoverTip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = '_dwgHoverTip';
    tip.style.cssText = `position:fixed;z-index:9999;background:#fff;border:1px solid #d0d3de;
      border-radius:8px;padding:10px;box-shadow:0 4px 20px rgba(0,0,0,0.18);
      pointer-events:none;font-family:Cairo,sans-serif;font-size:11px;
      transition:opacity 0.15s`;
    document.body.appendChild(tip);
  }
  const { deco, sec, bead, ralHex, profileName } = _dw;
  tip.innerHTML = `
    <div style="font-weight:700;color:#1e2760;margin-bottom:6px;font-size:12px">${profileName}</div>
    <canvas id="_tipSecCv" width="200" height="60"
      style="border:1px solid #eee;border-radius:4px;display:block;margin-bottom:6px"></canvas>
    <div style="color:#666;font-size:10px;display:flex;gap:8px">
      <span>ديكور: <b>${deco}مم</b></span>
      <span>قطاع: <b>${sec}مم</b></span>
      <span>بركلوز: <b>${bead}مم</b></span>
    </div>`;
  const offset = 14;
  const tW = 220;
  const left = cx + offset + tW > window.innerWidth ? cx - tW - offset : cx + offset;
  const top  = cy + offset;
  tip.style.left = left + 'px';
  tip.style.top  = top  + 'px';
  tip.style.opacity = '1';
  tip.style.display = 'block';
  // ارسم المقطع في الـ canvas الصغير
  requestAnimationFrame(() => {
    const cv2 = document.getElementById('_tipSecCv');
    if (cv2) _dwgDrawSecCanvasIn(cv2);
  });
}

function _dwgHideTip() {
  clearTimeout(_dwgTipTimer);
  const tip = document.getElementById('_dwgHoverTip');
  if (tip) tip.style.display = 'none';
}

// ════════════════════════════════════════════════════════════
// LAYOUT BUILDER  — يبني كل الواجهة من الصفر
// ════════════════════════════════════════════════════════════
function _dwgBuildLayout() {
  const page = document.getElementById('page-drawings');
  if (!page) return;

  // نبني الهيكل كاملاً داخل page-drawings
  page.style.cssText = `
    padding:0; overflow:hidden; direction:ltr;
    display:flex; flex-direction:column;
    height:calc(100vh - 60px);
  `;

  page.innerHTML = `
    <!-- ── الصف الثلاثي: يسار + وسط + يمين ── -->
    <div id="dwgMain" style="
      flex:1; display:flex; overflow:hidden; direction:ltr;
      background:#e8eaed;
    ">
      <!-- اليسار: Project Explorer + أدوات -->
      <div id="dwgControlPanel" style="
        width:220px; min-width:220px; max-width:220px;
        background:#fff; border-right:1px solid ${_DC.border};
        display:flex; flex-direction:column; overflow:hidden;
        font-size:12px;
      "></div>

      <!-- الوسط: شريط + كانفاس + تابز -->
      <div id="dwgCenter" style="
        flex:1; display:flex; flex-direction:column; overflow:hidden;
      ">
        <!-- شريط Layer / View / Zoom -->
        <div id="dwgMiniBar" style="
          display:flex; align-items:center; gap:6px; padding:3px 10px;
          background:#f0f1f5; border-bottom:1px solid ${_DC.border};
          font-size:11px; flex-shrink:0;
        ">
          <span style="color:#555;font-weight:600">View</span>
          <select id="dwgViewMode" onchange="_dw.viewMode=this.value;_dwgDraw()"
            style="padding:2px 5px;border:1px solid #ccc;border-radius:3px;
                   font-size:11px;background:#fff">
            <option>Inside</option><option>Outside</option>
          </select>
          <div style="flex:1"></div>
          <button onclick="_dwgZoomOut()" style="${_miniBtn()}">−</button>
          <span id="dwgZoomLbl"
            style="font-size:11px;color:#444;min-width:38px;text-align:center;font-weight:600">
            100%
          </span>
          <button onclick="_dwgZoomIn()"  style="${_miniBtn()}">+</button>
          <button onclick="_dwgZoomFit()" style="${_miniBtn()}" title="Fit">⊡</button>
          <div style="width:1px;background:#ccc;height:18px;margin:0 4px"></div>
          <!-- تقسيم متساوٍ -->
          <button onclick="_dwgEqualSplit('W')" title="تقسيم عرضي متساوٍ"
            style="${_miniBtn()}">⇔=</button>
          <button onclick="_dwgEqualSplit('H')" title="تقسيم ارتفاع متساوٍ"
            style="${_miniBtn()}">⇕=</button>
          <!-- قائمة أشكال سريعة -->
          <select onchange="_dwgApplyPreset(JSON.parse(this.value));this.value=''"
            title="اختر شكلاً"
            style="padding:2px 4px;border:1px solid #ccc;border-radius:3px;
                   font-size:11px;background:#fff;cursor:pointer;max-width:90px">
            <option value="">📐 شكل…</option>
            <option value='{"divW":1,"divH":1,"doorBottom":true}'>شباك ١×١</option>
            <option value='{"divW":2,"divH":1,"doorBottom":true}'>ثابت ٢ عمود</option>
            <option value='{"divW":3,"divH":1,"doorBottom":true}'>ثابت ٣ عمود</option>
            <option value='{"divW":1,"divH":2,"doorBottom":true}'>ثابت ٢ صف</option>
            <option value='{"divW":2,"divH":2,"doorBottom":true}'>ثابت ٢×٢</option>
            <option value='{"divW":1,"divH":1,"doorBottom":false}'>باب (٣ أطراف)</option>
            <option value='{"divW":1,"divH":2,"doorBottom":false}'>باب + ثابت فوق</option>
          </select>
          <div style="width:1px;background:#ccc;height:18px;margin:0 4px"></div>
          <button onclick="showPage('settings');setTimeout(()=>switchSettingsTab('drawings',{target:document.querySelector('[onclick*=drawings]')}),100)"
            style="${_miniBtn()}" title="إعدادات الرسومات">⚙️</button>
        </div>

        <!-- كانفاس الرسم -->
        <div id="dwgCanvasWrap" style="
          flex:1; position:relative; overflow:hidden;
          background:#ffffff; box-shadow:inset 0 0 0 1px #e0e0e0;
        ">
          <canvas id="dwgCanvas" style="display:block;"></canvas>
          <!-- تسمية Inner view أسفل اليسار -->
          <div id="dwgViewLabel" style="
            position:absolute; bottom:8px; left:50%;
            transform:translateX(-50%);
            font-size:12px; font-weight:700; color:#555;
            background:rgba(255,255,255,0.85);
            padding:2px 10px; border:1px solid #ccc; border-radius:3px;
            pointer-events:none;
          ">Inner view</div>
        </div>

        <!-- تابز Summary / Design / Bill of Material -->
        <div style="
          display:flex; border-top:1px solid ${_DC.border};
          background:#f0f1f5; font-size:11px; flex-shrink:0;
        ">
          ${['Summary','Design','Bill of Material'].map((t,i) => `
            <div class="dwg-tab" onclick="_dwgTab(this,'${t}')"
              data-tab="${t}"
              style="padding:5px 14px; cursor:pointer;
                     border-right:1px solid ${_DC.border};
                     ${i===1
                       ? 'background:#fff;font-weight:700;color:#1e2760;'
                       : 'color:#666;'}">
              ${t}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- اليمين: Properties -->
      <div id="dwgRightPanel" style="
        width:258px; min-width:258px; max-width:258px;
        background:#fff; border-left:1px solid ${_DC.border};
        overflow-y:auto; font-size:12px;
      "></div>
    </div>
  `;

  // ملء اللوحات
  document.getElementById('dwgControlPanel').innerHTML = _dwgLeftPanelHTML();
  document.getElementById('dwgRightPanel').innerHTML   = _dwgRightPanelHTML();

  // ربط الكانفاس
  _dw.cv  = document.getElementById('dwgCanvas');
  _dw.ctx = _dw.cv.getContext('2d');
}

function _miniBtn() {
  return `background:#fff;border:1px solid #ccc;border-radius:3px;
          padding:2px 7px;cursor:pointer;font-size:13px;font-weight:700;color:#444`;
}

// ════════════════════════════════════════════════════════════
// LEFT PANEL — شجرة المشروع + الأدوات
// ════════════════════════════════════════════════════════════
function _dwgLeftPanelHTML() {
  return `
  <!-- Project Explorer -->
  <div style="background:#e8eaf0;border-bottom:1px solid ${_DC.border};
              padding:5px 8px;font-weight:700;font-size:11px;color:#333;
              display:flex;align-items:center;gap:4px">
    <span>📁</span> Project Explorer
  </div>
  <div style="padding:6px 8px;border-bottom:1px solid ${_DC.border};flex-shrink:0">
    <div style="display:flex;align-items:center;gap:4px;font-size:11px;padding:2px 0">
      <span>🗂</span>
      <span id="dwgPrjName" style="font-weight:600;color:#222">Project 1</span>
    </div>
    <div style="margin-left:16px">
      <div style="display:flex;align-items:center;gap:4px;font-size:11px;padding:2px 0;color:#444">
        <span>📦</span> Component 001
      </div>
      <div id="dwgTreeItems" style="margin-left:16px;font-size:11px">
        ${_dwgTreeItem('frame', '🖼', 'Frame — الحلق')}
        <div style="margin-left:12px">
          ${_dwgTreeItem('glass', '🪟', 'Glass A — الزجاج')}
          ${_dwgTreeItem('bead',  '▪', 'Bead — البركلوز')}
        </div>
      </div>
    </div>
  </div>

  <!-- Project selector -->
  <div style="padding:6px 8px;border-bottom:1px solid ${_DC.border}">
    <select id="dPrj" onchange="_dwgOnPrj(this.value)"
      style="width:100%;padding:3px;border:1px solid #ccc;border-radius:3px;
             font-size:11px;background:#fff">
      ${_dwgPrjOptions()}
    </select>
  </div>

  <!-- معلومات المشروع -->
  <div id="dwgPrjInfo" style="display:none;padding:6px 8px;border-bottom:1px solid ${_DC.border};font-size:11px">
    <div id="dwgPrjColors" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:4px"></div>
  </div>

  <!-- مقاسات العميل -->
  <div id="dwgMeasSec" style="display:none;border-bottom:1px solid ${_DC.border}">
    <div onclick="_dwgToggleMeas()"
      style="display:flex;align-items:center;justify-content:space-between;
             padding:5px 8px;background:${_DC.sectionHdr};cursor:pointer;
             font-weight:600;font-size:11px;color:#333;user-select:none">
      <span>📐 ${t('مقاسات العميل')}</span>
      <span id="dwgMeasArr" style="font-size:10px">▼</span>
    </div>
    <div id="dwgMeasList" style="display:none;max-height:200px;overflow-y:auto;padding:2px 0"></div>
  </div>

  <!-- أزرار حفظ / جديد -->
  <div style="padding:6px 8px;border-bottom:1px solid ${_DC.border};display:flex;gap:4px">
    <button onclick="dwgNewDrawing()" title="${t('رسم جديد')}"
      style="flex:1;padding:4px 6px;border:1px solid #ccc;border-radius:3px;
             background:#fff;cursor:pointer;font-size:11px;font-weight:600;color:#555">
      📄 ${t('جديد')}
    </button>
    <button onclick="dwgSaveDrawing()" title="${t('حفظ الرسم')}"
      style="flex:1;padding:4px 6px;border:none;border-radius:3px;
             background:#1e2760;color:#fff;cursor:pointer;font-size:11px;font-weight:600">
      💾 ${t('حفظ')}
    </button>
  </div>

  <!-- الرسومات المحفوظة -->
  <div style="border-bottom:1px solid ${_DC.border}">
    <div onclick="_dwgToggleSec('dwgSavedSec')"
      style="display:flex;align-items:center;justify-content:space-between;
             padding:5px 8px;background:${_DC.sectionHdr};cursor:pointer;
             font-weight:600;font-size:11px;color:#333;user-select:none">
      <span>📂 ${t('الرسومات المحفوظة')}</span>
      <span id="dwgSavedSec_arr" style="font-size:10px">▲</span>
    </div>
    <div id="dwgSavedSec" style="max-height:160px;overflow-y:auto">
      <div id="dwgSavedList" style="font-size:11px"></div>
    </div>
  </div>

  <!-- أدوات الرسم -->
  <div style="overflow-y:auto;flex:1">
    ${_dwgToolSection('Shapes',        _dwgShapeIcons())}
    ${_dwgToolSection('Splitters',     _dwgSplitterIcons())}
    ${_dwgToolSection('Wings',         _dwgWingIcons())}
    ${_dwgToolSection('Surfaces',      _dwgSurfaceIcons())}
    ${_dwgToolSection('Insect Screens',_dwgScreenIcons())}
    ${_dwgToolSection('Shutters',      _dwgShutterIcons())}
    ${_dwgToolSection('Misc',          _dwgMiscIcons())}
  </div>`;
}

function _dwgTreeItem(id, icon, label) {
  const active = _dw.selected === id;
  return `<div id="tree_${id}"
    onclick="_dw.selected='${id}';_dwgDraw();_dwgRefreshRightPanel();_dwgRefreshTree()"
    style="padding:2px 5px;border-radius:3px;cursor:pointer;margin:1px 0;
           display:flex;align-items:center;gap:4px;
           background:${active?'#dde4ff':''};
           color:${active?'#1e2760':'#444'};
           font-weight:${active?'700':'400'}">
    <span>${icon}</span><span>${label}</span>
  </div>`;
}

function _dwgSelectItem(id) {
  _dw.selected = id;
  _dwgDraw();
  _dwgRefreshRightPanel();
  _dwgRefreshTree();
}

// ── تطبيق قالب شكل مسبق ────────────────────────────────────
function _dwgApplyPreset(cfg) {
  if (cfg.divW      !== undefined) { _dw.divW      = Math.max(1, cfg.divW);  _dw.panelWidths  = []; }
  if (cfg.divH      !== undefined) { _dw.divH      = Math.max(1, cfg.divH);  _dw.panelHeights = []; }
  if (cfg.W         !== undefined)   _dw.W         = cfg.W;
  if (cfg.H         !== undefined)   _dw.H         = cfg.H;
  if (cfg.overlapH  !== undefined)   _dw.overlapH  = cfg.overlapH;
  if (cfg.doorBottom!== undefined)   _dw.doorBottom= cfg.doorBottom;
  if (cfg.vFull     !== undefined)   _dw.vFull     = cfg.vFull;
  if (cfg.glassDed  !== undefined)   _dw.glassDed  = cfg.glassDed;
  _dwgRefreshRightPanel();
  _dwgDraw();
}

// ── تقسيم متساوٍ (إعادة تعيين المقاسات المثبتة) ────────────
function _dwgEqualSplit(axis) {
  if (axis === 'W') { _dw.panelWidths  = []; }
  else              { _dw.panelHeights = []; }
  _dwgRefreshRightPanel();
  _dwgDraw();
}

function _dwgPrjOptions() {
  let opts = '<option value="">— Select project —</option>';
  try {
    const prjs = typeof getAllProjects === 'function' ? getAllProjects() : [];
    opts += prjs.map(p => `<option value="${p.id}">${p.name||p.id}</option>`).join('');
  } catch(e) {}
  return opts;
}

function _dwgToolSection(title, iconsHTML) {
  const id = 'dwgSec_' + title.replace(/\s/g,'');
  return `
  <div style="border-bottom:1px solid ${_DC.border}">
    <div onclick="_dwgToggleSec('${id}')"
      style="display:flex;align-items:center;justify-content:space-between;
             padding:5px 8px;background:${_DC.sectionHdr};cursor:pointer;
             font-weight:600;font-size:11px;color:#333;user-select:none">
      <span>${title}</span>
      <span id="${id}_arr" style="font-size:10px">▲</span>
    </div>
    <div id="${id}" style="padding:6px 8px;display:flex;flex-wrap:wrap;gap:4px">
      ${iconsHTML}
    </div>
  </div>`;
}

function _dwgToggleSec(id) {
  const el  = document.getElementById(id);
  const arr = document.getElementById(id + '_arr');
  if (!el) return;
  const visible = el.style.display !== 'none';
  el.style.display  = visible ? 'none' : 'flex';
  arr.textContent   = visible ? '▼' : '▲';
}

// أيقونات الأقسام (canvas مصغر لكل أيقونة)
function _dwgIconBtn(id, title, onclick) {
  return `<div title="${title}" onclick="${onclick}"
    style="cursor:pointer;border:1px solid #ccc;border-radius:3px;
           padding:2px;background:#fff;transition:border-color .1s"
    onmouseover="this.style.borderColor='#4a52c0'"
    onmouseout="this.style.borderColor='#ccc'">
    <canvas id="ico_${id}" width="32" height="24" style="display:block;pointer-events:none"></canvas>
  </div>`;
}

function _dwgShapeIcons() {
  return [
    _dwgIconBtn('rect',   'شباك ثابت ١×١',     "_dwgApplyPreset({divW:1,divH:1,doorBottom:true})"),
    _dwgIconBtn('rect2v', 'ثابت — ٢ عمود',      "_dwgApplyPreset({divW:2,divH:1,doorBottom:true})"),
    _dwgIconBtn('rect2h', 'ثابت — ٢ صف',        "_dwgApplyPreset({divW:1,divH:2,doorBottom:true})"),
    _dwgIconBtn('rect4',  'ثابت — ٢×٢',         "_dwgApplyPreset({divW:2,divH:2,doorBottom:true})"),
    _dwgIconBtn('rect3v', 'ثابت — ٣ عمود',      "_dwgApplyPreset({divW:3,divH:1,doorBottom:true})"),
    _dwgIconBtn('door1',  'باب (٣ أطراف)',       "_dwgApplyPreset({divW:1,divH:1,doorBottom:false})"),
    _dwgIconBtn('door2',  'باب + ثابت فوق',      "_dwgApplyPreset({divW:1,divH:2,doorBottom:false})"),
  ].join('');
}
function _dwgSplitterIcons() {
  return [
    _dwgIconBtn('sp_v',  'Vertical',        "_dwgAddSplitter('v')"),
    _dwgIconBtn('sp_h',  'Horizontal',      "_dwgAddSplitter('h')"),
    _dwgIconBtn('sp_2v', 'Two Vertical',    "_dwgAddSplitter('2v')"),
    _dwgIconBtn('sp_2h', 'Two Horizontal',  "_dwgAddSplitter('2h')"),
    _dwgIconBtn('sp_x',  'Cross',           "_dwgAddSplitter('x')"),
  ].join('');
}
function _dwgWingIcons() {
  return [
    _dwgIconBtn('wg_f',  'Fixed',           "_dwgSelectType('fixed')"),
    _dwgIconBtn('wg_cl', 'Casement Left',   "_dwgSelectType('casement')"),
    _dwgIconBtn('wg_sl', 'Slide 2',         "_dwgSelectType('slide2')"),
    _dwgIconBtn('wg_aw', 'Awning',          "_dwgSelectType('awning')"),
  ].join('');
}
function _dwgSurfaceIcons() {
  return _dwgIconBtn('sf_p', 'Panel', "_dwgSelectType('panel')");
}
function _dwgScreenIcons() {
  return _dwgIconBtn('sc_1', 'Screen', "");
}
function _dwgShutterIcons() {
  return _dwgIconBtn('sh_1', 'Shutter', "");
}
function _dwgMiscIcons() {
  return [
    _dwgIconBtn('ms_1', 'Sill', ""),
    _dwgIconBtn('ms_2', 'Hood', ""),
  ].join('');
}

// ════════════════════════════════════════════════════════════
// RIGHT PANEL — خصائص مثل RA Workshop
// ════════════════════════════════════════════════════════════
function _dwgRightPanelHTML() {
  const { W, H, deco, sec, showGrid } = _dw;

  return `
  <div style="background:#1e2760;padding:6px 10px;font-weight:700;font-size:11px;color:#fff;letter-spacing:0.5px">
    ${t('خصائص')}
  </div>

  <!-- قسم العنصر المحدد (ديناميكي) -->
  ${_dwgComponentSection()}

  ${_rSection(t('المقاسات'), `
    ${_rRowInput('W '+t('عرض'), 'rW', W, 'mm', '_dw.W=+this.value;_dw.panelWidths=[];_dwgDraw();_dwgUpdateStats();_dwgRefreshRightPanel()')}
    ${_rRowInput('H '+t('ارتفاع'), 'rH', H, 'mm', '_dw.H=+this.value;_dw.panelHeights=[];_dwgDraw();_dwgUpdateStats();_dwgRefreshRightPanel()')}
    ${_rRow(t('المحيط'),  `<span id="rPerim" style="font-weight:600">${(2*(W+H)).toLocaleString()} mm</span>`)}
    ${_rRow(t('المساحة'), `<span id="rSurf"  style="font-weight:600">${(W*H/1e6).toFixed(3)} m²</span>`)}
  `)}

  ${_rSection(t('مقاسات القطاع'), `
    ${_rRowInput(t('ديكور'),   'rDeco', deco,   'mm', '_dw.deco=+this.value;_dwgDraw()')}
    ${_rRowInput(t('حلق'),     'rSec',  sec,    'mm', '_dw.sec=+this.value;_dwgDraw()')}
    ${_rRowInput(t('بركلوز'),  'rBead', _dw.bead, 'mm', '_dw.bead=+this.value;_dwgDraw()')}
    ${_rRowInput(t('خصم زج.'), 'rBite', _dw.bite, 'mm', '_dw.bite=+this.value;_dwgDraw()')}
    ${_rRowInput(t('خصم زجاج'), 'rGDed', _dw.glassDed, 'mm', '_dw.glassDed=+this.value;_dwgDraw()')}
  `)}

  ${_rSection(t('اللون RAL'), _dwgRalSelectorHTML())}

  ${_dwgDivisionsHTML()}

  ${_rSection(t('عرض'), `
    ${_rRow(t('مقاس الديكور'), `<label style="cursor:pointer;display:flex;align-items:center;gap:5px">
      <input type="checkbox" ${_dw.showDecosDim?'checked':''} onchange="_dw.showDecosDim=this.checked;_dwgDraw()">
      <span style="font-size:10px;color:#1e2760">${t('إجمالي+ديكور')}</span></label>`)}
    ${_rRow(t('مقاس الحلق'), `<label style="cursor:pointer;display:flex;align-items:center;gap:5px">
      <input type="checkbox" ${_dw.showSectionDim?'checked':''} onchange="_dw.showSectionDim=this.checked;_dwgDraw()">
      <span style="font-size:10px;color:#1e2760">${t('فتحة الحلق')}</span></label>`)}
    ${_rRow(t('شبكة'), `<label style="cursor:pointer;display:flex;align-items:center;gap:5px">
      <input type="checkbox" ${showGrid?'checked':''} onchange="_dw.showGrid=this.checked;_dwgDraw()">
      <span style="font-size:10px">${t('ظاهرة')}</span></label>`)}
  `)}

  <!-- عنصر معلومات العنصر المنقور -->
  <div id="dwgElementInfo" style="padding:12px;background:var(--surface2,#f8f9ff);border-radius:8px;
       margin:8px 10px;font-size:12px;min-height:60px;border:1px solid ${_DC.border};direction:rtl">
    <div style="color:#999;font-size:11px">${t('اضغط على أي عنصر لعرض بياناته')}</div>
  </div>

  <div style="padding:8px 10px;display:flex;gap:6px">
    <button onclick="dwgExportPNG()"
      style="flex:1;padding:6px;background:#1e2760;color:#fff;border:none;
             border-radius:4px;cursor:pointer;font-size:11px;font-weight:600">
      💾 ${t('تصدير PNG')}
    </button>
    <button onclick="dwgPrint()"
      style="flex:1;padding:6px;background:#28a745;color:#fff;border:none;
             border-radius:4px;cursor:pointer;font-size:11px;font-weight:600">
      🖨 ${t('طباعة')}
    </button>
  </div>`;
}

// helpers للخصائص
function _rSection(title, rowsHTML) {
  const id = 'rs_' + title.replace(/\s/g,'');
  return `
  <div style="border-bottom:1px solid ${_DC.border}">
    <div onclick="_dwgToggleSec('${id}')"
      style="display:flex;align-items:center;justify-content:space-between;
             padding:5px 10px;background:${_DC.sectionHdr};cursor:pointer;
             font-size:11px;font-weight:700;color:#222">
      <span>${title}</span>
      <span id="${id}_arr">▲</span>
    </div>
    <div id="${id}" style="padding:0">
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <tbody>${rowsHTML}</tbody>
      </table>
    </div>
  </div>`;
}

function _rRow(label, valueHTML) {
  return `<tr>
    <td style="${_rTdL()}">${label}</td>
    <td style="${_rTdR()}">${valueHTML}</td>
  </tr>`;
}

function _rRowInput(label, id, val, unit, onchange) {
  return `<tr>
    <td style="${_rTdL()}">${label}</td>
    <td style="${_rTdR()}">
      <div style="display:flex;align-items:center;gap:4px">
        <input id="${id}" type="number" value="${val}"
          style="${_rInputStyle(70)}"
          oninput="${onchange}">
        <span style="color:#888;font-size:10px">${unit}</span>
      </div>
    </td>
  </tr>`;
}

function _rTdL() {
  return `padding:4px 10px;color:#555;border-bottom:1px solid #f0f0f0;
          white-space:nowrap;width:45%`;
}
function _rTdR() {
  return `padding:4px 10px;border-bottom:1px solid #f0f0f0;color:#222`;
}
function _rInputStyle(w) {
  return `width:${w||80}px;padding:2px 5px;border:1px solid #ccc;
          border-radius:3px;font-size:11px;background:#fff;text-align:right`;
}
function _rCornerBtn(active) {
  return `padding:3px 10px;border:2px solid ${active?'#1e2760':'#ccc'};
          border-radius:4px;background:${active?'#dde4ff':'#fff'};
          cursor:pointer;font-size:11px;font-weight:600;
          color:${active?'#1e2760':'#555'}`;
}

// ════════════════════════════════════════════════════════════
// RAL COLOR SELECTOR
// ════════════════════════════════════════════════════════════
function _dwgRalSelectorHTML() {
  // دمج القائمة الثابتة مع المخصصة
  const allRal = [..._RAL, ..._dwRalDB];
  const opts = allRal.map(r =>
    `<option value="${r.code}" ${_dw.color===r.code?'selected':''}>${r.code} — ${r.name}</option>`
  ).join('');

  return `
  <tr><td colspan="2" style="padding:6px 8px">
    <div style="display:flex;align-items:center;gap:6px">
      <!-- مربع اللون -->
      <div id="ralSwatch" style="
        width:28px;height:22px;border:1px solid #aaa;border-radius:3px;
        background:${_dw.ralHex};flex-shrink:0">
      </div>
      <!-- القائمة المنسدلة -->
      <select id="ralSelect" onchange="_dwgSetRal(this.value)"
        style="flex:1;padding:3px 4px;border:1px solid #ccc;border-radius:3px;
               font-size:11px;background:#fff">
        ${opts}
      </select>
    </div>
    <!-- كود RAL + hex -->
    <div style="margin-top:4px;font-size:10px;color:#777;display:flex;gap:8px">
      <span>RAL <b id="ralCode">${_dw.color}</b></span>
      <span id="ralHexTxt">${_dw.ralHex}</span>
    </div>
  </td></tr>`;
}

function _dwgSetRal(code) {
  const found = [..._RAL, ..._dwRalDB].find(r => r.code === code);
  if (!found) return;
  _dw.color  = found.code;
  _dw.ralHex = found.hex;
  // تحديث العناصر
  const sw = document.getElementById('ralSwatch');
  const cd = document.getElementById('ralCode');
  const hx = document.getElementById('ralHexTxt');
  if (sw) sw.style.background = found.hex;
  if (cd) cd.textContent      = found.code;
  if (hx) hx.textContent      = found.hex;
  _dwgDraw();
}

// ════════════════════════════════════════════════════════════
// RIGHT PANEL REFRESH — تحديث ديناميكي حسب العنصر المحدد
// ════════════════════════════════════════════════════════════
function _dwgRefreshRightPanel() {
  _dwgBuildModel();
  const rp = document.getElementById('dwgRightPanel');
  if (rp) {
    rp.innerHTML = _dwgRightPanelHTML();
    // رسم مقطع القطاع بعد ما يُبنى الـ DOM
    requestAnimationFrame(_dwgDrawSecCanvas);
  }
}

function _dwgRefreshTree() {
  const items = ['frame','bead','glass'];
  items.forEach(id => {
    const el = document.getElementById('tree_' + id);
    if (!el) return;
    el.style.background  = _dw.selected === id ? '#dde4ff' : '';
    el.style.color       = _dw.selected === id ? '#1e2760' : '#444';
    el.style.fontWeight  = _dw.selected === id ? '700'     : '400';
  });
}

// ── محتوى Right Panel حسب العنصر ───────────────────────────
function _dwgComponentSection() {
  const sel = _dw.selected;

  if (sel === 'frame') return _dwgFrameComponentHTML();
  if (sel === 'bead')  return _dwgBeadComponentHTML();
  if (sel === 'glass') return _dwgGlassComponentHTML();
  return '';
}

// ── حلق (Frame) ─────────────────────────────────────────────
// ════════════════════════════════════════════════════════════
// DIVISIONS — تقسيمات الفتحة (تعرض في اللوحة اليمنى)
// ════════════════════════════════════════════════════════════
function _dwgCalcPanels(axis) {
  const divN     = axis === 'W' ? _dw.divW : _dw.divH;
  const dim      = axis === 'W' ? _dw.W    : _dw.H;
  const sec      = _dw.sec;
  const selProf  = _dwProfiles.find(p => p.id === _dw.profileId);
  const tblRaw   = selProf && selProf.tBarLines && selProf.tBarLines.length
    ? selProf.tBarLines.filter(l => (l.wW||l.w||0) > 0) : null;
  const tBarW    = tblRaw
    ? tblRaw.reduce((s,l) => s + (l.wW||l.w||0), 0)
    : (_dw.tBarW || 28);
  const avail    = dim - 2*sec - (divN - 1) * tBarW;
  const overrides = axis === 'W' ? _dw.panelWidths : _dw.panelHeights;
  let fixedSum = 0, fixedCount = 0;
  for (let i = 0; i < divN; i++) {
    if (overrides[i] != null) { fixedSum += +overrides[i]; fixedCount++; }
  }
  const autoVal = fixedCount < divN ? (avail - fixedSum) / (divN - fixedCount) : 0;
  const result = [];
  for (let i = 0; i < divN; i++) {
    result.push(overrides[i] != null ? +overrides[i] : Math.round(autoVal * 10) / 10);
  }
  return result;
}

function _dwgSetPanelSize(i, val, axis) {
  const arr = axis === 'W' ? _dw.panelWidths : _dw.panelHeights;
  const divN = axis === 'W' ? _dw.divW : _dw.divH;
  while (arr.length < divN) arr.push(null);
  arr[i] = (val === '' || val === null || val === undefined) ? null : +val;
  _dwgRefreshRightPanel();
  _dwgDraw();
}

function _dwgDivisionsHTML() {
  const { divW, divH, tBarW, sec, W, H, overlapH } = _dw;
  const selProf = _dwProfiles.find(p => p.id === _dw.profileId);
  const tblRaw  = selProf && selProf.tBarLines && selProf.tBarLines.length
    ? selProf.tBarLines.filter(l => (l.wW||l.w||0) > 0) : null;
  const actualTBar = tblRaw
    ? tblRaw.reduce((s,l) => s + (l.wW||l.w||0), 0)
    : (tBarW || 28);

  // Panel width cells
  const pwArr  = _dwgCalcPanels('W');
  const phArr  = _dwgCalcPanels('H');

  const panelWCells = divW > 1 ? pwArr.map((pw, i) => `
    <div style="flex:1;text-align:center">
      <div style="font-size:9px;color:#888;margin-bottom:2px">ل${i+1}</div>
      <input type="number" value="${pw}" step="0.1"
        onchange="_dwgSetPanelSize(${i},this.value,'W')"
        style="width:100%;padding:3px 4px;border:1px solid ${_dw.panelWidths[i]!=null?'#1e2760':'#ccc'};
               border-radius:4px;font-size:11px;text-align:center;box-sizing:border-box;
               background:${_dw.panelWidths[i]!=null?'#e8eaff':'#fff'}"
        title="اضغط لتثبيت المقاس - اتركه فارغاً للحساب التلقائي">
      <div style="font-size:9px;color:#aaa">مم</div>
    </div>
    ${i < divW-1 ? `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 2px">
      <div style="font-size:8px;color:#888;font-weight:600">T</div>
      <div style="font-size:9px;color:#1e2760;font-weight:700">${actualTBar}</div>
    </div>` : ''}
  `).join('') : '';

  const panelHCells = divH > 1 ? phArr.map((ph, i) => `
    <div style="flex:1;text-align:center">
      <div style="font-size:9px;color:#888;margin-bottom:2px">ع${i+1}</div>
      <input type="number" value="${ph}" step="0.1"
        onchange="_dwgSetPanelSize(${i},this.value,'H')"
        style="width:100%;padding:3px 4px;border:1px solid ${_dw.panelHeights[i]!=null?'#1e2760':'#ccc'};
               border-radius:4px;font-size:11px;text-align:center;box-sizing:border-box;
               background:${_dw.panelHeights[i]!=null?'#e8eaff':'#fff'}">
      <div style="font-size:9px;color:#aaa">مم</div>
    </div>
    ${i < divH-1 ? `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 2px">
      <div style="font-size:8px;color:#888;font-weight:600">T</div>
      <div style="font-size:9px;color:#1e2760;font-weight:700">${actualTBar}</div>
    </div>` : ''}
  `).join('') : '';

  return `
  <div style="border-bottom:1px solid ${_DC.border}">
    <div style="padding:5px 10px;background:#f5f6fb;font-size:11px;font-weight:700;color:#1e2760;
                border-bottom:1px solid #e0e3f0">
      🔲 ${t('تقسيمات الفتحة')}
    </div>
    <div style="padding:8px 10px">

      <!-- عدد التقسيمات + عارضة T -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">
        <div>
          <div style="font-size:10px;color:#666;margin-bottom:3px">${t('تقسيم العرض')}</div>
          <input type="number" value="${divW}" min="1" max="10"
            oninput="_dw.divW=Math.max(1,+this.value);_dw.panelWidths=[];_dwgRefreshRightPanel();_dwgDraw()"
            style="width:100%;padding:4px 6px;border:1px solid #ccc;border-radius:4px;
                   font-size:12px;font-weight:600;box-sizing:border-box;text-align:center">
        </div>
        <div>
          <div style="font-size:10px;color:#666;margin-bottom:3px">${t('تقسيم الارتفاع')}</div>
          <input type="number" value="${divH}" min="1" max="10"
            oninput="_dw.divH=Math.max(1,+this.value);_dw.panelHeights=[];_dwgRefreshRightPanel();_dwgDraw()"
            style="width:100%;padding:4px 6px;border:1px solid #ccc;border-radius:4px;
                   font-size:12px;font-weight:600;box-sizing:border-box;text-align:center">
        </div>
        <div>
          <div style="font-size:10px;color:#666;margin-bottom:3px">${t('عارضة T مم')}</div>
          <input type="number" value="${actualTBar}" min="5" max="200"
            oninput="_dw.tBarW=+this.value;_dwgRefreshRightPanel();_dwgDraw()"
            style="width:100%;padding:4px 6px;border:1px solid #ccc;border-radius:4px;
                   font-size:12px;font-weight:600;box-sizing:border-box;text-align:center">
        </div>
      </div>

      <!-- أولوية التركيب -->
      <div style="display:flex;gap:4px;margin-bottom:8px">
        <div style="font-size:10px;color:#666;line-height:1.8;white-space:nowrap">${t('الأفقي')}:</div>
        <button onclick="_dw.overlapH=true;_dwgRefreshRightPanel();_dwgDraw()"
          style="flex:1;padding:3px 6px;border:1px solid ${overlapH?'#1e2760':'#ccc'};
                 border-radius:4px;cursor:pointer;font-size:10px;font-weight:600;
                 background:${overlapH?'#1e2760':'#fff'};color:${overlapH?'#fff':'#555'}">
          ⬜ ${t('كامل العرض')}
        </button>
        <button onclick="_dw.overlapH=false;_dwgRefreshRightPanel();_dwgDraw()"
          style="flex:1;padding:3px 6px;border:1px solid ${!overlapH?'#1e2760':'#ccc'};
                 border-radius:4px;cursor:pointer;font-size:10px;font-weight:600;
                 background:${!overlapH?'#1e2760':'#fff'};color:${!overlapH?'#fff':'#555'}">
          ⬜ ${t('بين الرأسي')}
        </button>
      </div>

      <!-- القاطع الكامل (vFull toggle) -->
      <div style="display:flex;gap:4px;margin-bottom:8px">
        <div style="font-size:10px;color:#666;line-height:1.8;white-space:nowrap">القاطع الكامل:</div>
        <button onclick="_dw.vFull=true;_dwgRefreshRightPanel();_dwgDraw()"
          style="flex:1;padding:3px 6px;border:1px solid ${_dw.vFull?'#1e2760':'#ccc'};
                 border-radius:4px;cursor:pointer;font-size:10px;font-weight:600;
                 background:${_dw.vFull?'#1e2760':'#fff'};color:${_dw.vFull?'#fff':'#555'}">
          ↕ رأسي
        </button>
        <button onclick="_dw.vFull=false;_dwgRefreshRightPanel();_dwgDraw()"
          style="flex:1;padding:3px 6px;border:1px solid ${!_dw.vFull?'#1e2760':'#ccc'};
                 border-radius:4px;cursor:pointer;font-size:10px;font-weight:600;
                 background:${!_dw.vFull?'#1e2760':'#fff'};color:${!_dw.vFull?'#fff':'#555'}">
          ↔ أفقي
        </button>
      </div>

      <!-- نوع الفتحة: شباك / باب -->
      <div style="display:flex;gap:4px;margin-bottom:8px">
        <div style="font-size:10px;color:#666;line-height:1.8;white-space:nowrap">النوع:</div>
        <button onclick="_dw.doorBottom=true;_dwgRefreshRightPanel();_dwgDraw()"
          style="flex:1;padding:3px 6px;border:1px solid ${_dw.doorBottom!==false?'#1e2760':'#ccc'};
                 border-radius:4px;cursor:pointer;font-size:10px;font-weight:600;
                 background:${_dw.doorBottom!==false?'#1e2760':'#fff'};
                 color:${_dw.doorBottom!==false?'#fff':'#555'}">
          🪟 شباك (4 أطراف)
        </button>
        <button onclick="_dw.doorBottom=false;_dwgRefreshRightPanel();_dwgDraw()"
          style="flex:1;padding:3px 6px;border:1px solid ${_dw.doorBottom===false?'#1e2760':'#ccc'};
                 border-radius:4px;cursor:pointer;font-size:10px;font-weight:600;
                 background:${_dw.doorBottom===false?'#1e2760':'#fff'};
                 color:${_dw.doorBottom===false?'#fff':'#555'}">
          🚪 باب (3 أطراف)
        </button>
      </div>

      <!-- خلايا أعراض الألواح -->
      ${divW > 1 ? `
      <div style="font-size:10px;color:#555;margin-bottom:4px;font-weight:600">أعراض الألواح (مم):</div>
      <div style="display:flex;gap:2px;align-items:flex-end;margin-bottom:8px">
        ${panelWCells}
      </div>
      <div style="font-size:9px;color:#aaa;margin-bottom:6px">
        💡 الخلفية الزرقاء = مثبت • ابيض = تلقائي • اتركه فارغاً لإعادة الحساب
      </div>` : ''}

      <!-- خلايا ارتفاعات الألواح -->
      ${divH > 1 ? `
      <div style="font-size:10px;color:#555;margin-bottom:4px;font-weight:600">ارتفاعات الألواح (مم):</div>
      <div style="display:flex;gap:2px;align-items:flex-end">
        ${panelHCells}
      </div>` : ''}

    </div>
  </div>`;
}

function _dwgFrameComponentHTML() {
  const { deco, sec, profileName, profileCode, ralHex, color, profileId } = _dw;
  const totalFW = deco + sec;

  // قائمة القطاعات من الكتالوج
  const profOpts = `<option value="">— اختر قطاع —</option>` +
    _dwProfiles.map(p =>
      `<option value="${p.id}" ${p.id===profileId?'selected':''}>${p.name}</option>`
    ).join('');

  // القطاع المحدد حالياً
  const selProf = _dwProfiles.find(p => p.id === profileId);
  return _rSection('الحلق (Frame)', `
    <!-- اختيار قطاع من الكتالوج -->
    <tr><td colspan="2" style="padding:5px 10px;border-bottom:1px solid #f0f0f0">
      <div style="font-size:10px;color:#888;margin-bottom:3px">القطاع من الكتالوج</div>
      <select onchange="_stApplyProfile(this.value)"
        style="width:100%;padding:4px 6px;border:1px solid #ccc;border-radius:4px;
               font-size:11px;background:#fff">
        ${profOpts}
      </select>
    </td></tr>
    <!-- صورة القطاع المحدد -->
    ${selProf && selProf.image ? `
    <tr><td colspan="2" style="padding:6px 10px;border-bottom:1px solid #f0f0f0">
      <div style="font-size:10px;color:#888;margin-bottom:4px">مقطع القطاع</div>
      <img src="${selProf.image}"
        style="max-width:100%;max-height:100px;object-fit:contain;
               border:1px solid #e0e0e0;border-radius:4px;display:block">
    </td></tr>` : `
    <tr><td colspan="2" style="padding:6px 10px;border-bottom:1px solid #f0f0f0">
      <div style="font-size:10px;color:#888;margin-bottom:4px">مقطع القطاع (تخطيطي)</div>
      <canvas id="secCanvas" width="215" height="65"
        style="border:1px solid #e0e0e0;border-radius:3px;display:block"></canvas>
    </td></tr>`}
    ${_rRow('الاسم', `<span style="font-weight:600">${selProf ? selProf.name : profileName}</span>`)}
    ${_rRow('الديكور', `<span style="font-weight:600">${deco} مم</span>`)}
    ${_rRow('القطاع', `<span style="font-weight:600">${sec} مم</span>`)}
    ${_rRow('إجمالي', `<span style="font-weight:700;color:#1e2760">${totalFW} مم</span>`)}
    ${_rRow('البركلوز', `<span style="font-weight:600">${_dw.bead} مم</span>`)}
    ${_rRow('خصم الزجاج', `<span>${_dw.bite} مم (${_dw.bite/2}مم/جانب)</span>`)}
    ${_rRow('اللون RAL', `
      <div style="display:flex;align-items:center;gap:5px">
        <div style="width:18px;height:18px;background:${ralHex};
                    border:1px solid #aaa;border-radius:2px"></div>
        <span style="font-weight:600">RAL ${color}</span>
      </div>`)}
  `);
}

// ── بركلوز (Bead) ────────────────────────────────────────────
function _dwgBeadComponentHTML() {
  const { bead, beadName, ralHex, color } = _dw;
  return _rSection('البركلوز (Bead)', `
    ${_rRow('الاسم', `<input value="${beadName}"
      style="${_rInputStyle(130)}"
      onchange="_dw.beadName=this.value">`)}
    ${_rRow('المقاس', `
      <div style="display:flex;align-items:center;gap:4px">
        <input type="number" value="${bead}" style="${_rInputStyle(60)}"
          oninput="_dw.bead=+this.value;_dwgDraw()">
        <span style="color:#888;font-size:10px">مم</span>
      </div>`)}
    ${_rRow('اللون', `
      <div style="display:flex;align-items:center;gap:5px">
        <div style="width:18px;height:18px;background:${ralHex};
                    border:1px solid #aaa;border-radius:2px"></div>
        <span>نفس الإطار — RAL ${color}</span>
      </div>`)}
    ${_rRow('الترتيب', `<span>علوي/سفلي كامل العرض ← جانبي بالداخل</span>`)}
  `);
}

// ── زجاج (Glass) ─────────────────────────────────────────────
function _dwgGlassComponentHTML() {
  const { glassCode, glassColor, W, H, sec, bite } = _dw;
  const gW  = W - 2*sec - bite;
  const gH  = H - 2*sec - bite;
  const glDB = (_dwGlassDB.length ? _dwGlassDB : _GLASS_CAT);
  const gl   = glDB.find(g => g.code === glassCode) || _GLASS_CAT[4];
  const opts = glDB.map(g =>
    `<option value="${g.code}" ${g.code===glassCode?'selected':''}>${g.name} (${g.config})</option>`
  ).join('');
  const curColor = glassColor || _DC.glass;
  const colorSwatches = _GLASS_COLORS.map(gc => `
    <div class="rp-gc-sw" data-c="${gc.color}" title="${gc.name}"
      onclick="_dwgSetGlassColorDirect('${gc.color}')"
      style="width:20px;height:20px;border-radius:3px;cursor:pointer;
             background:${gc.color};
             outline:${gc.color===curColor?'3px solid #1e2760':'1px solid #ccc'};
             flex-shrink:0"></div>`
  ).join('');

  return _rSection('الزجاج (Glass)', `
    ${_rRow('النوع', `
      <select onchange="_dwgSetGlass(this.value)"
        style="width:100%;padding:3px 4px;border:1px solid #ccc;
               border-radius:3px;font-size:11px;background:#fff">
        ${opts}
      </select>`)}
    ${_rRow('التشكيل', `<span style="font-weight:700;color:#1e2760">${gl.config}</span>`)}
    ${_rRow('السماكة الكلية', `<span style="font-weight:700">${gl.thick} مم</span>`)}
    ${_rRow('عرض الزجاج', `<span style="font-weight:600">${gW} مم</span>`)}
    ${_rRow('ارتفاع الزجاج', `<span style="font-weight:600">${gH} مم</span>`)}
    ${_rRow('المساحة', `<span>${(gW*gH/1e6).toFixed(3)} م²</span>`)}
    <div style="padding:4px 8px;margin-top:4px">
      <div style="font-size:10px;color:#888;margin-bottom:5px">لون الزجاج</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">${colorSwatches}</div>
    </div>
  `);
}

// تطبيق القطاع المختار من الكتالوج على الرسم
function _stApplyProfile(id) {
  _dw.profileId = id;
  if (!id) { _dwgRefreshRightPanel(); _dwgDraw(); return; }
  const p = _dwProfiles.find(x => x.id === id);
  if (!p) return;
  _dw.deco         = p.deco;
  _dw.sec          = p.sec;
  _dw.bead         = p.bead;
  _dw.bite         = p.bite;
  _dw.profileName  = p.name;
  _dw.divW         = Math.max(1, p.divW  || 1);
  _dw.divH         = Math.max(1, p.divH  || 1);
  // حساب عرض عارضة T من tBarLines أو القيمة الافتراضية
  if (p.tBarLines && p.tBarLines.length) {
    _dw.tBarW = p.tBarLines.reduce((s,l) => s + (l.wW||l.w||0), 0);
  } else {
    _dw.tBarW = 28;
  }
  _dw.panelWidths  = [];  // إعادة تعيين عند تغيير القطاع
  _dw.panelHeights = [];
  _dw.overlapH     = (p.overlapH !== false);  // افتراضي: أفقي كامل
  // تحديث حقول الخصائص
  ['rDeco','rSec','rBead','rBite'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) el.value = _dw[fid.replace('r','').toLowerCase()];
  });
  _dwgDraw();
  _dwgRefreshRightPanel();
  // تحديث الإحصاءات
  _dwgUpdateStats();
}

function _dwgSetGlass(code) {
  // ابحث في _dwGlassDB أولاً (لأن فيها الألوان المحفوظة)، ثم _GLASS_CAT
  const gl = (_dwGlassDB.length ? _dwGlassDB : _GLASS_CAT).find(g => g.code === code)
          || _GLASS_CAT.find(g => g.code === code);
  if (!gl) return;
  _dw.glassCode  = gl.code;
  _dw.glassThick = gl.thick;
  _dw.glassColor = gl.color || _DC.glass;
  _dwgRefreshRightPanel();
  _dwgDraw();
}

function _dwgSetGlassColorDirect(color) {
  _dw.glassColor = color;
  // حفظ في DB إذا وُجد
  const idx = _dwGlassDB.findIndex(g => g.code === _dw.glassCode);
  if (idx >= 0) { _dwGlassDB[idx].color = color; _dwgSaveKey(_DW_KEYS.glass, _dwGlassDB); }
  _dwgDraw();
  // تحديث التمييز البصري
  document.querySelectorAll('.rp-gc-sw').forEach(el => {
    el.style.outline = el.dataset.c === color ? '3px solid #1e2760' : '1px solid #ccc';
  });
}

// رسم مقطع القطاع التخطيطي (بعد بناء الـ DOM)
function _dwgDrawSecCanvasIn(cv) {
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const w = cv.width, h = cv.height;
  const { deco, sec, bead, ralHex } = _dw;
  const total = deco + sec;
  const sc = (w * 0.42) / total;
  const FC = ralHex || '#878681';
  const y0 = 8, hh = h - 16;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#f8f8f8'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = FC; ctx.fillRect(5, y0, deco*sc, hh);
  ctx.fillStyle = _ralLighter(FC, 0.15); ctx.fillRect(5+deco*sc, y0, sec*sc, hh);
  ctx.fillStyle = _ralLighter(FC, 0.25); ctx.fillRect(5+total*sc, y0, bead*sc, hh);
  ctx.fillStyle = _dw.glassColor || _DC.glass; ctx.fillRect(5+total*sc+bead*sc, y0, 22, hh);
  ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=0.5; ctx.setLineDash([]);
  [5,5+deco*sc,5+total*sc,5+total*sc+bead*sc].forEach(x=>{
    ctx.beginPath(); ctx.moveTo(x,y0); ctx.lineTo(x,y0+hh); ctx.stroke();
  });
  ctx.fillStyle='#fff'; ctx.font='bold 8px Arial'; ctx.textAlign='center';
  ctx.fillText(deco+'م', 5+deco*sc/2, y0+hh/2+3);
  ctx.fillText(sec+'م', 5+deco*sc+sec*sc/2, y0+hh/2+3);
  ctx.fillText(bead+'م', 5+total*sc+bead*sc/2, y0+hh/2+3);
}

function _dwgDrawSecCanvas() {
  const cv = document.getElementById('secCanvas');
  if (!cv) { _dwgDrawSecCanvasIn(document.getElementById('_tipSecCv')); return; }
  const ctx = cv.getContext('2d');
  const w = cv.width, h = cv.height;
  const { deco, sec, bead, ralHex } = _dw;
  const total = deco + sec;
  const sc = (w * 0.4) / total;   // scale

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#f8f8f8';
  ctx.fillRect(0, 0, w, h);

  // رسم مبسط لنصف المقطع (من البرا للداخل)
  const FC = ralHex || '#878681';
  const y0 = 10, hh = h - 20;

  // الديكور
  ctx.fillStyle = FC;
  ctx.fillRect(5, y0, deco*sc, hh);
  ctx.fillStyle = _ralLighter(FC, 0.15);
  ctx.fillRect(5 + deco*sc, y0, sec*sc, hh);
  // البركلوز
  ctx.fillStyle = _ralLighter(FC, 0.25);
  ctx.fillRect(5 + total*sc, y0, bead*sc, hh);
  // الزجاج
  ctx.fillStyle = _dw.glassColor || _DC.glass;
  ctx.fillRect(5 + total*sc + bead*sc, y0, 25, hh);

  // خطوط + نصوص
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([]);
  [5, 5+deco*sc, 5+total*sc, 5+total*sc+bead*sc].forEach(x => {
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0+hh); ctx.stroke();
  });
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(deco+'م', 5 + deco*sc/2, y0+hh/2+3);
  ctx.fillText(sec+'م',  5 + deco*sc + sec*sc/2, y0+hh/2+3);
  ctx.fillText(bead+'م', 5 + total*sc + bead*sc/2, y0+hh/2+3);
  ctx.fillStyle = '#1a3acc';
  ctx.fillText('ز', 5 + total*sc + bead*sc + 12.5, y0+hh/2+3);

  // أسهم
  ctx.strokeStyle = '#555'; ctx.lineWidth = 0.8;
  _dwgSecArrow(ctx, 5, y0+hh+4, 5+deco*sc, y0+hh+4, deco+'مم');
  _dwgSecArrow(ctx, 5+total*sc+bead*sc, y0+hh+4, 5+total*sc+bead*sc+25, y0+hh+4, 'ز');
}

function _dwgSecArrow(ctx, x1, y, x2, _, lbl) {
  ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke();
}

// ════════════════════════════════════════════════════════════
// SETTINGS — إعدادات الرسومات
// ════════════════════════════════════════════════════════════

// ── تحميل الإعدادات من الخادم ───────────────────────────────
function _dwgLoadSettings() {
  const get = key => fetch('/api/data/'+key)
    .then(r => r.ok ? r.json() : {})
    .then(j => (j && j.value != null) ? j.value : null)
    .catch(() => null);
  return Promise.all([
    get(_DW_KEYS.profiles),
    get(_DW_KEYS.glass),
    get(_DW_KEYS.ral),
  ]).then(([profs, glass, ral]) => {
    _dwProfiles = Array.isArray(profs) ? profs : [];
    _dwGlassDB  = Array.isArray(glass) && glass.length ? glass : JSON.parse(JSON.stringify(_GLASS_CAT));
    _dwRalDB    = Array.isArray(ral)   ? ral  : [];
  });
}

function _dwgSaveKey(key, data) {
  return fetch('/api/data/' + key, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: data }),
  });
}

// ── تقديم الإعدادات في صفحة الإعدادات العامة ────────────────
function renderDrawingSettings() {
  const ct = document.getElementById('dwgSettingsContent');
  if (!ct) return;
  _dwgLoadSettings().then(() => {
    ct.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:14px;border-bottom:2px solid #e0e3f0;padding-bottom:0">
      <button id="dst_profiles" onclick="_dstTab('profiles')" style="${_dstBtn(true)}">📐 القطاعات</button>
      <button id="dst_glass"    onclick="_dstTab('glass')"    style="${_dstBtn(false)}">🪟 الزجاج</button>
      <button id="dst_colors"   onclick="_dstTab('colors')"   style="${_dstBtn(false)}">🎨 الألوان</button>
    </div>
    <div id="dstBody" style="margin-top:12px"></div>`;
    _dstTab('profiles');
  });
}

function _dstBtn(active) {
  return `padding:7px 18px;border:none;border-bottom:3px solid ${active?'#1e2760':'transparent'};
          cursor:pointer;font-size:12px;font-weight:600;background:transparent;
          color:${active?'#1e2760':'#666'};margin-bottom:-2px`;
}
function _dstTab(tab) {
  ['profiles','glass','colors'].forEach(t => {
    const b = document.getElementById('dst_'+t);
    if (!b) return;
    b.style.borderBottomColor = t===tab ? '#1e2760' : 'transparent';
    b.style.color = t===tab ? '#1e2760' : '#666';
  });
  const body = document.getElementById('dstBody');
  if (!body) return;
  if (tab==='profiles') body.innerHTML = _stProfilesHTML();
  if (tab==='glass')    body.innerHTML = _stGlassHTML();
  if (tab==='colors')   body.innerHTML = _stColorsHTML();
}

// ── فتح نافذة الإعدادات (Modal - للاستخدام اختياري) ─────────
function dwgOpenSettings() {
  const existing = document.getElementById('dwgSettModal');
  if (existing) { existing.remove(); return; }

  const ov = document.createElement('div');
  ov.id = 'dwgSettModal';
  ov.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.45);
    z-index:9999;display:flex;align-items:center;justify-content:center;
    font-size:12px;direction:rtl`;
  ov.innerHTML = `
  <div style="background:#fff;border-radius:8px;width:720px;max-height:88vh;
              display:flex;flex-direction:column;overflow:hidden;
              box-shadow:0 10px 40px rgba(0,0,0,.35)">
    <!-- Header -->
    <div style="background:#1e2760;color:#fff;padding:11px 16px;
                display:flex;align-items:center;justify-content:space-between;
                border-radius:8px 8px 0 0;flex-shrink:0">
      <span style="font-weight:700;font-size:13px">⚙️ إعدادات الرسومات</span>
      <button onclick="document.getElementById('dwgSettModal').remove()"
        style="background:none;border:none;color:#fff;font-size:20px;
               cursor:pointer;line-height:1;padding:0 4px">✕</button>
    </div>
    <!-- Tabs -->
    <div style="display:flex;background:#f0f1f5;border-bottom:1px solid #d0d3de;flex-shrink:0">
      <button id="st_profiles" onclick="_stTab('profiles')" style="${_stBtn(true)}">📐 القطاعات</button>
      <button id="st_glass"    onclick="_stTab('glass')"    style="${_stBtn(false)}">🪟 الزجاج</button>
      <button id="st_colors"   onclick="_stTab('colors')"   style="${_stBtn(false)}">🎨 الألوان</button>
    </div>
    <!-- Content -->
    <div id="stBody" style="flex:1;overflow-y:auto;padding:16px"></div>
  </div>`;
  document.body.appendChild(ov);
  _stTab('profiles');
}

function _stBtn(active) {
  return `padding:8px 20px;border:none;border-bottom:3px solid ${active?'#1e2760':'transparent'};
          cursor:pointer;font-size:12px;font-weight:600;
          background:${active?'#fff':'transparent'};color:${active?'#1e2760':'#666'}`;
}
function _stTab(tab) {
  ['profiles','glass','colors'].forEach(t => {
    const b = document.getElementById('st_' + t);
    if (!b) return;
    const a = t === tab;
    b.style.borderBottom = a ? '3px solid #1e2760' : '3px solid transparent';
    b.style.background   = a ? '#fff' : 'transparent';
    b.style.color        = a ? '#1e2760' : '#666';
  });
  const body = document.getElementById('stBody');
  if (!body) return;
  if (tab === 'profiles') body.innerHTML = _stProfilesHTML();
  if (tab === 'glass')    body.innerHTML = _stGlassHTML();
  if (tab === 'colors')   body.innerHTML = _stColorsHTML();
}

// يحدّث الواجهة في المودال أو في صفحة الإعدادات (أيهما ظاهر)
function _stRefresh(tab) {
  const html = tab==='profiles' ? _stProfilesHTML()
             : tab==='glass'    ? _stGlassHTML()
             : _stColorsHTML();
  // المودال
  const sb = document.getElementById('stBody');
  if (sb) {
    ['profiles','glass','colors'].forEach(t => {
      const b = document.getElementById('st_'+t);
      if (!b) return;
      const a = t===tab;
      b.style.borderBottom = a?'3px solid #1e2760':'3px solid transparent';
      b.style.background   = a?'#fff':'transparent';
      b.style.color        = a?'#1e2760':'#666';
    });
    sb.innerHTML = html;
  }
  // صفحة الإعدادات
  const db = document.getElementById('dstBody');
  if (db) {
    ['profiles','glass','colors'].forEach(t => {
      const b = document.getElementById('dst_'+t);
      if (!b) return;
      const a = t===tab;
      b.style.borderBottomColor = a?'#1e2760':'transparent';
      b.style.color             = a?'#1e2760':'#666';
    });
    db.innerHTML = html;
  }
}

// ════════════════════════════════════════════════════════════
// TAB: القطاعات
// ════════════════════════════════════════════════════════════
function _stProfilesHTML() {
  const rows = _dwProfiles.length
    ? _dwProfiles.map((p, i) => `
      <tr style="border-bottom:1px solid #f0f0f0;vertical-align:middle">
        <td style="padding:6px 8px;width:52px">
          ${p.image
            ? `<img src="${p.image}" style="width:48px;height:36px;object-fit:contain;
                border:1px solid #e0e0e0;border-radius:3px">`
            : `<div style="width:48px;height:36px;background:#f0f1f5;border-radius:3px;
                display:flex;align-items:center;justify-content:center;font-size:20px">📐</div>`}
        </td>
        <td style="padding:6px 8px;font-weight:600;color:#1e2760">${p.name}</td>
        <td style="padding:6px 8px;color:#555">ديكور ${p.deco}مم</td>
        <td style="padding:6px 8px;color:#555">قطاع ${p.sec}مم</td>
        <td style="padding:6px 8px">
          ${p.lines && p.lines.length ? p.lines.map(l=>`<span style="display:inline-block;background:#e8eaff;color:#1e2760;border-radius:3px;padding:1px 5px;font-size:10px;margin:1px">${l.w}مم${l.corner===90?'⌐':'∠'}</span>`).join('') : `<span style="color:#aaa;font-size:10px">—</span>`}
        </td>
        <td style="padding:6px 8px;color:#555">${p.thickness ? p.thickness+'مم' : '—'}</td>
        <td style="padding:6px 8px;text-align:left">
          <button onclick="_stEditProf(${i})"
            style="padding:3px 9px;border:1px solid #1e2760;border-radius:3px;
                   background:#fff;color:#1e2760;cursor:pointer;font-size:11px">✏️</button>
          <button onclick="_stDelProf(${i})"
            style="padding:3px 9px;border:1px solid #c0392b;border-radius:3px;
                   background:#fff;color:#c0392b;cursor:pointer;font-size:11px;margin-right:4px">🗑</button>
        </td>
      </tr>`)
    .join('')
    : `<tr><td colspan="7" style="padding:24px;text-align:center;color:#aaa">
        لا يوجد قطاعات — اضغط "+ إضافة" لإضافة أول قطاع
       </td></tr>`;

  return `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px">
    <h3 style="margin:0;font-size:14px;color:#1e2760">كتالوج القطاعات</h3>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button onclick="_stDownloadTemplate()"
        style="padding:5px 12px;background:#fff;color:#1e2760;border:1px solid #1e2760;
               border-radius:4px;cursor:pointer;font-size:11px">📥 نموذج Excel</button>
      <button onclick="_stImportProfiles()"
        style="padding:5px 12px;background:#28a745;color:#fff;border:none;
               border-radius:4px;cursor:pointer;font-size:11px;font-weight:600">📤 استيراد Excel/CSV</button>
      <button onclick="_stNewProf()"
        style="padding:5px 16px;background:#1e2760;color:#fff;border:none;
               border-radius:4px;cursor:pointer;font-weight:600;font-size:12px">+ إضافة</button>
    </div>
  </div>
  <div id="stProfForm" style="display:none;margin-bottom:14px"></div>
  <table style="width:100%;border-collapse:collapse;font-size:11px">
    <thead>
      <tr style="background:#f0f1f5;font-size:11px;color:#666">
        <th style="padding:5px 8px;text-align:right">صورة</th>
        <th style="padding:5px 8px;text-align:right">الاسم</th>
        <th style="padding:5px 8px;text-align:right">ديكور</th>
        <th style="padding:5px 8px;text-align:right">حلق</th>
        <th style="padding:5px 8px;text-align:right">خطوط الرسم</th>
        <th style="padding:5px 8px;text-align:right">سماكة</th>
        <th></th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function _stProfFormHTML(p, idx) {
  const v = f => p ? (p[f] ?? '') : '';
  return `
  <div style="background:#f8f9ff;border:1px solid #d0d3de;border-radius:6px;padding:14px;direction:rtl">
    <div style="font-weight:700;color:#1e2760;margin-bottom:12px;font-size:13px">
      ${idx < 0 ? '+ إضافة قطاع جديد' : '✏️ تعديل القطاع'}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px">
      <div style="grid-column:1/-1">
        <label style="display:block;margin-bottom:3px;color:#555;font-size:11px">اسم القطاع *</label>
        <input id="pf_name" value="${v('name')}"
          placeholder="مثال: سرايا ثابت 10.5سم سماكة 1.8مم"
          style="width:100%;padding:5px 8px;border:1px solid #ccc;border-radius:4px;
                 font-size:12px;box-sizing:border-box">
      </div>
      <div>
        <label style="display:block;margin-bottom:3px;color:#555;font-size:11px">الديكور (مم)</label>
        <input id="pf_deco" type="number" value="${v('deco')||40}"
          style="width:100%;padding:5px 8px;border:1px solid #ccc;border-radius:4px;font-size:12px;box-sizing:border-box">
      </div>
      <div>
        <label style="display:block;margin-bottom:3px;color:#555;font-size:11px">واجهة القطاع (مم)</label>
        <input id="pf_sec" type="number" value="${v('sec')||23}"
          style="width:100%;padding:5px 8px;border:1px solid #ccc;border-radius:4px;font-size:12px;box-sizing:border-box">
      </div>
      <div>
        <label style="display:block;margin-bottom:3px;color:#555;font-size:11px">البركلوز (مم)</label>
        <input id="pf_bead" type="number" value="${v('bead')||22}"
          style="width:100%;padding:5px 8px;border:1px solid #ccc;border-radius:4px;font-size:12px;box-sizing:border-box">
      </div>
      <div>
        <label style="display:block;margin-bottom:3px;color:#555;font-size:11px">خصم الزجاج (مم)</label>
        <input id="pf_bite" type="number" value="${v('bite')||8}"
          style="width:100%;padding:5px 8px;border:1px solid #ccc;border-radius:4px;font-size:12px;box-sizing:border-box">
      </div>
      <div>
        <label style="display:block;margin-bottom:3px;color:#555;font-size:11px">السماكة (مم)</label>
        <input id="pf_thick" type="number" step="0.1" value="${v('thickness')||1.8}"
          style="width:100%;padding:5px 8px;border:1px solid #ccc;border-radius:4px;font-size:12px;box-sizing:border-box">
      </div>
      <div style="grid-column:1/-1">
        <label style="display:block;margin-bottom:5px;color:#555;font-size:11px">أولوية التركيب عند الزوايا</label>
        <div style="display:flex;gap:8px">
          <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:11px">
            <input type="radio" id="pf_overlapH_yes" name="pf_overlapH" value="true"  ${(v('overlapH')===false)?'':'checked'}>
            أفقي (علوي+سفلي) كامل العرض
          </label>
          <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:11px">
            <input type="radio" id="pf_overlapH_no"  name="pf_overlapH" value="false" ${(v('overlapH')===false)?'checked':''}>
            رأسي (يسار+يمين) كامل الارتفاع
          </label>
        </div>
      </div>
    </div>

    <!-- ── خطوط الرسم ── -->
    <div style="border:1px solid #d0d3de;border-radius:6px;padding:10px;margin-bottom:10px;background:#fff">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-weight:700;color:#1e2760;font-size:12px">📐 خطوط الرسم (من الخارج للداخل)</span>
        <button type="button" onclick="_stLineAdd()"
          style="padding:4px 12px;background:#1e2760;color:#fff;border:none;
                 border-radius:4px;cursor:pointer;font-size:11px;font-weight:600">+ خط</button>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead>
          <tr style="background:#f0f1f5;color:#666">
            <th style="padding:3px 6px;width:18px">#</th>
            <th style="padding:3px 6px" title="العرض أفقي (يسار+يمين)">أفقي مم</th>
            <th style="padding:3px 6px" title="العرض رأسي (فوق+تحت)">رأسي مم</th>
            <th style="padding:3px 6px">التسمية</th>
            <th style="padding:3px 6px">الزاوية</th>
            <th style="width:28px"></th>
          </tr>
        </thead>
        <tbody id="pf_lines_tbody"></tbody>
      </table>
      <div style="font-size:10px;color:#aaa;margin-top:5px">
        💡 <b>أفقي</b> = سماكة الخط يسار+يمين &nbsp;|&nbsp; <b>رأسي</b> = سماكة الخط فوق+تحت &nbsp;|&nbsp; اكتب <b>زجاج</b> في التسمية لتطبيق لون الزجاج
      </div>
    </div>

    <!-- ── تقسيمات الفتحة ── -->
    <div style="border:1px solid #d0d3de;border-radius:6px;padding:10px;margin-bottom:10px;background:#fff">
      <div style="font-weight:700;color:#1e2760;font-size:12px;margin-bottom:8px">🔲 تقسيمات الفتحة</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
        <div>
          <label style="display:block;margin-bottom:3px;color:#555;font-size:11px">تقسيم العرض</label>
          <input id="pf_divW" type="number" min="1" max="10" value="${v('divW')||1}"
            style="width:100%;padding:5px 8px;border:1px solid #ccc;border-radius:4px;font-size:12px;box-sizing:border-box">
          <div style="font-size:9px;color:#aaa;margin-top:2px">1 = بلا تقسيم، 2 = قطعتين</div>
        </div>
        <div>
          <label style="display:block;margin-bottom:3px;color:#555;font-size:11px">تقسيم الارتفاع</label>
          <input id="pf_divH" type="number" min="1" max="10" value="${v('divH')||1}"
            style="width:100%;padding:5px 8px;border:1px solid #ccc;border-radius:4px;font-size:12px;box-sizing:border-box">
          <div style="font-size:9px;color:#aaa;margin-top:2px">1 = بلا تقسيم، 3 = ثلاث قطع</div>
        </div>
      </div>

      <!-- خطوط عارضة T -->
      <div style="border-top:1px solid #e8eaff;padding-top:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-weight:600;color:#1e2760;font-size:11px">📏 خطوط عارضة T (من اليسار للوسط)</span>
          <button type="button" onclick="_stTBarLineAdd()"
            style="padding:3px 10px;background:#1e2760;color:#fff;border:none;
                   border-radius:4px;cursor:pointer;font-size:10px">+ خط</button>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead>
            <tr style="background:#f0f1f5;color:#666">
              <th style="padding:3px 4px;width:16px">#</th>
              <th style="padding:3px 4px" title="العرض أفقي">أفقي</th>
              <th style="padding:3px 4px" title="العرض رأسي">رأسي</th>
              <th style="padding:3px 4px">التسمية</th>
              <th style="padding:3px 4px">ز.أ</th>
              <th style="padding:3px 4px">ز.ر</th>
              <th style="width:24px"></th>
            </tr>
          </thead>
          <tbody id="pf_tbar_tbody"></tbody>
        </table>
        <div style="font-size:9px;color:#aaa;margin-top:4px">
          💡 الخطوط تُرسم من الحافة الخارجية نحو المركز — الخطوط المتماثلة تُعكس على الجانب الآخر
        </div>
      </div>
    </div>

    <!-- صورة القطاع -->
    <div style="margin-bottom:10px">
      <label style="display:block;margin-bottom:5px;color:#555;font-size:11px">صورة مقطع القطاع</label>
      <div style="display:flex;align-items:center;gap:12px">
        <img id="pf_imgPreview" src="${v('image')}"
          style="width:80px;height:60px;object-fit:contain;border:1px solid #e0e0e0;
                 border-radius:4px;${v('image')?'':'display:none'}">
        <label style="padding:7px 14px;background:#f0f1f5;border:1px solid #ccc;
                      border-radius:4px;cursor:pointer;font-size:11px;color:#444">
          📷 اختر صورة
          <input type="file" accept="image/*" style="display:none"
            onchange="_stLoadImg(this)">
        </label>
        <span style="font-size:10px;color:#aaa">PNG أو JPG للمرجع فقط</span>
      </div>
    </div>
    <input type="hidden" id="pf_img" value="${v('image')}">
    <input type="hidden" id="pf_idx" value="${idx}">
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button onclick="_stCancelProf()"
        style="padding:6px 16px;border:1px solid #ccc;border-radius:4px;
               background:#fff;cursor:pointer;font-size:12px">إلغاء</button>
      <button onclick="_stSaveProf()"
        style="padding:6px 16px;background:#1e2760;color:#fff;border:none;
               border-radius:4px;cursor:pointer;font-size:12px;font-weight:600">💾 حفظ</button>
    </div>
  </div>`;
}

function _stNewProf() {
  _stLines = [
    { w: 63, wW: 63, wH: 63, label: 'إطار',   cornerW: 45, cornerH: 45 },
    { w: 22, wW: 22, wH: 22, label: 'بلكلوز', cornerW: 90, cornerH: 90 },
  ];
  _stTBarLines = [
    { w: 22, wW: 22, wH: 22, label: 'بلكلوز', cornerW: 90, cornerH: 90 },
    { w: 28, wW: 28, wH: 28, label: 'عارضة T', cornerW: 90, cornerH: 90 },
    { w: 22, wW: 22, wH: 22, label: 'بلكلوز', cornerW: 90, cornerH: 90 },
  ];
  const frm = document.getElementById('stProfForm');
  if (!frm) return;
  frm.style.display = 'block';
  frm.innerHTML = _stProfFormHTML(null, -1);
  _stLinesRender();
  _stTBarLinesRender();
  setTimeout(() => frm.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}
function _stEditProf(i) {
  const p = _dwProfiles[i];
  if (!p) { console.warn('_stEditProf: no profile at', i); return; }
  _stLines = p.lines && p.lines.length
    ? JSON.parse(JSON.stringify(p.lines))
    : [
        { w: (p.deco||40)+(p.sec||23), wW: (p.deco||40)+(p.sec||23), wH: (p.deco||40)+(p.sec||23), label: 'إطار',   cornerW: 45, cornerH: 45 },
        { w: p.bead||22, wW: p.bead||22, wH: p.bead||22,               label: 'بلكلوز', cornerW: 90, cornerH: 90 },
      ];
  _stTBarLines = p.tBarLines && p.tBarLines.length
    ? JSON.parse(JSON.stringify(p.tBarLines))
    : [
        { w: p.bead||22, wW: p.bead||22, wH: p.bead||22, label: 'بلكلوز', cornerW: 90, cornerH: 90 },
        { w: p.tBarW||28, wW: p.tBarW||28, wH: p.tBarW||28, label: 'عارضة T', cornerW: 90, cornerH: 90 },
        { w: p.bead||22, wW: p.bead||22, wH: p.bead||22, label: 'بلكلوز', cornerW: 90, cornerH: 90 },
      ];
  const frm = document.getElementById('stProfForm');
  if (!frm) { console.warn('_stEditProf: stProfForm not found'); return; }
  frm.style.display = 'block';
  frm.innerHTML = _stProfFormHTML(p, i);
  _stLinesRender();
  _stTBarLinesRender();
  setTimeout(() => frm.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}
function _stCancelProf() {
  const frm = document.getElementById('stProfForm');
  if (frm) frm.style.display = 'none';
}
function _stLoadImg(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById('pf_imgPreview');
    const hid  = document.getElementById('pf_img');
    if (prev) { prev.src = e.target.result; prev.style.display = 'block'; }
    if (hid)  hid.value = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}
function _stSaveProf() {
  const name = document.getElementById('pf_name')?.value?.trim();
  if (!name) { alert('الرجاء إدخال اسم القطاع'); return; }
  const prof = {
    id        : Date.now().toString(36),
    name,
    deco      : +document.getElementById('pf_deco')?.value  || 40,
    sec       : +document.getElementById('pf_sec')?.value   || 23,
    bead      : +document.getElementById('pf_bead')?.value  || 22,
    bite      : +document.getElementById('pf_bite')?.value  || 8,
    thickness : +document.getElementById('pf_thick')?.value || 1.8,
    divW      : +document.getElementById('pf_divW')?.value  || 1,
    divH      : +document.getElementById('pf_divH')?.value  || 1,
    image     :  document.getElementById('pf_img')?.value   || '',
    lines     :  _stLinesGet(),
    tBarLines :  _stTBarLinesGet(),
    overlapH  :  document.getElementById('pf_overlapH_no')?.checked === true ? false : true,
  };
  const idx = +document.getElementById('pf_idx')?.value;
  if (idx >= 0) _dwProfiles[idx] = { ..._dwProfiles[idx], ...prof, id: _dwProfiles[idx].id };
  else          _dwProfiles.push(prof);
  // Optimistic immediate refresh + save in background
  _stRefresh('profiles');
  _dwgSaveKey(_DW_KEYS.profiles, _dwProfiles).catch(e => console.error('Save profiles:', e));
}
function _stDelProf(i) {
  if (!confirm('حذف هذا القطاع؟')) return;
  _dwProfiles.splice(i, 1);
  _dwgSaveKey(_DW_KEYS.profiles, _dwProfiles).then(() => _stRefresh('profiles'));
}

// ════════════════════════════════════════════════════════════
// TAB: الزجاج
// ════════════════════════════════════════════════════════════
function _stGlassHTML() {
  const list = _dwGlassDB.length ? _dwGlassDB : JSON.parse(JSON.stringify(_GLASS_CAT));
  const colorSwatches = (g, i) => _GLASS_COLORS.map(gc => {
    const active = (g.color || 'rgba(185,228,238,0.72)') === gc.color;
    return `<div class="gc-sw-${i}" data-c="${gc.color}" title="${gc.name}"
      onclick="_stSetGlassColor(${i},'${gc.color}')"
      style="width:18px;height:18px;border-radius:3px;cursor:pointer;flex-shrink:0;
             background:${gc.color};
             outline:${active?'3px solid #1e2760':'1px solid #ccc'};"></div>`;
  }).join('');

  const rows = list.map((g, i) => `
    <tr style="border-bottom:1px solid #f0f0f0;vertical-align:middle">
      <td style="padding:6px 10px;font-weight:600">${g.name}</td>
      <td style="padding:6px 10px;color:#1e2760;font-weight:700">${g.config}</td>
      <td style="padding:6px 10px">${g.thick} مم</td>
      <td style="padding:4px 8px">
        <div style="display:flex;gap:3px;align-items:center;flex-wrap:wrap">
          ${colorSwatches(g, i)}
        </div>
      </td>
      <td style="padding:6px 8px;text-align:left">
        <button onclick="_stDelGlass(${i})"
          style="padding:3px 9px;border:1px solid #c0392b;border-radius:3px;
                 background:#fff;color:#c0392b;cursor:pointer;font-size:11px">🗑</button>
      </td>
    </tr>`).join('');

  // لوحة الألوان للإضافة السريعة
  const addSwatches = _GLASS_COLORS.map(gc => `
    <div title="${gc.name}" onclick="this.parentNode.querySelectorAll('div').forEach(d=>d.style.outline='1px solid #ccc');this.style.outline='3px solid #1e2760';document.getElementById('gn_color').value='${gc.color}'"
      style="width:22px;height:22px;border-radius:4px;cursor:pointer;
             background:${gc.color};outline:${gc.id==='clear'?'3px solid #1e2760':'1px solid #ccc'}" title="${gc.name}"></div>`
  ).join('');

  return `
  <h3 style="margin:0 0 12px;font-size:14px;color:#1e2760">كتالوج الزجاج</h3>
  <!-- إضافة سريعة -->
  <div style="background:#f8f9ff;border:1px solid #d0d3de;border-radius:6px;
              padding:12px;margin-bottom:14px">
    <div style="display:grid;grid-template-columns:1fr 1fr 80px;gap:8px;margin-bottom:8px">
      <div>
        <label style="display:block;margin-bottom:3px;color:#555;font-size:11px">الاسم</label>
        <input id="gn_name" placeholder="مزدوج 6+18+6"
          style="width:100%;padding:5px 8px;border:1px solid #ccc;border-radius:4px;
                 font-size:12px;box-sizing:border-box">
      </div>
      <div>
        <label style="display:block;margin-bottom:3px;color:#555;font-size:11px">التشكيل</label>
        <input id="gn_config" placeholder="6+18+6"
          style="width:100%;padding:5px 8px;border:1px solid #ccc;border-radius:4px;
                 font-size:12px;box-sizing:border-box">
      </div>
      <div>
        <label style="display:block;margin-bottom:3px;color:#555;font-size:11px">السماكة مم</label>
        <input id="gn_thick" type="number" placeholder="30"
          style="width:100%;padding:5px 8px;border:1px solid #ccc;border-radius:4px;
                 font-size:12px;box-sizing:border-box">
      </div>
    </div>
    <div style="margin-bottom:8px">
      <label style="display:block;margin-bottom:4px;color:#555;font-size:11px">لون الزجاج</label>
      <div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap">${addSwatches}</div>
      <input type="hidden" id="gn_color" value="rgba(185,228,238,0.72)">
    </div>
    <div style="text-align:left">
      <button onclick="_stAddGlass()"
        style="padding:6px 18px;background:#1e2760;color:#fff;border:none;
               border-radius:4px;cursor:pointer;font-size:12px;font-weight:600">+ إضافة</button>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:11px">
    <thead>
      <tr style="background:#f0f1f5;color:#666">
        <th style="padding:5px 10px;text-align:right">الاسم</th>
        <th style="padding:5px 10px;text-align:right">التشكيل</th>
        <th style="padding:5px 10px;text-align:right">السماكة</th>
        <th style="padding:5px 10px;text-align:right">لون الزجاج</th>
        <th></th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}
function _stAddGlass() {
  const name   = document.getElementById('gn_name')?.value?.trim();
  const config = document.getElementById('gn_config')?.value?.trim();
  const thick  = +document.getElementById('gn_thick')?.value || 0;
  const color  = document.getElementById('gn_color')?.value || 'rgba(185,228,238,0.72)';
  if (!name || !config || !thick) { alert('الرجاء إدخال جميع الحقول'); return; }
  if (!_dwGlassDB.length) _dwGlassDB = JSON.parse(JSON.stringify(_GLASS_CAT));
  _dwGlassDB.push({ code:'USR-'+Date.now().toString(36), name, config, thick, color });
  _dwgSaveKey(_DW_KEYS.glass, _dwGlassDB).then(() => _stRefresh('glass'));
}

function _stSetGlassColor(i, color) {
  if (!_dwGlassDB.length) _dwGlassDB = JSON.parse(JSON.stringify(_GLASS_CAT));
  _dwGlassDB[i] = { ..._dwGlassDB[i], color };
  _dwgSaveKey(_DW_KEYS.glass, _dwGlassDB);
  // تحديث لون الزجاج في الرسم إذا كان النوع نفسه مختاراً
  if (_dwGlassDB[i].code === _dw.glassCode) { _dw.glassColor = color; _dwgDraw(); }
  // تحديث التحديد البصري في الجدول
  document.querySelectorAll('.gc-sw-'+i).forEach(el => {
    el.style.outline = el.dataset.c === color ? '3px solid #1e2760' : '1px solid #ccc';
  });
}

function _stDelGlass(i) {
  if (!confirm('حذف هذا النوع؟')) return;
  if (!_dwGlassDB.length) _dwGlassDB = JSON.parse(JSON.stringify(_GLASS_CAT));
  _dwGlassDB.splice(i, 1);
  _dwgSaveKey(_DW_KEYS.glass, _dwGlassDB).then(() => _stRefresh('glass'));
}

// ════════════════════════════════════════════════════════════
// LINE MANAGEMENT — خطوط الرسم
// ════════════════════════════════════════════════════════════
let _stLines    = [];   // مؤقت أثناء تحرير نموذج القطاع (خطوط الإطار)
let _stTBarLines = [];  // مؤقت أثناء تحرير نموذج القطاع (خطوط عارضة T)

function _stLineAdd() {
  _stLines.push({ w: 0, label: '', corner: 45 });
  _stLinesRender();
}
function _stLineDel(i) {
  _stLines.splice(i, 1);
  _stLinesRender();
}
function _stLineSet(i, field, val) {
  if (!_stLines[i]) return;
  _stLines[i][field] = (field === 'w' || field === 'corner') ? +val : val;
}
function _stLinesRender() {
  const tbody = document.getElementById('pf_lines_tbody');
  if (!tbody) return;
  if (!_stLines.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding:10px;text-align:center;color:#bbb;font-size:11px">
      لا توجد خطوط — اضغط "+ خط" لإضافة طبقة رسم</td></tr>`;
    return;
  }
  tbody.innerHTML = _stLines.map((l, i) => {
    const wW  = l.wW  !== undefined ? l.wW  : l.w;
    const wH  = l.wH  !== undefined ? l.wH  : l.w;
    const cW  = l.cornerW !== undefined ? l.cornerW : (l.corner || 45);
    const cH  = l.cornerH !== undefined ? l.cornerH : (l.corner || 45);
    return `
    <tr data-li="${i}" style="border-bottom:1px solid #f5f5f5;vertical-align:middle">
      <td style="padding:3px 5px;color:#bbb;font-size:10px">${i+1}</td>
      <td style="padding:2px 3px">
        <input type="number" class="pl_wW" value="${wW}" min="0" max="999" step="0.5"
          oninput="_stLineSet(${i},'wW',this.value)"
          style="width:46px;padding:3px 4px;border:1px solid #ccc;border-radius:4px;font-size:11px;box-sizing:border-box">
      </td>
      <td style="padding:2px 3px">
        <input type="number" class="pl_wH" value="${wH}" min="0" max="999" step="0.5"
          oninput="_stLineSet(${i},'wH',this.value)"
          style="width:46px;padding:3px 4px;border:1px solid #ccc;border-radius:4px;font-size:11px;box-sizing:border-box">
      </td>
      <td style="padding:2px 3px">
        <input type="text" class="pl_lb" value="${l.label||''}" placeholder="إطار / بلكلوز"
          oninput="_stLineSet(${i},'label',this.value)"
          style="width:82px;padding:3px 4px;border:1px solid #ccc;border-radius:4px;font-size:11px;box-sizing:border-box">
      </td>
      <td style="padding:2px 3px">
        <select class="pl_cW" onchange="_stLineSet(${i},'cornerW',this.value)"
          title="زاوية أفقي (يسار+يمين)"
          style="padding:2px 3px;border:1px solid #ccc;border-radius:4px;font-size:10px">
          <option value="45" ${cW===45?'selected':''}>45°∠</option>
          <option value="90" ${cW===90?'selected':''}>90°⌐</option>
        </select>
      </td>
      <td style="padding:2px 3px">
        <select class="pl_cH" onchange="_stLineSet(${i},'cornerH',this.value)"
          title="زاوية رأسي (فوق+تحت)"
          style="padding:2px 3px;border:1px solid #ccc;border-radius:4px;font-size:10px">
          <option value="45" ${cH===45?'selected':''}>45°∠</option>
          <option value="90" ${cH===90?'selected':''}>90°⌐</option>
        </select>
      </td>
      <td style="padding:2px 3px">
        <button type="button" onclick="_stLineDel(${i})"
          style="padding:2px 6px;border:1px solid #c0392b;border-radius:4px;
                 background:#fff;color:#c0392b;cursor:pointer;font-size:10px">✕</button>
      </td>
    </tr>`;
  }).join('');
}
function _stLinesGet() {
  document.querySelectorAll('#pf_lines_tbody tr[data-li]').forEach(row => {
    const i   = +row.dataset.li;
    if (!_stLines[i]) return;
    const wWEl = row.querySelector('.pl_wW');
    const wHEl = row.querySelector('.pl_wH');
    const lEl  = row.querySelector('.pl_lb');
    const cWEl = row.querySelector('.pl_cW');
    const cHEl = row.querySelector('.pl_cH');
    if (wWEl) _stLines[i].wW      = +wWEl.value || 0;
    if (wHEl) _stLines[i].wH      = +wHEl.value || 0;
    if (lEl)  _stLines[i].label   = lEl.value.trim();
    if (cWEl) _stLines[i].cornerW = +cWEl.value || 45;
    if (cHEl) _stLines[i].cornerH = +cHEl.value || 45;
    _stLines[i].w = _stLines[i].wW || 0;
  });
  return _stLines.filter(l => (l.wW || l.w) > 0).map(l => ({ ...l }));
}

// ════════════════════════════════════════════════════════════
// T-BAR LINES — خطوط عارضة T
// ════════════════════════════════════════════════════════════
function _stTBarLineAdd() {
  _stTBarLines.push({ w: 0, wW: 0, wH: 0, label: '', cornerW: 90, cornerH: 90 });
  _stTBarLinesRender();
}
function _stTBarLineDel(i) {
  _stTBarLines.splice(i, 1);
  _stTBarLinesRender();
}
function _stTBarLineSet(i, field, val) {
  if (!_stTBarLines[i]) return;
  _stTBarLines[i][field] = (field==='wW'||field==='wH'||field==='w'||field==='cornerW'||field==='cornerH') ? +val : val;
}
function _stTBarLinesRender() {
  const tbody = document.getElementById('pf_tbar_tbody');
  if (!tbody) return;
  if (!_stTBarLines.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding:8px;text-align:center;color:#bbb;font-size:10px">
      لا توجد خطوط — اضغط "+ خط" لإضافة طبقة</td></tr>`;
    return;
  }
  tbody.innerHTML = _stTBarLines.map((l, i) => {
    const wW = l.wW !== undefined ? l.wW : l.w;
    const wH = l.wH !== undefined ? l.wH : l.w;
    const cW = l.cornerW !== undefined ? l.cornerW : 90;
    const cH = l.cornerH !== undefined ? l.cornerH : 90;
    return `
    <tr data-tli="${i}" style="border-bottom:1px solid #f5f5f5;vertical-align:middle">
      <td style="padding:3px 5px;color:#bbb;font-size:10px">${i+1}</td>
      <td style="padding:2px 3px">
        <input type="number" class="ptl_wW" value="${wW}" min="0" max="999" step="0.5"
          oninput="_stTBarLineSet(${i},'wW',this.value)"
          style="width:46px;padding:3px 4px;border:1px solid #ccc;border-radius:4px;font-size:11px;box-sizing:border-box">
      </td>
      <td style="padding:2px 3px">
        <input type="number" class="ptl_wH" value="${wH}" min="0" max="999" step="0.5"
          oninput="_stTBarLineSet(${i},'wH',this.value)"
          style="width:46px;padding:3px 4px;border:1px solid #ccc;border-radius:4px;font-size:11px;box-sizing:border-box">
      </td>
      <td style="padding:2px 3px">
        <input type="text" class="ptl_lb" value="${l.label||''}" placeholder="بلكلوز / عارضة T"
          oninput="_stTBarLineSet(${i},'label',this.value)"
          style="width:80px;padding:3px 4px;border:1px solid #ccc;border-radius:4px;font-size:11px;box-sizing:border-box">
      </td>
      <td style="padding:2px 3px">
        <select class="ptl_cW" onchange="_stTBarLineSet(${i},'cornerW',this.value)"
          style="padding:2px 3px;border:1px solid #ccc;border-radius:4px;font-size:10px">
          <option value="45" ${cW===45?'selected':''}>45°∠</option>
          <option value="90" ${cW===90?'selected':''}>90°⌐</option>
        </select>
      </td>
      <td style="padding:2px 3px">
        <select class="ptl_cH" onchange="_stTBarLineSet(${i},'cornerH',this.value)"
          style="padding:2px 3px;border:1px solid #ccc;border-radius:4px;font-size:10px">
          <option value="45" ${cH===45?'selected':''}>45°∠</option>
          <option value="90" ${cH===90?'selected':''}>90°⌐</option>
        </select>
      </td>
      <td style="padding:2px 3px">
        <button type="button" onclick="_stTBarLineDel(${i})"
          style="padding:2px 6px;border:1px solid #c0392b;border-radius:4px;
                 background:#fff;color:#c0392b;cursor:pointer;font-size:10px">✕</button>
      </td>
    </tr>`;
  }).join('');
}
function _stTBarLinesGet() {
  document.querySelectorAll('#pf_tbar_tbody tr[data-tli]').forEach(row => {
    const i   = +row.dataset.tli;
    if (!_stTBarLines[i]) return;
    const wWEl = row.querySelector('.ptl_wW');
    const wHEl = row.querySelector('.ptl_wH');
    const lEl  = row.querySelector('.ptl_lb');
    const cWEl = row.querySelector('.ptl_cW');
    const cHEl = row.querySelector('.ptl_cH');
    if (wWEl) _stTBarLines[i].wW      = +wWEl.value || 0;
    if (wHEl) _stTBarLines[i].wH      = +wHEl.value || 0;
    if (lEl)  _stTBarLines[i].label   = lEl.value.trim();
    if (cWEl) _stTBarLines[i].cornerW = +cWEl.value || 90;
    if (cHEl) _stTBarLines[i].cornerH = +cHEl.value || 90;
    _stTBarLines[i].w = _stTBarLines[i].wW || 0;
  });
  return _stTBarLines.filter(l => (l.wW || l.w) > 0).map(l => ({ ...l }));
}

// ════════════════════════════════════════════════════════════
// EXCEL / CSV IMPORT — استيراد القطاعات
// ════════════════════════════════════════════════════════════
function _stImportProfiles() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,.xlsx,.xls';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = ev => _stParseCSV(ev.target.result);
      reader.readAsText(file, 'UTF-8');
    } else {
      _stLoadSheetJS(() => {
        const reader = new FileReader();
        reader.onload = ev => {
          try {
            const wb  = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
            const ws  = wb.Sheets[wb.SheetNames[0]];
            const csv = XLSX.utils.sheet_to_csv(ws);
            _stParseCSV(csv);
          } catch(err) {
            alert('خطأ في قراءة ملف Excel: ' + err.message);
          }
        };
        reader.readAsArrayBuffer(file);
      });
    }
  };
  input.click();
}

function _stLoadSheetJS(cb) {
  if (typeof XLSX !== 'undefined') { cb(); return; }
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  s.onload  = cb;
  s.onerror = () => alert('تعذّر تحميل مكتبة XLSX — تحقق من اتصال الإنترنت.');
  document.head.appendChild(s);
}

function _stParseCSV(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) { alert('الملف لا يحتوي على بيانات كافية'); return; }
  // Skip header
  let added = 0;
  lines.slice(1).forEach(row => {
    const c = _csvSplit(row);
    if (!c[1]) return;
    const profileLines = [];
    for (let ci = 8; ci + 1 < c.length; ci += 2) {
      const w = parseFloat(c[ci]) || 0;
      const corner = parseInt(c[ci+1]) === 90 ? 90 : 45;
      if (w > 0) profileLines.push({ w, label: '', corner });
    }
    // Auto-label last line as bead if no labels
    if (profileLines.length >= 2) {
      profileLines[0].label = 'إطار';
      profileLines[profileLines.length-1].label = 'بلكلوز';
    }
    _dwProfiles.push({
      id       : Date.now().toString(36) + Math.random().toString(36).slice(2,5),
      name     : (c[1]||'').trim(),
      desc     : (c[2]||'').trim(),
      deco     : parseFloat(c[3]) || 40,
      sec      : parseFloat(c[4]) || 23,
      depth    : parseFloat(c[5]) || 105,
      bead     : parseFloat(c[6]) || 22,
      thickness: parseFloat(c[7]) || 1.8,
      bite     : 8,
      image    : '',
      lines    : profileLines,
    });
    added++;
  });
  if (!added) { alert('لم يتم العثور على بيانات صالحة. تحقق من تنسيق الملف.'); return; }
  _stRefresh('profiles');
  _dwgSaveKey(_DW_KEYS.profiles, _dwProfiles);
  setTimeout(() => alert(`✅ تم استيراد ${added} قطاع بنجاح`), 100);
}

function _csvSplit(row) {
  const result = []; let inQ = false, cur = '';
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  result.push(cur.trim());
  return result;
}

function _stDownloadTemplate() {
  const bom = '\uFEFF'; // BOM for Arabic Excel
  const h = '#,الاسم,الوصف,ديكور,حلق,عمق,بلكلوز,سماكة,خط1_عرض,خط1_زاوية,خط2_عرض,خط2_زاوية,خط3_عرض,خط3_زاوية,خط4_عرض,خط4_زاوية,خط5_عرض,خط5_زاوية,خط6_عرض,خط6_زاوية';
  const r1 = '1,سرايا ثابت 10سم,ثابت,40,23,105,22,1.8,63,45,22,90,0,45,0,45,0,45,0,45';
  const r2 = '2,سرايا مفصلي 10سم,مفصلي,40,52,105,22,1.8,57,45,52,45,22,90,0,45,0,45,0,45';
  const csv = bom + [h, r1, r2].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'قطاعات_الألمنيوم_نموذج.csv';
  a.click(); URL.revokeObjectURL(url);
}

// ════════════════════════════════════════════════════════════
// TAB: الألوان
// ════════════════════════════════════════════════════════════
function _stColorsHTML() {
  const allRal = [..._RAL, ..._dwRalDB];

  // جدول الألوان الحالية
  const rows = allRal.map((c, i) => {
    const isCustom = i >= _RAL.length;
    return `
    <div style="display:flex;align-items:center;gap:10px;padding:6px 8px;
                border-bottom:1px solid #f5f5f5;border-radius:4px;
                background:${isCustom?'#fffaf0':'transparent'}">
      <div style="width:38px;height:24px;background:${c.hex};flex-shrink:0;
                  border:1px solid rgba(0,0,0,0.15);border-radius:4px;
                  box-shadow:inset 0 1px 2px rgba(0,0,0,0.08)"></div>
      <span style="font-weight:700;color:#1e2760;width:72px;flex-shrink:0;direction:ltr">RAL ${c.code}</span>
      <span style="color:#444;flex:1;font-size:12px">${c.name}</span>
      <span style="font-size:10px;color:#aaa;direction:ltr;font-family:monospace">${c.hex}</span>
      ${isCustom ? `<button onclick="_stDelRal(${i - _RAL.length})"
        style="padding:2px 8px;border:1px solid #c0392b;border-radius:3px;
               background:#fff;color:#c0392b;cursor:pointer;font-size:10px;flex-shrink:0">🗑</button>` : ''}
    </div>`;
  }).join('');

  return `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
    <h3 style="margin:0;font-size:14px;color:#1e2760">ألوان الألمنيوم (RAL)</h3>
    <span style="font-size:11px;color:#888">${allRal.length} لون</span>
  </div>

  <!-- إضافة لون جديد -->
  <div style="background:#f8f9ff;border:1px solid #d0d3de;border-radius:6px;
              padding:12px;margin-bottom:14px">
    <div style="font-weight:600;font-size:12px;color:#1e2760;margin-bottom:8px">+ إضافة لون RAL مخصص</div>
    <div style="display:grid;grid-template-columns:80px 1fr 90px auto;gap:8px;align-items:end">
      <div>
        <label style="display:block;margin-bottom:3px;color:#555;font-size:11px">كود RAL</label>
        <input id="ral_code" placeholder="مثال: 6011" maxlength="6"
          style="width:100%;padding:5px 8px;border:1px solid #ccc;border-radius:4px;
                 font-size:12px;box-sizing:border-box;direction:ltr">
      </div>
      <div>
        <label style="display:block;margin-bottom:3px;color:#555;font-size:11px">الاسم</label>
        <input id="ral_name" placeholder="مثال: Reseda Green"
          style="width:100%;padding:5px 8px;border:1px solid #ccc;border-radius:4px;
                 font-size:12px;box-sizing:border-box">
      </div>
      <div>
        <label style="display:block;margin-bottom:3px;color:#555;font-size:11px">اللون</label>
        <input id="ral_hex" type="color" value="#808080"
          style="width:100%;height:32px;padding:2px;border:1px solid #ccc;border-radius:4px;cursor:pointer">
      </div>
      <div>
        <button onclick="_stAddRal()"
          style="padding:6px 14px;background:#1e2760;color:#fff;border:none;
                 border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;
                 white-space:nowrap">+ إضافة</button>
      </div>
    </div>
  </div>

  <!-- قائمة الألوان -->
  <div style="max-height:420px;overflow-y:auto;border:1px solid #e8e8e8;border-radius:6px;padding:4px">
    ${rows}
  </div>`;
}

function _stAddRal() {
  const code = document.getElementById('ral_code')?.value?.trim();
  const name = document.getElementById('ral_name')?.value?.trim();
  const hex  = document.getElementById('ral_hex')?.value  || '#808080';
  if (!code || !name) { alert('الرجاء إدخال الكود والاسم'); return; }
  if ([..._RAL,..._dwRalDB].some(c => c.code === code)) { alert('الكود موجود مسبقاً'); return; }
  _dwRalDB.push({ code, name, hex });
  _dwgSaveKey(_DW_KEYS.ral, _dwRalDB).then(() => _stRefresh('colors'));
}
function _stDelRal(i) {
  if (!confirm('حذف هذا اللون؟')) return;
  _dwRalDB.splice(i, 1);
  _dwgSaveKey(_DW_KEYS.ral, _dwRalDB).then(() => _stRefresh('colors'));
}

// ════════════════════════════════════════════════════════════
// THUMBNAIL ICONS — رسم الأيقونات الصغيرة
// ════════════════════════════════════════════════════════════
function _dwgDrawAllThumbs() {
  const map = {
    ico_rect:   (c,ctx) => _icoFixed(ctx,2,2,c.width-4,c.height-4),
    ico_rect2v: (c,ctx) => { const hw=(c.width-4-2)/2;
                  _icoFixed(ctx,2,2,hw,c.height-4);
                  _icoFixed(ctx,2+hw+2,2,hw,c.height-4); },
    ico_rect2h: (c,ctx) => { const hh=(c.height-4-2)/2;
                  _icoFixed(ctx,2,2,c.width-4,hh);
                  _icoFixed(ctx,2,2+hh+2,c.width-4,hh); },
    ico_rect3v: (c,ctx) => { const hw=(c.width-4-4)/3;
                  for(let i=0;i<3;i++) _icoFixed(ctx,2+i*(hw+2),2,hw,c.height-4); },
    ico_rect4:  (c,ctx) => { const hw=(c.width-4-2)/2,hh=(c.height-4-2)/2;
                  _icoFixed(ctx,2,2,hw,hh); _icoFixed(ctx,2+hw+2,2,hw,hh);
                  _icoFixed(ctx,2,2+hh+2,hw,hh); _icoFixed(ctx,2+hw+2,2+hh+2,hw,hh); },
    ico_door1:  (c,ctx) => { const fwD=Math.max(2,Math.min(c.width,c.height)*0.12);
                  const FCD=_dw.ralHex||'#878681';
                  ctx.fillStyle=FCD; ctx.fillRect(2,2,c.width-4,c.height-4);
                  ctx.fillStyle=_ralLighter(FCD,0.1); ctx.fillRect(2+fwD*0.55,2+fwD*0.55,c.width-4-fwD*1.1,c.height-4-fwD*1.1);
                  ctx.fillStyle=_dw.glassColor||_DC.glass; ctx.fillRect(2+fwD,2+fwD,c.width-4-fwD*2,c.height-4-fwD*2);
                  // إخفاء البركلوز السفلي (باب)
                  ctx.fillStyle=FCD; ctx.fillRect(2,2+c.height-4-fwD,c.width-4,fwD); },
    ico_door2:  (c,ctx) => { const hh1=Math.round((c.height-4)*0.33),hh2=c.height-4-hh1-2;
                  _icoFixed(ctx,2,2,c.width-4,hh1);
                  const fwD2=Math.max(2,Math.min(c.width-4,hh2)*0.12);
                  const FCD2=_dw.ralHex||'#878681';
                  ctx.fillStyle=FCD2; ctx.fillRect(2,2+hh1+2,c.width-4,hh2);
                  ctx.fillStyle=_ralLighter(FCD2,0.1); ctx.fillRect(2+fwD2*0.55,2+hh1+2+fwD2*0.55,c.width-4-fwD2*1.1,hh2-fwD2*1.1);
                  ctx.fillStyle=_dw.glassColor||_DC.glass; ctx.fillRect(2+fwD2,2+hh1+2+fwD2,c.width-4-fwD2*2,hh2-fwD2*2);
                  ctx.fillStyle=FCD2; ctx.fillRect(2,2+hh1+2+hh2-fwD2,c.width-4,fwD2); },
    ico_sp_v:   (c,ctx) => { _icoFixed(ctx,2,2,c.width-4,c.height-4);
                  ctx.strokeStyle='#4a52c0';ctx.lineWidth=1.5;ctx.setLineDash([]);
                  ctx.beginPath();ctx.moveTo(c.width/2,2);ctx.lineTo(c.width/2,c.height-2);ctx.stroke(); },
    ico_sp_h:   (c,ctx) => { _icoFixed(ctx,2,2,c.width-4,c.height-4);
                  ctx.strokeStyle='#4a52c0';ctx.lineWidth=1.5;ctx.setLineDash([]);
                  ctx.beginPath();ctx.moveTo(2,c.height/2);ctx.lineTo(c.width-2,c.height/2);ctx.stroke(); },
    ico_sp_2v:  (c,ctx) => { _icoFixed(ctx,2,2,c.width-4,c.height-4);
                  [c.width/3,c.width*2/3].forEach(x=>{
                    ctx.strokeStyle='#4a52c0';ctx.lineWidth=1.2;ctx.setLineDash([]);
                    ctx.beginPath();ctx.moveTo(x,2);ctx.lineTo(x,c.height-2);ctx.stroke();}); },
    ico_sp_2h:  (c,ctx) => { _icoFixed(ctx,2,2,c.width-4,c.height-4);
                  [c.height/3,c.height*2/3].forEach(y=>{
                    ctx.strokeStyle='#4a52c0';ctx.lineWidth=1.2;ctx.setLineDash([]);
                    ctx.beginPath();ctx.moveTo(2,y);ctx.lineTo(c.width-2,y);ctx.stroke();}); },
    ico_sp_x:   (c,ctx) => { _icoFixed(ctx,2,2,c.width-4,c.height-4);
                  ctx.strokeStyle='#4a52c0';ctx.lineWidth=1.2;ctx.setLineDash([]);
                  ctx.beginPath();
                  ctx.moveTo(c.width/2,2);ctx.lineTo(c.width/2,c.height-2);
                  ctx.moveTo(2,c.height/2);ctx.lineTo(c.width-2,c.height/2);
                  ctx.stroke(); },
    ico_wg_f:   (c,ctx) => _icoFixed(ctx,2,2,c.width-4,c.height-4),
    ico_wg_cl:  (c,ctx) => { _icoFixed(ctx,2,2,c.width-4,c.height-4);
                  _icoCasement(ctx,2,2,c.width-4,c.height-4,'L'); },
    ico_wg_sl:  (c,ctx) => { const hw=(c.width-4-2)/2;
                  _icoFixed(ctx,2,2,hw,c.height-4); _icoSlide(ctx,2,2,hw,c.height-4,'R');
                  _icoFixed(ctx,4+hw,2,hw,c.height-4); _icoSlide(ctx,4+hw,2,hw,c.height-4,'L'); },
    ico_wg_aw:  (c,ctx) => { _icoFixed(ctx,2,2,c.width-4,c.height-4);
                  _icoAwning(ctx,2,2,c.width-4,c.height-4); },
    ico_sf_p:   (c,ctx) => { ctx.fillStyle='#888';ctx.fillRect(2,2,c.width-4,c.height-4); },
    ico_sc_1:   (c,ctx) => { _icoFixed(ctx,2,2,c.width-4,c.height-4);
                  ctx.strokeStyle='#999';ctx.lineWidth=0.8;
                  for(let i=4;i<c.width-2;i+=4){ctx.beginPath();ctx.moveTo(i,2);ctx.lineTo(i,c.height-2);ctx.stroke();}
                  for(let j=4;j<c.height-2;j+=4){ctx.beginPath();ctx.moveTo(2,j);ctx.lineTo(c.width-2,j);ctx.stroke();} },
    ico_sh_1:   (c,ctx) => { _icoFixed(ctx,2,2,c.width-4,c.height-4);
                  for(let j=5;j<c.height-2;j+=5){ctx.strokeStyle='#555';ctx.lineWidth=1;
                    ctx.beginPath();ctx.moveTo(2,j);ctx.lineTo(c.width-2,j);ctx.stroke();} },
    ico_ms_1:   (c,ctx) => { ctx.fillStyle='#888';ctx.fillRect(2,c.height-6,c.width-4,4); },
    ico_ms_2:   (c,ctx) => { ctx.fillStyle='#888';ctx.fillRect(2,2,c.width-4,4); },
  };

  Object.keys(map).forEach(id => {
    const cv = document.getElementById(id);
    if (!cv) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0,0,cv.width,cv.height);
    map[id](cv, ctx);
  });
}

function _icoFixed(ctx, x, y, w, h) {
  const fw = Math.max(2, Math.min(w,h)*0.12);
  const FC = _dw.ralHex || '#878681';
  ctx.fillStyle = FC;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = _ralLighter(FC, 0.1);
  ctx.fillRect(x+fw*0.55, y+fw*0.55, w-fw*1.1, h-fw*1.1);
  ctx.fillStyle = _dw.glassColor || _DC.glass;
  ctx.fillRect(x+fw, y+fw, w-fw*2, h-fw*2);
}

function _icoCasement(ctx, x, y, w, h, side) {
  const fw = Math.max(2, Math.min(w,h)*0.12);
  const mx = x+fw, my = y+fw, mw = w-fw*2, mh = h-fw*2;
  ctx.strokeStyle='#333';ctx.lineWidth=0.8;ctx.setLineDash([2,1.5]);
  ctx.beginPath();
  if(side==='L'){ctx.moveTo(mx+mw,my);ctx.lineTo(mx,my+mh/2);ctx.lineTo(mx+mw,my+mh);}
  else{ctx.moveTo(mx,my);ctx.lineTo(mx+mw,my+mh/2);ctx.lineTo(mx,my+mh);}
  ctx.stroke();ctx.setLineDash([]);
}
function _icoSlide(ctx, x, y, w, h, dir) {
  const cy=y+h/2, al=w*0.3;
  ctx.strokeStyle='#333';ctx.fillStyle='#333';ctx.lineWidth=0.9;ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(dir==='L'?x+w-al-fw:x+al,cy);
  ctx.lineTo(dir==='L'?x+al:x+w-al,cy);
  ctx.stroke();
  const ax=dir==='L'?x+al:x+w-al;
  ctx.beginPath();ctx.moveTo(ax,cy);
  ctx.lineTo(ax+(dir==='L'?4:-4),cy-3);
  ctx.lineTo(ax+(dir==='L'?4:-4),cy+3);
  ctx.closePath();ctx.fill();
}
function _icoAwning(ctx, x, y, w, h) {
  const fw = Math.max(2, Math.min(w,h)*0.12);
  const mx=x+fw,my=y+fw,mw=w-fw*2,mh=h-fw*2;
  ctx.strokeStyle='#333';ctx.lineWidth=0.9;ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(mx,my);ctx.lineTo(mx+mw/2,my+mh);ctx.lineTo(mx+mw,my);
  ctx.stroke();
}
const fw=0; // placeholder to avoid lint error in _icoSlide above

// ════════════════════════════════════════════════════════════
// CANVAS RESIZE
// ════════════════════════════════════════════════════════════
function _dwgOnResize() { _dwgResizeCanvas(); _dwgDraw(); }
function _dwgResizeCanvas() {
  const ca = document.getElementById('dwgCanvasWrap');
  const cv = _dw.cv;
  if (!ca || !cv) return;
  const w = ca.clientWidth  || ca.offsetWidth  || 600;
  const h = ca.clientHeight || ca.offsetHeight || 500;
  if (cv.width !== w || cv.height !== h) {
    cv.width  = w;
    cv.height = h;
  }
}

// ════════════════════════════════════════════════════════════
// MAIN DRAW
// ════════════════════════════════════════════════════════════
function _dwgDraw() {
  const cv=_dw.cv, ctx=_dw.ctx;
  if(!ctx) return;
  _dwgBuildModel();
  ctx.clearRect(0,0,cv.width,cv.height);
  ctx.fillStyle='#ffffff';
  ctx.fillRect(0,0,cv.width,cv.height);
  if(_dw.showGrid) _dwgDrawGrid(ctx,cv.width,cv.height);

  // اختر محرك الرسم بناء على وجود خطوط في القطاع
  const selProf = _dwProfiles.find(p => p.id === _dw.profileId);
  if (selProf && selProf.lines && selProf.lines.some(l => l.w > 0)) {
    _dwgDrawFrameLines(ctx, cv.width, cv.height, selProf);
  } else {
    _dwgDrawFrame(ctx, cv.width, cv.height);
  }
}

// ── الشبكة ──────────────────────────────────────────────────
function _dwgDrawGrid(ctx, cw, ch) {
  const step = 40 * _dw.zoom;
  ctx.save();
  ctx.strokeStyle = _DC.grid;
  ctx.lineWidth   = 0.5;
  ctx.setLineDash([]);
  for(let x=0; x<cw; x+=step){
    ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,ch);ctx.stroke();
  }
  for(let y=0; y<ch; y+=step){
    ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(cw,y);ctx.stroke();
  }
  ctx.restore();
}

// ════════════════════════════════════════════════════════════
// DRAW FRAME BY LINES — محرك الرسم متعدد الخطوط
// ════════════════════════════════════════════════════════════
function _dwgDrawFrameLines(ctx, cw, ch, prof) {
  const { W, H, zoom, viewMode, ralHex, glassColor,
          showDecosDim, showSectionDim } = _dw;
  const deco     = prof.deco  || 40;
  const sec      = prof.sec   || 23;
  const bead     = prof.bead  || 22;
  const divW     = Math.max(1, _dw.divW  || prof.divW  || 1);
  const divH     = Math.max(1, _dw.divH  || prof.divH  || 1);
  const overlapH = _dw.overlapH !== false;
  const FC    = ralHex || '#878681';
  const FCL   = _ralLighter(FC, 0.12);
  const isInside = viewMode !== 'Outside';

  const anyDim = showDecosDim || showSectionDim;
  const hasPanelDims = anyDim && ((_dw.divW||1) > 1 || (_dw.divH||1) > 1);
  const DIM  = hasPanelDims ? 100 : (anyDim ? 72 : 20);
  const TW   = W + 2*deco;
  const TH   = H + 2*deco;
  const sc   = Math.min((cw-DIM*2)/TW, (ch-DIM*2)/TH) * zoom;
  const ox   = Math.round((cw - TW*sc)/2);
  const oy   = Math.round((ch - TH*sc)/2);
  const OW   = TW*sc, OH = TH*sc;

  const activelines = prof.lines.filter(l => (l.wW||l.w||0) > 0 || (l.wH||l.w||0) > 0);

  // ── رسم الطبقات من الخارج للداخل ──
  let accW = 0, accH = 0;
  activelines.forEach((line, i) => {
    const lineWW = line.wW !== undefined ? line.wW : (line.w || 0);
    const lineWH = line.wH !== undefined ? line.wH : (line.w || 0);
    const lx = ox + accW*sc, ly = oy + accH*sc;
    const lw = OW - 2*accW*sc, lh = OH - 2*accH*sc;
    if (lw <= 0 || lh <= 0) { accW += lineWW; accH += lineWH; return; }

    const isGlassLine = /زجاج|glass/i.test(line.label || '');
    const fillColor = isGlassLine
      ? (glassColor || _DC.glass)
      : (i === 0 ? FC : _ralLighter(FC, i * 0.09));

    const llW = lineWW * sc, llH = lineWH * sc;

    if (!isGlassLine) {
      ctx.fillStyle = fillColor;
      // باب: الطبقة الأخيرة (بلكلوز) بدون شريط سفلي
      const isLastLine  = (i === activelines.length - 1);
      const skipBottom  = isLastLine && _dw.doorBottom === false;
      if (overlapH) {
        // أفقي كامل العرض: شريط علوي+سفلي كامل، رأسي بينهم
        ctx.fillRect(lx,        ly,              lw, llH);               // علوي كامل
        if (!skipBottom)
          ctx.fillRect(lx,      ly + lh - llH,   lw, llH);               // سفلي كامل
        ctx.fillRect(lx,        ly + llH,        llW, skipBottom ? lh - llH : lh - 2*llH); // رأسي يسار
        ctx.fillRect(lx+lw-llW, ly + llH,        llW, skipBottom ? lh - llH : lh - 2*llH); // رأسي يمين
      } else {
        // رأسي كامل الارتفاع: شريط يسار+يمين كامل، أفقي بينهم
        ctx.fillRect(lx,        ly,              llW, lh);               // يسار كامل
        ctx.fillRect(lx+lw-llW, ly,              llW, lh);               // يمين كامل
        ctx.fillRect(lx + llW,  ly,              lw-2*llW, llH);         // أفقي علوي
        if (!skipBottom)
          ctx.fillRect(lx + llW, ly + lh - llH,  lw-2*llW, llH);         // أفقي سفلي
      }
      // خطوط تفاصيل داخلية (تباين أوضح)
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(lx + llW, ly + llH, lw - 2*llW, lh - 2*llH);
      ctx.restore();

      // خطوط 45° عند زوايا هذه الطبقة
      var cW = line.cornerW !== undefined ? line.cornerW : (line.corner || 45);
      if (cW === 45) {
        ctx.save();
        ctx.strokeStyle = 'rgba(60,60,60,0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx+llW, ly+llH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(lx+lw, ly); ctx.lineTo(lx+lw-llW, ly+llH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(lx, ly+lh); ctx.lineTo(lx+llW, ly+lh-llH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(lx+lw, ly+lh); ctx.lineTo(lx+lw-llW, ly+lh-llH); ctx.stroke();
        ctx.restore();
      }
    }

    accW += lineWW;
    accH += lineWH;
  });

  // ── رسم خطوط 45 درجة عند زوايا الإطار (الطبقة الأولى) ──
  {
    const secPx = (activelines.length > 0 ? (activelines[0].wW !== undefined ? activelines[0].wW : activelines[0].w || 0) : 0) * sc;
    ctx.save();
    ctx.strokeStyle = 'rgba(60,60,60,0.4)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + secPx, oy + secPx); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox + OW, oy); ctx.lineTo(ox + OW - secPx, oy + secPx); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy + OH); ctx.lineTo(ox + secPx, oy + OH - secPx); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox + OW, oy + OH); ctx.lineTo(ox + OW - secPx, oy + OH - secPx); ctx.stroke();
    ctx.restore();
  }

  // ── منطقة الزجاج (الوسط المتبقي) ──────────────────────
  const gx = ox + accW*sc, gy = oy + accH*sc;
  const GW = Math.max(0, OW - 2*accW*sc);
  const GH = Math.max(0, OH - 2*accH*sc);

  if (GW > 2 && GH > 2) {
    // ── ملء الزجاج الكامل أولاً ──────────────────────────
    ctx.fillStyle = glassColor || _DC.glass;
    ctx.fillRect(gx, gy, GW, GH);
    const gr = ctx.createLinearGradient(gx, gy, gx+GW*0.5, gy+GH*0.5);
    gr.addColorStop(0, 'rgba(255,255,255,0.22)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(gx, gy, GW, GH);

    // ── بناء بيانات عارضة T — القاطع فقط بدون البكلوز ──
    // البكلوز تبع كل فتحة منفصل، مو جزء من القاطع
    const tblRaw = prof.tBarLines && prof.tBarLines.length
      ? prof.tBarLines.filter(l => (l.wW || l.w || 0) > 0)
      : [
          { wW: (prof.tBarW || _dw.tBarW || 28), label: 'عارضة T' },
        ];
    // عرض القاطع الفعلي = فقط T-bar بدون بكلوز
    const tBarOnlyW = _dw.tBarW || 28;
    const tBarTotalW = tblRaw.reduce((s, l) => s + (l.wW || l.w || 0), 0);
    const tBarTotalH = tblRaw.reduce((s, l) => s + (l.wH !== undefined ? l.wH : (l.wW || l.w || 0)), 0);

    // ── استخدام النموذج لرسم عارضات T والألواح ──────────
    const model = _dw._model;
    const frameSec = model.frame.sec;
    const modelVFull = model.frame.vFull !== false;

    // ── رسم عارضات T من النموذج (تدعم vFull/split) ──────
    const firstLWH = activelines.length > 0
      ? (activelines[0].wH !== undefined ? activelines[0].wH : activelines[0].w || 0)
      : 0;
    const firstLWW = activelines.length > 0
      ? (activelines[0].wW !== undefined ? activelines[0].wW : activelines[0].w || 0)
      : 0;

    for (var tbi = 0; tbi < model.tBars.length; tbi++) {
      var bar = model.tBars[tbi];
      if (bar.orientation === 'vertical') {
        var bx = gx + (bar.x - frameSec) * sc;
        var by_bar, bh_bar;
        if (bar.isFull) {
          by_bar = oy + firstLWH * sc;
          bh_bar = OH - 2 * firstLWH * sc;
        } else {
          by_bar = gy + (bar.y - frameSec) * sc;
          bh_bar = bar.h * sc;
        }
        // Draw T-bar — القاطع فقط (بدون بكلوز)
        var vbW = tBarOnlyW * sc;
        // لون القاطع أغمق قليلاً من الإطار
        ctx.fillStyle = _ralDarker(FC, 0.04);
        ctx.fillRect(bx, by_bar, vbW, bh_bar);
        // خط وسط القاطع
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(bx + vbW/2, by_bar); ctx.lineTo(bx + vbW/2, by_bar + bh_bar); ctx.stroke();
        ctx.restore();
        // خطوط 45° عند أطراف القاطع الرأسي
        ctx.save();
        ctx.strokeStyle = 'rgba(50,50,50,0.35)';
        ctx.lineWidth = 1;
        var vbHalf = vbW / 2;
        ctx.beginPath(); ctx.moveTo(bx, by_bar); ctx.lineTo(bx + vbHalf, by_bar + vbHalf); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + vbW, by_bar); ctx.lineTo(bx + vbHalf, by_bar + vbHalf); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx, by_bar + bh_bar); ctx.lineTo(bx + vbHalf, by_bar + bh_bar - vbHalf); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + vbW, by_bar + bh_bar); ctx.lineTo(bx + vbHalf, by_bar + bh_bar - vbHalf); ctx.stroke();
        ctx.restore();
      } else {
        // horizontal
        var by2 = gy + (bar.y - frameSec) * sc;
        var bx_bar, bw_bar;
        if (bar.isFull) {
          bx_bar = ox + firstLWW * sc;
          bw_bar = OW - 2 * firstLWW * sc;
        } else {
          bx_bar = gx + (bar.x - frameSec) * sc;
          bw_bar = bar.w * sc;
        }
        // Draw T-bar الأفقي — القاطع فقط (بدون بكلوز)
        var hbH = tBarOnlyW * sc;
        ctx.fillStyle = _ralDarker(FC, 0.04);
        ctx.fillRect(bx_bar, by2, bw_bar, hbH);
        // خط وسط القاطع
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(bx_bar, by2 + hbH/2); ctx.lineTo(bx_bar + bw_bar, by2 + hbH/2); ctx.stroke();
        ctx.restore();
        // خطوط 45° عند أطراف القاطع الأفقي
        ctx.save();
        ctx.strokeStyle = 'rgba(50,50,50,0.35)';
        ctx.lineWidth = 1;
        var hbHalf = hbH / 2;
        ctx.beginPath(); ctx.moveTo(bx_bar, by2); ctx.lineTo(bx_bar + hbHalf, by2 + hbHalf); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx_bar, by2 + hbH); ctx.lineTo(bx_bar + hbHalf, by2 + hbHalf); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx_bar + bw_bar, by2); ctx.lineTo(bx_bar + bw_bar - hbHalf, by2 + hbHalf); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx_bar + bw_bar, by2 + hbH); ctx.lineTo(bx_bar + bw_bar - hbHalf, by2 + hbHalf); ctx.stroke();
        ctx.restore();
      }
    }

    // ── تخزين مناطق عارضات T (للسحب) — عرض القاطع فقط ────
    _dw._tBarZones = [];
    var tBarPxW = tBarOnlyW * sc;
    for (const bar of model.vBars) {
      const cx = gx + (bar.x - frameSec) * sc;
      _dw._tBarZones.push({
        axis: 'W', index: bar.index,
        x: cx, y: gy, w: tBarPxW, h: GH, sc: sc
      });
    }
    for (const bar of model.hBars) {
      const cy = gy + (bar.y - frameSec) * sc;
      _dw._tBarZones.push({
        axis: 'H', index: bar.index,
        x: gx, y: cy, w: GW, h: tBarPxW, sc: sc
      });
    }

    // ── رسم البكلوز والزجاج لكل فتحة — كل فتحة مستقلة ──
    _dw._panelZones = [];
    const bpxVal = bead * sc;
    let labelIdx = 0;
    for (const panel of model.panels) {
      const px = gx + (panel.x - frameSec) * sc;
      const py = gy + (panel.y - frameSec) * sc;
      const pw = panel.w * sc;
      const ph = panel.h * sc;
      const isDoor = _dw.doorBottom === false && panel.row === model.divH - 1;

      // البكلوز لكل فتحة — منفصل عن الفتحات الأخرى
      if (isInside && bpxVal > 0) {
        ctx.fillStyle = FCL;
        // بكلوز علوي
        ctx.fillRect(px, py, pw, bpxVal);
        // بكلوز سفلي
        if (!isDoor) ctx.fillRect(px, py + ph - bpxVal, pw, bpxVal);
        // بكلوز أيسر
        ctx.fillRect(px, py + bpxVal, bpxVal, isDoor ? ph - bpxVal : ph - 2*bpxVal);
        // بكلوز أيمن
        ctx.fillRect(px + pw - bpxVal, py + bpxVal, bpxVal, isDoor ? ph - bpxVal : ph - 2*bpxVal);

        // خطوط فصل البكلوز
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 0.8;
        var glx = px + bpxVal, gly = py + bpxVal;
        var glw = pw - 2*bpxVal, glh = isDoor ? ph - bpxVal : ph - 2*bpxVal;
        ctx.strokeRect(glx, gly, glw, glh);
        ctx.restore();

        // خطوط 45° بزوايا البكلوز
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px+bpxVal, py+bpxVal); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px+pw, py); ctx.lineTo(px+pw-bpxVal, py+bpxVal); ctx.stroke();
        if (!isDoor) {
          ctx.beginPath(); ctx.moveTo(px, py+ph); ctx.lineTo(px+bpxVal, py+ph-bpxVal); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(px+pw, py+ph); ctx.lineTo(px+pw-bpxVal, py+ph-bpxVal); ctx.stroke();
        }
        ctx.restore();
      }

      const letter = String.fromCharCode(65 + labelIdx++);
      // Crosshair + label داخل منطقة الزجاج
      var glassX = px + bpxVal, glassY = py + bpxVal;
      var glassW = pw - 2*bpxVal, glassH = isDoor ? ph - bpxVal : ph - 2*bpxVal;
      _dwgDrawCrosshair(ctx, glassX, glassY, glassW, glassH);
      _dwgDrawLabel(ctx, glassX, glassY, glassW, glassH, letter, panel.glassW, panel.glassH, panel.row, panel.col);
      // منطقة الزجاج للنقر — كل فتحة لحالها
      _dw._panelZones.push({ row: panel.row, col: panel.col, x: glassX, y: glassY, w: glassW, h: glassH, index: panel.index });
    }
  }

  // ── مناطق النقر ──────────────────────────────────────────
  const fwPx   = activelines.length ? (activelines[0].wW ?? activelines[0].w) * sc : 0;
  const lastL  = activelines[activelines.length-1];
  const bpxL   = lastL ? (lastL.wW ?? lastL.w) * sc : 0;
  const prevAcc = accW - (lastL ? (lastL.wW ?? lastL.w) : 0);
  const ix = ox + prevAcc*sc, iy = oy + (accH - (lastL ? (lastL.wH ?? lastL.w) : 0))*sc;
  const iw = OW - 2*prevAcc*sc, ih = OH - 2*(accH - (lastL ? (lastL.wH ?? lastL.w) : 0))*sc;
  const fw = fwPx;

  // ── تسمية View ───────────────────────────────────────
  const lbl = document.getElementById('dwgViewLabel');
  if (lbl) lbl.textContent = isInside ? 'Inner view' : 'Outer view';

  // ── الأبعاد ──────────────────────────────────────────
  if (anyDim) {
    _dwgDrawDimsRA(ctx, ox, oy, OW, OH, fw, iw, ih, W, H, deco, sc, showDecosDim, showSectionDim, gx, gy, GW, GH);
  }

  // ── حفظ المناطق ──────────────────────────────────────
  _dw._z = { ox, oy, OW, OH, ix, iy, iw, ih, fw, bpx: bpxL, gx, gy, GW, GH, isInside };
  _dwgDrawSelection(ctx);
}

// ════════════════════════════════════════════════════════════
// DRAW FRAME — لون موحد من RAL + Inside / Outside
// ════════════════════════════════════════════════════════════
function _dwgDrawFrame(ctx, cw, ch) {
  const { W, H, deco, sec, bead, bite, corner, showDims, showDecosDim, showSectionDim, zoom, viewMode, ralHex } = _dw;

  const isInside = (viewMode !== 'Outside');
  const FC  = ralHex || '#878681';          // لون الإطار الأساسي (RAL)
  const FCL = _ralLighter(FC, 0.12);        // أفتح قليلاً للبركلوز
  const FCS = _ralDarker (FC, 0.08);        // أغمق للخط الداخلي

  const anyDim = showDecosDim || showSectionDim;
  const DIM    = anyDim ? 72 : 20;
  const TW     = W + 2*deco;
  const TH     = H + 2*deco;
  const sc     = Math.min((cw-DIM*2)/TW, (ch-DIM*2)/TH) * zoom;

  const ox = Math.round((cw - TW*sc)/2);
  const oy = Math.round((ch - TH*sc)/2);
  const OW = TW*sc,  OH = TH*sc;

  const fw  = (deco + sec) * sc;   // إطار كامل بالبيكسل (63مم)
  const bpx = bead * sc;

  const ix = ox + fw,  iy = oy + fw;
  const iw = OW - 2*fw, ih = OH - 2*fw;

  // ── 1. الإطار — لون موحد (FC) ──────────────────────────
  ctx.fillStyle = FC;
  ctx.fillRect(ox, oy, OW, OH);

  // ── 2. الزجاج ───────────────────────────────────────────
  ctx.fillStyle = _dw.glassColor || _DC.glass;
  ctx.fillRect(ix, iy, iw, ih);
  const gr = ctx.createLinearGradient(ix, iy, ix+iw*0.5, iy+ih*0.5);
  gr.addColorStop(0, 'rgba(255,255,255,0.22)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gr;
  ctx.fillRect(ix, iy, iw, ih);

  // ── 3. خطوط 45° فقط (miter cuts) — بدون خطوط 90° ──────
  ctx.save();
  ctx.strokeStyle = 'rgba(60,60,60,0.40)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + fw, oy + fw); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ox + OW, oy); ctx.lineTo(ox + OW - fw, oy + fw); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ox, oy + OH); ctx.lineTo(ox + fw, oy + OH - fw); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ox + OW, oy + OH); ctx.lineTo(ox + OW - fw, oy + OH - fw); ctx.stroke();
  // خط فاصل بين الديكور والحلق (دائرة داخلية)
  var decoPx = deco * sc;
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(ox + decoPx, oy + decoPx, OW - 2*decoPx, OH - 2*decoPx);
  ctx.restore();

  // ── 4. البركلوز — Inside فقط ────────────────────────────
  let gx, gy, GW, GH;
  if (isInside) {
    const skipBotBead = (_dw.doorBottom === false);
    ctx.fillStyle = FCL;
    ctx.fillRect(ix,           iy,          iw,  bpx);        // علوي
    if (!skipBotBead)
      ctx.fillRect(ix,         iy+ih-bpx,   iw,  bpx);        // سفلي
    ctx.fillRect(ix,           iy+bpx,      bpx, skipBotBead ? ih-bpx : ih-2*bpx);   // يسار
    ctx.fillRect(ix+iw-bpx,    iy+bpx,      bpx, skipBotBead ? ih-bpx : ih-2*bpx);   // يمين

    // خطوط فصل قطع البركلوز (تباين أوضح)
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    gx = ix+bpx; gy = iy+bpx; GW = iw-2*bpx; GH = ih-2*bpx;
    ctx.strokeRect(gx, gy, GW, GH);
    // خطوط فصل أفقية بين البكلوز
    ctx.beginPath();
    ctx.moveTo(ix,     iy+bpx);    ctx.lineTo(ix+bpx, iy+bpx);
    ctx.moveTo(ix,     iy+ih-bpx); ctx.lineTo(ix+bpx, iy+ih-bpx);
    ctx.moveTo(ix+iw,  iy+bpx);    ctx.lineTo(ix+iw-bpx, iy+bpx);
    ctx.moveTo(ix+iw,  iy+ih-bpx); ctx.lineTo(ix+iw-bpx, iy+ih-bpx);
    ctx.stroke();
    ctx.restore();
    // خطوط 45° عند زوايا البكلوز
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(ix+bpx, iy+bpx); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ix+iw, iy); ctx.lineTo(ix+iw-bpx, iy+bpx); ctx.stroke();
    if (!skipBotBead) {
      ctx.beginPath(); ctx.moveTo(ix, iy+ih); ctx.lineTo(ix+bpx, iy+ih-bpx); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ix+iw, iy+ih); ctx.lineTo(ix+iw-bpx, iy+ih-bpx); ctx.stroke();
    }
    ctx.restore();
  } else {
    // Outside — بدون بركلوز، الزجاج يملأ الفتحة كاملاً
    gx = ix; gy = iy; GW = iw; GH = ih;
  }

  // ── 5. رسم القواطع + البكلوز + الزجاج لكل فتحة — من الموديل ──
  const model = _dw._model;
  const tBarOnlyW = _dw.tBarW || 28;
  _dw._tBarZones  = [];
  _dw._panelZones = [];

  if (model && (model.divW > 1 || model.divH > 1)) {
    // === رسم القواطع (T-bars) — 28mm فقط ===
    for (var tbi = 0; tbi < model.tBars.length; tbi++) {
      var bar = model.tBars[tbi];
      var tbPx = tBarOnlyW * sc;
      if (bar.orientation === 'vertical') {
        var tbx = ix + (bar.x - sec) * sc;
        var tby = bar.isFull ? oy + fw : (iy + (bar.y - sec) * sc);
        var tbh = bar.isFull ? OH - 2*fw : bar.h * sc;
        // رسم القاطع
        ctx.fillStyle = _ralDarker(FC, 0.05);
        ctx.fillRect(tbx, tby, tbPx, tbh);
        // خط وسط
        ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(tbx+tbPx/2, tby); ctx.lineTo(tbx+tbPx/2, tby+tbh); ctx.stroke();
        ctx.restore();
        // 45° أطراف
        ctx.save(); ctx.strokeStyle = 'rgba(50,50,50,0.30)'; ctx.lineWidth = 1;
        var half = tbPx/2;
        ctx.beginPath(); ctx.moveTo(tbx, tby); ctx.lineTo(tbx+half, tby+half); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tbx+tbPx, tby); ctx.lineTo(tbx+half, tby+half); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tbx, tby+tbh); ctx.lineTo(tbx+half, tby+tbh-half); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tbx+tbPx, tby+tbh); ctx.lineTo(tbx+half, tby+tbh-half); ctx.stroke();
        ctx.restore();
        _dw._tBarZones.push({ axis:'W', index:bar.index, x:tbx, y:tby, w:tbPx, h:tbh, sc:sc });
      } else {
        var tbx2 = bar.isFull ? (ox + fw) : (ix + (bar.x - sec) * sc);
        var tby2 = iy + (bar.y - sec) * sc;
        var tbw2 = bar.isFull ? (OW - 2*fw) : bar.w * sc;
        ctx.fillStyle = _ralDarker(FC, 0.05);
        ctx.fillRect(tbx2, tby2, tbw2, tbPx);
        ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(tbx2, tby2+tbPx/2); ctx.lineTo(tbx2+tbw2, tby2+tbPx/2); ctx.stroke();
        ctx.restore();
        // 45° أطراف
        ctx.save(); ctx.strokeStyle = 'rgba(50,50,50,0.30)'; ctx.lineWidth = 1;
        var half2 = tbPx/2;
        ctx.beginPath(); ctx.moveTo(tbx2, tby2); ctx.lineTo(tbx2+half2, tby2+half2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tbx2, tby2+tbPx); ctx.lineTo(tbx2+half2, tby2+half2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tbx2+tbw2, tby2); ctx.lineTo(tbx2+tbw2-half2, tby2+half2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tbx2+tbw2, tby2+tbPx); ctx.lineTo(tbx2+tbw2-half2, tby2+half2); ctx.stroke();
        ctx.restore();
        _dw._tBarZones.push({ axis:'H', index:bar.index, x:tbx2, y:tby2, w:tbw2, h:tbPx, sc:sc });
      }
    }

    // === رسم البكلوز والزجاج لكل فتحة ===
    var labelIdx = 0;
    for (var pi = 0; pi < model.panels.length; pi++) {
      var panel = model.panels[pi];
      var px = ix + (panel.x - sec) * sc;
      var py = iy + (panel.y - sec) * sc;
      var pw = panel.w * sc;
      var ph = panel.h * sc;
      var isDoor = _dw.doorBottom === false && panel.row === model.divH - 1;

      // بكلوز لكل فتحة — منفصل
      if (isInside && bpx > 0) {
        ctx.fillStyle = FCL;
        ctx.fillRect(px, py, pw, bpx);                                         // علوي
        if (!isDoor) ctx.fillRect(px, py+ph-bpx, pw, bpx);                     // سفلي
        ctx.fillRect(px, py+bpx, bpx, isDoor ? ph-bpx : ph-2*bpx);            // أيسر
        ctx.fillRect(px+pw-bpx, py+bpx, bpx, isDoor ? ph-bpx : ph-2*bpx);    // أيمن

        // خطوط فصل
        ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.7;
        var glx = px+bpx, gly = py+bpx, glw = pw-2*bpx, glh = isDoor ? ph-bpx : ph-2*bpx;
        ctx.strokeRect(glx, gly, glw, glh);
        ctx.restore();
        // 45° بكلوز
        ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+bpx,py+bpx); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px+pw,py); ctx.lineTo(px+pw-bpx,py+bpx); ctx.stroke();
        if (!isDoor) {
          ctx.beginPath(); ctx.moveTo(px,py+ph); ctx.lineTo(px+bpx,py+ph-bpx); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(px+pw,py+ph); ctx.lineTo(px+pw-bpx,py+ph-bpx); ctx.stroke();
        }
        ctx.restore();
      }

      var letter = String.fromCharCode(65 + labelIdx++);
      var gzx = px+bpx, gzy = py+bpx;
      var gzw = pw-2*bpx, gzh = isDoor ? ph-bpx : ph-2*bpx;
      _dwgDrawCrosshair(ctx, gzx, gzy, gzw, gzh);
      _dwgDrawLabel(ctx, gzx, gzy, gzw, gzh, letter, panel.glassW, panel.glassH, panel.row, panel.col);
      _dw._panelZones.push({ row:panel.row, col:panel.col, x:gzx, y:gzy, w:gzw, h:gzh, index:panel.index });
    }
  } else {
    // شباك مفرد — فتحة واحدة
    _dw._panelZones = [{ row: 0, col: 0, x: gx, y: gy, w: GW, h: GH }];
    _dwgDrawCrosshair(ctx, gx, gy, GW, GH);
    var glassW0 = W - 2*sec - (_dw.glassDed||8);
    var glassH0 = H - 2*sec - (_dw.glassDed||8);
    _dwgDrawLabel(ctx, gx, gy, GW, GH, 'A', glassW0, glassH0, 0, 0);
  }

  // ── 6. الأبعاد ──────────────────────────────────────────
  if (showDecosDim || showSectionDim) {
    _dwgDrawDimsRA(ctx, ox, oy, OW, OH, fw, iw, ih, W, H, deco, sc, showDecosDim, showSectionDim, gx, gy, GW, GH);
  }

  // ── 7. تحديث تسمية View ──────────────────────────────────
  const lbl = document.getElementById('dwgViewLabel');
  if (lbl) lbl.textContent = isInside ? 'Inner view' : 'Outer view';

  // ── 8. حفظ مناطق النقر ──────────────────────────────────
  _dw._z = { ox, oy, OW, OH, ix, iy, iw, ih, fw, bpx,
             gx, gy, GW, GH, isInside };

  // ── 9. تمييز العنصر المحدد ───────────────────────────────
  _dwgDrawSelection(ctx);
}

function _dwgDrawSelection(ctx) {
  const z = _dw._z;
  if (!z) return;
  const sel = _dw.selected;
  ctx.save();
  ctx.strokeStyle = '#22cc44';
  ctx.lineWidth   = 2;
  ctx.setLineDash([5, 3]);
  if (sel === 'frame') {
    ctx.strokeRect(z.ox+1, z.oy+1, z.OW-2, z.OH-2);
  } else if (sel === 'bead' && z.isInside) {
    ctx.strokeRect(z.ix+1, z.iy+1, z.iw-2, z.ih-2);
  } else if (sel === 'glass') {
    ctx.strokeRect(z.gx+1, z.gy+1, z.GW-2, z.GH-2);
  }
  ctx.setLineDash([]);
  ctx.restore();
}

// ── رسم خطوط الزوايا ────────────────────────────────────────
function _dwgCornerLines(ctx, ox, oy, OW, OH, fw, corner) {
  if(corner===45){
    // خط مائل من الزاوية الخارجية إلى الداخلية
    [[ox,oy,1,1],[ox+OW,oy,-1,1],[ox,oy+OH,1,-1],[ox+OW,oy+OH,-1,-1]]
    .forEach(([cx,cy,dx,dy])=>{
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+fw*dx,cy+fw*dy);ctx.stroke();
    });
  } else {
    // 90°: خطان يُظهران حدود القطعة
    const corners=[
      [ox,oy,1,0,0,1],[ox+OW,oy,-1,0,0,1],
      [ox,oy+OH,1,0,0,-1],[ox+OW,oy+OH,-1,0,0,-1]
    ];
    corners.forEach(([cx,cy,dx1,dy1,dx2,dy2])=>{
      ctx.beginPath();
      ctx.moveTo(cx,          cy+fw*dy2);  ctx.lineTo(cx+fw*dx1, cy+fw*dy2);
      ctx.moveTo(cx+fw*dx1,   cy);          ctx.lineTo(cx+fw*dx1, cy+fw*dy2);
      ctx.stroke();
    });
  }
}

// ── الـ Crosshair (مثل RA Workshop) ─────────────────────────
function _dwgDrawCrosshair(ctx, x, y, w, h) {
  ctx.save();
  ctx.strokeStyle = _DC.crosshair;
  ctx.lineWidth   = 0.8;
  ctx.setLineDash([6, 5]);
  const cx = x + w/2, cy = y + h/2;
  const ex = Math.min(w*0.35, 60), ey = Math.min(h*0.35, 80);
  // أفقي
  ctx.beginPath();
  ctx.moveTo(cx-ex, cy); ctx.lineTo(cx+ex, cy);
  ctx.stroke();
  // رأسي
  ctx.beginPath();
  ctx.moveTo(cx, cy-ey); ctx.lineTo(cx, cy+ey);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ── التسمية + رسم رمز الدرفة ───────────────────────────────
function _dwgDrawLabel(ctx, x, y, w, h, letter, glassW, glassH, row, col) {
  ctx.save();
  ctx.textAlign='center'; ctx.textBaseline='middle';
  const cx=x+w/2, cy=y+h/2;
  // حرف الزجاجة
  const fs = Math.max(14, Math.min(36, Math.min(w,h)*0.12));
  ctx.font=`bold ${fs}px Arial`;
  ctx.fillStyle='rgba(30,39,96,0.50)';
  ctx.fillText(letter, cx, cy);
  ctx.restore();

  // رسم رمز الدرفة إذا كان محدداً
  if (row !== undefined && col !== undefined) {
    const sashType = _dwgGetSashType(row, col);
    _dwgDrawSashSymbol(ctx, x, y, w, h, sashType);
  }
}

// ════════════════════════════════════════════════════════════
// DIMENSIONS
// showDecosDim  → إجمالي خارجي   أعلى  (TW) + يمين (TH)
// showSectionDim→ فتحة الحلق    أسفل  (W)  + يسار (H)
// ════════════════════════════════════════════════════════════
function _dwgDrawDimsRA(ctx, ox, oy, OW, OH, fw, iw, ih, W, H, deco, sc, showDecosDim, showSectionDim, gx, gy, GW, GH) {
  _dw._dimZones = [];
  ctx.save();
  ctx.lineWidth  = 1;
  ctx.setLineDash([]);
  const g  = 28;
  const g2 = 54;

  const divW = _dw.divW || 1;
  const divH = _dw.divH || 1;
  const selProf = _dwProfiles.find(p => p.id === _dw.profileId);
  const tblRaw  = selProf && selProf.tBarLines && selProf.tBarLines.length
    ? selProf.tBarLines.filter(l => (l.wW||l.w||0) > 0) : null;
  const actualTBar = tblRaw
    ? tblRaw.reduce((s,l) => s + (l.wW||l.w||0), 0) : (_dw.tBarW || 28);

  // ── مقاس الحلق (داخلي) — أسفل + يسار ──────────────────
  if (showSectionDim) {
    ctx.fillStyle   = '#1e2760';
    ctx.strokeStyle = '#1e2760';
    // أسفل level1: عرض الحلق الكامل W
    _rwDimH(ctx, ox+fw, oy+OH+g, iw, `${_dwgFmt(W)}`, 'W');
    // يسار level1: ارتفاع الحلق H
    _rwDimV(ctx, ox-g,  oy+fw,   ih, `${_dwgFmt(H)}`, 'H');

    // أسفل level2: مقاسات الألواح المنفصلة (divW > 1)
    if (divW > 1 && GW > 0) {
      const panelWidths = _dwgCalcPanels('W');
      ctx.fillStyle   = '#2e7d32';
      ctx.strokeStyle = '#2e7d32';
      let pxAcc = gx;
      panelWidths.forEach((pw, pi) => {
        const pwPx = pw * sc;
        _rwDimH(ctx, pxAcc, oy+OH+g2, pwPx, `${_dwgFmt(pw)}`, 'panelW', pi);
        pxAcc += pwPx;
        if (pi < divW - 1) {
          // مقاس عارضة T بين الألواح
          const tPx = actualTBar * sc;
          ctx.save();
          ctx.fillStyle = '#888';
          ctx.strokeStyle = '#999';
          ctx.lineWidth = 0.7;
          _rwDimH(ctx, pxAcc, oy+OH+g2, tPx, `T=${actualTBar}`);
          ctx.restore();
          pxAcc += tPx;
        }
      });
    }

    // يسار level2: مقاسات الألواح الرأسية (divH > 1)
    if (divH > 1 && GH > 0) {
      const panelHeights = _dwgCalcPanels('H');
      ctx.fillStyle   = '#2e7d32';
      ctx.strokeStyle = '#2e7d32';
      let pyAcc = gy;
      panelHeights.forEach((ph, pi) => {
        const phPx = ph * sc;
        _rwDimV(ctx, ox-g2, pyAcc, phPx, `${_dwgFmt(ph)}`, 'panelH', pi);
        pyAcc += phPx;
        if (pi < divH - 1) {
          const tPx = actualTBar * sc;
          ctx.save();
          ctx.fillStyle = '#888';
          ctx.strokeStyle = '#999';
          ctx.lineWidth = 0.7;
          _rwDimV(ctx, ox-g2, pyAcc, tPx, `T=${actualTBar}`);
          ctx.restore();
          pyAcc += tPx;
        }
      });
    }
  }

  // ── مقاس الديكور (خارجي كامل) — أعلى + يمين ───────────
  if (showDecosDim) {
    ctx.fillStyle   = '#c0392b';
    ctx.strokeStyle = '#c0392b';
    const TW = W + 2*deco;
    const TH = H + 2*deco;
    _rwDimH(ctx, ox, oy-g, OW, `${_dwgFmt(TW)}`, 'TW');
    _rwDimV(ctx, ox+OW+g, oy, OH, `${_dwgFmt(TH)}`, 'TH');
  }

  ctx.restore();
}

function _rwDimH(ctx, x1, y, len, txt, dimField, dimIndex) {
  const x2 = x1+len;
  const ar = 6;  // طول رأس السهم
  ctx.save();
  ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.stroke();
  // أسهم على الطرفين
  [[x1,1],[x2,-1]].forEach(([x,d])=>{
    ctx.beginPath();
    ctx.moveTo(x,y); ctx.lineTo(x+ar*d, y-ar*0.4); ctx.lineTo(x+ar*d, y+ar*0.4);
    ctx.closePath(); ctx.fill();
  });
  // خطوط وصل رأسية من الإطار إلى الخط
  [x1,x2].forEach(x=>{
    ctx.save(); ctx.globalAlpha=0.4;
    ctx.beginPath();ctx.moveTo(x,y-10);ctx.lineTo(x,y+2);ctx.stroke();
    ctx.restore();
  });
  ctx.font='bold 11px Arial';
  ctx.textAlign='center'; ctx.textBaseline='bottom';
  // خلفية بيضاء للنص
  const tw = ctx.measureText(txt).width + 6;
  ctx.fillStyle='rgba(255,255,255,0.85)';
  ctx.fillRect(x1+len/2 - tw/2, y-18, tw, 13);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fillText(txt, x1+len/2, y-6);
  ctx.restore();
  // تخزين منطقة النقر المزدوج
  if (dimField && _dw._dimZones) {
    const numVal = parseFloat(txt.replace(/[^0-9.]/g,''));
    _dw._dimZones.push({
      x: x1+len/2 - tw/2, y: y-20, w: tw, h: 18,
      field: dimField, value: numVal, index: dimIndex, axis: 'H'
    });
  }
}

function _rwDimV(ctx, x, y1, len, txt, dimField, dimIndex) {
  const y2 = y1+len;
  const ar = 6;
  ctx.save();
  ctx.beginPath();ctx.moveTo(x,y1);ctx.lineTo(x,y2);ctx.stroke();
  [[y1,1],[y2,-1]].forEach(([y,d])=>{
    ctx.beginPath();
    ctx.moveTo(x,y); ctx.lineTo(x-ar*0.4, y+ar*d); ctx.lineTo(x+ar*0.4, y+ar*d);
    ctx.closePath(); ctx.fill();
  });
  [y1,y2].forEach(y=>{
    ctx.save(); ctx.globalAlpha=0.4;
    ctx.beginPath();ctx.moveTo(x-2,y);ctx.lineTo(x+10,y);ctx.stroke();
    ctx.restore();
  });
  ctx.save();
  ctx.font='bold 11px Arial';
  ctx.textAlign='center'; ctx.textBaseline='bottom';
  const tw = ctx.measureText(txt).width + 6;
  ctx.translate(x, y1+len/2);
  ctx.rotate(-Math.PI/2);
  ctx.fillStyle='rgba(255,255,255,0.85)';
  ctx.fillRect(-tw/2, -18, tw, 13);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fillText(txt, 0, -5);
  ctx.restore();
  ctx.restore();
  // تخزين منطقة النقر المزدوج (الأبعاد الرأسية — المنطقة بعد الدوران)
  if (dimField && _dw._dimZones) {
    const numVal = parseFloat(txt.replace(/[^0-9.]/g,''));
    _dw._dimZones.push({
      x: x - 20, y: y1+len/2 - tw/2, w: 18, h: tw,
      field: dimField, value: numVal, index: dimIndex, axis: 'V'
    });
  }
}

function _dwgFmt(mm) {
  return mm >= 1000
    ? (mm/1).toLocaleString('en',{minimumFractionDigits:1,maximumFractionDigits:1})
    : mm.toFixed(1);
}

// ════════════════════════════════════════════════════════════
// EVENTS / HANDLERS
// ════════════════════════════════════════════════════════════
function _dwgOnPrj(val) {
  _dw.pid = val;
  const el = document.getElementById('dwgPrjName');
  if(el) el.textContent = val || 'Project 1';

  const infoEl = document.getElementById('dwgPrjInfo');
  const measSec = document.getElementById('dwgMeasSec');
  const colorsEl = document.getElementById('dwgPrjColors');
  const measList = document.getElementById('dwgMeasList');

  if(!val) {
    if(infoEl) infoEl.style.display = 'none';
    if(measSec) measSec.style.display = 'none';
    return;
  }

  // جلب بيانات المشروع
  let prj = null;
  try {
    const prjs = typeof loadData === 'function' ? loadData().projects || [] : [];
    prj = prjs.find(p => String(p.id) === String(val));
  } catch(e) {}

  if(!prj) {
    if(infoEl) infoEl.style.display = 'none';
    if(measSec) measSec.style.display = 'none';
    return;
  }

  // عرض ألوان المشروع
  if(infoEl && colorsEl) {
    let html = '';
    if(prj.aluminumColor) {
      html += '<span style="display:inline-flex;align-items:center;gap:3px;background:#f0f4ff;padding:2px 6px;border-radius:4px;border:1px solid #d0d8e8">' +
        (typeof _ralSwatchHTML==='function'?_ralSwatchHTML(prj.aluminumColor,13):'') +
        '<span style="font-size:10px;color:#1a3a5c;font-weight:600">' + prj.aluminumColor + '</span></span>';
    }
    if(prj.glassColor) {
      html += '<span style="display:inline-flex;align-items:center;gap:3px;background:#f0fff4;padding:2px 6px;border-radius:4px;border:1px solid #c8e6d0">' +
        (typeof _glassSwatchHTML==='function'?_glassSwatchHTML(prj.glassColor,13):'') +
        '<span style="font-size:10px;color:#2d6a4f;font-weight:600">' + prj.glassColor + '</span></span>';
    }
    colorsEl.innerHTML = html;
    infoEl.style.display = html ? 'block' : 'none';
  }

  // تحميل المقاسات
  let measRows = null;
  try {
    if(typeof getMeasurementsData === 'function') measRows = getMeasurementsData(val);
  } catch(e) {}

  if(measRows && measRows.length && measList && measSec) {
    const filled = measRows.filter(r => r.width || r.height);
    if(filled.length) {
      measList.innerHTML = filled.map((r, i) =>
        `<div onclick="_dwgLoadMeas(${i},'${val}')" style="display:flex;align-items:center;gap:4px;padding:4px 8px;cursor:pointer;
              border-bottom:1px solid #eee;font-size:11px;transition:background 0.15s"
          onmouseenter="this.style.background='#e8edff'" onmouseleave="this.style.background=''">
          <span style="font-weight:700;color:#1e2760;min-width:38px">${r.code||''}</span>
          <span style="color:#555;flex:1">${r.sectionName||''}</span>
          <span style="color:#888;font-size:10px;direction:ltr">${r.width||0}×${r.height||0}</span>
        </div>`
      ).join('');
      measSec.style.display = 'block';
    } else {
      measSec.style.display = 'none';
    }
  } else {
    if(measSec) measSec.style.display = 'none';
  }
}

function _dwgToggleMeas() {
  const list = document.getElementById('dwgMeasList');
  const arr = document.getElementById('dwgMeasArr');
  if(!list) return;
  const vis = list.style.display !== 'none';
  list.style.display = vis ? 'none' : 'block';
  if(arr) arr.textContent = vis ? '▼' : '▲';
}

function _dwgLoadMeas(idx, pid) {
  let measRows = null;
  try {
    if(typeof getMeasurementsData === 'function') measRows = getMeasurementsData(pid);
  } catch(e) {}
  if(!measRows) return;
  const filled = measRows.filter(r => r.width || r.height);
  const r = filled[idx];
  if(!r) return;

  // تعيين المقاسات
  _dw.W = parseInt(r.width) || _dw.W;
  _dw.H = parseInt(r.height) || _dw.H;
  if(r.code) _dw.ref = r.code;

  // محاولة مطابقة نوع القطاع
  if(r.sectionName) {
    try {
      const types = typeof fmTypesLoad === 'function' ? fmTypesLoad() : [];
      const match = types.find(t => t.name === r.sectionName);
      if(match) _dw.name = match.name;
    } catch(e) {}
  }

  // تحديث اللوحة والرسم
  _dwgRefreshRightPanel();
  _dwgDraw();
}

function _dwgSetCorner(deg) {
  _dw.corner = deg;
  [45,90].forEach(d=>{
    const b=document.getElementById('rC'+d);
    if(!b) return;
    const a=d===deg;
    b.style.borderColor = a?'#1e2760':'#ccc';
    b.style.background  = a?'#dde4ff':'#fff';
    b.style.color       = a?'#1e2760':'#555';
  });
  _dwgDraw();
}

function _dwgSelectType(id) { _dw.type=id; _dwgDraw(); }
function _dwgAddSplitter(t) { /* مرحلة لاحقة */ }
function _dwgSelectItem(id) { _dw.selected=id; _dwgDraw(); }

function _dwgTab(el, name) {
  document.querySelectorAll('.dwg-tab').forEach(t=>{
    t.style.background=''; t.style.fontWeight=''; t.style.color='#666';
  });
  el.style.background='#fff'; el.style.fontWeight='600'; el.style.color='#222';
}

function _dwgUpdateStats() {
  const { W, H } = _dw;
  const p = document.getElementById('rPerim');
  const s = document.getElementById('rSurf');
  if(p) p.textContent = (2*(W+H)).toLocaleString() + '.0 mm';
  if(s) s.textContent = (W*H/1e6).toFixed(3) + ' sqm';
}

function _dwgZoomIn()  { _dw.zoom=Math.min(4,_dw.zoom*1.2); _dwgUpdateZoom(); _dwgDraw(); }
function _dwgZoomOut() { _dw.zoom=Math.max(0.2,_dw.zoom/1.2); _dwgUpdateZoom(); _dwgDraw(); }
function _dwgZoomFit() { _dw.zoom=1; _dwgUpdateZoom(); _dwgDraw(); }
function _dwgUpdateZoom() {
  const el=document.getElementById('dwgZoomLbl');
  if(el) el.textContent=Math.round(_dw.zoom*100)+'%';
}

// ════════════════════════════════════════════════════════════
// PUBLIC API
// ════════════════════════════════════════════════════════════
function dwgExportPNG() {
  const cv=_dw.cv; if(!cv) return;
  const a=document.createElement('a');
  a.download=`drawing_${Date.now()}.png`;
  a.href=cv.toDataURL('image/png');
  a.click();
}
function dwgPrint() {
  const cv=_dw.cv; if(!cv) return;
  const w=window.open('','_blank');
  w.document.write(`<html><body style="margin:0;padding:20px">
    <img src="${cv.toDataURL()}" style="max-width:100%">
  </body></html>`);
  w.document.close(); w.print();
}
function dwgUndo()     {}
function dwgRedo()     {}

// ════════════════════════════════════════════════════════════
// ميزة 1: سحب عارضات T لتغيير مقاسات الألواح (Drag to Resize)
// ════════════════════════════════════════════════════════════
function _dwgOnMouseDown(e) {
  if (_dw._dragging) return;
  const z = _dw._z;
  if (!z) return;
  const r  = _dw.cv.getBoundingClientRect();
  const mx = e.clientX - r.left;
  const my = e.clientY - r.top;

  // هل الماوس فوق عارضة T؟
  for (const tb of _dw._tBarZones) {
    if (mx >= tb.x - 4 && mx <= tb.x + tb.w + 4 &&
        my >= tb.y - 4 && my <= tb.y + tb.h + 4) {
      e.preventDefault();
      e.stopPropagation();
      _dw._dragging = {
        axis      : tb.axis,
        index     : tb.index,
        startMouse: tb.axis === 'W' ? mx : my,
        startSizes: tb.axis === 'W'
          ? _dwgCalcPanels('W').slice()
          : _dwgCalcPanels('H').slice(),
        sc        : tb.sc,
      };
      _dw.cv.style.cursor = tb.axis === 'W' ? 'col-resize' : 'row-resize';
      return;
    }
  }
}

function _dwgOnMouseDrag(e) {
  const d = _dw._dragging;
  if (!d) {
    // تغيير شكل المؤشر عند الاقتراب من عارضة T
    const r  = _dw.cv.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    for (const tb of _dw._tBarZones) {
      if (mx >= tb.x - 4 && mx <= tb.x + tb.w + 4 &&
          my >= tb.y - 4 && my <= tb.y + tb.h + 4) {
        _dw.cv.style.cursor = tb.axis === 'W' ? 'col-resize' : 'row-resize';
        return;
      }
    }
    return;
  }
  e.preventDefault();
  const r  = _dw.cv.getBoundingClientRect();
  const mouse = d.axis === 'W' ? (e.clientX - r.left) : (e.clientY - r.top);
  const deltaPx = mouse - d.startMouse;
  const deltaMM = deltaPx / d.sc;

  // حساب المقاسات الجديدة
  const sizes = d.startSizes.slice();
  const i = d.index;
  const newLeft  = sizes[i]     + deltaMM;
  const newRight = sizes[i + 1] - deltaMM;
  // حدود أدنى 30مم لكل لوح
  if (newLeft < 30 || newRight < 30) return;
  sizes[i]     = Math.round(newLeft * 10) / 10;
  sizes[i + 1] = Math.round(newRight * 10) / 10;

  // تطبيق
  const arr = d.axis === 'W' ? _dw.panelWidths : _dw.panelHeights;
  const divN = d.axis === 'W' ? _dw.divW : _dw.divH;
  while (arr.length < divN) arr.push(null);
  for (let j = 0; j < divN; j++) arr[j] = sizes[j];

  _dwgDraw();
}

function _dwgOnMouseUp(e) {
  if (_dw._dragging) {
    _dw._dragging = null;
    _dw.cv.style.cursor = 'default';
    _dwgRefreshRightPanel();
  }
}

// ════════════════════════════════════════════════════════════
// ميزة 2: تعديل المقاسات بالنقر المزدوج (Inline Edit)
// ════════════════════════════════════════════════════════════
function _dwgOnDblClick(e) {
  if (_dw._dragging) return;
  const r  = _dw.cv.getBoundingClientRect();
  const mx = e.clientX - r.left;
  const my = e.clientY - r.top;

  // تحقق هل النقر على بُعد مرسوم
  for (const dz of _dw._dimZones) {
    if (mx >= dz.x && mx <= dz.x + dz.w && my >= dz.y && my <= dz.y + dz.h) {
      e.preventDefault();
      e.stopPropagation();
      _dwgShowInlineEdit(dz, r);
      return;
    }
  }

  // تحقق هل النقر على لوح زجاج → فتح اختيار الدرفة
  for (const pz of _dw._panelZones) {
    if (mx >= pz.x && mx <= pz.x + pz.w && my >= pz.y && my <= pz.y + pz.h) {
      e.preventDefault();
      e.stopPropagation();
      _dwgShowSashPopup(pz, r);
      return;
    }
  }
}

function _dwgShowInlineEdit(dz, canvasRect) {
  // إزالة أي حقل تحرير سابق
  _dwgRemoveInlineEdit();

  const inp = document.createElement('input');
  inp.id    = '_dwgInlineEdit';
  inp.type  = 'number';
  inp.value = dz.value;
  inp.step  = '0.1';
  inp.style.cssText = `
    position:fixed; z-index:10000;
    left:${canvasRect.left + dz.x}px;
    top:${canvasRect.top + dz.y - 4}px;
    width:${Math.max(60, dz.w + 10)}px; height:24px;
    font-size:12px; font-weight:700; text-align:center;
    border:2px solid #1e2760; border-radius:4px;
    background:#fff; color:#1e2760; outline:none;
    box-shadow:0 2px 12px rgba(0,0,0,0.25);
    font-family:Arial,sans-serif;
  `;

  const apply = () => {
    const val = +inp.value;
    if (!val || val <= 0) { _dwgRemoveInlineEdit(); return; }
    // تطبيق القيمة حسب نوع البُعد
    // W/H: يغير المقاس الخارجي → الفتحات تتوزع تلقائي
    if (dz.field === 'W')    { _dw.W = val; _dw.panelWidths = []; }
    else if (dz.field === 'H')    { _dw.H = val; _dw.panelHeights = []; }
    else if (dz.field === 'TW')   { _dw.W = val - 2*_dw.deco; _dw.panelWidths = []; }
    else if (dz.field === 'TH')   { _dw.H = val - 2*_dw.deco; _dw.panelHeights = []; }
    else if (dz.field === 'panelW') {
      // ثبت هذه الفتحة وعيد توزيع الباقي ضمن المقاس الداخلي الثابت
      while (_dw.panelWidths.length < _dw.divW) _dw.panelWidths.push(null);
      // أزل أي تثبيت سابق على الفتحات الأخرى لإعادة التوزيع
      for (var pw_i = 0; pw_i < _dw.divW; pw_i++) {
        if (pw_i !== dz.index) _dw.panelWidths[pw_i] = null;
      }
      _dw.panelWidths[dz.index] = val;
    }
    else if (dz.field === 'panelH') {
      while (_dw.panelHeights.length < _dw.divH) _dw.panelHeights.push(null);
      for (var ph_i = 0; ph_i < _dw.divH; ph_i++) {
        if (ph_i !== dz.index) _dw.panelHeights[ph_i] = null;
      }
      _dw.panelHeights[dz.index] = val;
    }
    _dwgRemoveInlineEdit();
    _dwgDraw();
    _dwgRefreshRightPanel();
    _dwgUpdateStats();
  };

  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') apply();
    if (e.key === 'Escape') _dwgRemoveInlineEdit();
  });
  inp.addEventListener('blur', apply);

  document.body.appendChild(inp);
  inp.focus();
  inp.select();
}

function _dwgRemoveInlineEdit() {
  const el = document.getElementById('_dwgInlineEdit');
  if (el) el.remove();
}

// ════════════════════════════════════════════════════════════
// ميزة 3: اختيار نوع الدرفة بالنقر على لوح الزجاج
// ════════════════════════════════════════════════════════════
const _SASH_TYPES = [
  { id: 'fixed',     name: 'ثابت',         icon: '⊡' },
  { id: 'casementL', name: 'مفصلي يسار',   icon: '◁' },
  { id: 'casementR', name: 'مفصلي يمين',   icon: '▷' },
  { id: 'slidingL',  name: 'سحاب يسار',    icon: '⇐' },
  { id: 'slidingR',  name: 'سحاب يمين',    icon: '⇒' },
  { id: 'awning',    name: 'علوية خارجية',  icon: '△' },
  { id: 'tiltIn',    name: 'مسطح داخلي',   icon: '▽' },
];

function _dwgGetSashType(row, col) {
  if (!_dw.panelSashTypes[row]) return 'fixed';
  return _dw.panelSashTypes[row][col] || 'fixed';
}

function _dwgSetSashType(row, col, type) {
  while (_dw.panelSashTypes.length <= row) _dw.panelSashTypes.push([]);
  while (_dw.panelSashTypes[row].length <= col) _dw.panelSashTypes[row].push('fixed');
  _dw.panelSashTypes[row][col] = type;
  _dwgDraw();
}

function _dwgShowSashPopup(pz, canvasRect) {
  _dwgRemoveSashPopup();

  const popup = document.createElement('div');
  popup.id = '_dwgSashPopup';
  popup.style.cssText = `
    position:fixed; z-index:10001;
    left:${canvasRect.left + pz.x + pz.w/2 - 80}px;
    top:${canvasRect.top + pz.y + pz.h/2 - 60}px;
    background:#fff; border:1px solid #d0d3de; border-radius:8px;
    box-shadow:0 6px 28px rgba(0,0,0,0.25); padding:8px;
    font-family:Cairo,Arial,sans-serif; font-size:12px; direction:rtl;
    min-width:160px;
  `;

  const currentType = _dwgGetSashType(pz.row, pz.col);
  popup.innerHTML = `
    <div style="font-weight:700;color:#1e2760;margin-bottom:6px;font-size:11px;text-align:center;
                border-bottom:1px solid #e8e8e8;padding-bottom:4px">
      نوع الدرفة — لوح ${String.fromCharCode(65 + pz.row * (_dw.divW||1) + pz.col)}
    </div>
    ${_SASH_TYPES.map(st => `
      <div onclick="_dwgSetSashType(${pz.row},${pz.col},'${st.id}');_dwgRemoveSashPopup()"
        style="padding:5px 10px;cursor:pointer;border-radius:4px;display:flex;align-items:center;gap:8px;
               background:${st.id===currentType?'#dde4ff':'transparent'};
               font-weight:${st.id===currentType?'700':'400'};
               color:${st.id===currentType?'#1e2760':'#333'}"
        onmouseover="this.style.background='#f0f1f5'"
        onmouseout="this.style.background='${st.id===currentType?'#dde4ff':'transparent'}'">
        <span style="font-size:16px;width:22px;text-align:center">${st.icon}</span>
        <span>${st.name}</span>
      </div>
    `).join('')}
  `;

  // إغلاق عند النقر خارجاً
  const overlay = document.createElement('div');
  overlay.id = '_dwgSashOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:transparent';
  overlay.onclick = _dwgRemoveSashPopup;
  document.body.appendChild(overlay);
  document.body.appendChild(popup);
}

function _dwgRemoveSashPopup() {
  const el = document.getElementById('_dwgSashPopup');
  const ov = document.getElementById('_dwgSashOverlay');
  if (el) el.remove();
  if (ov) ov.remove();
}

// رسم رمز الدرفة على كل لوح
function _dwgDrawSashSymbol(ctx, x, y, w, h, sashType) {
  if (sashType === 'fixed' || !sashType) return; // الثابت لا يرسم شيء إضافي

  ctx.save();
  ctx.lineWidth = 1.2;
  const cx = x + w/2, cy = y + h/2;

  if (sashType === 'casementL') {
    // خط قطري متقطع من يمين أعلى إلى يسار وسط (مفصلات على اليسار)
    ctx.strokeStyle = '#333';
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x, cy);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();
    ctx.setLineDash([]);
    // مقبض على اليمين
    _dwgDrawHandle(ctx, x + w - 12, cy, 'R');
  }
  else if (sashType === 'casementR') {
    ctx.strokeStyle = '#333';
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, cy);
    ctx.lineTo(x, y + h);
    ctx.stroke();
    ctx.setLineDash([]);
    _dwgDrawHandle(ctx, x + 6, cy, 'L');
  }
  else if (sashType === 'slidingL') {
    // سهم يسار
    ctx.strokeStyle = '#333';
    ctx.fillStyle = '#333';
    ctx.setLineDash([]);
    ctx.lineWidth = 1.5;
    const arLen = Math.min(w * 0.4, 50);
    ctx.beginPath();
    ctx.moveTo(cx + arLen/2, cy);
    ctx.lineTo(cx - arLen/2, cy);
    ctx.stroke();
    // رأس السهم
    ctx.beginPath();
    ctx.moveTo(cx - arLen/2, cy);
    ctx.lineTo(cx - arLen/2 + 8, cy - 5);
    ctx.lineTo(cx - arLen/2 + 8, cy + 5);
    ctx.closePath();
    ctx.fill();
  }
  else if (sashType === 'slidingR') {
    ctx.strokeStyle = '#333';
    ctx.fillStyle = '#333';
    ctx.setLineDash([]);
    ctx.lineWidth = 1.5;
    const arLen = Math.min(w * 0.4, 50);
    ctx.beginPath();
    ctx.moveTo(cx - arLen/2, cy);
    ctx.lineTo(cx + arLen/2, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + arLen/2, cy);
    ctx.lineTo(cx + arLen/2 - 8, cy - 5);
    ctx.lineTo(cx + arLen/2 - 8, cy + 5);
    ctx.closePath();
    ctx.fill();
  }
  else if (sashType === 'awning') {
    // خطوط V متقطعة من أسفل وسط لأعلى الجانبين
    ctx.strokeStyle = '#333';
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(cx, y);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  else if (sashType === 'tiltIn') {
    // خطوط V صلبة من أعلى وسط لأسفل الجانبين
    ctx.strokeStyle = '#333';
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(cx, y + h);
    ctx.lineTo(x + w, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

// رسم مقبض صغير
function _dwgDrawHandle(ctx, hx, hy, side) {
  ctx.save();
  ctx.fillStyle = '#555';
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  // دائرة
  ctx.beginPath();
  ctx.arc(hx, hy, 3, 0, Math.PI*2);
  ctx.fill();
  ctx.stroke();
  // شريط
  ctx.beginPath();
  ctx.moveTo(hx, hy - 8);
  ctx.lineTo(hx, hy + 8);
  ctx.stroke();
  ctx.restore();
}

// ════════════════════════════════════════════════════════════
// ميزة 4: حفظ واسترجاع الرسومات المربوطة بالمشاريع
// ════════════════════════════════════════════════════════════
const _DW_DRAWINGS_KEY = 'pm_drawings';
let _dwDrawingsList = [];

function _dwgSerializeState() {
  return {
    W: _dw.W, H: _dw.H, deco: _dw.deco, sec: _dw.sec, bead: _dw.bead,
    bite: _dw.bite, corner: _dw.corner, color: _dw.color, ralHex: _dw.ralHex,
    divW: _dw.divW, divH: _dw.divH, tBarW: _dw.tBarW,
    panelWidths: _dw.panelWidths.slice(),
    panelHeights: _dw.panelHeights.slice(),
    overlapH: _dw.overlapH, doorBottom: _dw.doorBottom,
    vFull: _dw.vFull, glassDed: _dw.glassDed,
    glassCode: _dw.glassCode, glassThick: _dw.glassThick,
    glassColor: _dw.glassColor, profileId: _dw.profileId,
    profileName: _dw.profileName, beadName: _dw.beadName,
    panelSashTypes: JSON.parse(JSON.stringify(_dw.panelSashTypes)),
    name: _dw.name, ref: _dw.ref, qty: _dw.qty,
    showDecosDim: _dw.showDecosDim, showSectionDim: _dw.showSectionDim,
    viewMode: _dw.viewMode,
  };
}

function _dwgRestoreState(s) {
  if (!s) return;
  const fields = ['W','H','deco','sec','bead','bite','corner','color','ralHex',
    'divW','divH','tBarW','overlapH','doorBottom','vFull','glassDed',
    'glassCode','glassThick',
    'glassColor','profileId','profileName','beadName','name','ref','qty',
    'showDecosDim','showSectionDim','viewMode'];
  fields.forEach(f => { if (s[f] !== undefined) _dw[f] = s[f]; });
  _dw.panelWidths  = Array.isArray(s.panelWidths)  ? s.panelWidths  : [];
  _dw.panelHeights = Array.isArray(s.panelHeights) ? s.panelHeights : [];
  _dw.panelSashTypes = Array.isArray(s.panelSashTypes) ? s.panelSashTypes : [];
}

function _dwgGenerateThumbnail() {
  const cv = _dw.cv;
  if (!cv) return '';
  // إنشاء canvas مصغر
  const tc = document.createElement('canvas');
  tc.width = 160; tc.height = 120;
  const tctx = tc.getContext('2d');
  tctx.drawImage(cv, 0, 0, cv.width, cv.height, 0, 0, 160, 120);
  return tc.toDataURL('image/png', 0.7);
}

function dwgSaveDrawing() {
  const pid = _dw.pid;
  const drawingName = prompt('اسم الرسم:', _dw.name || 'رسم جديد');
  if (!drawingName) return;
  _dw.name = drawingName;

  const now = new Date().toISOString();
  const drawing = {
    id        : _dw.drawingId || ('draw_' + Date.now()),
    projectId : pid || '',
    name      : drawingName,
    ref       : _dw.ref,
    params    : _dwgSerializeState(),
    thumbnail : _dwgGenerateThumbnail(),
    createdAt : _dw.drawingId ? (_dwDrawingsList.find(d=>d.id===_dw.drawingId)||{}).createdAt || now : now,
    updatedAt : now,
  };

  // تحديث أو إضافة
  const idx = _dwDrawingsList.findIndex(d => d.id === drawing.id);
  if (idx >= 0) _dwDrawingsList[idx] = drawing;
  else _dwDrawingsList.push(drawing);

  _dw.drawingId = drawing.id;

  _dwgSaveKey(_DW_DRAWINGS_KEY, _dwDrawingsList).then(() => {
    _dwgRefreshDrawingsList();
    _dwgShowNotif('✅ تم حفظ الرسم: ' + drawingName);
  }).catch(e => {
    alert('خطأ في الحفظ: ' + e.message);
  });
}

function dwgLoadDrawing(id) {
  const d = _dwDrawingsList.find(x => x.id === id);
  if (!d) return;
  _dwgRestoreState(d.params);
  _dw.drawingId = d.id;
  _dw.pid       = d.projectId;
  _dwgDraw();
  _dwgRefreshRightPanel();
  _dwgRefreshDrawingsList();
  _dwgUpdateStats();
  _dwgShowNotif('📂 تم تحميل: ' + d.name);
}

function dwgDeleteDrawing(id) {
  const d = _dwDrawingsList.find(x => x.id === id);
  if (!d) return;
  if (!confirm('حذف الرسم "' + d.name + '"؟')) return;
  _dwDrawingsList = _dwDrawingsList.filter(x => x.id !== id);
  if (_dw.drawingId === id) _dw.drawingId = null;
  _dwgSaveKey(_DW_DRAWINGS_KEY, _dwDrawingsList).then(() => {
    _dwgRefreshDrawingsList();
  });
}

function dwgNewDrawing() {
  _dw.drawingId = null;
  _dw.name  = 'Frame';
  _dw.ref   = 'F1';
  _dw.W     = 1000;
  _dw.H     = 1500;
  _dw.divW  = 1;
  _dw.divH  = 1;
  _dw.panelWidths = [];
  _dw.panelHeights = [];
  _dw.panelSashTypes = [];
  _dw.doorBottom = true;
  _dw.vFull = true;
  _dw.glassDed = 8;
  _dwgDraw();
  _dwgRefreshRightPanel();
  _dwgRefreshDrawingsList();
}

function _dwgLoadDrawingsList() {
  fetch('/api/data/' + _DW_DRAWINGS_KEY)
    .then(r => r.ok ? r.json() : {})
    .then(j => {
      _dwDrawingsList = Array.isArray(j && j.value) ? j.value : [];
      _dwgRefreshDrawingsList();
    })
    .catch(() => { _dwDrawingsList = []; });
}

function _dwgRefreshDrawingsList() {
  const ct = document.getElementById('dwgSavedList');
  if (!ct) return;

  const filtered = _dw.pid
    ? _dwDrawingsList.filter(d => d.projectId === _dw.pid || !d.projectId)
    : _dwDrawingsList;

  if (!filtered.length) {
    ct.innerHTML = '<div style="color:#aaa;font-size:10px;text-align:center;padding:8px">لا توجد رسومات محفوظة</div>';
    return;
  }

  ct.innerHTML = filtered.map(d => `
    <div style="display:flex;align-items:center;gap:6px;padding:4px 6px;border-bottom:1px solid #f0f0f0;
                cursor:pointer;border-radius:3px;
                background:${d.id===_dw.drawingId?'#dde4ff':'transparent'}"
      onmouseover="this.style.background='#f5f6fb'"
      onmouseout="this.style.background='${d.id===_dw.drawingId?'#dde4ff':'transparent'}'">
      <img src="${d.thumbnail||''}" style="width:36px;height:28px;object-fit:contain;
           border:1px solid #e0e0e0;border-radius:2px;background:#f8f8f8;flex-shrink:0"
        onerror="this.style.display='none'" onclick="dwgLoadDrawing('${d.id}')">
      <div style="flex:1;min-width:0" onclick="dwgLoadDrawing('${d.id}')">
        <div style="font-size:11px;font-weight:${d.id===_dw.drawingId?'700':'500'};
                    color:${d.id===_dw.drawingId?'#1e2760':'#333'};
                    overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.name}</div>
        <div style="font-size:9px;color:#999">${d.params?.W||0}×${d.params?.H||0}مم</div>
      </div>
      <button onclick="event.stopPropagation();dwgDeleteDrawing('${d.id}')"
        style="padding:2px 5px;border:1px solid #ddd;border-radius:3px;
               background:#fff;color:#c0392b;cursor:pointer;font-size:9px;flex-shrink:0">🗑</button>
    </div>
  `).join('');
}

function _dwgShowNotif(msg) {
  let el = document.getElementById('_dwgNotif');
  if (!el) {
    el = document.createElement('div');
    el.id = '_dwgNotif';
    el.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
      z-index:10000;background:#1e2760;color:#fff;padding:8px 20px;border-radius:8px;
      font-family:Cairo,sans-serif;font-size:13px;font-weight:600;
      box-shadow:0 4px 20px rgba(0,0,0,0.25);transition:opacity 0.3s;pointer-events:none`;
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  el.style.display = 'block';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.style.opacity = '0'; setTimeout(()=>el.style.display='none',300); }, 2000);
}
function dwgClearAll() { if(_dw.ctx) _dw.ctx.clearRect(0,0,_dw.cv.width,_dw.cv.height); }
