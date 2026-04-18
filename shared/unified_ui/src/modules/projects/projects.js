// ═══════════════════════════════════════════════════════
// ══ SEARCHABLE SELECT — قائمة منسدلة قابلة للبحث ══════
// ═══════════════════════════════════════════════════════
function _makeSearchable(sel) {
  if(!sel || sel.dataset.searchable) return;
  sel.dataset.searchable = '1';
  sel.style.display = 'none';

  var wrap = document.createElement('div');
  wrap.className = 'ss-wrap';
  wrap.style.cssText = 'position:relative;width:100%';

  var inp = document.createElement('input');
  inp.type = 'text';
  inp.className = 'ss-input';
  inp.placeholder = sel.options[sel.selectedIndex]?.text || t('اختر...');
  inp.style.cssText = 'width:100%;cursor:pointer';
  if(sel.value) { inp.value = sel.options[sel.selectedIndex]?.text || sel.value; }

  var drop = document.createElement('div');
  drop.className = 'ss-drop';
  drop.style.cssText = 'display:none;position:absolute;top:100%;left:0;right:0;z-index:9999;max-height:220px;overflow-y:auto;background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;margin-top:2px;box-shadow:0 8px 24px rgba(0,0,0,.25)';

  function buildList(filter) {
    var html = '';
    var f = (filter||'').toLowerCase();
    for(var i=0; i<sel.options.length; i++) {
      var o = sel.options[i];
      var txt = o.text;
      var val = o.value;
      if(f && !txt.toLowerCase().includes(f) && !val.toLowerCase().includes(f)) continue;
      var bg = val === sel.value ? 'background:var(--accent);color:#fff;' : '';
      html += '<div class="ss-item" data-idx="'+i+'" style="padding:8px 14px;cursor:pointer;font-size:13px;font-family:Cairo,sans-serif;'+bg+'" onmouseenter="this.style.background=this.dataset.idx=='+sel.selectedIndex+'?\'var(--accent)\':\'var(--surface3)\'" onmouseleave="this.style.background=this.dataset.idx=='+sel.selectedIndex+'?\'var(--accent)\':\'\'">'+txt+'</div>';
    }
    if(!html) html = '<div style="padding:10px 14px;color:var(--text2);font-size:12px;text-align:center">'+t('لا توجد نتائج')+'</div>';
    drop.innerHTML = html;
  }

  function show() { buildList(inp.value === (sel.options[sel.selectedIndex]?.text||'') ? '' : inp.value); drop.style.display = 'block'; }
  function hide() { setTimeout(function(){ drop.style.display = 'none'; }, 150); }

  inp.addEventListener('focus', function() { inp.select(); show(); });
  inp.addEventListener('input', function() { buildList(inp.value); drop.style.display = 'block'; });
  inp.addEventListener('blur', hide);
  inp.addEventListener('keydown', function(e) {
    if(e.key === 'Escape') { hide(); inp.blur(); }
  });

  drop.addEventListener('mousedown', function(e) {
    e.preventDefault();
    var item = e.target.closest('.ss-item');
    if(!item) return;
    var idx = parseInt(item.dataset.idx);
    sel.selectedIndex = idx;
    inp.value = sel.options[idx].text;
    drop.style.display = 'none';
    sel.dispatchEvent(new Event('change'));
  });

  sel.parentNode.insertBefore(wrap, sel);
  wrap.appendChild(inp);
  wrap.appendChild(drop);
  wrap.appendChild(sel);
}

function _makeAllSelectsSearchable(container) {
  var sels = (container||document).querySelectorAll('select:not([data-searchable]):not([data-no-search])');
  sels.forEach(function(s) { if(s.options.length > 3) _makeSearchable(s); });
}

// Auto-upgrade selects in modals/overlays when they appear
var _ssObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(m) {
    m.addedNodes.forEach(function(n) {
      if(n.nodeType!==1) return;
      if(n.classList && (n.classList.contains('modal-bg') || n.classList.contains('overlay') || n.classList.contains('side-panel') || n.id === 'projectFormFields')) {
        setTimeout(function(){ _makeAllSelectsSearchable(n); }, 80);
      }
      // Also check child modals
      var modals = n.querySelectorAll ? n.querySelectorAll('.modal-bg,.overlay,.side-panel') : [];
      modals.forEach(function(modal){ setTimeout(function(){ _makeAllSelectsSearchable(modal); }, 80); });
    });
  });
});
_ssObserver.observe(document.body, { childList:true, subtree:true });

// ═══════════════════════════════════════════════════════

function renderStats() {
  const { projects: _allP } = loadData();
  // Apply user-level filters
  const _su = typeof getCurrentUser==='function' ? getCurrentUser() : null;
  let projects = _allP;
  if(_su && !_su.isAdmin) {
    if(_su.filterCompany) projects = projects.filter(p => p.company === _su.filterCompany);
    if(_su.filterRegion)  projects = projects.filter(p => (p.region||'') === _su.filterRegion);
    if(_su.filterGallery) projects = projects.filter(p => (p.gallery||'') === _su.filterGallery);
  }
  const total = projects.length;
  const active = projects.filter(p => calcStatusFromStage(p.stage) === 'جاري').length;
  const tarkib = projects.filter(p => calcStatusFromStage(p.stage) === 'تركيب').length;
  const done = projects.filter(p => calcStatusFromStage(p.stage) === 'تم التسليم').length;
  document.getElementById('statsRow').innerHTML = `
    <div class="stat-card"><div class="stat-num" style="color:var(--accent)">${total}</div><div class="stat-label">${t('إجمالي المشاريع')}</div></div>
    <div class="stat-card"><div class="stat-num" style="color:var(--accent4)">${active}</div><div class="stat-label">${t('جاري التنفيذ')}</div></div>
    <div class="stat-card"><div class="stat-num" style="color:var(--accent2)">${tarkib}</div><div class="stat-label">${t('مرحلة التركيب')}</div></div>
    <div class="stat-card"><div class="stat-num" style="color:var(--accent3)">${done}</div><div class="stat-label">${t('تم التسليم')}</div></div>
  `;
}

// ===================== STATUS BADGE =====================
function statusBadge(s) {
  const map = {
    'جاري':'status-active',
    'تركيب':'status-new',
    'موقوف - انتظار سداد العميل':'status-paused',
    'تأخير من العميل':'status-paused',
    'تأخير من الشركة':'status-paused',
    'تم التسليم':'status-done',
    'ملغى':'status-paused',
    'توقيع العقد':'status-new',
    'موقوف':'status-paused'
  };
  const cls = map[s] || 'status-new';
  return `<span class="badge ${cls}">${s?t(s):'-'}</span>`;
}

// ===================== PROJECT CARD BUILDER =====================
function _buildProjectCard(p, i, isPending, total, allProjects) {
  const autoStatus = calcStatusFromStage(p.stage);
  const extVal     = parseFloat(p.extractValue)  || 0;
  const contrVal   = parseFloat(p.contractValue) || 0;
  const down       = parseFloat(p.downPayment)   || 0;
  const baseVal    = extVal > 0 ? extVal : contrVal;
  const remaining  = baseVal - down;
  const progress   = parseFloat(p.progress) || 0;
  const prodVal    = Math.round(baseVal * (progress / 100));
  const smartDel   = (typeof calcSmartDeliveryDate==='function') ? (calcSmartDeliveryDate(p)||'') : (p.deliveryDate||'');
  const remClr     = remaining < 0 ? '#ef4444' : '#22c55e';
  const pendingBadge = isPending ? `<div style="font-size:10px;color:#0891b2;background:rgba(8,145,178,0.1);padding:2px 8px;border-radius:10px;border:1px solid rgba(8,145,178,0.3)">${t('بانتظار المراجعة')}${p.addedBy?' • '+p.addedBy:''}</div>` : '';
  const approveBtn = isPending ? `<button class="btn btn-sm btn-success" onclick="event.stopPropagation();approveProject('${p.id}')" style="margin-left:6px">${t('تأكيد المشروع')}</button>` : '';

  return `<div class="project-card${isPending?' pc-pending':''}" onclick="openActionsPanel('${p.id}')">
    <div class="pc-header">
      <div class="pc-num">${allProjects ? (allProjects.length - allProjects.findIndex(x=>x.id===p.id)) : ((total||0) - i)}</div>
      <div class="pc-title-area">
        <div class="pc-name">${p.name||t('بدون اسم')}</div>
        <div class="pc-contract">${p.contractNo ? t('عقد')+': '+p.contractNo : ''} ${p.company ? '• '+p.company : ''}</div>
      </div>
      ${statusBadge(autoStatus)}
      ${pendingBadge}
    </div>
    <div class="pc-progress">
      <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
      <span class="pc-progress-txt">${progress}%</span>
    </div>
    <div class="pc-details" id="pcDetails_${p.id}" style="display:none">
      <div class="pc-grid">
        <div class="pc-item"><span class="pc-label">${t('المرحلة')}</span><span class="pc-val">${p.stage||'-'}</span></div>
        <div class="pc-item"><span class="pc-label">${t('المنطقة')}</span><span class="pc-val">${p.region||'-'}</span></div>
        <div class="pc-item"><span class="pc-label">${t('المعرض')}</span><span class="pc-val">${p.gallery||'-'}</span></div>
        <div class="pc-item"><span class="pc-label">${t('التسليم')}</span><span class="pc-val">${smartDel||t('لم يحدد')}</span></div>
        <div class="pc-item"><span class="pc-label">${t('قيمة العقد')}</span><span class="pc-val">${baseVal ? baseVal.toLocaleString('en-US')+' '+t('ر.س'):'-'}</span></div>
        <div class="pc-item"><span class="pc-label">${t('الدفعة المقدمة')}</span><span class="pc-val">${down ? down.toLocaleString('en-US')+' '+t('ر.س'):'-'}</span></div>
        <div class="pc-item"><span class="pc-label">${t('قيمة الإنتاج')}</span><span class="pc-val" style="color:var(--accent2)">${prodVal ? prodVal.toLocaleString('en-US')+' '+t('ر.س'):'-'}</span></div>
        <div class="pc-item"><span class="pc-label">${t('المتبقي')}</span><span class="pc-val" style="color:${remClr};font-weight:700">${remaining.toLocaleString('en-US')} ${t('ر.س')}</span></div>
      </div>
      <div class="pc-actions">
        ${approveBtn}
        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();openActionsPanel('${p.id}')">${t('الإجراءات')}</button>
      </div>
    </div>
    <button class="pc-expand" onclick="event.stopPropagation();toggleProjectCard('${p.id}',this)">
      <span class="pc-expand-icon">▼</span>
    </button>
  </div>`;
}

// ── Approve pending project (move from installations to main) ──
function approveProject(id) {
  if(!confirm(t('تأكيد المشروع ونقله للصفحة الرئيسية؟'))) return;
  const d = loadData();
  const p = d.projects.find(x => x.id === id);
  if(!p) return;
  delete p.pendingReview;
  p.approvedAt = new Date().toISOString();
  localStorage.setItem('pm_projects', JSON.stringify(d.projects));
  renderTable(); renderStats();
  notify(t('تم تأكيد المشروع ونقله للصفحة الرئيسية'));
}

// ===================== TABLE =====================
function renderTable() {
  const { projects, columns } = loadData();
  const search        = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const filterStatus  = document.getElementById('filterStatus')?.value  || '';
  const filterCompany = document.getElementById('filterCompany')?.value || '';

  // Filter columns by user permissions
  const cu = getCurrentUser();
  const userColPerms = (!cu || cu.isAdmin) ? null : new Set(cu.perms||[]);
  // Check if user has ANY column permissions assigned
  const hasAnyColPerm = userColPerms ? [...userColPerms].some(p => p.startsWith('col_')) : false;
  const visibleCols = columns.filter(c => {
    if(!c.show) return false;
    if(!userColPerms || !hasAnyColPerm) return true;
    const pk='col_'+(c.key||c.id);
    return userColPerms.has(pk);
  });

  // Update material stage button - projects in طلب الخامات or طلب الزجاج stage
  const matStages = ['طلب الخامات','طلب الزجاج','طلب المواد'];
  const matCount = projects.filter(p => matStages.includes(p.stage)).length;
  const matBtn = document.getElementById('matStageBtn');
  const matCnt = document.getElementById('matStageCnt');
  if(matBtn) {
    // Check user permissions before showing
    const _cu = typeof getCurrentUser==='function' ? getCurrentUser() : null;
    const _hasMatPerm = !_cu || _cu.isAdmin || ((_cu.perms||[]).indexOf('toolbar_materials') !== -1);
    matBtn.style.display = (matCount > 0 && _hasMatPerm) ? 'inline-flex' : 'none';
  }
  if(matCnt) matCnt.textContent = matCount;

  // Populate status filter using AUTO-statuses
  const statusSel = document.getElementById('filterStatus');
  if(statusSel) {
    const cur = statusSel.value;
    const statuses = [...new Set(projects.map(p => calcStatusFromStage(p.stage)).filter(Boolean))];
    statusSel.innerHTML = '<option value="">'+t('كل الحالات')+'</option>' + statuses.map(s => `<option value="${s}" ${s===cur?'selected':''}>${t(s)}</option>`).join('');
    statusSel.value = cur;
  }

  // Populate company filter
  const companySel = document.getElementById('filterCompany');
  if(companySel) {
    const cur = companySel.value;
    const cos = [...new Set(projects.map(p => p.company).filter(Boolean))];
    companySel.innerHTML = '<option value="">'+t('كل الشركات')+'</option>' + cos.map(c => `<option value="${c}" ${c===cur?'selected':''}>${c}</option>`).join('');
    companySel.value = cur;
  }

  // Apply user-level project filters (company/region/gallery)
  const _userFilter = cu && !cu.isAdmin ? cu : null;

  // Filter rows
  let filtered = projects.filter(p => {
    const autoStatus = calcStatusFromStage(p.stage);
    const txt = Object.values(p).join(' ').toLowerCase();
    if(search        && !txt.includes(search))             return false;
    if(filterStatus  && autoStatus !== filterStatus)       return false;
    if(filterCompany && p.company  !== filterCompany)      return false;
    if(_userFilter){
      if(_userFilter.filterCompany && p.company !== _userFilter.filterCompany) return false;
      if(_userFilter.filterRegion  && p.region  !== _userFilter.filterRegion)  return false;
      if(_userFilter.filterGallery && p.gallery !== _userFilter.filterGallery) return false;
    }
    return true;
  });

  document.getElementById('projectsHead').innerHTML = '';
  const body = document.getElementById('projectsBody');

  if(!filtered.length) { body.innerHTML = '<tr><td colspan="99" style="text-align:center;padding:40px;color:var(--text2)">'+t('لا توجد مشاريع')+'</td></tr>'; return; }

  body.innerHTML = '<tr><td colspan="99" style="padding:0"><div id="projectCardsGrid" class="project-cards-grid"></div></td></tr>';
  const grid = document.getElementById('projectCardsGrid');
  grid.innerHTML = filtered.map((p, i) => _buildProjectCard(p, i, false, projects.length, projects)).join('');

  // Re-apply user permissions after rendering to prevent overrides
  if(typeof applyUserPermissions==='function'){
    const _u=typeof getCurrentUser==='function'?getCurrentUser():null;
    if(_u && !_u.isAdmin) applyUserPermissions(_u);
  }
}

let selectedProjectId = null;
function selectRow(tr, id) {
  document.querySelectorAll('#projectsBody tr').forEach(r => r.classList.remove('selected'));
  tr.classList.add('selected');
  selectedProjectId = id;
}

function toggleProjectCard(id, btn) {
  const details = document.getElementById('pcDetails_' + id);
  if(!details) return;
  const isOpen = details.style.display !== 'none';
  // Close all others
  document.querySelectorAll('.pc-details').forEach(d => { d.style.display = 'none'; });
  document.querySelectorAll('.pc-expand-icon').forEach(i => { i.textContent = '▼'; i.style.transform = ''; });
  document.querySelectorAll('.project-card').forEach(c => c.classList.remove('pc-open'));
  if(!isOpen) {
    details.style.display = 'block';
    btn.querySelector('.pc-expand-icon').textContent = '▲';
    btn.closest('.project-card').classList.add('pc-open');
  }
}

// ===================== SIDE PANEL (8 ACTIONS) =====================
function openActionsPanel(id) {
  const { projects } = loadData();
  const p = projects.find(x => x.id === id);
  if(!p) return;
  selectedProjectId = id;
  document.getElementById('sidePanelClientName').textContent = p.name || t('العميل');
  
  const _allActions = [
    { label:'✏️ '+t('تعديل'), cls:'btn-primary', fn:`editProject('${id}')` },
    { label:'📅 '+t('المخطط الزمني'), cls:'btn-secondary', fn:`openTimeline('${id}')` },
    { label:'📊 '+t('تغيير المرحلة'), cls:'btn-secondary', fn:`changeStage('${id}')` },
    { label:'🖨️ '+t('مستخلص'), cls:'btn-warning', fn:`quickDoc('${id}','مستخلص')` },
    { label:'📋 '+t('استمارة تصنيع'), cls:'btn-secondary', fn:`openManufacturingForm('${id}')` },
    { label:'🛒 '+t('طلب شراء'), cls:'btn-secondary', style:'background:#8e44ad;color:#fff;border-color:#8e44ad', fn:`openPurchaseOrderDirect('${id}')` },
    { label:'📄 '+t('تقرير العميل'), cls:'btn-secondary', fn:`quickDoc('${id}','امر تشغيل')` },
    { label:'📁 '+t('ملفات المشروع'), cls:'btn-secondary', fn:`openProjectFiles('${id}')` },
    { label:'📐 '+t('المقاسات'), cls:'btn-secondary', fn:`openMeasurements('${id}')` },
    { label:'💰 '+t('عرض الأسعار'), cls:'btn-warning', fn:`openPriceList('${id}')` },
    { label:'📄 '+t('مؤشرات العميل'), cls:'btn-secondary', fn:`openClientReport('${id}')` },
    { label:'📋 '+t('أمر تسليم'), cls:'btn-secondary', style:'background:#0e7490;color:#fff;border-color:#0e7490', fn:`openDeliveryOrder('${id}')` },
    { label:'📑 '+t('طباعة ملف العميل'), cls:'btn-secondary', style:'background:#8e44ad;color:#fff;border-color:#8e44ad', fn:`printClientFile('${id}')` },
    { label:'🗑️ '+t('حذف'), cls:'btn-danger', fn:`deleteProject('${id}')` }
  ];
  const actions = filterActionsByPerms(_allActions);

  document.getElementById('sidePanelContent').innerHTML = `
    <div style="background:var(--surface2);border-radius:8px;padding:12px;margin-bottom:16px;font-size:12px">
      <div style="color:var(--text2)">${t('المشروع')}: <strong style="color:var(--text)">${p.projectName||'-'}</strong></div>
      <div style="color:var(--text2);margin-top:4px">${t('الشركة')}: <strong style="color:var(--accent)">${p.company||'-'}</strong></div>
      <div style="margin-top:8px">
        <div class="progress-bar"><div class="progress-fill" style="width:${p.progress||0}%"></div></div>
        <div style="text-align:center;font-size:12px;margin-top:4px;color:var(--accent2)">${p.progress||0}%</div>
      </div>
    </div>
    <div class="action-btn-grid">
      ${actions.map(a => `<button class="action-btn-item btn ${a.cls}" style="${a.style||''}" onclick="${a.fn};closeSidePanel()">${a.label}</button>`).join('')}
    </div>
    ${(function(){
      const _cu=typeof getCurrentUser==='function'?getCurrentUser():null;
      const _hasQS=!_cu||_cu.isAdmin||((_cu.perms||[]).indexOf('btn_quick_stage')!==-1);
      if(!_hasQS) return '';
      const {stages}=loadData();
      return '<div style="margin-top:16px"><div class="form-label">'+t('تغيير المرحلة سريعاً')+'</div><select onchange="quickChangeStage(\''+id+'\',this.value)" style="margin-top:6px">'+stages.map(s=>'<option '+(p.stage===s.name?'selected':'')+'>'+s.name+'</option>').join('')+'</select></div>';
    })()}
  `;
  
  document.getElementById('sidePanel').classList.add('open');
  document.getElementById('sidePanelOverlay').style.display = 'block';
}

function closeSidePanel() {
  document.getElementById('sidePanel').classList.remove('open');
  document.getElementById('sidePanelOverlay').style.display = 'none';
}

function quickChangeStatus(id, status) {
  const d = loadData();
  const p = d.projects.find(x => x.id === id);
  if(!p) return;
  p.status = status;
  p.statusManual = true; // mark as manually overridden
  localStorage.setItem('pm_projects', JSON.stringify(d.projects));
  renderTable(); renderStats();
}

function quickChangeStage(id, stageName) {
  const d = loadData();
  const p = d.projects.find(x => x.id === id);
  if(!p) return;
  p.stage = stageName;
  p.stageDate = new Date().toISOString().slice(0,10);
  p.progress = calculateProgressFromStage(stageName, d.stages);
  p.status = calcStatusFromStage(stageName);
  p.statusManual = false;
  localStorage.setItem('pm_projects', JSON.stringify(d.projects));
  renderTable(); renderStats();
  closeSidePanel();
  notify('✅ ' + t('تم تغيير المرحلة إلى') + ': ' + stageName);
  if(typeof logActivity==='function') logActivity(t('تغيير مرحلة'), p.name+' → '+stageName);
}

// ===================== PROJECT FORM =====================
function openNewProjectModal() {
  editingProjectId = null;
  document.getElementById('modalProjectTitle').textContent = '➕ ' + t('مشروع جديد');
  buildProjectForm({});
  document.getElementById('newProjectModal').style.display = 'flex';
}

function editProject(id) {
  const { projects } = loadData();
  const p = projects.find(x => x.id === id);
  if(!p) return;
  editingProjectId = id;
  document.getElementById('modalProjectTitle').textContent = '✏️ ' + t('تعديل المشروع');
  buildProjectForm(p);
  document.getElementById('newProjectModal').style.display = 'flex';
}

function buildProjectForm(p) {
  const { columns, companies, galleries, stages, regions } = loadData();
  let html = '';
  
  // حساب الرقم التسلسلي للمشروع الجديد
  const allProjects = loadData().projects || [];
  const autoSeq = editingProjectId
    ? (p.seq || '')
    : String(allProjects.length + 1);

  columns.forEach(col => {
    if(col.id === 'status' || col.id === 'remaining') return; // auto-calculated
    // حقول تلقائية — تظهر للقراءة فقط
    if(col.id === 'seq') {
      var _seqInp = `<input type="text" id="f_${col.id}" value="${autoSeq}" readonly style="background:var(--surface2);opacity:.8;cursor:not-allowed">`;
      html += `<div class="form-group"><div class="form-label">${col.label} <span style="font-size:10px;color:var(--text2)">(${t('تلقائي')})</span></div>${_seqInp}</div>`;
      return;
    }
    let input = '';
    if(col.id === 'company') {
      input = `<select id="f_${col.id}"><option value="">${t('اختر...')}</option>${companies.map(c=>`<option ${p[col.id]===c?'selected':''}>${c}</option>`).join('')}</select>`;
    } else if(col.id === 'region') {
      input = `<select id="f_${col.id}"><option value="">${t('اختر...')}</option>${regions.map(r=>`<option ${p[col.id]===r?'selected':''}>${r}</option>`).join('')}</select>`;
    } else if(col.id === 'gallery') {
      input = `<select id="f_${col.id}"><option value="">${t('اختر...')}</option>${galleries.map(g=>`<option ${p[col.id]===g?'selected':''}>${g}</option>`).join('')}</select>`;
    } else if(col.id === 'stage') {
      input = `<select id="f_${col.id}" onchange="autoProgress(this)"><option value="">${t('اختر المرحلة...')}</option>${stages.map(s=>`<option ${p[col.id]===s.name?'selected':''}>${s.name}</option>`).join('')}</select>`;
    } else if(col.id === 'progress') {
      input = `<input type="number" id="f_${col.id}" value="${p[col.id]||0}" min="0" max="100" readonly style="background:var(--surface2);opacity:.8;cursor:not-allowed">
        <div style="font-size:10px;color:var(--text2);margin-top:2px">⚡ ${t('يُحسب تلقائياً من المرحلة')}</div>`;
    } else if(col.id === 'extractValue') {
      input = `<input type="number" id="f_${col.id}" value="${p[col.id]||''}" readonly style="background:var(--surface2);opacity:.8;cursor:not-allowed">
        <div style="font-size:10px;color:var(--text2);margin-top:2px">⚡ ${t('يُحسب تلقائياً من المستخلص')}</div>`;
    } else if(col.type === 'date' || col.id === 'contractDate' || col.id === 'deliveryDate' || col.id === 'approvalDate' || col.id === 'siteReadyDate' || col.id === 'secondPaymentDate') {
      if(col.id === 'deliveryDate') {
        const autoVal = calcSmartDeliveryDate(p) || (p.deliveryDate||'');
        const pauseReasons = getDeliveryPauseReasons(p);
        const pauseHTML = pauseReasons.length > 0
          ? `<div style="font-size:10px;color:#dc2626;margin-top:3px;padding:4px 8px;background:rgba(220,38,38,0.08);border-radius:6px">⏸ ${t('شروط التوقف')}: ${pauseReasons.join(' | ')}</div>`
          : '<div style="font-size:10px;color:#16a34a;margin-top:3px">✅ '+t('جميع الشروط مستوفاة')+'</div>';
        input = `<input type="date" id="f_${col.id}" value="${autoVal}" readonly style="background:var(--surface2);opacity:.8;cursor:not-allowed">
          <div style="font-size:11px;color:var(--text2);margin-top:3px">⚡ ${t('يُحسب من الأبعد بين (تاريخ الاعتماد / جاهزية الموقع) + مدة العقد (بدون الجمعة والعطل الرسمية)')}</div>
          ${pauseHTML}`;
      } else if(col.id === 'approvalDate') {
        input = `<input type="date" id="f_${col.id}" value="${p[col.id]||''}" onchange="autoCalcDelivery()">`;
      } else if(col.id === 'siteReadyDate') {
        input = `<input type="date" id="f_${col.id}" value="${p[col.id]||''}" onchange="autoCalcDelivery()">`;
      } else if(col.id === 'secondPaymentDate') {
        input = `<input type="date" id="f_${col.id}" value="${p[col.id]||''}" onchange="autoCalcDelivery()">`;
      } else if(col.id === 'contractDate') {
        input = `<input type="date" id="f_${col.id}" value="${p[col.id]||''}">`;
      } else {
        input = `<input type="date" id="f_${col.id}" value="${p[col.id]||''}">`;
      }
    } else if(col.type === 'number') {
      if(col.id === 'contractDuration') {
        input = `<input type="number" id="f_${col.id}" value="${p[col.id]||''}" onchange="autoCalcDelivery()">`;
      } else {
        input = `<input type="number" id="f_${col.id}" value="${p[col.id]||''}">`;
      }
    } else if(col.id === 'notes') {
      input = `<textarea id="f_${col.id}" rows="2">${p[col.id]||''}</textarea>`;
    } else {
      input = `<input type="text" id="f_${col.id}" value="${(p[col.id]||'').toString().replace(/"/g,'&quot;')}">`;
    }
    html += `<div class="form-group"><div class="form-label">${col.label}${col.required?'<span style="color:var(--accent3)">*</span>':''}</div>${input}</div>`;
  });
  
  document.getElementById('projectFormFields').innerHTML = html;

  // ── تحويل القوائم المنسدلة إلى قوائم قابلة للبحث
  setTimeout(function(){ _makeAllSelectsSearchable(document.getElementById('projectFormFields')); }, 60);

  // ── تعبئة قوائم ألوان استمارة التصنيع
  try {
    ['aluminumColor','glassColor','accessoryType'].forEach(key => {
      const sel = document.getElementById('f_'+key); if(!sel)return;
      const opts = key==='aluminumColor'?fmGetAlumColors():key==='glassColor'?fmGetGlassColors():fmGetAccTypes();
      sel.innerHTML = '<option value="">— '+t('اختر')+' —</option>'+opts.map(c=>`<option value="${c}"${p[key]===c?' selected':''}>${c}</option>`).join('');
    });
    // Attach color swatch next to aluminum & glass color dropdowns
    if(typeof _attachSwatchToSelect === 'function') {
      setTimeout(function(){
        _attachSwatchToSelect('f_aluminumColor');
        if(typeof _attachGlassSwatchToSelect === 'function') _attachGlassSwatchToSelect('f_glassColor');
      }, 50);
    }
  } catch(e) {}
}

function autoCalcDelivery() {
  const approvalEl   = document.getElementById('f_approvalDate');
  const siteReadyEl  = document.getElementById('f_siteReadyDate');
  const durEl        = document.getElementById('f_contractDuration');
  const delEl        = document.getElementById('f_deliveryDate');
  if(!durEl || !delEl) return;

  // Build a temporary project object for smart calc
  const tmpProject = {
    approvalDate:      approvalEl?.value || '',
    siteReadyDate:     siteReadyEl?.value || '',
    secondPaymentDate: document.getElementById('f_secondPaymentDate')?.value || '',
    contractDuration:  durEl.value
  };
  const result = calcSmartDeliveryDate(tmpProject);
  if(result) delEl.value = result;
}

function autoProgress(sel) {
  const { stages } = loadData();
  const stage = stages.find(s => s.name === sel.value);
  const progress = calculateProgressFromStage(sel.value, stages);
  const pInput = document.getElementById('f_progress');
  if(pInput) pInput.value = progress;
}

function calculateProgressFromStage(stageName, stages) {
  if(!stageName) return 0;
  let total = 0;
  for(const s of stages) {
    total += (s.pct || 0);
    if(s.name === stageName) break;
  }
  return Math.min(100, total);
}

async function saveProject() {
  const { columns } = loadData();
  const d = loadData();
  
  // Start with existing project data to preserve extra fields (productionLog, etc.)
  const existing = d.projects.find(x => x.id === editingProjectId) || {};
  const p = { ...existing, id: editingProjectId || Date.now().toString() };
  let valid = true;
  
  columns.forEach(col => {
    if(col.id === 'status' || col.id === 'remaining' || col.id === 'productionValue' || col.id === 'seq' || col.id === 'extractValue') return;
    const el = document.getElementById('f_'+col.id);
    if(el) {
      p[col.id] = el.value;
      if(col.required && !el.value) { el.style.borderColor='var(--accent3)'; valid=false; }
    }
  });
  
  if(!valid) { notify('⚠️ '+t('يرجى ملء الحقول الإلزامية'),'error'); return; }

  // ── حفظ حقول استمارة التصنيع
  try {
    ['aluminumColor','glassColor','accessoryType'].forEach(key=>{
      const el=document.getElementById('f_'+key);
      if(el) p[key]=el.value;
    });
  } catch(e) {}
  
  // Auto-set status from stage
  p.status = calcStatusFromStage(p.stage);
  p.statusManual = false;
  // Auto-calculate progress from stage
  const _stg = loadData().stages || [];
  p.progress = calculateProgressFromStage(p.stage, _stg);
  // Auto-calculate delivery date
  const _autoDel = (typeof calcSmartDeliveryDate==='function') ? calcSmartDeliveryDate(p) : '';
  if(_autoDel) p.deliveryDate = _autoDel;
  
  if(editingProjectId) {
    const idx = d.projects.findIndex(x => x.id === editingProjectId);
    if(idx > -1) d.projects[idx] = p;
  } else {
    p.seq = String(d.projects.length + 1);
    d.projects.unshift(p);
  }

  // ⚡ أولاً: حفظ على السيرفر وانتظر النتيجة
  window._savingProject = true; // منع التحديث التلقائي أثناء الحفظ
  try {
    var _saveR = await fetch('/api/merge-project', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({project: p, action: 'upsert'})
    });
    var _saveJ = await _saveR.json();
    if(!_saveJ.ok) { notify('❌ فشل الحفظ على السيرفر','error'); window._savingProject=false; return; }
  } catch(e) { notify('❌ خطأ بالاتصال — المشروع لم يُحفظ','error'); window._savingProject=false; return; }

  // ثانياً: جلب البيانات المحدّثة من السيرفر
  try {
    var _fr = await fetch('/api/data/pm_projects');
    var _fj = await _fr.json();
    if(_fj.ok && _fj.value) {
      d.projects = _fj.value;
      if(window._serverDataCache) window._serverDataCache.projects = d.projects;
      _os.call(localStorage, 'pm_projects', JSON.stringify(d.projects));
      if(typeof _cache!=='undefined') _cache['pm_projects'] = JSON.stringify(d.projects);
    }
  } catch(e) {}
  // تحديث رقم الإصدار حتى ما يرجع التحديث التلقائي يكتب فوق
  try { var _vr = await fetch('/api/version'); var _vj = await _vr.json(); _lastVersion = _vj.v; } catch(e) {}
  window._savingProject = false;

  closeNewProjectModal();
  renderTable(); renderStats();
  notify('✅ ' + t('تم حفظ المشروع'));
  if(typeof logActivity==='function') logActivity(editingProjectId?t('تعديل مشروع'):t('إضافة مشروع'), p.name);
  // Auto-create client folder for new projects
  if(!editingProjectId && p.name) {
    fetch('/api/client-folder', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({name:p.name, contractNo:p.contractNo||'', company:p.company||'', region:p.region||'', gallery:p.gallery||''})
    }).catch(function(){});
  }
}

function closeNewProjectModal() {
  document.getElementById('newProjectModal').style.display = 'none';
  editingProjectId = null;
}

async function deleteProject(id) {
  const d = loadData();
  const p = d.projects.find(x => x.id === id);
  if(!p) return;
  if(!confirm(t('هل تريد حذف مشروع')+ ' "'+p.name+'"؟')) return;

  d.projects = d.projects.filter(x => x.id !== id);
  // Delete related data
  localStorage.removeItem('pm_meas_'+id);
  localStorage.removeItem('pm_pl_'+id);
  localStorage.removeItem('pm_files_'+id);
  // حذف المشروع من السيرفر أولاً وانتظر
  window._savingProject = true;
  try {
    await fetch('/api/merge-project', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({project:{id:id}, action:'delete'})});
    // جلب البيانات المحدّثة من السيرفر
    var _dr = await fetch('/api/data/pm_projects'); var _dj = await _dr.json();
    if(_dj.ok && _dj.value) {
      d.projects = _dj.value;
      if(window._serverDataCache) window._serverDataCache.projects = d.projects;
      _os.call(localStorage, 'pm_projects', JSON.stringify(d.projects));
      if(typeof _cache!=='undefined') _cache['pm_projects'] = JSON.stringify(d.projects);
    }
    try { var _vr = await fetch('/api/version'); var _vj = await _vr.json(); _lastVersion = _vj.v; } catch(e) {}
  } catch(e) {}
  window._savingProject = false;
  renderTable(); renderStats();
  closeSidePanel();
  notify('🗑️ ' + t('تم حذف المشروع'));
  if(typeof logActivity==='function') logActivity(t('حذف مشروع'), p.name);

  // Ask to delete client folder
  if(p.name) {
    setTimeout(function(){
      if(confirm(t('هل تريد حذف مجلد وملفات العميل')+ ' "'+p.name+'" '+t('من الجهاز؟')+'\n\n⚠️ '+t('سيتم حذف جميع الملفات والصور نهائياً'))) {
        var q = new URLSearchParams({name:p.name, contractNo:p.contractNo||'', company:p.company||'', region:p.region||'', gallery:p.gallery||''});
        fetch('/api/client-folder-check?'+q).then(function(r){return r.json();}).then(function(j){
          if(j.ok && j.exists && j.path) {
            fetch('/api/delete-folder', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({folderPath:j.path})})
              .then(function(r){return r.json();}).then(function(dj){
                if(dj.ok) notify('🗑️ ' + t('تم حذف مجلد العميل'));
                else notify('⚠️ '+dj.error,'error');
              }).catch(function(){ notify('⚠️ ' + t('فشل حذف المجلد'),'error'); });
          }
        }).catch(function(){});
      }
    }, 500);
  }
}

// ===================== إعادة ترقيم التسلسل =====================
function resequenceProjects() {
  const d = loadData();
  if(!d.projects.length) { notify(t('لا توجد مشاريع'),'error'); return; }
  d.projects.forEach(function(p, i) { p.seq = String(d.projects.length - i); });
  localStorage.setItem('pm_projects', JSON.stringify(d.projects));
  try { _syncToServer(d); } catch(e) {}
  renderTable(); renderStats();
  notify(t('تم إعادة ترقيم') + ' ' + d.projects.length + ' ' + t('مشروع'));
}

// ===================== تصحيح عمود (مسح قيم عمود محدد) =====================
function fixColumnData(colId, newValue) {
  const d = loadData();
  if(!d.projects.length) return;
  var count = 0;
  d.projects.forEach(function(p) {
    if(typeof newValue === 'function') { p[colId] = newValue(p, count); }
    else { p[colId] = newValue; }
    count++;
  });
  localStorage.setItem('pm_projects', JSON.stringify(d.projects));
  try { _syncToServer(d); } catch(e) {}
  renderTable(); renderStats();
  notify(t('تم تصحيح عمود') + ': ' + colId);
}

// ===================== THEME TOGGLE =====================
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  localStorage.setItem('pm_theme', isLight ? 'light' : 'dark');
  document.getElementById('themeToggleBtn').textContent = isLight ? '☀️' : '🌙';
  // Update PWA theme color
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta) meta.content = isLight ? '#f1f5f9' : '#0a0d14';
}

// ===================== PROJECT FILES =====================
function openProjectFiles(id) {
  const { projects } = loadData();
  const p = projects.find(x => x.id === id);
  if(!p) return;
  const filesKey = 'pm_files_'+id;
  const storedFiles = JSON.parse(localStorage.getItem(filesKey) || '[]');
  const modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.id = 'projectFilesModal';
  modal.innerHTML = `
    <div class="modal" style="max-width:700px">
      <div class="modal-header">
        <div class="modal-title">📁 ${t('ملفات المشروع')} — ${p.name}</div>
        <button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest('.modal-bg').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div style="background:var(--surface2);border-radius:8px;padding:12px;margin-bottom:16px">
          <div style="font-size:12px;color:var(--text2);margin-bottom:8px">📂 ${t('مجلد العميل على الجهاز')}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <button class="btn btn-primary btn-sm" onclick="createClientFolder('${p.id}')">📁 ${t('إنشاء المجلد')}</button>
            <button class="btn btn-secondary btn-sm" onclick="openClientFolder('${p.id}')">🗂️ ${t('فتح المجلد')}</button>
            <button class="btn btn-secondary btn-sm" onclick="fetchClientFiles('${p.id}')" style="background:rgba(16,185,129,.12);border-color:rgba(16,185,129,.3);color:#10b981">📥 ${t('جلب الملفات من المجلد')}</button>
            <span id="folderStatus_${p.id}" style="font-size:11px;color:var(--text2)">⏳ ${t('جارٍ التحقق...')}</span>
          </div>
          <div style="font-size:10px;color:var(--text2);margin-top:6px">
            ${t('المسار')}: ${t('ملفات العملاء')} / ${p.company||t('بدون')} / ${p.region||t('بدون')} / ${p.gallery||t('بدون')} / ${p.name}${p.contractNo?' - '+p.contractNo:''}
          </div>
        </div>
        <div style="border:2px dashed var(--border);border-radius:8px;padding:20px;text-align:center;margin-bottom:16px;cursor:pointer"
             onclick="document.getElementById('fileUpload_${id}').click()"
             ondragover="event.preventDefault();this.style.borderColor='var(--accent)'"
             ondragleave="this.style.borderColor='var(--border)'"
             ondrop="event.preventDefault();this.style.borderColor='var(--border)';handleFilesDrop(event,'${id}')">
          <div style="font-size:32px;margin-bottom:8px">📂</div>
          <div style="font-weight:600;color:var(--accent)">${t('اسحب الملفات هنا أو انقر للاختيار')}</div>
          <div style="font-size:11px;color:var(--text2);margin-top:4px">${t('صور، PDF، Excel وغيرها')}</div>
        </div>
        <input type="file" id="fileUpload_${id}" multiple accept="image/*,.pdf,.xlsx,.xls,.doc,.docx"
               style="display:none" onchange="handleFilesUpload(this,'${id}')">
        <div id="filesList_${id}">${renderFilesList(storedFiles, id)}</div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  setTimeout(()=>checkClientFolderStatus(id, p), 300);
}

async function createClientFolder(id){
  const {projects}=loadData(); const p=projects.find(x=>x.id===id); if(!p) return;
  const st=document.getElementById('folderStatus_'+id);
  if(st) st.textContent='⏳ '+t('جارٍ الإنشاء...');
  try{
    const r=await fetch('/api/client-folder',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name:p.name,contractNo:p.contractNo,company:p.company,region:p.region,gallery:p.gallery})});
    const j=await r.json();
    if(j.ok){
      if(st) st.innerHTML='<span style="color:#16a34a">✅ '+j.display+'</span>';
      notify('✅ ' + t('تم إنشاء المجلد'));
      await fetch('/api/open-folder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({folderPath:j.path})});
    } else { if(st) st.textContent='❌ '+j.error; }
  }catch(e){ if(st) st.textContent='⚠️ '+t('السيرفر غير متاح'); }
}

async function openClientFolder(id){
  const {projects}=loadData(); const p=projects.find(x=>x.id===id); if(!p) return;
  const st=document.getElementById('folderStatus_'+id);
  try{
    const q=new URLSearchParams({name:p.name,contractNo:p.contractNo||'',company:p.company||'',region:p.region||'',gallery:p.gallery||''});
    const r=await fetch('/api/client-folder-check?'+q); const j=await r.json();
    if(j.exists){
      await fetch('/api/open-folder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({folderPath:j.path})});
      if(st) st.innerHTML='<span style="color:#16a34a">✅ '+t('تم الفتح')+'</span>';
    } else { if(st) st.innerHTML='<span style="color:#d97706">⚠️ '+t('المجلد غير موجود — اضغط "إنشاء المجلد" أولاً')+'</span>'; }
  }catch(e){ if(st) st.textContent='⚠️ '+t('السيرفر غير متاح'); }
}

async function checkClientFolderStatus(id, p){
  const st=document.getElementById('folderStatus_'+id); if(!st) return;
  try{
    const q=new URLSearchParams({name:p.name,contractNo:p.contractNo||'',company:p.company||'',region:p.region||'',gallery:p.gallery||''});
    const r=await fetch('/api/client-folder-check?'+q); const j=await r.json();
    st.innerHTML=j.exists?'<span style="color:#16a34a">✅ '+t('المجلد موجود')+': '+j.display+'</span>':'<span style="color:var(--text2)">📂 '+t('المجلد غير موجود بعد')+'</span>';
  }catch(e){ st.textContent=''; }
}

async function fetchClientFiles(id){
  const {projects}=loadData(); const p=projects.find(x=>x.id===id); if(!p) return;
  const st=document.getElementById('folderStatus_'+id);
  if(st) st.textContent='⏳ '+t('جارٍ جلب الملفات من المجلد...');
  try{
    const q=new URLSearchParams({name:p.name,contractNo:p.contractNo||'',company:p.company||'',region:p.region||'',gallery:p.gallery||''});
    const r=await fetch('/api/client-files?'+q); const j=await r.json();
    if(j.ok && j.files && j.files.length){
      const key='pm_files_'+id;
      const stored=JSON.parse(localStorage.getItem(key)||'[]');
      let added=0;
      j.files.forEach(function(f){
        // تجنب التكرار
        if(!stored.some(function(s){ return s.filePath===f.filePath || s.name===f.name; })){
          stored.push({name:f.name, filePath:f.filePath, type:f.type, size:f.size,
            date:f.date||new Date().toLocaleDateString('ar-SA'), onServer:true});
          added++;
        }
      });
      localStorage.setItem(key, JSON.stringify(stored));
      var el=document.getElementById('filesList_'+id);
      if(el) el.innerHTML=renderFilesList(stored, id);
      if(st) st.innerHTML='<span style="color:#16a34a">✅ '+t('تم جلب')+' '+added+' '+t('ملف جديد')+' ('+j.files.length+' '+t('إجمالي')+')</span>';
      notify('✅ '+t('تم جلب')+' '+added+' '+t('ملف جديد'));
    } else {
      if(st) st.innerHTML='<span style="color:#d97706">⚠️ '+t('المجلد فارغ أو غير موجود')+'</span>';
      notify(t('المجلد فارغ أو غير موجود'),'warning');
    }
  }catch(e){
    if(st) st.textContent='⚠️ '+t('تعذر جلب الملفات');
    notify('⚠️ '+t('تعذر الاتصال بالسيرفر'),'error');
  }
}

// ══ FILE MANAGEMENT FUNCTIONS ══════════════════════════════

function renderFilesList(files, id){
  if(!files||!files.length) return '<div style="text-align:center;padding:20px;color:var(--text2);font-size:13px">📫 '+t('لا توجد ملفات')+'</div>';
  return files.map(function(f,idx){
    var isImg=f.type&&f.type.startsWith('image/');
    var isPDF=f.type==='application/pdf'||(f.name&&f.name.toLowerCase().endsWith('.pdf'));
    var icon=isImg?'🖼️':f.name&&f.name.endsWith('.pdf')?'📄':'📎';
    var html='<div style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:6px;background:var(--surface2);margin-bottom:6px">';
    html+='<span style="font-size:20px">'+icon+'</span>';
    html+='<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600">'+(f.name||t('ملف'))+'</div>';
    html+='<div style="font-size:10px;color:var(--text2)">'+(f.date||'')+'</div></div>';
    var canPrev=(isImg||isPDF)&&(f.data||f.onServer);
    if(canPrev) html+='<button class="btn btn-sm btn-secondary" onclick="previewFile('+idx+',\''+id+'\')">&#x1F441;&#xFE0F;</button>';
    if(f.data||f.onServer) html+='<button class="btn btn-sm btn-secondary" onclick="downloadFile('+idx+',\''+id+'\')">&#x2B07;&#xFE0F;</button>';
    html+='<button class="btn btn-sm btn-danger" onclick="removeFile('+idx+',\''+id+'\')">&#x1F5D1;&#xFE0F;</button>';
    html+='</div>';
    return html;
  }).join('');
}

function handleFilesUpload(input, id){
  var files = Array.from(input.files||[]);
  if(!files.length) return;
  var proj = loadData().projects.find(function(x){return x.id===id;});
  if(!proj){ notify('⚠️ ' + t('مشروع غير موجود'),'error'); return; }
  notify('⏳ ' + t('جارٍ رفع الملفات...'));
  var fd = new FormData();
  files.forEach(function(f){ fd.append('files', f); });
  // project info sent as query params
  var qs = '?name='+encodeURIComponent(proj.name||'')
    +'&contractNo='+encodeURIComponent(proj.contractNo||'')
    +'&company='+encodeURIComponent(proj.company||'')
    +'&region='+encodeURIComponent(proj.region||'')
    +'&gallery='+encodeURIComponent(proj.gallery||'');
  fetch('/api/upload-file'+qs,{method:'POST',body:fd})
    .then(function(r){return r.json();})
    .then(function(j){
      if(j.ok){
        var key = 'pm_files_'+id;
        var stored = JSON.parse(localStorage.getItem(key)||'[]');
        j.files.forEach(function(f){
          stored.push({name:f.name,savedAs:f.savedAs,filePath:f.path,type:f.type,size:f.size,
            date:new Date().toLocaleDateString('ar-SA'),onServer:true});
        });
        localStorage.setItem(key, JSON.stringify(stored));
        var el=document.getElementById('filesList_'+id);
        if(el) el.innerHTML=renderFilesList(stored,id);
        notify('✅ ' + t('تم رفع') + ' ' + j.files.length + ' ' + t('ملف إلى مجلد العميل'));
      } else { _saveBase64(files,id); }
    })
    .catch(function(){ _saveBase64(files,id); });
}

function _saveBase64(files,id){
  var key='pm_files_'+id;
  var stored=JSON.parse(localStorage.getItem(key)||'[]');
  var done=0;
  files.forEach(function(file){
    var r=new FileReader();
    r.onload=function(e){
      stored.push({name:file.name,type:file.type,size:file.size,
        date:new Date().toLocaleDateString('ar-SA'),
        data:file.size<5*1024*1024?e.target.result:null,onServer:false});
      done++;
      if(done===files.length){
        localStorage.setItem(key,JSON.stringify(stored));
        var el=document.getElementById('filesList_'+id);
        if(el) el.innerHTML=renderFilesList(stored,id);
        notify('✅ ' + t('تم حفظ') + ' ' + files.length + ' ' + t('ملف'));
      }
    };
    r.readAsDataURL(file);
  });
}

function removeFile(idx, id){
  if(!confirm(t('حذف هذا الملف؟'))) return;
  var key='pm_files_'+id;
  var stored=JSON.parse(localStorage.getItem(key)||'[]');
  var f=stored[idx];
  if(f&&f.onServer&&f.filePath){
    fetch('/api/file',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:f.filePath})}).catch(function(){});
  }
  stored.splice(idx,1);
  localStorage.setItem(key,JSON.stringify(stored));
  var el=document.getElementById('filesList_'+id);
  if(el) el.innerHTML=renderFilesList(stored,id);
  notify('🗑️ ' + t('تم حذف الملف'));
}

function downloadFile(idx, id){
  var stored=JSON.parse(localStorage.getItem('pm_files_'+id)||'[]');
  var f=stored[idx]; if(!f) return;
  var a=document.createElement('a');
  if(f.data){ a.href=f.data; }
  else if(f.onServer&&f.filePath){ a.href='/api/file?path='+encodeURIComponent(f.filePath); }
  else return;
  a.download=f.name||'file';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function previewFile(idx, id){
  var stored = JSON.parse(localStorage.getItem('pm_files_'+id)||'[]');
  var f = stored[idx]; if(!f) return;
  var isPDF = f.type==='application/pdf'||(f.name&&f.name.toLowerCase().endsWith('.pdf'));
  var isImg = f.type&&f.type.startsWith('image/');
  if(!isPDF&&!isImg){ notify('⚠️ ' + t('المعاينة للصور وPDF فقط')); return; }
  var src = f.data ? f.data : (f.onServer&&f.filePath ? '/api/file?path='+encodeURIComponent(f.filePath) : null);
  if(!src){ notify('⚠️ ' + t('الملف غير متاح')); return; }

  var old = document.getElementById('_fileViewer');
  if(old) old.remove();

  var rot = 0;
  var m = document.createElement('div');
  m.id = '_fileViewer';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:99999;display:flex;flex-direction:column';

  // toolbar
  var tb = document.createElement('div');
  tb.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 16px;background:rgba(0,0,0,.8);flex-shrink:0';
  tb.innerHTML = '<span style="color:#fff;font-size:13px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(f.name||'ملف')+'</span>';

  if(isImg){
    var btnL = document.createElement('button');
    btnL.textContent = '↺ ' + t('يسار');
    btnL.style.cssText = 'background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fff;border-radius:8px;padding:6px 14px;cursor:pointer;font-family:Cairo,sans-serif';
    btnL.onclick = function(){ rot=(rot-90+360)%360; img.style.transform='rotate('+rot+'deg)'; };

    var btnR = document.createElement('button');
    btnR.textContent = '↻ ' + t('يمين');
    btnR.style.cssText = btnL.style.cssText;
    btnR.onclick = function(){ rot=(rot+90)%360; img.style.transform='rotate('+rot+'deg)'; };

    tb.insertBefore(btnR, tb.firstChild);
    tb.insertBefore(btnL, tb.firstChild);
  }

  var btnX = document.createElement('button');
  btnX.textContent = '✕ ' + t('إغلاق');
  btnX.style.cssText = 'background:rgba(220,38,38,.6);border:none;color:#fff;border-radius:8px;padding:6px 14px;cursor:pointer;font-family:Cairo,sans-serif';
  btnX.onclick = function(){ m.remove(); };
  tb.appendChild(btnX);
  m.appendChild(tb);

  // content
  var body = document.createElement('div');
  body.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;overflow:auto;padding:16px';

  if(isPDF){
    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.style.cssText = 'width:95vw;height:90vh;border:none;border-radius:4px';
    body.appendChild(iframe);
  } else {
    var img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'max-width:90vw;max-height:85vh;object-fit:contain;transition:transform .3s;border-radius:4px';
    body.appendChild(img);
  }

  m.appendChild(body);
  m.onclick = function(e){ if(e.target===m||e.target===body) m.remove(); };
  document.body.appendChild(m);
}
function previewImage(dataUrl){ previewFile(0,''); }

function handleFilesDrop(event, id) {
  const input = { files: event.dataTransfer.files };
  handleFilesUpload(input, id);
}

function removeProjectFile(id, index) {
  const filesKey = `pm_files_${id}`;
  const stored = JSON.parse(localStorage.getItem(filesKey) || '[]');
  stored.splice(index, 1);
  localStorage.setItem(filesKey, JSON.stringify(stored));
  const listEl = document.getElementById(`filesList_${id}`);
  if(listEl) listEl.innerHTML = renderFilesList(stored, id);
  notify('🗑️ ' + t('تم حذف الملف'));
}

function viewImage(src, name) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer';
  overlay.innerHTML = `<div style="position:relative;max-width:90vw;max-height:90vh">
    <img src="${src}" style="max-width:100%;max-height:90vh;border-radius:8px" alt="${name}">
    <div style="position:absolute;top:-30px;right:0;color:#fff;font-size:12px">${name}</div>
    <button style="position:absolute;top:-35px;left:0;background:none;border:none;color:#fff;font-size:20px;cursor:pointer" onclick="this.closest('[style]').parentElement.remove()">✕</button>
  </div>`;
  overlay.onclick = e => { if(e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}
function changeStage(id) {
  const { projects, stages } = loadData();
  const p = projects.find(x => x.id === id);
  if(!p) return;
  
  const opts = stages.map(s => `<option ${p.stage===s.name?'selected':''}>${s.name}</option>`).join('');
  const modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.innerHTML = `
    <div class="modal" style="max-width:400px">
      <div class="modal-header"><div class="modal-title">📋 ${t('تغيير المرحلة')} - ${p.name}</div><button class="btn btn-sm btn-secondary" onclick="this.closest('.modal-bg').remove()">✕</button></div>
      <div class="modal-body">
        <select id="stageChangeSelect" style="width:100%">${opts}</select>
        <div style="margin-top:16px;padding:12px;background:var(--surface2);border-radius:8px">
          <div style="color:var(--text2);font-size:13px">${t('النسبة المتوقعة')}: <strong id="stageChangePct" style="color:var(--accent)">0%</strong></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-bg').remove()">${t('إلغاء')}</button>
        <button class="btn btn-primary" onclick="applyStageChange('${id}',this)">✅ ${t('تطبيق')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const sel = modal.querySelector('#stageChangeSelect');
  const updatePct = () => {
    const { stages } = loadData();
    const pct = calculateProgressFromStage(sel.value, stages);
    modal.querySelector('#stageChangePct').textContent = pct+'%';
  };
  sel.onchange = updatePct;
  updatePct();
}

function applyStageChange(id, btn) {
  const modal = btn.closest('.modal-bg');
  const stageName = modal.querySelector('#stageChangeSelect').value;
  if(!stageName) { notify('⚠️ ' + t('اختر مرحلة أولاً'),'error'); return; }
  const d = loadData();
  const p = d.projects.find(x => x.id === id);
  if(p) {
    p.stage = stageName;
    p.stageDate = new Date().toISOString().slice(0,10);
    p.progress = calculateProgressFromStage(stageName, d.stages);
    p.status = calcStatusFromStage(stageName);
    p.statusManual = false;
    delete p['المناطق']; // cleanup old key if present
  }
  localStorage.setItem('pm_projects', JSON.stringify(d.projects));
  modal.remove();
  renderTable(); renderStats();
  notify('✅ ' + t('تم تحديث المرحلة والحالة'));
}

// ===================== TIMELINE =====================
function openTimeline(id) {
  const { projects, stages } = loadData();
  const p = projects.find(x => x.id === id);
  if(!p) return;
  
  document.getElementById('timelineModalTitle').textContent = `📅 ${t('المخطط الزمني')} - ${p.name}`;
  document.getElementById('timelineModalContent').innerHTML = buildTimelineHTML(p, stages);
  document.getElementById('timelineModal').style.display = 'flex';
}

function _prepTimelineForPrint(clone) {
  clone.querySelectorAll('script,canvas').forEach(n=>n.remove());
  clone.querySelectorAll('.tl-noprint').forEach(n=>n.remove());
  clone.querySelectorAll('.tl-printonly').forEach(n=>n.style.display='block');
  // Show print dates next to stage names
  clone.querySelectorAll('.tl-printdate').forEach(n=>n.style.display='inline');
  // Remove edit column entirely (inputs + dates under them)
  clone.querySelectorAll('.tl-editcol').forEach(n=>n.remove());
  Array.from(clone.children).forEach(ch=>{
    const st=ch.getAttribute('style')||'';
    if(st.includes('repeat(4')||st.includes('280px'))ch.remove();
  });
}

function _getPrintStyles(rowCount) {
  const fontSize=rowCount>28?'5.5px':rowCount>24?'6px':rowCount>20?'6.5px':'7px';
  const rowHeight=rowCount>28?'12px':rowCount>24?'13px':rowCount>20?'14px':'16px';
  const labelW=rowCount>24?'120px':'140px';
  return '<'+'style'+'>'
    +'@page{size:A4 landscape;margin:3mm}'
    +'*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}'
    +'body{font-family:Cairo,sans-serif;direction:rtl;color:#111;background:#fff;font-size:'+fontSize+';margin:0;padding:0}'
    +'.tl-row{display:flex;align-items:center;border-bottom:1px solid #e5e7eb;min-height:'+rowHeight+';page-break-inside:avoid}'
    +'.tl-label{width:'+labelW+';min-width:'+labelW+';padding:1px 3px;font-size:'+fontSize+';overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    +'.tl-bar-wrap{flex:1;position:relative;height:10px}'
    +'.tl-meta{width:42px;text-align:center;font-size:'+fontSize+';color:#555}'
    +'.tl-hdr{background:#1a3a6a!important;color:#fff!important;min-height:20px}'
    +'.tl-printonly{display:block!important}'
    +'.tl-editcol{display:none!important}'
    +'.tl-printdate{display:inline!important}'
    +'img{display:none}'
    +'<'+'/style>';
}

function printTimeline(){
  const src=document.getElementById('timelineModalContent');if(!src)return;
  const title=document.getElementById('timelineModalTitle')?.textContent||'';
  const clone=src.cloneNode(true);
  _prepTimelineForPrint(clone);
  const pa=document.getElementById('printArea');
  const rowCount=clone.querySelectorAll('.tl-row').length;
  pa.innerHTML=_getPrintStyles(rowCount)
    +'<div style="font-size:10px;font-weight:800;color:#1a3a6a;border-bottom:2px solid #1a3a6a;padding-bottom:2px;margin-bottom:3px">'+title+'</div>'
    +'<div>'+clone.innerHTML+'</div>';
  window.print();
  setTimeout(()=>pa.innerHTML='',2500);
}

function buildTimelineHTML(p, stages) {
  const dur = Math.max(30, parseInt(p.contractDuration)||90);
  const startDate = p.contractDate ? new Date(p.contractDate) : new Date();
  const fmtD = d => d.toLocaleDateString('ar-SA',{month:'short',day:'numeric'});
  const fmtFull = d => d.toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'});
  const pid = p.id||'x';
  // Check if current user is admin (only admin can edit timeline)
  const _tlUser = typeof getCurrentUser==='function' ? getCurrentUser() : null;
  const _tlIsAdmin = !_tlUser || _tlUser.isAdmin;

  // ── Holidays ──
  const holidays = _getHolidaysSet();
  const deliverySettings = _getDeliverySettings();
  let holidayNames = {};
  try { const raw = localStorage.getItem('pm_holiday_names'); if(raw) holidayNames = JSON.parse(raw); } catch(e) {}

  // ── Pause conditions ──
  const hasSiteReady = !!p.siteReadyDate;
  const hasApproval = !!p.approvalDate;
  const hasSecondPayment = !!p.secondPaymentDate;

  // ── Effective start ──
  const approvalD = _parseDate(p.approvalDate);
  const siteReadyD = _parseDate(p.siteReadyDate);
  let effectiveStart = null;
  if(approvalD && siteReadyD) effectiveStart = approvalD > siteReadyD ? approvalD : siteReadyD;
  else if(approvalD) effectiveStart = approvalD;
  else if(siteReadyD) effectiveStart = siteReadyD;
  const smartDelivery = calcSmartDeliveryDate(p);

  // ── Custom days per project (stored in project.timelineDays) ──
  const customDays = p.timelineDays || {};

  // ── Proportional schedule with custom override ──
  const d=dur;
  const SCHEDULE_DEF = [
    ['توقيع العقد',                      Math.max(1,Math.round(d*0.01)), 'pre',    false, '#7c3aed','📝'],
    ['امر تشغيل',                        Math.max(1,Math.round(d*0.01)), 'pre',    false, '#6d28d9','📋'],
    ['جاهزية الموقع',                    Math.max(2,Math.round(d*0.02)), 'pre',    false, '#64748b','🏗️'],
    ['رفع مقاسات',                       Math.max(3,Math.round(d*0.04)), 'pre',    false, '#0284c7','📐'],
    ['عمل مخططات',                       Math.max(5,Math.round(d*0.08)), 'pre',    false, '#0369a1','✏️'],
    ['اعتماد المخططات',                  Math.max(3,Math.round(d*0.03)), 'pre',    true,  '#d97706','✅'],
    ['اعداد استمارة (دراسة المشروع)',     Math.max(5,Math.round(d*0.07)), 'active', false, '#16a34a','📊'],
    ['طلب الخامات',                      Math.max(3,Math.round(d*0.04)), 'active', false, '#15803d','📦'],
    ['دهان الخامات',                     Math.max(8,Math.round(d*0.10)), 'active', false, '#166534','🎨'],
    ['البدء بالتصنيع',                   Math.max(8,Math.round(d*0.10)), 'active', false, '#1e7a4a','⚙️'],
    ['اصدار مستخلص',                     Math.max(2,Math.round(d*0.02)), 'active', false, '#b45309','💰'],
    ['سداد الدفعة الثانية',              Math.max(2,Math.round(d*0.02)), 'active', true,  '#dc2626','💳'],
    ['أمر تركيب',                        Math.max(1,Math.round(d*0.01)), 'active', false, '#991b1b','📋'],
    ['توريد اعمال الالمنيوم',            Math.max(10,Math.round(d*0.13)), 'active', false, '#1d4ed8','🔩'],
    ['بدأ التركيب',                      Math.max(4,Math.round(d*0.05)), 'active', false, '#1e40af','🔧'],
    ['طلب الزجاج',                       Math.max(2,Math.round(d*0.02)), 'active', false, '#065f46','🪟'],
    ['استلام الزجاج مع التوريد',         Math.max(4,Math.round(d*0.05)), 'active', false, '#047857','📬'],
    ['تركيب الزجاج',                     Math.max(4,Math.round(d*0.06)), 'active', false, '#059669','🪟'],
    ['تشطيب الموقع',                     Math.max(2,Math.round(d*0.02)), 'active', false, '#78350f','🧹'],
    ['اختبار الاعمال',                   Math.max(2,Math.round(d*0.02)), 'active', false, '#6b21a8','🔍'],
    ['تسليم الموقع',                     Math.max(1,Math.round(d*0.01)), 'active', false, '#4c1d95','🎉'],
  ];
  // ── Smart auto-calc from real dates ──
  // If siteReadyDate exists, calc actual days from contract to site ready
  const contractD = _parseDate(p.contractDate);
  const realSiteReadyDays = (contractD && siteReadyD) ? Math.max(1, Math.round((siteReadyD - contractD) / 864e5)) : 0;
  const realApprovalDays = (contractD && approvalD) ? Math.max(1, Math.round((approvalD - contractD) / 864e5)) : 0;
  // Distribute pre-contract days smartly if real dates exist
  const autoDays = {};
  if(realApprovalDays > 0 || realSiteReadyDays > 0) {
    // Total pre-contract days from schedule
    const preItems = SCHEDULE_DEF.filter(([,,ph])=>ph==='pre');
    const totalPreDef = preItems.reduce((s,[,dd])=>s+dd, 0);
    const maxRealPre = Math.max(realApprovalDays, realSiteReadyDays);
    if(maxRealPre > 0) {
      // Scale pre phases proportionally to fit real timeline
      const scale = maxRealPre / totalPreDef;
      let accumulated = 0;
      preItems.forEach(([name, dd]) => {
        if(name === 'جاهزية الموقع' && realSiteReadyDays > 0) {
          // Site ready: actual days from contract start to site ready date
          // But capped relative to position in schedule
          autoDays[name] = Math.max(1, Math.round(dd * scale));
        } else if(name === 'اعتماد المخططات' && realApprovalDays > 0) {
          // If approval comes after site ready, the remaining days go here
          const remaining = realApprovalDays - accumulated;
          autoDays[name] = Math.max(1, remaining > 0 ? remaining : Math.round(dd * scale));
        } else {
          autoDays[name] = Math.max(1, Math.round(dd * scale));
        }
        accumulated += autoDays[name];
      });
    }
  }

  // Apply: custom > auto-calculated > default
  const SCHEDULE = SCHEDULE_DEF.map(([name,defDays,phase,pause,color,icon]) => {
    let days;
    if(customDays[name] !== undefined && customDays[name] !== '') {
      days = Math.max(1, parseInt(customDays[name])||1);
    } else if(autoDays[name] !== undefined) {
      days = autoDays[name];
    } else {
      days = defDays;
    }
    return [name, days, phase, pause, color, icon];
  });

  // ── Build rows with holiday rows inserted ──
  let dayOffset=0, activeDayStart=null;
  const rows=[];
  SCHEDULE.forEach(([name,days,phase,pauseAfter,color,icon],idx)=>{
    const startDay=dayOffset, endDay=dayOffset+days;
    rows.push({name,days,startDay,endDay,phase,pauseAfter,color,icon,isTask:true,schedIdx:idx,
      startDate:new Date(startDate.getTime()+startDay*864e5),
      endDate:new Date(startDate.getTime()+endDay*864e5)});
    dayOffset=endDay;
    if(name==='اعتماد المخططات') activeDayStart=endDay;

    // Pause conditions with date comparison
    if(name==='اعتماد المخططات'){
      const conds = [
        {txt:'اعتماد المخططات', done:hasApproval, date:p.approvalDate},
        {txt:'جاهزية الموقع', done:hasSiteReady, date:p.siteReadyDate}
      ];
      // Show which came first
      let orderNote = '';
      if(hasApproval && hasSiteReady) {
        const aD = new Date(p.approvalDate), sD = new Date(p.siteReadyDate);
        if(aD < sD) {
          const diff = Math.round((sD - aD) / 864e5);
          orderNote = `<span style="color:#2563eb;font-size:10px;font-weight:600">📌 ${t('الاعتماد قبل الجاهزية بـ')} ${diff} ${t('يوم')} — ${t('العداد يبدأ من جاهزية الموقع')} (${p.siteReadyDate})</span>`;
        } else if(sD < aD) {
          const diff = Math.round((aD - sD) / 864e5);
          orderNote = `<span style="color:#d97706;font-size:10px;font-weight:600">📌 ${t('الجاهزية قبل الاعتماد بـ')} ${diff} ${t('يوم')} — ${t('العداد يبدأ من الاعتماد')} (${p.approvalDate})</span>`;
        } else {
          orderNote = `<span style="color:#16a34a;font-size:10px">📌 ${t('الاعتماد والجاهزية في نفس اليوم')}</span>`;
        }
      }
      const condHTML = conds.map(c=>`<span style="color:${c.done?'#16a34a':'#dc2626'};font-size:10px">${c.done?'✅':'❌'} ${c.txt}${c.done&&c.date?' ('+c.date+')':''}</span>`).join(' &nbsp; ');
      const fullHTML = condHTML + (orderNote ? ' &nbsp; ' + orderNote : '');
      rows.push({name:'⏸ شروط بدء المدة — '+fullHTML, isPause:true, startDay:endDay, endDay:endDay, days:0, color:'#dc2626', icon:'⏸',
        startDate:new Date(startDate.getTime()+endDay*864e5), endDate:new Date(startDate.getTime()+endDay*864e5)});
    }
    if(name==='سداد الدفعة الثانية'){
      const payDone = hasSecondPayment;
      const payHTML = `<span style="color:${payDone?'#16a34a':'#dc2626'};font-size:10px">${payDone?'✅':'❌'} سداد الدفعة الثانية${payDone&&p.secondPaymentDate?' ('+p.secondPaymentDate+')':''}</span>`;
      rows.push({name:'⏸ انتظار السداد — '+payHTML, isPause:true, startDay:endDay, endDay:endDay, days:0, color:'#dc2626', icon:'⏸',
        startDate:new Date(startDate.getTime()+endDay*864e5), endDate:new Date(startDate.getTime()+endDay*864e5)});
    }
  });
  const totalDays=dayOffset;

  // ── Find holiday periods within timeline ──
  const holidayRows = [];
  if(holidays.size > 0) {
    const sortedH = [...holidays].filter(h => {
      const off = Math.round((new Date(h) - startDate) / 864e5);
      return off >= 0 && off <= totalDays;
    }).sort();
    // Group consecutive holidays
    let grpStart = null, grpEnd = null, grpName = '';
    sortedH.forEach((h, i) => {
      const off = Math.round((new Date(h) - startDate) / 864e5);
      const hName = holidayNames[h] || t('عطلة رسمية');
      if(grpStart === null) { grpStart = off; grpEnd = off; grpName = hName; }
      else if(off - grpEnd <= 1 && hName === grpName) { grpEnd = off; }
      else { holidayRows.push({start:grpStart, end:grpEnd+1, name:grpName, days:grpEnd-grpStart+1}); grpStart=off; grpEnd=off; grpName=hName; }
    });
    if(grpStart !== null) holidayRows.push({start:grpStart, end:grpEnd+1, name:grpName, days:grpEnd-grpStart+1});
  }

  const currentStageIdx=stages.findIndex(s=>s.name===p.stage);
  const doneStages=new Set(stages.slice(0,currentStageIdx).map(s=>s.name));
  const today=new Date();
  const todayOff=Math.round((today-startDate)/864e5);

  // ── Compressed visual scale ──
  // Tasks > CAP get compressed: CAP + ln(excess+1)*3 — keeps long tasks ~30% max
  const CAP_DAYS = 15;
  function visualDays(realDays) {
    if(realDays <= CAP_DAYS) return realDays;
    return CAP_DAYS + Math.log(realDays - CAP_DAYS + 1) * 3;
  }
  // Build visual offsets for each row
  let vOffset = 0;
  const vMap = []; // {realStart, realEnd, vStart, vEnd} per SCHEDULE item
  SCHEDULE.forEach(([name, days]) => {
    const vDays = visualDays(days);
    vMap.push({ vStart: vOffset, vEnd: vOffset + vDays, realDays: days, vDays });
    vOffset += vDays;
  });
  const totalVDays = vOffset;
  // Map real day offset to visual percent
  function dayToV(realDay) {
    let acc = 0, vAcc = 0;
    for(let i = 0; i < SCHEDULE.length; i++) {
      const rd = SCHEDULE[i][1];
      const vd = vMap[i].vDays;
      if(realDay <= acc + rd) {
        const frac = (realDay - acc) / rd;
        return vAcc + frac * vd;
      }
      acc += rd; vAcc += vd;
    }
    return totalVDays;
  }
  const pct = dd => Math.min(100, Math.max(0, dayToV(dd) / totalVDays * 100)).toFixed(3);
  const pctW = r => Math.max(0.6, +pct(r.endDay) - +pct(r.startDay)).toFixed(3);
  const todayPct = Math.min(100, Math.max(0, dayToV(todayOff) / totalVDays * 100)).toFixed(3);

  const totalStages=SCHEDULE.length;
  const doneCount=SCHEDULE.filter(([name])=>doneStages.has(name)).length;
  const activeCount=SCHEDULE.filter(([name])=>name===p.stage).length;

  // Holiday overlays for bars (use compressed scale)
  const holidayOverlays = holidayRows.map(h =>
    `<div style="position:absolute;left:${pct(h.start)}%;width:${Math.max(0.3,+pct(h.end)-+pct(h.start)).toFixed(3)}%;height:100%;background:rgba(239,68,68,0.12);border-left:1px dashed #fca5a5;border-right:1px dashed #fca5a5;z-index:1;pointer-events:none" title="${h.name}"></div>`
  ).join('');

  // ── Hidden stages per project ──
  const hiddenStages = p.hiddenStages || [];
  const hiddenSet = new Set(hiddenStages);

  // Build Gantt rows HTML
  const rowsHTML=rows.map(row=>{
    if(row.isPause){
      return `<div class="tl-row" style="background:rgba(220,38,38,0.07);border-bottom:1px solid #fca5a5">
        <div class="tl-label" style="color:#dc2626;font-style:italic;font-size:11px;font-weight:600;display:flex;align-items:center;gap:5px;flex-wrap:wrap">
          <span>${row.name.replace('⏸ ','')}</span>
        </div>
        <div style="flex:1;position:relative;height:24px;padding:0 6px">
          <div style="position:absolute;left:${pct(row.startDay)}%;width:2px;height:100%;background:#dc2626;opacity:0.6"></div>
          <div style="position:absolute;left:0;right:0;top:50%;border-top:2px dashed #fca5a5;transform:translateY(-50%)"></div>
        </div>
        <div class="tl-meta" style="color:#dc2626;font-size:10px">${t('توقف')}</div>
      </div>`;
    }

    // Skip hidden stages
    const isHidden = hiddenSet.has(row.name);
    if(isHidden) return '';

    const isDone=doneStages.has(row.name);
    const isActive=row.name===p.stage;
    const rowBg=isActive?'rgba(59,130,246,0.12)':isDone?'rgba(22,163,74,0.06)':'';
    const barC=isDone?'#16a34a':isActive?row.color:'#cbd5e1';
    const icon=isDone?'✅':isActive?'🔵':'○';
    const isPrePhase=row.phase==='pre';
    const phaseTag=isPrePhase?`<span style="font-size:9px;padding:1px 5px;border-radius:8px;background:rgba(109,40,217,0.15);color:#7c3aed;margin-right:4px">${t('قبل العقد')}</span>`:'';
    const isCustom = customDays[row.name] !== undefined && customDays[row.name] !== '';
    const isLong = row.days > CAP_DAYS;
    const dateStr = fmtD(row.startDate);

    // For long tasks: compact marker + badge
    let barHTML;
    if(isLong) {
      const markerColor = isDone ? '#16a34a' : isActive ? row.color : '#94a3b8';
      barHTML = `
        ${holidayOverlays}
        <div style="position:absolute;left:${pct(row.startDay)}%;width:3px;height:18px;top:4px;background:${markerColor};border-radius:2px;z-index:2"></div>
        <div style="position:absolute;left:calc(${pct(row.startDay)}% + 6px);top:3px;z-index:3;
             background:${markerColor};color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;white-space:nowrap;
             box-shadow:${isActive?'0 0 6px rgba(59,130,246,0.4)':'none'}">
          ${row.days} ${t('يوم')}
        </div>
        <div style="position:absolute;left:calc(${pct(row.startDay)}% + 6px);top:50%;width:calc(${pctW(row)}% - 6px);border-top:2px dashed ${markerColor};opacity:0.3;transform:translateY(-50%);z-index:1"></div>`;
    } else {
      barHTML = `
        ${holidayOverlays}
        <div class="gantt-bar" style="position:absolute;left:${pct(row.startDay)}%;width:${pctW(row)}%;height:16px;top:5px;
             background:${barC};border-radius:4px;z-index:2;
             box-shadow:${isActive?'0 0 8px rgba(59,130,246,0.5)':'none'};
             transition:all .3s;display:flex;align-items:center;justify-content:center;overflow:hidden">
          ${+pctW(row)>3?`<span style="font-size:9px;color:#fff;font-weight:700;white-space:nowrap;padding:0 3px">${row.days}ي</span>`:''}
        </div>
        ${isActive?`<div style="position:absolute;left:${pct(row.startDay)}%;width:${pctW(row)}%;height:16px;top:5px;border-radius:4px;border:2px solid ${row.color};pointer-events:none;z-index:3"></div>`:''}`;
    }

    return `<div class="tl-row" style="${rowBg};border-bottom:1px solid var(--border)">
      <div class="tl-label" style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:${isActive?700:400};color:${isActive?'var(--accent)':isDone?'var(--text2)':'var(--text2)'}">
        <span style="font-size:10px;min-width:14px">${icon}</span>
        <span style="display:flex;align-items:center;gap:3px;flex-wrap:wrap">${phaseTag}${row.name}</span>
        <span class="tl-printdate" style="display:none;font-size:8px;color:#888;margin-right:3px">(${dateStr})</span>
      </div>
      <div style="flex:1;position:relative;height:26px;padding:0 6px">
        ${barHTML}
      </div>
      <div class="tl-meta tl-editcol" style="font-size:10px;color:${isActive?row.color:isDone?'#16a34a':'var(--text2)'}">
        ${_tlIsAdmin ? `<input type="number" class="tl-day-input" value="${row.days}" min="1" max="999"
          data-stage="${row.name}" data-pid="${pid}" data-default="${SCHEDULE_DEF[row.schedIdx][1]}"
          onchange="updateTimelineDays('${pid}','${row.name.replace(/'/g,"\\'")}',this.value)"
          style="width:36px;height:20px;text-align:center;font-size:10px;border:1px solid ${isCustom?'var(--accent)':'var(--border)'};border-radius:4px;background:${isCustom?'rgba(59,130,246,0.1)':'var(--surface2)'};color:var(--text);padding:0">
        <button onclick="toggleStageVisibility('${pid}','${row.name.replace(/'/g,"\\'")}')" title="${t('إخفاء هذه المرحلة')}"
          style="width:24px;height:18px;font-size:11px;border:none;background:none;cursor:pointer;padding:0;color:var(--text2)">👁️</button>` : `<span style="font-size:10px">${row.days} ${t('يوم')}</span>`}
        <br><span style="font-size:9px">${dateStr}</span>
      </div>
    </div>`;
  }).join('');

  // ── Holiday rows for Gantt ──
  const holidayRowsHTML = holidayRows.map(h => {
    const hStartDate = new Date(startDate.getTime() + h.start * 864e5);
    const hEndDate = new Date(startDate.getTime() + h.end * 864e5);
    return `<div class="tl-row" style="background:rgba(239,68,68,0.08);border-bottom:1px solid #fca5a5">
      <div class="tl-label" style="color:#dc2626;font-size:10px;font-weight:600;display:flex;align-items:center;gap:4px">
        <span>🚫</span><span>${h.name}</span>
      </div>
      <div style="flex:1;position:relative;height:22px;padding:0 6px">
        <div style="position:absolute;left:${pct(h.start)}%;width:${Math.max(0.5,+pct(h.end)-+pct(h.start)).toFixed(3)}%;height:14px;top:4px;
             background:repeating-linear-gradient(45deg,#fca5a5,#fca5a5 4px,#fde8e8 4px,#fde8e8 8px);border-radius:3px;border:1px solid #f87171;z-index:2"></div>
      </div>
      <div class="tl-meta" style="font-size:9px;color:#dc2626">
        ${h.days}ي<br><span style="font-size:8px">${fmtD(hStartDate)}-${fmtD(hEndDate)}</span>
      </div>
    </div>`;
  }).join('');

  // Month ticks
  const ticksHTML=(()=>{
    const ticks=[];
    let d2=new Date(startDate);d2.setDate(1);d2.setMonth(d2.getMonth()+1);
    while(d2<new Date(startDate.getTime()+totalDays*864e5)){
      const off=Math.round((d2-startDate)/864e5);
      ticks.push(`<div style="position:absolute;left:${pct(off)}%;height:100%;border-right:1px dashed var(--border);top:0">
        <span style="position:absolute;bottom:4px;right:3px;font-size:9px;color:var(--text2);white-space:nowrap">${d2.toLocaleDateString('ar-SA',{month:'short'})}</span>
      </div>`);
      d2=new Date(d2);d2.setMonth(d2.getMonth()+1);
    }
    return ticks.join('');
  })();

  const hdrHolidayOverlays = holidayRows.map(h =>
    `<div style="position:absolute;left:${pct(h.start)}%;width:${Math.max(0.3,+pct(h.end)-+pct(h.start)).toFixed(3)}%;height:100%;background:rgba(239,68,68,0.15);z-index:1;pointer-events:none"></div>`
  ).join('');

  const completedPct=Math.round(doneCount/totalStages*100);

  const conditionsHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">
      <div style="padding:8px 12px;border-radius:8px;border:1px solid ${hasApproval?'#16a34a':'#dc2626'};background:${hasApproval?'rgba(22,163,74,0.08)':'rgba(220,38,38,0.08)'}">
        <div style="font-size:11px;font-weight:700;color:${hasApproval?'#16a34a':'#dc2626'}">${hasApproval?'✅':'❌'} ${t('اعتماد المخططات')}</div>
        <div style="font-size:10px;color:var(--text2);margin-top:2px">${p.approvalDate||t('لم يتم بعد')}</div>
      </div>
      <div style="padding:8px 12px;border-radius:8px;border:1px solid ${hasSiteReady?'#16a34a':'#dc2626'};background:${hasSiteReady?'rgba(22,163,74,0.08)':'rgba(220,38,38,0.08)'}">
        <div style="font-size:11px;font-weight:700;color:${hasSiteReady?'#16a34a':'#dc2626'}">${hasSiteReady?'✅':'❌'} ${t('جاهزية الموقع')}</div>
        <div style="font-size:10px;color:var(--text2);margin-top:2px">${p.siteReadyDate||t('لم يتم بعد')}</div>
      </div>
      <div style="padding:8px 12px;border-radius:8px;border:1px solid ${hasSecondPayment?'#16a34a':'#dc2626'};background:${hasSecondPayment?'rgba(22,163,74,0.08)':'rgba(220,38,38,0.08)'}">
        <div style="font-size:11px;font-weight:700;color:${hasSecondPayment?'#16a34a':'#dc2626'}">${hasSecondPayment?'✅':'❌'} ${t('سداد الدفعة الثانية')}</div>
        <div style="font-size:10px;color:var(--text2);margin-top:2px">${p.secondPaymentDate||t('لم يتم بعد')}</div>
      </div>
    </div>`;

  // ── Custom days info ──
  const hasCustom = Object.keys(customDays).length > 0;
  const resetBtnHTML = hasCustom ? `<button class="btn btn-sm btn-secondary tl-noprint" onclick="resetTimelineDays('${pid}')" style="font-size:10px;padding:3px 10px">🔄 ${t('إعادة تعيين الأيام للتلقائي')}</button>` : '';
  const hasHidden = hiddenStages.length > 0;
  const showHiddenBtnHTML = hasHidden ? `<button class="btn btn-sm btn-secondary tl-noprint" onclick="showHiddenStages('${pid}')" style="font-size:10px;padding:3px 10px">👁️ ${t('إظهار المراحل المخفية')} (${hiddenStages.length})</button>` : '';

  return `
    <div class="tl-noprint">
    <!-- ═══ HEADER INFO ═══ -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px">
      <div class="stat-card" style="border-right:3px solid var(--accent)">
        <div class="stat-num" style="color:var(--accent);font-size:18px">${dur}</div>
        <div class="stat-label">${t('يوم مدة العقد')}</div>
      </div>
      <div class="stat-card" style="border-right:3px solid #16a34a">
        <div class="stat-num" style="color:#16a34a;font-size:18px">${doneCount}</div>
        <div class="stat-label">${t('مرحلة مكتملة من')} ${totalStages}</div>
      </div>
      <div class="stat-card" style="border-right:3px solid var(--accent2)">
        <div class="stat-num" style="color:var(--accent2);font-size:18px">${p.progress||0}%</div>
        <div class="stat-label">${t('نسبة الإنجاز الكلية')}</div>
      </div>
      <div class="stat-card" style="border-right:3px solid #7c3aed">
        <div class="stat-num" style="color:#7c3aed;font-size:14px">${p.stage||'-'}</div>
        <div class="stat-label">${t('المرحلة الحالية')}</div>
      </div>
    </div>

    <!-- ═══ CONDITION STATUS ═══ -->
    ${conditionsHTML}

    <!-- ═══ PROGRESS + MINI CHART ═══ -->
    <div style="display:grid;grid-template-columns:1fr 280px;gap:14px;margin-bottom:16px">
      <div>
        <div style="font-size:12px;color:var(--text2);margin-bottom:6px;display:flex;justify-content:space-between">
          <span>${t('تقدم المراحل')}</span>
          <span style="font-weight:700;color:var(--accent)">${completedPct}%</span>
        </div>
        <div class="progress-bar" style="height:14px;border-radius:8px;margin-bottom:10px">
          <div class="progress-fill" style="width:${p.progress||0}%;border-radius:8px;background:linear-gradient(90deg,#16a34a,#4ade80)"></div>
        </div>
        <div style="font-size:12px;color:var(--text2);margin-bottom:6px;display:flex;justify-content:space-between">
          <span>${t('المراحل المكتملة')}</span>
          <span>${doneCount} / ${totalStages}</span>
        </div>
        <div class="progress-bar" style="height:10px;border-radius:6px">
          <div style="height:100%;border-radius:6px;width:${completedPct}%;background:linear-gradient(90deg,var(--accent),#818cf8)"></div>
        </div>

        <!-- Timeline legend -->
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:12px;font-size:11px">
          <span style="display:flex;align-items:center;gap:5px"><span style="width:14px;height:10px;background:#16a34a;border-radius:2px;display:inline-block"></span>${t('مكتمل')}</span>
          <span style="display:flex;align-items:center;gap:5px"><span style="width:14px;height:10px;background:#3b82f6;border-radius:2px;display:inline-block"></span>${t('جاري')}</span>
          <span style="display:flex;align-items:center;gap:5px"><span style="width:14px;height:10px;background:#cbd5e1;border-radius:2px;display:inline-block"></span>${t('لم يبدأ')}</span>
          <span style="display:flex;align-items:center;gap:5px"><span style="width:14px;height:10px;background:rgba(124,58,237,0.3);border:1px solid #7c3aed;border-radius:2px;display:inline-block"></span>${t('قبل العقد')}</span>
          <span style="display:flex;align-items:center;gap:5px"><span style="width:2px;height:14px;background:#dc2626;display:inline-block"></span>${t('توقف')}</span>
          <span style="display:flex;align-items:center;gap:5px"><span style="width:14px;height:10px;background:repeating-linear-gradient(45deg,#fca5a5,#fca5a5 3px,#fde8e8 3px,#fde8e8 6px);border:1px solid #f87171;border-radius:2px;display:inline-block"></span>${t('عطلة رسمية')}</span>
          <span style="display:flex;align-items:center;gap:5px"><span style="width:2px;height:14px;background:#ef4444;display:inline-block;border-right:2px dashed #ef4444"></span>${t('اليوم')}</span>
        </div>
      </div>

      <!-- Donut chart -->
      <div style="background:var(--surface2);border-radius:10px;padding:12px;border:1px solid var(--border);display:flex;flex-direction:column;align-items:center">
        <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:8px">${t('توزيع المراحل')}</div>
        <canvas id="tlDonut_${pid}" width="180" height="140"></canvas>
        <div style="font-size:10px;color:var(--text2);margin-top:6px;text-align:center">
          <span style="color:#16a34a">■</span> ${t('مكتمل')} ${doneCount} &nbsp;
          <span style="color:#3b82f6">■</span> ${t('جاري')} ${activeCount} &nbsp;
          <span style="color:#cbd5e1">■</span> ${t('قادم')} ${totalStages-doneCount-activeCount}
        </div>
      </div>
    </div>

    <!-- ═══ KEY DATES ═══ -->
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;font-size:11px">
      <div style="padding:8px 14px;background:var(--surface2);border-radius:8px;border-right:3px solid var(--accent)">
        📅 ${t('بداية العقد')}: <strong>${fmtFull(startDate)}</strong>
      </div>
      ${p.approvalDate?`<div style="padding:8px 14px;background:rgba(245,158,11,0.1);border-radius:8px;border-right:3px solid #d97706">
        ✅ ${t('تاريخ الاعتماد')}: <strong style="color:#d97706">${p.approvalDate}</strong>
      </div>`:''}
      ${p.siteReadyDate?`<div style="padding:8px 14px;background:rgba(100,116,139,0.1);border-radius:8px;border-right:3px solid #64748b">
        🏗️ ${t('جاهزية الموقع')}: <strong style="color:#64748b">${p.siteReadyDate}</strong>
      </div>`:''}
      ${effectiveStart?`<div style="padding:8px 14px;background:rgba(37,99,235,0.1);border-radius:8px;border-right:3px solid #2563eb">
        ⏱ ${t('بدء عداد الـ')}${dur} ${t('يوم')}: <strong style="color:#2563eb">${fmtFull(effectiveStart)}</strong> (${t('الأبعد')})
      </div>`:''}
      ${smartDelivery?`<div style="padding:8px 14px;background:var(--surface2);border-radius:8px;border-right:3px solid #16a34a">
        📆 ${t('موعد التسليم')}: <strong style="color:#16a34a">${smartDelivery}</strong>
      </div>`:`<div style="padding:8px 14px;background:var(--surface2);border-radius:8px;border-right:3px solid #16a34a">
        📆 ${t('التسليم المتوقع')}: <strong>${fmtFull(new Date(startDate.getTime()+(totalDays)*864e5))}</strong>
      </div>`}
      <div style="padding:8px 14px;background:rgba(220,38,38,0.08);border-radius:8px;border-right:3px solid #dc2626;font-size:10px;color:var(--text2)">
        ⚠️ ${t('الشروط')}: <strong style="color:#dc2626">${t('اعتماد المخططات')}</strong> + <strong style="color:#dc2626">${t('جاهزية الموقع')}</strong> + <strong style="color:#dc2626">${t('سداد الدفعة الثانية')}</strong>
        ${deliverySettings.skipFridays?' | 🚫 '+t('الجمعة'):''}${deliverySettings.skipHolidays?' | 🚫 '+t('العطل'):''}
      </div>
    </div>

    <!-- Edit info (admin only) -->
    ${_tlIsAdmin ? `<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;font-size:11px;color:var(--text2)">
      <span>💡 ${t('يمكنك تعديل عدد الأيام لكل مهمة من عمود "المدة" على اليمين')}</span>
      ${resetBtnHTML}
      ${showHiddenBtnHTML}
    </div>` : ''}

    </div><!-- end tl-noprint -->

    <!-- ═══ PRINT-VISIBLE CONDITIONS ═══ -->
    <div class="tl-printonly" style="display:none;margin-bottom:8px">
      <div style="display:flex;gap:10px;flex-wrap:wrap;font-size:9px;margin-bottom:6px">
        <span>${hasApproval?'✅':'❌'} ${t('اعتماد')}: ${p.approvalDate||'-'}</span>
        <span>${hasSiteReady?'✅':'❌'} ${t('جاهزية')}: ${p.siteReadyDate||'-'}</span>
        <span>${hasSecondPayment?'✅':'❌'} ${t('سداد')}: ${p.secondPaymentDate||'-'}</span>
        ${smartDelivery?`<span>📆 ${t('التسليم')}: ${smartDelivery}</span>`:''}
        ${deliverySettings.skipFridays?'<span>🚫 '+t('جمعة')+'</span>':''}${deliverySettings.skipHolidays?'<span>🚫 '+t('عطل')+'</span>':''}
      </div>
    </div>

    <!-- ═══ GANTT CHART ═══ -->
    <div style="background:var(--surface);border-radius:10px;overflow:hidden;border:1px solid var(--border)">
      <div class="tl-row tl-hdr" style="background:var(--surface3);border-bottom:2px solid var(--border);min-height:36px">
        <div class="tl-label" style="font-weight:700;color:var(--accent);font-size:12px">${t('المرحلة')}</div>
        <div style="flex:1;position:relative;height:36px;padding:0 6px">
          ${hdrHolidayOverlays}
          ${ticksHTML}
          ${todayOff>0&&todayOff<totalDays?`<div style="position:absolute;left:${todayPct}%;height:100%;border-right:2px solid #ef4444;z-index:5">
            <span style="position:absolute;top:4px;right:4px;font-size:9px;color:#ef4444;white-space:nowrap;background:var(--surface3);padding:0 2px">${t('اليوم')}</span>
          </div>`:''}
          ${activeDayStart?`<div style="position:absolute;left:${pct(activeDayStart)}%;height:100%;border-right:2px dashed #d97706;z-index:4">
            <span style="position:absolute;top:16px;right:3px;font-size:9px;color:#d97706;white-space:nowrap">${t('بدء')} ${dur}${t('ي')}</span>
          </div>`:''}
        </div>
        <div class="tl-meta tl-editcol" style="font-weight:700;color:var(--accent);font-size:11px">${t('المدة')}</div>
      </div>
      ${rowsHTML}
      ${holidayRowsHTML?'<div style="border-top:2px dashed #fca5a5"></div>'+holidayRowsHTML:''}
      <!-- Footer -->
      <div style="display:flex;align-items:center;padding:10px 12px;background:var(--surface3);border-top:2px solid var(--border);font-size:11px;gap:16px;flex-wrap:wrap">
        <span>📊 ${t('إجمالي')}: <strong style="color:var(--accent)">${totalDays} ${t('يوم')}</strong></span>
        <span>📋 ${t('المراحل')}: <strong>${totalStages}</strong></span>
        ${holidayRows.length?`<span>🚫 ${t('العطل')}: <strong style="color:#dc2626">${holidayRows.reduce((s,h)=>s+h.days,0)} ${t('يوم')}</strong></span>`:''}
        ${activeDayStart?`<span>⏱ ${t('بدء العداد')}: <strong style="color:#d97706">${fmtD(new Date(startDate.getTime()+activeDayStart*864e5))}</strong></span>`:''}
        <span style="margin-right:auto">⚠️ ${t('لا تشمل المدة فترات الانتظار والعطل')}</span>

      </div>
    </div>

    <script>
    (function(){
      const cid='tlDonut_${pid}';
      const cv=document.getElementById(cid);if(!cv)return;
      function drawIt(){
        if(typeof Chart==='undefined'){setTimeout(drawIt,300);return;}
        if(cv._ch){cv._ch.destroy();cv._ch=null;}
        cv._ch=new Chart(cv,{
          type:'doughnut',
          data:{
            labels:['${t('مكتمل')}','${t('جاري')}','${t('لم يبدأ')}'],
            datasets:[{data:[${doneCount},${activeCount},${totalStages-doneCount-activeCount}],
              backgroundColor:['#16a34a','#3b82f6','#cbd5e1'],borderWidth:2,
              borderColor:document.body.classList.contains('light-mode')?'#fff':'#1a1d2e'}]
          },
          options:{
            cutout:'62%',
            plugins:{legend:{display:false},
              tooltip:{callbacks:{label:ctx=>ctx.label+': '+ctx.raw+' '+(typeof t==='function'?t('مرحلة'):'مرحلة')}}},
            animation:{duration:500}
          }
        });
      }
      requestAnimationFrame(()=>setTimeout(drawIt,100));
    })();
    <\/script>`;
}
// ── Save custom days per stage for a project ──
function updateTimelineDays(pid, stageName, value) {
  const d = loadData();
  const p = d.projects.find(x => x.id === pid);
  if(!p) return;
  if(!p.timelineDays) p.timelineDays = {};
  const val = parseInt(value);
  if(!val || val < 1) {
    delete p.timelineDays[stageName];
  } else {
    p.timelineDays[stageName] = val;
  }
  localStorage.setItem('pm_projects', JSON.stringify(d.projects));
  try { _pending['pm_projects'] = JSON.stringify(d.projects); clearTimeout(_stimer); _stimer = setTimeout(_flush, 800); } catch(e) {}
  // Refresh timeline
  const { stages } = d;
  const container = document.getElementById('timelineModalContent') || document.getElementById('timelineContainer');
  if(container) container.innerHTML = buildTimelineHTML(p, stages);
}

function resetTimelineDays(pid) {
  const d = loadData();
  const p = d.projects.find(x => x.id === pid);
  if(!p) return;
  delete p.timelineDays;
  localStorage.setItem('pm_projects', JSON.stringify(d.projects));
  try { _pending['pm_projects'] = JSON.stringify(d.projects); clearTimeout(_stimer); _stimer = setTimeout(_flush, 800); } catch(e) {}
  const { stages } = d;
  const container = document.getElementById('timelineModalContent') || document.getElementById('timelineContainer');
  if(container) container.innerHTML = buildTimelineHTML(p, stages);
  notify(t('تم إعادة تعيين الأيام للقيم التلقائية'));
}

function toggleStageVisibility(pid, stageName) {
  const d = loadData();
  const p = d.projects.find(x => x.id === pid);
  if(!p) return;
  if(!p.hiddenStages) p.hiddenStages = [];
  const idx = p.hiddenStages.indexOf(stageName);
  if(idx >= 0) p.hiddenStages.splice(idx, 1);
  else p.hiddenStages.push(stageName);
  localStorage.setItem('pm_projects', JSON.stringify(d.projects));
  try { _pending['pm_projects'] = JSON.stringify(d.projects); clearTimeout(_stimer); _stimer = setTimeout(_flush, 800); } catch(e) {}
  const { stages } = d;
  const container = document.getElementById('timelineModalContent') || document.getElementById('timelineContainer');
  if(container) container.innerHTML = buildTimelineHTML(p, stages);
}

function showHiddenStages(pid) {
  const d = loadData();
  const p = d.projects.find(x => x.id === pid);
  if(!p) return;
  p.hiddenStages = [];
  localStorage.setItem('pm_projects', JSON.stringify(d.projects));
  try { _pending['pm_projects'] = JSON.stringify(d.projects); clearTimeout(_stimer); _stimer = setTimeout(_flush, 800); } catch(e) {}
  const { stages } = d;
  const container = document.getElementById('timelineModalContent') || document.getElementById('timelineContainer');
  if(container) container.innerHTML = buildTimelineHTML(p, stages);
  notify(t('تم إظهار جميع المراحل'));
}

function renderTimelineClientSelect() {
  const { projects } = loadData();
  const sel = document.getElementById('timelineClientSelect');
  sel.innerHTML = '<option value="">-- '+t('اختر مشروع')+' --</option>' + projects.map(p => `<option value="${p.id}">${p.name} - ${p.projectName||''}</option>`).join('');
}

function renderTimeline() {
  const id = document.getElementById('timelineClientSelect').value;
  const container = document.getElementById('timelineContainer');
  const printBtn = document.getElementById('tlPrintBtn');
  if(!id) { container.innerHTML = ''; if(printBtn) printBtn.style.display='none'; return; }
  const { projects, stages } = loadData();
  const p = projects.find(x => x.id === id);
  if(p) {
    container.innerHTML = buildTimelineHTML(p, stages);
    if(printBtn) printBtn.style.display = 'inline-flex';
  }
}

function openClientReport(id) {
  showPage('reports');
  setTimeout(() => {
    switchRptTab('client');
    const sel = document.getElementById('clientReportSelect');
    if(sel) { sel.value = id; renderClientReport(); }
  }, 100);
}

// ══ طباعة ملف العميل الكامل ══
// يفتح الاستمارة بنافذة fmPrint الأصلية (3 صفحات) + يطبع الباقي بصفحة ثانية
function printClientFile(pid) {
  var d = loadData();
  var p = d.projects.find(function(x){ return x.id === pid; });
  if(!p) { notify(t('المشروع غير موجود'),'error'); return; }

  // اختيار الأقسام المطلوبة
  var modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.innerHTML = '<div class="modal" style="max-width:440px;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)">'+
    '<div style="background:linear-gradient(135deg,#1a3a5c,#2563eb);color:#fff;padding:18px 22px;display:flex;align-items:center;justify-content:space-between">'+
      '<div><div style="font-size:16px;font-weight:800">📑 '+t('طباعة ملف العميل')+'</div><div style="font-size:12px;opacity:.8;margin-top:2px">'+p.name+' — '+(p.contractNo||'')+'</div></div>'+
      '<button style="background:rgba(255,255,255,.2);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:16px" onclick="this.closest(\'.modal-bg\').remove()">✕</button>'+
    '</div>'+
    '<div class="modal-body" style="padding:16px 20px">'+
      '<div style="font-size:12px;color:var(--text2);margin-bottom:10px;font-weight:600">'+t('اختر الأقسام المطلوبة:')+'</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">'
      + '<label style="display:flex;gap:6px;align-items:center;padding:10px 12px;border-radius:8px;background:linear-gradient(135deg,#f0f4ff,#e8f0fe);border:1px solid #bfdbfe;cursor:pointer;transition:all .2s"><input type="checkbox" id="cf_form" checked style="accent-color:#1a3a5c;width:16px;height:16px"> <span style="font-size:12px">📋 '+t('الاستمارة')+'</span></label>'
      + '<label style="display:flex;gap:6px;align-items:center;padding:10px 12px;border-radius:8px;background:linear-gradient(135deg,#f0f4ff,#e8f0fe);border:1px solid #bfdbfe;cursor:pointer;transition:all .2s"><input type="checkbox" id="cf_extract" checked style="accent-color:#1a3a5c;width:16px;height:16px"> <span style="font-size:12px">🖨️ '+t('المستخلص')+'</span></label>'
      + '<label style="display:flex;gap:6px;align-items:center;padding:10px 12px;border-radius:8px;background:linear-gradient(135deg,#f0f4ff,#e8f0fe);border:1px solid #bfdbfe;cursor:pointer;transition:all .2s"><input type="checkbox" id="cf_client" checked style="accent-color:#1a3a5c;width:16px;height:16px"> <span style="font-size:12px">📄 '+t('تقرير العميل')+'</span></label>'
      + '<label style="display:flex;gap:6px;align-items:center;padding:10px 12px;border-radius:8px;background:linear-gradient(135deg,#f0f4ff,#e8f0fe);border:1px solid #bfdbfe;cursor:pointer;transition:all .2s"><input type="checkbox" id="cf_indicators" checked style="accent-color:#1a3a5c;width:16px;height:16px"> <span style="font-size:12px">📈 '+t('مؤشرات العميل')+'</span></label>'
      + '<label style="display:flex;gap:6px;align-items:center;padding:10px 12px;border-radius:8px;background:linear-gradient(135deg,#f0f4ff,#e8f0fe);border:1px solid #bfdbfe;cursor:pointer;transition:all .2s"><input type="checkbox" id="cf_stages" checked style="accent-color:#1a3a5c;width:16px;height:16px"> <span style="font-size:12px">📊 '+t('المراحل')+'</span></label>'
      + '<label style="display:flex;gap:6px;align-items:center;padding:10px 12px;border-radius:8px;background:linear-gradient(135deg,#f0f4ff,#e8f0fe);border:1px solid #bfdbfe;cursor:pointer;transition:all .2s"><input type="checkbox" id="cf_timeline" checked style="accent-color:#1a3a5c;width:16px;height:16px"> <span style="font-size:12px">📅 '+t('المخطط الزمني')+'</span></label>'
      + '<label style="display:flex;gap:6px;align-items:center;padding:10px 12px;border-radius:8px;background:linear-gradient(135deg,#f0f4ff,#e8f0fe);border:1px solid #bfdbfe;cursor:pointer;transition:all .2s"><input type="checkbox" id="cf_purchase" checked style="accent-color:#1a3a5c;width:16px;height:16px"> <span style="font-size:12px">🛒 '+t('طلب الشراء')+'</span></label>'
      + '<label style="display:flex;gap:6px;align-items:center;padding:10px 12px;border-radius:8px;background:linear-gradient(135deg,#f0f4ff,#e8f0fe);border:1px solid #bfdbfe;cursor:pointer;transition:all .2s"><input type="checkbox" id="cf_meas" checked style="accent-color:#1a3a5c;width:16px;height:16px"> <span style="font-size:12px">📐 '+t('المقاسات')+'</span></label>'
      + '</div>'+
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:16px;padding-top:12px;border-top:1px solid var(--border)">'+
        '<button class="btn btn-sm" style="font-size:11px;color:var(--text2)" onclick="document.querySelectorAll(\'[id^=cf_]\').forEach(function(c){c.checked=!c.checked})">🔄 '+t('عكس التحديد')+'</button>'+
        '<div style="display:flex;gap:8px">'+
          '<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>'+
          '<button class="btn btn-primary" style="background:linear-gradient(135deg,#1a3a5c,#2563eb);border:none;padding:8px 24px" onclick="_doPrintClientFile(\''+pid+'\',this)">🖨️ '+t('طباعة')+'</button>'+
        '</div>'+
      '</div>'+
    '</div></div>';
  document.body.appendChild(modal);
}

function _oldPrintRemoved(){
  var d = null;
  var p = null;

  // 1. الاستمارة — تُفتح بنافذة fmPrint الأصلية (3 صفحات بالعرض)
  if(checks.form && typeof fmPrint === 'function') {
    fmPrint(pid);
  }

  // 2-6. الباقي — يتطبع بـ printArea
  var sections = [];
  var pageStyle = '<style>@page{size:A4;margin:10mm}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}body{font-family:Cairo,sans-serif;direction:rtl;color:#1e293b;background:#fff;margin:0;font-size:12px}table{width:100%;border-collapse:collapse}img{max-width:100%}tr{page-break-inside:avoid}.cf-section{page-break-before:always;padding:10px 0}.cf-section:first-child{page-break-before:auto}.cf-header{font-size:18px;font-weight:900;color:#1e3a5f;border-bottom:3px solid #1e3a5f;padding-bottom:8px;margin-bottom:14px}</style>';

  if(checks.extract) { try {
    if(typeof _getDocContext==='function' && typeof _buildExtractDoc==='function') {
      var ctx=_getDocContext(); ctx.p=p; ctx.pid=pid;
      var h=_buildExtractDoc(ctx);
      if(h) sections.push('<div class="cf-section"><div class="cf-header">🖨️ '+t('المستخلص')+' — '+p.name+'</div>'+h+'</div>');
    }
  } catch(e){} }

  if(checks.client) { try {
    if(typeof _buildClientReportDoc==='function') {
      var ctx2=typeof _getDocContext==='function'?_getDocContext():{};ctx2.p=p;ctx2.pid=pid;
      var h2=_buildClientReportDoc(ctx2);
      if(h2) sections.push('<div class="cf-section"><div class="cf-header">📄 '+t('تقرير العميل')+' — '+p.name+'</div>'+h2+'</div>');
    }
  } catch(e){} }

  if(checks.timeline) { try {
    if(typeof _buildTimelineDoc==='function') {
      var ctx3=typeof _getDocContext==='function'?_getDocContext():{};ctx3.p=p;ctx3.pid=pid;
      var h3=_buildTimelineDoc(ctx3);
      if(h3) sections.push('<div class="cf-section"><div class="cf-header">📅 '+t('المخطط الزمني')+' — '+p.name+'</div>'+h3+'</div>');
    }
  } catch(e){} }

  if(checks.purchase) { try {
    if(typeof _buildPurchaseOrderDoc==='function') {
      var ctx4=typeof _getDocContext==='function'?_getDocContext():{};ctx4.p=p;ctx4.pid=pid;
      var h4=_buildPurchaseOrderDoc(ctx4);
      if(h4) sections.push('<div class="cf-section"><div class="cf-header">🛒 '+t('طلب الشراء')+' — '+p.name+'</div>'+h4+'</div>');
    }
  } catch(e){} }

  if(checks.meas) { try {
    var measRows=typeof getMeasurementsData==='function'?getMeasurementsData(pid):null;
    if(measRows && measRows.length) {
      var activeRows=measRows.filter(function(r){return r.width||r.height;});
      if(activeRows.length) {
        var mHtml='<table><thead><tr style="background:#1e3a5f;color:#fff"><th style="padding:6px;border:1px solid #1e3a5f">#</th><th style="padding:6px;border:1px solid #1e3a5f">'+t('الرمز')+'</th><th style="padding:6px;border:1px solid #1e3a5f">'+t('العرض')+'</th><th style="padding:6px;border:1px solid #1e3a5f">'+t('الارتفاع')+'</th><th style="padding:6px;border:1px solid #1e3a5f">'+t('القطاع')+'</th><th style="padding:6px;border:1px solid #1e3a5f">'+t('الوصف')+'</th><th style="padding:6px;border:1px solid #1e3a5f">'+t('ملاحظات')+'</th></tr></thead><tbody>';
        activeRows.forEach(function(r,i){
          mHtml+='<tr style="background:'+(i%2===0?'#fff':'#f8fafc')+'"><td style="padding:6px;border:1px solid #e2e8f0;text-align:center">'+(i+1)+'</td><td style="padding:6px;border:1px solid #e2e8f0;font-weight:700;color:#1e40af">'+(r.code||'')+'</td><td style="padding:6px;border:1px solid #e2e8f0;text-align:center">'+(r.width||'-')+'</td><td style="padding:6px;border:1px solid #e2e8f0;text-align:center">'+(r.height||'-')+'</td><td style="padding:6px;border:1px solid #e2e8f0">'+(r.sectionName||'')+'</td><td style="padding:6px;border:1px solid #e2e8f0">'+(r.description||'')+'</td><td style="padding:6px;border:1px solid #e2e8f0;font-size:11px">'+(r.notes||'')+'</td></tr>';
        });
        mHtml+='</tbody></table>';
        var photoRows=activeRows.filter(function(r){return r.serverPhoto;});
        if(photoRows.length) {
          mHtml+='<div style="margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px">';
          photoRows.forEach(function(r){
            mHtml+='<div style="text-align:center;border:1px solid #e2e8f0;border-radius:8px;padding:8px"><img src="/api/file?path='+encodeURIComponent(r.serverPhoto)+'" style="max-width:100%;max-height:200px;object-fit:contain;border-radius:4px"><div style="margin-top:4px;font-size:11px;color:#1e40af;font-weight:700">'+(r.code||'')+(r.description?' — '+r.description:'')+'</div></div>';
          });
          mHtml+='</div>';
        }
        sections.push('<div class="cf-section"><div class="cf-header">📐 '+t('المقاسات')+' — '+p.name+' ('+activeRows.length+' '+t('مقاس')+')</div>'+mHtml+'</div>');
      }
    }
  } catch(e){} }

  if(!sections.length) { if(!checks.form) notify(t('لا توجد بيانات للطباعة'),'error'); return; }

  // تأخير بسيط حتى تفتح نافذة الاستمارة أولاً
  setTimeout(function(){
    var pa=document.getElementById('printArea');
    pa.innerHTML=pageStyle+sections.join('');
    var imgs=pa.querySelectorAll('img');
    if(imgs.length){
      var ld=0,tot=imgs.length;
      var dp=function(){window.print();setTimeout(function(){pa.innerHTML='';},2000);};
      imgs.forEach(function(img){
        if(img.complete){ld++;if(ld>=tot)dp();}
        else{img.onload=function(){ld++;if(ld>=tot)dp();};img.onerror=function(){ld++;if(ld>=tot)dp();};}
      });
      setTimeout(function(){if(ld<tot)dp();},5000);
    } else {
      window.print();
      setTimeout(function(){document.getElementById('printArea').innerHTML='';},2000);
    }
  }, checks.form ? 1500 : 100);
}

// ── طباعة ملف العميل الموحّد — نافذة واحدة فيها كل المستندات ──
function _doPrintClientFile(pid, btn) {
  var checks = {
    form: document.getElementById('cf_form')?.checked,
    extract: document.getElementById('cf_extract')?.checked,
    client: document.getElementById('cf_client')?.checked,
    indicators: document.getElementById('cf_indicators')?.checked,
    stages: document.getElementById('cf_stages')?.checked,
    timeline: document.getElementById('cf_timeline')?.checked,
    purchase: document.getElementById('cf_purchase')?.checked,
    meas: document.getElementById('cf_meas')?.checked
  };
  btn.closest('.modal-bg').remove();

  var hasAny = checks.form||checks.extract||checks.client||checks.indicators||checks.stages||checks.timeline||checks.purchase||checks.meas;
  if(!hasAny) { notify(t('اختر قسم واحد على الأقل'),'error'); return; }

  // ── بناء ctx يدوياً بدون DOM ──
  var dd = loadData();
  var p = dd.projects.find(function(x){ return x.id === pid; });
  if(!p) { notify(t('المشروع غير موجود'),'error'); return; }

  var companyLogoMap = {'السلطان':'sultan','عالم المعادن':'metal','الراجحي':'rajhi','الفوزان':'fozan'};
  var logoKey = companyLogoMap[p.company] || 'none';
  var logoSrc = logoKey !== 'none' && typeof LOGOS !== 'undefined' ? LOGOS[logoKey] : null;
  var prof = (dd.companyProfiles || {})[p.company] || {};
  var ctx = {
    projects: dd.projects,
    companyProfiles: dd.companyProfiles || {},
    stages: dd.stages || [],
    projectId: pid,
    p: p,
    logoKey: logoKey,
    logoSrc: logoSrc,
    today: new Date().toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'}),
    compName: p.company || '',
    prof: prof,
    coNameAr: prof.nameAr || p.company || '',
    coNameEn: prof.nameEn || '',
    extVal: parseFloat(p.extractValue) || 0,
    contrVal: parseFloat(p.contractValue) || 0,
    down: parseFloat(p.downPayment) || 0,
    wmHTML: '',
    wmStyle: ''
  };

  // ── بناء أقسام الصفحات ──
  // كل قسم: {id, title, html, orientation:'portrait'|'landscape'}
  var sections = [];
  var secIdx = 0;

  // 1. استمارة التصنيع (landscape)
  if(checks.form && typeof _cfBuildFormPages === 'function') {
    var formHTML = _cfBuildFormPages(pid, p);
    if(formHTML) sections.push({id:'sec_form_'+(secIdx++), title:t('استمارة التصنيع'), html:formHTML, orientation:'landscape', raw:true});
  }

  // 2. المستخلص
  if(checks.extract && typeof _buildExtractDoc === 'function') {
    var h = _buildExtractDoc(ctx);
    if(h) sections.push({id:'sec_extract_'+(secIdx++), title:t('المستخلص'), html:h, orientation:'portrait'});
  }

  // 3. تقرير العميل
  if(checks.client && typeof _buildClientReportDoc === 'function') {
    var h2 = _buildClientReportDoc(ctx);
    if(h2) sections.push({id:'sec_client_'+(secIdx++), title:t('تقرير العميل'), html:h2, orientation:'portrait'});
  }

  // 4. مؤشرات العميل (الرسومات البيانية)
  if(checks.indicators && typeof _buildIndicatorsDoc === 'function') {
    var hInd = _buildIndicatorsDoc(ctx);
    if(hInd) sections.push({id:'sec_ind_'+(secIdx++), title:t('مؤشرات العميل'), html:hInd, orientation:'portrait'});
  }

  // 5. المراحل (مصغّرة لصفحة واحدة — بدون توقيع)
  if(checks.stages && typeof _buildStagesDoc === 'function') {
    var h6 = _buildStagesDoc(ctx);
    if(h6) {
      // شيل التوقيع حتى ما يطلع لصفحة لحاله
      h6 = h6.replace(/<div style="margin-top:24px;display:flex[\s\S]*?<\/div>\s*<\/div>/,'');
      // تصغير حتى تناسب صفحة واحدة
      h6 = '<div style="transform:scale(0.85);transform-origin:top right">'
         + h6.replace(/font-size:\s*1[1-8]px/g,'font-size:9px')
              .replace(/padding:\s*10px/g,'padding:5px')
              .replace(/gap:\s*10px/g,'gap:5px')
              .replace(/margin-bottom:\s*14px/g,'margin-bottom:6px')
         + '</div>';
      sections.push({id:'sec_stages_'+(secIdx++), title:t('المراحل'), html:h6, orientation:'portrait'});
    }
  }

  // 5. المخطط الزمني (landscape — صفحة وحدة)
  if(checks.timeline && typeof _buildTimelineDoc === 'function') {
    var h3 = _buildTimelineDoc(ctx);
    if(h3) {
      var tlHTML = '<div class="page-land" data-section="sec_timeline_'+secIdx+'">'
        + (typeof _buildLetterhead === 'function' ? _buildLetterhead(ctx, t('المخطط الزمني')) : '<h2 style="text-align:center;color:#1a3a6a">'+t('المخطط الزمني')+'</h2>')
        + h3 + '</div>';
      sections.push({id:'sec_timeline_'+(secIdx++), title:t('المخطط الزمني'), html:tlHTML, orientation:'landscape', raw:true});
    }
  }

  // 6. طلب الشراء — صفحتين: ألمنيوم + أكسسوارات (مع الألوان)
  if(checks.purchase) {
    var _poHTML = _cfBuildPurchasePages(pid, p, ctx);
    if(_poHTML.alum) sections.push({id:'sec_po_alum_'+(secIdx++), title:t('طلب شراء — الألمنيوم'), html:_poHTML.alum, orientation:'portrait'});
    if(_poHTML.acc) sections.push({id:'sec_po_acc_'+(secIdx++), title:t('طلب شراء — الأكسسوارات'), html:_poHTML.acc, orientation:'portrait'});
  }

  // 7. المقاسات
  if(checks.meas && typeof _buildMeasurementsDoc === 'function') {
    var h5 = _buildMeasurementsDoc(ctx);
    if(h5) sections.push({id:'sec_meas_'+(secIdx++), title:t('المقاسات'), html:h5, orientation:'portrait'});
  }

  if(!sections.length) { notify(t('لا توجد بيانات للطباعة'),'error'); return; }

  // ── بناء HTML النهائي ──
  var allPagesHTML = '';
  var togglesHTML = '';
  sections.forEach(function(sec) {
    togglesHTML += '<label>'
      + '<input type="checkbox" checked onchange="toggleSec(\''+sec.id+'\',this.checked)" style="accent-color:#fff"> '+sec.title+'</label>';

    if(sec.raw) {
      // HTML جاهز (landscape pages) — نضيف data-section للتحكم (بس إذا ما كان موجود)
      var wrapped = sec.html.replace(/class="page-land"(?!\s*data-section)/g, 'class="page-land" data-section="'+sec.id+'"');
      allPagesHTML += wrapped;
    } else {
      // portrait page — نبني letterhead + محتوى
      allPagesHTML += '<div class="page-portrait" data-section="'+sec.id+'">'
        + (typeof _buildLetterhead === 'function' ? _buildLetterhead(ctx, sec.title) : '<h2 style="text-align:center;color:#1a3a6a">'+sec.title+'</h2>')
        + sec.html + '</div>';
    }
  });

  // ── فتح نافذة واحدة ──
  var w = window.open('','_blank','width=1100,height=800,scrollbars=yes');
  if(!w) { notify(t('⚠️ السماح بالنوافذ المنبثقة مطلوب'),'error'); return; }

  w.document.write('<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">'
    + '<title>ملف العميل — '+(p.name||'')+'</title>'
    + '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">'
    + '<style>'
    + '*{margin:0;padding:0;box-sizing:border-box}'
    + 'body{font-family:"Cairo",sans-serif;direction:rtl;background:#fff;color:#1e293b;font-size:12px}'
    + 'table{width:100%;border-collapse:collapse}'
    + 'img{max-width:100%}'
    + 'tr{page-break-inside:avoid}'
    // doc-table
    + '.doc-table{width:100%;border-collapse:collapse;margin:12px 0;font-size:12px}'
    + '.doc-table th{background:#1e3a5f;color:#fff;padding:8px;border:1px solid #ccc;text-align:right}'
    + '.doc-table td{padding:7px 8px;border:1px solid #ccc}'
    + '.doc-table tr:nth-child(even) td{background:#f5f7ff}'
    + '.doc-company-name-ar{font-size:16px;font-weight:800;color:#1e3a5f;font-family:"Cairo",sans-serif}'
    + '.doc-company-name-en{font-size:11px;color:#555;font-family:Arial,sans-serif;letter-spacing:0.5px;margin-top:2px}'
    // Form landscape
    + '.page-land{padding:5mm 6mm}'
    + '.ptitle{background:#1a3a5c;color:#fff;text-align:center;padding:3px;font-size:11px;font-weight:700;border-radius:4px 4px 0 0;margin-bottom:2mm}'
    + '.hdr{border:1px solid #bbb;border-radius:4px;padding:3px 6px;margin-bottom:2mm;background:#f8faff}'
    + '.ht{width:100%;border-collapse:collapse;font-size:8.5px}.ht td{padding:2px 5px}'
    + '.bw{display:grid;grid-template-columns:3fr 1.1fr;gap:3mm}'
    + '.dt{width:100%;border-collapse:collapse;font-size:8px}.dt thead tr{background:#dce8f5}'
    + '.dt th{padding:3px 3px;border:1px solid #aac;text-align:center;font-size:7.5px;color:#1a3a5c}'
    + '.dt td{padding:2px 3px;border:1px solid #ddd;text-align:center}.tdr{text-align:right!important;padding-right:5px!important}'
    + '.dt tbody tr{page-break-inside:avoid}'
    + '.grp td{background:#e8f0fe;font-weight:700;font-size:8px;color:#1a3a5c;text-align:right!important}'
    + '.tot td{background:#1a3a5c;color:#fff;font-weight:700}'
    + '.cb{border:1px solid #ddd;border-radius:6px;padding:5px;background:#fafcff;display:flex;flex-direction:column;align-items:center}'
    + '.cb h4{font-size:8.5px;color:#1a3a5c;margin-bottom:3px;text-align:center;font-weight:700}'
    + '.sigs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3mm;margin-top:2mm;border-top:1px solid #ccc;padding-top:2mm;font-size:8.5px;text-align:center}'
    + '.sigline{border-top:1px solid #444;margin-top:8px;padding-top:2px}'
    + '.sg{display:grid;grid-template-columns:1fr 1fr;gap:3mm;margin-top:2mm}'
    + '.st{width:100%;border-collapse:collapse;font-size:9px}.st td{padding:3px 6px;border-bottom:1px solid #eee}.st td:last-child{text-align:left;font-weight:600}'
    + '.sh{background:#1a3a5c;color:#fff;padding:4px 7px;font-weight:700;font-size:9.5px}'
    + '.sh2{background:#1e88e5;color:#fff;padding:4px 7px;font-weight:700;font-size:9.5px}'
    + '.hl td{background:#e8f0fe;font-weight:700}.tt td{background:#1a3a5c;color:#fff;font-weight:700}.tt2 td{background:#1e88e5;color:#fff;font-weight:700}'
    + '.sb{margin-top:2mm;border:2px solid #1a3a5c;border-radius:4px;padding:4px 8px;background:#e8f0fe;display:flex;justify-content:space-between;font-size:9px}'
    // Portrait
    + '.page-portrait{padding:10mm 12mm;position:relative}'
    // Print
    + '@media print{'
    +   '.nopr{display:none!important}'
    +   '.page-land,.page-portrait{page-break-after:auto}'
    +   '.page-land+.page-land,.page-land+.page-portrait,.page-portrait+.page-land,.page-portrait+.page-portrait{page-break-before:always}'
    +   '.page-land{page:landscape-page}'
    +   '.page-portrait{page:portrait-page}'
    +   '@page landscape-page{size:A4 landscape;margin:7mm 9mm}'
    +   '@page portrait-page{size:A4 portrait;margin:10mm}'
    +   'body{margin:0}'
    +   '.sec-hidden{display:none!important}'
    + '}'
    // Screen
    + '.nopr{position:fixed;top:0;left:0;right:0;z-index:999;display:flex;gap:10px;flex-wrap:wrap;background:linear-gradient(135deg,#1a3a5c,#2563eb);padding:10px 16px;align-items:center;box-shadow:0 4px 20px rgba(0,0,0,.3)}'
    + '.nopr button{padding:6px 16px;border:none;border-radius:6px;cursor:pointer;font-family:"Cairo",sans-serif;font-size:11px;font-weight:700;transition:transform .15s}'
    + '.nopr button:hover{transform:scale(1.05)}'
    + '.sec-hidden{display:none}'
    + '.sec-toggles{display:flex;gap:6px;flex-wrap:wrap;align-items:center;border-right:2px solid rgba(255,255,255,.3);padding-right:10px;margin-right:4px}'
    + '.sec-toggles label{color:#fff;font-size:10px;background:rgba(255,255,255,.15);padding:3px 8px;border-radius:4px;cursor:pointer;transition:background .2s}'
    + '.sec-toggles label:hover{background:rgba(255,255,255,.25)}'
    + 'body>.page-land:first-child,body>.page-portrait:first-child{margin-top:52px}'
    + '</style></head><body>'
    // ── شريط التحكم ──
    + '<div class="nopr">'
    + '<button style="background:#fff;color:#1a3a5c" onclick="window.print()">🖨️ '+t('طباعة')+'</button>'
    + '<button style="background:rgba(255,255,255,.2);color:#fff" onclick="window.close()">✖ '+t('إغلاق')+'</button>'
    + '<div class="sec-toggles">' + togglesHTML + '</div>'
    + '</div>'
    + allPagesHTML
    + '<script>'
    + 'function toggleSec(id,show){'
    +   'document.querySelectorAll("[data-section=\\""+id+"\\"]").forEach(function(el){'
    +     'if(show){el.classList.remove("sec-hidden");}else{el.classList.add("sec-hidden");}'
    +   '});'
    +   'markLastVisible();'
    + '}'
    + 'function markLastVisible(){'
    +   'document.querySelectorAll(".last-visible").forEach(function(e){e.classList.remove("last-visible");});'
    +   'var all=document.querySelectorAll(".page-land:not(.sec-hidden),.page-portrait:not(.sec-hidden)");'
    +   'if(all.length){all[all.length-1].classList.add("last-visible");'
    +   'all[all.length-1].style.pageBreakAfter="auto";all[all.length-1].style.breakAfter="auto";}'
    + '}'
    + 'function autoFitPages(){'
    +   'var A4W=277,A4H=190,A4PW=190,A4PH=277;'
    +   'document.querySelectorAll(".page-land").forEach(function(page){'
    +     'page.style.zoom="1";var W=page.scrollWidth,H=page.scrollHeight;'
    +     'var mmW=W/3.7795,mmH=H/3.7795;var scale=Math.min(A4W/mmW,A4H/mmH,1);'
    +     'if(scale<1)page.style.zoom=scale.toFixed(3);'
    +   '});'
    +   'document.querySelectorAll(".page-portrait").forEach(function(page){'
    +     'page.style.zoom="1";var H=page.scrollHeight;'
    +     'var mmH=H/3.7795;var scale=Math.min(A4PH/mmH,1);'
    +     'if(scale<1)page.style.zoom=scale.toFixed(3);'
    +   '});'
    +   'markLastVisible();'
    + '}'
    + 'window.addEventListener("load",autoFitPages);'
    + '<\/script>'
    + '</body></html>');
  w.document.close();
  notify(t('تم فتح ملف العميل — ') + sections.length + ' ' + t('قسم'));
}

// ── بناء صفحات طلب الشراء — نفس منطق fmPrintPurchaseOrder (دمج + صور + أكواد) ──
function _cfBuildPurchasePages(pid, proj, ctx) {
  var result = {alum:'', acc:''};
  var plRows = (typeof getPLData === 'function') ? (getPLData(pid)||[]) : [];
  var fresh = (typeof fmBuildFormData === 'function') ? fmBuildFormData(proj, plRows) : null;
  var saved = (typeof fmFormLoad === 'function') ? fmFormLoad(pid) : null;
  var fd = saved ? (typeof fmMergeManualEdits === 'function' ? fmMergeManualEdits(fresh, saved) : saved) : fresh;
  if(!fd) return result;

  var cats = (typeof fmCatalogsLoad==='function') ? fmCatalogsLoad() : [];
  var activeCat = (typeof fmActiveCatGet==='function') ? fmActiveCatGet() : '';
  var cat = cats.find(function(c){return c.id===activeCat;})||null;

  var alumColor = proj.aluminumColor || '';
  var glassColor = proj.glassColor || '';

  // Color + info header
  var colorRow = '<table class="doc-table" style="margin-bottom:12px;font-size:11px">'
    + '<tr><td style="width:25%">'+t('العميل')+'</td><td><strong>'+(proj.name||'-')+'</strong></td><td style="width:20%">'+t('رقم العقد')+'</td><td><strong>'+(proj.contractNo||'-')+'</strong></td></tr>'
    + '<tr><td>'+t('الشركة')+'</td><td>'+(proj.company||'-')+'</td><td>'+t('المنطقة / المعرض')+'</td><td>'+(proj.region||'-')+' / '+(proj.gallery||'-')+'</td></tr>'
    + '<tr><td style="font-weight:700">'+t('لون الألمنيوم')+'</td><td style="font-weight:700;color:#1a3a5c"><span style="display:inline-flex;align-items:center;gap:4px">'+(typeof _ralSwatchHTML==='function'?_ralSwatchHTML(alumColor,14):'')+alumColor+'</span></td>'
    + '<td style="font-weight:700">'+t('لون الزجاج')+'</td><td><span style="display:inline-flex;align-items:center;gap:4px">'+(typeof _glassSwatchHTML==='function'?_glassSwatchHTML(glassColor,14):'')+glassColor+'</span></td></tr>'
    + '</table>';

  var sig = typeof _buildSignature === 'function' ? _buildSignature() : '';

  // ── ألمنيوم — دمج المتكرر حسب كود+وصف (نفس fmPrintPurchaseOrder) ──
  var alumMerged = {};
  (fd.aluminum||[]).filter(function(r){return !r.isGroup;}).forEach(function(r){
    var key = (r.code||'') + '||' + (r.desc||r.description||'');
    if(!alumMerged[key]) alumMerged[key] = Object.assign({},r);
    else alumMerged[key].quantity = (parseFloat(alumMerged[key].quantity)||0) + (parseFloat(r.quantity)||0);
  });
  var alumItems = Object.values(alumMerged);
  if(alumItems.length) {
    var alumRows = alumItems.map(function(r,i){
      var desc = r.desc||r.description||'';
      var descKey = (typeof fmDescKey==='function') ? fmDescKey(desc) : desc.trim();
      var code = cat&&cat.codes&&cat.codes[descKey] ? cat.codes[descKey] : (r.code||'-');
      var img = (typeof fmSecImgGet==='function') ? fmSecImgGet(desc) : '';
      var imgCell = '<td style="padding:3px;border:1px solid #ccc;text-align:center;width:55px">'+(img?'<img src="'+img+'" style="width:48px;height:40px;object-fit:contain">':'')+'</td>';
      var barLen = r.barLen ? Math.round(r.barLen/1000*100)/100+' م' : '';
      return '<tr>'
        +'<td style="padding:5px 8px;border:1px solid #ccc;text-align:center">'+(i+1)+'</td>'
        +imgCell
        +'<td style="padding:5px 10px;border:1px solid #ccc">'+desc+'</td>'
        +'<td style="padding:5px 8px;border:1px solid #ccc;text-align:center">'+(r.unit||'بار')+'</td>'
        +'<td style="padding:5px 8px;border:1px solid #ccc;text-align:center;font-weight:700">'+(parseFloat(r.quantity)||0).toLocaleString('en-US')+'</td>'
        +'<td style="padding:5px 8px;border:1px solid #ccc;text-align:center;color:#8e44ad;font-weight:700">'+code+'</td>'
        +'<td style="padding:5px 8px;border:1px solid #ccc;text-align:center">'+barLen+'</td>'
        +'<td style="padding:5px 8px;border:1px solid #ccc"></td>'
        +'</tr>';
    }).join('');
    var alumThead = '<thead><tr style="background:#1a3a5c;color:#fff">'
      +'<th style="padding:6px 8px;border:1px solid #ccc;width:30px">'+t('م')+'</th>'
      +'<th style="padding:6px 4px;border:1px solid #ccc;width:55px;text-align:center">'+t('صورة')+'</th>'
      +'<th style="padding:6px 10px;border:1px solid #ccc">'+t('البيان')+'</th>'
      +'<th style="padding:6px 8px;border:1px solid #ccc;width:60px">'+t('الوحدة')+'</th>'
      +'<th style="padding:6px 8px;border:1px solid #ccc;width:70px">'+t('الكمية')+'</th>'
      +'<th style="padding:6px 8px;border:1px solid #ccc;width:70px">'+t('الرمز')+'</th>'
      +'<th style="padding:6px 8px;border:1px solid #ccc;width:70px">'+t('الطول')+'</th>'
      +'<th style="padding:6px 8px;border:1px solid #ccc;width:80px">'+t('ملاحظات')+'</th>'
      +'</tr></thead>';
    result.alum = colorRow
      + '<div style="background:#1a3a6a;color:#fff;padding:6px 12px;font-weight:700;font-size:12px;border-radius:4px 4px 0 0">'+t('طلب شراء — خامات الألمنيوم')+'</div>'
      + '<table style="width:100%;border-collapse:collapse;font-size:11px">'+alumThead+'<tbody>'+alumRows+'</tbody></table>'
      + sig;
  }

  // ── أكسسوارات — دمج المتكرر حسب الوصف ──
  var accMerged = {};
  (fd.accessories||[]).filter(function(r){return !r.isGroup;}).forEach(function(r){
    var key = r.desc||r.description||'';
    if(!accMerged[key]) accMerged[key] = Object.assign({},r);
    else accMerged[key].quantity = (parseFloat(accMerged[key].quantity)||0) + (parseFloat(r.quantity)||0);
  });
  var accItems = Object.values(accMerged);
  if(accItems.length) {
    var accRows = accItems.map(function(r,i){
      var desc = r.desc||r.description||'';
      return '<tr>'
        +'<td style="padding:5px 8px;border:1px solid #ccc;text-align:center">'+(i+1)+'</td>'
        +'<td style="padding:5px 10px;border:1px solid #ccc">'+desc+'</td>'
        +'<td style="padding:5px 8px;border:1px solid #ccc;text-align:center">'+(r.unit||'حبة')+'</td>'
        +'<td style="padding:5px 8px;border:1px solid #ccc;text-align:center;font-weight:700">'+(parseFloat(r.quantity)||0).toLocaleString('en-US')+'</td>'
        +'<td style="padding:5px 8px;border:1px solid #ccc"></td>'
        +'</tr>';
    }).join('');
    var accThead = '<thead><tr style="background:#1a3a5c;color:#fff">'
      +'<th style="padding:6px 8px;border:1px solid #ccc;width:30px">'+t('م')+'</th>'
      +'<th style="padding:6px 10px;border:1px solid #ccc">'+t('البيان')+'</th>'
      +'<th style="padding:6px 8px;border:1px solid #ccc;width:60px">'+t('الوحدة')+'</th>'
      +'<th style="padding:6px 8px;border:1px solid #ccc;width:70px">'+t('الكمية')+'</th>'
      +'<th style="padding:6px 8px;border:1px solid #ccc;width:80px">'+t('ملاحظات')+'</th>'
      +'</tr></thead>';
    result.acc = colorRow
      + '<div style="background:#1a3a6a;color:#fff;padding:6px 12px;font-weight:700;font-size:12px;border-radius:4px 4px 0 0">'+t('طلب شراء — الأكسسوارات')+'</div>'
      + '<table style="width:100%;border-collapse:collapse;font-size:11px">'+accThead+'<tbody>'+accRows+'</tbody></table>'
      + sig;
  }

  return result;
}

function printTimelineTab() {
  const el=document.getElementById('timelineContainer');
  if(!el||!el.innerHTML.trim()){notify(t('اختر مشروعاً أولاً'),'error');return;}
  const sel=document.getElementById('timelineClientSelect');
  const title=sel?.options?.[sel?.selectedIndex]?.text||t('المخطط الزمني');
  const clone=el.cloneNode(true);
  _prepTimelineForPrint(clone);
  const pa=document.getElementById('printArea');
  const rowCount=clone.querySelectorAll('.tl-row').length;
  pa.innerHTML=_getPrintStyles(rowCount)
    +'<div style="font-size:10px;font-weight:800;color:#1a3a6a;border-bottom:2px solid #1a3a6a;padding-bottom:2px;margin-bottom:3px">'+title+'</div>'
    +'<div>'+clone.innerHTML+'</div>';
  window.print();
  setTimeout(()=>{pa.innerHTML='';renderTimeline();},2500);
}

// ===================== SETTINGS =====================
function switchSettingsTab(tab, ev) {
  document.querySelectorAll('.settings-tab').forEach(t => t.style.display='none');
  // Support both old .tab class and new sidebar .st-nav-item
  document.querySelectorAll('.tab, .st-nav-item').forEach(t => t.classList.remove('active'));
  const tabEl = document.getElementById('settings-'+tab);
  if(tabEl) tabEl.style.display = 'block';
  // Activate the sidebar nav item
  const navItem = document.getElementById('stnav-'+tab);
  if(navItem) navItem.classList.add('active');
  else if(ev && ev.target) ev.target.classList.add('active');
  if(tab === 'sections') renderSectionsSettings();
  if(tab === 'users') { buildNewUserPermGrid(); renderUsersSettings(); }
  if(tab === 'security') renderSecuritySettings();
  if(tab === 'holidays') renderHolidaysSettings();
  if(tab === 'backup') setTimeout(updateBackupInfo,100);
  if(tab === 'formdata') { try{ renderFormDataSettings(); }catch(e){} }
  if(tab === 'drawings') { try{ renderDrawingSettings(); }catch(e){ console.error('renderDrawingSettings:',e); } }
  if(tab === 'vehicles') { try{ renderVehiclesSettings(); }catch(e){} }
  // Translate new content if in English mode
  if(_lang === 'en' && typeof _translateAllText === 'function') {
    setTimeout(_translateAllText, 100);
    setTimeout(_translateAllText, 400);
  }
}

function renderSettings() {
  renderCompaniesSettings();
  renderStagesSettings();
  renderGallerySettings();
  renderRegionsSettings();
  renderColumnsSettings();
  renderLogoGrid();
  renderSectionsSettings();
  
  const { settings } = loadData();
  document.getElementById('showWatermark').checked = settings.watermark || false;
  document.getElementById('showLogos').checked = settings.showLogos !== false;
}

// ═══ HOLIDAYS & DELIVERY SETTINGS ═══
function renderHolidaysSettings() {
  // Load delivery settings
  const ds = _getDeliverySettings();
  const skipF = document.getElementById('skipFridaysToggle');
  const skipH = document.getElementById('skipHolidaysToggle');
  if(skipF) skipF.checked = ds.skipFridays !== false;
  if(skipH) skipH.checked = ds.skipHolidays !== false;

  // Load holidays
  let holidays = [];
  try {
    const raw = localStorage.getItem('pm_holidays');
    if(raw) holidays = JSON.parse(raw);
  } catch(e) {}
  if(!holidays.length) holidays = typeof DEFAULT_HOLIDAYS !== 'undefined' ? [...DEFAULT_HOLIDAYS] : [];

  // Load holiday names
  let holidayNames = {};
  try { const raw = localStorage.getItem('pm_holiday_names'); if(raw) holidayNames = JSON.parse(raw); } catch(e) {}

  const el = document.getElementById('holidaysList');
  if(!el) return;
  const sorted = [...holidays].sort();
  el.innerHTML = sorted.length === 0
    ? '<div style="text-align:center;padding:20px;color:var(--text2)">'+t('لا توجد عطل مسجلة')+'</div>'
    : '<div style="font-size:12px;color:var(--text2);margin-bottom:8px">'+t('إجمالي')+': <strong>'+sorted.length+' '+t('يوم عطلة')+'</strong></div>'
      + sorted.map(h => {
        const d = new Date(h);
        const dayName = d.toLocaleDateString('ar-SA',{weekday:'long'});
        const dateFmt = d.toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'});
        const name = holidayNames[h] || '';
        return `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--surface2);border-radius:6px;margin-bottom:4px;border:1px solid var(--border)">
          <span style="font-size:12px;flex:1">${dateFmt} (${dayName}) ${name?'— <strong style="color:#dc2626">'+name+'</strong>':''}</span>
          <button class="btn btn-sm btn-danger" onclick="removeHoliday('${h}')" style="font-size:10px;padding:2px 8px">✕</button>
        </div>`;
      }).join('');
}

function saveDeliverySettings() {
  const settings = {
    skipFridays: document.getElementById('skipFridaysToggle')?.checked !== false,
    skipHolidays: document.getElementById('skipHolidaysToggle')?.checked !== false
  };
  localStorage.setItem('pm_delivery_settings', JSON.stringify(settings));
  try { _pending['pm_delivery_settings'] = JSON.stringify(settings); clearTimeout(_stimer); _stimer = setTimeout(_flush, 800); } catch(e) {}
  notify(t('تم حفظ إعدادات حساب المدة'));
}

function addHoliday() {
  const dateEl = document.getElementById('newHolidayDate');
  const nameEl = document.getElementById('newHolidayName');
  if(!dateEl || !dateEl.value) { notify(t('اختر تاريخ'),'error'); return; }

  let holidays = [];
  try { const raw = localStorage.getItem('pm_holidays'); if(raw) holidays = JSON.parse(raw); } catch(e) {}
  if(!holidays.length) holidays = typeof DEFAULT_HOLIDAYS !== 'undefined' ? [...DEFAULT_HOLIDAYS] : [];

  if(holidays.includes(dateEl.value)) { notify(t('هذا التاريخ موجود بالفعل'),'error'); return; }
  holidays.push(dateEl.value);
  localStorage.setItem('pm_holidays', JSON.stringify(holidays));

  if(nameEl?.value) {
    let names = {};
    try { const raw = localStorage.getItem('pm_holiday_names'); if(raw) names = JSON.parse(raw); } catch(e) {}
    names[dateEl.value] = nameEl.value;
    localStorage.setItem('pm_holiday_names', JSON.stringify(names));
  }

  try { _pending['pm_holidays'] = JSON.stringify(holidays); clearTimeout(_stimer); _stimer = setTimeout(_flush, 800); } catch(e) {}
  dateEl.value = ''; if(nameEl) nameEl.value = '';
  renderHolidaysSettings();
  notify(t('تم إضافة يوم العطلة'));
}

function addHolidayRange() {
  const startEl = document.getElementById('holidayRangeStart');
  const endEl = document.getElementById('holidayRangeEnd');
  const nameEl = document.getElementById('holidayRangeName');
  if(!startEl?.value || !endEl?.value) { notify(t('حدد بداية ونهاية الفترة'),'error'); return; }

  let holidays = [];
  try { const raw = localStorage.getItem('pm_holidays'); if(raw) holidays = JSON.parse(raw); } catch(e) {}
  if(!holidays.length) holidays = typeof DEFAULT_HOLIDAYS !== 'undefined' ? [...DEFAULT_HOLIDAYS] : [];

  let names = {};
  try { const raw = localStorage.getItem('pm_holiday_names'); if(raw) names = JSON.parse(raw); } catch(e) {}

  const start = new Date(startEl.value);
  const end = new Date(endEl.value);
  let count = 0;
  while(start <= end) {
    const ds = start.toISOString().slice(0,10);
    if(!holidays.includes(ds)) { holidays.push(ds); count++; }
    if(nameEl?.value) names[ds] = nameEl.value;
    start.setDate(start.getDate() + 1);
  }

  localStorage.setItem('pm_holidays', JSON.stringify(holidays));
  localStorage.setItem('pm_holiday_names', JSON.stringify(names));
  try { _pending['pm_holidays'] = JSON.stringify(holidays); _pending['pm_holiday_names'] = JSON.stringify(names); clearTimeout(_stimer); _stimer = setTimeout(_flush, 800); } catch(e) {}

  startEl.value = ''; endEl.value = ''; if(nameEl) nameEl.value = '';
  renderHolidaysSettings();
  notify(t('تم إضافة') + ' ' + count + ' ' + t('يوم عطلة'));
}

function removeHoliday(dateStr) {
  let holidays = [];
  try { const raw = localStorage.getItem('pm_holidays'); if(raw) holidays = JSON.parse(raw); } catch(e) {}
  holidays = holidays.filter(h => h !== dateStr);
  localStorage.setItem('pm_holidays', JSON.stringify(holidays));
  try { _pending['pm_holidays'] = JSON.stringify(holidays); clearTimeout(_stimer); _stimer = setTimeout(_flush, 800); } catch(e) {}
  renderHolidaysSettings();
  notify(t('تم حذف يوم العطلة'));
}

function renderCompaniesSettings() {
  const { companies, companyProfiles } = loadData();
  document.getElementById('companiesList').innerHTML = companies.map((c,i) => {
    const prof = companyProfiles[c] || {};
    return `
    <div style="background:var(--surface2);border-radius:10px;padding:14px;margin-bottom:12px;border:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div style="font-size:13px;font-weight:700;color:var(--accent);flex:1">${c}</div>
        <button class="btn btn-sm btn-danger" onclick="removeCompany(${i})">🗑️ ${t('حذف')}</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        <div><div class="form-label">${t('اسم النظام')}</div>
          <input value="${c}" onchange="updateCompany(${i},this.value)" placeholder="${t('اسم يستخدمه النظام')}">
        </div>
        <div><div class="form-label">${t('الاسم بالعربي (للطباعة)')}</div>
          <input value="${prof.nameAr||''}" onchange="updateCompanyProfile('${c}','nameAr',this.value)" placeholder="${t('مثال: مجموعة السلطان')}">
        </div>
        <div><div class="form-label">${t('الاسم بالإنجليزي (للطباعة)')}</div>
          <input value="${prof.nameEn||''}" onchange="updateCompanyProfile('${c}','nameEn',this.value)" placeholder="Example: Al Sultan Group">
        </div>
      </div>
    </div>`;
  }).join('');
}

function updateCompanyProfile(companyName, field, value) {
  const d = loadData();
  if(!d.companyProfiles[companyName]) d.companyProfiles[companyName] = {};
  d.companyProfiles[companyName][field] = value;
  localStorage.setItem('pm_co_profiles', JSON.stringify(d.companyProfiles));
}

function addCompany() {
  const d = loadData();
  d.companies.push(t('شركة جديدة'));
  localStorage.setItem('pm_companies', JSON.stringify(d.companies));
  renderCompaniesSettings();
}
function updateCompany(i,v) {
  const d = loadData();
  d.companies[i] = v;
  localStorage.setItem('pm_companies', JSON.stringify(d.companies));
}
function removeCompany(i) {
  const d = loadData();
  d.companies.splice(i,1);
  localStorage.setItem('pm_companies', JSON.stringify(d.companies));
  renderCompaniesSettings();
}

function renderGallerySettings() {
  const { galleries } = loadData();
  document.getElementById('galleryList').innerHTML = galleries.map((g,i) => `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      <input value="${g}" id="gallery_${i}" style="flex:1" onchange="updateGallery(${i},this.value)">
      <button class="btn btn-sm btn-danger" onclick="removeGallery(${i})">🗑️</button>
    </div>
  `).join('');
}
function addGallery() {
  const d = loadData();
  d.galleries.push(t('معرض جديد'));
  localStorage.setItem('pm_galleries', JSON.stringify(d.galleries));
  renderGallerySettings();
}
function updateGallery(i,v) {
  const d = loadData(); d.galleries[i]=v; localStorage.setItem('pm_galleries', JSON.stringify(d.galleries));
}
function removeGallery(i) {
  const d = loadData(); d.galleries.splice(i,1); localStorage.setItem('pm_galleries', JSON.stringify(d.galleries)); renderGallerySettings();
}

function renderRegionsSettings() {
  const { regions } = loadData();
  const el = document.getElementById('regionsList');
  if(!el) return;
  el.innerHTML = regions.map((r,i) => `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      <input value="${r}" style="flex:1" onchange="updateRegion(${i},this.value)">
      <button class="btn btn-sm btn-danger" onclick="removeRegion(${i})">🗑️</button>
    </div>
  `).join('');
}
function addRegion() {
  const d = loadData();
  if(!d.regions) d.regions = [...DEFAULT_REGIONS];
  d.regions.push(t('منطقة جديدة'));
  localStorage.setItem('pm_regions', JSON.stringify(d.regions));
  renderRegionsSettings();
}
function updateRegion(i,v) {
  const d = loadData(); if(!d.regions) d.regions=[...DEFAULT_REGIONS]; d.regions[i]=v; localStorage.setItem('pm_regions', JSON.stringify(d.regions));
}
function removeRegion(i) {
  const d = loadData(); if(!d.regions) d.regions=[...DEFAULT_REGIONS]; d.regions.splice(i,1); localStorage.setItem('pm_regions', JSON.stringify(d.regions)); renderRegionsSettings();
}

function renderStagesSettings() {
  const { stages } = loadData();
  const total = stages.reduce((s,x)=>s+(x.pct||0),0);
  document.getElementById('totalPercent').textContent = total + '%';
  
  document.getElementById('stagesList').innerHTML = stages.map((s,i) => `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      <span style="color:var(--text2);font-size:12px;min-width:24px">${i+1}</span>
      <input value="${s.name}" style="flex:1" onchange="updateStage(${i},'name',this.value)">
      <input type="number" value="${s.pct}" min="0" max="100" style="width:70px" onchange="updateStage(${i},'pct',+this.value)">
      <span style="color:var(--text2);font-size:12px">%</span>
      <button class="btn btn-sm btn-danger btn-icon" onclick="removeStage(${i})">🗑️</button>
    </div>
  `).join('');
}
function addStage() {
  const d = loadData();
  d.stages.push({ id: Date.now(), name:t('مرحلة جديدة'), pct:0 });
  localStorage.setItem('pm_stages', JSON.stringify(d.stages));
  renderStagesSettings();
}
function updateStage(i, field, val) {
  const d = loadData(); d.stages[i][field]=val; localStorage.setItem('pm_stages', JSON.stringify(d.stages));
  const total = d.stages.reduce((s,x)=>s+(x.pct||0),0);
  document.getElementById('totalPercent').textContent = total+'%';
}
function removeStage(i) {
  const d = loadData(); d.stages.splice(i,1); localStorage.setItem('pm_stages', JSON.stringify(d.stages)); renderStagesSettings();
}

function renderColumnsSettings() {
  const { columns } = loadData();
  document.getElementById('columnsList').innerHTML = `
    <div style="display:grid;grid-template-columns:40px 40px 40px 1fr 1fr 80px 60px;gap:8px;align-items:center;padding:6px 10px;margin-bottom:4px;font-size:12px;font-weight:700;color:var(--accent)">
      <div>${t('ترتيب')}</div><div></div><div>${t('إظهار')}</div><div>${t('اسم العمود')}</div><div>${t('المعرف')} (ID)</div><div>${t('نوع')}</div><div></div>
    </div>
    ${columns.map((c,i) => `
    <div style="display:grid;grid-template-columns:40px 40px 40px 1fr 1fr 80px 60px;gap:8px;align-items:center;padding:8px 10px;margin-bottom:6px;background:var(--surface2);border-radius:8px;border:1px solid var(--border)">
      <div style="display:flex;flex-direction:column;gap:2px">
        <button class="btn btn-sm btn-secondary btn-icon" style="padding:2px 6px;font-size:10px" onclick="moveColumn(${i},-1)" ${i===0?'disabled':''}>▲</button>
        <button class="btn btn-sm btn-secondary btn-icon" style="padding:2px 6px;font-size:10px" onclick="moveColumn(${i},1)" ${i===columns.length-1?'disabled':''}>▼</button>
      </div>
      <div style="text-align:center;color:var(--text2);font-size:12px">${i+1}</div>
      <div style="text-align:center">
        <input type="checkbox" ${c.show?'checked':''} ${c.required?'disabled title="'+t('إلزامي')+'"':''} onchange="toggleColumn('${c.id}',this.checked)" style="width:16px;height:16px;cursor:pointer">
      </div>
      <input value="${c.label}" style="font-size:13px" onchange="updateColumnLabel('${c.id}',this.value)">
      <div style="font-size:11px;color:var(--text2);padding:8px 10px;background:var(--surface3);border-radius:6px;font-family:monospace;overflow:hidden;text-overflow:ellipsis">${c.id}${c.required?' <span style="color:var(--accent3)">*</span>':''}</div>
      <select onchange="updateColumnType('${c.id}',this.value)" style="font-size:12px">
        <option value="text" ${(!c.type||c.type==='text')?'selected':''}>${t('نص')}</option>
        <option value="number" ${c.type==='number'?'selected':''}>${t('رقم')}</option>
        <option value="date" ${c.type==='date'?'selected':''}>${t('تاريخ')}</option>
        <option value="select" ${c.type==='select'?'selected':''}>${t('قائمة')}</option>
        <option value="calc" ${c.type==='calc'?'selected':''}>${t('محسوب')}</option>
      </select>
      <div style="text-align:center">
        ${!c.required ? `<button class="btn btn-sm btn-danger btn-icon" onclick="removeColumn('${c.id}')" title="${t('حذف')}">🗑️</button>` : '<span style="font-size:10px;color:var(--accent3)">'+t('ثابت')+'</span>'}
      </div>
    </div>
  `).join('')}
    <div style="margin-top:16px;padding:14px;background:var(--surface2);border-radius:10px;border:2px dashed var(--border)">
      <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:10px">➕ ${t('إضافة عمود جديد')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 80px auto;gap:8px;align-items:end">
        <div><div class="form-label">${t('اسم العمود (للعرض)')}</div><input id="newColLabel" placeholder="${t('مثال: رقم العقد')}"></div>
        <div><div class="form-label">${t('المعرف (بالإنجليزية)')}</div><input id="newColId" placeholder="${t('مثال')}: contractNo"></div>
        <div><div class="form-label">${t('النوع')}</div>
          <select id="newColType">
            <option value="text">${t('نص')}</option>
            <option value="number">${t('رقم')}</option>
            <option value="date">${t('تاريخ')}</option>
            <option value="select">${t('قائمة')}</option>
          </select>
        </div>
        <button class="btn btn-success" onclick="addCustomColumn()" style="margin-bottom:1px">✅ ${t('إضافة')}</button>
      </div>
    </div>
  `;
}

function updateColumnLabel(id, label) {
  const d = loadData();
  const col = d.columns.find(c => c.id === id);
  if(col) { col.label = label; localStorage.setItem('pm_columns', JSON.stringify(d.columns)); }
}

function updateColumnType(id, type) {
  const d = loadData();
  const col = d.columns.find(c => c.id === id);
  if(col) { col.type = type; localStorage.setItem('pm_columns', JSON.stringify(d.columns)); }
}

function moveColumn(i, dir) {
  const d = loadData();
  const j = i + dir;
  if(j < 0 || j >= d.columns.length) return;
  [d.columns[i], d.columns[j]] = [d.columns[j], d.columns[i]];
  localStorage.setItem('pm_columns', JSON.stringify(d.columns));
  renderColumnsSettings();
  renderTable();
}

function addCustomColumn() {
  const label = document.getElementById('newColLabel').value.trim();
  let id = document.getElementById('newColId').value.trim().replace(/\s+/g,'_');
  const type = document.getElementById('newColType').value;
  if(!label) { notify('⚠️ ' + t('أدخل اسم العمود'), 'error'); return; }
  if(!id) id = 'col_' + Date.now();
  const d = loadData();
  if(d.columns.find(c => c.id === id)) { notify('⚠️ ' + t('المعرف موجود مسبقاً، غيّر المعرف'), 'error'); return; }
  d.columns.push({ id, label, type, show: true, custom: true });
  localStorage.setItem('pm_columns', JSON.stringify(d.columns));
  renderColumnsSettings();
  notify(`✅ ${t('تم إضافة عمود')} "${label}"`);
}

function removeColumn(id) {
  if(!confirm(t('هل تريد حذف هذا العمود؟'))) return;
  const d = loadData();
  d.columns = d.columns.filter(c => c.id !== id);
  localStorage.setItem('pm_columns', JSON.stringify(d.columns));
  renderColumnsSettings();
  renderTable();
  notify(t('تم حذف العمود'));
}

function toggleColumn(id, show) {
  const d = loadData();
  const col = d.columns.find(c => c.id === id);
  if(col) col.show = show;
  localStorage.setItem('pm_columns', JSON.stringify(d.columns));
}

function renderLogoGrid() {
  document.getElementById('logoGrid').innerHTML = Object.entries(LOGOS).map(([key,src]) => `
    <div class="logo-option" onclick="selectDocLogo('${key}')">
      <img src="${src}" alt="${LOGO_NAMES[key]}">
      <div class="lname">${LOGO_NAMES[key]}</div>
    </div>
  `).join('');
}
function selectDocLogo(key) {
  const docLogoSel = document.getElementById('docLogo');
  if(docLogoSel) { docLogoSel.value = key; previewDoc(); }
  notify(t('تم اختيار شعار') + ' ' + LOGO_NAMES[key]);
}

function addCustomLogo(input) {
  const file = input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const key = 'custom_' + Date.now();
    const name = prompt(t('اسم الشعار:'), file.name.replace(/\.[^.]+$/,'')) || t('شعار مخصص');
    LOGOS[key] = e.target.result;
    LOGO_NAMES[key] = name;
    // Save custom logos
    const customs = JSON.parse(localStorage.getItem('pm_custom_logos')||'{}');
    customs[key] = { src: e.target.result, name: name };
    localStorage.setItem('pm_custom_logos', JSON.stringify(customs));
    renderLogoGrid();
    // Update doc logo dropdown
    const docLogoSel = document.getElementById('docLogo');
    if(docLogoSel) docLogoSel.innerHTML += '<option value="'+key+'">'+name+'</option>';
    notify(t('تم إضافة الشعار') + ': ' + name);
  };
  reader.readAsDataURL(file);
  input.value = '';
}

// Load custom logos on start
try {
  const customs = JSON.parse(localStorage.getItem('pm_custom_logos')||'{}');
  Object.entries(customs).forEach(([key,data]) => {
    LOGOS[key] = data.src;
    LOGO_NAMES[key] = data.name;
  });
} catch(e){}

// ═══ SIGNATURE ═══
function uploadSignature(input) {
  var file = input.files[0]; if(!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    localStorage.setItem('pm_signature', e.target.result);
    renderSignaturePreview();
    notify(t('✅ تم حفظ التوقيع'));
  };
  reader.readAsDataURL(file);
  input.value = '';
}
function removeSignature() {
  localStorage.removeItem('pm_signature');
  renderSignaturePreview();
  notify(t('تم حذف التوقيع'));
}
function renderSignaturePreview() {
  var el = document.getElementById('signaturePreview'); if(!el) return;
  var sig = localStorage.getItem('pm_signature');
  if(sig) {
    el.innerHTML = '<img src="'+sig+'" style="max-height:70px;max-width:180px;object-fit:contain">';
    el.style.borderStyle = 'solid';
    el.style.borderColor = 'var(--accent)';
  } else {
    el.innerHTML = '<span style="color:var(--text2);font-size:12px">'+t('لا يوجد توقيع')+'</span>';
    el.style.borderStyle = 'dashed';
    el.style.borderColor = 'var(--border)';
  }
}
function getSignatureHTML() {
  var sig = localStorage.getItem('pm_signature');
  if(!sig) return '';
  return '<img src="'+sig+'" style="max-height:40px;max-width:120px;object-fit:contain;margin-top:-2px">';
}
// Render on page load
try { setTimeout(renderSignaturePreview, 500); } catch(e){}

function saveSettings() {
  const d = loadData();
  d.settings.showLogos = document.getElementById('showLogos')?.checked !== false;
  localStorage.setItem('pm_settings', JSON.stringify(d.settings));
}

function toggleWatermark() {
  const show = document.getElementById('showWatermark').checked;
  const d = loadData(); d.settings.watermark = show; localStorage.setItem('pm_settings', JSON.stringify(d.settings));
  document.getElementById('watermarkEl').style.display = show ? 'block' : 'none';
}

// ===================== DOCUMENTS =====================
function renderDocProjects() {
  const { projects } = loadData();
  const sel = document.getElementById('docProject');
  if(sel) sel.innerHTML = '<option value="">-- '+t('اختر العميل')+' --</option>' + projects.map(p => `<option value="${p.id}">${p.name}${p.contractNo ? ' | '+p.contractNo : ''}</option>`).join('');
}

// ══ Excel Export — جدول المشاريع ════════════════════════
async function exportProjectsExcel() {
  await _loadServerToLS();
  const {projects, columns} = loadData();
  const search        = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const filterStatus  = document.getElementById('filterStatus')?.value  || '';
  const filterCompany = document.getElementById('filterCompany')?.value || '';

  // نفس فلتر renderTable
  const cu = getCurrentUser();
  const userColPerms = (!cu || cu.isAdmin) ? null : new Set(cu.perms||[]);
  const visibleCols = columns.filter(col => {
    if(!col.show) return false;
    if(!userColPerms) return true;
    const pk='col_'+col.id||col.key;
    if(typeof ALL_PERMS!=='undefined'&&ALL_PERMS[pk]) return userColPerms.has(pk);
    return true;
  });

  let rows = projects.filter(p => {
    const status = calcStatusFromStage(p.stage);
    const matchSearch = !search || Object.values(p).some(v=>String(v).toLowerCase().includes(search));
    const matchStatus = !filterStatus || status === filterStatus;
    const matchCompany = !filterCompany || p.company === filterCompany;
    return matchSearch && matchStatus && matchCompany;
  });

  // الأعمدة المالية
  const numKeys = new Set(['contractValue','extractValue','downPayment','materialsValue','materialsPurchased','opsValue','alumValue','glassValue','progress','productionValue','remaining']);

  // بناء XLS
  let xml = '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
  xml += '<Styles>';
  xml += '<Style ss:ID="h"><Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="10"/><Interior ss:Color="#1a3a6a" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>';
  xml += '<Style ss:ID="o"><Font ss:Size="10"/><Alignment ss:Horizontal="Center"/></Style>';
  xml += '<Style ss:ID="e"><Font ss:Size="10"/><Interior ss:Color="#f0f4ff" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>';
  xml += '<Style ss:ID="n"><Font ss:Size="10"/><NumberFormat ss:Format="#,##0"/><Alignment ss:Horizontal="Center"/></Style>';
  xml += '<Style ss:ID="ne"><Font ss:Size="10"/><NumberFormat ss:Format="#,##0"/><Interior ss:Color="#f0f4ff" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>';
  xml += '<Style ss:ID="t"><Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="10"/><Interior ss:Color="#1a3a6a" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>';
  xml += '</Styles>';
  xml += '<Worksheet ss:Name="'+t('المشاريع')+'"><Table>';

  // عرض الأعمدة
  xml += '<Column ss:Width="25"/>'; // م
  visibleCols.forEach(col => {
    const w = numKeys.has(col.id||col.key) ? 90 : (col.id||col.key==='name'?130:80);
    xml += `<Column ss:Width="${w}"/>`;
  });
  xml += '<Column ss:Width="70"/>'; // الحالة

  // رأس الجدول
  xml += '<Row ss:Height="24"><Cell ss:StyleID="h"><Data ss:Type="String">'+t('م')+'</Data></Cell>';
  visibleCols.forEach(col => {
    xml += `<Cell ss:StyleID="h"><Data ss:Type="String">${col.label||col.id||col.key}</Data></Cell>`;
  });
  xml += '<Cell ss:StyleID="h"><Data ss:Type="String">'+t('الحالة')+'</Data></Cell></Row>';

  // البيانات
  rows.forEach((p, i) => {
    const isEven = i%2 === 1;
    xml += `<Row ss:Height="18"><Cell ss:StyleID="${isEven?'e':'o'}"><Data ss:Type="Number">${i+1}</Data></Cell>`;
    visibleCols.forEach(col => {
      const cid = col.id||col.key;
      let val = '';
      if(cid === 'productionValue'){
        const logs = p.productionLog||[];
        val = logs.reduce((s,e)=>s+(+e.production||0),0);
      } else if(cid === 'remaining'){
        val = (parseFloat(p.contractValue)||0) - (parseFloat(p.downPayment)||0);
      } else if(cid === 'status'){
        val = calcStatusFromStage(p.stage)||'-';
      } else {
        val = p[cid] ?? '';
      }
      const isNum = numKeys.has(col.id||col.key) && val !== '' && !isNaN(val);
      const style = isNum ? (isEven?'ne':'n') : (isEven?'e':'o');
      const type = isNum ? 'Number' : 'String';
      const safeVal = isNum ? (parseFloat(val)||0) : String(val).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      xml += `<Cell ss:StyleID="${style}"><Data ss:Type="${type}">${safeVal}</Data></Cell>`;
    });
    const status = calcStatusFromStage(p.stage)||'-';
    xml += `<Cell ss:StyleID="${isEven?'e':'o'}"><Data ss:Type="String">${status}</Data></Cell></Row>`;
  });

  xml += '</Table></Worksheet></Workbook>';

  const blob = new Blob([xml], {type:'application/vnd.ms-excel;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dt = new Date().toLocaleDateString('ar').replace(/\//g,'-');
  a.href = url; a.download = 'المشاريع_'+dt+'.xls';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  notify('✅ ' + t('تم تصدير') + ' ' + rows.length + ' ' + t('مشروع إلى Excel'));
}

