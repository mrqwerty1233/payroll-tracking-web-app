import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Eye,
  FileSpreadsheet,
  Receipt,
  UserPlus
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import LoadingMessage from "../components/LoadingMessage";
import { getDashboardSummary } from "../api/dashboardApi";

const DEMO_MODE =
  String(import.meta.env.VITE_DEMO_MODE || "").toLowerCase() === "true";

const initialSummary = {
  totalEmployees: 0,
  activeEmployees: 0,
  attendanceRecords: 0,
  payCycles: 0,
  holidays: 0,
  payrollApprovals: 0,
  approvedPayrolls: 0,
  companyExpenses: 0,
  currentPayCycle: null,
  alerts: [],
  recentActivity: []
};

function formatCurrency(value) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatDate(value) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function AlertCard({ alert }) {
  const toneMap = {
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    info: "border-sky-200 bg-sky-50 text-sky-700"
  };

  return (
    <div
      className={`rounded-2xl border p-4 ${
        toneMap[alert.type] || "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="text-sm font-semibold">{alert.title}</p>
          <p className="mt-1 text-sm">{alert.message}</p>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, description }) {
  return (
    <Link
      to={to}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
    </Link>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className="mt-3 text-5xl font-bold text-slate-900">{value}</h3>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await getDashboardSummary();
        setSummary(response.data || initialSummary);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError(err.message || "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingMessage message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="Dashboard"
          description="Quick overview of your payroll tracking system."
        />

        {DEMO_MODE && (
          <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm">
            <Eye className="h-4 w-4" />
            Demo Portfolio View
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Current Pay Cycle</p>
              <p className="text-sm text-slate-500">
                Latest cycle summary and approval progress
              </p>
            </div>
          </div>

          {summary.currentPayCycle ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Cycle
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {summary.currentPayCycle.cycleName}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Coverage
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {formatDate(summary.currentPayCycle.periodStart)} to{" "}
                  {formatDate(summary.currentPayCycle.periodEnd)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Pay Date
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {formatDate(summary.currentPayCycle.payDate)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Estimated Payroll
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {formatCurrency(summary.currentPayCycle.payrollTotal)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Employees Included
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {summary.currentPayCycle.employeeCount}
                </p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                  Pending Approvals
                </p>
                <p className="mt-2 text-2xl font-bold text-amber-700">
                  {summary.currentPayCycle.pendingApprovals}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                  Approved
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-700">
                  {summary.currentPayCycle.approvedCount}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Cycle Type
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {summary.currentPayCycle.cycleType}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              No pay cycle data available yet.
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Alerts & Issues</p>
              <p className="text-sm text-slate-500">
                Things that may need your attention
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {summary.alerts?.length > 0 ? (
              summary.alerts.map((alert, index) => (
                <AlertCard key={`${alert.title}-${index}`} alert={alert} />
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                No critical dashboard alerts right now.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Quick Actions</p>
            <p className="mt-1 text-sm text-slate-500">
              Jump to the most common payroll tasks
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <QuickAction
            to="/attendance"
            icon={FileSpreadsheet}
            title="Import Attendance"
            description="Review attendance records and import the latest workbook or log file."
          />

          <QuickAction
            to="/employees"
            icon={UserPlus}
            title="Manage Employees"
            description="Add employees, update payroll profile details, and review salary rates."
          />

          <QuickAction
            to="/pay-cycles"
            icon={CalendarDays}
            title="Review Pay Cycles"
            description="Create, update, and check current payroll coverage periods."
          />

          <QuickAction
            to="/holidays"
            icon={CalendarDays}
            title="Manage Holidays"
            description="Keep regular and special holidays accurate for payroll calculations."
          />

          <QuickAction
            to="/payroll-summary"
            icon={ClipboardCheck}
            title="Review Payroll Summary"
            description="Check totals, deductions, allowances, and approve payroll entries."
          />

          <QuickAction
            to="/expenses"
            icon={Receipt}
            title="Review Company Expenses"
            description="Track salary expenses recorded from approved payrolls."
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Employees" value={summary.totalEmployees} />
        <SummaryCard label="Active Employees" value={summary.activeEmployees} />
        <SummaryCard label="Attendance Records" value={summary.attendanceRecords} />
        <SummaryCard label="Pay Cycles" value={summary.payCycles} />
        <SummaryCard label="Holidays" value={summary.holidays} />
        <SummaryCard label="Payroll Approvals" value={summary.payrollApprovals} />
        <SummaryCard label="Approved Payrolls" value={summary.approvedPayrolls} />
        <SummaryCard label="Company Expenses" value={summary.companyExpenses} />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Recent Activity</p>
            <p className="text-sm text-slate-500">
              Latest approval and expense events in the system
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {summary.recentActivity?.length > 0 ? (
            summary.recentActivity.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
                </div>

                <p className="shrink-0 text-xs text-slate-400">{item.meta}</p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              No recent activity found yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}