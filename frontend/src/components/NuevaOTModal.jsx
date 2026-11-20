import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../api/client";
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Car,
  User,
} from "lucide-react";

export default function NuevaOTModal({ isOpen, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);
  const [error, setError] = useState(null);
  const [vehiculos, setVehiculos] = useState([]);
  const [busquedaAuto, setBusquedaAuto] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);

  const [formData, setFormData] = useState({
    vehiculo_id: "",
    falla_declarada: "",
    diagnostico_tecnico: "",
    kilometraje_ingreso: "",
    total_mano_obra: "",
    pago_monto: "",
    pago_metodo: "EFECTIVO",
    pago_notas: "Anticipo de repuestos",
  });

  const [repuestos, setRepuestos] = useState([
    { descripcion: "", cantidad: 1, costo_unitario: 0, precio_unitario: "" },
  ]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setBusquedaAuto("");
      setFormData({
        vehiculo_id: "",
        falla_declarada: "",
        diagnostico_tecnico: "",
        kilometraje_ingreso: "",
        total_mano_obra: "",
        pago_monto: "",
        pago_metodo: "EFECTIVO",
        pago_notas: "Anticipo de repuestos",
      });
      setRepuestos([
        {
          descripcion: "",
          cantidad: 1,
          costo_unitario: 0,
          precio_unitario: "",
        },
      ]);
      cargarVehiculos();
    }
  }, [isOpen]);

  const cargarVehiculos = async () => {
    setLoadingVehiculos(true);
    try {
      const res = await apiFetch("/gestion/vehiculos-lista");
      setVehiculos(res.data || []);
    } catch {
      setVehiculos([]);
    } finally {
      setLoadingVehiculos(false);
    }
  };

  const vehiculoSeleccionado = useMemo(
    () =>
      vehiculos.find((v) => String(v.id) === String(formData.vehiculo_id)) ||
      null,
    [vehiculos, formData.vehiculo_id],
  );

  const vehiculosFiltrados = useMemo(() => {
    const q = busquedaAuto.trim().toLowerCase();
    if (!q) return vehiculos.slice(0, 8);
    return vehiculos
      .filter(
        (v) =>
          v.patente?.toLowerCase().includes(q) ||
          v.marca?.toLowerCase().includes(q) ||
          v.modelo?.toLowerCase().includes(q) ||
          v.cliente_nombre?.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [vehiculos, busquedaAuto]);

  if (!isOpen) return null;

  const seleccionarVehiculo = (v) => {
    setFormData((prev) => ({
      ...prev,
      vehiculo_id: v.id,
      kilometraje_ingreso: v.kilometraje || prev.kilometraje_ingreso || 0,
    }));
    setBusquedaAuto(`${v.patente} — ${v.marca} ${v.modelo}`);
    setMostrarLista(false);
  };

  const handleAddRepuesto = () => {
    setRepuestos([
      ...repuestos,
      { descripcion: "", cantidad: 1, costo_unitario: 0, precio_unitario: "" },
    ]);
  };

  const handleRemoveRepuesto = (index) => {
    setRepuestos(repuestos.filter((_, i) => i !== index));
  };

  const handleRepuestoChange = (index, field, value) => {
    const updated = [...repuestos];
    updated[index][field] = field === "descripcion" ? value : value;
    setRepuestos(updated);
  };

  const totalRepuestos = repuestos.reduce(
    (acc, r) =>
      acc + (Number(r.cantidad) || 0) * (Number(r.precio_unitario) || 0),
    0,
  );
  const totalGeneral = (Number(formData.total_mano_obra) || 0) + totalRepuestos;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.vehiculo_id) {
      setError("Seleccioná un vehículo de la lista antes de crear la orden.");
      setLoading(false);
      return;
    }

    const repuestosFiltrados = repuestos
      .filter((r) => r.descripcion.trim() !== "")
      .map((r) => ({
        descripcion: r.descripcion.trim(),
        cantidad: Number(r.cantidad) || 1,
        costo_unitario: Number(r.costo_unitario) || 0,
        precio_unitario: Number(r.precio_unitario) || 0,
      }));

    const payload = {
      vehiculo_id: Number(formData.vehiculo_id),
      falla_declarada: formData.falla_declarada.trim(),
      diagnostico_tecnico: formData.diagnostico_tecnico.trim() || undefined,
      kilometraje_ingreso: Number(formData.kilometraje_ingreso) || 0,
      total_mano_obra: Number(formData.total_mano_obra) || 0,
      repuestos: repuestosFiltrados,
      pago_inicial:
        Number(formData.pago_monto) > 0
          ? {
              monto: Number(formData.pago_monto),
              metodo_pago: formData.pago_metodo,
              notas: formData.pago_notas || "Anticipo",
            }
          : undefined,
    };

    try {
      await apiFetch("/ordenes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || "Error al crear la orden de trabajo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-slate-300 rounded-xl max-w-2xl w-full p-5 sm:p-6 my-6 text-slate-800 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="border-b border-slate-200 pb-3 mb-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
            Ingreso a Taller
          </span>
          <h2 className="text-xl font-black text-slate-900">
            Nueva Orden de Trabajo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Buscá el vehículo por patente o nombre del dueño para abrir la
            ficha.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-lg flex items-center gap-2 mb-4 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector inteligente de vehículo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Buscar Vehículo (Patente o Cliente) *
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    loadingVehiculos
                      ? "Cargando flota..."
                      : "Escribí patente (ej: AA123BB) o cliente..."
                  }
                  value={busquedaAuto}
                  onFocus={() => setMostrarLista(true)}
                  onChange={(e) => {
                    setBusquedaAuto(e.target.value);
                    setFormData((prev) => ({ ...prev, vehiculo_id: "" }));
                    setMostrarLista(true);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-900 font-medium focus:border-amber-500 focus:bg-white outline-none"
                />
              </div>

              {/* Desplegable de resultados */}
              {mostrarLista && (
                <div className="absolute z-20 mt-1 w-full bg-white border-2 border-slate-300 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                  {vehiculosFiltrados.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500">
                      No encontramos ese auto. Registralo primero en{" "}
                      <strong className="text-slate-800">
                        Clientes y Fichas
                      </strong>
                      .
                    </div>
                  ) : (
                    vehiculosFiltrados.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => seleccionarVehiculo(v)}
                        className="w-full text-left px-3 py-2.5 hover:bg-amber-50 border-b border-slate-100 last:border-b-0 flex items-center justify-between gap-2 transition-colors"
                      >
                        <div>
                          <span className="inline-block bg-slate-900 text-white font-mono font-bold text-xs px-2 py-0.5 rounded mr-2">
                            {v.patente}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {v.marca} {v.modelo}
                          </span>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3" /> {v.cliente_nombre}
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {Number(v.kilometraje || 0).toLocaleString("es-AR")}{" "}
                          km
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Ficha rápida del vehículo elegido */}
              {vehiculoSeleccionado && (
                <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-900">
                    <Car className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      <strong>{vehiculoSeleccionado.patente}</strong> ·{" "}
                      {vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo}{" "}
                      ({vehiculoSeleccionado.cliente_nombre})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, vehiculo_id: "" }));
                      setBusquedaAuto("");
                      setMostrarLista(true);
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:underline"
                  >
                    Cambiar
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Kilometraje *
              </label>
              <input
                type="number"
                required
                min={0}
                placeholder="Ej: 124500"
                value={formData.kilometraje_ingreso}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    kilometraje_ingreso: e.target.value,
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:bg-white outline-none font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Trabajo Solicitado / Falla Reportada *
            </label>
            <textarea
              required
              rows={2}
              value={formData.falla_declarada}
              onChange={(e) =>
                setFormData({ ...formData, falla_declarada: e.target.value })
              }
              placeholder="Ej: Service completo 10.000 km + revisión de frenos delanteros"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:bg-white outline-none"
            />
          </div>

          {/* Repuestos e Insumos */}
          <div className="border-t border-slate-200 pt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Repuestos e Insumos (Opcional)
              </span>
              <button
                type="button"
                onClick={handleAddRepuesto}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-md flex items-center gap-1 font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar ítem
              </button>
            </div>

            <div className="space-y-2">
              {repuestos.map((rep, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Ej: Filtro de aceite / 4L Sintético"
                    value={rep.descripcion}
                    onChange={(e) =>
                      handleRepuestoChange(idx, "descripcion", e.target.value)
                    }
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 focus:bg-white"
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="Cant"
                    value={rep.cantidad}
                    onChange={(e) =>
                      handleRepuestoChange(idx, "cantidad", e.target.value)
                    }
                    className="w-16 bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 text-center outline-none focus:border-amber-500 focus:bg-white font-mono"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Precio $"
                    value={rep.precio_unitario}
                    onChange={(e) =>
                      handleRepuestoChange(
                        idx,
                        "precio_unitario",
                        e.target.value,
                      )
                    }
                    className="w-28 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 text-right outline-none focus:border-amber-500 focus:bg-white font-mono"
                  />
                  {repuestos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRepuesto(idx)}
                      className="text-slate-400 hover:text-red-600 p-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mano de Obra y Anticipo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-200 pt-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Mano de Obra ($)
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={formData.total_mano_obra}
                onChange={(e) =>
                  setFormData({ ...formData, total_mano_obra: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:bg-white outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Seña / Anticipo ($)
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={formData.pago_monto}
                onChange={(e) =>
                  setFormData({ ...formData, pago_monto: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:bg-white outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Medio de Seña
              </label>
              <select
                value={formData.pago_metodo}
                onChange={(e) =>
                  setFormData({ ...formData, pago_metodo: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:bg-white outline-none"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="TARJETA">Tarjeta</option>
              </select>
            </div>
          </div>

          {/* Totales */}
          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Total Estimado de la Orden
              </span>
              <span className="text-[11px] text-slate-500">
                Repuestos: ${totalRepuestos.toLocaleString("es-AR")} · M.O.: $
                {(Number(formData.total_mano_obra) || 0).toLocaleString(
                  "es-AR",
                )}
              </span>
            </div>
            <span className="text-2xl text-slate-900 font-mono font-black">
              ${totalGeneral.toLocaleString("es-AR")}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? "Creando Orden..." : "Abrir Orden de Trabajo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
