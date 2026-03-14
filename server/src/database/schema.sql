PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_code TEXT,
    full_name TEXT NOT NULL,
    daily_rate REAL NOT NULL CHECK (daily_rate >= 0),
    hourly_rate REAL NOT NULL CHECK (hourly_rate >= 0),
    position TEXT,
    department TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    attendance_date TEXT NOT NULL,
    time_in TEXT,
    time_out TEXT,
    rendered_hours REAL NOT NULL CHECK (rendered_hours >= 0),
    lunch_break_deduction REAL NOT NULL DEFAULT 1 CHECK (lunch_break_deduction >= 0),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pay_cycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cycle_name TEXT NOT NULL,
    cycle_type TEXT NOT NULL CHECK (cycle_type IN ('FIRST', 'SECOND')),
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    pay_date TEXT NOT NULL,
    month_label TEXT,
    year_label INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    holiday_name TEXT NOT NULL,
    holiday_date TEXT NOT NULL,
    holiday_type TEXT NOT NULL CHECK (holiday_type IN ('REGULAR', 'SPECIAL')),
    is_paid INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    pay_cycle_id INTEGER NOT NULL,
    total_hours_worked REAL NOT NULL DEFAULT 0,
    total_basic_pay REAL NOT NULL DEFAULT 0,
    holiday_pay REAL NOT NULL DEFAULT 0,
    total_salary REAL NOT NULL DEFAULT 0,
    approval_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED')),
    approved_by TEXT,
    approved_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (pay_cycle_id) REFERENCES pay_cycles(id) ON DELETE CASCADE,
    UNIQUE(employee_id, pay_cycle_id)
);

CREATE TABLE IF NOT EXISTS company_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    pay_cycle_id INTEGER NOT NULL,
    transaction_date TEXT NOT NULL,
    expense_category TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount >= 0),
    account_name TEXT NOT NULL,
    remarks TEXT,
    source_approval_id INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (pay_cycle_id) REFERENCES pay_cycles(id) ON DELETE CASCADE,
    FOREIGN KEY (source_approval_id) REFERENCES payroll_approvals(id) ON DELETE SET NULL
);