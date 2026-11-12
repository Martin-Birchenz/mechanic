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

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Error en la petición");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
