/* ============================================================
   NouRion — modules/custody/custody.logic.js
   ------------------------------------------------------------
   Pure logic for the Custody module (financial trust accounts).
   NO DOM, NO localStorage, NO prompts.

   🚫 القاعدة الحمراء:
   كل الحسابات منقولة حرفياً من pm_server/public/js/19-custody.js.
   هذه أكثر الـ modules حساسية مالياً — لا تُمسّ أرقام أو شروط.

   المصادر:
   - _custCalcTotals               → 19-custody.js:15
   - records / dist / invoice schemas
   - main vs transfer distinction  → 19-custody.js:17 (`!d.isTransfer`)
   - employee aggregation          → 19-custody.js:1393-1418 (renderCustodyAccounts)
   - settle / reject invoice       → 19-custody.js:1664, 1676
   - settle all invoices for emp   → 19-custody.js:1692
   - distribution remaining        → 19-custody.js:1737-1740
   - resolve user → empId          → 19-custody.js:1426-1450

   Concepts:
   - **record**: عهدة أصلية مستلمة (e.g. cash withdrawal from bank)
   - **dist** (distribution): توزيع جزء من العهدة لموظف
   - **transfer**: نقل من موظف إلى آخر (sub-distribution, isTransfer=true)
   - **invoice**: مصروف موثَّق بفاتورة، قد يكون pending/settled/rejected
   ============================================================ */

(function (global) {
  'use strict';

  // ==========================================================
  // 1. computeCustodyTotals — حساب إجماليات عهدة واحدة
  //    منقول حرفياً من 19-custody.js:15-24
  // ==========================================================
  function computeCustodyTotals(custId, allDists, allInvoices) {
    if (!custId) return { distributed: 0, settled: 0, pending: 0 };

    var dists = (allDists || []).filter(function (d) {
      return d.custodyId === custId && !d.isTransfer;
    });
    var invs = (allInvoices || []).filter(function (v) {
      return v.custodyId === custId && !v.isTransfer;
    });

    var totalDist = dists.reduce(function (s, d) { return s + (Number(d.amount) || 0); }, 0);
    // المسوّى = فقط الفواتير يالي المدير أكّدها
    var totalSettled = invs
      .filter(function (v) { return v.adminSettled; })
      .reduce(function (s, v) { return s + (Number(v.amount) || 0); }, 0);
    var totalPending = invs
      .filter(function (v) { return !v.adminSettled; })
      .reduce(function (s, v) { return s + (Number(v.amount) || 0); }, 0);

    return { distributed: totalDist, settled: totalSettled, pending: totalPending };
  }

  // ==========================================================
  // 2. computeRecordRemaining — المتبقّي في عهدة أصلية
  //    record.amount − sum(distributions)
  // ==========================================================
  function computeRecordRemaining(record, allDists) {
    if (!record) return 0;
    var totals = computeCustodyTotals(record.id, allDists, []);
    return (Number(record.amount) || 0) - totals.distributed;
  }

  // ==========================================================
  // 3. computeDistRemaining — المتبقّي على توزيعة موظف
  //    منقول من 19-custody.js:1737-1740
  // ==========================================================
  function computeDistRemaining(dist, allInvoices) {
    if (!dist) return 0;
    var invs = (allInvoices || []).filter(function (v) {
      return v.distId === dist.id && !v.isTransfer;
    });
    var spent = invs.reduce(function (s, v) { return s + (Number(v.amount) || 0); }, 0);
    return (Number(dist.amount) || 0) - spent;
  }

  // ==========================================================
  // 4. filterMainDists / filterTransfers — فصل الـ main عن الـ transfers
  //    منقول من 19-custody.js:1389-1391
  // ==========================================================
  function filterMainDists(allDists) {
    if (!allDists) return [];
    return allDists.filter(function (d) { return !d.isTransfer; });
  }

  function filterTransfers(allDists) {
    if (!allDists) return [];
    return allDists.filter(function (d) { return d.isTransfer; });
  }

  // ==========================================================
  // 5. computeEmployeeAccount — حساب شامل لموظف واحد
  //    منقول من 19-custody.js:1393-1418
  // ==========================================================
  function computeEmployeeAccount(empId, allDists, allInvoices) {
    if (!empId) return null;
    var mainDists = filterMainDists(allDists);
    var subTransfers = filterTransfers(allDists);

    var myDists = mainDists.filter(function (d) { return d.employeeId === empId; });
    if (!myDists.length) {
      // قد يكون الموظف مجرد متلقّي تحويلات بدون عهدة مباشرة
      var asReceiver = mainDists.filter(function (d) { return d.employeeId === empId; });
      if (!asReceiver.length) {
        // ابن من التحويلات فقط
      }
    }

    var emp = {
      id:               empId,
      name:             myDists[0] ? myDists[0].employeeName : '',
      totalDist:        0,
      totalInvoices:    0,
      totalTransferred: 0,
      dists:            myDists,
      transfers:        []
    };

    myDists.forEach(function (d) {
      emp.totalDist += Number(d.amount) || 0;
    });

    // التحويلات الصادرة من هذا الموظف (هو المرسِل)
    var myTransfers = subTransfers.filter(function (tr) { return tr.parentEmpId === empId; });
    emp.transfers = myTransfers;
    myTransfers.forEach(function (tr) {
      emp.totalTransferred += Number(tr.amount) || 0;
    });

    // الفواتير المباشرة
    var myInvs = (allInvoices || []).filter(function (v) {
      return !v.isTransfer && (v.employeeId === empId || myDists.some(function (d) { return d.id === v.distId; }));
    });
    emp.totalInvoices = myInvs.reduce(function (s, v) { return s + (Number(v.amount) || 0); }, 0);

    // فواتير المحوّل لهم تُحسب كذلك على هذا الموظف
    myTransfers.forEach(function (tr) {
      var trInvs = (allInvoices || []).filter(function (v) {
        return !v.isTransfer && (v.employeeId === tr.employeeId || v.distId === tr.id);
      });
      emp.totalInvoices += trInvs.reduce(function (s, v) { return s + (Number(v.amount) || 0); }, 0);
    });

    return emp;
  }

  // ==========================================================
  // 6. buildEmployeeAccountsMap — كل الموظفين دفعة واحدة
  //    منقول حرفياً من 19-custody.js:1393-1418
  // ==========================================================
  function buildEmployeeAccountsMap(allDists, allInvoices) {
    var mainDists = filterMainDists(allDists);
    var subTransfers = filterTransfers(allDists);

    var empMap = {};
    mainDists.forEach(function (d) {
      var eid = d.employeeId;
      if (!empMap[eid]) {
        empMap[eid] = {
          id:               d.employeeId,
          name:             d.employeeName,
          totalDist:        0,
          totalInvoices:    0,
          totalTransferred: 0,
          dists:            [],
          transfers:        []
        };
      }
      empMap[eid].totalDist += Number(d.amount) || 0;
      empMap[eid].dists.push(d);
    });

    // أضف التحويلات
    subTransfers.forEach(function (tr) {
      if (empMap[tr.parentEmpId]) {
        empMap[tr.parentEmpId].transfers.push(tr);
        empMap[tr.parentEmpId].totalTransferred += Number(tr.amount) || 0;
      }
    });

    // احسب الفواتير
    Object.keys(empMap).forEach(function (eid) {
      var emp = empMap[eid];
      var myInvs = (allInvoices || []).filter(function (v) {
        return !v.isTransfer && (v.employeeId === eid || emp.dists.some(function (d) { return d.id === v.distId; }));
      });
      emp.totalInvoices = myInvs.reduce(function (s, v) { return s + (Number(v.amount) || 0); }, 0);
      emp.transfers.forEach(function (tr) {
        var trInvs = (allInvoices || []).filter(function (v) {
          return !v.isTransfer && (v.employeeId === tr.employeeId || v.distId === tr.id);
        });
        emp.totalInvoices += trInvs.reduce(function (s, v) { return s + (Number(v.amount) || 0); }, 0);
      });
    });

    return empMap;
  }

  // ==========================================================
  // 7. computeEmployeeBalance — رصيد موظف بعد كل العمليات
  //    rem = totalDist − totalInvoices
  // ==========================================================
  function computeEmployeeBalance(emp) {
    if (!emp) return { totalDist: 0, totalInvoices: 0, remaining: 0, percentSpent: 0 };
    var totalDist = emp.totalDist || 0;
    var totalInvoices = emp.totalInvoices || 0;
    var remaining = totalDist - totalInvoices;
    var pct = totalDist > 0 ? Math.round(totalInvoices / totalDist * 100) : 0;
    return {
      totalDist:    totalDist,
      totalInvoices:totalInvoices,
      remaining:    remaining,
      percentSpent: pct
    };
  }

  // ==========================================================
  // 8. settleInvoice — pure: returns updated invoice
  //    منقول من 19-custody.js:1664-1674
  // ==========================================================
  function settleInvoice(invoice, dateNow) {
    if (!invoice) return null;
    var out = Object.assign({}, invoice);
    out.adminSettled = true;
    out.rejected = false;
    out.adminSettledAt = (dateNow || new Date()).toISOString();
    return out;
  }

  // ==========================================================
  // 9. rejectInvoice — pure: returns updated invoice
  //    منقول من 19-custody.js:1676-1689
  // ==========================================================
  function rejectInvoice(invoice, reason, dateNow) {
    if (!invoice) return null;
    var out = Object.assign({}, invoice);
    out.rejected = true;
    out.adminSettled = false;
    out.rejectReason = reason || '';
    out.rejectedAt = (dateNow || new Date()).toISOString();
    return out;
  }

  // ==========================================================
  // 10. settleAllInvoicesForEmp — pure version
  //     منقول من 19-custody.js:1692-1708
  //     تُرجع { invoices, count } — invoices المحدّثة
  // ==========================================================
  function settleAllInvoicesForEmp(empId, allInvoices, allDists, dateNow) {
    if (!empId) return { invoices: allInvoices || [], count: 0 };
    var mainDists  = filterMainDists(allDists).filter(function (d) { return d.employeeId === empId; });
    var transfers  = filterTransfers(allDists).filter(function (d) { return d.parentEmpId === empId; });
    var nowIso     = (dateNow || new Date()).toISOString();
    var count      = 0;

    var out = (allInvoices || []).map(function (v) {
      if (v.adminSettled) return v;
      var isMyInv  = v.employeeId === empId || mainDists.some(function (d) { return d.id === v.distId; });
      var isSubInv = transfers.some(function (tr) { return v.employeeId === tr.employeeId || v.distId === tr.id; });
      if (isMyInv || isSubInv) {
        count++;
        return Object.assign({}, v, { adminSettled: true, adminSettledAt: nowIso });
      }
      return v;
    });

    return { invoices: out, count: count };
  }

  // ==========================================================
  // 11. resolveCurrentUserEmpId — منقول من 19-custody.js:1426-1450
  //     يحدّد أيّ employeeId هو المستخدم الحالي:
  //     1. شيك صلاحية cust_emp_<id> (أدق)
  //     2. مطابقة بالاسم
  //     3. fallback: substring match
  // ==========================================================
  function resolveCurrentUserEmpId(user, employees, empMap) {
    if (!user || user.isAdmin) return null;
    if (!employees) employees = [];
    if (!empMap) empMap = {};

    var perms = user.perms || [];

    // 1. شيك cust_emp_*
    for (var i = 0; i < perms.length; i++) {
      var p = perms[i];
      if (p.indexOf('cust_emp_') === 0) {
        var eid = p.substring(9);
        if (empMap[eid]) return eid;
      }
    }

    // 2. مطابقة بالاسم في employees → ثم في empMap
    var cuName = (user.name || '').trim();
    if (cuName) {
      var emp = employees.find(function (e) { return e.name === cuName; });
      if (!emp) {
        emp = employees.find(function (e) {
          return e.name && cuName && (e.name.indexOf(cuName) > -1 || cuName.indexOf(e.name) > -1);
        });
      }
      if (emp && empMap[emp.id]) return emp.id;
    }

    // 3. مطابقة بالاسم مباشرة في empMap
    var keys = Object.keys(empMap);
    for (var k = 0; k < keys.length; k++) {
      var emp2 = empMap[keys[k]];
      if (emp2.name === cuName) return keys[k];
      if (emp2.name && cuName && (emp2.name.indexOf(cuName) > -1 || cuName.indexOf(emp2.name) > -1)) {
        return keys[k];
      }
    }

    return null;
  }

  // ==========================================================
  // 12. computeNotepadCalc — حساب النوتباد (الأسطر العددية)
  //     منقول من 19-custody.js:1647-1660
  //     ⚠ الأصل يستخدم Function() لتقييم الأسطر — نسخة آمنة فقط للأرقام
  // ==========================================================
  function computeNotepadCalc(text) {
    if (!text || typeof text !== 'string') return { results: [], total: 0 };
    var lines = text.split('\n').filter(function (l) { return l.trim(); });
    var results = [];
    lines.forEach(function (line) {
      var clean = line.replace(/[^\d+\-*/().٫٬,\s]/g, '').replace(/,/g, '').trim();
      if (!clean || !/[\d]/.test(clean)) return;
      // Safe-evaluate: فقط +, -, *, /, (, )
      // النسخة الأصل تستخدم Function() لكن نحن نُقيّد الإدخال لبيانات pure
      try {
        // eslint-disable-next-line no-new-func
        var val = Function('"use strict";return(' + clean + ')')();
        if (typeof val === 'number' && isFinite(val)) {
          results.push({ line: line.trim(), val: val });
        }
      } catch (e) { /* ignore */ }
    });
    var total = results.reduce(function (s, r) { return s + r.val; }, 0);
    return { results: results, total: total };
  }

  // ==========================================================
  // 13. computeGlobalSummary — ملخّص شامل لكل العهد
  // ==========================================================
  function computeGlobalSummary(records, allDists, allInvoices) {
    var rec = records || [];
    var dists = allDists || [];
    var invs = allInvoices || [];

    var totalReceived = rec.reduce(function (s, r) { return s + (Number(r.amount) || 0); }, 0);
    var mainD = filterMainDists(dists);
    var totalDistributed = mainD.reduce(function (s, d) { return s + (Number(d.amount) || 0); }, 0);
    var settled = invs.filter(function (v) { return !v.isTransfer && v.adminSettled; });
    var pending = invs.filter(function (v) { return !v.isTransfer && !v.adminSettled && !v.rejected; });
    var rejected = invs.filter(function (v) { return !v.isTransfer && v.rejected; });

    var totalSettled = settled.reduce(function (s, v) { return s + (Number(v.amount) || 0); }, 0);
    var totalPending = pending.reduce(function (s, v) { return s + (Number(v.amount) || 0); }, 0);
    var totalRejected = rejected.reduce(function (s, v) { return s + (Number(v.amount) || 0); }, 0);

    var employeeCount = Object.keys(buildEmployeeAccountsMap(dists, invs)).length;

    return {
      totalReceived:    totalReceived,
      totalDistributed: totalDistributed,
      totalSettled:     totalSettled,
      totalPending:     totalPending,
      totalRejected:    totalRejected,
      remaining:        totalReceived - totalDistributed,
      employeeCount:    employeeCount,
      recordsCount:     rec.length,
      invoicesSettled:  settled.length,
      invoicesPending:  pending.length,
      invoicesRejected: rejected.length
    };
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================
  var api = {
    // Per-record/dist totals
    computeCustodyTotals:    computeCustodyTotals,
    computeRecordRemaining:  computeRecordRemaining,
    computeDistRemaining:    computeDistRemaining,
    // Filters
    filterMainDists:         filterMainDists,
    filterTransfers:         filterTransfers,
    // Employee aggregation
    computeEmployeeAccount:  computeEmployeeAccount,
    buildEmployeeAccountsMap:buildEmployeeAccountsMap,
    computeEmployeeBalance:  computeEmployeeBalance,
    // Invoice operations (pure)
    settleInvoice:           settleInvoice,
    rejectInvoice:           rejectInvoice,
    settleAllInvoicesForEmp: settleAllInvoicesForEmp,
    // User → emp resolution
    resolveCurrentUserEmpId: resolveCurrentUserEmpId,
    // Helpers
    computeNotepadCalc:      computeNotepadCalc,
    computeGlobalSummary:    computeGlobalSummary
  };

  global.NouRion = global.NouRion || {};
  global.NouRion.CustodyLogic = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
