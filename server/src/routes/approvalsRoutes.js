const express = require("express");
const db = require("../config/db");
const { getCurrentTimestamp } = require("../utils/dateUtils");
const { getPayrollSummaryByPayCycle } = require("../services/payrollService");

const router = express.Router();

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

/**
 * GET /api/approvals
 * Optional query:
 * - payCycleId
 * - status
 */
router.get("/", async (req, res) => {
  try {
    const { payCycleId, status } = req.query;

    let sql = `
      SELECT
        payroll_approvals.*,
        employees.full_name AS employee_name,
        employees.employee_code AS employee_code,
        pay_cycles.cycle_name AS pay_cycle_name,
        pay_cycles.pay_date AS pay_date
      FROM payroll_approvals
      INNER JOIN employees
        ON payroll_approvals.employee_id = employees.id
      INNER JOIN pay_cycles
        ON payroll_approvals.pay_cycle_id = pay_cycles.id
    `;

    const conditions = [];
    const params = [];

    if (payCycleId) {
      conditions.push("payroll_approvals.pay_cycle_id = ?");
      params.push(payCycleId);
    }

    if (status) {
      conditions.push("payroll_approvals.approval_status = ?");
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    sql += `
      ORDER BY pay_cycles.period_start DESC, employees.full_name ASC
    `;

    const rows = await allQuery(sql, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payroll approvals.",
      error: error.message
    });
  }
});

/**
 * POST /api/approvals/approve
 *
 * Body:
 * {
 *   "pay_cycle_id": 1,
 *   "employee_id": 2,
 *   "approved_by": "Glenn"
 * }
 */
router.post("/approve", async (req, res) => {
  try {
    const body = req.body || {};
    const { pay_cycle_id, employee_id, approved_by } = body;

    if (!pay_cycle_id || !employee_id) {
      return res.status(400).json({
        success: false,
        message: "pay_cycle_id and employee_id are required."
      });
    }

    const payCycle = await getQuery(
      `
      SELECT *
      FROM pay_cycles
      WHERE id = ?
      `,
      [pay_cycle_id]
    );

    if (!payCycle) {
      return res.status(404).json({
        success: false,
        message: "Pay cycle not found."
      });
    }

    const employee = await getQuery(
      `
      SELECT *
      FROM employees
      WHERE id = ?
      `,
      [employee_id]
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found."
      });
    }

    const payrollSummary = await getPayrollSummaryByPayCycle(pay_cycle_id);
    const payrollRow = payrollSummary.rows.find(
      (row) => Number(row.employeeId) === Number(employee_id)
    );

    if (!payrollRow) {
      return res.status(404).json({
        success: false,
        message:
          "No payroll summary row found for this employee in the selected pay cycle."
      });
    }

    const timestamp = getCurrentTimestamp();

    const existingApproval = await getQuery(
      `
      SELECT *
      FROM payroll_approvals
      WHERE employee_id = ? AND pay_cycle_id = ?
      `,
      [employee_id, pay_cycle_id]
    );

    let approvalId;

    if (existingApproval) {
      await runQuery(
        `
        UPDATE payroll_approvals
        SET
          total_hours_worked = ?,
          total_basic_pay = ?,
          holiday_pay = ?,
          total_salary = ?,
          approval_status = 'APPROVED',
          approved_by = ?,
          approved_at = ?,
          updated_at = ?
        WHERE id = ?
        `,
        [
          payrollRow.totalHoursWorked,
          payrollRow.totalBasicPay,
          payrollRow.holidayPay,
          payrollRow.totalSalary,
          approved_by || "Manager",
          timestamp,
          timestamp,
          existingApproval.id
        ]
      );

      approvalId = existingApproval.id;
    } else {
      const insertApproval = await runQuery(
        `
        INSERT INTO payroll_approvals (
          employee_id,
          pay_cycle_id,
          total_hours_worked,
          total_basic_pay,
          holiday_pay,
          total_salary,
          approval_status,
          approved_by,
          approved_at,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 'APPROVED', ?, ?, ?, ?)
        `,
        [
          employee_id,
          pay_cycle_id,
          payrollRow.totalHoursWorked,
          payrollRow.totalBasicPay,
          payrollRow.holidayPay,
          payrollRow.totalSalary,
          approved_by || "Manager",
          timestamp,
          timestamp,
          timestamp
        ]
      );

      approvalId = insertApproval.lastID;
    }

    const existingExpense = await getQuery(
      `
      SELECT *
      FROM company_expenses
      WHERE employee_id = ? AND pay_cycle_id = ? AND source_approval_id = ?
      `,
      [employee_id, pay_cycle_id, approvalId]
    );

    if (existingExpense) {
      await runQuery(
        `
        UPDATE company_expenses
        SET
          transaction_date = ?,
          expense_category = ?,
          amount = ?,
          account_name = ?,
          remarks = ?,
          updated_at = ?
        WHERE id = ?
        `,
        [
          payCycle.pay_date,
          "Salary Expense",
          payrollRow.totalSalary,
          "BPI",
          null,
          timestamp,
          existingExpense.id
        ]
      );
    } else {
      await runQuery(
        `
        INSERT INTO company_expenses (
          employee_id,
          pay_cycle_id,
          transaction_date,
          expense_category,
          amount,
          account_name,
          remarks,
          source_approval_id,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          employee_id,
          pay_cycle_id,
          payCycle.pay_date,
          "Salary Expense",
          payrollRow.totalSalary,
          "BPI",
          null,
          approvalId,
          timestamp,
          timestamp
        ]
      );
    }

    const approvalRecord = await getQuery(
      `
      SELECT
        payroll_approvals.*,
        employees.full_name AS employee_name,
        pay_cycles.cycle_name AS pay_cycle_name
      FROM payroll_approvals
      INNER JOIN employees
        ON payroll_approvals.employee_id = employees.id
      INNER JOIN pay_cycles
        ON payroll_approvals.pay_cycle_id = pay_cycles.id
      WHERE payroll_approvals.id = ?
      `,
      [approvalId]
    );

    res.status(201).json({
      success: true,
      message: "Payroll approved successfully and company expense recorded.",
      data: approvalRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to approve payroll.",
      error: error.message
    });
  }
});

module.exports = router;