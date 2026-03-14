const db = require("../config/db");

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

async function getPayCycleById(payCycleId) {
  const sql = `
    SELECT *
    FROM pay_cycles
    WHERE id = ?
    LIMIT 1
  `;

  return dbGet(sql, [payCycleId]);
}

async function getRegularHolidaysWithinPayCycle(periodStart, periodEnd) {
  const sql = `
    SELECT *
    FROM holidays
    WHERE holiday_type = 'REGULAR'
      AND holiday_date BETWEEN ? AND ?
    ORDER BY holiday_date ASC
  `;

  return dbAll(sql, [periodStart, periodEnd]);
}

async function getAttendanceGroupedByEmployee(periodStart, periodEnd) {
  const sql = `
    SELECT
      attendance_records.employee_id,
      employees.employee_code,
      employees.full_name AS employee_name,
      employees.position,
      employees.department,
      employees.daily_rate,
      employees.hourly_rate,
      COUNT(attendance_records.id) AS attendance_days_count,
      COALESCE(SUM(attendance_records.rendered_hours), 0) AS total_rendered_hours,
      COALESCE(SUM(attendance_records.lunch_break_deduction), 0) AS total_lunch_break_deduction
    FROM attendance_records
    INNER JOIN employees
      ON attendance_records.employee_id = employees.id
    WHERE attendance_records.attendance_date BETWEEN ? AND ?
    GROUP BY
      attendance_records.employee_id,
      employees.employee_code,
      employees.full_name,
      employees.position,
      employees.department,
      employees.daily_rate,
      employees.hourly_rate
    ORDER BY employees.full_name ASC
  `;

  return dbAll(sql, [periodStart, periodEnd]);
}

async function getPayrollApprovalsByPayCycleId(payCycleId) {
  const sql = `
    SELECT *
    FROM payroll_approvals
    WHERE pay_cycle_id = ?
  `;

  const rows = await dbAll(sql, [payCycleId]);
  const map = new Map();

  for (const row of rows) {
    map.set(row.employee_id, row);
  }

  return map;
}

async function getPayrollAdjustmentsByPayCycleId(payCycleId) {
  const sql = `
    SELECT *
    FROM payroll_adjustments
    WHERE pay_cycle_id = ?
    ORDER BY employee_id ASC, id ASC
  `;

  const rows = await dbAll(sql, [payCycleId]);
  const map = new Map();

  for (const row of rows) {
    const employeeId = Number(row.employee_id);

    if (!map.has(employeeId)) {
      map.set(employeeId, {
        allowances: 0,
        deductions: 0,
        rows: []
      });
    }

    const bucket = map.get(employeeId);
    const amount = Number(row.amount || 0);
    const adjustmentType = String(row.adjustment_type || "").toUpperCase();

    if (adjustmentType === "ALLOWANCE") {
      bucket.allowances += amount;
    } else if (adjustmentType === "DEDUCTION") {
      bucket.deductions += amount;
    }

    bucket.rows.push(row);
  }

  return map;
}

async function getEmployeesWhoOnlyNeedHolidayPay(periodStart, periodEnd, holidayCount) {
  if (!holidayCount) {
    return [];
  }

  const sql = `
    SELECT
      employees.id AS employee_id,
      employees.employee_code,
      employees.full_name AS employee_name,
      employees.position,
      employees.department,
      employees.daily_rate,
      employees.hourly_rate
    FROM employees
    WHERE employees.is_active = 1
      AND employees.id NOT IN (
        SELECT DISTINCT attendance_records.employee_id
        FROM attendance_records
        WHERE attendance_records.attendance_date BETWEEN ? AND ?
      )
    ORDER BY employees.full_name ASC
  `;

  return dbAll(sql, [periodStart, periodEnd]);
}

function roundToTwo(value) {
  return Number(Number(value || 0).toFixed(2));
}

async function getPayrollSummaryByPayCycle(payCycleId) {
  const payCycle = await getPayCycleById(payCycleId);

  if (!payCycle) {
    throw new Error("Pay cycle not found.");
  }

  const regularHolidays = await getRegularHolidaysWithinPayCycle(
    payCycle.period_start,
    payCycle.period_end
  );

  const holidayCount = regularHolidays.length;

  const attendanceRows = await getAttendanceGroupedByEmployee(
    payCycle.period_start,
    payCycle.period_end
  );

  const approvalsMap = await getPayrollApprovalsByPayCycleId(payCycle.id);
  const adjustmentsMap = await getPayrollAdjustmentsByPayCycleId(payCycle.id);

  const rows = attendanceRows.map((row) => {
    const totalRenderedHours = Number(row.total_rendered_hours || 0);
    const totalLunchBreakDeduction = Number(row.total_lunch_break_deduction || 0);
    const totalHoursWorked = roundToTwo(totalRenderedHours - totalLunchBreakDeduction);

    const totalBasicPay = roundToTwo(totalHoursWorked * Number(row.hourly_rate || 0));
    const holidayPay = roundToTwo(holidayCount * Number(row.daily_rate || 0));

    const adjustments = adjustmentsMap.get(Number(row.employee_id)) || {
      allowances: 0,
      deductions: 0,
      rows: []
    };

    const allowances = roundToTwo(adjustments.allowances);
    const deductions = roundToTwo(adjustments.deductions);
    const totalSalary = roundToTwo(totalBasicPay + holidayPay + allowances - deductions);

    const approval = approvalsMap.get(row.employee_id);

    return {
      employeeId: row.employee_id,
      employeeCode: row.employee_code || "",
      employeeName: row.employee_name,
      position: row.position || "",
      department: row.department || "",
      dailyRate: roundToTwo(row.daily_rate || 0),
      hourlyRate: roundToTwo(row.hourly_rate || 0),
      payCycleId: payCycle.id,
      payCycleName: payCycle.cycle_name,
      periodStart: payCycle.period_start,
      periodEnd: payCycle.period_end,
      payDate: payCycle.pay_date,
      attendanceDaysCount: Number(row.attendance_days_count || 0),
      totalRenderedHours: roundToTwo(totalRenderedHours),
      totalLunchBreakDeduction: roundToTwo(totalLunchBreakDeduction),
      totalHoursWorked,
      totalBasicPay,
      holidayCount,
      holidayPay,
      allowances,
      deductions,
      totalSalary,
      adjustmentRows: adjustments.rows,
      approvalStatus: approval ? "APPROVED" : "PENDING",
      approvalId: approval?.id || null,
      approvedBy: approval?.approved_by || null,
      approvedAt: approval?.approved_at || null
    };
  });

  const holidayOnlyEmployees = await getEmployeesWhoOnlyNeedHolidayPay(
    payCycle.period_start,
    payCycle.period_end,
    holidayCount
  );

  for (const employee of holidayOnlyEmployees) {
    const approval = approvalsMap.get(employee.employee_id);
    const holidayPay = roundToTwo(holidayCount * Number(employee.daily_rate || 0));

    const adjustments = adjustmentsMap.get(Number(employee.employee_id)) || {
      allowances: 0,
      deductions: 0,
      rows: []
    };

    const allowances = roundToTwo(adjustments.allowances);
    const deductions = roundToTwo(adjustments.deductions);
    const totalSalary = roundToTwo(holidayPay + allowances - deductions);

    rows.push({
      employeeId: employee.employee_id,
      employeeCode: employee.employee_code || "",
      employeeName: employee.employee_name,
      position: employee.position || "",
      department: employee.department || "",
      dailyRate: roundToTwo(employee.daily_rate || 0),
      hourlyRate: roundToTwo(employee.hourly_rate || 0),
      payCycleId: payCycle.id,
      payCycleName: payCycle.cycle_name,
      periodStart: payCycle.period_start,
      periodEnd: payCycle.period_end,
      payDate: payCycle.pay_date,
      attendanceDaysCount: 0,
      totalRenderedHours: 0,
      totalLunchBreakDeduction: 0,
      totalHoursWorked: 0,
      totalBasicPay: 0,
      holidayCount,
      holidayPay,
      allowances,
      deductions,
      totalSalary,
      adjustmentRows: adjustments.rows,
      approvalStatus: approval ? "APPROVED" : "PENDING",
      approvalId: approval?.id || null,
      approvedBy: approval?.approved_by || null,
      approvedAt: approval?.approved_at || null
    });
  }

  rows.sort((a, b) => a.employeeName.localeCompare(b.employeeName));

  const totals = rows.reduce(
    (accumulator, row) => {
      accumulator.totalHoursWorked += Number(row.totalHoursWorked || 0);
      accumulator.totalBasicPay += Number(row.totalBasicPay || 0);
      accumulator.totalHolidayPay += Number(row.holidayPay || 0);
      accumulator.totalAllowances += Number(row.allowances || 0);
      accumulator.totalDeductions += Number(row.deductions || 0);
      accumulator.totalSalary += Number(row.totalSalary || 0);
      return accumulator;
    },
    {
      totalHoursWorked: 0,
      totalBasicPay: 0,
      totalHolidayPay: 0,
      totalAllowances: 0,
      totalDeductions: 0,
      totalSalary: 0
    }
  );

  return {
    payCycle: {
      id: payCycle.id,
      cycleName: payCycle.cycle_name,
      cycleType: payCycle.cycle_type,
      periodStart: payCycle.period_start,
      periodEnd: payCycle.period_end,
      payDate: payCycle.pay_date,
      monthLabel: payCycle.month_label,
      yearLabel: payCycle.year_label
    },
    holidaySummary: {
      regularHolidayCount: holidayCount,
      regularHolidays: regularHolidays.map((holiday) => ({
        id: holiday.id,
        holidayName: holiday.holiday_name,
        holidayDate: holiday.holiday_date,
        holidayType: holiday.holiday_type
      }))
    },
    totals: {
      totalHoursWorked: roundToTwo(totals.totalHoursWorked),
      totalBasicPay: roundToTwo(totals.totalBasicPay),
      totalHolidayPay: roundToTwo(totals.totalHolidayPay),
      totalAllowances: roundToTwo(totals.totalAllowances),
      totalDeductions: roundToTwo(totals.totalDeductions),
      totalSalary: roundToTwo(totals.totalSalary)
    },
    rows
  };
}

async function getPayrollExportByPayCycle(payCycleId, options = {}) {
  const summary = await getPayrollSummaryByPayCycle(payCycleId);
  const approvedOnly = options.approvedOnly === true;

  const filteredRows = approvedOnly
    ? summary.rows.filter((row) => row.approvalStatus === "APPROVED")
    : summary.rows;

  const exportRows = filteredRows.map((row) => ({
    employee_name: row.employeeName,
    employee_code: row.employeeCode,
    pay_cycle: row.payCycleName,
    pay_date: row.payDate,
    total_hours_worked: row.totalHoursWorked,
    total_basic_pay: row.totalBasicPay,
    holiday_pay: row.holidayPay,
    allowances: row.allowances,
    deductions: row.deductions,
    total_salary: row.totalSalary,
    approval_status: row.approvalStatus
  }));

  return {
    payCycle: summary.payCycle,
    approvedOnly,
    rowCount: exportRows.length,
    columns: [
      "employee_name",
      "employee_code",
      "pay_cycle",
      "pay_date",
      "total_hours_worked",
      "total_basic_pay",
      "holiday_pay",
      "allowances",
      "deductions",
      "total_salary",
      "approval_status"
    ],
    rows: exportRows
  };
}

async function getBpiPayrollExportByPayCycle(payCycleId, options = {}) {
  const summary = await getPayrollSummaryByPayCycle(payCycleId);
  const approvedOnly = options.approvedOnly === true;

  const filteredRows = approvedOnly
    ? summary.rows.filter((row) => row.approvalStatus === "APPROVED")
    : summary.rows;

  const exportRows = filteredRows.map((row) => ({
    employee_code: row.employeeCode,
    employee_name: row.employeeName,
    pay_date: row.payDate,
    amount: roundToTwo(row.totalSalary),
    remarks: `${row.payCycleName} Payroll`
  }));

  return {
    payCycle: summary.payCycle,
    approvedOnly,
    rowCount: exportRows.length,
    columns: [
      "employee_code",
      "employee_name",
      "pay_date",
      "amount",
      "remarks"
    ],
    rows: exportRows
  };
}

module.exports = {
  getPayrollSummaryByPayCycle,
  getPayrollExportByPayCycle,
  getBpiPayrollExportByPayCycle
};