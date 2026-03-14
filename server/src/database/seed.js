require("dotenv").config();

const fs = require("fs");
const path = require("path");
const db = require("../config/db");

const schemaPath = path.join(__dirname, "schema.sql");
const schemaSql = fs.readFileSync(schemaPath, "utf8");

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

function runExec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function seed() {
  try {
    console.log("Creating tables...");
    await runExec(schemaSql);

    console.log("Clearing old sample data...");
    await runQuery("DELETE FROM company_expenses");
    await runQuery("DELETE FROM payroll_approvals");
    await runQuery("DELETE FROM attendance_records");
    await runQuery("DELETE FROM holidays");
    await runQuery("DELETE FROM pay_cycles");
    await runQuery("DELETE FROM employees");

    console.log("Inserting employees...");
    await runQuery(
      `
      INSERT INTO employees (employee_code, full_name, daily_rate, hourly_rate, position, department)
      VALUES
      ('EMP-001', 'Javier Morales', 800, 100, 'Technician', 'Operations'),
      ('EMP-002', 'Miguel Santoro', 720, 90, 'Cleaner', 'Operations'),
      ('EMP-003', 'Lorenzo Castillo', 880, 110, 'Senior Technician', 'Operations')
      `
    );

    console.log("Inserting pay cycles...");
    await runQuery(
      `
      INSERT INTO pay_cycles (cycle_name, cycle_type, period_start, period_end, pay_date, month_label, year_label)
      VALUES
      ('January 2026 1st Pay Cycle', 'FIRST', '2025-12-26', '2026-01-10', '2026-01-15', 'January', 2026),
      ('January 2026 2nd Pay Cycle', 'SECOND', '2026-01-11', '2026-01-25', '2026-01-30', 'January', 2026)
      `
    );

    console.log("Inserting holidays...");
    await runQuery(
      `
      INSERT INTO holidays (holiday_name, holiday_date, holiday_type, is_paid, notes)
      VALUES
      ('New Year''s Day', '2026-01-01', 'REGULAR', 1, 'Regular holiday'),
      ('Sample Special Holiday', '2026-01-20', 'SPECIAL', 0, 'Should be ignored in payroll summary')
      `
    );

    console.log("Inserting attendance records...");
    await runQuery(
      `
      INSERT INTO attendance_records (employee_id, attendance_date, time_in, time_out, rendered_hours, lunch_break_deduction, notes)
      VALUES
      (1, '2025-12-26', '08:00', '18:00', 10, 1, 'Worked full day'),
      (1, '2025-12-27', '08:00', '17:00', 9, 1, 'Worked full day'),
      (1, '2026-01-01', '08:00', '18:00', 10, 1, 'Worked on regular holiday'),

      (2, '2025-12-26', '09:00', '18:00', 9, 1, 'Worked full day'),
      (2, '2025-12-30', '09:00', '18:30', 9.5, 1, 'Worked full day'),
      (2, '2026-01-03', '09:00', '17:00', 8, 1, 'Worked full day'),

      (3, '2025-12-28', '08:30', '19:00', 10.5, 1, 'Worked full day'),
      (3, '2025-12-29', '08:30', '18:00', 9.5, 1, 'Worked full day'),
      (3, '2026-01-10', '08:30', '17:30', 9, 1, 'Worked full day')
      `
    );

    console.log("Seed completed successfully.");
  } catch (error) {
    console.error("Seed failed:", error.message);
  } finally {
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
      } else {
        console.log("Database connection closed.");
      }
    });
  }
}

seed();