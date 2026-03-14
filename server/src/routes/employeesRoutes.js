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

function mapEmployeeRow(row) {
  return {
    id: row.id,
    employee_code: row.employee_code,
    full_name: row.full_name,
    daily_rate: Number(row.daily_rate || 0),
    hourly_rate: Number(row.hourly_rate || 0),
    position: row.position || "",
    department: row.department || "",
    is_active: Number(row.is_active || 0),
    contact_number: row.contact_number || "",
    email: row.email || "",
    hire_date: row.hire_date || "",
    employment_type: row.employment_type || "REGULAR",
    payroll_status: row.payroll_status || "ACTIVE",
    bank_name: row.bank_name || "",
    bank_account_number: row.bank_account_number || "",
    account_holder_name: row.account_holder_name || "",
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function validateEmployeePayload(payload, isUpdate = false) {
  const errors = [];

  const employee_code = normalizeText(payload.employee_code);
  const full_name = normalizeText(payload.full_name);
  const daily_rate = normalizeNumber(payload.daily_rate, NaN);
  const hourly_rate = normalizeNumber(payload.hourly_rate, NaN);
  const employment_type = normalizeText(payload.employment_type || "REGULAR");
  const payroll_status = normalizeText(payload.payroll_status || "ACTIVE");

  if (!isUpdate || employee_code !== "") {
    if (!employee_code) {
      errors.push("Employee code is required.");
    }
  }

  if (!isUpdate || full_name !== "") {
    if (!full_name) {
      errors.push("Full name is required.");
    }
  }

  if (!isUpdate || payload.daily_rate !== undefined) {
    if (Number.isNaN(daily_rate) || daily_rate < 0) {
      errors.push("Daily rate must be 0 or higher.");
    }
  }

  if (!isUpdate || payload.hourly_rate !== undefined) {
    if (Number.isNaN(hourly_rate) || hourly_rate < 0) {
      errors.push("Hourly rate must be 0 or higher.");
    }
  }

  if (
    employment_type &&
    !["REGULAR", "PROBATIONARY", "CONTRACTUAL", "PART_TIME", "FREELANCE"].includes(
      employment_type
    )
  ) {
    errors.push(
      "Employment type must be REGULAR, PROBATIONARY, CONTRACTUAL, PART_TIME, or FREELANCE."
    );
  }

  if (
    payroll_status &&
    !["ACTIVE", "ON_HOLD", "INACTIVE"].includes(payroll_status)
  ) {
    errors.push("Payroll status must be ACTIVE, ON_HOLD, or INACTIVE.");
  }

  return errors;
}

router.get("/", async (req, res) => {
  try {
    const search = normalizeText(req.query.search);
    let rows = [];

    if (search) {
      const keyword = `%${search}%`;

      rows = await dbAll(
        `
          SELECT *
          FROM employees
          WHERE employee_code LIKE ?
             OR full_name LIKE ?
             OR position LIKE ?
             OR department LIKE ?
             OR contact_number LIKE ?
             OR email LIKE ?
             OR employment_type LIKE ?
             OR payroll_status LIKE ?
             OR bank_name LIKE ?
             OR bank_account_number LIKE ?
             OR account_holder_name LIKE ?
          ORDER BY full_name ASC
        `,
        [
          keyword,
          keyword,
          keyword,
          keyword,
          keyword,
          keyword,
          keyword,
          keyword,
          keyword,
          keyword,
          keyword
        ]
      );
    } else {
      rows = await dbAll(
        `
          SELECT *
          FROM employees
          ORDER BY full_name ASC
        `
      );
    }

    return res.json({
      success: true,
      data: rows.map(mapEmployeeRow)
    });
  } catch (error) {
    console.error("Get employees error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch employees."
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const employee = await dbGet(
      `
        SELECT *
        FROM employees
        WHERE id = ?
      `,
      [req.params.id]
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found."
      });
    }

    return res.json({
      success: true,
      data: mapEmployeeRow(employee)
    });
  } catch (error) {
    console.error("Get employee error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee."
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const errors = validateEmployeePayload(req.body, false);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }

    const employee_code = normalizeText(req.body.employee_code);
    const full_name = normalizeText(req.body.full_name);
    const daily_rate = normalizeNumber(req.body.daily_rate, 0);
    const hourly_rate = normalizeNumber(req.body.hourly_rate, 0);
    const position = normalizeNullableText(req.body.position);
    const department = normalizeNullableText(req.body.department);
    const contact_number = normalizeNullableText(req.body.contact_number);
    const email = normalizeNullableText(req.body.email);
    const hire_date = normalizeNullableText(req.body.hire_date);
    const employment_type = normalizeText(req.body.employment_type || "REGULAR");
    const payroll_status = normalizeText(req.body.payroll_status || "ACTIVE");
    const bank_name = normalizeNullableText(req.body.bank_name);
    const bank_account_number = normalizeNullableText(req.body.bank_account_number);
    const account_holder_name = normalizeNullableText(req.body.account_holder_name);
    const is_active = req.body.is_active === undefined ? 1 : Number(req.body.is_active ? 1 : 0);

    const existingCode = await dbGet(
      `
        SELECT id
        FROM employees
        WHERE employee_code = ?
      `,
      [employee_code]
    );

    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: "Employee code already exists."
      });
    }

    const timestamp = getCurrentTimestamp();

    const result = await dbRun(
      `
        INSERT INTO employees (
          employee_code,
          full_name,
          daily_rate,
          hourly_rate,
          position,
          department,
          is_active,
          contact_number,
          email,
          hire_date,
          employment_type,
          payroll_status,
          bank_name,
          bank_account_number,
          account_holder_name,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        employee_code,
        full_name,
        daily_rate,
        hourly_rate,
        position,
        department,
        is_active,
        contact_number,
        email,
        hire_date,
        employment_type,
        payroll_status,
        bank_name,
        bank_account_number,
        account_holder_name,
        timestamp,
        timestamp
      ]
    );

    const createdEmployee = await dbGet(
      `
        SELECT *
        FROM employees
        WHERE id = ?
      `,
      [result.lastID]
    );

    return res.status(201).json({
      success: true,
      message: "Employee created successfully.",
      data: mapEmployeeRow(createdEmployee)
    });
  } catch (error) {
    console.error("Create employee error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create employee."
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const employeeId = req.params.id;

    const existingEmployee = await dbGet(
      `
        SELECT *
        FROM employees
        WHERE id = ?
      `,
      [employeeId]
    );

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found."
      });
    }

    const errors = validateEmployeePayload(req.body, true);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }

    const employee_code = normalizeText(
      req.body.employee_code ?? existingEmployee.employee_code
    );
    const full_name = normalizeText(
      req.body.full_name ?? existingEmployee.full_name
    );
    const daily_rate =
      req.body.daily_rate !== undefined
        ? normalizeNumber(req.body.daily_rate, 0)
        : Number(existingEmployee.daily_rate || 0);
    const hourly_rate =
      req.body.hourly_rate !== undefined
        ? normalizeNumber(req.body.hourly_rate, 0)
        : Number(existingEmployee.hourly_rate || 0);
    const position =
      req.body.position !== undefined
        ? normalizeNullableText(req.body.position)
        : existingEmployee.position;
    const department =
      req.body.department !== undefined
        ? normalizeNullableText(req.body.department)
        : existingEmployee.department;
    const contact_number =
      req.body.contact_number !== undefined
        ? normalizeNullableText(req.body.contact_number)
        : existingEmployee.contact_number;
    const email =
      req.body.email !== undefined
        ? normalizeNullableText(req.body.email)
        : existingEmployee.email;
    const hire_date =
      req.body.hire_date !== undefined
        ? normalizeNullableText(req.body.hire_date)
        : existingEmployee.hire_date;
    const employment_type = normalizeText(
      req.body.employment_type ?? existingEmployee.employment_type ?? "REGULAR"
    );
    const payroll_status = normalizeText(
      req.body.payroll_status ?? existingEmployee.payroll_status ?? "ACTIVE"
    );
    const bank_name =
      req.body.bank_name !== undefined
        ? normalizeNullableText(req.body.bank_name)
        : existingEmployee.bank_name;
    const bank_account_number =
      req.body.bank_account_number !== undefined
        ? normalizeNullableText(req.body.bank_account_number)
        : existingEmployee.bank_account_number;
    const account_holder_name =
      req.body.account_holder_name !== undefined
        ? normalizeNullableText(req.body.account_holder_name)
        : existingEmployee.account_holder_name;
    const is_active =
      req.body.is_active !== undefined
        ? Number(req.body.is_active ? 1 : 0)
        : Number(existingEmployee.is_active || 0);

    const duplicateCode = await dbGet(
      `
        SELECT id
        FROM employees
        WHERE employee_code = ?
          AND id != ?
      `,
      [employee_code, employeeId]
    );

    if (duplicateCode) {
      return res.status(400).json({
        success: false,
        message: "Employee code already exists."
      });
    }

    const timestamp = getCurrentTimestamp();

    await dbRun(
      `
        UPDATE employees
        SET
          employee_code = ?,
          full_name = ?,
          daily_rate = ?,
          hourly_rate = ?,
          position = ?,
          department = ?,
          is_active = ?,
          contact_number = ?,
          email = ?,
          hire_date = ?,
          employment_type = ?,
          payroll_status = ?,
          bank_name = ?,
          bank_account_number = ?,
          account_holder_name = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [
        employee_code,
        full_name,
        daily_rate,
        hourly_rate,
        position,
        department,
        is_active,
        contact_number,
        email,
        hire_date,
        employment_type,
        payroll_status,
        bank_name,
        bank_account_number,
        account_holder_name,
        timestamp,
        employeeId
      ]
    );

    const updatedEmployee = await dbGet(
      `
        SELECT *
        FROM employees
        WHERE id = ?
      `,
      [employeeId]
    );

    return res.json({
      success: true,
      message: "Employee updated successfully.",
      data: mapEmployeeRow(updatedEmployee)
    });
  } catch (error) {
    console.error("Update employee error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update employee."
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const employeeId = req.params.id;

    const existingEmployee = await dbGet(
      `
        SELECT id
        FROM employees
        WHERE id = ?
      `,
      [employeeId]
    );

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found."
      });
    }

    await dbRun(
      `
        DELETE FROM employees
        WHERE id = ?
      `,
      [employeeId]
    );

    return res.json({
      success: true,
      message: "Employee deleted successfully."
    });
  } catch (error) {
    console.error("Delete employee error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete employee."
    });
  }
});

module.exports = router;