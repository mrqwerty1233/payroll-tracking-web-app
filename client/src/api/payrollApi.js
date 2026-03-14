const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function handleResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    let errorMessage = "Request failed.";

    try {
      if (contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } else {
        errorMessage = await response.text();
      }
    } catch {
      errorMessage = "Request failed.";
    }

    throw new Error(errorMessage);
  }

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.blob();
}

export async function getPayrollSummary(payCycleId) {
  const response = await fetch(
    `${API_BASE_URL}/payroll/summary?payCycleId=${payCycleId}`
  );
  return handleResponse(response);
}

export async function exportPayrollJson(payCycleId) {
  const response = await fetch(
    `${API_BASE_URL}/payroll/export?payCycleId=${payCycleId}`
  );
  return handleResponse(response);
}

export async function exportPayrollBpiCsv(payCycleId) {
  const response = await fetch(
    `${API_BASE_URL}/payroll/export?payCycleId=${payCycleId}&format=bpi`
  );

  if (!response.ok) {
    let errorMessage = "Failed to export BPI CSV.";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = "Failed to export BPI CSV.";
    }
    throw new Error(errorMessage);
  }

  const blob = await response.blob();
  return blob;
}