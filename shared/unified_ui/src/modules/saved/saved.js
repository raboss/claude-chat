function renderSavedReports() {
  renderSavedProductionList();
  renderSavedMaterialsList();
  renderSavedWeeklyList();
}

function getSavedReports(type) {
  try { return JSON.parse(localStorage.getItem('pm_saved_'+type) || '[]'); }
  catch(e) { return []; }
}
function setSavedReports(type, arr) {
  localStorage.setItem('pm_saved_'+type, JSON.stringify(arr));
}

// ---- SAVED PRODUCTION ----
function saveProductionReport(btn) {
  const modal = btn.closest('.modal-bg');
  const body = modal?.querySelector('.modal-body');
  if(!body) return;
  const { projects } = loadData();
  const today = new Date().toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'});
  const reportNo = 'PR-' + new Date().getFullYear() + '-' + String(new Date().getMonth()+1).padStart(2,'0');
  // Sum total production
  let totalProd = 0;
  projects.forEach(p => {
    const yr = new Date().getFullYear(), mo = new Date().getMonth()+1;
    const log = p.productionLog||[];
    const thisE = log.find(e=>e.year===yr&&e.month===mo);
    if(!thisE) return;
    const prevE = log.filter(e=>(e.year<yr)||(e.year===yr&&e.month<mo)).sort((a,b)=>b.year-a.year||b.month-a.month)[0];
    const delta = Math.max(0,(thisE.progress||0)-(prevE?prevE.progress||0:0));
    const base = parseFloat(p.extractValue)||parseFloat(p.contractValue)||0;
    totalProd += Math.round(base*delta/100);
  });
  const saved = getSavedReports('production');
  // Strip var() for print compatibility
  const vm={'var(--surface2)':'#f0f3fa','var(--surface3)':'#e4e8f5','var(--text)':'#1a1e2e','var(--text2)':'#555','var(--border)':'#d0d4e8','var(--accent)':'#1a5ad9','var(--accent2)':'#a07800','var(--accent3)':'#cc2222','var(--accent4)':'#228822'};
  let html=body.innerHTML; Object.entries(vm).forEach(([v,r])=>{html=html.split(v).join(r);});
  saved.unshift({reportNo, title:`${t('تقرير إنتاج')} — ${today}`, date:today, rowCount:projects.length, totalProduction:totalProd, html});
  setSavedReports('production', saved.slice(0,50));
  notify('✅ '+t('تم حفظ تقرير الإنتاج')+': '+reportNo);
  renderSavedProductionList();
  if(modal) modal.remove();
}

function renderSavedProductionList() {
  const list = getSavedReports('production');
  const el = document.getElementById('savedProductionList');
  if(!el) return;
  if(!list.length) {
    el.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--text2)">'+t('لا توجد تقارير محفوظة بعد')+'<br><span style="font-size:12px">'+t('اضغط "تقرير إنتاج جديد" لإنشاء وحفظ تقرير')+'</span></div>';
    return;
  }
  el.innerHTML = list.map((r,i) => `
    <div class="card" style="padding:14px;margin-bottom:10px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--accent)">📈 ${r.title}</div>
          <div style="font-size:12px;color:var(--text2);margin-top:3px">${r.date} | ${r.rowCount} ${t('مشروع')} | ${t('إجمالي إنتاج')}: <strong style="color:var(--accent2)">${(r.totalProduction||0).toLocaleString('en-US')} ${t('ر.س')}</strong></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-sm btn-secondary" onclick="viewSavedProduction(${i})">👁️ ${t('عرض')}</button>
          <button class="btn btn-sm btn-secondary" onclick="exportSavedProductionExcel(${i})">📊 Excel</button>
          <button class="btn btn-sm btn-secondary" onclick="printSavedProduction(${i})">🖨️ ${t('طباعة')}</button>
          <button class="btn btn-sm btn-danger" onclick="deleteSavedReport('production',${i})">🗑️</button>
        </div>
      </div>
    </div>`).join('');
}

function viewSavedProduction(idx) {
  const list = getSavedReports('production');
  const r = list[idx];
  if(!r) return;
  const modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.innerHTML = `
    <div class="modal" style="max-width:1100px">
      <div class="modal-header">
        <div class="modal-title">📈 ${r.title}</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm btn-secondary" onclick="exportSavedProductionExcel(${idx})">📊 Excel</button>
          <button class="btn btn-sm btn-secondary" onclick="printSavedProduction(${idx})">🖨️ ${t('طباعة')}</button>
          <button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest('.modal-bg').remove()">✕</button>
        </div>
      </div>
      <div class="modal-body">${r.html}</div>
    </div>`;
  document.body.appendChild(modal);
}

function printSavedProduction(idx) {
  const list = getSavedReports('production');
  const r = list[idx];
  if(!r) return;
  const pa = document.getElementById('printArea');
  pa.innerHTML = `<${'style'}>@page{size:A4 landscape;margin:10mm} body{font-family:Cairo,sans-serif;direction:rtl} table{border-collapse:collapse;width:100%;font-size:11px} th,td{border:1px solid #ccc;padding:5px 8px;text-align:right} th{background:#1a3a6a;color:#fff}</${'style'}>
    <h2 style="color:#1a3a6a;border-bottom:3px solid #1a3a6a;padding-bottom:8px;margin-bottom:16px">${r.title}</h2>
    <div style="font-size:11px;color:#666;margin-bottom:12px">${t('التاريخ')}: ${r.date}</div>
    ${r.html}`;
  window.print();
  setTimeout(() => pa.innerHTML='', 1200);
}

function exportSavedProductionExcel(idx) {
  const list = getSavedReports('production');
  const r = list[idx];
  if(!r || !r.rows) return;
  
  const wb = XLSX.utils.book_new();
  r.rows.forEach(monthData => {
    if(!monthData.rows || !monthData.rows.length) return;
    const wsData = [
      [t('العميل'),t('الشركة'),t('القيمة الأساسية'),t('النسبة السابقة'),t('نسبة هذا الشهر'),t('الفرق %'),t('قيمة الإنتاج')],
      ...monthData.rows.map(row => [row.name, row.company, row.baseVal, row.prevProgress+'%', row.thisProgress+'%', row.delta+'%', row.prodValue]),
      ['','','','','',t('إجمالي الإنتاج'), monthData.total]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // Style header row
    ws['!cols'] = [{wch:25},{wch:15},{wch:15},{wch:12},{wch:14},{wch:10},{wch:15}];
    XLSX.utils.book_append_sheet(wb, ws, monthData.label.replace('/','_'));
  });
  XLSX.writeFile(wb, `تقرير_إنتاج_${r.date.replace(/\//g,'-')}.xlsx`);
  notify('✅ '+t('تم تصدير Excel'));
}

function deleteSavedReport(type, idx) {
  if(!confirm(t('هل تريد حذف هذا السجل؟'))) return;
  const list = getSavedReports(type);
  list.splice(idx, 1);
  setSavedReports(type, list);
  renderSavedReports();
  notify('🗑️ '+t('تم الحذف'));
}

// ---- SAVED MATERIALS ----
function renderSavedMaterialsList() {
  const list = getSavedReports('materials');
  const el = document.getElementById('savedMaterialsList');
  if(!el) return;
  if(!list.length) {
    el.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--text2)">'+t('لا توجد بيانات مواد محفوظة بعد')+'<br><span style="font-size:12px">'+t('اضغط "بيان مواد جديد" لإنشاء وحفظ بيان')+'</span></div>';
    return;
  }
  el.innerHTML = list.map((r,i) => `
    <div class="card" style="padding:14px;margin-bottom:10px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--accent)">📦 ${r.title}</div>
          <div style="font-size:12px;color:var(--text2);margin-top:3px">${r.date} | ${t('رقم')}: ${r.reportNo} | ${r.rowCount} ${t('مشروع')}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-sm btn-secondary" onclick="viewSavedMaterials(${i})">👁️ ${t('عرض')}</button>
          <button class="btn btn-sm btn-secondary" onclick="exportSavedMaterialsExcel(${i})">📊 Excel</button>
          <button class="btn btn-sm btn-secondary" onclick="printSavedMaterialsById(${i})">🖨️ ${t('طباعة')}</button>
          <button class="btn btn-sm btn-danger" onclick="deleteSavedReport('materials',${i})">🗑️</button>
        </div>
      </div>
    </div>`).join('');
}

function viewSavedMaterials(idx) {
  const list = getSavedReports('materials');
  const r = list[idx];
  if(!r) return;
  const modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.innerHTML = `
    <div class="modal" style="max-width:1200px">
      <div class="modal-header">
        <div class="modal-title">📦 ${r.title}</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm btn-secondary" onclick="exportSavedMaterialsExcel(${idx})">📊 Excel</button>
          <button class="btn btn-sm btn-secondary" onclick="printSavedMaterialsById(${idx})">🖨️ ${t('طباعة')}</button>
          <button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest('.modal-bg').remove()">✕</button>
        </div>
      </div>
      <div class="modal-body" style="overflow-x:auto">${r.html}</div>
    </div>`;
  document.body.appendChild(modal);
}

function printSavedMaterialsById(idx) {
  const list = getSavedReports('materials');
  const r = list[idx];
  if(!r) return;
  const pa = document.getElementById('printArea');
  pa.innerHTML = `<${'style'}>@page{size:A4 landscape;margin:8mm} body{font-family:Cairo,sans-serif;direction:rtl} table{border-collapse:collapse;width:100%;font-size:10px} th,td{border:1px solid #ccc;padding:4px 6px;text-align:right} th{background:#1a3a6a;color:#fff} tr:nth-child(even) td{background:#f5f7ff}</${'style'}>
    <h2 style="color:#1a3a6a;border-bottom:3px solid #1a3a6a;padding-bottom:8px">${r.title} — ${t('رقم')}: ${r.reportNo}</h2>
    <div style="font-size:11px;color:#666;margin-bottom:12px">${t('التاريخ')}: ${r.date}</div>
    ${r.html}`;
  window.print();
  setTimeout(() => pa.innerHTML='', 1200);
}

function exportSavedMaterialsExcel(idx) {
  const list = getSavedReports('materials');
  const r = list[idx];
  if(!r || !r.rows) return;
  
  const headers = [t('م'),t('اسم العميل'),t('رقم العقد'),t('الشركة'),t('المنطقة'),t('المعرض'),t('قيمة المستخلص'),t('الدفعة'),t('المتبقي'),t('قيمة المواد'),t('ما تم شراؤه'),t('المتبقي للمواد'),t('عهدة التشغيل'),t('الألمنيوم'),t('الزجاج')];
  const wsData = [
    headers,
    ...r.rows.map(row => [row.i, row.name, row.contractNo, row.company, row.region, row.gallery, row.ext, row.down, row.net, row.mats, row.purchased, row.matRemaining, row.ops, row.alum, row.glass]),
    ['','','','','',t('الإجمالي'), r.totalExtract,'','', r.totalMaterials,'','', r.totalOps, r.totalAlum, r.totalGlass],
    ['','','','','',t('إجمالي (عهدة+ألمنيوم+زجاج)'),'','','','','','','','', r.totalOps+r.totalAlum+r.totalGlass]
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = headers.map((_,i) => ({wch: i===1?25 : i===0?5 : 15}));
  XLSX.utils.book_append_sheet(wb, ws, t('بيان المواد'));
  XLSX.writeFile(wb, `بيان_مواد_${r.reportNo}.xlsx`);
  notify('✅ '+t('تم تصدير Excel'));
}

// ===================== PRODUCTION REPORT =====================
// ===================== EXCEL IMPORT/EXPORT =====================
// ---- EXCEL IMPORT WITH COLUMN MAPPING ----
let _importData = [];

function importExcel(input) {
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const workbook = XLSX.read(e.target.result, { type: 'array' });
      if(!workbook.SheetNames||!workbook.SheetNames.length){notify('❌ '+t('الملف لا يحتوي على أوراق عمل'),'error');return;}
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet, { defval:'' });
      if(!data.length) { notify('❌ '+t('الملف فارغ أو لا يحتوي على بيانات'), 'error'); return; }
      _importData = data;
      showImportMappingModal(Object.keys(data[0]));
    } catch(err) { notify('❌ '+t('خطأ في قراءة الملف')+': '+err.message, 'error'); }
  };
  reader.readAsArrayBuffer(file);
  input.value = '';
}

function showImportMappingModal(excelCols) {
  const { columns } = loadData();
  
  // Build sys fields from actual columns list (includes custom ones)
  const sysFields = columns.map(c => ({ id: c.id, label: c.label }));
  
  // Auto-guess mapping
  const autoMap = {};
  const guessMap = {
    'name':['اسم العميل','العميل','الاسم','client','name'],
    'projectName':['اسم المشروع','المشروع','project','project name'],
    'seq':['م','تسلسل','رقم','seq','#','no'],
    'contractNo':['رقم العقد','رقم عقد','contract no','contract number'],
    'company':['الشركة','شركة','company'],
    'region':['المناطق','المنطقة','منطقة','region','area'],
    'gallery':['المعرض','معرض','gallery'],
    'contractValue':['قيمة العقد','القيمة','المبلغ','value','amount'],
    'downPayment':['الدفعة المقدمة','دفعة مقدمة','مقدم','downpayment','down payment'],
    'extractValue':['قيمة المستخلص','المستخلص','extract'],
    'contractDate':['تاريخ العقد','تاريخ التوقيع','date'],
    'approvalDate':['تاريخ الاعتماد','الاعتماد','approval date','approved'],
    'contractDuration':['مدة العقد','مدة','duration'],
    'deliveryDate':['موعد التسليم','التسليم','delivery'],
    'status':['الحالة','حالة','status'],
    'stage':['المرحلة الحالية','المرحلة','مرحلة','stage','مراحل الإنتاج'],
    'progress':['النسبة','نسبة','progress','%','الإنجاز'],
    'phone':['الهاتف','هاتف','جوال','phone','mobile'],
    'notes':['ملاحظات','ملاحظة','notes']
  };
  // Also auto-match by label of custom columns
  columns.filter(c=>c.custom).forEach(c => {
    if(!guessMap[c.id]) guessMap[c.id] = [c.label, c.id];
  });
  
  excelCols.forEach(col => {
    const colLower = col.toLowerCase().trim();
    // First check existing sys fields
    Object.entries(guessMap).forEach(([field, variants]) => {
      if(!autoMap[col] && variants.some(v => colLower.includes(v.toLowerCase()))) {
        autoMap[col] = field;
      }
    });
    // If still no match, mark as "new" candidate
    if(!autoMap[col]) {
      const existCol = columns.find(c => c.label === col || c.id === col);
      if(existCol) autoMap[col] = existCol.id;
      else autoMap[col] = '__new__';
    }
  });
  
  const sysOptions = sysFields.map(f => `<option value="${f.id}">${f.label}</option>`).join('');
  
  const modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.id = 'importMappingModal';
  modal.innerHTML = `
    <div class="modal" style="max-width:760px">
      <div class="modal-header">
        <div class="modal-title">📥 ${t('ربط أعمدة الإكسل بحقول النظام')}</div>
        <button class="btn btn-sm btn-secondary btn-icon" onclick="document.getElementById('importMappingModal').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div style="background:var(--surface2);border-radius:8px;padding:12px;margin-bottom:14px;font-size:13px;display:flex;gap:16px;flex-wrap:wrap">
          <span>📊 <strong style="color:var(--accent)">${_importData.length}</strong> ${t('صف')}</span>
          <span>📋 <strong style="color:var(--accent)">${excelCols.length}</strong> ${t('عمود')}</span>
          <span style="color:var(--accent2)">💡 ${t('أعمدة لم تُعرف ستُضاف كأعمدة جديدة تلقائياً')}</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 30px 1fr 120px;gap:8px;align-items:center;padding:6px 10px;margin-bottom:6px">
          <div style="font-size:12px;font-weight:700;color:var(--accent)">${t('عمود الإكسل')}</div>
          <div></div>
          <div style="font-size:12px;font-weight:700;color:var(--accent)">${t('حقل النظام')}</div>
          <div style="font-size:12px;font-weight:700;color:var(--accent)">${t('اسم جديد (اختياري)')}</div>
        </div>

        <div id="mappingRows">
        ${excelCols.map((col,i) => {
          const isNew = autoMap[col] === '__new__';
          return `
          <div style="display:grid;grid-template-columns:1fr 30px 1fr 120px;gap:8px;align-items:center;margin-bottom:8px;padding:8px;background:var(--surface2);border-radius:8px;border:1px solid ${isNew?'rgba(201,168,76,0.3)':'var(--border)'}">
            <div style="padding:6px 10px;background:var(--surface3);border-radius:6px;font-size:13px;font-weight:500">${col}</div>
            <div style="text-align:center;color:var(--text2)">→</div>
            <select id="map_${i}" onchange="toggleNewColInput(${i},this.value)" style="font-size:13px">
              <option value="">-- ${t('تجاهل')} --</option>
              ${sysOptions}
              <option value="__new__" ${isNew?'selected':''} style="color:var(--accent2);font-weight:700">➕ ${t('عمود جديد')}</option>
              ${!isNew && autoMap[col] ? '' : ''}
            </select>
            <input id="newname_${i}" placeholder="${t('اسم العمود الجديد')}" value="${isNew?col:''}"
              style="font-size:12px;display:${isNew?'block':'none'}"
              title="${t('اسم العمود الجديد الذي سيُضاف للنظام')}">
          </div>`;
        }).join('')}
        </div>

        <!-- Set auto-selected options after render -->
        <div id="mappingRows">
        </div>
        
        <div style="margin-top:14px;background:var(--surface2);border-radius:8px;padding:12px">
          <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:8px">👁️ ${t('معاينة أول 3 صفوف')}:</div>
          <div style="overflow-x:auto;font-size:11px">
            <table style="border-collapse:collapse">
              <tr>${excelCols.map(c=>`<th style="padding:4px 8px;background:var(--surface3);color:var(--text2);border:1px solid var(--border);white-space:nowrap">${c}</th>`).join('')}</tr>
              ${_importData.slice(0,3).map(row=>`<tr>${excelCols.map(c=>`<td style="padding:4px 8px;border:1px solid var(--border);color:var(--text);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${row[c]||''}</td>`).join('')}</tr>`).join('')}
            </table>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('importMappingModal').remove()">${t('إلغاء')}</button>
        <button class="btn btn-primary" onclick="doImport(${JSON.stringify(excelCols).replace(/"/g,'&quot;')})">✅ ${t('استيراد البيانات')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Apply auto-mapping selections
  excelCols.forEach((col, i) => {
    const sel = document.getElementById('map_'+i);
    if(sel && autoMap[col] && autoMap[col] !== '__new__') sel.value = autoMap[col];
  });
}

function toggleNewColInput(i, val) {
  const inp = document.getElementById('newname_'+i);
  if(inp) inp.style.display = val === '__new__' ? 'block' : 'none';
}

function doImport(excelCols) {
  const mapping = {}; // excelCol -> sysFieldId
  const newCols = {};  // excelCol -> newColName (when __new__)
  
  excelCols.forEach((col, i) => {
    const sel = document.getElementById('map_'+i);
    if(!sel || !sel.value) return;
    if(sel.value === '__new__') {
      const nameInp = document.getElementById('newname_'+i);
      const newName = (nameInp && nameInp.value.trim()) ? nameInp.value.trim() : col;
      newCols[col] = newName;
    } else {
      mapping[col] = sel.value;
    }
  });
  
  if(!Object.keys(mapping).length && !Object.keys(newCols).length) {
    notify('⚠️ '+t('يرجى ربط عمود واحد على الأقل'), 'error'); return;
  }
  
  const d = loadData();
  
  // Create new columns in the system first
  const createdCols = [];
  Object.entries(newCols).forEach(([excelCol, colName]) => {
    const newId = 'c_' + colName.replace(/\s+/g,'_') + '_' + Date.now().toString().slice(-4);
    if(!d.columns.find(c => c.id === newId || c.label === colName)) {
      d.columns.push({ id: newId, label: colName, type: 'text', show: true, custom: true });
      createdCols.push(colName);
    }
    mapping[excelCol] = newId;
  });
  if(createdCols.length) localStorage.setItem('pm_columns', JSON.stringify(d.columns));
  
  // Import rows
  let added = 0;
  const ts = Date.now();
  _importData.forEach((row, idx) => {
    const project = { id: (ts + idx).toString() };
    Object.entries(mapping).forEach(([excelCol, sysField]) => {
      const val = row[excelCol];
      if(val !== undefined && val !== '') project[sysField] = String(val).trim();
    });
    if(!project.name) project.name = `${t('عميل')} ${d.projects.length + added + 1}`;
    d.projects.push(project);
    added++;
  });
  
  localStorage.setItem('pm_projects', JSON.stringify(d.projects));
  document.getElementById('importMappingModal').remove();
  renderTable();
  renderStats();
  
  let msg = `✅ ${t('تم استيراد')} ${added} ${t('مشروع')}`;
  if(createdCols.length) msg += ` | ${t('أضيف')} ${createdCols.length} ${t('عمود جديد')}: ${createdCols.join('، ')}`;
  notify(msg);
}

function exportToExcel() {
  const { projects, columns } = loadData();
  if(!projects.length) { notify(t('لا توجد مشاريع للتصدير')); return; }

  const headers = columns.map(c => c.label);
  const rows = projects.map(p => columns.map(c => p[c.id] || ''));

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, t('المشاريع'));
  XLSX.writeFile(wb, 'projects.xlsx');
  notify('✅ '+t('تم التصدير'));
}

// ===================== NOTIFY =====================
function notify(msg, type) {
  const el = document.getElementById('notif');
  el.textContent = msg;
  el.style.display = 'block';
  el.style.borderColor = type==='error' ? 'var(--accent3)' : 'var(--accent)';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.style.display='none', 3000);
}

// ===================== DATA MIGRATION =====================
function getRegion(p) {
  // Handles both old key 'المناطق' and new key 'region'
  return p.region || p['المناطق'] || '';
}

function migrateRegionField() {
  const d = loadData();
  let changed = false;
  d.projects.forEach(p => {
    // Fix region key
    if(p['المناطق'] !== undefined) {
      if(!p.region) p.region = p['المناطق'];
      delete p['المناطق'];
      changed = true;
    }
    // Fix contractNo key
    if(p['رقم العقد'] !== undefined && !p.contractNo) {
      p.contractNo = p['رقم العقد'];
      delete p['رقم العقد'];
      changed = true;
    }
    // Auto-set status from stage if missing
    if(!p.status && p.stage) {
      p.status = calcStatusFromStage(p.stage);
      changed = true;
    }
    // Auto-calc deliveryDate using smart calc (latest of approvalDate/siteReadyDate + duration)
    if(p.contractDuration && (p.approvalDate || p.siteReadyDate)) {
      const smart = calcSmartDeliveryDate(p);
      if(smart && smart !== p.deliveryDate) {
        p.deliveryDate = smart;
        changed = true;
      }
    }
  });
  if(changed) localStorage.setItem('pm_projects', JSON.stringify(d.projects));
}

// Parse date string - handle multiple formats
function _parseDate(str) {
  if(!str) return null;
  let date;
  if(String(str).match(/^\d{4}-\d{2}-\d{2}$/)) {
    date = new Date(str);
  } else if(String(str).match(/\d+-\d+-\d+/)) {
    const parts = str.split('-');
    if(parts[0].length === 4) date = new Date(parts[0], parts[1]-1, parts[2]);
    else date = new Date(parts[2], parts[1]-1, parts[0]);
  } else if(!isNaN(str)) {
    date = new Date((parseInt(str) - 25569) * 86400000);
  } else {
    return null;
  }
  return isNaN(date.getTime()) ? null : date;
}

// Get holidays set from settings
function _getHolidaysSet() {
  try {
    const raw = localStorage.getItem('pm_holidays');
    if(raw) return new Set(JSON.parse(raw));
  } catch(e) {}
  return new Set(typeof DEFAULT_HOLIDAYS !== 'undefined' ? DEFAULT_HOLIDAYS : []);
}

// Get delivery calc settings
function _getDeliverySettings() {
  try {
    const raw = localStorage.getItem('pm_delivery_settings');
    if(raw) return JSON.parse(raw);
  } catch(e) {}
  return { skipFridays: true, skipHolidays: true };
}

// Calculate delivery date = startDate + durationDays, skipping Fridays and holidays
function calcDeliveryDate(startDateStr, durationDays) {
  if(!startDateStr || !durationDays) return '';
  const date = _parseDate(startDateStr);
  if(!date) return '';

  const settings = _getDeliverySettings();
  const holidays = settings.skipHolidays ? _getHolidaysSet() : new Set();

  let added = 0;
  while(added < durationDays) {
    date.setDate(date.getDate() + 1);
    const dayStr = date.toISOString().slice(0,10);
    // Skip Friday (5) if enabled
    if(settings.skipFridays && date.getDay() === 5) continue;
    // Skip holidays if enabled
    if(holidays.has(dayStr)) continue;
    added++;
  }
  return date.toISOString().slice(0,10);
}

// Smart delivery date: picks the LATEST of (approvalDate, siteReadyDate) then adds contractDuration
function calcSmartDeliveryDate(project) {
  const dur = parseInt(project.contractDuration);
  if(!dur) return '';

  const approval = _parseDate(project.approvalDate);
  const siteReady = _parseDate(project.siteReadyDate);

  // Pick the latest date
  let startDate = null;
  if(approval && siteReady) {
    startDate = approval > siteReady ? approval : siteReady;
  } else if(approval) {
    startDate = approval;
  } else if(siteReady) {
    startDate = siteReady;
  } else {
    return ''; // no start date available
  }

  return calcDeliveryDate(startDate.toISOString().slice(0,10), dur);
}

// Check if duration should be paused (missing conditions)
function getDeliveryPauseReasons(project) {
  const reasons = [];
  if(!project.siteReadyDate) reasons.push(t('لم يتم تحديد تاريخ جاهزية الموقع'));
  if(!project.approvalDate) reasons.push(t('لم يتم اعتماد المخططات'));
  if(!project.secondPaymentDate) reasons.push(t('لم يتم سداد الدفعة الثانية'));
  return reasons;
}

// ===================== INIT =====================
window.onload = function() {

  // ====== ONE-TIME FRESH INIT ======
  const FRESH_COLUMNS = [
    { id:'seq',             label:'م',                     show:true,  required:false, type:'number'  },
    { id:'contractNo',      label:'رقم العقد',              show:true,  required:false, type:'text'    },
    { id:'name',            label:'اسم العميل',             show:true,  required:true,  type:'text'    },
    { id:'company',         label:'الشركة',                 show:true,  required:false, type:'select'  },
    { id:'region',          label:'المنطقة',                show:true,  required:false, type:'select'  },
    { id:'gallery',         label:'المعرض',                 show:true,  required:false, type:'select'  },
    { id:'contractValue',   label:'قيمة العقد',             show:true,  required:false, type:'number'  },
    { id:'downPayment',     label:'الدفعة المقدمة',         show:true,  required:false, type:'number'  },
    { id:'extractValue',    label:'قيمة المستخلص',          show:false, required:false, type:'number'  },
    { id:'productionValue', label:'قيمة الإنتاج',           show:true,  required:false, type:'calc'    },
    { id:'remaining',       label:'المبلغ المتبقي',         show:true,  required:false, type:'calc'    },
    { id:'contractDate',    label:'تاريخ العقد',            show:true,  required:false, type:'date'    },
    { id:'approvalDate',    label:'تاريخ الاعتماد',         show:true,  required:false, type:'date'    },
    { id:'siteReadyDate',   label:'تاريخ جاهزية الموقع',    show:true,  required:false, type:'date'    },
    { id:'secondPaymentDate',label:'تاريخ سداد الدفعة الثانية', show:true, required:false, type:'date' },
    { id:'contractDuration',label:'مدة العقد (يوم)',        show:true,  required:false, type:'number'  },
    { id:'deliveryDate',    label:'تاريخ التسليم',          show:true,  required:false, type:'date'    },
    { id:'stage',           label:'المرحلة الحالية',        show:true,  required:false, type:'stages'  },
    { id:'status',          label:'الحالة',                 show:true,  required:false, type:'auto'    },
    { id:'progress',        label:'نسبة الإنجاز',           show:true,  required:false, type:'progress'},
    { id:'phone',           label:'الهاتف',                 show:false, required:false, type:'text'    },
    { id:'notes',           label:'ملاحظات',                show:false, required:false, type:'text'    }
  ];

  const FRESH_PROFILES = {
    'السلطان':      { nameAr:'مجموعة السلطان للألمنيوم والزجاج',   nameEn:'Al Sultan Aluminum & Glass Group'             },
    'عالم المعادن': { nameAr:'عالم المعادن للصلب والحديد المزخرف',  nameEn:'Metal World - Stainless Steel & Decorative Iron'},
    'الراجحي':      { nameAr:'الراجحي للزخرفة والحديد',             nameEn:'Al Rajhi Decorative & Iron Works'             },
    'الفوزان':      { nameAr:'شركة الفوزان للأعمال المعدنية',       nameEn:'Al Fozan Metal Works Company'                 }
  };

  // تاريخ التسليم = تاريخ الاعتماد + مدة العقد (بدون جمعة)
  const SAMPLE_PROJECTS = [
    // ── الراجحي / الوسطى ──
    { id:'d01', seq:'1',  contractNo:'240200156', name:'صالح محمد الشهراني',
      company:'الراجحي', region:'الوسطى', gallery:'الياسمين',
      contractValue:'65000', downPayment:'50000', extractValue:'75000',
      contractDate:'2026-01-10', approvalDate:'2026-01-28', contractDuration:'90', deliveryDate:'2026-05-12',
      stage:'سداد الدفعة الثانية', progress:'50',
      productionLog:[{year:2026,month:1,progress:30},{year:2026,month:2,progress:50}] },

    { id:'d02', seq:'2',  contractNo:'240300012', name:'عبدالله سعد الغامدي',
      company:'الراجحي', region:'الوسطى', gallery:'التخصصي 1',
      contractValue:'42000', downPayment:'15000', extractValue:'42000',
      contractDate:'2026-01-15', approvalDate:'2026-02-01', contractDuration:'75', deliveryDate:'2026-04-24',
      stage:'دهان الخامات', progress:'35',
      productionLog:[{year:2026,month:1,progress:15},{year:2026,month:2,progress:35}] },

    { id:'d03', seq:'3',  contractNo:'240100238', name:'شركة عوارض للمقاولات العامة',
      company:'الراجحي', region:'الوسطى', gallery:'التخصصي 2',
      contractValue:'56410', downPayment:'5000', extractValue:'12000',
      contractDate:'2025-12-20', approvalDate:'2026-01-05', contractDuration:'60', deliveryDate:'2026-03-26',
      stage:'طلب الزجاج', progress:'70',
      productionLog:[{year:2026,month:1,progress:45},{year:2026,month:2,progress:70}] },

    // ── الراجحي / الشرقية ──
    { id:'d04', seq:'4',  contractNo:'250200018', name:'محمد فهد القحطاني',
      company:'الراجحي', region:'الشرقية', gallery:'الخبر',
      contractValue:'38500', downPayment:'12000', extractValue:'0',
      contractDate:'2026-02-10', approvalDate:'2026-02-20', contractDuration:'60', deliveryDate:'2026-05-01',
      stage:'رفع مقاسات', progress:'10',
      productionLog:[{year:2026,month:1,progress:0},{year:2026,month:2,progress:10}] },

    { id:'d05', seq:'5',  contractNo:'250200035', name:'سلطان عبدالرحمن الدوسري',
      company:'الراجحي', region:'الشرقية', gallery:'الدمام',
      contractValue:'91000', downPayment:'30000', extractValue:'91000',
      contractDate:'2025-11-01', approvalDate:'2025-11-20', contractDuration:'120', deliveryDate:'2026-04-15',
      stage:'تركيب الزجاج', progress:'88',
      productionLog:[{year:2026,month:1,progress:60},{year:2026,month:2,progress:88}] },

    // ── السلطان / الوسطى ──
    { id:'d06', seq:'6',  contractNo:'242400014', name:'شركة ثبات للإنشاءات المحدودة',
      company:'السلطان', region:'الوسطى', gallery:'المبيعات الخارجية - مشرف',
      contractValue:'10000', downPayment:'15000', extractValue:'5000',
      contractDate:'2026-01-25', approvalDate:'2026-02-01', contractDuration:'60', deliveryDate:'2026-04-14',
      stage:'بدأ التركيب', progress:'65',
      productionLog:[{year:2026,month:1,progress:30},{year:2026,month:2,progress:65}] },

    { id:'d07', seq:'7',  contractNo:'242500022', name:'خالد إبراهيم العتيبي',
      company:'السلطان', region:'الوسطى', gallery:'التخصصي 1',
      contractValue:'29800', downPayment:'10000', extractValue:'29800',
      contractDate:'2026-02-05', approvalDate:'2026-02-18', contractDuration:'45', deliveryDate:'2026-04-15',
      stage:'اصدار مستخلص', progress:'55',
      productionLog:[{year:2026,month:1,progress:20},{year:2026,month:2,progress:55}] },

    // ── السلطان / الغربية ──
    { id:'d08', seq:'8',  contractNo:'242600011', name:'فيصل ناصر الزهراني',
      company:'السلطان', region:'الغربية', gallery:'مكة',
      contractValue:'55000', downPayment:'20000', extractValue:'55000',
      contractDate:'2025-12-15', approvalDate:'2026-01-02', contractDuration:'90', deliveryDate:'2026-04-12',
      stage:'توريد اعمال الالمنيوم', progress:'75',
      productionLog:[{year:2026,month:1,progress:50},{year:2026,month:2,progress:75}] },

    // ── عالم المعادن / الغربية ──
    { id:'d09', seq:'9',  contractNo:'240600033', name:'د. محمد علي الميمني',
      company:'عالم المعادن', region:'الغربية', gallery:'مكة',
      contractValue:'21045', downPayment:'7000', extractValue:'2100',
      contractDate:'2026-01-28', approvalDate:'2026-02-28', contractDuration:'60', deliveryDate:'2026-05-22',
      stage:'استلام الزجاج مع التوريد', progress:'95', notes:'عميل VIP - تسليم عاجل',
      productionLog:[{year:2026,month:1,progress:80},{year:2026,month:2,progress:95}] },

    { id:'d10', seq:'10', contractNo:'240700044', name:'مؤسسة الأمل للمقاولات',
      company:'عالم المعادن', region:'الغربية', gallery:'مكة',
      contractValue:'33000', downPayment:'11000', extractValue:'33000',
      contractDate:'2026-01-20', approvalDate:'2026-02-10', contractDuration:'70', deliveryDate:'2026-05-05',
      stage:'البدء بالتصنيع', progress:'45',
      productionLog:[{year:2026,month:1,progress:20},{year:2026,month:2,progress:45}] },

    // ── عالم المعادن / الشمالية ──
    { id:'d11', seq:'11', contractNo:'250100099', name:'عمر حسن العنزي',
      company:'عالم المعادن', region:'الشمالية', gallery:'الدمام',
      contractValue:'18500', downPayment:'6000', extractValue:'0',
      contractDate:'2026-02-20', approvalDate:'2026-03-01', contractDuration:'50', deliveryDate:'2026-05-05',
      stage:'عمل مخططات', progress:'20',
      productionLog:[{year:2026,month:1,progress:5},{year:2026,month:2,progress:20}] },

    // ── الفوزان / الوسطى ──
    { id:'d12', seq:'12', contractNo:'250100004', name:'زياد محمد العبيكة',
      company:'الفوزان', region:'الوسطى', gallery:'التخصصي 1',
      contractValue:'54123', downPayment:'6400', extractValue:'54400',
      contractDate:'2026-02-10', approvalDate:'2026-02-25', contractDuration:'65', deliveryDate:'2026-05-20',
      stage:'البدء بالتصنيع', progress:'50',
      productionLog:[{year:2026,month:1,progress:15},{year:2026,month:2,progress:50}] },

    { id:'d13', seq:'13', contractNo:'250300007', name:'شركة النخيل للتطوير العقاري',
      company:'الفوزان', region:'الوسطى', gallery:'الياسمين',
      contractValue:'120000', downPayment:'40000', extractValue:'120000',
      contractDate:'2025-10-01', approvalDate:'2025-10-20', contractDuration:'150', deliveryDate:'2026-04-28',
      stage:'تشطيب الموقع', progress:'92',
      productionLog:[{year:2026,month:1,progress:75},{year:2026,month:2,progress:92}] },

    // ── الفوزان / الشرقية ──
    { id:'d14', seq:'14', contractNo:'250400015', name:'أحمد علي البقمي',
      company:'الفوزان', region:'الشرقية', gallery:'الخبر',
      contractValue:'47000', downPayment:'15000', extractValue:'47000',
      contractDate:'2026-01-05', approvalDate:'2026-01-20', contractDuration:'80', deliveryDate:'2026-04-28',
      stage:'طلب الخامات', progress:'30',
      productionLog:[{year:2026,month:1,progress:10},{year:2026,month:2,progress:30}] },

    // ── الفوزان / الغربية ──
    { id:'d15', seq:'15', contractNo:'250500020', name:'ماجد سعيد الحربي',
      company:'الفوزان', region:'الغربية', gallery:'مكة',
      contractValue:'62000', downPayment:'22000', extractValue:'0',
      contractDate:'2026-02-15', approvalDate:'2026-03-02', contractDuration:'85', deliveryDate:'2026-06-25',
      stage:'توقيع العقد', progress:'0',
      productionLog:[{year:2026,month:1,progress:0},{year:2026,month:2,progress:0}] }
  ];

  // ⛔ تم إلغاء البيانات التجريبية — السيرفر هو المصدر الوحيد
  // إذا ما في بيانات محلية، يتم تحميلها من السيرفر عبر _loadSrv بـ 01-config.js
  if(!localStorage.getItem('pm_v5_init')) {
    localStorage.setItem('pm_v5_init', '1');
  }

  // Restore theme
  const savedTheme = localStorage.getItem('pm_theme');
  if(savedTheme === 'light') {
    document.body.classList.add('light-mode');
    const btn = document.getElementById('themeToggleBtn');
    if(btn) btn.textContent = '☀️';
  }

  renderStats();
  renderTable();
};

// لإعادة التهيئة من الكونسول: resetToDemo()
function resetToDemo() {
  localStorage.removeItem('pm_v5_init');
  location.reload();
}

// ══════════════════════════════════════════════════
// SECTIONS (القطاعات)
// ══════════════════════════════════════════════════
const DEFAULT_SECTIONS = [
  {name:'رويال',     addWidth:8,  addHeight:8,  minArea:1,    minAreaVal:1},
  {name:'ثيرما',     addWidth:6,  addHeight:6,  minArea:1,    minAreaVal:1},
  {name:'كاملوت',    addWidth:8,  addHeight:8,  minArea:1,    minAreaVal:1},
  {name:'أكريل',     addWidth:0,  addHeight:0,  minArea:0.5,  minAreaVal:0.5},
  {name:'ساندوتش',   addWidth:4,  addHeight:4,  minArea:1,    minAreaVal:1},
  {name:'زجاج مفرد', addWidth:0,  addHeight:0,  minArea:0.5,  minAreaVal:0.5}
];
function loadSections(){try{return JSON.parse(localStorage.getItem('pm_sections')||JSON.stringify(DEFAULT_SECTIONS));}catch(e){return[...DEFAULT_SECTIONS];}}
function saveSectionsData(arr){localStorage.setItem('pm_sections',JSON.stringify(arr));}

function renderSectionsSettings(){
  const el=document.getElementById('sectionsListSettings');
  if(!el)return;
  const sections=loadSections();
  if(!sections.length){
    el.innerHTML='<div style="padding:16px;text-align:center;color:var(--text2);border:1px dashed var(--border);border-radius:8px">'+t('لا توجد قطاعات — أضف قطاعاً من الأسفل')+'</div>';
    return;
  }
  el.innerHTML=`<div class="table-wrap"><table>
    <thead><tr>
      <th style="width:28px">#</th>
      <th>${t('اسم القطاع')}</th>
      <th style="width:115px">${t('زيادة العرض (مم)')}</th>
      <th style="width:120px">${t('زيادة الارتفاع (مم)')}</th>
      <th style="width:110px" title="${t('إذا كانت المساحة أقل من هذا الرقم...')}">📐 ${t('أقل من (م²)')}</th>
      <th style="width:110px" title="${t('تُحسب بهذه القيمة بدلاً عنها')}">= ${t('يساوي (م²)')}</th>
      <th style="width:62px;text-align:center">${t('حفظ')}</th>
      <th style="width:52px;text-align:center">${t('حذف')}</th>
    </tr></thead>
    <tbody>
    ${sections.map((s,i)=>`<tr id="secRow_${i}">
      <td style="text-align:center;color:var(--text2);font-size:11px">${i+1}</td>
      <td><input id="secName_${i}" value="${s.name}" style="width:100%;min-width:110px" placeholder="${t('اسم القطاع')}"></td>
      <td><input id="secW_${i}" type="number" value="${s.addWidth}" style="width:95px" min="0" placeholder="0"></td>
      <td><input id="secH_${i}" type="number" value="${s.addHeight}" style="width:95px" min="0" placeholder="0"></td>
      <td><input id="secMinThr_${i}" type="number" value="${s.minArea??1}" step="0.01" min="0" style="width:90px;border-right:2px solid var(--accent)" placeholder="1.00" title="${t('إذا كانت المساحة أقل من هذا الرقم')}"></td>
      <td><input id="secMinVal_${i}" type="number" value="${s.minAreaVal??s.minArea??1}" step="0.01" min="0" style="width:90px;border-right:2px solid #16a34a" placeholder="1.00" title="${t('تُحسب بهذه القيمة بدلاً عنها')}"></td>
      <td style="text-align:center"><button class="btn btn-sm btn-primary" onclick="saveSectionRow(${i})" style="padding:3px 8px">💾</button></td>
      <td style="text-align:center"><button class="btn btn-sm btn-danger" onclick="deleteSection(${i})" style="padding:3px 8px">🗑️</button></td>
    </tr>`).join('')}
    </tbody>
  </table></div>
  <div style="font-size:11px;color:var(--text2);margin-top:8px;padding:8px 12px;background:var(--surface2);border-radius:6px;border-right:3px solid var(--accent)">
    💡 ${t('مثال: إذا مساحة النافذة أقل من')} <strong>1 ${t('م²')}</strong> → ${t('تُحسب كـ')} <strong>1 ${t('م²')}</strong> — ${t('أدخل 1 في كلا العمودين')}
  </div>`;
}

function saveSectionRow(i){
  const name=(document.getElementById('secName_'+i)?.value||'').trim();
  const addW=+(document.getElementById('secW_'+i)?.value||0);
  const addH=+(document.getElementById('secH_'+i)?.value||0);
  const minThr=parseFloat(document.getElementById('secMinThr_'+i)?.value??0)||0;
  const minVal=parseFloat(document.getElementById('secMinVal_'+i)?.value??minThr)||minThr;
  if(!name){notify('⚠️ '+t('أدخل اسم القطاع'),'error');return;}
  const s=loadSections();
  s[i]={name,addWidth:addW,addHeight:addH,minArea:minThr,minAreaVal:minVal};
  saveSectionsData(s);renderSectionsSettings();notify('✅ '+t('تم حفظ القطاع')+': '+name);
}
function deleteSection(i){
  if(!confirm(t('حذف هذا القطاع؟')))return;
  const s=loadSections();s.splice(i,1);saveSectionsData(s);renderSectionsSettings();notify('🗑️ '+t('تم الحذف'));
}
function addSection(){
  const name=(document.getElementById('newSecName')?.value||'').trim();
  const addW=+(document.getElementById('newSecW')?.value||0);
  const addH=+(document.getElementById('newSecH')?.value||0);
  if(!name){notify('⚠️ '+t('أدخل اسم القطاع'),'error');return;}
  const s=loadSections();
  if(s.find(x=>x.name===name)){notify('⚠️ '+t('هذا القطاع موجود مسبقاً'),'error');return;}
  const minThrN=parseFloat(document.getElementById('newSecMin')?.value??0)||0;
  const minValN=parseFloat(document.getElementById('newSecMinVal')?.value??minThrN)||minThrN;
  s.push({name,addWidth:addW,addHeight:addH,minArea:minThrN,minAreaVal:minValN});
  saveSectionsData(s);
  document.getElementById('newSecName').value='';
  document.getElementById('newSecW').value='0';
  document.getElementById('newSecH').value='0';
  renderSectionsSettings();notify('✅ '+t('تم إضافة القطاع')+': '+name);
}

// ══════════════════════════════════════════════════
// MEASUREMENTS DATA helpers
// ══════════════════════════════════════════════════
function getMeasurementsData(pid){try{return JSON.parse(localStorage.getItem('pm_meas_'+pid)||'null');}catch(e){return null;}}
function setMeasurementsData(pid,rows){localStorage.setItem('pm_meas_'+pid,JSON.stringify(rows));}

// ══════════════════════════════════════════════════
// PRICE LIST DATA helpers
// ══════════════════════════════════════════════════
function getPLData(pid){try{return JSON.parse(localStorage.getItem('pm_pl_'+pid)||'[]');}catch(e){return[];}}
function setPLData(pid,rows){localStorage.setItem('pm_pl_'+pid,JSON.stringify(rows));}

// ══════════════════════════════════════════════════
// OPEN MEASUREMENTS MODAL
// ══════════════════════════════════════════════════