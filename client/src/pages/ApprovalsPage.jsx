import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import LoadingMessage from "../components/LoadingMessage";
import { getApprovals } from "../api/approvalsApi";
import { getPayCycles } from "../api/payCyclesApi";
import { formatCurrency, formatDate } from "../utils/formatters";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [payCycles, setPayCycles] = useState([]);
  const [selectedPayCycleId, setSelectedPayCycleId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [loading, setLoading] = useState(true);

  async function loadApprovals() {
    try {
      setLoading(true);
      const [approvalsResult, payCyclesResult] = await Promise.all([
        getApprovals(selectedPayCycleId, selectedStatus),
        getPayCycles()
      ]);

      setApprovals(approvalsResult.data || []);
      setPayCycles(payCyclesResult.data || []);
    } catch (error) {
      console.error("Failed to load approvals:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApprovals();
  }, [selectedPayCycleId, selectedStatus]);

  if (loading) {
    return <LoadingMessage message="Loading approvals..." />;
  }

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="Review payroll approval snapshots with filters."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <select
          value={selectedPayCycleId}
          onChange={(event) => setSelectedPayCycleId(event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All Pay Cycles</option>
          {payCycles.map((cycle) => (
            <option key={cycle.id} value={cycle.id}>
              {cycle.cycle_name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="APPROVED">APPROVED</option>
          <option value="PENDING">PENDING</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">Pay Cycle</th>
              <th className="px-4 py-3 text-left">Total Salary</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Approved By</th>
              <th className="px-4 py-3 text-left">Approved At</th>
            </tr>
          </thead>
          <tbody>
            {approvals.length ? (
              approvals.map((row) => (
                <tr key={row.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium">{row.employee_name}</td>
                  <td className="px-4 py-3">{row.pay_cycle_name}</td>
                  <td className="px-4 py-3">
                    {formatCurrency(row.total_salary)}
                  </td>
                  <td className="px-4 py-3">{row.approval_status}</td>
                  <td className="px-4 py-3">{row.approved_by || "-"}</td>
                  <td className="px-4 py-3">{formatDate(row.approved_at)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                  No approval records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}