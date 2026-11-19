import { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";
import AdminNavbar from "../../components/AdminNavbar";
import { Store, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

export default function MiTallerConfig() {
  const [form, setForm] = useState({
    nombre: "",
    slug: "",
    telefono: "",
    direccion: "",
    horarios: "",
    logo_url: "",
    descripcion_servicios: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiFetch("/gestion/mi-taller");
        if (res.data) {
          setForm({
            nombre: res.data.nombre || "",
            slug: res.data.slug || "",
            telefono: res.data.telefono || "",
            direccion: res.data.direccion || "",
            horarios: res.data.horarios || "",
            logo_url: res.data.logo_url || "",
            descripcion_servicios: res.data.descripcion_servicios || "",
          });
        }
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const handleGuardar = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMsg(null);
      setErrorMsg(null);
      await apiFetch("/gestion/mi-taller", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setMsg(
        "¡Datos de tu taller guardados! Ya se ven reflejados en tu página web pública.",
      );
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-12">
      <AdminNavbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
              <Store className="w-6 h-6 text-amber-600" />
              Datos de Mi Taller y Página Web
            </h2>
            <p className="text-sm text-stone-600">
              Editá la dirección, horarios y teléfono que ven tus clientes en el
              portal público.
            </p>
          </div>

          {form.slug && (
            <a
              href={`/p/${form.slug}`}
              target="_blank"
              rel="noreferrer"
              className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5"
            >
              Ver Mi Página Web <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {msg && (
          <div className="mb-5 bg-emerald-100 border-l-4 border-emerald-600 text-emerald-900 p-4 rounded-r-xl flex items-center gap-2 text-sm font-bold">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 bg-red-100 border-l-4 border-red-600 text-red-900 p-4 rounded-r-xl flex items-center gap-2 text-sm font-bold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="bg-white border-2 border-stone-300 rounded-2xl p-6 shadow-sm">
          {loading ? (
            <p className="font-bold text-stone-500">
              Cargando configuración...
            </p>
          ) : (
            <form onSubmit={handleGuardar} className="space-y-4 text-sm">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Nombre del Taller *
                </label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border-2 border-stone-300 rounded-xl px-3.5 py-2.5 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    WhatsApp del Taller
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 3435123456"
                    value={form.telefono}
                    onChange={(e) =>
                      setForm({ ...form, telefono: e.target.value })
                    }
                    className="w-full border-2 border-stone-300 rounded-xl px-3.5 py-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Chacabuco 317, Nogoyá"
                    value={form.direccion}
                    onChange={(e) =>
                      setForm({ ...form, direccion: e.target.value })
                    }
                    className="w-full border-2 border-stone-300 rounded-xl px-3.5 py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Horarios de Atención
                </label>
                <input
                  type="text"
                  placeholder="Lun a Vie 8:00 a 12:30 y 15:30 a 19:30"
                  value={form.horarios}
                  onChange={(e) =>
                    setForm({ ...form, horarios: e.target.value })
                  }
                  className="w-full border-2 border-stone-300 rounded-xl px-3.5 py-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Especialidades del Taller (se muestra en la web)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej: Mecánica general, inyección electrónica, tren delantero, frenos y embragues."
                  value={form.descripcion_servicios}
                  onChange={(e) =>
                    setForm({ ...form, descripcion_servicios: e.target.value })
                  }
                  className="w-full border-2 border-stone-300 rounded-xl px-3.5 py-2.5"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-6 py-3 rounded-xl shadow-md transition"
                >
                  {saving ? "Guardando..." : "GUARDAR CAMBIOS"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
