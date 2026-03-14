const db = require("../config/db");

const columnsToAdd = [
  {
    name: "contact_number",
    definition: "TEXT"
  },
  {
    name: "email",
    definition: "TEXT"
  },
  {
    name: "hire_date",
    definition: "TEXT"
  },
  {
    name: "employment_type",
    definition: "TEXT DEFAULT 'REGULAR'"
  },
  {
    name: "payroll_status",
    definition: "TEXT DEFAULT 'ACTIVE'"
  },
  {
    name: "bank_name",
    definition: "TEXT"
  },
  {
    name: "bank_account_number",
    definition: "TEXT"
  },
  {
    name: "account_holder_name",
    definition: "TEXT"
  }
];

function getTableColumns(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, [], (error, rows) => {
      if (error) {
        reject(error);
      } else {
        resolve(rows || []);
      }
    });
  });
}

function runQuery(sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, [], function (error) {
      if (error) {
        reject(error);
      } else {
        resolve(this);
      }
    });
  });
}

async function migrate() {
  try {
    console.log("Checking employees table columns...");

    const existingColumns = await getTableColumns("employees");
    const existingColumnNames = existingColumns.map((column) => column.name);

    for (const column of columnsToAdd) {
      if (existingColumnNames.includes(column.name)) {
        console.log(`Skipping existing column: ${column.name}`);
        continue;
      }

      const sql = `ALTER TABLE employees ADD COLUMN ${column.name} ${column.definition}`;
      await runQuery(sql);
      console.log(`Added column: ${column.name}`);
    }

    console.log("Employee profile migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error.message);
  } finally {
    db.close();
  }
}

migrate();