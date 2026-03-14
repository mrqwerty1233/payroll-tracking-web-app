const express = require("express");
const db = require("../config/db");

const router = express.Router();

/**
 * GET /api/expenses
 * Optional query:
 * - payCycleId
 */
router.get("/", (req, res) => {
  const { payCycleId } = req.query;

  let sql = `
    SELECT
      company_expenses.*,
      employees.full_name AS employee_name,
      pay_cycles.cycle_name AS pay_cycle_name
    FROM company_expenses
    INNER JOIN employees
      ON company_expenses.employee_id = employees.id
    INNER JOIN pay_cycles
      ON company_expenses.pay_cycle_id = pay_cycles.id
  `;

  const params = [];
  const conditions = [];

  if (payCycleId) {
    conditions.push("company_expenses.pay_cycle_id = ?");
    params.push(payCycleId);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  sql += `
    ORDER BY company_expenses.transaction_date DESC,
             employees.full_name ASC
  `;

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch company expenses.",
        error: err.message
      });
    }

    res.json({
      success: true,
      data: rows
    });
  });
});

module.exports = router;