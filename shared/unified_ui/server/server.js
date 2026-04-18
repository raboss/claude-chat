const express     = require('express');
const compression = require('compression');
const fs          = require('fs');
const path        = require('path');
const multer      = require('multer');
const app         = express();
app.use(compression()); // ضغط gzip — يقلل حجم النقل 70-80%
const PORT    = 3001;
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── نظام التحديث الفوري ──
let _dataVersion = Date.now();
function _bumpVersion() { _dataVersion = Date.now(); }
// رقم نسخة الكود — يتغير مع كل تعديل على ملفات JS
const crypto = require('crypto');
function _calcCodeVersion() {
  const jsDir = path.join(__dirname, 'public/js');
  let hash = '';
  try {
    fs.readdirSync(jsDir).filter(f=>f.endsWith('.js')&&!f.includes('backup')).sort().forEach(f => {
      hash += fs.statSync(path.join(jsDir,f)).mtimeMs;
    });
  } catch(e) {}
  return crypto.createHash('md5').update(hash).digest('hex').slice(0,12);
}
let _codeVersion = _calcCodeVersion();
// فحص تغيير الكود كل 30 ثانية
setInterval(() => { _codeVersion = _calcCodeVersion(); }, 30000);

app.get('/api/version', (req, res) => { res.json({ v: _dataVersion, code: _codeVersion }); });

// صفحة إعادة تعيين — فقط للمدير (تحتاج كلمة مرور)
app.get('/reset', (req, res) => {
  // حماية — تحقق من كلمة المرور بالـ query
  const masterHash = (() => { try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR,'pm_master_hash.json'),'utf8')); } catch(e) { return ''; } })();
  const key = req.query.key || '';
  if(masterHash && key !== masterHash && Buffer.from(key).toString('base64') !== masterHash) {
    return res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:sans-serif;background:#0a0f1e;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;text-align:center}
.box{background:#0f172a;padding:40px;border-radius:16px;max-width:350px}h2{color:#ef4444}input{padding:10px;border-radius:8px;border:1px solid #333;background:#1e293b;color:#fff;width:100%;margin:10px 0;font-size:14px}button{padding:10px 20px;border:none;border-radius:8px;background:#3b82f6;color:#fff;cursor:pointer;font-size:14px;width:100%}</style></head>
<body><div class="box"><h2>🔒</h2><p>هذه الصفحة محمية</p>
<form onsubmit="window.location.href='/reset?key='+encodeURIComponent(document.getElementById('k').value);return false">
<input id="k" type="password" placeholder="كلمة المرور الرئيسية" autofocus>
<button type="submit">دخول</button></form></div></body></html>`);
  }
  res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:sans-serif;background:#0a0f1e;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;text-align:center}
.box{background:#0f172a;padding:40px;border-radius:16px;max-width:350px}h2{color:#3b82f6}.ok{color:#10b981}</style></head>
<body><div class="box"><h2>🔄</h2><p id="st">جاري مسح الكاش وتحميل البيانات...</p></div>
<script>
(async function(){
  var st=document.getElementById('st');
  // 1. مسح كل شي
  try{localStorage.clear();}catch(e){}
  try{sessionStorage.clear();}catch(e){}
  try{var ks=await caches.keys();for(var i=0;i<ks.length;i++)await caches.delete(ks[i]);}catch(e){}
  try{var rs=await navigator.serviceWorker.getRegistrations();for(var j=0;j<rs.length;j++)await rs[j].unregister();}catch(e){}
  st.textContent='تم المسح — جاري تحميل البيانات...';
  // 2. تحميل كل البيانات من السيرفر وكتابتها بالـ localStorage
  try{
    var r=await fetch('/api/data');var d=await r.json();
    if(d.ok&&d.data){
      var c=0;
      Object.entries(d.data).forEach(function(e){
        var k=e[0],v=e[1];
        if(!k.startsWith('pm_'))return;
        if(k==='pm_current_user'||k==='pm_master_unlocked')return;
        try{localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));c++;}catch(x){}
      });
      st.innerHTML='<span class="ok">✅ تم تحميل '+c+' مفتاح</span>';
    }
  }catch(e){st.textContent='خطأ: '+e.message;}
  // 3. تحويل للبرنامج
  setTimeout(function(){window.location.href='/?t='+Date.now();},1500);
})();
</script></div></body></html>`);
});
app.use(express.json({ limit: '50mb' }));
app.use(function(req, res, next) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: function(res, filePath) {
    if(filePath.endsWith('.apk')) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="NourMetal.apk"');
    }
  }
}));

// Generate PNG icon from SVG (for PWA)
app.get('/icons/icon-:size.png', (req, res) => {
  const size = parseInt(req.params.size) || 192;
  const svg = fs.readFileSync(path.join(__dirname, 'public/icons/icon.svg'), 'utf8')
    .replace('viewBox="0 0 512 512"', `viewBox="0 0 512 512" width="${size}" height="${size}"`);
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

// GET all data
app.get('/api/data', (req, res) => {
  const result = {};
  try {
    fs.readdirSync(DATA_DIR).filter(f=>f.endsWith('.json')).forEach(file => {
      const key = file.replace('.json','');
      try { result[key] = JSON.parse(fs.readFileSync(path.join(DATA_DIR,file),'utf8')); }
      catch(e) { result[key] = fs.readFileSync(path.join(DATA_DIR,file),'utf8'); }
    });
    res.json({ ok:true, data:result });
  } catch(e) { res.json({ ok:false, error:e.message }); }
});

// GET single key
app.get('/api/data/:key', (req, res) => {
  const key = req.params.key;
  if (!key.startsWith('pm_')) return res.json({ ok:false, error:'Invalid key' });
  try {
    const fp = path.join(DATA_DIR, key+'.json');
    if (!fs.existsSync(fp)) return res.json({ ok:true, value:null });
    const raw = fs.readFileSync(fp, 'utf8');
    try { res.json({ ok:true, value: JSON.parse(raw) }); }
    catch(e) { res.json({ ok:true, value: raw }); }
  } catch(e) { res.json({ ok:false, error:e.message }); }
});

// POST save one key — ⛔ pm_projects محمية (فقط عبر merge-project)
app.post('/api/data/:key', (req, res) => {
  const key = req.params.key;
  if (!key.startsWith('pm_')) return res.json({ ok:false, error:'Invalid key' });
  if (key === 'pm_projects') return res.json({ ok:true, blocked:'use merge-project' });
  try {
    fs.writeFileSync(path.join(DATA_DIR, key+'.json'), JSON.stringify(req.body.value,null,2),'utf8');
    _bumpVersion();
    res.json({ ok:true });
  } catch(e) { res.json({ ok:false, error:e.message }); }
});

// POST save all — ⛔ pm_projects محمية
app.post('/api/data-all', (req, res) => {
  const data = req.body.data;
  if (!data) return res.json({ ok:false, error:'No data' });
  try {
    let count=0;
    Object.entries(data).forEach(([key,value]) => {
      if (!key.startsWith('pm_')) return;
      if (key === 'pm_projects') return; // محمية
      fs.writeFileSync(path.join(DATA_DIR, key+'.json'), JSON.stringify(value,null,2),'utf8');
      count++;
    });
    _bumpVersion();
    res.json({ ok:true, saved:count });
  } catch(e) { res.json({ ok:false, error:e.message }); }
});

// POST merge project — إضافة/تعديل مشروع بأمان بدون الكتابة فوق مشاريع مستخدمين آخرين
app.post('/api/merge-project', (req, res) => {
  const project = req.body.project;
  const action = req.body.action || 'upsert'; // 'upsert' | 'delete'
  if (!project || !project.id) return res.json({ ok:false, error:'No project' });
  try {
    const fp = path.join(DATA_DIR, 'pm_projects.json');
    let projects = [];
    if (fs.existsSync(fp)) {
      try { projects = JSON.parse(fs.readFileSync(fp, 'utf8')); } catch(e) { projects = []; }
    }
    if (action === 'delete') {
      projects = projects.filter(p => p.id !== project.id);
    } else {
      const idx = projects.findIndex(p => p.id === project.id);
      if (idx > -1) {
        projects[idx] = project; // update
      } else {
        projects.unshift(project); // add new at top
      }
    }
    fs.writeFileSync(fp, JSON.stringify(projects, null, 2), 'utf8');
    _bumpVersion();
    res.json({ ok:true, total: projects.length });
  } catch(e) { res.json({ ok:false, error:e.message }); }
});

// POST bulk sync — ⛔ pm_projects محمية
app.post('/api/smart-sync', (req, res) => {
  const data = req.body.data;
  if (!data) return res.json({ ok:false, error:'No data' });
  try {
    let count = 0;
    Object.entries(data).forEach(([key, value]) => {
      if (!key.startsWith('pm_')) return;
      if (key === 'pm_projects') return; // محمية — فقط عبر merge-project
      fs.writeFileSync(path.join(DATA_DIR, key + '.json'), JSON.stringify(value, null, 2), 'utf8');
      count++;
    });
    if(count) _bumpVersion();
    res.json({ ok:true, saved:count });
  } catch(e) { res.json({ ok:false, error:e.message }); }
});

// DELETE one key
app.delete('/api/data/:key', (req, res) => {
  const key = req.params.key;
  if (!key.startsWith('pm_')) return res.json({ ok:false, error:'Invalid key' });
  try {
    const fp = path.join(DATA_DIR, key+'.json');
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    _bumpVersion();
    res.json({ ok:true });
  } catch(e) { res.json({ ok:false, error:e.message }); }
});

// GET export backup
app.get('/api/export', (req, res) => {
  const result = { _date: new Date().toISOString(), _v:4 };
  try {
    fs.readdirSync(DATA_DIR).filter(f=>f.endsWith('.json')).forEach(file => {
      const key = file.replace('.json','');
      try { result[key] = JSON.parse(fs.readFileSync(path.join(DATA_DIR,file),'utf8')); }
      catch(e) {}
    });
    res.setHeader('Content-Disposition','attachment; filename="backup.json"');
    res.json(result);
  } catch(e) { res.json({ ok:false, error:e.message }); }
});

// POST import — atomic: delete old keys then write new ones
app.post('/api/import', (req, res) => {
  const data = req.body.data;
  const deleteOld = req.body.deleteOld; // array of keys to delete first
  if (!data) return res.json({ ok:false, error:'No data' });
  try {
    // Step 1: delete old keys not in new data
    if(Array.isArray(deleteOld)) {
      deleteOld.forEach(key => {
        if(!key.startsWith('pm_')) return;
        const fp = path.join(DATA_DIR, key+'.json');
        if(fs.existsSync(fp)) fs.unlinkSync(fp);
      });
    }
    // Step 2: write new data
    let count=0;
    Object.entries(data).forEach(([key,value]) => {
      if (!key.startsWith('pm_')) return;
      fs.writeFileSync(path.join(DATA_DIR, key+'.json'), JSON.stringify(value,null,2),'utf8');
      count++;
    });
    res.json({ ok:true, imported:count });
  } catch(e) { res.json({ ok:false, error:e.message }); }
});


// ══ CLIENT FOLDERS API ══════════════════════════════════
const CLIENTS_ROOT = path.join(__dirname, '..', 'ملفات العملاء');
if(!fs.existsSync(CLIENTS_ROOT)) fs.mkdirSync(CLIENTS_ROOT, {recursive:true});

function safeName(s){ return (s||'بدون').replace(/[\/:*?"<>|]/g,'_').trim().substring(0,50); }

// POST /api/client-folder
app.post('/api/client-folder', (req, res) => {
  try {
    const {name, contractNo, company, region, gallery} = req.body;
    if(!name) return res.json({ok:false, error:'اسم العميل مطلوب'});
    // هرمية: ملفات العملاء / شركة / منطقة / معرض / اسم العميل - رقم العقد
    const parts = [
      safeName(company),
      safeName(region),
      safeName(gallery),
      safeName(name) + (contractNo ? ' - '+safeName(contractNo) : '')
    ];
    let current = CLIENTS_ROOT;
    for(const part of parts){
      current = path.join(current, part);
      if(!fs.existsSync(current)) fs.mkdirSync(current, {recursive:true});
    }
    res.json({ok:true, path:current, display: parts.join(' / ')});
  } catch(e){ res.json({ok:false, error:e.message}); }
});

// GET /api/client-folder-check
app.get('/api/client-folder-check', (req, res) => {
  try {
    const {name, contractNo, company, region, gallery} = req.query;
    const folderName = safeName(name) + (contractNo ? ' - '+safeName(contractNo) : '');
    const folderPath = path.join(CLIENTS_ROOT, safeName(company), safeName(region), safeName(gallery), folderName);
    res.json({ok:true, exists:fs.existsSync(folderPath), path:folderPath, display:[safeName(company),safeName(region),safeName(gallery),folderName].join(' / ')});
  } catch(e){ res.json({ok:false, error:e.message}); }
});

// POST /api/open-folder — فتح المجلد في Explorer
app.post('/api/open-folder', (req, res) => {
  try {
    const {folderPath} = req.body;
    if(!folderPath || !fs.existsSync(folderPath)) return res.json({ok:false, error:'المجلد غير موجود'});
    const {exec} = require('child_process');
    const cmd = process.platform==='win32' ? `explorer "${folderPath}"`
              : process.platform==='darwin' ? `open "${folderPath}"`
              : `xdg-open "${folderPath}"`;
    exec(cmd);
    res.json({ok:true});
  } catch(e){ res.json({ok:false, error:e.message}); }
});

// POST /api/delete-folder — حذف مجلد العميل
app.post('/api/delete-folder', (req, res) => {
  try {
    const {folderPath} = req.body;
    if(!folderPath) return res.json({ok:false, error:'المسار مطلوب'});
    // Security: only allow deleting inside CLIENTS_ROOT
    if(!folderPath.startsWith(CLIENTS_ROOT)) return res.json({ok:false, error:'مسار غير مسموح'});
    if(!fs.existsSync(folderPath)) return res.json({ok:false, error:'المجلد غير موجود'});
    // Recursive delete
    fs.rmSync(folderPath, {recursive:true, force:true});
    res.json({ok:true});
  } catch(e) { res.json({ok:false, error:e.message}); }
});


// GET /api/client-files — قراءة الملفات الفعلية من مجلد العميل
app.get('/api/client-files', (req, res) => {
  try {
    const {name, contractNo, company, region, gallery} = req.query;
    const folderName = safeName(name) + (contractNo ? ' - '+safeName(contractNo) : '');
    const folderPath = path.join(CLIENTS_ROOT, safeName(company), safeName(region), safeName(gallery), folderName);
    if(!fs.existsSync(folderPath)) return res.json({ok:true, files:[]});
    const files = [];
    // قراءة الملفات من المجلد الرئيسي (بدون المجلدات الفرعية)
    const entries = fs.readdirSync(folderPath, {withFileTypes:true});
    entries.forEach(entry => {
      if(entry.isFile()) {
        const fp = path.join(folderPath, entry.name);
        const stat = fs.statSync(fp);
        const ext = path.extname(entry.name).toLowerCase();
        let type = 'application/octet-stream';
        if(['.jpg','.jpeg','.png','.gif','.webp','.bmp'].includes(ext)) type = 'image/'+ext.replace('.','').replace('jpg','jpeg');
        else if(ext==='.pdf') type = 'application/pdf';
        else if(['.xlsx','.xls'].includes(ext)) type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        else if(['.doc','.docx'].includes(ext)) type = 'application/msword';
        files.push({name:entry.name, filePath:fp, type:type, size:stat.size,
          date:stat.mtime.toLocaleDateString('ar-SA'), onServer:true});
      }
    });
    // قراءة المجلدات الفرعية (صور الموقع، نواقص، إلخ)
    entries.forEach(entry => {
      if(entry.isDirectory()) {
        const subDir = path.join(folderPath, entry.name);
        try {
          const subEntries = fs.readdirSync(subDir, {withFileTypes:true});
          subEntries.forEach(sub => {
            if(sub.isFile()) {
              const fp = path.join(subDir, sub.name);
              const stat = fs.statSync(fp);
              const ext = path.extname(sub.name).toLowerCase();
              let type = 'application/octet-stream';
              if(['.jpg','.jpeg','.png','.gif','.webp','.bmp'].includes(ext)) type = 'image/'+ext.replace('.','').replace('jpg','jpeg');
              else if(ext==='.pdf') type = 'application/pdf';
              files.push({name:entry.name+'/'+sub.name, filePath:fp, type:type, size:stat.size,
                date:stat.mtime.toLocaleDateString('ar-SA'), onServer:true, subfolder:entry.name});
            }
          });
        } catch(e){}
      }
    });
    res.json({ok:true, files:files});
  } catch(e){ res.json({ok:false, error:e.message, files:[]}); }
});

// ══ SITE PHOTOS UPLOAD (صور الموقع) ══════════════════════
const _sitePhotoStor = multer.diskStorage({
  destination: function(req, file, cb){
    try{
      const q = req.query;
      const fn = safeName(q.name||'بدون')+(q.contractNo?' - '+safeName(q.contractNo):'');
      const subfolder = safeName(q.subfolder||'صور الموقع');
      const fp = path.join(CLIENTS_ROOT,safeName(q.company),safeName(q.region),safeName(q.gallery),fn,subfolder);
      if(!fs.existsSync(fp)) fs.mkdirSync(fp,{recursive:true});
      cb(null, fp);
    }catch(e){cb(e);}
  },
  filename: function(req, file, cb){
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalName) || '.jpg';
    const ts = new Date().toISOString().replace(/[:.]/g,'-').substring(0,19);
    cb(null, 'site_'+ts+ext);
  }
});
const sitePhotoUpload = multer({storage:_sitePhotoStor, limits:{fileSize:20*1024*1024}});

app.post('/api/upload-site-photo', sitePhotoUpload.array('files',5), (req,res)=>{
  try{
    if(!req.files||!req.files.length) return res.json({ok:false,error:'No files'});
    const f=req.files[0];
    res.json({ok:true, path:f.path, name:f.filename, size:f.size});
  }catch(e){res.json({ok:false,error:e.message});}
});

// ══ CUSTODY INVOICE UPLOAD (فواتير العهدة) ══════════════════
const _custInvStor = multer.diskStorage({
  destination: function(req, file, cb){
    try{
      const q = req.query;
      const fn = safeName(q.name||'بدون')+(q.contractNo?' - '+safeName(q.contractNo):'');
      const fp = path.join(CLIENTS_ROOT,safeName(q.company||'بدون'),safeName(q.region||'بدون'),safeName(q.gallery||'بدون'),fn,'فواتير العهدة');
      if(!fs.existsSync(fp)) fs.mkdirSync(fp,{recursive:true});
      cb(null, fp);
    }catch(e){cb(e);}
  },
  filename: function(req, file, cb){
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalName) || '.jpg';
    const ts = Date.now();
    cb(null, 'custody_'+ts+ext);
  }
});
const custInvUpload = multer({storage:_custInvStor, limits:{fileSize:20*1024*1024}});

app.post('/api/upload-custody-invoice', custInvUpload.single('file'), (req,res)=>{
  try{
    if(!req.file) return res.json({ok:false,error:'No file'});
    _bumpVersion();
    res.json({ok:true, path:req.file.path, name:req.file.filename, size:req.file.size});
  }catch(e){res.json({ok:false,error:e.message});}
});

// ══ FILE UPLOAD API ══════════════════════
const _mStor = multer.diskStorage({
  destination: function(req, file, cb){
    try{
      // Read from query params (available before body is parsed)
      const q = req.query;
      const fn = safeName(q.name||'بدون')+(q.contractNo?' - '+safeName(q.contractNo):'');
      const fp = path.join(CLIENTS_ROOT,safeName(q.company),safeName(q.region),safeName(q.gallery),fn);
      if(!fs.existsSync(fp)) fs.mkdirSync(fp,{recursive:true});
      cb(null, fp);
    }catch(e){cb(e);}
  },
  filename: function(req, file, cb){
    // Fix Arabic filename encoding (multer uses latin1 by default)
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext  = path.extname(originalName);
    const base = path.basename(originalName, ext).substring(0,60);
    cb(null, base+'_'+Date.now()+ext);
  }
});
const upload = multer({storage:_mStor, limits:{fileSize:50*1024*1024}});

app.post('/api/upload-file', upload.array('files',20), (req,res)=>{
  try{
    const saved = req.files.map(f=>({
      name: Buffer.from(f.originalname,'latin1').toString('utf8'),
      savedAs: f.filename,
      path: f.path, size: f.size, type: f.mimetype
    }));
    res.json({ok:true, files:saved});
  }catch(e){res.json({ok:false,error:e.message});}
});

app.get('/api/file', (req,res)=>{
  try{
    const fp = req.query.path;
    if(!fp||!fs.existsSync(fp)) return res.status(404).send('Not found');
    if(!fp.startsWith(CLIENTS_ROOT)) return res.status(403).send('Forbidden');
    const ext = path.extname(fp).toLowerCase();
    // Content-Type صحيح حتى المتصفح يعرض الملف
    const mimeMap = {'.pdf':'application/pdf','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp','.bmp':'image/bmp','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','.xls':'application/vnd.ms-excel','.doc':'application/msword','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
    if(mimeMap[ext]) res.setHeader('Content-Type', mimeMap[ext]);
    res.setHeader('Content-Disposition', 'inline; filename="'+encodeURIComponent(path.basename(fp))+'"');
    res.sendFile(fp);
  }catch(e){res.status(500).send(e.message);}
});

app.delete('/api/file', (req,res)=>{
  try{
    const fp = req.body.path;
    if(!fp||!fp.startsWith(CLIENTS_ROOT)) return res.json({ok:false,error:'Invalid'});
    if(fs.existsSync(fp)) fs.unlinkSync(fp);
    res.json({ok:true});
  }catch(e){res.json({ok:false,error:e.message});}
});

// ══ ACTIVITY LOG API ══════════════════════════════════
const ACTIVITY_FILE = path.join(DATA_DIR, 'pm_activity_log.json');

function _readActivityLog() {
  try {
    if(!fs.existsSync(ACTIVITY_FILE)) return [];
    return JSON.parse(fs.readFileSync(ACTIVITY_FILE, 'utf8')) || [];
  } catch(e) { return []; }
}
function _writeActivityLog(log) {
  // Keep only last 200 entries
  if(log.length > 200) log = log.slice(0, 200);
  fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(log, null, 2), 'utf8');
}

app.post('/api/activity', (req, res) => {
  try {
    const { action, user, detail } = req.body;
    if(!action) return res.json({ok:false});
    const log = _readActivityLog();
    log.unshift({ id: Date.now().toString(), action, user: user||'', detail: detail||'', ts: new Date().toISOString() });
    _writeActivityLog(log);
    res.json({ok:true});
  } catch(e) { res.json({ok:false, error:e.message}); }
});

app.get('/api/activity', (req, res) => {
  try {
    const since = parseInt(req.query.since) || 0;
    const log = _readActivityLog();
    const filtered = since ? log.filter(e => new Date(e.ts).getTime() > since) : log.slice(0, 50);
    res.json({ok:true, log: filtered});
  } catch(e) { res.json({ok:false, error:e.message}); }
});

app.get('/', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║    NourMetal - Integrated Solutions           ║');
  console.log(`║    http://localhost:${PORT}                       ║`);
  console.log('║    البيانات في مجلد: data/                    ║');
  console.log('╚══════════════════════════════════════════════╝\n');
  const {exec} = require('child_process');
  const cmd = process.platform==='win32' ? `start http://localhost:${PORT}` : process.platform==='darwin' ? `open http://localhost:${PORT}` : `xdg-open http://localhost:${PORT}`;
  setTimeout(()=>exec(cmd), 600);
});
