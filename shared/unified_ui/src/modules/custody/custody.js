// ═══════════════════════════════════════════════════════════════
// ══ 19-custody.js — العهدة / حسابات المصروفات النثرية ══════
// ═══════════════════════════════════════════════════════════════

// ── Data Layer ──
function custLoadRecords() { try { return JSON.parse(localStorage.getItem('pm_custody')||'[]'); } catch(e) { return []; } }
function custSaveRecords(arr) { localStorage.setItem('pm_custody',JSON.stringify(arr)); }
function custLoadDist() { try { return JSON.parse(localStorage.getItem('pm_custody_dist')||'[]'); } catch(e) { return []; } }
function custSaveDist(arr) { localStorage.setItem('pm_custody_dist',JSON.stringify(arr)); }
function custLoadInvoices() { try { return JSON.parse(localStorage.getItem('pm_custody_invoices')||'[]'); } catch(e) { return []; } }
function custSaveInvoices(arr) { localStorage.setItem('pm_custody_invoices',JSON.stringify(arr)); }

// ── Helpers ──
function _custFmt(n) { return Number(n||0).toLocaleString('ar-SA'); }
function _custCalcTotals(custId) {
  // فقط التوزيعات الرئيسية — التحويلات ما تحسب
  var dists=custLoadDist().filter(function(d){return d.custodyId===custId && !d.isTransfer;});
  var invs=custLoadInvoices().filter(function(v){return v.custodyId===custId && !v.isTransfer;});
  var totalDist=dists.reduce(function(s,d){return s+(Number(d.amount)||0);},0);
  // المسوّى = فقط الفواتير يالي المدير أكّدها
  var totalSettled=invs.filter(function(v){return v.adminSettled;}).reduce(function(s,v){return s+(Number(v.amount)||0);},0);
  var totalPending=invs.filter(function(v){return !v.adminSettled;}).reduce(function(s,v){return s+(Number(v.amount)||0);},0);
  return {distributed:totalDist, settled:totalSettled, pending:totalPending};
}

// ── Tab Switching ──
function switchCustodyTab(tab) {
  document.querySelectorAll('[id^="custTab-"]').forEach(function(t){ t.classList.remove('active'); });
  document.querySelectorAll('[id^="custSection-"]').forEach(function(s){ s.style.display='none'; });
  var tabEl=document.getElementById('custTab-'+tab);
  var secEl=document.getElementById('custSection-'+tab);
  if(tabEl) tabEl.classList.add('active');
  if(secEl) secEl.style.display='block';
  if(tab==='receive') renderCustodyReceive();
  if(tab==='distribute') renderCustodyDistribute();
  if(tab==='invoices') renderCustodyInvoices();
  if(tab==='accounts') renderCustodyAccounts();
}

// ── Main Entry ──
function renderCustodyPage() {
  var page = document.getElementById('page-custody');
  if(!page) return;
  // بناء الهيكل إذا ما موجود
  if(!document.getElementById('custTab-receive')) {
    page.innerHTML =
      '<div class="page-header"><h2>💰 <span data-i18n="nav.custody">الحسابات</span></h2></div>'
      + '<div class="tabs-bar" style="display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:16px">'
      + '<button id="custTab-receive" class="tab active" onclick="switchCustodyTab(\'receive\')" style="padding:10px 20px;font-size:13px;font-weight:700;border:none;background:none;color:var(--text);cursor:pointer;border-bottom:3px solid transparent;font-family:Cairo,sans-serif">💰 '+t('استلام العهدة')+'</button>'
      + '<button id="custTab-distribute" class="tab" onclick="switchCustodyTab(\'distribute\')" style="padding:10px 20px;font-size:13px;font-weight:700;border:none;background:none;color:var(--text);cursor:pointer;border-bottom:3px solid transparent;font-family:Cairo,sans-serif">👷 '+t('توزيع العهدة')+'</button>'
      + '<button id="custTab-invoices" class="tab" onclick="switchCustodyTab(\'invoices\')" style="padding:10px 20px;font-size:13px;font-weight:700;border:none;background:none;color:var(--text);cursor:pointer;border-bottom:3px solid transparent;font-family:Cairo,sans-serif">🧾 '+t('تسوية الفواتير')+'</button>'
      + '<button id="custTab-accounts" class="tab" onclick="switchCustodyTab(\'accounts\')" style="padding:10px 20px;font-size:13px;font-weight:700;border:none;background:none;color:var(--text);cursor:pointer;border-bottom:3px solid transparent;font-family:Cairo,sans-serif">👤 '+t('حسابات الموظفين')+'</button>'
      + '</div>'
      + '<div id="custSection-receive" style="display:block"><div id="custReceiveContent"></div></div>'
      + '<div id="custSection-distribute" style="display:none"><div id="custDistContent"></div></div>'
      + '<div id="custSection-invoices" style="display:none"><div id="custInvoicesContent"></div></div>'
      + '<div id="custSection-accounts" style="display:none"><div id="custAccountsContent"></div></div>';
    // تنسيق التبويب النشط
    page.querySelectorAll('.tab').forEach(function(t){
      t.addEventListener('click', function(){
        page.querySelectorAll('.tab').forEach(function(b){ b.style.borderBottomColor='transparent'; b.style.color='var(--text2)'; });
        this.style.borderBottomColor='var(--accent)'; this.style.color='var(--accent)';
      });
    });
    // تطبيق الصلاحيات فوراً — قبل ما يشوف المستخدم شي
    var _cu=typeof getCurrentUser==='function'?getCurrentUser():null;
    if(_cu && !_cu.isAdmin) {
      var _ps=new Set(_cu.perms||[]);
      // شيك cust_emp_* → فعّل page_custody
      _ps.forEach(function(p){ if(p.indexOf('cust_emp_')===0) { _ps.add('page_custody'); _ps.add('cust_accounts'); _ps.add('cust_invoice'); } });
      if(!_ps.has('cust_receive')) { var _t1=document.getElementById('custTab-receive'); if(_t1) _t1.style.display='none'; }
      if(!_ps.has('cust_distribute')) { var _t2=document.getElementById('custTab-distribute'); if(_t2) _t2.style.display='none'; }
      if(!_ps.has('cust_receive')) { var _t3=document.getElementById('custTab-invoices'); if(_t3) _t3.style.display='none'; }
      if(!_ps.has('cust_accounts') && !Array.from(_ps).some(function(p){return p.indexOf('cust_emp_')===0;})) {
        var _t4=document.getElementById('custTab-accounts'); if(_t4) _t4.style.display='none';
      }
      // افتح أول تبويب مسموح
      if(_ps.has('cust_accounts') || Array.from(_ps).some(function(p){return p.indexOf('cust_emp_')===0;})) {
        page.querySelectorAll('.tab').forEach(function(b){ b.classList.remove('active'); b.style.borderBottomColor='transparent'; b.style.color='var(--text2)'; });
        var accTab=document.getElementById('custTab-accounts');
        if(accTab) { accTab.classList.add('active'); accTab.style.borderBottomColor='var(--accent)'; accTab.style.color='var(--accent)'; }
        document.getElementById('custSection-receive').style.display='none';
        document.getElementById('custSection-accounts').style.display='block';
        renderCustodyAccounts();
        return;
      }
    }
    page.querySelector('.tab.active').style.borderBottomColor='var(--accent)';
    page.querySelector('.tab.active').style.color='var(--accent)';
  }
  // ═══ كل مرة يفتح الصفحة — شيك الصلاحيات ═══
  var _cu2=typeof getCurrentUser==='function'?getCurrentUser():null;
  if(_cu2 && !_cu2.isAdmin) {
    var _ps2=new Set(_cu2.perms||[]);
    _ps2.forEach(function(p){ if(p.indexOf('cust_emp_')===0) { _ps2.add('cust_accounts'); _ps2.add('cust_invoice'); } });
    // أخفي التبويبات الممنوعة
    if(!_ps2.has('cust_receive')) { var _h1=document.getElementById('custTab-receive'); if(_h1) _h1.style.display='none'; var _s1=document.getElementById('custSection-receive'); if(_s1) _s1.style.display='none'; }
    if(!_ps2.has('cust_distribute')) { var _h2=document.getElementById('custTab-distribute'); if(_h2) _h2.style.display='none'; }
    if(!_ps2.has('cust_receive')) { var _h3=document.getElementById('custTab-invoices'); if(_h3) _h3.style.display='none'; }
    // افتح حسابات الموظفين مباشرة
    if(_ps2.has('cust_accounts') || Array.from(_ps2).some(function(p){return p.indexOf('cust_emp_')===0;})) {
      switchCustodyTab('accounts');
      return;
    }
  }
  renderCustodyReceive();
}

// ═══════════════════════════════════════════
// ══ Tab 1: استلام العهدة ═════════════════
// ═══════════════════════════════════════════
function renderCustodyReceive() {
  var el=document.getElementById('custReceiveContent'); if(!el) return;
  var records=custLoadRecords();

  // Summary totals
  var totalReceived=0, totalDist=0, totalSettled=0, totalPending=0;
  records.forEach(function(r){
    totalReceived+=Number(r.amount)||0;
    var tt=_custCalcTotals(r.id);
    totalDist+=tt.distributed;
    totalSettled+=tt.settled;
    totalPending+=tt.pending||0;
  });
  var totalRemaining=totalReceived-totalSettled;

  var html='';

  // Summary bar
  html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:16px">'
    +'<div class="card" style="margin:0;padding:12px;text-align:center;border-top:3px solid var(--accent)">'
    +'<div style="font-size:11px;color:var(--text2)">'+t('إجمالي المستلم')+'</div>'
    +'<div style="font-size:20px;font-weight:800;color:var(--accent)">'+_custFmt(totalReceived)+' <small style="font-size:11px">'+t('ريال')+'</small></div></div>'
    +'<div class="card" style="margin:0;padding:12px;text-align:center;border-top:3px solid #e0a020">'
    +'<div style="font-size:11px;color:var(--text2)">'+t('تم التوزيع')+'</div>'
    +'<div style="font-size:20px;font-weight:800;color:#e0a020">'+_custFmt(totalDist)+' <small style="font-size:11px">'+t('ريال')+'</small></div></div>'
    +'<div class="card" style="margin:0;padding:12px;text-align:center;border-top:3px solid #16a34a">'
    +'<div style="font-size:11px;color:var(--text2)">'+t('تم التسوية')+'</div>'
    +'<div style="font-size:20px;font-weight:800;color:#16a34a">'+_custFmt(totalSettled)+' <small style="font-size:11px">'+t('ريال')+'</small></div></div>'
    +(totalPending>0?'<div class="card" style="margin:0;padding:12px;text-align:center;border-top:3px solid #f59e0b">'
    +'<div style="font-size:11px;color:var(--text2)">'+t('بانتظار التسوية')+'</div>'
    +'<div style="font-size:20px;font-weight:800;color:#f59e0b">'+_custFmt(totalPending)+' <small style="font-size:11px">'+t('ريال')+'</small></div></div>':'')
    +'<div class="card" style="margin:0;padding:12px;text-align:center;border-top:3px solid '+(totalRemaining<0?'#dc2626':'#0891b2')+'">'
    +'<div style="font-size:11px;color:var(--text2)">'+t('المتبقي')+'</div>'
    +'<div style="font-size:20px;font-weight:800;color:'+(totalRemaining<0?'#dc2626':'#0891b2')+'">'+_custFmt(totalRemaining)+' <small style="font-size:11px">'+t('ريال')+'</small></div></div>'
    +'</div>';

  // Add button
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">'
    +'<div style="font-size:14px;color:var(--text2)">'+t('سجلات العهدة')+' <strong>('+records.length+')</strong></div>'
    +'<button class="btn btn-primary" onclick="custAddRecord()">➕ '+t('إضافة عهدة جديدة')+'</button>'
    +'</div>';

  // Cards
  if(!records.length) {
    html+='<div style="text-align:center;padding:60px 20px;color:var(--text2)">'
      +'<div style="font-size:48px;margin-bottom:12px;opacity:.5">💰</div>'
      +'<div style="font-size:16px;font-weight:700;margin-bottom:6px">'+t('لا يوجد سجلات عهدة')+'</div>'
      +'<div style="font-size:13px">'+t('أضف عهدة جديدة للبدء')+'</div></div>';
  } else {
    html+='<div style="display:grid;gap:12px">';
    records.forEach(function(r){
      var totals=_custCalcTotals(r.id);
      var remaining=Number(r.amount)-totals.settled;
      var statusColor=r.status==='closed'?'#16a34a':'#0891b2';
      var statusText=r.status==='closed'?t('مغلقة'):t('نشطة');
      html+='<div class="card" style="margin:0;border-right:4px solid '+statusColor+';padding:14px">'
        +'<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">'
        +'<div style="flex:1;min-width:200px">'
        +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap">'
        +'<div style="font-size:16px;font-weight:700;color:var(--text)">'+_custFmt(r.amount)+' '+t('ريال')+'</div>'
        +'<span style="font-size:11px;padding:3px 10px;border-radius:12px;background:'+statusColor+'22;color:'+statusColor+';font-weight:700;border:1px solid '+statusColor+'44">'+statusText+'</span>'
        +'</div>'
        +'<div style="font-size:12px;color:var(--text2);margin-bottom:8px">'+(r.reason||'')+'</div>'
        +'<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--text2)">'
        +'<span>'+t('التاريخ')+': <strong>'+r.date+'</strong></span>'
        +'<span>'+t('الموزع')+': <strong style="color:#e0a020">'+_custFmt(totals.distributed)+'</strong></span>'
        +'<span>'+t('المُسوّى')+': <strong style="color:#16a34a">'+_custFmt(totals.settled)+'</strong></span>'
        +'<span>'+t('المتبقي')+': <strong style="color:'+(remaining<0?'#dc2626':'#0891b2')+'">'+_custFmt(remaining)+'</strong></span>'
        +'</div></div>'
        +'<div style="display:flex;gap:6px;flex-shrink:0;align-items:center">'
        +'<button class="btn btn-sm btn-secondary" onclick="custEditRecord(\''+r.id+'\')">✏️</button>'
        +(r.status!=='closed'?'<button class="btn btn-sm btn-success" onclick="custCloseRecord(\''+r.id+'\')">'+t('إغلاق')+'</button>':'')
        +'<button class="btn btn-sm btn-danger" onclick="custDeleteRecord(\''+r.id+'\')">🗑️</button>'
        +'</div></div></div>';
    });
    html+='</div>';
  }

  el.innerHTML=html;
}

// ── Add Custody Record ──
function custAddRecord() {
  var today=new Date().toISOString().split('T')[0];
  var modal=document.createElement('div');
  modal.className='modal-bg';
  modal.innerHTML='<div class="modal" style="max-width:440px;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)">'
    +'<div style="background:linear-gradient(135deg,#0891b2,#0e7490);color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:15px;font-weight:700">💰 '+t('إضافة عهدة جديدة')+'</div>'
    +'<button style="background:rgba(255,255,255,.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer" onclick="this.closest(\'.modal-bg\').remove()">✕</button>'
    +'</div>'
    +'<div class="modal-body" style="padding:16px 20px">'
    +'<div class="form-group"><div class="form-label">'+t('المبلغ')+' ('+t('ريال')+') <span style="color:var(--accent3)">*</span></div>'
    +'<input id="custF_amount" type="number" placeholder="0" style="width:100%;font-size:18px;font-weight:700;text-align:center"></div>'
    +'<div class="form-group"><div class="form-label">'+t('التاريخ')+'</div>'
    +'<input id="custF_date" type="date" value="'+today+'" style="width:100%"></div>'
    +'<div class="form-group"><div class="form-label">'+t('السبب / الوصف')+'</div>'
    +'<textarea id="custF_reason" rows="2" placeholder="'+t('مثال: عهدة شهر أبريل')+'" style="width:100%"></textarea></div>'
    +'</div>'
    +'<div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">'
    +'<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>'
    +'<button class="btn btn-primary" onclick="custSaveNewRecord(this)">💾 '+t('حفظ')+'</button>'
    +'</div></div>';
  document.body.appendChild(modal);
  setTimeout(function(){ var el=document.getElementById('custF_amount'); if(el) el.focus(); },200);
}

function custSaveNewRecord(btn) {
  var amount=Number(document.getElementById('custF_amount').value);
  if(!amount||amount<=0) { notify(t('أدخل مبلغ صحيح'),'error'); return; }
  var date=document.getElementById('custF_date').value||new Date().toISOString().split('T')[0];
  var reason=(document.getElementById('custF_reason').value||'').trim();
  var records=custLoadRecords();
  records.unshift({
    id:'cust_'+Date.now(),
    amount:amount,
    date:date,
    reason:reason,
    status:'active',
    createdAt:new Date().toISOString()
  });
  custSaveRecords(records);
  btn.closest('.modal-bg').remove();
  renderCustodyReceive();
  notify('✅ '+t('تم إضافة العهدة:')+' '+_custFmt(amount)+' '+t('ريال'));
}

// ── Edit Custody Record ──
function custEditRecord(id) {
  var records=custLoadRecords();
  var r=records.find(function(x){return x.id===id;});
  if(!r) return;
  var modal=document.createElement('div');
  modal.className='modal-bg';
  modal.innerHTML='<div class="modal" style="max-width:440px;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)">'
    +'<div style="background:linear-gradient(135deg,#0891b2,#0e7490);color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:15px;font-weight:700">✏️ '+t('تعديل العهدة')+'</div>'
    +'<button style="background:rgba(255,255,255,.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer" onclick="this.closest(\'.modal-bg\').remove()">✕</button>'
    +'</div>'
    +'<div class="modal-body" style="padding:16px 20px">'
    +'<div class="form-group"><div class="form-label">'+t('المبلغ')+' ('+t('ريال')+')</div>'
    +'<input id="custE_amount" type="number" value="'+r.amount+'" style="width:100%;font-size:18px;font-weight:700;text-align:center"></div>'
    +'<div class="form-group"><div class="form-label">'+t('التاريخ')+'</div>'
    +'<input id="custE_date" type="date" value="'+r.date+'" style="width:100%"></div>'
    +'<div class="form-group"><div class="form-label">'+t('السبب / الوصف')+'</div>'
    +'<textarea id="custE_reason" rows="2" style="width:100%">'+(r.reason||'')+'</textarea></div>'
    +'</div>'
    +'<div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">'
    +'<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>'
    +'<button class="btn btn-primary" onclick="custUpdateRecord(\''+id+'\',this)">💾 '+t('حفظ')+'</button>'
    +'</div></div>';
  document.body.appendChild(modal);
}

function custUpdateRecord(id,btn) {
  var amount=Number(document.getElementById('custE_amount').value);
  if(!amount||amount<=0) { notify(t('أدخل مبلغ صحيح'),'error'); return; }
  var records=custLoadRecords();
  var idx=records.findIndex(function(x){return x.id===id;});
  if(idx<0) return;
  records[idx].amount=amount;
  records[idx].date=document.getElementById('custE_date').value||records[idx].date;
  records[idx].reason=(document.getElementById('custE_reason').value||'').trim();
  custSaveRecords(records);
  btn.closest('.modal-bg').remove();
  renderCustodyReceive();
  notify('✅ '+t('تم تعديل العهدة'));
}

// ── Close / Delete Custody Record ──
function custCloseRecord(id) {
  if(!confirm(t('إغلاق هذه العهدة؟ لن يمكن التوزيع منها بعد الإغلاق.'))) return;
  var records=custLoadRecords();
  var r=records.find(function(x){return x.id===id;});
  if(r) r.status='closed';
  custSaveRecords(records);
  renderCustodyReceive();
  notify(t('تم إغلاق العهدة'));
}

function custDeleteRecord(id) {
  if(!confirm(t('حذف هذه العهدة؟ سيتم حذف جميع التوزيعات والفواتير المرتبطة بها.'))) return;
  var records=custLoadRecords().filter(function(x){return x.id!==id;});
  var dists=custLoadDist().filter(function(x){return x.custodyId!==id;});
  var invs=custLoadInvoices().filter(function(x){return x.custodyId!==id;});
  custSaveRecords(records);
  custSaveDist(dists);
  custSaveInvoices(invs);
  renderCustodyReceive();
  notify(t('تم حذف العهدة وجميع البيانات المرتبطة'));
}

// ═══════════════════════════════════════════
// ══ Tab 2: توزيع العهدة ═════════════════
// ═══════════════════════════════════════════
function renderCustodyDistribute() {
  var el=document.getElementById('custDistContent'); if(!el) return;
  // فقط التوزيعات الرئيسية — التحويلات الفرعية ما تظهر هنا
  var dists=custLoadDist().filter(function(d){ return !d.isTransfer; });
  var records=custLoadRecords();
  var invs=custLoadInvoices();

  // Add button
  var html='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">'
    +'<div style="font-size:14px;color:var(--text2)">'+t('توزيعات العهدة')+' <strong>('+dists.length+')</strong></div>'
    +'<button class="btn btn-primary" onclick="custAddDist()">➕ '+t('توزيع مبلغ')+'</button>'
    +'</div>';

  if(!dists.length) {
    html+='<div style="text-align:center;padding:60px 20px;color:var(--text2)">'
      +'<div style="font-size:48px;margin-bottom:12px;opacity:.5">📤</div>'
      +'<div style="font-size:16px;font-weight:700;margin-bottom:6px">'+t('لا يوجد توزيعات')+'</div>'
      +'<div style="font-size:13px">'+t('وزّع المبالغ على الفنيين')+'</div></div>';
  } else {
    // Group by employee
    var byEmp={};
    dists.forEach(function(d){
      var key=d.employeeId||d.employeeName||'unknown';
      if(!byEmp[key]) byEmp[key]={name:d.employeeName||t('غير معروف'), items:[]};
      byEmp[key].items.push(d);
    });

    html+='<div style="display:grid;gap:16px">';
    Object.keys(byEmp).forEach(function(key){
      var group=byEmp[key];
      var totalAmt=group.items.reduce(function(s,d){return s+(Number(d.amount)||0);},0);
      var settledAmt=0;
      group.items.forEach(function(d){
        var dInvs=invs.filter(function(v){return v.distId===d.id;});
        settledAmt+=dInvs.reduce(function(s,v){return s+(Number(v.amount)||0);},0);
      });
      var unsettled=totalAmt-settledAmt;

      html+='<div class="card" style="margin:0;padding:0;overflow:hidden">'
        +'<div style="padding:12px 16px;background:var(--surface2);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">'
        +'<div style="display:flex;align-items:center;gap:10px">'
        +'<span style="font-size:20px">👤</span>'
        +'<div><div style="font-size:14px;font-weight:700;color:var(--text)">'+group.name+'</div>'
        +'<div style="font-size:11px;color:var(--text2)">'+group.items.length+' '+t('توزيعة')+'</div></div></div>'
        +'<div style="display:flex;gap:12px;font-size:12px">'
        +'<span>'+t('الإجمالي')+': <strong style="color:var(--accent)">'+_custFmt(totalAmt)+'</strong></span>'
        +'<span>'+t('مُسوّى')+': <strong style="color:#16a34a">'+_custFmt(settledAmt)+'</strong></span>'
        +'<span>'+t('متبقي')+': <strong style="color:'+(unsettled>0?'#e0a020':'#16a34a')+'">'+_custFmt(unsettled)+'</strong></span>'
        +'</div></div>';

      // Individual distributions
      html+='<div style="padding:8px 16px">';
      group.items.forEach(function(d){
        var cust=records.find(function(r){return r.id===d.custodyId;});
        var dInvs=invs.filter(function(v){return v.distId===d.id;});
        var dSettled=dInvs.reduce(function(s,v){return s+(Number(v.amount)||0);},0);
        var isSettled=d.settled||dSettled>=Number(d.amount);
        var statusColor=isSettled?'#16a34a':'#e0a020';
        var statusText=isSettled?t('تمت التسوية'):t('غير مسوّى');

        html+='<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);gap:8px;flex-wrap:wrap">'
          +'<div style="flex:1;min-width:150px">'
          +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
          +'<span style="font-size:14px;font-weight:700;color:var(--text)">'+_custFmt(d.amount)+' '+t('ريال')+'</span>'
          +'<span style="font-size:10px;padding:2px 8px;border-radius:8px;background:'+statusColor+'22;color:'+statusColor+';font-weight:700;border:1px solid '+statusColor+'44">'+statusText+'</span>'
          +'</div>'
          +'<div style="font-size:11px;color:var(--text2);margin-top:2px">'
          +d.date+' | '+(d.reason||'')
          +(cust?' | '+t('العهدة')+': '+_custFmt(cust.amount):'')
          +' | '+t('مُسوّى')+': '+_custFmt(dSettled)
          +'</div></div>'
          +'<div style="display:flex;gap:4px">'
          +(!isSettled?'<button class="btn btn-sm btn-success" onclick="custSettleDist(\''+d.id+'\')">'+t('تسوية')+'</button>':'')
          +'<button class="btn btn-sm btn-secondary" onclick="custEditDist(\''+d.id+'\')">✏️</button>'
          +'<button class="btn btn-sm btn-danger" onclick="custDeleteDist(\''+d.id+'\')">🗑️</button>'
          +'</div></div>';
      });
      html+='</div></div>';
    });
    html+='</div>';
  }

  el.innerHTML=html;
}

// ── Helper: load employees safely (HR module might be lazy loaded) ──
function _custLoadEmployees() {
  if(typeof hrLoadEmployees === 'function') return hrLoadEmployees();
  try { return JSON.parse(localStorage.getItem('pm_employees')||'[]'); } catch(e) { return []; }
}

// ── Add Distribution ──
function custAddDist() {
  var records=custLoadRecords().filter(function(r){return r.status==='active';});
  if(!records.length) { notify(t('لا يوجد عهدة نشطة — أضف عهدة أولاً'),'error'); return; }
  var emps=_custLoadEmployees().filter(function(e){return e.status!=='terminated';});

  var custOpts=records.map(function(r){
    var rem=Number(r.amount)-_custCalcTotals(r.id).settled;
    return '<option value="'+r.id+'">'+_custFmt(r.amount)+' '+t('ريال')+' — '+r.date+(r.reason?' — '+r.reason:'')+' ('+t('متبقي')+': '+_custFmt(rem)+')</option>';
  }).join('');

  var empOpts=emps.map(function(e){
    return '<option value="'+e.id+'" data-name="'+e.name+'">'+e.name+(e.role?' — '+e.role:'')+'</option>';
  }).join('');

  var today=new Date().toISOString().split('T')[0];
  var modal=document.createElement('div');
  modal.className='modal-bg';
  modal.innerHTML='<div class="modal" style="max-width:480px;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)">'
    +'<div style="background:linear-gradient(135deg,#e0a020,#d97706);color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:15px;font-weight:700">📤 '+t('توزيع مبلغ')+'</div>'
    +'<button style="background:rgba(255,255,255,.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer" onclick="this.closest(\'.modal-bg\').remove()">✕</button>'
    +'</div>'
    +'<div class="modal-body" style="padding:16px 20px">'
    +'<div class="form-group"><div class="form-label">'+t('العهدة')+' <span style="color:var(--accent3)">*</span></div>'
    +'<select id="custDF_custody" style="width:100%">'+custOpts+'</select></div>'
    +'<div class="form-group"><div class="form-label">'+t('الموظف')+' <span style="color:var(--accent3)">*</span></div>'
    +'<select id="custDF_employee" style="width:100%"><option value="">— '+t('اختر الموظف')+' —</option>'+empOpts+'</select></div>'
    +'<div class="form-group"><div class="form-label">'+t('المبلغ')+' ('+t('ريال')+') <span style="color:var(--accent3)">*</span></div>'
    +'<input id="custDF_amount" type="number" placeholder="0" style="width:100%;font-size:16px;font-weight:700;text-align:center"></div>'
    +'<div class="form-group"><div class="form-label">'+t('التاريخ')+'</div>'
    +'<input id="custDF_date" type="date" value="'+today+'" style="width:100%"></div>'
    +'<div class="form-group"><div class="form-label">'+t('السبب / الملاحظات')+'</div>'
    +'<textarea id="custDF_reason" rows="2" placeholder="'+t('سبب التوزيع...')+'" style="width:100%"></textarea></div>'
    +'</div>'
    +'<div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">'
    +'<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>'
    +'<button class="btn btn-primary" onclick="custSaveNewDist(this)">💾 '+t('حفظ')+'</button>'
    +'</div></div>';
  document.body.appendChild(modal);
}

function custSaveNewDist(btn) {
  var custodyId=document.getElementById('custDF_custody').value;
  var empSel=document.getElementById('custDF_employee');
  var employeeId=empSel.value;
  if(!employeeId) { notify(t('اختر الموظف'),'error'); return; }
  var employeeName=empSel.options[empSel.selectedIndex].getAttribute('data-name')||empSel.options[empSel.selectedIndex].text;
  var amount=Number(document.getElementById('custDF_amount').value);
  if(!amount||amount<=0) { notify(t('أدخل مبلغ صحيح'),'error'); return; }
  var date=document.getElementById('custDF_date').value||new Date().toISOString().split('T')[0];
  var reason=(document.getElementById('custDF_reason').value||'').trim();

  var dists=custLoadDist();
  dists.unshift({
    id:'cdist_'+Date.now(),
    custodyId:custodyId,
    employeeId:employeeId,
    employeeName:employeeName,
    amount:amount,
    date:date,
    reason:reason,
    settled:false,
    createdAt:new Date().toISOString()
  });
  custSaveDist(dists);
  btn.closest('.modal-bg').remove();
  renderCustodyDistribute();
  notify('✅ '+t('تم توزيع')+' '+_custFmt(amount)+' '+t('ريال')+' '+t('إلى')+' '+employeeName);
}

// ── Edit Distribution ──
function custEditDist(id) {
  var dists=custLoadDist();
  var d=dists.find(function(x){return x.id===id;});
  if(!d) return;
  var records=custLoadRecords();
  var emps=hrLoadEmployees().filter(function(e){return e.status!=='terminated';});

  var custOpts=records.map(function(r){
    return '<option value="'+r.id+'"'+(r.id===d.custodyId?' selected':'')+'>'+_custFmt(r.amount)+' '+t('ريال')+' — '+r.date+'</option>';
  }).join('');
  var empOpts=emps.map(function(e){
    return '<option value="'+e.id+'" data-name="'+e.name+'"'+(e.id===d.employeeId?' selected':'')+'>'+e.name+(e.role?' — '+e.role:'')+'</option>';
  }).join('');

  var modal=document.createElement('div');
  modal.className='modal-bg';
  modal.innerHTML='<div class="modal" style="max-width:480px;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)">'
    +'<div style="background:linear-gradient(135deg,#e0a020,#d97706);color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:15px;font-weight:700">✏️ '+t('تعديل التوزيع')+'</div>'
    +'<button style="background:rgba(255,255,255,.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer" onclick="this.closest(\'.modal-bg\').remove()">✕</button>'
    +'</div>'
    +'<div class="modal-body" style="padding:16px 20px">'
    +'<div class="form-group"><div class="form-label">'+t('العهدة')+'</div>'
    +'<select id="custDE_custody" style="width:100%">'+custOpts+'</select></div>'
    +'<div class="form-group"><div class="form-label">'+t('الموظف')+'</div>'
    +'<select id="custDE_employee" style="width:100%">'+empOpts+'</select></div>'
    +'<div class="form-group"><div class="form-label">'+t('المبلغ')+' ('+t('ريال')+')</div>'
    +'<input id="custDE_amount" type="number" value="'+d.amount+'" style="width:100%;font-size:16px;font-weight:700;text-align:center"></div>'
    +'<div class="form-group"><div class="form-label">'+t('التاريخ')+'</div>'
    +'<input id="custDE_date" type="date" value="'+d.date+'" style="width:100%"></div>'
    +'<div class="form-group"><div class="form-label">'+t('السبب')+'</div>'
    +'<textarea id="custDE_reason" rows="2" style="width:100%">'+(d.reason||'')+'</textarea></div>'
    +'</div>'
    +'<div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">'
    +'<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>'
    +'<button class="btn btn-primary" onclick="custUpdateDist(\''+id+'\',this)">💾 '+t('حفظ')+'</button>'
    +'</div></div>';
  document.body.appendChild(modal);
}

function custUpdateDist(id,btn) {
  var amount=Number(document.getElementById('custDE_amount').value);
  if(!amount||amount<=0) { notify(t('أدخل مبلغ صحيح'),'error'); return; }
  var dists=custLoadDist();
  var idx=dists.findIndex(function(x){return x.id===id;});
  if(idx<0) return;
  var empSel=document.getElementById('custDE_employee');
  dists[idx].custodyId=document.getElementById('custDE_custody').value;
  dists[idx].employeeId=empSel.value;
  dists[idx].employeeName=empSel.options[empSel.selectedIndex].getAttribute('data-name')||empSel.options[empSel.selectedIndex].text;
  dists[idx].amount=amount;
  dists[idx].date=document.getElementById('custDE_date').value||dists[idx].date;
  dists[idx].reason=(document.getElementById('custDE_reason').value||'').trim();
  custSaveDist(dists);
  btn.closest('.modal-bg').remove();
  renderCustodyDistribute();
  notify('✅ '+t('تم تعديل التوزيع'));
}

// ── Settle / Delete Distribution ──
function custSettleDist(id) {
  var dists=custLoadDist();
  var d=dists.find(function(x){return x.id===id;});
  if(!d) return;
  if(confirm(t('تأكيد تسوية هذا التوزيع يدوياً؟'))) {
    d.settled=true;
    custSaveDist(dists);
    renderCustodyDistribute();
    notify('✅ '+t('تم تسوية التوزيع'));
  }
}

function custDeleteDist(id) {
  if(!confirm(t('حذف هذا التوزيع؟'))) return;
  var dists=custLoadDist().filter(function(x){return x.id!==id;});
  // Also delete related invoices
  var invs=custLoadInvoices().filter(function(x){return x.distId!==id;});
  custSaveDist(dists);
  custSaveInvoices(invs);
  renderCustodyDistribute();
  notify(t('تم حذف التوزيع'));
}

// ═══════════════════════════════════════════
// ══ Tab 3: تسوية الفواتير ═══════════════
// ═══════════════════════════════════════════
var _custInvFilter='';

function _isAdminUser() {
  var cu=typeof getCurrentUser==='function'?getCurrentUser():null;
  return !cu||cu.isAdmin;
}

function renderCustodyInvoices() {
  var el=document.getElementById('custInvoicesContent'); if(!el) return;
  var invs=custLoadInvoices();
  var dists=custLoadDist();

  // Buttons
  var html='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">'
    +'<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
    +'<div style="font-size:14px;color:var(--text2)">'+t('فواتير العهدة')+' <strong>('+invs.length+')</strong></div>'
    +'<input id="custInvFilter" type="text" placeholder="'+t('بحث بالعميل...')+'" value="'+(_custInvFilter||'')+'" oninput="_custInvFilter=this.value;renderCustodyInvoices()" style="width:180px;font-size:12px;padding:4px 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--text)">'
    +'</div>'
    +'<div style="display:flex;gap:6px">'
    +'<button class="btn btn-primary" onclick="custAddInvoice()">➕ '+t('إضافة فاتورة')+'</button>'
    +'<button class="btn btn-secondary" onclick="custAddSharedInvoice()" style="background:#8e44ad;color:#fff;border-color:#8e44ad">🔗 '+t('فاتورة مشتركة')+'</button>'
    +'</div></div>';

  // Filter
  var filtered=invs;
  if(_custInvFilter) {
    var q=_custInvFilter.toLowerCase();
    filtered=invs.filter(function(v){return (v.clientName||'').toLowerCase().indexOf(q)>-1||(v.contractNo||'').toLowerCase().indexOf(q)>-1;});
  }

  // Summary
  var totalInvAmt=filtered.reduce(function(s,v){return s+(Number(v.amount)||0);},0);
  html+='<div style="margin-bottom:12px;font-size:13px;color:var(--text2)">'+t('إجمالي الفواتير المعروضة')+': <strong style="color:var(--accent)">'+_custFmt(totalInvAmt)+' '+t('ريال')+'</strong> ('+filtered.length+' '+t('فاتورة')+')</div>';

  if(!filtered.length) {
    html+='<div style="text-align:center;padding:60px 20px;color:var(--text2)">'
      +'<div style="font-size:48px;margin-bottom:12px;opacity:.5">🧾</div>'
      +'<div style="font-size:16px;font-weight:700;margin-bottom:6px">'+t('لا يوجد فواتير')+'</div>'
      +'<div style="font-size:13px">'+t('أضف فواتير لتسوية العهدة')+'</div></div>';
  } else {
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px">';
    var _allDists=custLoadDist();
    filtered.forEach(function(v){
      // معلومات العهدة المرتبطة
      var _vDist=v.distId?_allDists.find(function(d){return d.id===v.distId;}):null;
      var isShared=!!v.sharedInvoiceId;
      html+='<div class="card" style="margin:0;padding:0;overflow:hidden;border-right:4px solid '+(isShared?'#8e44ad':'var(--accent)')+'">'
        // Photo thumbnail
        +(v.photoPath?'<div style="height:120px;overflow:hidden;cursor:pointer" onclick="custViewPhoto(\''+v.id+'\')">'
          +'<img src="'+_custPhotoUrl(v.photoPath)+'" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.style.display=\'none\'">'
          +'</div>':'')
        +'<div style="padding:12px">'
        +'<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px">'
        +'<div>'
        +'<div style="font-size:14px;font-weight:700;color:var(--text)">'+(v.clientName||t('بدون عميل'))+'</div>'
        +(v.contractNo?'<div style="font-size:11px;color:var(--text2)">'+t('عقد')+': '+v.contractNo+'</div>':'')
        +'</div>'
        +'<div style="font-size:16px;font-weight:800;color:var(--accent)">'+_custFmt(v.amount)+'</div>'
        +'</div>'
        // Shared badge
        +(isShared&&v.sharedClients?'<div style="margin-bottom:6px"><span style="font-size:10px;padding:3px 8px;border-radius:8px;background:#8e44ad22;color:#8e44ad;font-weight:700;border:1px solid #8e44ad44">🔗 '+t('مشتركة مع')+': '+(Array.isArray(v.sharedClients)?v.sharedClients.join('، '):v.sharedClients)+'</span>'
          +(v.sharedTotal?'<span style="font-size:10px;color:var(--text2);margin-right:6px">'+t('الإجمالي')+': '+_custFmt(v.sharedTotal)+'</span>':'')
          +'</div>':'')
        +'<div style="font-size:11px;color:var(--text2);margin-bottom:6px">'
        +(v.description||'')
        +'</div>'
        +(v.employeeName?'<div style="font-size:11px;color:var(--accent2);margin-bottom:4px">👷 '+v.employeeName+(_vDist?' — '+t('عهدة')+': '+_custFmt(_vDist.amount):'')+'</div>':'')
        +(v.paid===false?'<div style="margin-bottom:4px"><span style="font-size:10px;padding:2px 8px;border-radius:6px;background:#ef444422;color:#ef4444;font-weight:700">⏳ '+t('لم يتم الدفع')+'</span></div>':'')
        +'<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:var(--text2);margin-bottom:8px">'
        +'<span>📅 '+v.date+'</span>'
        +(v.company?'<span>🏢 '+v.company+'</span>':'')
        +(v.region?'<span>📍 '+v.region+'</span>':'')
        +'</div>'
        +'<div style="display:flex;gap:4px;justify-content:flex-end;align-items:center;flex-wrap:wrap">'
        +(v.photoPath?'<button class="btn btn-sm btn-secondary" onclick="custViewPhoto(\''+v.id+'\')" title="'+t('معاينة')+'">👁️</button>':'')
        +(v.photoPath?'<a class="btn btn-sm btn-secondary" href="'+_custPhotoUrl(v.photoPath)+'" download title="'+t('تنزيل')+'">⬇️</a>':'')
        +(_isAdminUser()
          ?(v.adminSettled
            ?'<span style="font-size:11px;color:#16a34a;font-weight:700;padding:3px 10px;background:#16a34a15;border-radius:6px;border:1px solid #16a34a33">✅ '+t('تمت التسوية')+'</span>'
            :(v.rejected
              ?'<span style="font-size:11px;color:#ef4444;font-weight:700;padding:3px 10px;background:#ef444415;border-radius:6px;border:1px solid #ef444433">❌ '+t('مرفوضة')+'</span>'
              :'<button class="btn btn-sm btn-success" onclick="_custSettleOneInv(\''+v.id+'\');renderCustodyInvoices()">✅ '+t('تسوية')+'</button>'
              +'<button class="btn btn-sm btn-danger" onclick="_custRejectInv(\''+v.id+'\');renderCustodyInvoices()" style="font-size:10px">❌ '+t('رفض')+'</button>'))
          :(v.adminSettled?'<span style="font-size:10px;color:#16a34a">✅</span>':v.rejected?'<span style="font-size:10px;color:#ef4444">❌</span>':''))
        +'<button class="btn btn-sm btn-secondary" onclick="custEditInvoice(\''+v.id+'\')">✏️</button>'
        +(_isAdminUser()?'<button class="btn btn-sm btn-danger" onclick="custDeleteInvoice(\''+v.id+'\')">🗑️</button>':'')
        +'</div></div></div>';
    });
    html+='</div>';
  }

  el.innerHTML=html;
}

// ── Project Search Helper ──
function _custBuildClientSearch(inputId, listId, onSelect) {
  var d=loadData();
  var projects=(d.projects||[]).filter(function(p){return p.name;});
  var inp=document.getElementById(inputId);
  var list=document.getElementById(listId);
  if(!inp||!list) return;

  inp.addEventListener('input',function(){
    var q=inp.value.toLowerCase().trim();
    if(!q) { list.innerHTML=''; list.style.display='none'; return; }
    var matches=projects.filter(function(p){
      return (p.name||'').toLowerCase().indexOf(q)>-1||(p.contractNo||'').toLowerCase().indexOf(q)>-1;
    }).slice(0,10);
    if(!matches.length) { list.innerHTML='<div style="padding:8px 12px;color:var(--text2);font-size:12px">'+t('لا نتائج')+'</div>'; list.style.display='block'; return; }
    list.innerHTML=matches.map(function(p){
      return '<div class="cust-search-item" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);font-size:12px" '
        +'data-id="'+(p.id||'')+'" data-name="'+(p.name||'')+'" data-contract="'+(p.contractNo||'')+'" data-company="'+(p.company||'')+'" data-region="'+(p.region||'')+'" data-gallery="'+(p.gallery||'')+'">'
        +'<div style="font-weight:700;color:var(--text)">'+p.name+'</div>'
        +'<div style="font-size:10px;color:var(--text2)">'+(p.contractNo?t('عقد')+': '+p.contractNo+' | ':'')+(p.company||'')+(p.region?' | '+p.region:'')+'</div>'
        +'</div>';
    }).join('');
    list.style.display='block';
    list.querySelectorAll('.cust-search-item').forEach(function(item){
      item.addEventListener('click',function(){
        onSelect({
          id:item.getAttribute('data-id'),
          name:item.getAttribute('data-name'),
          contractNo:item.getAttribute('data-contract'),
          company:item.getAttribute('data-company'),
          region:item.getAttribute('data-region'),
          gallery:item.getAttribute('data-gallery')
        });
        list.style.display='none';
      });
    });
  });

  // Close on click outside
  document.addEventListener('click',function(e){
    if(!inp.contains(e.target)&&!list.contains(e.target)) list.style.display='none';
  });
}

// ── Add Single Invoice ──
function custAddInvoice() {
  var records=custLoadRecords();
  var allDists=custLoadDist();
  var invs=custLoadInvoices();
  var today=new Date().toISOString().split('T')[0];

  // بناء خيارات الموظفين مع رصيدهم
  var empMap={};
  allDists.forEach(function(d){
    if(!empMap[d.employeeId]) empMap[d.employeeId]={name:d.employeeName,total:0,settled:0,dists:[]};
    empMap[d.employeeId].total+=Number(d.amount)||0;
    empMap[d.employeeId].dists.push(d);
  });
  invs.forEach(function(v){
    if(!v.distId) return;
    var dist=allDists.find(function(d){return d.id===v.distId;});
    if(dist && empMap[dist.employeeId]) empMap[dist.employeeId].settled+=Number(v.amount)||0;
  });
  var empOpts='<option value="">— '+t('اختر الموظف (اختياري)')+' —</option>';
  Object.keys(empMap).forEach(function(eid){
    var e=empMap[eid];
    var rem=e.total-e.settled;
    if(rem<=0) return;
    empOpts+='<option value="'+eid+'" data-name="'+e.name+'">'+e.name+' — '+t('متبقي')+': '+_custFmt(rem)+' '+t('ريال')+'</option>';
  });

  var modal=document.createElement('div');
  modal.className='modal-bg';
  modal.innerHTML='<div class="modal" style="max-width:540px;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)">'
    +'<div style="background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:15px;font-weight:700">🧾 '+t('إضافة فاتورة')+'</div>'
    +'<button style="background:rgba(255,255,255,.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer" onclick="this.closest(\'.modal-bg\').remove()">✕</button>'
    +'</div>'
    +'<div class="modal-body" style="padding:16px 20px;max-height:70vh;overflow-y:auto">'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
    +'<div class="form-group" style="margin:0;grid-column:1/-1"><div class="form-label">'+t('العميل')+' <span style="color:var(--accent3)">*</span></div>'
    +'<div style="position:relative"><input id="custIF_client" type="text" placeholder="'+t('ابحث عن العميل...')+'" style="width:100%" autocomplete="off">'
    +'<div id="custIF_clientList" style="display:none;position:absolute;top:100%;right:0;left:0;background:var(--surface);border:1px solid var(--border);border-radius:8px;max-height:200px;overflow-y:auto;z-index:100;box-shadow:0 8px 24px rgba(0,0,0,.2)"></div></div></div>'
    +'<input type="hidden" id="custIF_projectId">'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('رقم العقد')+'</div>'
    +'<input id="custIF_contractNo" type="text" style="width:100%"></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('الشركة')+'</div>'
    +'<input id="custIF_company" type="text" style="width:100%"></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('المنطقة')+'</div>'
    +'<input id="custIF_region" type="text" style="width:100%"></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('المعرض')+'</div>'
    +'<input id="custIF_gallery" type="text" style="width:100%"></div>'
    +(function(){
      if(_isAdminUser()) {
        return '<div class="form-group" style="margin:0;grid-column:1/-1"><div class="form-label">👷 '+t('الموظف (صاحب العهدة)')+' <span style="font-size:10px;color:var(--text2)">('+t('اختياري')+')</span></div>'
          +'<select id="custIF_employee" style="width:100%">'+empOpts+'</select>'
          +'<div id="custIF_empBalance" style="font-size:11px;color:var(--text2);margin-top:4px"></div></div>';
      }
      // الموظف — شيك إذا حوّل لأشخاص
      var cu=typeof getCurrentUser==='function'?getCurrentUser():null;
      if(!cu) return '<input type="hidden" id="custIF_employee" value="">';
      var emps=_custLoadEmployees();
      var myEmp=emps.find(function(e){return e.name===cu.name;}) || emps.find(function(e){return e.name && cu.name && (e.name.indexOf(cu.name)>-1 || cu.name.indexOf(e.name)>-1);});
      if(!myEmp) return '<input type="hidden" id="custIF_employee" value="">';
      var myTransfers=custLoadDist().filter(function(d){return d.isTransfer && d.parentEmpId===myEmp.id;});
      // ما حوّل لحد — ما يظهر الحقل
      if(!myTransfers.length) return '<input type="hidden" id="custIF_employee" value="'+myEmp.id+'">';
      // حوّل لأشخاص — يظهر فقط هم
      var subOpts='';
      myTransfers.forEach(function(tr){
        var trI=custLoadInvoices().filter(function(v){return v.distId===tr.id && !v.isTransfer;});
        var trS=trI.reduce(function(s,v){return s+(Number(v.amount)||0);},0);
        var trR=(Number(tr.amount)||0)-trS;
        if(trR>0) subOpts+='<option value="'+tr.employeeId+'" data-name="'+tr.employeeName+'">'+tr.employeeName+' — '+_custFmt(tr.amount)+' ('+t('متبقي')+': '+_custFmt(trR)+')</option>';
      });
      if(!subOpts) return '<input type="hidden" id="custIF_employee" value="'+myEmp.id+'">';
      return '<input type="hidden" id="custIF_employee" value="'+myEmp.id+'">'
        +'<div class="form-group" style="margin:0;grid-column:1/-1"><div class="form-label">👤 '+t('فاتورة لحساب موظف حوّلت له')+'</div>'
        +'<select id="custIF_subEmployee" style="width:100%"><option value="">— '+t('من حسابي')+' —</option>'+subOpts+'</select></div>';
    }())
    +'<div class="form-group" id="custIF_distGroup" style="margin:0;grid-column:1/-1;display:none"><div class="form-label">📋 '+t('اختر العهدة')+'</div>'
    +'<select id="custIF_distSelect" style="width:100%"></select>'
    +'<div id="custIF_distInfo" style="font-size:11px;color:var(--text2);margin-top:4px"></div></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('المبلغ')+' ('+t('ريال')+') <span style="color:var(--accent3)">*</span></div>'
    +'<input id="custIF_amount" type="number" placeholder="0" style="width:100%;font-size:16px;font-weight:700;text-align:center"></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('التاريخ')+'</div>'
    +'<input id="custIF_date" type="date" value="'+today+'" style="width:100%"></div>'
    +'<div class="form-group" style="margin:0;grid-column:1/-1"><div class="form-label">'+t('الوصف')+'</div>'
    +'<textarea id="custIF_desc" rows="2" placeholder="'+t('وصف الفاتورة...')+'" style="width:100%"></textarea></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">💳 '+t('حالة الدفع')+'</div>'
    +'<select id="custIF_paid" style="width:100%"><option value="paid">✅ '+t('تم الدفع')+'</option><option value="unpaid">⏳ '+t('لم يتم الدفع')+'</option></select></div>'
    +'<div class="form-group" style="margin:0;grid-column:1/-1"><div class="form-label">📷 '+t('صورة الفاتورة')+'</div>'
    +'<input id="custIF_photo" type="file" accept="image/*" capture="environment" style="width:100%"></div>'
    +'</div></div>'
    +'<div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">'
    +'<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>'
    +'<button class="btn btn-primary" onclick="custSaveNewInvoice(this)">💾 '+t('حفظ')+'</button>'
    +'</div></div>';
  document.body.appendChild(modal);

  // Init client search
  setTimeout(function(){
    _custBuildClientSearch('custIF_client','custIF_clientList',function(p){
      document.getElementById('custIF_client').value=p.name;
      document.getElementById('custIF_projectId').value=p.id||'';
      document.getElementById('custIF_contractNo').value=p.contractNo||'';
      document.getElementById('custIF_company').value=p.company||'';
      document.getElementById('custIF_region').value=p.region||'';
      document.getElementById('custIF_gallery').value=p.gallery||'';
    });
    var el=document.getElementById('custIF_client'); if(el) el.focus();
    // عرض رصيد الموظف + تقسيم العهدة عند اختياره
    var empSel=document.getElementById('custIF_employee');
    if(empSel) empSel.addEventListener('change', function(){
      var balDiv=document.getElementById('custIF_empBalance');
      var distGroup=document.getElementById('custIF_distGroup');
      var distSelect=document.getElementById('custIF_distSelect');
      var distInfo=document.getElementById('custIF_distInfo');
      var eid=this.value;
      if(!eid) {
        if(balDiv) balDiv.innerHTML='';
        if(distGroup) distGroup.style.display='none';
        return;
      }
      var e=empMap[eid];
      if(!e) { if(balDiv) balDiv.innerHTML=''; if(distGroup) distGroup.style.display='none'; return; }
      if(balDiv) balDiv.innerHTML='💰 '+t('إجمالي العهدة')+': <strong>'+_custFmt(e.total)+'</strong> | '+t('متبقي')+': <strong style="color:#e0a020">'+_custFmt(e.total-e.settled)+'</strong>';

      // بناء خيارات العهدة (كل توزيع لحاله)
      if(distSelect && distGroup) {
        var allD=custLoadDist().filter(function(d){return d.employeeId===eid && !d.isTransfer && !d.settled;});
        var allI=custLoadInvoices();
        var opts='<option value="">— '+t('اختر العهدة')+' —</option>';
        allD.forEach(function(d){
          var dInvs=allI.filter(function(v){return v.distId===d.id && !v.isTransfer;});
          var dSettled=dInvs.reduce(function(s,v){return s+(Number(v.amount)||0);},0);
          var dRem=(Number(d.amount)||0)-dSettled;
          if(dRem<=0) return; // العهدة خلصت
          opts+='<option value="'+d.id+'">'+_custFmt(d.amount)+' '+t('ريال')+' — '+t('متبقي')+': '+_custFmt(dRem)+' ('+d.date+(d.reason?' — '+d.reason:'')+')</option>';
        });
        distSelect.innerHTML=opts;
        distGroup.style.display='block';

        distSelect.onchange=function(){
          if(!distInfo) return;
          var did=this.value;
          if(!did) { distInfo.innerHTML=''; return; }
          var dd=allD.find(function(d){return d.id===did;});
          if(!dd) return;
          var ddInvs=allI.filter(function(v){return v.distId===did && !v.isTransfer;});
          var ddS=ddInvs.reduce(function(s,v){return s+(Number(v.amount)||0);},0);
          distInfo.innerHTML='📋 '+t('العهدة')+': <strong>'+_custFmt(dd.amount)+'</strong> | '+t('مصروف')+': <strong style="color:#16a34a">'+_custFmt(ddS)+'</strong> | '+t('متبقي')+': <strong style="color:#e0a020">'+_custFmt((Number(dd.amount)||0)-ddS)+'</strong>';
        };
      }
    });
  },200);
}

function custSaveNewInvoice(btn) {
  var clientName=(document.getElementById('custIF_client').value||'').trim();
  if(!clientName) { notify(t('اختر العميل'),'error'); return; }
  var amount=Number(document.getElementById('custIF_amount').value);
  if(!amount||amount<=0) { notify(t('أدخل مبلغ صحيح'),'error'); return; }

  // ربط بالموظف
  var empSel=document.getElementById('custIF_employee');
  var employeeId=empSel?empSel.value:'';
  var employeeName='';
  if(employeeId && empSel.tagName==='SELECT' && empSel.selectedIndex>=0) {
    employeeName=empSel.options[empSel.selectedIndex].getAttribute('data-name')||empSel.options[empSel.selectedIndex].text||'';
  }
  // شيك إذا الفاتورة لحساب موظف حوّل له (subEmployee)
  var subEmpSel=document.getElementById('custIF_subEmployee');
  if(subEmpSel && subEmpSel.value) {
    employeeId=subEmpSel.value;
    employeeName=subEmpSel.options[subEmpSel.selectedIndex].getAttribute('data-name')||subEmpSel.options[subEmpSel.selectedIndex].text||'';
  }
  var distId=null, custodyId=null;
  // العهدة المختارة من الـ dropdown
  var distSelect=document.getElementById('custIF_distSelect');
  if(distSelect && distSelect.value) {
    distId=distSelect.value;
    var selDist=custLoadDist().find(function(d){return d.id===distId;});
    if(selDist) { custodyId=selDist.custodyId; if(!employeeId) { employeeId=selDist.employeeId; employeeName=selDist.employeeName; } }
  } else if(employeeId) {
    // إذا ما اختار عهدة — نختار أول وحدة فيها رصيد
    var allD=custLoadDist().filter(function(d){return d.employeeId===employeeId && !d.settled && !d.isTransfer;});
    var allI=custLoadInvoices();
    for(var di=0;di<allD.length;di++){
      var dInvs=allI.filter(function(v){return v.distId===allD[di].id;});
      var dS=dInvs.reduce(function(s,v){return s+(Number(v.amount)||0);},0);
      if((Number(allD[di].amount)||0)-dS>0) { distId=allD[di].id; custodyId=allD[di].custodyId; break; }
    }
  }
  if(!custodyId) {
    var recs=custLoadRecords().filter(function(r){return r.status==='active';});
    if(recs.length) custodyId=recs[0].id;
  }

  var inv={
    id:'cinv_'+Date.now(),
    custodyId:custodyId||null,
    distId:distId,
    employeeId:employeeId||null,
    employeeName:employeeName||null,
    projectId:document.getElementById('custIF_projectId').value||null,
    clientName:clientName,
    contractNo:(document.getElementById('custIF_contractNo').value||'').trim(),
    company:(document.getElementById('custIF_company').value||'').trim(),
    region:(document.getElementById('custIF_region').value||'').trim(),
    gallery:(document.getElementById('custIF_gallery').value||'').trim(),
    amount:amount,
    date:document.getElementById('custIF_date').value||new Date().toISOString().split('T')[0],
    description:(document.getElementById('custIF_desc').value||'').trim(),
    photoPath:null,
    photoName:null,
    paid:(document.getElementById('custIF_paid')?document.getElementById('custIF_paid').value:'paid')==='paid',
    sharedInvoiceId:null,
    sharedTotal:null,
    sharedClients:null,
    createdAt:new Date().toISOString()
  };

  // Upload photo if selected
  var photoInput=document.getElementById('custIF_photo');
  var file=photoInput&&photoInput.files[0];

  function _saveAndClose() {
    var invs=custLoadInvoices();
    invs.unshift(inv);
    custSaveInvoices(invs);
    btn.closest('.modal-bg').remove();
    renderCustodyInvoices();
    notify('✅ '+t('تم إضافة الفاتورة:')+' '+_custFmt(amount)+' '+t('ريال'));
  }

  if(file) {
    var fd=new FormData();
    fd.append('file',file);
    var q=new URLSearchParams({
      name:inv.clientName, contractNo:inv.contractNo||'',
      company:inv.company||'بدون', region:inv.region||'بدون', gallery:inv.gallery||'بدون'
    });
    btn.disabled=true; btn.textContent=t('جاري الرفع...');
    fetch('/api/upload-custody-invoice?'+q.toString(),{method:'POST',body:fd})
      .then(function(r){return r.json();})
      .then(function(j){
        if(j.ok) { inv.photoPath=j.path; inv.photoName=j.name; }
        else { notify('⚠️ '+t('فشل رفع الصورة'),'error'); }
        _saveAndClose();
      })
      .catch(function(){ notify('⚠️ '+t('فشل رفع الصورة'),'error'); _saveAndClose(); });
  } else {
    _saveAndClose();
  }
}

// ── Add Shared Invoice ──
function _custSFOnEmpChange() {
  var eid=document.getElementById('custSF_employee').value;
  var distGroup=document.getElementById('custSF_distGroup');
  var distSelect=document.getElementById('custSF_distSelect');
  if(!eid||!distGroup||!distSelect) { if(distGroup) distGroup.style.display='none'; return; }
  var allD=custLoadDist().filter(function(d){return d.employeeId===eid && !d.isTransfer && !d.settled;});
  var allI=custLoadInvoices();
  var opts='<option value="">— '+t('اختر العهدة')+' —</option>';
  allD.forEach(function(d){
    var dInvs=allI.filter(function(v){return v.distId===d.id && !v.isTransfer;});
    var dS=dInvs.reduce(function(s,v){return s+(Number(v.amount)||0);},0);
    var dR=(Number(d.amount)||0)-dS;
    if(dR<=0) return;
    opts+='<option value="'+d.id+'">'+_custFmt(d.amount)+' '+t('ريال')+' — '+t('متبقي')+': '+_custFmt(dR)+'</option>';
  });
  distSelect.innerHTML=opts;
  distGroup.style.display='block';
}

function custAddSharedInvoice() {
  var allDists=custLoadDist();
  var invs=custLoadInvoices();
  var d=loadData();
  var projects=(d.projects||[]).filter(function(p){return p.name;});
  var today=new Date().toISOString().split('T')[0];

  // بناء خيارات الموظفين (نفس منطق الفاتورة العادية)
  var empMap={};
  allDists.filter(function(dd){return !dd.isTransfer;}).forEach(function(dd){
    if(!empMap[dd.employeeId]) empMap[dd.employeeId]={name:dd.employeeName,total:0,settled:0};
    empMap[dd.employeeId].total+=Number(dd.amount)||0;
  });
  invs.forEach(function(v){
    if(!v.distId) return;
    var dist=allDists.find(function(dd){return dd.id===v.distId;});
    if(dist && empMap[dist.employeeId]) empMap[dist.employeeId].settled+=Number(v.amount)||0;
  });
  var empOpts='<option value="">— '+t('اختر الموظف')+' —</option>';
  Object.keys(empMap).forEach(function(eid){
    var e=empMap[eid]; var rem=e.total-e.settled;
    if(rem<=0) return;
    empOpts+='<option value="'+eid+'" data-name="'+e.name+'">'+e.name+' — '+t('متبقي')+': '+_custFmt(rem)+'</option>';
  });

  var modal=document.createElement('div');
  modal.className='modal-bg';
  modal.innerHTML='<div class="modal" style="max-width:600px;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)">'
    +'<div style="background:linear-gradient(135deg,#8e44ad,#6c3483);color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:15px;font-weight:700">🔗 '+t('فاتورة مشتركة')+'</div>'
    +'<button style="background:rgba(255,255,255,.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer" onclick="this.closest(\'.modal-bg\').remove()">✕</button>'
    +'</div>'
    +'<div class="modal-body" style="padding:16px 20px;max-height:70vh;overflow-y:auto">'
    // Client selection area
    +'<div class="form-group"><div class="form-label">'+t('العملاء المشتركين')+' <span style="color:var(--accent3)">*</span></div>'
    +'<div style="position:relative"><input id="custSF_clientSearch" type="text" placeholder="'+t('ابحث وأضف عملاء...')+'" style="width:100%" autocomplete="off">'
    +'<div id="custSF_clientList" style="display:none;position:absolute;top:100%;right:0;left:0;background:var(--surface);border:1px solid var(--border);border-radius:8px;max-height:200px;overflow-y:auto;z-index:100;box-shadow:0 8px 24px rgba(0,0,0,.2)"></div></div>'
    +'<div id="custSF_selectedClients" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px"></div></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
    +(function(){
      if(_isAdminUser()) {
        return '<div class="form-group" style="margin:0;grid-column:1/-1"><div class="form-label">👷 '+t('الموظف (صاحب العهدة)')+'</div>'
          +'<select id="custSF_employee" style="width:100%" onchange="_custSFOnEmpChange()">'+empOpts+'</select></div>';
      }
      var cu=typeof getCurrentUser==='function'?getCurrentUser():null;
      if(!cu) return '<input type="hidden" id="custSF_employee" value="">';
      var emps=_custLoadEmployees();
      var myEmp=emps.find(function(e){return e.name===cu.name;}) || emps.find(function(e){return e.name && cu.name && (e.name.indexOf(cu.name)>-1 || cu.name.indexOf(e.name)>-1);});
      if(!myEmp) return '<input type="hidden" id="custSF_employee" value="">';
      var myTransfers=custLoadDist().filter(function(dd){return dd.isTransfer && dd.parentEmpId===myEmp.id;});
      if(!myTransfers.length) return '<input type="hidden" id="custSF_employee" value="'+myEmp.id+'">';
      var subOpts='';
      myTransfers.forEach(function(tr){
        var trI=invs.filter(function(v){return v.distId===tr.id && !v.isTransfer;});
        var trS=trI.reduce(function(s,v){return s+(Number(v.amount)||0);},0);
        var trR=(Number(tr.amount)||0)-trS;
        if(trR>0) subOpts+='<option value="'+tr.employeeId+'" data-name="'+tr.employeeName+'">'+tr.employeeName+' — '+_custFmt(tr.amount)+' ('+t('متبقي')+': '+_custFmt(trR)+')</option>';
      });
      if(!subOpts) return '<input type="hidden" id="custSF_employee" value="'+myEmp.id+'">';
      return '<input type="hidden" id="custSF_employee" value="'+myEmp.id+'">'
        +'<div class="form-group" style="margin:0;grid-column:1/-1"><div class="form-label">👤 '+t('فاتورة لحساب موظف حوّلت له')+'</div>'
        +'<select id="custSF_subEmployee" style="width:100%"><option value="">— '+t('من حسابي')+' —</option>'+subOpts+'</select></div>';
    }())
    +'<div class="form-group" id="custSF_distGroup" style="margin:0;grid-column:1/-1;display:none"><div class="form-label">📋 '+t('اختر العهدة')+'</div>'
    +'<select id="custSF_distSelect" style="width:100%"></select></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('المبلغ الإجمالي')+' ('+t('ريال')+') <span style="color:var(--accent3)">*</span></div>'
    +'<input id="custSF_totalAmount" type="number" placeholder="0" style="width:100%;font-size:16px;font-weight:700;text-align:center" oninput="_custUpdateSharedSplit()"></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('التاريخ')+'</div>'
    +'<input id="custSF_date" type="date" value="'+today+'" style="width:100%"></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('طريقة التقسيم')+'</div>'
    +'<select id="custSF_splitMode" style="width:100%" onchange="_custUpdateSharedSplit()">'
    +'<option value="equal">'+t('بالتساوي')+'</option>'
    +'<option value="custom">'+t('مبالغ مخصصة')+'</option>'
    +'</select></div>'
    +'</div>'
    +'<div id="custSF_splitDetails" style="margin-top:8px"></div>'
    +'<div class="form-group"><div class="form-label">'+t('الوصف')+'</div>'
    +'<textarea id="custSF_desc" rows="2" placeholder="'+t('وصف الفاتورة المشتركة...')+'" style="width:100%"></textarea></div>'
    +'<div class="form-group"><div class="form-label">💳 '+t('حالة الدفع')+'</div>'
    +'<select id="custSF_paid" style="width:100%"><option value="paid">✅ '+t('تم الدفع')+'</option><option value="unpaid">⏳ '+t('لم يتم الدفع')+'</option></select></div>'
    +'<div class="form-group"><div class="form-label">📷 '+t('صورة الفاتورة')+'</div>'
    +'<input id="custSF_photo" type="file" accept="image/*" capture="environment" style="width:100%"></div>'
    +'</div>'
    +'<div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">'
    +'<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>'
    +'<button class="btn btn-primary" onclick="custSaveSharedInvoice(this)">💾 '+t('حفظ')+'</button>'
    +'</div></div>';
  document.body.appendChild(modal);

  // Store selected clients on the modal
  modal._selectedClients=[];

  // Client search
  setTimeout(function(){
    var inp=document.getElementById('custSF_clientSearch');
    var list=document.getElementById('custSF_clientList');
    if(!inp||!list) return;
    inp.addEventListener('input',function(){
      var q=inp.value.toLowerCase().trim();
      if(!q) { list.innerHTML=''; list.style.display='none'; return; }
      var matches=projects.filter(function(p){
        return (p.name||'').toLowerCase().indexOf(q)>-1||(p.contractNo||'').toLowerCase().indexOf(q)>-1;
      }).slice(0,10);
      if(!matches.length) { list.innerHTML='<div style="padding:8px 12px;color:var(--text2);font-size:12px">'+t('لا نتائج')+'</div>'; list.style.display='block'; return; }
      list.innerHTML=matches.map(function(p){
        return '<div class="cust-search-item" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);font-size:12px" '
          +'data-id="'+(p.id||'')+'" data-name="'+(p.name||'')+'" data-contract="'+(p.contractNo||'')+'" data-company="'+(p.company||'')+'" data-region="'+(p.region||'')+'" data-gallery="'+(p.gallery||'')+'">'
          +'<div style="font-weight:700;color:var(--text)">'+p.name+'</div>'
          +'<div style="font-size:10px;color:var(--text2)">'+(p.contractNo?t('عقد')+': '+p.contractNo+' | ':'')+(p.company||'')+'</div>'
          +'</div>';
      }).join('');
      list.style.display='block';
      list.querySelectorAll('.cust-search-item').forEach(function(item){
        item.addEventListener('click',function(){
          var client={
            id:item.getAttribute('data-id'),
            name:item.getAttribute('data-name'),
            contractNo:item.getAttribute('data-contract'),
            company:item.getAttribute('data-company'),
            region:item.getAttribute('data-region'),
            gallery:item.getAttribute('data-gallery')
          };
          // Don't add duplicate
          var m=inp.closest('.modal-bg');
          if(m._selectedClients.some(function(c){return c.name===client.name;})) { notify(t('العميل مضاف مسبقاً'),'error'); return; }
          m._selectedClients.push(client);
          _custRenderSelectedClients(m);
          _custUpdateSharedSplit();
          inp.value='';
          list.style.display='none';
        });
      });
    });
  },200);
}

function _custRenderSelectedClients(modal) {
  var container=document.getElementById('custSF_selectedClients');
  if(!container) return;
  container.innerHTML=modal._selectedClients.map(function(c,i){
    return '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:8px;background:var(--accent)22;color:var(--accent);font-size:12px;font-weight:700;border:1px solid var(--accent)44">'
      +c.name
      +'<button onclick="_custRemoveSharedClient('+i+')" style="background:none;border:none;color:var(--accent3);cursor:pointer;font-size:14px;padding:0 2px">✕</button>'
      +'</span>';
  }).join('');
}

function _custRemoveSharedClient(idx) {
  var modal=document.querySelector('.modal-bg');
  if(!modal||!modal._selectedClients) return;
  modal._selectedClients.splice(idx,1);
  _custRenderSelectedClients(modal);
  _custUpdateSharedSplit();
}

function _custUpdateSharedSplit() {
  var modal=document.querySelector('.modal-bg');
  if(!modal||!modal._selectedClients) return;
  var container=document.getElementById('custSF_splitDetails');
  if(!container) return;
  var clients=modal._selectedClients;
  var total=Number(document.getElementById('custSF_totalAmount').value)||0;
  var mode=document.getElementById('custSF_splitMode').value;

  if(!clients.length||!total) { container.innerHTML=''; return; }

  if(mode==='equal') {
    var share=Math.round((total/clients.length)*100)/100;
    container.innerHTML='<div style="font-size:12px;color:var(--text2);margin-bottom:4px">'+t('حصة كل عميل')+': <strong style="color:var(--accent)">'+_custFmt(share)+' '+t('ريال')+'</strong></div>';
  } else {
    var html='<div style="font-size:12px;color:var(--text2);margin-bottom:6px">'+t('أدخل مبلغ كل عميل')+':</div>';
    clients.forEach(function(c,i){
      html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'
        +'<span style="font-size:12px;font-weight:700;min-width:100px">'+c.name+'</span>'
        +'<input id="custSF_customAmt_'+i+'" type="number" placeholder="0" value="" style="width:120px;font-size:13px;text-align:center">'
        +'<span style="font-size:11px;color:var(--text2)">'+t('ريال')+'</span></div>';
    });
    container.innerHTML=html;
  }
}

function custSaveSharedInvoice(btn) {
  var modal=btn.closest('.modal-bg');
  var clients=modal._selectedClients||[];
  if(clients.length<2) { notify(t('أضف عميلين على الأقل'),'error'); return; }
  var totalAmount=Number(document.getElementById('custSF_totalAmount').value);
  if(!totalAmount||totalAmount<=0) { notify(t('أدخل المبلغ الإجمالي'),'error'); return; }
  // الموظف والعهدة
  var sfEmpSel=document.getElementById('custSF_employee');
  var sfEmployeeId=sfEmpSel?sfEmpSel.value:'';
  var sfEmployeeName='';
  if(sfEmployeeId && sfEmpSel.tagName==='SELECT' && sfEmpSel.selectedIndex>=0) {
    sfEmployeeName=sfEmpSel.options[sfEmpSel.selectedIndex].getAttribute('data-name')||'';
  }
  var sfSubEmpSel=document.getElementById('custSF_subEmployee');
  if(sfSubEmpSel && sfSubEmpSel.value) {
    sfEmployeeId=sfSubEmpSel.value;
    sfEmployeeName=sfSubEmpSel.options[sfSubEmpSel.selectedIndex].getAttribute('data-name')||sfSubEmpSel.options[sfSubEmpSel.selectedIndex].text||'';
  }
  var sfDistSel=document.getElementById('custSF_distSelect');
  var sfDistId=sfDistSel?sfDistSel.value:'';
  var custodyId='';
  if(sfDistId) {
    var dd=custLoadDist().find(function(d){return d.id===sfDistId;});
    if(dd) custodyId=dd.custodyId;
  }
  var date=document.getElementById('custSF_date').value||new Date().toISOString().split('T')[0];
  var desc=(document.getElementById('custSF_desc').value||'').trim();
  var mode=document.getElementById('custSF_splitMode').value;

  // Calculate shares
  var shares=[];
  if(mode==='equal') {
    var share=Math.round((totalAmount/clients.length)*100)/100;
    clients.forEach(function(){ shares.push(share); });
    // Adjust rounding on last
    var diff=totalAmount-share*clients.length;
    if(diff!==0) shares[shares.length-1]+=diff;
  } else {
    var sum=0;
    clients.forEach(function(c,i){
      var el=document.getElementById('custSF_customAmt_'+i);
      var amt=Number(el?el.value:0)||0;
      shares.push(amt);
      sum+=amt;
    });
    if(Math.abs(sum-totalAmount)>1) {
      notify(t('مجموع المبالغ المخصصة')+' ('+_custFmt(sum)+') '+t('لا يساوي الإجمالي')+' ('+_custFmt(totalAmount)+')','error');
      return;
    }
  }

  var sharedInvoiceId='shared_'+Date.now();
  var clientNames=clients.map(function(c){return c.name;});
  var now=new Date().toISOString();

  function _createInvoices(photoPath,photoName) {
    var invs=custLoadInvoices();
    clients.forEach(function(c,i){
      invs.unshift({
        id:'cinv_'+Date.now()+'_'+i,
        custodyId:custodyId||null,
        distId:sfDistId||null,
        employeeId:sfEmployeeId||null,
        employeeName:sfEmployeeName||null,
        projectId:c.id||null,
        clientName:c.name,
        contractNo:c.contractNo||'',
        company:c.company||'',
        region:c.region||'',
        gallery:c.gallery||'',
        amount:shares[i],
        date:date,
        description:desc,
        photoPath:photoPath,
        photoName:photoName,
        sharedInvoiceId:sharedInvoiceId,
        sharedTotal:totalAmount,
        paid:(document.getElementById('custSF_paid')?document.getElementById('custSF_paid').value:'paid')==='paid',
        sharedClients:clientNames,
        createdAt:now
      });
    });
    custSaveInvoices(invs);
    modal.remove();
    renderCustodyInvoices();
    notify('✅ '+t('تم إنشاء فاتورة مشتركة لـ')+' '+clients.length+' '+t('عملاء'));
  }

  // Upload photo if selected (to first client's folder)
  var photoInput=document.getElementById('custSF_photo');
  var file=photoInput&&photoInput.files[0];
  if(file) {
    var fd=new FormData();
    fd.append('file',file);
    var q=new URLSearchParams({
      name:clients[0].name, contractNo:clients[0].contractNo||'',
      company:clients[0].company||'بدون', region:clients[0].region||'بدون', gallery:clients[0].gallery||'بدون'
    });
    btn.disabled=true; btn.textContent=t('جاري الرفع...');
    fetch('/api/upload-custody-invoice?'+q.toString(),{method:'POST',body:fd})
      .then(function(r){return r.json();})
      .then(function(j){
        _createInvoices(j.ok?j.path:null, j.ok?j.name:null);
      })
      .catch(function(){ _createInvoices(null,null); });
  } else {
    _createInvoices(null,null);
  }
}

// ── Edit Invoice ──
function custEditInvoice(id) {
  var invs=custLoadInvoices();
  var v=invs.find(function(x){return x.id===id;});
  if(!v) return;
  var records=custLoadRecords();
  var dists=custLoadDist();

  var custOpts=records.map(function(r){
    return '<option value="'+r.id+'"'+(r.id===v.custodyId?' selected':'')+'>'+_custFmt(r.amount)+' '+t('ريال')+' — '+r.date+'</option>';
  }).join('');
  var distOpts='<option value="">— '+t('بدون')+' —</option>'+dists.map(function(d){
    return '<option value="'+d.id+'"'+(d.id===v.distId?' selected':'')+'>'+d.employeeName+' — '+_custFmt(d.amount)+' '+t('ريال')+'</option>';
  }).join('');

  var modal=document.createElement('div');
  modal.className='modal-bg';
  modal.innerHTML='<div class="modal" style="max-width:540px;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)">'
    +'<div style="background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:15px;font-weight:700">✏️ '+t('تعديل الفاتورة')+'</div>'
    +'<button style="background:rgba(255,255,255,.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer" onclick="this.closest(\'.modal-bg\').remove()">✕</button>'
    +'</div>'
    +'<div class="modal-body" style="padding:16px 20px;max-height:70vh;overflow-y:auto">'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
    +'<div class="form-group" style="margin:0;grid-column:1/-1"><div class="form-label">'+t('العميل')+'</div>'
    +'<input id="custIE_client" type="text" value="'+(v.clientName||'')+'" style="width:100%"></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('رقم العقد')+'</div>'
    +'<input id="custIE_contractNo" type="text" value="'+(v.contractNo||'')+'" style="width:100%"></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('الشركة')+'</div>'
    +'<input id="custIE_company" type="text" value="'+(v.company||'')+'" style="width:100%"></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('المنطقة')+'</div>'
    +'<input id="custIE_region" type="text" value="'+(v.region||'')+'" style="width:100%"></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('المعرض')+'</div>'
    +'<input id="custIE_gallery" type="text" value="'+(v.gallery||'')+'" style="width:100%"></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('العهدة')+'</div>'
    +'<select id="custIE_custody" style="width:100%">'+custOpts+'</select></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('التوزيع')+'</div>'
    +'<select id="custIE_dist" style="width:100%">'+distOpts+'</select></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('المبلغ')+' ('+t('ريال')+')</div>'
    +'<input id="custIE_amount" type="number" value="'+v.amount+'" style="width:100%;font-size:16px;font-weight:700;text-align:center"></div>'
    +'<div class="form-group" style="margin:0"><div class="form-label">'+t('التاريخ')+'</div>'
    +'<input id="custIE_date" type="date" value="'+v.date+'" style="width:100%"></div>'
    +'<div class="form-group" style="margin:0;grid-column:1/-1"><div class="form-label">'+t('الوصف')+'</div>'
    +'<textarea id="custIE_desc" rows="2" style="width:100%">'+(v.description||'')+'</textarea></div>'
    +'</div></div>'
    +'<div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">'
    +'<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>'
    +'<button class="btn btn-primary" onclick="custUpdateInvoice(\''+id+'\',this)">💾 '+t('حفظ')+'</button>'
    +'</div></div>';
  document.body.appendChild(modal);
}

function custUpdateInvoice(id,btn) {
  var amount=Number(document.getElementById('custIE_amount').value);
  if(!amount||amount<=0) { notify(t('أدخل مبلغ صحيح'),'error'); return; }
  var invs=custLoadInvoices();
  var idx=invs.findIndex(function(x){return x.id===id;});
  if(idx<0) return;
  invs[idx].clientName=(document.getElementById('custIE_client').value||'').trim();
  invs[idx].contractNo=(document.getElementById('custIE_contractNo').value||'').trim();
  invs[idx].company=(document.getElementById('custIE_company').value||'').trim();
  invs[idx].region=(document.getElementById('custIE_region').value||'').trim();
  invs[idx].gallery=(document.getElementById('custIE_gallery').value||'').trim();
  invs[idx].custodyId=document.getElementById('custIE_custody').value;
  invs[idx].distId=document.getElementById('custIE_dist').value||null;
  invs[idx].amount=amount;
  invs[idx].date=document.getElementById('custIE_date').value||invs[idx].date;
  invs[idx].description=(document.getElementById('custIE_desc').value||'').trim();
  custSaveInvoices(invs);
  btn.closest('.modal-bg').remove();
  renderCustodyInvoices();
  notify('✅ '+t('تم تعديل الفاتورة'));
}

// ── Delete Invoice ──
function custDeleteInvoice(id) {
  if(!confirm(t('حذف هذه الفاتورة؟'))) return;
  var invs=custLoadInvoices();
  var inv=invs.find(function(x){return x.id===id;});
  // If shared, ask if delete all related
  if(inv&&inv.sharedInvoiceId) {
    if(confirm(t('هذه فاتورة مشتركة — هل تريد حذف جميع الفواتير المرتبطة؟'))) {
      invs=invs.filter(function(x){return x.sharedInvoiceId!==inv.sharedInvoiceId;});
    } else {
      invs=invs.filter(function(x){return x.id!==id;});
    }
  } else {
    invs=invs.filter(function(x){return x.id!==id;});
  }
  custSaveInvoices(invs);
  renderCustodyInvoices();
  notify(t('تم حذف الفاتورة'));
}

// ── View Photo ──
function _custPhotoUrl(p) {
  if(!p) return '';
  var s = p.replace(/\\/g,'/');
  // المسار الكامل — نرسله كما هو لـ /api/file
  return '/api/file?path=' + encodeURIComponent(s);
}

function custViewPhoto(id) {
  var invs=custLoadInvoices();
  var v=invs.find(function(x){return x.id===id;});
  if(!v||!v.photoPath) { notify(t('لا يوجد صورة'),'error'); return; }
  var url = _custPhotoUrl(v.photoPath);
  var modal=document.createElement('div');
  modal.className='modal-bg';
  modal.style.cssText='display:flex;align-items:center;justify-content:center;z-index:10000';
  modal.onclick=function(e){if(e.target===modal) modal.remove();};
  modal.innerHTML='<div style="max-width:90vw;max-height:90vh;position:relative">'
    +'<button onclick="this.closest(\'.modal-bg\').remove()" style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,.6);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;z-index:1">✕</button>'
    +'<img src="'+url+'" style="max-width:90vw;max-height:90vh;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.5)">'
    +'<div style="position:absolute;bottom:8px;right:8px"><a href="'+url+'" download class="btn btn-sm" style="background:rgba(0,0,0,.6);color:#fff;border:none;font-size:12px">⬇️ '+t('تنزيل')+'</a></div>'
    +'</div>';
  document.body.appendChild(modal);
}

// ═══════════════════════════════════════════════════════
// ══ Tab 4: حسابات الموظفين — صفحة لكل موظف عنده عهدة ══
// ═══════════════════════════════════════════════════════
var _custSelectedEmpId = null;

function renderCustodyAccounts() {
  var el=document.getElementById('custAccountsContent'); if(!el) return;
  var allDists=custLoadDist();
  var invs=custLoadInvoices();
  var records=custLoadRecords();

  // فقط التوزيعات الرئيسية (يالي المدير وزّعها) — مو التحويلات الفرعية
  var mainDists=allDists.filter(function(d){ return !d.isTransfer; });
  // التحويلات الفرعية (يالي الموظف حوّلها لموظف ثاني)
  var subTransfers=allDists.filter(function(d){ return d.isTransfer; });

  var empMap={};
  mainDists.forEach(function(d){
    var eid=d.employeeId;
    if(!empMap[eid]) empMap[eid]={id:d.employeeId, name:d.employeeName, totalDist:0, totalInvoices:0, totalTransferred:0, dists:[], transfers:[]};
    empMap[eid].totalDist+=Number(d.amount)||0;
    empMap[eid].dists.push(d);
  });
  // أضف التحويلات لكل موظف
  subTransfers.forEach(function(tr){
    if(empMap[tr.parentEmpId]) {
      empMap[tr.parentEmpId].transfers.push(tr);
      empMap[tr.parentEmpId].totalTransferred+=Number(tr.amount)||0;
    }
  });
  // حساب الفواتير لكل موظف (فواتيره + فواتير المحوّل لهم)
  Object.keys(empMap).forEach(function(eid){
    var emp=empMap[eid];
    // فواتيره المباشرة
    var myInvs=invs.filter(function(v){ return !v.isTransfer && (v.employeeId===eid || emp.dists.some(function(d){return d.id===v.distId;})); });
    emp.totalInvoices=myInvs.reduce(function(s,v){return s+(Number(v.amount)||0);},0);
    // فواتير المحوّل لهم
    emp.transfers.forEach(function(tr){
      var trInvs=invs.filter(function(v){ return !v.isTransfer && (v.employeeId===tr.employeeId || v.distId===tr.id); });
      emp.totalInvoices+=trInvs.reduce(function(s,v){return s+(Number(v.amount)||0);},0);
    });
  });

  var empList=Object.values(empMap);

  // المستخدم الحالي — إذا مو أدمن يشوف بس حسابه
  var cu=typeof getCurrentUser==='function'?getCurrentUser():null;
  var isAdmin=!cu||cu.isAdmin;

  if(!isAdmin && cu) {
    var myEmpId=null;
    // أولاً: شيك صلاحية cust_emp_* — أدق من البحث بالاسم
    (cu.perms||[]).forEach(function(p){
      if(p.indexOf('cust_emp_')===0) {
        var eid=p.substring(9); // بعد 'cust_emp_'
        if(empMap[eid]) myEmpId=eid;
      }
    });
    // ثانياً: بحث بالاسم كـ fallback
    if(!myEmpId) {
      var emps=_custLoadEmployees();
      var cuName=(cu.name||'').trim();
      var myEmp=emps.find(function(e){ return e.name===cuName; })
        || emps.find(function(e){ return e.name && cuName && (e.name.indexOf(cuName)>-1 || cuName.indexOf(e.name)>-1); });
      if(myEmp && empMap[myEmp.id]) myEmpId=myEmp.id;
    }
    // ثالثاً: بحث بالتوزيعات مباشرة
    if(!myEmpId) {
      var cuName2=(cu.name||'').trim();
      Object.keys(empMap).forEach(function(eid){
        var emp=empMap[eid];
        if(emp.name===cuName2 || (emp.name && cuName2 && (emp.name.indexOf(cuName2)>-1 || cuName2.indexOf(emp.name)>-1))) myEmpId=eid;
      });
    }
    if(myEmpId && empMap[myEmpId]) {
      _custSelectedEmpId=myEmpId;
      _renderEmpAccount(el, empMap[myEmpId], invs, records, allDists, isAdmin);
      return;
    }
    el.innerHTML='<div style="text-align:center;padding:60px 20px;color:var(--text2)">'
      +'<div style="font-size:48px;margin-bottom:12px">💰</div>'
      +'<div style="font-size:16px;font-weight:700">'+t('لا يوجد عهدة باسمك')+'</div>'
      +'<div style="font-size:13px;margin-top:6px">'+t('تواصل مع المدير')+'</div></div>';
    return;
  }

  // عرض أدمن — قائمة كل الموظفين
  if(_custSelectedEmpId && empMap[_custSelectedEmpId]) {
    _renderEmpAccount(el, empMap[_custSelectedEmpId], invs, records, allDists, isAdmin);
    return;
  }

  // قائمة الموظفين
  var html='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'
    +'<div style="font-size:14px;color:var(--text2)">'+t('اختر موظف لعرض حسابه')+'</div>'
    +'</div>';

  if(!empList.length) {
    html+='<div style="text-align:center;padding:60px 20px;color:var(--text2)">'
      +'<div style="font-size:48px;margin-bottom:12px;opacity:.5">👤</div>'
      +'<div style="font-size:16px;font-weight:700">'+t('لا يوجد موظفين عندهم عهدة')+'</div>'
      +'<div style="font-size:13px;margin-top:6px">'+t('وزّع العهدة أولاً من تبويب التوزيع')+'</div></div>';
  } else {
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">';
    empList.forEach(function(emp){
      var rem=emp.totalDist-emp.totalInvoices;
      var pct=emp.totalDist>0?Math.round(emp.totalInvoices/emp.totalDist*100):0;
      var barColor=pct>=100?'#16a34a':pct>=50?'#e0a020':'#ef4444';
      html+='<div class="card" style="margin:0;padding:0;overflow:hidden;cursor:pointer;transition:transform .2s" onclick="_custSelectedEmpId=\''+emp.id+'\';renderCustodyAccounts()" onmouseenter="this.style.transform=\'scale(1.02)\'" onmouseleave="this.style.transform=\'\'">'
        +'<div style="padding:16px;display:flex;align-items:center;gap:12px">'
        +'<div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#6366f1);display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;font-weight:800">'+(emp.name||'?').charAt(0)+'</div>'
        +'<div style="flex:1">'
        +'<div style="font-size:15px;font-weight:700;color:var(--text)">'+emp.name+'</div>'
        +'<div style="font-size:11px;color:var(--text2)">'+emp.dists.length+' '+t('عهدة')+'</div>'
        +'</div>'
        +'<div style="text-align:left">'
        +'<div style="font-size:11px;color:var(--text2)">'+t('متبقي')+'</div>'
        +'<div style="font-size:18px;font-weight:800;color:'+(rem>0?'#e0a020':'#16a34a')+'">'+_custFmt(rem)+'</div>'
        +'</div></div>'
        +'<div style="height:4px;background:var(--surface2)"><div style="height:100%;width:'+pct+'%;background:'+barColor+';transition:width .3s"></div></div>'
        +'<div style="padding:8px 16px;display:flex;justify-content:space-between;font-size:11px;color:var(--text2)">'
        +'<span>'+t('إجمالي')+': '+_custFmt(emp.totalDist)+'</span>'
        +'<span>'+t('مسوّى')+': '+_custFmt(emp.totalSettled)+' ('+pct+'%)</span>'
        +'</div></div>';
    });
    html+='</div>';
  }
  el.innerHTML=html;
}

function _renderEmpAccount(el, emp, allInvs, records, allDists, isAdmin) {
  var transfers=emp.transfers||[];
  // فواتير لكل عهدة
  emp.dists.forEach(function(d){
    d._invs=allInvs.filter(function(v){return v.distId===d.id && !v.isTransfer;});
    d._settled=d._invs.reduce(function(s,v){return s+(Number(v.amount)||0);},0);
    d._rem=(Number(d.amount)||0)-d._settled;
  });
  var empInvs=allInvs.filter(function(v){ return !v.isTransfer && (v.employeeId===emp.id || emp.dists.some(function(d){return d.id===v.distId;})); });
  var myInvoiceTotal=empInvs.reduce(function(s,v){return s+(Number(v.amount)||0);},0);
  var rem=emp.totalDist-myInvoiceTotal;

  // ═══ Header ═══
  var html='<div style="margin-bottom:16px">';
  if(isAdmin) html+='<button class="btn btn-sm btn-secondary" onclick="_custSelectedEmpId=null;renderCustodyAccounts()" style="margin-bottom:12px">→ '+t('رجوع للقائمة')+'</button>';
  html+='<div style="display:flex;align-items:center;gap:14px;padding:16px;background:var(--surface2);border-radius:12px;border-right:4px solid var(--accent)">'
    +'<div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#6366f1);display:flex;align-items:center;justify-content:center;font-size:24px;color:#fff;font-weight:800">'+(emp.name||'?').charAt(0)+'</div>'
    +'<div style="flex:1"><div style="font-size:18px;font-weight:800;color:var(--text)">'+emp.name+'</div>'
    +'<div style="font-size:12px;color:var(--text2)">'+t('إجمالي العهدة')+': <strong style="color:var(--accent)">'+_custFmt(emp.totalDist)+'</strong> | '+t('فواتير')+': <strong style="color:#16a34a">'+_custFmt(myInvoiceTotal)+'</strong> | '+t('متبقي')+': <strong style="color:'+(rem>0?'#e0a020':'#16a34a')+'">'+_custFmt(rem)+'</strong></div>'
    +'</div></div></div>';

  // ═══ ملخص ═══
  html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:16px">';
  html+='<div style="padding:12px;background:var(--surface2);border-radius:10px;text-align:center"><div style="font-size:10px;color:var(--text2)">'+t('المستلم')+'</div><div style="font-size:18px;font-weight:800;color:var(--accent)">'+_custFmt(emp.totalDist)+'</div></div>';
  html+='<div style="padding:12px;background:var(--surface2);border-radius:10px;text-align:center"><div style="font-size:10px;color:var(--text2)">'+t('الفواتير')+'</div><div style="font-size:18px;font-weight:800;color:#16a34a">'+_custFmt(myInvoiceTotal)+'</div></div>';
  html+='<div style="padding:12px;background:var(--surface2);border-radius:10px;text-align:center"><div style="font-size:10px;color:var(--text2)">'+t('المتبقي')+'</div><div style="font-size:18px;font-weight:800;color:'+(rem>0?'#e0a020':rem<0?'#ef4444':'#16a34a')+'">'+_custFmt(rem)+'</div></div>';
  html+='</div>';

  // ═══ أزرار ═══
  html+='<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">'
    +'<button class="btn btn-primary" onclick="_custAddInvoiceForEmp(\''+emp.id+'\',\''+emp.name+'\')">🧾 '+t('إضافة فاتورة')+'</button>'
    +'<button class="btn btn-secondary" onclick="_custAddSharedInvoiceForEmp(\''+emp.id+'\',\''+emp.name+'\')" style="background:#8e44ad;color:#fff;border-color:#8e44ad">🔗 '+t('فاتورة مشتركة')+'</button>'
    +'<button class="btn btn-secondary" onclick="_custTransferCustody(\''+emp.id+'\',\''+emp.name+'\')">↔️ '+t('تحويل لموظف آخر')+'</button>'
    +'</div>';

  // ═══ العهدات المستلمة ═══
  html+='<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px">📋 '+t('العهدات المستلمة')+'</div>';
  emp.dists.forEach(function(d){
    var pctD=Number(d.amount)>0?Math.round(d._settled/Number(d.amount)*100):0;
    var done=d._rem<=0;
    html+='<div style="padding:10px 14px;background:var(--surface2);border-radius:8px;margin-bottom:6px;border-right:4px solid '+(done?'#16a34a':'var(--accent)')+';'+(done?'opacity:.6':'')+';">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">'
      +'<div><span style="font-weight:700;color:var(--text)">'+_custFmt(d.amount)+' '+t('ريال')+'</span>'
      +(done?' <span style="font-size:10px;color:#16a34a">✅</span>':'')
      +' <span style="font-size:11px;color:var(--text2)">'+d.date+(d.reason?' — '+d.reason:'')+'</span></div>'
      +'<div style="font-size:11px">'+t('فواتير')+': <strong style="color:#16a34a">'+_custFmt(d._settled)+'</strong> | '+t('متبقي')+': <strong style="color:'+(d._rem>0?'#e0a020':'#16a34a')+'">'+_custFmt(d._rem)+'</strong></div>'
      +'</div></div>';
  });

  // ═══ التحويلات ═══
  if(transfers.length) {
    html+='<div style="font-size:13px;font-weight:700;color:var(--text);margin:16px 0 8px">↔️ '+t('تحويلات لموظفين آخرين')+' ('+transfers.length+')</div>';
    transfers.forEach(function(tr){
      var trInvs=allInvs.filter(function(v){ return !v.isTransfer && (v.employeeId===tr.employeeId || v.distId===tr.id); });
      var trSettled=trInvs.reduce(function(s,v){return s+(Number(v.amount)||0);},0);
      html+='<div style="padding:8px 14px;background:var(--surface2);border-radius:8px;margin-bottom:4px;border-right:3px solid #6366f1;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px">'
        +'<div><span style="font-size:12px;font-weight:700;color:#6366f1">👤 '+tr.employeeName+'</span>'
        +' <span style="font-size:12px;font-weight:700">'+_custFmt(tr.amount)+' '+t('ريال')+'</span>'
        +' <span style="font-size:10px;color:var(--text2)">'+tr.date+' | '+t('فواتير')+': '+_custFmt(trSettled)+'</span>'
        +(tr.reason?'<div style="font-size:10px;color:var(--text2);margin-top:2px">📝 '+tr.reason+'</div>':'')
        +'</div>'
        +'<button class="btn btn-sm btn-danger" onclick="_custDeleteTransfer(\''+tr.id+'\')" style="font-size:10px;padding:2px 8px">🗑️</button>'
        +'</div>';
    });
  }

  // ═══ الفواتير ═══
  html+='<div style="font-size:13px;font-weight:700;color:var(--text);margin:16px 0 8px">🧾 '+t('الفواتير')+' ('+empInvs.length+')</div>';
  if(!empInvs.length) {
    html+='<div style="text-align:center;padding:30px;color:var(--text2);font-size:13px">'+t('لا يوجد فواتير')+'</div>';
  } else {
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">';
    empInvs.forEach(function(v){
      var isShared=!!v.sharedInvoiceId;
      html+='<div class="card" style="margin:0;padding:0;overflow:hidden;border-right:4px solid '+(isShared?'#8e44ad':'var(--accent)')+'">'
        +(v.photoPath?'<div style="height:100px;overflow:hidden;cursor:pointer" onclick="custViewPhoto(\''+v.id+'\')">'
          +'<img src="'+_custPhotoUrl(v.photoPath)+'" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.style.display=\'none\'">'
          +'</div>':'')
        +'<div style="padding:10px">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
        +'<div style="font-size:13px;font-weight:700;color:var(--text)">'+(v.clientName||'')+'</div>'
        +'<div style="font-size:15px;font-weight:800;color:var(--accent)">'+_custFmt(v.amount)+'</div>'
        +'</div>'
        +(v.description?'<div style="font-size:11px;color:var(--text2)">'+v.description+'</div>':'')
        +'<div style="font-size:10px;color:var(--text2);margin-top:4px">📅 '+v.date+'</div>'
        +(v.paid===false?'<div style="margin-top:4px"><span style="font-size:10px;padding:2px 6px;border-radius:6px;background:#ef444422;color:#ef4444;font-weight:700">⏳ '+t('لم يتم الدفع')+'</span></div>':'')
        +(v.rejected?'<div style="margin-top:4px"><span style="font-size:10px;padding:2px 8px;border-radius:6px;background:#ef444422;color:#ef4444;font-weight:700;border:1px solid #ef444433">❌ '+t('مرفوضة من المدير')+(v.rejectReason?' — '+v.rejectReason:'')+'</span></div>':'')
        +(v.adminSettled?'<div style="margin-top:4px"><span style="font-size:10px;color:#16a34a;font-weight:700">✅ '+t('تمت التسوية')+'</span></div>':'')
        +'<div style="margin-top:6px;display:flex;gap:4px;justify-content:flex-end">'
        +(v.photoPath?'<button class="btn btn-sm btn-secondary" onclick="custViewPhoto(\''+v.id+'\')">👁️</button>':'')
        +(!v.adminSettled?'<button class="btn btn-sm btn-secondary" onclick="custEditInvoice(\''+v.id+'\')">✏️</button>':'')
        +(!v.adminSettled?'<button class="btn btn-sm btn-danger" onclick="custDeleteInvoice(\''+v.id+'\')">🗑️</button>':'')
        +'</div></div></div>';
    });
    html+='</div>';
  }

  // ═══ دفتر الملاحظات ═══
  var noteKey='pm_custody_notes_'+emp.id;
  var savedNote='';
  try { savedNote=localStorage.getItem(noteKey)||''; } catch(e){}
  html+='<div style="margin-top:20px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'
    +'<div style="font-size:13px;font-weight:700;color:var(--text)">📝 '+t('دفتر الملاحظات')+'</div>'
    +'<div style="font-size:10px;color:var(--text2)" id="custNoteStatus"></div>'
    +'</div>'
    +'<div style="position:relative">'
    +'<textarea id="custNotepad_'+emp.id+'" rows="6" style="width:100%;background:#fefce8;color:#1a1a1a;border:2px solid #fbbf24;border-radius:10px;padding:12px 14px;font-family:Cairo,sans-serif;font-size:13px;line-height:1.8;resize:vertical;min-height:120px" placeholder="'+t('سجّل ملاحظاتك هنا... يمكنك كتابة عمليات حسابية مثل 500+300-100')+'">'+savedNote.replace(/</g,'&lt;')+'</textarea>'
    +'<div style="position:absolute;bottom:8px;left:8px;display:flex;gap:4px">'
    +'<button class="btn btn-sm" onclick="_custCalcNote(\''+emp.id+'\')" style="background:#fbbf24;color:#1a1a1a;border:none;font-size:10px;padding:2px 8px" title="'+t('حساب')+'">🔢</button>'
    +'</div></div>'
    +'<div id="custNoteCalc_'+emp.id+'" style="display:none;margin-top:6px;padding:8px 12px;background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;font-size:13px;font-weight:700;color:#92400e"></div>'
    +'</div>';

  el.innerHTML=html;

  // حفظ تلقائي للملاحظات
  var noteEl=document.getElementById('custNotepad_'+emp.id);
  if(noteEl) {
    var _noteTimer=null;
    noteEl.addEventListener('input', function(){
      clearTimeout(_noteTimer);
      _noteTimer=setTimeout(function(){
        localStorage.setItem(noteKey, noteEl.value);
        var st=document.getElementById('custNoteStatus');
        if(st) { st.textContent='✅ '+t('تم الحفظ'); setTimeout(function(){st.textContent='';},2000); }
      }, 500);
    });
  }
}

// حاسبة الملاحظات — يحسب آخر سطر فيه عملية حسابية
function _custCalcNote(empId) {
  var el=document.getElementById('custNotepad_'+empId);
  var res=document.getElementById('custNoteCalc_'+empId);
  if(!el||!res) return;
  var lines=el.value.split('\n').filter(function(l){return l.trim();});
  if(!lines.length) return;
  // نحسب كل سطر فيه أرقام وعمليات
  var results=[];
  lines.forEach(function(line){
    var clean=line.replace(/[^\d+\-*/().٫٬,\s]/g,'').replace(/,/g,'').trim();
    if(!clean||!/[\d]/.test(clean)) return;
    try {
      var val=Function('"use strict";return('+clean+')')();
      if(typeof val==='number'&&isFinite(val)) results.push({line:line.trim(), val:val});
    } catch(e){}
  });
  if(!results.length) { res.style.display='none'; return; }
  var total=results.reduce(function(s,r){return s+r.val;},0);
  var html=results.map(function(r){return '<div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--text2)">'+r.line+'</span><span>= '+_custFmt(r.val)+'</span></div>';}).join('');
  if(results.length>1) html+='<div style="border-top:1.5px solid #d97706;margin-top:4px;padding-top:4px;display:flex;justify-content:space-between;font-size:14px"><span>'+t('المجموع')+'</span><strong>'+_custFmt(total)+'</strong></div>';
  res.innerHTML=html;
  res.style.display='block';
}

// تسوية فاتورة واحدة — المدير فقط
function _custSettleOneInv(invId) {
  var invs=custLoadInvoices();
  var inv=invs.find(function(v){return v.id===invId;});
  if(!inv) return;
  inv.adminSettled=true;
  inv.rejected=false;
  inv.adminSettledAt=new Date().toISOString();
  custSaveInvoices(invs);
  renderCustodyAccounts();
  notify('✅ '+t('تمت تسوية الفاتورة')+': '+_custFmt(inv.amount)+' '+t('ريال'));
}

function _custRejectInv(invId) {
  var reason=prompt(t('سبب الرفض')+':', '');
  if(reason===null) return;
  var invs=custLoadInvoices();
  var inv=invs.find(function(v){return v.id===invId;});
  if(!inv) return;
  inv.rejected=true;
  inv.adminSettled=false;
  inv.rejectReason=reason;
  inv.rejectedAt=new Date().toISOString();
  custSaveInvoices(invs);
  renderCustodyAccounts();
  notify('❌ '+t('تم رفض الفاتورة'));
}

// تسوية كل فواتير موظف — المدير فقط
function _custSettleAllInvs(empId) {
  if(!confirm(t('تسوية كل الفواتير لهذا الموظف؟'))) return;
  var invs=custLoadInvoices();
  var allDists=custLoadDist();
  var mainDists=allDists.filter(function(d){return !d.isTransfer && d.employeeId===empId;});
  var transfers=allDists.filter(function(d){return d.isTransfer && d.parentEmpId===empId;});
  var count=0;
  invs.forEach(function(v){
    if(v.adminSettled) return;
    var isMyInv = v.employeeId===empId || mainDists.some(function(d){return d.id===v.distId;});
    var isSubInv = transfers.some(function(tr){return v.employeeId===tr.employeeId || v.distId===tr.id;});
    if(isMyInv || isSubInv) { v.adminSettled=true; v.adminSettledAt=new Date().toISOString(); count++; }
  });
  custSaveInvoices(invs);
  renderCustodyAccounts();
  notify('✅ '+t('تمت تسوية')+' '+count+' '+t('فاتورة'));
}

// إضافة فاتورة لموظف محدد — من صفحة حسابات الموظفين
function _custAddInvoiceForEmp(empId, empName) {
  // نحفظ الموظف حتى الفورم يعرف
  window._custInvoiceForEmpId = empId;
  window._custInvoiceForEmpName = empName;
  custAddInvoice();
  setTimeout(function(){
    // نخفي حقل الموظف الرئيسي ونثبته
    var empSel=document.getElementById('custIF_employee');
    if(empSel) empSel.value=empId;
    // نخفي حقل الموظف فقط (مو كل الفورم)
    if(empSel && empSel.tagName==='SELECT') {
      var empGroup=empSel.closest('.form-group');
      if(empGroup) empGroup.style.display='none';
    }
    // نخفي رصيد الموظف
    var balDiv=document.getElementById('custIF_empBalance');
    if(balDiv) balDiv.style.display='none';

    // نعبّي العهدات
    var distGroup=document.getElementById('custIF_distGroup');
    var distSelect=document.getElementById('custIF_distSelect');
    if(distGroup && distSelect) {
      var allD=custLoadDist().filter(function(d){return d.employeeId===empId && !d.isTransfer && !d.settled;});
      var opts='<option value="">— '+t('اختر العهدة')+' —</option>';
      allD.forEach(function(d){
        var dInvs=allI.filter(function(v){return v.distId===d.id && !v.isTransfer;});
        var dS=dInvs.reduce(function(s,v){return s+(Number(v.amount)||0);},0);
        var dR=(Number(d.amount)||0)-dS;
        if(dR<=0) return;
        opts+='<option value="'+d.id+'">'+_custFmt(d.amount)+' '+t('ريال')+' — '+t('متبقي')+': '+_custFmt(dR)+' ('+d.date+(d.reason?' — '+d.reason:'')+')</option>';
      });
      distSelect.innerHTML=opts;
      distGroup.style.display='block';
    }
    delete window._custInvoiceForEmpId;
    delete window._custInvoiceForEmpName;
  }, 300);
}

// إضافة فاتورة على عهدة محددة
function _custAddInvoiceForDist(distId, empId, empName) {
  custAddInvoice();
  setTimeout(function(){
    var empSel=document.getElementById('custIF_employee');
    if(empSel) { empSel.value=empId; empSel.dispatchEvent(new Event('change')); }
    // حفظ الـ distId بحقل مخفي
    var hidden=document.getElementById('custIF_projectId');
    if(hidden) hidden.setAttribute('data-dist-id', distId);
  }, 300);
}

// تحويل من عهدة محددة
function _custTransferFromDist(distId, empId, empName, maxAmount) {
  _custTransferCustody(empId, empName);
  // ممكن نضيف لاحقاً تحديد العهدة المحددة
}

// فاتورة مشتركة لموظف محدد
function _custAddSharedInvoiceForEmp(empId, empName) {
  custAddSharedInvoice();
  setTimeout(function(){
    var empSel=document.getElementById('custSF_employee');
    if(empSel && empSel.tagName==='SELECT') {
      empSel.value=empId;
      var empGroup=empSel.closest('.form-group');
      if(empGroup) empGroup.style.display='none';
      _custSFOnEmpChange();
    } else if(empSel) {
      empSel.value=empId;
    }
    // عبّي العهدات
    _custSFOnEmpChange();
  }, 300);
}

// تحويل عهدة لموظف آخر
function _custTransferCustody(fromEmpId, fromEmpName) {
  var allDists=custLoadDist();
  var invs=custLoadInvoices();
  // حساب المتبقي — فقط التوزيعات الرئيسية (مو التحويلات)
  var empDists=allDists.filter(function(d){return d.employeeId===fromEmpId && !d.isTransfer;});
  var totalDist=empDists.reduce(function(s,d){return s+(Number(d.amount)||0);},0);
  var myInvTotal=invs.filter(function(v){return !v.isTransfer && (v.employeeId===fromEmpId || empDists.some(function(d){return d.id===v.distId;}));}).reduce(function(s,v){return s+(Number(v.amount)||0);},0);
  // الرصيد = المستلم - فواتيري فقط (التحويل ما ينقص)
  var remaining=totalDist-myInvTotal;
  if(remaining<=0) { notify(t('لا يوجد رصيد متبقي للتحويل'),'error'); return; }

  var emps=_custLoadEmployees().filter(function(e){return e.status!=='terminated' && e.id!==fromEmpId;});
  var empOpts=emps.map(function(e){return '<option value="'+e.id+'" data-name="'+e.name+'">'+e.name+(e.role?' — '+e.role:'')+'</option>';}).join('');
  var today=new Date().toISOString().split('T')[0];

  var modal=document.createElement('div');
  modal.className='modal-bg';
  modal.innerHTML='<div class="modal" style="max-width:440px;border-radius:16px;overflow:hidden">'
    +'<div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:15px;font-weight:700">↔️ '+t('تحويل عهدة من')+' '+fromEmpName+'</div>'
    +'<button style="background:rgba(255,255,255,.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer" onclick="this.closest(\'.modal-bg\').remove()">✕</button>'
    +'</div>'
    +'<div class="modal-body" style="padding:16px 20px">'
    +'<div style="padding:10px;background:var(--surface2);border-radius:8px;margin-bottom:12px;text-align:center">'
    +'<div style="font-size:11px;color:var(--text2)">'+t('الرصيد المتبقي عند')+' '+fromEmpName+'</div>'
    +'<div style="font-size:22px;font-weight:800;color:#e0a020">'+_custFmt(remaining)+' '+t('ريال')+'</div></div>'
    +'<div class="form-group"><div class="form-label">'+t('تحويل إلى')+' <span style="color:var(--accent3)">*</span></div>'
    +'<select id="custTF_toEmp" style="width:100%"><option value="">— '+t('اختر الموظف')+' —</option>'+empOpts+'</select></div>'
    +'<div class="form-group"><div class="form-label">'+t('المبلغ')+' ('+t('ريال')+')</div>'
    +'<input id="custTF_amount" type="number" value="'+remaining+'" max="'+remaining+'" style="width:100%;font-size:16px;font-weight:700;text-align:center"></div>'
    +'<div class="form-group"><div class="form-label">'+t('السبب')+'</div>'
    +'<textarea id="custTF_reason" rows="2" style="width:100%" placeholder="'+t('سبب التحويل...')+'">'+t('تحويل من')+' '+fromEmpName+'</textarea></div>'
    +'</div>'
    +'<div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">'
    +'<button class="btn btn-secondary" onclick="this.closest(\'.modal-bg\').remove()">'+t('إلغاء')+'</button>'
    +'<button class="btn btn-primary" onclick="_custDoTransfer(\''+fromEmpId+'\',\''+fromEmpName+'\',this)">↔️ '+t('تحويل')+'</button>'
    +'</div></div>';
  document.body.appendChild(modal);
}

function _custDeleteTransfer(transferId) {
  if(!confirm(t('حذف هذا التحويل؟'))) return;
  var dists=custLoadDist();
  dists=dists.filter(function(d){return d.id!==transferId;});
  custSaveDist(dists);
  renderCustodyAccounts();
  notify('🗑️ '+t('تم حذف التحويل'));
}

function _custDoTransfer(fromEmpId, fromEmpName, btn) {
  var toSel=document.getElementById('custTF_toEmp');
  var toEmpId=toSel.value;
  if(!toEmpId) { notify(t('اختر الموظف'),'error'); return; }
  var toEmpName=toSel.options[toSel.selectedIndex].getAttribute('data-name')||toSel.options[toSel.selectedIndex].text;
  var amount=Number(document.getElementById('custTF_amount').value);
  if(!amount||amount<=0) { notify(t('أدخل مبلغ صحيح'),'error'); return; }
  var reason=(document.getElementById('custTF_reason').value||'').trim();
  var today=new Date().toISOString().split('T')[0];

  var dists=custLoadDist();
  var fromDist=dists.find(function(d){return d.employeeId===fromEmpId && !d.settled;});
  var custodyId=fromDist?fromDist.custodyId:(dists.length?dists[0].custodyId:null);

  // ⛔ ما نسوي تسوية — بس نسجل التحويل كتوزيع فرعي تحت الموظف الأصلي
  // التوزيع الجديد مرتبط بالموظف الأصلي عبر parentEmpId
  dists.unshift({
    id:'cdist_'+Date.now(),
    custodyId:custodyId,
    employeeId:toEmpId, employeeName:toEmpName,
    parentEmpId:fromEmpId, parentEmpName:fromEmpName,  // مرتبط بالموظف الأصلي
    amount:amount, date:today,
    reason:t('تحويل من')+' '+fromEmpName+(reason?' — '+reason:''),
    settled:false, createdAt:new Date().toISOString(), isTransfer:true
  });
  custSaveDist(dists);

  btn.closest('.modal-bg').remove();
  renderCustodyAccounts();
  notify('✅ '+t('تم تحويل')+' '+_custFmt(amount)+' '+t('ريال')+' '+t('من')+' '+fromEmpName+' '+t('إلى')+' '+toEmpName);
}
