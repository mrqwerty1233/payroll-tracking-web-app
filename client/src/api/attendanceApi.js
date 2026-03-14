const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export async function getAttendance(filters = {}) {
  const params = new URLSearchParams();

  if (filters.payCycleId) params.append("payCycleId", filters.payCycleId);
  if (filters.month) params.append("month", filters.month);
  if (filters.employeeId) params.append("employeeId", filters.employeeId);
  if (filters.search) params.append("search", filters.search);
  if (filters.sort) params.append("sort", filters.sort);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/attendance${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url);
  return handleResponse(response);
}

export async function createAttendance(payload) {
  const response = await fetch(`${API_BASE_URL}/attendance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return handleResponse(response);
}

export async function deleteAttendance(id) {
  const response = await fetch(`${API_BASE_URL}/attendance/${id}`, {
    method: "DELETE"
  });

  return handleResponse(response);
}

export async function importAttendanceFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/attendance/import`, {
    method: "POST",
    body: formData
  });

  return handleResponse(response);
}