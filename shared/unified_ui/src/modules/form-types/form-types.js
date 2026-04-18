// ============================================================
// 12-form-types.js — شجرة أنواع القطاعات
// كل نوع قطاع يحتوي على: ألمنيوم + أكسسوارات + مواد تركيب
// ============================================================

const FM_TYPES_KEY = 'pm_form_types';
const FM_KG_PRICE_KEY = 'pm_form_alum_kg_price';

function fmTypesLoad() {
  try { return JSON.parse(localStorage.getItem(FM_TYPES_KEY) || 'null') || _fmDefaultTypes(); }
  catch(e) { return _fmDefaultTypes(); }
}
function fmTypesSave(arr) { localStorage.setItem(FM_TYPES_KEY, JSON.stringify(arr)); }
function fmKgPriceGet() { return parseFloat(localStorage.getItem(FM_KG_PRICE_KEY) || '10') || 10; }
function fmKgPriceSet(v) { localStorage.setItem(FM_KG_PRICE_KEY, String(+v)); }

// ── كتالوجات الموردين ─────────────────────────────────────
// البنية:
//   id        — معرف فريد
//   name      — اسم المورد (العاصمة، الوبكو، كود محلي...)
//   codes     — قاموس: descKey → code
//              (المفتاح = وصف القطاع المُطبَّع)
const FM_CATALOGS_KEY    = 'pm_supplier_catalogs';
const FM_ACTIVE_CAT_KEY  = 'pm_active_catalog';   // المورد المختار حالياً

function fmCatalogsLoad()  { try{return JSON.parse(localStorage.getItem(FM_CATALOGS_KEY)||'null')||[];}catch(e){return[];} }
function fmCatalogsSave(a) { localStorage.setItem(FM_CATALOGS_KEY,JSON.stringify(a)); }
function fmActiveCatGet()  { return localStorage.getItem(FM_ACTIVE_CAT_KEY)||''; }
function fmActiveCatSet(id){ localStorage.setItem(FM_ACTIVE_CAT_KEY,id); }

// جلب كود قطاع معين حسب المورد المختار
// descKey = وصف القطاع (مثال: "حلق سحاب سرايا 10سم")
// fallback = الكود الافتراضي المحفوظ في القطاع نفسه
function fmGetCode(descKey, fallback) {
  const catId = fmActiveCatGet();
  if(!catId) return fallback||'';
  const cats = fmCatalogsLoad();
  const cat  = cats.find(c=>c.id===catId);
  if(!cat) return fallback||'';
  return (cat.codes&&cat.codes[descKey]) || fallback||'';
}

// تطبيع المفتاح (نزيل المسافات الزائدة)
function fmDescKey(desc) { return (desc||'').trim(); }

// CRUD كتالوجات
function fmCatAdd(name) {
  if(!name) return;
  const arr=fmCatalogsLoad();
  arr.push({id:'cat_'+Date.now(), name, codes:{}});
  fmCatalogsSave(arr);
}
function fmCatDel(id) {
  fmCatalogsSave(fmCatalogsLoad().filter(c=>c.id!==id));
  if(fmActiveCatGet()===id) fmActiveCatSet('');
}
function fmCatSetCode(catId, descKey, code) {
  const arr=fmCatalogsLoad(), cat=arr.find(c=>c.id===catId);
  if(!cat) return;
  if(!cat.codes) cat.codes={};
  if(code==='') delete cat.codes[descKey];
  else cat.codes[descKey]=code;
  fmCatalogsSave(arr);
}

// ── صور القطاعات ──────────────────────────────────────────
// الصور تُخزَّن منفصلة عن بيانات الأنواع لتجنب ثقل localStorage
// المفتاح: pm_sec_img_{descKey}
// القيمة: base64 data URL

const FM_SEC_IMG_PREFIX = 'pm_sec_img_';

function fmSecImgKey(desc) {
  // مفتاح آمن من الوصف (نزيل الأحرف الخاصة)
  return FM_SEC_IMG_PREFIX + btoa(encodeURIComponent((desc||'').trim())).replace(/[^a-zA-Z0-9]/g,'').slice(0,40);
}
function fmSecImgGet(desc) {
  try { return localStorage.getItem(fmSecImgKey(desc)) || ''; } catch(e){ return ''; }
}
function fmSecImgSet(desc, dataUrl) {
  try {
    if(dataUrl) localStorage.setItem(fmSecImgKey(desc), dataUrl);
    else localStorage.removeItem(fmSecImgKey(desc));
  } catch(e){ console.warn('فشل حفظ صورة القطاع',e); }
}
function fmSecImgDel(desc) { fmSecImgSet(desc, ''); }

// ── نظام الإضافات (مع قوس / مع قاطع / ...) ───────────────
// كل إضافة: { id, label, keyword, aluminum[], accessories[], installation[] }
// تُفعَّل تلقائياً لما يحتوي اسم النوع في عرض الأسعار على keyword

const FM_ADDONS_KEY = 'pm_form_addons';

function fmAddonsLoad()  { try{return JSON.parse(localStorage.getItem(FM_ADDONS_KEY)||'null')||_fmDefaultAddons();}catch(e){return _fmDefaultAddons();} }
function fmAddonsSave(a) { localStorage.setItem(FM_ADDONS_KEY,JSON.stringify(a)); }

// دالة المطابقة الذكية: اسم النوع → { baseType, addons[] }
function fmResolveType(typeName, allTypes, allAddons) {
  typeName = (typeName||'').trim();
  // 1) تطابق مباشر
  let base = allTypes.find(t => t.name === typeName);
  // 2) تطابق جزئي — نجرب كل الأنواع ونأخذ أطولها تطابقاً
  if(!base) {
    const candidates = allTypes.filter(t => typeName.includes(t.name) || t.name.includes(typeName));
    if(candidates.length) base = candidates.reduce((a,b) => b.name.length > a.name.length ? b : a);
  }
  // 3) الإضافات — الكلمة المفتاحية موجودة في الاسم (تعمل بغض النظر عن وجود base)
  const matchedAddons = allAddons.filter(ad => ad.keyword && typeName.includes(ad.keyword));
  // 4) إذا ما في base لكن في إضافات — نرجع النتيجة مع base=null
  if(!base && !matchedAddons.length) return null;
  return { baseType: base || null, addons: matchedAddons };
}

// CRUD إضافات
function fmAddonAdd(label, keyword) {
  const arr=fmAddonsLoad();
  arr.push({id:'ad_'+Date.now(), label, keyword, aluminum:[], accessories:[], installation:[]});
  fmAddonsSave(arr);
}
function fmAddonDel(id) {
  fmAddonsSave(fmAddonsLoad().filter(a=>a.id!==id));
}
function fmAddonUpdField(id, field, value) {
  const arr=fmAddonsLoad(), a=arr.find(x=>x.id===id);
  if(a){ a[field]=value; fmAddonsSave(arr); }
}
function fmAddonAddAlum(addonId) {
  const code=(prompt('رمز القطاع:')||'').trim();
  const desc=(prompt('الوصف:')||'').trim(); if(!desc)return;
  const barLen=parseFloat(prompt('طول البار (مم):','6000')||'6000')||6000;
  const kgM=parseFloat(prompt('وزن 1م (كغ):','0')||'0')||0;
  const arr=fmAddonsLoad(), a=arr.find(x=>x.id===addonId); if(!a)return;
  a.aluminum.push({id:'aa_'+Date.now(),code,desc,unit:'بار',barLen,kgM});
  fmAddonsSave(arr); fdRenderAddonsTree();
}
function fmAddonAddAcc(addonId) {
  const desc=(prompt('اسم الأكسسوار:')||'').trim(); if(!desc)return;
  const unit=(prompt('الوحدة:','حبة')||'حبة').trim();
  const arr=fmAddonsLoad(), a=arr.find(x=>x.id===addonId); if(!a)return;
  a.accessories.push({id:'aacc_'+Date.now(),desc,unit});
  fmAddonsSave(arr); fdRenderAddonsTree();
}
function fmAddonDelItem(addonId, subKey, itemId) {
  const arr=fmAddonsLoad(), a=arr.find(x=>x.id===addonId); if(!a)return;
  a[subKey]=a[subKey].filter(x=>x.id!==itemId); fmAddonsSave(arr); fdRenderAddonsTree();
}
function fmAddonUpdItem(addonId, subKey, itemId, field, value) {
  const arr=fmAddonsLoad(), a=arr.find(x=>x.id===addonId); if(!a)return;
  const it=a[subKey].find(x=>x.id===itemId); if(!it)return;
  it[field]=(field==='barLen'||field==='kgM'||field==='unitPrice')?parseFloat(value)||0:value;
  fmAddonsSave(arr);
}

function _fmDefaultAddons() {
  return [
    {
      id:'ad_arc', label:'مع قوس', keyword:'مع قوس',
      aluminum:[
        {id:'aa1',code:'',desc:'حلق مفصلات سرايا 10.5سم مفتوح SOFT غ.م',unit:'بار',barLen:6000,kgM:1.8, qty:1 },
        {id:'aa2',code:'',desc:'بركلوز 18مم SOFT غ.م',unit:'بار',barLen:6000,kgM:1.2, qty:1 },
      ],
      accessories:[],
      installation:[
        {id:'ai1',desc:'أجور لف اقواس',unit:'حبة',unitPrice:0},
      ]
    },
    {
      id:'ad_fixed', label:'مع ثابت', keyword:'مع ثابت',
      aluminum:[
        {id:'aa3',code:'G5',desc:'قاطع سحاب مع ثابت قطاع جولف 10-12 سم سماكة 1.5مم ط6م',unit:'بار',barLen:6000,kgM:1.782, qty:1 },
        {id:'aa4',code:'G6',desc:'ادابتر قاطع سحاب مع ثابت قطاع جولف 10-12سم سماكة 1.5 ط6م',unit:'بار',barLen:6000,kgM:0.868, qty:1 },
        {id:'aa5',code:'G7',desc:'بركلوز قطاع مفصلات 14.5مم سماكة 1.5مم ط6م',unit:'بار',barLen:6000,kgM:0.282, qty:1 },
        {id:'aa6',code:'G8',desc:'قاطع تي 44 سماكة 1.50 ط6م',unit:'بار',barLen:6000,kgM:1.145, qty:1 },
      ],
      accessories:[], installation:[]
    },
    {
      id:'ad_4fixed', label:'4 درف مع ثابت', keyword:'4 درف مع ثابت',
      aluminum:[
        {id:'aa7',code:'G9',desc:'مشترك 4 درف قطاع جولف 12 سم سحاب سماكة 1.6 مم ط6م',unit:'بار',barLen:6000,kgM:0.342, qty:1 },
      ],
      accessories:[], installation:[]
    },
    {
      id:'ad_4leaf', label:'4 درف', keyword:'4 درف',
      aluminum:[
        {id:'aa8',code:'G10',desc:'مشترك 4 درف قطاع جولف 12 سم سحاب سماكة 1.6 مم ط6م',unit:'بار',barLen:6000,kgM:0.342, qty:1 },
      ],
      accessories:[], installation:[]
    },
  ];
}

// ── حساب وزن البار وسعره ──────────────────────────────────
function fmCalcBarWeight(barLenMm, kgPerM) {
  return Math.round((barLenMm / 1000) * (kgPerM || 0) * 1000) / 1000;
}
function fmCalcBarPrice(barLenMm, kgPerM, kgPrice) {
  return Math.round(fmCalcBarWeight(barLenMm, kgPerM) * (kgPrice || fmKgPriceGet()) * 100) / 100;
}

// ── البيانات الافتراضية ────────────────────────────────────
function _fmDefaultTypes() {
  return [
    {
      id: 'wt1',
      name: 'نوافذ سحاب قلف 12 سم',
      aluminum: [
        {id:'a1', code:'902',  desc:'حلق سحاب قلف 12 سم 1.8مم ط6م',    unit:'بار', barLen:6000, kgM:2.29, qty:1 },
        {id:'a2', code:'940',  desc:'درفة جنب قلف 1.5مم ط6م',           unit:'بار', barLen:6000, kgM:0.889, qty:1 },
        {id:'a3', code:'950',  desc:'درفة شنكل قلف 1.5مم ط6م',          unit:'بار', barLen:6000, kgM:0.778, qty:1 },
        {id:'a4', code:'960',  desc:'درفة كعب قلف 1.5مم ط6م',           unit:'بار', barLen:6000, kgM:0.781, qty:1 },
        {id:'a5', code:'3770', desc:'زاوية 40x40x40مم (غ.م) ط5.8م',     unit:'بار', barLen:5800, kgM:0.821, qty:1 },
      ],
      accessories: [
        {id:'ac1', desc:'غطاء درفة شنكل قلف (10-12سم) اسود',  unit:'حبة', qty:1 },
        {id:'ac2', desc:'زاوية زنك حلق قلف 12سم (رقم 902)',    unit:'حبة', qty:1 },
        {id:'ac3', desc:'كفر قلف 12سم ايطالي MARO',            unit:'حبة', qty:1 },
        {id:'ac4', desc:'مسكة مخفية ماسح LAVAL مدهون',         unit:'حبة', qty:1 },
        {id:'ac5', desc:'سلك سحاب (80سم) اسود بحريني',         unit:'لفة'},
        {id:'ac6', desc:'فرش 5.5مم 550-PB6 رمادي 170م',        unit:'لفة'},
      ],
      installation: [
        {id:'i1', desc:'براغي حسب حاجة العمل',     unit:'علبة', unitPrice:200},
        {id:'i2', desc:'سيلكون',                    unit:'حبة',  unitPrice:6},
        {id:'i3', desc:'زجاج دبل + سيلكون الزجاج', unit:'متر',  unitPrice:145},
        {id:'i4', desc:'نقل',                       unit:'سيارة',unitPrice:1000},
      ]
    },
    {
      id: 'wt2',
      name: 'نوافذ سحاب سرايا 10 سم',
      aluminum: [
        {id:'a6', code:'40',   desc:'حلق سحاب سرايا 10سم 1.5مم ط6م',   unit:'بار', barLen:6000, kgM:1.649, qty:1 },
        {id:'a7', code:'220',  desc:'درفة جنب سرايا دبل 1.4مم ط5.8م',  unit:'بار', barLen:5800, kgM:0.782, qty:1 },
        {id:'a8', code:'230',  desc:'درفة شنكل سرايا دبل 1.4مم ط5.8م', unit:'بار', barLen:5800, kgM:0.746, qty:1 },
        {id:'a9', code:'240',  desc:'درفة كعب سرايا 1.4مم ط5.8م',      unit:'بار', barLen:5800, kgM:0.755, qty:1 },
        {id:'a10',code:'3770', desc:'زاوية 40x40x40مم (غ.م) ط5.8م',    unit:'بار', barLen:5800, kgM:0.821, qty:1 },
      ],
      accessories: [
        {id:'ac7', desc:'غطاء درفة شنكل سرايا (10سم) اسود', unit:'حبة', qty:1 },
        {id:'ac8', desc:'زاوية زنك حلق سرايا 10سم (رقم 40)', unit:'حبة', qty:1 },
        {id:'ac9', desc:'كفر سرايا 10سم ايطالي',             unit:'حبة', qty:1 },
        {id:'ac10',desc:'مسكة مخفية ماسح LAVAL مدهون',       unit:'حبة', qty:1 },
        {id:'ac11',desc:'سلك سحاب (80سم) اسود بحريني',       unit:'لفة'},
        {id:'ac12',desc:'فرش 5.5مم 550-PB7 رمادي 170م',      unit:'لفة'},
      ],
      installation: [
        {id:'i5', desc:'براغي حسب حاجة العمل',     unit:'علبة', unitPrice:200},
        {id:'i6', desc:'سيلكون',                    unit:'حبة',  unitPrice:6},
        {id:'i7', desc:'زجاج دبل + سيلكون الزجاج', unit:'متر',  unitPrice:145},
        {id:'i8', desc:'نقل',                       unit:'سيارة',unitPrice:1000},
      ]
    },
    {
      id: 'wt3',
      name: 'واجهات استركشر SG50',
      aluminum: [
        {id:'a11',code:'SG50-T', desc:'قطاع T استركشر SG50 ط6م',         unit:'بار', barLen:6000, kgM:2.8, qty:1 },
        {id:'a12',code:'SG50-P', desc:'قطاع ضغاطة استركشر SG50 ط6م',     unit:'بار', barLen:6000, kgM:1.2, qty:1 },
        {id:'a13',code:'3770',   desc:'زاوية 40x40x40مم (غ.م) ط5.8م',    unit:'بار', barLen:5800, kgM:0.821, qty:1 },
      ],
      accessories: [
        {id:'ac13',desc:'مسكة استركشر LAVAL مع الاكسسوار مدهون', unit:'حبة', qty:1 },
        {id:'ac14',desc:'ذراع رباعي CADWELL ستانلس 55سم',         unit:'حبة', qty:1 },
        {id:'ac15',desc:'كاوتش SG50 سماكة 8مم (50متر)',           unit:'لفة'},
      ],
      installation: [
        {id:'i9',  desc:'براغي حسب حاجة العمل',           unit:'علبة', unitPrice:200},
        {id:'i10', desc:'سيلكون استركشر',                  unit:'حبة',  unitPrice:8},
        {id:'i11', desc:'زجاج دبل استركشر + سيلكون',      unit:'متر',  unitPrice:155},
        {id:'i12', desc:'نقل',                             unit:'سيارة',unitPrice:1000},
      ]
    },
  ];
}
