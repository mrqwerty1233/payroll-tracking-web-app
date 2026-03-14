const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export async function getPayrollAdjustments(filters = {}) {
  const params = new URLSearchParams();

  if (filters.payCycleId) params.append("payCycleId", filters.payCycleId);
  if (filters.employeeId) params.append("employeeId", filters.employeeId);
  if (filters.adjustmentType) params.append("adjustmentType", filters.adjustmentType);
  if (filters.search) params.append("search", filters.search);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/payroll-adjustments${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url);
  return handleResponse(response);
}

export async function createPayrollAdjustment(payload) {
  const response = await fetch(`${API_BASE_URL}/payroll-adjustments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return handleResponse(response);
}

export async function updatePayrollAdjustment(id, payload) {
  const response = await fetch(`${API_BASE_URL}/payroll-adjustments/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return handleResponse(response);
}

export async function deletePayrollAdjustment(id) {
  const response = await fetch(`${API_BASE_URL}/payroll-adjustments/${id}`, {
    method: "DELETE"
  });

  return handleResponse(response);
}