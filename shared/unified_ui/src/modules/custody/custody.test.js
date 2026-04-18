/* ============================================================
   NouRion — custody.test.js
   ============================================================ */

var L = (typeof require !== 'undefined')
  ? require('./custody.logic.js')
  : window.NouRion.CustodyLogic;

var passed = 0, failed = 0, failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log('  ✔ ' + name); }
  catch (e) { failed++; failures.push({ name: name, error: e.message }); console.log('  ✘ ' + name + '\n     → ' + e.message); }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' expected=' + JSON.stringify(b) + ' actual=' + JSON.stringify(a)); }
function truthy(v, msg) { if (!v) throw new Error(msg || 'expected truthy, got ' + JSON.stringify(v)); }
function falsy(v, msg) { if (v) throw new Error(msg || 'expected falsy, got ' + JSON.stringify(v)); }
function group(n, fn) { console.log('\n── ' + n + ' ──'); fn(); }

// ============================================================
// Sample data
// ============================================================
var RECORDS = [
  { id: 'r1', amount: 100000, date: '2026-04-01', source: 'بنك الراجحي' },
  { id: 'r2', amount: 50000,  date: '2026-04-15', source: 'بنك الأهلي'   }
];

var DISTS = [
  // Main distributions (custody handed to employees)
  { id: 'd1', custodyId: 'r1', employeeId: 'e1', employeeName: 'علي',  amount: 30000, isTransfer: false },
  { id: 'd2', custodyId: 'r1', employeeId: 'e2', employeeName: 'محمد', amount: 25000, isTransfer: false },
  { id: 'd3', custodyId: 'r2', employeeId: 'e1', employeeName: 'علي',  amount: 15000, isTransfer: false },
  // Transfer: علي gave 5000 to سعد
  { id: 'd4', employeeId: 'e3', employeeName: 'سعد', amount: 5000, isTransfer: true, parentEmpId: 'e1' }
];

var INVOICES = [
  // علي: 8000 settled + 4000 pending
  { id: 'i1', custodyId: 'r1', employeeId: 'e1', distId: 'd1', amount: 8000, adminSettled: true,  isTransfer: false },
  { id: 'i2', custodyId: 'r1', employeeId: 'e1', distId: 'd1', amount: 4000, adminSettled: false, isTransfer: false },
  // محمد: 10000 settled
  { id: 'i3', custodyId: 'r1', employeeId: 'e2', distId: 'd2', amount: 10000, adminSettled: true, isTransfer: false },
  // سعد (الـ transfer من علي): 2000 pending
  { id: 'i4', employeeId: 'e3', distId: 'd4', amount: 2000, adminSettled: false, isTransfer: false },
  // فاتورة مرفوضة لـ محمد
  { id: 'i5', custodyId: 'r1', employeeId: 'e2', distId: 'd2', amount: 1500, rejected: true, isTransfer: false }
];


// ============================================================
group('computeCustodyTotals', function () {
  test('record r1 totals', function () {
    var t = L.computeCustodyTotals('r1', DISTS, INVOICES);
    eq(t.distributed, 30000 + 25000); // d1 + d2
    eq(t.settled, 8000 + 10000);      // i1 + i3
    eq(t.pending, 4000 + 1500);       // i2 + rejected counts as not adminSettled
  });

  test('record r2 totals', function () {
    var t = L.computeCustodyTotals('r2', DISTS, INVOICES);
    eq(t.distributed, 15000); // d3
    eq(t.settled, 0);
    eq(t.pending, 0);
  });

  test('unknown id → zeros', function () {
    var t = L.computeCustodyTotals('rX', DISTS, INVOICES);
    eq(t.distributed, 0);
  });

  test('null safety', function () {
    var t = L.computeCustodyTotals('', null, null);
    eq(t.distributed, 0);
  });

  test('transfers excluded from main totals', function () {
    var t = L.computeCustodyTotals('r1', DISTS, INVOICES);
    // d4 is a transfer — must NOT be counted
    eq(t.distributed, 55000);
    truthy(t.distributed !== 60000);
  });
});


// ============================================================
group('computeRecordRemaining', function () {
  test('r1: 100k − 55k = 45k', function () {
    eq(L.computeRecordRemaining(RECORDS[0], DISTS), 45000);
  });

  test('r2: 50k − 15k = 35k', function () {
    eq(L.computeRecordRemaining(RECORDS[1], DISTS), 35000);
  });

  test('null record', function () {
    eq(L.computeRecordRemaining(null, DISTS), 0);
  });
});


// ============================================================
group('computeDistRemaining', function () {
  test('d1 = 30k − 12k (i1+i2) = 18k', function () {
    eq(L.computeDistRemaining(DISTS[0], INVOICES), 18000);
  });

  test('d2 = 25k − 11.5k (i3+i5) = 13.5k', function () {
    // Note: i5 is rejected but still has amount → still subtracted (per original logic)
    eq(L.computeDistRemaining(DISTS[1], INVOICES), 25000 - 10000 - 1500);
  });

  test('d3 = 15k − 0 = 15k', function () {
    eq(L.computeDistRemaining(DISTS[2], INVOICES), 15000);
  });

  test('null dist', function () {
    eq(L.computeDistRemaining(null, INVOICES), 0);
  });
});


// ============================================================
group('filterMainDists / filterTransfers', function () {
  test('main dists count', function () {
    eq(L.filterMainDists(DISTS).length, 3);
  });

  test('transfers count', function () {
    eq(L.filterTransfers(DISTS).length, 1);
  });

  test('null safety', function () {
    eq(L.filterMainDists(null).length, 0);
  });
});


// ============================================================
group('buildEmployeeAccountsMap', function () {
  test('builds entry for each main employee', function () {
    var m = L.buildEmployeeAccountsMap(DISTS, INVOICES);
    truthy(m.e1);
    truthy(m.e2);
    // e3 is only a transfer recipient — shouldn't have its own entry
    falsy(m.e3);
  });

  test('e1 totalDist = 30k + 15k = 45k', function () {
    var m = L.buildEmployeeAccountsMap(DISTS, INVOICES);
    eq(m.e1.totalDist, 45000);
  });

  test('e1 totalInvoices includes transfers', function () {
    var m = L.buildEmployeeAccountsMap(DISTS, INVOICES);
    // i1 (8000) + i2 (4000) + i4 (2000 from transfer to سعد) = 14000
    eq(m.e1.totalInvoices, 14000);
  });

  test('e1 has transfers list', function () {
    var m = L.buildEmployeeAccountsMap(DISTS, INVOICES);
    eq(m.e1.transfers.length, 1);
    eq(m.e1.totalTransferred, 5000);
  });

  test('e2 totalInvoices = 10k + 1.5k', function () {
    var m = L.buildEmployeeAccountsMap(DISTS, INVOICES);
    // Both i3 (settled) and i5 (rejected) count toward total invoices
    eq(m.e2.totalInvoices, 11500);
  });

  test('null safety', function () {
    var m = L.buildEmployeeAccountsMap(null, null);
    eq(Object.keys(m).length, 0);
  });
});


// ============================================================
group('computeEmployeeBalance', function () {
  test('e1 balance', function () {
    var m = L.buildEmployeeAccountsMap(DISTS, INVOICES);
    var b = L.computeEmployeeBalance(m.e1);
    eq(b.totalDist, 45000);
    eq(b.totalInvoices, 14000);
    eq(b.remaining, 31000);
    eq(b.percentSpent, Math.round(14000 / 45000 * 100));
  });

  test('null employee', function () {
    var b = L.computeEmployeeBalance(null);
    eq(b.remaining, 0);
    eq(b.percentSpent, 0);
  });

  test('zero distribution', function () {
    var b = L.computeEmployeeBalance({ totalDist: 0, totalInvoices: 0 });
    eq(b.percentSpent, 0);
  });
});


// ============================================================
group('settleInvoice (pure)', function () {
  test('marks adminSettled + clears rejected', function () {
    var inv = { id: 'i', amount: 1000, rejected: true };
    var fixed = new Date(2026, 0, 1);
    var out = L.settleInvoice(inv, fixed);
    eq(out.adminSettled, true);
    eq(out.rejected, false);
    eq(out.adminSettledAt, fixed.toISOString());
  });

  test('non-mutating', function () {
    var inv = { id: 'i', amount: 1000 };
    L.settleInvoice(inv);
    eq(inv.adminSettled, undefined);
  });

  test('null safe', function () {
    eq(L.settleInvoice(null), null);
  });
});


// ============================================================
group('rejectInvoice (pure)', function () {
  test('marks rejected + reason', function () {
    var inv = { id: 'i', amount: 1000, adminSettled: true };
    var out = L.rejectInvoice(inv, 'فاتورة غير صالحة');
    eq(out.rejected, true);
    eq(out.adminSettled, false);
    eq(out.rejectReason, 'فاتورة غير صالحة');
    truthy(out.rejectedAt);
  });

  test('empty reason', function () {
    var out = L.rejectInvoice({ id: 'x' }, '');
    eq(out.rejectReason, '');
  });
});


// ============================================================
group('settleAllInvoicesForEmp', function () {
  test('settles all of e1 (own + transfer recipients)', function () {
    var fixed = new Date(2026, 0, 1);
    var r = L.settleAllInvoicesForEmp('e1', INVOICES, DISTS, fixed);
    // i1 already settled, i2 should now be settled, i4 (سعد transfer) should also be settled
    eq(r.count, 2); // i2 + i4
    var i2 = r.invoices.find(function (v) { return v.id === 'i2'; });
    var i4 = r.invoices.find(function (v) { return v.id === 'i4'; });
    eq(i2.adminSettled, true);
    eq(i4.adminSettled, true);
  });

  test('does not touch other employees', function () {
    var r = L.settleAllInvoicesForEmp('e1', INVOICES, DISTS);
    var i3 = r.invoices.find(function (v) { return v.id === 'i3'; });
    eq(i3.adminSettled, true); // already settled, unchanged
    var i5 = r.invoices.find(function (v) { return v.id === 'i5'; });
    eq(i5.adminSettled, undefined); // belongs to e2 — not touched
  });

  test('null empId', function () {
    var r = L.settleAllInvoicesForEmp(null, INVOICES, DISTS);
    eq(r.count, 0);
  });

  test('non-mutating', function () {
    var beforeI2 = INVOICES.find(function (v) { return v.id === 'i2'; });
    L.settleAllInvoicesForEmp('e1', INVOICES, DISTS);
    eq(beforeI2.adminSettled, false);
  });
});


// ============================================================
group('resolveCurrentUserEmpId', function () {
  var employees = [
    { id: 'e1', name: 'علي' },
    { id: 'e2', name: 'محمد' },
    { id: 'e3', name: 'سعد' }
  ];
  var empMap = L.buildEmployeeAccountsMap(DISTS, INVOICES);

  test('admin → null (no need to resolve)', function () {
    eq(L.resolveCurrentUserEmpId({ isAdmin: true }, employees, empMap), null);
  });

  test('cust_emp_X permission wins', function () {
    var u = { name: 'X', perms: ['cust_emp_e2'] };
    eq(L.resolveCurrentUserEmpId(u, employees, empMap), 'e2');
  });

  test('exact name match', function () {
    var u = { name: 'علي', perms: ['page_custody'] };
    eq(L.resolveCurrentUserEmpId(u, employees, empMap), 'e1');
  });

  test('substring name match', function () {
    var u = { name: 'علي حسن', perms: [] };
    eq(L.resolveCurrentUserEmpId(u, employees, empMap), 'e1');
  });

  test('no match → null', function () {
    var u = { name: 'مجهول', perms: [] };
    eq(L.resolveCurrentUserEmpId(u, employees, empMap), null);
  });

  test('null user', function () {
    eq(L.resolveCurrentUserEmpId(null), null);
  });
});


// ============================================================
group('computeNotepadCalc', function () {
  test('simple sum', function () {
    var r = L.computeNotepadCalc('100\n200\n300');
    eq(r.results.length, 3);
    eq(r.total, 600);
  });

  test('arithmetic expressions', function () {
    var r = L.computeNotepadCalc('100+50\n200*2\n1000/4');
    eq(r.results.length, 3);
    eq(r.total, 150 + 400 + 250);
  });

  test('skips text-only lines', function () {
    var r = L.computeNotepadCalc('شراء قهوة\n50\nنقل\n100');
    eq(r.results.length, 2);
    eq(r.total, 150);
  });

  test('empty input', function () {
    eq(L.computeNotepadCalc('').total, 0);
    eq(L.computeNotepadCalc(null).total, 0);
  });

  test('handles commas in numbers', function () {
    var r = L.computeNotepadCalc('1,200\n3,500');
    eq(r.results.length, 2);
    eq(r.total, 4700);
  });
});


// ============================================================
group('computeGlobalSummary', function () {
  test('aggregates everything', function () {
    var s = L.computeGlobalSummary(RECORDS, DISTS, INVOICES);
    eq(s.totalReceived, 150000);     // r1 + r2
    eq(s.totalDistributed, 70000);   // d1 + d2 + d3 (no transfers)
    eq(s.remaining, 80000);
    eq(s.recordsCount, 2);
    eq(s.employeeCount, 2);          // e1 + e2 (e3 is transfer-only)
    eq(s.invoicesSettled, 2);        // i1 + i3
    eq(s.invoicesPending, 2);        // i2 + i4
    eq(s.invoicesRejected, 1);       // i5
  });

  test('null safe', function () {
    var s = L.computeGlobalSummary(null, null, null);
    eq(s.totalReceived, 0);
    eq(s.recordsCount, 0);
  });
});


// ============================================================
console.log('\n════════════════════════════════════════');
console.log('  NouRion — custody.logic.js test results');
console.log('════════════════════════════════════════');
console.log('  ✔ passed: ' + passed);
console.log('  ✘ failed: ' + failed);
if (failed > 0) {
  console.log('\nFailures:');
  failures.forEach(function (f) { console.log('  - ' + f.name + '\n    ' + f.error); });
  if (typeof process !== 'undefined') process.exit(1);
} else {
  console.log('\n  ✓ All tests passed.\n');
}
