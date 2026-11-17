import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PublicTracker from "./pages/public/PublicTracker";
import Login from "./pages/admin/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import OrdenesTrabajo from "./pages/admin/OrdenesTrabajo";
import CajaDiaria from "./pages/admin/CajaDiaria";
import ClientesVehiculos from "./pages/admin/ClientesVehiculos";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";

function RequireSuperAdmin({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.rol !== "SUPERADMIN")
    return <Navigate to="/admin/ordenes" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Portal público del cliente */}
          <Route path="/p/:slug" element={<PublicTracker />} />

          {/* Login unificado */}
          <Route path="/login" element={<Login />} />

          {/* Consola SuperAdmin (GestorCar) */}
          <Route
            path="/superadmin"
            element={
              <RequireSuperAdmin>
                <SuperAdminDashboard />
              </RequireSuperAdmin>
            }
          />

          {/* Rutas protegidas del Taller */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/ordenes" element={<OrdenesTrabajo />} />
            <Route path="/admin/clientes" element={<ClientesVehiculos />} />
            <Route path="/admin/caja" element={<CajaDiaria />} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
