import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import LoadingMessage from "../components/LoadingMessage";
import {
  getPayCycles,
  createPayCycle,
  deletePayCycle
} from "../api/payCyclesApi";
import { formatDate } from "../utils/formatters";

const initialForm = {
  cycle_name: "",
  cycle_type: "FIRST",
  period_start: "",
  period_end: "",
  pay_date: "",
  month_label: "",
  year_label: ""
};

export default function PayCyclesPage() {
  const [payCycles, setPayCycles] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPayCyclesList() {
    try {
      setLoading(true);
      const result = await getPayCycles();
      setPayCycles(result.data || []);
    } catch (error) {
      console.error("Failed to load pay cycles:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayCyclesList();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");

      const result = await createPayCycle({
        ...form,
        year_label: Number(form.year_label)
      });

      if (!result.success) {
        setMessage(result.message || "Failed to create pay cycle.");
        return;
      }

      setMessage("Pay cycle created successfully.");
      setForm(initialForm);
      await loadPayCyclesList();
    } catch (error) {
      console.error("Failed to create pay cycle:", error);
      setMessage("Failed to create pay cycle.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this pay cycle?");

    if (!confirmed) return;

    try {
      const result = await deletePayCycle(id);

      if (!result.success) {
        setMessage(result.message || "Failed to delete pay cycle.");
        return;
      }

      setMessage("Pay cycle deleted successfully.");
      await loadPayCyclesList();
    } catch (error) {
      console.error("Failed to delete pay cycle:", error);
      setMessage("Failed to delete pay cycle.");
    }
  }

  if (loading) {
    return <LoadingMessage message="Loading pay cycles..." />;
  }

  return (
    <div>
      <PageHeader
        title="Pay Cycles"
        description="Add and manage payroll cutoff periods and salary release dates."
      />

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Add Pay Cycle
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <input
            name="cycle_name"
            placeholder="Cycle Name"
            value={form.cycle_name}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            required
          />

          <select
            name="cycle_type"
            value={form.cycle_type}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            required
          >
            <option value="FIRST">FIRST</option>
            <option value="SECOND">SECOND</option>
          </select>

          <input
            name="period_start"
            type="date"
            value={form.period_start}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            required
          />

          <input
            name="period_end"
            type="date"
            value={form.period_end}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            required
          />

          <input
            name="pay_date"
            type="date"
            value={form.pay_date}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            required
          />

          <input
            name="month_label"
            placeholder="Month Label"
            value={form.month_label}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />

          <input
            name="year_label"
            type="number"
            placeholder="Year Label"
            value={form.year_label}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />

          <div className="md:col-span-2 xl:col-span-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Add Pay Cycle"}
            </button>
          </div>
        </form>

        {message ? (
          <p className="mt-4 text-sm text-slate-600">{message}</p>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Cycle Name</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Period Start</th>
              <th className="px-4 py-3 text-left">Period End</th>
              <th className="px-4 py-3 text-left">Pay Date</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {payCycles.map((cycle) => (
              <tr key={cycle.id} className="border-t border-slate-200">
                <td className="px-4 py-3 font-medium">{cycle.cycle_name}</td>
                <td className="px-4 py-3">{cycle.cycle_type}</td>
                <td className="px-4 py-3">{formatDate(cycle.period_start)}</td>
                <td className="px-4 py-3">{formatDate(cycle.period_end)}</td>
                <td className="px-4 py-3">{formatDate(cycle.pay_date)}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleDelete(cycle.id)}
                    className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}