const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./src/database/payroll.db");

db.all(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
  [],
  (err, rows) => {
    if (err) {
      console.error("Error reading tables:", err);
    } else {
      console.log("Tables in database:");
      console.log(rows);
    }

    db.close();
  }
);