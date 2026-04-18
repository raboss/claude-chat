// Helper: filter projects by user-level filters (company/region/gallery)
function _userFilteredProjects(projects) {
  const _cu = typeof getCurrentUser==='function' ? getCurrentUser() : null;
  if(!_cu || _cu.isAdmin) return projects;
  let fp = projects;
  if(_cu.filterCompany) fp = fp.filter(p => p.company === _cu.filterCompany);
  if(_cu.filterRegion)  fp = fp.filter(p => (p.region||'') === _cu.filterRegion);
  if(_cu.filterGallery) fp = fp.filter(p => (p.gallery||'') === _cu.filterGallery);
  return fp;
}

function renderReports() {
  const { projects: _rawProjects } = loadData();
  const projects = _userFilteredProjects(_rawProjects);

  // Read current selections BEFORE any DOM changes
  const filterCompany = document.getElementById('rptCompany')?.value || '';
  const filterRegion  = document.getElementById('rptRegion')?.value  || '';

  // ---- Company dropdown (only shows companies visible to this user) ----
  const cSel = document.getElementById('rptCompany');
  if(cSel) {
    const allCos = [...new Set(projects.map(p => p.company).filter(Boolean))];
    cSel.innerHTML = (allCos.length > 1 ? '<option value="">'+t('كل الشركات')+'</option>' : '') +
      allCos.map(c => `<option value="${c}">${c}</option>`).join('');
    cSel.value = filterCompany || (allCos.length === 1 ? allCos[0] : '');
  }

  // ---- Region dropdown — only regions visible to this user ----
  const rSel = document.getElementById('rptRegion');
  if(rSel) {
    const source = filterCompany
      ? projects.filter(p => p.company === filterCompany)
      : projects;
    const allRegions = [...new Set(source.map(p => getRegion(p)).filter(Boolean))];
    rSel.innerHTML = (allRegions.length > 1 ? '<option value="">'+t('كل المناطق')+'</option>' : '') +
      allRegions.map(r => `<option value="${r}">${r}</option>`).join('');
    rSel.value = filterRegion || (allRegions.length === 1 ? allRegions[0] : '');
  }

  let filtered = filterByPeriod(projects);
  if(filterCompany) filtered = filtered.filter(p => p.company === filterCompany);
  if(filterRegion) filtered = filtered.filter(p => getRegion(p) === filterRegion);
  
  // Compute auto-statuses
  const withStatus = filtered.map(p => ({ ...p, autoStatus: calcStatusFromStage(p.stage) }));
  
  // Stats row
  const total = withStatus.length;
  const jaari = withStatus.filter(p => p.autoStatus === 'جاري').length;
  const tarkib = withStatus.filter(p => p.autoStatus === 'تركيب').length;
  const mawqof = withStatus.filter(p => p.autoStatus.includes('موقوف') || p.autoStatus.includes('تأخير')).length;
  const done = withStatus.filter(p => p.autoStatus === 'تم التسليم').length;
  const statsEl = document.getElementById('rptStatsRow');
  if(statsEl) statsEl.innerHTML = `
    <div class="stat-card"><div class="stat-num" style="color:var(--accent)">${total}</div><div class="stat-label">${t('إجمالي المشاريع')}</div></div>
    <div class="stat-card"><div class="stat-num" style="color:var(--accent4)">${jaari}</div><div class="stat-label">${t('جاري التنفيذ')}</div></div>
    <div class="stat-card"><div class="stat-num" style="color:var(--accent2)">${tarkib}</div><div class="stat-label">${t('مرحلة التركيب')}</div></div>
    <div class="stat-card"><div class="stat-num" style="color:var(--accent3)">${mawqof}</div><div class="stat-label">${t('موقوف / تأخير')}</div></div>
  `;
  
  // Status chart data
  const statusCounts = {};
  DEFAULT_STATUSES.forEach(s => statusCounts[s] = 0);
  withStatus.forEach(p => { statusCounts[p.autoStatus] = (statusCounts[p.autoStatus]||0)+1; });
  const statusColors = {
    'جاري':'#4ec94e','تركيب':'#4f8ef7','موقوف - انتظار سداد العميل':'#e85d5d',
    'تأخير من العميل':'#f4a261','تأخير من الشركة':'#e96060','تم التسليم':'#c9a84c',
    'ملغى':'#888','توقيع العقد':'#9b59b6','موقوف':'#e74c3c'
  };
  const nonZero = Object.entries(statusCounts).filter(([,v])=>v>0);
  const compList = [...new Set(filtered.map(p=>p.company).filter(Boolean))];

  // Draw charts after a short delay to ensure Chart.js is loaded and canvas is visible
  function drawCharts() {
    if(typeof Chart === 'undefined') { setTimeout(drawCharts, 300); return; }
    try {
      const ctx1 = document.getElementById('statusChart');
      if(ctx1) {
        if(ctx1._chartInst) { ctx1._chartInst.destroy(); ctx1._chartInst = null; }
        ctx1._chartInst = new Chart(ctx1, {
          type: 'doughnut',
          data: {
            labels: nonZero.map(([k])=>t(k)),
            datasets: [{ data: nonZero.map(([,v])=>v), backgroundColor: nonZero.map(([k])=>statusColors[k]||'#666'), borderWidth:2, borderColor:'#1a1d2e' }]
          },
          options: {
            animation: { duration: 600 },
            plugins: { legend: { position:'bottom', labels: { color: document.body.classList.contains('light-mode')?'#333':'#e8eaf6', font:{family:'Cairo',size:11}, padding:10 } } },
            cutout:'60%'
          }
        });
      }
      const statusList = ['جاري','تركيب','موقوف - انتظار سداد العميل','تأخير من الشركة','تأخير من العميل','تم التسليم','ملغى'];
      const datasets = statusList.map(s => ({
        label: t(s),
        data: compList.map(c => withStatus.filter(p=>p.company===c&&p.autoStatus===s).length),
        backgroundColor: statusColors[s]||'#666',
        stack: 'stack'
      }));
      const ctx2 = document.getElementById('companyChart');
      if(ctx2) {
        if(ctx2._chartInst) { ctx2._chartInst.destroy(); ctx2._chartInst = null; }
        ctx2._chartInst = new Chart(ctx2, {
          type: 'bar',
          data: { labels: compList, datasets },
          options: {
            animation: { duration: 600 },
            plugins: { legend: { position:'bottom', labels: { color: document.body.classList.contains('light-mode')?'#333':'#e8eaf6', font:{family:'Cairo',size:11}, padding:8 } } },
            scales: {
              x: { stacked:true, ticks:{color:document.body.classList.contains('light-mode')?'#444':'#9ca3c8',font:{family:'Cairo'}}, grid:{color:document.body.classList.contains('light-mode')?'rgba(0,0,0,0.08)':'rgba(255,255,255,0.05)'} },
              y: { stacked:true, ticks:{color:document.body.classList.contains('light-mode')?'#444':'#9ca3c8'}, grid:{color:document.body.classList.contains('light-mode')?'rgba(0,0,0,0.08)':'rgba(255,255,255,0.05)'}, beginAtZero:true }
            }
          }
        });
      }
    } catch(e) { console.warn('Chart error:', e); }
  }
  requestAnimationFrame(() => setTimeout(drawCharts, 100));
  
  // Breakdown table: Company × Region
  const allCos = [...new Set(filtered.map(p=>p.company).filter(Boolean))];
  const allRegs = [...new Set(filtered.map(p => getRegion(p)).filter(Boolean))];
  
  let breakHTML = '';
  allCos.forEach(co => {
    const coProjects = withStatus.filter(p => p.company === co);
    breakHTML += `
      <div style="margin-bottom:20px">
        <div style="font-size:14px;font-weight:700;color:var(--accent);padding:8px 12px;background:var(--surface3);border-radius:8px 8px 0 0;border:1px solid var(--border)">${co} — ${coProjects.length} ${t('مشروع')}</div>
        <div class="table-wrap" style="border-radius:0 0 8px 8px">
          <table>
            <thead><tr>
              <th>${t('المنطقة')}</th>
              <th>${t('الإجمالي')}</th>
              ${DEFAULT_STATUSES.map(s=>`<th style="font-size:11px">${t(s)}</th>`).join('')}
            </tr></thead>
            <tbody>
              ${(allRegs.length ? allRegs : ['—']).map(reg => {
                const rp = reg === '—' ? coProjects : coProjects.filter(p => getRegion(p) === reg);
                if(!rp.length && reg !== '—') return '';
                return `<tr>
                  <td><strong>${reg}</strong></td>
                  <td><strong style="color:var(--accent)">${rp.length}</strong></td>
                  ${DEFAULT_STATUSES.map(s => {
                    const cnt = rp.filter(p=>p.autoStatus===s).length;
                    return `<td>${cnt ? `<span class="badge" style="background:${statusColors[s]||'#666'}22;color:${statusColors[s]||'#999'}">${cnt}</span>` : '<span style="color:var(--text2)">-</span>'}</td>`;
                  }).join('')}
                </tr>`;
              }).join('')}
              <tr style="background:var(--surface3)">
                <td><strong>${t('المجموع')}</strong></td>
                <td><strong style="color:var(--accent)">${coProjects.length}</strong></td>
                ${DEFAULT_STATUSES.map(s => {
                  const cnt = coProjects.filter(p=>p.autoStatus===s).length;
                  return `<td><strong>${cnt||'-'}</strong></td>`;
                }).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  });
  
  const breakEl = document.getElementById('rptBreakdownContent');
  if(breakEl) breakEl.innerHTML = breakHTML || '<p style="color:var(--text2);text-align:center;padding:30px">'+t('لا توجد بيانات')+'</p>';
  
  renderTimelineClientSelect();
  
  // Populate client report select
  const crSel = document.getElementById('clientReportSelect');
  if(crSel) {
    const prev = crSel.value;
    crSel.innerHTML = '<option value="">-- '+t('اختر مشروعاً')+' --</option>' +
      filtered.map(p => `<option value="${p.id}">${p.contractNo ? '['+p.contractNo+'] ' : ''}${p.name||t('بدون اسم')} — ${p.company||''}</option>`).join('');
    if(prev) crSel.value = prev;
  }
}

// Keep renderCharts as alias
function renderCharts() { renderReports(); }

// ===================== PRINT REPORT =====================
function printReport() {
  const today = new Date().toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'});
  const breakdown = document.getElementById('rptBreakdownContent')?.innerHTML || '';
  const orientation = document.getElementById('rptOrientation')?.value || 'landscape';

  function doCapture() {
    const c1 = document.getElementById('statusChart');
    const c2 = document.getElementById('companyChart');
    // Try to capture chart — if no data on canvas, toDataURL still works (blank canvas)
    function canvasImg(canvas,label_){
      if(!canvas)return'<p style="color:#888;text-align:center;padding:20px">'+label_+'</p>';
      try{
        // Force canvas dimensions if zero
        if(!canvas.width||canvas.width<10)canvas.width=400;
        if(!canvas.height||canvas.height<10)canvas.height=220;
        return`<img src="${canvas.toDataURL('image/png')}" style="width:100%;max-height:240px;object-fit:contain">`;
      }catch(e){return'<p style="color:#888;text-align:center;padding:20px">'+label_+'</p>';}
    }
    const img1=canvasImg(c1,t('لا توجد بيانات'));
    const img2=canvasImg(c2,t('لا توجد بيانات'));

    const pa = document.getElementById('printArea');
    pa.innerHTML = `<${'style'}>
      @page { size: A4 ${orientation}; margin: 10mm; }
      * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; box-sizing:border-box; }
      body { font-family: Cairo, sans-serif; direction: rtl; color: #111 !important; background:#fff !important; margin:0; }
      table { width:100%; border-collapse:collapse; font-size:11px; margin-bottom:12px; }
      th { background:#1a3a6a !important; color:#fff !important; padding:6px 8px; border:1px solid #aaa; text-align:right; }
      td { padding:5px 8px; border:1px solid #ddd; text-align:right; color:#111 !important; }
      tr:nth-child(even) td { background:#f5f7ff !important; }
      .charts-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:12px 0 18px; }
      .chart-box { border:2px solid #1a3a6a; border-radius:8px; padding:10px; }
      .chart-title { font-size:12px; font-weight:700; color:#1a3a6a; margin-bottom:6px; border-bottom:1px solid #ddd; padding-bottom:4px; }
      h2 { color:#1a3a6a; border-bottom:3px solid #1a3a6a; padding-bottom:8px; margin-bottom:14px; font-size:15px; }
      .section-title { font-size:12px; font-weight:700; color:#1a3a6a; background:#e8f0fe; padding:5px 10px; border-radius:4px; margin:10px 0 6px; }
      .badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:10px; }
    </${'style'}>
    <h2>📊 ${t('تقرير المشاريع')} — ${today}</h2>
    <div class="charts-row">
      <div class="chart-box"><div class="chart-title">📈 ${t('توزيع الحالات')}</div>${img1}</div>
      <div class="chart-box"><div class="chart-title">🏢 ${t('توزيع حسب الشركة')}</div>${img2}</div>
    </div>
    <div class="section-title">📋 ${t('تفاصيل حسب الشركة والمنطقة')}</div>
    ${breakdown}`;
    window.print();
    // Clean up print area after printing (use afterprint event for reliability)
    function _cleanup(){ pa.innerHTML = ''; window.removeEventListener('afterprint', _cleanup); }
    window.addEventListener('afterprint', _cleanup);
    // Fallback timeout
    setTimeout(_cleanup, 5000);
  }
  // Force charts to render then capture
  try { renderReports(); } catch(e) {}
  // Wait for charts to fully render before printing
  setTimeout(function(){
    try { renderReports(); } catch(e) {}
    setTimeout(doCapture, 600);
  }, 400);
}

// ===================== PRODUCTION REPORT =====================
// آلية تقرير الإنتاج الشهري:
// كل مشروع يحفظ productionLog = [{year,month,progress}, ...]
// إنتاج الشهر = (نسبة هذا الشهر - نسبة الشهر السابق) × قيمة المشروع
// لتسجيل شهر: اضغط "تسجيل إنتاج الشهر الحالي"

function openProductionReport(targetYear, targetMonth) {
  const { projects: _rp } = loadData();
  const projects = _userFilteredProjects(_rp);
  const now = new Date();
  const curYear = targetYear || now.getFullYear();
  const curMonth = targetMonth || (now.getMonth() + 1);
  const curMonthDate = new Date(curYear, curMonth - 1, 1);
  const curMonthLabel = curMonthDate.toLocaleDateString('ar-SA',{year:'numeric',month:'long'});

  // بناء خيارات الأشهر (12 شهر للوراء + الشهر الحالي)
  var monthOpts = '';
  for(var mi = 0; mi < 13; mi++) {
    var md = new Date(now.getFullYear(), now.getMonth() - mi, 1);
    var mY = md.getFullYear(), mM = md.getMonth()+1;
    var mLabel = md.toLocaleDateString('ar-SA',{year:'numeric',month:'long'});
    var sel = (mY===curYear && mM===curMonth) ? ' selected' : '';
    monthOpts += '<option value="'+mY+'_'+mM+'"'+sel+'>'+mLabel+'</option>';
  }

  // بناء خيارات العملاء
  const projOpts = projects.map(p => `<option value="${p.id}">${p.name||'-'} ${p.contractNo?'('+p.contractNo+')':''}</option>`).join('');

  // تحميل البيانات المحفوظة للتقرير الحالي
  const PROD_KEY = 'pm_prod_report_'+curYear+'_'+curMonth;
  let savedRows = [];
  try { savedRows = JSON.parse(localStorage.getItem(PROD_KEY)||'[]'); } catch(e){}

  function _buildRow(r, i) {
    const extVal = parseFloat(r.extractValue)||0;
    const contrVal = parseFloat(r.contractValue)||0;
    const baseVal = extVal > 0 ? extVal : contrVal;
    const tax = Math.round(baseVal * 0.15);
    const baseWithTax = baseVal + tax;
    const startPct = parseFloat(r.startPct)||0;
    const curPct = parseFloat(r.currentPct)||0;
    const delta = Math.max(0, curPct - startPct);
    const prodVal = Math.round(baseVal * delta / 100);
    return `<tr id="prodRow_${i}">
      <td style="padding:6px;border:1px solid var(--border);text-align:center;font-weight:700">${i+1}</td>
      <td style="padding:6px;border:1px solid var(--border);font-weight:700">${r.name||'-'}</td>
      <td style="padding:6px;border:1px solid var(--border)">${r.company||'-'}</td>
      <td style="padding:6px;border:1px solid var(--border)">${r.region||'-'}</td>
      <td style="padding:6px;border:1px solid var(--border)">${r.gallery||'-'}</td>
      <td style="padding:6px;border:1px solid var(--border);text-align:center">${baseWithTax?baseWithTax.toLocaleString('en-US'):'-'}</td>
      <td style="padding:6px;border:1px solid var(--border);text-align:center">${r.stage||'-'}</td>
      <td style="padding:6px;border:1px solid var(--border);text-align:center"><input type="number" value="${startPct}" min="0" max="100" style="width:60px;text-align:center" onchange="prodUpdateRow(${i},'startPct',this.value)"></td>
      <td style="padding:6px;border:1px solid var(--border);text-align:center"><input type="number" value="${curPct}" min="0" max="100" style="width:60px;text-align:center" onchange="prodUpdateRow(${i},'currentPct',this.value)"></td>
      <td style="padding:6px;border:1px solid var(--border);text-align:center;font-weight:700;color:var(--accent4)">${delta}%</td>
      <td style="padding:6px;border:1px solid var(--border);text-align:center;font-weight:700;color:var(--accent2)">${prodVal.toLocaleString('en-US')}</td>
      <td style="padding:4px;border:1px solid var(--border);text-align:center"><button class="btn btn-sm btn-danger" onclick="prodRemoveRow(${i})" style="padding:2px 6px;font-size:11px">✕</button></td>
    </tr>`;
  }

  function _buildTotal(rows) {
    let total = 0;
    rows.forEach(function(r){
      const base = (parseFloat(r.extractValue)||0) || (parseFloat(r.contractValue)||0);
      const delta = Math.max(0, (parseFloat(r.currentPct)||0) - (parseFloat(r.startPct)||0));
      total += Math.round(base * delta / 100);
    });
    return total;
  }

  const tableRows = savedRows.map((r,i) => _buildRow(r,i)).join('');
  const total = _buildTotal(savedRows);

  const modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.id = 'prodReportModal';
  modal._rows = savedRows;
  modal._buildRow = _buildRow;
  modal._buildTotal = _buildTotal;
  modal._prodKey = PROD_KEY;
  modal.innerHTML = `
    <div class="modal" style="max-width:1200px;width:98vw;max-height:100vh">
      <div class="modal-header">
        <div class="modal-title">📈 ${t('تقرير الإنتاج الشهري')} — ${curMonthLabel}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-sm btn-primary" onclick="prodSaveReport()">💾 ${t('حفظ')}</button>
          <button class="btn btn-sm btn-warning" onclick="prodPrintReport()">🖨️ ${t('طباعة')}</button>
          <button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest('.modal-bg').remove()">✕</button>
        </div>
      </div>
      <div class="modal-body" style="padding:0">
        <div style="padding:12px 16px;background:var(--surface3);border-bottom:1px solid var(--border);display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <select id="prodMonthSelect" data-no-search style="min-width:180px;font-weight:700" onchange="var v=this.value.split('_');this.closest('.modal-bg').remove();openProductionReport(parseInt(v[0]),parseInt(v[1]))">${monthOpts}</select>
          <select id="prodAddSelect" style="min-width:250px"><option value="">— ${t('اختر عميل لإضافته')} —</option>${projOpts}</select>
          <button class="btn btn-sm btn-success" onclick="prodAddClient()">➕ ${t('إضافة')}</button>
          <span style="margin-right:auto"></span>
          <span id="prodTotalLabel" style="font-weight:800;font-size:14px;color:var(--accent2)">${t('الإجمالي')}: ${total.toLocaleString('en-US')} ${t('ر.س')}</span>
        </div>
        <div style="overflow:auto;height:calc(100vh - 180px);padding:8px">
          <table style="width:100%;border-collapse:collapse;min-width:900px">
            <thead><tr style="background:var(--surface3)">
              <th style="padding:6px;border:1px solid var(--border);width:35px">#</th>
              <th style="padding:6px;border:1px solid var(--border)">${t('العميل')}</th>
              <th style="padding:6px;border:1px solid var(--border)">${t('الشركة')}</th>
              <th style="padding:6px;border:1px solid var(--border)">${t('المنطقة')}</th>
              <th style="padding:6px;border:1px solid var(--border)">${t('المعرض')}</th>
              <th style="padding:6px;border:1px solid var(--border)">${t('القيمة مع الضريبة')}</th>
              <th style="padding:6px;border:1px solid var(--border)">${t('الحالة')}</th>
              <th style="padding:6px;border:1px solid var(--border)">${t('نسبة البداية')}</th>
              <th style="padding:6px;border:1px solid var(--border)">${t('نسبة')} ${curMonthLabel}</th>
              <th style="padding:6px;border:1px solid var(--border)">${t('الفرق')} %</th>
              <th style="padding:6px;border:1px solid var(--border);color:var(--accent2)">${t('قيمة الإنتاج')}</th>
              <th style="padding:6px;border:1px solid var(--border);width:40px">×</th>
            </tr></thead>
            <tbody id="prodTableBody">${tableRows}</tbody>
          </table>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

// إضافة عميل للتقرير
function prodAddClient() {
  var sel = document.getElementById('prodAddSelect');
  if(!sel || !sel.value) { notify(t('اختر عميل'),'error'); return; }
  var pid = sel.value;
  var modal = document.getElementById('prodReportModal');
  if(!modal) return;
  // تحقق ما يكون مضاف مسبقاً
  if(modal._rows.find(function(r){return r.id===pid;})) { notify(t('العميل مضاف مسبقاً'),'error'); return; }
  var d = loadData();
  var p = d.projects.find(function(x){return x.id===pid;});
  if(!p) return;
  var row = {
    id: p.id, name: p.name, company: p.company||'', region: p.region||'',
    gallery: p.gallery||'', contractValue: p.contractValue||'', extractValue: p.extractValue||'',
    stage: p.stage||'', startPct: 0, currentPct: parseFloat(p.progress)||0
  };
  modal._rows.push(row);
  _prodRefreshTable();
  sel.value = '';
}

function prodUpdateRow(i, field, val) {
  var modal = document.getElementById('prodReportModal');
  if(!modal || !modal._rows[i]) return;
  modal._rows[i][field] = parseFloat(val)||0;
  modal._autoSaveDirty = true;
  _prodRefreshTable();
}

function prodRemoveRow(i) {
  var modal = document.getElementById('prodReportModal');
  if(!modal) return;
  modal._rows.splice(i, 1);
  _prodRefreshTable();
}

function _prodRefreshTable() {
  var modal = document.getElementById('prodReportModal');
  if(!modal) return;
  var tbody = document.getElementById('prodTableBody');
  if(tbody) tbody.innerHTML = modal._rows.map(function(r,i){return modal._buildRow(r,i);}).join('');
  var total = modal._buildTotal(modal._rows);
  var lbl = document.getElementById('prodTotalLabel');
  if(lbl) lbl.innerHTML = t('الإجمالي')+': <strong>'+total.toLocaleString('en-US')+'</strong> '+t('ر.س');
}

function prodSaveReport() {
  var modal = document.getElementById('prodReportModal');
  if(!modal) return;
  localStorage.setItem(modal._prodKey, JSON.stringify(modal._rows));
  // مزامنة مع السيرفر
  fetch('/api/data/'+modal._prodKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({value:modal._rows})})
    .then(function(r){return r.json();})
    .then(function(j){
      if(j.ok) { notify(t('✅ تم حفظ تقرير الإنتاج')); modal.remove(); }
      else notify('⚠️ '+t('خطأ بالمزامنة'),'error');
    })
    .catch(function(){ notify('⚠️ '+t('خطأ بالمزامنة'),'error'); });
}

function prodPrintReport() {
  var modal = document.getElementById('prodReportModal');
  if(!modal || !modal._rows.length) { notify(t('لا توجد بيانات'),'error'); return; }
  // استخدم الشهر المختار من القائمة
  var mSel = document.getElementById('prodMonthSelect');
  var mParts = mSel ? mSel.value.split('_') : [];
  var mDate = mParts.length===2 ? new Date(parseInt(mParts[0]), parseInt(mParts[1])-1, 1) : new Date();
  var monthLabel = mDate.toLocaleDateString('ar-SA',{year:'numeric',month:'long'});
  var now = mDate;
  var total = modal._buildTotal(modal._rows);
  var rows = modal._rows.map(function(r,i){
    var base = (parseFloat(r.extractValue)||0) || (parseFloat(r.contractValue)||0);
    var tax = Math.round(base*0.15);
    var startPct = parseFloat(r.startPct)||0;
    var curPct = parseFloat(r.currentPct)||0;
    var delta = Math.max(0, curPct - startPct);
    var prodVal = Math.round(base * delta / 100);
    var bg = i%2===0?'#fff':'#f8fafc';
    return '<tr style="background:'+bg+'"><td style="padding:7px;border:1px solid #cbd5e1;text-align:center;font-weight:700">'+(i+1)+'</td><td style="padding:7px;border:1px solid #cbd5e1;font-weight:700">'+(r.name||'-')+'</td><td style="padding:7px;border:1px solid #cbd5e1">'+(r.company||'-')+'</td><td style="padding:7px;border:1px solid #cbd5e1">'+(r.region||'-')+'</td><td style="padding:7px;border:1px solid #cbd5e1">'+(r.gallery||'-')+'</td><td style="padding:7px;border:1px solid #cbd5e1;text-align:center">'+(base+tax?((base+tax).toLocaleString('en-US')):'-')+'</td><td style="padding:7px;border:1px solid #cbd5e1;text-align:center">'+(r.stage||'-')+'</td><td style="padding:7px;border:1px solid #cbd5e1;text-align:center">'+startPct+'%</td><td style="padding:7px;border:1px solid #cbd5e1;text-align:center">'+curPct+'%</td><td style="padding:7px;border:1px solid #cbd5e1;text-align:center;font-weight:700;color:#16a34a">'+delta+'%</td><td style="padding:7px;border:1px solid #cbd5e1;text-align:center;font-weight:700;color:#1e40af">'+prodVal.toLocaleString('en-US')+'</td></tr>';
  }).join('');
  var pa = document.getElementById('printArea');
  pa.innerHTML = '<style>@page{size:A4 landscape;margin:10mm}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}body{font-family:Cairo,sans-serif;direction:rtl;color:#1e293b;background:#fff;margin:0}table{width:100%;border-collapse:collapse}</style>'+
    '<div style="border-bottom:3px solid #1e3a5f;padding-bottom:10px;margin-bottom:14px"><div style="font-size:20px;font-weight:900;color:#1e3a5f">📈 '+t('تقرير الإنتاج الشهري')+' — '+monthLabel+'</div><div style="font-size:12px;color:#64748b;margin-top:4px">'+t('التاريخ')+': '+now.toLocaleDateString('ar-SA')+ ' | '+t('عدد المشاريع')+': '+modal._rows.length+' | '+t('إجمالي الإنتاج')+': <strong style="color:#1e40af">'+total.toLocaleString('en-US')+' '+t('ر.س')+'</strong></div></div>'+
    '<table><thead><tr style="background:#1e3a5f;color:#fff"><th style="padding:7px;border:1px solid #1e3a5f">#</th><th style="padding:7px;border:1px solid #1e3a5f">'+t('العميل')+'</th><th style="padding:7px;border:1px solid #1e3a5f">'+t('الشركة')+'</th><th style="padding:7px;border:1px solid #1e3a5f">'+t('المنطقة')+'</th><th style="padding:7px;border:1px solid #1e3a5f">'+t('المعرض')+'</th><th style="padding:7px;border:1px solid #1e3a5f">'+t('القيمة + ضريبة')+'</th><th style="padding:7px;border:1px solid #1e3a5f">'+t('الحالة')+'</th><th style="padding:7px;border:1px solid #1e3a5f">'+t('نسبة البداية')+'</th><th style="padding:7px;border:1px solid #1e3a5f">'+t('نسبة')+' '+monthLabel+'</th><th style="padding:7px;border:1px solid #1e3a5f">'+t('الفرق')+'</th><th style="padding:7px;border:1px solid #1e3a5f">'+t('قيمة الإنتاج')+'</th></tr></thead><tbody>'+rows+
    '<tr style="background:#f1f5f9;font-weight:800"><td colspan="10" style="padding:8px;border:1px solid #cbd5e1">'+t('الإجمالي')+'</td><td style="padding:8px;border:1px solid #cbd5e1;text-align:center;color:#1e40af;font-size:14px">'+total.toLocaleString('en-US')+' '+t('ر.س')+'</td></tr></tbody></table>';
  window.print();
  setTimeout(function(){pa.innerHTML='';},2000);
}

function injectDemoProduction(btn) {
  const d = loadData();
  const jan = {year:2026, month:1};
  const feb = {year:2026, month:2};
  // Assign fake jan/feb progress for demo
  const janPcts = [30,20,45,15,60,30,25,50,80,35,10,20,75,20,0];
  const febPcts = [50,35,70,30,95,65,55,75,95,45,20,50,92,30,0];
  d.projects.forEach((p,i) => {
    if(!p.productionLog) p.productionLog = [];
    p.productionLog = p.productionLog.filter(e=>!(e.year===2026&&(e.month===1||e.month===2)));
    p.productionLog.push({...jan, progress: janPcts[i]||Math.min(100,Math.floor(Math.random()*50)+10)});
    p.productionLog.push({...feb, progress: febPcts[i]||Math.min(100,Math.floor(Math.random()*90)+20)});
  });
  localStorage.setItem('pm_projects', JSON.stringify(d.projects));
  localStorage.setItem('pm_prod_demo', '1');
  btn.closest('.modal-bg').remove();
  notify('✅ '+t('تم إضافة بيانات يناير وفبراير التجريبية'));
  openProductionReport();
}

function recordMonthlyProduction(btn) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const d = loadData();
  d.projects.forEach(p => {
    if(!p.productionLog) p.productionLog = [];
    p.productionLog = p.productionLog.filter(e=>!(e.year===year&&e.month===month));
    p.productionLog.push({ year, month, progress: parseFloat(p.progress)||0 });
  });
  localStorage.setItem('pm_projects', JSON.stringify(d.projects));
  btn.closest('.modal-bg').remove();
  const lbl = new Date(year,month-1,1).toLocaleDateString('ar-SA',{year:'numeric',month:'long'});
  notify(`✅ ${t('تم تسجيل إنتاج')} ${d.projects.length} ${t('مشروع')} — ${lbl}`);
  openProductionReport();
}

// ===================== MATERIALS REPORT =====================
function openMaterialsReport(filterStage) {
  const { projects: _rp } = loadData();
  const projects = _userFilteredProjects(_rp);

  // Filter by stage if specified (طلب المواد / طلب الزجاج)
  const matStages = ['طلب الخامات','طلب المواد','طلب الزجاج'];
  let displayProjects = filterStage
    ? projects.filter(p => matStages.includes(p.stage))
    : projects;

  const reportNo = 'MAT-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-5);
  const today = new Date().toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'});

  // Selection state
  const selKey = 'mat_sel_' + Date.now();
  window[selKey] = new Set(displayProjects.map(p=>p.id));

  let totExt=0, totMats=0, totAlum=0, totGlass=0, totOps=0;
  displayProjects.forEach(p=>{
    totExt  += parseFloat(p.extractValue)||0;
    totMats += parseFloat(p.materialsValue)||0;
    totAlum += parseFloat(p.alumValue)||0;
    totGlass+= parseFloat(p.glassValue)||0;
    totOps  += parseFloat(p.opsValue)||0;
  });

  const modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.id = 'matReportModal';
  modal.innerHTML = `
    <div class="modal" style="max-width:1280px">
      <div class="modal-header">
        <div class="modal-title">📦 ${t('بيان المواد المطلوبة')} — ${t('رقم')}: ${reportNo}</div>
        <div style="display:flex;gap:8px;align-items:center">
          <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer">
            <input type="checkbox" id="matFilterStage" ${filterStage?'checked':''} onchange="refreshMaterialsModal('${selKey}',this.checked)">
            ${t('طلب المواد/الزجاج فقط')}
          </label>
          <button class="btn btn-sm btn-success" onclick="exportMaterialsExcel('${selKey}')">📊 Excel</button>
          <button class="btn btn-sm btn-primary" onclick="saveMaterialsReport('${reportNo}','${today}')">💾 ${t('حفظ')}</button>
          <button class="btn btn-sm btn-primary" onclick="printMaterialsReport('${reportNo}','${today}','${selKey}')">🖨️ ${t('طباعة')}</button>
          <button class="btn btn-sm btn-secondary btn-icon" onclick="this.closest('.modal-bg').remove()">✕</button>
        </div>
      </div>
      <div class="modal-body">
        <div style="font-size:12px;color:var(--text2);margin-bottom:10px">
          ✅ ${t('حدد العملاء المطلوبين ثم اطبع | أدخل القيم مباشرة وتُحفظ تلقائياً')}
          ${filterStage ? '<span style="background:var(--accent3)22;color:var(--accent3);padding:2px 8px;border-radius:10px;margin-right:8px">'+t('يعرض فقط: طلب المواد / طلب الزجاج')+'</span>' : ''}
        </div>
        <div id="matReportTableWrap">
          ${buildMaterialsTable(displayProjects, selKey)}
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function buildMaterialsTable(rows, selKey) {
  let totExt=0,totDown=0,totNet=0,totMats=0,totPurchased=0,totMatRem=0,totOps=0,totAlum=0,totGlass=0;
  rows.forEach(p=>{
    const ext=parseFloat(p.extractValue)||0, down=parseFloat(p.downPayment)||0;
    const mats=parseFloat(p.materialsValue)||0, purch=parseFloat(p.materialsPurchased)||0;
    totExt+=ext; totDown+=down; totNet+=ext-down;
    totMats+=mats; totPurchased+=purch; totMatRem+=mats-purch;
    totOps+=parseFloat(p.opsValue)||0;
    totAlum+=parseFloat(p.alumValue)||0;
    totGlass+=parseFloat(p.glassValue)||0;
  });
  const fmt = v => v ? v.toLocaleString('en-US') : '-';
  return `
    <div class="table-wrap">
      <table id="matTable">
        <thead>
          <tr>
            <th style="width:24px"><input type="checkbox" checked onchange="toggleAllMat(this,'${selKey}')"></th>
            <th style="width:22px;font-size:10px">${t('م')}</th>
            <th style="min-width:100px;max-width:130px;font-size:10px">${t('اسم العميل')}</th>
            <th style="font-size:10px">${t('رقم العقد')}</th>
            <th style="font-size:10px">${t('الشركة')}</th>
            <th style="font-size:10px">${t('المنطقة')}</th>
            <th style="font-size:10px">${t('المعرض')}</th>
            <th style="font-size:10px">${t('المرحلة')}</th>
            <th style="font-size:10px">${t('المستخلص')}</th>
            <th style="font-size:10px">${t('الدفعة')}</th>
            <th style="font-size:10px">${t('المتبقي')}</th>
            <th style="font-size:10px">${t('قيمة المواد')}</th>
            <th style="font-size:10px">${t('ما تم شراؤه')}</th>
            <th style="font-size:10px">${t('متبقي المواد')}</th>
            <th style="font-size:10px">${t('عهدة التشغيل')}</th>
            <th style="font-size:10px">${t('الألمنيوم')}</th>
            <th style="font-size:10px">${t('الزجاج')}</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((p,i)=>{
            const ext=parseFloat(p.extractValue)||0, down=parseFloat(p.downPayment)||0;
            const mats=parseFloat(p.materialsValue)||0, purch=parseFloat(p.materialsPurchased)||0;
            const net=ext-down, matRem=mats-purch;
            const isMatStage = ['طلب الخامات','طلب المواد','طلب الزجاج'].some(s=>(p.stage||'').includes(s.replace('طلب ','')));
            return `<tr id="matrow_${p.id}" style="${isMatStage?'background:rgba(201,168,76,0.08)':''}">
              <td style="text-align:center"><input type="checkbox" checked data-id="${p.id}" onchange="updateMatSel('${selKey}','${p.id}',this.checked)"></td>
              <td>${i+1}</td>
              <td><div class="cell-wrap" title="${p.name||''}" style="font-weight:600">${p.name||'-'}</div></td>
              <td>${p.contractNo||'-'}</td><td>${p.company||'-'}</td>
              <td>${p.region||'-'}</td><td>${p.gallery||'-'}</td>
              <td style="font-size:11px;color:${isMatStage?'var(--accent2)':'var(--text2)'}">${p.stage||'-'}</td>
              <td style="white-space:nowrap">${ext ? fmt(ext)+' '+t('ر.س') : '-'}</td>
              <td style="white-space:nowrap">${down ? fmt(down)+' '+t('ر.س') : '-'}</td>
              <td style="white-space:nowrap;color:${net<0?'var(--accent3)':'var(--accent4)'};font-weight:600">${fmt(net)} ${t('ر.س')}</td>
              <td><input type="number" id="matval_${p.id}" value="${p.materialsValue||''}" placeholder="0" style="width:90px;font-size:12px;background:#f0f0f0" readonly></td>
              <td><input type="number" value="${p.materialsPurchased||''}" placeholder="0" style="width:90px;font-size:12px" onchange="saveMatField('${p.id}','materialsPurchased',this.value);updateMatRemCell('${p.id}')"></td>
              <td style="white-space:nowrap;color:var(--accent3);font-weight:600" id="matrem_${p.id}">${matRem ? fmt(matRem)+' '+t('ر.س') : '-'}</td>
              <td><input type="number" value="${p.opsValue||''}" placeholder="0" style="width:90px;font-size:12px" onchange="saveMatField('${p.id}','opsValue',this.value);updateMaterialsValue('${p.id}')"></td>
              <td><input type="number" value="${p.alumValue||''}" placeholder="0" style="width:90px;font-size:12px" onchange="saveMatField('${p.id}','alumValue',this.value);updateMaterialsValue('${p.id}')"></td>
              <td><input type="number" value="${p.glassValue||''}" placeholder="0" style="width:90px;font-size:12px" onchange="saveMatField('${p.id}','glassValue',this.value);updateMaterialsValue('${p.id}')"></td>
            </tr>`;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="background:var(--surface3);font-weight:800;font-size:12px">
            <td colspan="8" style="color:var(--accent)">${t('الإجمالي')} (${rows.length} ${t('مشروع')})</td>
            <td style="color:var(--accent2)">${fmt(totExt)} ${t('ر.س')}</td>
            <td style="color:var(--accent2)">${fmt(totDown)} ${t('ر.س')}</td>
            <td style="color:var(--accent4)">${fmt(totNet)} ${t('ر.س')}</td>
            <td style="color:var(--accent2)">${fmt(totMats)} ${t('ر.س')}</td>
            <td style="color:var(--accent2)">${fmt(totPurchased)} ${t('ر.س')}</td>
            <td style="color:var(--accent3)">${fmt(totMatRem)} ${t('ر.س')}</td>
            <td style="color:var(--accent2)">${fmt(totOps)} ${t('ر.س')}</td>
            <td style="color:var(--accent2)">${fmt(totAlum)} ${t('ر.س')}</td>
            <td style="color:var(--accent2)">${fmt(totGlass)} ${t('ر.س')}</td>
          </tr>
          <tr style="background:#1a3a6a;color:#fff;font-weight:800;font-size:13px">
            <td colspan="14" style="color:#ffd700">${t('إجمالي (عهدة تشغيل + ألمنيوم + زجاج)')}</td>
            <td colspan="3" style="color:#ffd700;font-size:14px">${fmt(totOps+totAlum+totGlass)} ${t('ر.س')}</td>
          </tr>
        </tfoot>
      </table>
    </div>`;
}

function toggleAllMat(cb, selKey) {
  document.querySelectorAll('#matTable input[data-id]').forEach(inp => {
    inp.checked = cb.checked;
    const id = inp.getAttribute('data-id');
    if(cb.checked) window[selKey]?.add(id); else window[selKey]?.delete(id);
  });
}
function updateMatSel(selKey, id, checked) {
  if(!window[selKey]) window[selKey] = new Set();
  if(checked) window[selKey].add(id); else window[selKey].delete(id);
}
function refreshMaterialsModal(selKey, filterStage) {
  const { projects } = loadData();
  const materialStages = ['طلب الخامات','طلب المواد','طلب الزجاج'];
  const displayProjects = filterStage
    ? projects.filter(p => materialStages.some(s => (p.stage||'').includes(s.replace('طلب ',''))))
    : projects;
  window[selKey] = new Set(displayProjects.map(p=>p.id));
  const wrap = document.getElementById('matReportTableWrap');
  if(wrap) wrap.innerHTML = buildMaterialsTable(displayProjects, selKey);
}
function saveMatField(id, field, value) {
  const d = loadData();
  const p = d.projects.find(x=>x.id===id);
  if(p) { p[field]=parseFloat(value)||0; localStorage.setItem('pm_projects',JSON.stringify(d.projects)); }
}
function updateMatRemCell(id) {
  const d = loadData();
  const p = d.projects.find(x=>x.id===id);
  if(!p) return;
  const mats=parseFloat(p.materialsValue)||0, purch=parseFloat(p.materialsPurchased)||0;
  const el = document.getElementById('matrem_'+id);
  if(el) el.textContent = (mats-purch) ? (mats-purch).toLocaleString('en-US')+' '+t('ر.س') : '-';
}
function updateMaterialsValue(id) {
  const d = loadData();
  const p = d.projects.find(x=>x.id===id);
  if(!p) return;
  const ops=parseFloat(p.opsValue)||0, alum=parseFloat(p.alumValue)||0, glass=parseFloat(p.glassValue)||0;
  const total = ops + alum + glass;
  p.materialsValue = total;
  localStorage.setItem('pm_projects',JSON.stringify(d.projects));
  const el = document.getElementById('matval_'+id);
  if(el) el.value = total || '';
  updateMatRemCell(id);
}
function saveMaterialsReport(reportNo, today) {
  // Find the modal body to capture rendered HTML
  const modal = document.querySelector('.modal-bg .modal');
  const body = modal?.querySelector('.modal-body');
  const html = body ? body.innerHTML : '';
  // Build rows for Excel export
  const { projects } = loadData();
  let totalExtract=0,totalMaterials=0,totalOps=0,totalAlum=0,totalGlass=0;
  const rows = projects.map((p,idx)=>{
    const ext=parseFloat(p.extractValue)||0;
    const down=parseFloat(p.downPayment)||0;
    const mats=parseFloat(p.materialsValue)||0;
    const purchased=parseFloat(p.materialsPurchased)||0;
    const ops=parseFloat(p.opsValue)||0;
    const alum=parseFloat(p.alumValue)||0;
    const glass=parseFloat(p.glassValue)||0;
    totalExtract+=ext; totalMaterials+=mats; totalOps+=ops; totalAlum+=alum; totalGlass+=glass;
    return {i:idx+1,name:p.name,contractNo:p.contractNo,company:p.company,region:p.region,
      gallery:p.gallery,ext,down,net:ext-down,mats,purchased,matRemaining:mats-purchased,ops,alum,glass};
  });
  const saved = getSavedReports('materials');
  saved.unshift({reportNo, title:t('بيان المواد')+` — ${today}`, date:today, rowCount:projects.length,
    html, rows, totalExtract, totalMaterials, totalOps, totalAlum, totalGlass});
  setSavedReports('materials', saved.slice(0,30));
  notify('✅ '+t('تم حفظ بيان المواد')+': '+reportNo);
  renderSavedMaterialsList();
  const _mb=modal?modal.closest('.modal-bg'):document.querySelector('.modal-bg');
  if(_mb) _mb.remove();
}
function printMaterialsReport(reportNo, today, selKey) {
  const { projects } = loadData();
  const selIds = window[selKey] ? [...window[selKey]] : projects.map(p=>p.id);
  const rows = projects.filter(p=>selIds.includes(p.id));
  let totOps=0,totAlum=0,totGlass=0,totExt=0,totMats=0;
  rows.forEach(p=>{totOps+=parseFloat(p.opsValue)||0;totAlum+=parseFloat(p.alumValue)||0;totGlass+=parseFloat(p.glassValue)||0;totExt+=parseFloat(p.extractValue)||0;totMats+=parseFloat(p.materialsValue)||0;});
  const fmt=v=>v?v.toLocaleString('en-US'):'-';
  const pa = document.getElementById('printArea');
  pa.innerHTML = `
    <${'style'}>
    @page{size:A3 landscape;margin:5mm}
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}
    html,body{margin:0;padding:0;width:100%}
    body{font-family:Cairo,sans-serif;direction:rtl;font-size:7.5px}
    h2{color:#1a3a6a;border-bottom:2px solid #1a3a6a;padding-bottom:4px;margin:0 0 7px;font-size:12px}
    table{width:100%;border-collapse:collapse;table-layout:fixed}
    th{background:#1a3a6a!important;color:#fff!important;padding:4px 2px;border:1px solid #999;font-size:7.5px;text-align:center;overflow:hidden;word-break:break-word}
    td{padding:3px 2px;border:1px solid #ddd;font-size:7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    tr:nth-child(even)td{background:#f5f7ff!important}
    tfoot tr:first-child td{background:#dbeafe!important;font-weight:700;font-size:7.5px}
    tfoot tr:last-child td{background:#1a3a6a!important;color:#fff!important;font-weight:700;font-size:8px}
    </${'style'}>
    <div style="direction:rtl">
      <h2 style="color:#1a3a6a;border-bottom:3px solid #1a3a6a;padding-bottom:6px;margin-bottom:12px;font-size:14px">
        📦 ${t('بيان المواد المطلوبة')} — ${t('رقم')}: ${reportNo} | ${t('التاريخ')}: ${today}
      </h2>
      <table>
        <thead><tr>
          <th style="width:3%">${t('م')}</th><th style="width:10%">${t('اسم العميل')}</th><th style="width:7%">${t('رقم العقد')}</th><th style="width:7%">${t('الشركة')}</th><th style="width:6%">${t('المنطقة')}</th><th style="width:5%">${t('المعرض')}</th><th style="width:9%">${t('المرحلة')}</th>
          <th style="width:7%">${t('المستخلص')}</th><th style="width:6%">${t('الدفعة')}</th><th style="width:6%">${t('المتبقي')}</th>
          <th style="width:7%">${t('قيمة المواد')}</th><th style="width:6%">${t('تم شراؤه')}</th><th style="width:6%">${t('متبقي مواد')}</th>
          <th style="width:7%">${t('عهدة التشغيل')}</th><th style="width:7%">${t('الألمنيوم')}</th><th style="width:6%">${t('الزجاج')}</th>
        </tr></thead>
        <tbody>
          ${rows.map((p,i)=>{
            const ext=parseFloat(p.extractValue)||0,down=parseFloat(p.downPayment)||0;
            const mats=parseFloat(p.materialsValue)||0,purch=parseFloat(p.materialsPurchased)||0;
            return `<tr>
              <td>${i+1}</td><td style="font-weight:600">${p.name||'-'}</td><td>${p.contractNo||'-'}</td>
              <td>${p.company||'-'}</td><td>${p.region||'-'}</td><td>${p.gallery||'-'}</td><td style="font-size:9px">${p.stage||'-'}</td>
              <td>${fmt(ext)}</td><td>${fmt(down)}</td><td style="font-weight:700">${fmt(ext-down)}</td>
              <td>${fmt(mats)}</td><td>${fmt(purch)}</td><td style="font-weight:700">${fmt(mats-purch)}</td>
              <td>${fmt(parseFloat(p.opsValue)||0)}</td><td>${fmt(parseFloat(p.alumValue)||0)}</td><td>${fmt(parseFloat(p.glassValue)||0)}</td>
            </tr>`;
          }).join('')}
        </tbody>
        <tfoot>
          <tr><td colspan="8">${t('الإجمالي')} (${rows.length} ${t('مشروع')})</td>
            <td>${fmt(totExt)}</td><td></td><td></td>
            <td>${fmt(totMats)}</td><td colspan="2"></td>
            <td>${fmt(totOps)}</td><td>${fmt(totAlum)}</td><td>${fmt(totGlass)}</td>
          </tr>
          <tr><td colspan="13" style="font-size:11px">${t('إجمالي (عهدة تشغيل + ألمنيوم + زجاج)')}</td>
            <td colspan="3" style="font-size:13px">${fmt(totOps+totAlum+totGlass)} ${t('ر.س')}</td>
          </tr>
        </tfoot>
      </table>
    </div>`;
  window.print();
  setTimeout(()=>pa.innerHTML='',1500);
}
function renderClientReport() {
  const id = document.getElementById('clientReportSelect')?.value;
  const el = document.getElementById('clientReportContent');
  if(!el) return;
  if(!id) { el.innerHTML = '<p style="color:var(--text2);text-align:center;padding:30px">'+t('اختر مشروعاً لعرض تقريره')+'</p>'; return; }
  
  const { projects, stages, companyProfiles } = loadData();
  const p = projects.find(x => x.id === id);
  if(!p) return;
  
  const autoStatus = calcStatusFromStage(p.stage);
  const extVal   = parseFloat(p.extractValue)  || 0;
  const contrVal = parseFloat(p.contractValue) || 0;
  const down     = parseFloat(p.downPayment)   || 0;
  const baseVal  = extVal > 0 ? extVal : contrVal;
  const remaining = baseVal - down;
  const prodVal  = Math.round(baseVal * (parseFloat(p.progress)||0) / 100);
  const prof     = companyProfiles?.[p.company] || {};
  const region   = getRegion(p);
  
  // Stage progress for chart
  const stageData = buildStageChartData(p, stages);
  const chartId   = 'clientChart_' + Date.now();
  
  el.innerHTML = `
    <div id="clientReportView">
      <!-- Header summary -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
        <div class="stat-card"><div class="stat-num" style="color:var(--accent);font-size:16px">${p.contractNo||'---'}</div><div class="stat-label">${t('رقم العقد')}</div></div>
        <div class="stat-card"><div class="stat-num" style="color:var(--accent4);font-size:15px">${t(autoStatus)}</div><div class="stat-label">${t('الحالة الحالية')}</div></div>
        <div class="stat-card"><div class="stat-num" style="color:var(--accent2)">${parseFloat(p.progress)||0}%</div><div class="stat-label">${t('نسبة الإنجاز')}</div></div>
        <div class="stat-card"><div class="stat-num" style="color:${remaining<0?'var(--accent3)':'var(--accent4)'};font-size:14px">${remaining.toLocaleString('en-US')}</div><div class="stat-label">${t('المبلغ المتبقي')} (${t('ر.س')})</div></div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <!-- Project Info -->
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:10px;border-bottom:2px solid var(--accent);padding-bottom:6px">📋 ${t('بيانات المشروع')}</div>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <tr style="border-bottom:1px solid var(--border)"><td style="padding:7px;color:var(--text2);width:45%">${t('اسم العميل')}</td><td style="padding:7px;font-weight:600">${p.name||'-'}</td></tr>
            <tr style="border-bottom:1px solid var(--border)"><td style="padding:7px;color:var(--text2)">${t('رقم العقد')}</td><td style="padding:7px;font-weight:600">${p.contractNo||'-'}</td></tr>
            <tr style="border-bottom:1px solid var(--border)"><td style="padding:7px;color:var(--text2)">${t('الشركة')}</td><td style="padding:7px">${p.company||'-'}${prof.nameEn?'<br><span style="font-size:11px;color:var(--text2)">'+prof.nameEn+'</span>':''}</td></tr>
            <tr style="border-bottom:1px solid var(--border)"><td style="padding:7px;color:var(--text2)">${t('المنطقة')}</td><td style="padding:7px">${region||'-'}</td></tr>
            <tr style="border-bottom:1px solid var(--border)"><td style="padding:7px;color:var(--text2)">${t('المعرض')}</td><td style="padding:7px">${p.gallery||'-'}</td></tr>
            <tr style="border-bottom:1px solid var(--border)"><td style="padding:7px;color:var(--text2)">${t('تاريخ العقد')}</td><td style="padding:7px">${p.contractDate||'-'}</td></tr>
            <tr style="border-bottom:1px solid var(--border)"><td style="padding:7px;color:var(--text2)">${t('تاريخ الاعتماد')}</td><td style="padding:7px;${p.approvalDate?'color:#d97706;font-weight:600':''}">${p.approvalDate||'-'}</td></tr>
            <tr style="border-bottom:1px solid var(--border)"><td style="padding:7px;color:var(--text2)">${t('تاريخ جاهزية الموقع')}</td><td style="padding:7px;${p.siteReadyDate?'color:#64748b;font-weight:600':''}">${p.siteReadyDate||'-'}</td></tr>
            <tr style="border-bottom:1px solid var(--border)"><td style="padding:7px;color:var(--text2)">${t('مدة العقد')}</td><td style="padding:7px">${p.contractDuration ? p.contractDuration+' '+t('يوم') : '-'}</td></tr>
            <tr style="border-bottom:1px solid var(--border)"><td style="padding:7px;color:var(--text2)">${t('موعد التسليم')}</td><td style="padding:7px;font-weight:600">${(typeof calcSmartDeliveryDate==='function'?calcSmartDeliveryDate(p):'')||p.deliveryDate||'-'}</td></tr>
            <tr style="border-bottom:1px solid var(--border)"><td style="padding:7px;color:var(--text2)">${t('المرحلة الحالية')}</td><td style="padding:7px;color:var(--accent4);font-weight:600">${p.stage||'-'}</td></tr>
          </table>
          
          <div style="font-size:13px;font-weight:700;color:var(--accent);margin:16px 0 10px;border-bottom:2px solid var(--accent);padding-bottom:6px">💰 ${t('الملخص المالي')}</div>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <tr style="border-bottom:1px solid var(--border)"><td style="padding:7px;color:var(--text2);width:45%">${t('قيمة العقد')}</td><td style="padding:7px;font-weight:600">${contrVal.toLocaleString('en-US')} ${t('ر.س')}</td></tr>
            <tr style="border-bottom:1px solid var(--border)"><td style="padding:7px;color:var(--text2)">${t('قيمة المستخلص')}</td><td style="padding:7px">${extVal ? extVal.toLocaleString('en-US')+' '+t('ر.س') : '-'}</td></tr>
            <tr style="border-bottom:1px solid var(--border)"><td style="padding:7px;color:var(--text2)">${t('الدفعة المقدمة')}</td><td style="padding:7px">${down.toLocaleString('en-US')} ${t('ر.س')}</td></tr>
            <tr style="border-bottom:1px solid var(--border)"><td style="padding:7px;color:var(--text2)">${t('قيمة الإنتاج')}</td><td style="padding:7px;color:var(--accent2);font-weight:600">${prodVal.toLocaleString('en-US')} ${t('ر.س')}</td></tr>
            <tr style="background:var(--surface3)"><td style="padding:7px;font-weight:700">${t('المبلغ المتبقي')}</td><td style="padding:7px;font-weight:800;color:${remaining<0?'var(--accent3)':'var(--accent4)'}">${remaining.toLocaleString('en-US')} ${t('ر.س')}</td></tr>
          </table>
        </div>
        
        <!-- Charts -->
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:10px;border-bottom:2px solid var(--accent);padding-bottom:6px">📊 ${t('مؤشرات المشروع')}</div>
          
          <!-- Progress bar with label -->
          <div style="margin-bottom:20px">
            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2);margin-bottom:6px">
              <span>${t('نسبة الإنجاز الكلية')}</span>
              <span style="font-weight:700;color:var(--accent2)">${parseFloat(p.progress)||0}%</span>
            </div>
            <div style="height:16px;background:var(--surface3);border-radius:8px;overflow:hidden">
              <div style="height:100%;width:${parseFloat(p.progress)||0}%;background:linear-gradient(90deg,var(--accent2),var(--accent4));border-radius:8px;transition:width .6s"></div>
            </div>
          </div>
          
          <!-- Doughnut: financial breakdown -->
          <div style="height:200px;margin-bottom:20px">
            <canvas id="${chartId}_fin"></canvas>
          </div>
          
          <!-- Bar: stage progress -->
          <div style="height:220px">
            <canvas id="${chartId}_stage"></canvas>
          </div>
        </div>
      </div>
      
      ${p.notes ? `<div style="margin-top:16px;padding:12px 16px;background:var(--surface2);border-radius:8px;border-right:4px solid var(--accent);font-size:13px"><strong style="color:var(--accent)">${t('ملاحظات')}:</strong> ${p.notes}</div>` : ''}
    </div>`;
  
  // Render charts after DOM update
  requestAnimationFrame(() => {
    // Financial doughnut
    try {
      const paid = down;
      const prod = Math.max(0, prodVal - down);
      const rem  = Math.max(0, baseVal - prodVal);
      new Chart(document.getElementById(chartId+'_fin'), {
        type: 'doughnut',
        data: {
          labels: [t('الدفعة المقدمة'),t('قيمة الإنتاج الإضافية'),t('المتبقي')],
          datasets: [{ data: [paid, prod, rem],
            backgroundColor: ['#4ec94e','#4f8ef7','#e85d5d'],
            borderColor: '#1a1d2e', borderWidth: 2 }]
        },
        options: {
          plugins: {
            legend: { position:'bottom', labels:{ color: document.body.classList.contains('light-mode')?'#333':'#e8eaf6', font:{family:'Cairo',size:11}, padding:10 } },
            tooltip: { callbacks: { label: ctx => ' '+ctx.parsed.toLocaleString('en-US')+' '+t('ر.س') } }
          },
          cutout: '55%'
        }
      });
    } catch(e){}
    
    // Stage bar chart
    try {
      new Chart(document.getElementById(chartId+'_stage'), {
        type: 'bar',
        data: {
          labels: stageData.map(s => s.name.length>8 ? s.name.slice(0,8)+'…' : s.name),
          datasets: [{
            label: t('نسبة كل مرحلة'),
            data: stageData.map(s => s.pct),
            backgroundColor: stageData.map(s => s.done ? '#4ec94e' : s.current ? '#c9a84c' : '#374369'),
            borderRadius: 4
          }]
        },
        options: {
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => ' '+ctx.parsed+'%' } }
          },
          scales: {
            x: { ticks:{ color:'#9ca3c8', font:{size:9,family:'Cairo'} }, grid:{color:'rgba(255,255,255,0.04)'} },
            y: { ticks:{ color:'#9ca3c8' }, grid:{color:'rgba(255,255,255,0.05)'}, beginAtZero:true, max:100 }
          }
        }
      });
    } catch(e){}
  });
}

function buildStageChartData(p, stages) {
  const currentIdx = stages.findIndex(s => s.name === p.stage);
  let cum = 0;
  return stages.map((s, i) => {
    cum += (s.pct||0);
    return { name: s.name, pct: Math.min(100,cum), done: i < currentIdx, current: i === currentIdx };
  });
}

function printClientReport() {
  const el = document.getElementById('clientReportView');
  if(!el) { notify('⚠️ '+t('اختر مشروعاً أولاً'),'error'); return; }
  const pa = document.getElementById('printArea');
  const st = `<${'style'}>
    @page{size:A4 portrait;margin:10mm}
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}
    body{font-family:Cairo,sans-serif;direction:rtl;color:#222!important;background:#fff!important;margin:0}
    table{border-collapse:collapse;width:100%}
    td,th{padding:6px 8px;border-bottom:1px solid #ddd;font-size:12px;color:#222!important}
    .stat-card{background:#f5f7ff!important;border-radius:8px;padding:12px;text-align:center;border:1px solid #ddd}
    .stat-num{font-size:18px;font-weight:800;color:#1a3a6a!important}
    .stat-label{font-size:11px;color:#555!important;margin-top:4px}
    .grid2,.grid4{display:grid!important}
    .grid2{grid-template-columns:1fr 1fr!important;gap:16px}
    .grid4{grid-template-columns:repeat(4,1fr)!important;gap:10px;margin-bottom:16px}
    img{max-width:100%;height:auto}
    [style*="color:var"]{color:#1a3a6a!important}
    [style*="background:var"]{background:#f5f7ff!important}
  </${'style'}>`;
  // Convert all canvas elements to static images first
  const clone = el.cloneNode(true);
  const canvases = el.querySelectorAll('canvas');
  const cloneCanvases = clone.querySelectorAll('canvas');
  canvases.forEach((cv,i)=>{
    try{
      const img=document.createElement('img');
      img.src=cv.toDataURL('image/png');
      img.style.cssText=cv.style.cssText||'width:100%;max-height:240px;object-fit:contain';
      img.style.background='#fff';
      if(cloneCanvases[i])cloneCanvases[i].replaceWith(img);
    }catch(e){}
  });
  // Fix CSS variables in cloned HTML
  let html=clone.outerHTML;
  const vm={'var(--accent)':'#1a3a6a','var(--accent2)':'#a07800','var(--accent3)':'#c00','var(--accent4)':'#228822','var(--text)':'#222','var(--text2)':'#555','var(--border)':'#ddd','var(--surface2)':'#f5f7ff','var(--surface3)':'#e8f0fe'};
  Object.entries(vm).forEach(([v,r])=>{html=html.split(v).join(r);});
  pa.innerHTML=st+'<div style="direction:rtl">'+html+'</div>';
  window.print();
  setTimeout(()=>pa.innerHTML='',1500);
}

function exportClientReportExcel() {
  const id = document.getElementById('clientReportSelect')?.value;
  if(!id) { notify('⚠️ '+t('اختر مشروعاً'),'error'); return; }
  const { projects } = loadData();
  const p = projects.find(x => x.id === id);
  if(!p || typeof XLSX === 'undefined') { notify('⚠️ '+t('مكتبة Excel غير جاهزة'),'error'); return; }
  
  const extVal   = parseFloat(p.extractValue)||0;
  const contrVal = parseFloat(p.contractValue)||0;
  const down     = parseFloat(p.downPayment)||0;
  const baseVal  = extVal > 0 ? extVal : contrVal;
  
  const wsData = [
    [t('بند'),t('القيمة')],
    [t('اسم العميل'), p.name||''],
    [t('رقم العقد'), p.contractNo||''],
    [t('الشركة'), p.company||''],
    [t('المنطقة'), getRegion(p)||''],
    [t('المعرض'), p.gallery||''],
    [t('الحالة'), calcStatusFromStage(p.stage)],
    [t('المرحلة الحالية'), p.stage||''],
    [t('نسبة الإنجاز'), (parseFloat(p.progress)||0)+'%'],
    [t('تاريخ العقد'), p.contractDate||''],
    [t('مدة العقد'), p.contractDuration ? p.contractDuration+' '+t('يوم') : ''],
    [t('موعد التسليم'), p.deliveryDate||''],
    [''],
    [t('قيمة العقد'), contrVal],
    [t('قيمة المستخلص'), extVal||''],
    [t('الدفعة المقدمة'), down],
    [t('قيمة الإنتاج'), Math.round(baseVal*(parseFloat(p.progress)||0)/100)],
    [t('المبلغ المتبقي'), baseVal-down],
    [''],
    [t('ملاحظات'), p.notes||'']
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{wch:25},{wch:30}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, t('تقرير المشروع'));
  XLSX.writeFile(wb, `تقرير_${p.contractNo||p.name||'مشروع'}.xlsx`);
  notify('✅ '+t('تم تصدير التقرير'));
}

// ===================== SAVED REPORTS PAGE =====================
function switchSavedTab(tab, ev) {
  ['production','materials','weekly'].forEach(t=>{
    const el=document.getElementById('saved-'+t);
    if(el)el.style.display=(t===tab)?'block':'none';
  });
  document.querySelectorAll('[id^="savedTab-"]').forEach(t=>t.classList.remove('active'));
  const btn=document.getElementById('savedTab-'+tab);
  if(btn)btn.classList.add('active');
  if(tab==='weekly')renderSavedWeeklyList();
  if(_lang==='en'&&typeof _translateAllText==='function'){setTimeout(_translateAllText,100);setTimeout(_translateAllText,400);}
}

// ══ Excel Export — بيان المواد ══════════════════════
function exportMaterialsExcel(selKey) {
  const {projects} = loadData();
  const selSet = window[selKey];
  const selIds = selSet && selSet.size > 0 ? [...selSet] : projects.map(p=>p.id);
  const rows = projects.filter(p=>selIds.includes(p.id));
  const fmt = v => v ? (+v).toLocaleString('en-US') : '0';

  // Header row
  const headers = [t('م'),t('اسم العميل'),t('رقم العقد'),t('الشركة'),t('المنطقة'),t('المعرض'),t('المرحلة'),
    t('قيمة المستخلص'),t('الدفعة'),t('المتبقي للتحصيل'),t('قيمة المواد'),t('ما تم شراؤه'),t('متبقي المواد'),
    t('عهدة التشغيل'),t('قيمة الألمنيوم'),t('قيمة الزجاج')];

  // Build XLS with inline styles
  let xml = '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
  xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
  xml += '<Styles>';
  xml += '<Style ss:ID="header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1a3a6a" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>';
  xml += '<Style ss:ID="odd"><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>';
  xml += '<Style ss:ID="even"><Interior ss:Color="#f0f4ff" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>';
  xml += '<Style ss:ID="total"><Font ss:Bold="1" ss:Color="#1a3a6a"/><Interior ss:Color="#e8f0fe" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>';
  xml += '<Style ss:ID="num"><NumberFormat ss:Format="#,##0"/><Alignment ss:Horizontal="Center"/></Style>';
  xml += '</Styles>';
  xml += '<Worksheet ss:Name="'+t('بيان المواد')+'"><Table>';

  // Column widths
  const colWidths = [25,120,90,80,80,80,90,90,90,90,90,90,90,90,90,90];
  colWidths.forEach(w => xml += `<Column ss:Width="${w}"/>`);

  // Header
  xml += '<Row ss:Height="22">';
  headers.forEach(h => xml += `<Cell ss:StyleID="header"><Data ss:Type="String">${h}</Data></Cell>`);
  xml += '</Row>';

  // Data rows
  let totExt=0,totDown=0,totNet=0,totMats=0,totPurch=0,totRem=0,totOps=0,totAlum=0,totGlass=0;
  rows.forEach((p,i) => {
    const ext=parseFloat(p.extractValue)||0, down=parseFloat(p.downPayment)||0;
    const mats=parseFloat(p.materialsValue)||0, purch=parseFloat(p.materialsPurchased)||0;
    totExt+=ext; totDown+=down; totNet+=ext-down;
    totMats+=mats; totPurch+=purch; totRem+=mats-purch;
    totOps+=parseFloat(p.opsValue)||0;
    totAlum+=parseFloat(p.alumValue)||0;
    totGlass+=parseFloat(p.glassValue)||0;
    const style = i%2===0 ? 'odd':'even';
    const cells = [i+1, p.name||'-', p.contractNo||'-', p.company||'-', p.region||'-', p.gallery||'-', p.stage||'-',
      ext, down, ext-down, mats, purch, mats-purch,
      parseFloat(p.opsValue)||0, parseFloat(p.alumValue)||0, parseFloat(p.glassValue)||0];
    xml += '<Row ss:Height="18">';
    cells.forEach((v,ci) => {
      const isNum = ci >= 7;
      xml += `<Cell ss:StyleID="${isNum?'num':style}"><Data ss:Type="${isNum?'Number':'String'}">${v}</Data></Cell>`;
    });
    xml += '</Row>';
  });

  // Total row
  const totals = ['',t('الإجمالي'),'','','','','',totExt,totDown,totNet,totMats,totPurch,totRem,totOps,totAlum,totGlass];
  xml += '<Row ss:Height="20">';
  totals.forEach((v,ci) => {
    const isNum = ci >= 7;
    xml += `<Cell ss:StyleID="total"><Data ss:Type="${isNum?'Number':'String'}">${v||''}</Data></Cell>`;
  });
  xml += '</Row>';

  xml += '</Table></Worksheet></Workbook>';

  const blob = new Blob([xml], {type:'application/vnd.ms-excel;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dt = new Date().toLocaleDateString('ar').replace(/\//g,'-');
  a.href = url; a.download = 'بيان_المواد_'+dt+'.xls';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  notify('✅ '+t('تم تصدير بيان المواد'));
}

// ══ Excel Export — تقرير الإنتاج ════════════════════
function exportProductionExcel() {
  const modal = document.getElementById('prodReportModal');
  const table = modal ? modal.querySelector('table') : null;
  if(!table){ notify('⚠️ '+t('لا توجد بيانات إنتاج'),'error'); return; }

  let xml = '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
  xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
  xml += '<Styles>';
  xml += '<Style ss:ID="header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1a3a6a" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>';
  xml += '<Style ss:ID="odd"><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>';
  xml += '<Style ss:ID="even"><Interior ss:Color="#f0f4ff" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>';
  xml += '<Style ss:ID="total"><Font ss:Bold="1"/><Interior ss:Color="#e8f0fe" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>';
  xml += '</Styles>';
  xml += '<Worksheet ss:Name="'+t('تقرير الإنتاج')+'"><Table>';

  const rows = table.querySelectorAll('tr');
  rows.forEach((row, ri) => {
    const isHeader = row.closest('thead') !== null;
    const isFooter = row.closest('tfoot') !== null;
    xml += '<Row ss:Height="20">';
    row.querySelectorAll('th,td').forEach(cell => {
      const txt = (cell.textContent||'').trim().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const style = isHeader||isFooter ? (isFooter?'total':'header') : (ri%2===0?'odd':'even');
      const numVal = txt.replace(/,/g,'');
      const isNum = !isNaN(numVal) && numVal !== '' && numVal !== '-';
      xml += `<Cell ss:StyleID="${style}"><Data ss:Type="${isNum?'Number':'String'}">${isNum?numVal:txt}</Data></Cell>`;
    });
    xml += '</Row>';
  });

  xml += '</Table></Worksheet></Workbook>';

  const blob = new Blob([xml], {type:'application/vnd.ms-excel;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dt = new Date().toLocaleDateString('ar').replace(/\//g,'-');
  a.href = url; a.download = 'تقرير_الانتاج_'+dt+'.xls';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  notify('✅ '+t('تم تصدير تقرير الإنتاج'));
}

