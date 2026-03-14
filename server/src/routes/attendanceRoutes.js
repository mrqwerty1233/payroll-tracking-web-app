const express = require("express");
const db = require("../config/db");
const { getCurrentTimestamp } = require("../utils/dateUtils");

const router = express.Router();

/**
 * GET /api/attendance
 * Optional query:
 * - employeeId
 * - payCycleId
 */
router.get("/", (req, res) => {
  const { employeeId, payCycleId } = req.query;

  let sql = `
    SELECT
      attendance_records.*,
      employees.full_name AS employee_name
    FROM attendance_records
    INNER JOIN employees
      ON attendance_records.employee_id = employees.id
  `;

  const conditions = [];
  const params = [];

  if (employeeId) {
    conditions.push("attendance_records.employee_id = ?");
    params.push(employeeId);
  }

  if (payCycleId) {
    conditions.push(`
      attendance_records.attendance_date BETWEEN
      (SELECT period_start FROM pay_cycles WHERE id = ?)
      AND
      (SELECT period_end FROM pay_cycles WHERE id = ?)
    `);
    params.push(payCycleId, payCycleId);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  sql += `
    ORDER BY attendance_records.attendance_date ASC,
             employees.full_name ASC
  `;

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch attendance records.",
        error: err.message
      });
    }

    res.json({
      success: true,
      data: rows
    });
  });
});

/**
 * GET /api/attendance/:id
 */
router.get("/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT
      attendance_records.*,
      employees.full_name AS employee_name
    FROM attendance_records
    INNER JOIN employees
      ON attendance_records.employee_id = employees.id
    WHERE attendance_records.id = ?
  `;

  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch attendance record.",
        error: err.message
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found."
      });
    }

    res.json({
      success: true,
      data: row
    });
  });
});

/**
 * POST /api/attendance
 */
router.post("/", (req, res) => {
  const body = req.body || {};

  const {
    employee_id,
    attendance_date,
    time_in,
    time_out,
    rendered_hours,
    lunch_break_deduction,
    notes
  } = body;

  if (!employee_id || !attendance_date || rendered_hours === undefined) {
    return res.status(400).json({
      success: false,
      message: "employee_id, attendance_date, and rendered_hours are required."
    });
  }

  if (Number(rendered_hours) < 0) {
    return res.status(400).json({
      success: false,
      message: "rendered_hours must be 0 or higher."
    });
  }

  const lunchBreakValue =
    lunch_break_deduction === undefined ? 1 : Number(lunch_break_deduction);

  if (lunchBreakValue < 0) {
    return res.status(400).json({
      success: false,
      message: "lunch_break_deduction must be 0 or higher."
    });
  }

  const timestamp = getCurrentTimestamp();

  const sql = `
    INSERT INTO attendance_records (
      employee_id,
      attendance_date,
      time_in,
      time_out,
      rendered_hours,
      lunch_break_deduction,
      notes,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    Number(employee_id),
    attendance_date,
    time_in || null,
    time_out || null,
    Number(rendered_hours),
    lunchBreakValue,
    notes || null,
    timestamp,
    timestamp
  ];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to create attendance record.",
        error: err.message
      });
    }

    res.status(201).json({
      success: true,
      message: "Attendance record created successfully.",
      data: {
        id: this.lastID
      }
    });
  });
});

/**
 * PUT /api/attendance/:id
 */
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const body = req.body || {};

  const {
    employee_id,
    attendance_date,
    time_in,
    time_out,
    rendered_hours,
    lunch_break_deduction,
    notes
  } = body;

  if (!employee_id || !attendance_date || rendered_hours === undefined) {
    return res.status(400).json({
      success: false,
      message: "employee_id, attendance_date, and rendered_hours are required."
    });
  }

  if (Number(rendered_hours) < 0) {
    return res.status(400).json({
      success: false,
      message: "rendered_hours must be 0 or higher."
    });
  }

  const lunchBreakValue =
    lunch_break_deduction === undefined ? 1 : Number(lunch_break_deduction);

  if (lunchBreakValue < 0) {
    return res.status(400).json({
      success: false,
      message: "lunch_break_deduction must be 0 or higher."
    });
  }

  const timestamp = getCurrentTimestamp();

  const sql = `
    UPDATE attendance_records
    SET
      employee_id = ?,
      attendance_date = ?,
      time_in = ?,
      time_out = ?,
      rendered_hours = ?,
      lunch_break_deduction = ?,
      notes = ?,
      updated_at = ?
    WHERE id = ?
  `;

  const params = [
    Number(employee_id),
    attendance_date,
    time_in || null,
    time_out || null,
    Number(rendered_hours),
    lunchBreakValue,
    notes || null,
    timestamp,
    id
  ];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to update attendance record.",
        error: err.message
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found."
      });
    }

    res.json({
      success: true,
      message: "Attendance record updated successfully."
    });
  });
});

/**
 * DELETE /api/attendance/:id
 */
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    DELETE FROM attendance_records
    WHERE id = ?
  `;

  db.run(sql, [id], function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete attendance record.",
        error: err.message
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found."
      });
    }

    res.json({
      success: true,
      message: "Attendance record deleted successfully."
    });
  });
});

module.exports = router;