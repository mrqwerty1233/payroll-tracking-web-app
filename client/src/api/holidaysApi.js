const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/holidays`;

export async function getHolidays() {
  const response = await fetch(BASE_URL);
  return response.json();
}

export async function createHoliday(payload) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return response.json();
}

export async function deleteHoliday(id) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE"
  });

  return response.json();
}