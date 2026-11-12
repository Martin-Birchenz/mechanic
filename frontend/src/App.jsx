import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PublicTracker from "./pages/public/PublicTracker";
import Login from "./pages/admin/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import OrdenesTrabajo from "./pages/admin/OrdenesTrabajo";
import CajaDiaria from "./pages/admin/CajaDiaria";
import ClientesVehiculos from "./pages/admin/ClientesVehiculos"; // <-- Importamos

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública del cliente */}
          <Route path="/p/:slug" element={<PublicTracker />} />

          {/* Login administrativo */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas del Taller */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/ordenes" element={<OrdenesTrabajo />} />
            <Route path="/admin/clientes" element={<ClientesVehiculos />} />
            <Route path="/admin/caja" element={<CajaDiaria />} />
          </Route>

          {/* Redirección por defecto */}
          <Route
            path="*"
            element={<Navigate to="/p/taller-nogoya" replace />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
