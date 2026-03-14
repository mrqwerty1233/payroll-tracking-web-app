export const demoPayCycles = [
  {
    id: 8,
    cycle_name: "1st-PC-April-2026",
    cycle_type: "FIRST",
    period_start: "2026-03-26",
    period_end: "2026-03-31",
    pay_date: "2026-04-15",
    month_label: "March",
    year_label: "2026"
  },
  {
    id: 7,
    cycle_name: "2nd-PC-March-2026",
    cycle_type: "SECOND",
    period_start: "2026-03-11",
    period_end: "2026-03-25",
    pay_date: "2026-03-30",
    month_label: "March",
    year_label: "2026"
  },
  {
    id: 6,
    cycle_name: "1st-PC-March-2026",
    cycle_type: "FIRST",
    period_start: "2026-02-26",
    period_end: "2026-03-10",
    pay_date: "2026-03-15",
    month_label: "February",
    year_label: "2026"
  }
];

export const demoEmployees = [
  {
    id: 1,
    employee_code: "EMP-001",
    full_name: "Javier Morales",
    email: "javier.morales@solesurgeon.demo",
    contact_number: "09171234567",
    position: "Head of Production",
    department: "Operations",
    daily_rate: 1200,
    hourly_rate: 150,
    hire_date: "2025-07-01",
    is_active: 1,
    bank_name: "BPI",
    bank_account_name: "Javier Morales",
    bank_account_number: "1234-5678-90",
    tin_number: "123-456-789-000",
    sss_number: "34-5678901-2",
    philhealth_number: "12-345678901-2",
    pagibig_number: "1234-5678-9012"
  },
  {
    id: 2,
    employee_code: "EMP-002",
    full_name: "Miguel Santoro",
    email: "miguel.santoro@solesurgeon.demo",
    contact_number: "09181234567",
    position: "Shoe Technician",
    department: "Operations",
    daily_rate: 695,
    hourly_rate: 86.88,
    hire_date: "2025-08-12",
    is_active: 1,
    bank_name: "BPI",
    bank_account_name: "Miguel Santoro",
    bank_account_number: "2234-5678-90",
    tin_number: "223-456-789-000",
    sss_number: "44-5678901-2",
    philhealth_number: "22-345678901-2",
    pagibig_number: "2234-5678-9012"
  },
  {
    id: 3,
    employee_code: "EMP-003",
    full_name: "Lorenzo Castillo",
    email: "lorenzo.castillo@solesurgeon.demo",
    contact_number: "09191234567",
    position: "Senior Technician",
    department: "Operations",
    daily_rate: 880,
    hourly_rate: 110,
    hire_date: "2025-08-20",
    is_active: 1,
    bank_name: "BPI",
    bank_account_name: "Lorenzo Castillo",
    bank_account_number: "3234-5678-90",
    tin_number: "323-456-789-000",
    sss_number: "54-5678901-2",
    philhealth_number: "32-345678901-2",
    pagibig_number: "3234-5678-9012"
  },
  {
    id: 4,
    employee_code: "AUTO-002",
    full_name: "Adrian Velasco",
    email: "adrian.velasco@solesurgeon.demo",
    contact_number: "09201234567",
    position: "Sales Associate",
    department: "Retail",
    daily_rate: 645,
    hourly_rate: 80.63,
    hire_date: "2025-10-01",
    is_active: 1,
    bank_name: "BPI",
    bank_account_name: "Adrian Velasco",
    bank_account_number: "4234-5678-90",
    tin_number: "423-456-789-000",
    sss_number: "64-5678901-2",
    philhealth_number: "42-345678901-2",
    pagibig_number: "4234-5678-9012"
  },
  {
    id: 5,
    employee_code: "AUTO-004",
    full_name: "Sophia Delgado",
    email: "sophia.delgado@solesurgeon.demo",
    contact_number: "09211234567",
    position: "Head of Sales and Operations",
    department: "Management",
    daily_rate: 1200,
    hourly_rate: 150,
    hire_date: "2025-07-15",
    is_active: 1,
    bank_name: "BPI",
    bank_account_name: "Sophia Delgado",
    bank_account_number: "5234-5678-90",
    tin_number: "523-456-789-000",
    sss_number: "74-5678901-2",
    philhealth_number: "52-345678901-2",
    pagibig_number: "5234-5678-9012"
  },
  {
    id: 6,
    employee_code: "AUTO-005",
    full_name: "Camila Torres",
    email: "camila.torres@solesurgeon.demo",
    contact_number: "09221234567",
    position: "Bag Artisan and Sales",
    department: "Retail",
    daily_rate: 695,
    hourly_rate: 86.88,
    hire_date: "2025-11-10",
    is_active: 1,
    bank_name: "BPI",
    bank_account_name: "Camila Torres",
    bank_account_number: "6234-5678-90",
    tin_number: "623-456-789-000",
    sss_number: "84-5678901-2",
    philhealth_number: "62-345678901-2",
    pagibig_number: "6234-5678-9012"
  }
];

export const demoAttendance = [
  {
    id: 101,
    employee_id: 1,
    employee_code: "EMP-001",
    employee_name: "Javier Morales",
    attendance_date: "2026-03-11",
    time_in: "09:00",
    time_out: "19:00",
    rendered_hours: 9,
    lunch_break_deduction: 1,
    notes: "On time"
  },
  {
    id: 102,
    employee_id: 2,
    employee_code: "EMP-002",
    employee_name: "Miguel Santoro",
    attendance_date: "2026-03-11",
    time_in: "09:08",
    time_out: "18:45",
    rendered_hours: 8.62,
    lunch_break_deduction: 1,
    notes: ""
  },
  {
    id: 103,
    employee_id: 3,
    employee_code: "EMP-003",
    employee_name: "Lorenzo Castillo",
    attendance_date: "2026-03-11",
    time_in: "08:55",
    time_out: "19:05",
    rendered_hours: 9.17,
    lunch_break_deduction: 1,
    notes: "Handled premium restorations"
  },
  {
    id: 104,
    employee_id: 4,
    employee_code: "AUTO-002",
    employee_name: "Adrian Velasco",
    attendance_date: "2026-03-11",
    time_in: "09:15",
    time_out: "19:04",
    rendered_hours: 8.82,
    lunch_break_deduction: 1,
    notes: "Mall branch shift"
  },
  {
    id: 105,
    employee_id: 5,
    employee_code: "AUTO-004",
    employee_name: "Sophia Delgado",
    attendance_date: "2026-03-12",
    time_in: "09:00",
    time_out: "18:30",
    rendered_hours: 8.5,
    lunch_break_deduction: 1,
    notes: "Operations review"
  },
  {
    id: 106,
    employee_id: 6,
    employee_code: "AUTO-005",
    employee_name: "Camila Torres",
    attendance_date: "2026-03-12",
    time_in: "10:00",
    time_out: "19:00",
    rendered_hours: 8,
    lunch_break_deduction: 1,
    notes: ""
  }
];

export const demoApprovals = [
  {
    id: 201,
    employee_id: 1,
    employee_code: "EMP-001",
    employee_name: "Javier Morales",
    pay_cycle_id: 7,
    pay_cycle_name: "2nd-PC-March-2026",
    pay_date: "2026-03-30",
    total_salary: 27750,
    approval_status: "APPROVED",
    status: "APPROVED",
    approved_by: "Glenn",
    approved_at: "2026-03-14 10:32:00"
  },
  {
    id: 202,
    employee_id: 4,
    employee_code: "AUTO-002",
    employee_name: "Adrian Velasco",
    pay_cycle_id: 7,
    pay_cycle_name: "2nd-PC-March-2026",
    pay_date: "2026-03-30",
    total_salary: 9136.48,
    approval_status: "APPROVED",
    status: "APPROVED",
    approved_by: "Glenn",
    approved_at: "2026-03-14 10:35:00"
  }
];

export const demoExpenses = [
  {
    id: 301,
    transaction_date: "2026-03-30",
    employee_name: "Javier Morales",
    pay_cycle_name: "2nd-PC-March-2026",
    expense_category: "Salary Expense",
    amount: 27750,
    account_name: "BPI"
  },
  {
    id: 302,
    transaction_date: "2026-03-30",
    employee_name: "Adrian Velasco",
    pay_cycle_name: "2nd-PC-March-2026",
    expense_category: "Salary Expense",
    amount: 9136.48,
    account_name: "BPI"
  }
];

export const demoDashboard = {
  totalEmployees: demoEmployees.length,
  activeEmployees: demoEmployees.filter((employee) => employee.is_active === 1).length,
  attendanceRecords: demoAttendance.length,
  payCycles: demoPayCycles.length,
  holidays: 5,
  payrollApprovals: demoApprovals.length,
  approvedPayrolls: demoApprovals.filter((item) => item.status === "APPROVED").length,
  companyExpenses: demoExpenses.length,
  currentPayCycle: {
    id: 7,
    cycleName: "2nd-PC-March-2026",
    cycleType: "SECOND",
    periodStart: "2026-03-11",
    periodEnd: "2026-03-25",
    payDate: "2026-03-30",
    monthLabel: "March",
    yearLabel: "2026",
    employeeCount: 6,
    payrollTotal: 96382.96,
    pendingApprovals: 4,
    approvedCount: 2
  },
  alerts: [
    {
      type: "warning",
      title: "Pending approvals in current pay cycle",
      message: "4 employee payroll records are still waiting for approval."
    },
    {
      type: "info",
      title: "Demo mode active",
      message: "This deployed version is using sample data for portfolio viewing."
    }
  ],
  recentActivity: [
    {
      type: "approval",
      title: "Adrian Velasco payroll approved",
      subtitle: "2nd-PC-March-2026",
      meta: "2026-03-14 10:35"
    },
    {
      type: "expense",
      title: "Salary expense recorded",
      subtitle: "₱9,136.48",
      meta: "2026-03-30"
    }
  ]
};

export const demoPayrollSummaries = {
  7: {
    payCycle: {
      id: 7,
      cycleName: "2nd-PC-March-2026",
      cycleType: "SECOND",
      periodStart: "2026-03-11",
      periodEnd: "2026-03-25",
      payDate: "2026-03-30",
      monthLabel: "March",
      yearLabel: "2026"
    },
    holidaysSummary: {
      regularHolidayCount: 1,
      regularHolidays: [
        {
          id: 1,
          holidayName: "Regular Holiday - 2026-03-21",
          holidayDate: "2026-03-21",
          holidayType: "REGULAR"
        }
      ]
    },
    totals: {
      totalHoursWorked: 258.86,
      totalBasicPay: 84146.48,
      totalHolidayPay: 5250,
      totalAllowances: 3000,
      totalDeductions: 6013.52,
      totalSalary: 86382.96
    },
    rows: [
      {
        employeeId: 1,
        employeeCode: "EMP-001",
        employeeName: "Javier Morales",
        dailyRate: 1200,
        hourlyRate: 150,
        attendanceDaysCount: 14,
        totalHoursWorked: 177,
        totalBasicPay: 26550,
        holidayPay: 1200,
        allowances: 0,
        deductions: 0,
        totalAllowances: 0,
        totalDeductions: 0,
        totalSalary: 27750,
        approvalStatus: "APPROVED"
      },
      {
        employeeId: 2,
        employeeCode: "EMP-002",
        employeeName: "Miguel Santoro",
        dailyRate: 695,
        hourlyRate: 86.88,
        attendanceDaysCount: 13,
        totalHoursWorked: 110.24,
        totalBasicPay: 9573.65,
        holidayPay: 695,
        allowances: 500,
        deductions: 250,
        totalAllowances: 500,
        totalDeductions: 250,
        totalSalary: 10518.65,
        approvalStatus: "PENDING"
      },
      {
        employeeId: 3,
        employeeCode: "EMP-003",
        employeeName: "Lorenzo Castillo",
        dailyRate: 880,
        hourlyRate: 110,
        attendanceDaysCount: 13,
        totalHoursWorked: 117.4,
        totalBasicPay: 12914,
        holidayPay: 880,
        allowances: 1000,
        deductions: 0,
        totalAllowances: 1000,
        totalDeductions: 0,
        totalSalary: 14794,
        approvalStatus: "PENDING"
      },
      {
        employeeId: 4,
        employeeCode: "AUTO-002",
        employeeName: "Adrian Velasco",
        dailyRate: 645,
        hourlyRate: 80.63,
        attendanceDaysCount: 14,
        totalHoursWorked: 136.32,
        totalBasicPay: 10991.48,
        holidayPay: 645,
        allowances: 0,
        deductions: 2500,
        totalAllowances: 0,
        totalDeductions: 2500,
        totalSalary: 9136.48,
        approvalStatus: "APPROVED"
      },
      {
        employeeId: 5,
        employeeCode: "AUTO-004",
        employeeName: "Sophia Delgado",
        dailyRate: 1200,
        hourlyRate: 150,
        attendanceDaysCount: 12,
        totalHoursWorked: 96,
        totalBasicPay: 14400,
        holidayPay: 1200,
        allowances: 1500,
        deductions: 1000,
        totalAllowances: 1500,
        totalDeductions: 1000,
        totalSalary: 16100,
        approvalStatus: "PENDING"
      },
      {
        employeeId: 6,
        employeeCode: "AUTO-005",
        employeeName: "Camila Torres",
        dailyRate: 695,
        hourlyRate: 86.88,
        attendanceDaysCount: 12,
        totalHoursWorked: 98.5,
        totalBasicPay: 8553.68,
        holidayPay: 695,
        allowances: 0,
        deductions: 2263.52,
        totalAllowances: 0,
        totalDeductions: 2263.52,
        totalSalary: 6985.16,
        approvalStatus: "PENDING"
      }
    ]
  },
  8: {
    payCycle: {
      id: 8,
      cycleName: "1st-PC-April-2026",
      cycleType: "FIRST",
      periodStart: "2026-03-26",
      periodEnd: "2026-03-31",
      payDate: "2026-04-15",
      monthLabel: "March",
      yearLabel: "2026"
    },
    holidaysSummary: {
      regularHolidayCount: 0,
      regularHolidays: []
    },
    totals: {
      totalHoursWorked: 0,
      totalBasicPay: 0,
      totalHolidayPay: 0,
      totalAllowances: 0,
      totalDeductions: 0,
      totalSalary: 0
    },
    rows: []
  }
};

export function getDemoPayrollSummary(payCycleId) {
  return demoPayrollSummaries[payCycleId] || demoPayrollSummaries[7];
}