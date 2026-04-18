/* ============================================================
   NouRion — modules/settings/settings.logic.js
   ------------------------------------------------------------
   Pure logic for the Settings/Permissions module.
   NO DOM, NO localStorage, NO fetch.

   🚫 القاعدة الحمراء:
   كل constants وكل المنطق منقول حرفياً من pm_server/public/js/08-settings.js.

   المصادر:
   - ALL_PERMS               → 08-settings.js:5
   - PERM_GROUPS             → 08-settings.js:68
   - BTN_PERM_MAP            → 08-settings.js:82
   - RPT_BTN_MAP             → 08-settings.js:97
   - RPT_TAB_PERM            → 08-settings.js:103
   - SAVED_SEC_PERM          → 08-settings.js:108
   - _PAGE_SUB_PERMS         → 08-settings.js:298
   - getColumnLabel          → 08-settings.js:114
   - filterActionsByPerms    → 08-settings.js:510
   - hashStr                 → 08-settings.js:748
   ============================================================ */

(function (global) {
  'use strict';

  // ==========================================================
  // 1. ALL_PERMS — قاموس كل الصلاحيات (منقول حرفياً)
  // ==========================================================
  var ALL_PERMS = {
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
    btn_refresh:'🔄 تحديث'
  };

  // ==========================================================
  // 2. PERM_GROUPS — تجميع الصلاحيات (منقول حرفياً)
  // ==========================================================
  var PERM_GROUPS = {
    '📄 الصفحات':          ['page_projects','page_reports','page_saved','page_documents','page_installations','page_drawings','page_hr','page_designs','page_custody','page_settings'],
    '🔧 شريط الأدوات':     ['toolbar_new','toolbar_export','toolbar_save','toolbar_prod','toolbar_weekly','toolbar_materials','toolbar_form','toolbar_purchase','toolbar_savefile','toolbar_restore','toolbar_backup','toolbar_import'],
    '🔘 أزرار المشروع':    ['btn_edit','btn_timeline','btn_stage','btn_quick_stage','btn_extract','btn_form','btn_purchase','btn_workorder','btn_files','btn_meas','btn_price','btn_clientreport','btn_delete'],
    '📊 تبويبات التقارير': ['rpt_tab_overview','rpt_tab_weekly','rpt_tab_monthly','rpt_tab_client','rpt_tab_timeline'],
    '📋 أزرار التقارير':   ['rpt_prod','rpt_weekly_new','rpt_mats','rpt_print','rpt_save','rpt_excel'],
    '💾 السجلات':          ['saved_prod','saved_weekly','saved_mats','saved_view','saved_print','saved_delete'],
    '⚙️ الإعدادات':        ['set_companies','set_security','set_stages','set_gallery','set_regions','set_columns','set_logos','set_sections','set_users','set_backup','set_holidays','set_formdata'],
    '👥 الموظفين':         ['hr_tab_org','hr_tab_list','hr_tab_salary','hr_tab_attend','hr_tab_depts','hr_tab_vehicles','hr_add_emp','hr_edit_emp','hr_delete_emp','hr_print','hr_export'],
    '💰 الحسابات':         ['cust_receive','cust_distribute','cust_invoice','cust_shared_invoice','cust_accounts','cust_transfer','cust_delete'],
    '🎨 التصاميم':         ['ds_import_dxf','ds_view_3d','ds_add_profile'],
    '🔨 التركيبات':        ['inst_add_client','inst_add_defect','inst_maint_new','inst_maint_view','inst_maint_complete','inst_maint_print','inst_maint_edit','inst_maint_delete','inst_confirm','inst_merge','inst_delete','inst_delete_meas','inst_pdf','inst_delivery_new','inst_delivery_view','inst_delivery_print','inst_delivery_upload','inst_delivery_complete','inst_delivery_delete','inst_defect_confirm','inst_defect_delete','inst_defect_pdf','inst_measorder_new','inst_measorder_view','inst_measorder_complete','inst_measorder_delete','inst_team_tab','inst_team_add','inst_team_edit','inst_team_delete','inst_team_add_project','inst_team_remove_project','inst_team_workers','inst_team_save_history','inst_team_print','inst_history_tab','inst_history_delete','inst_history_print','btn_spacecraft','btn_refresh']
  };

  // ==========================================================
  // 3. خرائط ربط الصلاحيات بالأزرار (منقولة حرفياً)
  // ==========================================================
  var BTN_PERM_MAP = {
    btn_edit:         'editProject',
    btn_timeline:     'openTimeline',
    btn_stage:        'changeStage',
    btn_extract:      'quickDoc.*مستخلص',
    btn_form:         'openManufacturingForm',
    btn_purchase:     'openPurchaseOrderDirect',
    btn_workorder:    'quickDoc.*امر تشغيل',
    btn_files:        'openProjectFiles',
    btn_meas:         'openMeasurements',
    btn_price:        'openPriceList',
    btn_clientreport: 'openClientReport',
    btn_delete:       'deleteProject',
    inst_delivery_new:'openDeliveryOrder'
  };

  var RPT_BTN_MAP = {
    rpt_prod:   'openProductionReport',
    rpt_weekly: 'openWeeklyReport',
    rpt_mats:   'openMaterialsReport'
  };

  var RPT_TAB_PERM = {
    overview:'rpt_tab_overview', weekly:'rpt_tab_weekly',
    monthly:'rpt_tab_monthly',   client:'rpt_tab_client', timeline:'rpt_tab_timeline'
  };

  var SAVED_SEC_PERM = { production:'saved_prod', weekly:'saved_weekly', materials:'saved_mats' };

  // ==========================================================
  // 4. _PAGE_SUB_PERMS — الصلاحيات الفرعية لكل صفحة
  //    منقول حرفياً من 08-settings.js:298
  // ==========================================================
  var _PAGE_SUB_PERMS = {
    page_hr:            ['hr_tab_org','hr_tab_list','hr_tab_salary','hr_tab_attend','hr_tab_depts','hr_tab_vehicles','hr_add_emp','hr_edit_emp','hr_delete_emp','hr_print','hr_export'],
    page_designs:       ['ds_import_dxf','ds_view_3d','ds_add_profile'],
    page_custody:       ['cust_receive','cust_distribute','cust_invoice','cust_shared_invoice','cust_accounts','cust_transfer','cust_delete'],
    page_installations: ['inst_add_client','inst_add_defect','inst_maint_new','inst_maint_view','inst_confirm','inst_merge','inst_delete','inst_delete_meas','inst_pdf','inst_delivery_new','inst_delivery_view','inst_delivery_print','inst_delivery_upload','inst_maint_complete','inst_maint_print','inst_maint_edit','inst_maint_delete','inst_delivery_complete','inst_delivery_delete','inst_defect_confirm','inst_defect_delete','inst_defect_pdf','inst_measorder_new','inst_measorder_view','inst_measorder_complete','inst_measorder_delete','inst_team_tab','inst_team_add','inst_team_edit','inst_team_delete','inst_team_add_project','inst_team_remove_project','inst_team_workers','inst_team_save_history','inst_team_print','inst_history_tab','inst_history_delete','inst_history_print']
  };

  // ==========================================================
  // 5. getColumnLabel — منقول حرفياً من 08-settings.js:114
  // ==========================================================
  function getColumnLabel(col) {
    if (!col) return '';
    if (col.label) return col.label;
    var map = {
      contractNo:'رقم العقد', name:'اسم العميل', company:'الشركة', region:'المنطقة',
      gallery:'المعرض', contractValue:'قيمة العقد', downPayment:'الدفعة الأولى',
      extractValue:'قيمة المستخلص', contractDate:'تاريخ العقد', deliveryDate:'تاريخ التسليم',
      stage:'المرحلة', progress:'نسبة الإنجاز', phone:'الهاتف', notes:'الملاحظات',
      contractDuration:'مدة العقد', status:'الحالة'
    };
    return map[col.id] || col.id || '';
  }

  // ==========================================================
  // 6. hashStr — fingerprint hash (منقول حرفياً من 08-settings.js:748)
  // ==========================================================
  function hashStr(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) {
      h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    }
    return h.toString(36);
  }

  // ==========================================================
  // 7. hasPermission — utility (مستخرج من النمط `perms.has(k)` المتكرّر)
  // ==========================================================
  function hasPermission(user, permKey) {
    if (!user) return false;
    if (user.isAdmin) return true;
    if (!user.perms) return false;
    return user.perms.indexOf(permKey) !== -1;
  }

  // ==========================================================
  // 8. canAccessPage — utility
  // ==========================================================
  function canAccessPage(user, pageName) {
    if (!user) return false;
    if (user.isAdmin) return true;
    return hasPermission(user, 'page_' + pageName);
  }

  // ==========================================================
  // 9. expandImpliedPerms — التفعيل التلقائي للصفحات
  //    منقول من منطق applyUserPermissions (08-settings.js:311-318)
  //    pure: يأخذ user → يُرجع user جديد بـ perms مُوسَّعة
  // ==========================================================
  function expandImpliedPerms(user) {
    if (!user || user.isAdmin) return user;
    var perms = (user.perms || []).slice();
    var ps = {};
    for (var i = 0; i < perms.length; i++) ps[perms[i]] = true;

    Object.keys(_PAGE_SUB_PERMS).forEach(function (pagePerm) {
      var subs = _PAGE_SUB_PERMS[pagePerm];
      if (ps[pagePerm]) return;
      for (var j = 0; j < subs.length; j++) {
        if (ps[subs[j]]) {
          perms.push(pagePerm);
          ps[pagePerm] = true;
          return;
        }
      }
    });

    // cust_emp_* implies page_custody + cust_accounts + cust_invoice
    if (!ps.page_custody) {
      var hasCustEmp = false;
      for (var k in ps) {
        if (k.indexOf('cust_emp_') === 0) { hasCustEmp = true; break; }
      }
      if (hasCustEmp) {
        ['page_custody', 'cust_accounts', 'cust_invoice'].forEach(function (p) {
          if (!ps[p]) { perms.push(p); ps[p] = true; }
        });
      }
    }

    var out = {};
    for (var key in user) out[key] = user[key];
    out.perms = perms;
    return out;
  }

  // ==========================================================
  // 10. filterActionsByPerms — pure (مع DI لـ user)
  //     منقولة من 08-settings.js:510 مع حقن user بدل getCurrentUser()
  // ==========================================================
  function filterActionsByPerms(actions, user) {
    if (!user || user.isAdmin) return actions;
    var perms = {};
    (user.perms || []).forEach(function (p) { perms[p] = true; });

    return actions.filter(function (a) {
      var keys = Object.keys(BTN_PERM_MAP);
      for (var i = 0; i < keys.length; i++) {
        var perm = keys[i];
        var fnPat = BTN_PERM_MAP[perm];
        var re = new RegExp(fnPat);
        if (re.test(a.fn)) return !!perms[perm];
      }
      return false; // unknown action — hide by default for safety (نفس الأصل)
    });
  }

  // ==========================================================
  // 11. validateUser — تحقّق من سلامة بيانات المستخدم (utility جديد للاختبار)
  // ==========================================================
  function validateUser(user) {
    var errors = [];
    if (!user) { errors.push('user is null'); return { valid: false, errors: errors }; }
    if (!user.name || !user.name.trim()) errors.push('name is required');
    if (!user.isAdmin) {
      if (!user.pass || !user.pass.length) errors.push('password is required for non-admin');
      if (user.pass && user.pass.length < 4) errors.push('password too short (min 4)');
    }
    if (user.perms && !Array.isArray(user.perms)) errors.push('perms must be array');
    return { valid: errors.length === 0, errors: errors };
  }

  // ==========================================================
  // 12. countUserPerms — utility
  // ==========================================================
  function countUserPerms(user) {
    if (!user) return { count: 0, total: Object.keys(ALL_PERMS).length };
    if (user.isAdmin) {
      var total = Object.keys(ALL_PERMS).length;
      return { count: total, total: total };
    }
    return {
      count: (user.perms || []).length,
      total: Object.keys(ALL_PERMS).length
    };
  }

  // ==========================================================
  // 13. groupUserPerms — تجميع صلاحيات المستخدم حسب PERM_GROUPS
  // ==========================================================
  function groupUserPerms(user) {
    if (!user) return [];
    if (user.isAdmin) {
      return Object.keys(PERM_GROUPS).map(function (g) {
        return { group: g, total: PERM_GROUPS[g].length, active: PERM_GROUPS[g].length, isAll: true, keys: PERM_GROUPS[g] };
      });
    }
    var ps = {};
    (user.perms || []).forEach(function (p) { ps[p] = true; });
    return Object.keys(PERM_GROUPS).map(function (g) {
      var keys = PERM_GROUPS[g];
      var active = keys.filter(function (k) { return ps[k]; });
      return {
        group: g,
        total: keys.length,
        active: active.length,
        isAll: active.length === keys.length,
        activeKeys: active
      };
    });
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================
  var api = {
    // constants
    ALL_PERMS:         ALL_PERMS,
    PERM_GROUPS:       PERM_GROUPS,
    BTN_PERM_MAP:      BTN_PERM_MAP,
    RPT_BTN_MAP:       RPT_BTN_MAP,
    RPT_TAB_PERM:      RPT_TAB_PERM,
    SAVED_SEC_PERM:    SAVED_SEC_PERM,
    PAGE_SUB_PERMS:    _PAGE_SUB_PERMS,
    // helpers
    getColumnLabel:    getColumnLabel,
    hashStr:           hashStr,
    hasPermission:     hasPermission,
    canAccessPage:     canAccessPage,
    expandImpliedPerms:expandImpliedPerms,
    filterActionsByPerms: filterActionsByPerms,
    validateUser:      validateUser,
    countUserPerms:    countUserPerms,
    groupUserPerms:    groupUserPerms
  };

  global.NouRion = global.NouRion || {};
  global.NouRion.SettingsLogic = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
