'use strict';
/**
 * 16-designs.js — صفحة التصاميم والتقطيع
 * Layout ثلاثي مثل صفحة الرسومات:
 *   يسار: Project Explorer (اختيار عميل + شجرة مقاسات)
 *   وسط:  منطقة العمل (Canvas 2D + عرض 3D) + تابات تحت
 *   يمين: Properties (بيانات القطعة + قائمة القطع + BOM)
 */

var _ds = {
  pid: null,        // selected project id
  project: null,    // project data
  measRows: [],     // active measurement rows
  sections: {},     // grouped by sectionName
  selIdx: -1,       // selected frame index in measRows
  assembly: null,   // current FrameAssembly
  report: null,     // current ManufacturingReport
  profileId: 'cas-frame-50',
  jointType: 'miter',
  view: '2d',       // '2d' | '3d'
  viewer3d: null,
  dxfShapes: [],    // imported DXF shapes
};

// ════════════════════════════════════════════════════
// LAYOUT
// ════════════════════════════════════════════════════
function renderDesignsPage() {
  var page = document.getElementById('page-designs');
  if (!page) return;
  // لا ترسم إذا الصفحة مو ظاهرة
  if(!page.classList.contains('active')) return;
  if (typeof _syncUserSectionsToLibrary === 'function') _syncUserSectionsToLibrary();
  if (typeof _dsLoadCustomProfiles === 'function') _dsLoadCustomProfiles();

  var BC = 'var(--border)';
  page.style.cssText = 'padding:0;overflow:hidden;flex-direction:column;height:calc(100vh - 60px);';
  page.innerHTML =
    '<div style="flex:1;display:flex;overflow:hidden;direction:ltr;background:#e8eaed">' +

      // ── LEFT: Project Explorer ──
      '<div id="dsLeft" style="width:230px;min-width:230px;max-width:230px;background:#fff;border-right:1px solid ' + BC + ';display:flex;flex-direction:column;overflow:hidden;font-size:12px"></div>' +

      // ── CENTER: Canvas + Tabs ──
      '<div style="flex:1;display:flex;flex-direction:column;overflow:hidden">' +
        // Mini toolbar
        '<div id="dsMiniBar" style="display:flex;align-items:center;gap:6px;padding:4px 10px;background:#f0f1f5;border-bottom:1px solid ' + BC + ';font-size:11px;flex-shrink:0"></div>' +
        // Canvas area
        '<div id="dsCanvasWrap" style="flex:1;position:relative;overflow:hidden;background:#fff;box-shadow:inset 0 0 0 1px #e0e0e0">' +
          '<canvas id="dsCanvas" style="display:block"></canvas>' +
          '<div id="ds3dWrap" style="position:absolute;inset:0;display:none"></div>' +
        '</div>' +
        // Bottom tabs
        '<div id="dsBottomTabs" style="display:flex;border-top:1px solid ' + BC + ';background:#f0f1f5;font-size:11px;flex-shrink:0"></div>' +
        '<div id="dsBottomContent" style="height:160px;overflow-y:auto;border-top:1px solid ' + BC + ';background:#fff;font-size:11px;padding:6px 8px"></div>' +
      '</div>' +

      // ── RIGHT: Properties ──
      '<div id="dsRight" style="width:250px;min-width:250px;max-width:250px;background:#fff;border-left:1px solid ' + BC + ';overflow-y:auto;font-size:12px"></div>' +

    '</div>';

  _dsRenderLeft();
  _dsRenderMiniBar();
  _dsRenderBottomTabs();
  _dsResizeCanvas();
  _dsRenderRight();
  if (_ds.pid) _dsSelectProject(_ds.pid);
  else _dsDrawWelcome();

  window.addEventListener('resize', _dsResizeCanvas);
}

// ════════════════════════════════════════════════════
// LEFT PANEL — Project Explorer
// ════════════════════════════════════════════════════
function _dsRenderLeft() {
  var el = document.getElementById('dsLeft');
  if (!el) return;
  var d = loadData();
  var projects = d.projects;
  var cu = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  if (cu && !cu.isAdmin) {
    if (cu.filterCompany) projects = projects.filter(function(p){ return p.company === cu.filterCompany; });
    if (cu.filterRegion)  projects = projects.filter(function(p){ return (p.region||'') === cu.filterRegion; });
    if (cu.filterGallery) projects = projects.filter(function(p){ return (p.gallery||'') === cu.filterGallery; });
  }

  var html = '';
  // Header
  html += '<div style="background:#e8eaf0;border-bottom:1px solid var(--border);padding:5px 8px;font-weight:700;font-size:11px;color:#333;display:flex;align-items:center;gap:4px">' +
    '<span>📁</span> Project Explorer</div>';

  // Project selector
  html += '<div style="padding:6px 8px;border-bottom:1px solid var(--border);flex-shrink:0">';
  html += '<select id="dsProjectSelect" onchange="_dsSelectProject(this.value)" style="width:100%;padding:4px;border:1px solid #ccc;border-radius:3px;font-size:11px;font-family:Cairo,sans-serif;background:#fff">';
  html += '<option value="">— ' + t('اختر العميل') + ' —</option>';
  projects.forEach(function(p) {
    html += '<option value="' + p.id + '"' + (_ds.pid === p.id ? ' selected' : '') + '>' + (p.name||'-') + '</option>';
  });
  html += '</select></div>';

  // Project info (shows after selection)
  html += '<div id="dsPrjInfo" style="display:none;padding:6px 8px;border-bottom:1px solid var(--border);font-size:11px"></div>';

  // Measurements tree
  html += '<div id="dsMeasTree" style="display:none;border-bottom:1px solid var(--border)">';
  html += '<div onclick="_dsToggleMeasTree()" style="display:flex;align-items:center;justify-content:space-between;padding:5px 8px;background:#e8eaf0;cursor:pointer;font-weight:600;font-size:11px;color:#333;user-select:none">';
  html += '<span>📐 ' + t('المقاسات') + '</span><span id="dsMeasArrow" style="font-size:10px">▼</span></div>';
  html += '<div id="dsMeasList" style="max-height:300px;overflow-y:auto;padding:2px 0"></div>';
  html += '</div>';

  // DXF Import
  html += '<div style="padding:6px 8px;border-bottom:1px solid var(--border);display:flex;gap:4px">';
  html += '<label style="flex:1;padding:4px 6px;border:1px solid #ccc;border-radius:3px;background:#fff;cursor:pointer;font-size:11px;font-weight:600;color:#555;text-align:center">';
  html += '📂 DXF <input type="file" accept=".dxf" style="display:none" onchange="_dsImportDXF(this)"></label>';
  html += '</div>';

  // Profile selector
  html += '<div style="padding:6px 8px;border-bottom:1px solid var(--border)">';
  html += '<div style="font-size:10px;color:#888;margin-bottom:3px">' + t('القطاع') + '</div>';
  html += '<select id="dsProfileSel" onchange="_ds.profileId=this.value;_dsRedraw()" style="width:100%;padding:3px;border:1px solid #ccc;border-radius:3px;font-size:10px;background:#fff">';
  if (typeof ProfileLibrary !== 'undefined') {
    html += ProfileLibrary.toDropdown(_ds.profileId);
  } else {
    html += '<option>قطاع قياسي</option>';
  }
  html += '</select></div>';

  // Joint type
  html += '<div style="padding:6px 8px;border-bottom:1px solid var(--border)">';
  html += '<div style="font-size:10px;color:#888;margin-bottom:3px">' + t('نوع القص') + '</div>';
  html += '<select id="dsJointSel" onchange="_ds.jointType=this.value;_dsRedraw()" style="width:100%;padding:3px;border:1px solid #ccc;border-radius:3px;font-size:10px;background:#fff">';
  html += '<option value="miter"' + (_ds.jointType === 'miter' ? ' selected' : '') + '>⬦ Miter 45°</option>';
  html += '<option value="butt"' + (_ds.jointType === 'butt' ? ' selected' : '') + '>⬜ Butt 90°</option>';
  html += '</select></div>';

  // Add/Edit profile button
  html += '<div style="padding:6px 8px;border-bottom:1px solid var(--border);display:flex;gap:4px">';
  html += '<button onclick="_dsAddProfileModal()" style="flex:1;padding:4px 6px;border:1px solid #ccc;border-radius:3px;background:#fff;cursor:pointer;font-size:10px;font-weight:600;color:#555">➕ ' + t('إضافة قطاع') + '</button>';
  html += '</div>';

  el.innerHTML = html;
}

// ════════════════════════════════════════════════════
// ADD/EDIT PROFILE MODAL
// ════════════════════════════════════════════════════
function _dsAddProfileModal(editId) {
  var existing = editId && typeof ProfileLibrary !== 'undefined' ? ProfileLibrary.get(editId) : null;
  var p = existing || {};

  var modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.innerHTML = '<div class="modal" style="max-width:600px">' +
    '<div class="modal-header"><div class="modal-title">🔧 ' + (existing ? t('تعديل قطاع') : t('إضافة قطاع جديد')) + '</div>' +
    '<button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest(\'.modal-bg\').remove()">✕</button></div>' +
    '<div class="modal-body" style="max-height:70vh;overflow-y:auto">' +

    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px">' +

    // هوية
    '<div style="grid-column:1/-1;font-weight:700;color:var(--accent);border-bottom:1px solid var(--border);padding-bottom:4px">📋 ' + t('الهوية') + '</div>' +
    _dsField('dsP_name', t('اسم القطاع'), p.name||'', 'text', '') +
    _dsField('dsP_code', t('الكود'), p.code||'', 'text', 'مثال: CF-50') +
    _dsField('dsP_desc', t('الوصف'), p.description||'', 'text', '') +
    _dsField('dsP_system', t('النظام'), p.system||'', 'text', 'سحب / شباك / أبواب / واجهات') +

    // أبعاد
    '<div style="grid-column:1/-1;font-weight:700;color:var(--accent);border-bottom:1px solid var(--border);padding-bottom:4px;margin-top:8px">📏 ' + t('الأبعاد') + '</div>' +
    _dsField('dsP_width', t('عرض الوجه') + ' (mm)', p.width||50, 'number', '') +
    _dsField('dsP_depth', t('العمق') + ' (mm)', p.depth||40, 'number', '') +
    _dsField('dsP_thickness', t('السماكة') + ' (mm)', p.thickness||1.5, 'number', '') +
    _dsField('dsP_weight', t('الوزن') + ' (كغ/م)', p.weight||0.6, 'number', '') +

    // اتجاهات
    '<div style="grid-column:1/-1;font-weight:700;color:var(--accent);border-bottom:1px solid var(--border);padding-bottom:4px;margin-top:8px">🧭 ' + t('الاتجاهات') + '</div>' +
    _dsSelect('dsP_faceDir', t('الوجه'), p.faceDir||'out', [['out',t('خارجي')],['in',t('داخلي')]]) +
    _dsSelect('dsP_wallSide', t('جهة الجدار'), p.wallSide||'back', [['back',t('الخلف')],['front',t('الأمام')],['none',t('بدون')]]) +
    _dsSelect('dsP_glassSide', t('جهة الزجاج'), p.glassSide||'front', [['front',t('الأمام')],['back',t('الخلف')]]) +

    // ربات الزجاج
    '<div style="grid-column:1/-1;font-weight:700;color:var(--accent);border-bottom:1px solid var(--border);padding-bottom:4px;margin-top:8px">🪟 ' + t('ربات الزجاج') + '</div>' +
    _dsField('dsP_rebateDepth', t('عمق الربات') + ' (mm)', p.rebateDepth||15, 'number', '') +
    _dsField('dsP_rebateWidth', t('عرض الربات') + ' (mm)', p.rebateWidth||20, 'number', '') +
    _dsField('dsP_glassGap', t('الفراغ الحراري') + ' (mm)', p.glassGap||3, 'number', '') +

    // التجميع
    '<div style="grid-column:1/-1;font-weight:700;color:var(--accent);border-bottom:1px solid var(--border);padding-bottom:4px;margin-top:8px">🔩 ' + t('التجميع والتركيب') + '</div>' +
    _dsSelect('dsP_assemblyType', t('طريقة التجميع'), p.assemblyType||'screw', [['screw',t('برغي')],['crimp',t('كبس')],['weld',t('لحام')],['clip',t('مشبك')]]) +
    _dsField('dsP_screwSpacing', t('مسافة البراغي') + ' (mm)', p.screwSpacing||300, 'number', '') +
    _dsSelect('dsP_mountType', t('تركيب بالجدار'), p.mountType||'frame', [['frame',t('إطار بالحائط')],['face',t('وجه')],['embed',t('مدفون')]]) +

    // الحركة
    '<div style="grid-column:1/-1;font-weight:700;color:var(--accent);border-bottom:1px solid var(--border);padding-bottom:4px;margin-top:8px">🚪 ' + t('الحركة') + '</div>' +
    _dsSelect('dsP_motionType', t('نوع الحركة'), p.motionType||'fixed', [['fixed',t('ثابت')],['hinge',t('مفصلات')],['slide',t('سلايد')],['pivot',t('محوري')],['tilt',t('ميلان')],['fold',t('طي')]]) +
    _dsSelect('dsP_hingeSide', t('جهة المفصلات'), p.hingeSide||'left', [['left',t('يسار')],['right',t('يمين')],['top',t('أعلى')],['bottom',t('أسفل')]]) +

    // شكل المقطع
    '<div style="grid-column:1/-1;font-weight:700;color:var(--accent);border-bottom:1px solid var(--border);padding-bottom:4px;margin-top:8px">📐 ' + t('شكل المقطع') + '</div>' +
    _dsSelect('dsP_sectionType', t('نوع المقطع'), (p.meta&&p.meta.sectionType)||'hollow', [['hollow',t('مجوف (□)')],['U','U — ' + t('مع ربات زجاج')],['C','C — ' + t('مفتوح')],['L','L — ' + t('زاوية')],['T','T — ' + t('قاطع')],['Z','Z'],['solid',t('مصمت')]]) +
    _dsSelect('dsP_sectionRot', t('تدوير المقطع'), (p.meta&&p.meta.sectionRotation)||'0', [['0','0°'],['90','90°'],['180','180°'],['270','270°']]) +

    // تصنيع
    '<div style="grid-column:1/-1;font-weight:700;color:var(--accent);border-bottom:1px solid var(--border);padding-bottom:4px;margin-top:8px">🏭 ' + t('التصنيع') + '</div>' +
    _dsField('dsP_barLength', t('طول البار') + ' (mm)', p.barLength||6000, 'number', '') +
    _dsSelect('dsP_finish', t('التشطيب'), p.finish||'anodized', [['anodized',t('أنودايز')],['powder',t('بودرة')],['wood-grain',t('خشبي')],['raw',t('خام')]]) +

    '</div>' +

    '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">' +
      '<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">' + t('إلغاء') + '</button>' +
      '<button class="btn btn-primary" onclick="_dsSaveProfile(\'' + (editId||'') + '\',this)">💾 ' + t('حفظ القطاع') + '</button>' +
    '</div>' +
    '</div></div>';

  document.body.appendChild(modal);
}

function _dsSaveProfile(editId, btn) {
  var gv = function(id) { var el = document.getElementById(id); return el ? el.value : ''; };
  var name = gv('dsP_name').trim();
  var code = gv('dsP_code').trim();
  if (!name) { notify(t('أدخل اسم القطاع'), 'error'); return; }

  var id = editId || 'custom-' + Date.now();
  var data = {
    id: id, name: name, code: code || id,
    description: gv('dsP_desc'), system: gv('dsP_system') || 'مخصص',
    width: parseFloat(gv('dsP_width')) || 50,
    depth: parseFloat(gv('dsP_depth')) || 40,
    thickness: parseFloat(gv('dsP_thickness')) || 1.5,
    weight: parseFloat(gv('dsP_weight')) || 0.6,
    faceDir: gv('dsP_faceDir'), wallSide: gv('dsP_wallSide'), glassSide: gv('dsP_glassSide'),
    rebateDepth: parseFloat(gv('dsP_rebateDepth')) || 15,
    rebateWidth: parseFloat(gv('dsP_rebateWidth')) || 20,
    glassGap: parseFloat(gv('dsP_glassGap')) || 3,
    assemblyType: gv('dsP_assemblyType'), screwSpacing: parseFloat(gv('dsP_screwSpacing')) || 300,
    mountType: gv('dsP_mountType'),
    motionType: gv('dsP_motionType'), hingeSide: gv('dsP_hingeSide'),
    barLength: parseFloat(gv('dsP_barLength')) || 6000,
    finish: gv('dsP_finish'),
    meta: {
      sectionType: gv('dsP_sectionType') || 'hollow',
      sectionRotation: parseInt(gv('dsP_sectionRot')) || 0,
    },
  };

  if (typeof ProfileLibrary !== 'undefined') {
    ProfileLibrary.register(data);
    // Save custom profiles to localStorage
    _dsSaveCustomProfiles();
  }

  _ds.profileId = id;
  btn.closest('.modal-bg').remove();
  _dsRenderLeft(); // refresh dropdown
  _dsRedraw();
  notify('✅ ' + t('تم حفظ القطاع') + ': ' + name);
}

function _dsSaveCustomProfiles() {
  if (typeof ProfileLibrary === 'undefined') return;
  var customs = ProfileLibrary.all().filter(function(p) { return p.id.indexOf('custom-') === 0; });
  var arr = customs.map(function(p) { return p.toJSON(); });
  localStorage.setItem('pm_custom_profiles', JSON.stringify(arr));
}

function _dsLoadCustomProfiles() {
  try {
    var arr = JSON.parse(localStorage.getItem('pm_custom_profiles') || '[]');
    arr.forEach(function(p) { if (typeof ProfileLibrary !== 'undefined') ProfileLibrary.register(p); });
  } catch(e) {}
}

// Helper: form field
function _dsField(id, label, value, type, placeholder) {
  return '<div class="form-group" style="margin-bottom:0"><div style="font-size:10px;color:#888">' + label + '</div>' +
    '<input id="' + id + '" type="' + type + '" value="' + value + '" placeholder="' + (placeholder||'') + '" style="width:100%;padding:4px 6px;border:1px solid #ccc;border-radius:4px;font-size:11px;font-family:Cairo,sans-serif"></div>';
}
function _dsSelect(id, label, value, options) {
  var opts = options.map(function(o) { return '<option value="' + o[0] + '"' + (o[0] === value ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('');
  return '<div class="form-group" style="margin-bottom:0"><div style="font-size:10px;color:#888">' + label + '</div>' +
    '<select id="' + id + '" style="width:100%;padding:4px 6px;border:1px solid #ccc;border-radius:4px;font-size:11px;font-family:Cairo,sans-serif">' + opts + '</select></div>';
}

// ════════════════════════════════════════════════════
// MINI BAR (top of center)
// ════════════════════════════════════════════════════
function _dsRenderMiniBar() {
  var el = document.getElementById('dsMiniBar');
  if (!el) return;
  el.innerHTML =
    '<span style="color:#555;font-weight:600">View</span>' +
    '<button onclick="_dsSetView(\'2d\')" id="dsBtn2d" style="padding:2px 8px;border:1px solid #ccc;border-radius:3px;font-size:11px;background:#fff;cursor:pointer;font-weight:700;color:#1e2760">2D</button>' +
    '<button onclick="_dsSetView(\'3d\')" id="dsBtn3d" style="padding:2px 8px;border:1px solid #ccc;border-radius:3px;font-size:11px;background:#fff;cursor:pointer">3D</button>' +
    '<div style="flex:1"></div>' +
    '<span id="dsFrameLabel" style="font-size:11px;color:#444;font-weight:600"></span>';
}

// ════════════════════════════════════════════════════
// BOTTOM TABS
// ════════════════════════════════════════════════════
function _dsRenderBottomTabs() {
  var el = document.getElementById('dsBottomTabs');
  if (!el) return;
  var tabs = ['Summary', 'Cut List', 'BOM', 'Glass', 'Accessories'];
  el.innerHTML = tabs.map(function(tb, i) {
    return '<div onclick="_dsSwitchBottom(\'' + tb + '\',this)" data-tab="' + tb + '" style="padding:5px 12px;cursor:pointer;border-right:1px solid var(--border);' + (i === 0 ? 'background:#fff;font-weight:700;color:#1e2760;' : 'color:#666;') + '">' + tb + '</div>';
  }).join('');
  _dsSwitchBottom('Summary');
}

function _dsSwitchBottom(tab, el) {
  if (el) {
    document.querySelectorAll('#dsBottomTabs > div').forEach(function(d) { d.style.background = ''; d.style.fontWeight = ''; d.style.color = '#666'; });
    el.style.background = '#fff'; el.style.fontWeight = '700'; el.style.color = '#1e2760';
  }
  var content = document.getElementById('dsBottomContent');
  if (!content) return;
  var r = _ds.report;
  if (!r) { content.innerHTML = '<div style="text-align:center;padding:20px;color:#999">' + t('اختر فتحة لعرض البيانات') + '</div>'; return; }
  var data = r.toJSON();

  if (tab === 'Summary') {
    content.innerHTML = '<div style="display:flex;gap:16px;flex-wrap:wrap;padding:4px">' +
      _dsSmBox(t('القطع'), data.summary.totalPieces) +
      _dsSmBox(t('الطول'), data.summary.totalLength_m + ' م') +
      _dsSmBox(t('الوزن'), data.summary.weight_kg + ' كجم') +
      _dsSmBox(t('الزجاج'), data.summary.glassArea_m2 + ' م²') +
      _dsSmBox(t('الإكسسوارات'), data.summary.accessoryCount) +
    '</div>';
  }
  else if (tab === 'Cut List') {
    var h = '<table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr style="background:#e8eaf0"><th style="padding:4px">#</th><th style="padding:4px">' + t('الضلع') + '</th><th style="padding:4px">' + t('الموضع') + '</th><th style="padding:4px">' + t('الاسمي') + '</th><th style="padding:4px;color:#1e2760;font-weight:800">' + t('القطع') + '</th><th style="padding:4px">' + t('بداية') + '</th><th style="padding:4px">' + t('نهاية') + '</th></tr></thead><tbody>';
    data.cutList.items.forEach(function(it, i) {
      h += '<tr style="border-bottom:1px solid #eee"><td style="padding:3px;text-align:center">' + (i+1) + '</td><td style="padding:3px;text-align:center;font-weight:700;color:#1e2760">' + it.label + '</td><td style="padding:3px;text-align:center">' + it.position + '</td><td style="padding:3px;text-align:center">' + it.nominalLength + '</td><td style="padding:3px;text-align:center;font-weight:800;color:#1e2760">' + it.cutLength + '</td><td style="padding:3px;text-align:center">' + (90-it.startCutAngle).toFixed(1) + '°</td><td style="padding:3px;text-align:center">' + (90-it.endCutAngle).toFixed(1) + '°</td></tr>';
    });
    h += '</tbody></table>';
    content.innerHTML = h;
  }
  else if (tab === 'BOM') {
    var h = '<table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr style="background:#e8eaf0"><th style="padding:4px">' + t('القطاع') + '</th><th style="padding:4px">' + t('القطع') + '</th><th style="padding:4px">' + t('الكمية') + '</th><th style="padding:4px">' + t('الكلي') + '</th><th style="padding:4px">' + t('القطع') + '</th></tr></thead><tbody>';
    data.cutList.bom.forEach(function(b) {
      h += '<tr style="border-bottom:1px solid #eee"><td style="padding:3px">' + b.profileName + '</td><td style="padding:3px;text-align:center;font-weight:700">' + b.cutLength + '</td><td style="padding:3px;text-align:center;font-size:14px;font-weight:800">' + b.quantity + '</td><td style="padding:3px;text-align:center">' + b.totalLength + '</td><td style="padding:3px;font-size:9px;color:#888">' + b.labels + '</td></tr>';
    });
    h += '</tbody></table>';
    content.innerHTML = h;
  }
  else if (tab === 'Glass') {
    content.innerHTML = data.glass.map(function(g) {
      return '<div style="display:flex;align-items:center;gap:10px;padding:6px;background:#f8fafc;border-radius:6px;margin-bottom:4px"><span style="font-size:18px">🪟</span><strong>' + g.label + '</strong><span style="font-family:monospace;font-weight:700;color:#1e2760">' + g.width + ' × ' + g.height + '</span><span style="color:#b45309;font-weight:600">' + g.area + ' م²</span><span style="font-size:9px;color:#888">' + g.note + '</span></div>';
    }).join('') || '<div style="color:#999;padding:10px">' + t('لا يوجد زجاج') + '</div>';
  }
  else if (tab === 'Accessories') {
    content.innerHTML = data.accessories.map(function(a) {
      var icon = a.type === 'hinge' ? '🔩' : a.type === 'handle' ? '🚪' : '🔒';
      return '<div style="display:flex;align-items:center;gap:8px;padding:4px;border-bottom:1px solid #f0f0f0"><span>' + icon + '</span><strong style="font-size:11px">' + a.type + '</strong><span style="font-size:10px;color:#666">' + a.pieceLabel + ' @ ' + a.offset_mm + 'mm</span><span style="font-size:9px;color:#999">' + (a.spec||'') + '</span></div>';
    }).join('') || '<div style="color:#999;padding:10px">' + t('لا يوجد إكسسوارات') + '</div>';
  }
}

// ════════════════════════════════════════════════════
// RIGHT PANEL — Properties
// ════════════════════════════════════════════════════
function _dsRenderRight() {
  var el = document.getElementById('dsRight');
  if (!el) return;
  if (_ds.selIdx < 0 || !_ds.measRows[_ds.selIdx]) {
    el.innerHTML = '<div style="padding:20px;text-align:center;color:#999;font-size:12px">' + t('اختر فتحة من القائمة') + '</div>';
    return;
  }
  var r = _ds.measRows[_ds.selIdx];
  var w = +r.width, h = +r.height;
  var profile = _dsGetProfile();
  var html = '';

  html += '<div style="background:#e8eaf0;padding:5px 8px;font-weight:700;font-size:11px;color:#333;border-bottom:1px solid var(--border)">📋 Properties</div>';

  html += '<div style="padding:8px">';
  html += _dsProp(t('الرمز'), r.code || '-');
  html += _dsProp(t('العرض'), w + ' mm');
  html += _dsProp(t('الارتفاع'), h + ' mm');
  html += _dsProp(t('المساحة'), ((w/1000)*(h/1000)).toFixed(2) + ' م²');
  html += _dsProp(t('المحيط'), (2*(w+h)/1000).toFixed(2) + ' م');
  if (r.sectionName) html += _dsProp(t('القطاع'), r.sectionName);
  if (r.description) html += _dsProp(t('الوصف'), r.description);
  if (r.notes) html += _dsProp(t('ملاحظات'), r.notes);
  html += '</div>';

  if (profile) {
    html += '<div style="background:#e8eaf0;padding:5px 8px;font-weight:700;font-size:11px;color:#333;border-bottom:1px solid var(--border);border-top:1px solid var(--border)">🔧 Profile</div>';
    html += '<div style="padding:8px">';
    html += _dsProp(t('الاسم'), profile.name);
    html += _dsProp(t('الكود'), profile.code);
    html += _dsProp(t('العرض'), profile.width + ' mm');
    html += _dsProp(t('العمق'), profile.depth + ' mm');
    html += _dsProp(t('الوزن'), profile.weight + ' كغ/م');
    html += _dsProp(t('القص'), _ds.jointType === 'miter' ? '45° Miter' : '90° Butt');
    html += '</div>';
  }

  if (_ds.report) {
    var s = _ds.report.summary;
    html += '<div style="background:#e8eaf0;padding:5px 8px;font-weight:700;font-size:11px;color:#333;border-bottom:1px solid var(--border);border-top:1px solid var(--border)">📊 Summary</div>';
    html += '<div style="padding:8px">';
    html += _dsProp(t('القطع'), s.totalPieces);
    html += _dsProp(t('الطول'), s.totalLength_m + ' م');
    html += _dsProp(t('الوزن'), s.weight_kg + ' كجم');
    html += _dsProp(t('الزجاج'), s.glassArea_m2 + ' م²');
    html += '</div>';
  }

  el.innerHTML = html;
}

// ════════════════════════════════════════════════════
// SELECT PROJECT
// ════════════════════════════════════════════════════
function _dsSelectProject(pid) {
  if (!pid) { _ds.pid = null; _ds.project = null; _ds.measRows = []; _ds.sections = {}; _ds.selIdx = -1; _dsDrawWelcome(); _dsRenderRight(); return; }
  _ds.pid = pid;
  var d = loadData();
  _ds.project = d.projects.find(function(x){ return x.id === pid; });
  if (!_ds.project) return;

  var measRows = (typeof getMeasurementsData === 'function') ? getMeasurementsData(pid) : null;
  _ds.measRows = measRows ? measRows.filter(function(r){ return +r.width > 0 && +r.height > 0; }) : [];
  _ds.sections = {};
  _ds.measRows.forEach(function(r) {
    var sn = r.sectionName || 'غير محدد';
    if (!_ds.sections[sn]) _ds.sections[sn] = [];
    _ds.sections[sn].push(r);
  });

  // Update project info
  var info = document.getElementById('dsPrjInfo');
  if (info && _ds.project) {
    var p = _ds.project;
    info.style.display = '';
    info.innerHTML =
      '<div style="font-weight:700;color:#222">' + (p.name||'') + '</div>' +
      '<div style="color:#666;margin-top:2px">' + (p.contractNo ? t('عقد') + ': ' + p.contractNo : '') + '</div>' +
      '<div style="color:#666">' + (p.company||'') + (p.gallery ? ' • ' + p.gallery : '') + (p.region ? ' • ' + p.region : '') + '</div>' +
      (p.aluminumColor ? '<div style="margin-top:4px;display:flex;align-items:center;gap:4px"><div style="width:12px;height:12px;border-radius:3px;background:#4a6a8a;border:1px solid #ccc"></div><span style="font-size:10px">' + p.aluminumColor + '</span></div>' : '') +
      (p.glassColor ? '<div style="display:flex;align-items:center;gap:4px"><div style="width:12px;height:12px;border-radius:3px;background:rgba(135,206,235,0.6);border:1px solid #ccc"></div><span style="font-size:10px">' + p.glassColor + '</span></div>' : '');
  }

  // Build measurements tree
  _dsRenderMeasTree();

  // Select first frame
  if (_ds.measRows.length) { _dsSelectFrame(0); }
  else { _ds.selIdx = -1; _dsDrawWelcome(); _dsRenderRight(); }
}

function _dsRenderMeasTree() {
  var sec = document.getElementById('dsMeasTree');
  var list = document.getElementById('dsMeasList');
  if (!sec || !list) return;
  if (!_ds.measRows.length) { sec.style.display = 'none'; return; }
  sec.style.display = '';

  var html = '';
  var idx = 0;
  Object.keys(_ds.sections).forEach(function(sn) {
    html += '<div style="padding:3px 8px;background:#f4f5f7;font-weight:600;font-size:10px;color:#555;border-bottom:1px solid #eee">📁 ' + sn + ' (' + _ds.sections[sn].length + ')</div>';
    _ds.sections[sn].forEach(function(r) {
      var active = idx === _ds.selIdx;
      html += '<div onclick="_dsSelectFrame(' + idx + ')" style="padding:3px 8px 3px 20px;cursor:pointer;border-bottom:1px solid #f5f5f5;display:flex;align-items:center;gap:6px;' + (active ? 'background:#dde4ff;font-weight:700;color:#1e2760' : '') + '">';
      html += '<span style="font-size:10px">◻</span>';
      html += '<span style="font-size:11px">' + (r.code||'W'+String(idx+1).padStart(2,'0')) + '</span>';
      html += '<span style="font-size:10px;color:#888;font-family:monospace">' + (+r.width) + '×' + (+r.height) + '</span>';
      html += '</div>';
      idx++;
    });
  });
  list.innerHTML = html;
}

function _dsToggleMeasTree() {
  var list = document.getElementById('dsMeasList');
  var arr = document.getElementById('dsMeasArrow');
  if (!list) return;
  var show = list.style.display === 'none';
  list.style.display = show ? '' : 'none';
  if (arr) arr.textContent = show ? '▼' : '▶';
}

// ════════════════════════════════════════════════════
// SELECT FRAME — run engine + draw
// ════════════════════════════════════════════════════
function _dsSelectFrame(idx) {
  _ds.selIdx = idx;
  var r = _ds.measRows[idx];
  if (!r) return;

  // Run engine
  _ds.assembly = _dsRunEngine(+r.width, +r.height);
  _ds.report = null;
  if (_ds.assembly && typeof ManufacturingReport !== 'undefined') {
    _ds.report = new ManufacturingReport(_ds.assembly, _dsGetProfile());
  }

  // Update label
  var lbl = document.getElementById('dsFrameLabel');
  if (lbl) lbl.textContent = (r.code||'') + ' — ' + (+r.width) + '×' + (+r.height) + ' mm';

  // Highlight in tree
  _dsRenderMeasTree();

  // Draw
  _dsRedraw();
  _dsRenderRight();
  _dsSwitchBottom('Summary');
}

// ════════════════════════════════════════════════════
// CANVAS — 2D drawing
// ════════════════════════════════════════════════════
function _dsResizeCanvas() {
  var wrap = document.getElementById('dsCanvasWrap');
  var cv = document.getElementById('dsCanvas');
  if (!wrap || !cv) return;
  cv.width = wrap.clientWidth;
  cv.height = wrap.clientHeight;
  _dsRedraw();
}

function _dsRedraw() {
  if (_ds.view === '2d') _dsDraw2D();
  else _dsDraw3D();
}

function _dsDraw2D() {
  var cv = document.getElementById('dsCanvas');
  if (!cv) return;
  cv.style.display = 'block';
  var wrap3d = document.getElementById('ds3dWrap');
  if (wrap3d) wrap3d.style.display = 'none';

  if (!_ds.assembly) { _dsDrawWelcome(); return; }

  if (typeof Viewer2D !== 'undefined') {
    var viewer = new Viewer2D(cv, {
      showDimensions: true,
      showLabels: true,
      showCutAngles: true,
      showGlass: true,
      showAccessories: true,
      padding: 60,
    });
    viewer.setAssembly(_ds.assembly);
    if (_ds.report) viewer.setAccessories(_ds.report.accessories);
    viewer.render();
  }
}

function _dsDraw3D() {
  var cv = document.getElementById('dsCanvas');
  if (cv) cv.style.display = 'none';
  var wrap = document.getElementById('ds3dWrap');
  if (!wrap) return;
  wrap.style.display = 'block';

  if (!_ds.assembly) {
    wrap.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999">' + t('اختر فتحة') + '</div>';
    return;
  }

  if (typeof Viewer3D !== 'undefined' && typeof THREE !== 'undefined') {
    if (_ds.viewer3d) _ds.viewer3d.dispose();
    _ds.viewer3d = new Viewer3D(wrap, { autoRotate: false, showGrid: true });
    _ds.viewer3d.setAssembly(_ds.assembly, _dsGetProfile());
    if (_ds.report) _ds.viewer3d.setGlass(_ds.report.glass);
    _ds.viewer3d.onPieceSelected = function(piece, idx) {
      // تحديث الـ Properties لما تنقر على قطعة بالـ 3D
      _dsShowPieceProps(piece);
    };
    _ds.viewer3d.render();
  } else {
    wrap.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:12px">⚠️ Three.js ' + t('غير محمل') + '</div>';
  }
}

function _dsSetView(v) {
  _ds.view = v;
  var b2 = document.getElementById('dsBtn2d');
  var b3 = document.getElementById('dsBtn3d');
  if (b2) { b2.style.background = v === '2d' ? '#fff' : ''; b2.style.fontWeight = v === '2d' ? '700' : ''; b2.style.color = v === '2d' ? '#1e2760' : ''; }
  if (b3) { b3.style.background = v === '3d' ? '#fff' : ''; b3.style.fontWeight = v === '3d' ? '700' : ''; b3.style.color = v === '3d' ? '#1e2760' : ''; }
  _dsRedraw();
}

function _dsDrawWelcome() {
  var cv = document.getElementById('dsCanvas');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = '#999';
  ctx.font = '14px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(t('اختر عميل ثم فتحة لعرض التصميم'), cv.width / 2, cv.height / 2);
}

// ════════════════════════════════════════════════════
// ENGINE
// ════════════════════════════════════════════════════
function _dsGetProfile() {
  if (typeof ProfileLibrary !== 'undefined') { var p = ProfileLibrary.get(_ds.profileId); if (p) return p; }
  if (typeof ProfileSection !== 'undefined') return new ProfileSection({id:'default', name:'STD', code:'STD-50', width:50, depth:40, weight:0.6});
  return null;
}

function _dsRunEngine(w, h) {
  if (typeof ClosedShape === 'undefined' || typeof SweepEngine === 'undefined') return null;
  var shape = ClosedShape.rect(w, h);
  shape.autoLabel();
  var profile = _dsGetProfile();
  var joint = (typeof JointRule !== 'undefined') ? new JointRule({type: _ds.jointType}) : null;
  if (!profile || !joint) return null;
  return SweepEngine.sweep(shape, profile, joint);
}

// ════════════════════════════════════════════════════
// DXF IMPORT
// ════════════════════════════════════════════════════
function _dsImportDXF(input) {
  var file = input.files[0];
  if (!file) return;
  if (typeof DXFParser === 'undefined') { notify('⚠️ DXF Parser ' + t('غير محمل'), 'error'); input.value = ''; return; }

  DXFParser.parseFile(file, function(shapes) {
    _ds.dxfShapes = shapes;
    if (!shapes.length) { notify('⚠️ ' + t('لا توجد أشكال في الملف'), 'error'); return; }

    notify('📂 ' + t('تم استيراد') + ' ' + shapes.length + ' ' + t('شكل من DXF'));

    // رسم الأشكال المستوردة على الكانفاس
    _dsDrawDXFShapes(shapes);
  });
  input.value = '';
}

function _dsDrawDXFShapes(shapes) {
  var cv = document.getElementById('dsCanvas');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var cw = cv.width, ch = cv.height;
  ctx.clearRect(0, 0, cw, ch);

  // حساب الحدود الكلية
  var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  shapes.forEach(function(s) {
    s.points.forEach(function(p) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });
  });
  var w = maxX - minX, h = maxY - minY;
  if (w <= 0 || h <= 0) return;

  var pad = 60;
  var scale = Math.min((cw - pad * 2) / w, (ch - pad * 2) / h);
  var ox = (cw - w * scale) / 2;
  var oy = (ch - h * scale) / 2;

  // رسم الشبكة
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  ctx.lineWidth = 0.5;
  for (var gx = 0; gx < cw; gx += 30) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, ch); ctx.stroke(); }
  for (var gy = 0; gy < ch; gy += 30) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(cw, gy); ctx.stroke(); }

  // رسم كل شكل
  var colors = ['#2563eb', '#dc2626', '#059669', '#d97706', '#8b5cf6', '#0e7490'];
  shapes.forEach(function(shape, si) {
    var pts = shape.points;
    if (pts.length < 2) return;
    ctx.strokeStyle = colors[si % colors.length];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox + (pts[0].x - minX) * scale, oy + (h - (pts[0].y - minY)) * scale);
    for (var i = 1; i < pts.length; i++) {
      ctx.lineTo(ox + (pts[i].x - minX) * scale, oy + (h - (pts[i].y - minY)) * scale);
    }
    if (shape.closed) ctx.closePath();
    ctx.stroke();

    // نقاط الرؤوس
    ctx.fillStyle = colors[si % colors.length];
    pts.forEach(function(p, pi) {
      var px = ox + (p.x - minX) * scale;
      var py = oy + (h - (p.y - minY)) * scale;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();

      // تسمية النقاط
      ctx.fillStyle = '#1a3a5c';
      ctx.font = 'bold 10px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.label || String.fromCharCode(65 + pi), px, py - 8);
      ctx.fillStyle = colors[si % colors.length];
    });

    // أبعاد الأضلاع
    var segs = shape.segments;
    ctx.fillStyle = '#333';
    ctx.font = '9px Cairo, sans-serif';
    segs.forEach(function(seg) {
      var mx = ox + ((seg.start.x + seg.end.x) / 2 - minX) * scale;
      var my = oy + (h - ((seg.start.y + seg.end.y) / 2 - minY)) * scale;
      ctx.fillText(Math.round(seg.length) + '', mx, my - 6);
    });
  });

  // معلومات
  ctx.fillStyle = '#555';
  ctx.font = '11px Cairo, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(shapes.length + ' ' + t('شكل') + ' | ' + w.toFixed(0) + '×' + h.toFixed(0) + ' mm', cw - 10, ch - 10);

  // إذا شكل واحد مغلق — شغل المحرك عليه
  if (shapes.length === 1 && shapes[0].closed) {
    var shape = shapes[0];
    var bbox = shape.bbox;
    _ds.assembly = _dsRunEngineFromShape(shape);
    _ds.report = null;
    if (_ds.assembly && typeof ManufacturingReport !== 'undefined') {
      _ds.report = new ManufacturingReport(_ds.assembly, _dsGetProfile());
    }
    _dsRenderRight();
    _dsSwitchBottom('Summary');

    // عرض رسالة
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 12px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✅ ' + t('تم تحليل الشكل') + ' — ' + Math.round(bbox.width) + '×' + Math.round(bbox.height) + ' mm', cw / 2, 20);
  }
}

/** Run engine from any ClosedShape (not just rectangle) */
function _dsRunEngineFromShape(shape) {
  if (typeof SweepEngine === 'undefined') return null;
  shape.autoLabel();
  var profile = _dsGetProfile();
  var joint = (typeof JointRule !== 'undefined') ? new JointRule({type: _ds.jointType}) : null;
  if (!profile || !joint) return null;
  return SweepEngine.sweep(shape, profile, joint);
}

// ════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════
/** عرض خصائص قطعة معينة من الـ 3D */
function _dsShowPieceProps(piece) {
  var el = document.getElementById('dsRight');
  if (!el || !piece) return;
  var profile = _dsGetProfile();
  var html = '';
  html += '<div style="background:#e8eaf0;padding:5px 8px;font-weight:700;font-size:11px;color:#333;border-bottom:1px solid var(--border)">🔧 ' + piece.label + ' — Selected Piece</div>';
  html += '<div style="padding:8px">';
  html += _dsProp(t('الضلع'), piece.label);
  html += _dsProp(t('الموضع'), piece.position);
  html += _dsProp(t('الطول الاسمي'), piece.nominalLength.toFixed(0) + ' mm');
  html += _dsProp(t('طول القطع'), piece.cutLength.toFixed(0) + ' mm');
  html += _dsProp(t('زاوية البداية'), (90 - piece.startCutAngle).toFixed(1) + '°');
  html += _dsProp(t('زاوية النهاية'), (90 - piece.endCutAngle).toFixed(1) + '°');
  html += _dsProp(t('وصلة البداية'), piece.startJointType);
  html += _dsProp(t('وصلة النهاية'), piece.endJointType);
  html += _dsProp(t('من'), piece.startVertex + ' → ' + piece.endVertex);
  if (profile) {
    html += _dsProp(t('الوزن'), (piece.cutLength / 1000 * profile.weight).toFixed(2) + ' كغ');
    html += _dsProp(t('البراغي'), profile.screwCount(piece.cutLength));
  }
  html += '</div>';

  if (profile) {
    html += '<div style="background:#e8eaf0;padding:5px 8px;font-weight:700;font-size:11px;color:#333;border-bottom:1px solid var(--border);border-top:1px solid var(--border)">📋 Profile</div>';
    html += '<div style="padding:8px">';
    html += _dsProp(t('الاسم'), profile.name);
    html += _dsProp(t('الأبعاد'), profile.width + '×' + profile.depth + ' mm');
    html += _dsProp(t('التجميع'), profile.assemblyType);
    html += _dsProp(t('الحركة'), profile.motionType);
    html += _dsProp(t('الوجه'), profile.faceDir === 'out' ? t('خارجي') : t('داخلي'));
    html += _dsProp(t('ربات الزجاج'), profile.rebateDepth + ' mm');
    html += '</div>';
  }
  el.innerHTML = html;
}

function _dsProp(label, value) {
  return '<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #f5f5f5"><span style="color:#888;font-size:10px">' + label + '</span><span style="font-weight:600;font-size:11px">' + value + '</span></div>';
}

function _dsSmBox(label, value) {
  return '<div style="text-align:center;min-width:70px"><div style="font-size:16px;font-weight:800;color:#1e2760">' + value + '</div><div style="font-size:9px;color:#888">' + label + '</div></div>';
}
