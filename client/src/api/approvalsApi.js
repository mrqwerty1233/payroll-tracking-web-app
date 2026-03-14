import {
  apiJson,
  apiJsonWithDemoFallback,
  demoWriteSuccess,
  getDemoApprovals
} from "./apiClient";

export async function getApprovals(payCycleId = "", status = "") {
  const params = new URLSearchParams();

  if (payCycleId) params.append("payCycleId", payCycleId);
  if (status) params.append("status", status);

  const query = params.toString();

  return apiJsonWithDemoFallback(`/approvals${query ? `?${query}` : ""}`, {
    fallbackData: getDemoApprovals(payCycleId, status),
    errorMessage: "Failed to fetch approvals."
  });
}

export async function getApprovalsByPayCycle(payCycleId) {
  return apiJsonWithDemoFallback(`/approvals?payCycleId=${payCycleId}`, {
    fallbackData: getDemoApprovals(payCycleId, ""),
    errorMessage: "Failed to fetch approvals."
  });
}

export async function approvePayroll({ pay_cycle_id, employee_id, approved_by }) {
  try {
    return await apiJson("/approvals/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pay_cycle_id,
        employee_id,
        approved_by
      }),
      errorMessage: "Failed to approve payroll."
    });
  } catch (error) {
    return demoWriteSuccess("Demo mode active. Payroll approval was simulated.");
  }
}