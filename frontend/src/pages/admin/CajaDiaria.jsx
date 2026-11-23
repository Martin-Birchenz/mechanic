import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../api/client";
import AdminNavbar from "../../components/AdminNavbar";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  BarChart3,
} from "lucide-react";

function limpiarNumero(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  if (!valor) return 0;
  const limpio = String(valor).trim().replace(/\s+/g, "").replace(",", ".");
  const n = parseFloat(limpio);
  return Number.isNaN(n) ? 0 : n;
}

export default function CajaDiaria() {
  const hoy = new Date().toISOString().split("T")[0];
  const [fecha, setFecha] = useState(hoy);
  const [ingresos, setIngresos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [metricasMes, setMetricasMes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [modalGastoOpen, setModalGastoOpen] = useState(false);
  const [savingGasto, setSavingGasto] = useState(false);
  const [gastoForm, setGastoForm] = useState({
    concepto: "",
    categoria: "INSUMOS",
    monto: "",
    metodo_pago: "EFECTIVO",
  });

  const cargarCaja = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const mesActual = fecha.slice(0, 7);

      const [resIngresos, resEgresos, resMetricas] = await Promise.all([
        apiFetch(`/gestion/pagos?fecha=${fecha}`),
        apiFetch(`/gestion/egresos?fecha=${fecha}`),
        apiFetch(`/gestion/metricas?mes=${mesActual}`),
      ]);

      setIngresos(resIngresos.data || []);
      setEgresos(resEgresos.data || []);
      setMetricasMes(resMetricas.data || null);
    } catch (err) {
      setErrorMsg(
        err.message?.includes("Invalid input")
          ? "Revisá los valores ingresados en la caja."
          : err.message || "No se pudo cargar la caja diaria.",
      );
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    cargarCaja();
  }, [cargarCaja]);

  const handleCrearGasto = async (e) => {
    e.preventDefault();
    const montoNum = limpiarNumero(gastoForm.monto);
    if (!gastoForm.concepto.trim() || montoNum <= 0) {
      setErrorMsg("Ingresá un concepto y un monto mayor a cero.");
      return;
    }

    try {
      setSavingGasto(true);
      setErrorMsg(null);
      await apiFetch("/gestion/egresos", {
        method: "POST",
        body: JSON.stringify({
          ...gastoForm,
          concepto: gastoForm.concepto.trim(),
          monto: montoNum,
          fecha: `${fecha} 12:00:00`,
        }),
      });
      setModalGastoOpen(false);
      setGastoForm({
        concepto: "",
        categoria: "INSUMOS",
        monto: "",
        metodo_pago: "EFECTIVO",
      });
      cargarCaja();
    } catch (err) {
      setErrorMsg(
        err.message?.includes("Invalid input")
          ? "Ingresá un monto válido mayor a cero."
          : err.message || "No se pudo guardar el gasto.",
      );
    } finally {
      setSavingGasto(false);
    }
  };

  const handleEliminarGasto = async (id) => {
    if (!window.confirm("¿Eliminar este gasto registrado?")) return;
    try {
      await apiFetch(`/gestion/egresos/${id}`, { method: "DELETE" });
      cargarCaja();
    } catch (err) {
      setErrorMsg(err.message || "No se pudo eliminar el gasto.");
    }
  };

  const totalIngresosDia = ingresos.reduce(
    (acc, p) => acc + Number(p.monto || 0),
    0,
  );
  const totalEgresosDia = egresos.reduce(
    (acc, g) => acc + Number(g.monto || 0),
    0,
  );
  const balanceNetoDia = totalIngresosDia - totalEgresosDia;

  const ingresosEfectivo = ingresos
    .filter((p) => p.metodo_pago === "EFECTIVO")
    .reduce((acc, p) => acc + Number(p.monto || 0), 0);
  const egresosEfectivo = egresos
    .filter((g) => g.metodo_pago === "EFECTIVO")
    .reduce((acc, g) => acc + Number(g.monto || 0), 0);
  const efectivoEnCaja = ingresosEfectivo - egresosEfectivo;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-12">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {errorMsg && (
          <div className="bg-red-100 border-l-4 border-red-600 text-red-900 p-4 rounded-r-xl flex items-center gap-2 text-sm font-bold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Caja Diaria y Balance del Taller
            </h2>
            <p className="text-sm text-stone-600">
              Control de señas, cobros de órdenes, gastos de caja chica y
              rentabilidad mensual.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white border-2 border-stone-300 rounded-xl px-3 py-2">
              <Calendar className="w-4 h-4 text-stone-500" />
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="text-sm font-mono font-bold text-stone-900 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setModalGastoOpen(true)}
              className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              REGISTRAR GASTO
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border-2 border-stone-300 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-xs font-extrabold uppercase">
                Ingresos del Día
              </span>
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-emerald-700 font-mono">
              ${totalIngresosDia.toLocaleString("es-AR")}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {ingresos.length} cobro(s) / seña(s)
            </p>
          </div>

          <div className="bg-white border-2 border-stone-300 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-red-600 mb-1">
              <span className="text-xs font-extrabold uppercase">
                Gastos del Día
              </span>
              <TrendingDown className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-red-600 font-mono">
              -${totalEgresosDia.toLocaleString("es-AR")}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {egresos.length} egreso(s) de caja
            </p>
          </div>

          <div className="bg-white border-2 border-stone-300 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-stone-800 mb-1">
              <span className="text-xs font-extrabold uppercase">
                Balance Neto Día
              </span>
              <DollarSign className="w-5 h-5" />
            </div>
            <p
              className={`text-2xl font-black font-mono ${
                balanceNetoDia >= 0 ? "text-stone-900" : "text-red-600"
              }`}
            >
              ${balanceNetoDia.toLocaleString("es-AR")}
            </p>
            <p className="text-xs text-stone-500 mt-1">Ingresos menos gastos</p>
          </div>

          <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-amber-400 mb-1">
              <span className="text-xs font-extrabold uppercase">
                Efectivo Físico en Caja
              </span>
              <Wallet className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black font-mono text-white">
              ${efectivoEnCaja.toLocaleString("es-AR")}
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Arqueo billetes del día
            </p>
          </div>
        </div>

        {metricasMes && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm uppercase mb-3">
              <BarChart3 className="w-4 h-4" />
              <span>Acumulado del Mes ({metricasMes.mes})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="text-xs text-stone-600 block">
                  Facturado / Cobrado Mes
                </span>
                <strong className="text-base font-mono font-black text-emerald-800">
                  $
                  {Number(metricasMes.total_ingresos || 0).toLocaleString(
                    "es-AR",
                  )}
                </strong>
              </div>
              <div>
                <span className="text-xs text-stone-600 block">Gastos Mes</span>
                <strong className="text-base font-mono font-black text-red-700">
                  -$
                  {Number(metricasMes.total_egresos || 0).toLocaleString(
                    "es-AR",
                  )}
                </strong>
              </div>
              <div>
                <span className="text-xs text-stone-600 block">
                  Ganancia Neta Mes
                </span>
                <strong className="text-base font-mono font-black text-stone-900">
                  $
                  {Number(metricasMes.balance_neto || 0).toLocaleString(
                    "es-AR",
                  )}
                </strong>
              </div>
              <div>
                <span className="text-xs text-stone-600 block">
                  Autos Atendidos
                </span>
                <strong className="text-base font-mono font-black text-stone-900">
                  {metricasMes.cant_ordenes || 0}
                </strong>
              </div>
              <div>
                <span className="text-xs text-stone-600 block">
                  Ticket Promedio
                </span>
                <strong className="text-base font-mono font-black text-stone-900">
                  $
                  {Number(metricasMes.ticket_promedio || 0).toLocaleString(
                    "es-AR",
                  )}
                </strong>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border-2 border-stone-300 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-emerald-50 border-b-2 border-stone-300 px-5 py-3.5 flex justify-between items-center">
              <h3 className="font-extrabold text-emerald-950 text-sm uppercase">
                Ingresos / Señas y Cobros del Día
              </h3>
              <span className="font-mono font-black text-sm text-emerald-800">
                ${totalIngresosDia.toLocaleString("es-AR")}
              </span>
            </div>

            {loading ? (
              <div className="p-6 text-center text-sm font-bold text-stone-500">
                Cargando...
              </div>
            ) : ingresos.length === 0 ? (
              <div className="p-8 text-center text-sm text-stone-500">
                No se registraron cobros o señas en esta fecha.
              </div>
            ) : (
              <div className="divide-y divide-stone-200">
                {ingresos.map((pago) => (
                  <div
                    key={pago.id}
                    className="p-4 flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-extrabold text-stone-900">
                        {pago.patente
                          ? `Patente ${pago.patente}`
                          : `Orden #${pago.orden_id}`}
                        {pago.cliente_nombre ? ` — ${pago.cliente_nombre}` : ""}
                      </p>
                      <p className="text-xs text-stone-500 font-semibold">
                        Medio: {pago.metodo_pago}
                        {pago.notas ? ` • ${pago.notas}` : ""}
                      </p>
                    </div>
                    <span className="font-mono font-black text-emerald-700">
                      +${Number(pago.monto || 0).toLocaleString("es-AR")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border-2 border-stone-300 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-red-50 border-b-2 border-stone-300 px-5 py-3.5 flex justify-between items-center">
              <h3 className="font-extrabold text-red-950 text-sm uppercase">
                Egresos / Gastos de Caja Chica
              </h3>
              <span className="font-mono font-black text-sm text-red-700">
                -${totalEgresosDia.toLocaleString("es-AR")}
              </span>
            </div>

            {loading ? (
              <div className="p-6 text-center text-sm font-bold text-stone-500">
                Cargando...
              </div>
            ) : egresos.length === 0 ? (
              <div className="p-8 text-center text-sm text-stone-500">
                No se registraron gastos en esta fecha.
              </div>
            ) : (
              <div className="divide-y divide-stone-200">
                {egresos.map((gasto) => (
                  <div
                    key={gasto.id}
                    className="p-4 flex items-center justify-between text-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-stone-200 text-stone-800">
                          {gasto.categoria}
                        </span>
                        <p className="font-extrabold text-stone-900">
                          {gasto.concepto}
                        </p>
                      </div>
                      <p className="text-xs text-stone-500 font-semibold mt-0.5">
                        Pago: {gasto.metodo_pago}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-red-600">
                        -${Number(gasto.monto || 0).toLocaleString("es-AR")}
                      </span>
                      <button
                        onClick={() => handleEliminarGasto(gasto.id)}
                        title="Eliminar gasto"
                        className="text-stone-400 hover:text-red-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {modalGastoOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-stone-300 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setModalGastoOpen(false)}
              className="absolute right-4 top-4 text-stone-500 hover:text-stone-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-extrabold text-stone-900 mb-4">
              Registrar Egreso / Gasto de Taller
            </h3>
            <form onSubmit={handleCrearGasto} className="space-y-3 text-sm">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Concepto / Detalle *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Compra de desengrasante y trapos"
                  value={gastoForm.concepto}
                  onChange={(e) =>
                    setGastoForm({ ...gastoForm, concepto: e.target.value })
                  }
                  className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={gastoForm.categoria}
                    onChange={(e) =>
                      setGastoForm({ ...gastoForm, categoria: e.target.value })
                    }
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="INSUMOS">Insumos / Repuestos</option>
                    <option value="SERVICIOS">
                      Servicios (Luz, Agua, Internet)
                    </option>
                    <option value="SUELDOS">Sueldos / Adelantos</option>
                    <option value="VARIOS">Varios</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Medio de Pago
                  </label>
                  <select
                    value={gastoForm.metodo_pago}
                    onChange={(e) =>
                      setGastoForm({
                        ...gastoForm,
                        metodo_pago: e.target.value,
                      })
                    }
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="TARJETA">Tarjeta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Monto ($) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 16800 o 16.800"
                  value={gastoForm.monto}
                  onChange={(e) =>
                    setGastoForm({ ...gastoForm, monto: e.target.value })
                  }
                  className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-mono font-bold text-base"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalGastoOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingGasto}
                  className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {savingGasto ? "Guardando..." : "Guardar Gasto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
