import { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";
import AdminNavbar from "../../components/AdminNavbar";
import {
  DollarSign,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Wallet,
  Building2,
  Calendar,
  X,
} from "lucide-react";

export default function CajaDiaria() {
  const [resumenDiario, setResumenDiario] = useState(null);
  const [cuentasPendientes, setCuentasPendientes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Modal de cobrar saldo pendiente
  const [selectedOT, setSelectedOT] = useState(null);
  const [montoCobro, setMontoCobro] = useState("");
  const [metodoCobro, setMetodoCobro] = useState("EFECTIVO");
  const [notasCobro, setNotasCobro] = useState("Cancelación de saldo");
  const [submittingCobro, setSubmittingCobro] = useState(false);
  const [modalError, setModalError] = useState(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [resDiario, resPendientes] = await Promise.all([
        apiFetch(`/caja/diario?fecha=${fechaSeleccionada}`),
        apiFetch("/caja/pendientes"),
      ]);
      setResumenDiario(resDiario.data);
      setCuentasPendientes(resPendientes.data);
    } catch (err) {
      setErrorMsg(err.message || "No se pudieron cargar los datos de caja");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [fechaSeleccionada]);

  const handleOpenCobroModal = (ot) => {
    setSelectedOT(ot);
    setMontoCobro(ot.saldo_pendiente);
    setModalError(null);
  };

  const handleRegistrarCobro = async (e) => {
    e.preventDefault();
    if (!selectedOT) return;

    try {
      setSubmittingCobro(true);
      setModalError(null);
      await apiFetch(`/ordenes/${selectedOT.orden_id}/pagos`, {
        method: "POST",
        body: JSON.stringify({
          monto: Number(montoCobro),
          metodo_pago: metodoCobro,
          notas: notasCobro,
        }),
      });

      setSelectedOT(null);
      setSuccessMsg(
        `Cobro registrado con éxito en la Orden #${selectedOT.orden_id}`,
      );
      setTimeout(() => setSuccessMsg(null), 4000);
      await cargarDatos();
    } catch (err) {
      setModalError(err.message || "Error al registrar el cobro");
    } finally {
      setSubmittingCobro(false);
    }
  };

  const getMetodoIcon = (metodo) => {
    switch (metodo) {
      case "EFECTIVO":
        return <Wallet className="w-4 h-4 text-emerald-700" />;
      case "TRANSFERENCIA":
        return <Building2 className="w-4 h-4 text-blue-700" />;
      default:
        return <CreditCard className="w-4 h-4 text-amber-700" />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-12">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Alertas */}
        {successMsg && (
          <div className="mb-5 bg-emerald-100 border-l-4 border-emerald-600 text-emerald-900 p-4 rounded-r-xl flex items-center justify-between text-sm font-bold shadow-sm">
            <span>{successMsg}</span>
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 bg-red-100 border-l-4 border-red-600 text-red-900 p-4 rounded-r-xl flex items-center gap-2 text-sm font-bold shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Cabecera y Selector de Fecha */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Caja del Día y Cuentas a Cobrar
            </h2>
            <p className="text-sm text-stone-600">
              Controlá la plata que entró hoy y los trabajos que quedaron con
              saldo pendiente.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white border-2 border-stone-300 rounded-xl px-3 py-2 self-start sm:self-auto shadow-sm">
            <Calendar className="w-4 h-4 text-stone-600" />
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="bg-transparent text-sm font-bold text-stone-900 outline-none font-mono"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-stone-600 font-bold">
            Calculando caja del taller...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tarjetas KPI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Ingresos del Día */}
              <div className="bg-white border-2 border-stone-300 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-stone-500 font-extrabold uppercase tracking-wider">
                      Plata Cobrada Hoy
                    </span>
                    <h3 className="text-3xl font-black text-emerald-700 font-mono mt-2">
                      $
                      {Number(resumenDiario?.total_cobrado || 0).toLocaleString(
                        "es-AR",
                      )}
                    </h3>
                  </div>
                  <div className="w-11 h-11 bg-emerald-100 border border-emerald-300 rounded-xl flex items-center justify-center text-emerald-700">
                    <ArrowUpRight className="w-6 h-6" />
                  </div>
                </div>
                <span className="text-xs font-semibold text-stone-500 mt-4 block">
                  Fecha: {fechaSeleccionada}
                </span>
              </div>

              {/* Cuentas por Cobrar */}
              <div className="bg-white border-2 border-stone-300 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-stone-500 font-extrabold uppercase tracking-wider">
                      Total a Cobrar en la Calle
                    </span>
                    <h3 className="text-3xl font-black text-amber-700 font-mono mt-2">
                      $
                      {Number(
                        cuentasPendientes?.total_deuda_global || 0,
                      ).toLocaleString("es-AR")}
                    </h3>
                  </div>
                  <div className="w-11 h-11 bg-amber-100 border border-amber-300 rounded-xl flex items-center justify-center text-amber-700">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>
                <span className="text-xs font-semibold text-stone-500 mt-4 block">
                  {cuentasPendientes?.cantidad_ordenes_pendientes || 0} órdenes
                  con saldo pendiente
                </span>
              </div>

              {/* Desglose por Método */}
              <div className="bg-white border-2 border-stone-300 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <span className="text-xs text-stone-500 font-extrabold uppercase tracking-wider mb-2 block">
                  Cómo entró la plata hoy
                </span>
                <div className="space-y-2">
                  {resumenDiario?.desglose_metodos?.length === 0 ? (
                    <span className="text-xs font-semibold text-stone-500">
                      Sin cobros registrados en esta fecha
                    </span>
                  ) : (
                    resumenDiario?.desglose_metodos?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-sm"
                      >
                        <div className="flex items-center gap-2 font-bold text-stone-800">
                          {getMetodoIcon(item.metodo_pago)}
                          <span>{item.metodo_pago}</span>
                        </div>
                        <span className="font-mono font-extrabold text-stone-900">
                          ${Number(item.subtotal).toLocaleString("es-AR")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-stone-200 pt-2 mt-2 text-xs font-semibold text-stone-500">
                  {resumenDiario?.transacciones?.length || 0} cobros procesados
                </div>
              </div>
            </div>

            {/* Grilla 2 Columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cobros del Día */}
              <div className="bg-white border-2 border-stone-300 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-extrabold text-stone-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-700" />
                  Cobros Registrados ({fechaSeleccionada})
                </h3>

                {resumenDiario?.transacciones?.length === 0 ? (
                  <p className="text-sm text-stone-500 py-8 text-center font-medium">
                    No hubo ingresos cargados en esta fecha.
                  </p>
                ) : (
                  <div className="divide-y divide-stone-200">
                    {resumenDiario?.transacciones?.map((t) => (
                      <div
                        key={t.pago_id}
                        className="py-3.5 flex justify-between items-center text-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black bg-stone-900 text-white px-2 py-0.5 rounded text-xs">
                              {t.patente}
                            </span>
                            <span className="font-bold text-stone-800">
                              {t.cliente_nombre}
                            </span>
                          </div>
                          <span className="text-xs text-stone-500 block mt-1">
                            O.T. #{t.orden_id} — {t.notas || t.metodo_pago}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-extrabold text-emerald-700 text-base">
                            +${Number(t.monto).toLocaleString("es-AR")}
                          </span>
                          <span className="text-[11px] font-bold text-stone-500 block uppercase">
                            {t.metodo_pago}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cuentas por Cobrar */}
              <div className="bg-white border-2 border-stone-300 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-extrabold text-stone-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  Trabajos con Saldo Pendiente
                </h3>

                {cuentasPendientes?.ordenes?.length === 0 ? (
                  <div className="py-8 text-center text-stone-600 text-sm font-bold flex flex-col items-center">
                    <CheckCircle2 className="w-9 h-9 text-emerald-600 mb-2" />
                    ¡Todo cobrado! No hay órdenes con saldo pendiente.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-200">
                    {cuentasPendientes?.ordenes?.map((ot) => (
                      <div
                        key={ot.orden_id}
                        className="py-3.5 flex flex-wrap justify-between items-center gap-3 text-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black bg-stone-900 text-white px-2 py-0.5 rounded text-xs">
                              {ot.patente}
                            </span>
                            <span className="font-extrabold text-stone-900">
                              {ot.cliente_nombre}
                            </span>
                          </div>
                          <span className="text-xs text-stone-600 block mt-1">
                            {ot.marca} {ot.modelo} • Estado:{" "}
                            <strong>{ot.estado}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-mono font-extrabold text-amber-700 text-base block">
                              $
                              {Number(ot.saldo_pendiente).toLocaleString(
                                "es-AR",
                              )}
                            </span>
                            <span className="text-[11px] font-semibold text-stone-500">
                              Total: $
                              {Number(ot.total_final).toLocaleString("es-AR")}
                            </span>
                          </div>

                          <button
                            onClick={() => handleOpenCobroModal(ot)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow-sm"
                          >
                            COBRAR
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Registrar Cobro */}
      {selectedOT && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-stone-300 rounded-2xl max-w-sm w-full p-6 text-stone-900 shadow-2xl relative">
            <button
              onClick={() => setSelectedOT(null)}
              className="absolute right-4 top-4 text-stone-500 hover:text-stone-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-stone-900 mb-1">
              Anotar Cobro en Caja
            </h3>
            <p className="text-xs font-semibold text-stone-600 mb-4">
              O.T. #{selectedOT.orden_id} — {selectedOT.patente} (
              {selectedOT.cliente_nombre})
            </p>

            {modalError && (
              <div className="bg-red-100 border-l-4 border-red-600 text-red-900 p-3 rounded-r-xl flex items-center gap-2 mb-3 text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleRegistrarCobro} className="space-y-3 text-sm">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Monto que paga ($)
                </label>
                <input
                  type="number"
                  required
                  value={montoCobro}
                  onChange={(e) => setMontoCobro(e.target.value)}
                  className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 text-base font-extrabold font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Forma de Pago
                </label>
                <select
                  value={metodoCobro}
                  onChange={(e) => setMetodoCobro(e.target.value)}
                  className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="TARJETA">Tarjeta</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Observación / Nota
                </label>
                <input
                  type="text"
                  value={notasCobro}
                  onChange={(e) => setNotasCobro(e.target.value)}
                  className="w-full border-2 border-stone-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOT(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 font-bold text-stone-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingCobro}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl"
                >
                  {submittingCobro ? "Guardando..." : "CONFIRMAR COBRO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
