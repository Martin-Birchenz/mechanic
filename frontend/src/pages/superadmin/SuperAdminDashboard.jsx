import { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Wrench,
  Plus,
  ExternalLink,
  Power,
  Globe,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Settings,
} from "lucide-react";

const INITIAL_FORM = {
  nombreTaller: "",
  slug: "",
  telefono: "",
  direccion: "",
  horarios: "Lun a Vie 8:00 a 12:30 y 15:30 a 19:30",
  tienePortalPublico: true,
  adminNombre: "",
  adminEmail: "",
  adminPassword: "",
};

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [talleres, setTalleres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const cargarTalleres = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch("/superadmin/talleres");
      setTalleres(res.data || []);
    } catch (err) {
      setError(err.message || "Error al cargar los talleres");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Al volver a la consola central, limpiamos cualquier taller impersonado
    localStorage.removeItem("superadmin_taller_id");
    cargarTalleres();
  }, []);

  const handleNombreChange = (val) => {
    const autoSlug = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setForm((prev) => ({ ...prev, nombreTaller: val, slug: autoSlug }));
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      await apiFetch("/superadmin/talleres", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSuccessMsg(`Taller "${form.nombreTaller}" creado con éxito.`);
      setShowModal(false);
      setForm(INITIAL_FORM);
      cargarTalleres();
    } catch (err) {
      setError(err.message || "No se pudo crear el taller");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (taller, campo) => {
    try {
      setError(null);
      await apiFetch(`/superadmin/talleres/${taller.id}`, {
        method: "PATCH",
        body: JSON.stringify({ [campo]: !taller[campo] }),
      });
      cargarTalleres();
    } catch (err) {
      setError(err.message || "Error al actualizar estado del taller");
    }
  };

  const handleGestionarTaller = (tallerId) => {
    localStorage.setItem("superadmin_taller_id", String(tallerId));
    navigate("/admin/ordenes");
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-12">
      {/* Barra Superior */}
      <header className="bg-stone-900 text-white border-b-4 border-amber-500 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-stone-950 p-2 rounded-xl font-bold shadow">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight">
              GestorCar — Consola Central
            </h1>
            <p className="text-xs text-stone-300">
              Operador: {user?.nombre || "SuperAdmin"}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("superadmin_taller_id");
            logout();
            navigate("/login");
          }}
          className="flex items-center gap-2 bg-stone-800 hover:bg-red-600 px-3.5 py-2 rounded-xl text-xs font-bold transition"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-600 text-red-900 p-4 rounded-r-xl flex items-center gap-2 text-sm font-bold shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-100 border-l-4 border-emerald-600 text-emerald-900 p-4 rounded-r-xl flex items-center gap-2 text-sm font-bold shadow-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-stone-900">
              Talleres Clientes ({talleres.length})
            </h2>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-5 py-3 rounded-xl shadow flex items-center gap-2 text-sm transition"
          >
            <Plus className="w-5 h-5" /> NUEVO TALLER
          </button>
        </div>

        {/* Tabla de Talleres */}
        <div className="bg-white border-2 border-stone-300 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-stone-600 font-bold">
              Cargando talleres...
            </div>
          ) : talleres.length === 0 ? (
            <div className="p-10 text-center text-stone-500 font-semibold">
              Todavía no hay talleres registrados. Tocá "+ NUEVO TALLER" para
              crear el primero.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-200 text-stone-700 text-xs font-extrabold uppercase tracking-wider border-b-2 border-stone-300">
                    <th className="p-4">Taller</th>
                    <th className="p-4">Portal Web</th>
                    <th className="p-4">Órdenes</th>
                    <th className="p-4">Plan Web</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-sm">
                  {talleres.map((t) => (
                    <tr key={t.id} className="hover:bg-stone-50">
                      <td className="p-4">
                        <div className="font-extrabold text-stone-900 text-base">
                          {t.nombre}
                        </div>
                        <div className="text-xs font-semibold text-stone-500">
                          {t.direccion || "Sin dirección"}{" "}
                          {t.telefono ? `• ${t.telefono}` : ""}
                        </div>
                      </td>

                      <td className="p-4">
                        <a
                          href={`/p/${t.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-amber-700 font-bold hover:underline"
                        >
                          /p/{t.slug}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>

                      <td className="p-4 font-mono font-extrabold text-stone-800">
                        {t.total_ordenes || 0}
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() =>
                            handleToggle(t, "tiene_portal_publico")
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition ${
                            t.tiene_portal_publico
                              ? "bg-blue-50 text-blue-900 border-blue-300"
                              : "bg-stone-100 text-stone-600 border-stone-300"
                          }`}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          {t.tiene_portal_publico
                            ? "Web Activa"
                            : "Solo Sistema"}
                        </button>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => handleToggle(t, "activo")}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition ${
                            t.activo
                              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                              : "bg-red-50 text-red-900 border-red-300"
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          {t.activo ? "Activo" : "Pausado"}
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleGestionarTaller(t.id)}
                          className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold transition shadow-sm"
                        >
                          <Settings className="w-3.5 h-3.5 text-amber-400" />
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Alta Rápida */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-stone-300 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-extrabold text-stone-900 mb-4">
              Alta de Nuevo Taller + Cuenta Dueño
            </h3>
            <form onSubmit={handleCrear} className="space-y-3 text-sm">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Nombre del Taller *
                </label>
                <input
                  type="text"
                  required
                  value={form.nombreTaller}
                  onChange={(e) => handleNombreChange(e.target.value)}
                  placeholder="Ej: Mecánica El Chapa"
                  className="w-full border-2 border-stone-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Slug URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 bg-stone-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={form.telefono}
                    onChange={(e) =>
                      setForm({ ...form, telefono: e.target.value })
                    }
                    placeholder="3435..."
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) =>
                    setForm({ ...form, direccion: e.target.value })
                  }
                  placeholder="Calle y número"
                  className="w-full border-2 border-stone-300 rounded-xl px-3 py-2"
                />
              </div>

              <label className="flex items-center gap-2 font-bold text-stone-800 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.tienePortalPublico}
                  onChange={(e) =>
                    setForm({ ...form, tienePortalPublico: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-600"
                />
                Incluir Página Web Pública (/p/{form.slug || "slug"})
              </label>

              <hr className="my-3 border-stone-200" />
              <p className="font-extrabold text-stone-900">
                Acceso del Dueño (Administrador)
              </p>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Nombre del Dueño *
                </label>
                <input
                  type="text"
                  required
                  value={form.adminNombre}
                  onChange={(e) =>
                    setForm({ ...form, adminNombre: e.target.value })
                  }
                  placeholder="Ej: Carlos Pérez"
                  className="w-full border-2 border-stone-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Email de Acceso *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.adminEmail}
                    onChange={(e) =>
                      setForm({ ...form, adminEmail: e.target.value })
                    }
                    placeholder="taller@gmail.com"
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.adminPassword}
                    onChange={(e) =>
                      setForm({ ...form, adminPassword: e.target.value })
                    }
                    placeholder="Taller1234!"
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 font-bold text-stone-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold disabled:opacity-60"
                >
                  {submitting ? "Creando..." : "Crear Taller"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
