import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import LoadingMessage from "../components/LoadingMessage";
import { getEmployees } from "../api/employeesApi";
import {
  getAttendance,
  createAttendance,
  deleteAttendance,
  importAttendanceFile
} from "../api/attendanceApi";
import { getPayCycles } from "../api/payCyclesApi";
import { formatDate, formatNumber } from "../utils/formatters";

const initialForm = {
  employee_id: "",
  attendance_date: "",
  time_in: "",
  time_out: "",
  rendered_hours: "",
  lunch_break_deduction: 1,
  notes: ""
};

const initialImportResult = {
  totalRows: 0,
  importedCount: 0,
  duplicateCount: 0,
  failedCount: 0,
  createdEmployeesCount: 0,
  createdEmployees: [],
  salaryProfilesDetected: 0,
  salaryProfilesUpdated: 0,
  salaryProfilesCreated: 0,
  payCyclesDetected: 0,
  payCyclesImported: 0,
  holidaysDetected: 0,
  holidaysImported: 0,
  errors: [],
  duplicates: []
};

export default function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [payCycles, setPayCycles] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadPageData() {
    try {
      setLoading(true);
      setError("");

      const [attendanceResponse, employeesResponse, payCyclesResponse] =
        await Promise.all([
          getAttendance(),
          getEmployees(),
          getPayCycles()
        ]);

      const attendanceData = Array.isArray(attendanceResponse?.data)
        ? attendanceResponse.data
        : [];

      const employeesData = Array.isArray(employeesResponse?.data)
        ? employeesResponse.data
        : [];

      const payCyclesData = Array.isArray(payCyclesResponse?.data)
        ? payCyclesResponse.data
        : [];

      const sortedAttendance = [...attendanceData].sort((a, b) => {
        const dateA = new Date(a.attendance_date);
        const dateB = new Date(b.attendance_date);

        if (dateB - dateA !== 0) {
          return dateB - dateA;
        }

        return String(a.employee_name || "").localeCompare(
          String(b.employee_name || "")
        );
      });

      setAttendanceRecords(sortedAttendance);
      setEmployees(employeesData);
      setPayCycles(payCyclesData);
    } catch (err) {
      console.error("Failed to load attendance page:", err);
      setError("Failed to load attendance page.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPageData();
  }, []);

  const employeeOptions = useMemo(() => {
    return [...employees].sort((a, b) =>
      String(a.full_name || "").localeCompare(String(b.full_name || ""))
    );
  }, [employees]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  function resetForm() {
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const payload = {
        employee_id: Number(form.employee_id),
        attendance_date: form.attendance_date,
        time_in: form.time_in,
        time_out: form.time_out,
        rendered_hours: Number(form.rendered_hours),
        lunch_break_deduction: Number(form.lunch_break_deduction || 0),
        notes: form.notes
      };

      await createAttendance(payload);

      setMessage("Attendance record added successfully.");
      resetForm();
      await loadPageData();
    } catch (err) {
      console.error("Failed to create attendance:", err);
      setError(err.message || "Failed to add attendance record.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this attendance record?"
    );

    if (!confirmed) return;

    try {
      setMessage("");
      setError("");

      await deleteAttendance(id);
      setMessage("Attendance record deleted successfully.");
      await loadPageData();
    } catch (err) {
      console.error("Failed to delete attendance:", err);
      setError(err.message || "Failed to delete attendance record.");
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  }

  async function handleImportFile() {
    if (!selectedFile) {
      setError("Please choose a file to import.");
      return;
    }

    try {
      setImporting(true);
      setMessage("");
      setError("");
      setImportResult(null);

      const response = await importAttendanceFile(selectedFile);

      setImportResult(response?.data || initialImportResult);
      setMessage("Attendance import completed.");
      setSelectedFile(null);

      const fileInput = document.getElementById("attendance-import-input");
      if (fileInput) {
        fileInput.value = "";
      }

      await loadPageData();
    } catch (err) {
      console.error("Failed to import attendance file:", err);
      setError(err.message || "Failed to import attendance file.");
    } finally {
      setImporting(false);
    }
  }

  if (loading) {
    return <LoadingMessage message="Loading attendance page..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Add, review, and import daily attendance records used in payroll."
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-5 text-2xl font-bold text-slate-900">
          Import Attendance File
        </h2>

        <div className="flex flex-col gap-4 lg:flex-row">
          <input
            id="attendance-import-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium"
          />

          <button
            type="button"
            onClick={handleImportFile}
            disabled={importing}
            className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-400"
          >
            {importing ? "Importing..." : "Import File"}
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Supported workbook import:</p>
          <p className="mt-2">
            The importer can now read attendance, employee salary, pay cycles, and
            regular holidays from a supported Excel workbook.
          </p>
          <p className="mt-2">
            It also supports raw attendance log sheets with Employee Name, Date,
            EntryType, Time, and Duration.
          </p>
        </div>

        {importResult && (
          <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
              <div>
                <p className="text-sm font-semibold text-slate-800">Total Rows</p>
                <p className="mt-1 text-sm text-slate-600">
                  {importResult.totalRows}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">Imported</p>
                <p className="mt-1 text-sm text-slate-600">
                  {importResult.importedCount}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Duplicates Skipped
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {importResult.duplicateCount}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">Failed</p>
                <p className="mt-1 text-sm text-slate-600">
                  {importResult.failedCount}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Employees Auto-Created
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {importResult.createdEmployeesCount}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Salary Profiles Detected
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {importResult.salaryProfilesDetected}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Pay Cycles Imported
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {importResult.payCyclesImported}
                </p>
              </div>
            </div>

            {(importResult.createdEmployees?.length > 0 ||
              importResult.duplicates?.length > 0 ||
              importResult.errors?.length > 0) && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="max-h-80 overflow-y-auto pr-2">
                  {importResult.createdEmployees?.length > 0 && (
                    <div className="mb-5">
                      <p className="font-semibold text-emerald-700">
                        Auto-Created Employees:
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-700">
                        {importResult.createdEmployees.map((employee, index) => (
                          <li key={`${employee.employee_code}-${index}`}>
                            {employee.full_name} ({employee.employee_code})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {importResult.duplicates?.length > 0 && (
                    <div className="mb-5">
                      <p className="font-semibold text-amber-700">
                        Duplicate Rows Skipped:
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-700">
                        {importResult.duplicates.map((item, index) => (
                          <li key={`duplicate-${index}`}>
                            Row {item.rowNumber}: {item.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {importResult.errors?.length > 0 && (
                    <div>
                      <p className="font-semibold text-rose-700">Import Errors:</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-700">
                        {importResult.errors.map((item, index) => (
                          <li key={`error-${index}`}>
                            Row {item.rowNumber}: {item.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="mb-5 text-2xl font-bold text-slate-900">
          Add Attendance Record
        </h2>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <select
            name="employee_id"
            value={form.employee_id}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            required
          >
            <option value="">Select Employee</option>
            {employeeOptions.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>

          <input
            type="date"
            name="attendance_date"
            value={form.attendance_date}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            required
          />

          <input
            type="time"
            name="time_in"
            value={form.time_in}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            required
          />

          <input
            type="time"
            name="time_out"
            value={form.time_out}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            required
          />

          <input
            type="number"
            step="0.01"
            name="rendered_hours"
            placeholder="Rendered Hours"
            value={form.rendered_hours}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            required
          />

          <input
            type="number"
            step="0.01"
            name="lunch_break_deduction"
            placeholder="Lunch Deduction"
            value={form.lunch_break_deduction}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            required
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
          <input
            type="text"
            name="notes"
            placeholder="Notes"
            value={form.notes}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />

          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-400"
          >
            {saving ? "Saving..." : "Add Attendance"}
          </button>
        </div>
      </form>

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm text-slate-500">
          Showing {attendanceRecords.length} attendance record(s)
        </p>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-[520px] overflow-y-auto overflow-x-auto rounded-3xl">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 shadow-sm">
                <tr>
                  <th className="px-4 py-4 font-semibold">Date</th>
                  <th className="px-4 py-4 font-semibold">Employee</th>
                  <th className="px-4 py-4 font-semibold">Employee Code</th>
                  <th className="px-4 py-4 font-semibold">Time In</th>
                  <th className="px-4 py-4 font-semibold">Time Out</th>
                  <th className="px-4 py-4 font-semibold">Rendered Hours</th>
                  <th className="px-4 py-4 font-semibold">Lunch Deduction</th>
                  <th className="px-4 py-4 font-semibold">Notes</th>
                  <th className="px-4 py-4 font-semibold">Action</th>
                </tr>
              </thead>

              <tbody>
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((record) => (
                    <tr key={record.id} className="border-t border-slate-200">
                      <td className="px-4 py-4">
                        {formatDate(record.attendance_date)}
                      </td>
                      <td className="px-4 py-4">{record.employee_name}</td>
                      <td className="px-4 py-4">
                        {record.employee_code || "-"}
                      </td>
                      <td className="px-4 py-4">{record.time_in || "-"}</td>
                      <td className="px-4 py-4">{record.time_out || "-"}</td>
                      <td className="px-4 py-4">
                        {formatNumber(record.rendered_hours || 0)}
                      </td>
                      <td className="px-4 py-4">
                        {formatNumber(record.lunch_break_deduction || 0)}
                      </td>
                      <td className="px-4 py-4">{record.notes || "-"}</td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleDelete(record.id)}
                          className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}