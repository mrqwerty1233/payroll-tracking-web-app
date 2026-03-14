const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export async function getEmployees(search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const response = await fetch(`${API_BASE_URL}/employees${query}`);
  return handleResponse(response);
}

export async function getEmployeeById(id) {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`);
  return handleResponse(response);
}

export async function createEmployee(payload) {
  const response = await fetch(`${API_BASE_URL}/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return handleResponse(response);
}

export async function updateEmployee(id, payload) {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return handleResponse(response);
}

export async function deleteEmployee(id) {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: "DELETE"
  });

  return handleResponse(response);
}