import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import LoadingMessage from "../components/LoadingMessage";
import { getExpenses } from "../api/expensesApi";
import { getPayCycles } from "../api/payCyclesApi";
import { formatCurrency, formatDate } from "../utils/formatters";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [payCycles, setPayCycles] = useState([]);
  const [selectedPayCycleId, setSelectedPayCycleId] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadExpensesPage() {
    try {
      setLoading(true);
      const [expensesResult, payCyclesResult] = await Promise.all([
        getExpenses(selectedPayCycleId),
        getPayCycles()
      ]);

      setExpenses(expensesResult.data || []);
      setPayCycles(payCyclesResult.data || []);
    } catch (error) {
      console.error("Failed to load company expenses:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpensesPage();
  }, [selectedPayCycleId]);

  if (loading) {
    return <LoadingMessage message="Loading company expenses..." />;
  }

  return (
    <div>
      <PageHeader
        title="Company Expenses"
        description="Salary expense records created from approved payroll."
      />

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <select
          value={selectedPayCycleId}
          onChange={(event) => setSelectedPayCycleId(event.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm md:w-80"
        >
          <option value="">All Pay Cycles</option>
          {payCycles.map((cycle) => (
            <option key={cycle.id} value={cycle.id}>
              {cycle.cycle_name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Transaction Date</th>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">Pay Cycle</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Account</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length ? (
              expenses.map((expense) => (
                <tr key={expense.id} className="border-t border-slate-200">
                  <td className="px-4 py-3">
                    {formatDate(expense.transaction_date)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {expense.employee_name}
                  </td>
                  <td className="px-4 py-3">{expense.pay_cycle_name}</td>
                  <td className="px-4 py-3">{expense.expense_category}</td>
                  <td className="px-4 py-3">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-4 py-3">{expense.account_name}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                  No expense records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}