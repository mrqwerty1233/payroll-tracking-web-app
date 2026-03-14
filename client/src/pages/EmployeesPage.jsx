import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import LoadingMessage from "../components/LoadingMessage";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
} from "../api/employeesApi";
import { formatCurrency, formatDate } from "../utils/formatters";

const initialForm = {
  employee_code: "",
  full_name: "",
  position: "",
  department: "",
  daily_rate: "",
  hourly_rate: "",
  contact_number: "",
  email: "",
  hire_date: "",
  employment_type: "REGULAR",
  payroll_status: "ACTIVE",
  bank_name: "",
  bank_account_number: "",
  account_holder_name: "",
  is_active: true
};

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm text-slate-900">{value || "-"}</p>
    </div>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadEmployees(currentSearch = "") {
    setLoading(true);
    setError("");

    try {
      const response = await getEmployees(currentSearch);
      const employeeList = response.data || [];
      setEmployees(employeeList);

      if (selectedEmployee) {
        const updatedSelectedEmployee = employeeList.find(
          (employee) => employee.id === selectedEmployee.id
        );
        setSelectedEmployee(updatedSelectedEmployee || null);
      }
    } catch (err) {
      setError(err.message || "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  const displayedEmployees = useMemo(() => employees, [employees]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function handleEdit(employee) {
    setEditingId(employee.id);
    setSelectedEmployee(employee);
    setForm({
      employee_code: employee.employee_code || "",
      full_name: employee.full_name || "",
      position: employee.position || "",
      department: employee.department || "",
      daily_rate: employee.daily_rate ?? "",
      hourly_rate: employee.hourly_rate ?? "",
      contact_number: employee.contact_number || "",
      email: employee.email || "",
      hire_date: employee.hire_date || "",
      employment_type: employee.employment_type || "REGULAR",
      payroll_status: employee.payroll_status || "ACTIVE",
      bank_name: employee.bank_name || "",
      bank_account_number: employee.bank_account_number || "",
      account_holder_name: employee.account_holder_name || "",
      is_active: Boolean(employee.is_active)
    });

    setError("");
    setSuccessMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    const payload = {
      ...form,
      daily_rate: form.daily_rate === "" ? 0 : Number(form.daily_rate),
      hourly_rate: form.hourly_rate === "" ? 0 : Number(form.hourly_rate),
      is_active: Boolean(form.is_active)
    };

    try {
      if (editingId) {
        await updateEmployee(editingId, payload);
        setSuccessMessage("Employee profile updated successfully.");
      } else {
        await createEmployee(payload);
        setSuccessMessage("Employee profile created successfully.");
      }

      resetForm();
      await loadEmployees(search);
    } catch (err) {
      setError(err.message || "Failed to save employee profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!confirmed) return;

    setError("");
    setSuccessMessage("");

    try {
      if (selectedEmployee?.id === id) {
        setSelectedEmployee(null);
      }

      await deleteEmployee(id);
      setSuccessMessage("Employee deleted successfully.");
      await loadEmployees(search);
    } catch (err) {
      setError(err.message || "Failed to delete employee.");
    }
  }

  async function handleSearchSubmit(event) {
    event.preventDefault();
    await loadEmployees(search);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage employee payroll profiles, employment details, and bank information."
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            {editingId ? "Edit Employee Profile" : "Add Employee"}
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
          <input
            type="text"
            name="employee_code"
            placeholder="Employee Code"
            value={form.employee_code}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />

          <input
            type="text"
            name="full_name"
            placeholder="Full Name"
            value={form.full_name}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />

          <input
            type="text"
            name="position"
            placeholder="Position"
            value={form.position}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />

          <input
            type="text"
            name="department"
            placeholder="Department"
            value={form.department}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />

          <input
            type="number"
            step="0.01"
            name="daily_rate"
            placeholder="Daily Rate"
            value={form.daily_rate}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />

          <input
            type="number"
            step="0.01"
            name="hourly_rate"
            placeholder="Hourly Rate"
            value={form.hourly_rate}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />

          <input
            type="text"
            name="contact_number"
            placeholder="Contact Number"
            value={form.contact_number}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />

          <input
            type="date"
            name="hire_date"
            value={form.hire_date}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />

          <select
            name="employment_type"
            value={form.employment_type}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          >
            <option value="REGULAR">REGULAR</option>
            <option value="PROBATIONARY">PROBATIONARY</option>
            <option value="CONTRACTUAL">CONTRACTUAL</option>
            <option value="PART_TIME">PART_TIME</option>
            <option value="FREELANCE">FREELANCE</option>
          </select>

          <select
            name="payroll_status"
            value={form.payroll_status}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="ON_HOLD">ON_HOLD</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          <input
            type="text"
            name="bank_name"
            placeholder="Bank Name"
            value={form.bank_name}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />

          <input
            type="text"
            name="bank_account_number"
            placeholder="Bank Account Number"
            value={form.bank_account_number}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />

          <input
            type="text"
            name="account_holder_name"
            placeholder="Account Holder Name"
            value={form.account_holder_name}
            onChange={handleChange}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            Active employee
          </label>
        </div>

        <div className="mt-5">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {saving
              ? editingId
                ? "Updating..."
                : "Saving..."
              : editingId
              ? "Update Employee"
              : "Add Employee"}
          </button>
        </div>
      </form>

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

      <form
        onSubmit={handleSearchSubmit}
        className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            placeholder="Search employee by code, name, position, department, contact, email, payroll status, or bank info"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />

          <button
            type="submit"
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Search
          </button>
        </div>
      </form>

      {selectedEmployee && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedEmployee.full_name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedEmployee.employee_code} • {selectedEmployee.position || "No position"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedEmployee(null)}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoItem label="Department" value={selectedEmployee.department} />
            <InfoItem
              label="Daily Rate"
              value={formatCurrency(selectedEmployee.daily_rate)}
            />
            <InfoItem
              label="Hourly Rate"
              value={formatCurrency(selectedEmployee.hourly_rate)}
            />
            <InfoItem label="Contact Number" value={selectedEmployee.contact_number} />
            <InfoItem label="Email" value={selectedEmployee.email} />
            <InfoItem
              label="Hire Date"
              value={selectedEmployee.hire_date ? formatDate(selectedEmployee.hire_date) : "-"}
            />
            <InfoItem
              label="Employment Type"
              value={selectedEmployee.employment_type}
            />
            <InfoItem
              label="Payroll Status"
              value={selectedEmployee.payroll_status}
            />
            <InfoItem label="Bank Name" value={selectedEmployee.bank_name} />
            <InfoItem
              label="Bank Account Number"
              value={selectedEmployee.bank_account_number}
            />
            <InfoItem
              label="Account Holder Name"
              value={selectedEmployee.account_holder_name}
            />
            <InfoItem
              label="Employee Status"
              value={selectedEmployee.is_active ? "Active" : "Inactive"}
            />
          </div>
        </div>
      )}

      {loading ? (
        <LoadingMessage message="Loading employees..." />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-4 font-semibold">Employee</th>
                  <th className="px-4 py-4 font-semibold">Work Profile</th>
                  <th className="px-4 py-4 font-semibold">Payroll Rates</th>
                  <th className="px-4 py-4 font-semibold">Payroll Profile</th>
                  <th className="px-4 py-4 font-semibold">Bank</th>
                  <th className="px-4 py-4 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {displayedEmployees.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  displayedEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-t border-slate-200 align-top"
                    >
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">
                          {employee.full_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {employee.employee_code}
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {employee.email || "No email"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {employee.contact_number || "No contact number"}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">
                          {employee.position || "-"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {employee.department || "-"}
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          Hire Date:{" "}
                          {employee.hire_date ? formatDate(employee.hire_date) : "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">
                          Daily: {formatCurrency(employee.daily_rate)}
                        </div>
                        <div className="text-xs text-slate-500">
                          Hourly: {formatCurrency(employee.hourly_rate)}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {employee.employment_type || "-"}
                        </div>

                        <div className="mt-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              employee.payroll_status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-700"
                                : employee.payroll_status === "ON_HOLD"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {employee.payroll_status || "-"}
                          </span>
                        </div>

                        <div className="mt-2 text-xs text-slate-500">
                          {employee.is_active ? "Active employee" : "Inactive employee"}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">
                          {employee.bank_name || "-"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {employee.bank_account_number || "No account number"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {employee.account_holder_name || ""}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedEmployee(employee)}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Profile Details
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEdit(employee)}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(employee.id)}
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
      )}
    </div>
  );
}