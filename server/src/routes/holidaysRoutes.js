const express = require("express");
const db = require("../config/db");
const { getCurrentTimestamp } = require("../utils/dateUtils");

const router = express.Router();

/**
 * GET /api/holidays
 * Optional query:
 * - payCycleId
 */
router.get("/", (req, res) => {
  const { payCycleId } = req.query;

  let sql = `
    SELECT *
    FROM holidays
  `;

  const conditions = [];
  const params = [];

  if (payCycleId) {
    conditions.push(`
      holiday_date BETWEEN
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
    ORDER BY holiday_date ASC
  `;

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch holidays.",
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
 * GET /api/holidays/:id
 */
router.get("/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT *
    FROM holidays
    WHERE id = ?
  `;

  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch holiday.",
        error: err.message
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found."
      });
    }

    res.json({
      success: true,
      data: row
    });
  });
});

/**
 * POST /api/holidays
 */
router.post("/", (req, res) => {
  const {
    holiday_name,
    holiday_date,
    holiday_type,
    is_paid,
    notes
  } = req.body;

  if (!holiday_name || !holiday_date || !holiday_type) {
    return res.status(400).json({
      success: false,
      message: "holiday_name, holiday_date, and holiday_type are required."
    });
  }

  if (!["REGULAR", "SPECIAL"].includes(holiday_type)) {
    return res.status(400).json({
      success: false,
      message: "holiday_type must be either REGULAR or SPECIAL."
    });
  }

  const timestamp = getCurrentTimestamp();

  const sql = `
    INSERT INTO holidays (
      holiday_name,
      holiday_date,
      holiday_type,
      is_paid,
      notes,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    holiday_name,
    holiday_date,
    holiday_type,
    is_paid === undefined ? 1 : Number(is_paid),
    notes || null,
    timestamp,
    timestamp
  ];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to create holiday.",
        error: err.message
      });
    }

    res.status(201).json({
      success: true,
      message: "Holiday created successfully.",
      data: {
        id: this.lastID
      }
    });
  });
});

/**
 * PUT /api/holidays/:id
 */
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const {
    holiday_name,
    holiday_date,
    holiday_type,
    is_paid,
    notes
  } = req.body;

  if (!holiday_name || !holiday_date || !holiday_type) {
    return res.status(400).json({
      success: false,
      message: "holiday_name, holiday_date, and holiday_type are required."
    });
  }

  if (!["REGULAR", "SPECIAL"].includes(holiday_type)) {
    return res.status(400).json({
      success: false,
      message: "holiday_type must be either REGULAR or SPECIAL."
    });
  }

  const timestamp = getCurrentTimestamp();

  const sql = `
    UPDATE holidays
    SET
      holiday_name = ?,
      holiday_date = ?,
      holiday_type = ?,
      is_paid = ?,
      notes = ?,
      updated_at = ?
    WHERE id = ?
  `;

  const params = [
    holiday_name,
    holiday_date,
    holiday_type,
    is_paid === undefined ? 1 : Number(is_paid),
    notes || null,
    timestamp,
    id
  ];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to update holiday.",
        error: err.message
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found."
      });
    }

    res.json({
      success: true,
      message: "Holiday updated successfully."
    });
  });
});

/**
 * DELETE /api/holidays/:id
 */
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    DELETE FROM holidays
    WHERE id = ?
  `;

  db.run(sql, [id], function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete holiday.",
        error: err.message
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found."
      });
    }

    res.json({
      success: true,
      message: "Holiday deleted successfully."
    });
  });
});

module.exports = router;