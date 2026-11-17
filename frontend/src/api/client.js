const BASE_URL =
  import.meta.env.VITE_API_URL || "https://mechanic-o468.onrender.com/api";

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("taller_token");
  const activeTallerId = localStorage.getItem("superadmin_taller_id");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Permite al SuperAdmin operar dentro de cualquier taller cliente
  if (activeTallerId) {
    headers["x-taller-id"] = activeTallerId;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const rawText = await response.text();
  let data;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { message: rawText || `Error HTTP ${response.status}` };
  }

  if (!response.ok) {
    const serverMessage =
      data?.message ||
      data?.error ||
      (Array.isArray(data?.errors)
        ? data.errors.map((e) => e.message || e).join(", ")
        : null) ||
      `Error ${response.status}: No se pudo completar la operación`;

    const error = new Error(serverMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
