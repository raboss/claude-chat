function quickDoc(id, type) {
  showPage_direct('documents');
  setTimeout(() => {
    document.getElementById('docProject').value = id;
    if(type) document.getElementById('docType').value = type;
    _autoSelectLogo(id);
    previewDoc();
  }, 100);
}

function _autoSelectLogo(pid) {
  const { projects } = loadData();
  const p = projects.find(x => x.id === pid);
  if(p) {
    const companyLogoMap = {
      'السلطان': 'sultan', 'عالم المعادن': 'metal',
      'الراجحي': 'rajhi',  'الفوزان': 'fozan'
    };
    const logoKey = companyLogoMap[p.company] || 'none';
    const logoSel = document.getElementById('docLogo');
    if(logoSel) logoSel.value = logoKey;
  }
}

function onDocProjectChange() {
  const pid = document.getElementById('docProject')?.value;
  if(pid) _autoSelectLogo(pid);
  previewDoc();
}

function showPage_direct(pg) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-'+pg).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => { if(b.textContent.includes('المستندات')) b.classList.add('active'); });
  renderDocProjects(); renderLogoGrid();
}

let _watermarkImageData = null;

function toggleWatermarkInputType() {
  const type = document.getElementById('watermarkType').value;
  document.getElementById('watermarkText').style.display = type==='text' ? 'block' : 'none';
  document.getElementById('watermarkImageBtn').style.display = type==='image' ? 'inline-flex' : 'none';
  document.getElementById('watermarkImageName').style.display = type==='image' ? 'inline' : 'none';
  previewDoc();
}

function _getWatermarkColor() {
  const sel = document.getElementById('watermarkColor')?.value || 'auto';
  const customEl = document.getElementById('watermarkCustomColor');
  if(customEl) customEl.style.display = sel === 'custom' ? 'inline-block' : 'none';
  switch(sel) {
    case 'dark': return '#1a1a2e';
    case 'light': return '#c0c8d8';
    case 'red': return '#8b0000';
    case 'blue': return '#1a3a6a';
    case 'custom': return customEl?.value || '#1e3a5f';
    case 'auto': default:
      // Auto: dark text on light page background
      return '#b0b8c8';
  }
}

function loadWatermarkImage(input) {
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    _watermarkImageData = e.target.result;
    document.getElementById('watermarkImageName').textContent = file.name;
    previewDoc();
  };
  reader.readAsDataURL(file);
}

// ── Helper: get common doc data ──
function _getDocContext() {
  const { projects, companyProfiles, stages } = loadData();
  const projectId = document.getElementById('docProject')?.value;
  const docType = document.getElementById('docType')?.value || 'تقرير العميل';
  const logoKey = document.getElementById('docLogo')?.value || 'none';
  const wmCheckbox = document.getElementById('docWatermark');
  const useWatermark = wmCheckbox ? wmCheckbox.checked === true : false;
  const wmType = document.getElementById('watermarkType')?.value || 'text';
  const wmText = document.getElementById('watermarkText')?.value || 'سري وخاص';
  const p = projects.find(x => x.id === projectId);
  const logoSrc = logoKey !== 'none' ? LOGOS[logoKey] : null;
  const today = new Date().toLocaleDateString('ar-SA', {year:'numeric',month:'long',day:'numeric'});
  const compName = p?.company || '';
  const prof = companyProfiles?.[compName] || {};
  const coNameAr = prof.nameAr || compName;
  const coNameEn = prof.nameEn || '';
  const extVal = parseFloat(p?.extractValue) || 0;
  const contrVal = parseFloat(p?.contractValue) || 0;
  const down = parseFloat(p?.downPayment) || 0;
  const wmColor = _getWatermarkColor();
  // تحقق من إعدادات العلامة المائية للمستخدم الحالي
  let forceWatermark = false;
  let hideWatermark = false;
  const curUser = (typeof getCurrentUser==='function') ? getCurrentUser() : null;
  if(curUser && !curUser.isAdmin) {
    const users = (typeof loadUsers==='function') ? loadUsers() : [];
    const uData = users.find(u => u.name === curUser.name);
    if(uData) {
      if(uData.forceWatermark) forceWatermark = true;
      if(uData.hideWatermark) hideWatermark = true;
    }
  }
  const showWM = hideWatermark ? false : (useWatermark || forceWatermark);
  let wmHTML = '';
  let wmStyle = '';
  if(showWM) {
    if(wmType === 'image' && _watermarkImageData) {
      wmHTML = `<img src="${_watermarkImageData}" class="doc-watermark-img">`;
    } else {
      // علامة مائية مكررة — عدة نسخ لتغطية كل الصفحة
      const wmS = 'position:absolute;left:50%;transform:translate(-50%,0) rotate(-30deg);opacity:0.13;font-size:52px;font-weight:900;color:'+wmColor+';white-space:nowrap;font-family:Cairo,Arial,sans-serif;user-select:none';
      wmHTML = `<div class="doc-watermark-grid" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9;overflow:hidden">
        <div style="top:5%;${wmS}">${wmText}</div>
        <div style="top:25%;${wmS}">${wmText}</div>
        <div style="top:45%;${wmS}">${wmText}</div>
        <div style="top:65%;${wmS}">${wmText}</div>
        <div style="top:85%;${wmS}">${wmText}</div>
      </div>`;
    }
  }
  return { projects, companyProfiles, stages, projectId, docType, logoKey, logoSrc, p, today, compName, prof, coNameAr, coNameEn, extVal, contrVal, down, wmHTML, wmStyle };
}

// ── Letterhead builder ──
function _buildLetterhead(ctx, title) {
  const { logoSrc, coNameAr, coNameEn, p, today } = ctx;
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #1a3a6a;padding-bottom:8px;margin-bottom:10px">
      <div style="display:flex;flex-direction:column;align-items:center;min-width:140px">
        ${logoSrc ? `<img src="${logoSrc}" style="max-height:70px;max-width:130px;object-fit:contain;margin-bottom:6px">` : ''}
        ${coNameAr ? `<div class="doc-company-name-ar">${coNameAr}</div>` : ''}
        ${coNameEn ? `<div class="doc-company-name-en">${coNameEn}</div>` : ''}
      </div>
      <div style="text-align:center;flex:1;padding:0 16px">
        <div style="font-size:20px;font-weight:800;color:#1a3a6a;border:2px solid #1a3a6a;padding:8px 20px;border-radius:6px;display:inline-block">${title}</div>
        ${p ? `<div style="margin-top:6px;font-size:13px;color:#555">${p.name||''} ${p.contractNo?'| '+p.contractNo:''}</div>` : ''}
      </div>
      <div style="text-align:left;min-width:120px;font-size:12px;color:#555">
        <div style="margin-bottom:3px"><strong>${t('التاريخ:')}</strong> ${today}</div>
        <div style="margin-bottom:3px"><strong>${t('رقم العقد:')}</strong> ${p?.contractNo||'---'}</div>
        <div><strong>${t('المعرض:')}</strong> ${p?.gallery||'---'}</div>
      </div>
    </div>`;
}

// ── Footer builder ──
function _buildFooter(ctx) {
  return `<div class="doc-footer">${ctx.coNameAr} ${ctx.coNameEn ? '| '+ctx.coNameEn : ''} | ${t('التاريخ:')} ${ctx.today}</div>`;
}

// ── Signature block ──
function _buildSignature() {
  const sigImg = (typeof getSignatureHTML === 'function') ? getSignatureHTML() : '';
  return `<div style="margin-top:10px;display:flex;justify-content:flex-start;direction:rtl">
    <div style="border-top:2px solid #1a3a6a;padding-top:4px;font-size:12px;min-width:180px;text-align:center">
      <strong>${t('مدير المكتب الفني')}</strong>
      ${sigImg ? '<div style="margin:2px 0">'+sigImg+'</div>' : '<br><br>'}
      <span style="font-size:9px;color:#888">${t('الاسم / التوقيع')}</span>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════
// ── Document builders per type ──
// ══════════════════════════════════════════════

function _buildClientReportDoc(ctx) {
  const { p, contrVal, extVal, down } = ctx;
  if(!p) return '';
  const autoStatus = calcStatusFromStage(p.stage);
  const baseVal = extVal > 0 ? extVal : contrVal;
  const remaining = baseVal - down;
  const prodVal = Math.round(baseVal * (parseFloat(p.progress)||0) / 100);
  const region = typeof getRegion === 'function' ? getRegion(p) : (p.region||'-');
  const smartDel = typeof calcSmartDeliveryDate === 'function' ? calcSmartDeliveryDate(p) : '';
  return `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px">
      <div style="background:#f0f4ff;border-radius:8px;padding:10px;text-align:center;border:1px solid #ddd">
        <div style="font-size:16px;font-weight:800;color:#1a3a6a">${p.contractNo||'---'}</div>
        <div style="font-size:10px;color:#555;margin-top:4px">${t('رقم العقد')}</div>
      </div>
      <div style="background:#f0f4ff;border-radius:8px;padding:10px;text-align:center;border:1px solid #ddd">
        <div style="font-size:14px;font-weight:700;color:#228822">${autoStatus}</div>
        <div style="font-size:10px;color:#555;margin-top:4px">${t('الحالة')}</div>
      </div>
      <div style="background:#f0f4ff;border-radius:8px;padding:10px;text-align:center;border:1px solid #ddd">
        <div style="font-size:16px;font-weight:800;color:#a07800">${parseFloat(p.progress)||0}%</div>
        <div style="font-size:10px;color:#555;margin-top:4px">${t('نسبة الإنجاز')}</div>
      </div>
      <div style="background:#f0f4ff;border-radius:8px;padding:10px;text-align:center;border:1px solid #ddd">
        <div style="font-size:14px;font-weight:800;color:${remaining<0?'#c00':'#228822'}">${remaining.toLocaleString('en-US')}</div>
        <div style="font-size:10px;color:#555;margin-top:4px">${t('المبلغ المتبقي (ر.س)')}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div>
        <div style="font-size:13px;font-weight:700;color:#1a3a6a;margin-bottom:8px;border-bottom:2px solid #1a3a6a;padding-bottom:6px">${t('بيانات المشروع')}</div>
        <table class="doc-table" style="font-size:12px">
          <tr><td style="width:40%;color:#555">${t('اسم العميل')}</td><td style="font-weight:600">${p.name||'-'}</td></tr>
          <tr><td style="color:#555">${t('رقم العقد')}</td><td style="font-weight:600">${p.contractNo||'-'}</td></tr>
          <tr><td style="color:#555">${t('الشركة')}</td><td>${p.company||'-'}</td></tr>
          <tr><td style="color:#555">${t('المنطقة')}</td><td>${region}</td></tr>
          <tr><td style="color:#555">${t('المعرض')}</td><td>${p.gallery||'-'}</td></tr>
          <tr><td style="color:#555">${t('تاريخ العقد')}</td><td>${p.contractDate||'-'}</td></tr>
          <tr><td style="color:#555">${t('تاريخ الاعتماد')}</td><td style="${p.approvalDate?'color:#d97706;font-weight:600':''}">${p.approvalDate||'-'}</td></tr>
          <tr><td style="color:#555">${t('مدة العقد')}</td><td>${p.contractDuration ? p.contractDuration+' '+t('يوم') : '-'}</td></tr>
          <tr><td style="color:#555">${t('موعد التسليم')}</td><td style="font-weight:600">${smartDel || p.deliveryDate || '-'}</td></tr>
          <tr><td style="color:#555">${t('المرحلة الحالية')}</td><td style="color:#228822;font-weight:600">${p.stage||'-'}</td></tr>
          <tr><td style="color:#555">${t('لون الألمنيوم')}</td><td style="display:flex;align-items:center;gap:6px">${_ralSwatchHTML(p.aluminumColor||'',14)}${p.aluminumColor||'-'}</td></tr>
          <tr><td style="color:#555">${t('لون الزجاج')}</td><td style="display:flex;align-items:center;gap:6px">${_glassSwatchHTML(p.glassColor||'',14)}${p.glassColor||'-'}</td></tr>
          <tr><td style="color:#555">${t('رقم الجوال')}</td><td>${p.phone||'-'}</td></tr>
        </table>
      </div>
      <div>
        <div style="font-size:13px;font-weight:700;color:#1a3a6a;margin-bottom:8px;border-bottom:2px solid #1a3a6a;padding-bottom:6px">${t('الملخص المالي')}</div>
        <table class="doc-table" style="font-size:12px">
          <tr><td style="width:50%;color:#555">${t('قيمة العقد')}</td><td style="font-weight:600">${contrVal.toLocaleString('en-US')} ر.س</td></tr>
          <tr><td style="color:#555">${t('قيمة المستخلص')}</td><td>${extVal ? extVal.toLocaleString('en-US')+' ر.س' : '-'}</td></tr>
          <tr><td style="color:#555">${t('الدفعة المقدمة')}</td><td>${down.toLocaleString('en-US')} ر.س</td></tr>
          <tr><td style="color:#555">${t('قيمة الإنتاج')}</td><td style="color:#a07800;font-weight:600">${prodVal.toLocaleString('en-US')} ر.س</td></tr>
          <tr style="background:#e8f0fe"><td style="font-weight:700">${t('المبلغ المتبقي')}</td><td style="font-weight:800;color:${remaining<0?'#c00':'#228822'}">${remaining.toLocaleString('en-US')} ر.س</td></tr>
        </table>
        <!-- Progress bar -->
        <div style="margin-top:14px">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#555;margin-bottom:6px">
            <span>${t('نسبة الإنجاز الكلية')}</span>
            <span style="font-weight:700;color:#a07800">${parseFloat(p.progress)||0}%</span>
          </div>
          <div style="height:16px;background:#e8e8e8;border-radius:8px;overflow:hidden">
            <div style="height:100%;width:${parseFloat(p.progress)||0}%;background:linear-gradient(90deg,#a07800,#228822);border-radius:8px"></div>
          </div>
        </div>

        <!-- Financial chart (CSS-based for print) -->
        <div style="margin-top:16px;font-size:12px;font-weight:700;color:#1a3a6a;margin-bottom:8px;border-bottom:2px solid #1a3a6a;padding-bottom:6px">${t('التوزيع المالي')}</div>
        ${(()=>{
          const paid = down;
          const prod = Math.max(0, prodVal - down);
          const rem = Math.max(0, baseVal - prodVal);
          const total = paid + prod + rem || 1;
          const paidPct = (paid/total*100).toFixed(1);
          const prodPct = (prod/total*100).toFixed(1);
          const remPct = (rem/total*100).toFixed(1);
          return `<div style="margin-bottom:10px">
            <div style="height:24px;display:flex;border-radius:6px;overflow:hidden;border:1px solid #ddd">
              ${paid > 0 ? `<div style="width:${paidPct}%;background:#4ec94e;display:flex;align-items:center;justify-content:center"><span style="font-size:8px;color:#fff;font-weight:700">${paidPct}%</span></div>` : ''}
              ${prod > 0 ? `<div style="width:${prodPct}%;background:#4f8ef7;display:flex;align-items:center;justify-content:center"><span style="font-size:8px;color:#fff;font-weight:700">${prodPct}%</span></div>` : ''}
              ${rem > 0 ? `<div style="width:${remPct}%;background:#e85d5d;display:flex;align-items:center;justify-content:center"><span style="font-size:8px;color:#fff;font-weight:700">${remPct}%</span></div>` : ''}
            </div>
            <div style="display:flex;gap:14px;margin-top:6px;font-size:10px">
              <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;background:#4ec94e;border-radius:2px;display:inline-block"></span>${t('الدفعة المقدمة:')} ${paid.toLocaleString('en-US')} ر.س</span>
              <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;background:#4f8ef7;border-radius:2px;display:inline-block"></span>${t('الإنتاج الإضافي:')} ${prod.toLocaleString('en-US')} ر.س</span>
              <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;background:#e85d5d;border-radius:2px;display:inline-block"></span>${t('المتبقي:')} ${rem.toLocaleString('en-US')} ر.س</span>
            </div>
          </div>`;
        })()}
      </div>
    </div>
    ${p.notes ? `<div style="margin-top:12px;padding:10px 14px;background:#f9f9f9;border-right:4px solid #1a3a6a;border-radius:4px;font-size:12px"><strong>${t('ملاحظات:')}</strong> ${p.notes}</div>` : ''}
    ${_buildSignature()}`;
}

// ── بناء بنود المقاسات تلقائياً للمستخلص ──
function _buildMeasItemsForExtract(pid) {
  const measRows = (typeof getMeasurementsData === 'function') ? getMeasurementsData(pid) : null;
  const plRows = (typeof getPLData === 'function') ? getPLData(pid) : [];
  if(!measRows || !measRows.length) return '';
  const active = measRows.filter(r => +r.width > 0 && +r.height > 0);
  if(!active.length) return '';

  // Price map from price list
  const prMap = {};
  plRows.forEach(r => { if(r.sectionName && +r.pricePerM2 > 0) prMap[r.sectionName] = {price:+r.pricePerM2, addW:+r.addWidth||0, addH:+r.addHeight||0}; });

  // Zero-zero check
  const zz = (typeof isZeroZero === 'function') ? isZeroZero(pid) : false;
  const zzSub = zz ? 8 : 0;

  // Group by sectionName
  const groups = {};
  active.forEach(r => {
    const sn = r.sectionName || 'غير محدد';
    const pr = prMap[r.sectionName];
    const addW = pr ? pr.addW : 0, addH = pr ? pr.addH : 0;
    const Wm = (+r.width - zzSub + addW) / 1000, Hm = (+r.height - zzSub + addH) / 1000;
    const rawArea = Math.round(Wm * Hm * 1000000) / 1000000;
    const secDef = (typeof loadSections === 'function') ? loadSections().find(s => s.name === (r.sectionName||'')) : null;
    const minThr = secDef?.minArea ?? 0;
    const minVal = secDef?.minAreaVal ?? minThr;
    const area = (minThr > 0 && rawArea < minThr) ? minVal : rawArea;
    if(!groups[sn]) groups[sn] = {sectionName:sn, totalArea:0, count:0, price:pr?pr.price:0, addW, addH};
    groups[sn].totalArea = Math.round((groups[sn].totalArea + area) * 1000000) / 1000000;
    groups[sn].count++;
  });

  const items = Object.values(groups);
  const fmt = v => (+v).toLocaleString('en-US',{minimumFractionDigits:2, maximumFractionDigits:2});
  const grandTotal = Math.round(items.reduce((s,x) => s + (x.price ? Math.round(x.totalArea*x.price*100)/100 : 0), 0)*100)/100;
  const grandArea = Math.round(items.reduce((s,x) => s + x.totalArea, 0)*1000000)/1000000;

  return `
    <div style="background:#1a3a6a;color:#fff;padding:7px 12px;border-radius:6px 6px 0 0;font-size:13px;font-weight:700;display:flex;justify-content:space-between;align-items:center">
      <span>${t('📐 بنود المقاسات')}</span>
      <span style="font-size:11px;font-weight:400">${active.length} ${t('وحدة')} → ${items.length} ${t('نوع قطاع')}</span>
    </div>
    <table class="doc-table" style="margin:0;border-radius:0 0 6px 6px;width:100%;table-layout:fixed">
      <thead><tr style="background:#f0f4ff">
        <th style="width:3%;text-align:center;font-size:10px">${t('م')}</th>
        <th style="width:59%;font-size:10px;text-align:right">${t('الوصف (نوع القطاع)')}</th>
        <th style="width:5%;text-align:center;font-size:10px">${t('العدد')}</th>
        <th style="width:10%;text-align:center;font-size:10px">${t('المساحة م²')}</th>
        <th style="width:9%;text-align:center;font-size:10px">${t('سعر م²')}</th>
        <th style="width:14%;text-align:center;font-size:10px">${t('القيمة ر.س')}</th>
      </tr></thead>
      <tbody>${items.map((x,i) => {
        const val = x.price ? Math.round(x.totalArea*x.price*100)/100 : 0;
        return '<tr><td style="text-align:center;color:#666;font-size:10px">'+(i+1)+'</td>'
          +'<td style="word-break:break-word;font-size:10px"><strong>'+x.sectionName+'</strong>'+(x.addW||x.addH?'<span style="font-size:10px;color:#888;margin-right:6px">(+'+x.addW+'/+'+x.addH+' مم)</span>':'')+'</td>'
          +'<td style="text-align:center;font-weight:600;font-size:10px">'+x.count+'</td>'
          +'<td style="text-align:center;font-weight:700;color:#a07800;font-size:10px">'+fmt(x.totalArea)+'</td>'
          +'<td style="text-align:center;font-size:10px">'+(x.price?fmt(x.price):'-')+'</td>'
          +'<td style="text-align:center;font-weight:800;color:#a07800;font-size:14px">'+(x.price?fmt(val):'-')+'</td></tr>';
      }).join('')}</tbody>
      <tfoot><tr style="background:#e8f0fe">
        <td colspan="3" style="font-weight:800;padding:8px 10px;font-size:13px">${t('الإجمالي')}</td>
        <td style="text-align:center;font-weight:800;color:#a07800">${fmt(grandArea)} م²</td>
        <td></td>
        <td style="text-align:center;font-weight:900;color:#a07800;font-size:16px">${fmt(grandTotal)} ر.س</td>
      </tr></tfoot>
    </table>`;
}

function _buildExtractDoc(ctx) {
  const { p, extVal, contrVal, down } = ctx;
  if(!p) return '';
  const baseExtract = extVal > 0 ? Math.round(extVal / 1.15) : 0;
  const vatAmount = extVal > 0 ? (extVal - baseExtract) : 0;
  const vatOnContract = Math.round(contrVal * 0.15);
  const base = extVal > 0 ? baseExtract : contrVal;
  const vat = extVal > 0 ? vatAmount : vatOnContract;
  const tot = extVal > 0 ? extVal : (contrVal + vatOnContract);
  const net = tot - down;
  return `
    <table class="doc-table" style="margin-bottom:10px;font-size:11px">
      <tr><th colspan="2" style="background:#f0f4ff;color:#1a3a6a;text-align:right;padding:5px 8px;font-size:11px">${t('بيانات العميل والمشروع')}</th></tr>
      <tr><td style="width:35%">${t('اسم العميل')}</td><td><strong>${p.name||'-'}</strong></td></tr>
      <tr><td>${t('رقم العقد')}</td><td><strong>${p.contractNo||'-'}</strong></td></tr>
      <tr><td>${t('الشركة')}</td><td>${p.company||'-'}</td></tr>
      <tr><td>${t('المنطقة / المعرض')}</td><td>${p.region||'-'} / ${p.gallery||'-'}</td></tr>
      <tr><td>${t('قيمة العقد')}</td><td>${contrVal ? contrVal.toLocaleString('en-US')+' ر.س' : '-'}</td></tr>
      <tr><td>${t('مدة العقد')}</td><td>${p.contractDuration ? p.contractDuration+' '+t('يوم') : '-'}</td></tr>
    </table>
    <div id="measItemsDiv_${p.id}" style="margin-bottom:14px">${_buildMeasItemsForExtract(p.id)}</div>
    <table class="doc-table">
      <tr><th colspan="2" style="background:#1a3a6a;color:#fff;text-align:center;font-size:14px">${t('ملخص المستخلص المالي')}</th></tr>
      <tr><td style="width:55%">${t('الإجمالي قبل الضريبة')}</td><td style="text-align:left;font-weight:600">${base.toLocaleString('en-US')} ر.س</td></tr>
      <tr><td>${t('ضريبة القيمة المضافة (15%)')}</td><td style="text-align:left;color:#c55">${vat.toLocaleString('en-US')} ر.س</td></tr>
      <tr style="background:#e8f0fe"><td><strong>${t('الإجمالي بعد الضريبة')}</strong></td><td style="text-align:left;font-weight:700;font-size:14px">${tot.toLocaleString('en-US')} ر.س</td></tr>
      <tr><td>${t('الدفعة المقدمة (المسددة)')}</td><td style="text-align:left;color:#080">( ${down.toLocaleString('en-US')} ) ر.س</td></tr>
      <tr style="background:#fff3e0"><td><strong>${t('الصافي المستحق للتحصيل')}</strong></td><td style="text-align:left;font-weight:800;font-size:15px;color:#b55">${net.toLocaleString('en-US')} ر.س</td></tr>
    </table>
    ${p.notes ? `<div style="margin-top:12px;padding:10px 14px;background:#f9f9f9;border-right:4px solid #1a3a6a;border-radius:4px;font-size:12px"><strong>${t('ملاحظات:')}</strong> ${p.notes}</div>` : ''}
    ${_buildSignature()}`;
}

function _buildFormDoc(ctx) {
  const { p, contrVal, extVal } = ctx;
  if(!p) return '';
  const plRows = (typeof getPLData === 'function') ? (getPLData(p.id)||[]) : [];
  const fresh = (typeof fmBuildFormData === 'function') ? fmBuildFormData(p, plRows) : null;
  const saved = (typeof fmFormLoad === 'function') ? fmFormLoad(p.id) : null;
  const fd = saved ? (typeof fmMergeManualEdits === 'function' ? fmMergeManualEdits(fresh, saved) : saved) : fresh;
  if(!fd) return '<p style="color:#888;text-align:center;padding:20px">'+t('لا توجد بيانات استمارة لهذا العميل')+'</p>';

  const tA = (typeof fmSumRows === 'function') ? fmSumRows(fd.aluminum||[]) : 0;
  const tAc = (typeof fmSumRows === 'function') ? fmSumRows(fd.accessories||[]) : 0;
  const tM = (typeof fmSumRows === 'function') ? fmSumRows(fd.installation||[]) : 0;
  const tW = (typeof fmSumRows === 'function') ? fmSumRows(fd.wages||[]) : 0;
  const tF = (typeof fmSumRows === 'function') ? fmSumRows(fd.fixed||[]) : 0;
  const N = v => v.toLocaleString('en-US',{minimumFractionDigits:2});
  const grandTotal = tA + tAc + tM + tW + tF;
  const {before: extB} = (typeof fmGetExtractValues === 'function') ? fmGetExtractValues(p.id, p) : {before: extVal > 0 ? Math.round(extVal/1.15) : contrVal};
  const pct = extB > 0 ? ((grandTotal / extB) * 100).toFixed(1) : '0';

  const buildRows = (items, label) => {
    if(!items || !items.length) return '';
    const rows = items.filter(r => !r.isGroup).map((r,i) =>
      `<tr><td style="text-align:center;font-size:10px">${i+1}</td><td style="font-size:10px">${r.desc||r.description||'-'}</td><td style="text-align:center;font-size:10px">${r.qty||'-'}</td><td style="text-align:center;font-size:10px">${r.unit||'-'}</td><td style="text-align:center;font-size:10px">${N(parseFloat(r.price)||0)}</td><td style="text-align:center;font-size:10px;font-weight:700">${N(parseFloat(r.total)||0)}</td></tr>`
    ).join('');
    return `<div style="margin-bottom:12px">
      <div style="background:#1a3a6a;color:#fff;padding:6px 12px;font-weight:700;font-size:12px;border-radius:4px 4px 0 0">${label}</div>
      <table class="doc-table" style="margin:0"><thead><tr><th style="width:5%">${t('م')}</th><th style="width:40%">${t('الوصف')}</th><th style="width:10%">${t('الكمية')}</th><th style="width:10%">${t('الوحدة')}</th><th style="width:15%">${t('السعر')}</th><th style="width:20%">${t('الإجمالي')}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  };

  return `
    <table class="doc-table" style="margin-bottom:12px;font-size:11px">
      <tr><td style="width:30%">${t('العميل')}</td><td><strong>${p.name||'-'}</strong></td><td style="width:20%">${t('رقم العقد')}</td><td><strong>${p.contractNo||'-'}</strong></td></tr>
      <tr><td>${t('الشركة')}</td><td>${p.company||'-'}</td><td>${t('المنطقة')}</td><td>${p.region||'-'}</td></tr>
      <tr><td>${t('لون الألمنيوم')}</td><td><span style="display:inline-flex;align-items:center;gap:4px">${_ralSwatchHTML(p.aluminumColor||'',12)}${p.aluminumColor||'-'}</span></td><td>${t('لون الزجاج')}</td><td><span style="display:inline-flex;align-items:center;gap:4px">${_glassSwatchHTML(p.glassColor||'',12)}${p.glassColor||'-'}</span></td></tr>
      <tr><td>${t('قيمة العقد')}</td><td>${N(contrVal)} ر.س</td><td>${t('المستخلص قبل الضريبة')}</td><td>${N(extB)} ر.س</td></tr>
    </table>
    ${buildRows(fd.aluminum, t('خامات الألمنيوم — ') + N(tA) + ' ر.س')}
    ${buildRows(fd.accessories, t('الأكسسوارات — ') + N(tAc) + ' ر.س')}
    ${buildRows(fd.installation, t('مواد التركيب — ') + N(tM) + ' ر.س')}
    <table class="doc-table" style="margin-top:10px">
      <tr><th colspan="2" style="background:#1a3a6a;color:#fff;text-align:center">${t('ملخص استمارة التصنيع')}</th></tr>
      <tr><td>${t('إجمالي الألمنيوم')}</td><td style="text-align:left;font-weight:700">${N(tA)} ر.س</td></tr>
      <tr><td>${t('إجمالي الأكسسوارات')}</td><td style="text-align:left;font-weight:700">${N(tAc)} ر.س</td></tr>
      <tr><td>${t('مواد التركيب')}</td><td style="text-align:left;font-weight:700">${N(tM)} ر.س</td></tr>
      <tr><td>${t('الأجور')}</td><td style="text-align:left;font-weight:700">${N(tW)} ر.س</td></tr>
      <tr><td>${t('التكاليف الثابتة')}</td><td style="text-align:left;font-weight:700">${N(tF)} ر.س</td></tr>
      <tr style="background:#e8f0fe"><td><strong>${t('الإجمالي العام')}</strong></td><td style="text-align:left;font-weight:800;font-size:14px">${N(grandTotal)} ر.س</td></tr>
      <tr><td>${t('النسبة من المستخلص')}</td><td style="text-align:left;font-weight:700;color:${parseFloat(pct)>100?'#c00':'#228822'}">${pct}%</td></tr>
    </table>
    ${_buildSignature()}`;
}

function _buildPurchaseOrderDoc(ctx) {
  const { p, contrVal, extVal } = ctx;
  if(!p) return '';
  const plRows = (typeof getPLData === 'function') ? (getPLData(p.id)||[]) : [];
  const fresh = (typeof fmBuildFormData === 'function') ? fmBuildFormData(p, plRows) : null;
  const saved = (typeof fmFormLoad === 'function') ? fmFormLoad(p.id) : null;
  const fd = saved ? (typeof fmMergeManualEdits === 'function' ? fmMergeManualEdits(fresh, saved) : saved) : fresh;
  if(!fd) return '<p style="color:#888;text-align:center;padding:20px">'+t('لا توجد بيانات طلب شراء لهذا العميل')+'</p>';
  const N = v => v.toLocaleString('en-US',{minimumFractionDigits:2});

  const buildPORows = (items, label) => {
    if(!items || !items.filter(r=>!r.isGroup).length) return '';
    const rows = items.filter(r => !r.isGroup).map((r,i) => {
      const code = r.code || '-';
      const desc = r.desc || r.description || '-';
      const qty = r.qty || '-';
      const unit = r.unit || '-';
      return `<tr><td style="text-align:center;font-size:10px">${i+1}</td><td style="font-size:10px">${code}</td><td style="font-size:10px">${desc}</td><td style="text-align:center;font-size:10px">${qty}</td><td style="text-align:center;font-size:10px">${unit}</td></tr>`;
    }).join('');
    return `<div style="margin-bottom:12px">
      <div style="background:#1a3a6a;color:#fff;padding:6px 12px;font-weight:700;font-size:12px;border-radius:4px 4px 0 0">${label}</div>
      <table class="doc-table" style="margin:0"><thead><tr><th style="width:5%">${t('م')}</th><th style="width:20%">${t('الكود')}</th><th style="width:40%">الوصف</th><th style="width:15%">${t('الكمية')}</th><th style="width:20%">${t('الوحدة')}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  };

  return `
    <table class="doc-table" style="margin-bottom:12px;font-size:11px">
      <tr><td style="width:30%">${t('العميل')}</td><td><strong>${p.name||'-'}</strong></td><td style="width:20%">${t('رقم العقد')}</td><td><strong>${p.contractNo||'-'}</strong></td></tr>
      <tr><td>${t('الشركة')}</td><td>${p.company||'-'}</td><td>${t('المنطقة / المعرض')}</td><td>${p.region||'-'} / ${p.gallery||'-'}</td></tr>
    </table>
    ${buildPORows(fd.aluminum, t('طلب شراء — خامات الألمنيوم'))}
    ${buildPORows(fd.accessories, t('طلب شراء — الأكسسوارات'))}
    ${_buildSignature()}`;
}

// ── المراحل (Stages table — pretty version) ──
function _buildStagesDoc(ctx) {
  const { p, stages } = ctx;
  if(!p) return '';
  const allStages = stages || [];
  const dur = Math.max(30, parseInt(p.contractDuration)||90);
  const smartDel = typeof calcSmartDeliveryDate === 'function' ? calcSmartDeliveryDate(p) : '';
  const currentIdx = allStages.findIndex(s => s.name === p.stage);
  const doneCount = currentIdx >= 0 ? currentIdx : 0;
  const totalStages = allStages.length;

  let rows = '';
  let cumPct = 0;
  allStages.forEach((s, i) => {
    cumPct += (s.pct||0);
    const done = i < currentIdx;
    const current = i === currentIdx;
    const color = done ? '#16a34a' : current ? '#d97706' : '#94a3b8';
    const bg = done ? '#f0fdf4' : current ? '#fffbeb' : '#f9fafb';
    const icon = done ? '&#10003;' : current ? '&#9679;' : '&#9675;';
    const cumVal = Math.min(100, cumPct);
    // progress bar for cumulative
    const barColor = done ? '#16a34a' : current ? '#d97706' : '#e5e7eb';
    rows += `<tr style="background:${bg}">
      <td style="text-align:center;font-size:11px;color:${color};font-weight:700">${i+1}</td>
      <td style="font-size:11px;font-weight:${current?700:500}"><span style="color:${color};margin-left:4px">${icon}</span> ${s.name||''}</td>
      <td style="text-align:center;font-size:11px">${s.pct||0}%</td>
      <td style="text-align:center;font-size:11px;font-weight:700;color:${color}">${cumVal}%</td>
      <td style="padding:6px 8px">
        <div style="height:10px;background:#e5e7eb;border-radius:5px;overflow:hidden">
          <div style="height:100%;width:${cumVal}%;background:${barColor};border-radius:5px"></div>
        </div>
      </td>
    </tr>`;
  });

  return `
    <table class="doc-table" style="margin-bottom:12px;font-size:11px">
      <tr><td style="width:25%">${t('العميل')}</td><td><strong>${p.name||'-'}</strong></td><td style="width:20%">${t('رقم العقد')}</td><td><strong>${p.contractNo||'-'}</strong></td></tr>
      <tr><td>${t('تاريخ العقد')}</td><td>${p.contractDate||'-'}</td><td>${t('مدة العقد')}</td><td>${dur} يوم</td></tr>
      <tr><td>${t('التسليم المتوقع')}</td><td style="font-weight:700">${smartDel || p.deliveryDate || '-'}</td><td>${t('نسبة الإنجاز')}</td><td style="font-weight:700;color:#d97706">${parseFloat(p.progress)||0}%</td></tr>
    </table>

    <!-- Summary cards -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:18px;font-weight:800;color:#16a34a">${doneCount}</div>
        <div style="font-size:10px;color:#555">${t('مرحلة مكتملة')}</div>
      </div>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:14px;font-weight:700;color:#d97706">${p.stage||'-'}</div>
        <div style="font-size:10px;color:#555">${t('المرحلة الحالية')}</div>
      </div>
      <div style="background:#f0f4ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:18px;font-weight:800;color:#1a3a6a">${totalStages}</div>
        <div style="font-size:10px;color:#555">${t('إجمالي المراحل')}</div>
      </div>
    </div>

    <table class="doc-table">
      <thead><tr>
        <th style="width:5%">م</th>
        <th style="width:30%">${t('المرحلة')}</th>
        <th style="width:10%">${t('النسبة')}</th>
        <th style="width:12%">${t('التراكمي')}</th>
        <th style="width:43%">${t('التقدم')}</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${_buildSignature()}`;
}

// ── المخطط الزمني (Gantt chart with day bars) ──
function _buildTimelineDoc(ctx) {
  const { p } = ctx;
  if(!p) return '';
  const dur = Math.max(30, parseInt(p.contractDuration)||90);
  const fmtD = d => d.toLocaleDateString('ar-SA',{month:'short',day:'numeric'});
  const startDate = p.contractDate ? new Date(p.contractDate) : new Date();
  const smartDel = typeof calcSmartDeliveryDate === 'function' ? calcSmartDeliveryDate(p) : '';

  // Build schedule (same logic as buildTimelineHTML)
  const d = dur;
  const SCHEDULE = [
    ['توقيع العقد',                      Math.max(1,Math.round(d*0.01)), 'pre',    '#7c3aed'],
    ['امر تشغيل',                        Math.max(1,Math.round(d*0.01)), 'pre',    '#6d28d9'],
    ['جاهزية الموقع',                    Math.max(2,Math.round(d*0.02)), 'pre',    '#64748b'],
    ['رفع مقاسات',                       Math.max(3,Math.round(d*0.04)), 'pre',    '#0284c7'],
    ['عمل مخططات',                       Math.max(5,Math.round(d*0.08)), 'pre',    '#0369a1'],
    ['اعتماد المخططات',                  Math.max(3,Math.round(d*0.03)), 'pre',    '#d97706'],
    ['اعداد استمارة (دراسة المشروع)',     Math.max(5,Math.round(d*0.07)), 'active', '#16a34a'],
    ['طلب الخامات',                      Math.max(3,Math.round(d*0.04)), 'active', '#15803d'],
    ['دهان الخامات',                     Math.max(8,Math.round(d*0.10)), 'active', '#166534'],
    ['البدء بالتصنيع',                   Math.max(8,Math.round(d*0.10)), 'active', '#1e7a4a'],
    ['اصدار مستخلص',                     Math.max(2,Math.round(d*0.02)), 'active', '#b45309'],
    ['سداد الدفعة الثانية',              Math.max(2,Math.round(d*0.02)), 'active', '#dc2626'],
    ['أمر تركيب',                        Math.max(1,Math.round(d*0.01)), 'active', '#991b1b'],
    ['توريد اعمال الالمنيوم',            Math.max(10,Math.round(d*0.13)), 'active', '#1d4ed8'],
    ['بدأ التركيب',                      Math.max(4,Math.round(d*0.05)), 'active', '#1e40af'],
    ['طلب الزجاج',                       Math.max(2,Math.round(d*0.02)), 'active', '#065f46'],
    ['استلام الزجاج مع التوريد',         Math.max(4,Math.round(d*0.05)), 'active', '#047857'],
    ['تركيب الزجاج',                     Math.max(4,Math.round(d*0.06)), 'active', '#059669'],
    ['تشطيب الموقع',                     Math.max(2,Math.round(d*0.02)), 'active', '#78350f'],
    ['اختبار الاعمال',                   Math.max(2,Math.round(d*0.02)), 'active', '#6b21a8'],
    ['تسليم الموقع',                     Math.max(1,Math.round(d*0.01)), 'active', '#4c1d95'],
  ];

  // Apply custom days if any
  const customDays = p.timelineDays || {};
  const schedule = SCHEDULE.map(([name, defDays, phase, color]) => {
    const days = (customDays[name] !== undefined && customDays[name] !== '') ? Math.max(1, parseInt(customDays[name])||1) : defDays;
    return { name, days, phase, color };
  });

  // Build day offsets
  let dayOffset = 0;
  const items = schedule.map(s => {
    const start = dayOffset;
    dayOffset += s.days;
    return { ...s, startDay: start, endDay: dayOffset, startDate: new Date(startDate.getTime() + start * 864e5) };
  });
  const totalDays = dayOffset;

  // Find current stage status
  const { stages } = loadData();
  const stageNames = (stages||[]).map(s=>s.name);
  const currentIdx = stageNames.indexOf(p.stage);
  const doneStages = new Set(stageNames.slice(0, Math.max(0, currentIdx)));
  const todayOff = Math.round((new Date() - startDate) / 864e5);

  // Month markers
  const months = [];
  let mDate = new Date(startDate);
  mDate.setDate(1);
  mDate.setMonth(mDate.getMonth() + 1);
  while(Math.round((mDate - startDate) / 864e5) < totalDays) {
    const off = Math.round((mDate - startDate) / 864e5);
    months.push({ label: mDate.toLocaleDateString('ar-SA',{month:'short'}), pct: (off/totalDays*100).toFixed(2) });
    mDate = new Date(mDate); mDate.setMonth(mDate.getMonth() + 1);
  }

  const monthTicks = months.map(m => `<div style="position:absolute;left:${m.pct}%;top:0;height:100%;border-left:1px dashed #ccc;z-index:0">
    <span style="position:absolute;top:2px;left:2px;font-size:7px;color:#888">${m.label}</span></div>`).join('');

  const todayLine = (todayOff > 0 && todayOff < totalDays) ?
    `<div style="position:absolute;left:${(todayOff/totalDays*100).toFixed(2)}%;top:0;height:100%;border-left:2px solid #ef4444;z-index:5">
      <span style="position:absolute;top:0;left:2px;font-size:7px;color:#ef4444;background:#fff;padding:0 2px">${t('اليوم')}</span></div>` : '';

  // Build Gantt rows
  const ganttRows = items.map((item, i) => {
    const isDone = doneStages.has(item.name);
    const isActive = item.name === p.stage;
    const barColor = isDone ? '#16a34a' : isActive ? item.color : '#cbd5e1';
    const bg = isDone ? '#f0fdf4' : isActive ? '#eff6ff' : '#fff';
    const leftPct = (item.startDay / totalDays * 100).toFixed(2);
    const widthPct = Math.max(0.8, (item.days / totalDays * 100)).toFixed(2);
    const icon = isDone ? '&#10003;' : isActive ? '&#9679;' : '&#9675;';
    const preTag = item.phase === 'pre' ? `<span style="font-size:7px;background:#f3e8ff;color:#7c3aed;padding:0 3px;border-radius:3px;margin-left:3px">قبل</span>` : '';

    return `<div style="display:flex;align-items:center;border-bottom:1px solid #eee;background:${bg};min-height:22px">
      <div style="width:28%;min-width:120px;padding:3px 8px;font-size:9px;font-weight:${isActive?700:400};color:${isDone?'#16a34a':isActive?'#1a3a6a':'#555'};display:flex;align-items:center;gap:3px;white-space:nowrap;overflow:hidden">
        <span style="color:${barColor};font-size:10px">${icon}</span>${preTag}${item.name}
      </div>
      <div style="flex:1;position:relative;height:18px;padding:0 4px">
        ${i===0 ? monthTicks : ''}${i===0 ? todayLine : ''}
        <div style="position:absolute;left:${leftPct}%;width:${widthPct}%;height:12px;top:3px;background:${barColor};border-radius:3px;z-index:2;display:flex;align-items:center;justify-content:center;overflow:hidden${isActive?';box-shadow:0 0 4px rgba(59,130,246,0.4)':''}">
          ${parseFloat(widthPct)>3 ? `<span style="font-size:7px;color:#fff;font-weight:700">${item.days}ي</span>` : ''}
        </div>
      </div>
      <div style="width:50px;text-align:center;font-size:8px;color:#888;padding:2px">${item.days}ي<br>${fmtD(item.startDate)}</div>
    </div>`;
  }).join('');

  return `
    <table class="doc-table" style="margin-bottom:10px;font-size:10px">
      <tr><td style="width:25%">${t('العميل')}</td><td><strong>${p.name||'-'}</strong></td><td style="width:18%">${t('رقم العقد')}</td><td><strong>${p.contractNo||'-'}</strong></td></tr>
      <tr><td>${t('تاريخ العقد')}</td><td>${p.contractDate||'-'}</td><td>${t('مدة العقد')}</td><td>${dur} يوم</td></tr>
      <tr><td>${t('التسليم المتوقع')}</td><td style="font-weight:700">${smartDel||p.deliveryDate||'-'}</td><td>${t('نسبة الإنجاز')}</td><td style="font-weight:700;color:#d97706">${parseFloat(p.progress)||0}%</td></tr>
    </table>

    <!-- Conditions -->
    <div style="display:flex;gap:8px;margin-bottom:10px;font-size:9px;flex-wrap:wrap">
      <span style="padding:3px 8px;border-radius:4px;background:${p.approvalDate?'#f0fdf4':'#fef2f2'};border:1px solid ${p.approvalDate?'#bbf7d0':'#fecaca'};color:${p.approvalDate?'#16a34a':'#dc2626'}">${p.approvalDate?'&#10003;':'&#10007;'} ${t('اعتماد المخططات')} ${p.approvalDate||''}</span>
      <span style="padding:3px 8px;border-radius:4px;background:${p.siteReadyDate?'#f0fdf4':'#fef2f2'};border:1px solid ${p.siteReadyDate?'#bbf7d0':'#fecaca'};color:${p.siteReadyDate?'#16a34a':'#dc2626'}">${p.siteReadyDate?'&#10003;':'&#10007;'} ${t('جاهزية الموقع')} ${p.siteReadyDate||''}</span>
      <span style="padding:3px 8px;border-radius:4px;background:${p.secondPaymentDate?'#f0fdf4':'#fef2f2'};border:1px solid ${p.secondPaymentDate?'#bbf7d0':'#fecaca'};color:${p.secondPaymentDate?'#16a34a':'#dc2626'}">${p.secondPaymentDate?'&#10003;':'&#10007;'} ${t('سداد الدفعة الثانية')} ${p.secondPaymentDate||''}</span>
    </div>

    <!-- Legend -->
    <div style="display:flex;gap:10px;margin-bottom:8px;font-size:8px;flex-wrap:wrap">
      <span style="display:flex;align-items:center;gap:3px"><span style="width:12px;height:8px;background:#16a34a;border-radius:2px;display:inline-block"></span>${t('مكتمل')}</span>
      <span style="display:flex;align-items:center;gap:3px"><span style="width:12px;height:8px;background:#3b82f6;border-radius:2px;display:inline-block"></span>${t('جاري')}</span>
      <span style="display:flex;align-items:center;gap:3px"><span style="width:12px;height:8px;background:#cbd5e1;border-radius:2px;display:inline-block"></span>${t('لم يبدأ')}</span>
      <span style="display:flex;align-items:center;gap:3px"><span style="width:12px;height:8px;background:#f3e8ff;border:1px solid #7c3aed;border-radius:2px;display:inline-block"></span>${t('قبل العقد')}</span>
      <span style="display:flex;align-items:center;gap:3px"><span style="width:2px;height:10px;background:#ef4444;display:inline-block"></span>${t('اليوم')}</span>
    </div>

    <!-- Gantt Chart -->
    <div style="border:1px solid #ddd;border-radius:6px;overflow:hidden;background:#fff">
      <!-- Header -->
      <div style="display:flex;align-items:center;background:#f0f4ff;border-bottom:2px solid #1a3a6a;min-height:24px">
        <div style="width:28%;min-width:120px;padding:4px 8px;font-size:10px;font-weight:700;color:#1a3a6a">${t('المهمة')}</div>
        <div style="flex:1;position:relative;height:24px;padding:0 4px">
          ${monthTicks}${todayLine}
        </div>
        <div style="width:50px;text-align:center;font-size:9px;font-weight:700;color:#1a3a6a">${t('المدة')}</div>
      </div>
      ${ganttRows}
      <!-- Footer -->
      <div style="display:flex;align-items:center;padding:6px 8px;background:#f0f4ff;border-top:1px solid #ddd;font-size:9px;gap:14px">
        <span>${t('إجمالي:')} <strong style="color:#1a3a6a">${totalDays} يوم</strong></span>
        <span>${t('المراحل:')} <strong>${schedule.length}</strong></span>
        <span>${t('البداية:')} <strong>${fmtD(startDate)}</strong></span>
        <span>${t('النهاية:')} <strong>${fmtD(new Date(startDate.getTime()+totalDays*864e5))}</strong></span>
      </div>
    </div>
    ${_buildSignature()}`;
}

function _buildMeasurementsDoc(ctx) {
  const { p } = ctx;
  if(!p) return '';
  const measRows = (typeof getMeasurementsData === 'function') ? getMeasurementsData(p.id) : null;
  if(!measRows || !measRows.length) return '<p style="color:#888;text-align:center;padding:20px">'+t('لا توجد مقاسات محفوظة لهذا العميل')+'</p>';
  const active = measRows.filter(r => +r.width > 0 && +r.height > 0);
  if(!active.length) return '<p style="color:#888;text-align:center;padding:20px">'+t('لا توجد مقاسات بأبعاد صحيحة')+'</p>';

  const fmt = v => (+v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const rows = active.map((r,i) => {
    const w = +r.width, h = +r.height;
    const area = (w/1000) * (h/1000);
    return `<tr>
      <td style="text-align:center;font-size:10px">${i+1}</td>
      <td style="font-size:10px">${r.sectionName||'غير محدد'}</td>
      <td style="text-align:center;font-size:10px">${r.width}</td>
      <td style="text-align:center;font-size:10px">${r.height}</td>
      <td style="text-align:center;font-size:10px;font-weight:700">${fmt(area)}</td>
      <td style="font-size:10px">${r.notes||r.label||'-'}</td>
    </tr>`;
  }).join('');

  const totalArea = active.reduce((s,r) => s + ((+r.width/1000) * (+r.height/1000)), 0);

  return `
    <table class="doc-table" style="margin-bottom:12px;font-size:11px">
      <tr><td style="width:30%">${t('العميل')}</td><td><strong>${p.name||'-'}</strong></td><td style="width:20%">${t('رقم العقد')}</td><td><strong>${p.contractNo||'-'}</strong></td></tr>
      <tr><td>${t('عدد القطع')}</td><td><strong>${active.length}</strong></td><td>${t('إجمالي المساحة')}</td><td><strong>${fmt(totalArea)} م²</strong></td></tr>
    </table>
    <table class="doc-table">
      <thead><tr>
        <th style="width:5%">م</th>
        <th style="width:25%">${t('القطاع')}</th>
        <th style="width:15%">${t('العرض (مم)')}</th>
        <th style="width:15%">${t('الارتفاع (مم)')}</th>
        <th style="width:15%">${t('المساحة م²')}</th>
        <th style="width:25%">${t('ملاحظات')}</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr style="background:#e8f0fe">
        <td colspan="4" style="font-weight:800">${t('الإجمالي')}</td>
        <td style="text-align:center;font-weight:800;color:#a07800">${fmt(totalArea)} م²</td>
        <td></td>
      </tr></tfoot>
    </table>
    ${_buildSignature()}`;
}

// ── مؤشرات العميل (نسخة طباعة — SVG بدل Canvas) ──
function _buildIndicatorsDoc(ctx) {
  const { p, contrVal, extVal, down, stages } = ctx;
  if(!p) return '';
  const baseVal = extVal > 0 ? extVal : contrVal;
  const remaining = baseVal - down;
  const prodVal = Math.round(baseVal * (parseFloat(p.progress)||0) / 100);
  const region = typeof getRegion === 'function' ? getRegion(p) : (p.region||'-');
  const smartDel = typeof calcSmartDeliveryDate === 'function' ? calcSmartDeliveryDate(p) : '';
  const autoStatus = typeof calcStatusFromStage === 'function' ? calcStatusFromStage(p.stage) : '-';

  // ── Donut chart SVG ──
  const paid = down, prod = Math.max(0, prodVal - down), rem = Math.max(0, baseVal - prodVal);
  const dTotal = paid + prod + rem || 1;
  const donutData = [{v:paid,c:'#4ec94e',l:t('الدفعة المقدمة')},{v:prod,c:'#4f8ef7',l:t('الإنتاج الإضافي')},{v:rem,c:'#e85d5d',l:t('المتبقي')}].filter(d=>d.v>0);
  let donutSVG = '<svg width="180" height="180" viewBox="0 0 180 180">';
  const cx=90,cy=90,R=70,r=42;
  let angle = -Math.PI/2;
  donutData.forEach(d => {
    const sl = (d.v/dTotal)*Math.PI*2;
    if(sl <= 0) return;
    const x1=cx+R*Math.cos(angle),y1=cy+R*Math.sin(angle);
    const x2=cx+R*Math.cos(angle+sl),y2=cy+R*Math.sin(angle+sl);
    const xi=cx+r*Math.cos(angle),yi=cy+r*Math.sin(angle);
    const xj=cx+r*Math.cos(angle+sl),yj=cy+r*Math.sin(angle+sl);
    const lg=sl>Math.PI?1:0;
    donutSVG += '<path d="M'+xi+','+yi+' L'+x1+','+y1+' A'+R+','+R+' 0 '+lg+' 1 '+x2+','+y2+' L'+xj+','+yj+' A'+r+','+r+' 0 '+lg+' 0 '+xi+','+yi+' Z" fill="'+d.c+'" stroke="#fff" stroke-width="2"/>';
    if(sl > 0.4) {
      const mx=cx+(R+r)/2*Math.cos(angle+sl/2), my=cy+(R+r)/2*Math.sin(angle+sl/2);
      donutSVG += '<text x="'+mx+'" y="'+my+'" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#fff" font-weight="700">'+((d.v/dTotal)*100).toFixed(0)+'%</text>';
    }
    angle += sl;
  });
  donutSVG += '<circle cx="'+cx+'" cy="'+cy+'" r="'+(r-4)+'" fill="white"/>';
  donutSVG += '<text x="'+cx+'" y="'+(cy-4)+'" text-anchor="middle" font-size="12" fill="#1a3a5c" font-weight="800">'+dTotal.toLocaleString('en-US',{maximumFractionDigits:0})+'</text>';
  donutSVG += '<text x="'+cx+'" y="'+(cy+10)+'" text-anchor="middle" font-size="9" fill="#888">'+t('ر.س')+'</text>';
  donutSVG += '</svg>';
  const donutLegend = donutData.map(d =>
    '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px"><span style="width:12px;height:12px;border-radius:3px;background:'+d.c+';flex-shrink:0"></span><span style="font-size:10px;color:#333">'+d.l+'</span><span style="font-size:10px;color:#666;margin-right:auto;padding-right:6px">'+d.v.toLocaleString('en-US')+' '+t('ر.س')+'</span></div>'
  ).join('');

  // ── Bar chart SVG (stage cumulative progress) ──
  const allStages = stages || [];
  const currentIdx = allStages.findIndex(s => s.name === p.stage);
  let cum = 0;
  const stageData = allStages.map((s,i) => { cum += (s.pct||0); return {name:s.name, pct:Math.min(100,cum), done:i<currentIdx, current:i===currentIdx}; });
  const barW = 320, barH = 160, barPad = 30, bw = stageData.length > 0 ? Math.min(12, (barW-barPad*2)/stageData.length - 2) : 10;
  let barSVG = '<svg width="'+barW+'" height="'+barH+'" viewBox="0 0 '+barW+' '+barH+'" style="overflow:visible">';
  // Y axis
  for(let yy=0;yy<=100;yy+=25) {
    const py = barH - barPad - (yy/100)*(barH-barPad*2);
    barSVG += '<line x1="'+barPad+'" y1="'+py+'" x2="'+(barW-5)+'" y2="'+py+'" stroke="#eee" stroke-width="0.5"/>';
    barSVG += '<text x="'+(barPad-3)+'" y="'+(py+3)+'" text-anchor="end" font-size="7" fill="#888">'+yy+'%</text>';
  }
  stageData.forEach((s,i) => {
    const x = barPad + i * ((barW-barPad*2)/stageData.length) + bw/2;
    const h = (s.pct/100) * (barH-barPad*2);
    const y = barH - barPad - h;
    const color = s.done ? '#4ec94e' : s.current ? '#d97706' : '#cbd5e1';
    barSVG += '<rect x="'+x+'" y="'+y+'" width="'+bw+'" height="'+h+'" rx="2" fill="'+color+'"/>';
    // label (rotated)
    barSVG += '<text x="'+(x+bw/2)+'" y="'+(barH-barPad+8)+'" text-anchor="end" transform="rotate(-55,'+(x+bw/2)+','+(barH-barPad+8)+')" font-size="6" fill="#555">'+( s.name.length>6?s.name.slice(0,6)+'…':s.name)+'</text>';
  });
  barSVG += '</svg>';

  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div>
        <div style="font-size:13px;font-weight:700;color:#1a3a6a;margin-bottom:10px;border-bottom:2px solid #1a3a6a;padding-bottom:6px">📋 ${t('بيانات المشروع')}</div>
        <table class="doc-table" style="font-size:11px;margin:0">
          <tr><td style="width:40%;color:#555">${t('اسم العميل')}</td><td style="font-weight:600">${p.name||'-'}</td></tr>
          <tr><td style="color:#555">${t('رقم العقد')}</td><td style="font-weight:600">${p.contractNo||'-'}</td></tr>
          <tr><td style="color:#555">${t('الشركة')}</td><td>${p.company||'-'}</td></tr>
          <tr><td style="color:#555">${t('المنطقة')}</td><td>${region}</td></tr>
          <tr><td style="color:#555">${t('المعرض')}</td><td>${p.gallery||'-'}</td></tr>
          <tr><td style="color:#555">${t('تاريخ العقد')}</td><td>${p.contractDate||'-'}</td></tr>
          <tr><td style="color:#555">${t('تاريخ الاعتماد')}</td><td style="${p.approvalDate?'color:#d97706;font-weight:600':''}">${p.approvalDate||'-'}</td></tr>
          <tr><td style="color:#555">${t('تاريخ جاهزية الموقع')}</td><td>${p.siteReadyDate||'-'}</td></tr>
          <tr><td style="color:#555">${t('مدة العقد')}</td><td>${p.contractDuration ? p.contractDuration+' '+t('يوم') : '-'}</td></tr>
          <tr><td style="color:#555">${t('موعد التسليم')}</td><td style="font-weight:600">${smartDel || p.deliveryDate || '-'}</td></tr>
          <tr><td style="color:#555">${t('المرحلة الحالية')}</td><td style="color:#228822;font-weight:600">${p.stage||'-'}</td></tr>
        </table>
        <div style="font-size:13px;font-weight:700;color:#1a3a6a;margin:14px 0 8px;border-bottom:2px solid #1a3a6a;padding-bottom:6px">💰 ${t('الملخص المالي')}</div>
        <table class="doc-table" style="font-size:11px;margin:0">
          <tr><td style="width:40%;color:#555">${t('قيمة العقد')}</td><td style="font-weight:600">${contrVal.toLocaleString('en-US')} ${t('ر.س')}</td></tr>
          <tr><td style="color:#555">${t('قيمة المستخلص')}</td><td>${extVal ? extVal.toLocaleString('en-US')+' '+t('ر.س') : '-'}</td></tr>
          <tr><td style="color:#555">${t('الدفعة المقدمة')}</td><td>${down.toLocaleString('en-US')} ${t('ر.س')}</td></tr>
          <tr><td style="color:#555">${t('قيمة الإنتاج')}</td><td style="color:#a07800;font-weight:600">${prodVal.toLocaleString('en-US')} ${t('ر.س')}</td></tr>
          <tr style="background:#e8f0fe"><td style="font-weight:700">${t('المبلغ المتبقي')}</td><td style="font-weight:800;color:${remaining<0?'#c00':'#228822'}">${remaining.toLocaleString('en-US')} ${t('ر.س')}</td></tr>
        </table>
      </div>
      <div>
        <div style="font-size:13px;font-weight:700;color:#1a3a6a;margin-bottom:10px;border-bottom:2px solid #1a3a6a;padding-bottom:6px">📊 ${t('مؤشرات المشروع')}</div>
        <div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#555;margin-bottom:4px">
            <span>${t('نسبة الإنجاز الكلية')}</span>
            <span style="font-weight:700;color:#a07800">${parseFloat(p.progress)||0}%</span>
          </div>
          <div style="height:14px;background:#e8e8e8;border-radius:7px;overflow:hidden">
            <div style="height:100%;width:${parseFloat(p.progress)||0}%;background:linear-gradient(90deg,#a07800,#228822);border-radius:7px"></div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:12px">
          ${donutSVG}
          <div style="margin-top:6px;width:100%">${donutLegend}</div>
        </div>
        <div style="font-size:11px;font-weight:700;color:#1a3a6a;margin-bottom:6px">${t('تقدم المراحل')}</div>
        ${barSVG}
      </div>
    </div>
    ${p.notes ? '<div style="margin-top:12px;padding:10px 14px;background:#f9f9f9;border-right:4px solid #1a3a6a;border-radius:4px;font-size:12px"><strong>'+t('ملاحظات:')+'</strong> '+p.notes+'</div>' : ''}
    ${_buildSignature()}`;
}

// ══════════════════════════════════════════════
// ── Main preview ──
// ══════════════════════════════════════════════

function previewDoc() {
  const ctx = _getDocContext();
  const { p, docType, wmHTML } = ctx;

  if(!p) {
    document.getElementById('docPreviewArea').innerHTML = '<p style="color:#888;text-align:center;padding:40px">'+t('اختر عميلاً لعرض المستندات')+'</p>';
    return;
  }

  let bodyHTML = '';
  switch(docType) {
    case 'تقرير العميل': bodyHTML = _buildClientReportDoc(ctx); break;
    case 'مستخلص': bodyHTML = _buildExtractDoc(ctx); break;
    case 'استمارة التصنيع': bodyHTML = _buildFormDoc(ctx); break;
    case 'طلب شراء': bodyHTML = _buildPurchaseOrderDoc(ctx); break;
    case 'المراحل': bodyHTML = _buildStagesDoc(ctx); break;
    case 'المخطط الزمني': bodyHTML = _buildTimelineDoc(ctx); break;
    case 'المقاسات': bodyHTML = _buildMeasurementsDoc(ctx); break;
    default: bodyHTML = _buildClientReportDoc(ctx); break;
  }

  const measBtnHTML = (docType === 'مستخلص' && p) ? `
    <div style="text-align:center;padding:10px 0;border-bottom:1px solid #ddd;margin-bottom:14px">
      <button onclick="injectMeasIntoDoc('${p.id}')"
              style="background:#1a3a6a;color:#fff;border:none;padding:9px 26px;border-radius:6px;font-family:Cairo,sans-serif;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.2)">
        ${t('تحديث بنود المقاسات')}
      </button>
      <div style="font-size:10px;color:#888;margin-top:4px">${t('يجمع المقاسات حسب القطاع — هذا الزر لا يظهر عند الطباعة')}</div>
    </div>` : '';

  const docHTML = `
    <div class="no-print" style="display:contents">${measBtnHTML}</div>
    <div class="doc-page" style="position:relative;overflow:visible;width:100%">
      ${_buildLetterhead(ctx, docType)}
      ${bodyHTML}
      ${_buildFooter(ctx)}
      ${ctx.wmHTML}
    </div>`;

  document.getElementById('docPreviewArea').innerHTML = docHTML;
  if(window._measTableCache) {
    Object.entries(window._measTableCache).forEach(([pid, html]) => {
      const el = document.getElementById('measItemsDiv_'+pid);
      if(el) el.innerHTML = html;
    });
  }
}

// ── Print styles ──
function _getDocPrintStyles(orientation) {
  return `<${'style'}>
    @page { size: A4 ${orientation}; margin: 10mm; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
    body { margin:0; padding:0; background:#fff !important; color:#222 !important; font-family:'Cairo',sans-serif; direction:rtl; }
    .doc-page { background:#fff !important; color:#222 !important; max-width:100% !important; padding:0 !important; border-radius:0 !important; box-shadow:none !important; }
    .doc-section { page-break-after: always; }
    .doc-section:last-child { page-break-after: auto; }
    .doc-table { width:100%; border-collapse:collapse; font-size:12px; }
    .doc-table th { background:#1a3a6a !important; color:#fff !important; padding:7px 8px; border:1px solid #999; text-align:right; }
    .doc-table td { padding:6px 8px; border:1px solid #ccc; color:#222 !important; }
    .doc-table tr:nth-child(even) td { background:#f5f7ff !important; }
    .doc-footer { border-top:2px solid #1a3a6a; margin-top:16px; padding-top:10px; font-size:11px; color:#666 !important; text-align:center; }
    strong { color:#111 !important; }
    .no-print { display:none !important; }
    table.doc-table { width:100% !important; border-collapse:collapse; }
    table.doc-table th { font-size:9px !important; padding:4px 3px !important; text-align:center; word-break:break-word; }
    table.doc-table td { font-size:10px !important; padding:4px 3px !important; word-break:break-word; white-space:normal; line-height:1.35; }
    table.doc-table:first-of-type td,
    table.doc-table:first-of-type th { font-size:10px !important; padding:3px 6px !important; }
    table.doc-table colgroup col:nth-child(1) { width:3%; }
    table.doc-table colgroup col:nth-child(2) { width:34%; }
    table.doc-table colgroup col:nth-child(3) { width:7%; }
    table.doc-table colgroup col:nth-child(4) { width:16%; }
    table.doc-table colgroup col:nth-child(5) { width:20%; }
    table.doc-table colgroup col:nth-child(6) { width:20%; }
    .doc-page { font-size:10px; position:relative; overflow:visible; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
    .doc-watermark-grid { position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:9; overflow:hidden; }
    .doc-watermark-grid div { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
    .doc-watermark-img { position:absolute; top:10%; left:10%; width:80%; height:80%; opacity:0.06; object-fit:contain; object-position:center; pointer-events:none; z-index:9; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
  </${'style'}>`;
}

function printDoc() {
  previewDoc();
  const orientation = document.getElementById('docOrientation')?.value || 'portrait';
  const preview = document.getElementById('docPreviewArea').innerHTML;
  const pa = document.getElementById('printArea');
  pa.innerHTML = _getDocPrintStyles(orientation) + preview;
  window.print();
  setTimeout(() => pa.innerHTML = '', 1500);
}

// ── Print All: prints all document types for the selected client ──
function printAllDocs() {
  const ctx = _getDocContext();
  if(!ctx.p) { notify(t('اختر عميلاً أولاً'),'error'); return; }
  const orientation = document.getElementById('docOrientation')?.value || 'portrait';

  const docTypes = [
    { title: 'تقرير العميل', builder: _buildClientReportDoc },
    { title: 'مستخلص', builder: _buildExtractDoc },
    { title: 'استمارة التصنيع', builder: _buildFormDoc },
    { title: 'طلب شراء', builder: _buildPurchaseOrderDoc },
    { title: 'المراحل', builder: _buildStagesDoc },
    { title: 'المخطط الزمني', builder: _buildTimelineDoc },
    { title: 'المقاسات', builder: _buildMeasurementsDoc },
  ];

  let allPages = '';
  docTypes.forEach(dt => {
    const body = dt.builder(ctx);
    if(body && !body.includes('لا توجد')) {
      allPages += `<div class="doc-section">
        <div class="doc-page" style="position:relative;overflow:visible;width:100%">
          ${_buildLetterhead(ctx, dt.title)}
          ${body}
          ${_buildFooter(ctx)}
          ${ctx.wmHTML}
        </div>
      </div>`;
    }
  });

  if(!allPages) { notify(t('لا توجد مستندات للطباعة'),'error'); return; }

  const pa = document.getElementById('printArea');
  pa.innerHTML = _getDocPrintStyles(orientation) + allPages;

  // inject cached measurements
  if(window._measTableCache) {
    Object.entries(window._measTableCache).forEach(([pid, html]) => {
      const el = document.getElementById('measItemsDiv_'+pid);
      if(el) el.innerHTML = html;
    });
  }

  window.print();
  setTimeout(() => pa.innerHTML = '', 2000);
}

// ===================== REPORTS =====================
let _rptPeriod='all';
function setRptPeriod(p){
  _rptPeriod=p;
  ['All','Month','Week'].forEach(x=>{
    const btn=document.getElementById('rptPeriod'+x);
    if(btn) btn.style.background=p.toLowerCase()===x.toLowerCase()?'var(--accent)':'transparent';
    if(btn) btn.style.color=p.toLowerCase()===x.toLowerCase()?'#fff':'var(--text)';
  });
  const mSel=document.getElementById('rptMonth');
  if(mSel) mSel.style.display=p==='month'?'block':'none';
  renderReports();
}
function filterByPeriod(projects){
  const now=new Date();
  const mSel=document.getElementById('rptMonth');
  const selMonth=mSel?+mSel.value:0;
  if(_rptPeriod==='week'){
    const weekAgo=new Date(now-7*864e5);
    return projects.filter(p=>{if(!p.contractDate)return false;const d=new Date(p.contractDate);return d>=weekAgo&&d<=now;});
  }
  if(_rptPeriod==='month'){
    if(selMonth){
      return projects.filter(p=>{if(!p.contractDate)return false;const d=new Date(p.contractDate);return d.getMonth()+1===selMonth&&d.getFullYear()===now.getFullYear();});
    }
    const monthAgo=new Date(now.getFullYear(),now.getMonth()-1,now.getDate());
    return projects.filter(p=>{if(!p.contractDate)return false;const d=new Date(p.contractDate);return d>=monthAgo&&d<=now;});
  }
  return projects;
}