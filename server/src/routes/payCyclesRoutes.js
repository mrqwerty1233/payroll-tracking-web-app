const express = require("express");
const db = require("../config/db");
const { getCurrentTimestamp } = require("../utils/dateUtils");

const router = express.Router();

/**
 * GET /api/pay-cycles
 */
router.get("/", (req, res) => {
  const sql = `
    SELECT *
    FROM pay_cycles
    ORDER BY period_start ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch pay cycles.",
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
 * GET /api/pay-cycles/:id
 */
router.get("/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT *
    FROM pay_cycles
    WHERE id = ?
  `;

  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch pay cycle.",
        error: err.message
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Pay cycle not found."
      });
    }

    res.json({
      success: true,
      data: row
    });
  });
});

/**
 * POST /api/pay-cycles
 */
router.post("/", (req, res) => {
  const {
    cycle_name,
    cycle_type,
    period_start,
    period_end,
    pay_date,
    month_label,
    year_label
  } = req.body;

  if (!cycle_name || !cycle_type || !period_start || !period_end || !pay_date) {
    return res.status(400).json({
      success: false,
      message:
        "cycle_name, cycle_type, period_start, period_end, and pay_date are required."
    });
  }

  if (!["FIRST", "SECOND"].includes(cycle_type)) {
    return res.status(400).json({
      success: false,
      message: "cycle_type must be either FIRST or SECOND."
    });
  }

  const timestamp = getCurrentTimestamp();

  const sql = `
    INSERT INTO pay_cycles (
      cycle_name,
      cycle_type,
      period_start,
      period_end,
      pay_date,
      month_label,
      year_label,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    cycle_name,
    cycle_type,
    period_start,
    period_end,
    pay_date,
    month_label || null,
    year_label === undefined ? null : Number(year_label),
    timestamp,
    timestamp
  ];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to create pay cycle.",
        error: err.message
      });
    }

    res.status(201).json({
      success: true,
      message: "Pay cycle created successfully.",
      data: {
        id: this.lastID
      }
    });
  });
});

/**
 * PUT /api/pay-cycles/:id
 */
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const {
    cycle_name,
    cycle_type,
    period_start,
    period_end,
    pay_date,
    month_label,
    year_label
  } = req.body;

  if (!cycle_name || !cycle_type || !period_start || !period_end || !pay_date) {
    return res.status(400).json({
      success: false,
      message:
        "cycle_name, cycle_type, period_start, period_end, and pay_date are required."
    });
  }

  if (!["FIRST", "SECOND"].includes(cycle_type)) {
    return res.status(400).json({
      success: false,
      message: "cycle_type must be either FIRST or SECOND."
    });
  }

  const timestamp = getCurrentTimestamp();

  const sql = `
    UPDATE pay_cycles
    SET
      cycle_name = ?,
      cycle_type = ?,
      period_start = ?,
      period_end = ?,
      pay_date = ?,
      month_label = ?,
      year_label = ?,
      updated_at = ?
    WHERE id = ?
  `;

  const params = [
    cycle_name,
    cycle_type,
    period_start,
    period_end,
    pay_date,
    month_label || null,
    year_label === undefined ? null : Number(year_label),
    timestamp,
    id
  ];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to update pay cycle.",
        error: err.message
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Pay cycle not found."
      });
    }

    res.json({
      success: true,
      message: "Pay cycle updated successfully."
    });
  });
});

/**
 * DELETE /api/pay-cycles/:id
 */
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    DELETE FROM pay_cycles
    WHERE id = ?
  `;

  db.run(sql, [id], function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete pay cycle.",
        error: err.message
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Pay cycle not found."
      });
    }

    res.json({
      success: true,
      message: "Pay cycle deleted successfully."
    });
  });
});

module.exports = router;