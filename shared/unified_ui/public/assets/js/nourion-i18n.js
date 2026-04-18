/* ============================================================
   NouRion — public/assets/js/nourion-i18n.js
   Professional i18n system for NouRion live pages.

   Features:
   - AR ↔ EN bidirectional
   - t(key) returns current language string
   - dir/lang auto-switch (RTL ↔ LTR)
   - MutationObserver for dynamic content
   - Persists choice in localStorage
   - data-i18n attribute for declarative translation
   - Works with live-page.js dynamic rendering
   ============================================================ */

(function () {
  'use strict';

  // ==========================================================
  // Dictionary — Arabic (default) + English
  // ==========================================================
  var dict = {
    // ── Navigation ──
    'nav.dashboard':     { ar: 'لوحة التحكّم',    en: 'Dashboard' },
    'nav.projects':      { ar: 'المشاريع',        en: 'Projects' },
    'nav.customers':     { ar: 'العملاء',          en: 'Customers' },
    'nav.employees':     { ar: 'الموظفون',         en: 'Employees' },
    'nav.form_types':    { ar: 'أنواع النماذج',    en: 'Form Types' },
    'nav.design_system': { ar: 'نظام التصميم',     en: 'Design System' },
    'nav.login':         { ar: 'تسجيل الدخول',     en: 'Login' },
    'nav.main':          { ar: 'الرئيسية',         en: 'Main' },
    'nav.system':        { ar: 'النظام',           en: 'System' },

    // ── Common UI ──
    'ui.new':            { ar: '+ جديد',           en: '+ New' },
    'ui.save':           { ar: 'حفظ',              en: 'Save' },
    'ui.cancel':         { ar: 'إلغاء',            en: 'Cancel' },
    'ui.delete':         { ar: 'حذف',              en: 'Delete' },
    'ui.edit':           { ar: 'تعديل',            en: 'Edit' },
    'ui.close':          { ar: 'إغلاق',            en: 'Close' },
    'ui.search':         { ar: 'بحث',              en: 'Search' },
    'ui.search_hint':    { ar: 'اكتب للبحث…',      en: 'Type to search…' },
    'ui.all':            { ar: 'الكل',             en: 'All' },
    'ui.loading':        { ar: 'جارٍ التحميل…',    en: 'Loading…' },
    'ui.no_records':     { ar: '— لا توجد سجلات —', en: '— No records —' },
    'ui.confirm_delete': { ar: 'هل أنت متأكد من حذف هذا السجل؟', en: 'Are you sure you want to delete this record?' },
    'ui.error':          { ar: 'خطأ',              en: 'Error' },
    'ui.advance':        { ar: 'تقدّم',            en: 'Advance' },
    'ui.actions':        { ar: 'إجراءات',          en: 'Actions' },
    'ui.overview':       { ar: 'نظرة عامة',        en: 'Overview' },
    'ui.records':        { ar: 'السجلات',          en: 'Records' },
    'ui.light_mode':     { ar: 'الوضع الفاتح',     en: 'Light Mode' },
    'ui.dark_mode':      { ar: 'الوضع الداكن',     en: 'Dark Mode' },

    // ── Dashboard ──
    'dash.welcome':      { ar: 'أهلاً بك في',      en: 'Welcome to' },
    'dash.subtitle':     { ar: 'منصّة صناعية ذكية لإدارة مصنع الألمنيوم — من التصميم والمقاسات والعقود حتى التصنيع والتركيب والتسليم. كل البيانات تُحفظ فعلياً على السيرفر.',
                           en: 'Smart industrial platform for aluminum factory management — from design and measurements to manufacturing, installation, and delivery. All data is saved on the server.' },
    'dash.quick_access': { ar: 'وصول سريع',         en: 'Quick Access' },
    'dash.system':       { ar: 'حالة النظام',       en: 'System Status' },
    'dash.server_ok':    { ar: 'السيرفر متصل',      en: 'Server Connected' },
    'dash.server_fail':  { ar: 'السيرفر غير متصل',  en: 'Server Disconnected' },
    'dash.checking':     { ar: 'جارٍ الفحص…',       en: 'Checking…' },
    'dash.phases':       { ar: 'تقدّم المشروع',     en: 'Project Progress' },
    'dash.completed':    { ar: 'مكتمل',             en: 'Completed' },

    // ── Projects ──
    'proj.title':        { ar: 'المشاريع',         en: 'Projects' },
    'proj.list':         { ar: 'قائمة المشاريع',    en: 'Projects List' },
    'proj.new':          { ar: 'مشروع جديد',       en: 'New Project' },
    'proj.edit':         { ar: 'تعديل المشروع',     en: 'Edit Project' },
    'proj.name':         { ar: 'اسم المشروع',      en: 'Project Name' },
    'proj.company':      { ar: 'الشركة',           en: 'Company' },
    'proj.region':       { ar: 'المنطقة',          en: 'Region' },
    'proj.area':         { ar: 'المساحة',          en: 'Area' },
    'proj.value':        { ar: 'القيمة',           en: 'Value' },
    'proj.status':       { ar: 'الحالة',           en: 'Status' },
    'proj.progress':     { ar: 'التقدّم',          en: 'Progress' },
    'proj.total':        { ar: 'إجمالي المشاريع',   en: 'Total Projects' },
    'proj.active':       { ar: 'قيد التنفيذ',       en: 'Active' },
    'proj.finished':     { ar: 'مُسلَّمة / مؤرشفة',  en: 'Delivered / Archived' },
    'proj.total_value':  { ar: 'قيمة العقود',       en: 'Total Value' },
    'proj.all_companies':{ ar: 'كل الشركات',        en: 'All Companies' },
    'proj.all_stages':   { ar: 'كل المراحل',        en: 'All Stages' },

    // Stages
    'stage.draft':         { ar: 'مسودة',   en: 'Draft' },
    'stage.measured':      { ar: 'مقاسات',  en: 'Measured' },
    'stage.quoted':        { ar: 'عرض سعر', en: 'Quoted' },
    'stage.approved':      { ar: 'موافقة',  en: 'Approved' },
    'stage.manufacturing': { ar: 'تصنيع',   en: 'Manufacturing' },
    'stage.installed':     { ar: 'تركيب',   en: 'Installed' },
    'stage.delivered':     { ar: 'تسليم',   en: 'Delivered' },
    'stage.archived':      { ar: 'أرشيف',   en: 'Archived' },

    // ── Customers ──
    'cust.title':        { ar: 'العملاء',          en: 'Customers' },
    'cust.list':         { ar: 'قائمة العملاء',     en: 'Customers List' },
    'cust.new':          { ar: 'عميل جديد',        en: 'New Customer' },
    'cust.edit':         { ar: 'تعديل العميل',      en: 'Edit Customer' },
    'cust.name':         { ar: 'الاسم',            en: 'Name' },
    'cust.phone':        { ar: 'الهاتف',           en: 'Phone' },
    'cust.email':        { ar: 'البريد',           en: 'Email' },
    'cust.city':         { ar: 'المدينة',          en: 'City' },
    'cust.type':         { ar: 'النوع',            en: 'Type' },
    'cust.company':      { ar: 'الشركة',           en: 'Company' },
    'cust.notes':        { ar: 'ملاحظات',          en: 'Notes' },
    'cust.total':        { ar: 'إجمالي العملاء',    en: 'Total Customers' },
    'cust.cities':       { ar: 'عدد المدن',        en: 'Cities' },
    'cust.individuals':  { ar: 'أفراد',            en: 'Individuals' },
    'cust.companies':    { ar: 'شركات',            en: 'Companies' },
    'cust.geo':          { ar: 'توزّع جغرافي',      en: 'Geographic Distribution' },
    'cust.individual':   { ar: 'عملاء أفراد',      en: 'Individual Customers' },
    'cust.corporate':    { ar: 'عملاء شركات',      en: 'Corporate Customers' },
    'cust.type.individual': { ar: 'فرد',           en: 'Individual' },
    'cust.type.corporate':  { ar: 'شركة',          en: 'Corporate' },
    'cust.all_cities':   { ar: 'كل المدن',         en: 'All Cities' },
    'cust.all_types':    { ar: 'كل الأنواع',       en: 'All Types' },

    // ── Employees ──
    'emp.title':         { ar: 'الموظفون',         en: 'Employees' },
    'emp.list':          { ar: 'قائمة الموظفين',    en: 'Employees List' },
    'emp.new':           { ar: 'موظف جديد',        en: 'New Employee' },
    'emp.edit':          { ar: 'تعديل الموظف',      en: 'Edit Employee' },
    'emp.name':          { ar: 'الاسم',            en: 'Name' },
    'emp.role':          { ar: 'الدور',            en: 'Role' },
    'emp.department':    { ar: 'القسم',            en: 'Department' },
    'emp.phone':         { ar: 'الهاتف',           en: 'Phone' },
    'emp.salary':        { ar: 'الراتب',           en: 'Salary' },
    'emp.status':        { ar: 'الحالة',           en: 'Status' },
    'emp.notes':         { ar: 'ملاحظات',          en: 'Notes' },
    'emp.total':         { ar: 'إجمالي الموظفين',   en: 'Total Employees' },
    'emp.active':        { ar: 'نشط',              en: 'Active' },
    'emp.inactive':      { ar: 'غير نشط',          en: 'Inactive' },
    'emp.departments':   { ar: 'أقسام',            en: 'Departments' },
    'emp.all_depts':     { ar: 'كل الأقسام',       en: 'All Departments' },
    'emp.all_roles':     { ar: 'كل الأدوار',       en: 'All Roles' },
    'emp.all_statuses':  { ar: 'كل الحالات',       en: 'All Statuses' },

    // ── Form Types ──
    'ft.title':          { ar: 'أنواع النماذج',     en: 'Form Types' },
    'ft.list':           { ar: 'قائمة أنواع النماذج', en: 'Form Types List' },
    'ft.new':            { ar: 'نوع نموذج جديد',    en: 'New Form Type' },
    'ft.edit':           { ar: 'تعديل نوع النموذج',  en: 'Edit Form Type' },
    'ft.name':           { ar: 'الاسم',            en: 'Name' },
    'ft.code':           { ar: 'الرمز',            en: 'Code' },
    'ft.category':       { ar: 'التصنيف',          en: 'Category' },
    'ft.description':    { ar: 'الوصف',            en: 'Description' },
    'ft.total':          { ar: 'إجمالي النماذج',    en: 'Total Forms' },
    'ft.categories':     { ar: 'التصنيفات',         en: 'Categories' },
    'ft.all_cats':       { ar: 'كل التصنيفات',      en: 'All Categories' },

    // ── Login ──
    'login.title':       { ar: 'تسجيل الدخول',     en: 'Sign In' },
    'login.subtitle':    { ar: 'المنصّة الصناعية الذكية', en: 'Smart Industrial Platform' },
    'login.username':    { ar: 'اسم المستخدم',     en: 'Username' },
    'login.password':    { ar: 'كلمة المرور',      en: 'Password' },
    'login.submit':      { ar: 'دخول',             en: 'Sign In' },
    'login.checking':    { ar: '...جاري التحقق',    en: 'Verifying...' },
    'login.error':       { ar: 'أدخل اسم المستخدم وكلمة المرور', en: 'Enter username and password' },
    'login.bad_creds':   { ar: 'بيانات الدخول غير صحيحة', en: 'Invalid credentials' },
    'login.no_server':   { ar: 'تعذّر الاتصال بالسيرفر', en: 'Cannot connect to server' },

    // ── Misc ──
    'misc.records_count':{ ar: 'عدد السجلات',      en: 'Record Count' },
    'misc.diff_types':   { ar: 'فئات مختلفة',       en: 'Different Types' },
  };

  // ==========================================================
  // State
  // ==========================================================
  var currentLang = 'ar';
  try {
    var saved = localStorage.getItem('nr_lang');
    if (saved === 'en' || saved === 'ar') currentLang = saved;
  } catch (e) {}

  // ==========================================================
  // t(key, fallback) — translate function
  // ==========================================================
  function t(key, fallback) {
    var entry = dict[key];
    if (!entry) return fallback || key;
    return entry[currentLang] || entry.ar || fallback || key;
  }

  // ==========================================================
  // addTranslations(obj) — extend the dictionary at runtime
  // ==========================================================
  function addTranslations(obj) {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach(function (k) { dict[k] = obj[k]; });
  }

  // ==========================================================
  // getLang / setLang
  // ==========================================================
  function getLang() { return currentLang; }
  function isRTL()   { return currentLang === 'ar'; }

  function setLang(lang) {
    if (lang !== 'ar' && lang !== 'en') return;
    currentLang = lang;
    try { localStorage.setItem('nr_lang', lang); } catch (e) {}

    // Update document direction + lang attribute
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    // Translate all data-i18n elements
    translatePage();

    // Notify listeners
    _listeners.forEach(function (fn) {
      try { fn(lang); } catch (e) {}
    });
  }

  function toggleLang() {
    setLang(currentLang === 'ar' ? 'en' : 'ar');
  }

  // ==========================================================
  // Declarative translation: <span data-i18n="key">fallback</span>
  // ==========================================================
  function translatePage() {
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var key = el.getAttribute('data-i18n');
      if (!key) continue;

      // Check for attribute target (e.g., data-i18n-attr="placeholder")
      var attr = el.getAttribute('data-i18n-attr');
      if (attr) {
        el.setAttribute(attr, t(key));
      } else {
        el.textContent = t(key);
      }
    }

    // Update toggle buttons
    var toggleBtns = document.querySelectorAll('[data-i18n-toggle]');
    for (var j = 0; j < toggleBtns.length; j++) {
      toggleBtns[j].textContent = currentLang === 'ar' ? 'EN' : 'ع';
      toggleBtns[j].title       = currentLang === 'ar' ? 'Switch to English' : 'التبديل للعربية';
    }

    // Update theme label
    var themeLabels = document.querySelectorAll('[data-nr-theme-label]');
    for (var k = 0; k < themeLabels.length; k++) {
      themeLabels[k].textContent = t(
        document.documentElement.getAttribute('data-theme') === 'dark'
          ? 'ui.light_mode' : 'ui.dark_mode'
      );
    }
  }

  // ==========================================================
  // MutationObserver — auto-translate dynamically added elements
  // ==========================================================
  var _observer = null;
  function startObserver() {
    if (_observer || typeof MutationObserver === 'undefined') return;
    _observer = new MutationObserver(function (mutations) {
      var needsTranslate = false;
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes.length > 0) {
          needsTranslate = true;
          break;
        }
      }
      if (needsTranslate) translatePage();
    });
    _observer.observe(document.body, { childList: true, subtree: true });
  }

  // ==========================================================
  // onChange listeners
  // ==========================================================
  var _listeners = [];
  function onChange(fn) {
    if (typeof fn === 'function') _listeners.push(fn);
    return function () {
      var idx = _listeners.indexOf(fn);
      if (idx !== -1) _listeners.splice(idx, 1);
    };
  }

  // ==========================================================
  // Init on DOMContentLoaded
  // ==========================================================
  function init() {
    // Apply saved language
    document.documentElement.setAttribute('lang', currentLang);
    document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
    translatePage();
    startObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==========================================================
  // Expose globally
  // ==========================================================
  window.NouRionI18n = {
    t:               t,
    getLang:          getLang,
    setLang:          setLang,
    toggleLang:       toggleLang,
    isRTL:            isRTL,
    translatePage:    translatePage,
    addTranslations:  addTranslations,
    onChange:          onChange,
    dict:             dict
  };

})();
