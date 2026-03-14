import { NavLink } from "react-router-dom";

const navItems = [
  {
    label: "Dashboard",
    path: "/",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="8" height="8" rx="2" />
        <rect x="13" y="3" width="8" height="5" rx="2" />
        <rect x="13" y="10" width="8" height="11" rx="2" />
        <rect x="3" y="13" width="8" height="8" rx="2" />
      </svg>
    )
  },
  {
    label: "Employees",
    path: "/employees",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
  {
    label: "Attendance",
    path: "/attendance",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 10h18" />
        <path d="M9 16l2 2 4-4" />
      </svg>
    )
  },
  {
    label: "Pay Cycles",
    path: "/pay-cycles",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    )
  },
  {
    label: "Holidays",
    path: "/holidays",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 10h18" />
        <path d="M12 14h.01" />
        <path d="M8 14h.01" />
        <path d="M16 14h.01" />
      </svg>
    )
  },
  {
    label: "Payroll Summary",
    path: "/payroll-summary",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 3h18v18H3z" />
        <path d="M7 15l3-3 2 2 5-5" />
      </svg>
    )
  },
  {
    label: "Allowances & Deductions",
    path: "/payroll-adjustments",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 1v22" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )
  },
  {
    label: "Approvals",
    path: "/approvals",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    )
  },
  {
    label: "Expenses",
    path: "/expenses",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 6h18" />
        <path d="M19 6v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M12 11v6" />
        <path d="M9 14h6" />
      </svg>
    )
  }
];

export default function Navbar({ collapsed, setCollapsed }) {
  return (
    <aside
      className={`bg-slate-950 text-white transition-all duration-300
        lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:flex-col lg:border-r lg:border-slate-800
        ${collapsed ? "lg:w-24" : "lg:w-80"}
        w-full border-b border-slate-800`}
    >
      <div className="flex items-start justify-between border-b border-slate-800 px-4 py-5 lg:px-5">
        <div className={collapsed ? "hidden lg:hidden" : "block"}>
          <h1 className="text-2xl font-bold leading-tight text-white">
            Payroll Tracking App
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Sole Surgeon Practical Exam System
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "☰" : "✕"}
        </button>
      </div>

      <nav className="flex flex-wrap gap-2 px-3 py-4 lg:flex-1 lg:flex-col lg:flex-nowrap lg:overflow-y-auto lg:gap-2 lg:px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            title={collapsed ? item.label : ""}
            className={({ isActive }) =>
              `rounded-2xl px-4 py-3 text-sm font-medium leading-5 transition ${
                collapsed
                  ? "flex items-center justify-center lg:px-2"
                  : "flex items-center gap-3 whitespace-normal lg:px-4"
              } ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`
            }
          >
            <span className="flex items-center justify-center">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}