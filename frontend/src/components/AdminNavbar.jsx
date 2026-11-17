import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Wrench, Car, DollarSign, LogOut, ShieldCheck } from "lucide-react";

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: "/admin/ordenes", label: "Órdenes en Taller", icon: Wrench },
    { path: "/admin/clientes", label: "Historial por Patente", icon: Car },
    { path: "/admin/caja", label: "Caja del Día", icon: DollarSign },
  ];

  return (
    <header className="bg-stone-900 text-white border-b-4 border-amber-500 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Identidad del Taller */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-stone-950 shadow">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight leading-tight">
              {user?.taller_nombre || "GestorCar"}
            </h1>
            <span className="text-xs text-stone-300 block">
              {user?.nombre?.split(" ")[0]} • {user?.rol}
            </span>
          </div>
        </div>

        {/* Navegación Principal */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                  isActive
                    ? "bg-amber-500 text-stone-950 shadow"
                    : "text-stone-300 hover:text-white hover:bg-stone-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}

          {user?.rol === "SUPERADMIN" && (
            <Link
              to="/superadmin"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-stone-800 text-amber-400 border border-amber-500/40 hover:bg-stone-700"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden lg:inline">Consola Central</span>
            </Link>
          )}
        </nav>

        {/* Salir */}
        <button
          onClick={logout}
          title="Cerrar Sesión"
          className="flex items-center gap-1.5 text-xs font-bold text-stone-200 hover:text-white bg-stone-800 hover:bg-red-600 px-3.5 py-2 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
