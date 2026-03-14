const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbFile = process.env.DB_FILE || "./src/database/payroll.db";
const resolvedPath = path.resolve(dbFile);

const db = new sqlite3.Database(resolvedPath, (err) => {
  if (err) {
    console.error("Failed to connect to SQLite database:", err.message);
  } else {
    console.log("Connected to SQLite database:", resolvedPath);
  }
});

module.exports = db;