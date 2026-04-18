// ═══════════════════════════════════════════════════════════════
// ══ 15-hr.js — قسم الموظفين + الهيكل التنظيمي + المركبات ══
// ═══════════════════════════════════════════════════════════════

// ── Default Departments ──
var HR_DEFAULT_DEPTS = [
  {id:'dept_mgmt',       name:'إدارة المصنع',    parentId:null,               icon:'🏭', color:'#1a3a5c', order:0},
  {id:'dept_production',  name:'إدارة الإنتاج',   parentId:'dept_mgmt',        icon:'⚙️', color:'#16a34a', order:1},
  {id:'dept_technical',   name:'المكتب الفني',    parentId:'dept_mgmt',        icon:'📐', color:'#2563eb', order:2},
  {id:'dept_followup',    name:'قسم المتابعة',    parentId:'dept_mgmt',        icon:'📋', color:'#d97706', order:3},
  {id:'dept_install',     name:'قسم التركيبات',   parentId:'dept_mgmt',        icon:'🔨', color:'#dc2626', order:4},
  {id:'dept_hall',        name:'صالة الإنتاج',    parentId:'dept_production',  icon:'🏭', color:'#15803d', order:5},
  {id:'dept_cutting',     name:'قسم القص',        parentId:'dept_hall',        icon:'🪚', color:'#be185d', order:6},
  {id:'dept_milling',     name:'قسم التفريز',     parentId:'dept_hall',        icon:'🔧', color:'#7c3aed', order:7},
  {id:'dept_assembly',    name:'قسم التجميع',     parentId:'dept_hall',        icon:'🔩', color:'#65a30d', order:8}
];

// ── Data Layer ──
function hrLoadDepts() {
  try { var d=JSON.parse(localStorage.getItem('pm_departments')||'null'); return d&&d.length?d:HR_DEFAULT_DEPTS; } catch(e) { return HR_DEFAULT_DEPTS; }
}
function hrSaveDepts(arr) { localStorage.setItem('pm_departments',JSON.stringify(arr)); saveData('pm_departments',arr); }
function hrLoadEmployees() { try { return JSON.parse(localStorage.getItem('pm_employees')||'[]'); } catch(e) { return []; } }
function hrSaveEmployees(arr) { localStorage.setItem('pm_employees',JSON.stringify(arr)); saveData('pm_employees',arr); }
function hrLoadVehicles() { try { return JSON.parse(localStorage.getItem('pm_vehicles')||'[]'); } catch(e) { return []; } }
function hrSaveVehicles(arr) { localStorage.setItem('pm_vehicles',JSON.stringify(arr)); saveData('pm_vehicles',arr); }

// ── Tab Switching ──
function switchHrTab(tab) {
  document.querySelectorAll('[id^="hrTab-"]').forEach(function(t){ t.classList.remove('active'); });
  document.querySelectorAll('[id^="hrSection-"]').forEach(function(s){ s.style.display='none'; });
  var tabEl=document.getElementById('hrTab-'+tab);
  var secEl=document.getElementById('hrSection-'+tab);
  if(tabEl) tabEl.classList.add('active');
  if(secEl) secEl.style.display='block';
  if(tab==='org') renderOrgChart();
  if(tab==='list') renderEmployeeList();
  if(tab==='salary') renderSalaryPage();
  if(tab==='attend') renderAttendancePage();
  if(tab==='depts') renderDeptManager();
}

// ── Main Entry ──
function renderHRPage() { renderOrgChart(); }

// ═══════════════════════════════════════════
// ══ الهيكل التنظيمي — Org Chart (ul/li) ══
// ═══════════════════════════════════════════

function _empBox(e, color) {
  var isMgr = e.role&&(e.role.indexOf('مدير')>-1||e.role.indexOf('رئيس')>-1||e.role.indexOf('مشرف')>-1);
  // مدراء: بدلة 🧑‍💼  |  عمال/فنيين: خوذة 👷
  var icon = isMgr ? '<span style="font-size:13px">🧑‍💼</span>' : '<span style="font-size:13px">👷</span>';
  var bg = isMgr ? (color||'#1a3a5c')+'18' : 'transparent';
  return '<div class="org-box org-box-emp" style="border-top:2px solid '+(color||'#94a3b8')+';background:'+bg+'" onclick="hrEditEmployee(\''+e.id+'\')">'
    +icon
    +'<div style="font-size:10px;font-weight:700;color:var(--text)">'+e.name+'</div>'
    +'<div style="font-size:8px;color:'+(color||'var(--text2)')+'">'+(e.role||'')+'</div>'
    +(e.iqama?'<div style="font-size:7px;color:var(--text2);direction:ltr;font-family:monospace;margin-top:1px">'+e.iqama+'</div>':'')
    +'</div>';
}

function renderOrgChart() {
  var el=document.getElementById('orgChartContent'); if(!el) return;
  var depts=hrLoadDepts(), emps=hrLoadEmployees();
  var teams=[];
  try { teams=JSON.parse(localStorage.getItem('pm_team_dist')||'[]'); } catch(ex){}

  function isMgr(e) { return e.role&&(e.role.indexOf('مدير')>-1||e.role.indexOf('رئيس')>-1||e.role.indexOf('مشرف')>-1); }

  function buildNode(dept) {
    var deptEmps=emps.filter(function(e){return e.departmentId===dept.id && e.status!=='terminated';});
    var managers=deptEmps.filter(isMgr);
    var staff=deptEmps.filter(function(e){return !isMgr(e) && !e.teamId;});
    var childDepts=depts.filter(function(d){return d.parentId===dept.id;}).sort(function(a,b){return (a.order||0)-(b.order||0);});
    var isInstall = dept.id==='dept_install';

    var html='<li>';
    // Dept box
    html+='<div class="org-box org-box-dept" style="border-top:3px solid '+(dept.color||'#1a3a5c')+'" onclick="hrShowDeptDetail(\''+dept.id+'\')">'
      +'<div style="font-size:16px">'+(dept.icon||'📁')+'</div>'
      +'<div style="font-size:10px;font-weight:700;color:'+(dept.color||'#1a3a5c')+'">'+dept.name+'</div>'
      +(deptEmps.length?'<div style="font-size:7px;color:var(--text2)">'+deptEmps.length+' '+t('موظف')+'</div>':'')
      +'</div>';

    // ── Build children list ──
    var allChildren = [];

    // 1. Managers first — each becomes a node
    managers.forEach(function(m) {
      var mNode = {type:'mgr', emp:m, children:[]};

      if(isInstall) {
        // مدير تركيبات → تحته الفرق (كل فرقة فيها مدير فرقة → عمال)
        teams.forEach(function(tm) {
          var allTE=emps.filter(function(e){return e.teamId===tm.id && e.status!=='terminated';});
          var tLeader=allTE.find(function(e){return e.role&&e.role.indexOf('مدير فرقة')>-1;});
          var tWorkers=allTE.filter(function(e){return !e.role||e.role.indexOf('مدير فرقة')===-1;});
          if(tLeader) {
            mNode.children.push({type:'mgr', emp:tLeader, children:tWorkers.map(function(w){return {type:'emp',emp:w};})});
          } else {
            // فرقة بدون مدير
            var tNode = {type:'team', team:tm, children:tWorkers.map(function(w){return {type:'emp',emp:w};})};
            mNode.children.push(tNode);
          }
        });
      } else {
        // مدير عادي → تحته الأقسام الفرعية ثم العمال
        childDepts.forEach(function(cd){ mNode.children.push({type:'dept', dept:cd}); });
        staff.forEach(function(w){ mNode.children.push({type:'emp', emp:w}); });
      }
      allChildren.push(mNode);
    });

    // 2. If no managers: child depts + staff as direct children
    if(!managers.length) {
      childDepts.forEach(function(cd){ allChildren.push({type:'dept', dept:cd}); });
      staff.forEach(function(w){ allChildren.push({type:'emp', emp:w}); });
    }

    // ── Render children ──
    if(allChildren.length) {
      html+='<ul>';
      allChildren.forEach(function(ch) {
        if(ch.type==='dept') {
          html+=buildNode(ch.dept);
        } else if(ch.type==='team') {
          html+='<li><div class="org-box org-box-team" style="border-top:2px dashed '+(ch.team.color||'#666')+'">'
            +'<div style="font-size:11px">🔨</div>'
            +'<div style="font-size:9px;font-weight:700;color:'+(ch.team.color||'#1a3a5c')+'">'+ch.team.name+'</div>'
            +'</div>';
          if(ch.children.length) {
            html+='<ul>';
            ch.children.forEach(function(w){ html+='<li>'+_empBox(w.emp, ch.team.color)+'</li>'; });
            html+='</ul>';
          }
          html+='</li>';
        } else if(ch.type==='mgr') {
          html+='<li>'+_empBox(ch.emp, dept.color);
          if(ch.children.length) {
            html+='<ul>';
            ch.children.forEach(function(sub) {
              if(sub.type==='dept') { html+=buildNode(sub.dept); }
              else if(sub.type==='team') {
                html+='<li><div class="org-box org-box-team" style="border-top:2px dashed '+(sub.team.color||'#666')+'">'
                  +'<div style="font-size:11px">🔨</div>'
                  +'<div style="font-size:9px;font-weight:700;color:'+(sub.team.color||'#1a3a5c')+'">'+sub.team.name+'</div>'
                  +'</div>';
                if(sub.children.length) { html+='<ul>'; sub.children.forEach(function(w){ html+='<li>'+_empBox(w.emp, sub.team.color)+'</li>'; }); html+='</ul>'; }
                html+='</li>';
              } else if(sub.type==='mgr') {
                html+='<li>'+_empBox(sub.emp, dept.color);
                if(sub.children.length) { html+='<ul>'; sub.children.forEach(function(w){ html+='<li>'+_empBox(w.emp, dept.color)+'</li>'; }); html+='</ul>'; }
                html+='</li>';
              } else {
                html+='<li>'+_empBox(sub.emp, dept.color)+'</li>';
              }
            });
            html+='</ul>';
          }
          html+='</li>';
        } else {
          html+='<li>'+_empBox(ch.emp, dept.color)+'</li>';
        }
      });
      html+='</ul>';
    }
    // If manager exists but no explicit children added (non-install with child depts)
    else if(managers.length && !isInstall && childDepts.length) {
      // already handled above
    }

    html+='</li>';
    return html;
  }

  // Root
  var root=depts.find(function(d){return !d.parentId;});
  if(!root) { el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text2)">'+t('لا يوجد هيكل تنظيمي')+'</div>'; return; }

  var rootEmps=emps.filter(function(e){return e.departmentId===root.id && e.status!=='terminated';});
  var childDepts=depts.filter(function(d){return d.parentId===root.id;}).sort(function(a,b){return (a.order||0)-(b.order||0);});

  var treeHtml='<li>'
    +'<div class="org-box org-box-root" style="border-top:4px solid '+(root.color||'#1a3a5c')+'" onclick="hrShowDeptDetail(\''+root.id+'\')">'
    +'<div style="font-size:26px">'+(root.icon||'🏭')+'</div>'
    +'<div style="font-size:13px;font-weight:800;color:'+(root.color||'#1a3a5c')+'">'+root.name+'</div>';
  rootEmps.forEach(function(e){
    treeHtml+='<div style="font-size:10px;margin-top:3px;font-weight:600">'+e.name+'</div>'
      +'<div style="font-size:8px;color:var(--text2)">'+e.role+'</div>';
  });
  treeHtml+='</div>';

  if(childDepts.length) {
    treeHtml+='<ul>';
    childDepts.forEach(function(cd){ treeHtml+=buildNode(cd); });
    treeHtml+='</ul>';
  }
  treeHtml+='</li>';

  el.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">'
    +'<div style="font-size:14px;color:var(--text2)">'+t('الهيكل التنظيمي للمصنع')+'</div>'
    +'<div style="display:flex;gap:6px">'
    +'<button class="btn btn-primary" onclick="hrAddEmployee()">➕ '+t('إضافة موظف')+'</button>'
    +'<button class="btn btn-secondary" onclick="hrPrintOrgChart()">🖨️ '+t('طباعة')+'</button>'
    +'<button class="btn btn-secondary" onclick="switchHrTab(\'list\')">📋 '+t('القائمة')+'</button>'
    +'</div></div>'
    +'<div class="org-tree-wrap"><div class="org-tree" id="orgTreeEl">'+treeHtml+'</div></div>';
}

// ── Department detail popup ──
function hrShowDeptDetail(deptId) {
  var depts=hrLoadDepts(), emps=hrLoadEmployees(), vehs=hrLoadVehicles();
  var dept=depts.find(function(d){return d.id===deptId;});
  if(!dept) return;
  var deptEmps=emps.filter(function(e){return e.departmentId===deptId && e.status!=='terminated';});

  var rows=deptEmps.map(function(e){
    var veh=e.vehicleId?vehs.find(function(v){return v.id===e.vehicleId;}):null;
    return '<tr>'
      +'<td style="font-weight:600">'+e.name+'</td>'
      +'<td>'+( e.role||'-')+'</td>'
      +'<td style="direction:ltr;text-align:center">'+(e.iqama||'-')+'</td>'
      +'<td>'+(e.phone||'-')+'</td>'
      +'<td>'+(veh?veh.plateNumber:'-')+'</td>'
      +'<td style="display:flex;gap:4px;justify-content:center">'
      +'<button class="btn btn-sm btn-secondary" onclick="hrEditEmployee(\''+e.id+'\');this.closest(\'.modal-bg\').remove()">✏️</button>'
      +'<button class="btn btn-sm btn-danger" onclick="hrDeleteEmployee(\''+e.id+'\');this.closest(\'.modal-bg\').remove()">🗑️</button>'
      +'</td></tr>';
  }).join('');

  var modal=document.createElement('div');
  modal.className='modal-bg';
  modal.innerHTML='<div class="modal" style="max-width:650px;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)">'
    +'<div style="background:linear-gradient(135deg,'+(dept.color||'#1a3a5c')+','+(dept.color||'#1a3a5c')+'cc);color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:16px;font-weight:700">'+(dept.icon||'')+' '+dept.name+' <span style="font-size:12px;opacity:.7">('+deptEmps.length+' '+t('موظف')+')</span></div>'
    +'<button style="background:rgba(255,255,255,.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer" onclick="this.closest(\'.modal-bg\').remove()">✕</button>'
    +'</div>'
    +'<div class="modal-body" style="padding:14px 18px;max-height:400px;overflow-y:auto">'
    +(deptEmps.length?'<table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:var(--surface2)"><th style="padding:8px;text-align:right">'+t('الاسم')+'</th><th style="padding:8px;text-align:right">'+t('المسمى')+'</th><th style="padding:8px;text-align:center">'+t('رقم الإقامة')+'</th><th style="padding:8px;text-align:right">'+t('الجوال')+'</th><th style="padding:8px;text-align:right">'+t('السيارة')+'</th><th style="padding:8px;text-align:center">'+t('إجراء')+'</th></tr></thead><tbody>'+rows+'</tbody></table>'
      :'<div style="text-align:center;padding:30px;color:var(--text2)">'+t('لا يوجد موظفين في هذا القسم')+'</div>')
    +'</div>'
    +'<div style="padding:10px 18px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:6px">'
    +'<button class="btn btn-primary" onclick="hrAddEmployee(\''+deptId+'\');this.closest(\'.modal-bg\').remove()">➕ '+t('إضافة موظف')+'</button>'
    +'<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إغلاق')+'</button>'
    +'</div></div>';
  document.body.appendChild(modal);
}

// ═══════════════════════════════════════════
// ══ قائمة الموظفين ═══════════════════════
// ═══════════════════════════════════════════
function renderEmployeeList() {
  var el=document.getElementById('employeeListContent'); if(!el) return;
  var emps=hrLoadEmployees(), depts=hrLoadDepts(), vehs=hrLoadVehicles();
  var active=emps.filter(function(e){return e.status!=='terminated';});

  var rows=active.map(function(e){
    var dept=depts.find(function(d){return d.id===e.departmentId;});
    var veh=e.vehicleId?vehs.find(function(v){return v.id===e.vehicleId;}):null;
    return '<tr>'
      +'<td style="font-weight:600">'+e.name+'</td>'
      +'<td><span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;background:'+(dept?dept.color+'22':'var(--surface2)')+';color:'+(dept?dept.color:'var(--text2)')+';font-size:11px;font-weight:600">'+(dept?dept.icon+' '+dept.name:'-')+'</span></td>'
      +'<td>'+(e.role||'-')+'</td>'
      +'<td style="direction:ltr;text-align:center;font-family:monospace">'+(e.iqama||'-')+'</td>'
      +'<td>'+(e.phone||'-')+'</td>'
      +'<td>'+(veh?veh.plateNumber:'-')+'</td>'
      +'<td style="display:flex;gap:4px">'
      +'<button class="btn btn-sm btn-secondary" onclick="hrEditEmployee(\''+e.id+'\')">✏️</button>'
      +'<button class="btn btn-sm btn-danger" onclick="hrDeleteEmployee(\''+e.id+'\')">🗑️</button>'
      +'</td></tr>';
  }).join('');

  el.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">'
    +'<div style="font-size:14px;color:var(--text2)">'+t('إجمالي الموظفين:')+' <strong>'+active.length+'</strong></div>'
    +'<div style="display:flex;gap:6px">'
    +'<button class="btn btn-primary" onclick="hrAddEmployee()">➕ '+t('إضافة موظف')+'</button>'
    +'<label class="btn btn-secondary" style="cursor:pointer;margin:0">📥 '+t('استيراد')+' <input type="file" accept=".json,.csv" style="display:none" onchange="hrImportEmployees(this)"></label>'
    +'<button class="btn btn-secondary" onclick="hrExportEmployees()">📤 '+t('تصدير')+'</button>'
    +'</div></div>'
    +(active.length?'<div class="card" style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:var(--surface2)"><th style="padding:8px;text-align:right">'+t('الاسم')+'</th><th style="padding:8px;text-align:right">'+t('القسم')+'</th><th style="padding:8px;text-align:right">'+t('المسمى')+'</th><th style="padding:8px;text-align:center">'+t('رقم الإقامة')+'</th><th style="padding:8px;text-align:right">'+t('الجوال')+'</th><th style="padding:8px;text-align:right">'+t('السيارة')+'</th><th style="padding:8px;text-align:center">'+t('إجراء')+'</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
      :'<div style="text-align:center;padding:60px 20px;color:var(--text2)"><div style="font-size:48px;margin-bottom:12px;opacity:.5">👥</div><div style="font-size:16px;font-weight:700;margin-bottom:6px">'+t('لا يوجد موظفين')+'</div></div>');
}

// ═══════════════════════════════════════════
// ══ إضافة / تعديل موظف ══════════════════
// ═══════════════════════════════════════════
function hrAddEmployee(deptId) { _hrEmployeeForm(null, deptId); }
function hrEditEmployee(id) { _hrEmployeeForm(id); }

function _hrEmployeeForm(editId, defaultDeptId) {
  var depts=hrLoadDepts(), emps=hrLoadEmployees(), vehs=hrLoadVehicles();
  var emp=editId?emps.find(function(e){return e.id===editId;}):null;

  var deptOpts=depts.map(function(d){
    return '<option value="'+d.id+'"'+(emp&&emp.departmentId===d.id?' selected':(defaultDeptId===d.id?' selected':''))+'>'+d.icon+' '+d.name+'</option>';
  }).join('');

  var vehOpts='<option value="">'+t('بدون سيارة')+'</option>'+vehs.map(function(v){
    return '<option value="'+v.id+'"'+(emp&&emp.vehicleId===v.id?' selected':'')+'>'+v.plateNumber+' — '+(v.brand||'')+' '+(v.model||'')+'</option>';
  }).join('');

  var roles=['مدير المصنع','مدير الإنتاج','مشرف صالة','مهندس','مشرف','مدير تركيبات','مدير فرقة','فني فريزة','فني مكبس','فني تجميع','منشار دبل هد','منشار عامودي','فني','عامل','مساعد','سائق','حارس','محاسب','إداري'];
  var roleOpts=roles.map(function(r){return '<option value="'+r+'"'+(emp&&emp.role===r?' selected':'')+'>'+r+'</option>';}).join('');

  // Team options (from installations team dist)
  var teams=[];
  try { teams=JSON.parse(localStorage.getItem('pm_team_dist')||'[]'); } catch(e){}
  var teamOpts='<option value="">'+t('بدون فرقة')+'</option>'+teams.map(function(tm){
    return '<option value="'+tm.id+'"'+(emp&&emp.teamId===tm.id?' selected':'')+'>'+tm.name+'</option>';
  }).join('');

  var modal=document.createElement('div');
  modal.className='modal-bg';
  modal.innerHTML='<div class="modal" style="max-width:480px;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)">'
    +'<div style="background:linear-gradient(135deg,#1a3a5c,#2563eb);color:#fff;padding:16px 20px">'
    +'<div style="font-size:15px;font-weight:700">'+(editId?'✏️ '+t('تعديل موظف'):'➕ '+t('إضافة موظف جديد'))+'</div></div>'
    +'<div class="modal-body" style="padding:16px 20px">'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('الاسم')+'</div><input id="hrF_name" value="'+(emp?emp.name:'')+'"></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('المسمى الوظيفي')+'</div><select id="hrF_role">'+roleOpts+'</select></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('القسم')+'</div><select id="hrF_dept">'+deptOpts+'</select></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('فرقة التركيب')+'</div><select id="hrF_team">'+teamOpts+'</select></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('رقم الإقامة')+'</div><input id="hrF_iqama" value="'+(emp?emp.iqama||'':'')+'" style="direction:ltr"></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('رقم الجوال')+'</div><input id="hrF_phone" value="'+(emp?emp.phone||'':'')+'" style="direction:ltr"></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('السيارة')+'</div><select id="hrF_veh">'+vehOpts+'</select></div>'
    +'</div></div>'
    +'<div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">'
    +'<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>'
    +'<button class="btn btn-primary" onclick="_hrSaveEmployee('+(editId?"'"+editId+"'":"null")+',this)">💾 '+t('حفظ')+'</button>'
    +'</div></div>';
  document.body.appendChild(modal);
}

function _hrSaveEmployee(editId, btn) {
  var name=document.getElementById('hrF_name').value.trim();
  if(!name) { notify(t('أدخل اسم الموظف'),'error'); return; }
  var emps=hrLoadEmployees();
  var obj={
    name:name,
    role:document.getElementById('hrF_role').value,
    departmentId:document.getElementById('hrF_dept').value,
    teamId:document.getElementById('hrF_team').value||null,
    iqama:document.getElementById('hrF_iqama').value.trim(),
    phone:document.getElementById('hrF_phone').value.trim(),
    vehicleId:document.getElementById('hrF_veh').value||null,
    status:'active'
  };
  if(editId) {
    var idx=emps.findIndex(function(e){return e.id===editId;});
    if(idx>-1) Object.assign(emps[idx], obj);
  } else {
    obj.id='emp_'+Date.now();
    obj.hireDate=new Date().toISOString().split('T')[0];
    emps.push(obj);
  }
  hrSaveEmployees(emps);
  btn.closest('.modal-bg').remove();
  renderOrgChart();
  renderEmployeeList();
  notify('✅ '+t('تم حفظ الموظف:')+' '+name);
}

function hrDeleteEmployee(id) {
  if(!confirm(t('حذف هذا الموظف؟'))) return;
  var emps=hrLoadEmployees();
  emps=emps.filter(function(e){return e.id!==id;});
  hrSaveEmployees(emps);
  renderOrgChart();
  renderEmployeeList();
  notify(t('تم حذف الموظف'));
}

// ═══════════════════════════════════════════
// ══ إدارة الأقسام ════════════════════════
// ═══════════════════════════════════════════
function renderDeptManager() {
  var el=document.getElementById('deptManageContent'); if(!el) return;
  var depts=hrLoadDepts(), emps=hrLoadEmployees();

  var html='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'
    +'<div style="font-size:14px;color:var(--text2)">'+t('إدارة الأقسام')+'</div>'
    +'<button class="btn btn-primary" onclick="hrAddDept()">➕ '+t('إضافة قسم')+'</button>'
    +'</div>';

  html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px">';
  depts.forEach(function(d){
    var count=emps.filter(function(e){return e.departmentId===d.id&&e.status!=='terminated';}).length;
    var parent=d.parentId?depts.find(function(p){return p.id===d.parentId;}):null;
    html+='<div class="card" style="margin:0;border-right:4px solid '+(d.color||'#1a3a5c')+';padding:12px">'
      +'<div style="display:flex;align-items:center;justify-content:space-between">'
      +'<div style="display:flex;align-items:center;gap:8px"><span style="font-size:20px">'+(d.icon||'📁')+'</span>'
      +'<div><div style="font-size:13px;font-weight:700;color:'+(d.color||'var(--text)')+'">'+d.name+'</div>'
      +'<div style="font-size:10px;color:var(--text2)">'+(parent?'↑ '+parent.name:'الجذر')+' | 👷 '+count+'</div></div></div>'
      +'<div style="display:flex;gap:4px">'
      +'<button class="btn btn-sm btn-secondary" onclick="hrEditDept(\''+d.id+'\')">✏️</button>'
      +'<button class="btn btn-sm btn-danger" onclick="hrDeleteDept(\''+d.id+'\')">🗑️</button>'
      +'</div></div></div>';
  });
  html+='</div>';
  el.innerHTML=html;
}

function hrAddDept() {
  var depts=hrLoadDepts();
  var name=prompt(t('اسم القسم الجديد:'));
  if(!name) return;
  var parentOpts=depts.map(function(d){return d.name;});
  var parentName=prompt(t('القسم الأب (اتركه فارغاً للجذر):')+'\n'+parentOpts.join(' | '));
  var parent=parentName?depts.find(function(d){return d.name===parentName;}):null;
  var icon=prompt(t('أيقونة (إيموجي):'),'📁');
  depts.push({id:'dept_'+Date.now(), name:name, parentId:parent?parent.id:null, icon:icon||'📁', color:'#1a3a5c', order:depts.length});
  hrSaveDepts(depts);
  renderDeptManager();
  renderOrgChart();
}

function hrEditDept(id) {
  var depts=hrLoadDepts();
  var d=depts.find(function(x){return x.id===id;});
  if(!d) return;
  var name=prompt(t('اسم القسم:'),d.name);
  if(!name) return;
  d.name=name;
  var icon=prompt(t('أيقونة:'),d.icon);
  d.icon=icon||d.icon;
  hrSaveDepts(depts);
  renderDeptManager();
  renderOrgChart();
}

function hrDeleteDept(id) {
  var depts=hrLoadDepts(), emps=hrLoadEmployees();
  var hasEmps=emps.some(function(e){return e.departmentId===id;});
  var hasChildren=depts.some(function(d){return d.parentId===id;});
  if(hasEmps||hasChildren) { notify(t('لا يمكن حذف قسم فيه موظفين أو أقسام فرعية'),'error'); return; }
  if(!confirm(t('حذف هذا القسم؟'))) return;
  depts=depts.filter(function(d){return d.id!==id;});
  hrSaveDepts(depts);
  renderDeptManager();
  renderOrgChart();
}

// ═══════════════════════════════════════════
// ══ إدارة المركبات (الإعدادات) ═══════════
// ═══════════════════════════════════════════
function renderVehiclesSettings() {
  var ct=document.getElementById('settings-vehicles'); if(!ct) return;
  var vehs=hrLoadVehicles(), emps=hrLoadEmployees();

  var rows=vehs.map(function(v){
    var driver=v.driverId?emps.find(function(e){return e.id===v.driverId;}):null;
    return '<tr>'
      +'<td style="font-weight:700;font-size:13px;direction:ltr">'+v.plateNumber+'</td>'
      +'<td>'+(v.type||'-')+'</td>'
      +'<td>'+(v.brand||'')+' '+(v.model||'')+'</td>'
      +'<td>'+(v.year||'-')+'</td>'
      +'<td style="font-weight:600">'+(driver?driver.name:'-')+'</td>'
      +'<td>'+(v.status==='maintenance'?'<span style="color:#d97706">🔧 صيانة</span>':v.status==='inactive'?'<span style="color:#dc2626">⛔ متوقفة</span>':'<span style="color:#16a34a">✅ فعالة</span>')+'</td>'
      +'<td style="display:flex;gap:4px">'
      +'<button class="btn btn-sm btn-secondary" onclick="hrEditVehicle(\''+v.id+'\')">✏️</button>'
      +'<button class="btn btn-sm btn-danger" onclick="hrDeleteVehicle(\''+v.id+'\')">🗑️</button>'
      +'</td></tr>';
  }).join('');

  ct.innerHTML='<div class="card"><div class="card-title">🚗 '+t('إدارة المركبات')+'</div>'
    +(vehs.length?'<table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:var(--surface2)"><th style="padding:8px;text-align:right">'+t('اللوحة')+'</th><th style="padding:8px;text-align:right">'+t('النوع')+'</th><th style="padding:8px;text-align:right">'+t('الماركة')+'</th><th style="padding:8px;text-align:right">'+t('السنة')+'</th><th style="padding:8px;text-align:right">'+t('السائق')+'</th><th style="padding:8px;text-align:right">'+t('الحالة')+'</th><th style="padding:8px;text-align:center">'+t('إجراء')+'</th></tr></thead><tbody>'+rows+'</tbody></table>'
      :'<div style="text-align:center;padding:30px;color:var(--text2)">'+t('لا توجد مركبات')+'</div>')
    +'<button class="btn btn-primary" style="margin-top:12px" onclick="hrAddVehicle()">➕ '+t('إضافة مركبة')+'</button></div>';
}

function hrAddVehicle() { _hrVehicleForm(null); }
function hrEditVehicle(id) { _hrVehicleForm(id); }

function _hrVehicleForm(editId) {
  var vehs=hrLoadVehicles(), emps=hrLoadEmployees();
  var v=editId?vehs.find(function(x){return x.id===editId;}):null;
  var driverOpts='<option value="">'+t('بدون سائق')+'</option>'+emps.filter(function(e){return e.status!=='terminated';}).map(function(e){
    return '<option value="'+e.id+'"'+(v&&v.driverId===e.id?' selected':'')+'>'+e.name+'</option>';
  }).join('');

  var modal=document.createElement('div');
  modal.className='modal-bg';
  modal.innerHTML='<div class="modal" style="max-width:420px;border-radius:16px;overflow:hidden">'
    +'<div style="background:linear-gradient(135deg,#1a3a5c,#0891b2);color:#fff;padding:14px 20px;font-size:15px;font-weight:700">'+(editId?'✏️ '+t('تعديل مركبة'):'➕ '+t('إضافة مركبة'))+'</div>'
    +'<div class="modal-body" style="padding:14px 18px">'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('رقم اللوحة')+'</div><input id="vehF_plate" value="'+(v?v.plateNumber:'')+'" style="direction:ltr"></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('النوع')+'</div><select id="vehF_type"><option'+(v&&v.type==='فان'?' selected':'')+'>فان</option><option'+(v&&v.type==='بيكب'?' selected':'')+'>بيكب</option><option'+(v&&v.type==='شاحنة'?' selected':'')+'>شاحنة</option><option'+(v&&v.type==='سيارة'?' selected':'')+'>سيارة</option></select></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('الماركة')+'</div><input id="vehF_brand" value="'+(v?v.brand||'':'')+'"></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('الموديل')+'</div><input id="vehF_model" value="'+(v?v.model||'':'')+'"></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('السنة')+'</div><input id="vehF_year" value="'+(v?v.year||'':'')+'" type="number"></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('السائق')+'</div><select id="vehF_driver">'+driverOpts+'</select></div>'
    +'</div></div>'
    +'<div style="padding:10px 18px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">'
    +'<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>'
    +'<button class="btn btn-primary" onclick="_hrSaveVehicle('+(editId?"'"+editId+"'":"null")+',this)">💾 '+t('حفظ')+'</button>'
    +'</div></div>';
  document.body.appendChild(modal);
}

function _hrSaveVehicle(editId, btn) {
  var plate=document.getElementById('vehF_plate').value.trim();
  if(!plate) { notify(t('أدخل رقم اللوحة'),'error'); return; }
  var vehs=hrLoadVehicles();
  var obj={plateNumber:plate, type:document.getElementById('vehF_type').value, brand:document.getElementById('vehF_brand').value.trim(), model:document.getElementById('vehF_model').value.trim(), year:document.getElementById('vehF_year').value.trim(), driverId:document.getElementById('vehF_driver').value||null, status:'active'};
  if(editId) { var idx=vehs.findIndex(function(v){return v.id===editId;}); if(idx>-1) Object.assign(vehs[idx],obj); }
  else { obj.id='veh_'+Date.now(); vehs.push(obj); }
  hrSaveVehicles(vehs);
  // Bidirectional: update employee's vehicleId
  if(obj.driverId) {
    var allEmps=hrLoadEmployees();
    var driverEmp=allEmps.find(function(e){return e.id===obj.driverId;});
    var savedVeh=vehs.find(function(v){return v.plateNumber===plate;});
    if(driverEmp && savedVeh) { driverEmp.vehicleId=savedVeh.id; hrSaveEmployees(allEmps); }
  }
  btn.closest('.modal-bg').remove();
  renderVehiclesSettings();
  notify('✅ '+t('تم حفظ المركبة:')+' '+plate);
}

function hrDeleteVehicle(id) {
  if(!confirm(t('حذف هذه المركبة؟'))) return;
  var vehs=hrLoadVehicles().filter(function(v){return v.id!==id;});
  hrSaveVehicles(vehs);
  renderVehiclesSettings();
  notify(t('تم حذف المركبة'));
}

// ═══════════════════════════════════════════
// ══ طباعة الهيكل التنظيمي ════════════════
// ═══════════════════════════════════════════
function hrPrintOrgChart() {
  var treeEl = document.getElementById('orgTreeEl');
  if(!treeEl) return;
  var w = window.open('','_blank','width=1200,height=800,scrollbars=yes');
  if(!w) { notify(t('⚠️ السماح بالنوافذ المنبثقة'),'error'); return; }
  w.document.write('<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">'
    + '<title>الهيكل التنظيمي</title>'
    + '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">'
    + '<style>'
    + '*{margin:0;padding:0;box-sizing:border-box}'
    + 'body{font-family:"Cairo",sans-serif;background:#fff;color:#1e293b;padding:8mm}'
    + '@media print{.nopr{display:none!important}@page{size:A3 landscape;margin:5mm}body{padding:0}}'
    + '.nopr{position:fixed;top:10px;left:10px;z-index:999;display:flex;gap:8px;background:linear-gradient(135deg,#1a3a5c,#2563eb);padding:8px 14px;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.3)}'
    + '.nopr button{padding:5px 14px;border:none;border-radius:5px;cursor:pointer;font-family:"Cairo",sans-serif;font-size:11px;font-weight:700}'
    // Org tree CSS — all LTR for correct lines, text RTL inside boxes
    + '.org-tree-wrap{overflow:visible}'
    + '.org-tree{direction:ltr!important}'
    + '.org-tree *{direction:ltr!important}'
    + '.org-box{direction:rtl!important}'
    + '.org-tree,.org-tree ul{list-style:none;margin:0;padding:0}'
    + '.org-tree ul{display:flex;justify-content:center;padding-top:20px;position:relative}'
    + '.org-tree ul::before{content:"";position:absolute;top:0;left:50%;border-left:2px solid #b0bec5;height:20px}'
    + '.org-tree li{display:flex;flex-direction:column;align-items:center;position:relative;padding:20px 5px 0}'
    + '.org-tree li::before{content:"";position:absolute;top:0;left:50%;width:0;height:20px;border-left:2px solid #b0bec5}'
    + '.org-tree li::after{content:"";position:absolute;top:0;left:0;width:100%;border-top:2px solid #b0bec5}'
    + '.org-tree li:first-child::after{left:50%;width:50%}'
    + '.org-tree li:last-child::after{left:0;width:50%}'
    + '.org-tree li:only-child::after{display:none}'
    + '.org-tree>li::before,.org-tree>li::after{display:none}'
    + '.org-tree>li{padding-top:0}'
    + '.org-box{background:#fff;border:1px solid #ddd;border-radius:10px;padding:8px 10px;min-width:80px;max-width:140px;text-align:center;font-size:9px;box-shadow:0 1px 4px rgba(0,0,0,.06)}'
    + '.org-box-root{min-width:130px;padding:10px 14px}'
    + '.org-box-dept{min-width:90px}'
    + '.org-box-emp{min-width:70px;max-width:110px;padding:4px 6px;border-radius:8px}'
    + '.org-box-team{min-width:80px;border-style:dashed}'
    + '</style></head><body>'
    + '<div class="nopr"><button style="background:#fff;color:#1a3a5c" onclick="window.print()">🖨️ طباعة</button><button style="background:rgba(255,255,255,.2);color:#fff" onclick="window.close()">✖ إغلاق</button></div>'
    + '<div style="text-align:center;margin-bottom:14px;border-bottom:3px solid #1a3a5c;padding-bottom:8px">'
    + '<div style="font-size:18px;font-weight:800;color:#1a3a5c">الهيكل التنظيمي — مصنع ألمنيوم ملهم</div>'
    + '<div style="font-size:11px;color:#888;margin-top:4px">'+new Date().toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'})+'</div>'
    + '</div>'
    + '<div class="org-tree-wrap"><div class="org-tree">' + treeEl.innerHTML + '</div></div>'
    + '</body></html>');
  w.document.close();
}

// ═══════════════════════════════════════════
// ══ استيراد / تصدير الموظفين ═════════════
// ═══════════════════════════════════════════
function hrExportEmployees() {
  var emps = hrLoadEmployees();
  var blob = new Blob([JSON.stringify(emps, null, 2)], {type:'application/json'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'employees_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  notify('✅ ' + t('تم تصدير') + ' ' + emps.length + ' ' + t('موظف'));
}

function hrImportEmployees(input) {
  var file = input.files[0]; if(!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var text = e.target.result;
      var imported = [];

      if(file.name.endsWith('.json')) {
        imported = JSON.parse(text);
        if(!Array.isArray(imported)) { notify(t('الملف غير صالح'),'error'); return; }
      } else if(file.name.endsWith('.csv')) {
        // CSV: name,role,department,iqama,phone
        var lines = text.split('\n').filter(function(l){return l.trim();});
        var header = lines[0].split(',').map(function(h){return h.trim().toLowerCase();});
        for(var i=1; i<lines.length; i++) {
          var cols = lines[i].split(',').map(function(c){return c.trim();});
          if(!cols[0]) continue;
          var emp = {id:'emp_'+Date.now()+'_'+i, status:'active', hireDate:new Date().toISOString().split('T')[0]};
          header.forEach(function(h, idx) {
            var val = cols[idx]||'';
            if(h==='name'||h==='الاسم') emp.name = val;
            else if(h==='role'||h==='المسمى') emp.role = val;
            else if(h==='department'||h==='القسم') emp.departmentId = val;
            else if(h==='iqama'||h==='الإقامة'||h==='رقم الإقامة') emp.iqama = val;
            else if(h==='phone'||h==='الهاتف'||h==='الجوال') emp.phone = val;
          });
          if(emp.name) imported.push(emp);
        }
      }

      if(!imported.length) { notify(t('لا يوجد بيانات للاستيراد'),'error'); return; }

      var existing = hrLoadEmployees();
      var added = 0;
      imported.forEach(function(imp) {
        // تجنب التكرار حسب الاسم + الإقامة
        var dup = existing.find(function(e){ return e.name===imp.name && e.iqama===imp.iqama; });
        if(!dup) {
          if(!imp.id) imp.id = 'emp_'+Date.now()+'_'+(Math.random()*1000|0);
          if(!imp.status) imp.status = 'active';
          existing.push(imp);
          added++;
        }
      });

      hrSaveEmployees(existing);
      renderEmployeeList();
      renderOrgChart();
      notify('✅ ' + t('تم استيراد') + ' ' + added + ' ' + t('موظف جديد') + ' (' + (imported.length-added) + ' ' + t('مكرر') + ')');
    } catch(err) {
      notify(t('خطأ بالاستيراد: ') + err.message, 'error');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

// ═══════════════════════════════════════════
// ══ الرواتب ═══════════════════════════════
// ═══════════════════════════════════════════
function _loadSalaryData() { try{return JSON.parse(localStorage.getItem('pm_salary')||'{}');}catch(e){return {};} }
function _saveSalaryData(d) { localStorage.setItem('pm_salary',JSON.stringify(d)); saveData('pm_salary',d); }

function renderSalaryPage() {
  var el=document.getElementById('salaryContent'); if(!el) return;
  var data=_loadSalaryData();
  var emps=hrLoadEmployees();
  var months=data.months||{};
  var now=new Date();
  var curMonth=data.currentMonth||(now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0'));

  // Get or create month data
  var active=emps.filter(function(e){return e.status!=='terminated';});
  if(!months[curMonth]) {
    months[curMonth]={rows:active.map(function(e){
      return {empId:e.id,name:e.name,iqama:e.iqama||'',job:e.role||'',sponsor:'',days:30,basic:0,housing:0,other:0,deductions:0,debts:0,adjustments:0,notes:''};
    })};
    data.months=months;
    data.currentMonth=curMonth;
    _saveSalaryData(data);
  } else {
    // مزامنة — حذف موظفين محذوفين + إضافة جدد
    var sRows=months[curMonth].rows;
    var activeIds=new Set(active.map(function(e){return e.id;}));
    var activeNames=new Set(active.map(function(e){return e.name;}));
    var changed=false;
    // حذف المحذوفين
    var filtered=sRows.filter(function(r){ return activeIds.has(r.empId) || activeNames.has(r.name); });
    if(filtered.length!==sRows.length) changed=true;
    // إضافة الجدد
    var existIds=new Set(filtered.map(function(r){return r.empId;}));
    var existNames=new Set(filtered.map(function(r){return r.name;}));
    active.forEach(function(e){
      if(!existIds.has(e.id) && !existNames.has(e.name)) {
        filtered.push({empId:e.id,name:e.name,iqama:e.iqama||'',job:e.role||'',sponsor:'',days:30,basic:0,housing:0,other:0,deductions:0,debts:0,adjustments:0,notes:''});
        changed=true;
      }
    });
    if(changed) { months[curMonth].rows=filtered; data.months=months; _saveSalaryData(data); }
  }

  var mData=months[curMonth];
  var monthNames=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  var mParts=curMonth.split('-');
  var monthLabel=monthNames[parseInt(mParts[1])-1]+' '+mParts[0];

  // Build table
  var rows='';
  var totals={basic:0,housing:0,other:0,gross:0,net:0,due:0};
  mData.rows.forEach(function(r,i){
    var gross=((r.basic||0)+(r.housing||0)+(r.other||0))/30*(r.days||30);
    var net=gross-(r.debts||0);
    var due=net-(r.adjustments||0);
    totals.basic+=(r.basic||0);totals.housing+=(r.housing||0);totals.other+=(r.other||0);totals.gross+=gross;totals.net+=net;totals.due+=due;
    var N=function(v){return Math.round(v).toLocaleString('en-US');};
    rows+='<tr>'
      +'<td style="text-align:center;font-size:10px">'+(i+1)+'</td>'
      +'<td style="font-size:10px;font-weight:600;white-space:nowrap">'+r.name+'</td>'
      +'<td style="font-size:10px">'+r.sponsor+'</td>'
      +'<td style="font-size:10px;direction:ltr;text-align:center;font-family:monospace">'+r.iqama+'</td>'
      +'<td style="font-size:10px">'+r.job+'</td>'
      +'<td style="text-align:center"><input type="number" value="'+(r.days||30)+'" style="width:40px;text-align:center;border:1px solid var(--border);border-radius:4px;font-size:10px" onchange="_salaryUpdate(\''+curMonth+'\','+i+',\'days\',this.value)"></td>'
      +'<td style="text-align:center"><input type="number" value="'+(r.basic||0)+'" style="width:60px;text-align:center;border:1px solid var(--border);border-radius:4px;font-size:10px" onchange="_salaryUpdate(\''+curMonth+'\','+i+',\'basic\',this.value)"></td>'
      +'<td style="text-align:center"><input type="number" value="'+(r.housing||0)+'" style="width:55px;text-align:center;border:1px solid var(--border);border-radius:4px;font-size:10px" onchange="_salaryUpdate(\''+curMonth+'\','+i+',\'housing\',this.value)"></td>'
      +'<td style="text-align:center"><input type="number" value="'+(r.other||0)+'" style="width:55px;text-align:center;border:1px solid var(--border);border-radius:4px;font-size:10px" onchange="_salaryUpdate(\''+curMonth+'\','+i+',\'other\',this.value)"></td>'
      +'<td style="text-align:center;font-weight:700;color:#1a3a5c">'+N(gross)+'</td>'
      +'<td style="text-align:center"><input type="number" value="'+(r.debts||0)+'" style="width:55px;text-align:center;border:1px solid var(--border);border-radius:4px;font-size:10px" onchange="_salaryUpdate(\''+curMonth+'\','+i+',\'debts\',this.value)"></td>'
      +'<td style="text-align:center;font-weight:700">'+N(net)+'</td>'
      +'<td style="text-align:center"><input type="number" value="'+(r.adjustments||0)+'" style="width:55px;text-align:center;border:1px solid var(--border);border-radius:4px;font-size:10px" onchange="_salaryUpdate(\''+curMonth+'\','+i+',\'adjustments\',this.value)"></td>'
      +'<td style="text-align:center;font-weight:800;color:#16a34a;font-size:12px">'+N(due)+'</td>'
      +'<td><input type="text" value="'+(r.notes||'').replace(/"/g,'&quot;')+'" style="width:100%;border:1px solid var(--border);border-radius:4px;font-size:10px;padding:2px 4px" onchange="_salaryUpdate(\''+curMonth+'\','+i+',\'notes\',this.value)"></td>'
      +'</tr>';
  });

  var N2=function(v){return Math.round(v).toLocaleString('en-US');};
  var totalRow='<tr style="background:var(--surface2);font-weight:700"><td colspan="6" style="text-align:center">الإجمالي</td>'
    +'<td style="text-align:center">'+N2(totals.basic)+'</td>'
    +'<td style="text-align:center">'+N2(totals.housing)+'</td>'
    +'<td style="text-align:center">'+N2(totals.other)+'</td>'
    +'<td style="text-align:center;color:#1a3a5c">'+N2(totals.gross)+'</td>'
    +'<td></td><td style="text-align:center">'+N2(totals.net)+'</td>'
    +'<td></td><td style="text-align:center;color:#16a34a;font-size:13px">'+N2(totals.due)+'</td><td></td></tr>';

  // Month selector
  var allMonths=Object.keys(months).sort().reverse();
  var monthOpts=allMonths.map(function(m){return '<option value="'+m+'"'+(m===curMonth?' selected':'')+'>'+m+'</option>';}).join('');

  el.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">'
    +'<div style="display:flex;align-items:center;gap:10px">'
    +'<div style="font-size:16px;font-weight:700;color:var(--accent)">💰 رواتب '+monthLabel+'</div>'
    +'<select onchange="_salaryChangeMonth(this.value)" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);font-family:Cairo,sans-serif">'+monthOpts+'</select>'
    +'<button class="btn btn-sm btn-secondary" onclick="_salaryAddMonth()">➕ شهر جديد</button>'
    +'</div>'
    +'<div style="display:flex;gap:6px">'
    +'<button class="btn btn-sm btn-primary" onclick="_salaryPrint(\''+curMonth+'\')">🖨️ طباعة</button>'
    +'<label class="btn btn-sm btn-secondary" style="cursor:pointer;margin:0">📥 استيراد <input type="file" accept=".json" style="display:none" onchange="_salaryImport(this)"></label>'
    +'<button class="btn btn-sm btn-secondary" onclick="_salaryExport(\''+curMonth+'\')">📤 تصدير</button>'
    +'</div></div>'
    +'<div class="card" style="overflow-x:auto;padding:8px"><table style="width:100%;border-collapse:collapse;font-size:11px">'
    +'<thead><tr style="background:var(--surface2)"><th style="padding:6px;text-align:center;min-width:30px">م</th><th style="padding:6px;text-align:right;min-width:120px">الاسم</th><th style="padding:6px;text-align:right;min-width:60px">الكفالة</th><th style="padding:6px;text-align:center;min-width:90px">الإقامة</th><th style="padding:6px;text-align:right;min-width:80px">المهنة</th><th style="padding:6px;text-align:center;min-width:45px">الأيام</th><th style="padding:6px;text-align:center;min-width:65px">الراتب</th><th style="padding:6px;text-align:center;min-width:60px">السكن</th><th style="padding:6px;text-align:center;min-width:60px">بدلات</th><th style="padding:6px;text-align:center;min-width:65px">الإجمالي</th><th style="padding:6px;text-align:center;min-width:55px">ذمم</th><th style="padding:6px;text-align:center;min-width:65px">الصافي</th><th style="padding:6px;text-align:center;min-width:55px">تسويات</th><th style="padding:6px;text-align:center;min-width:70px">المستحق</th><th style="padding:6px;text-align:right;min-width:100px">ملاحظات</th></tr></thead>'
    +'<tbody>'+rows+totalRow+'</tbody></table></div>';
}

function _salaryUpdate(month,idx,field,val) {
  var data=_loadSalaryData();
  if(!data.months||!data.months[month]) return;
  var r=data.months[month].rows[idx];
  if(!r) return;
  if(field==='notes') r[field]=val;
  else r[field]=parseFloat(val)||0;
  _saveSalaryData(data);
  renderSalaryPage();
}

function _salaryChangeMonth(m) {
  var data=_loadSalaryData();
  data.currentMonth=m;
  _saveSalaryData(data);
  renderSalaryPage();
}

function _salaryAddMonth() {
  var m=prompt(t('أدخل الشهر (مثال: 2026-04):'));
  if(!m||!/^\d{4}-\d{2}$/.test(m)) return;
  var data=_loadSalaryData();
  if(!data.months) data.months={};
  if(data.months[m]) { data.currentMonth=m; _saveSalaryData(data); renderSalaryPage(); return; }
  // Copy from last month or from employees
  var emps=hrLoadEmployees();
  var lastMonth=Object.keys(data.months).sort().pop();
  var rows=lastMonth?data.months[lastMonth].rows.map(function(r){return Object.assign({},r,{days:30,debts:0,adjustments:0,notes:''});}):
    emps.filter(function(e){return e.status!=='terminated';}).map(function(e){return {empId:e.id,name:e.name,iqama:e.iqama||'',job:e.role||'',sponsor:'',days:30,basic:0,housing:0,other:0,debts:0,adjustments:0,notes:''};});
  data.months[m]={rows:rows};
  data.currentMonth=m;
  _saveSalaryData(data);
  renderSalaryPage();
  notify('✅ تم إنشاء شهر '+m);
}

function _salaryExport(month) {
  var data=_loadSalaryData();
  var mData=data.months[month]; if(!mData) return;
  var monthNames=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  var mParts=month.split('-');
  var monthLabel=monthNames[parseInt(mParts[1])-1]+' '+mParts[0];

  // Build CSV with BOM for Arabic support in Excel
  var BOM = '\uFEFF';
  var headers='م,الاسم,الكفالة,رقم الإقامة,المهنة,الأيام,راتب أساسي,بدل سكن,بدلات أخرى,الإجمالي,ذمم,الصافي,تسويات,المستحق صرفه,ملاحظات';
  var rows=mData.rows.map(function(r,i){
    var gross=((r.basic||0)+(r.housing||0)+(r.other||0))/30*(r.days||30);
    var net=gross-(r.debts||0);
    var due=net-(r.adjustments||0);
    return [i+1,r.name,r.sponsor,r.iqama,r.job,r.days||30,r.basic||0,r.housing||0,r.other||0,Math.round(gross),r.debts||0,Math.round(net),r.adjustments||0,Math.round(due),r.notes||''].join(',');
  });

  // Totals row
  var totals={basic:0,housing:0,other:0,gross:0,net:0,due:0};
  mData.rows.forEach(function(r){
    var g=((r.basic||0)+(r.housing||0)+(r.other||0))/30*(r.days||30);
    totals.basic+=(r.basic||0);totals.housing+=(r.housing||0);totals.other+=(r.other||0);
    totals.gross+=g;totals.net+=g-(r.debts||0);totals.due+=g-(r.debts||0)-(r.adjustments||0);
  });
  rows.push(',الإجمالي,,,,,' +Math.round(totals.basic)+','+Math.round(totals.housing)+','+Math.round(totals.other)+','+Math.round(totals.gross)+',,'+Math.round(totals.net)+',,'+Math.round(totals.due)+',');

  var csv=BOM+headers+'\n'+rows.join('\n');
  var blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='رواتب_'+monthLabel.replace(' ','_')+'.csv';
  a.click();
  notify('✅ تم تصدير رواتب '+monthLabel+' كملف Excel');
}

function _salaryImport(input) {
  var file=input.files[0]; if(!file) return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var imported=JSON.parse(e.target.result);
      var data=_loadSalaryData();if(!data.months)data.months={};
      var month=prompt(t('لأي شهر (مثال: 2026-02):'));
      if(!month) return;
      data.months[month]=imported;data.currentMonth=month;
      _saveSalaryData(data);renderSalaryPage();
      notify('✅ تم استيراد رواتب '+month);
    }catch(err){notify(t('خطأ: ')+err.message,'error');}
  };
  reader.readAsText(file);input.value='';
}

function _salaryPrint(month) {
  var data=_loadSalaryData();
  var mData=data.months[month]; if(!mData) return;
  var sigImg=(typeof getSignatureHTML==='function')?getSignatureHTML():'';
  var monthNames=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  var mParts=month.split('-');
  var monthLabel=monthNames[parseInt(mParts[1])-1]+' '+mParts[0];
  var N=function(v){return Math.round(v).toLocaleString('en-US');};

  var rows='',totals={basic:0,housing:0,other:0,gross:0,net:0,due:0};
  mData.rows.forEach(function(r,i){
    var gross=((r.basic||0)+(r.housing||0)+(r.other||0))/30*(r.days||30);
    var net=gross-(r.debts||0);var due=net-(r.adjustments||0);
    totals.basic+=(r.basic||0);totals.housing+=(r.housing||0);totals.other+=(r.other||0);totals.gross+=gross;totals.net+=net;totals.due+=due;
    rows+='<tr><td style="text-align:center;padding:3px;border:1px solid #ccc;font-size:9px">'+(i+1)+'</td>'
      +'<td style="padding:3px 6px;border:1px solid #ccc;font-size:9px;font-weight:600;white-space:nowrap">'+r.name+'</td>'
      +'<td style="padding:3px;border:1px solid #ccc;font-size:9px">'+r.sponsor+'</td>'
      +'<td style="padding:3px;border:1px solid #ccc;font-size:9px;direction:ltr;text-align:center">'+r.iqama+'</td>'
      +'<td style="padding:3px;border:1px solid #ccc;font-size:9px">'+r.job+'</td>'
      +'<td style="padding:3px;border:1px solid #ccc;font-size:9px;text-align:center">'+(r.days||30)+'</td>'
      +'<td style="padding:3px;border:1px solid #ccc;font-size:9px;text-align:center">'+N(r.basic)+'</td>'
      +'<td style="padding:3px;border:1px solid #ccc;font-size:9px;text-align:center">'+N(r.housing)+'</td>'
      +'<td style="padding:3px;border:1px solid #ccc;font-size:9px;text-align:center">'+N(r.other)+'</td>'
      +'<td style="padding:3px;border:1px solid #ccc;font-size:9px;text-align:center;font-weight:700">'+N(gross)+'</td>'
      +'<td style="padding:3px;border:1px solid #ccc;font-size:9px;text-align:center">'+N(r.debts||0)+'</td>'
      +'<td style="padding:3px;border:1px solid #ccc;font-size:9px;text-align:center;font-weight:700">'+N(net)+'</td>'
      +'<td style="padding:3px;border:1px solid #ccc;font-size:9px;text-align:center">'+N(r.adjustments||0)+'</td>'
      +'<td style="padding:3px;border:1px solid #ccc;font-size:10px;text-align:center;font-weight:800;color:#16a34a">'+N(due)+'</td>'
      +'<td style="padding:3px;border:1px solid #ccc;font-size:8px">'+(r.notes||'')+'</td></tr>';
  });
  rows+='<tr style="background:#e8f0fe;font-weight:700"><td colspan="6" style="padding:4px;border:1px solid #ccc;text-align:center;font-size:10px">الإجمالي</td>'
    +'<td style="padding:4px;border:1px solid #ccc;text-align:center;font-size:10px">'+N(totals.basic)+'</td>'
    +'<td style="padding:4px;border:1px solid #ccc;text-align:center;font-size:10px">'+N(totals.housing)+'</td>'
    +'<td style="padding:4px;border:1px solid #ccc;text-align:center;font-size:10px">'+N(totals.other)+'</td>'
    +'<td style="padding:4px;border:1px solid #ccc;text-align:center;font-size:10px;color:#1a3a5c">'+N(totals.gross)+'</td>'
    +'<td style="border:1px solid #ccc"></td>'
    +'<td style="padding:4px;border:1px solid #ccc;text-align:center;font-size:10px">'+N(totals.net)+'</td>'
    +'<td style="border:1px solid #ccc"></td>'
    +'<td style="padding:4px;border:1px solid #ccc;text-align:center;font-size:12px;color:#16a34a">'+N(totals.due)+'</td><td style="border:1px solid #ccc"></td></tr>';

  var w=window.open('','_blank','width=1200,height=800');if(!w) return;
  w.document.write('<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>رواتب '+monthLabel+'</title>'
    +'<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">'
    +'<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Cairo,sans-serif;direction:rtl;background:#fff;padding:8mm;font-size:11px}'
    +'@media print{.nopr{display:none!important}@page{size:A3 landscape;margin:5mm}body{padding:0}}'
    +'table{width:100%;border-collapse:collapse}'
    +'.nopr{position:fixed;top:10px;left:10px;z-index:999;display:flex;gap:8px;background:linear-gradient(135deg,#1a3a5c,#2563eb);padding:8px 14px;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.3)}'
    +'.nopr button{padding:5px 14px;border:none;border-radius:5px;cursor:pointer;font-family:Cairo,sans-serif;font-size:11px;font-weight:700}'
    +'</style></head><body>'
    +'<div class="nopr"><button style="background:#fff;color:#1a3a5c" onclick="window.print()">🖨️</button><button style="background:rgba(255,255,255,.2);color:#fff" onclick="window.close()">✖</button></div>'
    +'<div style="text-align:center;border-bottom:3px solid #1a3a5c;padding-bottom:8px;margin-bottom:10px">'
    +'<div style="font-size:16px;font-weight:800;color:#1a3a5c">رواتب مصنع ألمنيوم ملهم</div>'
    +'<div style="font-size:13px;color:#555">'+monthLabel+'</div></div>'
    +'<table><thead><tr style="background:#1a3a5c;color:#fff"><th style="padding:4px;border:1px solid #999;font-size:8px">م</th><th style="padding:4px;border:1px solid #999;font-size:8px;text-align:right">الاسم</th><th style="padding:4px;border:1px solid #999;font-size:8px">الكفالة</th><th style="padding:4px;border:1px solid #999;font-size:8px">الإقامة</th><th style="padding:4px;border:1px solid #999;font-size:8px">المهنة</th><th style="padding:4px;border:1px solid #999;font-size:8px">الأيام</th><th style="padding:4px;border:1px solid #999;font-size:8px">الراتب</th><th style="padding:4px;border:1px solid #999;font-size:8px">السكن</th><th style="padding:4px;border:1px solid #999;font-size:8px">بدلات</th><th style="padding:4px;border:1px solid #999;font-size:8px">الإجمالي</th><th style="padding:4px;border:1px solid #999;font-size:8px">ذمم</th><th style="padding:4px;border:1px solid #999;font-size:8px">الصافي</th><th style="padding:4px;border:1px solid #999;font-size:8px">تسويات</th><th style="padding:4px;border:1px solid #999;font-size:8px">المستحق</th><th style="padding:4px;border:1px solid #999;font-size:8px">ملاحظات</th></tr></thead><tbody>'+rows+'</tbody></table>'
    +'<div style="margin-top:20px;display:flex;justify-content:space-between;font-size:10px;text-align:center">'
    +'<div style="min-width:120px"><div style="font-weight:700">مدير المكتب الفني</div>'+(sigImg?'<div style="margin:4px 0">'+sigImg+'</div>':'<br><br>')+'<div style="border-top:1px solid #333;padding-top:2px">الاسم / التوقيع</div></div>'
    +'<div style="min-width:120px"><div style="font-weight:700">المحاسب</div><br><br><div style="border-top:1px solid #333;padding-top:2px">الاسم / التوقيع</div></div>'
    +'<div style="min-width:120px"><div style="font-weight:700">المدير المالي</div><br><br><div style="border-top:1px solid #333;padding-top:2px">الاسم / التوقيع</div></div>'
    +'<div style="min-width:120px"><div style="font-weight:700">المدير العام</div><br><br><div style="border-top:1px solid #333;padding-top:2px">الاسم / التوقيع</div></div>'
    +'</div></body></html>');
  w.document.close();
}

// ═══════════════════════════════════════════
// ══ الحضور والانصراف ═════════════════════
// ═══════════════════════════════════════════
function _loadAttendData() { try{return JSON.parse(localStorage.getItem('pm_attendance')||'{}');}catch(e){return {};} }
function _saveAttendData(d) { localStorage.setItem('pm_attendance',JSON.stringify(d)); saveData('pm_attendance',d); }

function renderAttendancePage() {
  var el=document.getElementById('attendContent'); if(!el) return;
  var data=_loadAttendData();
  var emps=hrLoadEmployees();
  var now=new Date();
  var curMonth=data.currentMonth||(now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0'));

  if(!data.months) data.months={};
  var active=emps.filter(function(e){return e.status!=='terminated';});
  if(!data.months[curMonth]) {
    data.months[curMonth]={rows:active.map(function(e){return {empId:e.id,name:e.name,nameEn:e.nameEn||'',iqama:e.iqama||'',days:{}};})};
    data.currentMonth=curMonth;
    _saveAttendData(data);
  } else {
    // تحديث — أضف موظفين جدد + شيل مكررات
    var mRows=data.months[curMonth].rows;
    var existingIds=new Set();
    var existingNames=new Set();
    // شيل المكررات أولاً
    var cleanRows=[];
    mRows.forEach(function(r){
      var key=r.empId||r.name;
      if(!existingIds.has(key) && !existingNames.has(r.name)) {
        existingIds.add(key);
        existingNames.add(r.name);
        cleanRows.push(r);
      }
    });
    // شيل الموظفين المحذوفين من القائمة الرئيسية
    var activeIds=new Set(active.map(function(e){return e.id;}));
    var activeNames=new Set(active.map(function(e){return e.name;}));
    cleanRows=cleanRows.filter(function(r){
      return activeIds.has(r.empId) || activeNames.has(r.name);
    });
    // أضف موظفين جدد ما موجودين
    existingIds=new Set(cleanRows.map(function(r){return r.empId;}));
    existingNames=new Set(cleanRows.map(function(r){return r.name;}));
    active.forEach(function(e){
      if(!existingIds.has(e.id) && !existingNames.has(e.name)) {
        cleanRows.push({empId:e.id,name:e.name,nameEn:e.nameEn||'',iqama:e.iqama||'',days:{}});
      }
    });
    if(cleanRows.length!==mRows.length || JSON.stringify(cleanRows.map(function(r){return r.empId;}))!==JSON.stringify(mRows.map(function(r){return r.empId;}))) {
      data.months[curMonth].rows=cleanRows;
      _saveAttendData(data);
    }
  }

  var mData=data.months[curMonth];
  var mParts=curMonth.split('-');
  var year=parseInt(mParts[0]),month=parseInt(mParts[1]);
  var daysInMonth=new Date(year,month,0).getDate();
  var dayNames=['أحد','اثن','ثلا','أرب','خمي','جمع','سبت'];
  var monthNames=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  var monthLabel=monthNames[month-1]+' '+year;

  // Day headers
  var dayHeaders='';
  for(var d=1;d<=daysInMonth;d++){
    var dt=new Date(year,month-1,d);
    var dn=dayNames[dt.getDay()];
    var isFri=dt.getDay()===5;
    dayHeaders+='<th style="padding:2px;border:1px solid #ccc;font-size:7px;min-width:22px;text-align:center;writing-mode:vertical-lr;'+(isFri?'background:#fee2e2;color:#dc2626':'')+'">'+d+'<br>'+dn+'</th>';
  }

  // Employee rows
  var rows='';
  mData.rows.forEach(function(r,i){
    var total=0;
    var cells='';
    for(var d=1;d<=daysInMonth;d++){
      var dt=new Date(year,month-1,d);
      var isFri=dt.getDay()===5;
      var val=r.days[d]||'';
      var present=val==='1';
      var late=val==='L';
      var absent=val==='X';
      if(present||late) total++;
      if(late) total-=0.5; // تأخر = نص يوم
      var bg=isFri?'#fee2e2':present?'#f0fdf4':late?'#fef9c3':absent?'#fee2e2':'';
      var sym=present?'✓':late?'⏰':absent?'✗':'';
      var clr=present?'#16a34a':late?'#d97706':absent?'#dc2626':'';
      cells+='<td style="padding:0;border:1px solid #ccc;text-align:center;background:'+bg+';cursor:pointer;font-size:10px;color:'+clr+'" onclick="_attendToggle(\''+curMonth+'\','+i+','+d+')">'+sym+'</td>';
    }
    rows+='<tr><td style="padding:3px;border:1px solid #ccc;text-align:center;font-size:9px">'+(i+1)+'</td>'
      +'<td style="padding:3px 6px;border:1px solid #ccc;font-size:9px;font-weight:600;white-space:nowrap">'+r.name+'</td>'
      +'<td style="padding:3px;border:1px solid #ccc;font-size:8px;direction:ltr;text-align:center;font-family:monospace">'+r.iqama+'</td>'
      +cells
      +'<td style="padding:3px;border:1px solid #ccc;text-align:center;font-weight:700;font-size:11px;color:#1a3a5c">'+total+'</td></tr>';
  });

  // Month selector
  var allMonths=Object.keys(data.months||{}).sort().reverse();
  var monthOpts=allMonths.map(function(m){return '<option value="'+m+'"'+(m===curMonth?' selected':'')+'>'+m+'</option>';}).join('');

  el.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">'
    +'<div style="display:flex;align-items:center;gap:10px">'
    +'<div style="font-size:16px;font-weight:700;color:var(--accent)">📅 حضور وانصراف '+monthLabel+'</div>'
    +'<select onchange="_attendChangeMonth(this.value)" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);font-family:Cairo,sans-serif">'+monthOpts+'</select>'
    +'<button class="btn btn-sm btn-secondary" onclick="_attendAddMonth()">➕ شهر</button>'
    +'</div>'
    +'<div style="display:flex;gap:6px">'
    +'<button class="btn btn-sm btn-success" onclick="_attendMarkAll(\''+curMonth+'\')">✅ تحضير الكل لليوم</button>'
    +'<button class="btn btn-sm btn-primary" onclick="_attendPrint(\''+curMonth+'\')">🖨️ طباعة</button>'
    +'</div></div>'
    +'<div style="font-size:10px;color:var(--text2);margin-bottom:8px;display:flex;gap:14px;align-items:center">اضغط على الخلية للتبديل: '
    +'<span style="color:#16a34a;font-weight:700">✓ حاضر</span>'
    +'<span style="color:#d97706;font-weight:700">⏰ تأخر (نص يوم)</span>'
    +'<span style="color:#dc2626;font-weight:700">✗ غياب</span>'
    +'<span style="color:#888">فاضي = لم يُسجل</span>'
    +'</div>'
    +'<div class="card" style="overflow-x:auto;padding:4px"><table style="border-collapse:collapse">'
    +'<thead><tr style="background:var(--surface2)"><th style="padding:3px;border:1px solid #ccc;font-size:8px;min-width:25px">م</th><th style="padding:3px;border:1px solid #ccc;font-size:8px;min-width:100px;text-align:right">الاسم</th><th style="padding:3px;border:1px solid #ccc;font-size:8px;min-width:75px">الإقامة</th>'+dayHeaders+'<th style="padding:3px;border:1px solid #ccc;font-size:8px;min-width:35px">المجموع</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div>';
}

function _attendToggle(month,empIdx,day) {
  var data=_loadAttendData();
  var r=data.months[month].rows[empIdx];
  // Cycle: empty → 1(حاضر) → L(تأخر) → X(غياب) → empty
  var cur=r.days[day]||'';
  if(cur==='') r.days[day]='1';
  else if(cur==='1') r.days[day]='L';
  else if(cur==='L') r.days[day]='X';
  else r.days[day]='';
  _saveAttendData(data);
  renderAttendancePage();
}

function _attendMarkAll(month) {
  var data=_loadAttendData();
  var day=new Date().getDate();
  data.months[month].rows.forEach(function(r){ r.days[day]='1'; });
  _saveAttendData(data);
  renderAttendancePage();
  notify('✅ تم تحضير الكل ليوم '+day);
}

function _attendChangeMonth(m) {
  var data=_loadAttendData();data.currentMonth=m;_saveAttendData(data);renderAttendancePage();
}

function _attendAddMonth() {
  var m=prompt(t('الشهر (مثال: 2026-04):'));
  if(!m||!/^\d{4}-\d{2}$/.test(m)) return;
  var data=_loadAttendData();if(!data.months)data.months={};
  if(!data.months[m]){
    var emps=hrLoadEmployees();
    data.months[m]={rows:emps.filter(function(e){return e.status!=='terminated';}).map(function(e){return {empId:e.id,name:e.name,iqama:e.iqama||'',days:{}};})};
  }
  data.currentMonth=m;_saveAttendData(data);renderAttendancePage();
}

function _attendPrint(month) {
  var data=_loadAttendData();var mData=data.months[month];if(!mData)return;
  var mParts=month.split('-');var year=parseInt(mParts[0]),mo=parseInt(mParts[1]);
  var daysInMonth=new Date(year,mo,0).getDate();
  var dayNames=['SUN','MON','TUE','WED','THU','FRI','SAT'];
  var monthNames=['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  var sigImg=(typeof getSignatureHTML==='function')?getSignatureHTML():'';

  var dayHeaders='';
  for(var d=1;d<=daysInMonth;d++){
    var dt=new Date(year,mo-1,d);var isFri=dt.getDay()===5;
    dayHeaders+='<th style="padding:2px;border:1px solid #999;font-size:6px;text-align:center;min-width:18px;'+(isFri?'background:#fee2e2':'')+'">'+dayNames[dt.getDay()]+'<br>'+d+'</th>';
  }

  var rows='';
  mData.rows.forEach(function(r,i){
    var total=0,cells='';
    for(var d=1;d<=daysInMonth;d++){
      var dt=new Date(year,mo-1,d);var isFri=dt.getDay()===5;
      var val2=r.days[d]||'';var present2=val2==='1';var late2=val2==='L';var absent2=val2==='X';
      if(present2||late2)total++;if(late2)total-=0.5;
      var bg2=isFri?'background:#fee2e2':present2?'background:#f0fdf4':late2?'background:#fef9c3':absent2?'background:#fee2e2':'';
      var sym2=present2?'✓':late2?'⏰':absent2?'✗':'';
      var clr2=present2?'color:#16a34a':late2?'color:#d97706':absent2?'color:#dc2626':'';
      cells+='<td style="padding:1px;border:1px solid #ccc;text-align:center;font-size:9px;'+bg2+';'+clr2+'">'+sym2+'</td>';
    }
    rows+='<tr><td style="padding:2px;border:1px solid #ccc;text-align:center;font-size:8px">'+(i+1)+'</td>'
      +'<td style="padding:2px 4px;border:1px solid #ccc;font-size:8px;white-space:nowrap">'+r.name+'</td>'
      +'<td style="padding:2px;border:1px solid #ccc;font-size:7px;direction:ltr;text-align:center">'+r.iqama+'</td>'
      +cells
      +'<td style="padding:2px;border:1px solid #ccc;text-align:center;font-weight:700;font-size:9px">'+total+'</td></tr>';
  });

  var w=window.open('','_blank','width=1400,height=800');if(!w)return;
  w.document.write('<!DOCTYPE html><html lang="en" dir="ltr"><head><meta charset="UTF-8"><title>Attendance '+monthNames[mo-1]+' '+year+'</title>'
    +'<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">'
    +'<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Cairo,sans-serif;background:#fff;padding:5mm;font-size:10px}'
    +'@media print{.nopr{display:none!important}@page{size:A3 landscape;margin:4mm}body{padding:0}}'
    +'table{width:100%;border-collapse:collapse}'
    +'.nopr{position:fixed;top:10px;left:10px;z-index:999;display:flex;gap:8px;background:linear-gradient(135deg,#1a3a5c,#2563eb);padding:8px 14px;border-radius:8px}'
    +'.nopr button{padding:5px 14px;border:none;border-radius:5px;cursor:pointer;font-family:Cairo,sans-serif;font-size:11px;font-weight:700}'
    +'</style></head><body>'
    +'<div class="nopr"><button style="background:#fff;color:#1a3a5c" onclick="window.print()">🖨️</button><button style="background:rgba(255,255,255,.2);color:#fff" onclick="window.close()">✖</button></div>'
    +'<div style="text-align:center;margin-bottom:8px"><div style="font-size:14px;font-weight:800;color:#1a3a5c">MALHAM ALUMINUM PLANT</div>'
    +'<div style="font-size:12px;color:#555">ATTENDANCE FOR THE MONTH '+monthNames[mo-1]+' '+year+'</div></div>'
    +'<table><thead><tr style="background:#1a3a5c;color:#fff"><th style="padding:2px;border:1px solid #999;font-size:7px">SL</th><th style="padding:2px;border:1px solid #999;font-size:7px;text-align:right;min-width:90px">NAME</th><th style="padding:2px;border:1px solid #999;font-size:7px;min-width:65px">IQAMA</th>'+dayHeaders+'<th style="padding:2px;border:1px solid #999;font-size:7px">TOTAL</th></tr></thead><tbody>'+rows+'</tbody></table>'
    +'<div style="margin-top:14px;display:flex;justify-content:space-between;font-size:9px;text-align:center">'
    +'<div style="min-width:100px"><div style="font-weight:700">مدير المكتب الفني</div>'+(sigImg?'<div style="margin:4px 0">'+sigImg+'</div>':'<br><br>')+'<div style="border-top:1px solid #333;padding-top:2px">التوقيع</div></div>'
    +'<div style="min-width:100px"><div style="font-weight:700">المدير العام</div><br><br><div style="border-top:1px solid #333;padding-top:2px">التوقيع</div></div>'
    +'</div></body></html>');
  w.document.close();
}
