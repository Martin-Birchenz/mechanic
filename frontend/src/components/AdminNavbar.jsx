import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Wrench, Car, DollarSign, LogOut } from "lucide-react";

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: "/admin/ordenes", label: "Órdenes de Trabajo", icon: Wrench },
    { path: "/admin/clientes", label: "Clientes y Fichas", icon: Car },
    { path: "/admin/caja", label: "Caja Diaria", icon: DollarSign },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Identidad */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide leading-tight">
              {user?.taller_nombre || "TallerFlow"}
            </h1>
            <span className="text-[11px] text-slate-400 block font-mono">
              Operador: {user?.nombre?.split(" ")[0]} ({user?.rol})
            </span>
          </div>
        </div>

        {/* Links de Navegación */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Salir */}
        <button
          onClick={logout}
          title="Cerrar Sesión"
          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
