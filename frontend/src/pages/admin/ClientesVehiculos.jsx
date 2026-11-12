import { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";
import AdminNavbar from "../../components/AdminNavbar";
import {
  Search,
  Car,
  User,
  Phone,
  Mail,
  Calendar,
  Gauge,
  Wrench,
  History,
  Plus,
  AlertCircle,
  X,
  CheckCircle2,
} from "lucide-react";

export default function ClientesVehiculos() {
  const [patenteInput, setPatenteInput] = useState("AF123JK");
  const [ficha, setFicha] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal para alta de cliente + vehículo
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: "",
    telefono: "",
    email: "",
    patente: "",
    marca: "",
    modelo: "",
    anio: new Date().getFullYear(),
    kilometraje: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const buscarFicha = async (patenteTarget) => {
    const pat = patenteTarget || patenteInput;
    if (!pat.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(
        `/clientes-vehiculos/patente/${pat.trim().toUpperCase()}`,
      );
      setFicha(res.data);
    } catch (err) {
      setError(err.message || "No se encontró el vehículo solicitado");
      setFicha(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Búsqueda inicial automática de la patente que dimos de alta
    buscarFicha("AF123JK");
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    buscarFicha();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      await apiFetch("/clientes-vehiculos", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          patente: formData.patente.trim().toUpperCase(),
          anio: Number(formData.anio) || undefined,
          kilometraje: Number(formData.kilometraje) || 0,
        }),
      });

      setModalOpen(false);
      setPatenteInput(formData.patente.toUpperCase());
      buscarFicha(formData.patente.toUpperCase());

      // Limpiar formulario
      setFormData({
        nombre_completo: "",
        telefono: "",
        email: "",
        patente: "",
        marca: "",
        modelo: "",
        anio: new Date().getFullYear(),
        kilometraje: 0,
      });
    } catch (err) {
      setModalError(err.message || "Error al registrar cliente y vehículo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabecera y Botón Nuevo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Ficha Clínica de Vehículos
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Historial de mantenimiento, reparaciones previas y datos de
              contacto.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Nuevo Registro
          </button>
        </div>

        {/* Buscador Universal por Patente */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 mb-8 shadow-xl">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={patenteInput}
                onChange={(e) => setPatenteInput(e.target.value.toUpperCase())}
                placeholder="Ingresá la patente (ej: AF123JK o AB123CD)..."
                maxLength={8}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 pl-11 text-base font-mono font-bold tracking-wider text-white uppercase focus:outline-none focus:border-blue-500 transition-colors"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center min-w-[120px]"
            >
              {loading ? "Buscando..." : "Buscar Ficha"}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Detalle de Ficha Clínica */}
        {ficha && (
          <div className="space-y-6">
            {/* Tarjeta de Información Principal: Auto + Dueño */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bloque Auto */}
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs uppercase tracking-wider text-blue-400 font-semibold bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md">
                      Ficha de Unidad #{ficha.vehiculo.vehiculo_id}
                    </span>
                    <div className="bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg">
                      <span className="text-xs font-mono font-extrabold tracking-widest text-white">
                        {ficha.vehiculo.patente}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Car className="w-6 h-6 text-blue-400" />
                    {ficha.vehiculo.marca} {ficha.vehiculo.modelo}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Año
                      </span>
                      <span className="text-sm font-bold text-slate-200 mt-1 block">
                        {ficha.vehiculo.anio || "No especificado"}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                        <Gauge className="w-3 h-3" /> Odómetro
                      </span>
                      <span className="text-sm font-bold text-emerald-400 mt-1 block font-mono">
                        {Number(ficha.vehiculo.kilometraje).toLocaleString(
                          "es-AR",
                        )}{" "}
                        km
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                        <History className="w-3 h-3" /> Total Visitas
                      </span>
                      <span className="text-sm font-bold text-blue-400 mt-1 block">
                        {ficha.historial.length} servicios
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque Propietario */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3 block">
                    Datos del Titular
                  </span>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white leading-tight">
                        {ficha.vehiculo.cliente_nombre}
                      </h4>
                      <span className="text-xs text-slate-500">
                        ID Cliente #{ficha.vehiculo.cliente_id}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2.5 text-xs text-slate-300">
                      <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <a
                        href={`https://wa.me/549${ficha.vehiculo.cliente_telefono}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-blue-400 transition-colors font-mono"
                      >
                        +54 9 {ficha.vehiculo.cliente_telefono}
                      </a>
                    </div>

                    {ficha.vehiculo.cliente_email && (
                      <div className="flex items-center gap-2.5 text-xs text-slate-300">
                        <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span className="truncate">
                          {ficha.vehiculo.cliente_email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 mt-6">
                  <a
                    href={`https://wa.me/549${ficha.vehiculo.cliente_telefono}?text=Hola%20${encodeURIComponent(ficha.vehiculo.cliente_nombre)},%20te%20escribimos%20desde%20el%20taller`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    Abrir Chat WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Historial Clínico de O.T. */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" /> Historial de
                Servicios Realizados
              </h3>

              {ficha.historial.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Este vehículo aún no cuenta con órdenes de trabajo cerradas o
                  registradas.
                </p>
              ) : (
                <div className="space-y-4">
                  {ficha.historial.map((ot) => (
                    <div
                      key={ot.ot_id}
                      className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                            O.T. #{ot.ot_id}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(ot.fecha_ingreso).toLocaleDateString(
                              "es-AR",
                            )}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            ·{" "}
                            {Number(ot.kilometraje_ingreso).toLocaleString(
                              "es-AR",
                            )}{" "}
                            km
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                            {ot.estado}
                          </span>
                          <span className="text-xs font-mono font-bold text-white ml-2">
                            ${Number(ot.total_final).toLocaleString("es-AR")}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 mb-3">
                        <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-0.5">
                          Diagnóstico / Falla:
                        </span>
                        {ot.falla_declarada}
                      </div>

                      {/* Repuestos colocados */}
                      {ot.repuestos && ot.repuestos.length > 0 && (
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                            Repuestos e Insumos instalados:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {ot.repuestos.map((rep, idx) => (
                              <span
                                key={idx}
                                className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded-md text-[11px] font-mono"
                              >
                                {rep.descripcion} (x{rep.cantidad}) — $
                                {Number(rep.subtotal).toLocaleString("es-AR")}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal para Crear Cliente + Vehículo */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 my-8 text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">
              Registrar Cliente y Vehículo
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Crea la ficha para habilitar la apertura de órdenes de trabajo.
            </p>

            {modalError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-center gap-2 mb-4 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Datos del Cliente */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-1">
                  1. Titular
                </span>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Marcelo Fernández"
                    value={formData.nombre_completo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nombre_completo: e.target.value,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Teléfono (WhatsApp)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 3435123456"
                      value={formData.telefono}
                      onChange={(e) =>
                        setFormData({ ...formData, telefono: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email (Opcional)
                    </label>
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Datos del Auto */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-1">
                  2. Vehículo
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Patente
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="AA123BB"
                      maxLength={8}
                      value={formData.patente}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          patente: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none font-mono font-bold uppercase"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Marca
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ford"
                      value={formData.marca}
                      onChange={(e) =>
                        setFormData({ ...formData, marca: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Modelo
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ranger"
                      value={formData.modelo}
                      onChange={(e) =>
                        setFormData({ ...formData, modelo: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Año
                    </label>
                    <input
                      type="number"
                      value={formData.anio}
                      onChange={(e) =>
                        setFormData({ ...formData, anio: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Kilometraje Inicial
                    </label>
                    <input
                      type="number"
                      value={formData.kilometraje}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          kilometraje: e.target.value,
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submitting ? "Guardando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
