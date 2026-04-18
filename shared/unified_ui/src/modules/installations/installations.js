// ══════════════════════════════════════════════════
// INSTALLATIONS MODULE — قسم التركيبات
// ══════════════════════════════════════════════════

const INST_KEY = 'pm_installations';

function loadInstallations() {
  try { return JSON.parse(localStorage.getItem(INST_KEY) || '[]'); } catch(e) { return []; }
}

function saveInstallations(arr) {
  localStorage.setItem(INST_KEY, JSON.stringify(arr));
  // Sync to server — MUST complete before sync brings old data back
  return fetch('/api/data/'+INST_KEY, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({value: arr})
  });
}

// Sync: server is the source of truth — just load from server
async function _syncInstallationsFromServer() {
  try {
    var r = await fetch('/api/data/'+INST_KEY);
    var j = await r.json();
    if(j.ok && j.value) {
      var serverData = Array.isArray(j.value) ? j.value : [];
      var newJson = JSON.stringify(serverData);
      var oldJson = localStorage.getItem(INST_KEY) || '[]';
      // Use original setItem to avoid proxy loop (don't send back to server)
      if(typeof _os === 'function') _os.call(localStorage, INST_KEY, newJson);
      else localStorage.setItem(INST_KEY, newJson);
      // Update cache too
      if(typeof _cache !== 'undefined') _cache[INST_KEY] = newJson;
      // If data changed, re-render the UI
      if(newJson !== oldJson) {
        try { _doRenderInstallations(); } catch(e) {}
      }
    }
  } catch(e) {}
}

// ── Render installations list ──
function renderInstallations() {
  _syncInstallationsFromServer().then(function(){ _doRenderInstallations(); }).catch(function(){ _doRenderInstallations(); });
}

function _doRenderInstallations() {
  var entries = loadInstallations();
  var cu = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  var isAdmin = !cu || cu.isAdmin;
  var isSupervisor = cu && !cu.isAdmin && (cu.perms||[]).includes('page_projects');

  // Permission helpers
  var _hasPerm = function(perm) {
    if(isAdmin) return true;
    return cu && (cu.perms||[]).indexOf(perm) !== -1;
  };

  // Technician sees only their entries; Admin/Supervisor sees all
  var visible = (isAdmin || isSupervisor) ? entries : entries.filter(function(e){ return e.addedBy === (cu ? cu.name : ''); });

  var listEl = document.getElementById('instList');
  var emptyEl = document.getElementById('instEmpty');
  if (!listEl) return;

  if (!visible.length) {
    listEl.innerHTML = '';
    if(emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if(emptyEl) emptyEl.style.display = 'none';

  listEl.innerHTML = visible.map(function(entry) {
    var measCount = entry.measurements ? entry.measurements.filter(function(r){ return r.width || r.height; }).length : 0;
    var photoCount = entry.measurements ? entry.measurements.filter(function(r){ return r.serverPhoto || r.photo; }).length : 0;
    var statusColor = entry.status === 'confirmed' ? '#16a34a' : entry.status === 'reviewed' ? '#e0a020' : '#0891b2';
    var statusText = entry.status === 'confirmed' ? t('تم التأكيد') : entry.status === 'reviewed' ? t('قيد المراجعة') : t('جديد');
    var eid = entry.id;

    return '<div class="card" style="border-right:4px solid '+statusColor+';margin-bottom:12px">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:200px">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap">' +
            '<div style="font-size:16px;font-weight:700;color:var(--text)">'+(entry.clientName||t('بدون اسم'))+'</div>' +
            '<span style="font-size:11px;padding:3px 10px;border-radius:12px;background:'+statusColor+'22;color:'+statusColor+';font-weight:700;border:1px solid '+statusColor+'44">'+statusText+'</span>' +
            (entry.zeroZero ? '<span style="font-size:10px;padding:2px 8px;border-radius:8px;background:rgba(26,90,217,0.15);color:#3d8bfd;border:1px solid rgba(26,90,217,0.3)">'+t('زيرو زيرو')+'</span>' : '') +
          '</div>' +
          '<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--text2)">' +
            (entry.contractNo ? '<span>'+t('عقد')+': <strong>'+entry.contractNo+'</strong></span>' : '') +
            (entry.gallery ? '<span>'+t('المعرض')+': <strong>'+entry.gallery+'</strong></span>' : '') +
            '<span>'+t('المقاسات')+': <strong style="color:var(--accent)">'+measCount+'</strong></span>' +
            (photoCount ? '<span>'+t('الصور')+': <strong>'+photoCount+'</strong></span>' : '') +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-top:6px;font-size:12px">' +
            '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:8px;background:rgba(61,139,253,0.1);color:var(--accent);font-weight:700;border:1px solid rgba(61,139,253,0.2)">👤 '+entry.addedBy+'</span>' +
            '<span style="color:var(--text2);font-size:11px">'+new Date(entry.createdAt).toLocaleDateString('ar-SA')+'</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-shrink:0;align-items:center;flex-wrap:wrap">' +
          (_hasPerm('btn_meas') ? '<button class="btn btn-sm btn-primary" onclick="instOpenMeasById(\''+eid+'\')">📐 '+t('المقاسات')+'</button>' : '') +
          ((_hasPerm('inst_confirm')) && entry.status !== 'confirmed' ?
            '<button class="btn btn-sm btn-success" onclick="instConfirmById(\''+eid+'\')">'+t('تأكيد ونقل')+'</button>' : '') +
          ((_hasPerm('inst_merge')) && entry.status !== 'confirmed' ?
            '<button class="btn btn-sm" onclick="instMergeById(\''+eid+'\')" style="background:#8e44ad;color:#fff;border-color:#8e44ad">🔗 '+t('دمج')+'</button>' : '') +
          (_hasPerm('inst_pdf') ? '<button class="btn btn-sm btn-warning" onclick="instExportPDF(\''+eid+'\')">📄</button>' : '') +
          ((isAdmin || isSupervisor || _hasPerm('inst_delete')) ?
            '<button class="btn btn-sm btn-danger" onclick="instDeleteById(\''+eid+'\')" style="padding:4px 10px">🗑️</button>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  // Update notification badge
  _checkInstNotifications();
}

// Helper: find entry by ID
function _instFindIdx(eid) {
  var entries = loadInstallations();
  for(var i=0;i<entries.length;i++) { if(entries[i].id===eid) return i; }
  return -1;
}

// ── Add new installation entry ──
function instAddNew() {
  var d = loadData();
  var galleries = d.galleries || [];
  var cu = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;

  var modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.innerHTML = '<div class="modal" style="max-width:480px">' +
    '<div class="modal-header">' +
      '<div class="modal-title">🔨 '+t('إضافة عميل — التركيبات')+'</div>' +
      '<button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest(\'.modal-bg\').remove()">✕</button>' +
    '</div>' +
    '<div class="modal-body">' +
      '<div class="form-group"><div class="form-label">'+t('اسم العميل')+' <span style="color:var(--accent3)">*</span></div>' +
        '<input id="instClientName" type="text" placeholder="'+t('اسم العميل الكامل')+'" style="width:100%"></div>' +
      '<div class="form-group"><div class="form-label">'+t('رقم العقد')+'</div>' +
        '<input id="instContractNo" type="text" placeholder="'+t('رقم العقد (اختياري)')+'" style="width:100%"></div>' +
      '<div class="form-group"><div class="form-label">'+t('المعرض')+'</div>' +
        '<select id="instGallery" style="width:100%"><option value="">— '+t('اختر المعرض')+' —</option>' +
        galleries.map(function(g){ return '<option>'+g+'</option>'; }).join('') + '</select></div>' +
      '<div class="form-group"><div class="form-label">'+t('ملاحظات')+'</div>' +
        '<textarea id="instNotes" rows="2" placeholder="'+t('ملاحظات إضافية...')+'" style="width:100%"></textarea></div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">' +
        '<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>' +
        '<button class="btn btn-primary" onclick="instSaveNew(this)">'+t('حفظ وإضافة مقاسات')+'</button>' +
      '</div>' +
    '</div></div>';
  document.body.appendChild(modal);
  setTimeout(function(){ var el=document.getElementById('instClientName'); if(el) el.focus(); }, 200);
}

function instSaveNew(btn) {
  var name = (document.getElementById('instClientName')?.value || '').trim();
  if (!name) { notify(t('أدخل اسم العميل'), 'error'); return; }
  var contractNo = (document.getElementById('instContractNo')?.value || '').trim();
  var gallery = document.getElementById('instGallery')?.value || '';
  var notes = document.getElementById('instNotes')?.value || '';
  var cu = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;

  var entry = {
    id: Date.now().toString(),
    clientName: name,
    contractNo: contractNo,
    gallery: gallery,
    notes: notes,
    addedBy: cu ? cu.name : 'المدير',
    createdAt: new Date().toISOString(),
    status: 'new',
    measurements: []
  };

  var entries = loadInstallations();
  entries.unshift(entry);
  saveInstallations(entries);
  btn.closest('.modal-bg').remove();
  _doRenderInstallations();
  notify(t('تم إضافة العميل — افتح المقاسات لإدخال البيانات'));
  if(typeof logActivity==='function') logActivity('إضافة عميل', entry.clientName);
  setTimeout(function(){ instOpenMeasById(entry.id); }, 300);
}

// ── Open measurements BY ID (not index) ──
function instOpenMeasById(eid) {
  var entries = loadInstallations();
  var entry = entries.find(function(e){ return e.id === eid; });
  if (!entry) { notify(t('الإدخال غير موجود'),'error'); return; }

  var sections = (typeof loadSections === 'function') ? loadSections() : [];
  var ROWS = 15;
  var rows = entry.measurements && entry.measurements.length ? entry.measurements :
    Array.from({length: ROWS}, function(_, i){ return {code: 'W'+String(i+1).padStart(2,'0'), width:'', height:'', sectionName:'', description:'', notes:''}; });
  while(rows.length < ROWS) { var n=rows.length+1; rows.push({code:'W'+String(n).padStart(2,'0'),width:'',height:'',sectionName:'',description:'',notes:''}); }

  var MID = 'instMeasModal_' + eid;
  var existM = document.getElementById(MID); if(existM) existM.remove();

  function buildRow(r, i) {
    var sel = sections.map(function(s){ return '<option value="'+s.name+'"'+(r.sectionName===s.name?' selected':'')+'>'+s.name+'</option>'; }).join('');
    var active = r.width || r.height || r.description;
    var hasPhoto = r._localPhoto || r.serverPhoto || r.photo ? true : false;
    return '<tr id="imr_'+eid+'_'+i+'" style="'+(active?'':'opacity:.42')+'">' +
      '<td style="text-align:center;font-size:11px;color:var(--text2);padding:3px">'+(i+1)+'</td>' +
      '<td style="padding:3px"><input value="'+(r.code||'')+'" style="width:50px;font-weight:700;color:var(--accent2)" oninput="instUpd(\''+eid+'\','+i+',\'code\',this.value)"></td>' +
      '<td style="padding:3px"><input type="number" value="'+(r.width||'')+'" style="width:70px" placeholder="0" oninput="instUpd(\''+eid+'\','+i+',\'width\',this.value);instAct(\''+eid+'\','+i+')"></td>' +
      '<td style="padding:3px"><input type="number" value="'+(r.height||'')+'" style="width:70px" placeholder="0" oninput="instUpd(\''+eid+'\','+i+',\'height\',this.value);instAct(\''+eid+'\','+i+')"></td>' +
      '<td style="padding:3px"><select style="width:110px" onchange="instUpd(\''+eid+'\','+i+',\'sectionName\',this.value)"><option value="">—</option>'+sel+'</select></td>' +
      '<td style="padding:3px"><input value="'+(r.description||'')+'" style="width:100%;min-width:60px" placeholder="'+t('وصف')+'" oninput="instUpd(\''+eid+'\','+i+',\'description\',this.value)"></td>' +
      '<td style="padding:3px"><input value="'+(r.notes||'')+'" style="width:70px" placeholder="'+t('ملاحظات')+'" oninput="instUpd(\''+eid+'\','+i+',\'notes\',this.value)"></td>' +
      '<td style="padding:2px"><div style="display:flex;gap:2px;align-items:center">' +
        '<label style="cursor:pointer;font-size:14px;padding:2px 4px;border-radius:4px;background:'+(hasPhoto?'var(--accent)':'var(--surface3)')+';color:'+(hasPhoto?'#fff':'var(--text2)')+'" title="'+t('التقاط صورة')+'">' +
          '📷<input type="file" accept="image/*" capture="environment" style="display:none" onchange="instRowPhoto(this,\''+eid+'\','+i+')">' +
        '</label>' +
        '<button id="iEye_'+eid+'_'+i+'" class="btn btn-sm" onclick="instViewPhoto(\''+eid+'\','+i+')" style="padding:2px 5px;font-size:13px;display:'+(hasPhoto?'inline-flex':'none')+';background:var(--surface3);color:var(--accent)" title="'+t('عرض الصورة')+'">👁️</button>' +
        '<button class="btn btn-sm btn-danger" onclick="instDelRow(\''+eid+'\','+i+')" style="padding:2px 5px;font-size:11px">✕</button>' +
      '</div></td></tr>';
  }

  var modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.id = MID;
  modal.innerHTML = '<div class="modal" style="max-width:1200px;width:97vw;max-height:100vh">' +
    '<div class="modal-header">' +
      '<div class="modal-title">📐 '+t('مقاسات')+' — '+entry.clientName+'</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">' +
        '<button class="btn btn-sm btn-success" onclick="instAddRow(\''+eid+'\')">'+t('سطر')+' +</button>' +
        '<button class="btn btn-sm btn-primary" onclick="instSaveMeas(\''+eid+'\')">💾 '+t('حفظ')+'</button>' +
        '<button class="btn btn-sm btn-warning" onclick="instExportPDF(\''+eid+'\')">📄 PDF</button>' +
        '<button class="btn btn-sm btn-danger" onclick="instDeleteMeas(\''+eid+'\')" style="font-size:11px">🗑️ '+t('حذف الكل')+'</button>' +
        '<button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest(\'.modal-bg\').remove()">✕</button>' +
      '</div>' +
    '</div>' +
    '<div class="modal-body" style="padding:0">' +
      '<div style="padding:8px 16px;background:var(--surface3);font-size:12px;border-bottom:1px solid var(--border);display:flex;gap:16px;flex-wrap:wrap;align-items:center">' +
        '<span>'+t('العميل')+': <strong style="color:var(--accent)">'+entry.clientName+'</strong></span>' +
        (entry.contractNo ? '<span>'+t('العقد')+': <strong>'+entry.contractNo+'</strong></span>' : '') +
        (entry.gallery ? '<span>'+t('المعرض')+': <strong>'+entry.gallery+'</strong></span>' : '') +
        '<span id="instMCnt_'+eid+'" style="color:var(--accent2);font-weight:700">'+t('المدخلة')+': '+rows.filter(function(r){return r.width||r.height;}).length+' '+t('مقاس')+'</span>' +
        '<span style="margin-right:auto"></span>' +
        '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;background:'+(entry.zeroZero?'#1a5ad9':'var(--surface2)')+';padding:4px 10px;border-radius:6px;border:1px solid var(--border)">' +
          '<input type="checkbox" id="instZZ_'+eid+'" '+(entry.zeroZero?'checked':'')+' onchange="instToggleZZ(\''+eid+'\',this.checked)" style="accent-color:#1a5ad9">' +
          '<span style="font-weight:700;color:'+(entry.zeroZero?'#fff':'var(--text)')+';font-size:11px" id="instZZText_'+eid+'">'+(entry.zeroZero?t('زيرو زيرو (-8مم)'):t('مقاس تصنيع'))+'</span>' +
        '</label>' +
      '</div>' +
      '<div style="overflow:auto;height:calc(100vh - 160px);padding:8px;-webkit-overflow-scrolling:touch">' +
        '<table style="width:100%;border-collapse:collapse;min-width:560px">' +
          '<thead><tr style="background:var(--surface3)">' +
            '<th style="padding:5px 3px;border:1px solid var(--border);width:28px">#</th>' +
            '<th style="padding:5px;border:1px solid var(--border);width:50px">'+t('الرمز')+'</th>' +
            '<th style="padding:5px;border:1px solid var(--border);width:76px">'+t('عرض')+'</th>' +
            '<th style="padding:5px;border:1px solid var(--border);width:76px">'+t('ارتفاع')+'</th>' +
            '<th style="padding:5px;border:1px solid var(--border);width:110px">'+t('القطاع')+'</th>' +
            '<th style="padding:5px;border:1px solid var(--border)">'+t('الوصف')+'</th>' +
            '<th style="padding:5px;border:1px solid var(--border);width:70px">'+t('ملاحظات')+'</th>' +
            '<th style="padding:5px;border:1px solid var(--border);width:60px">📷/×</th>' +
          '</tr></thead>' +
          '<tbody id="instMBody_'+eid+'">'+rows.map(function(r,i){return buildRow(r,i);}).join('')+'</tbody>' +
        '</table>' +
      '</div>' +
    '</div></div>';

  document.body.appendChild(modal);
  modal._rows = rows;
  modal._buildRow = buildRow;
  modal._entryId = eid;
}

// ── Update/Add/Delete measurement rows ──
function instUpd(eid, i, field, val) {
  var modal = document.getElementById('instMeasModal_' + eid);
  if (!modal || !modal._rows[i]) return;
  modal._rows[i][field] = val;
  modal._autoSaveDirty = true;
}

function instAct(eid, i) {
  var tr = document.getElementById('imr_'+eid+'_'+i);
  var modal = document.getElementById('instMeasModal_'+eid);
  if(!tr||!modal) return;
  var r = modal._rows[i];
  tr.style.opacity = (r.width||r.height||r.description) ? '1' : '.42';
}

function instAddRow(eid) {
  var modal = document.getElementById('instMeasModal_'+eid);
  if(!modal) return;
  var n = modal._rows.length + 1;
  modal._rows.push({code:'W'+String(n).padStart(2,'0'),width:'',height:'',sectionName:'',description:'',notes:''});
  var tbody = document.getElementById('instMBody_'+eid);
  if(tbody) tbody.insertAdjacentHTML('beforeend', modal._buildRow(modal._rows[modal._rows.length-1], modal._rows.length-1));
}

function instDelRow(eid, i) {
  var modal = document.getElementById('instMeasModal_'+eid);
  if(!modal) return;
  modal._rows.splice(i, 1);
  var tbody = document.getElementById('instMBody_'+eid);
  if(tbody) tbody.innerHTML = modal._rows.map(function(r,j){return modal._buildRow(r,j);}).join('');
}

function instRowPhoto(input, eid, i) {
  var file = input.files[0]; if(!file) return;
  var modal = document.getElementById('instMeasModal_'+eid);
  if(!modal||!modal._rows[i]) return;

  // Preview locally while uploading
  var reader = new FileReader();
  reader.onload = function(e) {
    modal._rows[i]._localPhoto = e.target.result; // temp preview only, not saved
    var tr = document.getElementById('imr_'+eid+'_'+i);
    if(tr) {
      var lbl = tr.querySelector('label');
      if(lbl) { lbl.style.background='var(--accent)'; lbl.style.color='#fff'; }
      var eyeBtn = document.getElementById('iEye_'+eid+'_'+i);
      if(eyeBtn) eyeBtn.style.display='inline-flex';
    }
  };
  reader.readAsDataURL(file);

  // Upload to server and save path
  var entries = loadInstallations();
  var entry = entries.find(function(e){return e.id===eid;});
  if(entry){
    var fd = new FormData();
    fd.append('files', file);
    var q = new URLSearchParams({
      name: entry.clientName||'بدون', contractNo: entry.contractNo||'',
      company:'', region:'', gallery: entry.gallery||'', subfolder:'صور الموقع'
    });
    fetch('/api/upload-site-photo?'+q.toString(),{method:'POST',body:fd})
      .then(function(r){return r.json();})
      .then(function(j){
        if(j.ok){
          modal._rows[i].serverPhoto = j.path;
          notify(t('✅ تم رفع صورة — سطر')+' '+(i+1));
        } else {
          notify('⚠️ '+t('فشل رفع الصورة'),'error');
        }
      })
      .catch(function(){
        notify('⚠️ '+t('فشل رفع الصورة'),'error');
      });
  }
  input.value='';
}

// ── View row photo fullscreen ──
function instViewPhoto(eid, i) {
  var modal = document.getElementById('instMeasModal_'+eid);
  if(!modal||!modal._rows||!modal._rows[i]) return;
  var r = modal._rows[i];
  var photo = r._localPhoto || (r.serverPhoto ? '/api/file?path='+encodeURIComponent(r.serverPhoto) : '') || r.photo;
  if(!photo) return;
  var code = r.code||'';
  var desc = r.description||'';
  var ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;cursor:zoom-out';
  ov.innerHTML='<div style="text-align:center;max-width:95vw;max-height:95vh">' +
    '<img src="'+photo+'" style="max-width:90vw;max-height:82vh;object-fit:contain;border-radius:8px;box-shadow:0 4px 30px rgba(0,0,0,.5)">' +
    '<div style="margin-top:10px;color:#fff;font-size:14px;font-family:Cairo,sans-serif">'+code+(desc?' — '+desc:'')+' <span style="opacity:.5">('+t('سطر')+' '+(i+1)+')</span></div>' +
  '</div>';
  ov.onclick=function(e){if(e.target===ov)ov.remove();};
  document.body.appendChild(ov);
}

// ── Save measurements ──
function instSaveMeas(eid) {
  var modal = document.getElementById('instMeasModal_'+eid);
  if(!modal) return;
  var entries = loadInstallations();
  var entry = entries.find(function(e){ return e.id === eid; });
  if(!entry) return;

  // Check all photos uploaded before saving
  var pending = modal._rows.filter(function(r){ return r._localPhoto && !r.serverPhoto; });
  if(pending.length){
    notify('⚠️ '+t('انتظر اكتمال رفع الصور')+' ('+pending.length+')','error');
    return;
  }

  // Strip base64 data — keep only serverPhoto path for storage
  entry.measurements = modal._rows.map(function(r){
    var clean = {code:r.code,width:r.width,height:r.height,sectionName:r.sectionName,description:r.description,notes:r.notes};
    if(r.serverPhoto) clean.serverPhoto = r.serverPhoto;
    return clean;
  });
  var cnt = entry.measurements.filter(function(r){return r.width||r.height;}).length;

  // Save and wait for server sync
  saveInstallations(entries)
    .then(function(r){ return r.json(); })
    .then(function(j){
      if(j.ok){
        notify(t('✅ تم حفظ')+' '+cnt+' '+t('مقاس — تمت المزامنة'));
        if(typeof logActivity==='function') logActivity('رفع مقاسات', entry.clientName+' ('+cnt+' مقاس)');
        _doRenderInstallations();
        modal.remove();
      } else {
        notify('⚠️ '+t('حفظ محلي تم — خطأ بالمزامنة'),'error');
      }
    })
    .catch(function(){
      notify('⚠️ '+t('حفظ محلي تم — خطأ بالمزامنة'),'error');
    });
}

// ── Delete all measurements for an entry ──
function instDeleteMeas(eid) {
  var entries = loadInstallations();
  var entry = entries.find(function(e){ return e.id === eid; });
  if(!entry) return;
  if(!confirm(t('حذف جميع مقاسات')+' "'+entry.clientName+'"؟\n\n⚠️ '+t('لا يمكن التراجع'))) return;
  entry.measurements = [];
  entry._modified = Date.now();
  // Save and WAIT for server before re-rendering
  saveInstallations(entries).then(function(){
    var modal = document.getElementById('instMeasModal_'+eid);
    if(modal) modal.remove();
    _doRenderInstallations();
    notify('🗑️ '+t('تم حذف جميع المقاسات'));
  });
}

// ── Toggle zero-zero mode ──
function instToggleZZ(eid, on) {
  var entries = loadInstallations();
  var entry = entries.find(function(e){ return e.id === eid; });
  if(entry) { entry.zeroZero = on; saveInstallations(entries); }
  var lbl = document.getElementById('instZZ_'+eid)?.parentElement;
  var txt = document.getElementById('instZZText_'+eid);
  if(lbl) lbl.style.background = on ? '#1a5ad9' : 'var(--surface2)';
  if(txt) { txt.textContent = on ? t('زيرو زيرو (-8مم)') : t('مقاس تصنيع'); txt.style.color = on ? '#fff' : 'var(--text)'; }
}

// ── Confirm by ID ──
function instConfirmById(eid) {
  var idx = _instFindIdx(eid);
  if(idx < 0) return;
  instConfirm(idx);
}

// ── Delete by ID ──
function instDeleteById(eid) {
  var entries = loadInstallations();
  var entry = entries.find(function(e){ return e.id === eid; });
  if(!entry) return;
  if(!confirm(t('حذف العميل')+' "'+entry.clientName+'" '+t('وجميع مقاساته؟')+'\n\n⚠️ '+t('لا يمكن التراجع'))) return;
  entries = entries.filter(function(e){ return e.id !== eid; });
  // Close any open modal for this entry
  var modal = document.getElementById('instMeasModal_'+eid);
  if(modal) modal.remove();
  // Save locally + send to server, then re-render
  localStorage.setItem(INST_KEY, JSON.stringify(entries));
  _doRenderInstallations();
  notify('🗑️ '+t('تم حذف العميل وجميع مقاساته'));
  if(typeof logActivity==='function') logActivity('حذف عميل', entry.clientName);
  // Now sync to server
  fetch('/api/data/'+INST_KEY, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({value: entries})
  }).catch(function(e){ notify('⚠️ '+t('فشل الحذف من السيرفر — حاول مرة أخرى'),'error'); });
}

// ── Confirm and transfer to main projects ──
function instConfirm(idx) {
  var entries = loadInstallations();
  var entry = entries[idx];
  if(!entry) return;

  var d = loadData();
  var projects = d.projects;
  var existingProject = null;
  if(entry.contractNo) {
    existingProject = projects.find(function(p){ return p.contractNo === entry.contractNo; });
  }
  if(!existingProject && entry.clientName) {
    existingProject = projects.find(function(p){ return p.name === entry.clientName; });
  }

  if(existingProject) {
    if(!confirm(t('العميل')+' "'+existingProject.name+'" '+t('موجود بالمشاريع')+'.\n\n'+t('هل تريد نقل المقاسات والصور إليه؟'))) return;
    _doMergeToProject(entry, existingProject, entries);
  } else {
    // عرض خيار: إنشاء جديد أو دمج مع مشروع موجود
    instOpenCompleteForm(idx);
  }
}

// ── دمج المقاسات مع مشروع موجود ──
function _doMergeToProject(entry, existingProject, entries) {
  var measKey = 'pm_meas_' + existingProject.id;
  var existingMeas = [];
  try { existingMeas = JSON.parse(localStorage.getItem(measKey)||'[]'); } catch(e){}
  if(!Array.isArray(existingMeas)) existingMeas = [];
  var newMeas = (entry.measurements||[]).filter(function(r){return r.width||r.height;});
  localStorage.setItem(measKey, JSON.stringify(existingMeas.concat(newMeas)));

  entry.status = 'confirmed';
  entry.confirmedAt = new Date().toISOString();
  entry.linkedProjectId = existingProject.id;
  saveInstallations(entries);
  _doRenderInstallations();
  notify(t('تم دمج')+' '+newMeas.length+' '+t('مقاس مع مشروع')+': '+existingProject.name);
  if(typeof logActivity==='function') logActivity('دمج', entry.clientName+' → '+existingProject.name);
}

// ── دمج يدوي — زر "دمج" ──
function instMergeById(eid) {
  var entries = loadInstallations();
  var entry = entries.find(function(e){ return e.id === eid; });
  if(!entry) { notify(t('الإدخال غير موجود'),'error'); return; }

  var d = loadData();
  var projects = d.projects.filter(function(p){ return !p.pendingReview; });
  if(!projects.length) { notify(t('لا توجد مشاريع للدمج معها'),'error'); return; }

  var modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.innerHTML = '<div class="modal" style="max-width:520px">' +
    '<div class="modal-header">' +
      '<div class="modal-title">🔗 '+t('دمج المقاسات مع مشروع موجود')+'</div>' +
      '<button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest(\'.modal-bg\').remove()">✕</button>' +
    '</div>' +
    '<div class="modal-body">' +
      '<div style="padding:10px;background:rgba(8,145,178,0.08);border:1px solid rgba(8,145,178,0.2);border-radius:8px;margin-bottom:16px;font-size:12px">' +
        '<strong>'+t('العميل')+':</strong> '+entry.clientName+' | '+t('المقاسات')+': '+(entry.measurements||[]).filter(function(r){return r.width||r.height;}).length +
      '</div>' +
      '<div class="form-group">' +
        '<div class="form-label">'+t('ابحث باسم العميل أو رقم العقد')+'</div>' +
        '<input id="instMergeSearch" type="text" placeholder="'+t('اكتب للبحث...')+'" style="width:100%" oninput="instMergeFilter(\''+eid+'\')">' +
      '</div>' +
      '<div id="instMergeResults" style="max-height:300px;overflow-y:auto;margin-top:8px">' +
        _buildMergeList(projects, eid) +
      '</div>' +
    '</div></div>';
  document.body.appendChild(modal);
  setTimeout(function(){ var el=document.getElementById('instMergeSearch'); if(el) el.focus(); }, 200);
}

function _buildMergeList(projects, eid) {
  if(!projects.length) return '<div style="text-align:center;padding:20px;color:var(--text2)">'+t('لا توجد نتائج')+'</div>';
  return projects.map(function(p) {
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;cursor:pointer;transition:background .2s" ' +
      'onmouseover="this.style.background=\'var(--surface3)\'" onmouseout="this.style.background=\'\'">' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-weight:700;color:var(--text)">'+(p.name||t('بدون اسم'))+'</div>' +
        '<div style="font-size:11px;color:var(--text2)">'+(p.contractNo?t('عقد')+': '+p.contractNo+' | ':'')+
          (p.company||'')+(p.gallery?' | '+p.gallery:'')+'</div>' +
      '</div>' +
      '<button class="btn btn-sm btn-success" onclick="instDoMerge(\''+eid+'\',\''+p.id+'\',this)" style="flex-shrink:0">🔗 '+t('دمج')+'</button>' +
    '</div>';
  }).join('');
}

function instMergeFilter(eid) {
  var q = (document.getElementById('instMergeSearch')?.value || '').toLowerCase().trim();
  var d = loadData();
  var projects = d.projects.filter(function(p){
    if(p.pendingReview) return false;
    if(!q) return true;
    var txt = ((p.name||'')+ ' ' +(p.contractNo||'')+' '+(p.company||'')+' '+(p.gallery||'')).toLowerCase();
    return txt.indexOf(q) !== -1;
  });
  var el = document.getElementById('instMergeResults');
  if(el) el.innerHTML = _buildMergeList(projects, eid);
}

function instDoMerge(eid, projectId, btn) {
  var entries = loadInstallations();
  var entry = entries.find(function(e){ return e.id === eid; });
  if(!entry) { notify(t('الإدخال غير موجود'),'error'); return; }

  var d = loadData();
  var project = d.projects.find(function(p){ return p.id === projectId; });
  if(!project) { notify(t('المشروع غير موجود'),'error'); return; }

  var newMeas = (entry.measurements||[]).filter(function(r){return r.width||r.height;});
  if(!newMeas.length) { notify(t('لا توجد مقاسات لدمجها'),'error'); return; }

  if(!confirm(t('دمج')+' '+newMeas.length+' '+t('مقاس مع مشروع')+' "'+project.name+'"؟')) return;

  _doMergeToProject(entry, project, entries);
  // إغلاق المودال
  var modal = btn.closest('.modal-bg');
  if(modal) modal.remove();
}

// ── Complete form for new client ──
function instOpenCompleteForm(idx) {
  var entries = loadInstallations();
  var entry = entries[idx];
  if(!entry) return;
  var d = loadData();

  var modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.innerHTML = '<div class="modal" style="max-width:560px">' +
    '<div class="modal-header">' +
      '<div class="modal-title">'+t('تأكيد ونقل')+' — '+entry.clientName+'</div>' +
      '<button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest(\'.modal-bg\').remove()">✕</button>' +
    '</div>' +
    '<div class="modal-body">' +
      '<div style="padding:10px;background:rgba(8,145,178,0.08);border:1px solid rgba(8,145,178,0.2);border-radius:8px;margin-bottom:16px;font-size:12px">' +
        '<strong>'+t('من الفني')+':</strong> '+entry.addedBy+' | '+t('المقاسات')+': '+(entry.measurements||[]).filter(function(r){return r.width||r.height;}).length+' | '+(entry.gallery||'') +
        (entry.notes ? '<div style="margin-top:4px;color:var(--text2)">'+t('ملاحظات')+': '+entry.notes+'</div>' : '') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
        '<div class="form-group"><div class="form-label">'+t('اسم العميل')+' *</div><input id="icfName" value="'+entry.clientName+'" style="width:100%"></div>' +
        '<div class="form-group"><div class="form-label">'+t('رقم العقد')+'</div><input id="icfContract" value="'+(entry.contractNo||'')+'" style="width:100%"></div>' +
        '<div class="form-group"><div class="form-label">'+t('الشركة')+'</div><select id="icfCompany" style="width:100%"><option value="">'+t('اختر')+'</option>'+d.companies.map(function(c){return '<option>'+c+'</option>';}).join('')+'</select></div>' +
        '<div class="form-group"><div class="form-label">'+t('المنطقة')+'</div><select id="icfRegion" style="width:100%"><option value="">'+t('اختر')+'</option>'+d.regions.map(function(r){return '<option>'+r+'</option>';}).join('')+'</select></div>' +
        '<div class="form-group"><div class="form-label">'+t('المعرض')+'</div><select id="icfGallery" style="width:100%"><option value="">'+t('اختر')+'</option>'+(d.galleries||[]).map(function(g){return '<option'+(g===entry.gallery?' selected':'')+'>'+g+'</option>';}).join('')+'</select></div>' +
        '<div class="form-group"><div class="form-label">'+t('المرحلة')+'</div><select id="icfStage" style="width:100%"><option value="">'+t('اختر')+'</option>'+d.stages.map(function(s){return '<option>'+s.name+'</option>';}).join('')+'</select></div>' +
        '<div class="form-group"><div class="form-label">'+t('قيمة العقد')+'</div><input id="icfValue" type="number" placeholder="0" style="width:100%"></div>' +
        '<div class="form-group"><div class="form-label">'+t('الدفعة المقدمة')+'</div><input id="icfDown" type="number" placeholder="0" style="width:100%"></div>' +
        '<div class="form-group"><div class="form-label">'+t('الهاتف')+'</div><input id="icfPhone" type="tel" style="width:100%"></div>' +
        '<div class="form-group"><div class="form-label">'+t('تاريخ العقد')+'</div><input id="icfDate" type="date" style="width:100%"></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">' +
        '<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>' +
        '<button class="btn btn-success" onclick="instDoConfirm('+idx+',this)" style="font-size:14px;padding:10px 24px">'+t('تأكيد وإنشاء المشروع')+'</button>' +
      '</div>' +
    '</div></div>';
  document.body.appendChild(modal);
}

function instDoConfirm(idx, btn) {
  var name = (document.getElementById('icfName')?.value||'').trim();
  if(!name) { notify(t('أدخل اسم العميل'),'error'); return; }
  var entries = loadInstallations();
  var entry = entries[idx];
  if(!entry) return;
  var d = loadData();
  var maxSeq = d.projects.reduce(function(mx,p){ return Math.max(mx, parseInt(p.seq)||0); }, 0);
  var newId = Date.now().toString();
  var p = {
    id: newId, seq: String(maxSeq + 1), name: name,
    contractNo: document.getElementById('icfContract')?.value || '',
    company: document.getElementById('icfCompany')?.value || '',
    region: document.getElementById('icfRegion')?.value || '',
    gallery: document.getElementById('icfGallery')?.value || '',
    stage: document.getElementById('icfStage')?.value || '',
    contractValue: document.getElementById('icfValue')?.value || '',
    downPayment: document.getElementById('icfDown')?.value || '',
    phone: document.getElementById('icfPhone')?.value || '',
    contractDate: document.getElementById('icfDate')?.value || '',
    progress: '0',
    status: (typeof calcStatusFromStage==='function') ? calcStatusFromStage(document.getElementById('icfStage')?.value||'') : ''
  };
  d.projects.unshift(p);
  localStorage.setItem('pm_projects', JSON.stringify(d.projects));

  var meas = (entry.measurements||[]).filter(function(r){return r.width||r.height;});
  if(meas.length) {
    localStorage.setItem('pm_meas_'+newId, JSON.stringify(meas));
  }

  entry.status = 'confirmed';
  entry.confirmedAt = new Date().toISOString();
  entry.linkedProjectId = newId;
  saveInstallations(entries);

  btn.closest('.modal-bg').remove();
  _doRenderInstallations();
  try { renderStats(); renderTable(); } catch(e) {}
  notify(t('تم إنشاء مشروع')+' "'+name+'" '+t('ونقل')+' '+meas.length+' '+t('مقاس'));
}

// ── Notification system ──
function _checkInstNotifications() {
  var cu = (typeof getCurrentUser==='function') ? getCurrentUser() : null;
  var isAdmin = !cu || cu.isAdmin;
  var isSupervisor = cu && !cu.isAdmin && (cu.perms||[]).includes('page_projects');
  if(!isAdmin && !isSupervisor) return;

  var entries = loadInstallations();
  var newEntries = entries.filter(function(e){ return e.status === 'new'; });
  var lastSeen = parseInt(localStorage.getItem('pm_inst_last_seen')||'0');
  var unseen = newEntries.filter(function(e){ return new Date(e.createdAt).getTime() > lastSeen; });

  // Badge on sidebar button
  var btn = document.getElementById('navInstBtn');
  if(btn) {
    var oldBadge = btn.querySelector('.inst-badge');
    if(oldBadge) oldBadge.remove();
    if(newEntries.length > 0) {
      btn.style.display = '';
      var badge = document.createElement('span');
      badge.className = 'inst-badge';
      badge.style.cssText = 'position:absolute;top:-4px;left:-4px;background:#f43f5e;color:#fff;font-size:10px;font-weight:800;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 4px;box-shadow:0 2px 6px rgba(244,63,94,.4);animation:badgePulse 2s infinite';
      badge.textContent = newEntries.length;
      btn.style.position = 'relative';
      btn.appendChild(badge);
    }
  }

  // Toast for unseen
  if(unseen.length > 0 && typeof notify === 'function') {
    notify('🔨 '+unseen.length+' '+t('مقاسات جديدة من الفنيين بقسم التركيبات'));
    localStorage.setItem('pm_inst_last_seen', Date.now().toString());
  }
}

// ── Export PDF for measurements ──
function instExportPDF(eid) {
  var entries = loadInstallations();
  var entry = entries.find(function(e){ return e.id === eid; });
  if(!entry) { notify(t('الإدخال غير موجود'),'error'); return; }

  // Use modal rows if modal is open, otherwise use saved data
  var modal = document.getElementById('instMeasModal_'+eid);
  var rows = modal && modal._rows ? modal._rows : (entry.measurements || []);
  var dataRows = rows.filter(function(r){ return r.width || r.height; });
  if(!dataRows.length) { notify(t('لا توجد مقاسات لتصديرها'),'error'); return; }

  // Collect rows that have photos (local preview or server path)
  var photoRows = rows.filter(function(r){ return (r._localPhoto || r.serverPhoto || r.photo) && (r.width || r.height); });

  var dateStr = entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('ar-SA') : new Date().toLocaleDateString('ar-SA');

  // Build table rows
  var tableRowsHtml = dataRows.map(function(r, i){
    var bg = i % 2 === 0 ? '#ffffff' : '#f1f5f9';
    return '<tr style="background:'+bg+'">' +
      '<td style="text-align:center;padding:8px 6px;border:1px solid #cbd5e1;font-weight:700;color:#334155">'+(i+1)+'</td>' +
      '<td style="padding:8px 6px;border:1px solid #cbd5e1;font-weight:800;color:#1e40af;text-align:center">'+(r.code||'-')+'</td>' +
      '<td style="text-align:center;padding:8px 6px;border:1px solid #cbd5e1;font-size:14px;font-weight:700">'+(r.width||'-')+'</td>' +
      '<td style="text-align:center;padding:8px 6px;border:1px solid #cbd5e1;font-size:14px;font-weight:700">'+(r.height||'-')+'</td>' +
      '<td style="padding:8px 6px;border:1px solid #cbd5e1;color:#475569">'+(r.sectionName||'-')+'</td>' +
      '<td style="padding:8px 6px;border:1px solid #cbd5e1;color:#334155">'+(r.description||'-')+'</td>' +
      '<td style="padding:8px 6px;border:1px solid #cbd5e1;color:#64748b;font-size:11px">'+(r.notes||'')+'</td>' +
    '</tr>';
  }).join('');

  // Build photos section — each photo on its own area with caption
  var photosHtml = '';
  if(photoRows.length) {
    var photoCells = photoRows.map(function(r){
      var src = r._localPhoto || (r.serverPhoto ? '/api/file?path='+encodeURIComponent(r.serverPhoto) : '') || r.photo || '';
      return '<div style="text-align:center;border:1px solid #e2e8f0;border-radius:8px;padding:10px;break-inside:avoid;background:#ffffff">' +
        '<img src="'+src+'" style="max-width:100%;max-height:260px;object-fit:contain;border-radius:6px;border:1px solid #e2e8f0">' +
        '<div style="margin-top:8px;font-size:12px;color:#1e40af;font-weight:700">'+(r.code||'')+
          (r.description ? ' — '+r.description : '') +
          (r.width ? '&ensp;('+r.width+'×'+(r.height||'')+')' : '') +
        '</div>' +
      '</div>';
    }).join('');

    photosHtml = '<div style="page-break-before:always;padding-top:16px">' +
      '<div style="font-size:16px;font-weight:800;color:#1e3a5f;border-bottom:3px solid #1e3a5f;padding-bottom:8px;margin-bottom:16px">📷 '+t('الصور المرفقة')+' — '+(entry.clientName||'')+'</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">' +
      photoCells +
      '</div></div>';
  }

  // Build printable HTML
  var pa = document.getElementById('printArea');

  var styles = '<'+'style>'+
    '@page{size:A4;margin:12mm}'+
    '*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}'+
    'body{font-family:Cairo,Segoe UI,Tahoma,sans-serif;direction:rtl;color:#1e293b;margin:0;padding:0;background:#fff;font-size:13px}'+
    'table{width:100%;border-collapse:collapse}'+
    'img{max-width:100%}'+
    'tr{page-break-inside:avoid}'+
  '<'+'/style>';

  var headerHtml = '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1e3a5f;padding-bottom:14px;margin-bottom:16px">' +
    '<div>' +
      '<div style="font-size:22px;font-weight:900;color:#1e3a5f;margin-bottom:4px">📐 '+t('تقرير المقاسات')+'</div>' +
      '<div style="font-size:14px;color:#334155;line-height:1.8">' +
        '<strong>'+t('العميل')+':</strong> <span style="color:#1e40af;font-weight:800">'+(entry.clientName||'')+'</span>' +
        (entry.contractNo ? '&ensp;|&ensp;<strong>'+t('العقد')+':</strong> '+entry.contractNo : '') +
        (entry.gallery ? '&ensp;|&ensp;<strong>'+t('المعرض')+':</strong> '+entry.gallery : '') +
      '</div>' +
      '<div style="font-size:12px;color:#64748b;margin-top:2px">' +
        t('التاريخ')+': '+dateStr+'&ensp;|&ensp;'+t('عدد المقاسات')+': <strong style="color:#1e40af">'+dataRows.length+'</strong>' +
        (entry.zeroZero ? '&ensp;|&ensp;<span style="color:#2563eb;font-weight:800;background:#eff6ff;padding:2px 8px;border-radius:4px">'+t('زيرو زيرو (-8مم)')+'</span>' : '') +
        (entry.addedBy ? '&ensp;|&ensp;'+t('الفني')+': <strong>'+entry.addedBy+'</strong>' : '') +
      '</div>' +
    '</div>' +
  '</div>';

  var tableHtml = '<table>' +
    '<thead><tr>' +
      '<th style="background:#1e3a5f;color:#fff;padding:10px 6px;border:1px solid #1e3a5f;font-size:12px;font-weight:700;width:35px">#</th>' +
      '<th style="background:#1e3a5f;color:#fff;padding:10px 6px;border:1px solid #1e3a5f;font-size:12px;font-weight:700;width:60px">'+t('الرمز')+'</th>' +
      '<th style="background:#1e3a5f;color:#fff;padding:10px 6px;border:1px solid #1e3a5f;font-size:12px;font-weight:700;width:75px">'+t('العرض')+'</th>' +
      '<th style="background:#1e3a5f;color:#fff;padding:10px 6px;border:1px solid #1e3a5f;font-size:12px;font-weight:700;width:75px">'+t('الارتفاع')+'</th>' +
      '<th style="background:#1e3a5f;color:#fff;padding:10px 6px;border:1px solid #1e3a5f;font-size:12px;font-weight:700;width:100px">'+t('القطاع')+'</th>' +
      '<th style="background:#1e3a5f;color:#fff;padding:10px 6px;border:1px solid #1e3a5f;font-size:12px;font-weight:700">'+t('الوصف')+'</th>' +
      '<th style="background:#1e3a5f;color:#fff;padding:10px 6px;border:1px solid #1e3a5f;font-size:12px;font-weight:700;width:85px">'+t('ملاحظات')+'</th>' +
    '</tr></thead>' +
    '<tbody>' + tableRowsHtml + '</tbody>' +
  '</table>';

  // Summary row
  var summaryHtml = '<div style="margin-top:14px;padding:10px 16px;background:#f1f5f9;border-radius:6px;font-size:12px;color:#475569;display:flex;justify-content:space-between;border:1px solid #e2e8f0">' +
    '<span>'+t('إجمالي المقاسات')+': <strong style="color:#1e40af">'+dataRows.length+'</strong></span>' +
    (photoRows.length ? '<span>'+t('الصور المرفقة')+': <strong style="color:#1e40af">'+photoRows.length+'</strong></span>' : '') +
    '<span>'+dateStr+'</span>' +
  '</div>';

  pa.innerHTML = styles + headerHtml + tableHtml + summaryHtml + photosHtml;

  // Wait for all images to load before printing
  var _imgs = pa.querySelectorAll('img');
  if(_imgs.length) {
    var _ld = 0, _tot = _imgs.length;
    var _dp = function() { window.print(); setTimeout(function(){ pa.innerHTML=''; }, 2000); };
    _imgs.forEach(function(img) {
      if(img.complete) { _ld++; if(_ld>=_tot) _dp(); }
      else {
        img.onload = function() { _ld++; if(_ld>=_tot) _dp(); };
        img.onerror = function() { _ld++; if(_ld>=_tot) _dp(); };
      }
    });
    setTimeout(function(){ if(_ld<_tot) _dp(); }, 5000);
  } else {
    window.print();
    setTimeout(function(){ pa.innerHTML = ''; }, 2000);
  }
}

// Auto-sync on load
_syncInstallationsFromServer().then(function(){ _checkInstNotifications(); }).catch(function(){});
// Check every 20 seconds for faster updates
setInterval(function(){
  _syncInstallationsFromServer().then(function(){ _checkInstNotifications(); }).catch(function(){});
}, 20000);


// ══════════════════════════════════════════════════
// DEFECTS / DEFICIENCIES MODULE — قسم النواقص (Enhanced)
// ══════════════════════════════════════════════════

var DEF_KEY = 'pm_defects';

function loadDefects() {
  try { return JSON.parse(localStorage.getItem(DEF_KEY) || '[]'); } catch(e) { return []; }
}

function saveDefects(arr) {
  localStorage.setItem(DEF_KEY, JSON.stringify(arr));
  return fetch('/api/data/'+DEF_KEY, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({value: arr})
  });
}

async function _syncDefectsFromServer() {
  try {
    var r = await fetch('/api/data/'+DEF_KEY);
    var j = await r.json();
    if(j.ok && j.value) {
      var serverData = Array.isArray(j.value) ? j.value : [];
      var newJson = JSON.stringify(serverData);
      var oldJson = localStorage.getItem(DEF_KEY) || '[]';
      if(typeof _os === 'function') _os.call(localStorage, DEF_KEY, newJson);
      else localStorage.setItem(DEF_KEY, newJson);
      if(typeof _cache !== 'undefined') _cache[DEF_KEY] = newJson;
      if(newJson !== oldJson) {
        try { _doRenderDefects(); } catch(e) {}
      }
    }
  } catch(e) {}
}

function renderDefects() {
  _syncDefectsFromServer().then(function(){ _doRenderDefects(); }).catch(function(){ _doRenderDefects(); });
}

// ── Defect type colors & icons ──
var _defTypeMeta = {
  'زجاج مكسور':       { icon: '\uD83E\uDE9F', color: '#dc2626' },
  'قطع ألمنيوم ناقصة': { icon: '\uD83D\uDD29', color: '#2563eb' },
  'إكسسوارات ناقصة':  { icon: '\u2699\uFE0F', color: '#7c3aed' },
  'تكملة مشروع':      { icon: '\uD83D\uDCC2', color: '#0891b2' },
  'أخرى':             { icon: '\uD83D\uDCCB', color: '#6b7280' }
};

function _defTypeChip(t) {
  var m = _defTypeMeta[t] || _defTypeMeta['أخرى'];
  return '<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;padding:2px 8px;border-radius:8px;background:'+m.color+'18;color:'+m.color+';border:1px solid '+m.color+'33;font-weight:700;white-space:nowrap">'+m.icon+' '+t+'</span>';
}

function _doRenderDefects() {
  var entries = loadDefects();
  var cu = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  var isAdmin = !cu || cu.isAdmin;
  var isSupervisor = cu && !cu.isAdmin && (cu.perms||[]).includes('page_projects');
  var _hp = function(p){ return isAdmin || (cu && (cu.perms||[]).indexOf(p) !== -1); };
  var visible = (isAdmin || isSupervisor) ? entries : entries.filter(function(e){ return e.addedBy === (cu ? cu.name : ''); });

  var listEl = document.getElementById('defList');
  var emptyEl = document.getElementById('defEmpty');
  if(!listEl) return;

  if(!visible.length) {
    listEl.innerHTML = '';
    if(emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if(emptyEl) emptyEl.style.display = 'none';

  listEl.innerHTML = visible.map(function(entry) {
    // Count items across all sections
    var totalItems = 0; var totalPhotos = 0;
    var types = entry.defectTypes || (entry.defectType ? [entry.defectType] : []);
    var sections = entry.sections || {};
    types.forEach(function(t) {
      var arr = sections[t] || [];
      arr.forEach(function(r) {
        if(r.description || r.width || r.height) totalItems++;
        if(r.serverPhoto || r.photo) totalPhotos++;
      });
    });
    // Fallback: old items array
    if(!totalItems && entry.items && entry.items.length) {
      totalItems = entry.items.filter(function(r){ return r.description || r.width || r.height; }).length;
      totalPhotos = entry.items.filter(function(r){ return r.serverPhoto || r.photo; }).length;
    }

    var statusColor = entry.status === 'confirmed' ? '#16a34a' : entry.status === 'reviewed' ? '#e0a020' : '#d97706';
    var statusText = entry.status === 'confirmed' ? t('تم التأكيد') : entry.status === 'reviewed' ? t('قيد المراجعة') : t('جديد');
    var eid = entry.id;

    // Build type chips
    var typeChips = types.map(function(t){ return _defTypeChip(t); }).join(' ');

    return '<div class="card" style="border-right:4px solid '+statusColor+';margin-bottom:12px">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:200px">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap">' +
            '<span style="font-size:18px">\uD83D\uDD27</span>' +
            '<div style="font-size:16px;font-weight:700;color:var(--text)">'+(entry.clientName||t('بدون اسم'))+'</div>' +
            '<span style="font-size:11px;padding:3px 10px;border-radius:12px;background:'+statusColor+'22;color:'+statusColor+';font-weight:700;border:1px solid '+statusColor+'44">'+statusText+'</span>' +
            '<span style="font-size:10px;padding:2px 8px;border-radius:8px;background:rgba(217,119,6,0.12);color:#d97706;border:1px solid rgba(217,119,6,0.25)">'+t('نواقص')+'</span>' +
          '</div>' +
          (typeChips ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">'+typeChips+'</div>' : '') +
          '<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--text2)">' +
            (entry.contractNo ? '<span>'+t('عقد')+': <strong>'+entry.contractNo+'</strong></span>' : '') +
            '<span>'+t('النواقص')+': <strong style="color:var(--accent3)">'+totalItems+'</strong></span>' +
            (totalPhotos ? '<span>'+t('صور')+': <strong>'+totalPhotos+'</strong></span>' : '') +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-top:6px;font-size:12px">' +
            '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:8px;background:rgba(217,119,6,0.08);color:#d97706;font-weight:700;border:1px solid rgba(217,119,6,0.15)">\uD83D\uDC64 '+(entry.addedBy||'')+'</span>' +
            '<span style="color:var(--text2);font-size:11px">'+new Date(entry.createdAt).toLocaleDateString('ar-SA')+'</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-shrink:0;align-items:center;flex-wrap:wrap">' +
          '<button class="btn btn-sm btn-primary" onclick="defOpenItems(\''+eid+'\')">\uD83D\uDD27 '+t('النواقص')+'</button>' +
          (_hp('inst_defect_pdf') ? '<button class="btn btn-sm btn-warning" onclick="defExportPDF(\''+eid+'\')">\uD83D\uDCC4 PDF</button>' : '') +
          (_hp('inst_defect_confirm') && entry.status !== 'confirmed' ?
            '<button class="btn btn-sm btn-success" onclick="defConfirm(\''+eid+'\')">'+t('تأكيد ودمج')+'</button>' : '') +
          (_hp('inst_defect_delete') ?
            '<button class="btn btn-sm btn-danger" onclick="defDelete(\''+eid+'\')" style="padding:4px 8px">\uD83D\uDDD1\uFE0F</button>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ── Add new defect entry (Enhanced with multi-type tags) ──
function defAddNew() {
  var d = loadData();
  var projects = d.projects || [];
  var cu = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;

  var modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.innerHTML = '<div class="modal" style="max-width:540px">' +
    '<div class="modal-header">' +
      '<div class="modal-title">\uD83D\uDD27 '+t('إضافة نواقص / تكملة')+'</div>' +
      '<button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest(\'.modal-bg\').remove()">\u2715</button>' +
    '</div>' +
    '<div class="modal-body">' +
      '<div class="form-group"><div class="form-label">'+t('اسم العميل / المشروع')+' <span style="color:var(--accent3)">*</span></div>' +
        '<input id="defClientName" type="text" list="defProjectsList" placeholder="'+t('اسم العميل أو ابحث بالمشاريع')+'" style="width:100%">' +
        '<datalist id="defProjectsList">'+projects.map(function(p){ return '<option value="'+(p.name||'')+'">'+t('عقد')+': '+(p.contractNo||'-')+' | '+(p.company||'')+'</option>'; }).join('')+'</datalist>' +
      '</div>' +
      '<div class="form-group"><div class="form-label">'+t('رقم العقد')+'</div>' +
        '<input id="defContractNo" type="text" placeholder="'+t('رقم العقد (يتعبأ تلقائياً)')+'" style="width:100%"></div>' +
      '<div class="form-group"><div class="form-label">'+t('أنواع النواقص')+' <span style="color:var(--accent3)">*</span></div>' +
        '<div style="display:flex;gap:6px;align-items:center">' +
          '<select id="defTypeSelect" style="flex:1">' +
            '<option value="">— '+t('اختر نوع النقص')+' —</option>' +
            '<option value="زجاج مكسور">'+t('زجاج مكسور')+'</option>' +
            '<option value="قطع ألمنيوم ناقصة">'+t('قطع ألمنيوم ناقصة')+'</option>' +
            '<option value="إكسسوارات ناقصة">'+t('إكسسوارات ناقصة')+'</option>' +
            '<option value="تكملة مشروع">'+t('تكملة مشروع')+'</option>' +
            '<option value="أخرى">'+t('أخرى')+'</option>' +
          '</select>' +
          '<button class="btn btn-sm btn-success" onclick="defAddTypeTag()" style="white-space:nowrap">\u2795 '+t('إضافة')+'</button>' +
        '</div>' +
        '<div id="defTypeTags" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;min-height:24px"></div>' +
      '</div>' +
      '<div class="form-group"><div class="form-label">'+t('ملاحظات')+'</div>' +
        '<textarea id="defNotes" rows="2" placeholder="'+t('وصف المشكلة...')+'" style="width:100%"></textarea></div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">' +
        '<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>' +
        '<button class="btn btn-warning" onclick="defSaveNew(this)">'+t('حفظ وإضافة التفاصيل')+'</button>' +
      '</div>' +
    '</div></div>';
  document.body.appendChild(modal);

  // Store selected types in a temp array on the modal
  modal._selectedTypes = [];

  setTimeout(function(){ var el=document.getElementById('defClientName'); if(el) el.focus(); }, 200);

  // Auto-fill contract when selecting from datalist
  var nameEl = document.getElementById('defClientName');
  if(nameEl) nameEl.addEventListener('change', function(){
    var p = projects.find(function(pr){ return pr.name === nameEl.value; });
    if(p && p.contractNo) document.getElementById('defContractNo').value = p.contractNo;
  });
}

function defAddTypeTag() {
  var sel = document.getElementById('defTypeSelect');
  if(!sel || !sel.value) return;
  var val = sel.value;
  var modal = sel.closest('.modal-bg');
  if(!modal || !modal._selectedTypes) return;
  // Prevent duplicates
  if(modal._selectedTypes.indexOf(val) !== -1) { notify(t('هذا النوع مضاف بالفعل'),'error'); return; }
  modal._selectedTypes.push(val);
  _renderDefTypeTags(modal);
  sel.value = '';
}

function defRemoveTypeTag(idx) {
  var container = document.getElementById('defTypeTags');
  if(!container) return;
  var modal = container.closest('.modal-bg');
  if(!modal || !modal._selectedTypes) return;
  modal._selectedTypes.splice(idx, 1);
  _renderDefTypeTags(modal);
}

function _renderDefTypeTags(modal) {
  var container = document.getElementById('defTypeTags');
  if(!container) return;
  container.innerHTML = modal._selectedTypes.map(function(t, idx) {
    var m = _defTypeMeta[t] || _defTypeMeta['أخرى'];
    return '<span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;padding:4px 10px;border-radius:10px;background:'+m.color+'18;color:'+m.color+';border:1px solid '+m.color+'44;font-weight:700">' +
      m.icon + ' ' + t +
      ' <span onclick="defRemoveTypeTag('+idx+')" style="cursor:pointer;margin-right:4px;font-size:14px;line-height:1">\u2715</span>' +
    '</span>';
  }).join('');
}

function defSaveNew(btn) {
  var name = (document.getElementById('defClientName') ? document.getElementById('defClientName').value : '').trim();
  if(!name) { notify(t('أدخل اسم العميل'),'error'); return; }
  var contractNo = (document.getElementById('defContractNo') ? document.getElementById('defContractNo').value : '').trim();
  var notes = (document.getElementById('defNotes') ? document.getElementById('defNotes').value : '');
  var cu = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  var modal = btn.closest('.modal-bg');
  var types = modal && modal._selectedTypes ? modal._selectedTypes.slice() : [];
  if(!types.length) { notify(t('اختر نوع نقص واحد على الأقل'),'error'); return; }

  // Build empty sections for each type
  var sections = {};
  types.forEach(function(t) { sections[t] = []; });

  var entry = {
    id: 'def_'+Date.now(),
    clientName: name,
    contractNo: contractNo,
    defectTypes: types,
    defectType: types[0],
    notes: notes,
    addedBy: cu ? cu.name : 'المدير',
    createdAt: new Date().toISOString(),
    status: 'new',
    sections: sections,
    items: []
  };

  var entries = loadDefects();
  entries.unshift(entry);
  saveDefects(entries);
  modal.remove();
  _doRenderDefects();
  notify(t('تم إضافة النواقص — افتح التفاصيل لإدخال البيانات'));
  setTimeout(function(){ defOpenItems(entry.id); }, 300);
}

// ── Open defect items modal (Enhanced with sections per type) ──
function defOpenItems(eid) {
  var entries = loadDefects();
  var entry = entries.find(function(e){ return e.id === eid; });
  if(!entry) { notify(t('غير موجود'),'error'); return; }

  // Migrate old format: if no defectTypes, create from defectType
  var types = entry.defectTypes || (entry.defectType ? [entry.defectType] : ['أخرى']);
  if(!entry.sections) {
    entry.sections = {};
    types.forEach(function(tp) {
      entry.sections[tp] = entry.items && entry.items.length ? entry.items.slice() : [];
    });
  }
  // Ensure all types have section arrays
  types.forEach(function(tp) {
    if(!entry.sections[tp]) entry.sections[tp] = [];
  });

  var ROWS_PER_SECTION = 5;

  var MID = 'defItemsModal_'+eid;
  var existM = document.getElementById(MID); if(existM) existM.remove();

  // Build section data with default rows
  var sectionData = {};
  types.forEach(function(tp) {
    var rows = entry.sections[tp] && entry.sections[tp].length ? entry.sections[tp] :
      Array.from({length: ROWS_PER_SECTION}, function(_, i){ return {code:'D'+String(i+1).padStart(2,'0'), width:'', height:'', description:'', notes:''}; });
    while(rows.length < ROWS_PER_SECTION) {
      var n = rows.length + 1;
      rows.push({code:'D'+String(n).padStart(2,'0'), width:'', height:'', description:'', notes:''});
    }
    sectionData[tp] = rows;
  });

  function buildRow(secKey, r, i) {
    var sk = secKey.replace(/'/g, "\\'");
    var active = r.description || r.width || r.height;
    var hasPhoto = r._localPhoto || r.serverPhoto || r.photo ? true : false;
    var _hash = _defSecHash(secKey);
    return '<tr id="defr_'+eid+'_'+_hash+'_'+i+'" style="'+(active?'':'opacity:.42')+'">' +
      '<td style="text-align:center;font-size:11px;color:var(--text2);padding:3px">'+(i+1)+'</td>' +
      '<td style="padding:3px"><input value="'+(r.code||'')+'" style="width:50px;font-weight:700;color:#d97706" oninput="defSecUpd(\''+eid+'\',\''+sk+'\','+i+',\'code\',this.value)"></td>' +
      '<td style="padding:3px"><input type="number" value="'+(r.width||'')+'" style="width:65px" placeholder="0" oninput="defSecUpd(\''+eid+'\',\''+sk+'\','+i+',\'width\',this.value);defSecAct(\''+eid+'\',\''+sk+'\','+i+')"></td>' +
      '<td style="padding:3px"><input type="number" value="'+(r.height||'')+'" style="width:65px" placeholder="0" oninput="defSecUpd(\''+eid+'\',\''+sk+'\','+i+',\'height\',this.value);defSecAct(\''+eid+'\',\''+sk+'\','+i+')"></td>' +
      '<td style="padding:3px"><input value="'+(r.description||'')+'" style="width:100%;min-width:80px" placeholder="'+t('وصف القطعة...')+'" oninput="defSecUpd(\''+eid+'\',\''+sk+'\','+i+',\'description\',this.value);defSecAct(\''+eid+'\',\''+sk+'\','+i+')"></td>' +
      '<td style="padding:3px"><input value="'+(r.notes||'')+'" style="width:80px" placeholder="'+t('ملاحظات')+'" oninput="defSecUpd(\''+eid+'\',\''+sk+'\','+i+',\'notes\',this.value)"></td>' +
      '<td style="padding:2px"><div style="display:flex;gap:2px;align-items:center">' +
        '<label style="cursor:pointer;font-size:14px;padding:2px 4px;border-radius:4px;background:'+(hasPhoto?'#d97706':'var(--surface3)')+';color:'+(hasPhoto?'#fff':'var(--text2)')+'">' +
          '\uD83D\uDCF7<input type="file" accept="image/*" capture="environment" style="display:none" onchange="defSecRowPhoto(this,\''+eid+'\',\''+sk+'\','+i+')">' +
        '</label>' +
        '<button id="dEye_'+eid+'_'+_hash+'_'+i+'" class="btn btn-sm" onclick="defViewPhoto(\''+eid+'\',\''+sk+'\','+i+')" style="padding:2px 5px;font-size:13px;display:'+(hasPhoto?'inline-flex':'none')+';background:var(--surface3);color:#d97706" title="'+t('عرض الصورة')+'">\uD83D\uDC41\uFE0F</button>' +
        '<button class="btn btn-sm btn-danger" onclick="defSecDelRow(\''+eid+'\',\''+sk+'\','+i+')" style="padding:2px 5px;font-size:11px">\u2715</button>' +
      '</div></td></tr>';
  }

  // Build sections HTML
  var sectionsHtml = types.map(function(tp) {
    var m = _defTypeMeta[tp] || _defTypeMeta['أخرى'];
    var sk = tp.replace(/'/g, "\\'");
    var rows = sectionData[tp];
    var cnt = rows.filter(function(r){ return r.description || r.width || r.height; }).length;
    return '<div style="margin-bottom:16px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:'+m.color+'15;border:1px solid '+m.color+'33;border-radius:8px 8px 0 0">' +
        '<span style="font-weight:800;font-size:14px;color:'+m.color+'">'+m.icon+' '+tp+' <span id="defSecCnt_'+eid+'_'+_defSecHash(tp)+'" style="font-size:12px;font-weight:600;color:var(--text2)">('+cnt+')</span></span>' +
        '<button class="btn btn-sm btn-success" onclick="defSecAddRow(\''+eid+'\',\''+sk+'\')" style="font-size:11px">'+t('سطر')+' +</button>' +
      '</div>' +
      '<table style="width:100%;border-collapse:collapse;min-width:560px">' +
        '<thead><tr style="background:var(--surface3)">' +
          '<th style="padding:5px 3px;border:1px solid var(--border);width:28px">#</th>' +
          '<th style="padding:5px;border:1px solid var(--border);width:50px">'+t('الرمز')+'</th>' +
          '<th style="padding:5px;border:1px solid var(--border);width:70px">'+t('عرض')+'</th>' +
          '<th style="padding:5px;border:1px solid var(--border);width:70px">'+t('ارتفاع')+'</th>' +
          '<th style="padding:5px;border:1px solid var(--border)">'+t('الوصف')+'</th>' +
          '<th style="padding:5px;border:1px solid var(--border);width:80px">'+t('ملاحظات')+'</th>' +
          '<th style="padding:5px;border:1px solid var(--border);width:60px">\uD83D\uDCF7/\u2715</th>' +
        '</tr></thead>' +
        '<tbody id="defSecBody_'+eid+'_'+_defSecHash(tp)+'">'+rows.map(function(r,i){ return buildRow(tp, r, i); }).join('')+'</tbody>' +
      '</table>' +
    '</div>';
  }).join('');

  var totalItems = 0;
  types.forEach(function(tp) {
    totalItems += sectionData[tp].filter(function(r){ return r.description || r.width || r.height; }).length;
  });

  var modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.id = MID;
  modal.innerHTML = '<div class="modal" style="max-width:1100px;width:97vw;max-height:100vh">' +
    '<div class="modal-header">' +
      '<div class="modal-title">\uD83D\uDD27 '+t('نواقص')+' — '+entry.clientName+'</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">' +
        '<button class="btn btn-sm btn-primary" onclick="defSaveItems(\''+eid+'\')">\uD83D\uDCBE '+t('حفظ')+'</button>' +
        '<button class="btn btn-sm btn-warning" onclick="defExportPDF(\''+eid+'\')">\uD83D\uDCC4 PDF</button>' +
        '<button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest(\'.modal-bg\').remove()">\u2715</button>' +
      '</div>' +
    '</div>' +
    '<div class="modal-body" style="padding:0">' +
      '<div style="padding:8px 16px;background:var(--surface3);font-size:12px;border-bottom:1px solid var(--border);display:flex;gap:16px;flex-wrap:wrap;align-items:center">' +
        '<span>'+t('العميل')+': <strong style="color:#d97706">'+entry.clientName+'</strong></span>' +
        (entry.contractNo ? '<span>'+t('العقد')+': <strong>'+entry.contractNo+'</strong></span>' : '') +
        '<span id="defTotalCnt_'+eid+'" style="color:var(--accent3);font-weight:700">'+t('إجمالي النواقص')+': '+totalItems+'</span>' +
      '</div>' +
      '<div style="overflow:auto;height:calc(100vh - 160px);padding:8px;-webkit-overflow-scrolling:touch">' +
        sectionsHtml +
      '</div>' +
    '</div></div>';

  document.body.appendChild(modal);
  modal._sectionData = sectionData;
  modal._types = types;
  modal._buildRow = buildRow;
  modal._entryId = eid;
}

// Hash helper for section key to use in IDs
function _defSecHash(s) {
  var h = 0;
  for(var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h).toString(36);
}

function defSecUpd(eid, secKey, i, field, val) {
  var modal = document.getElementById('defItemsModal_'+eid);
  if(!modal || !modal._sectionData || !modal._sectionData[secKey]) return;
  if(!modal._sectionData[secKey][i]) return;
  modal._sectionData[secKey][i][field] = val;
  modal._autoSaveDirty = true;
}

function defSecAct(eid, secKey, i) {
  var hash = _defSecHash(secKey);
  var tr = document.getElementById('defr_'+eid+'_'+hash+'_'+i);
  var modal = document.getElementById('defItemsModal_'+eid);
  if(!tr || !modal || !modal._sectionData[secKey]) return;
  var r = modal._sectionData[secKey][i];
  tr.style.opacity = (r.description || r.width || r.height) ? '1' : '.42';
}

function defSecAddRow(eid, secKey) {
  var modal = document.getElementById('defItemsModal_'+eid);
  if(!modal || !modal._sectionData[secKey]) return;
  var n = modal._sectionData[secKey].length + 1;
  modal._sectionData[secKey].push({code:'D'+String(n).padStart(2,'0'), width:'', height:'', description:'', notes:''});
  var hash = _defSecHash(secKey);
  var tbody = document.getElementById('defSecBody_'+eid+'_'+hash);
  if(tbody) {
    var rows = modal._sectionData[secKey];
    tbody.insertAdjacentHTML('beforeend', modal._buildRow(secKey, rows[rows.length-1], rows.length-1));
  }
}

function defSecDelRow(eid, secKey, i) {
  var modal = document.getElementById('defItemsModal_'+eid);
  if(!modal || !modal._sectionData[secKey]) return;
  modal._sectionData[secKey].splice(i, 1);
  var hash = _defSecHash(secKey);
  var tbody = document.getElementById('defSecBody_'+eid+'_'+hash);
  if(tbody) {
    tbody.innerHTML = modal._sectionData[secKey].map(function(r, j){ return modal._buildRow(secKey, r, j); }).join('');
  }
}

function defSecRowPhoto(input, eid, secKey, i) {
  var file = input.files[0]; if(!file) return;
  var modal = document.getElementById('defItemsModal_'+eid);
  if(!modal || !modal._sectionData[secKey] || !modal._sectionData[secKey][i]) return;

  // Preview locally while uploading
  var reader = new FileReader();
  reader.onload = function(e) {
    modal._sectionData[secKey][i]._localPhoto = e.target.result;
    var hash = _defSecHash(secKey);
    var tr = document.getElementById('defr_'+eid+'_'+hash+'_'+i);
    if(tr) {
      var lbl=tr.querySelector('label'); if(lbl){lbl.style.background='#d97706';lbl.style.color='#fff';}
      var eyeBtn=document.getElementById('dEye_'+eid+'_'+hash+'_'+i);
      if(eyeBtn) eyeBtn.style.display='inline-flex';
    }
  };
  reader.readAsDataURL(file);

  // Upload to server and save path
  var entries = loadDefects();
  var entry = entries.find(function(e){return e.id===eid;});
  if(entry){
    var fd = new FormData();
    fd.append('files', file);
    var q = new URLSearchParams({
      name: entry.clientName||'بدون', contractNo: entry.contractNo||'',
      company:'', region:'', gallery:'', subfolder:'نواقص'
    });
    fetch('/api/upload-site-photo?'+q.toString(),{method:'POST',body:fd})
      .then(function(r){return r.json();})
      .then(function(j){
        if(j.ok){
          modal._sectionData[secKey][i].serverPhoto = j.path;
          notify(t('✅ تم رفع صورة — سطر')+' '+(i+1));
        } else {
          notify('⚠️ '+t('فشل رفع الصورة'),'error');
        }
      })
      .catch(function(){
        notify('⚠️ '+t('فشل رفع الصورة'),'error');
      });
  }
  input.value='';
}

// ── View defect photo fullscreen ──
function defViewPhoto(eid, secKey, i) {
  var modal = document.getElementById('defItemsModal_'+eid);
  if(!modal||!modal._sectionData||!modal._sectionData[secKey]||!modal._sectionData[secKey][i]) return;
  var r = modal._sectionData[secKey][i];
  var photo = r._localPhoto || (r.serverPhoto ? '/api/file?path='+encodeURIComponent(r.serverPhoto) : '') || r.photo;
  if(!photo) return;
  var code = r.code||'';
  var desc = r.description||'';
  var ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;cursor:zoom-out';
  ov.innerHTML='<div style="text-align:center;max-width:95vw;max-height:95vh">' +
    '<img src="'+photo+'" style="max-width:90vw;max-height:82vh;object-fit:contain;border-radius:8px;box-shadow:0 4px 30px rgba(0,0,0,.5)">' +
    '<div style="margin-top:10px;color:#fff;font-size:14px;font-family:Cairo,sans-serif">'+code+(desc?' — '+desc:'')+' <span style="opacity:.5">('+secKey+')</span></div>' +
  '</div>';
  ov.onclick=function(e){if(e.target===ov)ov.remove();};
  document.body.appendChild(ov);
}

// Legacy helpers for old data format
function defUpd(eid, i, field, val) {
  var modal = document.getElementById('defItemsModal_'+eid);
  if(!modal) return;
  // Try old format
  if(modal._rows && modal._rows[i]) { modal._rows[i][field] = val; }
}
function defAct(eid, i) {
  var tr = document.getElementById('defr_'+eid+'_'+i);
  var modal = document.getElementById('defItemsModal_'+eid);
  if(!tr||!modal) return;
  if(modal._rows && modal._rows[i]) {
    var r = modal._rows[i];
    tr.style.opacity = (r.description||r.width||r.height) ? '1' : '.42';
  }
}
function defAddRow(eid) {
  // Redirect to first section
  var modal = document.getElementById('defItemsModal_'+eid);
  if(modal && modal._types && modal._types.length) defSecAddRow(eid, modal._types[0]);
}
function defDelRow(eid, i) {}
function defRowPhoto(input, eid, i) {}

function _cleanPhotoRow(r) {
  var clean = {code:r.code,width:r.width,height:r.height,description:r.description,notes:r.notes};
  if(r.sectionName) clean.sectionName = r.sectionName;
  if(r.serverPhoto) clean.serverPhoto = r.serverPhoto;
  return clean;
}

function defSaveItems(eid) {
  var modal = document.getElementById('defItemsModal_'+eid);
  if(!modal) return;
  var entries = loadDefects();
  var entry = entries.find(function(e){ return e.id === eid; });
  if(!entry) return;

  // Check all photos uploaded before saving
  var pendingCount = 0;
  if(modal._sectionData) {
    var types = modal._types || [];
    types.forEach(function(t) {
      (modal._sectionData[t]||[]).forEach(function(r){
        if(r._localPhoto && !r.serverPhoto) pendingCount++;
      });
    });
  }
  if(pendingCount){
    notify('⚠️ '+t('انتظر اكتمال رفع الصور')+' ('+pendingCount+')','error');
    return;
  }

  var totalCnt = 0;
  if(modal._sectionData) {
    entry.sections = {};
    var types = modal._types || [];
    types.forEach(function(t) {
      // Strip base64 data — keep only serverPhoto path
      entry.sections[t] = (modal._sectionData[t]||[]).map(_cleanPhotoRow);
      var cnt = entry.sections[t].filter(function(r){ return r.description || r.width || r.height; }).length;
      totalCnt += cnt;
    });
    entry.defectTypes = types;
    // Also flatten to items for backward compat
    var allItems = [];
    types.forEach(function(t) {
      (entry.sections[t]||[]).forEach(function(r) {
        var copy = _cleanPhotoRow(r);
        copy.sectionType = t;
        allItems.push(copy);
      });
    });
    entry.items = allItems;
  } else if(modal._rows) {
    entry.items = modal._rows.map(_cleanPhotoRow);
    totalCnt = entry.items.filter(function(r){return r.description||r.width||r.height;}).length;
  }

  // Save and wait for server sync
  saveDefects(entries)
    .then(function(r){ return r.json(); })
    .then(function(j){
      if(j.ok){
        notify(t('✅ تم حفظ')+' '+totalCnt+' '+t('نقص — تمت المزامنة'));
        _doRenderDefects();
        modal.remove();
      } else {
        notify('⚠️ '+t('حفظ محلي تم — خطأ بالمزامنة'),'error');
      }
    })
    .catch(function(){
      notify('⚠️ '+t('حفظ محلي تم — خطأ بالمزامنة'),'error');
    });
}

// ── Confirm defect and merge into project ──
function defConfirm(eid) {
  var entries = loadDefects();
  var entry = entries.find(function(e){ return e.id === eid; });
  if(!entry) return;

  var d = loadData();
  var projects = d.projects;
  var existingProject = null;
  if(entry.contractNo) existingProject = projects.find(function(p){ return p.contractNo === entry.contractNo; });
  if(!existingProject && entry.clientName) existingProject = projects.find(function(p){ return p.name === entry.clientName; });

  if(!existingProject) {
    defMergeSearch(eid);
    return;
  }

  // Count all items across sections
  var totalItems = 0;
  var types = entry.defectTypes || (entry.defectType ? [entry.defectType] : []);
  var sections = entry.sections || {};
  types.forEach(function(t) {
    totalItems += (sections[t]||[]).filter(function(r){return r.description||r.width||r.height;}).length;
  });
  if(!totalItems && entry.items) {
    totalItems = entry.items.filter(function(r){return r.description||r.width||r.height;}).length;
  }

  if(!confirm(t('دمج')+' '+totalItems+' '+t('نقص مع مشروع')+' "'+existingProject.name+'"؟\n\n'+t('ستُضاف كنواقص/تكملة في ملف المقاسات'))) return;
  _doDefMerge(entry, existingProject, entries);
}

function _doDefMerge(entry, project, entries) {
  var measKey = 'pm_meas_' + project.id;
  var existingMeas = [];
  try { existingMeas = JSON.parse(localStorage.getItem(measKey)||'[]'); } catch(e){}
  if(!Array.isArray(existingMeas)) existingMeas = [];

  var newItems = [];
  var types = entry.defectTypes || (entry.defectType ? [entry.defectType] : []);
  var sections = entry.sections || {};

  types.forEach(function(t) {
    (sections[t]||[]).filter(function(r){return r.description||r.width||r.height;}).forEach(function(r) {
      var item = {};
      for(var k in r) { item[k] = r[k]; }
      item.isDefect = true;
      item.defectType = t;
      item.defectDate = new Date().toISOString().slice(0,10);
      newItems.push(item);
    });
  });

  // Fallback: old items array
  if(!newItems.length && entry.items) {
    newItems = entry.items.filter(function(r){return r.description||r.width||r.height;}).map(function(r) {
      var item = {};
      for(var k in r) { item[k] = r[k]; }
      item.isDefect = true;
      item.defectType = entry.defectType || 'نواقص';
      item.defectDate = new Date().toISOString().slice(0,10);
      return item;
    });
  }

  localStorage.setItem(measKey, JSON.stringify(existingMeas.concat(newItems)));

  // Create subfolder "نواقص" on server
  fetch('/api/client-folder', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      name: project.name || entry.clientName || '',
      contractNo: project.contractNo || entry.contractNo || '',
      company: project.company || '',
      region: project.region || '',
      gallery: project.gallery || '',
      subfolder: 'نواقص'
    })
  }).catch(function(){});

  entry.status = 'confirmed';
  entry.confirmedAt = new Date().toISOString();
  entry.linkedProjectId = project.id;
  saveDefects(entries);
  _doRenderDefects();
  notify(t('تم دمج')+' '+newItems.length+' '+t('نقص مع مشروع')+': '+project.name);
}

function defMergeSearch(eid) {
  var entries = loadDefects();
  var entry = entries.find(function(e){ return e.id === eid; });
  if(!entry) return;
  var d = loadData();
  var projects = d.projects.filter(function(p){ return !p.pendingReview; });

  var modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.innerHTML = '<div class="modal" style="max-width:520px">' +
    '<div class="modal-header">' +
      '<div class="modal-title">\uD83D\uDD17 '+t('دمج النواقص مع مشروع')+'</div>' +
      '<button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest(\'.modal-bg\').remove()">\u2715</button>' +
    '</div>' +
    '<div class="modal-body">' +
      '<div class="form-group"><div class="form-label">'+t('ابحث باسم العميل أو رقم العقد')+'</div>' +
        '<input id="defMergeQ" type="text" placeholder="'+t('اكتب للبحث...')+'" style="width:100%" oninput="defMergeFilter(\''+eid+'\')">' +
      '</div>' +
      '<div id="defMergeResults" style="max-height:300px;overflow-y:auto;margin-top:8px">' +
        _buildDefMergeList(projects, eid) +
      '</div>' +
    '</div></div>';
  document.body.appendChild(modal);
}

function _buildDefMergeList(projects, eid) {
  if(!projects.length) return '<div style="text-align:center;padding:20px;color:var(--text2)">'+t('لا توجد نتائج')+'</div>';
  return projects.map(function(p) {
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px">' +
      '<div><div style="font-weight:700">'+(p.name||'')+'</div>' +
        '<div style="font-size:11px;color:var(--text2)">'+(p.contractNo?t('عقد')+': '+p.contractNo+' | ':'')+
          (p.company||'')+'</div></div>' +
      '<button class="btn btn-sm btn-success" onclick="defDoMerge(\''+eid+'\',\''+p.id+'\',this)">\uD83D\uDD17 '+t('دمج')+'</button>' +
    '</div>';
  }).join('');
}

function defMergeFilter(eid) {
  var q = (document.getElementById('defMergeQ') ? document.getElementById('defMergeQ').value : '').toLowerCase().trim();
  var d = loadData();
  var projects = d.projects.filter(function(p){
    if(p.pendingReview) return false;
    if(!q) return true;
    return ((p.name||'')+' '+(p.contractNo||'')+' '+(p.company||'')).toLowerCase().indexOf(q) !== -1;
  });
  var el = document.getElementById('defMergeResults');
  if(el) el.innerHTML = _buildDefMergeList(projects, eid);
}

function defDoMerge(eid, projectId, btn) {
  var entries = loadDefects();
  var entry = entries.find(function(e){ return e.id === eid; });
  if(!entry) return;
  var d = loadData();
  var project = d.projects.find(function(p){ return p.id === projectId; });
  if(!project) return;

  // Count items
  var totalItems = 0;
  var types = entry.defectTypes || (entry.defectType ? [entry.defectType] : []);
  var sections = entry.sections || {};
  types.forEach(function(t) {
    totalItems += (sections[t]||[]).filter(function(r){return r.description||r.width||r.height;}).length;
  });
  if(!totalItems && entry.items) {
    totalItems = entry.items.filter(function(r){return r.description||r.width||r.height;}).length;
  }
  if(!totalItems) { notify(t('لا توجد نواقص'),'error'); return; }
  if(!confirm(t('دمج')+' '+totalItems+' '+t('نقص مع')+' "'+project.name+'"؟')) return;
  _doDefMerge(entry, project, entries);
  var modal = btn.closest('.modal-bg');
  if(modal) modal.remove();
}

function defDelete(eid) {
  var entries = loadDefects();
  var entry = entries.find(function(e){ return e.id === eid; });
  if(!entry) return;
  if(!confirm(t('حذف النواقص؟')+'\n'+entry.clientName)) return;
  entries = entries.filter(function(e){ return e.id !== eid; });
  saveDefects(entries);
  _doRenderDefects();
  notify(t('تم الحذف'));
}

// ── PDF Export for defects (Enhanced with sections) ──
function defExportPDF(eid) {
  var entries = loadDefects();
  var entry = entries.find(function(e){ return e.id === eid; });
  if(!entry) return;

  var modal = document.getElementById('defItemsModal_'+eid);
  var types = entry.defectTypes || (entry.defectType ? [entry.defectType] : ['أخرى']);
  var sections = {};
  if(modal && modal._sectionData) {
    sections = modal._sectionData;
  } else {
    sections = entry.sections || {};
  }

  // Collect all data rows across sections
  var allDataRows = [];
  var allPhotoRows = [];
  types.forEach(function(t) {
    var rows = sections[t] || [];
    rows.forEach(function(r) {
      if(r.description || r.width || r.height) {
        r._sectionType = t;
        allDataRows.push(r);
        if(r._localPhoto || r.serverPhoto || r.photo) allPhotoRows.push(r);
      }
    });
  });

  // Fallback old items
  if(!allDataRows.length && entry.items) {
    allDataRows = entry.items.filter(function(r){ return r.description || r.width || r.height; });
    allPhotoRows = entry.items.filter(function(r){ return (r._localPhoto||r.serverPhoto||r.photo) && (r.description||r.width||r.height); });
  }

  if(!allDataRows.length) { notify(t('لا توجد نواقص'),'error'); return; }

  var dateStr = entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('ar-SA') : '';

  // Build table sections
  var tablesHtml = types.map(function(tp) {
    var m = _defTypeMeta[tp] || _defTypeMeta['أخرى'];
    var rows = (sections[tp]||[]).filter(function(r){ return r.description || r.width || r.height; });
    if(!rows.length) return '';
    var rowsHtml = rows.map(function(r, i) {
      var bg = i%2===0 ? '#fff' : '#fef3c7';
      return '<tr style="background:'+bg+'">'+
        '<td style="text-align:center;padding:7px;border:1px solid #cbd5e1;font-weight:700">'+(i+1)+'</td>'+
        '<td style="padding:7px;border:1px solid #cbd5e1;font-weight:800;color:#92400e">'+(r.code||'')+'</td>'+
        '<td style="text-align:center;padding:7px;border:1px solid #cbd5e1">'+(r.width||'-')+'</td>'+
        '<td style="text-align:center;padding:7px;border:1px solid #cbd5e1">'+(r.height||'-')+'</td>'+
        '<td style="padding:7px;border:1px solid #cbd5e1">'+(r.description||'')+'</td>'+
        '<td style="padding:7px;border:1px solid #cbd5e1;font-size:11px;color:#64748b">'+(r.notes||'')+'</td>'+
      '</tr>';
    }).join('');

    return '<div style="margin-bottom:16px">' +
      '<div style="font-size:14px;font-weight:800;color:'+m.color+';padding:6px 0;border-bottom:2px solid '+m.color+'">'+m.icon+' '+tp+' ('+rows.length+')</div>' +
      '<table><thead><tr>'+
        '<th style="background:#92400e;color:#fff;padding:8px;border:1px solid #92400e;font-size:12px;width:35px">#</th>'+
        '<th style="background:#92400e;color:#fff;padding:8px;border:1px solid #92400e;font-size:12px;width:55px">'+t('الرمز')+'</th>'+
        '<th style="background:#92400e;color:#fff;padding:8px;border:1px solid #92400e;font-size:12px;width:65px">'+t('عرض')+'</th>'+
        '<th style="background:#92400e;color:#fff;padding:8px;border:1px solid #92400e;font-size:12px;width:65px">'+t('ارتفاع')+'</th>'+
        '<th style="background:#92400e;color:#fff;padding:8px;border:1px solid #92400e;font-size:12px">'+t('الوصف')+'</th>'+
        '<th style="background:#92400e;color:#fff;padding:8px;border:1px solid #92400e;font-size:12px;width:80px">'+t('ملاحظات')+'</th>'+
      '</tr></thead><tbody>'+rowsHtml+'</tbody></table></div>';
  }).join('');

  var photosHtml = '';
  if(allPhotoRows.length) {
    photosHtml = '<div style="page-break-before:always;padding-top:12px">'+
      '<div style="font-size:16px;font-weight:800;color:#92400e;border-bottom:3px solid #92400e;padding-bottom:8px;margin-bottom:14px">'+t('صور النواقص')+'</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'+
      allPhotoRows.map(function(r){ var src=r._localPhoto||(r.serverPhoto?'/api/file?path='+encodeURIComponent(r.serverPhoto):'')||r.photo||''; return '<div style="text-align:center;border:1px solid #e2e8f0;border-radius:8px;padding:8px;break-inside:avoid"><img src="'+src+'" style="max-width:100%;max-height:260px;object-fit:contain;border-radius:4px"><div style="margin-top:6px;font-size:12px;color:#92400e;font-weight:700">'+(r.code||'')+' — '+(r.description||'')+' ('+(r._sectionType||'')+')</div></div>'; }).join('')+
      '</div></div>';
  }

  var typesLine = types.join(' / ');
  var pa = document.getElementById('printArea');
  pa.innerHTML = '<style>@page{size:A4;margin:12mm}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}body{font-family:Cairo,sans-serif;direction:rtl;color:#1e293b;background:#fff;margin:0}table{width:100%;border-collapse:collapse}img{max-width:100%}tr{page-break-inside:avoid}</style>'+
    '<div style="border-bottom:3px solid #92400e;padding-bottom:10px;margin-bottom:14px">'+
      '<div style="font-size:22px;font-weight:900;color:#92400e">\uD83D\uDD27 '+t('تقرير النواقص والتكملة')+'</div>'+
      '<div style="font-size:14px;color:#334155;margin-top:4px"><strong>'+t('العميل')+':</strong> <span style="color:#92400e;font-weight:800">'+(entry.clientName||'')+'</span>'+
        (entry.contractNo ? ' | <strong>'+t('العقد')+':</strong> '+entry.contractNo : '')+
        ' | <strong>'+t('الأنواع')+':</strong> '+typesLine+
      '</div>'+
      '<div style="font-size:12px;color:#64748b;margin-top:2px">'+t('التاريخ')+': '+dateStr+' | '+t('إجمالي')+': <strong style="color:#92400e">'+allDataRows.length+'</strong>'+(entry.addedBy?' | '+t('الفني')+': <strong>'+entry.addedBy+'</strong>':'')+'</div>'+
    '</div>'+
    tablesHtml + photosHtml;

  // Wait for all images to load before printing
  var imgs = pa.querySelectorAll('img');
  if(imgs.length) {
    var loaded = 0;
    var total = imgs.length;
    var doPrint = function() {
      window.print();
      setTimeout(function(){ pa.innerHTML=''; }, 2000);
    };
    imgs.forEach(function(img) {
      if(img.complete) { loaded++; if(loaded>=total) doPrint(); }
      else {
        img.onload = function() { loaded++; if(loaded>=total) doPrint(); };
        img.onerror = function() { loaded++; if(loaded>=total) doPrint(); };
      }
    });
    // Fallback timeout in case images take too long
    setTimeout(function(){ if(loaded<total) doPrint(); }, 5000);
  } else {
    window.print();
    setTimeout(function(){ pa.innerHTML=''; }, 2000);
  }
}


// ══════════════════════════════════════════════════
// MAINTENANCE ORDERS MODULE — أوامر الصيانة
// ══════════════════════════════════════════════════

var MAINT_KEY = 'pm_maintenance';

function loadMaintOrders() {
  try { return JSON.parse(localStorage.getItem(MAINT_KEY) || '[]'); } catch(e) { return []; }
}

function saveMaintOrders(arr) {
  localStorage.setItem(MAINT_KEY, JSON.stringify(arr));
  fetch('/api/data/'+MAINT_KEY, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({value: arr})
  }).catch(function(){});
}

async function _syncMaintFromServer() {
  try {
    var r = await fetch('/api/data/'+MAINT_KEY);
    var j = await r.json();
    if(j.ok && j.value) {
      var serverData = Array.isArray(j.value) ? j.value : [];
      var newJson = JSON.stringify(serverData);
      var oldJson = localStorage.getItem(MAINT_KEY) || '[]';
      if(typeof _os === 'function') _os.call(localStorage, MAINT_KEY, newJson);
      else localStorage.setItem(MAINT_KEY, newJson);
      if(typeof _cache !== 'undefined') _cache[MAINT_KEY] = newJson;
      if(newJson !== oldJson) {
        try { _doRenderMaintOrders(); } catch(e) {}
      }
    }
  } catch(e) {}
}

// ── Render maintenance orders ──
function renderMaintOrders() {
  _syncMaintFromServer().then(function(){ _doRenderMaintOrders(); }).catch(function(){ _doRenderMaintOrders(); });
}

function _doRenderMaintOrders() {
  var orders = loadMaintOrders();
  var cu = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  var isAdmin = !cu || cu.isAdmin;
  var isSupervisor = cu && !cu.isAdmin && (cu.perms||[]).includes('page_projects');

  // Technician sees only their assigned orders
  var visible;
  if(isAdmin || isSupervisor) {
    visible = orders;
  } else {
    visible = orders.filter(function(o){ return o.assignedTo === (cu ? cu.name : ''); });
  }

  var listEl = document.getElementById('maintList');
  var emptyEl = document.getElementById('maintEmpty');
  if(!listEl) return;

  if(!visible.length) {
    listEl.innerHTML = '';
    if(emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if(emptyEl) emptyEl.style.display = 'none';

  listEl.innerHTML = visible.map(function(order) {
    var oid = order.id;
    var statusColor = order.status === 'completed' ? '#16a34a' : order.status === 'in_progress' ? '#2563eb' : '#d97706';
    var statusText = order.status === 'completed' ? t('مكتمل') : order.status === 'in_progress' ? t('قيد التنفيذ') : t('معلق');
    var statusIcon = order.status === 'completed' ? '\u2705' : order.status === 'in_progress' ? '\uD83D\uDD04' : '\u23F3';
    var attachCount = order.attachments ? order.attachments.length : 0;

    var _hasMaintPerm = function(perm) {
      if(isAdmin) return true;
      return cu && (cu.perms||[]).indexOf(perm) !== -1;
    };
    var actionBtns = '';
    if(_hasMaintPerm('inst_maint_edit')) {
      actionBtns += '<button class="btn btn-sm" onclick="maintEdit(\''+oid+'\')" style="background:#6366f1;color:#fff;border-color:#6366f1">\u270F\uFE0F '+t('تعديل')+'</button>';
    }
    if(_hasMaintPerm('inst_maint_delete')) {
      actionBtns += '<button class="btn btn-sm btn-danger" onclick="maintDelete(\''+oid+'\')" style="padding:4px 8px">\uD83D\uDDD1\uFE0F</button>';
    }
    if(!isAdmin && !isSupervisor) {
      // Technician buttons
      if(order.status === 'pending') {
        actionBtns += '<button class="btn btn-sm btn-primary" onclick="maintStart(\''+oid+'\')">\u25B6 '+t('بدء العمل')+'</button>';
      }
      if((order.status === 'pending' || order.status === 'in_progress') && _hasMaintPerm('inst_maint_complete')) {
        actionBtns += '<button class="btn btn-sm btn-success" onclick="maintComplete(\''+oid+'\')">\u2705 '+t('إنجاز')+'</button>';
      }
    }
    // Admin can also complete
    if((isAdmin || isSupervisor) && order.status !== 'completed') {
      actionBtns += '<button class="btn btn-sm btn-success" onclick="maintComplete(\''+oid+'\')">\u2705 '+t('إنجاز')+'</button>';
    }
    // Print delivery for completed orders
    if(order.status === 'completed' && _hasMaintPerm('inst_maint_print')) {
      actionBtns += '<button class="btn btn-sm btn-primary" onclick="maintPrintDelivery(\''+oid+'\')">\uD83D\uDDA8\uFE0F '+t('طباعة تسليم')+'</button>';
    }

    return '<div class="card" style="border-right:4px solid '+statusColor+';margin-bottom:12px">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:200px">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap">' +
            '<span style="font-size:18px">\uD83D\uDEE0\uFE0F</span>' +
            '<div style="font-size:16px;font-weight:700;color:var(--text)">'+(order.clientName||t('بدون اسم'))+'</div>' +
            '<span style="font-size:11px;padding:3px 10px;border-radius:12px;background:'+statusColor+'22;color:'+statusColor+';font-weight:700;border:1px solid '+statusColor+'44">'+statusIcon+' '+statusText+'</span>' +
          '</div>' +
          '<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--text2)">' +
            (order.contractNo ? '<span>'+t('عقد')+': <strong>'+order.contractNo+'</strong></span>' : '') +
            (order.company ? '<span>'+t('الشركة')+': <strong>'+order.company+'</strong></span>' : '') +
            (order.region ? '<span>'+t('المنطقة')+': <strong>'+order.region+'</strong></span>' : '') +
            (order.gallery ? '<span>'+t('المعرض')+': <strong>'+order.gallery+'</strong></span>' : '') +
            (attachCount ? '<span>'+t('مرفقات')+': <strong>'+attachCount+'</strong></span>' : '') +
          '</div>' +
          (order.description ? '<div style="margin-top:6px;font-size:12px;color:var(--text);background:var(--surface3);padding:6px 10px;border-radius:6px;border:1px solid var(--border)">'+order.description.substring(0,120)+(order.description.length>120?'...':'')+'</div>' : '') +
          '<div style="display:flex;align-items:center;gap:8px;margin-top:6px;font-size:12px;flex-wrap:wrap">' +
            '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:8px;background:rgba(37,99,235,0.08);color:#2563eb;font-weight:700;border:1px solid rgba(37,99,235,0.15)">\uD83D\uDC77 '+(order.assignedTo||t('غير محدد'))+'</span>' +
            (order.phone ? '<span style="color:var(--text2)">\uD83D\uDCDE '+order.phone+'</span>' : '') +
            '<span style="color:var(--text2);font-size:11px">'+new Date(order.createdAt).toLocaleDateString('ar-SA')+'</span>' +
            (order.createdBy ? '<span style="color:var(--text2);font-size:11px">'+t('بواسطة')+': '+order.createdBy+'</span>' : '') +
          '</div>' +
          (order.status === 'completed' && order.techNotes ? '<div style="margin-top:6px;font-size:11px;background:rgba(22,163,106,0.08);color:#16a34a;padding:4px 10px;border-radius:6px;border:1px solid rgba(22,163,106,0.2)"><strong>'+t('ملاحظات الفني')+':</strong> '+order.techNotes+'</div>' : '') +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-shrink:0;align-items:center;flex-wrap:wrap">' +
          actionBtns +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  _checkMaintNotifications();
}

// ── Create new maintenance order (Admin/Supervisor only) ──
function maintAddNew() {
  var cu = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  var isAdmin = !cu || cu.isAdmin;
  var isSupervisor = cu && !cu.isAdmin && (cu.perms||[]).includes('page_projects');
  var hasMaintPerm = cu && (cu.perms||[]).includes('inst_maint_new');
  if(!isAdmin && !isSupervisor && !hasMaintPerm) { notify(t('ليس لديك صلاحية إنشاء أوامر الصيانة'),'error'); return; }

  var d = loadData();
  var projects = d.projects || [];
  var companies = d.companies || [];
  var regions = d.regions || [];
  var galleries = d.galleries || [];
  var users = [];
  try { users = JSON.parse(localStorage.getItem('pm_users')||'[]'); } catch(e){}

  var userOpts = users.map(function(u){ return '<option value="'+(u.name||'')+'">'+(u.name||'')+(u.isAdmin?' ('+t('مدير')+')':'')+' — '+(u.username||'')+'</option>'; }).join('');
  var companyOpts = companies.map(function(c){ return '<option>'+c+'</option>'; }).join('');
  var regionOpts = regions.map(function(r){ return '<option>'+r+'</option>'; }).join('');
  var galleryOpts = galleries.map(function(g){ return '<option>'+g+'</option>'; }).join('');

  var modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.innerHTML = '<div class="modal" style="max-width:580px">' +
    '<div class="modal-header">' +
      '<div class="modal-title">\uD83D\uDEE0\uFE0F '+t('أمر صيانة جديد')+'</div>' +
      '<button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest(\'.modal-bg\').remove()">\u2715</button>' +
    '</div>' +
    '<div class="modal-body">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
        '<div class="form-group" style="grid-column:1/-1"><div class="form-label">'+t('اختر الفني')+' <span style="color:var(--accent3)">*</span></div>' +
          '<select id="maintAssignee" style="width:100%"><option value="">— '+t('اختر الفني')+' —</option>'+userOpts+'</select></div>' +
        '<div class="form-group"><div class="form-label">'+t('اسم العميل')+' <span style="color:var(--accent3)">*</span></div>' +
          '<input id="maintClient" type="text" list="maintProjectsList" placeholder="'+t('اسم العميل')+'" style="width:100%">' +
          '<datalist id="maintProjectsList">'+projects.map(function(p){ return '<option value="'+(p.name||'')+'">'+t('عقد')+': '+(p.contractNo||'-')+'</option>'; }).join('')+'</datalist></div>' +
        '<div class="form-group"><div class="form-label">'+t('رقم العقد')+'</div>' +
          '<input id="maintContract" type="text" placeholder="'+t('رقم العقد')+'" style="width:100%"></div>' +
        '<div class="form-group"><div class="form-label">'+t('الشركة')+'</div>' +
          '<select id="maintCompany" style="width:100%"><option value="">— '+t('اختر')+' —</option>'+companyOpts+'</select></div>' +
        '<div class="form-group"><div class="form-label">'+t('المنطقة')+'</div>' +
          '<select id="maintRegion" style="width:100%"><option value="">— '+t('اختر')+' —</option>'+regionOpts+'</select></div>' +
        '<div class="form-group"><div class="form-label">'+t('المعرض')+'</div>' +
          '<select id="maintGallery" style="width:100%"><option value="">— '+t('اختر')+' —</option>'+galleryOpts+'</select></div>' +
        '<div class="form-group"><div class="form-label">'+t('رقم الهاتف')+'</div>' +
          '<input id="maintPhone" type="tel" placeholder="05xxxxxxxx" style="width:100%"></div>' +
        '<div class="form-group" style="grid-column:1/-1"><div class="form-label">'+t('الموقع / لوكيشن')+'</div>' +
          '<input id="maintLocation" type="text" placeholder="'+t('العنوان أو الإحداثيات')+'" style="width:100%"></div>' +
        '<div class="form-group" style="grid-column:1/-1"><div class="form-label">'+t('وصف الصيانة المطلوبة')+' <span style="color:var(--accent3)">*</span></div>' +
          '<textarea id="maintDesc" rows="3" placeholder="'+t('اشرح المشكلة أو العمل المطلوب...')+'" style="width:100%"></textarea></div>' +
        '<div class="form-group" style="grid-column:1/-1"><div class="form-label">'+t('مرفقات (صور / فيديو)')+'</div>' +
          '<input id="maintFiles" type="file" multiple accept="image/*,video/*" style="width:100%">' +
          '<div style="font-size:11px;color:var(--text2);margin-top:4px">'+t('الحد الأقصى: 5 ميجا لكل ملف')+'</div></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">' +
        '<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>' +
        '<button class="btn btn-primary" onclick="maintSaveNew(this)">\uD83D\uDCBE '+t('حفظ أمر الصيانة')+'</button>' +
      '</div>' +
    '</div></div>';
  document.body.appendChild(modal);

  // Auto-fill contract
  var clientEl = document.getElementById('maintClient');
  if(clientEl) clientEl.addEventListener('change', function(){
    var p = projects.find(function(pr){ return pr.name === clientEl.value; });
    if(p) {
      if(p.contractNo) document.getElementById('maintContract').value = p.contractNo;
      if(p.company) { var sel=document.getElementById('maintCompany'); if(sel){sel.value=p.company;} }
      if(p.region) { var sel=document.getElementById('maintRegion'); if(sel){sel.value=p.region;} }
      if(p.gallery) { var sel=document.getElementById('maintGallery'); if(sel){sel.value=p.gallery;} }
      if(p.phone) document.getElementById('maintPhone').value = p.phone;
    }
  });

  setTimeout(function(){ var el=document.getElementById('maintAssignee'); if(el) el.focus(); }, 200);
}

function maintSaveNew(btn) {
  var assignee = (document.getElementById('maintAssignee') ? document.getElementById('maintAssignee').value : '').trim();
  var client = (document.getElementById('maintClient') ? document.getElementById('maintClient').value : '').trim();
  var desc = (document.getElementById('maintDesc') ? document.getElementById('maintDesc').value : '').trim();
  if(!assignee) { notify(t('اختر الفني'),'error'); return; }
  if(!client) { notify(t('أدخل اسم العميل'),'error'); return; }
  if(!desc) { notify(t('أدخل وصف الصيانة'),'error'); return; }

  var cu = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  var contractNo = (document.getElementById('maintContract') ? document.getElementById('maintContract').value : '').trim();
  var company = document.getElementById('maintCompany') ? document.getElementById('maintCompany').value : '';
  var region = document.getElementById('maintRegion') ? document.getElementById('maintRegion').value : '';
  var gallery = document.getElementById('maintGallery') ? document.getElementById('maintGallery').value : '';
  var phone = (document.getElementById('maintPhone') ? document.getElementById('maintPhone').value : '').trim();
  var location = (document.getElementById('maintLocation') ? document.getElementById('maintLocation').value : '').trim();

  // Process file attachments
  var fileInput = document.getElementById('maintFiles');
  var files = fileInput ? fileInput.files : [];
  var attachments = [];
  var filesProcessed = 0;
  var totalFiles = files.length;

  function doSave() {
    var order = {
      id: 'maint_'+Date.now(),
      assignedTo: assignee,
      clientName: client,
      contractNo: contractNo,
      company: company,
      region: region,
      gallery: gallery,
      phone: phone,
      location: location,
      description: desc,
      attachments: attachments,
      createdBy: cu ? cu.name : 'المدير',
      createdAt: new Date().toISOString(),
      status: 'pending',
      completedAt: null,
      techNotes: ''
    };

    var orders = loadMaintOrders();
    orders.unshift(order);
    saveMaintOrders(orders);
    btn.closest('.modal-bg').remove();
    _doRenderMaintOrders();
    notify(t('تم إنشاء أمر صيانة وتعيينه إلى')+': '+assignee);
  }

  if(totalFiles === 0) {
    doSave();
    return;
  }

  // Read files as base64
  for(var i = 0; i < totalFiles; i++) {
    (function(file) {
      if(file.size > 5*1024*1024) {
        notify(t('الملف')+' '+file.name+' '+t('أكبر من 5 ميجا — تم تجاهله'),'error');
        filesProcessed++;
        if(filesProcessed >= totalFiles) doSave();
        return;
      }
      var reader = new FileReader();
      reader.onload = function(e) {
        attachments.push({
          name: file.name,
          data: e.target.result,
          type: file.type
        });
        filesProcessed++;
        if(filesProcessed >= totalFiles) doSave();
      };
      reader.onerror = function() {
        filesProcessed++;
        if(filesProcessed >= totalFiles) doSave();
      };
      reader.readAsDataURL(file);
    })(files[i]);
  }
}

// ── Edit maintenance order ──
function maintEdit(oid) {
  var orders = loadMaintOrders();
  var order = orders.find(function(o){ return o.id === oid; });
  if(!order) { notify(t('الأمر غير موجود'),'error'); return; }

  var d = loadData();
  var companies = d.companies || [];
  var regions = d.regions || [];
  var galleries = d.galleries || [];
  var users = [];
  try { users = JSON.parse(localStorage.getItem('pm_users')||'[]'); } catch(e){}

  var userOpts = users.map(function(u){ return '<option value="'+(u.name||'')+'"'+(u.name===order.assignedTo?' selected':'')+'>'+(u.name||'')+'</option>'; }).join('');
  var companyOpts = companies.map(function(c){ return '<option'+(c===order.company?' selected':'')+'>'+c+'</option>'; }).join('');
  var regionOpts = regions.map(function(r){ return '<option'+(r===order.region?' selected':'')+'>'+r+'</option>'; }).join('');
  var galleryOpts = galleries.map(function(g){ return '<option'+(g===order.gallery?' selected':'')+'>'+g+'</option>'; }).join('');

  var modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.innerHTML = '<div class="modal" style="max-width:580px">' +
    '<div class="modal-header">' +
      '<div class="modal-title">\u270F\uFE0F '+t('تعديل أمر الصيانة')+'</div>' +
      '<button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest(\'.modal-bg\').remove()">\u2715</button>' +
    '</div>' +
    '<div class="modal-body">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
        '<div class="form-group" style="grid-column:1/-1"><div class="form-label">'+t('الفني')+'</div>' +
          '<select id="maintEditAssignee" style="width:100%"><option value="">— '+t('اختر')+' —</option>'+userOpts+'</select></div>' +
        '<div class="form-group"><div class="form-label">'+t('اسم العميل')+'</div>' +
          '<input id="maintEditClient" value="'+(order.clientName||'')+'" style="width:100%"></div>' +
        '<div class="form-group"><div class="form-label">'+t('رقم العقد')+'</div>' +
          '<input id="maintEditContract" value="'+(order.contractNo||'')+'" style="width:100%"></div>' +
        '<div class="form-group"><div class="form-label">'+t('الشركة')+'</div>' +
          '<select id="maintEditCompany" style="width:100%"><option value="">—</option>'+companyOpts+'</select></div>' +
        '<div class="form-group"><div class="form-label">'+t('المنطقة')+'</div>' +
          '<select id="maintEditRegion" style="width:100%"><option value="">—</option>'+regionOpts+'</select></div>' +
        '<div class="form-group"><div class="form-label">'+t('المعرض')+'</div>' +
          '<select id="maintEditGallery" style="width:100%"><option value="">—</option>'+galleryOpts+'</select></div>' +
        '<div class="form-group"><div class="form-label">'+t('الهاتف')+'</div>' +
          '<input id="maintEditPhone" type="tel" value="'+(order.phone||'')+'" style="width:100%"></div>' +
        '<div class="form-group" style="grid-column:1/-1"><div class="form-label">'+t('الموقع')+'</div>' +
          '<input id="maintEditLocation" value="'+(order.location||'')+'" style="width:100%"></div>' +
        '<div class="form-group" style="grid-column:1/-1"><div class="form-label">'+t('الوصف')+'</div>' +
          '<textarea id="maintEditDesc" rows="3" style="width:100%">'+(order.description||'')+'</textarea></div>' +
        '<div class="form-group" style="grid-column:1/-1"><div class="form-label">'+t('الحالة')+'</div>' +
          '<select id="maintEditStatus" style="width:100%">' +
            '<option value="pending"'+(order.status==='pending'?' selected':'')+'>'+t('معلق')+'</option>' +
            '<option value="in_progress"'+(order.status==='in_progress'?' selected':'')+'>'+t('قيد التنفيذ')+'</option>' +
            '<option value="completed"'+(order.status==='completed'?' selected':'')+'>'+t('مكتمل')+'</option>' +
          '</select></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">' +
        '<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>' +
        '<button class="btn btn-primary" onclick="maintDoEdit(\''+oid+'\',this)">\uD83D\uDCBE '+t('حفظ التعديلات')+'</button>' +
      '</div>' +
    '</div></div>';
  document.body.appendChild(modal);
}

function maintDoEdit(oid, btn) {
  var orders = loadMaintOrders();
  var order = orders.find(function(o){ return o.id === oid; });
  if(!order) return;

  order.assignedTo = document.getElementById('maintEditAssignee') ? document.getElementById('maintEditAssignee').value : order.assignedTo;
  order.clientName = (document.getElementById('maintEditClient') ? document.getElementById('maintEditClient').value : order.clientName).trim();
  order.contractNo = (document.getElementById('maintEditContract') ? document.getElementById('maintEditContract').value : '').trim();
  order.company = document.getElementById('maintEditCompany') ? document.getElementById('maintEditCompany').value : '';
  order.region = document.getElementById('maintEditRegion') ? document.getElementById('maintEditRegion').value : '';
  order.gallery = document.getElementById('maintEditGallery') ? document.getElementById('maintEditGallery').value : '';
  order.phone = (document.getElementById('maintEditPhone') ? document.getElementById('maintEditPhone').value : '').trim();
  order.location = (document.getElementById('maintEditLocation') ? document.getElementById('maintEditLocation').value : '').trim();
  order.description = (document.getElementById('maintEditDesc') ? document.getElementById('maintEditDesc').value : '').trim();
  var newStatus = document.getElementById('maintEditStatus') ? document.getElementById('maintEditStatus').value : order.status;
  if(newStatus === 'completed' && order.status !== 'completed') {
    order.completedAt = new Date().toISOString();
  }
  order.status = newStatus;

  saveMaintOrders(orders);
  btn.closest('.modal-bg').remove();
  _doRenderMaintOrders();
  notify(t('تم تحديث أمر الصيانة'));
}

// ── Delete maintenance order ──
function maintDelete(oid) {
  var orders = loadMaintOrders();
  var order = orders.find(function(o){ return o.id === oid; });
  if(!order) return;
  if(!confirm(t('حذف أمر الصيانة؟')+'\n'+order.clientName+' — '+order.assignedTo)) return;
  orders = orders.filter(function(o){ return o.id !== oid; });
  saveMaintOrders(orders);
  _doRenderMaintOrders();
  notify(t('تم الحذف'));
}

// ── Technician: Start work ──
function maintStart(oid) {
  var orders = loadMaintOrders();
  var order = orders.find(function(o){ return o.id === oid; });
  if(!order) return;
  order.status = 'in_progress';
  order.startedAt = new Date().toISOString();
  saveMaintOrders(orders);
  _doRenderMaintOrders();
  notify(t('تم بدء العمل على أمر الصيانة'));
}

// ── Technician/Admin: Complete maintenance ──
function maintComplete(oid) {
  var orders = loadMaintOrders();
  var order = orders.find(function(o){ return o.id === oid; });
  if(!order) { notify(t('الأمر غير موجود'),'error'); return; }

  var modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.innerHTML = '<div class="modal" style="max-width:540px">' +
    '<div class="modal-header">' +
      '<div class="modal-title">\u2705 '+t('إنجاز أمر الصيانة وإصدار محضر تسليم')+'</div>' +
      '<button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest(\'.modal-bg\').remove()">\u2715</button>' +
    '</div>' +
    '<div class="modal-body">' +
      '<div style="padding:10px;background:rgba(22,163,106,0.08);border:1px solid rgba(22,163,106,0.2);border-radius:8px;margin-bottom:16px;font-size:12px;line-height:1.8">' +
        '<div><strong>'+t('العميل')+':</strong> <span style="color:#16a34a;font-weight:800">'+(order.clientName||'')+'</span></div>' +
        (order.contractNo ? '<div><strong>'+t('رقم العقد')+':</strong> '+order.contractNo+'</div>' : '') +
        (order.phone ? '<div><strong>'+t('الهاتف')+':</strong> '+order.phone+'</div>' : '') +
        '<div><strong>'+t('الوصف')+':</strong> '+(order.description||'')+'</div>' +
      '</div>' +
      '<div class="form-group"><div class="form-label">'+t('ملاحظات الفني عن الإنجاز')+' <span style="color:var(--text2);font-size:11px">('+t('ستظهر في محضر التسليم')+')</span></div>' +
        '<textarea id="maintCompleteNotes" rows="3" placeholder="'+t('اكتب ملاحظاتك عن العمل المنجز...')+'" style="width:100%">'+(order.techNotes||'')+'</textarea></div>' +
      '<div class="form-group"><div class="form-label">'+t('صور الإنجاز (اختياري)')+'</div>' +
        '<input id="maintCompleteFiles" type="file" multiple accept="image/*" style="width:100%"></div>' +
      '<div style="padding:8px 12px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:8px;margin-bottom:12px;font-size:11px;color:#7c3aed">' +
        '\uD83D\uDDA8\uFE0F '+t('بعد الضغط على "تأكيد الإنجاز" سيتم إصدار محضر تسليم صيانة للطباعة وتوقيع العميل')+'' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">' +
        '<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>' +
        '<button class="btn btn-success" onclick="maintDoComplete(\''+oid+'\',this)" style="font-size:14px;padding:10px 24px">\u2705 '+t('تأكيد الإنجاز وطباعة التسليم')+'</button>' +
      '</div>' +
    '</div></div>';
  document.body.appendChild(modal);
}

function maintDoComplete(oid, btn) {
  var orders = loadMaintOrders();
  var order = orders.find(function(o){ return o.id === oid; });
  if(!order) return;

  var notes = (document.getElementById('maintCompleteNotes') ? document.getElementById('maintCompleteNotes').value : '').trim();
  order.techNotes = notes;
  order.status = 'completed';
  order.completedAt = new Date().toISOString();

  // Process completion photos
  var fileInput = document.getElementById('maintCompleteFiles');
  var files = fileInput ? fileInput.files : [];
  if(!order.completionPhotos) order.completionPhotos = [];

  var filesProcessed = 0;
  var totalFiles = files.length;

  function finishSave() {
    saveMaintOrders(orders);
    btn.closest('.modal-bg').remove();
    _doRenderMaintOrders();
    notify(t('تم إنجاز أمر الصيانة بنجاح'));
    // Generate maintenance delivery document
    setTimeout(function(){ _printMaintDeliveryDoc(order); }, 500);
  }

  if(totalFiles === 0) {
    finishSave();
    return;
  }

  for(var i = 0; i < totalFiles; i++) {
    (function(file) {
      if(file.size > 5*1024*1024) {
        filesProcessed++;
        if(filesProcessed >= totalFiles) finishSave();
        return;
      }
      var reader = new FileReader();
      reader.onload = function(e) {
        order.completionPhotos.push({
          name: file.name,
          data: e.target.result,
          type: file.type
        });
        filesProcessed++;
        if(filesProcessed >= totalFiles) finishSave();
      };
      reader.onerror = function() {
        filesProcessed++;
        if(filesProcessed >= totalFiles) finishSave();
      };
      reader.readAsDataURL(file);
    })(files[i]);
  }
}

// ── Print Maintenance Delivery Document — أمر تسليم صيانة ──
function _printMaintDeliveryDoc(order) {
  var cu = (typeof getCurrentUser==='function') ? getCurrentUser() : null;
  var techName = order.assignedTo || (cu ? cu.name : '');
  var today = new Date().toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'});
  var completedDate = order.completedAt ? new Date(order.completedAt).toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'}) : today;

  var html = '<style>'+
    '@page{size:A4;margin:10mm}'+
    '*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}'+
    'body{font-family:Cairo,sans-serif;direction:rtl;color:#1e293b;background:#fff;margin:0;font-size:11px}'+
    'table{width:100%;border-collapse:collapse}'+
    'td,th{padding:5px 8px}'+
  '</style>'+

  // Header — compact
  '<div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #7c3aed;padding-bottom:8px;margin-bottom:10px">'+
    '<div style="text-align:center;flex:1">'+
      '<div style="font-size:18px;font-weight:900;color:#7c3aed;border:2px solid #7c3aed;padding:6px 20px;border-radius:6px;display:inline-block;letter-spacing:1px">'+t('محضر تسليم صيانة')+'</div>'+
    '</div>'+
    '<div style="text-align:left;min-width:120px;font-size:10px;color:#555;line-height:1.6">'+
      '<div><strong>'+t('التاريخ')+':</strong> '+today+'</div>'+
      (order.contractNo ? '<div><strong>'+t('رقم العقد')+':</strong> '+order.contractNo+'</div>' : '')+
    '</div>'+
  '</div>'+

  // Client info — compact
  '<table style="margin-bottom:8px;font-size:11px">'+
    '<tr><th colspan="4" style="background:#7c3aed;color:#fff;padding:5px 10px;text-align:right;font-size:12px">'+t('بيانات العميل')+'</th></tr>'+
    '<tr><td style="width:18%;border:1px solid #ddd;background:#f8fafc;font-weight:700">'+t('اسم العميل')+'</td><td style="border:1px solid #ddd;font-weight:800;color:#7c3aed">'+(order.clientName||'-')+'</td>'+
        '<td style="width:18%;border:1px solid #ddd;background:#f8fafc;font-weight:700">'+t('رقم العقد')+'</td><td style="border:1px solid #ddd">'+(order.contractNo||'-')+'</td></tr>'+
    '<tr><td style="border:1px solid #ddd;background:#f8fafc;font-weight:700">'+t('الشركة')+'</td><td style="border:1px solid #ddd">'+(order.company||'-')+'</td>'+
        '<td style="border:1px solid #ddd;background:#f8fafc;font-weight:700">'+t('الهاتف')+'</td><td style="border:1px solid #ddd">'+(order.phone||'-')+'</td></tr>'+
    '<tr><td style="border:1px solid #ddd;background:#f8fafc;font-weight:700">'+t('المنطقة / المعرض')+'</td><td style="border:1px solid #ddd">'+(order.region||'-')+' / '+(order.gallery||'-')+'</td>'+
        '<td style="border:1px solid #ddd;background:#f8fafc;font-weight:700">'+t('الموقع')+'</td><td style="border:1px solid #ddd">'+(order.location||'-')+'</td></tr>'+
  '</table>'+

  // Maintenance details — compact
  '<table style="margin-bottom:8px;font-size:11px">'+
    '<tr><th colspan="2" style="background:#7c3aed;color:#fff;padding:5px 10px;text-align:right;font-size:12px">'+t('تفاصيل الصيانة')+'</th></tr>'+
    '<tr><td style="width:18%;border:1px solid #ddd;background:#f8fafc;font-weight:700">'+t('وصف الصيانة')+'</td><td style="border:1px solid #ddd;line-height:1.6">'+(order.description||'-')+'</td></tr>'+
    '<tr><td style="border:1px solid #ddd;background:#f8fafc;font-weight:700">'+t('الفني المسؤول')+'</td><td style="border:1px solid #ddd;font-weight:700;color:#7c3aed">'+techName+'</td></tr>'+
    '<tr><td style="border:1px solid #ddd;background:#f8fafc;font-weight:700">'+t('تاريخ الإنجاز')+'</td><td style="border:1px solid #ddd;font-weight:700;color:#16a34a">'+completedDate+'</td></tr>'+
    (order.techNotes ? '<tr><td style="border:1px solid #ddd;background:#f8fafc;font-weight:700">'+t('ملاحظات الفني')+'</td><td style="border:1px solid #ddd;line-height:1.6">'+order.techNotes+'</td></tr>' : '')+
  '</table>'+

  // Warranty — compact single line
  '<div style="margin-bottom:8px;padding:6px 12px;background:#fffbeb;border:1px solid #fbbf24;border-radius:6px;font-size:10px;line-height:1.6">'+
    '<span style="font-weight:800;color:#92400e">📌</span> '+
    t('تم إنجاز الصيانة بنجاح')+' • '+t('ضمان جودة العمل')+' <strong>30 '+t('يوماً')+'</strong> • '+t('للملاحظات: التواصل مع المعرض')+
  '</div>'+

  // Notes — single line
  '<div style="margin-bottom:10px;padding:6px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:11px">'+
    '<div style="font-weight:800;color:#7c3aed;margin-bottom:4px">'+t('ملاحظات إضافية')+'</div>'+
    '<div style="min-height:24px;border-bottom:1px dashed #cbd5e1"></div>'+
  '</div>'+

  // Signatures — compact
  '<div style="display:flex;justify-content:space-between;padding-top:10px;border-top:2px solid #7c3aed">'+
    '<div style="text-align:center;min-width:180px">'+
      '<div style="font-weight:800;color:#7c3aed;font-size:12px;margin-bottom:2px">'+t('فني الصيانة')+'</div>'+
      '<div style="font-size:11px;color:#555;margin-bottom:20px">'+techName+'</div>'+
      '<div style="border-top:1.5px solid #7c3aed;padding-top:4px;font-size:9px;color:#888">'+t('التوقيع')+'</div>'+
    '</div>'+
    '<div style="text-align:center;min-width:180px">'+
      '<div style="font-weight:800;color:#7c3aed;font-size:12px;margin-bottom:2px">'+t('العميل')+'</div>'+
      '<div style="font-size:11px;color:#555;margin-bottom:20px">'+(order.clientName||'')+(order.contractNo?' — '+t('عقد')+': '+order.contractNo:'')+'</div>'+
      '<div style="border-top:1.5px solid #7c3aed;padding-top:4px;font-size:9px;color:#888">'+t('التوقيع')+'</div>'+
    '</div>'+
  '</div>'+

  // Footer — minimal
  '<div style="margin-top:8px;text-align:center;font-size:9px;color:#aaa">'+
    'NourMetal — '+today+
  '</div>';

  var pa = document.getElementById('printArea');
  pa.innerHTML = html;
  window.print();
  setTimeout(function(){ pa.innerHTML = ''; }, 2500);
}

// Print maintenance delivery from order list
function maintPrintDelivery(oid) {
  var orders = loadMaintOrders();
  var order = orders.find(function(o){ return o.id === oid; });
  if(!order) { notify(t('الأمر غير موجود'),'error'); return; }
  _printMaintDeliveryDoc(order);
}

// ── Notification system for maintenance ──
function _checkMaintNotifications() {
  var cu = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  if(!cu) return;

  var orders = loadMaintOrders();
  var myPending = orders.filter(function(o){ return o.assignedTo === cu.name && o.status === 'pending'; });

  // Badge on the maintenance tab
  var maintTab = document.querySelector('[onclick*="switchInstTab"][onclick*="maint"]');
  if(!maintTab) {
    // Try finding by data attribute or text
    var tabs = document.querySelectorAll('.tab-btn, [role="tab"]');
    tabs.forEach(function(t) {
      if(t.textContent && t.textContent.indexOf('صيانة') !== -1) maintTab = t;
    });
  }

  if(maintTab) {
    var oldBadge = maintTab.querySelector('.maint-badge');
    if(oldBadge) oldBadge.remove();
    if(myPending.length > 0) {
      var badge = document.createElement('span');
      badge.className = 'maint-badge';
      badge.style.cssText = 'position:absolute;top:-4px;left:-4px;background:#d97706;color:#fff;font-size:10px;font-weight:800;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 4px;box-shadow:0 2px 6px rgba(217,119,6,.4);animation:badgePulse 2s infinite';
      badge.textContent = myPending.length;
      maintTab.style.position = 'relative';
      maintTab.appendChild(badge);
    }
  }

  // Toast for new orders
  var lastSeenMaint = parseInt(localStorage.getItem('pm_maint_last_seen')||'0');
  var unseen = myPending.filter(function(o){ return new Date(o.createdAt).getTime() > lastSeenMaint; });
  if(unseen.length > 0 && typeof notify === 'function') {
    notify('\uD83D\uDEE0\uFE0F '+t('لديك')+' '+unseen.length+' '+t('أمر صيانة جديد'));
    localStorage.setItem('pm_maint_last_seen', Date.now().toString());
  }
}

// ══════════════════════════════════════════════════
// SITE DELIVERY ORDER — أمر تسليم موقع
// ══════════════════════════════════════════════════

var DEL_KEY = 'pm_delivery_orders';

function loadDeliveryOrders() {
  try { return JSON.parse(localStorage.getItem(DEL_KEY) || '[]'); } catch(e) { return []; }
}
function saveDeliveryOrders(arr) {
  arr.forEach(function(e){ if(e.id) e._modified = Date.now(); });
  localStorage.setItem(DEL_KEY, JSON.stringify(arr));
  return fetch('/api/data/'+DEL_KEY, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({value: arr})
  }).catch(function(){});
}
async function _syncDeliveryFromServer() {
  try {
    var r = await fetch('/api/data/'+DEL_KEY);
    var j = await r.json();
    if(j.ok && j.value) {
      var serverData = Array.isArray(j.value) ? j.value : [];
      var newJson = JSON.stringify(serverData);
      var oldJson = localStorage.getItem(DEL_KEY) || '[]';
      if(typeof _os === 'function') _os.call(localStorage, DEL_KEY, newJson);
      else localStorage.setItem(DEL_KEY, newJson);
      if(typeof _cache !== 'undefined') _cache[DEL_KEY] = newJson;
      if(newJson !== oldJson) {
        try { _doRenderDeliveryOrders(); } catch(e) {}
      }
    }
  } catch(e) {}
}

function openDeliveryOrder(projectId) {
  var d = loadData();
  var users = [];
  try { users = JSON.parse(localStorage.getItem('pm_users')||'[]'); } catch(e){}

  var modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.innerHTML = '<div class="modal" style="max-width:560px">' +
    '<div class="modal-header">' +
      '<div class="modal-title">📋 '+t('إنشاء أمر تسليم موقع')+'</div>' +
      '<button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest(\'.modal-bg\').remove()">✕</button>' +
    '</div>' +
    '<div class="modal-body">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
        '<div class="form-group"><div class="form-label">'+t('اختر العميل')+' *</div>' +
          '<select id="delOrderProject" style="width:100%"><option value="">— '+t('اختر')+' —</option>'+
            d.projects.map(function(pr){return '<option value="'+pr.id+'"'+(pr.id===projectId?' selected':'')+'>'+pr.name+(pr.contractNo?' ('+pr.contractNo+')':'')+'</option>';}).join('')+
          '</select></div>' +
        '<div class="form-group"><div class="form-label">'+t('الفني المسؤول')+' *</div>' +
          '<select id="delOrderTech" style="width:100%"><option value="">— '+t('اختر')+' —</option>'+
            users.map(function(u){return '<option value="'+u.name+'">'+u.name+'</option>';}).join('')+
          '</select></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">' +
        '<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>' +
        '<button class="btn btn-primary" onclick="saveAndGenerateDelivery(this)" style="font-size:14px;padding:10px 24px">📋 '+t('حفظ وإنشاء')+'</button>' +
      '</div>' +
    '</div></div>';
  document.body.appendChild(modal);
}

function saveAndGenerateDelivery(btn) {
  var projectId = document.getElementById('delOrderProject')?.value;
  var techName = document.getElementById('delOrderTech')?.value;
  if(!projectId) { notify(t('اختر العميل'),'error'); return; }
  if(!techName) { notify(t('اختر الفني'),'error'); return; }

  var d = loadData();
  var p = d.projects.find(function(x){return x.id===projectId;});
  if(!p) { notify(t('المشروع غير موجود'),'error'); return; }
  var cu = (typeof getCurrentUser==='function') ? getCurrentUser() : null;

  // Save the delivery order
  var order = {
    id: 'del_'+Date.now(),
    projectId: projectId,
    clientName: p.name||'',
    contractNo: p.contractNo||'',
    company: p.company||'',
    region: p.region||'',
    gallery: p.gallery||'',
    assignedTo: techName,
    createdBy: cu ? cu.name : 'المدير',
    createdAt: new Date().toISOString(),
    status: 'pending', // pending → signed
    signedDoc: null // base64 of signed document
  };

  var orders = loadDeliveryOrders();
  orders.unshift(order);
  saveDeliveryOrders(orders);

  // Close modal
  btn.closest('.modal-bg').remove();
  notify(t('تم إنشاء أمر التسليم — سيظهر عند الفني')+' '+techName);
  if(typeof logActivity==='function') logActivity('أمر تسليم', p.name+' → '+techName);
  _doRenderDeliveryOrders();
}

// Render delivery orders list (inside installations page)
function renderDeliveryOrders() {
  _syncDeliveryFromServer().then(function(){ _doRenderDeliveryOrders(); }).catch(function(){ _doRenderDeliveryOrders(); });
}

function _doRenderDeliveryOrders() {
  var orders = loadDeliveryOrders();
  var cu = (typeof getCurrentUser==='function') ? getCurrentUser() : null;
  var isAdmin = !cu || cu.isAdmin;
  var isSupervisor = cu && !cu.isAdmin && (cu.perms||[]).includes('page_projects');

  var visible;
  if(isAdmin || isSupervisor) {
    visible = orders;
  } else {
    visible = orders.filter(function(o){ return o.assignedTo === (cu ? cu.name : ''); });
  }

  var listEl = document.getElementById('deliveryList');
  var emptyEl = document.getElementById('deliveryEmpty');
  if(!listEl) return;

  if(!visible.length) {
    listEl.innerHTML = '';
    if(emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if(emptyEl) emptyEl.style.display = 'none';

  listEl.innerHTML = visible.map(function(order) {
    var oid = order.id;
    var isSigned = order.status === 'signed';
    var statusColor = isSigned ? '#16a34a' : '#0e7490';
    var statusText = isSigned ? t('تم التوقيع') : t('بانتظار التوقيع');

    var _hasDelPerm = function(perm) {
      if(isAdmin) return true;
      return cu && (cu.perms||[]).indexOf(perm) !== -1;
    };
    var btns = '';
    // "تم التسليم" button — when pending and has permission
    if(!isSigned && order.status === 'pending' && _hasDelPerm('inst_delivery_complete')) {
      btns += '<button class="btn btn-sm btn-success" onclick="deliveryComplete(\''+oid+'\')" style="font-size:13px;padding:6px 14px">✅ '+t('تم التسليم')+'</button>';
    }
    // Print button
    if(_hasDelPerm('inst_delivery_print')) {
      btns += '<button class="btn btn-sm btn-primary" onclick="deliveryPrint(\''+oid+'\')">🖨️ '+t('طباعة')+'</button>';
    }
    // Upload signed copy — always available (before and after delivery)
    if(_hasDelPerm('inst_delivery_upload')) {
      btns += '<label class="btn btn-sm" style="cursor:pointer;margin:0;background:#059669;color:#fff;border-color:#059669">📤 '+t('رفع الاستلام')+'<input type="file" accept="image/*,.pdf" style="display:none" onchange="deliveryUploadSigned(this,\''+oid+'\')"></label>';
    }
    // View signed doc — show after upload
    if(order.signedDoc) {
      btns += '<button class="btn btn-sm btn-secondary" onclick="deliveryViewSigned(\''+oid+'\')">👁️ '+t('عرض الاستلام')+'</button>';
    }
    if(_hasDelPerm('inst_delivery_delete')) {
      btns += '<button class="btn btn-sm btn-danger" onclick="deliveryDelete(\''+oid+'\')" style="padding:4px 8px">🗑️</button>';
    }

    return '<div class="card" style="border-right:4px solid '+statusColor+';margin-bottom:12px">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:200px">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">' +
            '<span style="font-size:18px">📋</span>' +
            '<div style="font-size:16px;font-weight:700;color:var(--text)">'+(order.clientName||'')+'</div>' +
            '<span style="font-size:11px;padding:3px 10px;border-radius:12px;background:'+statusColor+'22;color:'+statusColor+';font-weight:700;border:1px solid '+statusColor+'44">'+statusText+'</span>' +
          '</div>' +
          '<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--text2)">' +
            (order.contractNo ? '<span>'+t('عقد')+': <strong>'+order.contractNo+'</strong></span>' : '') +
            (order.company ? '<span>'+order.company+'</span>' : '') +
            '<span>'+t('الفني')+': <strong style="color:var(--accent)">'+order.assignedTo+'</strong></span>' +
            '<span>'+new Date(order.createdAt).toLocaleDateString('ar-SA')+'</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-shrink:0;align-items:center;flex-wrap:wrap">' + btns + '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  // Badge on delivery tab for pending orders
  var pendingOrders = visible.filter(function(o){ return o.status === 'pending'; });
  var delTab = document.getElementById('instTab-delivery');
  if(delTab) {
    var oldBadge = delTab.querySelector('.del-badge');
    if(oldBadge) oldBadge.remove();
    if(pendingOrders.length > 0) {
      var badge = document.createElement('span');
      badge.className = 'del-badge';
      badge.style.cssText = 'position:absolute;top:-4px;left:-4px;background:#0e7490;color:#fff;font-size:10px;font-weight:800;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 4px;box-shadow:0 2px 6px rgba(14,116,144,.4);animation:badgePulse 2s infinite';
      badge.textContent = pendingOrders.length;
      delTab.style.position = 'relative';
      delTab.appendChild(badge);
    }
  }

  // Notification for technicians
  if(cu && !isAdmin && !isSupervisor) {
    if(pendingOrders.length > 0) {
      var lastSeen = parseInt(localStorage.getItem('pm_del_last_seen')||'0');
      var unseen = pendingOrders.filter(function(o){ return new Date(o.createdAt).getTime() > lastSeen; });
      if(unseen.length > 0) {
        notify('📋 '+t('لديك')+' '+unseen.length+' '+t('أمر تسليم جديد — اطبعه ووقّع العميل عليه'));
        localStorage.setItem('pm_del_last_seen', Date.now().toString());
        // Auto-switch to delivery tab
        if(typeof switchInstTab==='function') switchInstTab('delivery', null);
      }
    }
  }
}

function deliveryPrint(oid) {
  var orders = loadDeliveryOrders();
  var order = orders.find(function(o){ return o.id === oid; });
  if(!order) return;
  var d = loadData();
  var p = d.projects.find(function(x){ return x.id === order.projectId; });
  if(!p) { notify(t('المشروع غير موجود'),'error'); return; }
  _printDeliveryDoc(order, p, d);
}

function deliveryUploadSigned(input, oid) {
  var file = input.files[0]; if(!file) return;
  if(file.size > 10*1024*1024) { notify(t('الملف كبير — الحد 10MB'),'error'); return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    var orders = loadDeliveryOrders();
    var order = orders.find(function(o){ return o.id === oid; });
    if(!order) return;
    order.signedDoc = e.target.result;
    order.signedAt = new Date().toISOString();
    order.status = 'signed';
    saveDeliveryOrders(orders).then(function(){
      _doRenderDeliveryOrders();
      notify('✅ '+t('تم رفع المستند الموقّع'));
      if(typeof logActivity==='function') logActivity('رفع توقيع تسليم', order.clientName);
    });
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function deliveryViewSigned(oid) {
  var orders = loadDeliveryOrders();
  var order = orders.find(function(o){ return o.id === oid; });
  if(!order || !order.signedDoc) return;

  var isImg = order.signedDoc.indexOf('data:image') === 0;
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column';
  overlay.innerHTML = '<div style="padding:10px;display:flex;gap:8px;margin-bottom:8px">' +
    '<button onclick="this.closest(\'[style]\').remove()" style="background:rgba(220,38,38,.7);border:none;color:#fff;padding:6px 16px;border-radius:8px;cursor:pointer;font-family:Cairo,sans-serif">✕ '+t('إغلاق')+'</button>' +
    '<a href="'+order.signedDoc+'" download="تسليم_موقّع_'+order.clientName+'" style="background:rgba(59,130,246,.7);color:#fff;padding:6px 16px;border-radius:8px;text-decoration:none;font-family:Cairo,sans-serif">📥 '+t('تحميل')+'</a>' +
  '</div>' +
  (isImg ? '<img src="'+order.signedDoc+'" style="max-width:90vw;max-height:85vh;object-fit:contain;border-radius:8px">' :
    '<iframe src="'+order.signedDoc+'" style="width:90vw;height:85vh;border:none;border-radius:8px"></iframe>');
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

function deliveryComplete(oid) {
  var orders = loadDeliveryOrders();
  var order = orders.find(function(o){ return o.id === oid; });
  if(!order) { notify(t('الأمر غير موجود'),'error'); return; }
  if(!confirm(t('تأكيد تسليم الموقع للعميل')+' "'+order.clientName+'"؟\n\n'+t('سيتم')+':'+'\n• '+t('تغيير حالة المشروع إلى "تم التسليم"')+'\n• '+t('طباعة محضر التسليم'))) return;

  // 1. Update order status
  order.status = 'signed';
  order.signedAt = new Date().toISOString();
  var cu = (typeof getCurrentUser==='function') ? getCurrentUser() : null;
  order.completedBy = cu ? cu.name : '';
  saveDeliveryOrders(orders);

  // 2. Update project stage to "تم التسليم"
  if(order.projectId) {
    var d = loadData();
    var p = d.projects.find(function(x){ return x.id === order.projectId; });
    if(p) {
      // Set stage to "تسليم الموقع" (exact match from config)
      var deliveryStage = 'تسليم الموقع';
      // Verify it exists in stages, fallback to any stage with تسليم
      var stageExists = d.stages.some(function(s){ return (s.name||s) === deliveryStage; });
      if(!stageExists) {
        d.stages.forEach(function(s){ var sn = s.name||s; if(sn.indexOf('تسليم') !== -1) deliveryStage = sn; });
      }
      p.stage = deliveryStage;
      p.status = 'تم التسليم';
      p.statusManual = false;
      p.progress = '100';
      p.deliveryDate = p.deliveryDate || new Date().toISOString().slice(0,10);
      localStorage.setItem('pm_projects', JSON.stringify(d.projects));
      // Sync projects to server
      fetch('/api/data/pm_projects',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({value: d.projects})
      }).catch(function(){});
    }

    // 3. Print delivery document
    if(p) {
      _printDeliveryDoc(order, p, d);
    }
  }

  _doRenderDeliveryOrders();
  notify('✅ '+t('تم التسليم — تم تحديث حالة المشروع'));
  if(typeof logActivity==='function') logActivity('تسليم موقع', order.clientName);
  // Refresh projects table if visible
  try{ renderStats(); renderTable(); }catch(e){}
}

function deliveryDelete(oid) {
  if(!confirm(t('حذف أمر التسليم؟'))) return;
  var orders = loadDeliveryOrders().filter(function(o){ return o.id !== oid; });
  saveDeliveryOrders(orders).then(function(){
    _doRenderDeliveryOrders();
    notify(t('تم الحذف'));
  });
}

function _printDeliveryDoc(order, p, d) {
  var techName = order.assignedTo || '';

  // Get company profile and logo
  var compName = p.company || '';
  var prof = (d.companyProfiles||{})[compName] || {};
  var coNameAr = prof.nameAr || compName;
  var coNameEn = prof.nameEn || '';
  var companyLogoMap = {'السلطان':'sultan','عالم المعادن':'metal','الراجحي':'rajhi','الفوزان':'fozan'};
  var logoKey = companyLogoMap[compName] || '';
  var logoSrc = logoKey && typeof LOGOS!=='undefined' ? LOGOS[logoKey] : null;

  // Get measurements → group by section (description + count only, no financial data)
  var measRows = (typeof getMeasurementsData==='function' ? getMeasurementsData(order.projectId) : []) || [];
  var active = measRows.filter(function(r){return +r.width>0 && +r.height>0;});
  var sectionGroups = {};
  active.forEach(function(r){
    var sn = r.sectionName || 'غير محدد';
    if(!sectionGroups[sn]) sectionGroups[sn] = {name:sn, count:0, descriptions:[]};
    sectionGroups[sn].count++;
    if(r.description && sectionGroups[sn].descriptions.indexOf(r.description)===-1) {
      sectionGroups[sn].descriptions.push(r.description);
    }
  });
  var sectionList = Object.values(sectionGroups);

  var today = new Date().toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'});
  var deliveryDate = p.deliveryDate || (typeof calcSmartDeliveryDate==='function' ? calcSmartDeliveryDate(p) : '') || '';
  var deliveryFormatted = deliveryDate ? new Date(deliveryDate).toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'}) : t('لم يحدد');

  // Build the document HTML — compact single page
  var html = '<style>'+
    '@page{size:A4;margin:10mm}'+
    '*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}'+
    'body{font-family:Cairo,sans-serif;direction:rtl;color:#1e293b;background:#fff;margin:0;font-size:11px}'+
    'table{width:100%;border-collapse:collapse}'+
    'td,th{padding:5px 8px}'+
  '</style>'+

  // Letterhead — compact
  '<div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #1a3a6a;padding-bottom:8px;margin-bottom:10px">'+
    '<div style="display:flex;flex-direction:column;align-items:center;min-width:120px">'+
      (logoSrc ? '<img src="'+logoSrc+'" style="max-height:50px;max-width:110px;object-fit:contain;margin-bottom:2px">' : '')+
      (coNameAr ? '<div style="font-size:12px;font-weight:800;color:#1a3a6a">'+coNameAr+'</div>' : '')+
      (coNameEn ? '<div style="font-size:8px;color:#555;font-family:Arial,sans-serif;letter-spacing:0.5px">'+coNameEn+'</div>' : '')+
    '</div>'+
    '<div style="text-align:center;flex:1;padding:0 12px">'+
      '<div style="font-size:18px;font-weight:900;color:#1a3a6a;border:2px solid #1a3a6a;padding:6px 20px;border-radius:6px;display:inline-block;letter-spacing:1px">'+t('محضر تسليم واختبار موقع')+'</div>'+
    '</div>'+
    '<div style="text-align:left;min-width:120px;font-size:10px;color:#555;line-height:1.6">'+
      '<div><strong>'+t('التاريخ')+':</strong> '+today+'</div>'+
      '<div><strong>'+t('رقم العقد')+':</strong> '+(p.contractNo||'---')+'</div>'+
      '<div><strong>'+t('المعرض')+':</strong> '+(p.gallery||'---')+'</div>'+
    '</div>'+
  '</div>'+

  // Client info — compact
  '<table style="margin-bottom:8px;font-size:11px">'+
    '<tr><th colspan="4" style="background:#1a3a6a;color:#fff;padding:5px 10px;text-align:right;font-size:12px">'+t('بيانات العميل والمشروع')+'</th></tr>'+
    '<tr><td style="width:18%;border:1px solid #ddd;background:#f8fafc;font-weight:700">'+t('اسم العميل')+'</td><td style="border:1px solid #ddd;font-weight:800;color:#1a3a6a">'+(p.name||'-')+'</td>'+
        '<td style="width:18%;border:1px solid #ddd;background:#f8fafc;font-weight:700">'+t('رقم العقد')+'</td><td style="border:1px solid #ddd;font-weight:700">'+(p.contractNo||'-')+'</td></tr>'+
    '<tr><td style="border:1px solid #ddd;background:#f8fafc;font-weight:700">'+t('الشركة')+'</td><td style="border:1px solid #ddd">'+(p.company||'-')+'</td>'+
        '<td style="border:1px solid #ddd;background:#f8fafc;font-weight:700">'+t('الهاتف')+'</td><td style="border:1px solid #ddd">'+(p.phone||'-')+'</td></tr>'+
    '<tr><td style="border:1px solid #ddd;background:#f8fafc;font-weight:700">'+t('المنطقة / المعرض')+'</td><td style="border:1px solid #ddd">'+(p.region||'-')+' / '+(p.gallery||'-')+'</td>'+
        '<td style="border:1px solid #ddd;background:#f8fafc;font-weight:700">'+t('تاريخ التسليم')+'</td><td style="border:1px solid #ddd;font-weight:700;color:#16a34a">'+deliveryFormatted+'</td></tr>'+
    '<tr><td style="border:1px solid #ddd;background:#f8fafc;font-weight:700">'+t('تاريخ العقد')+'</td><td style="border:1px solid #ddd">'+(p.contractDate||'-')+'</td>'+
        '<td style="border:1px solid #ddd;background:#f8fafc;font-weight:700">'+t('المرحلة')+'</td><td style="border:1px solid #ddd">'+(p.stage||'-')+'</td></tr>'+
  '</table>'+

  // Work items — compact
  '<table style="margin-bottom:8px;font-size:11px">'+
    '<tr><th colspan="4" style="background:#1a3a6a;color:#fff;padding:5px 10px;text-align:right;font-size:12px">'+t('بنود الأعمال المنفذة')+'</th></tr>'+
    '<tr style="background:#f0f4ff"><th style="border:1px solid #ddd;width:6%;text-align:center">'+t('م')+'</th><th style="border:1px solid #ddd;width:50%">'+t('نوع القطاع / الوصف')+'</th><th style="border:1px solid #ddd;width:14%;text-align:center">'+t('العدد')+'</th><th style="border:1px solid #ddd;text-align:center">'+t('ملاحظات')+'</th></tr>'+
    (sectionList.length ? sectionList.map(function(s,i){
      return '<tr><td style="text-align:center;border:1px solid #ddd">'+(i+1)+'</td>'+
        '<td style="border:1px solid #ddd"><strong>'+s.name+'</strong>'+(s.descriptions.length?' <span style="color:#555;font-size:10px">('+s.descriptions.join('، ')+')</span>':'')+'</td>'+
        '<td style="text-align:center;border:1px solid #ddd;font-weight:700;color:#1a3a6a;font-size:13px">'+s.count+'</td>'+
        '<td style="border:1px solid #ddd"></td></tr>';
    }).join('') : '<tr><td colspan="4" style="text-align:center;padding:8px;border:1px solid #ddd;color:#888">'+t('لا توجد مقاسات محفوظة')+'</td></tr>')+
    '<tr style="background:#f0f4ff"><td colspan="2" style="border:1px solid #ddd;font-weight:800">'+t('الإجمالي')+'</td><td style="text-align:center;border:1px solid #ddd;font-weight:800;font-size:13px;color:#1a3a6a">'+active.length+'</td><td style="border:1px solid #ddd"></td></tr>'+
  '</table>'+

  // Warranty — compact, fewer lines
  '<div style="margin-bottom:8px;padding:6px 12px;background:#fffbeb;border:1px solid #fbbf24;border-radius:6px;font-size:10px;line-height:1.6">'+
    '<span style="font-weight:800;color:#92400e">📌 '+t('الضمان')+':</span> '+
    t('يلتزم المصنع بصيانة الأعمال لمدة')+' <strong>'+t('سنة')+'</strong> '+t('من التسليم')+' • '+t('لا يشمل الضمان سوء الاستخدام')+' • '+t('للصيانة: التواصل مع المعرض')+
  '</div>'+

  // Client notes — single line
  '<div style="margin-bottom:10px;padding:6px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:11px">'+
    '<div style="font-weight:800;color:#1a3a6a;margin-bottom:4px">📝 '+t('ملاحظات')+'</div>'+
    '<div style="min-height:24px;border-bottom:1px dashed #cbd5e1"></div>'+
  '</div>'+

  // Signatures — compact
  '<div style="display:flex;justify-content:space-between;padding-top:10px;border-top:2px solid #1a3a6a">'+
    '<div style="text-align:center;min-width:180px">'+
      '<div style="font-weight:800;color:#1a3a6a;font-size:12px;margin-bottom:2px">'+t('مدير فرقة التركيبات')+'</div>'+
      '<div style="font-size:11px;color:#555;margin-bottom:20px">'+techName+'</div>'+
      '<div style="border-top:1.5px solid #1a3a6a;padding-top:4px;font-size:9px;color:#888">'+t('التوقيع / الختم')+'</div>'+
    '</div>'+
    '<div style="text-align:center;min-width:180px">'+
      '<div style="font-weight:800;color:#1a3a6a;font-size:12px;margin-bottom:2px">'+t('العميل')+'</div>'+
      '<div style="font-size:11px;color:#555;margin-bottom:20px">'+(p.name||'')+(p.contractNo?' — '+t('عقد')+': '+p.contractNo:'')+'</div>'+
      '<div style="border-top:1.5px solid #1a3a6a;padding-top:4px;font-size:9px;color:#888">'+t('التوقيع')+'</div>'+
    '</div>'+
  '</div>'+

  // Footer — minimal
  '<div style="margin-top:8px;text-align:center;font-size:9px;color:#aaa">'+
    'NourMetal — '+today+
  '</div>';

  // Print
  var pa = document.getElementById('printArea');
  pa.innerHTML = html;
  window.print();
  setTimeout(function(){ pa.innerHTML = ''; }, 2500);
}

// ══════════════════════════════════════════════════
// MEASUREMENT UPLOAD ORDERS — أوامر رفع المقاسات
// ══════════════════════════════════════════════════

var MEASORD_KEY = 'pm_meas_orders';

function loadMeasOrders() {
  try { return JSON.parse(localStorage.getItem(MEASORD_KEY) || '[]'); } catch(e) { return []; }
}
function saveMeasOrders(arr) {
  localStorage.setItem(MEASORD_KEY, JSON.stringify(arr));
  return fetch('/api/data/'+MEASORD_KEY, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({value: arr})
  });
}

async function _syncMeasOrdersFromServer() {
  try {
    var r = await fetch('/api/data/'+MEASORD_KEY);
    var j = await r.json();
    if(j.ok && j.value) {
      var serverData = Array.isArray(j.value) ? j.value : [];
      var newJson = JSON.stringify(serverData);
      var oldJson = localStorage.getItem(MEASORD_KEY) || '[]';
      if(typeof _os === 'function') _os.call(localStorage, MEASORD_KEY, newJson);
      else localStorage.setItem(MEASORD_KEY, newJson);
      if(typeof _cache !== 'undefined') _cache[MEASORD_KEY] = newJson;
      if(newJson !== oldJson) {
        try { _doRenderMeasOrders(); } catch(e) {}
      }
    }
  } catch(e) {}
}

function renderMeasOrders() {
  _syncMeasOrdersFromServer().then(function(){ _doRenderMeasOrders(); }).catch(function(){ _doRenderMeasOrders(); });
}

function _doRenderMeasOrders() {
  var orders = loadMeasOrders();
  var cu = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  var isAdmin = !cu || cu.isAdmin;
  var isSupervisor = cu && !cu.isAdmin && (cu.perms||[]).includes('page_projects');
  var _moHp = function(p){ return isAdmin || (cu && (cu.perms||[]).indexOf(p) !== -1); };

  var visible;
  if(isAdmin || isSupervisor) {
    visible = orders;
  } else {
    visible = orders.filter(function(o){ return o.assignedTo === (cu ? cu.name : ''); });
  }

  var listEl = document.getElementById('measOrderList');
  var emptyEl = document.getElementById('measOrderEmpty');
  if(!listEl) return;

  if(!visible.length) {
    listEl.innerHTML = '';
    if(emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if(emptyEl) emptyEl.style.display = 'none';

  listEl.innerHTML = visible.map(function(order) {
    var oid = order.id;
    var statusColor = order.status === 'completed' ? '#16a34a' : order.status === 'in_progress' ? '#2563eb' : '#d97706';
    var statusText = order.status === 'completed' ? t('مكتمل') : order.status === 'in_progress' ? t('قيد التنفيذ') : t('معلق');
    var statusIcon = order.status === 'completed' ? '\u2705' : order.status === 'in_progress' ? '\uD83D\uDD04' : '\u23F3';

    // Check if overdue
    var isOverdue = false;
    if(order.dueDate && order.status !== 'completed') {
      var due = new Date(order.dueDate);
      if(due < new Date()) { isOverdue = true; statusColor = '#dc2626'; }
    }

    var actionBtns = '';
    if(_moHp('inst_measorder_delete')) {
      actionBtns += '<button class="btn btn-sm btn-danger" onclick="measOrderDelete(\''+oid+'\')" style="padding:4px 8px">\uD83D\uDDD1\uFE0F</button>';
    }
    if(!isAdmin && !isSupervisor) {
      if(order.status === 'pending') {
        actionBtns += '<button class="btn btn-sm btn-primary" onclick="measOrderStart(\''+oid+'\')">\u25B6 '+t('بدء العمل')+'</button>';
      }
      if(order.status !== 'completed' && _moHp('inst_measorder_complete')) {
        actionBtns += '<button class="btn btn-sm btn-success" onclick="measOrderComplete(\''+oid+'\')">\u2705 '+t('تم رفع المقاسات')+'</button>';
      }
    }
    if((isAdmin || isSupervisor) && order.status !== 'completed') {
      actionBtns += '<button class="btn btn-sm btn-success" onclick="measOrderComplete(\''+oid+'\')">\u2705 '+t('تم')+'</button>';
    }

    return '<div class="card" style="border-right:4px solid '+statusColor+';margin-bottom:12px">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:200px">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap">' +
            '<span style="font-size:18px">\uD83D\uDCCB</span>' +
            '<div style="font-size:16px;font-weight:700;color:var(--text)">'+(order.clientName||t('بدون اسم'))+'</div>' +
            '<span style="font-size:11px;padding:3px 10px;border-radius:12px;background:'+statusColor+'22;color:'+statusColor+';font-weight:700;border:1px solid '+statusColor+'44">'+statusIcon+' '+statusText+'</span>' +
            (isOverdue ? '<span style="font-size:11px;padding:3px 10px;border-radius:12px;background:#dc262622;color:#dc2626;font-weight:700;border:1px solid #dc262644">\u26A0\uFE0F '+t('متأخر')+'</span>' : '') +
          '</div>' +
          '<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--text2)">' +
            (order.contractNo ? '<span>'+t('عقد')+': <strong>'+order.contractNo+'</strong></span>' : '') +
            (order.location ? '<span>'+t('الموقع')+': <strong>'+order.location+'</strong></span>' : '') +
            (order.dueDate ? '<span style="'+(isOverdue?'color:#dc2626;font-weight:700':'')+'">'+t('موعد التنفيذ')+': <strong>'+new Date(order.dueDate).toLocaleDateString('ar-SA')+'</strong></span>' : '') +
          '</div>' +
          (order.notes ? '<div style="margin-top:6px;font-size:12px;color:var(--text);background:var(--surface3);padding:6px 10px;border-radius:6px;border:1px solid var(--border)">'+order.notes+'</div>' : '') +
          '<div style="display:flex;align-items:center;gap:8px;margin-top:6px;font-size:12px;flex-wrap:wrap">' +
            '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:8px;background:rgba(37,99,235,0.08);color:#2563eb;font-weight:700;border:1px solid rgba(37,99,235,0.15)">\uD83D\uDC77 '+(order.assignedTo||t('غير محدد'))+'</span>' +
            (order.phone ? '<span style="color:var(--text2)">\uD83D\uDCDE '+order.phone+'</span>' : '') +
            '<span style="color:var(--text2);font-size:11px">'+new Date(order.createdAt).toLocaleDateString('ar-SA')+'</span>' +
            (order.createdBy ? '<span style="color:var(--text2);font-size:11px">'+t('بواسطة')+': '+order.createdBy+'</span>' : '') +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-shrink:0;align-items:center;flex-wrap:wrap">' +
          actionBtns +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ── Create new measurement order ──
function measOrderAddNew() {
  var cu = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  var isAdmin = !cu || cu.isAdmin;
  var hasPerm = isAdmin || (cu && (cu.perms||[]).indexOf('inst_measorder_new') !== -1);
  if(!hasPerm) { notify(t('ليس لديك صلاحية'),'error'); return; }

  var d = loadData();
  var projects = d.projects || [];
  var users = [];
  try { users = JSON.parse(localStorage.getItem('pm_users')||'[]'); } catch(e){}

  var userOpts = users.map(function(u){ return '<option value="'+(u.name||'')+'">'+(u.name||'')+'</option>'; }).join('');

  var modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.innerHTML = '<div class="modal" style="max-width:520px">' +
    '<div class="modal-header">' +
      '<div class="modal-title">\uD83D\uDCCB '+t('أمر رفع مقاسات جديد')+'</div>' +
      '<button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest(\'.modal-bg\').remove()">\u2715</button>' +
    '</div>' +
    '<div class="modal-body">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
        '<div class="form-group" style="grid-column:1/-1"><div class="form-label">'+t('اختر الفني')+' <span style="color:var(--accent3)">*</span></div>' +
          '<select id="moAssignee" style="width:100%"><option value="">— '+t('اختر الفني')+' —</option>'+userOpts+'</select></div>' +
        '<div class="form-group"><div class="form-label">'+t('اسم العميل')+' <span style="color:var(--accent3)">*</span></div>' +
          '<input id="moClient" type="text" list="moProjectsList" placeholder="'+t('اسم العميل')+'" style="width:100%">' +
          '<datalist id="moProjectsList">'+projects.map(function(p){ return '<option value="'+(p.name||'')+'">'+t('عقد')+': '+(p.contractNo||'-')+'</option>'; }).join('')+'</datalist></div>' +
        '<div class="form-group"><div class="form-label">'+t('رقم العقد')+'</div>' +
          '<input id="moContract" type="text" placeholder="'+t('رقم العقد')+'" style="width:100%"></div>' +
        '<div class="form-group"><div class="form-label">'+t('الموقع / العنوان')+' <span style="color:var(--accent3)">*</span></div>' +
          '<input id="moLocation" type="text" placeholder="'+t('العنوان أو الإحداثيات')+'" style="width:100%"></div>' +
        '<div class="form-group"><div class="form-label">'+t('رقم الهاتف')+'</div>' +
          '<input id="moPhone" type="tel" placeholder="05xxxxxxxx" style="width:100%"></div>' +
        '<div class="form-group"><div class="form-label">'+t('موعد رفع المقاسات')+' <span style="color:var(--accent3)">*</span></div>' +
          '<input id="moDueDate" type="date" style="width:100%"></div>' +
        '<div class="form-group" style="grid-column:1/-1"><div class="form-label">'+t('ملاحظات')+'</div>' +
          '<textarea id="moNotes" rows="2" placeholder="'+t('ملاحظات إضافية...')+'" style="width:100%"></textarea></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">' +
        '<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>' +
        '<button class="btn btn-primary" onclick="measOrderSaveNew(this)">\uD83D\uDCBE '+t('إصدار الأمر')+'</button>' +
      '</div>' +
    '</div></div>';
  document.body.appendChild(modal);

  // Auto-fill from project
  var clientEl = document.getElementById('moClient');
  if(clientEl) clientEl.addEventListener('change', function(){
    var p = projects.find(function(pr){ return pr.name === clientEl.value; });
    if(p) {
      if(p.contractNo) document.getElementById('moContract').value = p.contractNo;
      if(p.phone) document.getElementById('moPhone').value = p.phone;
    }
  });

  // Default due date = tomorrow
  var tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  var dd = document.getElementById('moDueDate');
  if(dd) dd.value = tomorrow.toISOString().split('T')[0];

  setTimeout(function(){ var el=document.getElementById('moAssignee'); if(el) el.focus(); }, 200);
}

// ── Save new measurement order ──
function measOrderSaveNew(btn) {
  var assignee = (document.getElementById('moAssignee')?document.getElementById('moAssignee').value:'').trim();
  var client = (document.getElementById('moClient')?document.getElementById('moClient').value:'').trim();
  var location = (document.getElementById('moLocation')?document.getElementById('moLocation').value:'').trim();
  var dueDate = (document.getElementById('moDueDate')?document.getElementById('moDueDate').value:'').trim();
  if(!assignee) { notify(t('اختر الفني'),'error'); return; }
  if(!client) { notify(t('أدخل اسم العميل'),'error'); return; }
  if(!location) { notify(t('أدخل الموقع'),'error'); return; }
  if(!dueDate) { notify(t('حدد موعد رفع المقاسات'),'error'); return; }

  var cu = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  var contractNo = (document.getElementById('moContract')?document.getElementById('moContract').value:'').trim();
  var phone = (document.getElementById('moPhone')?document.getElementById('moPhone').value:'').trim();
  var notes = (document.getElementById('moNotes')?document.getElementById('moNotes').value:'').trim();

  var order = {
    id: 'measord_'+Date.now(),
    assignedTo: assignee,
    clientName: client,
    contractNo: contractNo,
    location: location,
    phone: phone,
    dueDate: dueDate,
    notes: notes,
    createdBy: cu ? cu.name : t('المدير'),
    createdAt: new Date().toISOString(),
    status: 'pending',
    completedAt: null
  };

  var orders = loadMeasOrders();
  orders.unshift(order);
  saveMeasOrders(orders)
    .then(function(r){ return r.json(); })
    .then(function(j){
      if(j.ok){
        btn.closest('.modal-bg').remove();
        _doRenderMeasOrders();
        notify(t('تم إصدار أمر رفع مقاسات وتعيينه إلى')+': '+assignee);
      } else {
        notify('⚠️ '+t('خطأ بالمزامنة'),'error');
      }
    })
    .catch(function(){
      notify('⚠️ '+t('خطأ بالمزامنة'),'error');
    });
}

// ── Technician starts work ──
function measOrderStart(oid) {
  var orders = loadMeasOrders();
  var order = orders.find(function(o){ return o.id === oid; });
  if(!order) return;
  order.status = 'in_progress';
  order.startedAt = new Date().toISOString();
  saveMeasOrders(orders).then(function(){ _doRenderMeasOrders(); }).catch(function(){});
  notify(t('تم بدء العمل'));
}

// ── Mark as completed ──
function measOrderComplete(oid) {
  var orders = loadMeasOrders();
  var order = orders.find(function(o){ return o.id === oid; });
  if(!order) return;
  if(!confirm(t('تأكيد اكتمال رفع المقاسات لـ')+' "'+order.clientName+'"؟')) return;
  order.status = 'completed';
  order.completedAt = new Date().toISOString();
  saveMeasOrders(orders).then(function(){ _doRenderMeasOrders(); }).catch(function(){});
  notify(t('تم اكتمال أمر رفع المقاسات'));
}

// ── Delete order ──
function measOrderDelete(oid) {
  var orders = loadMeasOrders();
  var order = orders.find(function(o){ return o.id === oid; });
  if(!order) return;
  if(!confirm(t('حذف أمر رفع المقاسات؟')+'\n'+order.clientName)) return;
  orders = orders.filter(function(o){ return o.id !== oid; });
  saveMeasOrders(orders).then(function(){ _doRenderMeasOrders(); }).catch(function(){});
  notify(t('تم الحذف'));
}

// ═══════════════════════════════════════════════════
// ══ توزيعة فرق التركيب ══════════════════════════
// ═══════════════════════════════════════════════════

function _loadTeamDist() {
  try { return JSON.parse(localStorage.getItem('pm_team_dist')||'[]'); } catch(e) { return []; }
}
function _saveTeamDist(teams) {
  localStorage.setItem('pm_team_dist', JSON.stringify(teams));
  saveData('pm_team_dist', teams);
}

function renderTeamDist() {
  var el = document.getElementById('teamDistContent'); if(!el) return;
  var teams = _loadTeamDist();
  var projects = loadData().projects || [];
  var emps = (typeof hrLoadEmployees==='function') ? hrLoadEmployees() : [];
  var vehs = (typeof hrLoadVehicles==='function') ? hrLoadVehicles() : [];

  var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">'
    + '<div style="font-size:14px;color:var(--text2)">'+t('توزيع فرق التركيب على المشاريع')+'</div>'
    + '<div style="display:flex;gap:6px">'
    + '<button class="btn btn-primary" onclick="teamDistAddTeam()" style="font-size:13px">➕ '+t('إضافة فرقة')+'</button>'
    + (teams.length?'<button class="btn btn-success" onclick="teamDistSaveHistory()" style="font-size:13px">💾 '+t('حفظ التوزيعة')+'</button>':'')
    + (teams.length?'<button class="btn btn-secondary" onclick="teamDistPrint()" style="font-size:13px">🖨️ '+t('طباعة التوزيعة')+'</button>':'')
    + '</div></div>';

  if(!teams.length) {
    html += '<div style="text-align:center;padding:60px 20px;color:var(--text2)">'
      + '<div style="font-size:48px;margin-bottom:12px;opacity:.5">👷</div>'
      + '<div style="font-size:16px;font-weight:700;margin-bottom:6px">'+t('لا توجد فرق تركيب')+'</div>'
      + '<div style="font-size:13px">'+t('اضغط "إضافة فرقة" لإنشاء فرقة تركيب جديدة')+'</div>'
      + '</div>';
    el.innerHTML = html;
    return;
  }

  teams.forEach(function(team, ti) {
    // Get team employees from HR
    var teamEmps = emps.filter(function(e){ return e.teamId===team.id && e.status!=='terminated'; });
    var leaderEmp = teamEmps.find(function(e){ return e.role&&e.role.indexOf('مدير')>-1; });
    var workers = teamEmps.filter(function(e){ return !e.role||e.role.indexOf('مدير')===-1; });
    var teamVeh = null;
    // Get vehicle — from leader or first employee with vehicle
    var vehEmp = teamEmps.find(function(e){ return e.vehicleId; });
    if(vehEmp) teamVeh = vehs.find(function(v){ return v.id===vehEmp.vehicleId; });

    html += '<div class="card" style="margin-bottom:16px;border-right:4px solid '+(team.color||'#1a3a5c')+'">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">'
      + '<div style="display:flex;align-items:center;gap:10px">'
      + '<div style="width:36px;height:36px;border-radius:50%;background:'+(team.color||'#1a3a5c')+';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px">'+(ti+1)+'</div>'
      + '<div><div style="font-size:15px;font-weight:700;color:var(--text)">'+(team.name||t('فرقة')+' '+(ti+1))+'</div>'
      + '<div style="font-size:11px;color:var(--text2)">👷 '+t('مدير الفرقة:')+' <strong>'+(leaderEmp?leaderEmp.name:team.leader||'-')+'</strong> | '+t('العمال:')+' <strong>'+workers.length+'</strong>'
      + (teamVeh?' | 🚗 '+teamVeh.plateNumber:'')+'</div></div>'
      + '</div>'
      + '<div style="display:flex;gap:6px">'
      + '<button class="btn btn-sm btn-secondary" onclick="teamDistEdit('+ti+')">✏️</button>'
      + '<button class="btn btn-sm" style="background:#7c3aed;color:#fff;border-color:#7c3aed" onclick="teamDistManageWorkers('+ti+')">👷 '+t('العمال')+'</button>'
      + '<button class="btn btn-sm btn-success" onclick="teamDistAddProject('+ti+')">➕ '+t('عميل')+'</button>'
      + '<button class="btn btn-sm btn-danger" onclick="teamDistRemoveTeam('+ti+')">🗑️</button>'
      + '</div></div>';

    // Show team employees
    if(teamEmps.length) {
      html += '<div style="margin-bottom:10px;display:flex;flex-wrap:wrap;gap:6px">';
      teamEmps.forEach(function(e){
        var isLeader = e.role&&e.role.indexOf('مدير')>-1;
        html += '<div style="padding:4px 10px;border-radius:6px;font-size:11px;background:'+(isLeader?team.color+'22':'var(--surface2)')+';border:1px solid '+(isLeader?team.color:'var(--border)')+';display:flex;align-items:center;gap:4px">'
          + (isLeader?'🧑‍💼':'👷')+' <strong>'+e.name+'</strong>'
          + (e.iqama?' <span style="color:var(--text2);font-size:10px">| '+e.iqama+'</span>':'')
          + (e.phone?' <span style="color:var(--text2);font-size:10px">| 📱'+e.phone+'</span>':'')
          + '</div>';
      });
      html += '</div>';
    }

    // Notes input per team
    html += '<div style="margin-bottom:8px"><input type="text" id="teamNote_'+ti+'" placeholder="📝 '+t('ملاحظات لهذه الفرقة...')+'" value="'+(team.note||'').replace(/"/g,'&quot;')+'" onchange="_teamNoteSave('+ti+',this.value)" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:11px;font-family:Cairo,sans-serif"></div>';

    // Projects assigned
    if(team.projects && team.projects.length) {
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px">';
      team.projects.forEach(function(pid, pi) {
        var p = projects.find(function(x){return x.id===pid;});
        if(!p) return;
        html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface2);border-radius:8px;border:1px solid var(--border)">'
          + '<div style="flex:1;min-width:0">'
          + '<div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(p.name||'-')+'</div>'
          + '<div style="font-size:11px;color:var(--text2)">'+(p.contractNo||'-')+' | '+(p.company||'-')+' | '+(p.region||'-')+' / '+(p.gallery||'-')+'</div>'
          + '</div>'
          + '<button class="btn btn-sm btn-danger btn-icon" onclick="teamDistRemoveProject('+ti+','+pi+')" style="flex-shrink:0">✕</button>'
          + '</div>';
      });
      html += '</div>';
    } else {
      html += '<div style="text-align:center;padding:16px;color:var(--text2);font-size:12px;background:var(--surface2);border-radius:8px">'+t('لا يوجد عملاء')+'</div>';
    }
    html += '</div>';
  });

  el.innerHTML = html;
}

function teamDistAddTeam() {
  var teams = _loadTeamDist();
  var colors = ['#1a3a5c','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2','#be185d','#65a30d'];
  var name = prompt(t('اسم الفرقة:'), t('فرقة')+' '+(teams.length+1));
  if(!name) return;
  teams.push({
    id: 'team_'+Date.now(),
    name: name,
    leader: '',
    workers: 0,
    color: colors[teams.length % colors.length],
    projects: []
  });
  _saveTeamDist(teams);
  renderTeamDist();
  notify('✅ '+t('تمت إضافة الفرقة — أضف الموظفين من قسم الموظفين'));
}

function teamDistEdit(ti) {
  var teams = _loadTeamDist();
  var team = teams[ti]; if(!team) return;
  var name = prompt(t('اسم الفرقة:'), team.name);
  if(!name) return;
  team.name = name;
  _saveTeamDist(teams);
  renderTeamDist();
}

function teamDistRemoveTeam(ti) {
  if(!confirm(t('حذف هذه الفرقة؟'))) return;
  var teams = _loadTeamDist();
  teams.splice(ti, 1);
  _saveTeamDist(teams);
  renderTeamDist();
  notify(t('تم حذف الفرقة'));
}

function teamDistAddProject(ti) {
  var teams = _loadTeamDist();
  var team = teams[ti]; if(!team) return;
  var projects = loadData().projects || [];
  // اللي مش مضافين لأي فرقة أو لهاي الفرقة
  var allAssigned = [];
  teams.forEach(function(t2){ (t2.projects||[]).forEach(function(p){ allAssigned.push(p); }); });
  var available = projects.filter(function(p){ return allAssigned.indexOf(p.id) === -1; });

  if(!available.length) { notify(t('جميع المشاريع موزعة على الفرق'),'error'); return; }

  // Build selection modal
  var modal = document.createElement('div');
  modal.className = 'modal-bg';
  var opts = available.map(function(p){
    return '<label style="display:flex;gap:8px;align-items:center;padding:8px 10px;border-radius:6px;background:var(--surface2);margin-bottom:4px;cursor:pointer">'
      + '<input type="checkbox" value="'+p.id+'" style="accent-color:#1a3a5c;width:16px;height:16px">'
      + '<div><div style="font-size:12px;font-weight:600">'+(p.name||'-')+'</div>'
      + '<div style="font-size:10px;color:var(--text2)">'+(p.contractNo||'')+' | '+(p.company||'')+' | '+(p.region||'')+' / '+(p.gallery||'')+'</div></div>'
      + '</label>';
  }).join('');

  modal.innerHTML = '<div class="modal" style="max-width:440px;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)">'
    + '<div style="background:linear-gradient(135deg,#1a3a5c,#2563eb);color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">'
    + '<div style="font-size:15px;font-weight:700">➕ '+t('إضافة عملاء لـ')+' '+team.name+'</div>'
    + '<button style="background:rgba(255,255,255,.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px" onclick="this.closest(\'.modal-bg\').remove()">✕</button>'
    + '</div>'
    + '<div class="modal-body" style="padding:14px 18px;max-height:400px;overflow-y:auto">' + opts + '</div>'
    + '<div style="padding:12px 18px;display:flex;justify-content:flex-end;gap:8px;border-top:1px solid var(--border)">'
    + '<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>'
    + '<button class="btn btn-primary" onclick="_teamDistConfirmAdd('+ti+',this)">✅ '+t('إضافة')+'</button>'
    + '</div></div>';
  document.body.appendChild(modal);
}

function _teamDistConfirmAdd(ti, btn) {
  var modal = btn.closest('.modal-bg');
  var checked = modal.querySelectorAll('input[type=checkbox]:checked');
  var teams = _loadTeamDist();
  var team = teams[ti]; if(!team) { modal.remove(); return; }
  if(!team.projects) team.projects = [];
  checked.forEach(function(cb) { team.projects.push(cb.value); });
  _saveTeamDist(teams);
  modal.remove();
  renderTeamDist();
  notify('✅ '+t('تمت إضافة')+' '+checked.length+' '+t('عميل'));
}

function teamDistRemoveProject(ti, pi) {
  var teams = _loadTeamDist();
  var team = teams[ti]; if(!team || !team.projects) return;
  team.projects.splice(pi, 1);
  _saveTeamDist(teams);
  renderTeamDist();
}

// ── حفظ ملاحظة لكل فرقة ──
function _teamNoteSave(ti, val) {
  var teams = _loadTeamDist();
  if(teams[ti]) { teams[ti].note = val; _saveTeamDist(teams); }
}

// ── تبديل عمال الفرقة (dropdown) ──
function teamDistManageWorkers(ti) {
  var teams = _loadTeamDist();
  var team = teams[ti]; if(!team) return;
  var emps = (typeof hrLoadEmployees==='function') ? hrLoadEmployees() : [];
  var installEmps = emps.filter(function(e){ return e.departmentId==='dept_install' && e.status!=='terminated' && !(e.role&&e.role.indexOf('مدير تركيبات')>-1); });
  var currentIds = installEmps.filter(function(e){ return e.teamId===team.id; }).map(function(e){ return e.id; });

  var opts = installEmps.map(function(e){
    var checked = currentIds.indexOf(e.id)>-1;
    var otherTeam = !checked && e.teamId ? teams.find(function(t2){return t2.id===e.teamId;}) : null;
    return '<label style="display:flex;gap:8px;align-items:center;padding:6px 10px;border-radius:6px;background:var(--surface2);margin-bottom:3px;cursor:pointer;font-size:12px">'
      + '<input type="checkbox" value="'+e.id+'"'+(checked?' checked':'')+' style="accent-color:'+(team.color||'#1a3a5c')+';width:16px;height:16px">'
      + '<div><strong>'+e.name+'</strong> <span style="font-size:10px;color:var(--text2)">'+(e.role||'')+'</span>'
      + (otherTeam?'<span style="font-size:9px;color:#d97706"> (حالياً في '+otherTeam.name+')</span>':'')
      + '</div></label>';
  }).join('');

  var modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.innerHTML = '<div class="modal" style="max-width:420px;border-radius:16px;overflow:hidden">'
    + '<div style="background:'+(team.color||'#1a3a5c')+';color:#fff;padding:14px 18px;font-size:14px;font-weight:700">👷 '+t('إدارة عمال')+' — '+team.name+'</div>'
    + '<div class="modal-body" style="padding:12px 16px;max-height:350px;overflow-y:auto">'
    + (opts||'<div style="text-align:center;padding:20px;color:var(--text2)">'+t('لا يوجد موظفين بقسم التركيبات — أضفهم من قسم الموظفين')+'</div>')
    + '</div>'
    + '<div style="padding:10px 16px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:6px">'
    + '<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>'
    + '<button class="btn btn-primary" onclick="_teamDistSaveWorkers('+ti+',this)">💾 '+t('حفظ')+'</button>'
    + '</div></div>';
  document.body.appendChild(modal);
}

function _teamDistSaveWorkers(ti, btn) {
  var modal = btn.closest('.modal-bg');
  var teams = _loadTeamDist();
  var team = teams[ti]; if(!team) { modal.remove(); return; }
  var emps = (typeof hrLoadEmployees==='function') ? hrLoadEmployees() : [];
  var checked = [];
  modal.querySelectorAll('input[type=checkbox]:checked').forEach(function(cb){ checked.push(cb.value); });
  var unchecked = [];
  modal.querySelectorAll('input[type=checkbox]:not(:checked)').forEach(function(cb){ unchecked.push(cb.value); });

  // Update employee teamId
  emps.forEach(function(e) {
    if(checked.indexOf(e.id)>-1) e.teamId = team.id;
    else if(unchecked.indexOf(e.id)>-1 && e.teamId===team.id) e.teamId = null;
  });
  if(typeof hrSaveEmployees==='function') hrSaveEmployees(emps);
  modal.remove();
  renderTeamDist();
  notify('✅ '+t('تم تحديث عمال')+' '+team.name);
}

// ── حفظ التوزيعة بالسجل ──
function _loadTeamHistory() { try { return JSON.parse(localStorage.getItem('pm_team_history')||'[]'); } catch(e) { return []; } }
function _saveTeamHistory(arr) { localStorage.setItem('pm_team_history', JSON.stringify(arr)); saveData('pm_team_history', arr); }

function teamDistSaveHistory() {
  var teams = _loadTeamDist();
  var projects = loadData().projects || [];
  var emps = (typeof hrLoadEmployees==='function') ? hrLoadEmployees() : [];
  var vehs = (typeof hrLoadVehicles==='function') ? hrLoadVehicles() : [];
  var now = new Date();
  var today = new Date(now);
  if(now.getHours() >= 17) { today.setDate(today.getDate() + 1); }
  var dailyCode = String(Math.floor(Math.random()*90)+10);

  var snapshot = teams.map(function(team) {
    var teamEmps = emps.filter(function(e){ return e.teamId===team.id && e.status!=='terminated'; });
    var leader = teamEmps.find(function(e){ return e.role&&e.role.indexOf('مدير')>-1; });
    var workers = teamEmps.filter(function(e){ return !e.role||e.role.indexOf('مدير')===-1; });
    var vehEmp = teamEmps.find(function(e){ return e.vehicleId; });
    var veh = vehEmp ? vehs.find(function(v){return v.id===vehEmp.vehicleId;}) : null;
    var projs = (team.projects||[]).map(function(pid){ var p=projects.find(function(x){return x.id===pid;}); return p?{name:p.name,company:p.company,region:p.region,gallery:p.gallery}:null; }).filter(Boolean);
    return {
      name: team.name, color: team.color, note: team.note||'',
      leader: leader ? {name:leader.name, phone:leader.phone, iqama:leader.iqama} : null,
      workers: workers.map(function(w){ return w.name; }),
      vehicle: veh ? {type:veh.type, plate:veh.plateNumber} : null,
      projects: projs
    };
  });

  var history = _loadTeamHistory();
  history.unshift({
    id: 'hist_'+Date.now(),
    date: today.toISOString().split('T')[0],
    day: ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][today.getDay()],
    code: dailyCode,
    teams: snapshot
  });
  // Keep last 90 days
  if(history.length > 90) history = history.slice(0, 90);
  _saveTeamHistory(history);
  notify('✅ '+t('تم حفظ التوزيعة — ')+today.toISOString().split('T')[0]);
}

function renderTeamHistory() {
  var el = document.getElementById('teamHistoryContent'); if(!el) return;
  var history = _loadTeamHistory();

  if(!history.length) {
    el.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text2)"><div style="font-size:48px;margin-bottom:12px;opacity:.5">📂</div><div style="font-size:16px;font-weight:700;margin-bottom:6px">'+t('لا يوجد سجل')+'</div><div style="font-size:13px">'+t('اضغط "حفظ التوزيعة" من صفحة التوزيعة لحفظ السجل')+'</div></div>';
    return;
  }

  var html = '<div style="font-size:14px;color:var(--text2);margin-bottom:16px">'+t('سجل حركة الفرق — آخر 90 يوم')+'</div>';
  history.forEach(function(h) {
    html += '<div class="card" style="margin-bottom:10px;padding:12px">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'
      + '<div style="font-size:13px;font-weight:700;color:var(--accent)">📅 '+h.day+' — '+h.date+' <span style="background:#fff3cd;padding:2px 8px;border-radius:4px;font-family:monospace;color:#c62828;font-size:12px">'+h.code+'</span></div>'
      + '<div style="display:flex;gap:4px">'
      + '<button class="btn btn-sm btn-secondary" onclick="teamHistoryPrint(\''+h.id+'\')">🖨️</button>'
      + '<button class="btn btn-sm btn-danger" onclick="teamHistoryDelete(\''+h.id+'\')">🗑️</button>'
      + '</div></div>';

    h.teams.forEach(function(tm) {
      html += '<div style="padding:6px 10px;border-right:3px solid '+(tm.color||'#1a3a5c')+';background:var(--surface2);border-radius:4px;margin-bottom:4px;font-size:11px">'
        + '<strong style="color:'+(tm.color||'#1a3a5c')+'">'+tm.name+'</strong>'
        + (tm.leader?' — 🧑‍💼 '+tm.leader.name:'')
        + (tm.workers.length?' — 👷 '+tm.workers.join('، '):'')
        + (tm.vehicle?' — 🚗 '+tm.vehicle.plate:'')
        + (tm.note?' — <em style="color:#d97706">📝 '+tm.note+'</em>':'');
      if(tm.projects.length) {
        html += '<div style="font-size:10px;color:var(--text2);margin-top:2px">📍 '+tm.projects.map(function(p){return p.name+' ('+p.company+')';}).join(' | ')+'</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  });
  el.innerHTML = html;
}

function teamHistoryDelete(id) {
  if(!confirm(t('حذف هذا السجل؟'))) return;
  var history = _loadTeamHistory().filter(function(h){return h.id!==id;});
  _saveTeamHistory(history);
  renderTeamHistory();
}

function teamHistoryPrint(id) {
  var history = _loadTeamHistory();
  var h = history.find(function(x){return x.id===id;});
  if(!h) return;
  // Reuse print with saved data
  _doTeamDistPrintFromData(h);
}

function _doTeamDistPrintFromData(h) {
  var sigImg = (typeof getSignatureHTML==='function') ? getSignatureHTML() : '';
  var teamsHTML = '';
  h.teams.forEach(function(tm) {
    var vehTag = '';
    if(tm.vehicle) {
      vehTag = ' <span style="font-size:13px;font-weight:600;margin-right:8px;background:rgba(255,255,255,.2);padding:3px 10px;border-radius:5px">'
        + '🚗 '+(tm.vehicle.type||'')+' — <span style="direction:ltr;font-family:monospace;letter-spacing:1px">'+(tm.vehicle.plate||tm.vehicle.plateNumber||'')+'</span></span>';
    }
    teamsHTML += '<div style="margin-bottom:16px;border:2.5px solid '+(tm.color||'#1a3a5c')+';border-radius:10px;overflow:hidden;page-break-inside:avoid">'
      + '<div style="background:'+(tm.color||'#1a3a5c')+';color:#fff;padding:10px 16px;font-size:16px;font-weight:800">'
      + tm.name + vehTag
      + '</div><div style="padding:12px 16px">';
    if(tm.leader) {
      teamsHTML += '<div style="display:flex;align-items:center;gap:14px;padding:8px 14px;background:#eef2ff;border-radius:8px;margin-bottom:10px;border-right:4px solid '+(tm.color||'#1a3a5c')+'">'
        + '<div style="font-size:15px;font-weight:700;color:#000">🧑‍💼 مدير الفرقة: '+tm.leader.name+'</div>'
        + (tm.leader.phone?'<div style="font-size:14px;color:#111;font-weight:600">📱 '+tm.leader.phone+'</div>':'')
        + (tm.leader.iqama?'<div style="font-size:14px;color:#111;font-weight:600;direction:ltr">🪪 '+tm.leader.iqama+'</div>':'')
        + '</div>';
    }
    if(tm.workers.length) {
      teamsHTML += '<div style="font-size:14px;color:#000;margin-bottom:10px;font-weight:600"><strong>👷 العمال:</strong> '+tm.workers.join(' — ')+'</div>';
    }
    if(tm.projects.length) {
      teamsHTML += '<div style="font-size:14px;color:#000;font-weight:700;margin-bottom:6px">📍 المشاريع:</div>';
      tm.projects.forEach(function(p) { teamsHTML += '<div style="font-size:14px;color:#000;padding:5px 14px;margin-bottom:4px;background:#f8fafc;border-radius:6px;border-right:4px solid '+(tm.color||'#1a3a5c')+'"><strong>'+p.name+'</strong> — '+(p.company||'')+' — '+(p.region||'')+' / '+(p.gallery||'')+'</div>'; });
    }
    if(tm.note) teamsHTML += '<div style="font-size:14px;color:#78350f;margin-top:8px;font-weight:700"><strong>📝</strong> '+tm.note+'</div>';
    teamsHTML += '</div></div>';
  });

  var w = window.open('','_blank','width=900,height=700,scrollbars=yes');
  if(!w) { alert('يرجى السماح بالنوافذ المنبثقة (Pop-ups) في المتصفح'); return; }
  w.document.write('<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>توزيعة — '+h.date+'</title>'
    + '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">'
    + '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Cairo",sans-serif;direction:rtl;background:#fff;color:#000;font-size:14px;padding:10mm;-webkit-text-size-adjust:100%}'
    + '@media print{.nopr{display:none!important}@page{size:A4 portrait;margin:8mm}body{padding:0}}'
    + '@media(max-width:600px){body{padding:4mm;font-size:15px}}'
    + '.nopr{position:fixed;top:10px;left:10px;z-index:999;display:flex;gap:8px;background:linear-gradient(135deg,#1a3a5c,#2563eb);padding:8px 14px;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.3)}'
    + '.nopr button{padding:6px 16px;border:none;border-radius:5px;cursor:pointer;font-family:"Cairo",sans-serif;font-size:13px;font-weight:700}'
    + '</style></head><body>'
    + '<div class="nopr"><button style="background:#fff;color:#1a3a5c" onclick="window.print()">🖨️ طباعة</button><button style="background:rgba(255,255,255,.2);color:#fff" onclick="window.close()">✖ إغلاق</button></div>'
    + '<div style="text-align:center;border-bottom:4px solid #1a3a5c;padding-bottom:12px;margin-bottom:16px">'
    + '<div style="font-size:22px;font-weight:900;color:#000">توزيعة قسم التركيبات</div>'
    + '<div style="font-size:16px;color:#111;margin-top:4px;font-weight:700">مصنع ألمنيوم ملهم</div>'
    + '<div style="display:flex;justify-content:center;gap:24px;margin-top:10px;font-size:15px;color:#000;font-weight:600">'
    + '<span>📅 <strong>'+h.day+'</strong> — '+h.date+'</span>'
    + '<span>الكود: <strong style="color:#991b1b;font-size:20px;font-family:monospace;background:#fef3c7;padding:3px 14px;border-radius:5px;border:2px solid #f59e0b">'+h.code+'</strong></span>'
    + '</div>'
    + '<div style="font-size:13px;color:#333;margin-top:6px;font-weight:700">(يجب ذكر الكود أثناء تصوير الفيديو عند وصول الموقع وذكر اليوم والتاريخ)</div>'
    + '</div>'
    + teamsHTML
    + '<div style="margin-top:14px;padding:12px 16px;background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;font-size:14px;color:#78350f;font-weight:700">'
    + '<strong>⚠️ ملاحظة مهمة:</strong> الالتزام بإرسال التقرير اليومي لسير العمل نهاية اليوم مع تصوير الأعمال التي تم تنفيذها.'
    + '</div>'
    + '<div style="margin-top:20px;display:flex;justify-content:flex-start"><div style="border-top:2.5px solid #1a3a5c;padding-top:8px;min-width:200px;text-align:center;font-size:14px"><strong>مدير المكتب الفني</strong>'
    + (sigImg?'<div style="margin:4px 0">'+sigImg+'</div>':'<br><br>')
    + '<span style="font-size:12px;color:#333;font-weight:600">الاسم / التوقيع</span></div></div>'
    + '</body></html>');
  w.document.close();
}

// ═══════════════════════════════════════════
// ══ طباعة التوزيعة اليومية ═══════════════
// ═══════════════════════════════════════════
function teamDistPrint() {
  var teams = _loadTeamDist();
  if(!teams.length) { notify(t('لا توجد فرق'),'error'); return; }

  // Save notes from inputs first
  teams.forEach(function(team, ti) {
    var inp = document.getElementById('teamNote_'+ti);
    if(inp) team.note = inp.value;
  });
  _saveTeamDist(teams);

  var projects = loadData().projects || [];
  var emps = (typeof hrLoadEmployees==='function') ? hrLoadEmployees() : [];
  var vehs = (typeof hrLoadVehicles==='function') ? hrLoadVehicles() : [];
  var sigImg = (typeof getSignatureHTML==='function') ? getSignatureHTML() : '';

  // بعد الساعة 5 المسا — نعرض تاريخ بكرا
  var now = new Date();
  var targetDate = new Date(now);
  if(now.getHours() >= 17) { targetDate.setDate(targetDate.getDate() + 1); }
  var dateStr = targetDate.toISOString().split('T')[0];
  var dayNames = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  var dayName = dayNames[targetDate.getDay()];
  var dateAr = targetDate.toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'});
  // كود عشوائي — رقمين
  var dailyCode = String(Math.floor(Math.random()*90)+10);

  // Build teams
  var teamsHTML = '';
  teams.forEach(function(team, ti) {
    var teamEmps = emps.filter(function(e){ return e.teamId===team.id && e.status!=='terminated'; });
    var leaderEmp = teamEmps.find(function(e){ return e.role&&e.role.indexOf('مدير')>-1; });
    var workerEmps = teamEmps.filter(function(e){ return !e.role||e.role.indexOf('مدير')===-1; });
    var vehEmp = teamEmps.find(function(e){ return e.vehicleId; });
    var teamVeh = vehEmp ? vehs.find(function(v){ return v.id===vehEmp.vehicleId; }) : null;

    // Projects for this team
    var projList = (team.projects||[]).map(function(pid){
      var p = projects.find(function(x){return x.id===pid;});
      if(!p) return null;
      return {name:p.name||'', company:p.company||'', region:p.region||'', gallery:p.gallery||''};
    }).filter(Boolean);

    // Header: team name + vehicle on same side (right in RTL)
    var vehTag = '';
    if(teamVeh) {
      vehTag = ' <span style="font-size:13px;font-weight:600;margin-right:8px;background:rgba(255,255,255,.2);padding:3px 10px;border-radius:5px">'
        + '🚗 '+(teamVeh.type||'')+' — <span style="direction:ltr;font-family:monospace;letter-spacing:1px">'+(teamVeh.plateNumber||'')+'</span></span>';
    }
    teamsHTML += '<div style="margin-bottom:16px;border:2.5px solid '+(team.color||'#1a3a5c')+';border-radius:10px;overflow:hidden;page-break-inside:avoid">'
      + '<div style="background:'+(team.color||'#1a3a5c')+';color:#fff;padding:10px 16px;font-size:16px;font-weight:800">'
      + (team.name||'فرقة '+(ti+1)) + vehTag
      + '</div>'
      + '<div style="padding:12px 16px">';

    // Leader info
    if(leaderEmp) {
      teamsHTML += '<div style="display:flex;align-items:center;gap:14px;padding:8px 14px;background:#eef2ff;border-radius:8px;margin-bottom:10px;border-right:4px solid '+(team.color||'#1a3a5c')+'">'
        + '<div style="font-size:15px;font-weight:700;color:#000">🧑‍💼 مدير الفرقة: '+leaderEmp.name+'</div>'
        + (leaderEmp.phone?'<div style="font-size:14px;color:#111;font-weight:600">📱 '+leaderEmp.phone+'</div>':'')
        + (leaderEmp.iqama?'<div style="font-size:14px;color:#111;font-weight:600;direction:ltr">🪪 '+leaderEmp.iqama+'</div>':'')
        + '</div>';
    }

    // Workers
    if(workerEmps.length) {
      teamsHTML += '<div style="font-size:14px;color:#000;margin-bottom:10px;font-weight:600"><strong>👷 العمال:</strong> '
        + workerEmps.map(function(w){ return w.name; }).join(' — ')
        + '</div>';
    }

    // Projects
    if(projList.length) {
      teamsHTML += '<div style="font-size:14px;color:#000;font-weight:700;margin-bottom:6px">📍 المشاريع:</div>';
      projList.forEach(function(pr) {
        teamsHTML += '<div style="padding:5px 14px;margin-bottom:4px;background:#f8fafc;border-radius:6px;border-right:4px solid '+(team.color||'#1a3a5c')+'">'
          + '<span style="font-size:14px;font-weight:800;color:#000">'+pr.name+'</span>'
          + '<span style="font-size:13px;color:#222;margin-right:10px;font-weight:600">'+pr.company+' — '+pr.region+' / '+pr.gallery+'</span>'
          + '</div>';
      });
    }

    // Note
    if(team.note) teamsHTML += '<div style="font-size:14px;color:#78350f;margin-top:8px;font-weight:700"><strong>📝</strong> '+team.note+'</div>';

    teamsHTML += '</div></div>';
  });

  // Open print window
  var w = window.open('','_blank','width=900,height=700,scrollbars=yes');
  if(!w) { alert('يرجى السماح بالنوافذ المنبثقة (Pop-ups) في المتصفح'); return; }
  w.document.write('<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">'
    + '<title>توزيعة التركيبات — '+dateStr+'</title>'
    + '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">'
    + '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Cairo",sans-serif;direction:rtl;background:#fff;color:#000;font-size:14px;padding:10mm;-webkit-text-size-adjust:100%}'
    + '@media print{.nopr{display:none!important}@page{size:A4 portrait;margin:8mm}body{padding:0}}'
    + '@media(max-width:600px){body{padding:4mm;font-size:15px}}'
    + '.nopr{position:fixed;top:10px;left:10px;z-index:999;display:flex;gap:8px;background:linear-gradient(135deg,#1a3a5c,#2563eb);padding:8px 14px;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.3)}'
    + '.nopr button{padding:6px 16px;border:none;border-radius:5px;cursor:pointer;font-family:"Cairo",sans-serif;font-size:13px;font-weight:700}'
    + '</style></head><body>'
    + '<div class="nopr"><button style="background:#fff;color:#1a3a5c" onclick="window.print()">🖨️ طباعة</button><button style="background:rgba(255,255,255,.2);color:#fff" onclick="window.close()">✖ إغلاق</button></div>'
    // Header
    + '<div style="text-align:center;border-bottom:4px solid #1a3a5c;padding-bottom:12px;margin-bottom:16px">'
    + '<div style="font-size:22px;font-weight:900;color:#000">توزيعة قسم التركيبات</div>'
    + '<div style="font-size:16px;color:#111;margin-top:4px;font-weight:700">مصنع ألمنيوم ملهم</div>'
    + '<div style="display:flex;justify-content:center;gap:24px;margin-top:10px;font-size:15px;color:#000;font-weight:600">'
    + '<span>📅 <strong>'+dayName+'</strong> — '+dateAr+'</span>'
    + '<span>الكود اليومي: <strong style="color:#991b1b;font-size:20px;font-family:monospace;background:#fef3c7;padding:3px 14px;border-radius:5px;border:2px solid #f59e0b">'+dailyCode+'</strong></span>'
    + '</div>'
    + '<div style="font-size:13px;color:#333;margin-top:6px;font-weight:700">(يجب ذكر الكود أثناء تصوير الفيديو عند وصول الموقع وذكر اليوم والتاريخ)</div>'
    + '</div>'
    // Teams
    + teamsHTML
    // Important note
    + '<div style="margin-top:14px;padding:12px 16px;background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;font-size:14px;color:#78350f;font-weight:700">'
    + '<strong>⚠️ ملاحظة مهمة:</strong> الالتزام بإرسال التقرير اليومي لسير العمل نهاية اليوم مع تصوير الأعمال التي تم تنفيذها.'
    + '</div>'
    // Signature
    + '<div style="margin-top:20px;display:flex;justify-content:flex-start">'
    + '<div style="border-top:2.5px solid #1a3a5c;padding-top:8px;min-width:200px;text-align:center;font-size:14px">'
    + '<strong>مدير المكتب الفني</strong>'
    + (sigImg?'<div style="margin:4px 0">'+sigImg+'</div>':'<br><br>')
    + '<span style="font-size:12px;color:#333;font-weight:600">الاسم / التوقيع</span>'
    + '</div></div>'
    + '</body></html>');
  w.document.close();
}

// ── Auto-sync ──
_syncMaintFromServer().catch(function(){});
_syncDefectsFromServer().catch(function(){});
_syncDeliveryFromServer().catch(function(){});
_syncMeasOrdersFromServer().catch(function(){});
