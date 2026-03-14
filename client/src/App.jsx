import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import AttendancePage from "./pages/AttendancePage";
import PayCyclesPage from "./pages/PayCyclesPage";
import HolidaysPage from "./pages/HolidaysPage";
import PayrollSummaryPage from "./pages/PayrollSummaryPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import ExpensesPage from "./pages/ExpensesPage";
import PayrollAdjustmentsPage from "./pages/PayrollAdjustmentsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/pay-cycles" element={<PayCyclesPage />} />
          <Route path="/holidays" element={<HolidaysPage />} />
          <Route path="/payroll-summary" element={<PayrollSummaryPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/payroll-adjustments" element={<PayrollAdjustmentsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}