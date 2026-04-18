function openMeasurements(id){
  const {projects}=loadData(),p=projects.find(x=>x.id===id);if(!p)return;
  const sections=loadSections();
  const ROWS=15;
  const saved=getMeasurementsData(id);
  let rows=saved||Array.from({length:ROWS},(_,i)=>({code:`W${String(i+1).padStart(2,'0')}`,width:'',height:'',sectionName:'',description:'',notes:''}));
  while(rows.length<ROWS){const n=rows.length+1;rows.push({code:`W${String(n).padStart(2,'0')}`,width:'',height:'',sectionName:'',description:'',notes:''});}
  const existImg=localStorage.getItem('pm_measimg_'+id)||null;
  const MID='measModal_'+id;
  const existM=document.getElementById(MID);if(existM)existM.remove();
  // Check price permission
  const _cu=(typeof getCurrentUser==='function')?getCurrentUser():null;
  const _canPrice=!_cu||_cu.isAdmin||((_cu.perms||[]).indexOf('btn_price')!==-1);

  function buildRow(r,i){
    const sel_opts=sections.map(s=>`<option value="${s.name}"${r.sectionName===s.name?' selected':''}>${s.name}</option>`).join('');
    const active=r.width||r.height||r.description;
    const hasPhoto=r._localPhoto||r.serverPhoto||r.photo?true:false;
    return `<tr id="mr_${id}_${i}" style="${active?'':'opacity:.42'}">
      <td style="text-align:center;font-size:11px;color:var(--text2);padding:3px 2px">${i+1}</td>
      <td style="padding:3px"><input value="${r.code||''}" style="width:52px;font-weight:700;color:var(--accent2)" oninput="mUpd('${id}',${i},'code',this.value)"></td>
      <td style="padding:3px"><input type="number" value="${r.width||''}" style="width:74px" placeholder="0" data-col="w" data-row="${i}" data-pid="${id}" oninput="mUpd('${id}',${i},'width',this.value);mAct('${id}',${i})" onkeydown="mNavKey(event,'${id}',${i},'w')"></td>
      <td style="padding:3px"><input type="number" value="${r.height||''}" style="width:74px" placeholder="0" data-col="h" data-row="${i}" data-pid="${id}" oninput="mUpd('${id}',${i},'height',this.value);mAct('${id}',${i})" onkeydown="mNavKey(event,'${id}',${i},'h')"></td>
      <td style="padding:3px"><select style="width:128px" onchange="mUpd('${id}',${i},'sectionName',this.value)"><option value="">${t('— اختر —')}</option>${sel_opts}</select></td>
      <td style="padding:3px"><input value="${r.description||''}" style="width:100%;min-width:80px" placeholder=t('وصف...') oninput="mUpd('${id}',${i},'description',this.value)"></td>
      <td style="padding:3px"><input value="${r.notes||''}" style="width:90px" placeholder=t('ملاحظات') oninput="mUpd('${id}',${i},'notes',this.value)"></td>
      <td style="padding:2px;text-align:center">
        <div style="display:flex;gap:2px;align-items:center">
          <label style="cursor:pointer;font-size:14px;padding:2px 4px;border-radius:4px;background:${hasPhoto?'var(--accent)':'var(--surface3)'};color:${hasPhoto?'#fff':'var(--text2)'}" title="${hasPhoto?t('صورة مرفقة — اضغط لتغييرها'):t('التقاط / إضافة صورة')}">
            📷<input type="file" accept="image/*" capture="environment" style="display:none" onchange="mRowPhoto(this,'${id}',${i})">
          </label>
          <button id="mEye_${id}_${i}" class="btn btn-sm" onclick="mViewPhoto('${id}',${i})" style="padding:2px 5px;font-size:13px;display:${hasPhoto?'inline-flex':'none'};background:var(--surface3);color:var(--accent)" title="${t('عرض الصورة')}">👁️</button>
          <button class="btn btn-sm btn-danger" onclick="mDelRow('${id}',${i})" style="padding:2px 5px;font-size:11px">✕</button>
        </div>
      </td>
    </tr>`;
  }

  const modal=document.createElement('div');modal.className='modal-bg';modal.id=MID;
  modal.innerHTML=`
    <div class="modal" style="max-width:1360px;width:97vw;max-height:100vh">
      <div class="modal-header">
        <div class="modal-title">${t('📐 المقاسات —')} ${p.name}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          <button class="btn btn-sm btn-success" onclick="mAddRow('${id}')">${t('سطر +')}</button>
          <button class="btn btn-sm btn-primary" onclick="mSave('${id}')">${t('💾 حفظ')}</button>
          <button class="btn btn-sm btn-secondary" onclick="mPrint('${id}','${p.name.replace(/'/g,"\\'")}')">🖨️</button>
          ${_canPrice?`<button class="btn btn-sm btn-warning" onclick="openPriceList('${id}')">${t('💰 الأسعار')}</button>`:''}
          <label class="btn btn-sm btn-secondary" style="cursor:pointer;margin:0">${t('📥 Excel')} <input type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="mExcelImport(this,'${id}')"></label>
          <button class="btn btn-sm btn-secondary" onclick="mToggleRefPanel('${id}')" id="mRefBtn_${id}" title=t('عرض/إخفاء المرجع')>${t('📄 المرجع')}</button>
          <button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest('.modal-bg').remove()">✕</button>
        </div>
      </div>
      <div class="modal-body" style="padding:0">
        <div style="padding:8px 16px;background:var(--surface3);font-size:12px;border-bottom:1px solid var(--border);display:flex;gap:16px;flex-wrap:wrap;align-items:center">
          <span>${t('العميل:')} <strong style="color:var(--accent)">${p.name}</strong></span>
          <span>${t('العقد:')} <strong>${p.contractNo||'-'}</strong></span>
          <span id="mCnt_${id}" style="color:var(--accent2);font-weight:700">${t('المدخلة:')} ${rows.filter(r=>r.width||r.height).length} t('مقاس')</span>
          <span style="margin-right:auto"></span>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;background:${localStorage.getItem('pm_zz_'+id)==='1'?'#1a5ad9':'var(--surface2)'};padding:4px 10px;border-radius:6px;border:1px solid var(--border);transition:background .2s" id="zzLabel_${id}">
            <input type="checkbox" id="zzToggle_${id}" ${localStorage.getItem('pm_zz_'+id)==='1'?'checked':''} onchange="mToggleZZ('${id}',this.checked)" style="accent-color:#1a5ad9">
            <span style="font-weight:700;color:${localStorage.getItem('pm_zz_'+id)==='1'?'#fff':'var(--text)'};font-size:11px" id="zzText_${id}">${localStorage.getItem('pm_zz_'+id)==='1'?t('زيرو زيرو (-8مم)'):t('مقاس تصنيع')}</span>
          </label>
        </div>
        <div style="display:flex;height:calc(100vh - 160px);overflow:hidden;position:relative">
          <!-- جدول المقاسات -->
          <div style="flex:1;min-width:0;overflow:auto;padding:8px;-webkit-overflow-scrolling:touch">
            <table style="width:100%;border-collapse:collapse;min-width:580px">
              <thead><tr style="background:var(--surface3)">
                <th style="padding:5px 3px;border:1px solid var(--border);width:28px">#</th>
                <th style="padding:5px 4px;border:1px solid var(--border);width:50px">${t('الرمز')}</th>
                <th style="padding:5px 4px;border:1px solid var(--border);width:76px">${t('عرض')}</th>
                <th style="padding:5px 4px;border:1px solid var(--border);width:76px">${t('ارتفاع')}</th>
                <th style="padding:5px 4px;border:1px solid var(--border);width:120px">${t('القطاع')}</th>
                <th style="padding:5px 4px;border:1px solid var(--border)">${t('الوصف')}</th>
                <th style="padding:5px 4px;border:1px solid var(--border);width:80px">${t('ملاحظات')}</th>
                <th style="padding:5px 4px;border:1px solid var(--border);width:64px">📷/×</th>
              </tr></thead>
              <tbody id="mBody_${id}">${rows.map((r,i)=>buildRow(r,i)).join('')}</tbody>
            </table>
          </div>
          <!-- لوحة المرجع — مخفية افتراضياً، تنسحب من اليسار -->
          <div id="mRefPanel_${id}" style="position:absolute;top:0;left:-340px;width:320px;height:100%;background:var(--surface);border-right:1px solid var(--border);padding:12px;display:flex;flex-direction:column;gap:8px;overflow-y:auto;transition:left .35s cubic-bezier(.22,1,.36,1);z-index:10;box-shadow:4px 0 20px rgba(0,0,0,.3)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
              <div style="font-size:13px;font-weight:700;color:var(--accent)">${t('📷 ورقة المرجع')}</div>
              <button class="btn btn-sm btn-secondary btn-icon" onclick="mToggleRefPanel('${id}')" style="padding:2px 6px">✕</button>
            </div>
            <div style="border:2px dashed var(--border);border-radius:8px;padding:12px;text-align:center;cursor:pointer;font-size:12px;color:var(--text2)" onclick="document.getElementById('miInp_${id}').click()">
              📂 ارفع صورة / PDF<br><span style="font-size:10px">PNG، JPG، PDF</span>
            </div>
            <input type="file" id="miInp_${id}" accept="image/*,.pdf" style="display:none" onchange="miLoad(this,'${id}')">
            <div id="miBox_${id}" style="${existImg?'':'display:none'}">
              <div style="display:flex;gap:5px;margin-bottom:6px;flex-wrap:wrap">
                <span style="font-size:11px;color:var(--text2)">${t('تدوير:')}</span>
                <button class="btn btn-sm btn-secondary" onclick="miRot('${id}',-90)" style="padding:2px 7px">↺</button>
                <button class="btn btn-sm btn-secondary" onclick="miRot('${id}',90)" style="padding:2px 7px">↻</button>
                <button class="btn btn-sm btn-secondary" onclick="miRot('${id}',180)" style="padding:2px 7px">180°</button>
                <button class="btn btn-sm btn-danger" onclick="miClear('${id}')" style="padding:2px 6px">🗑️</button>
              </div>
              <div style="overflow:auto;border:1px solid var(--border);border-radius:8px;max-height:calc(80vh - 260px);display:flex;align-items:center;justify-content:center;background:#111">
                <img id="miImg_${id}" src="${existImg||''}" data-rot="0" style="max-width:100%;transition:transform .3s;cursor:zoom-in" onclick="miZoom('${id}')">
              </div>
            </div>
            ${existImg?'':`<div style="font-size:11px;color:var(--text2);text-align:center;padding:10px;line-height:1.7">${t('ارفع صورة ورقة الفني لتظهر بجانب المقاسات')}</div>`}
          </div>
          <!-- خلفية عند فتح اللوحة -->
          <div id="mRefOverlay_${id}" onclick="mToggleRefPanel('${id}')" style="display:none;position:absolute;inset:0;background:rgba(0,0,0,.3);z-index:9"></div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal._rows=rows; modal._buildRow=buildRow;
}
// Toggle reference panel (slide in/out)
function mToggleRefPanel(id){
  const panel=document.getElementById('mRefPanel_'+id);
  const overlay=document.getElementById('mRefOverlay_'+id);
  if(!panel)return;
  const isOpen=parseInt(panel.style.left)===0;
  if(isOpen){
    panel.style.left='-340px';
    if(overlay)overlay.style.display='none';
  } else {
    panel.style.left='0px';
    if(overlay)overlay.style.display='block';
  }
}

// Row photo capture — save to client folder on server
function mRowPhoto(input,id,rowIdx){
  const file=input.files[0];if(!file)return;
  const modal=document.getElementById('measModal_'+id);if(!modal)return;
  const rows=modal._rows;if(!rows||!rows[rowIdx])return;

  // 1. Preview locally while uploading
  const reader=new FileReader();
  reader.onload=function(e){
    rows[rowIdx]._localPhoto=e.target.result; // temp preview only, not saved
    const tr=document.getElementById('mr_'+id+'_'+rowIdx);
    if(tr){
      const lbl=tr.querySelector('label');
      if(lbl){lbl.style.background='var(--accent)';lbl.style.color='#fff';lbl.title=t('صورة مرفقة');}
      const eyeBtn=document.getElementById('mEye_'+id+'_'+rowIdx);
      if(eyeBtn) eyeBtn.style.display='inline-flex';
    }
  };
  reader.readAsDataURL(file);

  // 2. Upload photo to server and save path
  const {projects}=loadData();
  const p=projects.find(x=>x.id===id);
  if(p){
    const fd=new FormData();
    fd.append('files',file);
    const q=new URLSearchParams({
      name:p.name||'بدون',contractNo:p.contractNo||'',
      company:p.company||'',region:p.region||'',gallery:p.gallery||'',
      subfolder:'صور الموقع'
    });
    fetch('/api/upload-site-photo?'+q.toString(),{method:'POST',body:fd})
      .then(r=>r.json()).then(j=>{
        if(j.ok){
          rows[rowIdx].serverPhoto=j.path;
          if(typeof notify==='function') notify(t('✅ تم رفع صورة — سطر ')+(rowIdx+1));
        } else {
          if(typeof notify==='function') notify('⚠️ '+t('فشل رفع الصورة'),'error');
        }
      }).catch(()=>{
        if(typeof notify==='function') notify('⚠️ '+t('فشل رفع الصورة'),'error');
      });
  }
  input.value='';
}

// View row photo in fullscreen overlay
function mViewPhoto(id,rowIdx){
  const modal=document.getElementById('measModal_'+id);if(!modal)return;
  const rows=modal._rows;if(!rows||!rows[rowIdx])return;
  const r=rows[rowIdx];
  const photo=r._localPhoto||(r.serverPhoto?'/api/file?path='+encodeURIComponent(r.serverPhoto):'')||r.photo;
  if(!photo)return;
  const code=r.code||'';
  const desc=r.description||'';
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;cursor:zoom-out';
  ov.innerHTML=`<div style="text-align:center;max-width:95vw;max-height:95vh">
    <img src="${photo}" style="max-width:90vw;max-height:82vh;object-fit:contain;border-radius:8px;box-shadow:0 4px 30px rgba(0,0,0,.5)">
    <div style="margin-top:10px;color:#fff;font-size:14px;font-family:Cairo,sans-serif">${code}${desc?' — '+desc:''} <span style="opacity:.5">(${t('سطر')} ${rowIdx+1})</span></div>
  </div>`;
  ov.onclick=function(e){if(e.target===ov)ov.remove();};
  document.body.appendChild(ov);
}

// ── حفظ تلقائي للمقاسات كل 20 ثانية — يحفظ محلي + سيرفر + إشعار ──
setInterval(function(){
  try {
    var saved = false;
    // مقاسات المشاريع
    document.querySelectorAll('[id^="measModal_"]').forEach(function(m){
      if(!m._rows||!m._autoSaveDirty) return;
      var id = m.id.replace('measModal_','');
      var key = 'pm_meas_'+id;
      var data = m._rows.map(function(r){
        var clean={code:r.code,width:r.width,height:r.height,sectionName:r.sectionName,description:r.description,notes:r.notes};
        if(r.serverPhoto) clean.serverPhoto=r.serverPhoto;
        return clean;
      });
      setMeasurementsData(id, data);
      fetch('/api/data/'+key,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({value:data})}).catch(function(){});
      m._autoSaveDirty = false;
      saved = true;
    });
    // مقاسات التركيبات
    document.querySelectorAll('[id^="instMeasModal_"]').forEach(function(m){
      if(!m._rows||!m._autoSaveDirty) return;
      var eid = m._entryId || m.id.replace('instMeasModal_','');
      var entries = typeof loadInstallations==='function' ? loadInstallations() : [];
      var entry = entries.find(function(e){return e.id===eid;});
      if(!entry) return;
      entry.measurements = m._rows.map(function(r){
        var clean={code:r.code,width:r.width,height:r.height,sectionName:r.sectionName,description:r.description,notes:r.notes};
        if(r.serverPhoto) clean.serverPhoto=r.serverPhoto;
        return clean;
      });
      if(typeof saveInstallations==='function') saveInstallations(entries).catch(function(){});
      m._autoSaveDirty = false;
      saved = true;
    });
    // نواقص
    document.querySelectorAll('[id^="defItemsModal_"]').forEach(function(m){
      if(!m._autoSaveDirty||!m._sectionData) return;
      var eid = m.id.replace('defItemsModal_','');
      var entries = typeof loadDefects==='function' ? loadDefects() : [];
      var entry = entries.find(function(e){return e.id===eid;});
      if(!entry) return;
      var types = m._types||[];
      entry.sections = {};
      types.forEach(function(tp){
        entry.sections[tp] = (m._sectionData[tp]||[]).map(function(r){
          var c={code:r.code,width:r.width,height:r.height,description:r.description,notes:r.notes};
          if(r.serverPhoto)c.serverPhoto=r.serverPhoto;
          return c;
        });
      });
      entry.defectTypes = types;
      if(typeof saveDefects==='function') saveDefects(entries).catch(function(){});
      m._autoSaveDirty = false;
      saved = true;
    });
    if(saved && typeof notify==='function') notify('💾 '+t('حفظ تلقائي'));
  }catch(e){}
}, 20000);

function mToggleZZ(id,on){
  localStorage.setItem('pm_zz_'+id,on?'1':'0');
  const lbl=document.getElementById('zzLabel_'+id);
  const txt=document.getElementById('zzText_'+id);
  if(lbl)lbl.style.background=on?'#1a5ad9':'var(--surface2)';
  if(txt){txt.textContent=on?t('زيرو زيرو (-8مم)'):t('مقاس تصنيع');txt.style.color=on?'#fff':'var(--text)';}
}
function isZeroZero(id){return localStorage.getItem('pm_zz_'+id)==='1';}
function _mm(id){return document.getElementById('measModal_'+id);}
function mUpd(id,i,f,v){const m=_mm(id);if(!m||!m._rows)return;m._rows[i][f]=v;m._autoSaveDirty=true;const c=document.getElementById('mCnt_'+id);if(c)c.textContent=t('المدخلة:')+' '+m._rows.filter(r=>r.width||r.height).length+' '+t('مقاس');}
function mAct(id,i){const m=_mm(id);if(!m||!m._rows)return;const r=m._rows[i],row=document.getElementById(`mr_${id}_${i}`);if(row)row.style.opacity=(r.width||r.height||r.description)?'1':'.42';if(i===m._rows.length-1&&(r.width||r.height))mAddRow(id);}
function mAddRow(id){const m=_mm(id);if(!m)return;const rows=m._rows,n=rows.length+1;rows.push({code:`W${String(n).padStart(2,'0')}`,width:'',height:'',sectionName:'',description:'',notes:''});const tb=document.getElementById('mBody_'+id);if(tb){const tr=document.createElement('tr');tr.id=`mr_${id}_${n-1}`;tr.style.opacity='.42';tr.innerHTML=m._buildRow(rows[n-1],n-1).replace(/^<tr[^>]*>/,'').replace(/<\/tr>$/,'');tb.appendChild(tr);tr.scrollIntoView({behavior:'smooth',block:'end'});}}
function mDelRow(id,i){const m=_mm(id);if(!m)return;m._rows.splice(i,1);const tb=document.getElementById('mBody_'+id);if(tb)tb.innerHTML=m._rows.map((r,j)=>m._buildRow(r,j)).join('');}
function mSave(id){
  const m=_mm(id);if(!m||!m._rows)return;

  // Check all photos uploaded before saving
  const pending=m._rows.filter(r=>r._localPhoto&&!r.serverPhoto);
  if(pending.length){
    notify('⚠️ '+t('انتظر اكتمال رفع الصور')+' ('+pending.length+')','error');
    return;
  }

  // Strip base64 data — keep only serverPhoto path
  const key='pm_meas_'+id;
  const data=m._rows.map(r=>{
    const clean={code:r.code,width:r.width,height:r.height,sectionName:r.sectionName,description:r.description,notes:r.notes};
    if(r.serverPhoto) clean.serverPhoto=r.serverPhoto;
    return clean;
  });
  // Save locally
  setMeasurementsData(id,data);
  // Force immediate server sync and wait for it
  fetch('/api/data/'+key,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({value:data})})
    .then(function(r){return r.json();})
    .then(function(j){
      if(j.ok){
        notify(t('✅ تم حفظ المقاسات ومزامنتها'));
        m.remove();
      } else {
        notify('⚠️ '+t('حفظ محلي تم — خطأ بالمزامنة'),'error');
      }
    })
    .catch(function(){
      notify('⚠️ '+t('حفظ محلي تم — خطأ بالمزامنة'),'error');
    });
}

function mNavKey(e, id, rowIdx, col) {
  // Enter or ArrowDown → move to same column next row
  if(e.key==='Enter'||e.key==='ArrowDown'){
    e.preventDefault();
    const nextRow=rowIdx+1;
    const m=_mm(id);
    if(m&&m._rows&&nextRow>=m._rows.length) mAddRow(id);
    setTimeout(()=>{
      const tb=document.getElementById('mBody_'+id);
      if(!tb)return;
      const rows=tb.querySelectorAll('tr');
      if(rows[nextRow]){
        const inputs=rows[nextRow].querySelectorAll('input[type="number"]');
        const idx=col==='w'?0:1;
        if(inputs[idx])inputs[idx].focus();
      }
    },50);
  } else if(e.key==='ArrowUp'){
    e.preventDefault();
    if(rowIdx<=0)return;
    const tb=document.getElementById('mBody_'+id);
    if(!tb)return;
    const rows=tb.querySelectorAll('tr');
    if(rows[rowIdx-1]){
      const inputs=rows[rowIdx-1].querySelectorAll('input[type="number"]');
      const idx=col==='w'?0:1;
      if(inputs[idx])inputs[idx].focus();
    }
  }
}

function mExcelImport(input, id) {
  const file=input.files[0];if(!file)return;
  if(typeof XLSX==='undefined'){notify(t('⚠️ مكتبة Excel غير جاهزة'),'error');return;}
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const wb=XLSX.read(e.target.result,{type:'binary'});
      if(!wb.SheetNames||!wb.SheetNames.length){notify(t('⚠️ الملف لا يحتوي على أوراق عمل'),'error');return;}
      const ws=wb.Sheets[wb.SheetNames[0]];
      const data=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      if(!data.length){notify(t('⚠️ الملف فارغ'),'error');return;}
      // Detect header row — look for width/height keywords
      let hdr=0;
      const hdrs=data[0].map(h=>(h+'').toLowerCase());
      const wIdx=hdrs.findIndex(h=>h.includes('عرض')||h.includes('width')||h.includes('w'));
      const hIdx=hdrs.findIndex(h=>h.includes('ارتفاع')||h.includes('height')||h.includes('h'));
      const secIdx=hdrs.findIndex(h=>h.includes('قطاع')||h.includes('section')||h.includes('type'));
      const descIdx=hdrs.findIndex(h=>h.includes('وصف')||h.includes('desc'));
      const noteIdx=hdrs.findIndex(h=>h.includes('ملاحظ')||h.includes('note'));
      const codeIdx=hdrs.findIndex(h=>h.includes('رمز')||h.includes('code'));
      // If no header detected, assume first row is data, col 0=width, 1=height
      const dataStart=(wIdx>=0||hIdx>=0)?1:0;
      const wC=wIdx>=0?wIdx:0, hC=hIdx>=0?hIdx:1;
      const sections=loadSections();
      const m=_mm(id);if(!m)return;
      const rows=[];
      data.slice(dataStart).forEach((row,ri)=>{
        const w=parseFloat(row[wC]);
        const h=parseFloat(row[hC]);
        if(!w&&!h)return;
        const secRaw=(secIdx>=0?(row[secIdx]+'').trim():'');
        const secMatch=sections.find(s=>s.name===secRaw)||null;
        rows.push({
          code:codeIdx>=0?(row[codeIdx]||`W${String(rows.length+1).padStart(2,'0')}`):`W${String(rows.length+1).padStart(2,'0')}`,
          width:w||'', height:h||'',
          sectionName:secMatch?secMatch.name:'',
          description:descIdx>=0?(row[descIdx]||''):'',
          notes:noteIdx>=0?(row[noteIdx]||''):''
        });
      });
      if(!rows.length){notify(t('⚠️ لم يُعثر على بيانات صالحة'),'error');return;}
      // Fill remaining rows up to 15
      while(rows.length<15){const n=rows.length+1;rows.push({code:`W${String(n).padStart(2,'0')}`,width:'',height:'',sectionName:'',description:'',notes:''});}
      m._rows=rows;
      const tb=document.getElementById('mBody_'+id);
      if(tb)tb.innerHTML=rows.map((r,i)=>m._buildRow(r,i)).join('');
      const cnt=document.getElementById('mCnt_'+id);
      if(cnt)cnt.textContent=t('المدخلة:')+' '+rows.filter(r=>r.width||r.height).length+' '+t('مقاس');
      notify(t('✅ تم استيراد')+' '+rows.filter(r=>r.width||r.height).length+' '+t('مقاس من Excel'));
    }catch(err){notify(t('⚠️ خطأ في قراءة الملف:')+' '+err.message,'error');}
  };
  reader.readAsBinaryString(file);
  input.value='';
}
function mPrint(id,cn){
  const m=_mm(id);
  const rows=(m?._rows||getMeasurementsData(id)||[]).filter(r=>r.width||r.height||r.description);
  if(!rows.length){notify(t('⚠️ لا توجد مقاسات'),'error');return;}

  // Collect photo rows (local preview or server path)
  var photoRows = rows.filter(function(r){ return r._localPhoto || r.serverPhoto || r.photo; });

  var tableRows = rows.map(function(r,i){
    var bg = i%2===0 ? '#ffffff' : '#f1f5f9';
    return '<tr style="background:'+bg+'">'+
      '<td style="text-align:center;padding:7px 5px;border:1px solid #cbd5e1;font-weight:700;color:#334155">'+(i+1)+'</td>'+
      '<td style="padding:7px 5px;border:1px solid #cbd5e1;font-weight:800;color:#1e40af;text-align:center">'+(r.code||'')+'</td>'+
      '<td style="text-align:center;padding:7px 5px;border:1px solid #cbd5e1;font-size:14px;font-weight:700">'+(r.width||'—')+'</td>'+
      '<td style="text-align:center;padding:7px 5px;border:1px solid #cbd5e1;font-size:14px;font-weight:700">'+(r.height||'—')+'</td>'+
      '<td style="padding:7px 5px;border:1px solid #cbd5e1;color:#475569">'+(r.sectionName||'')+'</td>'+
      '<td style="padding:7px 5px;border:1px solid #cbd5e1;color:#334155">'+(r.description||'')+'</td>'+
      '<td style="padding:7px 5px;border:1px solid #cbd5e1;color:#64748b;font-size:11px">'+(r.notes||'')+'</td>'+
    '</tr>';
  }).join('');

  // Photos section
  var photosHtml = '';
  if(photoRows.length) {
    photosHtml = '<div style="page-break-before:always;padding-top:12px">'+
      '<div style="font-size:16px;font-weight:800;color:#1e3a5f;border-bottom:3px solid #1e3a5f;padding-bottom:8px;margin-bottom:14px">'+t('الصور المرفقة')+'</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'+
      photoRows.map(function(r){
        var src=r._localPhoto||(r.serverPhoto?'/api/file?path='+encodeURIComponent(r.serverPhoto):'')||r.photo||'';
        return '<div style="text-align:center;border:1px solid #e2e8f0;border-radius:8px;padding:8px;break-inside:avoid;background:#fff">'+
          '<img src="'+src+'" style="max-width:100%;max-height:260px;object-fit:contain;border-radius:4px;border:1px solid #e2e8f0">'+
          '<div style="margin-top:6px;font-size:12px;color:#1e40af;font-weight:700">'+(r.code||'')+(r.description?' — '+r.description:'')+'</div>'+
        '</div>';
      }).join('')+
      '</div></div>';
  }

  var pa=document.getElementById('printArea');
  pa.innerHTML='<style>@page{size:A4 landscape;margin:10mm}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}body{font-family:Cairo,sans-serif;direction:rtl;color:#111!important;background:#fff!important;margin:0}table{width:100%;border-collapse:collapse}img{max-width:100%}tr{page-break-inside:avoid}</style>'+
    '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1e3a5f;padding-bottom:10px;margin-bottom:14px">'+
      '<div>'+
        '<div style="font-size:18px;font-weight:900;color:#1e3a5f;margin-bottom:2px">'+t('📐 المقاسات —')+' '+cn+'</div>'+
        '<div style="font-size:12px;color:#64748b">'+t('عدد المقاسات:')+' <strong style="color:#1e40af">'+rows.length+'</strong>'+
          (photoRows.length ? ' | '+t('الصور:')+' <strong style="color:#1e40af">'+photoRows.length+'</strong>' : '')+
        '</div>'+
      '</div>'+
    '</div>'+
    '<table>'+
      '<thead><tr>'+
        '<th style="background:#1e3a5f;color:#fff;padding:8px 5px;border:1px solid #1e3a5f;font-size:12px;width:35px">#</th>'+
        '<th style="background:#1e3a5f;color:#fff;padding:8px 5px;border:1px solid #1e3a5f;font-size:12px;width:55px">'+t('الرمز')+'</th>'+
        '<th style="background:#1e3a5f;color:#fff;padding:8px 5px;border:1px solid #1e3a5f;font-size:12px;width:70px">'+t('العرض')+'</th>'+
        '<th style="background:#1e3a5f;color:#fff;padding:8px 5px;border:1px solid #1e3a5f;font-size:12px;width:70px">'+t('الارتفاع')+'</th>'+
        '<th style="background:#1e3a5f;color:#fff;padding:8px 5px;border:1px solid #1e3a5f;font-size:12px;width:100px">'+t('القطاع')+'</th>'+
        '<th style="background:#1e3a5f;color:#fff;padding:8px 5px;border:1px solid #1e3a5f;font-size:12px">'+t('الوصف')+'</th>'+
        '<th style="background:#1e3a5f;color:#fff;padding:8px 5px;border:1px solid #1e3a5f;font-size:12px;width:80px">'+t('ملاحظات')+'</th>'+
      '</tr></thead>'+
      '<tbody>'+tableRows+'</tbody>'+
    '</table>'+
    '<div style="margin-top:10px;padding:8px 12px;background:#f1f5f9;border-radius:6px;font-size:11px;color:#475569;border:1px solid #e2e8f0">'+t('إجمالي:')+' <strong>'+rows.length+'</strong> '+t('مقاس')+'</div>'+
    photosHtml;

  // Wait for all images to load before printing
  var _imgs=pa.querySelectorAll('img');
  if(_imgs.length){
    var _ld=0,_tot=_imgs.length;
    var _dp=function(){window.print();setTimeout(function(){pa.innerHTML='';},2000);};
    _imgs.forEach(function(img){
      if(img.complete){_ld++;if(_ld>=_tot)_dp();}
      else{img.onload=function(){_ld++;if(_ld>=_tot)_dp();};img.onerror=function(){_ld++;if(_ld>=_tot)_dp();};}
    });
    setTimeout(function(){if(_ld<_tot)_dp();},5000);
  } else {
    window.print();
    setTimeout(function(){pa.innerHTML='';},2000);
  }
}
function miLoad(input,id){const file=input.files[0];if(!file)return;const reader=new FileReader();reader.onload=e=>{const data=e.target.result;try{localStorage.setItem('pm_measimg_'+id,data);}catch(err){notify(t('⚠️ الملف كبير جداً'),'error');return;}const img=document.getElementById('miImg_'+id);const box=document.getElementById('miBox_'+id);if(img){img.src=data;img.dataset.rot='0';img.style.transform='rotate(0deg)';}if(box)box.style.display='block';notify(t('✅ تم رفع الصورة'));};reader.readAsDataURL(file);}
function miRot(id,deg){const img=document.getElementById('miImg_'+id);if(!img)return;let r=(+(img.dataset.rot||0)+deg+360)%360;img.dataset.rot=r;img.style.transform=`rotate(${r}deg)`;}
function miClear(id){if(!confirm(t('حذف صورة الفني؟')))return;localStorage.removeItem('pm_measimg_'+id);const box=document.getElementById('miBox_'+id);if(box)box.style.display='none';const img=document.getElementById('miImg_'+id);if(img)img.src='';notify(t('🗑️ تم حذف الصورة'));}
function miZoom(id){const img=document.getElementById('miImg_'+id);if(!img||!img.src)return;const rot=+(img.dataset.rot||0);const ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:zoom-out';ov.innerHTML=`<div style="text-align:center"><div style="margin-bottom:8px;display:flex;gap:8px;justify-content:center"><button onclick="event.stopPropagation();let im=this.closest('div').nextElementSibling;let r=(+(im.dataset.rot||0)-90+360)%360;im.dataset.rot=r;im.style.transform='rotate('+r+'deg)'" style="background:rgba(255,255,255,.2);border:none;color:#fff;padding:5px 14px;border-radius:6px;cursor:pointer">↺ -90°</button><button onclick="event.stopPropagation();let im=this.closest('div').nextElementSibling;let r=(+(im.dataset.rot||0)+90)%360;im.dataset.rot=r;im.style.transform='rotate('+r+'deg)'" style="background:rgba(255,255,255,.2);border:none;color:#fff;padding:5px 14px;border-radius:6px;cursor:pointer">↻ +90°</button></div><img src="${img.src}" data-rot="${rot}" style="max-width:90vw;max-height:88vh;border-radius:8px;transform:rotate(${rot}deg);transition:transform .3s"></div>`;ov.onclick=e=>{if(e.target===ov)ov.remove();};document.body.appendChild(ov);}

// ══════════════════════════════════════════════════
// OPEN PRICE LIST MODAL
// ══════════════════════════════════════════════════
function openPriceList(id){
  const {projects}=loadData(),p=projects.find(x=>x.id===id);if(!p)return;
  const sections=loadSections();

  // ── Build summary from measurements ──
  const measRows=getMeasurementsData(id)||[];
  const active=measRows.filter(r=>+r.width>0&&+r.height>0);
  // Group by sectionName → sum area
  const zz=isZeroZero(id);
  const zzSub=zz?8:0;
  const measGroups={};
  active.forEach(r=>{
    const sn=r.sectionName||'غير محدد';
    const sec=sections.find(s=>s.name===sn)||{addWidth:0,addHeight:0};
    const Wm=(+r.width-zzSub+sec.addWidth)/1000, Hm=(+r.height-zzSub+sec.addHeight)/1000;
    const rawArea=Math.round(Wm*Hm*1000000)/1000000;
    // Apply per-section minimum area correction per unit
    const minThr=sec.minArea??0;
    const minVal=sec.minAreaVal??minThr;
    const area=(minThr>0&&rawArea<minThr)?minVal:rawArea;
    if(!measGroups[sn])measGroups[sn]={sectionName:sn,totalArea:0,count:0,addW:sec.addWidth,addH:sec.addHeight};
    measGroups[sn].totalArea=Math.round((measGroups[sn].totalArea+area)*1000000)/1000000;
    measGroups[sn].count++;
  });
  const measSections=Object.values(measGroups);

  // ── Merge with saved price list ──
  const saved=getPLData(id);
  const savedMap={};
  saved.forEach(r=>{if(r.sectionName)savedMap[r.sectionName]=r.pricePerM2||'';});

  // Rows = one per unique section in measurements (if any), else fall back to saved
  let rows;
  if(measSections.length){
    rows=measSections.map(ms=>({
      sectionName:ms.sectionName,
      totalArea:ms.totalArea,
      count:ms.count,
      addWidth:ms.addW,
      addHeight:ms.addH,
      pricePerM2:savedMap[ms.sectionName]||''
    }));
  } else {
    // No measurements yet — show saved or empty
    rows=saved.length?saved:[];
  }

  const PID='plModal_'+id;
  const existM=document.getElementById(PID);if(existM)existM.remove();

  const fmtA=v=>(+v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const fmtN=v=>(+v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});

  function buildPLTable(rows){
    if(!rows.length) return `<div style="padding:20px;text-align:center;color:var(--text2);border:1px dashed var(--border);border-radius:8px">
      ${t('لا توجد مقاسات محفوظة — افتح 📐 المقاسات وأدخل الأبعاد ثم احفظ أولاً')}
    </div>`;
    return `<table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:var(--surface3)">
        <th style="padding:8px 6px;border:1px solid var(--border);width:28px">#</th>
        <th style="padding:8px 6px;border:1px solid var(--border)">${t('نوع القطاع')}</th>
        <th style="padding:8px 6px;border:1px solid var(--border);width:70px;text-align:center">${t('العدد')}</th>
        <th style="padding:8px 6px;border:1px solid var(--border);width:130px;text-align:center">${t('إجمالي المساحة م²')}</th>
        <th style="padding:8px 6px;border:1px solid var(--border);width:170px;text-align:center">${t('سعر م² (ر.س)')}</th>
        <th style="padding:8px 6px;border:1px solid var(--border);width:150px;text-align:center">${t('القيمة (ر.س)')}</th>
      </tr></thead>
      <tbody id="plBody_${id}">
        ${rows.map((r,i)=>{
          const val=r.pricePerM2&&r.totalArea?Math.round(r.totalArea*(+r.pricePerM2)*100)/100:0;
          const sec=sections.find(s=>s.name===r.sectionName)||{addWidth:r.addWidth||0,addHeight:r.addHeight||0};
          return `<tr id="plr_${id}_${i}">
            <td style="text-align:center;color:var(--text2);padding:6px 4px">${i+1}</td>
            <td style="padding:6px 8px">
              <strong style="color:var(--accent)">${r.sectionName||'—'}</strong>
              <div style="font-size:10px;color:var(--text2);margin-top:2px">+${sec.addWidth||0}/+${sec.addHeight||0} مم</div>
            </td>
            <td style="text-align:center;padding:6px 4px;font-weight:600">${r.count||'—'}</td>
            <td style="text-align:center;padding:6px 4px;font-weight:700;color:var(--accent2)">${r.totalArea?fmtA(r.totalArea):'—'}</td>
            <td style="padding:6px 4px;text-align:center">
              <input type="number" id="plP_${id}_${i}" value="${r.pricePerM2||''}"
                     style="width:150px;text-align:center;font-size:14px;font-weight:700"
                     min="0" step="0.01" placeholder=t('أدخل السعر...')
                     oninput="plPriceChg('${id}',${i},+this.value)">
            </td>
            <td style="text-align:center;padding:6px 4px;font-weight:800;color:var(--accent2);font-size:14px" id="plVal_${id}_${i}">${val?fmtN(val):'—'}</td>
          </tr>`;
        }).join('')}
      </tbody>
      <tfoot>
        <tr style="background:var(--surface2)">
          <td colspan="3" style="padding:8px 10px;font-weight:800;font-size:13px">الإجمالي (${rows.length} نوع)</td>
          <td style="text-align:center;font-weight:800;color:var(--accent2)" id="plTotArea_${id}">
            ${fmtA(rows.reduce((s,r)=>s+(r.totalArea||0),0))} م²
          </td>
          <td></td>
          <td style="text-align:center;font-weight:900;color:var(--accent2);font-size:16px" id="plTotVal_${id}">
            ${fmtN(rows.reduce((s,r)=>s+(r.pricePerM2&&r.totalArea?Math.round(r.totalArea*(+r.pricePerM2)*100)/100:0),0))} ر.س
          </td>
        </tr>
      </tfoot>
    </table>`;
  }

  const modal=document.createElement('div');modal.className='modal-bg';modal.id=PID;
  modal.innerHTML=`
    <div class="modal" style="max-width:820px;max-height:100vh">
      <div class="modal-header">
        <div class="modal-title">${t('💰 عرض الأسعار —')} ${p.name}</div>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="btn btn-sm btn-primary" onclick="plSave('${id}')">${t('💾 حفظ الأسعار')}</button>
          <button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest('.modal-bg').remove()">✕</button>
        </div>
      </div>
      <div class="modal-body">
        ${measSections.length
          ? `<div style="padding:8px 12px;background:#e8f5e9;border-radius:6px;font-size:12px;color:#2e7d32;margin-bottom:12px;border:1px solid #a5d6a7">${t('✅ تم تجميع')} ${active.length} t('مقاس من') ${measSections.length} ${t('نوع قطاع. أدخل سعر م² لكل قطاع.')}
             </div>`
          : `<div style="padding:8px 12px;background:#fff3cd;border-radius:6px;font-size:12px;color:#856404;margin-bottom:12px">
               ⚠️ ${t('لا توجد مقاسات محفوظة — افتح 📐 المقاسات وأدخل الأبعاد ثم احفظ أولاً')}
             </div>`
        }
        <div id="plTableWrap_${id}">${buildPLTable(rows)}</div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal._rows=rows; modal._buildPLTable=buildPLTable; modal._fmtN=fmtN; modal._fmtA=fmtA;
}

function plPriceChg(id,i,price){
  const m=_plm(id);if(!m||!m._rows)return;
  m._rows[i].pricePerM2=price;
  const area=m._rows[i].totalArea||0;
  const val=price&&area?Math.round(area*price*100)/100:0;
  const valEl=document.getElementById('plVal_'+id+'_'+i);
  if(valEl)valEl.textContent=val?m._fmtN(val):'—';
  // Update grand total
  const grandVal=m._rows.reduce((s,r)=>s+(r.pricePerM2&&r.totalArea?Math.round(r.totalArea*(+r.pricePerM2)*100)/100:0),0);
  const totEl=document.getElementById('plTotVal_'+id);
  if(totEl)totEl.textContent=m._fmtN(grandVal)+' ر.س';
}

function _plm(id){return document.getElementById('plModal_'+id);}
function plSelChg(sel){
  const id=sel.dataset.pid,i=+sel.dataset.idx,sn=sel.value;
  const m=_plm(id);if(!m||!m._rows)return;
  m._rows[i].sectionName=sn;
  const sec=loadSections().find(s=>s.name===sn);
  if(sec){
    m._rows[i].addWidth=sec.addWidth;m._rows[i].addHeight=sec.addHeight;
    const wEl=document.getElementById('plW_'+id+'_'+i);if(wEl)wEl.value=sec.addWidth;
    const hEl=document.getElementById('plH_'+id+'_'+i);if(hEl)hEl.value=sec.addHeight;
  }
}
function plUpd(id,i,f,v){const m=_plm(id);if(!m||!m._rows)return;m._rows[i][f]=v;}
function plAdd(id){
  const m=_plm(id);if(!m)return;
  m._rows.push({sectionName:'',pricePerM2:'',addWidth:0,addHeight:0});
  const wrap=document.getElementById('plTableWrap_'+id);
  if(wrap){wrap.innerHTML=m._buildPLTable(m._rows);m._rows.forEach((r,i)=>{const sel=document.querySelector(`#plr_${id}_${i} select`);if(sel&&r.sectionName)sel.value=r.sectionName;});}
}
function plDel(id,i){
  const m=_plm(id);if(!m)return;
  m._rows.splice(i,1);
  const wrap=document.getElementById('plTableWrap_'+id);
  if(wrap){wrap.innerHTML=m._buildPLTable(m._rows);m._rows.forEach((r,j)=>{const sel=document.querySelector(`#plr_${id}_${j} select`);if(sel&&r.sectionName)sel.value=r.sectionName;});}
}
function plSave(id){
  const m=_plm(id);if(!m||!m._rows)return;
  const key='pm_pl_'+id;
  const data=m._rows;
  setPLData(id,data);
  fetch('/api/data/'+key,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({value:data})})
    .then(function(r){return r.json();})
    .then(function(j){
      if(j.ok){ notify(t('✅ تم حفظ عرض الأسعار')); m.remove(); }
      else { notify('⚠️ '+t('خطأ بالمزامنة'),'error'); }
    })
    .catch(function(){ notify('⚠️ '+t('خطأ بالمزامنة'),'error'); });
}

// ══════════════════════════════════════════════════
// INJECT MEAS INTO مستخلص — group by section, one row per section
// ══════════════════════════════════════════════════
function injectMeasIntoDoc(pid){
  const measRows=getMeasurementsData(pid)||[];
  const plRows=getPLData(pid)||[];
  const el=document.getElementById('measItemsDiv_'+pid);
  if(!el){notify(t('⚠️ افتح المستخلص من زر 🖨️ مستخلص على العميل أولاً'),'error');return;}

  // Accept any row with at least width+height (sectionName optional)
  const active=measRows.filter(r=>+r.width>0&&+r.height>0);
  if(!active.length){
    el.innerHTML='<div style="padding:10px;background:#fff3cd;border-radius:6px;font-size:12px;color:#856404;text-align:center">⚠️ لا توجد مقاسات محفوظة — افتح 📐 المقاسات وأدخل الأبعاد ثم اضغط حفظ</div>';
    return;
  }
  const prMap={};
  plRows.forEach(r=>{if(r.sectionName&&+r.pricePerM2>0)prMap[r.sectionName]={price:+r.pricePerM2,addW:+r.addWidth||0,addH:+r.addHeight||0};});

  // Group by sectionName — sum areas (measurements in mm)
  const zz2=isZeroZero(pid);
  const zzSub2=zz2?8:0;
  const groups={};
  const noPrice=new Set();
  active.forEach(r=>{
    const sn=r.sectionName||'غير محدد';
    const pr=prMap[r.sectionName];
    if(!pr) noPrice.add(sn);
    const addW=pr?pr.addW:0, addH=pr?pr.addH:0;
    // mm → m: divide by 1000 (with zero-zero subtraction if enabled)
    const Wm=(+r.width-zzSub2+addW)/1000, Hm=(+r.height-zzSub2+addH)/1000;
    const rawArea=Math.round(Wm*Hm*1000000)/1000000;
    const secDef2=loadSections().find(s=>s.name===(r.sectionName||''));
    const minThr2=secDef2?.minArea??0;
    const minVal2=secDef2?.minAreaVal??minThr2;
    const area=(minThr2>0&&rawArea<minThr2)?minVal2:rawArea;
    if(!groups[sn])groups[sn]={sectionName:sn,totalArea:0,count:0,price:pr?pr.price:0,addW,addH};
    groups[sn].totalArea=Math.round((groups[sn].totalArea+area)*1000000)/1000000;
    groups[sn].count++;
  });

  const items=Object.values(groups);
  // English number formatting
  const fmt =v=>(+v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const fmtA=v=>(+v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const grandTotal=Math.round(items.reduce((s,x)=>s+(x.price?Math.round(x.totalArea*x.price*100)/100:0),0)*100)/100;
  const grandArea =Math.round(items.reduce((s,x)=>s+x.totalArea,0)*1000000)/1000000;
  const noPriceNote=noPrice.size?`<div style="padding:6px 10px;background:#fff3cd;border-radius:4px;font-size:11px;color:#856404;margin-bottom:8px">⚠️ ${t('قطاعات بدون سعر:')} ${[...noPrice].join('، ')}</div>`:'';

  // ── Save grandTotal (+ VAT) to project extractValue ──
  const grandTotalWithVAT = Math.round(grandTotal * 1.15 * 100) / 100;
  const dProj = loadData();
  const pidx = dProj.projects.findIndex(x=>x.id===pid);
  if(pidx > -1){
    dProj.projects[pidx].extractValue = grandTotalWithVAT;
    localStorage.setItem('pm_projects', JSON.stringify(dProj.projects));
    renderTable(); renderStats();
    notify(t('✅ تم تحديث قيمة المستخلص:')+' ' + fmt(grandTotalWithVAT) + ' '+t('ر.س (شامل الضريبة)'));
  }

  // Build the HTML for the measurements table
  const tableHTML=`
    ${noPriceNote}
    <div style="background:#1a3a6a;color:#fff;padding:7px 12px;border-radius:6px 6px 0 0;font-size:13px;font-weight:700;display:flex;justify-content:space-between;align-items:center">
      <span>${t('📐 بنود المقاسات')}</span>
      <span style="font-size:11px;font-weight:400">${active.length} وحدة → ${items.length} نوع قطاع</span>
    </div>
    <table class="doc-table" style="margin:0;border-radius:0 0 6px 6px;width:100%;table-layout:fixed">
      <thead><tr style="background:#f0f4ff">
        <th style="width:3%;text-align:center;font-size:10px">م</th>
        <th style="width:59%;font-size:10px;text-align:right">${t('الوصف (نوع القطاع)')}</th>
        <th style="width:5%;text-align:center;font-size:10px">${t('العدد')}</th>
        <th style="width:10%;text-align:center;font-size:10px">${t('المساحة م²')}</th>
        <th style="width:9%;text-align:center;font-size:10px">${t('سعر م²')}</th>
        <th style="width:14%;text-align:center;font-size:10px">${t('القيمة ر.س')}</th>
      </tr></thead>
      <tbody>
        ${items.map((x,i)=>{
          const sLabel=x.sectionName||'غير محدد';
          const val=x.price?Math.round(x.totalArea*x.price*100)/100:0;
          return `<tr>
            <td style="text-align:center;color:#666;font-size:10px">${i+1}</td>
            <td style="word-break:break-word;white-space:normal;font-size:10px;line-height:1.4"><strong style="font-size:10px">${sLabel}</strong>${(x.addW||x.addH)?`<span style="font-size:10px;color:#888;margin-right:6px">(+${x.addW}/+${x.addH} مم)</span>`:''}</td>
            <td style="text-align:center;font-weight:600;font-size:10px">${x.count}</td>
            <td style="text-align:center;font-weight:700;color:#a07800;font-size:10px">${fmtA(x.totalArea)}</td>
            <td style="text-align:center">${x.price?fmt(x.price):'<span style="color:#c00;font-size:11px">'+t('يرجى إدخال السعر')+'</span>'}</td>
            <td style="text-align:center;font-weight:800;color:#a07800;font-size:14px">${x.price?fmt(val):'-'}</td>
          </tr>`;
        }).join('')}
      </tbody>
      <tfoot>
        <tr style="background:#e8f0fe">
          <td colspan="3" style="font-weight:800;padding:8px 10px;font-size:13px">${t('الإجمالي')}</td>
          <td style="text-align:center;font-weight:800;color:#a07800">${fmtA(grandArea)} م²</td>
          <td></td>
          <td style="text-align:center;font-weight:900;color:#a07800;font-size:16px">${fmt(grandTotal)} ر.س</td>
        </tr>
      </tfoot>
    </table>`;

  // Save table HTML so it survives previewDoc() re-renders
  window._measTableCache = window._measTableCache || {};
  window._measTableCache[pid] = tableHTML;

  // Refresh financial summary then re-inject
  previewDoc();
  requestAnimationFrame(()=>{
    const freshEl=document.getElementById('measItemsDiv_'+pid);
    if(freshEl) freshEl.innerHTML=tableHTML;
  });
}


// ══════════════════════════════════════════════════
// WEEKLY REGIONAL REPORT
// ══════════════════════════════════════════════════
function _wkn(d){const dt=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));dt.setUTCDate(dt.getUTCDate()+4-(dt.getUTCDay()||7));const ys=new Date(Date.UTC(dt.getUTCFullYear(),0,1));return Math.ceil((((dt-ys)/86400000)+1)/7);}
function _svVars(html){const m={'var(--surface)':'#fff','var(--surface2)':'#f0f3fa','var(--surface3)':'#e4e8f5','var(--text)':'#1a1e2e','var(--text2)':'#555','var(--border)':'#d0d4e8','var(--accent)':'#1a5ad9','var(--accent2)':'#a07800','var(--accent3)':'#cc2222','var(--accent4)':'#228822'};Object.entries(m).forEach(([v,r])=>{html=html.split(v).join(r);});return html;}

function openWeeklyReport(){
  const {projects,regions}=loadData();
  if(!projects.length){notify('⚠️ لا توجد مشاريع','error');return;}
  const today=new Date().toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'});
  const wn=_wkn(new Date()),rNo=`WK-${new Date().getFullYear()}-W${String(wn).padStart(2,'0')}`;
  const fmt=v=>v?(+v).toLocaleString('en-US'):'0';

  // Group projects by region
  const groups={};
  projects.forEach(p=>{
    const reg=p.region||'غير محدد';
    if(!groups[reg])groups[reg]=[];
    groups[reg].push(p);
  });

  function buildRegionBlock(reg,ps){
    let totC=0,totP=0,totR=0;
    const rows=ps.map((p,i)=>{
      const ext=parseFloat(p.extractValue)||0,contr=parseFloat(p.contractValue)||0,base=ext>0?ext:contr;
      const prod=Math.round(base*(parseFloat(p.progress)||0)/100);
      const remain=base-(parseFloat(p.downPayment)||0);
      totC+=base;totP+=prod;totR+=remain;
      const st=calcStatusFromStage(p.stage);
      const stc=st.includes('جاري')?'var(--accent4)':st.includes('موقوف')?'var(--accent3)':'var(--text2)';
      return`<tr><td style="text-align:center">${i+1}</td><td style="font-weight:600">${p.name||'-'}</td><td>${p.contractNo||'-'}</td><td>${p.company||'-'}</td><td>${p.gallery||'-'}</td><td style="color:${stc};font-weight:600">${st}</td><td style="font-size:11px">${p.stage||'-'}</td><td style="text-align:center;font-weight:700;color:var(--accent2)">${p.progress||0}%</td><td>${fmt(base)}</td><td style="color:var(--accent2);font-weight:600">${fmt(prod)}</td><td style="color:var(--accent3)">${fmt(remain)}</td></tr>`;
    }).join('');
    return`<div style="margin-bottom:18px">
      <div style="background:var(--surface3);padding:10px 14px;border-radius:8px 8px 0 0;border:1px solid var(--border);font-weight:700;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <span style="color:var(--accent)">${t('📍 منطقة')} ${reg} <span style="font-weight:400;font-size:12px">(${ps.length} مشروع)</span></span>
        <span style="font-size:12px;color:var(--text2)">عقود: <strong style="color:var(--accent)">${fmt(totC)}</strong> | إنتاج: <strong style="color:var(--accent2)">${fmt(totP)}</strong> | متبقي: <strong style="color:var(--accent3)">${fmt(totR)}</strong> ر.س</span>
      </div>
      <div class="table-wrap" style="border-radius:0 0 8px 8px"><table><thead><tr>
        <th style="width:30px">#</th><th>العميل</th><th>رقم العقد</th><th>الشركة</th><th>المعرض</th><th>الحالة</th><th>المرحلة</th><th>الإنجاز</th><th>قيمة العقد</th><th>قيمة الإنتاج</th><th>المتبقي</th>
      </tr></thead><tbody>${rows}</tbody>
      <tfoot><tr style="background:var(--surface2);font-weight:800"><td colspan="8" style="padding:8px">إجمالي منطقة ${reg}</td><td>${fmt(totC)}</td><td style="color:var(--accent2)">${fmt(totP)}</td><td style="color:var(--accent3)">${fmt(totR)}</td></tr></tfoot>
      </table></div></div>`;
  }

  const allContent=Object.entries(groups).filter(([,ps])=>ps.length).map(([r,ps])=>buildRegionBlock(r,ps)).join('');
  const totAll=projects.reduce((a,p)=>{const ext=parseFloat(p.extractValue)||0,contr=parseFloat(p.contractValue)||0,base=ext>0?ext:contr;a.c+=base;a.p+=Math.round(base*(parseFloat(p.progress)||0)/100);a.d+=parseFloat(p.downPayment)||0;return a;},{c:0,p:0,d:0});

  const modal=document.createElement('div');modal.className='modal-bg';modal.id='wkModal';
  modal.innerHTML=`
    <div class="modal" style="max-width:1400px;width:97vw">
      <div class="modal-header">
        <div class="modal-title">${t('📋 التقرير الأسبوعي —')} ${rNo}</div>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="btn btn-sm btn-primary" onclick="saveWeeklyReport('${rNo}','${today}')">${t('💾 حفظ')}</button>
          <button class="btn btn-sm btn-secondary" onclick="printWeeklyReport('${rNo}','${today}')">🖨️ طباعة</button>
          <button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest('.modal-bg').remove()">✕</button>
        </div>
      </div>
      <div class="modal-body">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px">
          <div class="stat-card"><div class="stat-num" style="color:var(--accent)">${projects.length}</div><div class="stat-label">إجمالي المشاريع</div></div>
          <div class="stat-card"><div class="stat-num" style="color:var(--accent4)">${projects.filter(p=>calcStatusFromStage(p.stage).includes('جاري')).length}</div><div class="stat-label">مشاريع جارية</div></div>
          <div class="stat-card"><div class="stat-num" style="color:var(--accent2);font-size:14px">${fmt(totAll.p)}</div><div class="stat-label">إجمالي الإنتاج ر.س</div></div>
          <div class="stat-card"><div class="stat-num" style="color:var(--accent3);font-size:14px">${fmt(totAll.c-totAll.d)}</div><div class="stat-label">إجمالي المتبقي ر.س</div></div>
        </div>
        <div id="wkContent">${allContent}</div>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function saveWeeklyReport(rNo,today){
  const {projects}=loadData(),content=document.getElementById('wkContent');if(!content)return;
  const modal=content.closest('.modal-bg');
  const totProd=projects.reduce((s,p)=>{const ext=parseFloat(p.extractValue)||0,contr=parseFloat(p.contractValue)||0,base=ext>0?ext:contr;return s+Math.round(base*(parseFloat(p.progress)||0)/100);},0);
  const saved=getSavedReports('weekly');
  saved.unshift({reportNo:rNo,title:`تقرير أسبوعي — ${today}`,date:today,projectCount:projects.length,totalProd:totProd,html:_svVars(content.innerHTML)});
  setSavedReports('weekly',saved.slice(0,30));
  notify('✅ تم حفظ التقرير الأسبوعي: '+rNo);
  renderSavedWeeklyList();
  if(modal) modal.remove();
}

function printWeeklyReport(rNo,today){
  const content=document.getElementById('wkContent');if(!content)return;
  const pa=document.getElementById('printArea');
  pa.innerHTML=`<${'style'}>@page{size:A3 landscape;margin:7mm}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}body{font-family:Cairo,sans-serif;direction:rtl;color:#111!important;background:#fff!important;margin:0}h2{color:#1a3a6a;border-bottom:3px solid #1a3a6a;padding-bottom:8px;margin-bottom:14px;font-size:15px}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#1a3a6a!important;color:#fff!important;padding:5px 6px;border:1px solid #999;text-align:right}td{padding:4px 6px;border:1px solid #ddd;text-align:right}tr:nth-child(even)td{background:#f5f7ff!important}tfoot td{background:#e8f0fe!important;font-weight:800!important}</${'style'}><h2>📋 ${rNo} | ${today}</h2>${_svVars(content.innerHTML)}`;
  window.print();setTimeout(()=>pa.innerHTML='',2000);
}

function renderSavedWeeklyList(){
  const list=getSavedReports('weekly'),el=document.getElementById('savedWeeklyList');
  if(!el)return;
  if(!list.length){el.innerHTML='<div class="card" style="text-align:center;padding:40px;color:var(--text2)">لا توجد تقارير أسبوعية محفوظة<br><span style="font-size:12px">اضغط "تقرير أسبوعي جديد" للبدء</span></div>';return;}
  el.innerHTML=list.map((r,i)=>`<div class="card" style="padding:14px;margin-bottom:10px"><div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
    <div>
      <div style="font-size:14px;font-weight:700;color:var(--accent)">📋 ${r.title}</div>
      <div style="font-size:12px;color:var(--text2);margin-top:3px">${r.date} | ${r.projectCount||0} مشروع | إنتاج: <strong style="color:var(--accent2)">${(r.totalProd||0).toLocaleString('en-US')} ر.س</strong></div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-sm btn-secondary" onclick="viewSavedWeekly(${i})">👁️ عرض</button>
      <button class="btn btn-sm btn-secondary" onclick="printSavedWeekly(${i})">🖨️ طباعة</button>
      <button class="btn btn-sm btn-danger" onclick="deleteSavedReport('weekly',${i})">🗑️</button>
    </div>
  </div></div>`).join('');
}

function viewSavedWeekly(idx){
  const r=getSavedReports('weekly')[idx];if(!r)return;
  const m=document.createElement('div');m.className='modal-bg';
  m.innerHTML=`<div class="modal" style="max-width:1300px;width:97vw"><div class="modal-header"><div class="modal-title">📋 ${r.title}</div><div style="display:flex;gap:6px"><button class="btn btn-sm btn-secondary" onclick="printSavedWeekly(${idx})">🖨️ طباعة</button><button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest('.modal-bg').remove()">✕</button></div></div><div class="modal-body">${r.html}</div></div>`;
  document.body.appendChild(m);
}

function printSavedWeekly(idx){
  const r=getSavedReports('weekly')[idx];if(!r)return;
  const pa=document.getElementById('printArea');
  pa.innerHTML=`<${'style'}>@page{size:A3 landscape;margin:7mm}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}body{font-family:Cairo,sans-serif;direction:rtl;color:#111!important;background:#fff!important;margin:0}h2{color:#1a3a6a;border-bottom:3px solid #1a3a6a;padding-bottom:8px;margin-bottom:14px;font-size:15px}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#1a3a6a!important;color:#fff!important;padding:5px 6px;border:1px solid #999;text-align:right}td{padding:4px 6px;border:1px solid #ddd;text-align:right}tr:nth-child(even)td{background:#f5f7ff!important}tfoot td{background:#e8f0fe!important;font-weight:800!important}</${'style'}><h2>📋 ${r.title}</h2>${r.html}`;
  window.print();setTimeout(()=>pa.innerHTML='',2000);
}



// ══════════════════════════════════════════════════
// REPORT PAGE TABS
// ══════════════════════════════════════════════════
function switchRptTab(tab, ev){
  ['overview','weekly','monthly','client','timeline'].forEach(t=>{
    const el=document.getElementById('rptSection-'+t);
    if(el)el.style.display=(t===tab)?'block':'none';
  });
  document.querySelectorAll('[id^="rptTab-"]').forEach(b=>b.classList.remove('active'));
  const btn=document.getElementById('rptTab-'+tab);
  if(btn)btn.classList.add('active');
  if(tab==='overview'){renderReports();}
  else if(tab==='weekly'){_initWeeklyFilters();renderInlineWeekly();}
  else if(tab==='monthly'){_initMonthlyFilters();renderInlineMonthly();}
  if(_lang==='en'&&typeof _translateAllText==='function'){setTimeout(_translateAllText,100);setTimeout(_translateAllText,400);}
}

function _initWeeklyFilters(){
  const{projects}=loadData();
  const cos=[...new Set(projects.map(p=>p.company).filter(Boolean))];
  const regs=[...new Set(projects.map(p=>getRegion(p)).filter(Boolean))];
  const c=document.getElementById('wkFilterCompany');
  if(c&&c.options.length<=1)cos.forEach(x=>{const o=document.createElement('option');o.value=o.textContent=x;c.appendChild(o);});
  const r=document.getElementById('wkFilterRegion');
  if(r&&r.options.length<=1)regs.forEach(x=>{const o=document.createElement('option');o.value=o.textContent=x;r.appendChild(o);});
  // Default: current week
  const now=new Date(),y=now.getFullYear();
  const wn=_wkn(now);
  const wStr=`${y}-W${String(wn).padStart(2,'0')}`;
  const dfEl=document.getElementById('wkDateFrom');const dtEl=document.getElementById('wkDateTo');
  if(dfEl&&!dfEl.value)dfEl.value=wStr;
  if(dtEl&&!dtEl.value)dtEl.value=wStr;
}

function _initMonthlyFilters(){
  const{projects}=loadData();
  const cos=[...new Set(projects.map(p=>p.company).filter(Boolean))];
  const regs=[...new Set(projects.map(p=>getRegion(p)).filter(Boolean))];
  const c=document.getElementById('mnFilterCompany');
  if(c&&c.options.length<=1)cos.forEach(x=>{const o=document.createElement('option');o.value=o.textContent=x;c.appendChild(o);});
  const r=document.getElementById('mnFilterRegion');
  if(r&&r.options.length<=1)regs.forEach(x=>{const o=document.createElement('option');o.value=o.textContent=x;r.appendChild(o);});
  const now=new Date();
  const mStr=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const dfEl=document.getElementById('mnDateFrom');const dtEl=document.getElementById('mnDateTo');
  if(dfEl&&!dfEl.value)dfEl.value=mStr;
  if(dtEl&&!dtEl.value)dtEl.value=mStr;
}

// ──── Parse week input "YYYY-Www" to a Date range ────
function _weekRange(wStr){
  if(!wStr)return null;
  const [y,w]=wStr.split('-W');
  const jan4=new Date(+y,0,4);
  const monday=new Date(jan4);
  monday.setDate(jan4.getDate()-((jan4.getDay()||7)-1)+(+w-1)*7);
  const sunday=new Date(monday);sunday.setDate(monday.getDate()+6);
  return{start:monday,end:sunday};
}
// ──── Check if project was active/changed in a date range ────
function _projInRange(p,start,end){
  // Use stageDate (date of last stage change) or contractDate as fallback
  const dateStr=p.stageDate||p.contractDate||p.approvalDate||'';
  if(!dateStr)return true; // no date info — include by default
  const d=new Date(dateStr);
  if(isNaN(d))return true;
  return d>=start&&d<=end;
}
function _projInMonthRange(p,fromYM,toYM){
  const dateStr=p.stageDate||p.contractDate||p.approvalDate||'';
  if(!dateStr)return true;
  const d=new Date(dateStr);
  if(isNaN(d))return true;
  const ym=d.getFullYear()*100+(d.getMonth()+1);
  const from=fromYM?parseInt(fromYM.replace('-','')):-Infinity;
  const to=toYM?parseInt(toYM.replace('-','')):-Infinity;
  return ym>=from&&ym<=to;
}

function _buildRegionReport(projects,title){
  const fmt=v=>(+v).toLocaleString('en-US');
  const groups={};
  projects.forEach(p=>{
    const reg=getRegion(p)||'غير محدد';
    if(!groups[reg])groups[reg]=[];
    groups[reg].push(p);
  });
  if(!Object.keys(groups).length)
    return`<div class="card" style="text-align:center;padding:30px;color:var(--text2)">لا توجد مشاريع في هذه الفترة أو المعايير المحددة</div>`;

  const blocks=Object.entries(groups).map(([reg,ps])=>{
    let totC=0,totP=0,totR=0;
    const rows=ps.map((p,i)=>{
      const ext=parseFloat(p.extractValue)||0,contr=parseFloat(p.contractValue)||0,base=ext>0?ext:contr;
      const prod=Math.round(base*(parseFloat(p.progress)||0)/100);
      const down=parseFloat(p.downPayment)||0;
      totC+=base;totP+=prod;totR+=(base-down);
      const st=calcStatusFromStage(p.stage);
      const stc=st.includes('جاري')?'#228822':st.includes('موقوف')||st.includes('تأخير')?'#c00':'#555';
      const stageDate=p.stageDate?`<div style="font-size:10px;color:#888">${p.stageDate}</div>`:'';
      return`<tr>
        <td style="text-align:center;padding:5px">${i+1}</td>
        <td style="padding:5px;font-weight:600">${p.name||'-'}</td>
        <td style="padding:5px">${p.contractNo||'-'}</td>
        <td style="padding:5px">${p.company||'-'}</td>
        <td style="padding:5px">${p.gallery||'-'}</td>
        <td style="padding:5px;color:${stc};font-weight:600">${st}${stageDate}</td>
        <td style="padding:5px;text-align:center;font-weight:700;color:#a07800">${p.progress||0}%</td>
        <td style="padding:5px;text-align:right">${fmt(base)}</td>
        <td style="padding:5px;text-align:right;color:#a07800;font-weight:600">${fmt(prod)}</td>
        <td style="padding:5px;text-align:right;color:#c00">${fmt(base-down)}</td>
      </tr>`;
    }).join('');
    return`<div class="card" style="margin-bottom:14px;padding:0;overflow:hidden">
      <div style="background:var(--surface3);padding:10px 14px;font-weight:700;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;border-bottom:1px solid var(--border)">
        <span style="color:var(--accent)">📍 ${reg} <span style="font-weight:400;font-size:12px">(${ps.length} مشروع)</span></span>
        <span style="font-size:12px">عقود: <strong style="color:var(--accent)">${fmt(totC)}</strong> ر.س | إنتاج: <strong style="color:var(--accent2)">${fmt(totP)}</strong> ر.س | متبقي: <strong style="color:var(--accent3)">${fmt(totR)}</strong> ر.س</span>
      </div>
      <div class="table-wrap"><table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:var(--surface2);font-size:11px">
          <th style="padding:6px 4px;border:1px solid var(--border);width:28px">#</th>
          <th style="padding:6px 4px;border:1px solid var(--border)">العميل</th>
          <th style="padding:6px 4px;border:1px solid var(--border)">رقم العقد</th>
          <th style="padding:6px 4px;border:1px solid var(--border)">الشركة</th>
          <th style="padding:6px 4px;border:1px solid var(--border)">المعرض</th>
          <th style="padding:6px 4px;border:1px solid var(--border)">الحالة / تاريخها</th>
          <th style="padding:6px 4px;border:1px solid var(--border);width:60px">الإنجاز</th>
          <th style="padding:6px 4px;border:1px solid var(--border);width:110px">قيمة العقد</th>
          <th style="padding:6px 4px;border:1px solid var(--border);width:110px">قيمة الإنتاج</th>
          <th style="padding:6px 4px;border:1px solid var(--border);width:110px">المتبقي</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr style="background:var(--surface2);font-weight:800;font-size:12px">
          <td colspan="7" style="padding:7px 10px">إجمالي ${reg}</td>
          <td style="padding:7px;text-align:right">${fmt(totC)}</td>
          <td style="padding:7px;text-align:right;color:var(--accent2)">${fmt(totP)}</td>
          <td style="padding:7px;text-align:right;color:var(--accent3)">${fmt(totR)}</td>
        </tr></tfoot>
      </table></div>
    </div>`;
  }).join('');

  const all=projects;
  const gC=all.reduce((s,p)=>{const ext=parseFloat(p.extractValue)||0,contr=parseFloat(p.contractValue)||0,base=ext>0?ext:contr;return s+base;},0);
  const gP=all.reduce((s,p)=>{const ext=parseFloat(p.extractValue)||0,contr=parseFloat(p.contractValue)||0,base=ext>0?ext:contr;return s+Math.round(base*(parseFloat(p.progress)||0)/100);},0);
  const gR=all.reduce((s,p)=>{const ext=parseFloat(p.extractValue)||0,contr=parseFloat(p.contractValue)||0,base=ext>0?ext:contr;return s+(base-(parseFloat(p.downPayment)||0));},0);
  const summary=`<div class="card" style="padding:12px;margin-bottom:14px;background:var(--surface2)">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;text-align:center">
      <div class="stat-card"><div class="stat-num" style="color:var(--accent)">${all.length}</div><div class="stat-label">إجمالي المشاريع</div></div>
      <div class="stat-card"><div class="stat-num" style="color:var(--accent4)">${all.filter(p=>calcStatusFromStage(p.stage).includes('جاري')).length}</div><div class="stat-label">جارية</div></div>
      <div class="stat-card"><div class="stat-num" style="font-size:14px;color:var(--accent2)">${fmt(gP)}</div><div class="stat-label">إجمالي الإنتاج ر.س</div></div>
      <div class="stat-card"><div class="stat-num" style="font-size:14px;color:var(--accent3)">${fmt(gR)}</div><div class="stat-label">إجمالي المتبقي ر.س</div></div>
    </div>
  </div>`;
  return`<div id="inlineRptView"><div style="font-size:15px;font-weight:700;color:var(--accent);padding:10px 0;border-bottom:2px solid var(--accent);margin-bottom:14px">${title}</div>${summary}${blocks}</div>`;
}

function renderInlineWeekly(){
  const el=document.getElementById('wkReportContent');if(!el)return;
  const{projects}=loadData();
  const co=document.getElementById('wkFilterCompany')?.value||'';
  const re=document.getElementById('wkFilterRegion')?.value||'';
  const wFrom=document.getElementById('wkDateFrom')?.value||'';
  const wTo=document.getElementById('wkDateTo')?.value||'';
  let ps=projects;
  if(co)ps=ps.filter(p=>p.company===co);
  if(re)ps=ps.filter(p=>getRegion(p)===re);
  if(wFrom||wTo){
    const r1=wFrom?_weekRange(wFrom):null;
    const r2=wTo?_weekRange(wTo):null;
    const start=r1?r1.start:new Date(0);
    const end=r2?r2.end:new Date(9999,0);
    ps=ps.filter(p=>_projInRange(p,start,end));
  }
  const label=wFrom&&wTo&&wFrom===wTo?`أسبوع ${wFrom}`:`${wFrom||'—'} → ${wTo||'—'}`;
  el.innerHTML=_buildRegionReport(ps,`📋 التقرير الأسبوعي — ${label}`);
}

function renderInlineMonthly(){
  const el=document.getElementById('mnReportContent');if(!el)return;
  const{projects}=loadData();
  const co=document.getElementById('mnFilterCompany')?.value||'';
  const re=document.getElementById('mnFilterRegion')?.value||'';
  const mFrom=document.getElementById('mnDateFrom')?.value||'';
  const mTo=document.getElementById('mnDateTo')?.value||'';
  let ps=projects;
  if(co)ps=ps.filter(p=>p.company===co);
  if(re)ps=ps.filter(p=>getRegion(p)===re);
  if(mFrom||mTo)ps=ps.filter(p=>_projInMonthRange(p,mFrom,mTo));
  const fmt2=(ym)=>{if(!ym)return'—';const[y,m]=ym.split('-');const mn=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];return mn[(+m||1)-1]+' '+y;};
  const label=mFrom===mTo?fmt2(mFrom):`${fmt2(mFrom)} → ${fmt2(mTo)}`;
  el.innerHTML=_buildRegionReport(ps,`📅 التقرير الشهري — ${label}`);
}

function _printRptView(viewId, title){
  const el=document.getElementById(viewId);
  if(!el||!el.querySelector){notify('⚠️ لا يوجد تقرير للطباعة','error');return;}
  let html=el.innerHTML;
  const vm={'var(--surface)':'#fff','var(--surface2)':'#f0f4ff','var(--surface3)':'#e4e8f5','var(--text)':'#111','var(--text2)':'#555','var(--border)':'#ccd','var(--accent)':'#1a3a6a','var(--accent2)':'#a07800','var(--accent3)':'#c00','var(--accent4)':'#228822'};
  Object.entries(vm).forEach(([v,r])=>{html=html.split(v).join(r);});
  const pa=document.getElementById('printArea');
  pa.innerHTML=`<${'style'}>@page{size:A3 landscape;margin:7mm}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}body{font-family:Cairo,sans-serif;direction:rtl;color:#111!important;background:#fff!important;margin:0}h2,h3{color:#1a3a6a}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#1a3a6a!important;color:#fff!important;padding:5px 6px;border:1px solid #999;text-align:right}td{padding:4px 6px;border:1px solid #ddd;text-align:right}tr:nth-child(even)td{background:#f5f7ff!important}tfoot td{background:#e8f0fe!important;font-weight:800!important}.stat-card{background:#f5f7ff!important;border-radius:6px;padding:8px;text-align:center;border:1px solid #ddd}.stat-num{font-size:16px;font-weight:800;color:#1a3a6a!important}.stat-label{font-size:10px;color:#555!important}</${'style'}><h2>${title}</h2>${html}`;
  window.print();
  setTimeout(()=>pa.innerHTML='',2000);
}

function printInlineWeekly(){
  _printRptView('wkReportContent','📋 التقرير الأسبوعي');
}
function printInlineMonthly(){
  _printRptView('mnReportContent','📅 التقرير الشهري');
}
function saveInlineWeekly(){
  const el=document.getElementById('wkReportContent');if(!el||!el.innerHTML.trim())return;
  const today=new Date().toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'});
  const wk=document.getElementById('wkDateFrom')?.value||'';
  const rNo=`WK-${wk||new Date().getFullYear()+'-W'+String(_wkn(new Date())).padStart(2,'0')}`;
  const{projects}=loadData();
  const saved=getSavedReports('weekly');
  saved.unshift({reportNo:rNo,title:`تقرير أسبوعي — ${today}`,date:today,projectCount:projects.length,totalProd:0,html:_svVars(el.innerHTML)});
  setSavedReports('weekly',saved.slice(0,30));
  renderSavedWeeklyList();
  notify('✅ تم حفظ التقرير الأسبوعي');
}
function saveInlineMonthly(){
  const el=document.getElementById('mnReportContent');if(!el||!el.innerHTML.trim())return;
  const today=new Date().toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'});
  const mn=document.getElementById('mnDateFrom')?.value||'';
  const saved=getSavedReports('monthly');
  saved.unshift({reportNo:mn,title:`تقرير شهري — ${today}`,date:today,html:_svVars(el.innerHTML)});
  setSavedReports('monthly',saved.slice(0,30));
  notify('✅ تم حفظ التقرير الشهري');
}


// ══════════════════════════════════════════════════════════