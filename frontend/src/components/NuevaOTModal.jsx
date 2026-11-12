import { useState, useEffect } from "react";
import { apiFetch } from "../api/client";
import { X, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

export default function NuevaOTModal({ isOpen, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vehiculos, setVehiculos] = useState([]);

  const [formData, setFormData] = useState({
    vehiculo_id: "",
    falla_declarada: "",
    diagnostico_tecnico: "",
    kilometraje_ingreso: 0,
    total_mano_obra: 0,
    pago_monto: 0,
    pago_metodo: "EFECTIVO",
    pago_notas: "Anticipo de repuestos",
  });

  const [repuestos, setRepuestos] = useState([
    { descripcion: "", cantidad: 1, costo_unitario: 0, precio_unitario: 0 },
  ]);

  // Cargar lista rápida de vehículos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarVehiculos();
    }
  }, [isOpen]);

  const cargarVehiculos = async () => {
    try {
      // Si no tenés endpoint de lista, podés consultar /caja/pendientes o clientes-vehiculos
      // Por simplicidad, probamos traer la patente que ya existe o consultar el historial
      const res = await apiFetch("/caja/pendientes");
      if (res.data?.ordenes) {
        // Obtenemos los vehículos que ya están en el sistema
        const map = new Map();
        res.data.ordenes.forEach((o) => {
          if (!map.has(o.patente)) {
            map.set(o.patente, {
              id: o.vehiculo_id || 1,
              label: `${o.patente} - ${o.marca} ${o.modelo}`,
            });
          }
        });
        setVehiculos(Array.from(map.values()));
      }
    } catch {
      // Fallback silencioso si aún no hay O.Ts
    }
  };

  if (!isOpen) return null;

  const handleAddRepuesto = () => {
    setRepuestos([
      ...repuestos,
      { descripcion: "", cantidad: 1, costo_unitario: 0, precio_unitario: 0 },
    ]);
  };

  const handleRemoveRepuesto = (index) => {
    setRepuestos(repuestos.filter((_, i) => i !== index));
  };

  const handleRepuestoChange = (index, field, value) => {
    const updated = [...repuestos];
    updated[index][field] = field === "descripcion" ? value : Number(value);
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
      setError(
        "Tenés que especificar un ID de vehículo válido que exista en el sistema",
      );
      setLoading(false);
      return;
    }

    const repuestosFiltrados = repuestos.filter(
      (r) => r.descripcion.trim() !== "",
    );

    const payload = {
      vehiculo_id: Number(formData.vehiculo_id),
      falla_declarada: formData.falla_declarada.trim(),
      diagnostico_tecnico: formData.diagnostico_tecnico.trim() || undefined,
      kilometraje_ingreso: Number(formData.kilometraje_ingreso),
      total_mano_obra: Number(formData.total_mano_obra),
      repuestos: repuestosFiltrados,
      pago_inicial:
        Number(formData.pago_monto) > 0
          ? {
              monto: Number(formData.pago_monto),
              metodo_pago: formData.pago_metodo,
              notas: formData.pago_notas,
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
      setError(err.message || "Error al crear la O.T.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 my-8 text-slate-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-1">
          Nueva Orden de Trabajo
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Ingresá los datos del servicio. Recordá que el auto debe estar
          previamente registrado en Clientes y Fichas.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-center gap-2 mb-4 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                ID del Vehículo (Ver en Clientes)
              </label>
              <input
                type="number"
                required
                placeholder="Ej: 1"
                value={formData.vehiculo_id}
                onChange={(e) =>
                  setFormData({ ...formData, vehiculo_id: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-mono"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Tip: Podés dar de alta el auto primero en la solapa "Clientes y
                Fichas".
              </span>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Kilometraje de Ingreso
              </label>
              <input
                type="number"
                required
                value={formData.kilometraje_ingreso}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    kilometraje_ingreso: e.target.value,
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Falla Reportada por el Cliente
            </label>
            <textarea
              required
              rows={2}
              value={formData.falla_declarada}
              onChange={(e) =>
                setFormData({ ...formData, falla_declarada: e.target.value })
              }
              placeholder="Ej: Service de aceite y filtros + ruidos en tren delantero"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>

          {/* Renglones de Repuestos */}
          <div className="border-t border-slate-800 pt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Repuestos e Insumos
              </span>
              <button
                type="button"
                onClick={handleAddRepuesto}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar ítem
              </button>
            </div>

            <div className="space-y-2">
              {repuestos.map((rep, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Descripción del repuesto"
                    value={rep.descripcion}
                    onChange={(e) =>
                      handleRepuestoChange(idx, "descripcion", e.target.value)
                    }
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Cant"
                    value={rep.cantidad}
                    onChange={(e) =>
                      handleRepuestoChange(idx, "cantidad", e.target.value)
                    }
                    className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center outline-none focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Precio"
                    value={rep.precio_unitario || ""}
                    onChange={(e) =>
                      handleRepuestoChange(
                        idx,
                        "precio_unitario",
                        e.target.value,
                      )
                    }
                    className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-right outline-none focus:border-blue-500 font-mono"
                  />
                  {repuestos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRepuesto(idx)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mano de Obra y Anticipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-800 pt-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mano de Obra ($)
              </label>
              <input
                type="number"
                value={formData.total_mano_obra || ""}
                onChange={(e) =>
                  setFormData({ ...formData, total_mano_obra: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Anticipo / Seña ($)
              </label>
              <input
                type="number"
                value={formData.pago_monto || ""}
                onChange={(e) =>
                  setFormData({ ...formData, pago_monto: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          {/* Totales */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-sm font-semibold">
            <span className="text-slate-400">Total Presupuestado:</span>
            <span className="text-xl text-blue-400 font-mono font-bold">
              ${totalGeneral.toLocaleString("es-AR")}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? "Creando..." : "Crear Orden de Trabajo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
