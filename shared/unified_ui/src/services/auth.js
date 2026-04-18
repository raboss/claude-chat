async function doLogin(){
  const name=(document.getElementById('loginUser')?.value||'').trim();
  const pass=document.getElementById('loginPass')?.value||'';
  const errEl=document.getElementById('loginError');
  if(!name||!pass){ if(errEl)errEl.textContent='⚠️ '+t('أدخل الاسم وكلمة المرور'); return; }

  // Check if logging in as admin
  if(name==='المدير'){
    // cleanup bad null values
    const _h=localStorage.getItem('pm_master_hash');
    if(_h==='null'||_h==='undefined') localStorage.removeItem('pm_master_hash');
    const hasMaster=!!getMasterHash();
    if(hasMaster){
      if(hashStr(pass)!==getMasterHash()){
        if(errEl)errEl.textContent='⚠️ '+t('كلمة مرور المدير غير صحيحة');
        document.getElementById('loginPass').value='';
        return;
      }
    }
    // Admin login successful
    const dur=parseInt(localStorage.getItem('pm_session_dur')||'0');
    const expiry=dur>0?Date.now()+dur*60000:0;
    sessionStorage.setItem('pm_master_unlocked',expiry||'1');
    setCurrentUser({name:'المدير',isAdmin:true,perms:Object.keys(ALL_PERMS)});
    document.getElementById('loginScreen').style.display='none';
    applyUserPermissions(null);
    updateNavUserChip({name:'المدير',isAdmin:true});
    try{renderStats();renderTable();}catch(e){}
    notify(t('مرحباً بك مديراً')+' 👑');
    if(errEl)errEl.textContent='';
    return;
  }

  // Regular user login — always reload from server first
  let users=loadUsers();
  try{
    const r=await fetch('/api/data/pm_users');const j=await r.json();
    if(j.ok&&j.value){
      users=Array.isArray(j.value)?j.value:JSON.parse(j.value);
      localStorage.setItem('pm_users',JSON.stringify(users));
    }
  }catch(e){}
  // بحث بالاسم أو الإيميل + كلمة المرور (الحالية أو الجديدة)
  const found=users.find(function(u){
    var nameMatch = (u.name===name || (u.email && u.email===name));
    var passMatch = (u.pass===btoa(pass));
    return nameMatch && passMatch;
  });
  if(!found){
    var nameExists=users.find(function(u){ return u.name===name || (u.email && u.email===name); });
    if(nameExists){
      if(errEl)errEl.textContent='⚠️ '+t('كلمة المرور غير صحيحة');
    } else {
      if(errEl)errEl.textContent='⚠️ '+t('اسم المستخدم غير موجود');
    }
    document.getElementById('loginPass').value='';
    return;
  }
  if(errEl)errEl.textContent='';
  setCurrentUser(found);
  document.getElementById('loginScreen').style.display='none';
  applyUserPermissions(found);
  updateNavUserChip(found);
  try{renderStats();renderTable();}catch(e){}
  notify(t('مرحباً')+' '+found.name+' 👋');
}
// keep legacy refs
function loginAsAdmin(){ document.getElementById('loginUser').value='المدير'; document.getElementById('loginPass').focus(); }
function checkMasterPass(){ doLogin(); }
function logout(){
  sessionStorage.removeItem('pm_current_user');
  sessionStorage.removeItem('pm_master_unlocked');
  location.reload();
}

// ── User chip in navbar ──
function updateNavUserChip(user){
  // Remove old chip
  document.getElementById('navUserChip')?.remove();
  if(!user) return;
  const chip = document.createElement('div');
  chip.id = 'navUserChip';
  chip.style.cssText = 'display:flex;align-items:center;gap:6px;background:rgba(79,142,247,.15);border:1px solid var(--accent);border-radius:20px;padding:3px 12px 3px 6px;font-size:12px;color:var(--accent);font-family:Cairo,sans-serif;cursor:default;white-space:nowrap';
  chip.innerHTML = `<span style="font-size:15px">${user.isAdmin?'👑':'👤'}</span>
    <strong>${user.name}</strong>
    ${user.filterCompany||user.filterGallery?'<span style="opacity:.6;font-size:10px">| '+(user.filterCompany||'')+(user.filterGallery?' - '+user.filterGallery:'')+'</span>':''}
    ${!user.isAdmin?'<button onclick="openUserProfile()" title="'+t('إعداداتي')+'" style="background:rgba(79,142,247,.15);border:1px solid var(--accent);color:var(--accent);border-radius:10px;padding:1px 8px;font-size:11px;cursor:pointer;font-family:Cairo,sans-serif">⚙️</button>':''}
    <button onclick="logout()" title="${t('خروج')}" style="background:rgba(220,38,38,.15);border:1px solid rgba(220,38,38,.3);color:#dc2626;border-radius:10px;padding:1px 8px;font-size:11px;cursor:pointer;font-family:Cairo,sans-serif;margin-right:4px">🚪</button>`;
  // Insert into navbar before theme toggle
  const navbar = document.querySelector('.navbar');
  const themeBtn = document.getElementById('themeToggleBtn');
  if(navbar && themeBtn) navbar.insertBefore(chip, themeBtn);
  else if(navbar) navbar.appendChild(chip);
}

// Security settings functions
function renderSecuritySettings(){
  const hasMaster=!!getMasterHash();
  const status=document.getElementById('masterPassStatus');
  const removeBtn=document.getElementById('removeMasterBtn');
  const durInput=document.getElementById('sessionDuration');
  if(status) status.innerHTML=hasMaster
    ? '<span style="color:#16a34a;font-weight:600">✅ '+t('كلمة مرور المدير مفعّلة — الدخول يتطلب كلمة مرور')+'</span>'
    : '<span style="color:var(--text2)">⬜ '+t('لا توجد كلمة مرور للمدير — يدخل بدون كلمة مرور')+'</span>';
  if(removeBtn) removeBtn.style.display=hasMaster?'inline-flex':'none';
  if(durInput) durInput.value=localStorage.getItem('pm_session_dur')||'0';
}
function saveMasterPass(){
  const p=document.getElementById('newMasterPass')?.value||'';
  const c2=document.getElementById('confirmMasterPass')?.value||'';
  if(!p||p.length<4){notify('⚠️ '+t('كلمة المرور يجب 4 أحرف على الأقل'),'error');return;}
  if(p!==c2){notify('⚠️ '+t('كلمتا المرور غير متطابقتين'),'error');return;}
  localStorage.setItem('pm_master_hash',hashStr(p));
  sessionStorage.setItem('pm_master_unlocked','1');
  document.getElementById('newMasterPass').value='';
  document.getElementById('confirmMasterPass').value='';
  renderSecuritySettings();
  notify('✅ '+t('تم حفظ كلمة مرور المدير'));
}
function removeMasterPass(){
  if(!confirm(t('إزالة كلمة مرور المدير؟')))return;
  localStorage.removeItem('pm_master_hash');
  renderSecuritySettings();
  notify('🗑️ '+t('تم إزالة كلمة مرور المدير'));
}
function saveSessionDuration(){
  const v=parseInt(document.getElementById('sessionDuration')?.value||'0');
  localStorage.setItem('pm_session_dur',v);
  notify('✅ '+t('تم حفظ مدة الجلسة:')+' '+(v>0?v+' '+t('دقيقة'):t('بدون انتهاء')));
}
function forceResetMaster(){
  const code=prompt(t('اكتب "تأكيد" لمسح كلمة مرور المدير:'));
  if(code==='تأكيد'){localStorage.removeItem('pm_master_hash');sessionStorage.removeItem('pm_master_unlocked');renderSecuritySettings();notify('✅ '+t('تم المسح'));}
}

// Init on page load — login screen is VISIBLE by default in HTML
// It only gets hidden after successful authentication
(function initAuth(){
  // استعادة الجلسة بعد تحديث الكود التلقائي
  var _sr=localStorage.getItem('_pm_sr'), _mr=localStorage.getItem('_pm_mr');
  if(_sr){sessionStorage.setItem('pm_current_user',_sr);localStorage.removeItem('_pm_sr');}
  if(_mr){sessionStorage.setItem('pm_master_unlocked',_mr);localStorage.removeItem('_pm_mr');}

  const loginScr = document.getElementById('loginScreen');

  // Step 1: Always load server data first, then check auth
  _loadServerToLS().then(function(){
    _doAuthCheck();
  }).catch(function(){
    _doAuthCheck();
  });

  function _doAuthCheck(){
    let u=getCurrentUser();
    if(u && !u.isAdmin){
      // Reload latest permissions from localStorage (admin may have changed them)
      const freshUsers=loadUsers();
      const freshUser=freshUsers.find(fu=>fu.name===u.name);
      if(freshUser){
        u.perms=freshUser.perms||[];
        u.filterCompany=freshUser.filterCompany||'';
        u.filterRegion=freshUser.filterRegion||'';
        u.filterGallery=freshUser.filterGallery||'';
        u.forceWatermark=freshUser.forceWatermark||false;
        u.hideWatermark=freshUser.hideWatermark||false;
        setCurrentUser(u);
      } else {
        // User was deleted by admin — force re-login
        sessionStorage.removeItem('pm_current_user');
        u = null;
      }
    }
    // Check session expiry for admin
    if(u && u.isAdmin){
      const expiry=sessionStorage.getItem('pm_master_unlocked');
      const dur=parseInt(localStorage.getItem('pm_session_dur')||'0');
      if(dur>0 && expiry && expiry!=='1' && Date.now()>parseInt(expiry)){
        sessionStorage.removeItem('pm_current_user');
        sessionStorage.removeItem('pm_master_unlocked');
        u=null;
      }
    }
    if(u){
      // Authenticated — hide login screen, show app
      if(loginScr) loginScr.style.display='none';
      applyUserPermissions(u.isAdmin?null:u);
      updateNavUserChip(u);
      window._authResolved=true;
      setTimeout(()=>{
        try{renderStats();renderTable();}catch(e){}
        applyUserPermissions(u.isAdmin?null:u);
      }, 80);
      return;
    }
    // No active session — check if login is needed
    const users=loadUsers();
    const hasMaster=!!getMasterHash();
    if(users.length>0||hasMaster){
      // Users exist — keep login screen visible (it's already shown)
      if(loginScr) loginScr.style.display='flex';
      window._authResolved=true;
      setTimeout(()=>document.getElementById('loginUser')?.focus(),100);
    } else {
      // ⛔ حتى لو ما في مستخدمين — دائماً اعرض شاشة الدخول (حماية)
      if(loginScr) loginScr.style.display='flex';
      window._authResolved=true;
    }
  }
})();

// ── User profile modal ──
function openUserProfile(){
  const u=getCurrentUser(); if(!u) return;
  if(u.isAdmin) return; // المدير ما يحتاج — عنده الإعدادات الكاملة
  const users=loadUsers();
  const myUser=users.find(function(x){return x.name===u.name;});
  const profile=myUser||{};
  const m=document.createElement('div'); m.className='modal-bg';
  m.innerHTML=`<div class="modal" style="max-width:420px;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,var(--accent),#6366f1);color:#fff;padding:20px;text-align:center">
      <div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.2);margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800">${(u.name||'?').charAt(0)}</div>
      <div style="font-size:18px;font-weight:800">${u.name}</div>
      ${u.filterCompany?'<div style="font-size:12px;opacity:.8;margin-top:4px">🏢 '+u.filterCompany+'</div>':''}
    </div>
    <div class="modal-body" style="padding:16px 20px">
      <div class="form-group">
        <div class="form-label">📞 ${t('رقم الهاتف')}</div>
        <input id="profPhone" type="tel" value="${profile.phone||''}" placeholder="05xxxxxxxx" style="width:100%">
      </div>
      <div class="form-group">
        <div class="form-label">📧 ${t('البريد الإلكتروني')}</div>
        <input id="profEmail" type="email" value="${profile.email||''}" placeholder="example@email.com" style="width:100%">
      </div>
      <div style="border-top:1px solid var(--border);margin:14px 0;padding-top:14px">
        <div class="form-label">🔑 ${t('تغيير كلمة المرور')}</div>
        <input id="profOldPass" type="password" placeholder="${t('كلمة المرور الحالية')}" style="width:100%;margin-bottom:8px">
        <input id="profNewPass" type="password" placeholder="${t('كلمة المرور الجديدة')}" style="width:100%;margin-bottom:8px">
        <input id="profNewPass2" type="password" placeholder="${t('تأكيد كلمة المرور الجديدة')}" style="width:100%">
      </div>
      <div style="display:flex;gap:8px;justify-content:space-between;margin-top:16px">
        <button class="btn btn-danger btn-sm" onclick="logout()">🚪 ${t('تسجيل الخروج')}</button>
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary" onclick="this.closest('.modal-bg').remove()">${t('إلغاء')}</button>
          <button class="btn btn-primary" onclick="saveUserProfile()">💾 ${t('حفظ')}</button>
        </div>
      </div>
    </div></div>`;
  document.body.appendChild(m);
}
function saveUserProfile(){
  const u=getCurrentUser(); if(!u) return;
  const phone=(document.getElementById('profPhone')?.value||'').trim();
  const email=(document.getElementById('profEmail')?.value||'').trim();
  const oldPass=document.getElementById('profOldPass')?.value||'';
  const newPass=document.getElementById('profNewPass')?.value||'';
  const newPass2=document.getElementById('profNewPass2')?.value||'';

  const users=loadUsers();
  const idx=users.findIndex(function(x){return x.name===u.name;});
  if(idx<0) { notify('⚠️ '+t('خطأ'),'error'); return; }

  // تحديث الهاتف والإيميل
  users[idx].phone=phone;
  users[idx].email=email;

  // تغيير كلمة المرور
  if(newPass) {
    if(!oldPass) { notify('⚠️ '+t('أدخل كلمة المرور الحالية'),'error'); return; }
    if(btoa(oldPass)!==users[idx].pass) { notify('⚠️ '+t('كلمة المرور الحالية خاطئة'),'error'); return; }
    if(newPass.length<4) { notify('⚠️ '+t('كلمة المرور الجديدة قصيرة'),'error'); return; }
    if(newPass!==newPass2) { notify('⚠️ '+t('كلمة المرور الجديدة غير متطابقة'),'error'); return; }
    users[idx].pass=btoa(newPass);
    users[idx].passChangedAt=new Date().toISOString();
  }

  saveUsers(users);
  document.querySelector('.modal-bg')?.remove();
  notify('✅ '+t('تم حفظ الإعدادات'));
}
