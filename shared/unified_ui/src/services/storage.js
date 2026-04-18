// ══ DATA LAYER — السيرفر هو المصدر الوحيد ══════════════════

// ── تحديث تلقائي — فحص السيرفر كل 10 ثواني ──
var _lastVersion = 0;
var _lastCodeVersion = '';
var _autoRefreshBusy = false;
setInterval(function(){
  if(_autoRefreshBusy || window._savingProject) return;
  fetch('/api/version').then(function(r){return r.json();}).then(function(j){
    // فحص تحديث الكود — إذا تغيّر، امسح الكاش وحدّث الصفحة تلقائي
    if(j.code) {
      if(!_lastCodeVersion) { _lastCodeVersion = j.code; }
      else if(j.code !== _lastCodeVersion) {
        _lastCodeVersion = j.code;
        caches.keys().then(function(ks){ ks.forEach(function(k){ caches.delete(k); }); });
        if(navigator.serviceWorker) navigator.serviceWorker.getRegistrations().then(function(regs){ regs.forEach(function(r){ r.unregister(); }); });
        // حفظ الجلسة وإعادة تحميل
        var su=sessionStorage.getItem('pm_current_user');
        var mu=sessionStorage.getItem('pm_master_unlocked');
        if(su) localStorage.setItem('_pm_sr',su);
        if(mu) localStorage.setItem('_pm_mr',mu);
        location.reload(true);
        return;
      }
    }
    // فحص تحديث البيانات
    if(!_lastVersion) { _lastVersion = j.v; return; }
    if(j.v !== _lastVersion) {
      _lastVersion = j.v;
      _autoRefreshBusy = true;
      _doAutoRefresh().then(function(){ _autoRefreshBusy = false; });
    }
  }).catch(function(){});
}, 10000);

async function _doAutoRefresh() {
  try {
    // جلب المشاريع فقط (خفيف وسريع)
    var r = await fetch('/api/data/pm_projects');
    var j = await r.json();
    if(!j.ok || !j.value) return;
    var projects = j.value;
    // تحديث الذاكرة والـ localStorage
    if(window._serverDataCache) window._serverDataCache.projects = projects;
    try { _os.call(localStorage, 'pm_projects', JSON.stringify(projects)); } catch(e) {}
    if(typeof _cache !== 'undefined') _cache['pm_projects'] = JSON.stringify(projects);
    // إعادة رسم المشاريع فقط
    try { renderStats(); } catch(e) {}
    try { renderTable(); } catch(e) {}
    // إعادة تطبيق الصلاحيات بعد الرسم
    try {
      var _cu = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
      if(_cu && !_cu.isAdmin && typeof applyUserPermissions === 'function') applyUserPermissions(_cu);
    } catch(e) {}
  } catch(e) {}
}

async function loadDataAsync() {
  try {
    const r = await fetch('/api/data');
    const j = await r.json();
    if(!j.ok || !j.data) throw new Error('no data');
    const d = j.data;
    return {
      projects:        d.pm_projects        || [],
      stages:          d.pm_stages          || DEFAULT_STAGES,
      columns:         d.pm_columns         || DEFAULT_COLUMNS,
      galleries:       d.pm_galleries       || DEFAULT_GALLERIES,
      companies:       d.pm_companies       || DEFAULT_COMPANIES,
      regions:         d.pm_regions         || DEFAULT_REGIONS,
      companyProfiles: d.pm_co_profiles     || DEFAULT_COMPANY_PROFILES,
      settings:        d.pm_settings        || {watermark:false,showLogos:true,watermarkType:'text',watermarkText:'سري وخاص'}
    };
  } catch(e) {
    return _loadFromLS();
  }
}

function _loadFromLS() {
  try {
    return {
      projects:        JSON.parse(localStorage.getItem('pm_projects')    || '[]'),
      stages:          JSON.parse(localStorage.getItem('pm_stages')      || JSON.stringify(DEFAULT_STAGES)),
      columns:         JSON.parse(localStorage.getItem('pm_columns')     || JSON.stringify(DEFAULT_COLUMNS)),
      galleries:       JSON.parse(localStorage.getItem('pm_galleries')   || JSON.stringify(DEFAULT_GALLERIES)),
      companies:       JSON.parse(localStorage.getItem('pm_companies')   || JSON.stringify(DEFAULT_COMPANIES)),
      regions:         JSON.parse(localStorage.getItem('pm_regions')     || JSON.stringify(DEFAULT_REGIONS)),
      companyProfiles: JSON.parse(localStorage.getItem('pm_co_profiles') || JSON.stringify(DEFAULT_COMPANY_PROFILES)),
      settings:        JSON.parse(localStorage.getItem('pm_settings')    || '{"watermark":false,"showLogos":true,"watermarkType":"text","watermarkText":"سري وخاص"}')
    };
  } catch(e) {
    return { projects:[], stages:DEFAULT_STAGES, columns:DEFAULT_COLUMNS, galleries:DEFAULT_GALLERIES,
             companies:DEFAULT_COMPANIES, regions:DEFAULT_REGIONS, companyProfiles:DEFAULT_COMPANY_PROFILES,
             settings:{watermark:false,showLogos:true,watermarkType:'text',watermarkText:'سري وخاص'} };
  }
}

// loadData المتزامن — السيرفر أولاً دائماً
function loadData() {
  // Use server cache if available (always fresh — this is the truth)
  if(window._serverDataCache) return window._serverDataCache;
  var d = _loadFromLS();
  // Trigger server load if not done — server overwrites localStorage
  if(!window._serverSyncDone) {
    window._serverSyncDone = true;
    _loadServerToLS().then(function(ok){
      if(ok){ try{ renderStats(); renderTable(); }catch(e){} }
    });
  }
  return d;
}

// ── حفظ البيانات ──
async function saveData() {
  // ⚠️ دائماً نجلب أحدث نسخة من السيرفر قبل الحفظ لتفادي الكتابة فوق بيانات مستخدمين آخرين
  try {
    var freshOk = await _loadServerToLS();
    if(freshOk && window._serverDataCache) {
      // ادمج التغييرات المحلية مع بيانات السيرفر
      var local = _loadFromLS();
      // إذا المحلي يحتوي مشاريع أكثر أو مختلفة — ادمجهم
      var merged = _mergeProjects(window._serverDataCache.projects, local.projects);
      window._serverDataCache.projects = merged;
    }
  } catch(e) {}
  const d = window._serverDataCache || _loadFromLS();
  _saveToLS(d);
  _syncToServer(d).then(ok => {
    notify(ok ? '✅ تم الحفظ' : '✅ تم الحفظ محلياً فقط');
  });
  _autoBackup();
  _updateLastSaveLabel();
}

// دمج المشاريع: السيرفر أساسي + المشاريع المحلية الجديدة/المعدلة
function _mergeProjects(serverProjects, localProjects) {
  var merged = serverProjects.slice();
  var serverIds = new Set(merged.map(function(p){ return p.id; }));
  // أضف المشاريع الموجودة محلياً وغير موجودة على السيرفر
  localProjects.forEach(function(lp) {
    if(!serverIds.has(lp.id)) {
      merged.unshift(lp);
    }
  });
  // حدّث المشاريع المعدلة محلياً (بناءً على timestamp أحدث)
  var serverMap = {};
  merged.forEach(function(p, i){ serverMap[p.id] = i; });
  localProjects.forEach(function(lp) {
    var si = serverMap[lp.id];
    if(si !== undefined) {
      // إذا المحلي أحدث (modified) — استخدمه
      if(lp._localMod && (!merged[si]._localMod || lp._localMod > merged[si]._localMod)) {
        merged[si] = lp;
      }
    }
  });
  return merged;
}

function _saveToLS(d) {
  // نستخدم _os (الأصلي) بدل localStorage.setItem حتى ما يرجع يرسل للسيرفر عبر proxy
  // لأن _syncToServer هي يالي ترسل — ما نبغى إرسال مزدوج
  var _w = (typeof _os === 'function') ? function(k,v){ _os.call(localStorage,k,v); if(typeof _cache!=='undefined') _cache[k]=v; } : function(k,v){ localStorage.setItem(k,v); };
  // ⛔ pm_projects ما نكتبها هنا — تتحفظ فقط عبر merge-project
  _w('pm_stages',      JSON.stringify(d.stages));
  _w('pm_columns',     JSON.stringify(d.columns));
  _w('pm_galleries',   JSON.stringify(d.galleries));
  _w('pm_companies',   JSON.stringify(d.companies));
  _w('pm_regions',     JSON.stringify(d.regions));
  _w('pm_co_profiles', JSON.stringify(d.companyProfiles));
  _w('pm_settings',    JSON.stringify(d.settings));
}

async function _syncToServer(d) {
  try {
    const snap = {
      // ⛔ pm_projects لا ترسل هنا — تتحفظ فقط عبر /api/merge-project
      pm_stages:      d.stages,
      pm_columns:     d.columns,
      pm_galleries:   d.galleries,
      pm_companies:   d.companies,
      pm_regions:     d.regions,
      pm_co_profiles: d.companyProfiles,
      pm_settings:    d.settings,
      pm_users:       JSON.parse(localStorage.getItem('pm_users')||'[]'),
      pm_master_hash: localStorage.getItem('pm_master_hash')||''
    };
    // أضف البيانات الأخرى
    Object.keys(localStorage).filter(k=>k.startsWith('pm_saved_')||k.startsWith('pm_meas_')||k.startsWith('pm_files_')).forEach(k=>{
      try{ snap[k]=JSON.parse(localStorage.getItem(k)); }catch(e){ snap[k]=localStorage.getItem(k); }
    });
    const r = await fetch('/api/smart-sync', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({data: snap})
    });
    const j = await r.json();
    return j.ok;
  } catch(e) { return false; }
}

// ── تحميل من السيرفر وتحديث localStorage ──
async function _loadServerToLS() {
  try {
    const r = await fetch('/api/data');
    const j = await r.json();
    if(!j.ok || !j.data) return false;
    const d = j.data;
    // Cache in memory FIRST (works on all browsers)
    window._serverDataCache = {
      projects:        d.pm_projects        || [],
      stages:          d.pm_stages          || DEFAULT_STAGES,
      columns:         d.pm_columns         || DEFAULT_COLUMNS,
      galleries:       d.pm_galleries       || DEFAULT_GALLERIES,
      companies:       d.pm_companies       || DEFAULT_COMPANIES,
      regions:         d.pm_regions         || DEFAULT_REGIONS,
      companyProfiles: d.pm_co_profiles     || DEFAULT_COMPANY_PROFILES,
      settings:        d.pm_settings        || {watermark:false,showLogos:true}
    };
    // Try localStorage too (may fail on Safari with storage limits)
    // Use _os (original setItem) to avoid proxy loop back to server
    Object.entries(d).forEach(([k,v]) => {
      if(!k.startsWith('pm_')) return;
      if(v===null||v===undefined||v==='null'||v==='undefined') return;
      // Skip session-only keys (they belong in sessionStorage, not localStorage)
      if(typeof _SESSION_ONLY!=='undefined'&&_SESSION_ONLY[k]) return;
      var val = typeof v==='string'?v:JSON.stringify(v);
      try{ if(typeof _os==='function') _os.call(localStorage,k,val); else localStorage.setItem(k,val); }catch(e){}
      // Update proxy cache
      if(typeof _cache!=='undefined') _cache[k]=val;
    });
    return true;
  } catch(e) { return false; }
}

// ── تحديث البيانات من السيرفر بدون إعادة تحميل الصفحة ──
async function refreshData() {
  var btn = document.getElementById('sidebarRefreshBtn');
  if(btn) { btn.style.animation = 'spin .8s linear infinite'; btn.disabled = true; }
  try {
    // 1. جلب البيانات مباشرة من السيرفر (تجاوز كل الكاش)
    var r = await fetch('/api/data');
    var j = await r.json();
    if(!j.ok || !j.data) throw new Error('no data');
    var serverData = j.data;

    // 2. كتابة البيانات الجديدة في localStorage مباشرة (بدون proxy حتى ما ترجع للسيرفر)
    Object.entries(serverData).forEach(function(entry) {
      var k = entry[0], v = entry[1];
      if(!k.startsWith('pm_')) return;
      if(typeof _SESSION_ONLY !== 'undefined' && _SESSION_ONLY[k]) return;
      var val = typeof v === 'string' ? v : JSON.stringify(v);
      try { _os.call(localStorage, k, val); } catch(e) {}
      if(typeof _cache !== 'undefined') _cache[k] = val;
    });

    // 3. تحديث ذاكرة السيرفر في الذاكرة
    window._serverDataCache = {
      projects:        serverData.pm_projects        || [],
      stages:          serverData.pm_stages          || (typeof DEFAULT_STAGES !== 'undefined' ? DEFAULT_STAGES : []),
      columns:         serverData.pm_columns         || (typeof DEFAULT_COLUMNS !== 'undefined' ? DEFAULT_COLUMNS : []),
      galleries:       serverData.pm_galleries       || (typeof DEFAULT_GALLERIES !== 'undefined' ? DEFAULT_GALLERIES : []),
      companies:       serverData.pm_companies       || (typeof DEFAULT_COMPANIES !== 'undefined' ? DEFAULT_COMPANIES : []),
      regions:         serverData.pm_regions         || (typeof DEFAULT_REGIONS !== 'undefined' ? DEFAULT_REGIONS : []),
      companyProfiles: serverData.pm_co_profiles     || (typeof DEFAULT_COMPANY_PROFILES !== 'undefined' ? DEFAULT_COMPANY_PROFILES : []),
      settings:        serverData.pm_settings        || {watermark:false,showLogos:true}
    };

    // 4. تحديث بيانات التركيبات
    var syncFns = ['_syncInstallationsFromServer','_syncMaintFromServer','_syncDefectsFromServer','_syncDeliveryFromServer','_syncMeasOrdersFromServer'];
    for(var si=0; si<syncFns.length; si++) {
      try { if(typeof window[syncFns[si]] === 'function') await window[syncFns[si]](); } catch(e) {}
    }

    // 5. إعادة رسم الصفحة الحالية فقط (خفيف وما يخرب الصلاحيات)
    try { renderStats(); } catch(e) {}
    try { renderTable(); } catch(e) {}

    // 6. إعادة تطبيق صلاحيات المستخدم (قد تتغير من المدير)
    try {
      if(typeof applyUserPermissions === 'function') {
        // إعادة تحميل بيانات المستخدم من السيرفر
        var cu = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        if(cu && !cu.isAdmin) {
          var freshUsers = typeof loadUsers === 'function' ? loadUsers() : [];
          var freshUser = freshUsers.find(function(fu){ return fu.name === cu.name; });
          if(freshUser) {
            cu.perms = freshUser.perms || [];
            cu.filterCompany = freshUser.filterCompany || '';
            cu.filterRegion = freshUser.filterRegion || '';
            cu.filterGallery = freshUser.filterGallery || '';
            if(typeof setCurrentUser === 'function') setCurrentUser(cu);
          }
        }
        if(cu) applyUserPermissions(cu);
      }
    } catch(e) {}

    notify('✅ تم تحديث جميع البيانات من السيرفر');

  } catch(e) {
    notify('⚠️ فشل التحديث — ' + (e.message||''), 'error');
  }
  if(btn) { btn.style.animation = ''; btn.disabled = false; }
}

// ── حفظ كل شيء بما فيه القديم ──
function saveToFile() {
  const keys = _getAllAppKeys();
  const snap = {};
  keys.forEach(k => {
    try { snap[k] = JSON.parse(localStorage.getItem(k)); }
    catch(e) { snap[k] = localStorage.getItem(k); }
  });
  const seedJson = JSON.stringify(snap);
  const seedEl = document.getElementById('APP_SEED_DATA');
  if (seedEl) seedEl.textContent = '/* SEED:' + seedJson + ' */';
  const fullHtml = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const date = new Date().toLocaleDateString('ar').replace(/\//g, '-');
  a.href = url;
  a.download = 'نظام_المشاريع_' + date + '.html';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  _updateLastSaveLabel();
  notify('✅ تم حفظ الملف');
}

function restoreFromFile(input) {
  const file = input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const snap = JSON.parse(e.target.result);
      if(!snap.pm_projects) { notify('⚠️ الملف غير صالح','error'); return; }
      const count = Array.isArray(snap.pm_projects) ? snap.pm_projects.length : 0;
      if(!confirm('📂 استعادة النسخة الاحتياطية؟\n\n• عدد المشاريع: '+count+'\n\n⚠️ ستُستبدل البيانات الحالية')) { input.value=''; return; }
      notify('⏳ جارٍ الاستعادة...');
      // 1. جلب المفاتيح القديمة وتحديد ما يجب حذفه
      const newKeys = new Set(Object.keys(snap).filter(k=>k.startsWith('pm_')));
      let deleteKeys = [];
      try {
        const r = await fetch('/api/data');
        const j = await r.json();
        if(j.ok && j.data) {
          deleteKeys = Object.keys(j.data).filter(k=>k.startsWith('pm_') && !newKeys.has(k));
        }
      } catch(ex) {}
      // 2. بناء البيانات الجديدة
      const toSave = { pm_v5_init: '1' };
      Object.keys(snap).filter(k=>k.startsWith('pm_')).forEach(k=>{ toSave[k] = snap[k]; });
      // 3. استيراد ذري — حذف + كتابة معاً
      try {
        await fetch('/api/import', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ data: toSave, deleteOld: deleteKeys })
        });
      } catch(ex) {
        await fetch('/api/data-all',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:toSave})}).catch(()=>{});
      }
      // 4. تحديث localStorage
      const theme = localStorage.getItem('pm_theme');
      Object.keys(localStorage).filter(k=>k.startsWith('pm_')).forEach(k=>localStorage.removeItem(k));
      localStorage.setItem('pm_v5_init', '1');
      if(theme) localStorage.setItem('pm_theme', theme);
      Object.entries(toSave).forEach(([k,v]) => {
        try { localStorage.setItem(k, typeof v==='string'?v:JSON.stringify(v)); } catch(ex) {}
      });
      input.value='';
      notify('✅ تمت الاستعادة — جارٍ التحديث...');
      setTimeout(()=>location.reload(), 800);
    } catch(err) {
      notify('⚠️ خطأ: '+err.message,'error');
      input.value='';
    }
  };
  reader.readAsText(file);
}

function _getAllAppKeys() {
  return Object.keys(localStorage).filter(k => k.startsWith('pm_') && k !== 'pm_tl_cache');
}

function exportAllData() {
  // جلب من السيرفر أولاً ثم تصدير
  _loadServerToLS().then(()=>{
    const keys = _getAllAppKeys();
    const backup = { _v:4, _savedAt: new Date().toISOString(), _app:'ProjectMgmt' };
    keys.forEach(k => {
      try { backup[k] = JSON.parse(localStorage.getItem(k)); }
      catch(e) { backup[k] = localStorage.getItem(k); }
    });
    const blob = new Blob([JSON.stringify(backup, null, 2)], {type:'application/json'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const dt   = new Date().toLocaleDateString('ar').replace(/\//g,'-');
    a.href = url; a.download = 'نسخة_احتياطية_' + dt + '.json';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    _updateLastSaveLabel();
    notify('✅ تم تصدير النسخة الاحتياطية');
  });
}

function importAllData(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = JSON.parse(e.target.result);
      const cnt  = Object.keys(data).filter(k=>!k.startsWith('_')).length;
      if (!confirm('سيتم استيراد '+cnt+' مجموعة بيانات.\nسيتم استبدال البيانات الحالية.\nهل تريد المتابعة؟')) return;
      notify('⏳ جارٍ الاستيراد...');
      // 1. جلب المفاتيح القديمة من السيرفر
      const newKeys = new Set(Object.keys(data).filter(k=>k.startsWith('pm_')));
      let deleteKeys = [];
      try {
        const r = await fetch('/api/data');
        const j = await r.json();
        if(j.ok && j.data) {
          deleteKeys = Object.keys(j.data).filter(k=>k.startsWith('pm_') && !newKeys.has(k));
        }
      } catch(ex) {}
      // 2. بناء البيانات الجديدة
      const toSave = { pm_v5_init: '1' };
      Object.entries(data).forEach(([k, v]) => {
        if (k.startsWith('_')) return;
        toSave[k] = v;
      });
      // 3. استيراد ذري في السيرفر — حذف القديم + كتابة الجديد معاً
      try {
        await fetch('/api/import', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ data: toSave, deleteOld: deleteKeys })
        });
      } catch(ex) {
        // fallback: حفظ بدون حذف
        await fetch('/api/data-all',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:toSave})}).catch(()=>{});
      }
      // 4. تحديث localStorage
      const theme = localStorage.getItem('pm_theme');
      Object.keys(localStorage).filter(k=>k.startsWith('pm_')).forEach(k=>localStorage.removeItem(k));
      localStorage.setItem('pm_v5_init', '1');
      if(theme) localStorage.setItem('pm_theme', theme);
      Object.entries(toSave).forEach(([k, v]) => {
        try { localStorage.setItem(k, typeof v==='string'?v:JSON.stringify(v)); } catch(ex) {}
      });
      notify('✅ تم الاستيراد — جارٍ إعادة التحميل...');
      setTimeout(() => location.reload(), 800);
    } catch(err) {
      notify('❌ خطأ: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

function _autoBackup() {
  try {
    const keys = _getAllAppKeys();
    const snap = {};
    keys.forEach(k => { snap[k] = localStorage.getItem(k); });
    localStorage.setItem('pm_auto_backup', JSON.stringify({ts: Date.now(), data: snap}));
  } catch(e) {}
}

function _updateLastSaveLabel() {
  const el = document.getElementById('lastSaveLabel');
  if (!el) return;
  const d = new Date();
  el.textContent = '⏰ ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2,'0');
  el.title = 'آخر حفظ: ' + d.toLocaleString('ar-SA');
}

// ── auto sync يتم عبر 01-config.js (per-key sync) ──
// لا حاجة لمزامنة كاملة هنا — 01-config يتكفل بذلك

// ── عند فتح الصفحة — جلب البيانات من السيرفر أولاً ──
window.addEventListener('DOMContentLoaded', function() {
  _loadServerToLS().then(function(ok) {
    _updateLastSaveLabel();
    // رسم واحد فقط بعد اكتمال التحميل
    setTimeout(function(){
      try{ renderStats(); renderTable(); }catch(e){}
    }, 300);
  });
});

setInterval(_autoBackup, 300000);

// ── حفظ تلقائي كل 20 ثانية — لحماية البيانات من الضياع ──
(function(){
  var _lastAutoSave = '';
  setInterval(function(){
    try {
      var keys = Object.keys(localStorage).filter(function(k){ return k.startsWith('pm_') && k !== 'pm_auto_backup' && k !== 'pm_tl_cache'; });
      var snap = '';
      keys.forEach(function(k){ snap += k + '=' + (localStorage.getItem(k)||'').length + ';'; });
      if(snap !== _lastAutoSave) {
        _lastAutoSave = snap;
        _syncToServer(_loadFromLS()).catch(function(){});
      }
    } catch(e){}
  }, 20000);
})();

// ── مسودة المشاريع ملغية — الحفظ التلقائي بس للمقاسات والنواقص ──

// ===================== NAVIGATION =====================
function showPage(pg) {
  const cu = getCurrentUser();
  if(cu && !cu.isAdmin) {
    const allowed = new Set(cu.perms || []);
    // تفعيل تلقائي — إذا عنده أي صلاحية فرعية للصفحة
    if(typeof _PAGE_SUB_PERMS !== 'undefined') {
      Object.entries(_PAGE_SUB_PERMS).forEach(function(e) {
        if(!allowed.has(e[0]) && e[1].some(function(s){return allowed.has(s);})) allowed.add(e[0]);
      });
    }
    // تفعيل تلقائي للعهدة — إذا عنده أي صلاحية cust_emp_*
    if(!allowed.has('page_custody')) {
      var hasCustEmp = false;
      allowed.forEach(function(p){ if(p.indexOf('cust_emp_')===0) hasCustEmp=true; });
      if(hasCustEmp) allowed.add('page_custody');
    }
    if(!allowed.has('page_'+pg)) { notify('⚠️ ليس لديك صلاحية لهذه الصفحة','error'); return; }
  }
  document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); p.style.display=''; });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const pageEl = document.getElementById('page-'+pg);
  if(!pageEl) return;
  if(pg === 'drawings') { pageEl.style.display='flex'; pageEl.style.flexDirection='column'; }
  else if(pg === 'designs') { pageEl.style.display='flex'; }
  else { pageEl.classList.add('active'); }
  if(event && event.target) event.target.classList.add('active');
  if(pg === 'projects') { renderStats(); renderTable(); }
  if(pg === 'reports')  { renderReports(); }
  if(pg === 'saved')    { renderSavedReports(); }
  if(pg === 'settings') { renderSettings(); }
  if(pg === 'documents'){ renderDocProjects(); renderLogoGrid(); previewDoc(); }
  if(pg === 'drawings') { if(typeof _loadDrawModule==='function') _loadDrawModule(function(){ try{ dwgInitPage(); }catch(e){} }); else { try{ dwgInitPage(); }catch(e){} } }
  if(pg === 'installations') { if(typeof renderInstallations==='function') renderInstallations(); if(typeof applyInstPermissions==='function') setTimeout(applyInstPermissions, 100); }
  if(pg === 'hr') { if(typeof _loadHRModule==='function') _loadHRModule(function(){ if(typeof renderHRPage==='function') renderHRPage(); }); else { if(typeof renderHRPage==='function') renderHRPage(); } }
  if(pg === 'designs') { if(typeof _loadDesignsModule==='function') _loadDesignsModule(function(){ if(typeof renderDesignsPage==='function') renderDesignsPage(); }); else { if(typeof renderDesignsPage==='function') renderDesignsPage(); } }
  if(pg === 'custody') { if(typeof renderCustodyPage==='function') renderCustodyPage(); }
  // Translate new content if in English mode
  if(_lang === 'en' && typeof _translateAllText === 'function') {
    setTimeout(_translateAllText, 100);
    setTimeout(_translateAllText, 500);
  }
}

// ===================== STATS =====================

// ===================== BACKUP BAR =====================
function dismissBackupBar() {
  const bar = document.getElementById('backupBar');
  if(bar) bar.style.display = 'none';
  // Mark as dismissed for this session
  sessionStorage.setItem('pm_backup_dismissed', '1');
}

function updateBackupInfo() {
  // Calculate data size
  let totalSize = 0;
  Object.keys(localStorage).forEach(k => {
    if(k.startsWith('pm_')) totalSize += (localStorage.getItem(k)||'').length;
  });
  const sizeKB = (totalSize / 1024).toFixed(1);

  const sizeEl = document.getElementById('backupSizeInfo');
  if(sizeEl) sizeEl.textContent = `${sizeKB} كيلوبايت`;

  // Last saved time
  const lastEl = document.getElementById('backupLastSaved');
  if(lastEl) {
    try {
      const ab = JSON.parse(localStorage.getItem('pm_auto_backup') || 'null');
      if(ab && ab.ts) {
        const d = new Date(ab.ts);
        lastEl.textContent = `آخر نسخة احتياطية تلقائية: ${d.toLocaleString('ar-SA')}`;
      } else {
        lastEl.textContent = 'لم يتم إنشاء نسخة احتياطية بعد';
      }
    } catch(e) { lastEl.textContent = ''; }
  }

  // Auto backup toggle state
  const toggle = document.getElementById('autoBackupToggle');
  if(toggle) {
    try {
      const cfg = JSON.parse(localStorage.getItem('pm_auto_backup_cfg') || '{}');
      toggle.checked = cfg.enabled !== false;
    } catch(e) {}
  }
}

function toggleAutoBackup(enabled) {
  localStorage.setItem('pm_auto_backup_cfg', JSON.stringify({enabled}));
}

function exportProjectsOnly() {
  // Export projects as Excel using the existing exportProjectsExcel function
  if(typeof exportProjectsExcel === 'function') {
    exportProjectsExcel();
  } else {
    // Fallback: export as JSON
    const { projects } = loadData();
    const blob = new Blob([JSON.stringify(projects, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `مشاريع_${new Date().toLocaleDateString('ar-SA').replace(/\//g,'-')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}


// ══ دوال القطاعات والمقاسات وعروض الأسعار ══════════════════

function loadSections() {
  try { return JSON.parse(localStorage.getItem('pm_sections') || '[]'); } catch(e) { return []; }
}
function saveSections(arr) {
  localStorage.setItem('pm_sections', JSON.stringify(arr));
}
function getMeasurementsData(id) {
  try { return JSON.parse(localStorage.getItem('pm_meas_'+id) || 'null'); } catch(e) { return null; }
}
function setMeasurementsData(id, data) {
  localStorage.setItem('pm_meas_'+id, JSON.stringify(data));
}
function getPLData(id) {
  try { return JSON.parse(localStorage.getItem('pm_pl_'+id) || '[]'); } catch(e) { return []; }
}
function setPLData(id, data) {
  localStorage.setItem('pm_pl_'+id, JSON.stringify(data));
}
function getSavedReports(type) {
  try { return JSON.parse(localStorage.getItem('pm_saved_'+type) || '[]'); } catch(e) { return []; }
}
function setSavedReports(type, data) {
  localStorage.setItem('pm_saved_'+type, JSON.stringify(data));
}
