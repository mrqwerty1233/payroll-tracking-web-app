import {
  demoApprovals,
  demoAttendance,
  demoDashboard,
  demoEmployees,
  demoExpenses,
  demoPayCycles,
  getDemoPayrollSummary
} from "../demo/demoData";

export const DEMO_MODE = String(import.meta.env.VITE_DEMO_MODE || "").toLowerCase() === "true";

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
export const API_BASE_URL = RAW_BASE_URL.endsWith("/api")
  ? RAW_BASE_URL
  : `${RAW_BASE_URL}/api`;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function parseJsonSafe(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiJson(path, options = {}) {
  const { fallbackData = null, errorMessage = "Request failed." } = options;

  if (DEMO_MODE) {
    return {
      success: true,
      demoMode: true,
      data: clone(fallbackData)
    };
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await parseJsonSafe(response);

  if (!response.ok || (data && data.success === false)) {
    throw new Error(data?.message || errorMessage);
  }

  return data ?? { success: true, data: null };
}

export async function apiJsonWithDemoFallback(path, options = {}) {
  const { fallbackData = null, errorMessage = "Request failed." } = options;

  if (DEMO_MODE) {
    return {
      success: true,
      demoMode: true,
      data: clone(fallbackData)
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    const data = await parseJsonSafe(response);

    if (!response.ok || (data && data.success === false)) {
      throw new Error(data?.message || errorMessage);
    }

    return data ?? { success: true, data: null };
  } catch (error) {
    return {
      success: true,
      demoMode: true,
      data: clone(fallbackData)
    };
  }
}

export async function demoWriteSuccess(message = "Demo mode active. Changes are not saved.") {
  return {
    success: true,
    demoMode: true,
    message
  };
}

export function getDemoDashboard() {
  return clone(demoDashboard);
}

export function getDemoEmployees(search = "") {
  const keyword = String(search || "").trim().toLowerCase();

  if (!keyword) return clone(demoEmployees);

  return clone(
    demoEmployees.filter((employee) =>
      [
        employee.full_name,
        employee.employee_code,
        employee.position,
        employee.department
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    )
  );
}

export function getDemoAttendance(filters = {}) {
  let rows = [...demoAttendance];

  if (filters.payCycleId) {
    const cycle = demoPayCycles.find((item) => String(item.id) === String(filters.payCycleId));
    if (cycle) {
      rows = rows.filter(
        (row) =>
          row.attendance_date >= cycle.period_start &&
          row.attendance_date <= cycle.period_end
      );
    }
  }

  if (filters.month) {
    rows = rows.filter((row) => row.attendance_date.startsWith(filters.month));
  }

  if (filters.employeeId) {
    rows = rows.filter((row) => String(row.employee_id) === String(filters.employeeId));
  }

  if (filters.search) {
    const keyword = String(filters.search).trim().toLowerCase();
    rows = rows.filter((row) =>
      [row.employee_name, row.employee_code, row.notes, row.attendance_date]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }

  switch (filters.sort) {
    case "date_asc":
      rows.sort((a, b) => a.attendance_date.localeCompare(b.attendance_date));
      break;
    case "employee_asc":
      rows.sort((a, b) => a.employee_name.localeCompare(b.employee_name));
      break;
    case "employee_desc":
      rows.sort((a, b) => b.employee_name.localeCompare(a.employee_name));
      break;
    default:
      rows.sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
      break;
  }

  return clone(rows);
}

export function getDemoApprovals(payCycleId = "", status = "") {
  let rows = [...demoApprovals];

  if (payCycleId) {
    rows = rows.filter((item) => String(item.pay_cycle_id) === String(payCycleId));
  }

  if (status) {
    rows = rows.filter(
      (item) => String(item.approval_status || item.status).toUpperCase() === String(status).toUpperCase()
    );
  }

  return clone(rows);
}

export function getDemoExpenses(payCycleId = "") {
  if (!payCycleId) return clone(demoExpenses);

  const cycle = demoPayCycles.find((item) => String(item.id) === String(payCycleId));
  if (!cycle) return [];

  return clone(demoExpenses.filter((item) => item.pay_cycle_name === cycle.cycle_name));
}

export function getDemoPayCycles() {
  return clone(demoPayCycles);
}

export function getDemoPayrollSummaryResponse(payCycleId) {
  return {
    success: true,
    demoMode: true,
    data: clone(getDemoPayrollSummary(Number(payCycleId) || 7))
  };
}

export function getDemoPayrollExport(payCycleId) {
  const summary = getDemoPayrollSummary(Number(payCycleId) || 7);

  return {
    success: true,
    demoMode: true,
    payCycle: summary.payCycle,
    rows: summary.rows.map((row) => ({
      employee_name: row.employeeName,
      employee_code: row.employeeCode,
      pay_cycle: summary.payCycle.cycleName,
      pay_date: summary.payCycle.payDate,
      total_hours_worked: row.totalHoursWorked,
      total_basic_pay: row.totalBasicPay,
      holiday_pay: row.holidayPay,
      allowances: row.totalAllowances,
      deductions: row.totalDeductions,
      total_salary: row.totalSalary,
      approval_status: row.approvalStatus
    }))
  };
}

export function getDemoBpiCsvBlob(payCycleId) {
  const summary = getDemoPayrollSummary(Number(payCycleId) || 7);

  const lines = [
    ["employee_code", "employee_name", "pay_date", "amount", "remarks"].join(","),
    ...summary.rows.map((row) =>
      [
        row.employeeCode,
        `"${row.employeeName}"`,
        summary.payCycle.payDate,
        row.totalSalary.toFixed(2),
        `"${summary.payCycle.cycleName} Payroll"`
      ].join(",")
    )
  ];

  return new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
}