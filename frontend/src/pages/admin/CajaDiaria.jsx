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
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Estado para el modal de cobrar saldo pendiente
  const [selectedOT, setSelectedOT] = useState(null);
  const [montoCobro, setMontoCobro] = useState("");
  const [metodoCobro, setMetodoCobro] = useState("EFECTIVO");
  const [notasCobro, setNotasCobro] = useState("Cancelación de saldo");
  const [submittingCobro, setSubmittingCobro] = useState(false);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resDiario, resPendientes] = await Promise.all([
        apiFetch(`/caja/diario?fecha=${fechaSeleccionada}`),
        apiFetch("/caja/pendientes"),
      ]);
      setResumenDiario(resDiario.data);
      setCuentasPendientes(resPendientes.data);
    } catch (err) {
      console.error("Error al cargar datos de caja:", err);
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
  };

  const handleRegistrarCobro = async (e) => {
    e.preventDefault();
    if (!selectedOT) return;

    try {
      setSubmittingCobro(true);
      await apiFetch(`/ordenes/${selectedOT.orden_id}/pagos`, {
        method: "POST",
        body: JSON.stringify({
          monto: Number(montoCobro),
          metodo_pago: metodoCobro,
          notas: notasCobro,
        }),
      });

      setSelectedOT(null);
      await cargarDatos(); // Recargar balances y lista de morosos
    } catch (err) {
      alert("Error al registrar cobro: " + err.message);
    } finally {
      setSubmittingCobro(false);
    }
  };

  const getMetodoIcon = (metodo) => {
    switch (metodo) {
      case "EFECTIVO":
        return <Wallet className="w-4 h-4 text-emerald-400" />;
      case "TRANSFERENCIA":
        return <Building2 className="w-4 h-4 text-blue-400" />;
      default:
        return <CreditCard className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabecera y Selector de Fecha */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Caja y Cobranzas
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Arqueo de ingresos del día y cuentas corrientes por cobrar.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5 self-start sm:self-auto">
            <Calendar className="w-4 h-4 text-slate-400 ml-2" />
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="bg-transparent text-xs text-white outline-none pr-2 font-mono"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            Calculando balances...
          </div>
        ) : (
          <div className="space-y-8">
            {/* Tarjetas KPI de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cobrado en la Fecha */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                      Ingresos del Día
                    </span>
                    <h3 className="text-3xl font-extrabold text-emerald-400 font-mono mt-2">
                      $
                      {Number(resumenDiario?.total_cobrado || 0).toLocaleString(
                        "es-AR",
                      )}
                    </h3>
                  </div>
                  <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 mt-4 block">
                  Fecha auditada: {fechaSeleccionada}
                </span>
              </div>

              {/* Total de Deuda en la Calle */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                      Cuentas por Cobrar
                    </span>
                    <h3 className="text-3xl font-extrabold text-amber-400 font-mono mt-2">
                      $
                      {Number(
                        cuentasPendientes?.total_deuda_global || 0,
                      ).toLocaleString("es-AR")}
                    </h3>
                  </div>
                  <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 mt-4 block">
                  {cuentasPendientes?.cantidad_ordenes_pendientes || 0} órdenes
                  con saldo pendiente
                </span>
              </div>

              {/* Desglose por Método */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">
                  Desglose por Método
                </span>
                <div className="space-y-2">
                  {resumenDiario?.desglose_metodos?.length === 0 ? (
                    <span className="text-xs text-slate-500">
                      Sin movimientos hoy
                    </span>
                  ) : (
                    resumenDiario?.desglose_metodos?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs"
                      >
                        <div className="flex items-center gap-2 text-slate-300">
                          {getMetodoIcon(item.metodo_pago)}
                          <span>{item.metodo_pago}</span>
                        </div>
                        <span className="font-mono font-semibold text-white">
                          ${Number(item.subtotal).toLocaleString("es-AR")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-slate-800 pt-2 mt-2 text-[11px] text-slate-500">
                  {resumenDiario?.transacciones?.length || 0} cobros procesados
                </div>
              </div>
            </div>

            {/* Grilla 2 Columnas: Movimientos del Día y Cuentas por Cobrar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Columna Izquierda: Cobros Recientes */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />{" "}
                  Movimientos Registrados
                </h3>

                {resumenDiario?.transacciones?.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    No hubo ingresos registrados en esta fecha.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {resumenDiario?.transacciones?.map((t) => (
                      <div
                        key={t.pago_id}
                        className="py-3 flex justify-between items-center text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">
                              {t.patente}
                            </span>
                            <span className="text-slate-400">
                              · {t.cliente_nombre}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            O.T. #{t.orden_id} — {t.notas || t.metodo_pago}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            +${Number(t.monto).toLocaleString("es-AR")}
                          </span>
                          <span className="text-[10px] text-slate-500 block uppercase">
                            {t.metodo_pago}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Columna Derecha: Cuentas por Cobrar (Saldos Pendientes) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" /> Cuentas por
                  Cobrar
                </h3>

                {cuentasPendientes?.ordenes?.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                    ¡Al día! No hay órdenes con saldo pendiente.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {cuentasPendientes?.ordenes?.map((ot) => (
                      <div
                        key={ot.orden_id}
                        className="py-3 flex justify-between items-center text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                              {ot.patente}
                            </span>
                            <span className="font-semibold text-white">
                              {ot.cliente_nombre}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {ot.marca} {ot.modelo} · Estado:{" "}
                            <b className="text-slate-300">{ot.estado}</b>
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-mono font-bold text-amber-400 text-sm block">
                              $
                              {Number(ot.saldo_pendiente).toLocaleString(
                                "es-AR",
                              )}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Total: $
                              {Number(ot.total_final).toLocaleString("es-AR")}
                            </span>
                          </div>

                          <button
                            onClick={() => handleOpenCobroModal(ot)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Cobrar
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

      {/* Modal para Registrar Cobro Directo */}
      {selectedOT && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setSelectedOT(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">
              Registrar Cobro
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              O.T. #{selectedOT.orden_id} — {selectedOT.patente} (
              {selectedOT.cliente_nombre})
            </p>

            <form onSubmit={handleRegistrarCobro} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Monto a Cobrar ($)
                </label>
                <input
                  type="number"
                  required
                  value={montoCobro}
                  onChange={(e) => setMontoCobro(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Método de Pago
                </label>
                <select
                  value={metodoCobro}
                  onChange={(e) => setMetodoCobro(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="TARJETA">Tarjeta</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Notas / Referencia
                </label>
                <input
                  type="text"
                  value={notasCobro}
                  onChange={(e) => setNotasCobro(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOT(null)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingCobro}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors"
                >
                  {submittingCobro ? "Procesando..." : "Confirmar Cobro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
