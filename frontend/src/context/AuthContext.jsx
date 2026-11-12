import { createContext, useContext, useState, useEffect } from "react";
import { apiFetch } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Al montar la app, verificamos si hay sesión persistida
    const storedToken = localStorage.getItem("taller_token");
    const storedUser = localStorage.getItem("taller_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Error al parsear usuario de sesión previa:", err);
        localStorage.removeItem("taller_token");
        localStorage.removeItem("taller_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const { token: jwtToken, user: userData } = res.data;

    // Persistimos en localStorage
    localStorage.setItem("taller_token", jwtToken);
    localStorage.setItem("taller_user", JSON.stringify(userData));

    setToken(jwtToken);
    setUser(userData);

    return userData;
  };

  const logout = () => {
    localStorage.removeItem("taller_token");
    localStorage.removeItem("taller_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
