// USER MANAGEMENT & PERMISSIONS SYSTEM — BUTTON LEVEL
// ══════════════════════════════════════════════════════════

// All definable permissions
const ALL_PERMS = {
  page_projects:'🏗️ المشاريع', page_reports:'📊 التقارير', page_saved:'💾 السجلات',
  page_documents:'🖨️ المستندات', page_installations:'🔨 التركيبات', page_drawings:'📐 الرسومات',
  page_hr:'👥 الموظفين', page_designs:'🎨 التصاميم', page_custody:'💰 الحسابات', page_settings:'⚙️ الإعدادات',
  toolbar_new:'➕ مشروع جديد', toolbar_import:'📥 استيراد Excel', toolbar_export:'📤 تصدير Excel',
  toolbar_save:'💾 حفظ', toolbar_prod:'📈 تقرير الإنتاج', toolbar_weekly:'📋 تقرير أسبوعي', toolbar_materials:'📦 بيان المواد',
  toolbar_form:'📋 استمارة تصنيع (شريط)', toolbar_purchase:'🛒 طلب شراء (شريط)',
  toolbar_savefile:'💾 حفظ كملف', toolbar_restore:'📂 استعادة من ملف', toolbar_backup:'🗄️ نسخة احتياطية',
  btn_edit:'✏️ تعديل المشروع', btn_timeline:'📅 المخطط الزمني', btn_stage:'📊 تغيير المرحلة',
  btn_extract:'🖨️ مستخلص', btn_form:'📋 استمارة تصنيع', btn_purchase:'🛒 طلب شراء', btn_workorder:'📄 تقرير العميل',
  btn_files:'📁 ملفات المشروع', btn_meas:'📐 المقاسات', btn_price:'💰 عرض الأسعار', btn_clientreport:'📄 تقرير العميل', btn_delete:'🗑️ حذف المشروع',
  btn_quick_stage:'⚡ تغيير المرحلة سريعاً (بانل جانبي)',
  rpt_tab_overview:'📊 نظرة عامة', rpt_tab_weekly:'📋 تقرير أسبوعي', rpt_tab_monthly:'📅 تقرير شهري',
  rpt_tab_client:'👤 تقرير عميل', rpt_tab_timeline:'📅 مخطط زمني',
  rpt_prod:'📈 إنشاء تقرير إنتاج', rpt_weekly_new:'📋 إنشاء تقرير أسبوعي', rpt_mats:'📦 إنشاء بيان مواد',
  rpt_print:'🖨️ طباعة التقرير', rpt_save:'💾 حفظ التقرير', rpt_excel:'📤 تصدير Excel',
  saved_prod:'📈 سجل الإنتاج', saved_weekly:'📋 سجل الأسبوعي', saved_mats:'📦 سجل المواد',
  saved_view:'👁️ عرض السجل', saved_print:'🖨️ طباعة السجل', saved_delete:'🗑️ حذف السجل',
  set_companies:'🏢 الشركات', set_security:'🔐 الأمان', set_stages:'📋 المراحل',
  set_gallery:'🏪 المعارض', set_regions:'📍 المناطق', set_columns:'📊 الأعمدة',
  set_logos:'🖼️ الشعارات', set_sections:'📐 القطاعات', set_users:'👥 المستخدمون', set_backup:'💾 النسخ الاحتياطي',
  set_holidays:'📅 العطل والمدة', set_formdata:'📋 داتا استمارة التصنيع',
  inst_add_client:'📐 إضافة عميل (تركيبات)',
  inst_add_defect:'🔧 إضافة نواقص',
  inst_maint_new:'🛠️ أمر صيانة جديد',
  inst_maint_view:'👁️ عرض أوامر الصيانة',
  inst_confirm:'✅ تأكيد ونقل',
  inst_merge:'🔗 دمج',
  inst_delete:'🗑️ حذف (تركيبات)',
  inst_delete_meas:'🗑️ حذف مقاسات',
  inst_pdf:'📄 تصدير PDF',
  inst_delivery_new:'📋 إنشاء أمر تسليم جديد',
  inst_delivery_view:'👁️ عرض أوامر التسليم',
  inst_delivery_print:'🖨️ طباعة أمر التسليم',
  inst_delivery_upload:'📤 رفع الاستلام',
  inst_maint_complete:'✅ إنجاز صيانة',
  inst_maint_print:'🖨️ طباعة تسليم صيانة',
  inst_maint_edit:'✏️ تعديل أمر صيانة',
  inst_maint_delete:'🗑️ حذف أمر صيانة',
  inst_delivery_complete:'✅ تم التسليم',
  inst_delivery_delete:'🗑️ حذف أمر تسليم',
  inst_defect_confirm:'✅ تأكيد ودمج نواقص',
  inst_defect_delete:'🗑️ حذف نواقص',
  inst_defect_pdf:'📄 PDF نواقص',
  inst_measorder_new:'📋 إنشاء أمر رفع مقاسات',
  inst_measorder_view:'👁️ عرض أوامر المقاسات',
  inst_measorder_complete:'✅ إنجاز أمر مقاسات',
  inst_measorder_delete:'🗑️ حذف أمر مقاسات',
  inst_team_tab:'📋 تبويب توزيعة الفرق', inst_team_add:'➕ إضافة فرقة', inst_team_edit:'✏️ تعديل فرقة',
  inst_team_delete:'🗑️ حذف فرقة', inst_team_add_project:'➕ إضافة عميل للفرقة', inst_team_remove_project:'✕ إزالة عميل من فرقة',
  inst_team_workers:'👷 إدارة عمال الفرقة', inst_team_save_history:'💾 حفظ التوزيعة', inst_team_print:'🖨️ طباعة التوزيعة',
  inst_history_tab:'📋 تبويب حركة الفرق', inst_history_delete:'🗑️ حذف سجل حركة', inst_history_print:'🖨️ طباعة سجل حركة',
  hr_tab_org:'🏢 الهيكل التنظيمي', hr_tab_list:'📋 قائمة الموظفين', hr_tab_salary:'💰 الرواتب',
  hr_tab_attend:'📋 الحضور والانصراف', hr_tab_depts:'📁 إدارة الأقسام', hr_tab_vehicles:'🚗 المركبات',
  hr_add_emp:'➕ إضافة موظف', hr_edit_emp:'✏️ تعديل موظف', hr_delete_emp:'🗑️ حذف موظف',
  hr_print:'🖨️ طباعة الهيكل', hr_export:'📤 تصدير الموظفين',
  cust_receive:'💰 استلام عهدة', cust_distribute:'👷 توزيع عهدة',
  cust_invoice:'🧾 إضافة فاتورة', cust_shared_invoice:'🧾 فاتورة مشتركة',
  cust_accounts:'👤 حسابات الموظفين', cust_transfer:'↔️ تحويل عهدة', cust_delete:'🗑️ حذف (عهدة)',
  ds_import_dxf:'📥 استيراد DXF', ds_view_3d:'🧊 عرض ثلاثي الأبعاد', ds_add_profile:'➕ إضافة قطاع مخصص',
  btn_spacecraft:'🚀 وضع الفضاء',
  btn_refresh:'🔄 تحديث',
};
const PERM_GROUPS = {
  '📄 الصفحات':          ['page_projects','page_reports','page_saved','page_documents','page_installations','page_drawings','page_hr','page_designs','page_custody','page_settings'],
  '🔧 شريط الأدوات':     ['toolbar_new','toolbar_export','toolbar_save','toolbar_prod','toolbar_weekly','toolbar_materials','toolbar_form','toolbar_purchase','toolbar_savefile','toolbar_restore','toolbar_backup','toolbar_import'],
  '🔘 أزرار المشروع':    ['btn_edit','btn_timeline','btn_stage','btn_quick_stage','btn_extract','btn_form','btn_purchase','btn_workorder','btn_files','btn_meas','btn_price','btn_clientreport','btn_delete'],
  '📊 تبويبات التقارير': ['rpt_tab_overview','rpt_tab_weekly','rpt_tab_monthly','rpt_tab_client','rpt_tab_timeline'],
  '📋 أزرار التقارير':   ['rpt_prod','rpt_weekly_new','rpt_mats','rpt_print','rpt_save','rpt_excel'],
  '💾 السجلات':          ['saved_prod','saved_weekly','saved_mats','saved_view','saved_print','saved_delete'],
  '⚙️ الإعدادات':        ['set_companies','set_security','set_stages','set_gallery','set_regions','set_columns','set_logos','set_sections','set_users','set_backup','set_holidays','set_formdata'],
  '👥 الموظفين':          ['hr_tab_org','hr_tab_list','hr_tab_salary','hr_tab_attend','hr_tab_depts','hr_tab_vehicles','hr_add_emp','hr_edit_emp','hr_delete_emp','hr_print','hr_export'],
  '💰 الحسابات':          ['cust_receive','cust_distribute','cust_invoice','cust_shared_invoice','cust_accounts','cust_transfer','cust_delete'],
  '🎨 التصاميم':          ['ds_import_dxf','ds_view_3d','ds_add_profile'],
  '🔨 التركيبات':        ['inst_add_client','inst_add_defect','inst_maint_new','inst_maint_view','inst_maint_complete','inst_maint_print','inst_maint_edit','inst_maint_delete','inst_confirm','inst_merge','inst_delete','inst_delete_meas','inst_pdf','inst_delivery_new','inst_delivery_view','inst_delivery_print','inst_delivery_upload','inst_delivery_complete','inst_delivery_delete','inst_defect_confirm','inst_defect_delete','inst_defect_pdf','inst_measorder_new','inst_measorder_view','inst_measorder_complete','inst_measorder_delete','inst_team_tab','inst_team_add','inst_team_edit','inst_team_delete','inst_team_add_project','inst_team_remove_project','inst_team_workers','inst_team_save_history','inst_team_print','inst_history_tab','inst_history_delete','inst_history_print','btn_spacecraft','btn_refresh'],
  '📋 أعمدة الجدول':      ["col_contractNo","col_name","col_company","col_region","col_gallery","col_contractValue","col_downPayment","col_extractValue","col_contractDate","col_deliveryDate","col_stage","col_progress","col_phone","col_notes"],
};
const BTN_PERM_MAP = {
  btn_edit:      "editProject",
  btn_timeline:  "openTimeline",
  btn_stage:     "changeStage",
  btn_extract:   "quickDoc.*مستخلص",
  btn_form:      "openManufacturingForm",
  btn_purchase:  "openPurchaseOrderDirect",
  btn_workorder: "quickDoc.*امر تشغيل",
  btn_files:     "openProjectFiles",
  btn_meas:      "openMeasurements",
  btn_price:     "openPriceList",
  btn_clientreport: "openClientReport",
  btn_delete:    "deleteProject",
  inst_delivery_new: "openDeliveryOrder"
};
const RPT_BTN_MAP = {
  rpt_prod:   "openProductionReport",
  rpt_weekly: "openWeeklyReport",
  rpt_mats:   "openMaterialsReport"
};
// Report tab perm map: tabId → perm key
const RPT_TAB_PERM = {
  'overview':'rpt_tab_overview','weekly':'rpt_tab_weekly',
  'monthly':'rpt_tab_monthly','client':'rpt_tab_client','timeline':'rpt_tab_timeline'
};
// Saved sections perm map
const SAVED_SEC_PERM = { 'production':'saved_prod','weekly':'saved_weekly','materials':'saved_mats' };
const RPT_TAB_MAP    = {};   // kept for compatibility
const SAVED_SECTION_MAP = {}; // kept for compatibility


// ── Column label helper ──
function getColumnLabel(col){
  if(col.label) return col.label;
  const map={contractNo:'رقم العقد',name:'اسم العميل',company:'الشركة',region:'المنطقة',
    gallery:'المعرض',contractValue:'قيمة العقد',downPayment:'الدفعة الأولى',
    extractValue:'قيمة المستخلص',contractDate:'تاريخ العقد',deliveryDate:'تاريخ التسليم',
    stage:'المرحلة',progress:'نسبة الإنجاز',phone:'الهاتف',notes:'الملاحظات',
    contractDuration:'مدة العقد',status:'الحالة'};
  return map[col.key]||col.key;
}

// ── Build dynamic permission grid ──
function buildNewUserPermGrid(){
  const ct=document.getElementById('newUserPermContainer');
  if(!ct||ct.dataset.built) return;
  ct.dataset.built='1';
  // أزرار القوالب
  var tplDiv=document.createElement('div');
  tplDiv.id='permTemplateButtons';
  ct.parentNode.insertBefore(tplDiv, ct);
  // زر نسخ من مستخدم
  var copyDiv=document.createElement('div');
  copyDiv.style.cssText='margin-bottom:8px';
  copyDiv.innerHTML='<button class="btn btn-sm btn-secondary" onclick="_copyPermsFromUser()" style="font-size:11px">📋 '+t('نسخ صلاحيات من مستخدم آخر')+'</button>';
  ct.parentNode.insertBefore(copyDiv, ct);
  setTimeout(function(){ _buildTemplateButtons('permTemplateButtons'); }, 100);
  // Update column perms dynamically from actual columns
  try{
    const {columns}=loadData();
    if(columns&&columns.length){
      const colKey = c => c.key || c.id;
      PERM_GROUPS['📋 أعمدة الجدول']=columns.map(c=>'col_'+colKey(c));
      columns.forEach(c=>{ ALL_PERMS['col_'+colKey(c)]=(c.label||getColumnLabel(c))+' (عمود)'; });
    }
  }catch(e){}
  // صلاحيات العهدة — تلقائي حسب الموظفين يالي عندهم توزيع
  try{
    var _custDists=JSON.parse(localStorage.getItem('pm_custody_dist')||'[]');
    var _custEmpMap={};
    _custDists.filter(function(d){return !d.isTransfer;}).forEach(function(d){
      if(d.employeeId && d.employeeName && !_custEmpMap[d.employeeId]) _custEmpMap[d.employeeId]=d.employeeName;
    });
    var _custEmpKeys=[];
    Object.keys(_custEmpMap).forEach(function(eid){
      var pKey='cust_emp_'+eid;
      ALL_PERMS[pKey]='👷 عهدة '+_custEmpMap[eid];
      _custEmpKeys.push(pKey);
    });
    if(_custEmpKeys.length) PERM_GROUPS['💰 عهدة الموظفين']=_custEmpKeys;
  }catch(e){}
  let html='';
  Object.entries(PERM_GROUPS).forEach(([groupName,keys])=>{
    const keys2=keys.filter(k=>ALL_PERMS[k]);
    if(!keys2.length) return;
    const gid='npg_'+groupName.replace(/[^a-z0-9]/gi,'_');
    const danger=keys2.some(k=>['btn_delete','set_users','set_security'].includes(k));
    html+=`<div class="perm-section-title" style="${danger?'border-right-color:#dc2626':''}">${groupName}
      <label style="font-size:10px;font-weight:400;cursor:pointer;color:var(--text2)">
        <input type="checkbox" style="accent-color:var(--accent)" onchange="togglePermGroup('${gid}',this.checked)"> الكل
      </label></div>
      <div class="perm-grid" id="${gid}" style="margin-bottom:12px">
        ${keys2.map(k=>{
          const d=['btn_delete','set_users','set_security'].includes(k);
          return `<label class="perm-lbl${d?' perm-danger':''}"><span>${ALL_PERMS[k]||k}</span>
            <input type="checkbox" value="${k}"><span class="perm-toggle"></span></label>`;
        }).join('')}
      </div>`;
  });
  ct.innerHTML=html;
}

function togglePermGroup(gid,checked){
  document.querySelectorAll('#'+gid+' input[type=checkbox]').forEach(cb=>cb.checked=checked);
}

function loadUsers(){ try{return JSON.parse(localStorage.getItem('pm_users')||'[]');}catch(e){return[];} }

// ── Permission templates — قوالب الصلاحيات ──
const _BUILTIN_TEMPLATES = {
  all: Object.keys(ALL_PERMS),
  none: []
};
function _loadCustomTemplates() {
  try { return JSON.parse(localStorage.getItem('pm_perm_templates')||'{}'); } catch(e) { return {}; }
}
function _saveCustomTemplates(t) { localStorage.setItem('pm_perm_templates', JSON.stringify(t)); }
function _getAllTemplates() {
  var custom = _loadCustomTemplates();
  var merged = {};
  Object.keys(custom).forEach(function(k){ merged[k] = custom[k]; });
  merged['✅ الكل'] = _BUILTIN_TEMPLATES.all;
  merged['❌ لا شيء'] = _BUILTIN_TEMPLATES.none;
  return merged;
}
function _buildTemplateButtons(containerId) {
  var templates = _getAllTemplates();
  var html = '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">';
  Object.keys(templates).forEach(function(name) {
    var isBuiltin = name==='✅ الكل' || name==='❌ لا شيء';
    html += '<button class="btn btn-sm" onclick="applyPermTemplate(\''+name.replace(/'/g,"\\'")+'\')" style="font-size:11px;padding:3px 10px;'
      +(isBuiltin?'background:var(--surface3);color:var(--text);border:1px solid var(--border)':'background:var(--accent);color:#fff;border:none')
      +'">'+name+'</button>';
    if(!isBuiltin) {
      html += '<button class="btn btn-sm btn-danger" onclick="_deletePermTemplate(\''+name.replace(/'/g,"\\'")+'\')" style="font-size:9px;padding:2px 4px;margin-left:-4px" title="حذف">✕</button>';
    }
  });
  html += '<button class="btn btn-sm" onclick="_saveCurrentAsTemplate()" style="font-size:11px;padding:3px 10px;background:#16a34a;color:#fff;border:none">💾 '+t('حفظ كقالب')+'</button>';
  html += '</div>';
  var el = document.getElementById(containerId);
  if(el) el.innerHTML = html;
}
function _saveCurrentAsTemplate() {
  var name = prompt(t('اسم القالب (مثال: متابع، مدير فرقة، محاسب):'));
  if(!name || !name.trim()) return;
  name = name.trim();
  // نجمع الصلاحيات المحددة حالياً
  var perms = [];
  document.querySelectorAll('.perm-grid input[type=checkbox]:checked, #newUserPermContainer input[type=checkbox]:checked').forEach(function(cb){
    perms.push(cb.value);
  });
  if(!perms.length) { notify(t('اختر صلاحيات أولاً'),'error'); return; }
  var templates = _loadCustomTemplates();
  templates[name] = perms;
  _saveCustomTemplates(templates);
  // إعادة بناء الأزرار
  _buildTemplateButtons('permTemplateButtons');
  _buildTemplateButtons('permTemplateButtonsModal');
  notify('✅ '+t('تم حفظ القالب')+': '+name+' ('+perms.length+' '+t('صلاحية')+')');
}
function _deletePermTemplate(name) {
  if(!confirm(t('حذف القالب')+' "'+name+'"?')) return;
  var templates = _loadCustomTemplates();
  delete templates[name];
  _saveCustomTemplates(templates);
  _buildTemplateButtons('permTemplateButtons');
  _buildTemplateButtons('permTemplateButtonsModal');
  notify('🗑️ '+t('تم حذف القالب'));
}
// نسخ صلاحيات من مستخدم آخر
function _copyPermsFromUser() {
  var users = loadUsers();
  if(!users.length) { notify(t('لا يوجد مستخدمين'),'error'); return; }
  var opts = users.map(function(u){ return u.name+' ('+((u.perms||[]).length)+' صلاحية)'; });
  var choice = prompt(t('نسخ صلاحيات من مستخدم:')+'\n'+opts.join('\n')+'\n\n'+t('اكتب اسم المستخدم:'));
  if(!choice) return;
  var user = users.find(function(u){ return u.name === choice.trim(); });
  if(!user) { notify(t('المستخدم غير موجود'),'error'); return; }
  var keys = new Set(user.perms||[]);
  document.querySelectorAll('.perm-grid input[type=checkbox], #newUserPermContainer input[type=checkbox]').forEach(function(cb){
    cb.checked = keys.has(cb.value);
  });
  notify('✅ '+t('تم نسخ صلاحيات')+' '+user.name+' ('+keys.size+')');
}
function applyPermTemplate(tpl){
  buildNewUserPermGrid(); // ensure grid is built
  var templates = _getAllTemplates();
  const keys=new Set(templates[tpl]||[]);
  document.querySelectorAll('#newUserPermContainer input[type=checkbox]').forEach(cb=>{
    cb.checked=keys.has(cb.value);
  });
}
function applyPermTemplateInModal(btn,tpl){
  var templates = _getAllTemplates();
  const keys=new Set(templates[tpl]||[]);
  btn.closest('.modal-body').querySelectorAll('.perm-grid input[type=checkbox]').forEach(cb=>{
    cb.checked=keys.has(cb.value);
  });
}
// ── Force reset master password (emergency) ──

function saveUsers(arr){
  localStorage.setItem('pm_users',JSON.stringify(arr));
  // Sync to server so other devices get the update
  fetch('/api/data/pm_users',{
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({value: arr})
  }).catch(function(){});
}
function getCurrentUser(){ try{return JSON.parse(sessionStorage.getItem('pm_current_user')||'null');}catch(e){return null;} }
function setCurrentUser(u){ sessionStorage.setItem('pm_current_user', JSON.stringify(u)); }

// (old login functions removed — see unified auth below)

// ── Apply permissions ──
// ربط تلقائي: إذا عند المستخدم أي صلاحية فرعية من مجموعة → يتم تفعيل صلاحية الصفحة تلقائياً
const _PAGE_SUB_PERMS = {
  page_hr:            ['hr_tab_org','hr_tab_list','hr_tab_salary','hr_tab_attend','hr_tab_depts','hr_tab_vehicles','hr_add_emp','hr_edit_emp','hr_delete_emp','hr_print','hr_export'],
  page_designs:       ['ds_import_dxf','ds_view_3d','ds_add_profile'],
  page_custody:       ['cust_receive','cust_distribute','cust_invoice','cust_shared_invoice','cust_accounts','cust_transfer','cust_delete'],
  page_installations: ['inst_add_client','inst_add_defect','inst_maint_new','inst_maint_view','inst_confirm','inst_merge','inst_delete','inst_delete_meas','inst_pdf','inst_delivery_new','inst_delivery_view','inst_delivery_print','inst_delivery_upload','inst_maint_complete','inst_maint_print','inst_maint_edit','inst_maint_delete','inst_delivery_complete','inst_delivery_delete','inst_defect_confirm','inst_defect_delete','inst_defect_pdf','inst_measorder_new','inst_measorder_view','inst_measorder_complete','inst_measorder_delete','inst_team_tab','inst_team_add','inst_team_edit','inst_team_delete','inst_team_add_project','inst_team_remove_project','inst_team_workers','inst_team_save_history','inst_team_print','inst_history_tab','inst_history_delete','inst_history_print'],
};

function applyUserPermissions(user){
  document.getElementById('userBanner')?.remove();
  // Restore all hidden elements first
  document.querySelectorAll('[data-ph]').forEach(el=>{el.style.display=el.dataset.ph;delete el.dataset.ph;});

  // تفعيل تلقائي للصفحة إذا عنده أي صلاحية فرعية
  if(user && !user.isAdmin && user.perms) {
    const ps = new Set(user.perms);
    Object.entries(_PAGE_SUB_PERMS).forEach(([pagePerm, subs]) => {
      if(!ps.has(pagePerm) && subs.some(s => ps.has(s))) {
        user.perms.push(pagePerm);
        ps.add(pagePerm);
      }
    });
    // تفعيل تلقائي للعهدة — بالتوزيع أو بصلاحية cust_emp_*
    if(!ps.has('page_custody')) {
      // شيك صلاحية cust_emp_*
      var _hasCustEmp = false;
      ps.forEach(function(p){ if(p.indexOf('cust_emp_')===0) _hasCustEmp=true; });
      if(_hasCustEmp) {
        user.perms.push('page_custody','cust_accounts','cust_invoice');
        ps.add('page_custody'); ps.add('cust_accounts'); ps.add('cust_invoice');
      }
      // أو شيك التوزيع المباشر
      if(!ps.has('page_custody')) {
        try {
          var _dists = JSON.parse(localStorage.getItem('pm_custody_dist')||'[]');
          var _emps = typeof _custLoadEmployees==='function' ? _custLoadEmployees() : JSON.parse(localStorage.getItem('pm_employees')||'[]');
          var _myEmp = _emps.find(function(e){return e.name===user.name;}) || _emps.find(function(e){return e.name && user.name && (e.name.indexOf(user.name)>-1 || user.name.indexOf(e.name)>-1);});
          if(_myEmp && _dists.some(function(d){return d.employeeId===_myEmp.id && !d.isTransfer;})) {
            user.perms.push('page_custody','cust_accounts','cust_invoice');
            ps.add('page_custody'); ps.add('cust_accounts'); ps.add('cust_invoice');
          }
        } catch(e){}
      }
    }
  }

  // Show installations nav for users with that perm (or admin)
  const instBtn=document.getElementById('navInstBtn');
  if(instBtn) instBtn.style.display=(!user||user.isAdmin||(user.perms||[]).includes('page_installations'))?'':'none';
  // Show drawings nav for users with that perm (or admin)
  const drawBtn=document.getElementById('navDrawBtn');
  if(drawBtn) drawBtn.style.display=(!user||user.isAdmin||(user.perms||[]).includes('page_drawings'))?'':'none';
  const mobDrawBtn=document.getElementById('mobNavDrawBtn');
  if(mobDrawBtn) mobDrawBtn.style.display=(!user||user.isAdmin||(user.perms||[]).includes('page_drawings'))?'':'none';
  // Show HR nav
  const hrBtn=document.getElementById('navHrBtn');
  if(hrBtn) hrBtn.style.display=(!user||user.isAdmin||(user.perms||[]).includes('page_hr'))?'':'none';
  // Show Designs nav
  const desBtn=document.getElementById('navDesignsBtn');
  if(desBtn) desBtn.style.display=(!user||user.isAdmin||(user.perms||[]).includes('page_designs'))?'':'none';
  // Show Custody nav
  const custBtn=document.getElementById('navCustodyBtn');
  if(custBtn) custBtn.style.display=(!user||user.isAdmin||(user.perms||[]).includes('page_custody'))?'':'none';

  if(!user||user.isAdmin){
    document.querySelectorAll('.sb-btn').forEach(b=>b.style.display='');
    document.querySelectorAll('.nav-btn').forEach(b=>b.style.display='');
    if(instBtn) instBtn.style.display='';
    if(drawBtn) drawBtn.style.display='';
    if(mobDrawBtn) mobDrawBtn.style.display='';
    if(hrBtn) hrBtn.style.display='';
    if(desBtn) desBtn.style.display='';
    if(custBtn) custBtn.style.display='';
    document.querySelectorAll('#page-projects button, #page-projects label').forEach(b=>{ if(b.dataset.ph!==undefined){b.style.display=b.dataset.ph;delete b.dataset.ph;} else if(b.style.display==='none'&&!b.id?.includes('matStage')){b.style.display='';} });
    return;
  }

  // If user is technician (has installations but not projects), redirect to installations
  const _permsSet = new Set(user.perms||[]);
  if(_permsSet.has('page_installations') && !_permsSet.has('page_projects')){
    setTimeout(function(){ showPage('installations'); }, 100);
  }
  const perms = new Set(user.perms||[]);
  function hide(el){ if(el&&el.style.display!=='none'){ el.dataset.ph=el.style.display||''; el.style.display='none'; } }
  function hideQ(sel){ document.querySelectorAll(sel).forEach(el=>hide(el)); }
  const hp = k => perms.has(k);

  // 1. صفحات — sidebar + navbar + mobile
  document.querySelectorAll('.sb-btn,.nav-btn,.mob-nav-item').forEach(b=>{
    const oc = b.getAttribute('onclick')||'';
    ['projects','reports','saved','settings','documents','installations','drawings','hr','designs','custody'].forEach(pg=>{
      if(oc.includes("'"+pg+"'") || oc.includes("'"+pg+"'")) {
        if(!hp('page_'+pg)) hide(b);
      }
    });
  });

  // 2. أزرار toolbar (حفظ ملف، استعادة، نسخة احتياطية، استيراد)
  document.querySelectorAll('.nav-btn, #page-projects button').forEach(btn=>{
    const oc = btn.getAttribute('onclick')||'';
    if(oc.includes('saveToFile') && !hp('toolbar_savefile')) hide(btn);
    if(oc.includes('restoreFileInput') && !hp('toolbar_restore')) hide(btn);
    if(oc.includes('exportAllData') && !hp('toolbar_backup')) hide(btn);
    if(oc.includes('saveData') && !hp('toolbar_save')) hide(btn);
    if(oc.includes('openNewProjectModal') && !hp('toolbar_new')) hide(btn);
    if(oc.includes('exportToExcel') && !hp('toolbar_export')) hide(btn);
    if(oc.includes('openProductionReport') && !hp('toolbar_prod')) hide(btn);
    if(oc.includes('openWeeklyReport') && !hp('toolbar_weekly')) hide(btn);
    if(oc.includes('openMaterialsReport') && !hp('toolbar_materials')) hide(btn);
    if(oc.includes('openFormSelector') && !hp('toolbar_form')) hide(btn);
    if(oc.includes('openPurchaseOrderSelector') && !hp('toolbar_purchase')) hide(btn);
    if(oc.includes('exportProjectsExcel') && !hp('toolbar_export')) hide(btn);
  });
  // labels for file inputs
  if(!hp('toolbar_restore')) hide(document.querySelector('label[for="restoreFileInput"]'));
  if(!hp('toolbar_import'))  hide(document.querySelector('label[for="xlsImport"]'));

  // 3. تبويبات التقارير
  Object.entries(RPT_TAB_PERM).forEach(([tabId,perm])=>{
    if(!hp(perm)) hide(document.getElementById('rptTab-'+tabId));
  });

  // 4. أزرار إنشاء التقارير
  Object.entries(RPT_BTN_MAP).forEach(([perm,fn])=>{
    if(!hp(perm)) hideQ('button[onclick*="'+fn+'"]');
  });

  // 5. أقسام السجلات
  Object.entries(SAVED_SEC_PERM).forEach(([secId,perm])=>{
    if(!hp(perm)){
      hide(document.getElementById('savedTab-'+secId));
      hide(document.getElementById('saved-'+secId));
    }
  });
  if(!hp('saved_view'))   hideQ('[onclick*="viewSaved"]');
  if(!hp('saved_print'))  hideQ('[onclick*="printSaved"]');
  if(!hp('saved_delete')) hideQ('[onclick*="deleteSavedReport"]');

  // 6. تبويبات الإعدادات
  const setMap = {
    set_companies:'companies', set_security:'security',  set_stages:'stages',
    set_gallery:'gallery',     set_regions:'regions',    set_columns:'columns',
    set_logos:'logos',         set_sections:'sections',  set_users:'users', set_backup:'backup',
    set_holidays:'holidays',   set_formdata:'formdata'
  };
  document.querySelectorAll('#page-settings .tab').forEach(tab=>{
    const oc = tab.getAttribute('onclick')||'';
    for(const [perm,tid] of Object.entries(setMap)){
      if(oc.includes("'"+tid+"'") && !hp(perm)){ hide(tab); break; }
    }
  });

  // 7. زر ملفات العميل
  if(!hp('btn_files')) hideQ('[onclick*="openProjectFiles"]');

  // 8. أزرار الشريط الجانبي السفلي
  if(!hp('toolbar_save'))   hide(document.getElementById('sidebarSaveBtn'));
  if(!hp('toolbar_backup')) hide(document.getElementById('sidebarBackupBtn'));
  if(!hp('btn_refresh'))    hide(document.getElementById('sidebarRefreshBtn'));
  // زر الإعدادات الشخصية — يظهر للموظفين فقط (المدير عنده الإعدادات الكاملة)
  var _profBtn=document.getElementById('sidebarProfileBtn');
  if(_profBtn && (!user || user.isAdmin)) _profBtn.style.display='none';
  // زر الفضاء — يُخفى إذا ما عنده الصلاحية
  if(!hp('btn_spacecraft')) { var _sc=document.getElementById('spacecraftBtn'); if(_sc) _sc.style.display='none'; }

  // 9. صلاحيات الموظفين (HR) — كل تبويب بصلاحية مستقلة
  var _hrTabs = {hr_tab_org:'org', hr_tab_list:'list', hr_tab_salary:'salary', hr_tab_attend:'attend', hr_tab_depts:'depts', hr_tab_vehicles:'vehicles'};
  Object.entries(_hrTabs).forEach(function(e) {
    if(!hp(e[0])) { var _t=document.getElementById('hrTab-'+e[1]); if(_t) hide(_t); var _s=document.getElementById('hrSection-'+e[1]); if(_s) hide(_s); }
  });
  if(!hp('hr_add_emp'))    hideQ('[onclick*="hrAddEmployee"]');
  if(!hp('hr_edit_emp'))   hideQ('[onclick*="hrEditEmployee"]');
  if(!hp('hr_delete_emp')) hideQ('[onclick*="hrDeleteEmployee"]');
  if(!hp('hr_print'))      hideQ('[onclick*="hrPrintOrgChart"]');
  if(!hp('hr_export'))     hideQ('[onclick*="hrExportEmployees"]');

  // 10a. صلاحيات الحسابات (Custody)
  if(!hp('cust_receive'))        { hideQ('[onclick*="custAddCustody"]'); var _cr=document.getElementById('custTab-receive'); if(_cr) hide(_cr); }
  if(!hp('cust_distribute'))     { hideQ('[onclick*="custAddDist"]'); var _cd=document.getElementById('custTab-distribute'); if(_cd) hide(_cd); }
  if(!hp('cust_invoice'))        hideQ('[onclick*="custAddInvoice"]');
  if(!hp('cust_shared_invoice')) hideQ('[onclick*="custAddSharedInvoice"]');
  if(!hp('cust_accounts'))       { var _ca=document.getElementById('custTab-accounts'); if(_ca) hide(_ca); }
  if(!hp('cust_transfer'))       hideQ('[onclick*="_custTransferCustody"]');
  if(!hp('cust_delete'))         hideQ('[onclick*="custDelete"]');
  // تبويب تسوية الفواتير — فقط المدير أو يالي عنده cust_receive
  if(!hp('cust_receive'))        { var _ci=document.getElementById('custTab-invoices'); if(_ci) hide(_ci); }
  // إذا الموظف عنده بس cust_accounts — نفتح تبويب حسابات الموظفين مباشرة
  if(hp('cust_accounts') && !hp('cust_receive') && !hp('cust_distribute')) {
    setTimeout(function(){ if(typeof switchCustodyTab==='function') switchCustodyTab('accounts'); }, 200);
  }

  // 10. صلاحيات التصاميم (Designs)
  if(!hp('ds_import_dxf'))  hideQ('[onclick*="_dsImportDXF"]');
  if(!hp('ds_view_3d'))     hideQ('[onclick*="_dsSetView"][onclick*="3d"]');
  if(!hp('ds_add_profile')) hideQ('[onclick*="_dsAddProfileModal"]');

  // 11. صلاحيات توزيعة الفرق وحركة الفرق (Teams)
  if(!hp('inst_team_tab'))          { var _tt=document.getElementById('instTab-teams'); if(_tt) hide(_tt); }
  if(!hp('inst_team_add'))          hideQ('[onclick*="teamDistAddTeam"]');
  if(!hp('inst_team_edit'))         hideQ('[onclick*="teamDistEdit"]');
  if(!hp('inst_team_delete'))       hideQ('[onclick*="teamDistRemoveTeam"]');
  if(!hp('inst_team_add_project'))  hideQ('[onclick*="teamDistAddProject"]');
  if(!hp('inst_team_remove_project'))hideQ('[onclick*="teamDistRemoveProject"]');
  if(!hp('inst_team_workers'))      hideQ('[onclick*="teamDistManageWorkers"]');
  if(!hp('inst_team_save_history')) hideQ('[onclick*="teamDistSaveHistory"]');
  if(!hp('inst_team_print'))        hideQ('[onclick*="teamDistPrint"]');
  if(!hp('inst_history_tab'))       { var _ht=document.getElementById('instTab-history'); if(_ht) hide(_ht); }
  if(!hp('inst_history_delete'))    hideQ('[onclick*="teamHistoryDelete"]');
  if(!hp('inst_history_print'))     hideQ('[onclick*="teamHistoryPrint"]');

}

// ── Called when building the side panel actions — filters buttons by perms ──
function filterActionsByPerms(actions){
  const cu=getCurrentUser();
  if(!cu||cu.isAdmin) return actions;
  const perms=new Set(cu.perms||[]);
  return actions.filter(a=>{
    // Match each action to its perm key
    for(const [perm,fnPat] of Object.entries(BTN_PERM_MAP)){
      const re=new RegExp(fnPat);
      if(re.test(a.fn)) return perms.has(perm);
    }
    return false; // unknown action — hide by default for safety
  });
}

// ── renderUsersSettings ──
function renderUsersSettings(){
  const el=document.getElementById('usersListSettings');if(!el)return;
  // بناء grid الصلاحيات تلقائي
  setTimeout(buildNewUserPermGrid, 50);
  const users=loadUsers();
  const {companies,regions,galleries}=loadData();
  // Populate dropdowns
  const coSel=document.getElementById('newUserCompany');
  const rgSel=document.getElementById('newUserRegion');
  const glSel=document.getElementById('newUserGallery');
  if(coSel) coSel.innerHTML='<option value="">كل الشركات</option>'+companies.map(co=>`<option>${co}</option>`).join('');
  if(rgSel) rgSel.innerHTML='<option value="">كل المناطق</option>'+regions.map(r=>`<option>${r}</option>`).join('');
  if(glSel) glSel.innerHTML='<option value="">كل المعارض</option>'+(galleries||[]).map(g=>`<option>${g}</option>`).join('');

  if(!users.length){
    el.innerHTML=`<div style="padding:20px;text-align:center;color:var(--text2);background:var(--surface2);border-radius:8px;border:1px dashed var(--border)">
      لا يوجد مستخدمون بعد — أضف مستخدماً من الأسفل<br>
      <small>المدير لديه وصول كامل دائماً (زر "دخول كمدير")</small></div>`;
    return;
  }
  el.innerHTML=users.map((u,i)=>{
    const perms=new Set(u.perms||[]);
    // Group labels
    const grpBadges=Object.entries(PERM_GROUPS).map(([grp,keys])=>{
      const active=keys.filter(k=>perms.has(k));
      if(!active.length) return '';
      const isAll=active.length===keys.length;
      return `<div style="margin-bottom:5px">
        <span style="font-size:10px;color:var(--text2);font-weight:600">${grp}:</span>
        ${isAll
          ? `<span style="background:rgba(22,163,74,.15);color:#16a34a;padding:2px 8px;border-radius:10px;font-size:10px;border:1px solid rgba(22,163,74,.3);margin-right:4px">✅ الكل (${keys.length})</span>`
          : active.map(k=>`<span style="background:var(--surface3);padding:2px 7px;border-radius:10px;font-size:10px;border:1px solid var(--border);margin:1px 2px;display:inline-block">${ALL_PERMS[k]||k}</span>`).join('')
        }
      </div>`;
    }).filter(Boolean).join('');
    const filter=(u.filterCompany?'🏢 '+u.filterCompany+' ':'')+(u.filterRegion?'📍 '+u.filterRegion+' ':'')+(u.filterGallery?'🏪 '+u.filterGallery:'');
    const wmBadge = u.forceWatermark ? '<span style="font-size:10px;background:rgba(59,130,246,.15);color:#3b82f6;padding:2px 8px;border-radius:10px;border:1px solid rgba(59,130,246,.3)">علامة مائية دائمة</span>' : u.hideWatermark ? '<span style="font-size:10px;background:rgba(220,38,38,.15);color:#dc2626;padding:2px 8px;border-radius:10px;border:1px solid rgba(220,38,38,.3)">بدون علامة مائية</span>' : '';
    const totalPerms=perms.size, totalAll=Object.keys(ALL_PERMS).length;
    return `<div style="background:var(--surface2);border-radius:10px;padding:14px;margin-bottom:10px;border:1px solid var(--border)">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <div style="font-size:14px;font-weight:700;color:var(--accent)">👤 ${u.name}</div>
            <div style="font-size:11px;background:var(--surface3);padding:2px 8px;border-radius:10px;color:var(--text2)">${totalPerms}/${totalAll} صلاحية</div>
            ${filter?`<div style="font-size:11px;color:var(--accent2)">🔍 ${filter}</div>`:''}
            ${wmBadge}
            ${u.phone?'<span style="font-size:10px;color:var(--text2)">📞 '+u.phone+'</span>':''}
            ${u.email?'<span style="font-size:10px;color:var(--text2)">📧 '+u.email+'</span>':''}
            ${u.passChangedAt?'<span style="font-size:10px;color:#f59e0b">🔑 '+t('غيّر كلمة المرور')+' '+new Date(u.passChangedAt).toLocaleDateString('ar-SA')+'</span>':''}
            <div style="font-size:10px;color:var(--text2)">${u.createdAt||''}</div>
          </div>
          <div>${grpBadges||'<span style="font-size:11px;color:var(--accent3)">⚠️ لا صلاحيات محددة</span>'}</div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button class="btn btn-sm btn-secondary" onclick="editUser(${i})">✏️ تعديل</button>
          <button class="btn btn-sm btn-danger" onclick="deleteUser(${i})">🗑️ حذف</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── addUser ──
function addUser(){
  buildNewUserPermGrid(); // تأكد إن الـ grid مبنية
  const name=(document.getElementById('newUserName')?.value||'').trim();
  const pass=document.getElementById('newUserPass')?.value||'';
  if(!name){notify('⚠️ '+t('أدخل اسم المستخدم'),'error');return;}
  if(!pass||pass.length<4){notify('⚠️ '+t('كلمة المرور 4 أحرف على الأقل'),'error');return;}
  const perms=[...document.querySelectorAll('#newUserPermContainer input:checked')].map(cb=>cb.value);
  console.log('perms found:', perms.length, perms);
  const filterCompany=document.getElementById('newUserCompany')?.value||'';
  const filterRegion=document.getElementById('newUserRegion')?.value||'';
  const filterGallery=document.getElementById('newUserGallery')?.value||'';
  const forceWatermark=document.getElementById('newUserForceWM')?.checked||false;
  const hideWatermark=document.getElementById('newUserHideWM')?.checked||false;
  const users=loadUsers();
  if(users.find(u=>u.name===name)){notify('⚠️ '+t('اسم المستخدم موجود'),'error');return;}
  users.push({name,pass:btoa(pass),perms,filterCompany,filterRegion,filterGallery,forceWatermark,hideWatermark,createdAt:new Date().toLocaleDateString('ar-SA')});
  saveUsers(users);
  document.getElementById('newUserName').value='';
  document.getElementById('newUserPass').value='';
  document.querySelectorAll('#newUserPermContainer input[type=checkbox]').forEach(cb=>cb.checked=false);
  renderUsersSettings();
  notify('✅ '+t('تم إضافة')+': '+name);
}

// ── editUser ──
function editUser(idx){
  const users=loadUsers();const u=users[idx];if(!u)return;
  const {companies,regions,columns,galleries}=loadData();
  // Ensure column labels are populated in ALL_PERMS
  if(columns&&columns.length){
    const colKey = c => c.key || c.id;
    PERM_GROUPS['📋 أعمدة الجدول']=columns.map(c=>'col_'+colKey(c));
    columns.forEach(c=>{ ALL_PERMS['col_'+colKey(c)]=(c.label||getColumnLabel(c))+' (عمود)'; });
  }
  // صلاحيات العهدة التلقائية
  try{
    var _cd2=JSON.parse(localStorage.getItem('pm_custody_dist')||'[]');
    var _ce2={};
    _cd2.filter(function(d){return !d.isTransfer;}).forEach(function(d){if(d.employeeId&&d.employeeName&&!_ce2[d.employeeId])_ce2[d.employeeId]=d.employeeName;});
    var _ck2=[];
    Object.keys(_ce2).forEach(function(eid){var pk='cust_emp_'+eid;ALL_PERMS[pk]='👷 عهدة '+_ce2[eid];_ck2.push(pk);});
    if(_ck2.length)PERM_GROUPS['💰 عهدة الموظفين']=_ck2;
  }catch(e){}
  const perms=new Set(u.perms||[]);
  // Build grouped checkboxes
  function permGroup(keys, title){
    const keys2=keys.filter(k=>ALL_PERMS[k]);
    if(!keys2.length) return '';
    const danger=keys2.some(k=>['btn_delete','set_users','set_security'].includes(k));
    const gid='epg'+Math.random().toString(36).slice(2,6);
    return `<div class="perm-section-title" style="${danger?'border-right-color:#dc2626':''}">${title}
      <label style="font-size:10px;font-weight:400;cursor:pointer;color:var(--text2)">
        <input type="checkbox" style="accent-color:var(--accent)"
          onchange="document.getElementById('${gid}').querySelectorAll('input').forEach(cb=>cb.checked=this.checked)"> الكل
      </label></div>
      <div class="perm-grid" id="${gid}" style="margin-bottom:12px">
        ${keys2.map(k=>{
          const d=['btn_delete','set_users','set_security'].includes(k);
          return `<label class="perm-lbl${d?' perm-danger':''}"><span>${ALL_PERMS[k]}</span>
            <input type="checkbox" value="${k}" ${perms.has(k)?'checked':''}>
            <span class="perm-toggle"></span></label>`;
        }).join('')}
      </div>`;
  }
  const modal=document.createElement('div');modal.className='modal-bg';
  modal.innerHTML=`<div class="modal" style="max-width:640px">
    <div class="modal-header"><div class="modal-title">✏️ تعديل: ${u.name}</div>
      <button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest('.modal-bg').remove()">✕</button></div>
    <div class="modal-body">
      <div class="form-group" style="margin-bottom:14px">
        <div class="form-label">كلمة المرور الجديدة (فارغة = بدون تغيير)</div>
        <input id="editPass_${idx}" type="password" placeholder="كلمة مرور جديدة" style="width:100%;max-width:300px">
      </div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:8px">القوالب:</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:14px">
        ${Object.keys(_getAllTemplates()).map(function(name){
          return '<button type="button" class="btn btn-sm '+(name==='✅ الكل'||name==='❌ لا شيء'?'btn-secondary':'btn-primary')+'" onclick="applyPermTemplateInModal(this,\''+name.replace(/'/g,"\\'")+'\')">'+name+'</button>';
        }).join('')}
        <button type="button" class="btn btn-sm btn-secondary" onclick="_copyPermsFromUser()" style="font-size:10px">📋 نسخ من مستخدم</button>
      </div>
      ${Object.entries(PERM_GROUPS).map(([g,keys])=>permGroup(keys,g)).join('')}
      <div style="padding:12px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:10px;margin-bottom:14px">
        <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--accent)">علامة مائية</div>
        <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer">
            <input type="checkbox" id="editForceWM_${idx}" ${u.forceWatermark?'checked':''} onchange="if(this.checked)document.getElementById('editHideWM_${idx}').checked=false" style="accent-color:#3b82f6">
            إظهار العلامة المائية دائماً لهذا المستخدم
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer">
            <input type="checkbox" id="editHideWM_${idx}" ${u.hideWatermark?'checked':''} onchange="if(this.checked)document.getElementById('editForceWM_${idx}').checked=false" style="accent-color:#dc2626">
            إخفاء العلامة المائية لهذا المستخدم
          </label>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px">
        <div><div class="form-label">تصفية الشركة</div>
          <select id="editCo_${idx}" style="width:100%">
            <option value="">كل الشركات</option>${companies.map(co=>`<option ${u.filterCompany===co?'selected':''}>${co}</option>`).join('')}
          </select></div>
        <div><div class="form-label">تصفية المنطقة</div>
          <select id="editRg_${idx}" style="width:100%">
            <option value="">كل المناطق</option>${regions.map(r=>`<option ${u.filterRegion===r?'selected':''}>${r}</option>`).join('')}
          </select></div>
        <div><div class="form-label">تصفية المعرض</div>
          <select id="editGl_${idx}" style="width:100%">
            <option value="">كل المعارض</option>${(galleries||[]).map(g=>`<option ${u.filterGallery===g?'selected':''}>${g}</option>`).join('')}
          </select></div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" onclick="this.closest('.modal-bg').remove()">إلغاء</button>
        <button class="btn btn-primary" onclick="updateUser(${idx},this)">💾 حفظ</button>
      </div>
    </div></div>`;
  document.body.appendChild(modal);
}

function updateUser(idx,btn){
  const users=loadUsers();if(!users[idx])return;
  const newPass=document.getElementById('editPass_'+idx)?.value||'';
  if(newPass&&newPass.length<4){notify('⚠️ '+t('كلمة المرور قصيرة'),'error');return;}
  if(newPass) users[idx].pass=btoa(newPass);
  const perms=[...btn.closest('.modal-body').querySelectorAll('.perm-grid input:checked')].map(cb=>cb.value);
  users[idx].perms=perms;
  users[idx].filterCompany=document.getElementById('editCo_'+idx)?.value||'';
  users[idx].filterRegion=document.getElementById('editRg_'+idx)?.value||'';
  users[idx].filterGallery=document.getElementById('editGl_'+idx)?.value||'';
  users[idx].forceWatermark=document.getElementById('editForceWM_'+idx)?.checked||false;
  users[idx].hideWatermark=document.getElementById('editHideWM_'+idx)?.checked||false;
  saveUsers(users);btn.closest('.modal-bg').remove();renderUsersSettings();
  notify('✅ '+t('تم تحديث')+': '+users[idx].name);
}

function deleteUser(idx){
  const users=loadUsers();
  if(!confirm(t('حذف المستخدم:')+' '+users[idx]?.name+'?'))return;
  users.splice(idx,1);saveUsers(users);renderUsersSettings();notify('🗑️ '+t('تم الحذف'));
}

// ── Init on load ──


// ══════════════════════════════════════════════════════════
// LANGUAGE TOGGLE (AR / EN)
// ══════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════
// LANGUAGE SYSTEM — معطل مؤقتاً
// ══════════════════════════════════════════════════════════
function getCurrentLang(){ return 'ar'; }
function _t(text){ return text; }
function toggleLang(){}
function _translateDOM(){}
function _retranslateAll(){}

// زر اللغة — ظاهر دائماً


// ══════════════════════════════════════════════════════════
// UNIFIED AUTH SYSTEM
// ══════════════════════════════════════════════════════════
function getMasterHash(){ const h=localStorage.getItem('pm_master_hash')||''; return (h==='null'||h==='undefined')?'':h; }
function hashStr(s){ let h=0;for(let i=0;i<s.length;i++){h=Math.imul(31,h)+s.charCodeAt(i)|0;}return h.toString(36); }
function isMasterUnlocked(){
  const v=sessionStorage.getItem('pm_master_unlocked');
  if(!v) return false;
  if(v==='1') return true;
  return Date.now()<parseInt(v);
}

// Show the unified login screen
function showLoginScreen(){
  const scr=document.getElementById('loginScreen');
  if(!scr) return;
  scr.style.display='flex';
  // Show list of user name hints (no passwords)
  const users=loadUsers();
  const hasMaster=!!getMasterHash();
  const sub=document.getElementById('loginSubtitle');
  const ul=document.getElementById('loginUsersList');
  if(sub) sub.textContent = hasMaster
    ? 'أدخل بيانات دخولك أو تسجيل كمدير'
    : users.length ? 'أدخل بيانات الدخول للمتابعة' : 'سجّل دخولك للمتابعة';
  if(ul){ ul.innerHTML=''; } // الأسماء مخفية لأسباب الأمان
  setTimeout(()=>document.getElementById('loginUser')?.focus(),100);
}

// Main login function — handles both admin and regular users