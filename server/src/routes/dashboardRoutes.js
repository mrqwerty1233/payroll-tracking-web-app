const express = require("express");
const db = require("../config/db");
const { getPayrollSummaryByPayCycle } = require("../services/payrollService");

const router = express.Router();

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) reject(error);
      else resolve(row || null);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) reject(error);
      else resolve(rows || []);
    });
  });
}

router.get("/", async (req, res) => {
  try {
    const [
      totalEmployeesRow,
      activeEmployeesRow,
      attendanceRecordsRow,
      payCyclesRow,
      holidaysRow,
      payrollApprovalsRow,
      approvedPayrollsRow,
      companyExpensesRow,
      latestPayCycle,
      zeroRateEmployees,
      unassignedEmployees
    ] = await Promise.all([
      dbGet(`SELECT COUNT(*) AS count FROM employees`),
      dbGet(`SELECT COUNT(*) AS count FROM employees WHERE is_active = 1`),
      dbGet(`SELECT COUNT(*) AS count FROM attendance_records`),
      dbGet(`SELECT COUNT(*) AS count FROM pay_cycles`),
      dbGet(`SELECT COUNT(*) AS count FROM holidays`),
      dbGet(`SELECT COUNT(*) AS count FROM payroll_approvals`),
      dbGet(`
        SELECT COUNT(*) AS count
        FROM payroll_approvals
        WHERE upper(COALESCE(approval_status, '')) = 'APPROVED'
      `),
      dbGet(`SELECT COUNT(*) AS count FROM company_expenses`),
      dbGet(`
        SELECT *
        FROM pay_cycles
        ORDER BY pay_date DESC, period_start DESC
        LIMIT 1
      `),
      dbAll(`
        SELECT id, employee_code, full_name, daily_rate, hourly_rate
        FROM employees
        WHERE is_active = 1
          AND (
            COALESCE(daily_rate, 0) <= 0
            OR COALESCE(hourly_rate, 0) <= 0
          )
        ORDER BY full_name ASC
        LIMIT 5
      `),
      dbAll(`
        SELECT id, employee_code, full_name, department
        FROM employees
        WHERE is_active = 1
          AND (
            department IS NULL
            OR TRIM(department) = ''
            OR lower(TRIM(department)) = 'unassigned'
          )
        ORDER BY full_name ASC
        LIMIT 5
      `)
    ]);

    let currentPayCycle = null;
    let alerts = [];
    let recentActivity = [];
    let pendingApprovals = 0;
    let approvedInCurrentCycle = 0;
    let currentCyclePayrollTotal = 0;
    let currentCycleEmployeeCount = 0;

    if (latestPayCycle) {
      const summary = await getPayrollSummaryByPayCycle(latestPayCycle.id);

      currentCyclePayrollTotal = Number(summary?.totals?.totalSalary || 0);
      currentCycleEmployeeCount = Number(summary?.rows?.length || 0);
      pendingApprovals = summary.rows.filter(
        (row) => row.approvalStatus === "PENDING"
      ).length;
      approvedInCurrentCycle = summary.rows.filter(
        (row) => row.approvalStatus === "APPROVED"
      ).length;

      currentPayCycle = {
        id: latestPayCycle.id,
        cycleName: latestPayCycle.cycle_name,
        cycleType: latestPayCycle.cycle_type,
        periodStart: latestPayCycle.period_start,
        periodEnd: latestPayCycle.period_end,
        payDate: latestPayCycle.pay_date,
        monthLabel: latestPayCycle.month_label,
        yearLabel: latestPayCycle.year_label,
        employeeCount: currentCycleEmployeeCount,
        payrollTotal: currentCyclePayrollTotal,
        pendingApprovals,
        approvedCount: approvedInCurrentCycle
      };

      if (pendingApprovals > 0) {
        alerts.push({
          type: "warning",
          title: "Pending approvals in current pay cycle",
          message: `${pendingApprovals} employee payroll record(s) are still waiting for approval in ${latestPayCycle.cycle_name}.`
        });
      }

      if (currentCycleEmployeeCount === 0) {
        alerts.push({
          type: "warning",
          title: "Current pay cycle has no payroll rows",
          message: `No payroll summary rows were found for ${latestPayCycle.cycle_name}.`
        });
      }
    }

    if (zeroRateEmployees.length > 0) {
      alerts.push({
        type: "danger",
        title: "Employees with missing salary rates",
        message: `${zeroRateEmployees.length} active employee(s) still have zero daily rate or hourly rate.`
      });
    }

    if (unassignedEmployees.length > 0) {
      alerts.push({
        type: "info",
        title: "Employees with unassigned department",
        message: `${unassignedEmployees.length} active employee(s) are still under Unassigned department.`
      });
    }

    const recentApprovals = await dbAll(`
      SELECT
        pa.id,
        e.full_name AS employee_name,
        pc.cycle_name AS pay_cycle_name,
        pa.total_salary,
        pa.approved_at
      FROM payroll_approvals pa
      INNER JOIN employees e ON e.id = pa.employee_id
      INNER JOIN pay_cycles pc ON pc.id = pa.pay_cycle_id
      WHERE upper(COALESCE(pa.approval_status, '')) = 'APPROVED'
      ORDER BY pa.approved_at DESC, pa.id DESC
      LIMIT 3
    `);

    const recentExpenses = await dbAll(`
      SELECT
        ce.id,
        e.full_name AS employee_name,
        ce.amount,
        ce.transaction_date
      FROM company_expenses ce
      LEFT JOIN employees e ON e.id = ce.employee_id
      ORDER BY ce.transaction_date DESC, ce.id DESC
      LIMIT 3
    `);

    recentApprovals.forEach((item) => {
      recentActivity.push({
        type: "approval",
        title: `${item.employee_name} payroll approved`,
        subtitle: item.pay_cycle_name,
        meta: item.approved_at
      });
    });

    recentExpenses.forEach((item) => {
      recentActivity.push({
        type: "expense",
        title: `${item.employee_name || "Employee"} salary expense recorded`,
        subtitle: `₱${Number(item.amount || 0).toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`,
        meta: item.transaction_date
      });
    });

    recentActivity = recentActivity.slice(0, 5);

    return res.json({
      success: true,
      data: {
        totalEmployees: totalEmployeesRow?.count || 0,
        activeEmployees: activeEmployeesRow?.count || 0,
        attendanceRecords: attendanceRecordsRow?.count || 0,
        payCycles: payCyclesRow?.count || 0,
        holidays: holidaysRow?.count || 0,
        payrollApprovals: payrollApprovalsRow?.count || 0,
        approvedPayrolls: approvedPayrollsRow?.count || 0,
        companyExpenses: companyExpensesRow?.count || 0,
        currentPayCycle,
        alerts,
        recentActivity
      }
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard summary.",
      error: error.message
    });
  }
});

module.exports = router;