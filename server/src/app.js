const express = require("express");
const cors = require("cors");

const employeesRoutes = require("./routes/employeesRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const payCyclesRoutes = require("./routes/payCyclesRoutes");
const holidaysRoutes = require("./routes/holidaysRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const approvalsRoutes = require("./routes/approvalsRoutes");
const expensesRoutes = require("./routes/expensesRoutes");
const payrollAdjustmentsRoutes = require("./routes/payrollAdjustmentsRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/pay-cycles", payCyclesRoutes);
app.use("/api/holidays", holidaysRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/approvals", approvalsRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/payroll-adjustments", payrollAdjustmentsRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Payroll Tracking API is running."
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found."
  });
});

module.exports = app;