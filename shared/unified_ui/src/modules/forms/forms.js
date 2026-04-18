// ============================================================
// 11-forms.js — استمارة التصنيع  (الإصدار 4)
// الهيكل: كل نوع قطاع → ألمنيوم + أكسسوارات + مواد تركيب
// الدمج:  قطاعات متشابهة بين أنواع مختلفة تُدمج وتُجمع كمياتها
// ============================================================

// ══ مفاتيح ثانوية ══════════════════════════════════════════
const FM_ALUM_COLORS_KEY  = 'pm_form_alum_colors';
const FM_GLASS_COLORS_KEY = 'pm_form_glass_colors';
const FM_ACC_TYPES_KEY    = 'pm_form_acc_types';

function fmLoad(key, def) { try { const v=localStorage.getItem(key); return v?JSON.parse(v):def; } catch(e){return def;} }
function fmSaveKey(key,val){ localStorage.setItem(key,JSON.stringify(val)); }

function fmGetAlumColors()  { return fmLoad(FM_ALUM_COLORS_KEY, []); }
function fmGetGlassColors() {
  return fmLoad(FM_GLASS_COLORS_KEY, [
    // شفاف
    'Clear - شفاف',
    // Tinted ملون
    'Tinted Bronze - بني ملون',
    'Tinted Blue - أزرق ملون',
    'Tinted Green - أخضر ملون',
    'Tinted Grey - رمادي ملون',
    'Tinted Blue-Green - أزرق مخضر ملون',
    // Reflective ريفلكتف
    'Reflective Bronze - بني ريفلكتف',
    'Reflective Blue - أزرق ريفلكتف',
    'Reflective Green - أخضر ريفلكتف',
    'Reflective Grey - رمادي ريفلكتف',
    'Reflective Blue-Green - أزرق مخضر ريفلكتف',
    // HD عاكس
    'HD Bronze - بني عاكس',
    'HD Blue - أزرق عاكس',
    'HD Green - أخضر عاكس',
    'HD Grey - رمادي عاكس',
    'HD Blue-Green - أزرق مخضر عاكس',
    // HD Plus عاكس بلس
    'HD Bronze Plus - بني عاكس بلس',
    'HD Blue Plus - أزرق عاكس بلس',
    'HD Green Plus - أخضر عاكس بلس',
    'HD Grey Plus - رمادي عاكس بلس',
    'HD Blue-Green Plus - أزرق مخضر عاكس بلس',
    // معالجات
    'Sandblasted - رش رمل',
    'Pinhead - رأس دبوس'
  ]);
}
function fmGetAccTypes()    { return fmLoad(FM_ACC_TYPES_KEY,    ['قلف','سرايا','استركشر','مفصلات']); }

// ══ دالة جلب اللوجو المفعّل ════════════════════════════════
function fmGetActiveLogo() {
  try {
    // أولاً: جرب ملف الشعارات المخصص
    const logos = JSON.parse(localStorage.getItem('pm_logos') || '[]');
    const active = logos.find(l=>l.active);
    if(active && active.data) return active.data;
    // ثانياً: أول شعار في القائمة
    if(logos.length && logos[0].data) return logos[0].data;
  } catch(e){}
  return null;
}

// ══ بناء هيدر اللوجو للطباعة ════════════════════════════════
function fmLogoHeader(companyName) {
  const logo = fmGetActiveLogo();
  if(!logo) return '';
  return `<div style="position:absolute;top:5mm;left:8mm;display:flex;align-items:center;gap:8px;z-index:10">
    <img src="${logo}" style="max-height:40px;max-width:120px;object-fit:contain">
    ${companyName?`<div style="font-size:8px;font-weight:700;color:#1a3a5c">${companyName}</div>`:''}
  </div>`;
}

// ══ وصول المشاريع ══════════════════════════════════════════
function fmGetProjects()  { try{return loadData().projects||[];}catch(e){return[];} }
function fmGetCompanies() { try{return loadData().companies||[];}catch(e){return[];} }
function fmGetRegions()   { try{return loadData().regions||[];}catch(e){return[];} }
function fmGetGalleries() { try{return loadData().galleries||[];}catch(e){return[];} }
function fmGetProject(id) { return fmGetProjects().find(p=>String(p.id)===String(id))||null; }

// ══ مفتاح حفظ استمارة المشروع ══════════════════════════════
function fmFormKey(id)  { return 'pm_mfg_form_'+id; }
function fmFormLoad(id) { return fmLoad(fmFormKey(id), null); }
function fmFormSave(id, data) { fmSaveKey(fmFormKey(id), data); }

// ══ اختيار المشروع ══════════════════════════════════════════
function openFormSelector() {
  const projects=fmGetProjects(), companies=fmGetCompanies(), regions=fmGetRegions(), galleries=fmGetGalleries();
  document.getElementById('fmSelectorModal')?.remove();
  const el=document.createElement('div');
  el.id='fmSelectorModal'; el.className='modal-bg'; el.style.zIndex='9999';
  el.innerHTML=`<div class="modal" style="max-width:520px">
    <div class="modal-header">
      <div class="modal-title">${t('📋 استمارة التصنيع — اختيار المشروع')}</div>
      <button class="btn btn-sm btn-secondary btn-icon" onclick="document.getElementById('fmSelectorModal').remove()">✕</button>
    </div>
    <div class="modal-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div class="form-group"><div class="form-label">${t('الشركة')}</div>
          <select id="fmSelCo" onchange="fmFilterProjects()" style="width:100%">
            <option value="">${t('— كل الشركات —')}</option>
            ${companies.map(c=>`<option value="${c}">${c}</option>`).join('')}
          </select></div>
        <div class="form-group"><div class="form-label">${t('المنطقة')}</div>
          <select id="fmSelReg" onchange="fmFilterProjects()" style="width:100%">
            <option value="">${t('— كل المناطق —')}</option>
            ${regions.map(r=>`<option value="${r}">${r}</option>`).join('')}
          </select></div>
        <div class="form-group"><div class="form-label">${t('المعرض')}</div>
          <select id="fmSelGal" onchange="fmFilterProjects()" style="width:100%">
            <option value="">${t('— كل المعارض —')}</option>
            ${galleries.map(g=>`<option value="${g}">${g}</option>`).join('')}
          </select></div>
        <div class="form-group"><div class="form-label">${t('المشروع')}</div>
          <select id="fmSelPrj" style="width:100%">
            <option value="">${t('— اختر —')}</option>
            ${projects.map(p=>`<option value="${p.id}">${p.name||'—'} ${p.contractNo?'('+p.contractNo+')':''}</option>`).join('')}
          </select></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid var(--border);padding-top:10px">
        <button class="btn btn-secondary" onclick="document.getElementById('fmSelectorModal').remove()">${t('إلغاء')}</button>
        <button class="btn btn-primary" onclick="fmOpenFromSelector()">${t('📋 فتح الاستمارة')}</button>
      </div>
    </div>
  </div>`;
  el._all = projects;
  document.body.appendChild(el);
}

function fmFilterProjects() {
  const co=document.getElementById('fmSelCo')?.value||'';
  const re=document.getElementById('fmSelReg')?.value||'';
  const ga=document.getElementById('fmSelGal')?.value||'';
  const sel=document.getElementById('fmSelPrj'); if(!sel)return;
  const all=document.getElementById('fmSelectorModal')?._all||fmGetProjects();
  const f=all.filter(p=>(!co||p.company===co)&&(!re||p.region===re)&&(!ga||p.gallery===ga));
  sel.innerHTML='<option value="">'+t('— اختر —')+'</option>'+f.map(p=>`<option value="${p.id}">${p.name||'—'} ${p.contractNo?'('+p.contractNo+')':''}</option>`).join('');
}

function fmOpenFromSelector() {
  const id=document.getElementById('fmSelPrj')?.value;
  if(!id){notify(t('⚠️ اختر مشروعاً أولاً'),'error');return;}
  document.getElementById('fmSelectorModal')?.remove();
  openManufacturingForm(id);
}

// ── اختيار مشروع لطلب الشراء ─────────────────────────────
// فتح طلب شراء مباشر من ملف العميل (بدون نافذة اختيار مشروع)
function openPurchaseOrderDirect(pid) {
  const cats = fmCatalogsLoad(), active = fmActiveCatGet();
  document.getElementById('fmPoDirectModal')?.remove();
  const el = document.createElement('div');
  el.id = 'fmPoDirectModal'; el.className = 'modal-bg'; el.style.zIndex = '9999';
  el.innerHTML = `<div class="modal" style="max-width:420px">
    <div class="modal-header">
      <div class="modal-title" style="color:#8e44ad">${t('🛒 طلب شراء')}</div>
      <button class="btn btn-sm btn-secondary btn-icon" onclick="document.getElementById('fmPoDirectModal').remove()">✕</button>
    </div>
    <div class="modal-body">
      <div style="background:#f3e5f5;border:1px solid #ce93d8;border-radius:8px;padding:10px 14px;margin-bottom:12px">
        <div style="font-size:12px;font-weight:700;color:#6a1b9a;margin-bottom:6px">${t('📦 المورد (الكتالوج):')}</div>
        <select id="fmPoDirectCat" style="width:100%;padding:6px 10px;border:2px solid #8e44ad;border-radius:6px;font-family:Cairo,sans-serif;font-size:13px;font-weight:700">
          <option value="">${t('— بدون كود محدد —')}</option>
          ${cats.map(c=>`<option value="${c.id}"${c.id===active?' selected':''}>${c.name}</option>`).join('')}
        </select>
        ${!cats.length?'<div style="font-size:11px;color:#888;margin-top:4px">'+t('لم تضف موردين بعد — ستُطبع بدون أكواد')+'</div>':''}
      </div>
      <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--surface2);border-radius:8px;margin-bottom:4px">
        <input type="checkbox" id="fmPoDirectShowImg" checked style="width:16px;height:16px;cursor:pointer">
        <label for="fmPoDirectShowImg" style="cursor:pointer;font-size:13px;font-weight:600">${t('📷 إظهار صور القطاعات')}</label>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid var(--border);padding-top:10px;margin-top:10px">
        <button class="btn btn-secondary" onclick="document.getElementById('fmPoDirectModal').remove()">${t('إلغاء')}</button>
        <button class="btn" style="background:#8e44ad;color:#fff" onclick="
          const catId=document.getElementById('fmPoDirectCat').value;
          const showImg=document.getElementById('fmPoDirectShowImg').checked;
          fmActiveCatSet(catId);
          document.getElementById('fmPoDirectModal').remove();
          fmPrintPurchaseOrder('${pid}', showImg);
        ">"+t('🛒 طباعة')+"</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(el);
}

function openPurchaseOrderSelector() {
  const projects=fmGetProjects(), cats=fmCatalogsLoad(), active=fmActiveCatGet();
  document.getElementById('fmPoSelectorModal')?.remove();
  const el=document.createElement('div');
  el.id='fmPoSelectorModal'; el.className='modal-bg'; el.style.zIndex='9999';
  el.innerHTML=`<div class="modal" style="max-width:520px">
    <div class="modal-header">
      <div class="modal-title" style="color:#8e44ad">${t('🛒 طلب شراء — اختيار المشروع')}</div>
      <button class="btn btn-sm btn-secondary btn-icon" onclick="document.getElementById('fmPoSelectorModal').remove()">✕</button>
    </div>
    <div class="modal-body">
      <div style="background:#f3e5f5;border:1px solid #ce93d8;border-radius:8px;padding:10px 14px;margin-bottom:12px">
        <div style="font-size:12px;font-weight:700;color:#6a1b9a;margin-bottom:6px">${t('📦 المورد (الكتالوج):')}</div>
        <select id="fmPoSelCat" style="width:100%;padding:6px 10px;border:2px solid #8e44ad;border-radius:6px;font-family:Cairo,sans-serif;font-size:13px;font-weight:700">
          <option value="">${t('— بدون كود محدد —')}</option>
          ${cats.map(c=>`<option value="${c.id}"${c.id===active?' selected':''}>${c.name}</option>`).join('')}
        </select>
        ${!cats.length?'<div style="font-size:11px;color:#c62828;margin-top:4px">'+t('⚠️ لم تضف موردين بعد — يمكنك الطباعة بدون أكواد')+'</div>':''}
      </div>
      <div class="form-group"><div class="form-label">${t('المشروع')}</div>
        <select id="fmPoSelPrj" style="width:100%">
          <option value="">${t('— اختر مشروعاً —')}</option>
          ${projects.map(p=>`<option value="${p.id}">${p.name||'—'} ${p.contractNo?'('+p.contractNo+')':''} — ${p.company||''}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--surface2);border-radius:8px;margin-bottom:4px">
        <input type="checkbox" id="fmPoShowImg" checked style="width:16px;height:16px;cursor:pointer">
        <label for="fmPoShowImg" style="cursor:pointer;font-size:13px;font-weight:600">${t('📷 إظهار صور القطاعات في طلب الشراء')}</label>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid var(--border);padding-top:10px">
        <button class="btn btn-secondary" onclick="document.getElementById('fmPoSelectorModal').remove()">${t('إلغاء')}</button>
        <button class="btn" style="background:#8e44ad;color:#fff" onclick="fmPrintPoFromSelector()">${t('🛒 طباعة طلب الشراء')}</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(el);
}

function fmPrintPoFromSelector() {
  const id=document.getElementById('fmPoSelPrj')?.value;
  if(!id){notify(t('⚠️ اختر مشروعاً أولاً'),'error');return;}
  const catId=document.getElementById('fmPoSelCat')?.value||'';
  const showImg=document.getElementById('fmPoShowImg')?.checked !== false;
  fmActiveCatSet(catId);
  document.getElementById('fmPoSelectorModal')?.remove();
  fmPrintPurchaseOrder(id, showImg);
}

// ══ فتح الاستمارة ══════════════════════════════════════════
function openManufacturingForm(projectId) {
  const project=fmGetProject(projectId);
  if(!project){notify(t('⚠️ المشروع غير موجود'),'error');return;}
  const plRows = (typeof getPLData==='function') ? (getPLData(projectId)||[]) : [];
  // دائماً ابن من عرض الأسعار (حتى تظهر التغييرات الجديدة)
  const fresh   = fmBuildFormData(project, plRows);
  // طبّق التعديلات اليدوية المحفوظة (سعر يدوي / كمية معدّلة) فوق البيانات الجديدة
  const saved   = fmFormLoad(projectId);
  const formData = saved ? fmMergeManualEdits(fresh, saved) : fresh;
  fmOpenEditor(project, formData);
}

// دمج التعديلات اليدوية المحفوظة مع البيانات المبنية حديثاً
// القاعدة: البنود الجديدة تُضاف، التعديلات اليدوية (سعر/كمية) تُحفظ للبنود الموجودة
function fmMergeManualEdits(fresh, saved) {
  function mergeArr(freshArr, savedArr, keyFn) {
    const savedMap = {};
    (savedArr||[]).forEach(r => { if(!r.isGroup) savedMap[keyFn(r)] = r; });
    return (freshArr||[]).map(r => {
      if(r.isGroup) return r;
      const key = keyFn(r);
      const s = savedMap[key];
      if(!s) return r; // بند جديد — خذه كما هو
      // احتفظ بالكمية والسعر اليدوي إذا تم تعديلهما
      return { ...r,
        quantity:  s.quantity  !== undefined ? s.quantity  : r.quantity,
        unitPrice: s.unitPrice !== undefined ? s.unitPrice : r.unitPrice,
      };
    });
  }
  const alumKey = r => (r.code||'').trim() || (r.desc||r.description||'').trim();
  const descKey = r => (r.desc||r.description||'').trim();
  return {
    ...fresh,
    aluminum:     mergeArr(fresh.aluminum,     saved.aluminum,     alumKey),
    accessories:  mergeArr(fresh.accessories,  saved.accessories,  descKey),
    installation: mergeArr(fresh.installation, saved.installation, descKey),
    wages:  saved.wages  || fresh.wages,
    fixed:  saved.fixed  || fresh.fixed,
    rates:  { ...fresh.rates, ...(saved.rates||{}) }, // احتفظ بالنسب المعدّلة
    meta:   saved.meta   || fresh.meta,
  };
}

// ══ بناء بيانات الاستمارة من عرض الأسعار ══════════════════
// المنطق: كل نوع يحمل كمياته — الدمج على أساس الرمز (code)
function fmBuildFormData(project, plRows) {
  const allTypes = fmTypesLoad();
  const kgPrice  = fmKgPriceGet();

  // أسماء الأنواع النشطة من عرض الأسعار
  const activeNames = [...new Set((plRows||[]).map(r=>r.sectionName).filter(Boolean))];
  const namesToUse  = activeNames.length > 0 ? activeNames : allTypes.map(t=>t.name);

  // ── دمج الألمنيوم — المفتاح = الرمز أو الوصف ──────────────
  const alumMap = {}, alumOrder = [];
  namesToUse.forEach(name => {
    const typeObj = allTypes.find(t => t.name === name);
    if(!typeObj) return;
    const plMatch = (plRows||[]).find(r=>r.sectionName===name);
    const typeQty = plMatch ? (plMatch.count||1) : 1;
    (typeObj.aluminum||[]).forEach(sec => {
      const secQty = (parseFloat(sec.qty)||1) * typeQty;
      const key = (sec.code||'').trim() || (sec.desc||'').trim();
      if(!key) return;
      if(!alumMap[key]) {
        alumMap[key] = { ...sec, quantity:0,
          unitPrice:   fmCalcBarPrice(sec.barLen, sec.kgM, kgPrice),
          barWeightKg: fmCalcBarWeight(sec.barLen, sec.kgM) };
        alumOrder.push(key);
      }
      alumMap[key].quantity += secQty;
    });
  });

  // ── دمج الأكسسوارات — المفتاح = الوصف (لا كود للأكسسوارات) ──
  const accMap = {}, accOrder = [];
  namesToUse.forEach(name => {
    const typeObj = allTypes.find(t => t.name === name);
    if(!typeObj) return;
    const plMatch = (plRows||[]).find(r=>r.sectionName===name);
    const typeQty = plMatch ? (plMatch.count||1) : 1;
    (typeObj.accessories||[]).forEach(acc => {
      const accQty = (parseFloat(acc.qty)||1) * typeQty;
      const key = (acc.desc||'').trim();
      if(!key) return;
      if(!accMap[key]) {
        // نحتفظ بأعلى سعر وجدناه للأكسسوار (أو أول سعر)
        accMap[key] = { ...acc, quantity:0, unitPrice: parseFloat(acc.unitPrice)||0 };
        accOrder.push(key);
      }
      accMap[key].quantity += accQty;
      // إذا السعر مو موجود خذه من أول صف فيه قيمة
      if(!accMap[key].unitPrice && parseFloat(acc.unitPrice)) {
        accMap[key].unitPrice = parseFloat(acc.unitPrice);
      }
    });
  });

  // ── دمج التركيب — بدون تكرار ─────────────────────────────
  const instMap = {}, instOrder = [];
  namesToUse.forEach(name => {
    const typeObj = allTypes.find(t => t.name === name);
    if(!typeObj) return;
    (typeObj.installation||[]).forEach(it => {
      const key = (it.desc||'').trim();
      if(!key || instMap[key]) return;
      instMap[key] = { ...it, quantity: it.quantity||1 };
      instOrder.push(key);
    });
  });

  return {
    aluminum:     alumOrder.map(k=>alumMap[k]),
    accessories:  accOrder.map(k=>accMap[k]),
    installation: instOrder.map(k=>instMap[k]),
    wages: [], // تُحسب تلقائياً في fmBuildInstall (10% من المستخلص)
    fixed: [], // تُحسب تلقائياً في fmBuildInstall (5% من المستخلص)
    rates: {admin:10, sales:10, company:20, wagesPct:10, fixedPct:5},
  };
}

function fmSumRows(rows){
  return (rows||[]).reduce((s,r)=>s+(r.isGroup?0:((parseFloat(r.quantity)||0)*(parseFloat(r.unitPrice)||0))),0);
}
// استخراج قيمة المستخلص من بيانات المشروع أو plRows
function fmGetExtractValues(pid, projObj) {
  const proj = projObj || fmGetProject(pid) || {};
  const contrV = parseFloat(proj.contractValue||0)||0;
  // أولاً: هل proj.extractValue مخزَّن؟
  const storedExt = parseFloat(proj.extractValue||0)||0;
  if(storedExt > 0) {
    // مخزَّن شامل 15% ضريبة
    return {
      before: Math.round(storedExt / 1.15 * 100) / 100,
      after:  storedExt
    };
  }
  // ثانياً: احسب من plRows (عرض الأسعار)
  const plRows = (typeof getPLData==='function') ? (getPLData(proj.id||pid)||[]) : [];
  // plRows قد تحتوي totalBefore أو totalValue أو نحسب count × pricePerM2
  const plTotal = plRows.reduce((s,r) => {
    const t = parseFloat(r.totalBefore||r.totalValue||r.total||0)||0;
    if(t > 0) return s + t;
    // fallback: count × (pricePerM2 || pricePerUnit || unitPrice)
    const cnt = parseFloat(r.count||r.quantity||1)||1;
    const prc = parseFloat(r.pricePerM2||r.pricePerUnit||r.unitPrice||0)||0;
    const area= parseFloat(r.area||r.totalArea||0)||0;
    return s + (area > 0 ? area * prc : cnt * prc);
  }, 0);
  if(plTotal > 0) {
    return { before: plTotal, after: Math.round(plTotal * 1.15 * 100) / 100 };
  }
  // fallback: 90% من قيمة العقد
  return { before: contrV * 0.9, after: contrV * 1.15 };
}

// ══ محرر الاستمارة ══════════════════════════════════════════
function fmOpenEditor(project, formData) {
  document.getElementById('fmEditorModal')?.remove();
  const modal=document.createElement('div');
  modal.id='fmEditorModal'; modal.className='modal-bg';
  modal.style.cssText='z-index:9998;align-items:flex-start;padding-top:14px;overflow-y:auto';
  modal.innerHTML=`
    <div class="modal" style="max-width:1120px;width:97vw;max-height:100vh;overflow:hidden;display:flex;flex-direction:column">
      <div class="modal-header" style="flex-shrink:0">
        <div class="modal-title">${t('📋 استمارة التصنيع —')} ${project.name||''}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-sm btn-success"   onclick="fmSave('${project.id}')">${t('💾 حفظ')}</button>
          <!-- زر التحديث تم إلغاؤه — التعريف تلقائي من عرض الأسعار عند فتح الاستمارة -->
          <button class="btn btn-sm btn-primary"   onclick="fmPrint('${project.id}')">${t('🖨️ طباعة')}</button>
          <button class="btn btn-sm" style="background:#8e44ad;color:#fff" onclick="fmPrintPurchaseOrder('${project.id}')">${t('🛒 طلب شراء')}</button>
          <button class="btn btn-sm btn-secondary btn-icon" onclick="document.getElementById('fmEditorModal').remove()">✕</button>
        </div>
      </div>
      <div class="tabs" style="flex-shrink:0;margin:0;border-radius:0;border-top:1px solid var(--border)">
        <div class="tab active" id="fmT-alum"  onclick="fmTab('alum',this)">${t('🔩 خامات الألمنيوم')}</div>
        <div class="tab"        id="fmT-acc"   onclick="fmTab('acc',this)">${t('🔧 الأكسسوارات')}</div>
        <div class="tab"        id="fmT-inst"  onclick="fmTab('inst',this)">${t('🔨 مواد التركيب')}</div>
        <div class="tab"        id="fmT-study" onclick="fmTab('study',this)">${t('📊 دراسة المشروع')}</div>
      </div>
      <div style="flex:1;overflow-y:auto;padding:14px">
        <div id="fmP-alum">${fmBuildTable('alum',formData.aluminum||[],project.id,true)}</div>
        <div id="fmP-acc"  style="display:none">${fmBuildTable('acc',formData.accessories||[],project.id,false)}</div>
        <div id="fmP-inst" style="display:none">${fmBuildInstall(formData,project.id)}</div>
        <div id="fmP-study"style="display:none">${fmBuildStudy(formData,project)}</div>
      </div>
    </div>`;
  modal._fd = formData;
  modal._pid = project.id;
  document.body.appendChild(modal);
}

function fmTab(t,el){
  ['alum','acc','inst','study'].forEach(x=>{
    document.getElementById('fmP-'+x).style.display=x===t?'':'none';
    document.getElementById('fmT-'+x)?.classList.toggle('active',x===t);
  });
  if(t==='study') fmCalcStudy(document.getElementById('fmEditorModal')?._pid);
}

function fmRebuild(pid) {
  if(!confirm(t('إعادة بناء البنود من عرض الأسعار — ستُفقد التعديلات غير المحفوظة؟')))return;
  const proj=fmGetProject(pid); if(!proj)return;
  const plRows=(typeof getPLData==='function')?(getPLData(pid)||[]):[];
  const modal=document.getElementById('fmEditorModal'); if(!modal)return;
  const fd=fmBuildFormData(proj,plRows);
  modal._fd=fd;
  document.getElementById('fmP-alum').innerHTML=fmBuildTable('alum',fd.aluminum||[],pid,true);
  document.getElementById('fmP-acc').innerHTML=fmBuildTable('acc',fd.accessories||[],pid,false);
  document.getElementById('fmP-inst').innerHTML=fmBuildInstall(fd,pid);
  notify(t('✅ تم التحديث من عرض الأسعار'));
}

// ── جدول ألمنيوم / أكسسوارات ──────────────────────────────
function fmBuildTable(type, rows, pid, isAlum) {
  if(!rows.length) return `<div style="color:var(--text2);padding:30px;text-align:center">${t('لا توجد بنود — اضغط تحديث من عرض الأسعار')}</div>`;
  const kp = fmKgPriceGet();
  const total = fmSumRows(rows);

  const rHtml = rows.map((r,i)=>{
    if(r.isGroup) return `<tr style="background:var(--surface2)">
      <td colspan="${isAlum?9:6}" style="padding:7px 12px;font-weight:700;color:var(--accent);font-size:12px">
        ◆ ${r.description}
        <span style="font-size:10px;font-weight:400;color:var(--text2);margin-right:6px">(${rows.slice(i+1).findIndex(x=>x.isGroup||i===rows.length-1) < 0 ? rows.slice(i+1).length : rows.slice(i+1).findIndex(x=>x.isGroup)} بند)</span>
      </td></tr>`;
    const qty=parseFloat(r.quantity)||0, pr=parseFloat(r.unitPrice)||0, tot=qty*pr;
    const bk=parseFloat(r.barWeightKg)||0, tk=Math.round(qty*bk*100)/100;
    const qI=`<input type="number" value="${qty}" min="0" step="any"
      style="width:70px;padding:3px 5px;border:1px solid var(--border);border-radius:4px;font-family:Cairo,sans-serif;font-size:11px;background:var(--surface);color:var(--text)"
      oninput="fmUpd('${type}',${i},'quantity',+this.value);fmRefTot('${type}',${i})">`;
    const pI=`<input type="number" value="${pr}" min="0" step="any"
      style="width:80px;padding:3px 5px;border:1px solid var(--border);border-radius:4px;font-family:Cairo,sans-serif;font-size:11px;background:var(--surface);color:var(--text)"
      oninput="fmUpd('${type}',${i},'unitPrice',+this.value);fmRefTot('${type}',${i})">`;
    // _manual = صنف مضاف يدوياً → حقل وصف قابل للتحرير
    const isManual = r._manual === true;
    const descVal  = (r.desc||r.description||'').replace(/"/g,'&quot;');
    const descColor = isManual ? 'border:1px solid var(--accent2);background:#fffbe6' : 'border:1px solid var(--border);background:var(--surface)';
    const descCell = isManual
      ? `<input value="${descVal}" placeholder="${t('✏️ اكتب اسم الصنف هنا...')}"
           style="width:100%;padding:3px 6px;${descColor};border-radius:4px;font-family:Cairo,sans-serif;font-size:11px;color:var(--text);font-weight:600"
           oninput="fmUpd('${type}',${i},'desc',this.value)">`
      : `${r.desc||r.description||''}`;
    if(isAlum) return `<tr id="fmR_${type}_${i}">
      <td style="padding:3px 6px;font-size:11px">${descCell}</td>
      <td style="padding:2px 4px;text-align:center;font-size:10px;color:var(--text2)">${r.barLen||''}</td>
      <td style="padding:2px 4px;text-align:center;font-size:10px;color:var(--text2)">${r.kgM||0}</td>
      <td style="padding:2px 4px;text-align:center;font-size:10.5px;color:var(--accent2)">${bk.toFixed(3)}</td>
      <td style="padding:2px 4px">${qI}</td>
      <td style="padding:2px 4px">${pI}</td>
      <td id="fmTot_${type}_${i}" style="padding:2px 8px;font-size:11.5px;font-weight:600;color:var(--accent2);white-space:nowrap">
        ${tot.toLocaleString('en-US',{minimumFractionDigits:2})}
        ${qty>0&&bk>0?`<div style="font-size:9px;color:var(--text2)">${tk.toFixed(2)} كغ</div>`:''}
      </td>
      <td style="padding:2px 3px"><button class="btn btn-sm btn-danger btn-icon" style="padding:1px 5px;font-size:10px" onclick="fmDel('${type}',${i},'${pid}',true)">✕</button></td>
    </tr>`;
    const unitCell = isManual
      ? `<input value="${r.unit||'حبة'}" style="width:54px;padding:2px 4px;border:1px solid var(--accent2);background:#fffbe6;border-radius:4px;font-family:Cairo,sans-serif;font-size:10px;color:var(--text);text-align:center" oninput="fmUpd('${type}',${i},'unit',this.value)">`
      : `<span style="font-size:10.5px;color:var(--text2)">${r.unit||''}</span>`;
    return `<tr id="fmR_${type}_${i}">
      <td style="padding:3px 8px;font-size:11.5px">${descCell}</td>
      <td style="padding:2px 4px;text-align:center">${unitCell}</td>
      <td style="padding:2px 4px">${qI}</td>
      <td style="padding:2px 4px">${pI}</td>
      <td id="fmTot_${type}_${i}" style="padding:2px 8px;font-size:11.5px;font-weight:600;color:var(--accent2)">${tot.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
      <td style="padding:2px 3px"><button class="btn btn-sm btn-danger btn-icon" style="padding:1px 5px;font-size:10px" onclick="fmDel('${type}',${i},'${pid}',false)">✕</button></td>
    </tr>`;
  }).join('');

  const alumHead=isAlum?`<th style="padding:5px;border:1px solid var(--border);font-size:9px;width:68px;text-align:center">${t('طول البار')}</th>
    <th style="padding:5px;border:1px solid var(--border);font-size:9px;width:58px;text-align:center">${t('كغ/م')}</th>
    <th style="padding:5px;border:1px solid var(--border);font-size:9px;width:65px;text-align:center">${t('وزن البار')}</th>`:'';

  return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px">
    <div style="font-size:13px;font-weight:700;color:var(--accent)">${t('الإجمالي:')} <span style="color:var(--accent2)">${total.toLocaleString('en-US',{minimumFractionDigits:2})} ر.س</span></div>
    <button class="btn btn-sm btn-success" onclick="fmAdd('${type}','${pid}',${isAlum})">${t('➕ إضافة صنف')}</button>
  </div>
  <div style="overflow-x:auto">
  <table style="width:100%;border-collapse:collapse;font-family:Cairo,sans-serif">
    <thead><tr style="background:var(--surface2)">
      <th style="padding:6px;text-align:right;border:1px solid var(--border);font-size:11px">${t('البيان')}</th>
      ${isAlum?'':` <th style="padding:5px;border:1px solid var(--border);font-size:9px;width:60px;text-align:center">${t('الوحدة')}</th>`}
      ${alumHead}
      <th style="padding:5px;border:1px solid var(--border);font-size:9px;width:76px;text-align:center">${t('الكمية')}</th>
      <th style="padding:5px;border:1px solid var(--border);font-size:9px;width:85px;text-align:center">${t('سعر الوحدة')}</th>
      <th style="padding:5px;border:1px solid var(--border);font-size:9px;width:110px;text-align:center">${t('القيمة')}</th>
      <th style="width:28px;border:1px solid var(--border)"></th>
    </tr></thead>
    <tbody id="fmTb_${type}">${rHtml}</tbody>
  </table></div>`;
}

function fmRefTot(type,i){
  const fd=document.getElementById('fmEditorModal')?._fd; if(!fd)return;
  const arr=type==='alum'?fd.aluminum:fd.accessories;
  if(!arr?.[i]||arr[i].isGroup)return;
  const r=arr[i], qty=parseFloat(r.quantity)||0, pr=parseFloat(r.unitPrice)||0, tot=qty*pr;
  const bk=parseFloat(r.barWeightKg)||0, tk=Math.round(qty*bk*100)/100;
  const el=document.getElementById(`fmTot_${type}_${i}`); if(!el)return;
  if(type==='alum') el.innerHTML=`${tot.toLocaleString('en-US',{minimumFractionDigits:2})}${qty>0&&bk>0?`<div style="font-size:9px;color:var(--text2)">${tk.toFixed(2)} كغ</div>`:''}`;
  else el.textContent=tot.toLocaleString('en-US',{minimumFractionDigits:2});
}
function fmUpd(type,i,f,v){
  const fd=document.getElementById('fmEditorModal')?._fd; if(!fd)return;
  const arr=type==='alum'?fd.aluminum:fd.accessories;
  if(arr?.[i]) arr[i][f]=v;
}
function fmDel(type,i,pid,isAlum){
  const modal=document.getElementById('fmEditorModal'); if(!modal?._fd)return;
  const arr=type==='alum'?modal._fd.aluminum:modal._fd.accessories;
  arr.splice(i,1);
  document.getElementById(`fmP-${type}`).innerHTML=fmBuildTable(type,arr,pid,isAlum);
}
function fmAdd(type,pid,isAlum){
  const modal=document.getElementById('fmEditorModal'); if(!modal?._fd)return;
  const arr=type==='alum'?modal._fd.aluminum:modal._fd.accessories;
  arr.push({id:'n'+Date.now(), desc:'', unit:isAlum?'عود':'حبة', quantity:0, unitPrice:0, _manual:true});
  document.getElementById(`fmP-${type}`).innerHTML=fmBuildTable(type,arr,pid,isAlum);
  // تحديد حقل الوصف في الصف الجديد تلقائياً
  setTimeout(()=>{
    const inputs=document.querySelectorAll(`#fmP-${type} tbody tr:last-child input[placeholder]`);
    if(inputs.length) { inputs[0].focus(); inputs[0].scrollIntoView({behavior:'smooth',block:'nearest'}); }
  }, 50);
}

// ── مواد التركيب ────────────────────────────────────────────
// جدول عمال الإنتاج حسب قيمة العقد
function fmCalcProdWorkers(contrV) {
  if(contrV <  50000) return 3;
  if(contrV < 150000) return 5;
  if(contrV < 300000) return 8;
  return 12;
}

function fmBuildInstall(fd,pid){
  const inst=fd.installation||[];
  const proj = fmGetProject(pid)||{};
  const contrV  = parseFloat(proj.contractValue||0)||0;
  const {before: extBase, after: extAfterTaxI} = fmGetExtractValues(pid, proj);

  const rr = fd.rates||{};
  // راتب يومي = 2500 ÷ 26 يوم عمل
  const MONTHLY_SAL = parseFloat(rr.monthlySal ?? 2500);
  const WORK_DAYS   = parseFloat(rr.workDays   ?? 26);
  const DAILY_RATE  = Math.round(MONTHLY_SAL / WORK_DAYS * 100) / 100;
  const wagesPct    = parseFloat(rr.wagesPct   ?? 10);  // 10% أجور عمال
  const fixedPct    = parseFloat(rr.fixedPct   ?? 5);   // 5% مصارف ثابتة

  const wagesAmt  = extBase * wagesPct / 100;  // إجمالي أجور العمال
  const fixedAmt  = extBase * fixedPct / 100;  // المصارف الثابتة

  // ── توزيع الأجور ──
  // التركيب: 5 عمال ثابت، حد أقصى 8 أيام
  const INSTALL_WORKERS = 5;
  const MAX_INSTALL_DAYS = 8;
  // أجور التركيب = 5 عمال × أيام × الراتب اليومي (لا تتجاوز 8 أيام)
  const installDays    = wagesAmt > 0 ? Math.min(MAX_INSTALL_DAYS, Math.ceil((wagesAmt/2) / (INSTALL_WORKERS * DAILY_RATE))) : 0;
  const wages2Amt      = installDays * INSTALL_WORKERS * DAILY_RATE;
  // أجور الإنتاج = الباقي من إجمالي الأجور
  const wages1Amt      = Math.max(0, wagesAmt - wages2Amt);

  // عدد عمال الإنتاج حسب قيمة العقد (قابل للتعديل اليدوي)
  const autoProdWorkers = fmCalcProdWorkers(contrV);
  const prodWorkers     = parseFloat(rr.manualProdWorkers||0) || autoProdWorkers;
  const prodDays        = wages1Amt > 0 ? Math.ceil(wages1Amt / (prodWorkers * DAILY_RATE)) : 0;

  const N = v => v.toLocaleString('en-US',{minimumFractionDigits:2});

  // حدّث fd
  fd.rates = { ...rr, wagesPct, fixedPct, monthlySal: MONTHLY_SAL, workDays: WORK_DAYS, manualProdWorkers: parseFloat(rr.manualProdWorkers||0) };
  fd.wages = [
    {id:'w1', desc:'عمال الإنتاج',  unit:'يوم', quantity: prodDays,    unitPrice: Math.round(prodWorkers*DAILY_RATE*100)/100,    _auto:true},
    {id:'w2', desc:'عمال التركيب',  unit:'يوم', quantity: installDays, unitPrice: Math.round(INSTALL_WORKERS*DAILY_RATE*100)/100, _auto:true},
  ];
  fd.fixed = [
    {id:'f1', desc:'مصارف ثابتة للمصنع', unit:'%', quantity: fixedPct, unitPrice: extBase/100, _auto:true},
  ];

  const inpStyle = `width:70px;padding:3px 5px;border:1px solid var(--border);border-radius:4px;font-family:Cairo,sans-serif;font-size:11px;background:var(--surface);color:var(--text)`;

  // جدول مواد التركيب (يدوي)
  const instSec = `<div style="margin-bottom:18px">
    <div style="font-weight:700;color:var(--accent);font-size:12px;margin-bottom:6px">${t('◆ مواد التركيب الثابتة')}</div>
    <table style="width:100%;border-collapse:collapse;font-size:11.5px;font-family:Cairo,sans-serif">
      <thead><tr style="background:var(--surface2)">
        <th style="padding:5px 8px;text-align:right;border:1px solid var(--border)">${t('البيان')}</th>
        <th style="padding:5px;border:1px solid var(--border);width:62px;text-align:center">${t('الوحدة')}</th>
        <th style="padding:5px;border:1px solid var(--border);width:85px;text-align:center">${t('الكمية')}</th>
        <th style="padding:5px;border:1px solid var(--border);width:95px;text-align:center">${t('سعر الوحدة')}</th>
        <th style="padding:5px;border:1px solid var(--border);width:110px;text-align:center">${t('القيمة')}</th>
      </tr></thead>
      <tbody>${inst.map((r,i)=>`<tr>
        <td style="padding:3px 8px">${r.desc||r.description||''}</td>
        <td><input value="${r.unit||''}" style="${inpStyle};width:58px"
          oninput="fmUpdInst('installation',${i},'unit',this.value)"></td>
        <td><input type="number" value="${r.quantity||0}" step="any" style="${inpStyle}"
          oninput="fmUpdInst('installation',${i},'quantity',+this.value)"></td>
        <td><input type="number" value="${r.unitPrice||0}" step="any" style="${inpStyle};width:90px"
          oninput="fmUpdInst('installation',${i},'unitPrice',+this.value)"></td>
        <td style="padding:3px 8px;font-weight:600;color:var(--accent2)">${((r.quantity||0)*(r.unitPrice||0)).toLocaleString('en-US',{minimumFractionDigits:2})}</td>
      </tr>`).join('')}</tbody>
    </table></div>`;

  // بطاقة الأجور والمصارف
  const autoSec = `<div style="background:var(--surface2);border-radius:10px;padding:14px;border:1px solid var(--border)">
    <div style="font-weight:700;color:var(--accent);font-size:13px;margin-bottom:10px">${t('⚡ الأجور والمصارف (تلقائية من قيمة المستخلص — قابلة للتعديل)')}</div>

    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:14px;font-size:11px;background:var(--surface);border-radius:8px;padding:10px">
      <div>${t('قيمة العقد:')} <b style="color:var(--accent2)">${N(contrV)} ر.س</b></div>
      <div>|</div>
      <div>${t('المستخلص (90%):')} <b style="color:var(--accent2)">${N(extBase)} ر.س</b></div>
      <div>|</div>
      <div>${t('الراتب الشهري:')} <input type="number" id="fmMonthlySal" value="${MONTHLY_SAL}" min="500" step="100"
        style="${inpStyle};width:85px" oninput="fmUpdAutoRates('${pid}')">${t('ر.س')}</div>
      <div>${t('÷ أيام العمل:')} <input type="number" id="fmWorkDays" value="${WORK_DAYS}" min="20" max="31" step="1"
        style="${inpStyle};width:55px" oninput="fmUpdAutoRates('${pid}')"> يوم</div>
      <div>= <b style="color:var(--accent)" id="fmDailyRateLabel">${N(DAILY_RATE)} ر.س/يوم</b></div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:11.5px;font-family:Cairo,sans-serif">
      <thead><tr style="background:var(--surface)">
        <th style="padding:6px 8px;text-align:right;border:1px solid var(--border)">${t('البيان')}</th>
        <th style="padding:5px;border:1px solid var(--border);width:80px;text-align:center">${t('% من المستخلص')}</th>
        <th style="padding:5px;border:1px solid var(--border);width:110px;text-align:center">${t('القيمة')}</th>
        <th style="padding:5px;border:1px solid var(--border);width:90px;text-align:center">${t('عدد العمال')}</th>
        <th style="padding:5px;border:1px solid var(--border);width:85px;text-align:center">${t('أيام العمل')}</th>
      </tr></thead>
      <tbody>
        <tr>
          <td style="padding:6px 8px">
            👷 ${t('عمال الإنتاج / التصنيع')}
            <div style="font-size:9px;color:var(--text2)">${t('تلقائي حسب قيمة العقد:')} ${autoProdWorkers} t('عامل')</div>
          </td>
          <td style="text-align:center;padding:4px">
            <input type="number" id="fmWagesPct" value="${wagesPct/2}" min="0" max="50" step="0.5"
              style="${inpStyle}" oninput="fmUpdAutoRates('${pid}')"> %
          </td>
          <td style="text-align:center;font-weight:600;color:var(--accent2);padding:4px" id="fmWages1Val">${N(wages1Amt)} ر.س</td>
          <td style="text-align:center;padding:4px">
            <input type="number" id="fmProdWorkers" value="${prodWorkers}" min="1" max="50" step="1"
              style="${inpStyle}" oninput="fmUpdAutoRates('${pid}')"> ${t('عامل')}
          </td>
          <td style="text-align:center;padding:4px">
            <span style="font-weight:700;color:#1e5c9e;font-size:14px" id="fmProdDays">${prodDays}</span>
            <span style="font-size:10px;color:var(--text2)">${t('يوم')}</span>
          </td>
        </tr>
        <tr style="background:var(--surface2)">
          <td style="padding:6px 8px">
            🔧 ${t('فرقة التركيب')}
            <div style="font-size:9px;color:var(--text2)">${INSTALL_WORKERS} t('عمال ثابت — حد أقصى') ${MAX_INSTALL_DAYS} t('أيام')</div>
          </td>
          <td style="text-align:center;padding:4px">
            <input type="number" id="fmWages2Pct" value="${wagesPct/2}" min="0" max="50" step="0.5"
              style="${inpStyle}" oninput="fmUpdAutoRates('${pid}')"> %
          </td>
          <td style="text-align:center;font-weight:600;color:var(--accent2);padding:4px" id="fmWages2Val">${N(wages2Amt)} ر.س</td>
          <td style="text-align:center;padding:4px;color:var(--text2);font-size:11px">${INSTALL_WORKERS} t('ثابت')</td>
          <td style="text-align:center;padding:4px">
            <span style="font-weight:700;color:#1e5c9e;font-size:14px" id="fmInstDays">${installDays}</span>
            <span style="font-size:10px;color:var(--text2)">${t('يوم')}</span>
            ${installDays >= MAX_INSTALL_DAYS ? '<div style="font-size:9px;color:#e67e22;font-weight:700">'+t('⚠️ الحد الأقصى')+'</div>' : ''}
          </td>
        </tr>
        <tr>
          <td style="padding:6px 8px">${t('🏭 مصارف ثابتة للمصنع')}</td>
          <td style="text-align:center;padding:4px">
            <input type="number" id="fmFixedPct" value="${fixedPct}" min="0" max="50" step="0.5"
              style="${inpStyle}" oninput="fmUpdAutoRates('${pid}')"> %
          </td>
          <td style="text-align:center;font-weight:600;color:var(--accent2);padding:4px" id="fmFixedVal">${N(fixedAmt)} ر.س</td>
          <td colspan="2"></td>
        </tr>
      </tbody>
      <tfoot><tr style="background:var(--surface)">
        <td colspan="2" style="padding:6px 8px;font-weight:700">${t('الإجمالي')}</td>
        <td style="text-align:center;font-weight:700;color:var(--accent2);padding:5px" id="fmAutoTotal">${N(wagesAmt+fixedAmt)} ر.س</td>
        <td colspan="2"></td>
      </tr></tfoot>
    </table>
  </div>`;

  return instSec + autoSec;
}

function fmUpdAutoRates(pid){
  const modal = document.getElementById('fmEditorModal'); if(!modal?._fd) return;
  const fd = modal._fd;
  const proj = fmGetProject(pid)||{};
  const contrV   = parseFloat(proj.contractValue||0)||0;
  const {before: extBase} = fmGetExtractValues(pid, proj);
  const p1       = parseFloat(document.getElementById('fmWagesPct')?.value)||0;
  const p2       = parseFloat(document.getElementById('fmWages2Pct')?.value)||0;
  const pF       = parseFloat(document.getElementById('fmFixedPct')?.value)||0;
  const monthlySal = parseFloat(document.getElementById('fmMonthlySal')?.value)||2500;
  const workDays   = parseFloat(document.getElementById('fmWorkDays')?.value)||26;
  const dailyRate  = Math.round(monthlySal / workDays * 100) / 100;
  const prodW      = parseFloat(document.getElementById('fmProdWorkers')?.value)||1;
  const N = v => v.toLocaleString('en-US',{minimumFractionDigits:2});

  const INSTALL_WORKERS  = 5;
  const MAX_INSTALL_DAYS = 8;
  const wagesAmt = extBase * (p1 + p2) / 100;
  const aF       = extBase * pF / 100;

  // نفس منطق fmBuildInstall
  const installDays = wagesAmt > 0 ? Math.min(MAX_INSTALL_DAYS, Math.ceil((wagesAmt/2) / (INSTALL_WORKERS * dailyRate))) : 0;
  const a2          = installDays * INSTALL_WORKERS * dailyRate;
  const a1          = Math.max(0, wagesAmt - a2);
  const prodDays    = a1 > 0 ? Math.ceil(a1 / (prodW * dailyRate)) : 0;

  // تحديث fd
  if(!fd.rates) fd.rates={};
  fd.rates.wagesPct = p1 + p2;
  fd.rates.fixedPct = pF;
  fd.rates.monthlySal = monthlySal;
  fd.rates.workDays   = workDays;
  fd.rates.manualProdWorkers = prodW;
  fd.wages = [
    {id:'w1', desc:'عمال الإنتاج',  unit:'يوم', quantity:prodDays,    unitPrice:Math.round(prodW*dailyRate*100)/100,           _auto:true},
    {id:'w2', desc:'عمال التركيب',  unit:'يوم', quantity:installDays, unitPrice:Math.round(INSTALL_WORKERS*dailyRate*100)/100,  _auto:true},
  ];
  fd.fixed = [
    {id:'f1', desc:'مصارف ثابتة للمصنع', unit:'%', quantity:pF, unitPrice:extBase/100, _auto:true},
  ];

  // تحديث الواجهة
  const elDR=document.getElementById('fmDailyRateLabel'); if(elDR) elDR.textContent=N(dailyRate)+' ر.س/يوم';
  const el1=document.getElementById('fmWages1Val');  if(el1) el1.textContent=N(a1)+' ر.س';
  const el2=document.getElementById('fmWages2Val');  if(el2) el2.textContent=N(a2)+' ر.س';
  const elF=document.getElementById('fmFixedVal');   if(elF) elF.textContent=N(aF)+' ر.س';
  const elT=document.getElementById('fmAutoTotal');  if(elT) elT.textContent=N(a1+a2+aF)+' ر.س';
  const elPD=document.getElementById('fmProdDays');  if(elPD) elPD.textContent=prodDays;
  const elID=document.getElementById('fmInstDays');  if(elID) elID.textContent=installDays;
}
function fmUpdInst(key,i,f,v){
  const fd=document.getElementById('fmEditorModal')?._fd; if(!fd)return;
  const arr=fd[key]; if(arr?.[i]) arr[i][f]=v;
}

// ── دراسة المشروع ───────────────────────────────────────────
function fmBuildStudy(fd,project){
  const r=fd.rates||{};
  return `<div style="background:var(--surface2);border-radius:10px;padding:12px;margin-bottom:14px;border:1px solid var(--border)">
    <div style="font-weight:700;color:var(--accent);font-size:13px;margin-bottom:10px">${t('⚙️ النسب الثابتة')}</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
      ${[[t('المصاريف الإدارية'),'admin'],[t('المبيعات'),'sales'],[t('الشركة'),'company']].map(([l,k])=>`
        <div class="form-group"><div class="form-label">${l}</div>
          <div style="display:flex;align-items:center;gap:4px">
            <input type="number" id="fmRate_${k}" value="${r[k]||0}" min="0" max="100" step="0.1"
              style="width:65px;padding:6px;border:1px solid var(--border);border-radius:6px;font-family:Cairo,sans-serif;font-size:12px;background:var(--surface);color:var(--text)"
              oninput="fmUpdRate('${k}',+this.value)">
            <span style="color:var(--text2)">%</span>
          </div></div>`).join('')}
    </div></div>
  <button class="btn btn-primary" onclick="fmCalcStudy('${project.id}')">${t('🔄 احسب الدراسة')}</button>
  <div id="fmStudyOut" style="margin-top:14px"></div>`;
}
function fmUpdRate(k,v){ const modal=document.getElementById('fmEditorModal'); if(modal?._fd){if(!modal._fd.rates)modal._fd.rates={};modal._fd.rates[k]=v;} }

function fmCalcStudy(pid){
  const modal=document.getElementById('fmEditorModal'); if(!modal?._fd)return;
  const fd=modal._fd, proj=fmGetProject(pid); if(!proj)return;
  const tA=fmSumRows(fd.aluminum||[]), tAc=fmSumRows(fd.accessories||[]);
  const tM=fmSumRows(fd.installation||[]), tW=fmSumRows(fd.wages||[]), tF=fmSumRows(fd.fixed||[]);
  const tMat=tA+tAc+tM;
  const contrV=parseFloat(proj.contractValue||0)||0;
  const {before: extB, after: extAfterTaxS} = fmGetExtractValues(pid, proj);
  const rr=fd.rates||{admin:10,sales:10,company:20};
  const admAmt=tMat*(rr.admin||0)/100, grand=tMat+tW+tF+admAmt;
  const pMat=extB>0?(tMat/extB*100):0, pW=extB>0?(tW/extB*100):0, pF=extB>0?(tF/extB*100):0;
  const pTot=pMat+(rr.admin||0)+pW+pF, pFull=pTot+(rr.sales||0)+(rr.company||0);
  const N=v=>v.toLocaleString('en-US',{minimumFractionDigits:2});
  document.getElementById('fmStudyOut').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div style="border:1px solid var(--border);border-radius:10px;overflow:hidden">
        <div style="background:var(--accent);color:#fff;padding:7px 12px;font-weight:700;font-size:12px">${t('📊 ملخص التكاليف')}</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;font-family:Cairo,sans-serif">
          ${[[t('إجمالي الألمنيوم'),N(tA)+' ر.س'],[t('إجمالي الأكسسوارات'),N(tAc)+' ر.س'],[t('مواد التركيب'),N(tM)+' ر.س'],[t('الأجور'),N(tW)+' ر.س'],[t('المصاريف الثابتة'),N(tF)+' ر.س'],[t('المصاريف الإدارية')+ ' ('+(  rr.admin||0)+'%)',N(admAmt)+' ر.س']].map(([l,v])=>`<tr><td style="padding:5px 10px;border-bottom:1px solid var(--border)">${l}</td><td style="padding:5px 10px;text-align:left;font-weight:600">${v}</td></tr>`).join('')}
          <tr style="background:var(--accent);color:#fff;font-weight:700"><td style="padding:6px 10px">${t('الإجمالي الكلي')}</td><td style="padding:6px 10px;text-align:left">${N(grand)} ر.س</td></tr>
        </table>
      </div>
      <div style="border:1px solid var(--border);border-radius:10px;overflow:hidden">
        <div style="background:var(--accent2);color:#fff;padding:7px 12px;font-weight:700;font-size:12px">${t('📈 النسب من المستخلص')}</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;font-family:Cairo,sans-serif">
          ${[[t('المستخلص قبل الضريبة'),N(extB)+' ر.س'],[t('نسبة المواد'),pMat.toFixed(1)+'%'],[t('نسبة الأجور'),pW.toFixed(1)+'%'],[t('نسبة الثوابت'),pF.toFixed(1)+'%'],[t('إجمالي النسب'),pTot.toFixed(1)+'%']].map(([l,v])=>`<tr><td style="padding:5px 10px;border-bottom:1px solid var(--border)">${l}</td><td style="padding:5px 10px;text-align:left;font-weight:600">${v}</td></tr>`).join('')}
          <tr style="background:${pFull>100?'#c62828':'var(--accent2)'};color:#fff;font-weight:700"><td style="padding:6px 10px">${t('الإجمالي + مبيعات + الشركة')}</td><td style="padding:6px 10px;text-align:left">${pFull.toFixed(1)}%${pFull>100?' ⚠️':''}</td></tr>
        </table>
      </div>
    </div>
    ${pFull>100?`<div style="margin-top:10px;border:2px solid #c62828;border-radius:8px;padding:8px 14px;background:#fce4e4;display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px">
      <span style="font-size:22px">⚠️</span>
      <div>
        <div style="font-weight:700;color:#c62828">${t('تحذير: إجمالي النسب يتجاوز 100%')} بمقدار ${(pFull-100).toFixed(2)}%</div>
        <div style="color:#555;font-size:11px;margin-top:4px">${t('اضغط الزر لطباعة بطاقة طلب زيادة نسبة الإنتاج')}</div>
      </div>
      <button onclick="fmPrintIncreaseCard('${pid}')" style="flex-shrink:0;background:#c62828;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-family:Cairo,sans-serif;font-size:12px;font-weight:700">
        📋 طباعة البطاقة
      </button>
    </div>`:''}
    <div style="margin-top:10px;border:2px solid var(--accent);border-radius:6px;padding:8px 14px;background:var(--surface2);display:flex;justify-content:space-between;font-size:12px">
      <span><b>${t('قيمة العقد:')}</b> ${contrV>0?N(contrV)+' ر.س':'—'}</span>
      <span><b>${t('المستخلص قبل الضريبة:')}</b> <b>${N(extB)} ر.س</b></span>
      <span><b>${t('المستخلص بعد الضريبة:')}</b> <b>${N(extAfterTaxS)} ر.س</b></span>
      <span><b>${t('إجمالي التكاليف:')}</b> <strong style="color:${grand>extB?'var(--accent3)':'var(--accent4)'}">${N(grand)} ر.س</strong></span>
    </div>`;
}

function fmPrintIncreaseCard(pid){
  const modal=document.getElementById('fmEditorModal');
  const proj=fmGetProject(pid); if(!proj){notify(t('⚠️ المشروع غير موجود'),'error');return;}
  const fd=modal?._fd||fmFormLoad(pid)||fmBuildFormData(proj,[]);
  const tA=fmSumRows(fd.aluminum||[]),tAc=fmSumRows(fd.accessories||[]),tM=fmSumRows(fd.installation||[]);
  const tW=fmSumRows(fd.wages||[]),tF=fmSumRows(fd.fixed||[]);
  const contrV=parseFloat(proj.contractValue||0)||0;
  const {before:extB,after:extAfterTax}=fmGetExtractValues(pid,proj);
  const rr=fd.rates||{admin:10,sales:10,company:20};
  const pMat=extB>0?((tA+tAc+tM)/extB*100):0,pW=extB>0?(tW/extB*100):0,pF=extB>0?(tF/extB*100):0;
  const pTot=pMat+(rr.admin||0)+pW+pF,pFull=pTot+(rr.sales||0)+(rr.company||0);
  if(pFull<=100){notify(t('⚠️ النسبة الكلية لم تتجاوز 100%'),'error');return;}
  const overPct=pFull-100;
  const N=v=>v.toLocaleString('en-US',{minimumFractionDigits:2});
  const activeLogo=fmGetActiveLogo();
  const logoHtml=activeLogo?`<div style="text-align:right;margin-bottom:6px"><img src="${activeLogo}" style="max-height:40px;max-width:140px;object-fit:contain"></div>`:'';
  const sig=`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8mm;margin-top:8mm;border-top:1px solid #ccc;padding-top:4mm;font-size:9px;text-align:center">
    <div><b>${t('مدير المكتب الفني')}</b><div style="border-top:1px solid #444;margin-top:10px;padding-top:3px">${t('التوقيع:')} _______________</div></div>
    <div><b>${t('محاسب التكاليف')}</b><div style="border-top:1px solid #444;margin-top:10px;padding-top:3px">${t('التوقيع:')} _______________</div></div>
    <div><b>${t('المدير العام')}</b><div style="border-top:1px solid #444;margin-top:10px;padding-top:3px">${t('التوقيع:')} _______________</div></div>
  </div>`;
  const w=window.open('','_blank','width=800,height=700,scrollbars=yes');
  if(!w){notify(t('⚠️ السماح بالنوافذ المنبثقة مطلوب'),'error');return;}
  w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>بطاقة زيادة نسبة إنتاج — ${proj.name||''}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Cairo',sans-serif;font-size:11px;direction:rtl;background:#fff;padding:12mm}
@media print{.nopr{display:none!important}@page{size:A4 portrait;margin:10mm}}
.nopr{position:fixed;top:10px;left:10px;z-index:999;display:flex;gap:8px;background:#fff;padding:8px 12px;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.2)}
.nopr button{padding:6px 14px;border:none;border-radius:5px;cursor:pointer;font-family:'Cairo',sans-serif;font-size:12px;font-weight:700}
</style></head><body>
<div class="nopr">
  <button onclick="window.print()" style="background:#c62828;color:#fff">${t('🖨️ طباعة')}</button>
  <button onclick="window.close()" style="background:#555;color:#fff">✖ إغلاق</button>
</div>
${logoHtml}
<div style="background:#c62828;color:#fff;text-align:center;padding:8px;font-size:14px;font-weight:700;border-radius:6px 6px 0 0">
  ⚠️ طلب زيادة نسبة إنتاج — تجاوز حد 100%
</div>
<div style="border:2px solid #c62828;border-top:none;border-radius:0 0 6px 6px;padding:12px 16px">
  <table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:10px">
    <tr style="background:#f8faff"><td style="padding:4px 8px;border-bottom:1px solid #eee;width:50%"><b>${t('العميل')}</b></td><td style="padding:4px 8px;border-bottom:1px solid #eee;font-weight:600">${proj.name||'—'}</td></tr>
    <tr><td style="padding:4px 8px;border-bottom:1px solid #eee"><b>${t('رقم العقد')}</b></td><td style="padding:4px 8px;border-bottom:1px solid #eee">${proj.contractNo||'—'}</td></tr>
    <tr style="background:#f8faff"><td style="padding:4px 8px;border-bottom:1px solid #eee"><b>${t('الشركة')}</b></td><td style="padding:4px 8px;border-bottom:1px solid #eee">${proj.company||'—'}</td></tr>
    <tr><td style="padding:4px 8px;border-bottom:1px solid #eee"><b>${t('المنطقة')}</b></td><td style="padding:4px 8px;border-bottom:1px solid #eee">${proj.region||'—'}</td></tr>
    <tr style="background:#f8faff"><td style="padding:4px 8px;border-bottom:1px solid #eee"><b>${t('قيمة العقد')}</b></td><td style="padding:4px 8px;border-bottom:1px solid #eee;font-weight:700">${N(contrV)} ر.س</td></tr>
    <tr><td style="padding:4px 8px;border-bottom:1px solid #eee"><b>${t('المستخلص قبل الضريبة')}</b></td><td style="padding:4px 8px;border-bottom:1px solid #eee">${N(extB)} ر.س</td></tr>
    <tr style="background:#fce4e4"><td style="padding:5px 8px;border-bottom:1px solid #f5c6c6;font-weight:700;color:#c62828">${t('إجمالي النسب الحالي')}</td><td style="padding:5px 8px;border-bottom:1px solid #f5c6c6;font-weight:700;color:#c62828">${pFull.toFixed(2)}%</td></tr>
    <tr style="background:#fce4e4"><td style="padding:5px 8px;border-bottom:1px solid #f5c6c6;font-weight:700;color:#c62828">${t('النسبة الزائدة عن 100%')}</td><td style="padding:5px 8px;border-bottom:1px solid #f5c6c6;font-weight:700;color:#c62828">${overPct.toFixed(2)}%</td></tr>
    <tr style="background:#c62828"><td style="padding:6px 8px;font-weight:700;color:#fff;font-size:12px">${t('قيمة الزيادة المطلوبة')}</td><td style="padding:6px 8px;font-weight:700;color:#fff;font-size:12px">${N(extB*overPct/100)} ر.س (${overPct.toFixed(2)}%)</td></tr>
  </table>
  <div style="margin-top:10px;background:#fffde7;border:1px solid #f9a825;border-radius:6px;padding:10px 14px;font-size:10px;color:#5d4037;line-height:1.7">
    <div style="font-weight:700;color:#e65100;margin-bottom:4px;font-size:11px">${t('⚠️ ملاحظة هامة — أسباب تجاوز نسبة التكاليف')}</div>
    يُشير هذا التقرير إلى وجود تجاوز في نسبة تكاليف الإنتاج عن الحد المعتمد (100%)، ويُعزى ذلك بصورة رئيسية إلى <b>ارتفاع تكاليف التصنيع والمواد</b>، إضافةً إلى <b>عدم التزام فريق المبيعات بجدول الأسعار المعتمد داخلياً</b> عند إبرام العقد مع العميل. وعليه، يُرفع هذا الطلب إلى الإدارة المختصة <b>للاعتماد</b>.
  </div>
  ${sig}
</div>
</body></html>`);
  w.document.close();
}

function fmSave(pid){
  const modal=document.getElementById('fmEditorModal'); if(!modal?._fd)return;
  fmFormSave(pid,modal._fd);
  notify(t('✅ تم حفظ الاستمارة'));
  modal.remove();
}

// ══ طباعة PDF — 3 صفحات A4 أفقي ══════════════════════════
function fmPrint(pid){
  const modal=document.getElementById('fmEditorModal');
  const proj=fmGetProject(pid); if(!proj){notify(t('⚠️ المشروع غير موجود'),'error');return;}
  const fd=modal?._fd||fmFormLoad(pid)||fmBuildFormData(proj,[]);
  const tA=fmSumRows(fd.aluminum||[]), tAc=fmSumRows(fd.accessories||[]);
  const tM=fmSumRows(fd.installation||[]), tW=fmSumRows(fd.wages||[]), tF=fmSumRows(fd.fixed||[]);
  // قيمة العقد المدخلة يدوياً
  const contrV=parseFloat(proj.contractValue||0)||0;
  const {before: extB, after: extAfterTax} = fmGetExtractValues(pid, proj);
  const rr=fd.rates||{admin:10,sales:10,company:20};
  const admAmt=(tA+tAc+tM)*(rr.admin||0)/100, grand=tA+tAc+tM+tW+tF+admAmt;
  const pMat=extB>0?((tA+tAc+tM)/extB*100):0, pW=extB>0?(tW/extB*100):0, pF=extB>0?(tF/extB*100):0;
  const pTot=pMat+(rr.admin||0)+pW+pF, pFull=pTot+(rr.sales||0)+(rr.company||0);
  const N=v=>v.toLocaleString('en-US',{minimumFractionDigits:2});

  const activeLogo = fmGetActiveLogo();
  const logoHtml = activeLogo
    ? `<div style="display:flex;align-items:center;justify-content:flex-end;margin-bottom:4px"><img src="${activeLogo}" style="max-height:38px;max-width:130px;object-fit:contain"></div>`
    : '';
  const hdr=`<div class="hdr">${logoHtml}<table class="ht"><tr>
    <td><b>${t('العميل:')}</b> ${proj.name||'—'}</td><td><b>${t('رقم العقد:')}</b> ${proj.contractNo||'—'}</td>
    <td><b>${t('الشركة:')}</b> ${proj.company||'—'}</td><td><b>${t('المنطقة:')}</b> ${proj.region||'—'}</td>
    <td><b>${t('المعرض:')}</b> ${proj.gallery||'—'}</td>
  </tr><tr>
    <td><b>${t('لون الألمنيوم:')}</b> <span style="display:inline-flex;align-items:center;gap:3px">${_ralSwatchHTML(proj.aluminumColor||'',11)}${proj.aluminumColor||'—'}</span></td>
    <td><b>${t('لون الزجاج:')}</b> <span style="display:inline-flex;align-items:center;gap:3px">${_glassSwatchHTML(proj.glassColor||'',11)}${proj.glassColor||'—'}</span></td>
    <td colspan="2"><b>${t('نوع الأكسسوارات:')}</b> ${proj.accessoryType||'—'}</td>
    <td><b>${t('قيمة العقد:')}</b> ${N(contrV)} ر.س</td>
  </tr></table></div>`;

  const tbl=(rows,total,isAlum)=>{
    // حجم الخط والـ padding يتكيفان تلقائياً مع عدد البنود
    const rowCount=(rows||[]).filter(r=>!r.isGroup).length;
    const fs = rowCount>35?'6px': rowCount>25?'6.5px': rowCount>18?'7px': rowCount>12?'7.5px':'8px';
    const pd = rowCount>35?'1px 2px': rowCount>25?'1px 2px': rowCount>18?'1.5px 2px': rowCount>12?'2px 3px':'2px 3px';
    const rr2=(rows||[]).map(r=>{
      if(r.isGroup)return`<tr class="grp"><td colspan="${isAlum?7:5}">◆ ${r.description}</td></tr>`;
      const t=(parseFloat(r.quantity)||0)*(parseFloat(r.unitPrice)||0);
      const bk=parseFloat(r.barWeightKg)||0, tk=Math.round((parseFloat(r.quantity)||0)*bk*100)/100;
      const ac=isAlum?`<td style="padding:${pd};font-size:${fs}">${r.barLen||''}</td><td style="padding:${pd};font-size:${fs}">${r.kgM||0}</td><td style="padding:${pd};font-size:${fs}">${bk.toFixed(3)}</td>`:'';
      return`<tr style="page-break-inside:avoid"><td class="tdr" style="padding:${pd};font-size:${fs}">${r.desc||r.description||''}</td>${ac}<td style="padding:${pd};font-size:${fs}">${(parseFloat(r.quantity)||0).toLocaleString('en-US')}</td><td style="padding:${pd};font-size:${fs}">${(parseFloat(r.unitPrice)||0).toLocaleString('en-US',{maximumFractionDigits:2})}</td><td style="padding:${pd};font-size:${fs}">${N(t)}${isAlum&&tk>0?'<br><span style="font-size:6px;color:#777">'+tk.toFixed(2)+' كغ</span>':''}</td></tr>`;
    }).join('');
    const thStyle=`padding:2px;font-size:${fs};border:1px solid #aac;text-align:center;color:#1a3a5c`;
    return`<table class="dt" style="font-size:${fs}"><thead><tr style="background:#dce8f5"><th style="${thStyle};width:38%;text-align:right">${t('البيان')}</th>${isAlum?`<th style="${thStyle}">${t('طول البار')}</th><th style="${thStyle}">${t('كغ/م')}</th><th style="${thStyle}">${t('وزن البار')}</th>`:''}<th style="${thStyle}">${t('الكمية')}</th><th style="${thStyle}">${t('سعر الوحدة')}</th><th style="${thStyle}">${t('القيمة')}</th></tr></thead><tbody>${rr2}<tr class="tot"><td colspan="${isAlum?4:2}">${t('الإجمالي')}</td><td colspan="2">${N(total)} ر.س</td></tr></tbody></table>`;
  };
  // ═══ هل تجاوزت 100%؟ ═══
  const overLimit = pFull > 100;
  const overPct = Math.max(0, pFull - 100);
  // ورقة الزيادة أصبحت زراً مستقلاً في تبويب الدراسة — لا تُطبع هنا
  const increaseRequestPage = `
<div class="page">
  <div style="background:#c62828;color:#fff;text-align:center;padding:5px;font-size:13px;font-weight:700;border-radius:4px 4px 0 0;margin-bottom:3mm">
    ⚠️ طلب زيادة نسبة إنتاج — تجاوز حد 100%
  </div>
  ${hdr}
  <div style="border:2px solid #c62828;border-radius:8px;padding:8px 14px;margin-bottom:4mm;background:#fff9f9">
    <table style="width:100%;border-collapse:collapse;font-size:10px;font-family:Cairo,sans-serif">
      <tr style="background:#fce4e4"><td style="padding:5px 10px;font-weight:700;color:#c62828" colspan="2">${t('⚠️ تنبيه: إجمالي النسب يتجاوز 100%')}</td></tr>
      <tr><td style="padding:4px 10px;border-bottom:1px solid #f5c6c6;width:50%">${t('إجمالي النسب الحالي')}</td><td style="padding:4px 10px;border-bottom:1px solid #f5c6c6;font-weight:700;color:#c62828">${pFull.toFixed(2)}%</td></tr>
      <tr><td style="padding:4px 10px;border-bottom:1px solid #f5c6c6">${t('النسبة الزائدة عن 100%')}</td><td style="padding:4px 10px;border-bottom:1px solid #f5c6c6;font-weight:700;color:#c62828">${overPct.toFixed(2)}%</td></tr>
      <tr><td style="padding:4px 10px;border-bottom:1px solid #f5c6c6">${t('نسبة المواد من المستخلص')}</td><td style="padding:4px 10px;border-bottom:1px solid #f5c6c6">${pMat.toFixed(1)}%</td></tr>
      <tr><td style="padding:4px 10px;border-bottom:1px solid #f5c6c6">${t('نسبة الأجور')}</td><td style="padding:4px 10px;border-bottom:1px solid #f5c6c6">${pW.toFixed(1)}%</td></tr>
      <tr><td style="padding:4px 10px;border-bottom:1px solid #f5c6c6">${t('نسبة الثوابت')}</td><td style="padding:4px 10px;border-bottom:1px solid #f5c6c6">${pF.toFixed(1)}%</td></tr>
      <tr><td style="padding:4px 10px;border-bottom:1px solid #f5c6c6">${t('المصاريف الإدارية')}</td><td style="padding:4px 10px;border-bottom:1px solid #f5c6c6">${(rr.admin||0).toFixed(1)}%</td></tr>
      <tr><td style="padding:4px 10px;border-bottom:1px solid #f5c6c6">${t('نسبة المبيعات')}</td><td style="padding:4px 10px;border-bottom:1px solid #f5c6c6">${(rr.sales||0).toFixed(1)}%</td></tr>
      <tr><td style="padding:4px 10px;border-bottom:1px solid #f5c6c6">${t('نسبة الشركة')}</td><td style="padding:4px 10px;border-bottom:1px solid #f5c6c6">${(rr.company||0).toFixed(1)}%</td></tr>
      <tr style="background:#c62828;color:#fff;font-weight:700"><td style="padding:5px 10px">${t('الطلب: زيادة بنسبة')}</td><td style="padding:5px 10px;font-size:13px">${overPct.toFixed(2)}% t('على قيمة العقد')</td></tr>
    </table>
  </div>
  <div style="border:1px solid #ddd;border-radius:8px;padding:8px 14px;margin-bottom:4mm;background:#f8faff">
    <div style="font-weight:700;color:#1a3a5c;margin-bottom:6px;font-size:10px">${t('📋 تفاصيل الطلب')}</div>
    <table style="width:100%;border-collapse:collapse;font-size:9px;font-family:Cairo,sans-serif">
      <tr><td style="padding:3px 8px;border-bottom:1px solid #eee;width:40%">${t('اسم العميل')}</td><td style="padding:3px 8px;border-bottom:1px solid #eee;font-weight:600">${proj.name||'—'}</td></tr>
      <tr><td style="padding:3px 8px;border-bottom:1px solid #eee">رقم العقد</td><td style="padding:3px 8px;border-bottom:1px solid #eee;font-weight:600">${proj.contractNo||'—'}</td></tr>
      <tr><td style="padding:3px 8px;border-bottom:1px solid #eee">الشركة</td><td style="padding:3px 8px;border-bottom:1px solid #eee">${proj.company||'—'}</td></tr>
      <tr><td style="padding:3px 8px;border-bottom:1px solid #eee">المنطقة</td><td style="padding:3px 8px;border-bottom:1px solid #eee">${proj.region||'—'}</td></tr>
      <tr><td style="padding:3px 8px;border-bottom:1px solid #eee">قيمة العقد</td><td style="padding:3px 8px;border-bottom:1px solid #eee;font-weight:600">${N(contrV)} ر.س</td></tr>
      <tr><td style="padding:3px 8px;border-bottom:1px solid #eee">${t('المستخلص قبل الضريبة')}</td><td style="padding:3px 8px;border-bottom:1px solid #eee">${N(extB)} ر.س</td></tr>
      <tr style="background:#e8f0fe;font-weight:700"><td style="padding:4px 8px">${t('قيمة الزيادة المطلوبة')}</td><td style="padding:4px 8px;color:#c62828">${N(extB*overPct/100)} ر.س (${overPct.toFixed(2)}%)</td></tr>
    </table>
  </div>
  <div style="margin-top:3mm;font-size:8px;color:#888;border-top:1px solid #eee;padding-top:3mm">
`;
  const overAlert = ``;
  // ══════════════════════════════
  const pie=(vals,lbls,cls)=>{
    const t=vals.reduce((a,b)=>a+b,0);
    if(!t)return'<div style="text-align:center;color:#999;font-size:8px;padding:10px">لا توجد بيانات</div>';
    const W=130,H=130,cx=65,cy=62,R=50,r=28;
    let h=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="overflow:visible">`;
    let angle=-Math.PI/2;
    vals.forEach((v,i)=>{
      if(!v)return;
      const sl=(v/t)*Math.PI*2;
      const x1=cx+R*Math.cos(angle),y1=cy+R*Math.sin(angle);
      const x2=cx+R*Math.cos(angle+sl),y2=cy+R*Math.sin(angle+sl);
      const xi=cx+r*Math.cos(angle),yi=cy+r*Math.sin(angle);
      const xj=cx+r*Math.cos(angle+sl),yj=cy+r*Math.sin(angle+sl);
      const lg=sl>Math.PI?1:0;
      h+=`<path d="M${xi},${yi} L${x1},${y1} A${R},${R} 0 ${lg} 1 ${x2},${y2} L${xj},${yj} A${r},${r} 0 ${lg} 0 ${xi},${yi} Z" fill="${cls[i%cls.length]}" stroke="#fff" stroke-width="1.5"/>`;
      // نسبة في المنتصف للشريحة الكبيرة
      if(sl>0.5){const mx=cx+(R+r)/2*Math.cos(angle+sl/2),my=cy+(R+r)/2*Math.sin(angle+sl/2);h+=`<text x="${mx}" y="${my}" text-anchor="middle" dominant-baseline="middle" font-size="7" fill="#fff" font-weight="700">${((v/t)*100).toFixed(0)}%</text>`;}
      angle+=sl;
    });
    // دائرة مركزية
    h+=`<circle cx="${cx}" cy="${cy}" r="${r-3}" fill="white" stroke="#eee" stroke-width="1"/>`;
    h+=`<text x="${cx}" y="${cy-4}" text-anchor="middle" font-size="8" fill="#1a3a5c" font-weight="700">${t.toLocaleString('en-US',{maximumFractionDigits:0})}</text>`;
    h+=`<text x="${cx}" y="${cy+6}" text-anchor="middle" font-size="6" fill="#888">ر.س</text>`;
    h+='</svg>';
    // Legend
    h+='<div style="margin-top:4px">';
    vals.forEach((v,i)=>{
      if(!v)return;
      h+=`<div style="display:flex;align-items:center;gap:3px;margin-bottom:2px"><span style="flex-shrink:0;width:8px;height:8px;border-radius:2px;background:${cls[i%cls.length]}"></span><span style="font-size:7px;color:#333">${lbls[i]}</span><span style="font-size:7px;color:#666;margin-right:auto;padding-right:4px">${((v/t)*100).toFixed(1)}%</span></div>`;
    });
    return h+'</div>';
  };
  const CL=['#1a3a5c','#2979ff','#43a047','#ff8f00','#e53935','#8e24aa'];
  const _sigI = (typeof getSignatureHTML === 'function') ? getSignatureHTML() : '';
  const sig=`<div class="sigs" style="grid-template-columns:1fr 1fr"><div><b>${t('مدير المكتب الفني')}</b>${_sigI?'<div style="margin:4px 0">'+_sigI+'</div>':`<div class="sigline">${t('التوقيع:')} _______________</div>`}</div><div><b>${t('محاسب التكاليف')}</b><div class="sigline">${t('التوقيع:')} _______________</div></div></div>`;
  // ── تأكد من حساب الأجور قبل الطباعة (في حال لم يُفتح تبويب مواد التركيب) ──
  const _proj2 = fmGetProject(pid)||{};
  const _contrV2 = parseFloat(_proj2.contractValue||0)||0;
  const {before: _extBefore, after: _extAfter} = fmGetExtractValues(pid, _proj2);
  if (!fd.wages || fd.wages.length === 0) {
    // بناء الأجور تلقائياً كما تفعل fmBuildInstall
    const _rr2     = fd.rates || {};
    const _mSal    = parseFloat(_rr2.monthlySal ?? 2500);
    const _wDays   = parseFloat(_rr2.workDays   ?? 26);
    const _dRate   = Math.round(_mSal / _wDays * 100) / 100;
    const _wPct    = parseFloat(_rr2.wagesPct   ?? 10);
    const _fPct    = parseFloat(_rr2.fixedPct   ?? 5);
    const _base    = _extBefore > 0 ? _extBefore : _contrV2 * 0.9;
    const _wAmt    = _base * _wPct / 100;
    const _INST_W  = 5, _MAX_INST_D = 8;
    const _iDays   = _wAmt > 0 ? Math.min(_MAX_INST_D, Math.ceil((_wAmt/2)/(_INST_W*_dRate))) : 0;
    const _w2Amt   = _iDays * _INST_W * _dRate;
    const _w1Amt   = Math.max(0, _wAmt - _w2Amt);
    const _autoPW  = fmCalcProdWorkers(_contrV2 || _extBefore);
    const _prodW   = parseFloat(_rr2.manualProdWorkers||0) || _autoPW;
    const _pDays   = _w1Amt > 0 ? Math.ceil(_w1Amt / (_prodW * _dRate)) : 0;
    fd.wages = [
      {id:'w1', desc:'عمال الإنتاج',  unit:'يوم', quantity:_pDays, unitPrice:Math.round(_prodW*_dRate*100)/100, _auto:true},
      {id:'w2', desc:'عمال التركيب',  unit:'يوم', quantity:_iDays, unitPrice:Math.round(_INST_W*_dRate*100)/100, _auto:true},
    ];
    fd.fixed = [
      {id:'f1', desc:'مصارف ثابتة للمصنع', unit:'%', quantity:_fPct, unitPrice:_base/100, _auto:true},
    ];
  }

  const inst=[...(fd.installation||[]),...(fd.wages||[]),...(fd.fixed||[])];

  const w=window.open('','_blank','width=1100,height=800,scrollbars=yes');
  if(!w){notify(t('⚠️ السماح بالنوافذ المنبثقة مطلوب'),'error');return;}
  w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>استمارة — ${proj.name||''}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Cairo',sans-serif;font-size:10px;direction:rtl;background:#fff}
@media print{.nopr{display:none!important}.page{page-break-after:always}.page:last-of-type{page-break-after:avoid}.sigs{page-break-inside:avoid}.bw{page-break-inside:avoid}@page{size:A4 landscape;margin:7mm 9mm}}
.nopr{position:fixed;top:10px;left:10px;z-index:999;display:flex;gap:8px;background:#fff;padding:8px 12px;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.2)}
.nopr button{padding:5px 12px;border:none;border-radius:5px;cursor:pointer;font-family:'Cairo',sans-serif;font-size:11px;font-weight:700}
.page{padding:5mm 6mm}.ptitle{background:#1a3a5c;color:#fff;text-align:center;padding:3px;font-size:11px;font-weight:700;border-radius:4px 4px 0 0;margin-bottom:2mm}
.hdr{border:1px solid #bbb;border-radius:4px;padding:3px 6px;margin-bottom:2mm;background:#f8faff}
.ht{width:100%;border-collapse:collapse;font-size:8.5px}.ht td{padding:2px 5px}
.bw{display:grid;grid-template-columns:3fr 1.1fr;gap:3mm}
.dt{width:100%;border-collapse:collapse;font-size:8px}.dt thead tr{background:#dce8f5}
.dt th{padding:3px 3px;border:1px solid #aac;text-align:center;font-size:7.5px;color:#1a3a5c}
.dt td{padding:2px 3px;border:1px solid #ddd;text-align:center}.tdr{text-align:right!important;padding-right:5px!important}
.dt tbody tr{page-break-inside:avoid}
.grp td{background:#e8f0fe;font-weight:700;font-size:8px;color:#1a3a5c;text-align:right!important}
.tot td{background:#1a3a5c;color:#fff;font-weight:700}
.cb{border:1px solid #ddd;border-radius:6px;padding:5px;background:#fafcff;display:flex;flex-direction:column;align-items:center}
.cb h4{font-size:8.5px;color:#1a3a5c;margin-bottom:3px;text-align:center;font-weight:700}
.sigs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3mm;margin-top:2mm;border-top:1px solid #ccc;padding-top:2mm;font-size:8.5px;text-align:center}
.sigline{border-top:1px solid #444;margin-top:8px;padding-top:2px}
.sg{display:grid;grid-template-columns:1fr 1fr;gap:3mm;margin-top:2mm}
.st{width:100%;border-collapse:collapse;font-size:9px}.st td{padding:3px 6px;border-bottom:1px solid #eee}.st td:last-child{text-align:left;font-weight:600}
.sh{background:#1a3a5c;color:#fff;padding:4px 7px;font-weight:700;font-size:9.5px}.sh2{background:#1e88e5;color:#fff;padding:4px 7px;font-weight:700;font-size:9.5px}
.hl td{background:#e8f0fe;font-weight:700}.tt td{background:#1a3a5c;color:#fff;font-weight:700}.tt2 td{background:#1e88e5;color:#fff;font-weight:700}
.sb{margin-top:2mm;border:2px solid #1a3a5c;border-radius:4px;padding:4px 8px;background:#e8f0fe;display:flex;justify-content:space-between;font-size:9px}
@media print{body{margin:0}.page{overflow:hidden}}
</style></head><body>
<script>
// يضغط كل صفحة تلقائياً بعد التحميل حتى تناسب A4 landscape
function autoFitPages(){
  const A4W=277, A4H=190; // mm
  document.querySelectorAll('.page').forEach(function(page){
    page.style.zoom='1';
    const W=page.scrollWidth, H=page.scrollHeight;
    const mmW=W/3.7795, mmH=H/3.7795;
    const scale=Math.min(A4W/mmW, A4H/mmH, 1);
    if(scale<1){ page.style.zoom=scale.toFixed(3); }
  });
}
window.addEventListener('load', autoFitPages);
</script>
<div class="nopr"><button style="background:#1a3a5c;color:#fff" onclick="window.print()">${t('🖨️ طباعة')}</button><button style="background:#c62828;color:#fff" onclick="window.close()">✖ إغلاق</button></div>

<div class="page"><div class="ptitle">${t('استمارة تصنيع — خامات الألمنيوم — 1/3')}</div>${hdr}
<div class="bw"><div>${tbl(fd.aluminum||[],tA,true)}</div>
<div class="cb"><h4>${t('الألمنيوم من المستخلص')}</h4>${pie([tA,Math.max(0,extB-tA)],['الألمنيوم','الباقي'],CL)}
<div style="margin-top:3px;text-align:center;font-size:8px;color:#555">${t('إجمالي الألمنيوم')}<br><strong style="font-size:10px;color:#1a3a5c">${N(tA)} ر.س</strong></div></div></div>${sig}</div>

<div class="page"><div class="ptitle">${t('استمارة تصنيع — الأكسسوارات — 2/3')}</div>${hdr}
<div class="bw"><div>${tbl(fd.accessories||[],tAc,false)}</div>
<div class="cb"><h4>${t('الأكسسوارات من المستخلص')}</h4>${pie([tAc,Math.max(0,extB-tAc)],['الأكسسوارات','الباقي'],CL)}
<div style="margin-top:3px;text-align:center;font-size:8px;color:#555">${t('إجمالي الأكسسوارات')}<br><strong style="font-size:10px;color:#1a3a5c">${N(tAc)} ر.س</strong></div></div></div>${sig}</div>

<div class="page"><div class="ptitle">${t('استمارة تصنيع — مواد التركيب + دراسة المشروع — 3/3')}</div>${hdr}
<div class="bw"><div>${tbl(inst,tM+tW+tF,false)}</div>
<div class="cb"><h4>${t('التوزيع الشامل')}</h4>${pie([tA,tAc,tM,tW,tF].filter(v=>v>0),[t('ألمنيوم'),t('أكسسوار'),t('تركيب'),t('أجور'),t('ثابتة')].filter((_,i)=>[tA,tAc,tM,tW,tF][i]>0),CL)}</div></div>
<div style="margin-top:2mm;background:#1a3a5c;color:#fff;padding:3px 8px;font-weight:700;font-size:10px;border-radius:3px">${t('📊 دراسة المشروع')}</div>
<div class="sg">
  <div><div class="sh">${t('ملخص التكاليف')}</div><table class="st">
    <tr><td>${t('إجمالي الألمنيوم')}</td><td>${N(tA)} ر.س</td></tr>
    <tr><td>${t('إجمالي الأكسسوارات')}</td><td>${N(tAc)} ر.س</td></tr>
    <tr><td>${t('مواد التركيب')}</td><td>${N(tM)} ر.س</td></tr>
    <tr><td>${t('الأجور')}</td><td>${N(tW)} ر.س</td></tr>
    <tr><td>${t('المصاريف الثابتة')}</td><td>${N(tF)} ر.س</td></tr>
    <tr><td>المصاريف الإدارية (${rr.admin||0}%)</td><td>${N(admAmt)} ر.س</td></tr>
    <tr class="tt"><td>${t('الإجمالي الكلي')}</td><td>${N(grand)} ر.س</td></tr>
  </table></div>
  <div><div class="sh2">${t('النسب المئوية')}</div><table class="st">
    <tr><td>${t('نسبة المواد')}</td><td>${pMat.toFixed(1)}%</td></tr>
    <tr><td>${t('نسبة الأجور')}</td><td>${pW.toFixed(1)}%</td></tr>
    <tr><td>${t('نسبة الثوابت')}</td><td>${pF.toFixed(1)}%</td></tr>
    <tr><td>${t('المصاريف الإدارية')}</td><td>${(rr.admin||0).toFixed(1)}%</td></tr>
    <tr class="hl"><td>${t('الإجمالي')}</td><td>${pTot.toFixed(1)}%</td></tr>
    <tr class="tt2" style="${overLimit?'background:#c62828!important;color:#fff!important':''};"><td>الكلي + مبيعات ${rr.sales||0}% + شركة ${rr.company||0}%</td><td>${pFull.toFixed(1)}%${overLimit?' ⚠️':''}</td></tr>
  </table></div>
</div>
${overAlert}
<div class="sb">
  <span><b>${t('قيمة العقد:')}</b> ${contrV > 0 ? N(contrV)+' ر.س' : '—'}</span>
  <span><b>${t('المستخلص قبل الضريبة (15%):')}</b> <strong style="color:#1a3a5c">${N(extB)} ر.س</strong></span>
  <span><b>${t('المستخلص بعد الضريبة:')}</b> <strong style="color:#1a3a5c">${N(extAfterTax)} ر.س</strong></span>
</div>
${sig}</div>
${overLimit ? increaseRequestPage : ''}
</body></html>`);
  w.document.close();
}

// ── بناء HTML الاستمارة بدون فتح نافذة — يُستخدم في طباعة ملف العميل الموحّد ──
function _cfBuildFormPages(pid, proj) {
  if(!proj) proj = fmGetProject(pid);
  if(!proj) return '';
  var modal = document.getElementById('fmEditorModal');
  var fd = modal?._fd || fmFormLoad(pid) || fmBuildFormData(proj, []);
  var tA=fmSumRows(fd.aluminum||[]), tAc=fmSumRows(fd.accessories||[]);
  var tM=fmSumRows(fd.installation||[]), tW=fmSumRows(fd.wages||[]), tF=fmSumRows(fd.fixed||[]);
  var contrV=parseFloat(proj.contractValue||0)||0;
  var ev = fmGetExtractValues(pid, proj);
  var extB = ev.before, extAfterTax = ev.after;
  var rr=fd.rates||{admin:10,sales:10,company:20};
  var admAmt=(tA+tAc+tM)*(rr.admin||0)/100, grand=tA+tAc+tM+tW+tF+admAmt;
  var pMat=extB>0?((tA+tAc+tM)/extB*100):0, pW=extB>0?(tW/extB*100):0, pF=extB>0?(tF/extB*100):0;
  var pTot=pMat+(rr.admin||0)+pW+pF, pFull=pTot+(rr.sales||0)+(rr.company||0);
  var N=function(v){return v.toLocaleString('en-US',{minimumFractionDigits:2});};

  var activeLogo = fmGetActiveLogo();
  var logoHtml = activeLogo
    ? '<div style="display:flex;align-items:center;justify-content:flex-end;margin-bottom:4px"><img src="'+activeLogo+'" style="max-height:38px;max-width:130px;object-fit:contain"></div>'
    : '';
  var hdr='<div class="hdr">'+logoHtml+'<table class="ht"><tr>'
    +'<td><b>'+t('العميل:')+'</b> '+(proj.name||'—')+'</td><td><b>'+t('رقم العقد:')+'</b> '+(proj.contractNo||'—')+'</td>'
    +'<td><b>'+t('الشركة:')+'</b> '+(proj.company||'—')+'</td><td><b>'+t('المنطقة:')+'</b> '+(proj.region||'—')+'</td>'
    +'<td><b>'+t('المعرض:')+'</b> '+(proj.gallery||'—')+'</td>'
    +'</tr><tr>'
    +'<td><b>'+t('لون الألمنيوم:')+'</b> <span style="display:inline-flex;align-items:center;gap:3px">'+_ralSwatchHTML(proj.aluminumColor||'',11)+(proj.aluminumColor||'—')+'</span></td>'
    +'<td><b>'+t('لون الزجاج:')+'</b> <span style="display:inline-flex;align-items:center;gap:3px">'+_glassSwatchHTML(proj.glassColor||'',11)+(proj.glassColor||'—')+'</span></td>'
    +'<td colspan="2"><b>'+t('نوع الأكسسوارات:')+'</b> '+(proj.accessoryType||'—')+'</td>'
    +'<td><b>'+t('قيمة العقد:')+'</b> '+N(contrV)+' ر.س</td>'
    +'</tr></table></div>';

  var tbl=function(rows,total,isAlum){
    var rowCount=(rows||[]).filter(function(r){return !r.isGroup;}).length;
    var fs=rowCount>35?'6px':rowCount>25?'6.5px':rowCount>18?'7px':rowCount>12?'7.5px':'8px';
    var pd=rowCount>35?'1px 2px':rowCount>25?'1px 2px':rowCount>18?'1.5px 2px':rowCount>12?'2px 3px':'2px 3px';
    var rr2=(rows||[]).map(function(r){
      if(r.isGroup)return'<tr class="grp"><td colspan="'+(isAlum?7:5)+'">◆ '+r.description+'</td></tr>';
      var tt=(parseFloat(r.quantity)||0)*(parseFloat(r.unitPrice)||0);
      var bk=parseFloat(r.barWeightKg)||0,tk=Math.round((parseFloat(r.quantity)||0)*bk*100)/100;
      var ac=isAlum?'<td style="padding:'+pd+';font-size:'+fs+'">'+(r.barLen||'')+'</td><td style="padding:'+pd+';font-size:'+fs+'">'+(r.kgM||0)+'</td><td style="padding:'+pd+';font-size:'+fs+'">'+bk.toFixed(3)+'</td>':'';
      return'<tr style="page-break-inside:avoid"><td class="tdr" style="padding:'+pd+';font-size:'+fs+'">'+(r.desc||r.description||'')+'</td>'+ac+'<td style="padding:'+pd+';font-size:'+fs+'">'+(parseFloat(r.quantity)||0).toLocaleString('en-US')+'</td><td style="padding:'+pd+';font-size:'+fs+'">'+(parseFloat(r.unitPrice)||0).toLocaleString('en-US',{maximumFractionDigits:2})+'</td><td style="padding:'+pd+';font-size:'+fs+'">'+N(tt)+(isAlum&&tk>0?'<br><span style="font-size:6px;color:#777">'+tk.toFixed(2)+' كغ</span>':'')+'</td></tr>';
    }).join('');
    var thStyle='padding:2px;font-size:'+fs+';border:1px solid #aac;text-align:center;color:#1a3a5c';
    return'<table class="dt" style="font-size:'+fs+'"><thead><tr style="background:#dce8f5"><th style="'+thStyle+';width:38%;text-align:right">'+t('البيان')+'</th>'+(isAlum?'<th style="'+thStyle+'">'+t('طول البار')+'</th><th style="'+thStyle+'">'+t('كغ/م')+'</th><th style="'+thStyle+'">'+t('وزن البار')+'</th>':'')+'<th style="'+thStyle+'">'+t('الكمية')+'</th><th style="'+thStyle+'">'+t('سعر الوحدة')+'</th><th style="'+thStyle+'">'+t('القيمة')+'</th></tr></thead><tbody>'+rr2+'<tr class="tot"><td colspan="'+(isAlum?4:2)+'">'+t('الإجمالي')+'</td><td colspan="2">'+N(total)+' ر.س</td></tr></tbody></table>';
  };

  var overLimit = pFull > 100;
  var overPct = Math.max(0, pFull - 100);

  // Pie chart SVG builder (same as fmPrint)
  var pie=function(vals,lbls,cls){
    var tot=vals.reduce(function(a,b){return a+b;},0);
    if(!tot)return'<div style="text-align:center;color:#999;font-size:8px;padding:10px">لا توجد بيانات</div>';
    var W=130,H=130,cx=65,cy=62,R=50,r=28;
    var h='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" style="overflow:visible">';
    var angle=-Math.PI/2;
    vals.forEach(function(v,i){
      if(!v)return;
      var sl=(v/tot)*Math.PI*2;
      var x1=cx+R*Math.cos(angle),y1=cy+R*Math.sin(angle);
      var x2=cx+R*Math.cos(angle+sl),y2=cy+R*Math.sin(angle+sl);
      var xi=cx+r*Math.cos(angle),yi=cy+r*Math.sin(angle);
      var xj=cx+r*Math.cos(angle+sl),yj=cy+r*Math.sin(angle+sl);
      var lg=sl>Math.PI?1:0;
      h+='<path d="M'+xi+','+yi+' L'+x1+','+y1+' A'+R+','+R+' 0 '+lg+' 1 '+x2+','+y2+' L'+xj+','+yj+' A'+r+','+r+' 0 '+lg+' 0 '+xi+','+yi+' Z" fill="'+cls[i%cls.length]+'" stroke="#fff" stroke-width="1.5"/>';
      if(sl>0.5){var mx=cx+(R+r)/2*Math.cos(angle+sl/2),my=cy+(R+r)/2*Math.sin(angle+sl/2);h+='<text x="'+mx+'" y="'+my+'" text-anchor="middle" dominant-baseline="middle" font-size="7" fill="#fff" font-weight="700">'+((v/tot)*100).toFixed(0)+'%</text>';}
      angle+=sl;
    });
    h+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(r-3)+'" fill="white" stroke="#eee" stroke-width="1"/>';
    h+='<text x="'+cx+'" y="'+(cy-4)+'" text-anchor="middle" font-size="8" fill="#1a3a5c" font-weight="700">'+tot.toLocaleString('en-US',{maximumFractionDigits:0})+'</text>';
    h+='<text x="'+cx+'" y="'+(cy+6)+'" text-anchor="middle" font-size="6" fill="#888">ر.س</text>';
    h+='</svg><div style="margin-top:4px">';
    vals.forEach(function(v,i){
      if(!v)return;
      h+='<div style="display:flex;align-items:center;gap:3px;margin-bottom:2px"><span style="flex-shrink:0;width:8px;height:8px;border-radius:2px;background:'+cls[i%cls.length]+'"></span><span style="font-size:7px;color:#333">'+lbls[i]+'</span><span style="font-size:7px;color:#666;margin-right:auto;padding-right:4px">'+((v/tot)*100).toFixed(1)+'%</span></div>';
    });
    return h+'</div>';
  };
  var CL=['#1a3a5c','#2979ff','#43a047','#ff8f00','#e53935','#8e24aa'];
  var _sigImg = (typeof getSignatureHTML === 'function') ? getSignatureHTML() : '';
  var sig='<div class="sigs" style="grid-template-columns:1fr 1fr"><div><b>'+t('مدير المكتب الفني')+'</b>'+(_sigImg?'<div style="margin:4px 0">'+_sigImg+'</div>':'<div class="sigline">'+t('التوقيع:')+' _______________</div>')+'</div><div><b>'+t('محاسب التكاليف')+'</b><div class="sigline">'+t('التوقيع:')+' _______________</div></div></div>';

  // حساب الأجور تلقائياً إذا ما كانت موجودة
  if(!fd.wages || fd.wages.length === 0) {
    var _rr2=fd.rates||{};
    var _mSal=parseFloat(_rr2.monthlySal??2500);
    var _wDays=parseFloat(_rr2.workDays??26);
    var _dRate=Math.round(_mSal/_wDays*100)/100;
    var _wPct=parseFloat(_rr2.wagesPct??10);
    var _fPct=parseFloat(_rr2.fixedPct??5);
    var _base=extB>0?extB:contrV*0.9;
    var _wAmt=_base*_wPct/100;
    var _INST_W=5,_MAX_INST_D=8;
    var _iDays=_wAmt>0?Math.min(_MAX_INST_D,Math.ceil((_wAmt/2)/(_INST_W*_dRate))):0;
    var _w2Amt=_iDays*_INST_W*_dRate;
    var _w1Amt=Math.max(0,_wAmt-_w2Amt);
    var _autoPW=fmCalcProdWorkers(contrV||extB);
    var _prodW=parseFloat(_rr2.manualProdWorkers||0)||_autoPW;
    var _pDays=_w1Amt>0?Math.ceil(_w1Amt/(_prodW*_dRate)):0;
    fd.wages=[
      {id:'w1',desc:'عمال الإنتاج',unit:'يوم',quantity:_pDays,unitPrice:Math.round(_prodW*_dRate*100)/100,_auto:true},
      {id:'w2',desc:'عمال التركيب',unit:'يوم',quantity:_iDays,unitPrice:Math.round(_INST_W*_dRate*100)/100,_auto:true}
    ];
    fd.fixed=[
      {id:'f1',desc:'مصارف ثابتة للمصنع',unit:'%',quantity:_fPct,unitPrice:_base/100,_auto:true}
    ];
  }
  var inst=[].concat(fd.installation||[],fd.wages||[],fd.fixed||[]);

  // ── Page 1: الألمنيوم ──
  var p1='<div class="page-land"><div class="ptitle">'+t('استمارة تصنيع — خامات الألمنيوم — 1/3')+'</div>'+hdr
    +'<div class="bw"><div>'+tbl(fd.aluminum||[],tA,true)+'</div>'
    +'<div class="cb"><h4>'+t('الألمنيوم من المستخلص')+'</h4>'+pie([tA,Math.max(0,extB-tA)],['الألمنيوم','الباقي'],CL)
    +'<div style="margin-top:3px;text-align:center;font-size:8px;color:#555">'+t('إجمالي الألمنيوم')+'<br><strong style="font-size:10px;color:#1a3a5c">'+N(tA)+' ر.س</strong></div></div></div>'+sig+'</div>';

  // ── Page 2: الأكسسوارات ──
  var p2='<div class="page-land"><div class="ptitle">'+t('استمارة تصنيع — الأكسسوارات — 2/3')+'</div>'+hdr
    +'<div class="bw"><div>'+tbl(fd.accessories||[],tAc,false)+'</div>'
    +'<div class="cb"><h4>'+t('الأكسسوارات من المستخلص')+'</h4>'+pie([tAc,Math.max(0,extB-tAc)],['الأكسسوارات','الباقي'],CL)
    +'<div style="margin-top:3px;text-align:center;font-size:8px;color:#555">'+t('إجمالي الأكسسوارات')+'<br><strong style="font-size:10px;color:#1a3a5c">'+N(tAc)+' ر.س</strong></div></div></div>'+sig+'</div>';

  // ── Page 3: التركيب + دراسة المشروع ──
  var p3='<div class="page-land"><div class="ptitle">'+t('استمارة تصنيع — مواد التركيب + دراسة المشروع — 3/3')+'</div>'+hdr
    +'<div class="bw"><div>'+tbl(inst,tM+tW+tF,false)+'</div>'
    +'<div class="cb"><h4>'+t('التوزيع الشامل')+'</h4>'+pie([tA,tAc,tM,tW,tF].filter(function(v){return v>0;}),[t('ألمنيوم'),t('أكسسوار'),t('تركيب'),t('أجور'),t('ثابتة')].filter(function(_,i){return [tA,tAc,tM,tW,tF][i]>0;}),CL)+'</div></div>'
    +'<div style="margin-top:2mm;background:#1a3a5c;color:#fff;padding:3px 8px;font-weight:700;font-size:10px;border-radius:3px">'+t('📊 دراسة المشروع')+'</div>'
    +'<div class="sg">'
    +'<div><div class="sh">'+t('ملخص التكاليف')+'</div><table class="st">'
    +'<tr><td>'+t('إجمالي الألمنيوم')+'</td><td>'+N(tA)+' ر.س</td></tr>'
    +'<tr><td>'+t('إجمالي الأكسسوارات')+'</td><td>'+N(tAc)+' ر.س</td></tr>'
    +'<tr><td>'+t('مواد التركيب')+'</td><td>'+N(tM)+' ر.س</td></tr>'
    +'<tr><td>'+t('الأجور')+'</td><td>'+N(tW)+' ر.س</td></tr>'
    +'<tr><td>'+t('المصاريف الثابتة')+'</td><td>'+N(tF)+' ر.س</td></tr>'
    +'<tr><td>المصاريف الإدارية ('+(rr.admin||0)+'%)</td><td>'+N(admAmt)+' ر.س</td></tr>'
    +'<tr class="tt"><td>'+t('الإجمالي الكلي')+'</td><td>'+N(grand)+' ر.س</td></tr>'
    +'</table></div>'
    +'<div><div class="sh2">'+t('النسب المئوية')+'</div><table class="st">'
    +'<tr><td>'+t('نسبة المواد')+'</td><td>'+pMat.toFixed(1)+'%</td></tr>'
    +'<tr><td>'+t('نسبة الأجور')+'</td><td>'+pW.toFixed(1)+'%</td></tr>'
    +'<tr><td>'+t('نسبة الثوابت')+'</td><td>'+pF.toFixed(1)+'%</td></tr>'
    +'<tr><td>'+t('المصاريف الإدارية')+'</td><td>'+(rr.admin||0).toFixed(1)+'%</td></tr>'
    +'<tr class="hl"><td>'+t('الإجمالي')+'</td><td>'+pTot.toFixed(1)+'%</td></tr>'
    +'<tr class="tt2"'+(overLimit?' style="background:#c62828!important;color:#fff!important"':'')+'><td>الكلي + مبيعات '+(rr.sales||0)+'% + شركة '+(rr.company||0)+'%</td><td>'+pFull.toFixed(1)+'%'+(overLimit?' ⚠️':'')+'</td></tr>'
    +'</table></div>'
    +'</div>'
    +'<div class="sb">'
    +'<span><b>'+t('قيمة العقد:')+'</b> '+(contrV>0?N(contrV)+' ر.س':'—')+'</span>'
    +'<span><b>'+t('المستخلص قبل الضريبة (15%):')+'</b> <strong style="color:#1a3a5c">'+N(extB)+' ر.س</strong></span>'
    +'<span><b>'+t('المستخلص بعد الضريبة:')+'</b> <strong style="color:#1a3a5c">'+N(extAfterTax)+' ر.س</strong></span>'
    +'</div>'
    +sig+'</div>';

  return p1 + p2 + p3;
}

// ══ صفحة الإعدادات ══════════════════════════════════════════
function renderFormDataSettings(){
  const ct=document.getElementById('settings-formdata'); if(!ct)return;
  const kp=fmKgPriceGet();
  ct.innerHTML=`
  <!-- استيراد / تصدير Excel -->
  <div class="card" style="margin-bottom:14px;border:2px solid #27ae60">
    <div class="card-title" style="color:#27ae60;font-size:14px">${t('📊 استيراد / تصدير Excel — قاعدة بيانات القطاعات')}</div>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px">
      <button class="btn" style="background:#27ae60;color:#fff;font-size:13px;padding:8px 16px" onclick="fdExportExcel()">
        📥 تصدير النسخة الحالية
      </button>
      <button class="btn" style="background:#1a3a5c;color:#fff;font-size:13px;padding:8px 16px" onclick="fdDownloadTemplate()">
        📋 تحميل قالب مثال
      </button>
      <label style="background:#e67e22;color:#fff;font-size:13px;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:700;font-family:Cairo,sans-serif;display:inline-flex;align-items:center;gap:6px">
        ${t('📤 استيراد من Excel')}
        <input type="file" accept=".xlsx,.xls" style="display:none" onchange="fdImportExcel(this)">
      </label>
    </div>
    <div style="font-size:11px;color:var(--text2);background:var(--surface2);padding:7px 12px;border-radius:6px;border:1px solid var(--border)">
      ⚠️ ${t('الاستيراد يستبدل كل الأنواع والإضافات الحالية — استخدم تصدير لحفظ نسخة أولاً')}
    </div>
  </div>

  <!-- سعر الكيلو -->
  <div class="card" style="margin-bottom:14px;border:2px solid var(--accent)">
    <div class="card-title">${t('💰 سعر الألمنيوم الحالي')}</div>
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <div class="form-group" style="margin:0">
        <div class="form-label">${t('سعر الكيلو (ر.س/كغ)')}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <input type="number" id="fdKgPrice" value="${kp}" min="0" step="0.01"
            style="width:100px;padding:7px 10px;border:2px solid var(--accent);border-radius:6px;font-family:Cairo,sans-serif;font-size:14px;font-weight:700;background:var(--surface);color:var(--text)">
          <span style="color:var(--text2)">ر.س / كغ</span>
          <button class="btn btn-primary" onclick="fdSaveKgPrice()">${t('💾 حفظ')}</button>
        </div>
      </div>
      <div style="background:var(--surface2);border-radius:8px;padding:8px 14px;font-size:12px;color:var(--text2);border:1px solid var(--border)">
        مثال: بار 5800مم × 1 كغ/م = 5.8كغ × ${kp} = <strong style="color:var(--accent)">${(5.8*kp).toFixed(2)} ر.س</strong>
      </div>
    </div>
  </div>

  <!-- بطاقات الألوان -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px">
    <div class="card" style="grid-column:span 2"><div class="card-title">${t('🎨 كتالوج ألوان الألمنيوم RAL')}</div>
      <div style="display:flex;gap:6px;margin-bottom:8px">
        <input id="fdRalSearch" placeholder="${t('ابحث برقم RAL أو الاسم...')}" style="flex:1;font-size:12px" oninput="fdFilterRal()">
        <button class="btn btn-sm" style="background:#7c3aed;color:#fff" onclick="fdSelectAllRal()">${t('تحديد الكل')}</button>
        <button class="btn btn-sm btn-secondary" onclick="fdDeselectAllRal()">${t('إلغاء الكل')}</button>
      </div>
      <div id="fdRalGrid" style="max-height:280px;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:4px;margin-bottom:8px"></div>
      <div style="display:flex;gap:6px;align-items:center;margin-top:6px">
        <input id="fdNewAlum" placeholder="${t('أو أضف لون يدوي...')}" style="flex:1;font-size:12px">
        <button class="btn btn-primary btn-sm" onclick="fdAddClr('alum')">➕</button>
      </div>
      <div id="fdAlumCL" style="max-height:120px;overflow-y:auto;margin-top:6px"></div>
    </div>
    <div class="card"><div class="card-title">${t('🪟 ألوان الزجاج')}</div>
      <div id="fdGlassCL" style="max-height:160px;overflow-y:auto;margin-bottom:8px"></div>
      <div style="display:flex;gap:6px"><input id="fdNewGlass" placeholder=t('اسم اللون...') style="flex:1;font-size:12px"><button class="btn btn-primary btn-sm" onclick="fdAddClr('glass')">➕</button></div></div>
    <div class="card"><div class="card-title">${t('🔧 أنواع الأكسسوارات')}</div>
      <div id="fdAccCL" style="max-height:160px;overflow-y:auto;margin-bottom:8px"></div>
      <div style="display:flex;gap:6px"><input id="fdNewAcc" placeholder=t('نوع...') style="flex:1;font-size:12px"><button class="btn btn-primary btn-sm" onclick="fdAddClr('acc')">➕</button></div></div>
  </div>

  <!-- كتالوجات الموردين -->
  <div class="card" style="margin-bottom:16px;border:2px solid #8e44ad">
    <div class="card-title" style="color:#8e44ad">${t('📦 كتالوجات الموردين')}</div>
    <p style="font-size:12px;color:var(--text2);margin-bottom:10px">
      أضف موردين (العاصمة، الوبكو...) وأدخل أكواد القطاعات لكل مورد.
      عند اختيار المورد يتغير الكود في طلب الشراء تلقائياً.
    </p>
    <div style="display:flex;gap:8px;align-items:center;padding:10px;background:var(--surface2);border-radius:8px;margin-bottom:10px;flex-wrap:wrap">
      <div class="form-group" style="margin:0;flex:1">
        <div class="form-label">${t('اسم المورد الجديد')}</div>
        <input id="fdNewCatName" placeholder="مثال: العاصمة، الوبكو، كود محلي">
      </div>
      <button class="btn btn-success" style="background:#8e44ad;border-color:#8e44ad" onclick="fdAddCatalog()">${t('➕ إضافة مورد')}</button>
    </div>
    <div id="fdCatalogsSection"></div>
  </div>

  <!-- شجرة الأنواع -->
  <div class="card">
    <div class="card-title">${t('🌳 أنواع القطاعات (كل نوع = ألمنيوم + أكسسوارات + تركيب)')}</div>
    <p style="font-size:12px;color:var(--text2);margin-bottom:10px">
      ⚠️ اسم النوع لازم يكون <strong>نفس الاسم</strong> في المقاسات وعرض الأسعار
    </p>
    <div style="display:flex;gap:8px;align-items:flex-end;padding:10px;background:var(--surface2);border-radius:8px;margin-bottom:10px">
      <div class="form-group" style="margin:0;flex:1">
        <div class="form-label">${t('اسم النوع الجديد')}</div>
        <input id="fdNewTypeName" placeholder="مثال: واجهة كرتين وول SG50">
      </div>
      <button class="btn btn-success" onclick="fdAddType()">${t('➕ إضافة نوع')}</button>
    </div>
    <div id="fdTypeTree"></div>
  </div>

  <!-- بنك الإضافات -->
  <div class="card" style="margin-top:16px;border:2px solid #e67e22">
    <div class="card-title" style="color:#e67e22">${t('🔗 بنك الإضافات (مع قوس / مع قاطع / 4 درف ...)')}</div>
    <p style="font-size:12px;color:var(--text2);margin-bottom:10px">
      الإضافة تُدمج تلقائياً مع أي نوع يحتوي <strong>الكلمة المفتاحية</strong> في اسمه.<br>
      مثال: كلمة "<strong>مع قوس</strong>" → تُضاف قطاعاتها لأي نوع اسمه "... مع قوس"
    </p>
    <div style="display:flex;gap:8px;align-items:flex-end;padding:10px;background:var(--surface2);border-radius:8px;margin-bottom:10px;flex-wrap:wrap">
      <div class="form-group" style="margin:0">
        <div class="form-label">${t('اسم الإضافة')}</div>
        <input id="fdNewAddonLabel" placeholder="مثال: قوس" style="width:130px">
      </div>
      <div class="form-group" style="margin:0;flex:1">
        <div class="form-label">${t('الكلمة المفتاحية في عرض الأسعار')}</div>
        <input id="fdNewAddonKeyword" placeholder="مثال: مع قوس">
      </div>
      <button class="btn btn-success" style="background:#e67e22;border-color:#e67e22" onclick="fdAddAddon()">${t('➕ إضافة')}</button>
    </div>
    <div id="fdAddonsTree"></div>
  </div>`;

  fdRenderColors(); fdRenderTypeTree(); fdRenderCatalogs(); fdRenderAddonsTree();
}

// ══ استيراد / تصدير Excel ═══════════════════════════════════

// ── تصدير البيانات الحالية ────────────────────────────────
function fdExportExcel() {
  if(typeof XLSX==='undefined'){ notify(t('❌ مكتبة XLSX غير محملة'),'error'); return; }
  const types  = fmTypesLoad();
  const addons = fmAddonsLoad();
  _fdBuildAndDownload(types, addons, 'sections_export_'+new Date().toISOString().slice(0,10)+'.xlsx');
  notify(t('✅ تم تصدير')+' '+types.length+' '+t('نوع و')+addons.length+' '+t('إضافة'));
}

// ── تحميل قالب نموذجي بالبيانات الافتراضية ───────────────
function fdDownloadTemplate() {
  if(typeof XLSX==='undefined'){ notify(t('❌ مكتبة XLSX غير محملة'),'error'); return; }
  _fdBuildAndDownload(_fmDefaultTypes(), _fmDefaultAddons(), 'قالب_القطاعات_نموذج.xlsx');
  notify(t('✅ تم تحميل القالب'));
}

// ── بناء ملف xlsx وتحميله ────────────────────────────────
function _fdBuildAndDownload(types, addons, filename) {
  const wb = XLSX.utils.book_new();

  // ─ شيت التعليمات ─
  const instRows = [
    ['📋 تعليمات الاستيراد — قاعدة بيانات القطاعات',''],
    ['',''],
    ['الشيت المطلوب:','أنواع_القطاعات'],
    ['',''],
    ['الأعمدة:',''],
    ['اسم_النوع','اسم نوع النافذة/الباب (مثال: نوافذ منزلقة 2 درفة مع ثابت)'],
    ['نوع_البند','aluminum / accessory / installation'],
    ['وصف_القطاع','الوصف الكامل للقطاع'],
    ['رمز_الكود','رمز القطاع لدى المورد'],
    ['الكمية','عدد الأعواد/الحبات لكل وحدة من هذا النوع (افتراضي: 1)'],
    ['طول_البار_مم','طول البار بالمم (aluminum فقط — افتراضي: 6000)'],
    ['وزن_كغم_للمتر','وزن المتر بالكغ (aluminum فقط)'],
    ['الوحدة','بار / حبة / متر / علبة'],
    ['سعر_الوحدة','للأكسسوارات والتركيب'],
    ['',''],
    ['💡 الدمج التلقائي:','نفس الرمز (رمز_الكود) من أنواع مختلفة → تُجمع كمياتهم'],
    ['مثال:','حلق سحاب (رمز G1) موجود في نوعين → يظهر مرة واحدة بمجموع الكميتين'],
    ['',''],
    ['⚠️ الاستيراد يستبدل البيانات الحالية — احفظ نسخة أولاً بزر التصدير',''],
  ];
  const wsInst = XLSX.utils.aoa_to_sheet(instRows);
  wsInst['!cols'] = [{wch:55},{wch:50}];
  XLSX.utils.book_append_sheet(wb, wsInst, 'تعليمات');

  // ─ شيت الأنواع ─
  const typeRows = [['اسم_النوع','نوع_البند','وصف_القطاع','رمز_الكود','الكمية','طول_البار_مم','وزن_كغم_للمتر','الوحدة','سعر_الوحدة']];
  types.forEach(t => {
    (t.aluminum||[]).forEach(s => typeRows.push([
      t.name, 'aluminum', s.desc, s.code||'', s.qty||1, s.barLen||6000, s.kgM||0, s.unit||'بار', ''
    ]));
    (t.accessories||[]).forEach(s => typeRows.push([
      t.name, 'accessory', s.desc, '', s.qty||1, '', '', s.unit||'حبة', s.unitPrice||''
    ]));
    (t.installation||[]).forEach(s => typeRows.push([
      t.name, 'installation', s.desc, '', s.quantity||1, '', '', s.unit||'', s.unitPrice||''
    ]));
  });
  const wsTypes = XLSX.utils.aoa_to_sheet(typeRows);
  wsTypes['!cols'] = [{wch:30},{wch:14},{wch:45},{wch:12},{wch:8},{wch:14},{wch:14},{wch:10},{wch:12}];
  XLSX.utils.book_append_sheet(wb, wsTypes, 'أنواع_القطاعات');

  // ─ شيت الإضافات ─
  const addonRows = [['اسم_الإضافة','كلمة_مفتاحية','نوع_البند','وصف_القطاع','رمز_الكود','طول_البار_مم','وزن_كغم_للمتر','الوحدة']];
  addons.forEach(ad => {
    (ad.aluminum||[]).forEach(s => addonRows.push([
      ad.label, ad.keyword, 'aluminum', s.desc, s.code||'', s.barLen||6000, s.kgM||0, s.unit||'بار'
    ]));
    (ad.accessories||[]).forEach(s => addonRows.push([
      ad.label, ad.keyword, 'accessory', s.desc, '', '', '', s.unit||'حبة'
    ]));
  });
  const wsAddons = XLSX.utils.aoa_to_sheet(addonRows);
  wsAddons['!cols'] = [{wch:20},{wch:22},{wch:14},{wch:45},{wch:12},{wch:14},{wch:14},{wch:10}];
  XLSX.utils.book_append_sheet(wb, wsAddons, 'إضافات');

  XLSX.writeFile(wb, filename);
}

// ── استيراد من Excel ─────────────────────────────────────
function fdImportExcel(inp) {
  const file = inp.files[0]; if(!file){ inp.value=''; return; }
  if(typeof XLSX==='undefined'){ notify(t('❌ مكتبة XLSX غير محملة'),'error'); inp.value=''; return; }

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, {type:'binary'});

      // ─ قراءة الأنواع ─
      const typeSht = wb.Sheets['أنواع_القطاعات'];
      if(!typeSht){ notify('⚠️ الشيت "أنواع_القطاعات" غير موجود في الملف','warn'); inp.value=''; return; }
      const typeData = XLSX.utils.sheet_to_json(typeSht, {defval:''});

      const typesMap = {}; // name → type object
      const typeOrder = []; // للحفاظ على الترتيب
      typeData.forEach((r, i) => {
        const name  = String(r['اسم_النوع']  ||'').trim();
        const btype = String(r['نوع_البند']  ||'').trim().toLowerCase();
        const desc  = String(r['وصف_القطاع'] ||'').trim();
        if(!name || !btype || !desc) return;
        if(!typesMap[name]) {
          typesMap[name] = { id:'wt_'+Date.now()+'_'+typeOrder.length, name,
                             aluminum:[], accessories:[], installation:[] };
          typeOrder.push(name);
        }
        const t = typesMap[name];
        const uid = btype[0]+'_'+i;
        if(btype==='aluminum') {
          t.aluminum.push({
            id: uid,
            code:    String(r['رمز_الكود'] || r['رمز_افتراضي'] ||'').trim(),
            desc,
            unit:    String(r['الوحدة']           ||'بار').trim(),
            barLen:  parseFloat(r['طول_البار_مم'])||6000,
            kgM:     parseFloat(r['وزن_كغم_للمتر'])||0,
            qty:     parseFloat(r['الكمية'])||1
          });
        } else if(btype==='accessory' || btype==='accessories') {
          t.accessories.push({ id:uid, desc,
            unit:       String(r['الوحدة']||'حبة').trim(),
            unitPrice:  parseFloat(r['سعر_الوحدة'])||0,
            qty:        parseFloat(r['الكمية'])||1
          });
        } else if(btype==='installation') {
          t.installation.push({ id:uid, desc,
            unit:      String(r['الوحدة']     ||'').trim(),
            unitPrice: parseFloat(r['سعر_الوحدة'])||0,
            quantity:  parseFloat(r['الكمية'])||1
          });
        }
      });
      const newTypes = typeOrder.map(n=>typesMap[n]);

      // ─ قراءة الإضافات ─
      let newAddons = [];
      const addonSht = wb.Sheets['إضافات'];
      if(addonSht) {
        const addonData = XLSX.utils.sheet_to_json(addonSht, {defval:''});
        const addonsMap = {};
        const addonOrder = [];
        addonData.forEach((r, i) => {
          const label   = String(r['اسم_الإضافة']   ||'').trim();
          const keyword = String(r['كلمة_مفتاحية']  ||'').trim();
          const btype   = String(r['نوع_البند']      ||'').trim().toLowerCase();
          const desc    = String(r['وصف_القطاع']     ||'').trim();
          if(!label||!keyword||!btype||!desc) return;
          const key = label+'||'+keyword;
          if(!addonsMap[key]) {
            addonsMap[key] = { id:'ad_'+Date.now()+'_'+addonOrder.length,
                               label, keyword, aluminum:[], accessories:[], installation:[] };
            addonOrder.push(key);
          }
          const ad = addonsMap[key];
          const uid = 'ai_'+i;
          if(btype==='aluminum') {
            ad.aluminum.push({
              id: uid,
              code:   String(r['رمز_الكود']       ||'').trim(),
              desc,
              unit:   String(r['الوحدة']           ||'بار').trim(),
              barLen: parseFloat(r['طول_البار_مم'])||6000,
              kgM:    parseFloat(r['وزن_كغم_للمتر'])||0
            });
          } else if(btype==='accessory'||btype==='accessories') {
            ad.accessories.push({ id:uid, desc, unit:String(r['الوحدة']||'حبة').trim() });
          }
        });
        newAddons = addonOrder.map(k=>addonsMap[k]);
      }

      if(!newTypes.length){ notify(t('⚠️ لم تُوجد بيانات صالحة في الملف'),'warn'); inp.value=''; return; }

      // تأكيد
      const msg = `سيتم استيراد:\n• ${newTypes.length} نوع قطاع\n• ${newAddons.length} إضافة\n\n⚠️ هذا سيستبدل كل البيانات الحالية!\nمتأكد؟`;
      if(!confirm(msg)){ inp.value=''; return; }

      fmTypesSave(newTypes);
      if(newAddons.length) fmAddonsSave(newAddons);
      inp.value='';
      notify(t('✅ تم الاستيراد:')+' '+newTypes.length+' '+t('نوع |')+' '+newAddons.length+' '+t('إضافة'));
      renderFormDataSettings(); // تحديث الواجهة
    } catch(err) {
      notify(t('❌ خطأ في قراءة الملف:')+' '+err.message, 'error');
      console.error('fdImportExcel error:', err);
      inp.value='';
    }
  };
  reader.readAsBinaryString(file);
}

function fdSaveKgPrice(){ const v=parseFloat(document.getElementById('fdKgPrice')?.value)||0; fmKgPriceSet(v); notify(t('✅ تم حفظ السعر:')+' '+v+' '+t('ر.س/كغ')); renderFormDataSettings(); }

// ══ كتالوجات الموردين ═══════════════════════════════════════
function fdAddCatalog(){
  const name=(document.getElementById('fdNewCatName')?.value||'').trim();
  if(!name){ notify(t('⚠️ أدخل اسم المورد'),'warn'); return; }
  fmCatAdd(name);
  document.getElementById('fdNewCatName').value='';
  fdRenderCatalogs();
}

function fdRenderCatalogs(){
  const ct=document.getElementById('fdCatalogsSection'); if(!ct)return;
  const cats=fmCatalogsLoad(), active=fmActiveCatGet();
  const allTypes=fmTypesLoad();

  // جمع كل قطاعات الألمنيوم (بدون تكرار)
  const allAlum=[];
  const seenDesc=new Set();
  allTypes.forEach(t=>(t.aluminum||[]).forEach(s=>{
    const key=fmDescKey(s.desc);
    if(!seenDesc.has(key)){ seenDesc.add(key); allAlum.push({desc:s.desc, code:s.code}); }
  }));

  // ── اختيار المورد الفعّال ──
  const activeSel=`
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding:8px 12px;background:#f3e5f5;border-radius:8px;border:1px solid #ce93d8">
    <span style="font-size:12px;font-weight:700;color:#6a1b9a">${t('📋 المورد الفعّال في طلب الشراء:')}</span>
    <select onchange="fmActiveCatSet(this.value)" style="flex:1;max-width:260px;padding:5px 10px;border:2px solid #8e44ad;border-radius:6px;font-family:Cairo,sans-serif;font-size:13px;font-weight:700;background:#fff">
      <option value="">${t('— بدون كود —')}</option>
      ${cats.map(c=>`<option value="${c.id}"${c.id===active?' selected':''}>${c.name}</option>`).join('')}
    </select>
    <span style="font-size:11px;color:#888">${t('اختر المورد ليظهر كوده في طلب الشراء عند الطباعة')}</span>
  </div>`;

  if(!cats.length){
    ct.innerHTML=activeSel+`<div style="color:var(--text2);text-align:center;padding:14px;border:1px dashed var(--border);border-radius:8px;font-size:12px">
      ${t('لا يوجد موردون بعد — أضف مورداً لتفعيل نظام الأكواد')}
    </div>`; return;
  }

  if(!allAlum.length){
    ct.innerHTML=activeSel+`<div style="color:var(--text2);text-align:center;padding:14px;border:1px dashed var(--border);border-radius:8px;font-size:12px">
      ${t('أضف قطاعات في شجرة الأنواع أولاً لتظهر هنا')}
    </div>`; return;
  }

  // ── جدول موحّد: صف لكل قطاع، عمود لكل مورد ──
  const colW = Math.max(90, Math.floor(320/cats.length));
  const catHeaders = cats.map(c=>`
    <th style="padding:5px 8px;border:1px solid var(--border);width:${colW}px;text-align:center;color:${c.id===active?'#6a1b9a':'var(--text)'};background:${c.id===active?'#f3e5f5':'var(--surface2)'}">
      <div style="font-weight:700;font-size:11px">${c.name}</div>
      ${c.id===active?'<div style="font-size:9px;color:#8e44ad">✅ فعّال</div>':''}
    </th>`).join('');

  const rows = allAlum.map(s=>{
    const key = fmDescKey(s.desc);
    const catCells = cats.map(cat=>{
      const v=(cat.codes&&cat.codes[key])||'';
      return`<td style="padding:2px 4px;border:1px solid var(--border);background:${cat.id===active?'#fdf6ff':''}">
        <input value="${v}" placeholder="${s.code||''}"
          style="width:100%;padding:3px 6px;border:1px solid ${v?'#8e44ad':'var(--border)'};border-radius:4px;font-family:Cairo,sans-serif;font-size:12px;text-align:center;background:${v?'#f3e5f5':'var(--surface)'};color:var(--text)"
          title="${cat.name}"
          onchange="fmCatSetCode('${cat.id}','${key.replace(/'/g,"\\'").replace(/"/g,'\\"')}',this.value);this.style.borderColor=this.value?'#8e44ad':'var(--border)';this.style.background=this.value?'#f3e5f5':'var(--surface)'">
      </td>`;}).join('');
    return`<tr>
      <td style="padding:4px 10px;border:1px solid var(--border);font-size:11.5px">${s.desc}</td>
      <td style="padding:4px 8px;border:1px solid var(--border);text-align:center;color:var(--text2);font-size:11px;min-width:80px">${s.code||'—'}</td>
      ${catCells}
    </tr>`;
  }).join('');

  // أزرار حذف الموردين
  const delBtns = cats.map(c=>`
    <th style="padding:4px;border:1px solid var(--border);text-align:center;background:var(--surface2)">
      <button class="btn btn-sm btn-danger" style="font-size:10px;padding:2px 6px" onclick="if(confirm('حذف ${c.name}؟')){fmCatDel('${c.id}');fdRenderCatalogs()}">🗑️</button>
    </th>`).join('');

  ct.innerHTML = activeSel + `
  <div style="overflow-x:auto;border-radius:8px;border:1px solid var(--border)">
    <table style="width:100%;border-collapse:collapse;font-size:11.5px;min-width:500px">
      <thead>
        <tr>
          <th style="padding:6px 10px;text-align:right;border:1px solid var(--border);background:var(--surface2)">${t('وصف القطاع')}</th>
          <th style="padding:6px 8px;border:1px solid var(--border);width:80px;text-align:center;background:var(--surface2);color:var(--text2)">${t('الكود')}<br>${t('الافتراضي')}</th>
          ${catHeaders}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:4px 10px;border:1px solid var(--border);background:var(--surface2);font-size:11px;color:var(--text2)">${t('حذف مورد:')}</td>
          ${delBtns}
        </tr>
      </tfoot>
    </table>
  </div>`;
}

// ══ طلب الشراء ═══════════════════════════════════════════════
function fmPrintPurchaseOrder(pid, showImages){
  const proj = fmGetProject(pid); if(!proj){ alert(t('المشروع غير موجود')); return; }
  // خذ البيانات من الموديل المفتوح أولاً، ثم ابن من عرض الأسعار
  const _modal = document.getElementById('fmEditorModal');
  const _plRows = (typeof getPLData==='function') ? (getPLData(pid)||[]) : [];
  const _fresh  = fmBuildFormData(proj, _plRows);
  const _saved  = fmFormLoad(pid);
  const fd = _modal?._fd || (_saved ? fmMergeManualEdits(_fresh, _saved) : _fresh);
  const cats = fmCatalogsLoad(), active = fmActiveCatGet();
  const cat  = cats.find(c=>c.id===active)||null;
  const withImg = showImages !== false; // افتراضي: تظهر الصور

  // تحديد اللوجو حسب شركة المشروع
  const compKey = (proj.company||'').includes('راجحي')||proj.company===LOGO_NAMES?.rajhi ? 'rajhi'
    : (proj.company||'').includes('فوزان') ? 'fozan'
    : (proj.company||'').includes('سلطان') ? 'sultan'
    : (proj.company||'').includes('معادن') ? 'metal'
    : Object.keys(LOGOS||{}).find(k=>(LOGO_NAMES[k]||'')===proj.company)||'rajhi';
  const logoSrc = (typeof LOGOS!=='undefined' && LOGOS[compKey]) ? `<img src="${LOGOS[compKey]}" style="max-height:60px;max-width:180px;object-fit:contain">` : '';

  const today = new Date().toLocaleDateString('ar-SA',{year:'numeric',month:'2-digit',day:'2-digit'}).replace(/\//g,'-');
  const catLabel = cat ? cat.name : '—';
  const colCount = withImg ? 8 : 7;

  // ── بناء صفوف الألمنيوم — مدموجة بلا تكرار ──
  // نجمع من fd.aluminum مرة واحدة لكل كود+وصف
  const alumMerged = {};
  (fd.aluminum||[]).filter(r=>!r.isGroup).forEach(r=>{
    const key = (r.code||'') + '||' + (r.desc||r.description||'');
    if(!alumMerged[key]) alumMerged[key] = {...r};
    else alumMerged[key].quantity = (parseFloat(alumMerged[key].quantity)||0) + (parseFloat(r.quantity)||0);
  });

  const alumRows = Object.values(alumMerged).map((r,i)=>{
    const descKey = fmDescKey(r.desc||r.description||'');
    const code = cat&&cat.codes&&cat.codes[descKey] ? cat.codes[descKey] : (r.code||'');
    const img = withImg ? fmSecImgGet(r.desc||r.description||'') : '';
    const imgCell = withImg ? `<td style="padding:3px;border:1px solid #ccc;text-align:center;width:55px">${img?`<img src="${img}" style="width:48px;height:40px;object-fit:contain">`:''}</td>` : '';
    return `<tr>
      <td style="padding:5px 8px;border:1px solid #ccc;text-align:center">${i+1}</td>
      ${imgCell}
      <td style="padding:5px 10px;border:1px solid #ccc">${r.desc||r.description||''}</td>
      <td style="padding:5px 8px;border:1px solid #ccc;text-align:center">${r.unit||'بار'}</td>
      <td style="padding:5px 8px;border:1px solid #ccc;text-align:center;font-weight:700">${(parseFloat(r.quantity)||0).toLocaleString('en-US')}</td>
      <td style="padding:5px 8px;border:1px solid #ccc;text-align:center;color:#8e44ad;font-weight:700">${code||''}</td>
      <td style="padding:5px 8px;border:1px solid #ccc;text-align:center">${r.barLen?Math.round(r.barLen/1000*100)/100+' م':''}</td>
      <td style="padding:5px 8px;border:1px solid #ccc"></td>
    </tr>`;
  }).join('');

  // ── بناء صفوف الأكسسوارات — مدموجة بلا تكرار ──
  const accMerged = {};
  (fd.accessories||[]).filter(r=>!r.isGroup).forEach(r=>{
    const key = r.desc||r.description||'';
    if(!accMerged[key]) accMerged[key] = {...r};
    else accMerged[key].quantity = (parseFloat(accMerged[key].quantity)||0) + (parseFloat(r.quantity)||0);
  });

  const accRows = Object.values(accMerged).map((r,i)=>{
    const imgCell = withImg ? `<td style="padding:3px;border:1px solid #ccc;text-align:center;width:55px"></td>` : '';
    return `<tr>
      <td style="padding:5px 8px;border:1px solid #ccc;text-align:center">${i+1}</td>
      ${imgCell}
      <td style="padding:5px 10px;border:1px solid #ccc">${r.desc||r.description||''}</td>
      <td style="padding:5px 8px;border:1px solid #ccc;text-align:center">${r.unit||'حبة'}</td>
      <td style="padding:5px 8px;border:1px solid #ccc;text-align:center;font-weight:700">${(parseFloat(r.quantity)||0).toLocaleString('en-US')}</td>
      <td style="padding:5px 8px;border:1px solid #ccc;text-align:center;color:#888">—</td>
      <td style="padding:5px 8px;border:1px solid #ccc"></td>
      <td style="padding:5px 8px;border:1px solid #ccc"></td>
    </tr>`;
  }).join('');

  const imgTh = withImg ? `<th style="padding:6px 4px;border:1px solid #ccc;width:55px;text-align:center">${t('صورة')}</th>` : '';
  const thead = `<thead><tr style="background:#1a3a5c;color:#fff">
    <th style="padding:6px 8px;border:1px solid #ccc;width:30px">م</th>
    ${imgTh}
    <th style="padding:6px 10px;border:1px solid #ccc">${t('البيان')}  Description</th>
    <th style="padding:6px 8px;border:1px solid #ccc;width:60px">${t('الوحدة')} Unit</th>
    <th style="padding:6px 8px;border:1px solid #ccc;width:70px">${t('الكمية')} Quantity</th>
    <th style="padding:6px 8px;border:1px solid #ccc;width:70px">${t('الرمز')} Code</th>
    <th style="padding:6px 8px;border:1px solid #ccc;width:70px">${t('الطول')} Length</th>
    <th style="padding:6px 8px;border:1px solid #ccc;width:80px">${t('ملاحظات')} Notes</th>
  </tr></thead>`;

  // اللون: من المشروع أو من الاستمارة المحفوظة أو من الموديل المفتوح
  const modalFd = document.getElementById('fmEditorModal')?._fd;
  const alumColor = proj.aluminumColor || modalFd?.meta?.aluminumColor || fd?.meta?.aluminumColor || '—';
  const glassColor = proj.glassColor || modalFd?.meta?.glassColor || fd?.meta?.glassColor || '—';

  const hdrInfo = `
  <table style="width:100%;border-collapse:collapse;margin-bottom:6mm;font-size:11px">
    <tr>
      <td style="padding:4px 10px;border:1px solid #ccc;width:22%"><b>${t('التاريخ:')}</b> ${today}</td>
      <td style="padding:5px 10px;border:2px solid #1a3a5c;width:26%;background:#f0f4ff"><b>${t('لون الألمنيوم:')}</b> <span style="display:inline-flex;align-items:center;gap:3px;font-weight:700;color:#1a3a5c;font-size:12px">${_ralSwatchHTML(alumColor,12)}${alumColor}</span></td>
      <td style="padding:4px 10px;border:1px solid #ccc;width:22%"><b>${t('لون الزجاج:')}</b> <span style="display:inline-flex;align-items:center;gap:3px">${_glassSwatchHTML(glassColor,12)}${glassColor}</span></td>
      <td style="padding:4px 10px;border:1px solid #ccc;width:30%"><b>${t('المورد:')}</b> ${catLabel}</td>
    </tr>
    <tr>
      <td style="padding:4px 10px;border:1px solid #ccc"><b>${t('رقم العقد :')}</b> ${proj.contractNo||'—'}</td>
      <td style="padding:4px 10px;border:1px solid #ccc" colspan="3"><b>${t('اسم العميل :')}</b> ${proj.name||'—'}</td>
    </tr>
  </table>`;

  const css = `<style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    *{box-sizing:border-box} body{font-family:Cairo,sans-serif;direction:rtl;margin:0;padding:8mm;font-size:11px}
    .page{page-break-after:always;padding-bottom:5mm}
    .pg-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:4mm;border-bottom:2px solid #1a3a5c;padding-bottom:3mm}
    .pg-title{text-align:center;flex:1}
    .pg-title h2{font-size:16px;font-weight:700;margin:0 0 3px 0}
    .pg-title p{font-size:12px;color:#555;margin:0}
    table{width:100%;border-collapse:collapse;font-family:Cairo,sans-serif}
    tr{page-break-inside:avoid}
    @media print{.page{page-break-after:always}.no-print{display:none!important}body{margin:0}.page{overflow:hidden}}
  </style>
  <script>
  function autoFitPages(){
    const A4W=190, A4H=267;
    document.querySelectorAll('.page').forEach(function(page){
      page.style.zoom='1';
      const W=page.scrollWidth, H=page.scrollHeight;
      const mmW=W/3.7795, mmH=H/3.7795;
      const scale=Math.min(A4W/mmW, A4H/mmH, 1);
      if(scale<1){ page.style.zoom=scale.toFixed(3); }
    });
  }
  window.addEventListener('load', autoFitPages);
  </script>`;

  const pageMaker = (title, subtitle, rows) => `
  <div class="page">
    <div class="pg-hdr">
      <div style="min-width:160px">${logoSrc}</div>
      <div class="pg-title">
        <h2>${proj.company||t('الإدارة الفنية')}</h2>
        <p>${t('( الإدارة الفنية )')}</p>
      </div>
      <div style="min-width:160px;text-align:left;font-size:11px;color:#555">${title}</div>
    </div>
    ${hdrInfo}
    <div style="background:#1a3a5c;color:#fff;text-align:center;padding:5px;font-weight:700;font-size:13px;margin-bottom:4mm;border-radius:3px">
      ${subtitle}
    </div>
    <table>${thead}<tbody>${rows||`<tr><td colspan="${colCount}" style="text-align:center;padding:12px;color:#999">${t('لا توجد بنود')}</td></tr>`}</tbody></table>
    <div style="display:flex;justify-content:space-around;margin-top:8mm;padding-top:4mm;border-top:1px solid #ccc">
      <div style="text-align:center"><div style="font-weight:700;margin-bottom:12mm">${t('مدير المكتب الفني')}</div><div style="border-top:1px solid #333;width:160px;margin:0 auto">${t('التوقيع')}</div></div>
    </div>
  </div>`;

  const w = window.open('','_blank','width=900,height=700');
  w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>طلب شراء - ${proj.name||''}</title>${css}</head><body>
    <div class="no-print" style="position:fixed;top:10px;left:10px;z-index:99;display:flex;gap:8px">
      <button onclick="window.print()" style="background:#1a3a5c;color:#fff;border:none;padding:7px 16px;border-radius:6px;font-family:Cairo,sans-serif;font-size:13px;cursor:pointer">${t('🖨️ طباعة')}</button>
      <button onclick="window.close()" style="background:#c62828;color:#fff;border:none;padding:7px 12px;border-radius:6px;font-family:Cairo,sans-serif;font-size:13px;cursor:pointer">✕ إغلاق</button>
    </div>
    ${pageMaker(t('جميع الخامات المطلوبة'),t('طلب شراء — خامات الألمنيوم'), alumRows)}
    ${pageMaker(t('طلب الشراء'),t('طلب شراء — الأكسسوارات'), accRows)}
  </body></html>`);
  w.document.close();
}

// _getRalHex, _ralSwatchHTML, _attachSwatchToSelect — defined in 01-config.js (global)
// ── Full RAL catalog for the grid ──
var _fdFullRAL = [
  {code:'1000',name:'Green Beige',hex:'#BEBD7F'},{code:'1001',name:'Beige',hex:'#C2B078'},{code:'1002',name:'Sand Yellow',hex:'#C6A664'},
  {code:'1003',name:'Signal Yellow',hex:'#E5BE01'},{code:'1004',name:'Golden Yellow',hex:'#CDA434'},{code:'1005',name:'Honey Yellow',hex:'#A98307'},
  {code:'1006',name:'Maize Yellow',hex:'#E4A010'},{code:'1007',name:'Daffodil Yellow',hex:'#DC9D00'},{code:'1011',name:'Brown Beige',hex:'#8A6642'},
  {code:'1012',name:'Lemon Yellow',hex:'#C7B446'},{code:'1013',name:'Oyster White',hex:'#EAE6CA'},{code:'1014',name:'Ivory',hex:'#E1CC4F'},
  {code:'1015',name:'Light Ivory',hex:'#E6D690'},{code:'1016',name:'Sulfur Yellow',hex:'#EDFF21'},{code:'1017',name:'Saffron Yellow',hex:'#F5D033'},
  {code:'1018',name:'Zinc Yellow',hex:'#F8F32B'},{code:'1019',name:'Grey Beige',hex:'#9D9282'},{code:'1020',name:'Olive Yellow',hex:'#999950'},
  {code:'1021',name:'Colza Yellow',hex:'#F3DA0B'},{code:'1023',name:'Traffic Yellow',hex:'#FAD201'},{code:'1024',name:'Ochre Yellow',hex:'#AEA04B'},
  {code:'1026',name:'Luminous Yellow',hex:'#FFFF00'},{code:'1027',name:'Curry',hex:'#9D9101'},{code:'1028',name:'Melon Yellow',hex:'#F4A900'},
  {code:'1032',name:'Broom Yellow',hex:'#D6AE01'},{code:'1033',name:'Dahlia Yellow',hex:'#F3A505'},{code:'1034',name:'Pastel Yellow',hex:'#EFA94A'},
  {code:'1035',name:'Pearl Beige',hex:'#6A5D4D'},{code:'1036',name:'Pearl Gold',hex:'#927549'},{code:'1037',name:'Sun Yellow',hex:'#F09F00'},
  {code:'2000',name:'Yellow Orange',hex:'#ED760E'},{code:'2001',name:'Red Orange',hex:'#C93C20'},{code:'2002',name:'Vermilion',hex:'#CB2821'},
  {code:'2003',name:'Pastel Orange',hex:'#FF7514'},{code:'2004',name:'Pure Orange',hex:'#F44611'},{code:'2008',name:'Bright Red Orange',hex:'#F05837'},
  {code:'2009',name:'Traffic Orange',hex:'#F54021'},{code:'2010',name:'Signal Orange',hex:'#D84B20'},{code:'2011',name:'Deep Orange',hex:'#EC7C26'},
  {code:'2012',name:'Salmon Orange',hex:'#E55137'},{code:'2013',name:'Pearl Orange',hex:'#C35831'},
  {code:'3000',name:'Flame Red',hex:'#AB2524'},{code:'3001',name:'Signal Red',hex:'#A52019'},{code:'3002',name:'Carmine Red',hex:'#A2231D'},
  {code:'3003',name:'Ruby Red',hex:'#9B111E'},{code:'3004',name:'Purple Red',hex:'#75151E'},{code:'3005',name:'Wine Red',hex:'#5E2129'},
  {code:'3007',name:'Black Red',hex:'#412227'},{code:'3009',name:'Oxide Red',hex:'#642424'},{code:'3011',name:'Brown Red',hex:'#781F19'},
  {code:'3012',name:'Beige Red',hex:'#C1876B'},{code:'3013',name:'Tomato Red',hex:'#A12312'},{code:'3014',name:'Antique Pink',hex:'#D36E70'},
  {code:'3015',name:'Light Pink',hex:'#EA899A'},{code:'3016',name:'Coral Red',hex:'#B32821'},{code:'3017',name:'Rose',hex:'#E63244'},
  {code:'3018',name:'Strawberry Red',hex:'#D53032'},{code:'3020',name:'Traffic Red',hex:'#CC0605'},{code:'3022',name:'Salmon Pink',hex:'#D95030'},
  {code:'3024',name:'Luminous Red',hex:'#F80000'},{code:'3026',name:'Luminous Bright Red',hex:'#FE0000'},
  {code:'3027',name:'Raspberry Red',hex:'#C51D34'},{code:'3031',name:'Orient Red',hex:'#B32428'},{code:'3032',name:'Pearl Ruby Red',hex:'#721422'},
  {code:'3033',name:'Pearl Pink',hex:'#B44C43'},
  {code:'4001',name:'Red Lilac',hex:'#6D3461'},{code:'4002',name:'Red Violet',hex:'#922B3E'},{code:'4003',name:'Heather Violet',hex:'#DE4C8A'},
  {code:'4004',name:'Claret Violet',hex:'#641C34'},{code:'4005',name:'Blue Lilac',hex:'#6C4675'},{code:'4006',name:'Traffic Purple',hex:'#A03472'},
  {code:'4007',name:'Purple Violet',hex:'#4A192C'},{code:'4008',name:'Signal Violet',hex:'#924E7D'},{code:'4009',name:'Pastel Violet',hex:'#A18594'},
  {code:'4010',name:'Telemagenta',hex:'#CF3476'},{code:'4011',name:'Pearl Violet',hex:'#8673A1'},{code:'4012',name:'Pearl Blackberry',hex:'#6C6874'},
  {code:'5000',name:'Violet Blue',hex:'#354D73'},{code:'5001',name:'Green Blue',hex:'#1F3438'},{code:'5002',name:'Ultramarine Blue',hex:'#20214F'},
  {code:'5003',name:'Sapphire Blue',hex:'#1D1E33'},{code:'5004',name:'Black Blue',hex:'#18171C'},{code:'5005',name:'Signal Blue',hex:'#1E2460'},
  {code:'5007',name:'Brilliant Blue',hex:'#3E5F8A'},{code:'5008',name:'Grey Blue',hex:'#26252D'},{code:'5009',name:'Azure Blue',hex:'#025669'},
  {code:'5010',name:'Gentian Blue',hex:'#1F447C'},{code:'5011',name:'Steel Blue',hex:'#231A24'},{code:'5012',name:'Light Blue',hex:'#3B83BD'},
  {code:'5013',name:'Cobalt Blue',hex:'#1E213D'},{code:'5014',name:'Pigeon Blue',hex:'#606E8C'},{code:'5015',name:'Sky Blue',hex:'#2278AC'},
  {code:'5017',name:'Traffic Blue',hex:'#063971'},{code:'5018',name:'Turquoise Blue',hex:'#3F888F'},{code:'5019',name:'Capri Blue',hex:'#1B5583'},
  {code:'5020',name:'Ocean Blue',hex:'#1D334A'},{code:'5021',name:'Water Blue',hex:'#256D7B'},{code:'5022',name:'Night Blue',hex:'#252850'},
  {code:'5023',name:'Distant Blue',hex:'#49678D'},{code:'5024',name:'Pastel Blue',hex:'#5D9B9B'},
  {code:'6000',name:'Patina Green',hex:'#316650'},{code:'6001',name:'Emerald Green',hex:'#287233'},{code:'6002',name:'Leaf Green',hex:'#2D572C'},
  {code:'6003',name:'Olive Green',hex:'#424632'},{code:'6004',name:'Blue Green',hex:'#1F3A3D'},{code:'6005',name:'Moss Green',hex:'#2F4538'},
  {code:'6006',name:'Grey Olive',hex:'#3E3B32'},{code:'6007',name:'Bottle Green',hex:'#343B29'},{code:'6008',name:'Brown Green',hex:'#39352A'},
  {code:'6009',name:'Fir Green',hex:'#27352A'},{code:'6010',name:'Grass Green',hex:'#35682D'},{code:'6011',name:'Reseda Green',hex:'#587246'},
  {code:'6012',name:'Black Green',hex:'#343E40'},{code:'6013',name:'Reed Green',hex:'#6C7156'},{code:'6014',name:'Yellow Olive',hex:'#47402E'},
  {code:'6015',name:'Black Olive',hex:'#3B3C36'},{code:'6016',name:'Turquoise Green',hex:'#1E5945'},{code:'6017',name:'May Green',hex:'#4C9141'},
  {code:'6018',name:'Yellow Green',hex:'#57A639'},{code:'6019',name:'Pastel Green',hex:'#BDECB6'},{code:'6020',name:'Chrome Green',hex:'#2E3A23'},
  {code:'6021',name:'Pale Green',hex:'#89AC76'},{code:'6022',name:'Olive Drab',hex:'#25221B'},{code:'6024',name:'Traffic Green',hex:'#308446'},
  {code:'6025',name:'Fern Green',hex:'#3D642D'},{code:'6026',name:'Opal Green',hex:'#015D52'},{code:'6027',name:'Light Green',hex:'#84C3BE'},
  {code:'6028',name:'Pine Green',hex:'#2C5545'},{code:'6029',name:'Mint Green',hex:'#20603D'},{code:'6032',name:'Signal Green',hex:'#317F43'},
  {code:'6033',name:'Mint Turquoise',hex:'#497E76'},{code:'6034',name:'Pastel Turquoise',hex:'#7FB5B5'},
  {code:'6035',name:'Pearl Green',hex:'#1C542D'},{code:'6036',name:'Pearl Opal Green',hex:'#193737'},{code:'6037',name:'Pure Green',hex:'#008F39'},
  {code:'7000',name:'Squirrel Grey',hex:'#78858B'},{code:'7001',name:'Silver Grey',hex:'#8A9597'},{code:'7002',name:'Olive Grey',hex:'#7E7B52'},
  {code:'7003',name:'Moss Grey',hex:'#6C7059'},{code:'7004',name:'Signal Grey',hex:'#969992'},{code:'7005',name:'Mouse Grey',hex:'#646B63'},
  {code:'7006',name:'Beige Grey',hex:'#6D6552'},{code:'7008',name:'Khaki Grey',hex:'#6A5F31'},{code:'7009',name:'Green Grey',hex:'#4D5645'},
  {code:'7010',name:'Tarpaulin Grey',hex:'#4C514A'},{code:'7011',name:'Iron Grey',hex:'#434B4D'},{code:'7012',name:'Basalt Grey',hex:'#4E5754'},
  {code:'7013',name:'Brown Grey',hex:'#464531'},{code:'7015',name:'Slate Grey',hex:'#5B6469'},{code:'7016',name:'Anthracite Grey',hex:'#383E42'},
  {code:'7021',name:'Black Grey',hex:'#2B3235'},{code:'7022',name:'Umbra Grey',hex:'#332F2C'},{code:'7023',name:'Concrete Grey',hex:'#686C5E'},
  {code:'7024',name:'Graphite Grey',hex:'#474A51'},{code:'7026',name:'Granite Grey',hex:'#2F353B'},{code:'7030',name:'Stone Grey',hex:'#8B8C7A'},
  {code:'7031',name:'Blue Grey',hex:'#474B4E'},{code:'7032',name:'Pebble Grey',hex:'#B8B799'},{code:'7033',name:'Cement Grey',hex:'#7D8471'},
  {code:'7034',name:'Yellow Grey',hex:'#8F8B66'},{code:'7035',name:'Light Grey',hex:'#CBD0CC'},{code:'7036',name:'Platinum Grey',hex:'#7F7679'},
  {code:'7037',name:'Dusty Grey',hex:'#7D7F7D'},{code:'7038',name:'Agate Grey',hex:'#B5B8B1'},{code:'7039',name:'Quartz Grey',hex:'#6C6960'},
  {code:'7040',name:'Window Grey',hex:'#9DA1AA'},{code:'7042',name:'Traffic Grey A',hex:'#8D948D'},{code:'7043',name:'Traffic Grey B',hex:'#4E5452'},
  {code:'7044',name:'Silk Grey',hex:'#CAC4B0'},{code:'7045',name:'Telegrey 1',hex:'#909090'},{code:'7046',name:'Telegrey 2',hex:'#82898F'},
  {code:'7047',name:'Telegrey 4',hex:'#D0D0D0'},{code:'7048',name:'Pearl Mouse Grey',hex:'#898176'},
  {code:'8000',name:'Green Brown',hex:'#826C34'},{code:'8001',name:'Ochre Brown',hex:'#955F20'},{code:'8002',name:'Signal Brown',hex:'#6C3B2A'},
  {code:'8003',name:'Clay Brown',hex:'#734222'},{code:'8004',name:'Copper Brown',hex:'#8E402A'},{code:'8007',name:'Fawn Brown',hex:'#59351F'},
  {code:'8008',name:'Olive Brown',hex:'#6F4F28'},{code:'8011',name:'Nut Brown',hex:'#5B3A29'},{code:'8012',name:'Red Brown',hex:'#592321'},
  {code:'8014',name:'Sepia Brown',hex:'#382C1E'},{code:'8015',name:'Chestnut Brown',hex:'#633A34'},{code:'8016',name:'Mahogany Brown',hex:'#4C2F27'},
  {code:'8017',name:'Chocolate Brown',hex:'#442F29'},{code:'8019',name:'Grey Brown',hex:'#3D3635'},{code:'8022',name:'Black Brown',hex:'#212121'},
  {code:'8023',name:'Orange Brown',hex:'#A65E2E'},{code:'8024',name:'Beige Brown',hex:'#79553D'},{code:'8025',name:'Pale Brown',hex:'#755C48'},
  {code:'8028',name:'Terra Brown',hex:'#4E3B31'},{code:'8029',name:'Pearl Copper',hex:'#763C28'},
  {code:'9001',name:'Cream',hex:'#FDF4E3'},{code:'9002',name:'Grey White',hex:'#E7EBDA'},{code:'9003',name:'Signal White',hex:'#ECECE7'},
  {code:'9004',name:'Signal Black',hex:'#282828'},{code:'9005',name:'Jet Black',hex:'#0A0A0A'},{code:'9006',name:'White Aluminium',hex:'#A8A9AD'},
  {code:'9007',name:'Grey Aluminium',hex:'#878681'},{code:'9010',name:'Pure White',hex:'#F4F4F4'},{code:'9011',name:'Graphite Black',hex:'#1C1C1C'},
  {code:'9016',name:'Traffic White',hex:'#F1F0EB'},{code:'9017',name:'Traffic Black',hex:'#1E1E1E'},{code:'9018',name:'Papyrus White',hex:'#D7D7CD'}
];

function fdRenderRalGrid(filter) {
  var el = document.getElementById('fdRalGrid'); if(!el) return;
  var selected = fmLoad(FM_ALUM_COLORS_KEY, []);
  var q = (filter || '').toLowerCase().trim();
  var items = _fdFullRAL;
  if(q) {
    items = items.filter(function(r) {
      return r.code.indexOf(q) !== -1 || r.name.toLowerCase().indexOf(q) !== -1;
    });
  }
  el.innerHTML = items.map(function(r) {
    var label = 'RAL '+r.code+' — '+r.name;
    var isSelected = selected.indexOf(label) !== -1;
    var borderColor = isSelected ? '#3b82f6' : 'var(--border)';
    var bg = isSelected ? 'rgba(59,130,246,0.08)' : 'transparent';
    return '<div onclick="fdToggleRal(\''+r.code+'\')" style="display:flex;align-items:center;gap:6px;padding:4px 8px;border:2px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:11px;background:'+bg+';transition:all .15s">' +
      '<span style="width:20px;height:20px;border-radius:4px;background:'+r.hex+';border:1px solid #00000022;flex-shrink:0"></span>' +
      '<span style="font-weight:'+(isSelected?'700':'400')+';color:var(--text)">'+r.code+'</span>' +
      '<span style="color:var(--text2);font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+r.name+'</span>' +
      (isSelected ? '<span style="margin-right:auto;color:#3b82f6;font-weight:800">✓</span>' : '') +
    '</div>';
  }).join('');
  if(!items.length) el.innerHTML = '<div style="text-align:center;padding:12px;color:var(--text2)">'+t('لا توجد نتائج')+'</div>';
}

function fdToggleRal(code) {
  var label = '';
  var r = _fdFullRAL.find(function(x){ return x.code === code; });
  if(r) label = 'RAL '+r.code+' — '+r.name;
  if(!label) return;
  var arr = fmLoad(FM_ALUM_COLORS_KEY, []);
  var idx = arr.indexOf(label);
  if(idx !== -1) arr.splice(idx, 1);
  else arr.push(label);
  fmSaveKey(FM_ALUM_COLORS_KEY, arr);
  fdRenderRalGrid(document.getElementById('fdRalSearch')?.value || '');
  fdRenderCustomAlumList();
  fdRefreshDrops();
}

function fdSelectAllRal() {
  var q = (document.getElementById('fdRalSearch')?.value || '').toLowerCase().trim();
  var items = _fdFullRAL;
  if(q) items = items.filter(function(r){ return r.code.indexOf(q)!==-1 || r.name.toLowerCase().indexOf(q)!==-1; });
  var arr = fmLoad(FM_ALUM_COLORS_KEY, []);
  items.forEach(function(r){
    var label = 'RAL '+r.code+' — '+r.name;
    if(arr.indexOf(label) === -1) arr.push(label);
  });
  fmSaveKey(FM_ALUM_COLORS_KEY, arr);
  fdRenderRalGrid(q); fdRenderCustomAlumList(); fdRefreshDrops();
  notify('✅ '+t('تم تحديد')+' '+items.length+' '+t('لون'));
}

function fdDeselectAllRal() {
  var q = (document.getElementById('fdRalSearch')?.value || '').toLowerCase().trim();
  var items = _fdFullRAL;
  if(q) items = items.filter(function(r){ return r.code.indexOf(q)!==-1 || r.name.toLowerCase().indexOf(q)!==-1; });
  var arr = fmLoad(FM_ALUM_COLORS_KEY, []);
  var labels = items.map(function(r){ return 'RAL '+r.code+' — '+r.name; });
  arr = arr.filter(function(c){ return labels.indexOf(c) === -1; });
  fmSaveKey(FM_ALUM_COLORS_KEY, arr);
  fdRenderRalGrid(q); fdRenderCustomAlumList(); fdRefreshDrops();
}

function fdFilterRal() {
  var q = document.getElementById('fdRalSearch')?.value || '';
  fdRenderRalGrid(q);
}

function fdRenderCustomAlumList() {
  var el = document.getElementById('fdAlumCL'); if(!el) return;
  var items = fmLoad(FM_ALUM_COLORS_KEY, []);
  // Show only non-RAL custom colors in the list below
  var custom = items.filter(function(c){ return !c.match(/^RAL\s*\d{4}/); });
  if(!custom.length) { el.innerHTML = ''; return; }
  el.innerHTML = custom.map(function(c) {
    var fullIdx = items.indexOf(c);
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 8px;border-bottom:1px solid var(--border);font-size:12px"><span>'+c+'</span><button class="btn btn-sm btn-danger btn-icon" style="padding:1px 5px;font-size:10px" onclick="fdDelClr(\'alum\','+fullIdx+')">✖</button></div>';
  }).join('');
}

function fdRenderColors(){
  // RAL grid for aluminum
  fdRenderRalGrid(document.getElementById('fdRalSearch')?.value || '');
  fdRenderCustomAlumList();
  // Glass colors
  const rendList=(cid,items,type)=>{ const el=document.getElementById(cid); if(!el)return;
    el.innerHTML=items.map((c,i)=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 8px;border-bottom:1px solid var(--border);font-size:12px"><span>${c}</span><button class="btn btn-sm btn-danger btn-icon" style="padding:1px 5px;font-size:10px" onclick="fdDelClr('${type}',${i})">✖</button></div>`).join('')||'<div style="color:var(--text2);font-size:11px;padding:6px">'+t('لا توجد بنود')+'</div>';};
  rendList('fdGlassCL',fmGetGlassColors(),'glass');
  rendList('fdAccCL',fmGetAccTypes(),'acc');
}
function fdAddClr(t){
  const id=t==='alum'?'fdNewAlum':t==='glass'?'fdNewGlass':'fdNewAcc';
  const v=document.getElementById(id)?.value.trim(); if(!v)return;
  const key=t==='alum'?FM_ALUM_COLORS_KEY:t==='glass'?FM_GLASS_COLORS_KEY:FM_ACC_TYPES_KEY;
  const arr=fmLoad(key,[]); arr.push(v); fmSaveKey(key,arr); document.getElementById(id).value=''; fdRenderColors(); fdRefreshDrops();
}
function fdDelClr(t,i){
  const key=t==='alum'?FM_ALUM_COLORS_KEY:t==='glass'?FM_GLASS_COLORS_KEY:FM_ACC_TYPES_KEY;
  const arr=fmLoad(key,[]); arr.splice(i,1); fmSaveKey(key,arr); fdRenderColors(); fdRefreshDrops();
}
function fdRefreshDrops(){
  ['aluminumColor','glassColor','accessoryType'].forEach(k=>{
    const sel=document.getElementById('f_'+k); if(!sel)return;
    const cur=sel.value, opts=k==='aluminumColor'?fmGetAlumColors():k==='glassColor'?fmGetGlassColors():fmGetAccTypes();
    sel.innerHTML='<option value="">'+t('— اختر —')+'</option>'+opts.map(c=>`<option value="${c}"${c===cur?' selected':''}>${c}</option>`).join('');
  });
}

// ── بنك الإضافات — واجهة ────────────────────────────────────
function fdAddAddon(){
  const label=(document.getElementById('fdNewAddonLabel')?.value||'').trim();
  const keyword=(document.getElementById('fdNewAddonKeyword')?.value||'').trim();
  if(!label||!keyword){ notify(t('⚠️ أدخل الاسم والكلمة المفتاحية'),'warn'); return; }
  fmAddonAdd(label, keyword);
  document.getElementById('fdNewAddonLabel').value='';
  document.getElementById('fdNewAddonKeyword').value='';
  fdRenderAddonsTree();
}

function fdRenderAddonsTree(){
  const ct=document.getElementById('fdAddonsTree'); if(!ct)return;
  const addons=fmAddonsLoad(), kp=fmKgPriceGet();
  if(!addons.length){
    ct.innerHTML='<div style="color:var(--text2);text-align:center;padding:14px;border:1px dashed var(--border);border-radius:8px;font-size:12px">'+t('لا توجد إضافات بعد')+'</div>'; return;
  }
  ct.innerHTML=addons.map(ad=>`
  <div style="border:2px solid #e67e22;border-radius:8px;margin-bottom:10px;overflow:hidden">
    <div style="background:#fef9f0;padding:8px 14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <span style="cursor:pointer;color:#e67e22;font-size:14px" onclick="fdToggle('fdAD_${ad.id}')">▶</span>
      <div style="display:flex;align-items:center;gap:8px;flex:1;flex-wrap:wrap">
        <span style="font-size:11px;color:var(--text2)">الاسم:</span>
        <input value="${(ad.label||'').replace(/"/g,'&quot;')}" style="width:120px;padding:4px 8px;border:1px solid var(--border);border-radius:4px;font-family:Cairo,sans-serif;font-size:12px;font-weight:700;color:#e67e22"
          onchange="fmAddonUpdField('${ad.id}','label',this.value)">
        <span style="font-size:11px;color:var(--text2)">الكلمة المفتاحية:</span>
        <input value="${(ad.keyword||'').replace(/"/g,'&quot;')}" style="flex:1;min-width:120px;padding:4px 8px;border:2px solid #e67e22;border-radius:4px;font-family:Cairo,sans-serif;font-size:12px;font-weight:700"
          onchange="fmAddonUpdField('${ad.id}','keyword',this.value)">
      </div>
      <span style="font-size:11px;color:var(--text2)">${ad.aluminum.length} قطاع | ${ad.accessories.length} أكسسوار</span>
      <button class="btn btn-sm btn-danger" style="font-size:11px;padding:3px 8px" onclick="if(confirm(t('حذف الإضافة؟'))){fmAddonDel('${ad.id}');fdRenderAddonsTree()}">🗑️</button>
    </div>
    <div id="fdAD_${ad.id}" style="display:none;padding:10px 12px">
      <!-- الألمنيوم -->
      <div style="margin-bottom:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div style="font-weight:700;color:var(--accent);font-size:12px">${t('🔩 قطاعات ألمنيوم إضافية')}</div>
          <button class="btn btn-sm btn-success" style="font-size:11px;padding:3px 8px" onclick="fmAddonAddAlum('${ad.id}')">${t('➕ قطاع')}</button>
        </div>
        ${ad.aluminum.length?`<table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead><tr style="background:var(--surface2)">
            <th style="padding:4px 8px;border:1px solid var(--border);text-align:right">${t('الوصف')}</th>
            <th style="padding:4px;border:1px solid var(--border);width:60px;text-align:center">${t('الرمز')}</th>
            <th style="padding:4px;border:1px solid var(--border);width:80px;text-align:center">طول (مم)</th>
            <th style="padding:4px;border:1px solid var(--border);width:70px;text-align:center">${t('كغ/م')}</th>
            <th style="padding:4px;border:1px solid var(--border);width:140px;color:var(--accent)">وزن/سعر</th>
            <th style="padding:4px;border:1px solid var(--border);width:24px"></th>
          </tr></thead>
          <tbody>${ad.aluminum.map(s=>{
            const bk=fmCalcBarWeight(s.barLen,s.kgM), bp=Math.round(bk*kp*100)/100;
            return`<tr>
              <td style="padding:3px 6px;border:1px solid var(--border)"><input value="${(s.desc||'').replace(/"/g,'&quot;')}" style="width:100%;padding:2px 4px;border:1px solid var(--border);border-radius:3px;font-family:Cairo,sans-serif;font-size:11px;background:var(--surface);color:var(--text)" onchange="fmAddonUpdItem('${ad.id}','aluminum','${s.id}','desc',this.value)"></td>
              <td style="padding:3px 4px;border:1px solid var(--border)"><input value="${s.code||''}" style="width:55px;padding:2px 4px;border:1px solid var(--border);border-radius:3px;font-family:Cairo,sans-serif;font-size:11px;text-align:center;background:var(--surface);color:var(--text)" onchange="fmAddonUpdItem('${ad.id}','aluminum','${s.id}','code',this.value)"></td>
              <td style="padding:3px 4px;border:1px solid var(--border)"><input type="number" value="${s.barLen||6000}" style="width:74px;padding:2px 4px;border:1px solid var(--border);border-radius:3px;font-family:Cairo,sans-serif;font-size:11px;text-align:center;background:var(--surface);color:var(--text)" onchange="fmAddonUpdItem('${ad.id}','aluminum','${s.id}','barLen',this.value)"></td>
              <td style="padding:3px 4px;border:1px solid var(--border)"><input type="number" value="${s.kgM||0}" step="0.001" style="width:65px;padding:2px 4px;border:1px solid var(--border);border-radius:3px;font-family:Cairo,sans-serif;font-size:11px;text-align:center;background:var(--surface);color:var(--text)" onchange="fmAddonUpdItem('${ad.id}','aluminum','${s.id}','kgM',this.value)"></td>
              <td style="padding:3px 6px;border:1px solid var(--border);font-size:10px;background:var(--surface2)"><span style="color:var(--accent2)">${bk.toFixed(3)} كغ</span> × ${kp} = <b style="color:var(--accent)">${bp.toFixed(2)} ر.س</b></td>
              <td style="padding:3px;border:1px solid var(--border);text-align:center"><button class="btn btn-sm btn-danger btn-icon" style="padding:1px 4px;font-size:10px" onclick="fmAddonDelItem('${ad.id}','aluminum','${s.id}')">✕</button></td>
            </tr>`;}).join('')}
          </tbody></table>`
        :'<div style="color:var(--text2);font-size:11px;text-align:center;padding:6px">'+t('لا توجد قطاعات إضافية')+'</div>'}
      </div>
      <!-- الأكسسوارات -->
      <div style="border-top:1px solid var(--border);padding-top:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div style="font-weight:700;color:var(--accent2);font-size:12px">${t('🔧 أكسسوارات إضافية')}</div>
          <button class="btn btn-sm btn-success" style="font-size:11px;padding:3px 8px" onclick="fmAddonAddAcc('${ad.id}')">${t('➕ أكسسوار')}</button>
        </div>
        ${ad.accessories.length?ad.accessories.map(a=>`
          <div style="display:flex;align-items:center;gap:6px;padding:4px 6px;border-bottom:1px solid var(--border)">
            <input value="${(a.desc||'').replace(/"/g,'&quot;')}" style="flex:1;padding:2px 6px;border:1px solid var(--border);border-radius:3px;font-family:Cairo,sans-serif;font-size:11.5px;background:var(--surface);color:var(--text)" onchange="fmAddonUpdItem('${ad.id}','accessories','${a.id}','desc',this.value)">
            <input value="${a.unit||'حبة'}" style="width:55px;padding:2px 5px;border:1px solid var(--border);border-radius:3px;font-family:Cairo,sans-serif;font-size:11px;text-align:center;background:var(--surface);color:var(--text)" onchange="fmAddonUpdItem('${ad.id}','accessories','${a.id}','unit',this.value)">
            <button class="btn btn-sm btn-danger btn-icon" style="padding:1px 5px;font-size:10px" onclick="fmAddonDelItem('${ad.id}','accessories','${a.id}')">✕</button>
          </div>`).join('')
        :'<div style="color:var(--text2);font-size:11px;text-align:center;padding:4px">'+t('لا توجد')+'</div>'}
      </div>
    </div>
  </div>`).join('');
}

// ── شجرة الأنواع ────────────────────────────────────────────
function fdAddType(){
  const name=document.getElementById('fdNewTypeName')?.value.trim(); if(!name)return;
  const arr=fmTypesLoad(); arr.push({id:'wt_'+Date.now(),name,aluminum:[],accessories:[],installation:[]});
  fmTypesSave(arr); document.getElementById('fdNewTypeName').value=''; fdRenderTypeTree();
}
function fdDelType(id){ if(!confirm(t('حذف هذا النوع؟')))return; fmTypesSave(fmTypesLoad().filter(t=>t.id!==id)); fdRenderTypeTree(); }
function fdUpdTypeName(id,v){ const arr=fmTypesLoad(),t=arr.find(x=>x.id===id);if(t){t.name=v;fmTypesSave(arr);} }
function fdToggle(id){ const el=document.getElementById(id);if(el)el.style.display=el.style.display==='none'?'':'none'; }

// إضافة قطاع ألمنيوم لنوع
function fdAddAlumSec(typeId){
  const code=(prompt('رمز القطاع:')||'').trim(); if(!code)return;
  const desc=(prompt('الوصف:')||'').trim(); if(!desc)return;
  const barLen=parseFloat(prompt('طول البار (مم):','6000')||'6000')||6000;
  const kgM=parseFloat(prompt('وزن 1م (كغ):\nمثال: 1.5 يعني 1متر = 1.5 كغ','0')||'0')||0;
  const arr=fmTypesLoad(),t=arr.find(x=>x.id===typeId); if(!t)return;
  t.aluminum.push({id:'a_'+Date.now(),code,desc,unit:'بار',barLen,kgM});
  fmTypesSave(arr); fdRenderTypeTree();
}
// إضافة أكسسوار لنوع
function fdAddAccSec(typeId){
  const desc=(prompt('اسم الأكسسوار:')||'').trim(); if(!desc)return;
  const unit=(prompt('الوحدة:','حبة')||'حبة').trim();
  const arr=fmTypesLoad(),t=arr.find(x=>x.id===typeId); if(!t)return;
  t.accessories.push({id:'ac_'+Date.now(),desc,unit});
  fmTypesSave(arr); fdRenderTypeTree();
}
// إضافة مادة تركيب لنوع
function fdAddInstSec(typeId){
  const desc=(prompt('اسم مادة التركيب:')||'').trim(); if(!desc)return;
  const unit=(prompt('الوحدة:','حبة')||'حبة').trim();
  const price=parseFloat(prompt('سعر الوحدة:','0')||'0')||0;
  const arr=fmTypesLoad(),t=arr.find(x=>x.id===typeId); if(!t)return;
  t.installation.push({id:'i_'+Date.now(),desc,unit,unitPrice:price});
  fmTypesSave(arr); fdRenderTypeTree();
}
function fdDelItem(typeId,subKey,itemId){
  const arr=fmTypesLoad(),t=arr.find(x=>x.id===typeId); if(!t)return;
  t[subKey]=t[subKey].filter(x=>x.id!==itemId); fmTypesSave(arr); fdRenderTypeTree();
}
function fdUpdSec(typeId,subKey,itemId,field,value){
  const arr=fmTypesLoad(),t=arr.find(x=>x.id===typeId); if(!t)return;
  const it=t[subKey].find(x=>x.id===itemId); if(!it)return;
  it[field]=(field==='barLen'||field==='kgM'||field==='unitPrice')?parseFloat(value)||0:value;
  fmTypesSave(arr);
  // تحديث خانة الوزن لو ألمنيوم
  if(subKey==='aluminum'&&(field==='barLen'||field==='kgM')){
    const kp=fmKgPriceGet(), bk=fmCalcBarWeight(it.barLen,it.kgM), bp=Math.round(bk*kp*100)/100;
    const el=document.getElementById('fdBW_'+itemId);
    if(el) el.innerHTML=`<span style="color:var(--accent2)">${bk.toFixed(3)} كغ</span> × ${kp} = <strong style="color:var(--accent)">${bp.toFixed(2)} ر.س</strong>`;
  }
}

// ══ صور القطاعات — رفع / tooltip / معاينة ══════════════════

// رفع صورة لقطاع
function fdSecImgUpload(secId, desc) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = e => {
    const file = e.target.files[0]; if(!file) return;
    if(file.size > 500*1024) { notify(t('⚠️ الصورة أكبر من 500KB — اختر صورة أصغر'),'warn'); return; }
    const r = new FileReader();
    r.onload = ev => {
      fmSecImgSet(desc, ev.target.result);
      fdRenderTypeTree(); // تحديث الجدول
      notify(t('✅ تم حفظ صورة القطاع'));
    };
    r.readAsDataURL(file);
  };
  inp.click();
}

// معاينة صورة القطاع في نافذة صغيرة
function fdSecImgPreview(secId) {
  // نفس زر الرفع — انقر لتغيير
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = e => {
    const file = e.target.files[0]; if(!file) return;
    if(file.size > 500*1024) { notify(t('⚠️ الصورة أكبر من 500KB'),'warn'); return; }
    // نجد الوصف من الـ DOM
    const cell = document.getElementById('fdImgCell_'+secId);
    const descInput = cell?.closest('tr')?.querySelector('input[type=text],input:not([type])');
    const desc = descInput?.value || '';
    const r = new FileReader();
    r.onload = ev => { fmSecImgSet(desc, ev.target.result); fdRenderTypeTree(); notify(t('✅ تم تحديث الصورة')); };
    r.readAsDataURL(file);
  };
  inp.click();
}

// ── Tooltip عند hover على اسم القطاع ────────────────────────
// يُضاف مرة واحدة لـ document
(function initSecTooltip(){
  if(document._fmTooltipInit) return;
  document._fmTooltipInit = true;

  // إنشاء عنصر البالون
  const tip = document.createElement('div');
  tip.id = 'fmSecTooltip';
  tip.style.cssText = `
    position:fixed;z-index:99999;background:#fff;border:1.5px solid #1a3a5c;border-radius:10px;
    box-shadow:0 4px 20px rgba(0,0,0,0.18);padding:6px;display:none;pointer-events:none;
    max-width:200px;transition:opacity 0.15s
  `;
  tip.innerHTML = '<img id="fmSecTipImg" style="max-width:180px;max-height:180px;object-fit:contain;display:block;border-radius:6px"><div id="fmSecTipDesc" style="font-size:10px;color:#555;margin-top:4px;text-align:center;font-family:Cairo,sans-serif"></div>';
  document.body.appendChild(tip);

  document.addEventListener('mouseover', e => {
    const el = e.target.closest('.fm-sec-hover');
    if(!el) return;
    const img = el.dataset.img;
    const desc = el.dataset.desc || '';
    if(!img) return;
    document.getElementById('fmSecTipImg').src = img;
    document.getElementById('fmSecTipDesc').textContent = desc;
    tip.style.display = 'block';
  });

  document.addEventListener('mousemove', e => {
    if(tip.style.display === 'none') return;
    const x = e.clientX, y = e.clientY;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    tip.style.left = (x + 16 + tw > vw ? x - tw - 10 : x + 16) + 'px';
    tip.style.top  = (y + 16 + th > vh ? y - th - 10 : y + 16) + 'px';
  });

  document.addEventListener('mouseout', e => {
    const el = e.target.closest('.fm-sec-hover');
    if(el) tip.style.display = 'none';
  });
})();

function fdRenderTypeTree(){
  const ct=document.getElementById('fdTypeTree'); if(!ct)return;
  const types=fmTypesLoad(), kp=fmKgPriceGet();
  if(!types.length){ ct.innerHTML='<div style="color:var(--text2);text-align:center;padding:20px;border:1px dashed var(--border);border-radius:8px">'+t('لا توجد أنواع بعد')+'</div>'; return; }

  ct.innerHTML=types.map(type=>`
    <div style="border:1px solid var(--border);border-radius:8px;margin-bottom:12px;overflow:hidden">
      <!-- رأس النوع -->
      <div style="background:var(--surface2);padding:9px 14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span style="cursor:pointer;color:var(--accent);font-size:14px" onclick="fdToggle('fdTB_${type.id}')">▶</span>
        <input value="${(type.name||'').replace(/"/g,'&quot;')}"
          style="flex:1;min-width:220px;padding:6px 10px;border:1px solid var(--border);border-radius:5px;font-family:Cairo,sans-serif;font-size:13px;font-weight:700;color:var(--accent);background:var(--surface)"
          title="عدّل الاسم مباشرة" onchange="fdUpdTypeName('${type.id}',this.value)">
        <span style="font-size:11px;color:var(--text2)">${type.aluminum.length} قطاع | ${type.accessories.length} أكسسوار | ${type.installation.length} مادة</span>
        <button class="btn btn-sm btn-danger" style="font-size:11px;padding:3px 8px" onclick="fdDelType('${type.id}')">${t('🗑️ حذف')}</button>
      </div>

      <!-- محتوى النوع -->
      <div id="fdTB_${type.id}" style="display:none">

        <!-- الألمنيوم -->
        <div style="padding:10px 12px;border-top:1px solid var(--border)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px">
            <div style="font-weight:700;color:var(--accent);font-size:12px">${t('🔩 قطاعات الألمنيوم')}</div>
            <button class="btn btn-sm btn-success" style="font-size:11px;padding:3px 8px" onclick="fdAddAlumSec('${type.id}')">${t('➕ قطاع')}</button>
          </div>
          ${type.aluminum.length?`
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr style="background:var(--surface2)">
              <th style="padding:4px 8px;text-align:right;border:1px solid var(--border)">${t('الوصف')}</th>
              <th style="padding:4px;border:1px solid var(--border);width:60px">${t('الرمز')}</th>
              <th style="padding:4px;border:1px solid var(--border);width:88px">${t('طول البار (مم)')}</th>
              <th style="padding:4px;border:1px solid var(--border);width:78px">${t('كغ/م')}</th>
              <th style="padding:4px;border:1px solid var(--border);width:170px;color:var(--accent)">${t('وزن البار / سعره')}</th>
              <th style="padding:4px;border:1px solid var(--border);width:54px;text-align:center">${t('📷 صورة')}</th>
              <th style="padding:4px;border:1px solid var(--border);width:28px"></th>
            </tr></thead>
            <tbody>${type.aluminum.map(s=>{
              const bk=fmCalcBarWeight(s.barLen,s.kgM), bp=Math.round(bk*kp*100)/100;
              const img=fmSecImgGet(s.desc);
              const imgCell = img
                ? `<div style="position:relative;display:inline-block">
                    <img src="${img}" style="width:36px;height:36px;object-fit:contain;border:1px solid var(--border);border-radius:4px;cursor:pointer" onclick="fdSecImgPreview('${s.id}')" title="انقر للتغيير">
                    <button onclick="fmSecImgDel('${s.desc}');fdRenderTypeTree()" style="position:absolute;top:-4px;right:-4px;background:#c62828;color:#fff;border:none;border-radius:50%;width:14px;height:14px;font-size:9px;cursor:pointer;line-height:14px;padding:0;text-align:center">✕</button>
                   </div>`
                : `<button class="btn btn-sm" style="font-size:10px;padding:2px 5px;background:var(--surface2);border:1px dashed var(--border)" onclick="fdSecImgUpload('${s.id}','${s.desc.replace(/'/g,"\\'")}')">📷</button>`;
              return`<tr>
                <td style="padding:3px 6px;border:1px solid var(--border)">
                  <div style="display:flex;align-items:center;gap:4px">
                    ${img?`<span class="fm-sec-hover" data-img="${img}" data-desc="${(s.desc||'').replace(/"/g,'&quot;')}" style="cursor:help;color:var(--accent2);font-size:13px">🖼️</span>`:''}
                    <input value="${(s.desc||'').replace(/"/g,'&quot;')}" style="flex:1;padding:2px 4px;border:1px solid var(--border);border-radius:3px;font-family:Cairo,sans-serif;font-size:11px;background:var(--surface);color:var(--text)" onchange="fdUpdSec('${type.id}','aluminum','${s.id}','desc',this.value)">
                  </div>
                </td>
                <td style="padding:3px 4px;border:1px solid var(--border)"><input value="${s.code||''}" style="width:55px;padding:2px 4px;border:1px solid var(--border);border-radius:3px;font-family:Cairo,sans-serif;font-size:11px;text-align:center;background:var(--surface);color:var(--text)" onchange="fdUpdSec('${type.id}','aluminum','${s.id}','code',this.value)"></td>
                <td style="padding:3px 4px;border:1px solid var(--border)"><input type="number" value="${s.barLen||6000}" style="width:82px;padding:2px 4px;border:1px solid var(--border);border-radius:3px;font-family:Cairo,sans-serif;font-size:11px;text-align:center;background:var(--surface);color:var(--text)" onchange="fdUpdSec('${type.id}','aluminum','${s.id}','barLen',this.value)"></td>
                <td style="padding:3px 4px;border:1px solid var(--border)"><input type="number" value="${s.kgM||0}" step="0.001" style="width:70px;padding:2px 4px;border:1px solid var(--border);border-radius:3px;font-family:Cairo,sans-serif;font-size:11px;text-align:center;background:var(--surface);color:var(--text)" onchange="fdUpdSec('${type.id}','aluminum','${s.id}','kgM',this.value)"></td>
                <td id="fdBW_${s.id}" style="padding:3px 8px;border:1px solid var(--border);font-size:10px;background:var(--surface2)"><span style="color:var(--accent2)">${bk.toFixed(3)} كغ</span> × ${kp} = <strong style="color:var(--accent)">${bp.toFixed(2)} ر.س</strong></td>
                <td style="padding:3px 4px;border:1px solid var(--border);text-align:center" id="fdImgCell_${s.id}">${imgCell}</td>
                <td style="padding:3px;border:1px solid var(--border);text-align:center"><button class="btn btn-sm btn-danger btn-icon" style="padding:1px 4px;font-size:10px" onclick="fdDelItem('${type.id}','aluminum','${s.id}')">✕</button></td>
              </tr>`;}).join('')}
            </tbody>
          </table>`:'<div style="color:var(--text2);font-size:11px;padding:6px;text-align:center">'+t('لا توجد قطاعات — اضغط ➕ قطاع')+'</div>'}
        </div>

        <!-- الأكسسوارات -->
        <div style="padding:10px 12px;border-top:1px solid var(--border);background:var(--surface)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px">
            <div style="font-weight:700;color:var(--accent2);font-size:12px">${t('🔧 الأكسسوارات')}</div>
            <button class="btn btn-sm btn-success" style="font-size:11px;padding:3px 8px" onclick="fdAddAccSec('${type.id}')">${t('➕ أكسسوار')}</button>
          </div>
          <div>${type.accessories.length?type.accessories.map(a=>`
            <div style="display:flex;align-items:center;gap:6px;padding:4px 6px;border-bottom:1px solid var(--border);font-size:12px">
              <input value="${(a.desc||'').replace(/"/g,'&quot;')}" style="flex:1;padding:2px 6px;border:1px solid var(--border);border-radius:3px;font-family:Cairo,sans-serif;font-size:11.5px;background:var(--surface);color:var(--text)" onchange="fdUpdSec('${type.id}','accessories','${a.id}','desc',this.value)">
              <input value="${a.unit||'حبة'}" style="width:60px;padding:2px 5px;border:1px solid var(--border);border-radius:3px;font-family:Cairo,sans-serif;font-size:11px;background:var(--surface);color:var(--text);text-align:center" onchange="fdUpdSec('${type.id}','accessories','${a.id}','unit',this.value)">
              <button class="btn btn-sm btn-danger btn-icon" style="padding:1px 5px;font-size:10px" onclick="fdDelItem('${type.id}','accessories','${a.id}')">✕</button>
            </div>`).join(''):'<div style="color:var(--text2);font-size:11px;padding:6px;text-align:center">'+t('لا توجد — اضغط ➕')+'</div>'}</div>
        </div>

        <!-- مواد التركيب -->
        <div style="padding:10px 12px;border-top:1px solid var(--border);background:var(--surface2)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px">
            <div style="font-weight:700;color:#27ae60;font-size:12px">${t('🔨 مواد التركيب')}</div>
            <button class="btn btn-sm btn-success" style="font-size:11px;padding:3px 8px" onclick="fdAddInstSec('${type.id}')">${t('➕ مادة')}</button>
          </div>
          <div>${type.installation.length?type.installation.map(it=>`
            <div style="display:flex;align-items:center;gap:6px;padding:4px 6px;border-bottom:1px solid var(--border);font-size:12px">
              <input value="${(it.desc||'').replace(/"/g,'&quot;')}" style="flex:1;padding:2px 6px;border:1px solid var(--border);border-radius:3px;font-family:Cairo,sans-serif;font-size:11.5px;background:var(--surface);color:var(--text)" onchange="fdUpdSec('${type.id}','installation','${it.id}','desc',this.value)">
              <input value="${it.unit||'حبة'}" style="width:60px;padding:2px 5px;border:1px solid var(--border);border-radius:3px;font-family:Cairo,sans-serif;font-size:11px;background:var(--surface);color:var(--text);text-align:center" onchange="fdUpdSec('${type.id}','installation','${it.id}','unit',this.value)">
              <input type="number" value="${it.unitPrice||0}" step="any" style="width:80px;padding:2px 5px;border:1px solid var(--border);border-radius:3px;font-family:Cairo,sans-serif;font-size:11px;background:var(--surface);color:var(--text);text-align:center" onchange="fdUpdSec('${type.id}','installation','${it.id}','unitPrice',this.value)">
              <span style="font-size:10px;color:var(--text2)">ر.س</span>
              <button class="btn btn-sm btn-danger btn-icon" style="padding:1px 5px;font-size:10px" onclick="fdDelItem('${type.id}','installation','${it.id}')">✕</button>
            </div>`).join(''):'<div style="color:var(--text2);font-size:11px;padding:6px;text-align:center">'+t('لا توجد — اضغط ➕')+'</div>'}</div>
        </div>
      </div>
    </div>`).join('');
}
