import {
  apiJson,
  apiJsonWithDemoFallback,
  demoWriteSuccess,
  getDemoEmployees
} from "./apiClient";

export async function getEmployees(search = "") {
  return apiJsonWithDemoFallback(
    `/employees${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    {
      fallbackData: getDemoEmployees(search),
      errorMessage: "Failed to fetch employees."
    }
  );
}

export async function getEmployeeById(id) {
  const employee = getDemoEmployees("").find((item) => String(item.id) === String(id)) || null;

  return apiJsonWithDemoFallback(`/employees/${id}`, {
    fallbackData: employee,
    errorMessage: "Failed to fetch employee."
  });
}

export async function createEmployee(payload) {
  try {
    return await apiJson("/employees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      errorMessage: "Failed to create employee."
    });
  } catch (error) {
    return demoWriteSuccess("Demo mode active. Employee was not saved.");
  }
}

export async function updateEmployee(id, payload) {
  try {
    return await apiJson(`/employees/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      errorMessage: "Failed to update employee."
    });
  } catch (error) {
    return demoWriteSuccess("Demo mode active. Employee update was not saved.");
  }
}

export async function deleteEmployee(id) {
  try {
    return await apiJson(`/employees/${id}`, {
      method: "DELETE",
      errorMessage: "Failed to delete employee."
    });
  } catch (error) {
    return demoWriteSuccess("Demo mode active. Employee was not deleted.");
  }
}