import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Wrench,
  LayoutDashboard,
  Users,
  DollarSign,
  Package,
  CalendarClock,
  Settings,
  LogOut,
  ShieldAlert,
  Menu,
  X,
} from "lucide-react";

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/admin/ordenes", label: "Tablero", icon: LayoutDashboard },
    { to: "/admin/clientes", label: "Clientes y Fichas", icon: Users },
    { to: "/admin/caja", label: "Caja y Gastos", icon: DollarSign },
    { to: "/admin/stock", label: "Stock", icon: Package },
    {
      to: "/admin/recordatorios",
      label: "Próximo Service",
      icon: CalendarClock,
    },
    { to: "/admin/mi-taller", label: "Mi Taller", icon: Settings },
  ];

  const desktopLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
      isActive
        ? "bg-amber-500 text-slate-950 shadow-sm"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
      isActive
        ? "bg-amber-500 text-slate-950 shadow-sm"
        : "text-slate-200 hover:bg-slate-800"
    }`;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Marca */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="bg-amber-500 p-2 rounded-lg text-slate-950 flex-shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div className="truncate">
            <span className="font-black text-white tracking-tight text-base block leading-none">
              Gestor<span className="text-amber-500">Car</span>
            </span>
            <span className="text-[11px] text-slate-400 font-medium truncate block">
              {user?.taller_nombre || "Panel de Taller"}
            </span>
          </div>
        </div>

        {/* Navegación Desktop */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={desktopLinkClass}>
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Acciones Desktop */}
        <div className="hidden lg:flex items-center gap-2">
          {user?.rol === "SUPERADMIN" && (
            <button
              onClick={() => navigate("/superadmin")}
              className="flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Consola Central
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-red-400 hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>

        {/* Botón Menú Móvil / Tablet */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 rounded-lg text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label="Abrir menú"
        >
          {mobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Cajón Desplegable Móvil */}
      {mobileOpen && (
        <div className="lg:hidden bg-slate-900 border-t border-slate-800 px-4 pt-3 pb-5 space-y-1.5 shadow-2xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={mobileLinkClass}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}

          <div className="pt-3 mt-3 border-t border-slate-800 flex flex-col gap-2">
            {user?.rol === "SUPERADMIN" && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  navigate("/superadmin");
                }}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl transition-colors"
              >
                <ShieldAlert className="w-4 h-4" />
                Ir a Consola Central
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-400 bg-slate-800/70 hover:bg-slate-800 px-4 py-3 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
