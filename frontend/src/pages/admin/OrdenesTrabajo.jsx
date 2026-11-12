import { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";
import AdminNavbar from "../../components/AdminNavbar";
import NuevaOTModal from "../../components/NuevaOTModal";
import { Plus, CheckCircle, Car, RefreshCw } from "lucide-react";

const ESTADOS = [
  "INGRESADO",
  "EN_DIAGNOSTICO",
  "ESPERANDO_REPUESTO",
  "EN_REPARACION",
  "LISTO",
  "ENTREGADO",
];

export default function OrdenesTrabajo() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [notif, setNotif] = useState(null);

  // Cargamos datos de prueba iniciales (orden #1 creada anteriormente)
  const loadOrdenes = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/ordenes"); // Ahora trae TODAS las órdenes
      setOrdenes(res.data || []);
    } catch (err) {
      console.error("Error al traer órdenes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrdenes();
  }, []);

  const handleCambiarEstado = async (ordenId, nuevoEstado) => {
    try {
      const res = await apiFetch(`/ordenes/${ordenId}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (res.data?.notificacionEnviada) {
        setNotif(`¡Vehículo listo! Mensaje enviado al cliente por WhatsApp.`);
        setTimeout(() => setNotif(null), 4000);
      }

      // Actualizamos estado en memoria local
      setOrdenes((prev) =>
        prev.map((o) => (o.id === ordenId ? { ...o, estado: nuevoEstado } : o)),
      );
    } catch (err) {
      alert("Error al actualizar estado: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notificación flotante de WhatsApp */}
        {notif && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center justify-between text-sm shadow-lg">
            <span>{notif}</span>
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          </div>
        )}

        {/* Cabecera y Acción */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Órdenes de Trabajo
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Control de estado, repuestos y entregas en tiempo real.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadOrdenes}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refrescar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              Nueva O.T.
            </button>
          </div>
        </div>

        {/* Grilla de Órdenes */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Cargando órdenes activas...
          </div>
        ) : ordenes.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800 p-8">
            <Car className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-white font-bold text-base">
              No hay órdenes cargadas
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Creá una orden con el botón superior.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ordenes.map((ot) => (
              <div
                key={ot.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-xl"
              >
                <div>
                  {/* Cabecera Tarjeta */}
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                      O.T. #{ot.id}
                    </span>
                    <span className="text-[11px] font-mono font-semibold bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                      {ot.patente}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-0.5">
                    {ot.marca} {ot.modelo}
                  </h3>
                  <span className="text-xs text-slate-400 block mb-3">
                    Cliente: {ot.cliente_nombre} ({ot.cliente_telefono})
                  </span>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 mb-4">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                      Falla declarada
                    </span>
                    <p className="text-xs text-slate-200 line-clamp-2">
                      {ot.falla_declarada}
                    </p>
                  </div>
                </div>

                {/* Pie con Estado y Finanzas */}
                <div className="border-t border-slate-800 pt-3 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Total:</span>
                    <span className="font-mono font-bold text-white">
                      ${Number(ot.total_final).toLocaleString("es-AR")}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Saldo pendiente:</span>
                    <span
                      className={`font-mono font-bold ${
                        ot.saldo_pendiente > 0
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      ${Number(ot.saldo_pendiente).toLocaleString("es-AR")}
                    </span>
                  </div>

                  {/* Selector interactivo de Estado */}
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      Estado Actual
                    </label>
                    <select
                      value={ot.estado}
                      onChange={(e) =>
                        handleCambiarEstado(ot.id, e.target.value)
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                    >
                      {ESTADOS.map((est) => (
                        <option key={est} value={est}>
                          {est}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <NuevaOTModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadOrdenes}
      />
    </div>
  );
}
