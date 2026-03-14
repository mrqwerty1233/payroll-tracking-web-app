import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import LoadingMessage from "../components/LoadingMessage";
import { getPayCycles } from "../api/payCyclesApi";
import { getApprovalsByPayCycle, approvePayroll } from "../api/approvalsApi";
import {
  getPayrollSummary,
  exportPayrollJson,
  exportPayrollBpiCsv
} from "../api/payrollApi";
import { formatCurrency, formatDate, formatNumber } from "../utils/formatters";

export default function PayrollSummaryPage() {
  const [payCycles, setPayCycles] = useState([]);
  const [selectedPayCycleId, setSelectedPayCycleId] = useState("");
  const [summaryData, setSummaryData] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadPayCycles() {
    const response = await getPayCycles();
    const cycles = response.data || [];
    setPayCycles(cycles);

    if (!selectedPayCycleId && cycles.length > 0) {
      setSelectedPayCycleId(String(cycles[0].id));
    }
  }

  async function loadSummary(payCycleId) {
    if (!payCycleId) return;

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const [summaryResponse, approvalsResponse] = await Promise.all([
        getPayrollSummary(payCycleId),
        getApprovalsByPayCycle(payCycleId)
      ]);

      setSummaryData(summaryResponse.data || null);
      setApprovals(approvalsResponse.data || []);
    } catch (err) {
      setError(err.message || "Failed to generate payroll summary.");
      setSummaryData(null);
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayCycles().catch((err) => {
      setError(err.message || "Failed to load pay cycles.");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedPayCycleId) {
      loadSummary(selectedPayCycleId);
    }
  }, [selectedPayCycleId]);

  const approvalMap = useMemo(() => {
    const map = new Map();
    approvals.forEach((approval) => {
      map.set(approval.employee_id, approval);
    });
    return map;
  }, [approvals]);

  const rows = useMemo(() => {
    if (!summaryData?.rows) return [];

    return summaryData.rows.map((row) => {
      const approval = approvalMap.get(row.employeeId);

      return {
        ...row,
        approvalStatus: approval?.status || row.approvalStatus || "PENDING"
      };
    });
  }, [summaryData, approvalMap]);

  const totals = useMemo(() => {
    if (!rows.length) {
      return {
        totalHoursWorked: 0,
        totalBasicPay: 0,
        totalHolidayPay: 0,
        totalAllowances: 0,
        totalDeductions: 0,
        totalSalary: 0
      };
    }

    return rows.reduce(
      (accumulator, row) => {
        accumulator.totalHoursWorked += Number(row.totalHoursWorked || 0);
        accumulator.totalBasicPay += Number(row.totalBasicPay || 0);
        accumulator.totalHolidayPay += Number(row.holidayPay || 0);
        accumulator.totalAllowances += Number(row.totalAllowances || 0);
        accumulator.totalDeductions += Number(row.totalDeductions || 0);
        accumulator.totalSalary += Number(row.totalSalary || 0);
        return accumulator;
      },
      {
        totalHoursWorked: 0,
        totalBasicPay: 0,
        totalHolidayPay: 0,
        totalAllowances: 0,
        totalDeductions: 0,
        totalSalary: 0
      }
    );
  }, [rows]);

  async function handleApprove(employeeId) {
    if (!selectedPayCycleId) return;

    setActionLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const employeeRow = rows.find((row) => row.employeeId === employeeId);

      await approvePayroll({
        employee_id: employeeId,
        pay_cycle_id: Number(selectedPayCycleId),
        total_salary: employeeRow?.totalSalary || 0,
        approved_by: "Glenn"
      });

      setSuccessMessage("Payroll approval saved successfully.");
      await loadSummary(selectedPayCycleId);
    } catch (err) {
      setError(err.message || "Failed to approve payroll.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleExportJson() {
    if (!selectedPayCycleId) return;

    try {
      const response = await exportPayrollJson(selectedPayCycleId);
      const dataStr = JSON.stringify(response, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `payroll-export-${selectedPayCycleId}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Failed to export payroll JSON.");
    }
  }

  async function handleExportBpiCsv() {
    if (!selectedPayCycleId) return;

    try {
      const blob = await exportPayrollBpiCsv(selectedPayCycleId);
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `bpi-payroll-${selectedPayCycleId}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Failed to export BPI CSV.");
    }
  }

  const payCycle = summaryData?.payCycle;
  const holidaysSummary = summaryData?.holidaysSummary;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Summary"
        description="Dynamic payroll review page with one unique row per employee per pay cycle."
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Select Pay Cycle
            </label>
            <select
              value={selectedPayCycleId}
              onChange={(event) => setSelectedPayCycleId(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            >
              {payCycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.cycle_name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Coverage Period
            </p>
            <p className="mt-2 text-sm text-slate-800">
              {payCycle
                ? `${formatDate(payCycle.periodStart)} to ${formatDate(
                    payCycle.periodEnd
                  )}`
                : "-"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pay Date
            </p>
            <p className="mt-2 text-sm text-slate-800">
              {payCycle ? formatDate(payCycle.payDate) : "-"}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-800">
          This table is review-friendly and can be used as the final payroll summary
          for checking, screenshotting, printing, or later export.
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            className="rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-900"
          >
            Export JSON
          </button>

          <button
            type="button"
            onClick={handleExportBpiCsv}
            className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Export BPI CSV
          </button>
        </div>

        {holidaysSummary?.regularHolidayCount > 0 && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <p className="font-semibold text-emerald-800">
              Regular Holidays in This Pay Cycle:{" "}
              {holidaysSummary.regularHolidayCount}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {holidaysSummary.regularHolidays.map((holiday) => (
                <span
                  key={holiday.id}
                  className="rounded-full bg-white px-3 py-1 text-sm text-emerald-700 ring-1 ring-emerald-200"
                >
                  {holiday.holidayName} - {formatDate(holiday.holidayDate)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-700">
          {successMessage}
        </div>
      )}

      {loading ? (
        <LoadingMessage message="Loading payroll summary..." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Hours Worked</p>
              <h3 className="mt-3 text-2xl font-bold text-slate-900">
                {formatNumber(totals.totalHoursWorked)}
              </h3>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Basic Pay</p>
              <h3 className="mt-3 text-2xl font-bold text-slate-900">
                {formatCurrency(totals.totalBasicPay)}
              </h3>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Holiday Pay</p>
              <h3 className="mt-3 text-2xl font-bold text-slate-900">
                {formatCurrency(totals.totalHolidayPay)}
              </h3>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Allowances</p>
              <h3 className="mt-3 text-2xl font-bold text-emerald-700">
                {formatCurrency(totals.totalAllowances)}
              </h3>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Deductions</p>
              <h3 className="mt-3 text-2xl font-bold text-rose-700">
                {formatCurrency(totals.totalDeductions)}
              </h3>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Salary</p>
              <h3 className="mt-3 text-2xl font-bold text-slate-900">
                {formatCurrency(totals.totalSalary)}
              </h3>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-4 py-4 font-semibold">Employee</th>
                    <th className="px-4 py-4 font-semibold">Daily Rate</th>
                    <th className="px-4 py-4 font-semibold">Hourly Rate</th>
                    <th className="px-4 py-4 font-semibold">Attendance Days</th>
                    <th className="px-4 py-4 font-semibold">Total Hours Worked</th>
                    <th className="px-4 py-4 font-semibold">Total Basic Pay</th>
                    <th className="px-4 py-4 font-semibold">Holiday Pay</th>
                    <th className="px-4 py-4 font-semibold">Allowances</th>
                    <th className="px-4 py-4 font-semibold">Deductions</th>
                    <th className="px-4 py-4 font-semibold">Total Salary</th>
                    <th className="px-4 py-4 font-semibold">Status</th>
                    <th className="px-4 py-4 font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan="12"
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        No payroll summary rows found for the selected pay cycle.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const isApproved =
                        String(row.approvalStatus).toUpperCase() === "APPROVED";

                      return (
                        <tr
                          key={row.employeeId}
                          className="border-t border-slate-200"
                        >
                          <td className="px-4 py-4">
                            <div className="font-semibold text-slate-900">
                              {row.employeeName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {row.employeeCode}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {formatCurrency(row.dailyRate)}
                          </td>
                          <td className="px-4 py-4">
                            {formatCurrency(row.hourlyRate)}
                          </td>
                          <td className="px-4 py-4">{row.attendanceDaysCount}</td>
                          <td className="px-4 py-4">
                            {formatNumber(row.totalHoursWorked)}
                          </td>
                          <td className="px-4 py-4">
                            {formatCurrency(row.totalBasicPay)}
                          </td>
                          <td className="px-4 py-4">
                            {formatCurrency(row.holidayPay)}
                          </td>
                          <td className="px-4 py-4 text-emerald-700 font-semibold">
                            {formatCurrency(row.totalAllowances)}
                          </td>
                          <td className="px-4 py-4 text-rose-700 font-semibold">
                            {formatCurrency(row.totalDeductions)}
                          </td>
                          <td className="px-4 py-4 font-semibold text-slate-900">
                            {formatCurrency(row.totalSalary)}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                isApproved
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {isApproved ? "Approved" : "Pending"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              disabled={isApproved || actionLoading}
                              onClick={() => handleApprove(row.employeeId)}
                              className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white ${
                                isApproved
                                  ? "cursor-not-allowed bg-slate-400"
                                  : "bg-slate-900 hover:bg-slate-700"
                              }`}
                            >
                              {isApproved ? "Approved" : "Approve"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}