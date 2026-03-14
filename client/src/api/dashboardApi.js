import {
  apiJsonWithDemoFallback,
  getDemoDashboard
} from "./apiClient";

export async function getDashboardSummary() {
  return apiJsonWithDemoFallback("/dashboard", {
    fallbackData: getDemoDashboard(),
    errorMessage: "Failed to fetch dashboard summary."
  });
}