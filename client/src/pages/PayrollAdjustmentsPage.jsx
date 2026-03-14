import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import LoadingMessage from "../components/LoadingMessage";
import { getEmployees } from "../api/employeesApi";
import { getPayCycles } from "../api/payCyclesApi";
import {
  getPayrollAdjustments,
  createPayrollAdjustment,
  updatePayrollAdjustment,
  deletePayrollAdjustment
} from "../api/payrollAdjustmentsApi";
import { formatCurrency } from "../utils/formatters";

const initialForm = {
  employee_id: "",
  pay_cycle_id: "",
  adjustment_type: "ALLOWANCE",
  adjustment_name: "",
  amount: "",
  notes: ""
};

const initialFilters = {
  payCycleId: "",
  employeeId: "",
  adjustmentType: "",
  search: ""
};

export default function PayrollAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [payCycles, setPayCycles] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState(initialFilters);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPageData(currentFilters = filters) {
    try {
      setLoading(true);

      const [adjustmentsResult, employeesResult, payCyclesResult] =
        await Promise.all([
          getPayrollAdjustments(currentFilters),
          getEmployees(),
          getPayCycles()
        ]);

      setAdjustments(adjustmentsResult.data || []);
      setEmployees(employeesResult.data || []);
      setPayCycles(payCyclesResult.data || []);
    } catch (error) {
      console.error("Failed to load payroll adjustments page:", error);
      setMessage("Failed to load payroll adjustments page.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPageData(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  async function handleApplyFilters(event) {
    event.preventDefault();
    await loadPageData(filters);
  }

  async function handleResetFilters() {
    setFilters(initialFilters);
    await loadPageData(initialFilters);
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function handleEdit(adjustment) {
    setEditingId(adjustment.id);
    setForm({
      employee_id: String(adjustment.employee_id),
      pay_cycle_id: String(adjustment.pay_cycle_id),
      adjustment_type: adjustment.adjustment_type,
      adjustment_name: adjustment.adjustment_name,
      amount: adjustment.amount,
      notes: adjustment.notes || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const payload = {
        employee_id: Number(form.employee_id),
        pay_cycle_id: Number(form.pay_cycle_id),
        adjustment_type: form.adjustment_type,
        adjustment_name: form.adjustment_name,
        amount: Number(form.amount),
        notes: form.notes
      };

      if (editingId) {
        await updatePayrollAdjustment(editingId, payload);
        setMessage("Payroll adjustment updated successfully.");
      } else {
        await createPayrollAdjustment(payload);
        setMessage("Payroll adjustment created successfully.");
      }

      resetForm();
      await loadPageData(filters);
    } catch (error) {
      console.error("Failed to save payroll adjustment:", error);
      setMessage(error.message || "Failed to save payroll adjustment.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this payroll adjustment?");
    if (!confirmed) return;

    try {
      setMessage("");
      await deletePayrollAdjustment(id);
      setMessage("Payroll adjustment deleted successfully.");
      await loadPageData(filters);
    } catch (error) {
      console.error("Failed to delete payroll adjustment:", error);
      setMessage(error.message || "Failed to delete payroll adjustment.");
    }
  }

  const totals = useMemo(() => {
    return adjustments.reduce(
      (summary, item) => {
        if (item.adjustment_type === "ALLOWANCE") {
          summary.allowances += Number(item.amount || 0);
        } else if (item.adjustment_type === "DEDUCTION") {
          summary.deductions += Number(item.amount || 0);
        }
        return summary;
      },
      {
        allowances: 0,
        deductions: 0
      }
    );
  }, [adjustments]);

  if (loading) {
    return <LoadingMessage message="Loading payroll adjustments..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Allowances and Deductions"
        description="Manage pay cycle adjustments that affect the final payroll total."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Allowances</p>
          <h3 className="mt-3 text-2xl font-bold text-emerald-700">
            {formatCurrency(totals.allowances)}
          </h3>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Deductions</p>
          <h3 className="mt-3 text-2xl font-bold text-rose-700">
            {formatCurrency(totals.deductions)}
          </h3>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            {editingId ? "Edit Adjustment" : "Add Adjustment"}
          </h2>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <select
            name="employee_id"
            value={form.employee_id}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            required
          >
            <option value="">Select Employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>

          <select
            name="pay_cycle_id"
            value={form.pay_cycle_id}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            required
          >
            <option value="">Select Pay Cycle</option>
            {payCycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.cycle_name}
              </option>
            ))}
          </select>

          <select
            name="adjustment_type"
            value={form.adjustment_type}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            required
          >
            <option value="ALLOWANCE">ALLOWANCE</option>
            <option value="DEDUCTION">DEDUCTION</option>
          </select>

          <input
            type="text"
            name="adjustment_name"
            placeholder="Adjustment Name"
            value={form.adjustment_name}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            required
          />

          <input
            type="number"
            step="0.01"
            name="amount"
            placeholder="Amount"
            value={form.amount}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            required
          />

          <input
            type="text"
            name="notes"
            placeholder="Notes"
            value={form.notes}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />
        </div>

        <div className="mt-5">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-400"
          >
            {saving
              ? editingId
                ? "Updating..."
                : "Saving..."
              : editingId
              ? "Update Adjustment"
              : "Add Adjustment"}
          </button>
        </div>
      </form>

      {message ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-700">
          {message}
        </div>
      ) : null}

      <form
        onSubmit={handleApplyFilters}
        className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <select
            name="payCycleId"
            value={filters.payCycleId}
            onChange={handleFilterChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          >
            <option value="">All Pay Cycles</option>
            {payCycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.cycle_name}
              </option>
            ))}
          </select>

          <select
            name="employeeId"
            value={filters.employeeId}
            onChange={handleFilterChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          >
            <option value="">All Employees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>

          <select
            name="adjustmentType"
            value={filters.adjustmentType}
            onChange={handleFilterChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          >
            <option value="">All Types</option>
            <option value="ALLOWANCE">ALLOWANCE</option>
            <option value="DEDUCTION">DEDUCTION</option>
          </select>

          <input
            type="text"
            name="search"
            placeholder="Search adjustment"
            value={filters.search}
            onChange={handleFilterChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Apply Filters
          </button>

          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Reset Filters
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-4 font-semibold">Pay Cycle</th>
                <th className="px-4 py-4 font-semibold">Employee</th>
                <th className="px-4 py-4 font-semibold">Type</th>
                <th className="px-4 py-4 font-semibold">Name</th>
                <th className="px-4 py-4 font-semibold">Amount</th>
                <th className="px-4 py-4 font-semibold">Notes</th>
                <th className="px-4 py-4 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {adjustments.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No payroll adjustments found.
                  </td>
                </tr>
              ) : (
                adjustments.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200">
                    <td className="px-4 py-4">{item.cycle_name}</td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">
                        {item.employee_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.employee_code}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          item.adjustment_type === "ALLOWANCE"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {item.adjustment_type}
                      </span>
                    </td>
                    <td className="px-4 py-4">{item.adjustment_name}</td>
                    <td className="px-4 py-4 font-semibold">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-4 py-4">{item.notes || "-"}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}