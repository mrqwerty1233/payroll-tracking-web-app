const XLSX = require("xlsx");
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
    db.run(sql, params, function onRun(error) {
      if (error) reject(error);
      else resolve(this);
    });
  });
}

function normalizeText(value) {
  if (value === undefined || value === null) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function normalizeLookup(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeHeader(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isNaN(parsed) ? fallback : parsed;
}

function excelSerialToDate(serial) {
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const parsed = Number(serial);

  if (Number.isNaN(parsed)) return null;

  const date = new Date(excelEpoch.getTime() + parsed * 24 * 60 * 60 * 1000);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function toIsoDate(value) {
  if (value === undefined || value === null || value === "") return "";

  if (typeof value === "number") {
    const parsed = excelSerialToDate(value);
    return parsed ? parsed.toISOString().slice(0, 10) : "";
  }

  const raw = normalizeText(value);
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [month, day, year] = raw.split("/");
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return "";
}

function toTimeHHMM(value) {
  if (value === undefined || value === null || value === "") return "";

  if (typeof value === "number") {
    const totalMinutes = Math.round(value * 24 * 60);
    const hours = String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0");
    const minutes = String(totalMinutes % 60).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  const raw = normalizeText(value);
  if (!raw) return "";

  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [hours, minutes] = raw.split(":");
    return `${String(Number(hours)).padStart(2, "0")}:${minutes}`;
  }

  if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(raw)) {
    const parsed = new Date(`1970-01-01 ${raw}`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toTimeString().slice(0, 5);
    }
  }

  const parsed = new Date(`1970-01-01 ${raw}`);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toTimeString().slice(0, 5);
  }

  return "";
}

function calculateRenderedHours(timeIn, timeOut, lunchBreakDeduction = 1) {
  if (!timeIn || !timeOut) return 0;

  const [inHours, inMinutes] = timeIn.split(":").map(Number);
  const [outHours, outMinutes] = timeOut.split(":").map(Number);

  if (
    Number.isNaN(inHours) ||
    Number.isNaN(inMinutes) ||
    Number.isNaN(outHours) ||
    Number.isNaN(outMinutes)
  ) {
    return 0;
  }

  let startMinutes = inHours * 60 + inMinutes;
  let endMinutes = outHours * 60 + outMinutes;

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  const totalHours = (endMinutes - startMinutes) / 60;
  const finalHours = totalHours - Number(lunchBreakDeduction || 0);

  return Number(Math.max(0, finalHours).toFixed(2));
}

function sheetToObjects(sheet) {
  return XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false
  });
}

function findSheetName(workbook, possibleNames) {
  const lowered = workbook.SheetNames.map((name) => ({
    original: name,
    lower: name.toLowerCase()
  }));

  for (const possible of possibleNames) {
    const found = lowered.find((item) => item.lower.includes(possible));
    if (found) return found.original;
  }

  return null;
}

function mapFlexibleRow(rawRow) {
  const mapped = {};

  Object.entries(rawRow || {}).forEach(([key, value]) => {
    mapped[normalizeHeader(key)] = value;
  });

  return mapped;
}

function parseFlatAttendanceRows(rawRows) {
  const parsedRows = [];

  rawRows.forEach((rawRow, index) => {
    const row = mapFlexibleRow(rawRow);

    const employeeCode = normalizeText(
      row.employee_code ||
        row.emp_code ||
        row.code ||
        row.employeeid ||
        row.employee_id_code
    );

    const employeeName = normalizeText(
      row.employee_name ||
        row.full_name ||
        row.name ||
        row.employee ||
        row.employee_full_name
    );

    const attendanceDate = toIsoDate(
      row.attendance_date || row.date || row.work_date || row.day
    );

    const timeIn = toTimeHHMM(
      row.time_in || row.timein || row.clock_in || row.in || row.entry_in
    );

    const timeOut = toTimeHHMM(
      row.time_out || row.timeout || row.clock_out || row.out || row.entry_out
    );

    let renderedHours = normalizeNumber(
      row.rendered_hours || row.duration || row.total_hours || row.hours_worked,
      0
    );

    const lunchBreakDeduction = normalizeNumber(
      row.lunch_break_deduction || row.lunch_deduction || row.break_deduction,
      1
    );

    const notes = normalizeText(row.notes || row.remarks || row.comment || "");

    if (!renderedHours && timeIn && timeOut) {
      renderedHours = calculateRenderedHours(
        timeIn,
        timeOut,
        lunchBreakDeduction
      );
    }

    if (!attendanceDate || (!employeeCode && !employeeName)) {
      return;
    }

    parsedRows.push({
      rowNumber: index + 2,
      employee_code: employeeCode,
      employee_name: employeeName,
      attendance_date: attendanceDate,
      time_in: timeIn,
      time_out: timeOut,
      rendered_hours: renderedHours,
      lunch_break_deduction: lunchBreakDeduction,
      notes,
      source_type: "flat"
    });
  });

  return parsedRows;
}

function parseRawAttendanceLogRows(rawRows) {
  const grouped = new Map();

  rawRows.forEach((rawRow, index) => {
    const row = mapFlexibleRow(rawRow);

    const employeeName = normalizeText(
      row.employee_name || row.name || row.employee || row.full_name
    );
    const attendanceDate = toIsoDate(row.date || row.attendance_date);
    const entryType = normalizeLookup(row.entrytype || row.entry_type || row.type);
    const timeValue = toTimeHHMM(row.time || row.log_time);
    const durationValue = normalizeNumber(
      row.duration || row.rendered_hours || row.hours,
      0
    );

    if (!employeeName || !attendanceDate) {
      return;
    }

    const key = `${normalizeLookup(employeeName)}__${attendanceDate}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        rowNumber: index + 2,
        employee_code: "",
        employee_name: employeeName,
        attendance_date: attendanceDate,
        time_in: "",
        time_out: "",
        rendered_hours: 0,
        lunch_break_deduction: 1,
        notes: "",
        source_type: "raw"
      });
    }

    const existing = grouped.get(key);

    if (
      entryType.includes("in") ||
      entryType === "time_in" ||
      entryType === "clock_in"
    ) {
      if (!existing.time_in || (timeValue && timeValue < existing.time_in)) {
        existing.time_in = timeValue;
      }
    }

    if (
      entryType.includes("out") ||
      entryType === "time_out" ||
      entryType === "clock_out"
    ) {
      if (!existing.time_out || (timeValue && timeValue > existing.time_out)) {
        existing.time_out = timeValue;
      }
    }

    if (durationValue > 0) {
      existing.rendered_hours = Math.max(existing.rendered_hours, durationValue);
    }
  });

  return Array.from(grouped.values()).map((row) => {
    if (!row.rendered_hours && row.time_in && row.time_out) {
      row.rendered_hours = calculateRenderedHours(
        row.time_in,
        row.time_out,
        row.lunch_break_deduction
      );
    }

    return row;
  });
}

function mergeAttendanceRows(rows) {
  const mergedMap = new Map();

  rows.forEach((row) => {
    const employeeKey = normalizeLookup(row.employee_code || row.employee_name);
    const key = `${employeeKey}__${row.attendance_date}`;

    if (!mergedMap.has(key)) {
      mergedMap.set(key, { ...row });
      return;
    }

    const existing = mergedMap.get(key);

    existing.employee_code = existing.employee_code || row.employee_code || "";
    existing.employee_name = existing.employee_name || row.employee_name || "";

    if (!existing.time_in && row.time_in) {
      existing.time_in = row.time_in;
    } else if (existing.time_in && row.time_in) {
      existing.time_in = existing.time_in < row.time_in ? existing.time_in : row.time_in;
    }

    if (!existing.time_out && row.time_out) {
      existing.time_out = row.time_out;
    } else if (existing.time_out && row.time_out) {
      existing.time_out = existing.time_out > row.time_out ? existing.time_out : row.time_out;
    }

    if (!existing.rendered_hours && row.rendered_hours) {
      existing.rendered_hours = row.rendered_hours;
    } else if (row.rendered_hours) {
      existing.rendered_hours = Math.max(existing.rendered_hours, row.rendered_hours);
    }

    if (!existing.notes && row.notes) {
      existing.notes = row.notes;
    }

    if (!existing.lunch_break_deduction && row.lunch_break_deduction) {
      existing.lunch_break_deduction = row.lunch_break_deduction;
    }

    if (!existing.time_in && !existing.time_out && row.time_in && row.time_out) {
      existing.time_in = row.time_in;
      existing.time_out = row.time_out;
    }
  });

  return Array.from(mergedMap.values()).map((row) => {
    if (!row.rendered_hours && row.time_in && row.time_out) {
      row.rendered_hours = calculateRenderedHours(
        row.time_in,
        row.time_out,
        row.lunch_break_deduction || 1
      );
    }

    return row;
  });
}

function parseSalaryRows(rawRows) {
  return rawRows
    .map((rawRow) => {
      const row = mapFlexibleRow(rawRow);

      return {
        employee_name: normalizeText(row.employee_name || row.name || row.full_name),
        employee_code: normalizeText(row.employee_code || row.code),
        department: normalizeText(row.department),
        position: normalizeText(row.position),
        daily_rate: normalizeNumber(row.daily_rate, 0),
        hourly_rate: normalizeNumber(row.hourly_rate, 0)
      };
    })
    .filter((row) => row.employee_name || row.employee_code);
}

function parsePayCycleHolidayRows(rawRows) {
  const payCycleMap = new Map();
  const holidayMap = new Map();

  rawRows.forEach((rawRow) => {
    const row = mapFlexibleRow(rawRow);

    const date = toIsoDate(row.date);
    const payCycleName = normalizeText(row.pay_cycle);
    const payCycleNo = normalizeLookup(row.pay_cycle_no || row.pay_cycle_number);
    const currentMonth = normalizeText(row.current_month);
    const year = normalizeText(row.year);
    const dayType = normalizeLookup(row.day_type);

    if (payCycleName && date) {
      if (!payCycleMap.has(payCycleName)) {
        payCycleMap.set(payCycleName, {
          cycle_name: payCycleName,
          cycle_type: payCycleNo.includes("2") ? "SECOND" : "FIRST",
          period_start: date,
          period_end: date,
          pay_date: "",
          month_label: currentMonth,
          year_label: year
        });
      } else {
        const existing = payCycleMap.get(payCycleName);
        if (date < existing.period_start) existing.period_start = date;
        if (date > existing.period_end) existing.period_end = date;
      }
    }

    if (date && dayType.includes("regular holiday")) {
      const holidayKey = `${date}__REGULAR`;
      if (!holidayMap.has(holidayKey)) {
        holidayMap.set(holidayKey, {
          holiday_name: `Regular Holiday - ${date}`,
          holiday_date: date,
          holiday_type: "REGULAR"
        });
      }
    }
  });

  Array.from(payCycleMap.values()).forEach((cycle) => {
    const periodEnd = cycle.period_end ? new Date(cycle.period_end) : null;

    if (!periodEnd || Number.isNaN(periodEnd.getTime())) {
      return;
    }

    const payDate = new Date(periodEnd);

    if (cycle.cycle_type === "FIRST") {
      payDate.setUTCMonth(payDate.getUTCMonth() + 1);
      payDate.setUTCDate(15);
    } else {
      payDate.setUTCMonth(payDate.getUTCMonth() + 1);
      payDate.setUTCDate(0);
    }

    cycle.pay_date = payDate.toISOString().slice(0, 10);
  });

  return {
    payCycles: Array.from(payCycleMap.values()),
    holidays: Array.from(holidayMap.values())
  };
}

async function ensureEmployee(row, result) {
  const employeeCode = normalizeText(row.employee_code);
  const employeeName = normalizeText(row.employee_name);

  let employee = null;

  if (employeeCode) {
    employee = await dbGet(
      `
        SELECT *
        FROM employees
        WHERE lower(employee_code) = lower(?)
      `,
      [employeeCode]
    );
  }

  if (!employee && employeeName) {
    employee = await dbGet(
      `
        SELECT *
        FROM employees
        WHERE lower(full_name) = lower(?)
      `,
      [employeeName]
    );
  }

  if (employee) return employee;

  if (!employeeName) return null;

  const latestAuto = await dbGet(
    `
      SELECT employee_code
      FROM employees
      WHERE employee_code LIKE 'AUTO-%'
      ORDER BY id DESC
      LIMIT 1
    `
  );

  let nextAutoNumber = 1;

  if (latestAuto?.employee_code) {
    const matched = latestAuto.employee_code.match(/AUTO-(\d+)/i);
    if (matched) {
      nextAutoNumber = Number(matched[1]) + 1;
    }
  }

  const autoCode = `AUTO-${String(nextAutoNumber).padStart(3, "0")}`;
  const timestamp = getCurrentTimestamp();

  const insertResult = await dbRun(
    `
      INSERT INTO employees (
        employee_code,
        full_name,
        position,
        department,
        daily_rate,
        hourly_rate,
        is_active,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `,
    [
      autoCode,
      employeeName,
      "Unassigned",
      "Unassigned",
      0,
      0,
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
    [insertResult.lastID]
  );

  result.createdEmployeesCount += 1;
  result.createdEmployees.push({
    employee_code: createdEmployee.employee_code,
    full_name: createdEmployee.full_name
  });

  return createdEmployee;
}

async function syncSalaryProfiles(salaryRows, result) {
  result.salaryProfilesDetected = salaryRows.length;

  for (const row of salaryRows) {
    let employee = null;

    if (row.employee_code) {
      employee = await dbGet(
        `
          SELECT *
          FROM employees
          WHERE lower(employee_code) = lower(?)
        `,
        [row.employee_code]
      );
    }

    if (!employee && row.employee_name) {
      employee = await dbGet(
        `
          SELECT *
          FROM employees
          WHERE lower(full_name) = lower(?)
        `,
        [row.employee_name]
      );
    }

    if (!employee) continue;

    const updateFields = [];
    const updateParams = [];

    if (row.position && row.position !== employee.position) {
      updateFields.push("position = ?");
      updateParams.push(row.position);
    }

    if (row.department && row.department !== employee.department) {
      updateFields.push("department = ?");
      updateParams.push(row.department);
    }

    if (row.daily_rate > 0 && Number(row.daily_rate) !== Number(employee.daily_rate)) {
      updateFields.push("daily_rate = ?");
      updateParams.push(row.daily_rate);
    }

    if (row.hourly_rate > 0 && Number(row.hourly_rate) !== Number(employee.hourly_rate)) {
      updateFields.push("hourly_rate = ?");
      updateParams.push(row.hourly_rate);
    }

    if (updateFields.length > 0) {
      updateFields.push("updated_at = ?");
      updateParams.push(getCurrentTimestamp());
      updateParams.push(employee.id);

      await dbRun(
        `
          UPDATE employees
          SET ${updateFields.join(", ")}
          WHERE id = ?
        `,
        updateParams
      );

      result.salaryProfilesUpdated += 1;
    }
  }
}

async function importPayCycles(payCycles, result) {
  result.payCyclesDetected = payCycles.length;

  for (const cycle of payCycles) {
    const existing = await dbGet(
      `
        SELECT id
        FROM pay_cycles
        WHERE lower(cycle_name) = lower(?)
      `,
      [cycle.cycle_name]
    );

    if (existing) continue;

    await dbRun(
      `
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
      `,
      [
        cycle.cycle_name,
        cycle.cycle_type,
        cycle.period_start,
        cycle.period_end,
        cycle.pay_date,
        cycle.month_label || "",
        cycle.year_label || "",
        getCurrentTimestamp(),
        getCurrentTimestamp()
      ]
    );

    result.payCyclesImported += 1;
  }
}

async function importHolidays(holidays, result) {
  result.holidaysDetected = holidays.length;

  for (const holiday of holidays) {
    const existing = await dbGet(
      `
        SELECT id
        FROM holidays
        WHERE holiday_date = ?
          AND upper(holiday_type) = upper(?)
      `,
      [holiday.holiday_date, holiday.holiday_type]
    );

    if (existing) continue;

    await dbRun(
      `
        INSERT INTO holidays (
          holiday_name,
          holiday_date,
          holiday_type,
          is_paid,
          notes,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, 1, '', ?, ?)
      `,
      [
        holiday.holiday_name,
        holiday.holiday_date,
        holiday.holiday_type,
        getCurrentTimestamp(),
        getCurrentTimestamp()
      ]
    );

    result.holidaysImported += 1;
  }
}

async function rowAlreadyExists(employeeId, row) {
  const existing = await dbGet(
    `
      SELECT id
      FROM attendance_records
      WHERE employee_id = ?
        AND attendance_date = ?
        AND COALESCE(time_in, '') = COALESCE(?, '')
        AND COALESCE(time_out, '') = COALESCE(?, '')
        AND ABS(COALESCE(rendered_hours, 0) - COALESCE(?, 0)) < 0.001
      LIMIT 1
    `,
    [
      employeeId,
      row.attendance_date,
      row.time_in || "",
      row.time_out || "",
      row.rendered_hours || 0
    ]
  );

  return !!existing;
}

async function parseImportedWorkbook(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });

  const attendanceSheetName =
    findSheetName(workbook, ["attendance record", "attendance"]) ||
    workbook.SheetNames[0];

  const salarySheetName = findSheetName(workbook, ["employee salary", "salary"]);
  const payCycleSheetName = findSheetName(workbook, [
    "pay cycle and holiday",
    "pay cycle",
    "holiday schedule"
  ]);

  const attendanceRowsRaw = attendanceSheetName
    ? sheetToObjects(workbook.Sheets[attendanceSheetName])
    : [];

  const salaryRowsRaw = salarySheetName
    ? sheetToObjects(workbook.Sheets[salarySheetName])
    : [];

  const payCycleRowsRaw = payCycleSheetName
    ? sheetToObjects(workbook.Sheets[payCycleSheetName])
    : [];

  const isRawLogShape =
    attendanceRowsRaw.length > 0 &&
    Object.keys(attendanceRowsRaw[0])
      .map((key) => normalizeHeader(key))
      .some((key) => ["entrytype", "entry_type"].includes(key));

  const attendanceRowsParsed = isRawLogShape
    ? parseRawAttendanceLogRows(attendanceRowsRaw)
    : parseFlatAttendanceRows(attendanceRowsRaw);

  const attendanceRowsMerged = mergeAttendanceRows(attendanceRowsParsed);
  const salaryRows = parseSalaryRows(salaryRowsRaw);
  const { payCycles, holidays } = parsePayCycleHolidayRows(payCycleRowsRaw);

  return {
    attendanceRows: attendanceRowsMerged,
    salaryRows,
    payCycles,
    holidays
  };
}

async function importAttendanceFileFromBuffer(fileBuffer, originalname = "") {
  const parsed = await parseImportedWorkbook(fileBuffer, originalname);

  const attendanceRows = parsed.attendanceRows || [];
  const salaryRows = parsed.salaryRows || [];
  const payCycles = parsed.payCycles || [];
  const holidays = parsed.holidays || [];

  const result = {
    totalRows: attendanceRows.length,
    importedCount: 0,
    duplicateCount: 0,
    failedCount: 0,
    createdEmployeesCount: 0,
    createdEmployees: [],
    salaryProfilesDetected: 0,
    salaryProfilesUpdated: 0,
    salaryProfilesCreated: 0,
    payCyclesDetected: 0,
    payCyclesImported: 0,
    holidaysDetected: 0,
    holidaysImported: 0,
    errors: [],
    duplicates: []
  };

  await syncSalaryProfiles(salaryRows, result);
  await importPayCycles(payCycles, result);
  await importHolidays(holidays, result);

  const uploadDuplicateKeys = new Set();

  for (let index = 0; index < attendanceRows.length; index += 1) {
    const row = attendanceRows[index];

    try {
      if (!row.attendance_date) {
        result.failedCount += 1;
        result.errors.push({
          rowNumber: row.rowNumber || index + 2,
          message: "attendance_date is required."
        });
        continue;
      }

      if (!row.employee_code && !row.employee_name) {
        result.failedCount += 1;
        result.errors.push({
          rowNumber: row.rowNumber || index + 2,
          message: "employee_code or employee_name is required."
        });
        continue;
      }

      const employee = await ensureEmployee(row, result);

      if (!employee) {
        result.failedCount += 1;
        result.errors.push({
          rowNumber: row.rowNumber || index + 2,
          message: "Employee could not be matched or created."
        });
        continue;
      }

      const finalRenderedHours =
        Number(row.rendered_hours || 0) ||
        calculateRenderedHours(
          row.time_in,
          row.time_out,
          Number(row.lunch_break_deduction || 1)
        );

      const duplicateKey = [
        employee.id,
        row.attendance_date,
        row.time_in || "",
        row.time_out || "",
        Number(finalRenderedHours || 0).toFixed(2)
      ].join("__");

      if (uploadDuplicateKeys.has(duplicateKey)) {
        result.duplicateCount += 1;
        result.duplicates.push({
          rowNumber: row.rowNumber || index + 2,
          message: "Duplicate row found inside the uploaded file."
        });
        continue;
      }

      uploadDuplicateKeys.add(duplicateKey);

      const alreadyExists = await rowAlreadyExists(employee.id, {
        ...row,
        rendered_hours: finalRenderedHours
      });

      if (alreadyExists) {
        result.duplicateCount += 1;
        result.duplicates.push({
          rowNumber: row.rowNumber || index + 2,
          message: "Matching attendance record already exists in the database."
        });
        continue;
      }

      await dbRun(
        `
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
        `,
        [
          employee.id,
          row.attendance_date,
          row.time_in || null,
          row.time_out || null,
          Number(finalRenderedHours || 0),
          Number(row.lunch_break_deduction || 1),
          row.notes || null,
          getCurrentTimestamp(),
          getCurrentTimestamp()
        ]
      );

      result.importedCount += 1;
    } catch (error) {
      result.failedCount += 1;
      result.errors.push({
        rowNumber: row.rowNumber || index + 2,
        message: error.message || "Failed to import row."
      });
    }
  }

  return result;
}

module.exports = {
  importAttendanceFileFromBuffer
};