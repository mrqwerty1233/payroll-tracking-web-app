const db = require("../config/db");

function runQuery(sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, [], function (error) {
      if (error) reject(error);
      else resolve(this);
    });
  });
}

async function migrate() {
  try {
    console.log("Creating payroll_adjustments table if it does not exist...");

    await runQuery(`
      CREATE TABLE IF NOT EXISTS payroll_adjustments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        pay_cycle_id INTEGER NOT NULL,
        adjustment_type TEXT NOT NULL,
        adjustment_name TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (pay_cycle_id) REFERENCES pay_cycles(id) ON DELETE CASCADE
      )
    `);

    console.log("Payroll adjustments migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error.message);
  } finally {
    db.close();
  }
}

migrate();