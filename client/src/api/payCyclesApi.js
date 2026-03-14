import {
  apiJson,
  apiJsonWithDemoFallback,
  demoWriteSuccess,
  getDemoPayCycles
} from "./apiClient";

export async function getPayCycles() {
  return apiJsonWithDemoFallback("/pay-cycles", {
    fallbackData: getDemoPayCycles(),
    errorMessage: "Failed to fetch pay cycles."
  });
}

export async function createPayCycle(payload) {
  try {
    return await apiJson("/pay-cycles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      errorMessage: "Failed to create pay cycle."
    });
  } catch (error) {
    return demoWriteSuccess("Demo mode active. Pay cycle creation was simulated.");
  }
}

export async function deletePayCycle(id) {
  try {
    return await apiJson(`/pay-cycles/${id}`, {
      method: "DELETE",
      errorMessage: "Failed to delete pay cycle."
    });
  } catch (error) {
    return demoWriteSuccess("Demo mode active. Pay cycle deletion was simulated.");
  }
}