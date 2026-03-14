const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const API_BASE_URL = RAW_BASE_URL.endsWith("/api")
  ? RAW_BASE_URL
  : `${RAW_BASE_URL}/api`;

export async function getDashboardSummary() {
  const response = await fetch(`${API_BASE_URL}/dashboard`);
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch dashboard summary.");
  }

  return data;
}