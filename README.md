# Payroll Tracking Web App

A full-stack payroll tracking system built to manage employee records, attendance, pay cycles, payroll approvals, allowances, deductions, holidays, and salary expenses in one place. The system streamlines payroll operations by turning daily attendance and payroll adjustments into clear payroll summaries, approval workflows, and expense records.

## Overview

This project is a web-based payroll management system designed to help businesses organize payroll data more efficiently. It centralizes the core payroll workflow into one platform, from employee setup and attendance tracking to payroll computation, approval, and expense recording.

The application is built with a React frontend and a Node.js/Express backend, with SQLite used as the database for storing operational records.

## Main Features

### Employee Management

The system allows users to create and manage employee records, including:

* employee code
* full name
* department
* position
* daily rate
* hourly rate
* payroll profile details

These employee records are used throughout the rest of the system for attendance, payroll summaries, approvals, and expense generation.

### Attendance Tracking

Attendance records can be added manually or imported from spreadsheet files. Each attendance entry stores details such as:

* employee
* attendance date
* time in
* time out
* rendered hours
* lunch break deduction
* notes

The attendance module also supports flexible import handling so uploaded data can be transformed into payroll-ready records.

### Pay Cycles and Holidays

The system supports payroll scheduling through pay cycles. Each pay cycle includes:

* cycle name
* cycle type
* period start
* period end
* pay date

Holiday records can also be maintained so payroll summaries can include holiday pay when applicable.

### Payroll Summary

The payroll summary page computes payroll per employee for a selected pay cycle. It combines attendance, employee salary rates, holiday pay, allowances, and deductions to produce a final salary total.

Typical computed values include:

* total hours worked
* total basic pay
* holiday pay
* allowances
* deductions
* final total salary

This gives users a clear breakdown of each employee’s payroll before approval.

### Allowances and Deductions

The system supports payroll adjustments through allowances and deductions. These adjustments are tied to a specific employee and pay cycle, then applied directly to the payroll summary.

This makes it possible to reflect:

* salary advances
* penalties
* transport allowances
* incentives
* other payroll-related adjustments

### Payroll Approval Workflow

Once payroll is reviewed, it can be approved per employee for a selected pay cycle. Approving payroll stores a payroll approval record and marks the employee’s payroll as approved.

This creates a more structured review process instead of treating payroll as an untracked calculation.

### Company Expense Recording

When payroll is approved, the system also creates a corresponding company expense entry for the employee’s salary. The expense amount is based on the final approved salary after allowances and deductions.

This connects payroll processing with expense tracking and helps keep salary expenses visible inside the system.

### Dashboard and Quick Actions

The dashboard provides a central overview of payroll operations, including summary counts and quick access to common tasks. It is designed to make the system feel like a control center rather than just a data entry tool.

## How the Payroll System Works

The payroll flow follows a practical sequence:

1. **Set up employees**
   Employees are added with their salary rates and profile details.

2. **Create pay cycles**
   Payroll periods are defined so attendance and payroll calculations are grouped correctly.

3. **Add holidays**
   Holiday dates are stored so holiday pay can be included in payroll computations when needed.

4. **Record or import attendance**
   Attendance data is entered manually or imported from spreadsheets.

5. **Review payroll summary**
   The system calculates each employee’s payroll for the selected pay cycle using attendance, rates, holiday rules, allowances, and deductions.

6. **Apply allowances and deductions**
   Payroll adjustments are added for employees when needed.

7. **Approve payroll**
   Each employee’s payroll can be approved after review.

8. **Generate company salary expense**
   Once approved, the final salary amount is stored as a company expense record.

This workflow helps transform raw attendance and employee data into a more organized payroll process.

## Tech Stack

### Frontend

* React
* React Router
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express.js
* SQLite
* Multer
* XLSX

## Project Structure

### Frontend Modules

* Dashboard
* Employees
* Attendance
* Pay Cycles
* Holidays
* Payroll Summary
* Allowances & Deductions
* Approvals
* Expenses

### Backend Responsibilities

* REST API routes for each module
* payroll summary calculations
* attendance import handling
* payroll approval processing
* expense creation
* SQLite database operations

## Why This Project Matters

This project demonstrates how a payroll process can be organized into a structured internal system instead of relying on disconnected spreadsheets and manual tracking. It shows practical thinking around:

* workflow automation
* data organization
* payroll computation
* approval processes
* expense visibility
* internal systems design

It is especially useful as a portfolio project because it combines frontend development, backend logic, database handling, and real-world business workflow design in a single application.

## Future Improvements

Possible future enhancements include:

* hosted database support for deployment
* chart-based analytics on the dashboard
* downloadable payroll reports
* bank-ready payroll export formats
* authentication and role-based access
* notifications and payroll reminders
* demo mode for portfolio deployment

## Author

Developed by Marl Vincent R. Madronero as part of a systems-focused web application portfolio.
