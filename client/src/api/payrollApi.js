import {
  API_BASE_URL,
  DEMO_MODE,
  getDemoBpiCsvBlob,
  getDemoPayrollExport,
  getDemoPayrollSummaryResponse
} from "./apiClient";

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
  if (DEMO_MODE) {
    return getDemoPayrollSummaryResponse(payCycleId);
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/payroll/summary?payCycleId=${payCycleId}`
    );
    return await handleResponse(response);
  } catch (error) {
    return getDemoPayrollSummaryResponse(payCycleId);
  }
}

export async function exportPayrollJson(payCycleId) {
  if (DEMO_MODE) {
    return getDemoPayrollExport(payCycleId);
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/payroll/export?payCycleId=${payCycleId}`
    );
    return await handleResponse(response);
  } catch (error) {
    return getDemoPayrollExport(payCycleId);
  }
}

export async function exportPayrollBpiCsv(payCycleId) {
  if (DEMO_MODE) {
    return getDemoBpiCsvBlob(payCycleId);
  }

  try {
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

    return await response.blob();
  } catch (error) {
    return getDemoBpiCsvBlob(payCycleId);
  }
}