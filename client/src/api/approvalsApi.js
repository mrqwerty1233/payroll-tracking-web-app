const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/approvals`;

export async function getApprovals(payCycleId = "", status = "") {
  const params = new URLSearchParams();

  if (payCycleId) params.append("payCycleId", payCycleId);
  if (status) params.append("status", status);

  const query = params.toString();
  const response = await fetch(query ? `${BASE_URL}?${query}` : BASE_URL);
  return response.json();
}

export async function getApprovalsByPayCycle(payCycleId) {
  const response = await fetch(`${BASE_URL}?payCycleId=${payCycleId}`);
  return response.json();
}

export async function approvePayroll({ pay_cycle_id, employee_id, approved_by }) {
  const response = await fetch(`${BASE_URL}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      pay_cycle_id,
      employee_id,
      approved_by
    })
  });

  return response.json();
}