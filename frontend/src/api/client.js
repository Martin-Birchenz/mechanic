const BASE_URL =
  import.meta.env.VITE_API_URL || "https://mechanic-o468.onrender.com/api";

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("taller_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Leemos primero como texto para que nunca crashee si el servidor devuelve HTML/vacío
  const rawText = await response.text();
  let data;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { message: rawText || `Error HTTP ${response.status}` };
  }

  if (!response.ok) {
    // Extrae message, error o el primer detalle de validación
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
