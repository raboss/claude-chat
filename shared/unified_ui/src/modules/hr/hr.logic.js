/* ============================================================
   NouRion — modules/hr/hr.logic.js
   ------------------------------------------------------------
   Pure logic for the HR module: employees, org chart, salary, attendance.
   NO DOM, NO localStorage.

   🚫 القاعدة الحمراء:
   كل الحسابات منقولة حرفياً من pm_server/public/js/15-hr.js.
   الرواتب وحساب الحضور حسّاسة جداً — أي تغيير يحتاج موافقة صريحة.

   المصادر:
   - HR_DEFAULT_DEPTS         → 15-hr.js:6
   - isManager                → 15-hr.js:51, 69
   - salary row math          → 15-hr.js:702-706
   - salary row schema        → 15-hr.js:668
   - attendance toggle cycle  → 15-hr.js:1029-1037
   - attendance total         → 15-hr.js:983-991
   - sync rows logic          → 15-hr.js:679-690 (salary), 928-958 (attendance)
   ============================================================ */

(function (global) {
  'use strict';

  // ==========================================================
  // 1. HR_DEFAULT_DEPTS — منقول حرفياً من 15-hr.js:6
  // ==========================================================
  var HR_DEFAULT_DEPTS = [
    { id: 'dept_mgmt',       name: 'إدارة المصنع',  parentId: null,             icon: '🏭', color: '#1a3a5c', order: 0 },
    { id: 'dept_production', name: 'إدارة الإنتاج', parentId: 'dept_mgmt',       icon: '⚙️', color: '#16a34a', order: 1 },
    { id: 'dept_technical',  name: 'المكتب الفني',  parentId: 'dept_mgmt',       icon: '📐', color: '#2563eb', order: 2 },
    { id: 'dept_followup',   name: 'قسم المتابعة',  parentId: 'dept_mgmt',       icon: '📋', color: '#d97706', order: 3 },
    { id: 'dept_install',    name: 'قسم التركيبات', parentId: 'dept_mgmt',       icon: '🔨', color: '#dc2626', order: 4 },
    { id: 'dept_hall',       name: 'صالة الإنتاج',  parentId: 'dept_production', icon: '🏭', color: '#15803d', order: 5 },
    { id: 'dept_cutting',    name: 'قسم القص',      parentId: 'dept_hall',       icon: '🪚', color: '#be185d', order: 6 },
    { id: 'dept_milling',    name: 'قسم التفريز',   parentId: 'dept_hall',       icon: '🔧', color: '#7c3aed', order: 7 },
    { id: 'dept_assembly',   name: 'قسم التجميع',   parentId: 'dept_hall',       icon: '🔩', color: '#65a30d', order: 8 }
  ];

  function getDefaultDepts() {
    return HR_DEFAULT_DEPTS.map(function (d) {
      return Object.assign({}, d);
    });
  }

  // ==========================================================
  // 2. isManager — منقول حرفياً من 15-hr.js:51, 69
  //    دور المدير = يحتوي على "مدير" أو "رئيس" أو "مشرف"
  // ==========================================================
  function isManager(employee) {
    if (!employee || !employee.role) return false;
    var r = employee.role;
    return r.indexOf('مدير') > -1 || r.indexOf('رئيس') > -1 || r.indexOf('مشرف') > -1;
  }

  // ==========================================================
  // 3. filterActiveEmployees — pure helper مستخدم في كل أنحاء hr.js
  // ==========================================================
  function filterActiveEmployees(employees) {
    if (!employees) return [];
    return employees.filter(function (e) { return e.status !== 'terminated'; });
  }

  // ==========================================================
  // 4. groupEmployeesByDept — للهيكل التنظيمي
  //    منقول من 15-hr.js:72 (داخل buildNode)
  // ==========================================================
  function groupEmployeesByDept(employees, deptId) {
    return filterActiveEmployees(employees).filter(function (e) { return e.departmentId === deptId; });
  }

  // ==========================================================
  // 5. buildDeptTree — يحوّل قائمة مسطّحة إلى شجرة
  //    مستخرج من نمط 15-hr.js:75 (childDepts filter)
  // ==========================================================
  function buildDeptTree(depts) {
    if (!depts || !depts.length) return [];
    var sorted = depts.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    var byId = {};
    sorted.forEach(function (d) { byId[d.id] = Object.assign({}, d, { children: [] }); });
    var roots = [];
    sorted.forEach(function (d) {
      if (d.parentId && byId[d.parentId]) byId[d.parentId].children.push(byId[d.id]);
      else roots.push(byId[d.id]);
    });
    return roots;
  }

  // ==========================================================
  // 6. countDeptStats — احصاءات قسم (إجمالي + مدراء + عمال)
  // ==========================================================
  function countDeptStats(employees, deptId) {
    var deptEmps = groupEmployeesByDept(employees, deptId);
    var managers = deptEmps.filter(isManager);
    var staff    = deptEmps.filter(function (e) { return !isManager(e); });
    return {
      total:    deptEmps.length,
      managers: managers.length,
      staff:    staff.length
    };
  }

  // ==========================================================
  // 7. SALARY ROW — منقول حرفياً من 15-hr.js:668
  //    حقول الراتب الأساسية
  // ==========================================================
  function createEmptySalaryRow(employee) {
    if (!employee) return null;
    return {
      empId:       employee.id,
      name:        employee.name,
      iqama:       employee.iqama || '',
      job:         employee.role  || '',
      sponsor:     '',
      days:        30,
      basic:       0,
      housing:     0,
      other:       0,
      deductions:  0,
      debts:       0,
      adjustments: 0,
      notes:       ''
    };
  }

  // ==========================================================
  // 8. computeSalaryRow — حساب الإجمالي والصافي والمستحق
  //    منقول حرفياً من 15-hr.js:702-706
  //    ⚠ هذه أهمّ معادلة في الـ HR — لا تُمسّ
  // ==========================================================
  function computeSalaryRow(row) {
    if (!row) return { gross: 0, net: 0, due: 0 };
    var basic   = row.basic   || 0;
    var housing = row.housing || 0;
    var other   = row.other   || 0;
    var days    = row.days    || 30;
    var debts   = row.debts   || 0;
    var adj     = row.adjustments || 0;

    // gross = (basic + housing + other) / 30 × days
    var gross = (basic + housing + other) / 30 * days;
    // net = gross − debts
    var net   = gross - debts;
    // due = net − adjustments
    var due   = net - adj;

    return {
      basic:   basic,
      housing: housing,
      other:   other,
      gross:   gross,
      net:     net,
      due:     due
    };
  }

  // ==========================================================
  // 9. computeSalaryTotals — مجموع شامل لشهر
  //    منقول من 15-hr.js:701-706 (totals object)
  // ==========================================================
  function computeSalaryTotals(rows) {
    var totals = { basic: 0, housing: 0, other: 0, gross: 0, net: 0, due: 0 };
    if (!rows) return totals;
    rows.forEach(function (r) {
      var c = computeSalaryRow(r);
      totals.basic   += c.basic;
      totals.housing += c.housing;
      totals.other   += c.other;
      totals.gross   += c.gross;
      totals.net     += c.net;
      totals.due     += c.due;
    });
    return totals;
  }

  // ==========================================================
  // 10. syncRowsWithEmployees — لربط جدول رواتب/حضور بقائمة الموظفين
  //     منقول حرفياً من 15-hr.js:679-690 (المنطق نفسه في الحضور 928-958)
  //     - يحذف الموظفين المحذوفين من الجدول
  //     - يُضيف الموظفين الجدد
  //     - يستخدم empId أو name كمفتاح (للتعامل مع البيانات القديمة)
  // ==========================================================
  function syncRowsWithEmployees(existingRows, activeEmployees, makeEmptyRow) {
    if (!makeEmptyRow) makeEmptyRow = createEmptySalaryRow;
    var rows = (existingRows || []).slice();
    var active = activeEmployees || [];

    var activeIds = {};
    var activeNames = {};
    active.forEach(function (e) {
      activeIds[e.id] = true;
      activeNames[e.name] = true;
    });

    // 1. حذف غير النشطين
    var filtered = rows.filter(function (r) {
      return activeIds[r.empId] || activeNames[r.name];
    });
    var changed = filtered.length !== rows.length;

    // 2. إضافة الجدد
    var existIds = {};
    var existNames = {};
    filtered.forEach(function (r) {
      existIds[r.empId] = true;
      existNames[r.name] = true;
    });
    active.forEach(function (e) {
      if (!existIds[e.id] && !existNames[e.name]) {
        filtered.push(makeEmptyRow(e));
        changed = true;
      }
    });

    return { rows: filtered, changed: changed };
  }

  // ==========================================================
  // 11. ATTENDANCE — toggle cell cycle
  //     منقول حرفياً من 15-hr.js:1032-1037
  //     Cycle: '' → '1' (حاضر) → 'L' (تأخر) → 'X' (غياب) → ''
  // ==========================================================
  function toggleAttendanceCell(currentValue) {
    var cur = currentValue || '';
    if (cur === '')  return '1';
    if (cur === '1') return 'L';
    if (cur === 'L') return 'X';
    return '';
  }

  // ==========================================================
  // 12. computeAttendanceTotal — حساب إجمالي أيام الحضور لصف
  //     منقول حرفياً من 15-hr.js:983-991
  //     قاعدة: حاضر/تأخر = 1، تأخر = -0.5 → يصبح 0.5
  // ==========================================================
  function computeAttendanceTotal(daysObj) {
    if (!daysObj) return 0;
    var total = 0;
    Object.keys(daysObj).forEach(function (k) {
      var v = daysObj[k];
      var present = v === '1';
      var late    = v === 'L';
      if (present || late) total++;
      if (late) total -= 0.5;
    });
    return total;
  }

  // ==========================================================
  // 13. createEmptyAttendanceRow — منقول من 15-hr.js:923
  // ==========================================================
  function createEmptyAttendanceRow(employee) {
    if (!employee) return null;
    return {
      empId:  employee.id,
      name:   employee.name,
      nameEn: employee.nameEn || '',
      iqama:  employee.iqama  || '',
      days:   {}
    };
  }

  // ==========================================================
  // 14. Date helpers (pure utilities)
  // ==========================================================
  function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function isFriday(year, month, day) {
    return new Date(year, month - 1, day).getDay() === 5;
  }

  function parseMonthKey(monthKey) {
    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return null;
    var parts = monthKey.split('-');
    return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) };
  }

  function formatMonthKey(date) {
    var d = date || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  // ==========================================================
  // 15. Month names (Arabic)
  // ==========================================================
  var MONTH_NAMES_AR = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  var DAY_NAMES_AR = ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

  function formatMonthLabel(monthKey) {
    var p = parseMonthKey(monthKey);
    if (!p) return '';
    return MONTH_NAMES_AR[p.month - 1] + ' ' + p.year;
  }

  // ==========================================================
  // 16. computeAttendanceMonthSummary — احصاءات شهرية شاملة
  // ==========================================================
  function computeAttendanceMonthSummary(rows, year, month) {
    if (!rows) return { totalEmployees: 0, daysInMonth: 0, totalPresent: 0, totalLate: 0, totalAbsent: 0 };
    var daysInMonth = getDaysInMonth(year, month);
    var totalPresent = 0, totalLate = 0, totalAbsent = 0;
    rows.forEach(function (r) {
      var days = r.days || {};
      Object.keys(days).forEach(function (d) {
        var v = days[d];
        if (v === '1') totalPresent++;
        else if (v === 'L') totalLate++;
        else if (v === 'X') totalAbsent++;
      });
    });
    return {
      totalEmployees: rows.length,
      daysInMonth:    daysInMonth,
      totalPresent:   totalPresent,
      totalLate:      totalLate,
      totalAbsent:    totalAbsent
    };
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================
  var api = {
    // Constants
    HR_DEFAULT_DEPTS:     HR_DEFAULT_DEPTS,
    MONTH_NAMES_AR:       MONTH_NAMES_AR,
    DAY_NAMES_AR:         DAY_NAMES_AR,
    // Defaults / accessors
    getDefaultDepts:      getDefaultDepts,
    // Employee helpers
    isManager:            isManager,
    filterActiveEmployees:filterActiveEmployees,
    groupEmployeesByDept: groupEmployeesByDept,
    countDeptStats:       countDeptStats,
    // Org chart
    buildDeptTree:        buildDeptTree,
    // Salary
    createEmptySalaryRow: createEmptySalaryRow,
    computeSalaryRow:     computeSalaryRow,
    computeSalaryTotals:  computeSalaryTotals,
    // Attendance
    createEmptyAttendanceRow:    createEmptyAttendanceRow,
    toggleAttendanceCell:        toggleAttendanceCell,
    computeAttendanceTotal:      computeAttendanceTotal,
    computeAttendanceMonthSummary: computeAttendanceMonthSummary,
    // Sync logic
    syncRowsWithEmployees: syncRowsWithEmployees,
    // Date utilities
    getDaysInMonth:       getDaysInMonth,
    isFriday:             isFriday,
    parseMonthKey:        parseMonthKey,
    formatMonthKey:       formatMonthKey,
    formatMonthLabel:     formatMonthLabel
  };

  global.NouRion = global.NouRion || {};
  global.NouRion.HrLogic = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
