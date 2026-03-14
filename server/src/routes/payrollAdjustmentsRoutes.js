const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { getCurrentTimestamp } = require("../utils/dateUtils");

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) reject(error);
      else resolve(rows || []);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) reject(error);
      else resolve(row || null);
    });
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) reject(error);
      else resolve(this);
    });
  });
}

function normalizeText(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function normalizeNullableText(value) {
  const normalized = normalizeText(value);
  return normalized === "" ? null : normalized;
}

function normalizeNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isNaN(parsed) ? fallback : parsed;
}

function mapAdjustmentRow(row) {
  return {
    id: row.id,
    employee_id: row.employee_id,
    employee_name: row.employee_name,
    employee_code: row.employee_code,
    pay_cycle_id: row.pay_cycle_id,
    cycle_name: row.cycle_name,
    adjustment_type: row.adjustment_type,
    adjustment_name: row.adjustment_name,
    amount: Number(row.amount || 0),
    notes: row.notes || "",
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

router.get("/", async (req, res) => {
  try {
    const { payCycleId, employeeId, adjustmentType, search } = req.query;

    const whereClauses = [];
    const params = [];

    if (payCycleId) {
      whereClauses.push("pa.pay_cycle_id = ?");
      params.push(payCycleId);
    }

    if (employeeId) {
      whereClauses.push("pa.employee_id = ?");
      params.push(employeeId);
    }

    if (adjustmentType) {
      whereClauses.push("pa.adjustment_type = ?");
      params.push(adjustmentType);
    }

    if (search) {
      const keyword = `%${String(search).trim()}%`;
      whereClauses.push(`
        (
          e.full_name LIKE ?
          OR e.employee_code LIKE ?
          OR pa.adjustment_name LIKE ?
          OR pa.notes LIKE ?
          OR pc.cycle_name LIKE ?
        )
      `);
      params.push(keyword, keyword, keyword, keyword, keyword);
    }

    const rows = await dbAll(
      `
        SELECT
          pa.*,
          e.full_name AS employee_name,
          e.employee_code AS employee_code,
          pc.cycle_name AS cycle_name
        FROM payroll_adjustments pa
        INNER JOIN employees e ON e.id = pa.employee_id
        INNER JOIN pay_cycles pc ON pc.id = pa.pay_cycle_id
        ${whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : ""}
        ORDER BY pc.period_start DESC, e.full_name ASC, pa.adjustment_type ASC, pa.adjustment_name ASC
      `,
      params
    );

    return res.json({
      success: true,
      data: rows.map(mapAdjustmentRow)
    });
  } catch (error) {
    console.error("Get payroll adjustments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payroll adjustments."
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const employee_id = Number(req.body.employee_id);
    const pay_cycle_id = Number(req.body.pay_cycle_id);
    const adjustment_type = normalizeText(req.body.adjustment_type).toUpperCase();
    const adjustment_name = normalizeText(req.body.adjustment_name);
    const amount = normalizeNumber(req.body.amount, NaN);
    const notes = normalizeNullableText(req.body.notes);

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: "Employee is required."
      });
    }

    if (!pay_cycle_id) {
      return res.status(400).json({
        success: false,
        message: "Pay cycle is required."
      });
    }

    if (!["ALLOWANCE", "DEDUCTION"].includes(adjustment_type)) {
      return res.status(400).json({
        success: false,
        message: "Adjustment type must be ALLOWANCE or DEDUCTION."
      });
    }

    if (!adjustment_name) {
      return res.status(400).json({
        success: false,
        message: "Adjustment name is required."
      });
    }

    if (Number.isNaN(amount) || amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be 0 or higher."
      });
    }

    const employee = await dbGet(`SELECT id FROM employees WHERE id = ?`, [employee_id]);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found."
      });
    }

    const payCycle = await dbGet(`SELECT id FROM pay_cycles WHERE id = ?`, [pay_cycle_id]);
    if (!payCycle) {
      return res.status(404).json({
        success: false,
        message: "Pay cycle not found."
      });
    }

    const timestamp = getCurrentTimestamp();

    const result = await dbRun(
      `
        INSERT INTO payroll_adjustments (
          employee_id,
          pay_cycle_id,
          adjustment_type,
          adjustment_name,
          amount,
          notes,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        employee_id,
        pay_cycle_id,
        adjustment_type,
        adjustment_name,
        amount,
        notes,
        timestamp,
        timestamp
      ]
    );

    const createdRow = await dbGet(
      `
        SELECT
          pa.*,
          e.full_name AS employee_name,
          e.employee_code AS employee_code,
          pc.cycle_name AS cycle_name
        FROM payroll_adjustments pa
        INNER JOIN employees e ON e.id = pa.employee_id
        INNER JOIN pay_cycles pc ON pc.id = pa.pay_cycle_id
        WHERE pa.id = ?
      `,
      [result.lastID]
    );

    return res.status(201).json({
      success: true,
      message: "Payroll adjustment created successfully.",
      data: mapAdjustmentRow(createdRow)
    });
  } catch (error) {
    console.error("Create payroll adjustment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create payroll adjustment."
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const adjustmentId = req.params.id;

    const existing = await dbGet(
      `
        SELECT *
        FROM payroll_adjustments
        WHERE id = ?
      `,
      [adjustmentId]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Payroll adjustment not found."
      });
    }

    const employee_id =
      req.body.employee_id !== undefined
        ? Number(req.body.employee_id)
        : Number(existing.employee_id);

    const pay_cycle_id =
      req.body.pay_cycle_id !== undefined
        ? Number(req.body.pay_cycle_id)
        : Number(existing.pay_cycle_id);

    const adjustment_type = normalizeText(
      req.body.adjustment_type ?? existing.adjustment_type
    ).toUpperCase();

    const adjustment_name = normalizeText(
      req.body.adjustment_name ?? existing.adjustment_name
    );

    const amount =
      req.body.amount !== undefined
        ? normalizeNumber(req.body.amount, NaN)
        : Number(existing.amount || 0);

    const notes =
      req.body.notes !== undefined
        ? normalizeNullableText(req.body.notes)
        : existing.notes;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: "Employee is required."
      });
    }

    if (!pay_cycle_id) {
      return res.status(400).json({
        success: false,
        message: "Pay cycle is required."
      });
    }

    if (!["ALLOWANCE", "DEDUCTION"].includes(adjustment_type)) {
      return res.status(400).json({
        success: false,
        message: "Adjustment type must be ALLOWANCE or DEDUCTION."
      });
    }

    if (!adjustment_name) {
      return res.status(400).json({
        success: false,
        message: "Adjustment name is required."
      });
    }

    if (Number.isNaN(amount) || amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be 0 or higher."
      });
    }

    const timestamp = getCurrentTimestamp();

    await dbRun(
      `
        UPDATE payroll_adjustments
        SET
          employee_id = ?,
          pay_cycle_id = ?,
          adjustment_type = ?,
          adjustment_name = ?,
          amount = ?,
          notes = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [
        employee_id,
        pay_cycle_id,
        adjustment_type,
        adjustment_name,
        amount,
        notes,
        timestamp,
        adjustmentId
      ]
    );

    const updatedRow = await dbGet(
      `
        SELECT
          pa.*,
          e.full_name AS employee_name,
          e.employee_code AS employee_code,
          pc.cycle_name AS cycle_name
        FROM payroll_adjustments pa
        INNER JOIN employees e ON e.id = pa.employee_id
        INNER JOIN pay_cycles pc ON pc.id = pa.pay_cycle_id
        WHERE pa.id = ?
      `,
      [adjustmentId]
    );

    return res.json({
      success: true,
      message: "Payroll adjustment updated successfully.",
      data: mapAdjustmentRow(updatedRow)
    });
  } catch (error) {
    console.error("Update payroll adjustment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update payroll adjustment."
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const adjustmentId = req.params.id;

    const existing = await dbGet(
      `
        SELECT id
        FROM payroll_adjustments
        WHERE id = ?
      `,
      [adjustmentId]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Payroll adjustment not found."
      });
    }

    await dbRun(
      `
        DELETE FROM payroll_adjustments
        WHERE id = ?
      `,
      [adjustmentId]
    );

    return res.json({
      success: true,
      message: "Payroll adjustment deleted successfully."
    });
  } catch (error) {
    console.error("Delete payroll adjustment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete payroll adjustment."
    });
  }
});

module.exports = router;