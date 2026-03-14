const express = require("express");
const router = express.Router();
const db = require("../config/db");

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
      } else {
        resolve(rows);
      }
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
      } else {
        resolve(row);
      }
    });
  });
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toISOString().split("T")[0];
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

async function getPayrollSummaryData(payCycleId) {
  const payCycle = await dbGet(
    `
      SELECT
        id,
        cycle_name AS cycleName,
        cycle_type AS cycleType,
        period_start AS periodStart,
        period_end AS periodEnd,
        pay_date AS payDate,
        month_label AS monthLabel,
        year_label AS yearLabel
      FROM pay_cycles
      WHERE id = ?
    `,
    [payCycleId]
  );

  if (!payCycle) {
    return null;
  }

  const regularHolidays = await dbAll(
    `
      SELECT
        id,
        holiday_name AS holidayName,
        holiday_date AS holidayDate,
        holiday_type AS holidayType
      FROM holidays
      WHERE holiday_type = 'REGULAR'
        AND holiday_date BETWEEN ? AND ?
      ORDER BY holiday_date ASC
    `,
    [payCycle.periodStart, payCycle.periodEnd]
  );

  const employees = await dbAll(
    `
      SELECT
        id,
        employee_code AS employeeCode,
        full_name AS employeeName,
        position,
        department,
        daily_rate AS dailyRate,
        hourly_rate AS hourlyRate,
        is_active AS isActive
      FROM employees
      WHERE is_active = 1
      ORDER BY full_name ASC
    `
  );

  const attendanceRows = await dbAll(
    `
      SELECT
        ar.id,
        ar.employee_id AS employeeId,
        ar.attendance_date AS attendanceDate,
        ar.time_in AS timeIn,
        ar.time_out AS timeOut,
        ar.rendered_hours AS renderedHours,
        ar.lunch_break_deduction AS lunchBreakDeduction,
        ar.notes
      FROM attendance_records ar
      WHERE ar.attendance_date BETWEEN ? AND ?
      ORDER BY ar.attendance_date ASC
    `,
    [payCycle.periodStart, payCycle.periodEnd]
  );

  const approvals = await dbAll(
    `
      SELECT
        pa.id,
        pa.employee_id AS employeeId,
        pa.pay_cycle_id AS payCycleId,
        pa.total_salary AS totalSalary,
        pa.approval_status AS status,
        pa.approved_by AS approvedBy,
        pa.approved_at AS approvedAt
      FROM payroll_approvals pa
      WHERE pa.pay_cycle_id = ?
    `,
    [payCycleId]
  );

  const adjustments = await dbAll(
    `
      SELECT
        id,
        employee_id AS employeeId,
        pay_cycle_id AS payCycleId,
        adjustment_type AS adjustmentType,
        adjustment_name AS adjustmentName,
        amount,
        notes
      FROM payroll_adjustments
      WHERE pay_cycle_id = ?
      ORDER BY adjustment_type ASC, adjustment_name ASC
    `,
    [payCycleId]
  );

  const approvalMap = new Map();
  approvals.forEach((approval) => {
    approvalMap.set(approval.employeeId, approval);
  });

  const holidayDates = regularHolidays.map((holiday) => holiday.holidayDate);

  const rows = employees.map((employee) => {
    const employeeAttendance = attendanceRows.filter(
      (record) => record.employeeId === employee.id
    );

    const employeeAdjustments = adjustments.filter(
      (adjustment) => adjustment.employeeId === employee.id
    );

    const allowanceItems = employeeAdjustments.filter(
      (item) => String(item.adjustmentType).toUpperCase() === "ALLOWANCE"
    );

    const deductionItems = employeeAdjustments.filter(
      (item) => String(item.adjustmentType).toUpperCase() === "DEDUCTION"
    );

    const totalAllowances = Number(
      allowanceItems
        .reduce((sum, item) => sum + Number(item.amount || 0), 0)
        .toFixed(2)
    );

    const totalDeductions = Number(
      deductionItems
        .reduce((sum, item) => sum + Number(item.amount || 0), 0)
        .toFixed(2)
    );

    const attendanceDaysCount = employeeAttendance.length;

    const totalRenderedHours = employeeAttendance.reduce(
      (sum, record) => sum + Number(record.renderedHours || 0),
      0
    );

    const totalLunchBreakDeduction = employeeAttendance.reduce(
      (sum, record) => sum + Number(record.lunchBreakDeduction || 0),
      0
    );

    const totalHoursWorked = Number(
      (totalRenderedHours - totalLunchBreakDeduction).toFixed(2)
    );

    const totalBasicPay = Number(
      (totalHoursWorked * Number(employee.hourlyRate || 0)).toFixed(2)
    );

    const holidayCount = regularHolidays.length;

    const holidayPay = Number(
      (holidayCount * Number(employee.dailyRate || 0)).toFixed(2)
    );

    const totalSalary = Number(
      (
        totalBasicPay +
        holidayPay +
        totalAllowances -
        totalDeductions
      ).toFixed(2)
    );

    const approval = approvalMap.get(employee.id);

    return {
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: employee.employeeName,
      position: employee.position,
      department: employee.department,
      dailyRate: Number(employee.dailyRate || 0),
      hourlyRate: Number(employee.hourlyRate || 0),
      payCycleId: payCycle.id,
      payCycleName: payCycle.cycleName,
      periodStart: payCycle.periodStart,
      periodEnd: payCycle.periodEnd,
      payDate: payCycle.payDate,
      attendanceDaysCount,
      totalRenderedHours: Number(totalRenderedHours.toFixed(2)),
      totalLunchBreakDeduction: Number(totalLunchBreakDeduction.toFixed(2)),
      totalHoursWorked,
      totalBasicPay,
      holidayCount,
      holidayPay,
      totalAllowances,
      totalDeductions,
      allowanceItems,
      deductionItems,
      totalSalary,
      approvalStatus: approval ? approval.status : "PENDING",
      approvedBy: approval ? approval.approvedBy : null,
      approvedAt: approval ? approval.approvedAt : null,
      holidayDates
    };
  });

  const totals = rows.reduce(
    (summary, row) => {
      summary.totalHoursWorked += row.totalHoursWorked;
      summary.totalBasicPay += row.totalBasicPay;
      summary.totalHolidayPay += row.holidayPay;
      summary.totalAllowances += row.totalAllowances;
      summary.totalDeductions += row.totalDeductions;
      summary.totalSalary += row.totalSalary;
      return summary;
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

  totals.totalHoursWorked = Number(totals.totalHoursWorked.toFixed(2));
  totals.totalBasicPay = Number(totals.totalBasicPay.toFixed(2));
  totals.totalHolidayPay = Number(totals.totalHolidayPay.toFixed(2));
  totals.totalAllowances = Number(totals.totalAllowances.toFixed(2));
  totals.totalDeductions = Number(totals.totalDeductions.toFixed(2));
  totals.totalSalary = Number(totals.totalSalary.toFixed(2));

  return {
    payCycle,
    holidaysSummary: {
      regularHolidayCount: regularHolidays.length,
      regularHolidays
    },
    rows,
    totals
  };
}

router.get("/summary", async (req, res) => {
  try {
    const { payCycleId } = req.query;

    if (!payCycleId) {
      return res.status(400).json({
        success: false,
        message: "payCycleId is required."
      });
    }

    const data = await getPayrollSummaryData(payCycleId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Pay cycle not found."
      });
    }

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error("Payroll summary error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate payroll summary.",
      error: error.message
    });
  }
});

router.get("/export", async (req, res) => {
  try {
    const { payCycleId, format } = req.query;

    if (!payCycleId) {
      return res.status(400).json({
        success: false,
        message: "payCycleId is required."
      });
    }

    const data = await getPayrollSummaryData(payCycleId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Pay cycle not found."
      });
    }

    if (format === "bpi") {
      const approvedRows = data.rows.filter(
        (row) => String(row.approvalStatus).toUpperCase() === "APPROVED"
      );

      const csvHeaders = [
        "Employee Code",
        "Employee Name",
        "Bank Account Number",
        "Amount",
        "Pay Date",
        "Remarks"
      ];

      const csvLines = [
        csvHeaders.map(escapeCsvValue).join(","),
        ...approvedRows.map((row) =>
          [
            row.employeeCode || "",
            row.employeeName || "",
            "",
            Number(row.totalSalary || 0).toFixed(2),
            formatDate(row.payDate),
            `Salary for ${row.payCycleName}`
          ]
            .map(escapeCsvValue)
            .join(",")
        )
      ];

      const csvContent = csvLines.join("\n");
      const safeFileName = `bpi-payroll-${formatDate(data.payCycle.payDate)}.csv`;

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeFileName}"`
      );

      return res.send(csvContent);
    }

    const exportPayload = {
      success: true,
      data: {
        payCycle: data.payCycle,
        approvedOnly: false,
        rowCount: data.rows.length,
        columns: [
          "employee_name",
          "employee_code",
          "pay_cycle",
          "pay_date",
          "total_hours_worked",
          "total_basic_pay",
          "holiday_pay",
          "total_allowances",
          "total_deductions",
          "total_salary",
          "approval_status"
        ],
        rows: data.rows.map((row) => ({
          employee_name: row.employeeName,
          employee_code: row.employeeCode,
          pay_cycle: row.payCycleName,
          pay_date: row.payDate,
          total_hours_worked: row.totalHoursWorked,
          total_basic_pay: row.totalBasicPay,
          holiday_pay: row.holidayPay,
          total_allowances: row.totalAllowances,
          total_deductions: row.totalDeductions,
          total_salary: row.totalSalary,
          approval_status: row.approvalStatus
        }))
      }
    };

    return res.json(exportPayload);
  } catch (error) {
    console.error("Payroll export error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate payroll export.",
      error: error.message
    });
  }
});

module.exports = router;