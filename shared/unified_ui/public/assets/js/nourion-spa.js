/* ============================================================
   NouRion — public/assets/js/nourion-spa.js
   Single Page Application engine.
   - Login flow → main app
   - Sidebar navigation (no page reloads)
   - CRUD modules rendered inside SPA sections
   - Shared modal for create/edit
   - i18n integrated
   ============================================================ */

(function () {
  'use strict';

  var Repo    = window.NouRionRepo;
  var ProjSvc = window.NouRionProjectService;
  var Crud    = window.NouRionCrudService;
  var I18n    = window.NouRionI18n;

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function t(key, fb) { return I18n ? I18n.t(key, fb) : (fb || key); }

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function fmtMoney(n) {
    if (!isFinite(n) || n == null) return '—';
    return Math.round(n).toLocaleString('ar-SA');
  }

  // ==========================================================
  // State
  // ==========================================================
  var state = {
    user: null,
    csrf: null,
    currentSection: 'dashboard',
    modules: {},      // { key: { svc, columns, formFields, filters, ... } }
    search: {},       // { key: searchString }
    filterVals: {}    // { key: { field: val } }
  };

  // ==========================================================
  // 1. LOGIN
  // ==========================================================
  function initLogin() {
    var err  = $('#loginErr');
    var btn  = $('#loginBtn');

    async function doLogin() {
      err.classList.remove('is-visible');
      var u = $('#loginUser').value.trim();
      var p = $('#loginPass').value;
      if (!u || !p) { showLoginErr(t('login.error', 'أدخل اسم المستخدم وكلمة المرور')); return; }
      btn.disabled = true;
      btn.textContent = t('login.checking', '...جاري التحقق');
      try {
        var r = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ username: u, password: p })
        });
        var data = await r.json().catch(function () { return null; });
        if (!r.ok || !data || !data.ok) {
          showLoginErr(t('login.bad_creds', 'بيانات الدخول غير صحيحة'));
          btn.disabled = false;
          btn.textContent = t('login.submit', 'دخول');
          return;
        }
        state.user = data.user;
        state.csrf = data.csrf;
        sessionStorage.setItem('nr_csrf', data.csrf);
        enterApp();
      } catch (ex) {
        showLoginErr(t('login.no_server', 'تعذّر الاتصال بالسيرفر'));
        btn.disabled = false;
        btn.textContent = t('login.submit', 'دخول');
      }
    }

    // Button click
    btn.addEventListener('click', doLogin);

    // Enter key in password field
    $('#loginPass').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); doLogin(); }
    });
    // Enter key in username field → move to password
    $('#loginUser').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); $('#loginPass').focus(); }
    });
  }

  function showLoginErr(msg) {
    var el = $('#loginErr');
    el.textContent = msg;
    el.classList.add('is-visible');
  }

  // ==========================================================
  // 2. CHECK SESSION (auto-login if cookie valid)
  // ==========================================================
  async function checkSession() {
    try {
      var r = await fetch('/api/auth/me', { credentials: 'same-origin' });
      var data = await r.json();
      if (data && data.authenticated && data.user) {
        state.user = data.user;
        state.csrf = data.csrf;
        return true;
      }
    } catch (e) {}
    return false;
  }

  // ==========================================================
  // 3. ENTER APP
  // ==========================================================
  function enterApp() {
    $('#loginScreen').classList.add('nr-app-hidden');
    $('#appScreen').style.display = '';
    $('#userBadge').textContent = state.user ? state.user.displayName || state.user.username : '';
    initModules();
    navigateTo('dashboard');
  }

  function logout() {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(function(){});
    state.user = null;
    state.csrf = null;
    $('#appScreen').style.display = 'none';
    $('#loginScreen').classList.remove('nr-app-hidden');
    $('#loginUser').value = '';
    $('#loginPass').value = '';
    $('#loginBtn').disabled = false;
    $('#loginBtn').textContent = t('login.submit', 'دخول');
  }

  // ==========================================================
  // 4. NAVIGATION (sidebar → sections)
  // ==========================================================
  function navigateTo(section) {
    state.currentSection = section;
    // Hide all sections
    $$('.nr-spa-section').forEach(function (el) { el.classList.remove('is-active'); });
    var target = $('#sec-' + section);
    if (target) target.classList.add('is-active');
    // Update sidebar active
    $$('#sidebarNav .nr-nav-item').forEach(function (el) { el.classList.remove('is-active'); });
    var navItem = document.querySelector('[data-section="' + section + '"]');
    if (navItem) navItem.classList.add('is-active');
    // Update topbar title
    var titles = {
      dashboard: 'nav.dashboard', projects: 'nav.projects',
      customers: 'nav.customers', employees: 'nav.employees',
      formtypes: 'nav.form_types', settings: 'nav.settings'
    };
    var titleKey = titles[section] || 'nav.dashboard';
    $('#topbarTitle').textContent = t(titleKey);
    $('#topbarTitle').setAttribute('data-i18n', titleKey);
    // Render section content
    if (section === 'dashboard') renderDashboard();
    else if (state.modules[section]) renderModule(section);
  }

  function initNavigation() {
    $$('#sidebarNav [data-section]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        navigateTo(el.getAttribute('data-section'));
      });
    });
    $('#logoutBtn').addEventListener('click', function (e) {
      e.preventDefault();
      logout();
    });
    // Hash navigation
    window.addEventListener('hashchange', function () {
      var hash = location.hash.replace('#', '');
      if (hash && document.getElementById('sec-' + hash)) navigateTo(hash);
    });
  }

  // ==========================================================
  // 5. DASHBOARD
  // ==========================================================
  async function renderDashboard() {
    var stats = [];
    var keys = ['projects', 'customers', 'employees', 'formtypes'];
    var labels = {
      projects:  { key: 'proj.total',  fb: 'المشاريع' },
      customers: { key: 'cust.total',  fb: 'العملاء' },
      employees: { key: 'emp.total',   fb: 'الموظفون' },
      formtypes: { key: 'ft.total',    fb: 'أنواع النماذج' }
    };
    keys.forEach(function (k) {
      var mod = state.modules[k];
      var count = mod && mod.svc ? mod.svc.list().length : 0;
      var l = labels[k];
      stats.push({ label: t(l.key, l.fb), value: count });
    });
    var host = $('#dashStats');
    host.innerHTML = stats.map(function (s) {
      return '<div class="nr-stat"><div class="nr-stat__label">' + escHtml(s.label) + '</div><div class="nr-stat__value">' + s.value + '</div></div>';
    }).join('');
  }

  // ==========================================================
  // 6. MODULE SYSTEM — generic CRUD rendering inside SPA
  // ==========================================================
  function defineModule(name, config) {
    state.modules[name] = config;
    state.search[name] = '';
    state.filterVals[name] = {};
  }

  async function initModules() {
    var transport = new Repo.HttpTransport({ credentials: 'same-origin' });

    // Projects
    var projRepo = new Repo.Repository({ key: 'pm_nourion_projects', transport: transport, store: localStorage });
    var projSvc  = new ProjSvc.ProjectService(projRepo);
    await projSvc.load();
    defineModule('projects', {
      svc: projSvc, entityLabel: t('proj.title', 'مشروع'),
      columns: [
        { field: 'name', label: function(){ return t('proj.name','اسم المشروع'); } },
        { field: 'company', label: function(){ return t('proj.company','الشركة'); } },
        { field: 'area', label: function(){ return t('proj.area','المساحة'); }, mono: true },
        { field: 'value', label: function(){ return t('proj.value','القيمة'); }, mono: true, render: function(r){ return fmtMoney(r.value); } },
        { field: 'stage', label: function(){ return t('proj.status','الحالة'); }, render: function(r){ return t('stage.'+(r.stage||'draft'), r.stage||'draft'); } },
        { field: 'progress', label: function(){ return t('proj.progress','التقدّم'); }, render: function(r){ return '<div class="nr-progress" style="width:80px;"><div class="nr-progress__fill" style="width:'+(r.progress||0)+'%;"></div></div>'; }, raw: true }
      ],
      formFields: [
        { field: 'name', label: function(){ return t('proj.name','اسم المشروع'); }, type: 'text', required: true, full: true },
        { field: 'company', label: function(){ return t('proj.company','الشركة'); }, type: 'text' },
        { field: 'region', label: function(){ return t('proj.region','المنطقة'); }, type: 'text' },
        { field: 'area', label: function(){ return t('proj.area','المساحة'); }, type: 'number' },
        { field: 'value', label: function(){ return t('proj.value','القيمة'); }, type: 'number' }
      ],
      filters: [
        { field: 'company', label: function(){ return t('proj.company','الشركة'); } },
        { field: 'stage', label: function(){ return t('proj.status','الحالة'); } }
      ],
      actions: ['advance','edit','delete'],
      seed: [
        { name: 'فيلا الخالدية A12', company: 'شركة النور', region: 'الرياض', area: 482, value: 285000, stage: 'manufacturing' },
        { name: 'برج الأعمال T04', company: 'مجموعة الرونق', region: 'جدة', area: 1240, value: 940000, stage: 'quoted' },
        { name: 'معرض السيارات M08', company: 'المركز الصناعي', region: 'الرياض', area: 720, value: 510000, stage: 'delivered' },
        { name: 'فيلا الرياض R02', company: 'مقاولات الخليج', region: 'الرياض', area: 340, value: 198500, stage: 'draft' }
      ]
    });
    if (projSvc.list().length === 0 && state.modules.projects.seed) {
      for (var i = 0; i < state.modules.projects.seed.length; i++) {
        try { await projSvc.create(state.modules.projects.seed[i]); } catch(e){}
      }
    }
    projSvc.on('changed', function(){ if(state.currentSection==='projects') renderModule('projects'); renderDashboard(); });

    // Customers
    var custRepo = new Repo.Repository({ key: 'pm_nourion_customers', transport: transport, store: localStorage });
    var custSvc = new Crud.CustomerService(custRepo);
    await custSvc.load();
    defineModule('customers', {
      svc: custSvc, entityLabel: t('cust.title', 'عميل'),
      columns: [
        { field: 'name', label: function(){ return t('cust.name','الاسم'); } },
        { field: 'phone', label: function(){ return t('cust.phone','الهاتف'); }, mono: true },
        { field: 'city', label: function(){ return t('cust.city','المدينة'); } },
        { field: 'type', label: function(){ return t('cust.type','النوع'); } },
        { field: 'company', label: function(){ return t('cust.company','الشركة'); } }
      ],
      formFields: [
        { field: 'name', label: function(){ return t('cust.name','الاسم'); }, type: 'text', required: true, full: true },
        { field: 'phone', label: function(){ return t('cust.phone','الهاتف'); }, type: 'text' },
        { field: 'email', label: function(){ return t('cust.email','البريد'); }, type: 'email' },
        { field: 'city', label: function(){ return t('cust.city','المدينة'); }, type: 'text' },
        { field: 'type', label: function(){ return t('cust.type','النوع'); }, type: 'select', options: [
          { value: 'فرد', label: function(){ return t('cust.type.individual','فرد'); } },
          { value: 'شركة', label: function(){ return t('cust.type.corporate','شركة'); } }
        ]},
        { field: 'company', label: function(){ return t('cust.company','الشركة'); }, type: 'text' },
        { field: 'notes', label: function(){ return t('cust.notes','ملاحظات'); }, type: 'textarea', full: true }
      ],
      filters: [
        { field: 'city', label: function(){ return t('cust.city','المدينة'); } },
        { field: 'type', label: function(){ return t('cust.type','النوع'); } }
      ],
      seed: [
        { name: 'شركة النور للمقاولات', phone: '0112345678', city: 'الرياض', type: 'شركة', company: 'النور' },
        { name: 'أحمد الخالدي', phone: '0501234567', city: 'الرياض', type: 'فرد' },
        { name: 'مجموعة الرونق', phone: '0126543210', city: 'جدة', type: 'شركة', company: 'الرونق' },
        { name: 'خالد الغامدي', phone: '0539876543', city: 'جدة', type: 'فرد' }
      ]
    });
    if (custSvc.list().length === 0 && state.modules.customers.seed) {
      for (var j = 0; j < state.modules.customers.seed.length; j++) {
        try { await custSvc.create(state.modules.customers.seed[j]); } catch(e){}
      }
    }
    custSvc.on('changed', function(){ if(state.currentSection==='customers') renderModule('customers'); renderDashboard(); });

    // Employees
    var empRepo = new Repo.Repository({ key: 'pm_nourion_employees', transport: transport, store: localStorage });
    var empSvc = new Crud.EmployeeService(empRepo);
    await empSvc.load();
    defineModule('employees', {
      svc: empSvc, entityLabel: t('emp.title', 'موظف'),
      columns: [
        { field: 'name', label: function(){ return t('emp.name','الاسم'); } },
        { field: 'role', label: function(){ return t('emp.role','الدور'); } },
        { field: 'department', label: function(){ return t('emp.department','القسم'); } },
        { field: 'phone', label: function(){ return t('emp.phone','الهاتف'); }, mono: true },
        { field: 'status', label: function(){ return t('emp.status','الحالة'); }, render: function(r){ return r.status==='inactive'?t('emp.inactive','غير نشط'):t('emp.active','نشط'); } }
      ],
      formFields: [
        { field: 'name', label: function(){ return t('emp.name','الاسم'); }, type: 'text', required: true, full: true },
        { field: 'role', label: function(){ return t('emp.role','الدور'); }, type: 'text' },
        { field: 'department', label: function(){ return t('emp.department','القسم'); }, type: 'text' },
        { field: 'phone', label: function(){ return t('emp.phone','الهاتف'); }, type: 'text' },
        { field: 'salary', label: function(){ return t('emp.salary','الراتب'); }, type: 'number' },
        { field: 'status', label: function(){ return t('emp.status','الحالة'); }, type: 'select', options: [
          { value: 'active', label: function(){ return t('emp.active','نشط'); } },
          { value: 'inactive', label: function(){ return t('emp.inactive','غير نشط'); } }
        ]},
        { field: 'notes', label: function(){ return t('emp.notes','ملاحظات'); }, type: 'textarea', full: true }
      ],
      filters: [
        { field: 'department', label: function(){ return t('emp.department','القسم'); } },
        { field: 'role', label: function(){ return t('emp.role','الدور'); } }
      ],
      seed: [
        { name: 'شهاب الدخيل', role: 'مهندس', department: 'تصنيع', phone: '0501111111', status: 'active', salary: 12000 },
        { name: 'أحمد حمدي', role: 'فنّي', department: 'تركيب', phone: '0502222222', status: 'active', salary: 8500 },
        { name: 'محمد سعيد', role: 'محاسب', department: 'إدارة', phone: '0503333333', status: 'active', salary: 9500 },
        { name: 'خالد عامر', role: 'مهندس', department: 'تصنيع', phone: '0504444444', status: 'inactive', salary: 10000 }
      ]
    });
    if (empSvc.list().length === 0 && state.modules.employees.seed) {
      for (var k = 0; k < state.modules.employees.seed.length; k++) {
        try { await empSvc.create(state.modules.employees.seed[k]); } catch(e){}
      }
    }
    empSvc.on('changed', function(){ if(state.currentSection==='employees') renderModule('employees'); renderDashboard(); });

    // Form Types
    var ftRepo = new Repo.Repository({ key: 'pm_nourion_form_types', transport: transport, store: localStorage });
    var ftSvc = new Crud.FormTypeService(ftRepo);
    await ftSvc.load();
    defineModule('formtypes', {
      svc: ftSvc, entityLabel: t('ft.title', 'نوع نموذج'),
      columns: [
        { field: 'code', label: function(){ return t('ft.code','الرمز'); }, mono: true },
        { field: 'name', label: function(){ return t('ft.name','الاسم'); } },
        { field: 'category', label: function(){ return t('ft.category','التصنيف'); } },
        { field: 'description', label: function(){ return t('ft.description','الوصف'); } }
      ],
      formFields: [
        { field: 'name', label: function(){ return t('ft.name','الاسم'); }, type: 'text', required: true, full: true },
        { field: 'code', label: function(){ return t('ft.code','الرمز'); }, type: 'text' },
        { field: 'category', label: function(){ return t('ft.category','التصنيف'); }, type: 'text' },
        { field: 'description', label: function(){ return t('ft.description','الوصف'); }, type: 'textarea', full: true }
      ],
      filters: [
        { field: 'category', label: function(){ return t('ft.category','التصنيف'); } }
      ],
      seed: [
        { name: 'نموذج رفع مقاسات', code: 'MEAS', category: 'قياس', description: 'يُستخدم عند الزيارة الأولى' },
        { name: 'نموذج تسليم', code: 'DLVY', category: 'تركيب', description: 'يُوقّع عليه العميل عند التسليم' },
        { name: 'نموذج صيانة', code: 'MAINT', category: 'صيانة', description: 'زيارات الصيانة الدورية' },
        { name: 'نموذج معاينة', code: 'INSP', category: 'قياس', description: 'معاينة أوّلية قبل عرض السعر' }
      ]
    });
    if (ftSvc.list().length === 0 && state.modules.formtypes.seed) {
      for (var m = 0; m < state.modules.formtypes.seed.length; m++) {
        try { await ftSvc.create(state.modules.formtypes.seed[m]); } catch(e){}
      }
    }
    ftSvc.on('changed', function(){ if(state.currentSection==='formtypes') renderModule('formtypes'); renderDashboard(); });
  }

  // ==========================================================
  // 7. RENDER MODULE
  // ==========================================================
  function getFilteredList(name) {
    var mod = state.modules[name];
    if (!mod || !mod.svc) return [];
    var list = mod.svc.list();
    // Apply filters
    var fv = state.filterVals[name] || {};
    Object.keys(fv).forEach(function(f) {
      if (fv[f]) list = list.filter(function(x) { return x[f] === fv[f]; });
    });
    // Apply search
    var q = (state.search[name] || '').toLowerCase();
    if (q) {
      list = list.filter(function(x) {
        return mod.columns.some(function(c) {
          var v = x[c.field];
          return v != null && String(v).toLowerCase().indexOf(q) !== -1;
        });
      });
    }
    return list;
  }

  function renderModule(name) {
    var mod = state.modules[name];
    if (!mod || !mod.svc) return;
    var host = $('#' + name + '-host');
    if (!host) return;
    var list = getFilteredList(name);
    var allItems = mod.svc.list();

    // Build HTML
    var html = '';

    // ── New button ──
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--nr-sp-4);">';
    html += '<h6 class="nr-section-title" style="margin:0;">' + escHtml(mod.entityLabel) + '</h6>';
    html += '<button class="nr-btn nr-btn--primary nr-btn--sm" data-mod-action="create">' + t('ui.new', '+ جديد') + '</button>';
    html += '</div>';

    // ── Data translate bar (permission-gated) ──
    if (window.NouRionDataTranslate) {
      html += window.NouRionDataTranslate.injectTranslateButton(state);
    }

    // ── Filters ──
    html += '<div class="nr-card" style="margin-bottom:var(--nr-sp-4);"><div class="nr-card__body"><div class="nr-grid-4" style="align-items:end;">';
    html += '<div class="nr-field"><label class="nr-label">' + t('ui.search','بحث') + '</label>';
    html += '<input class="nr-input" data-mod-search="' + name + '" type="text" placeholder="' + t('ui.search_hint','اكتب للبحث…') + '" value="' + escHtml(state.search[name] || '') + '"></div>';
    (mod.filters || []).forEach(function(f) {
      var lbl = typeof f.label === 'function' ? f.label() : f.label;
      var seen = {}; var vals = [];
      allItems.forEach(function(x) { var v = x[f.field]; if (v != null && v !== '' && !seen[v]) { seen[v]=1; vals.push(v); } });
      var curVal = (state.filterVals[name] || {})[f.field] || '';
      html += '<div class="nr-field"><label class="nr-label">' + escHtml(lbl) + '</label>';
      html += '<select class="nr-select" data-mod-filter="' + f.field + '" data-mod-name="' + name + '">';
      html += '<option value="">' + t('ui.all','الكل') + '</option>';
      vals.forEach(function(v) { html += '<option value="' + escHtml(v) + '"' + (curVal === v ? ' selected' : '') + '>' + escHtml(v) + '</option>'; });
      html += '</select></div>';
    });
    html += '</div></div></div>';

    // ── Table ──
    html += '<div class="nr-table-wrap"><table class="nr-table"><thead><tr>';
    mod.columns.forEach(function(c) {
      var lbl = typeof c.label === 'function' ? c.label() : c.label;
      html += '<th>' + escHtml(lbl) + '</th>';
    });
    html += '<th>' + t('ui.actions','إجراءات') + '</th>';
    html += '</tr></thead><tbody>';

    if (!list.length) {
      html += '<tr><td colspan="' + (mod.columns.length + 1) + '" style="text-align:center; padding:var(--nr-sp-8); color:var(--nr-text-muted);">' + t('ui.no_records','— لا توجد سجلات —') + '</td></tr>';
    } else {
      list.forEach(function(item) {
        html += '<tr data-id="' + escHtml(item.id) + '">';
        mod.columns.forEach(function(c) {
          var val = c.render ? c.render(item) : (item[c.field] == null ? '—' : String(item[c.field]));
          var style = c.mono ? ' style="font-family:var(--nr-font-mono);"' : '';
          html += '<td' + style + '>' + (c.raw ? val : escHtml(val)) + '</td>';
        });
        html += '<td><div class="nr-row" style="gap:var(--nr-sp-1);">';
        if (mod.actions && mod.actions.indexOf('advance') !== -1) {
          html += '<button class="nr-btn nr-btn--ghost nr-btn--sm" data-mod-action="advance" data-id="' + escHtml(item.id) + '">' + t('ui.advance','تقدّم') + '</button>';
        }
        html += '<button class="nr-btn nr-btn--ghost nr-btn--sm" data-mod-action="edit" data-id="' + escHtml(item.id) + '">' + t('ui.edit','تعديل') + '</button>';
        html += '<button class="nr-btn nr-btn--ghost nr-btn--sm" data-mod-action="delete" data-id="' + escHtml(item.id) + '">' + t('ui.delete','حذف') + '</button>';
        html += '</div></td></tr>';
      });
    }
    html += '</tbody></table></div>';

    host.innerHTML = html;

    // ── Wire events ──
    host.querySelectorAll('[data-mod-search]').forEach(function(el) {
      el.addEventListener('input', function() {
        state.search[name] = el.value;
        renderModule(name);
      });
    });
    host.querySelectorAll('[data-mod-filter]').forEach(function(el) {
      el.addEventListener('change', function() {
        if (!state.filterVals[name]) state.filterVals[name] = {};
        state.filterVals[name][el.getAttribute('data-mod-filter')] = el.value;
        renderModule(name);
      });
    });
    host.querySelectorAll('[data-mod-action]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var action = btn.getAttribute('data-mod-action');
        var id = btn.getAttribute('data-id');
        handleModAction(name, action, id);
      });
    });
    // Wire data translate buttons
    if (window.NouRionDataTranslate) {
      window.NouRionDataTranslate.wireTranslateButtons(host, name, mod.svc);
    }
  }

  // ==========================================================
  // 8. MODULE ACTIONS + MODAL
  // ==========================================================
  var _modalModule = null;
  var _modalEditId = null;

  function handleModAction(name, action, id) {
    var mod = state.modules[name];
    if (!mod) return;
    if (action === 'create') {
      openModal(name, null);
    } else if (action === 'edit') {
      openModal(name, mod.svc.get(id));
    } else if (action === 'delete') {
      if (confirm(t('ui.confirm_delete', 'هل أنت متأكد من حذف هذا السجل؟'))) {
        mod.svc.remove(id).catch(function(e) { alert(e.message); });
      }
    } else if (action === 'advance' && mod.svc.advanceStage) {
      mod.svc.advanceStage(id).catch(function(e) { alert(e.message); });
    }
  }

  function openModal(name, existing) {
    var mod = state.modules[name];
    _modalModule = name;
    _modalEditId = existing ? existing.id : null;

    $('#spaModalTitle').textContent = existing
      ? (t('ui.edit','تعديل') + ' ' + mod.entityLabel)
      : (mod.entityLabel + ' ' + t('ui.new','جديد').replace('+','').trim());

    var body = $('#spaModalBody');
    var html = '';
    (mod.formFields || []).forEach(function(f) {
      var lbl = typeof f.label === 'function' ? f.label() : f.label;
      var val = existing ? (existing[f.field] == null ? '' : existing[f.field]) : '';
      var full = f.full ? ' style="grid-column:1/-1;"' : '';
      var req = f.required ? ' <span class="nr-label__required">*</span>' : '';
      var ctrl = '';
      if (f.type === 'textarea') {
        ctrl = '<textarea class="nr-textarea" name="' + f.field + '">' + escHtml(String(val)) + '</textarea>';
      } else if (f.type === 'select') {
        ctrl = '<select class="nr-select" name="' + f.field + '"><option value="">—</option>';
        (f.options || []).forEach(function(o) {
          var ov = o.value != null ? o.value : o;
          var ol = typeof o.label === 'function' ? o.label() : (o.label || o);
          var sel = String(val) === String(ov) ? ' selected' : '';
          ctrl += '<option value="' + escHtml(ov) + '"' + sel + '>' + escHtml(ol) + '</option>';
        });
        ctrl += '</select>';
      } else {
        ctrl = '<input class="nr-input" name="' + f.field + '" type="' + (f.type||'text') + '"' +
          (f.type==='number'?' step="any"':'') +
          ' value="' + escHtml(String(val)) + '">';
      }
      html += '<div class="nr-field"' + full + '><label class="nr-label">' + escHtml(lbl) + req + '</label>' + ctrl + '</div>';
    });
    body.innerHTML = html;
    $('#spaModalErr').style.display = 'none';
    var modal = $('#spaModal');
    modal.style.display = 'flex';
    setTimeout(function() { var first = body.querySelector('input,textarea,select'); if(first) first.focus(); }, 50);
  }

  function closeModal() {
    $('#spaModal').style.display = 'none';
    _modalModule = null;
    _modalEditId = null;
  }

  function initModal() {
    $('#spaModalClose').addEventListener('click', closeModal);
    $('#spaModalCancel').addEventListener('click', closeModal);
    $('#spaModal').addEventListener('click', function(e) { if (e.target === e.currentTarget) closeModal(); });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });

    $('#spaModalForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      if (!_modalModule) return;
      var mod = state.modules[_modalModule];
      var err = $('#spaModalErr');
      err.style.display = 'none';
      var data = {};
      (mod.formFields || []).forEach(function(f) {
        var el = $('#spaModalBody [name="' + f.field + '"]');
        if (!el) return;
        var v = el.value;
        data[f.field] = f.type === 'number' ? (v === '' ? null : Number(v)) : (v == null ? '' : String(v).trim());
      });
      try {
        if (_modalEditId) await mod.svc.update(_modalEditId, data);
        else await mod.svc.create(data);
        closeModal();
      } catch(ex) {
        err.textContent = ex.message || t('ui.error','خطأ');
        err.style.display = 'block';
      }
    });
  }

  // ==========================================================
  // 9. I18N CHANGE HANDLER — re-render current view
  // ==========================================================
  if (I18n) {
    I18n.onChange(function() {
      if (state.currentSection === 'dashboard') renderDashboard();
      else if (state.modules[state.currentSection]) renderModule(state.currentSection);
    });
  }

  // ==========================================================
  // 10. BOOT
  // ==========================================================
  async function boot() {
    initLogin();
    initNavigation();
    initModal();

    // Try auto-login from existing session cookie
    var hasSession = await checkSession();
    if (hasSession) {
      enterApp();
    }
    // else: show login screen (already visible)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
