import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import LoadingMessage from "../components/LoadingMessage";
import {
  getHolidays,
  createHoliday,
  deleteHoliday
} from "../api/holidaysApi";
import { formatDate } from "../utils/formatters";

const initialForm = {
  holiday_name: "",
  holiday_date: "",
  holiday_type: "REGULAR",
  is_paid: 1,
  notes: ""
};

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function loadHolidaysList() {
    try {
      setLoading(true);
      const result = await getHolidays();
      setHolidays(result.data || []);
    } catch (error) {
      console.error("Failed to load holidays:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHolidaysList();
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

      const result = await createHoliday({
        ...form,
        is_paid: Number(form.is_paid)
      });

      if (!result.success) {
        setMessage(result.message || "Failed to create holiday.");
        return;
      }

      setMessage("Holiday created successfully.");
      setForm(initialForm);
      await loadHolidaysList();
    } catch (error) {
      console.error("Failed to create holiday:", error);
      setMessage("Failed to create holiday.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this holiday?");

    if (!confirmed) return;

    try {
      const result = await deleteHoliday(id);

      if (!result.success) {
        setMessage(result.message || "Failed to delete holiday.");
        return;
      }

      setMessage("Holiday deleted successfully.");
      await loadHolidaysList();
    } catch (error) {
      console.error("Failed to delete holiday:", error);
      setMessage("Failed to delete holiday.");
    }
  }

  if (loading) {
    return <LoadingMessage message="Loading holidays..." />;
  }

  return (
    <div>
      <PageHeader
        title="Holidays"
        description="Add and manage holiday records used by payroll rules."
      />

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Add Holiday
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <input
            name="holiday_name"
            placeholder="Holiday Name"
            value={form.holiday_name}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            required
          />

          <input
            name="holiday_date"
            type="date"
            value={form.holiday_date}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            required
          />

          <select
            name="holiday_type"
            value={form.holiday_type}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            required
          >
            <option value="REGULAR">REGULAR</option>
            <option value="SPECIAL">SPECIAL</option>
          </select>

          <input
            name="notes"
            placeholder="Notes"
            value={form.notes}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2 xl:col-span-2"
          />

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Add Holiday"}
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
              <th className="px-4 py-3 text-left">Holiday Name</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Paid</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map((holiday) => (
              <tr key={holiday.id} className="border-t border-slate-200">
                <td className="px-4 py-3 font-medium">{holiday.holiday_name}</td>
                <td className="px-4 py-3">{formatDate(holiday.holiday_date)}</td>
                <td className="px-4 py-3">{holiday.holiday_type}</td>
                <td className="px-4 py-3">{holiday.is_paid ? "Yes" : "No"}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleDelete(holiday.id)}
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