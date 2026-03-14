import {
  apiJsonWithDemoFallback,
  getDemoExpenses
} from "./apiClient";

export async function getExpenses(payCycleId = "") {
  const query = payCycleId ? `?payCycleId=${payCycleId}` : "";

  return apiJsonWithDemoFallback(`/expenses${query}`, {
    fallbackData: getDemoExpenses(payCycleId),
    errorMessage: "Failed to fetch expenses."
  });
}