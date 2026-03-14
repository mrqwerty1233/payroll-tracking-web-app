const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/expenses`;

export async function getExpenses(payCycleId = "") {
  const query = payCycleId ? `?payCycleId=${payCycleId}` : "";
  const response = await fetch(`${BASE_URL}${query}`);
  return response.json();
}