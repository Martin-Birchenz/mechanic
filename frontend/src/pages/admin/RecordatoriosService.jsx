import { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import AdminNavbar from "../../components/AdminNavbar";
import {
  Bell,
  Plus,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

function limpiarNumero(valor) {
  if (!valor) return null;
  const limpio = String(valor).trim().replace(/\s+/g, "").replace(/[.,]/g, "");
  const n = parseInt(limpio, 10);
  return Number.isNaN(n) ? null : n;
}

export default function RecordatoriosService() {
  const { user } = useAuth();
  const [lista, setLista] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    patente: "",
    fecha_recordatorio: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    km_proximo: "",
    motivo: "Cambio de aceite y filtros (Service preventivo)",
  });

  const cargar = async () => {
    try {
      setLoading(true);
      const [resRec, resVeh] = await Promise.all([
        apiFetch("/gestion/recordatorios"),
        apiFetch("/gestion/vehiculos-lista"),
      ]);
      setLista(resRec.data || []);
      setVehiculos(resVeh.data || []);
    } catch (err) {
      setErrorMsg(
        err.message?.includes("Invalid input")
          ? "Revisá los datos ingresados en los recordatorios."
          : err.message || "No se pudieron cargar los recordatorios.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!form.patente) {
      setErrorMsg("Seleccioná un cliente y su vehículo de la lista.");
      return;
    }

    try {
      setErrorMsg(null);
      await apiFetch("/gestion/recordatorios", {
        method: "POST",
        body: JSON.stringify({
          patente: form.patente.trim().toUpperCase(),
          fecha_recordatorio: form.fecha_recordatorio,
          km_proximo: limpiarNumero(form.km_proximo),
          motivo: form.motivo.trim(),
        }),
      });
      setModalOpen(false);
      setForm((prev) => ({ ...prev, patente: "", km_proximo: "" }));
      cargar();
    } catch (err) {
      setErrorMsg(
        err.message?.includes("Invalid input")
          ? "Ingresá un kilometraje válido (solo números)."
          : err.message || "No se pudo agendar el próximo service.",
      );
    }
  };

  const enviarRecordatorioWhatsApp = async (item) => {
    const tel = String(item.cliente_telefono || "").replace(/\D/g, "");
    const telAR = tel.startsWith("54") ? tel : `549${tel}`;
    const taller = user?.taller_nombre || "el taller";
    const msg = `Hola ${item.cliente_nombre}, te saludamos desde ${taller}. Te recordamos que tu ${item.marca} ${item.modelo} (${item.patente}) ya está próximo a su service (${item.motivo}). ¿Querés que te reservemos un turno?`;

    window.open(
      `https://wa.me/${telAR}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );

    await apiFetch(`/gestion/recordatorios/${item.id}/contactado`, {
      method: "PATCH",
    });
    cargar();
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-12">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {errorMsg && (
          <div className="mb-5 bg-red-100 border-l-4 border-red-600 text-red-900 p-4 rounded-r-xl flex items-center gap-2 text-sm font-bold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Recordatorios de Próximo Service
            </h2>
            <p className="text-sm text-stone-600">
              Elegí un cliente de tu taller para agendar cuándo le toca volver y
              avisarle por WhatsApp.
            </p>
          </div>

          <button
            onClick={() => {
              setErrorMsg(null);
              setModalOpen(true);
            }}
            className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm px-5 py-3 rounded-xl flex items-center gap-2 shadow-md self-start cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Agendar Service
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <p className="text-stone-600 font-bold">
              Cargando recordatorios...
            </p>
          ) : lista.length === 0 ? (
            <div className="col-span-full bg-white border-2 border-dashed border-stone-300 rounded-2xl p-10 text-center">
              <Bell className="w-10 h-10 text-stone-400 mx-auto mb-2" />
              <p className="font-extrabold text-stone-900">
                Sin recordatorios agendados
              </p>
              <p className="text-sm text-stone-600">
                Cuando termines un cambio de aceite o distribución, agéndalo acá
                para avisarle al cliente en 6 meses.
              </p>
            </div>
          ) : (
            lista.map((r) => (
              <div
                key={r.id}
                className={`bg-white border-2 rounded-2xl p-5 flex flex-col justify-between shadow-sm ${
                  r.contactado
                    ? "border-stone-200 opacity-75"
                    : "border-amber-400"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-mono font-black bg-stone-900 text-white px-2.5 py-1 rounded-lg text-xs">
                      {r.patente}
                    </span>
                    <span
                      className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                        r.contactado
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {r.contactado
                        ? "Avisado"
                        : `Fecha: ${new Date(r.fecha_recordatorio).toLocaleDateString("es-AR")}`}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-stone-900">
                    {r.marca} {r.modelo}
                  </h3>
                  <p className="text-xs font-semibold text-stone-600 mb-2">
                    Cliente: {r.cliente_nombre} • {r.cliente_telefono}
                  </p>
                  <p className="text-sm font-medium text-stone-800 bg-stone-100 p-3 rounded-xl border border-stone-200">
                    {r.motivo}
                    {r.km_proximo
                      ? ` • A los ${Number(r.km_proximo).toLocaleString("es-AR")} km`
                      : ""}
                  </p>
                </div>

                <button
                  onClick={() => enviarRecordatorioWhatsApp(r)}
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  AVISAR POR WHATSAPP
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-stone-300 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 text-stone-500 hover:text-stone-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-extrabold text-stone-900 mb-4">
              Agendar Próximo Service
            </h3>
            <form onSubmit={handleCrear} className="space-y-3 text-sm">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Cliente y Vehículo *
                </label>
                <select
                  required
                  value={form.patente}
                  onChange={(e) =>
                    setForm({ ...form, patente: e.target.value })
                  }
                  className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-semibold bg-white"
                >
                  <option value="">Seleccioná un cliente y su auto...</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.patente}>
                      {v.cliente_nombre} — {v.patente} ({v.marca} {v.modelo})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Fecha Aviso *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.fecha_recordatorio}
                    onChange={(e) =>
                      setForm({ ...form, fecha_recordatorio: e.target.value })
                    }
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Km Próximo Service
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 106.400"
                    value={form.km_proximo}
                    onChange={(e) =>
                      setForm({ ...form, km_proximo: e.target.value })
                    }
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Trabajo a Recordar
                </label>
                <input
                  type="text"
                  required
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  className="w-full border-2 border-stone-300 rounded-xl px-3 py-2"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
