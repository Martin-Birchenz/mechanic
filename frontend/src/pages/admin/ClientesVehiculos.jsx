import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  History,
  Plus,
  AlertCircle,
  X,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";

export default function ClientesVehiculos() {
  const [searchParams] = useSearchParams();
  const patenteQuery = searchParams.get("patente");

  const [patenteInput, setPatenteInput] = useState(patenteQuery || "AF123JK");
  const [ficha, setFicha] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    const inicial = patenteQuery || "AF123JK";
    setPatenteInput(inicial.toUpperCase());
    buscarFicha(inicial);
  }, [patenteQuery]);

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

      const nuevaPatente = formData.patente.trim().toUpperCase();
      setModalOpen(false);
      setPatenteInput(nuevaPatente);
      buscarFicha(nuevaPatente);

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
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-12">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Historial Clínico por Patente
            </h2>
            <p className="text-sm text-stone-600">
              Consultá qué aceite, filtros o arreglos se le hicieron antes a
              cada vehículo.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm px-5 py-3 rounded-xl transition flex items-center gap-2 self-start sm:self-auto shadow-md"
          >
            <Plus className="w-5 h-5" />+ NUEVO CLIENTE Y AUTO
          </button>
        </div>

        {/* Buscador Grande por Patente */}
        <div className="bg-white border-2 border-stone-300 rounded-2xl p-5 mb-6 shadow-sm">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={patenteInput}
                onChange={(e) => setPatenteInput(e.target.value.toUpperCase())}
                placeholder="Escribí la patente (ej: AF123JK)..."
                maxLength={8}
                className="w-full bg-stone-100 border-2 border-stone-300 rounded-xl px-4 py-3 pl-12 text-lg font-mono font-black tracking-widest text-stone-900 uppercase focus:outline-none focus:border-amber-600"
              />
              <Search className="w-5 h-5 text-stone-500 absolute left-4 top-3.5" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-stone-900 hover:bg-stone-800 text-white font-extrabold px-7 py-3 rounded-xl transition text-sm"
            >
              {loading ? "Buscando..." : "BUSCAR PATENTE"}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-100 border-l-4 border-red-600 text-red-900 p-3.5 rounded-r-xl flex items-center gap-2 text-sm font-bold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Resultado de Ficha */}
        {ficha && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Auto */}
              <div className="md:col-span-2 bg-white border-2 border-stone-300 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-extrabold uppercase text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-lg">
                    Ficha Unidad #{ficha.vehiculo.vehiculo_id}
                  </span>
                  <span className="text-base font-mono font-black tracking-widest bg-stone-900 text-white px-3.5 py-1 rounded-lg">
                    {ficha.vehiculo.patente}
                  </span>
                </div>

                <h3 className="text-2xl font-extrabold text-stone-900 flex items-center gap-2.5">
                  <Car className="w-7 h-7 text-amber-600" />
                  {ficha.vehiculo.marca} {ficha.vehiculo.modelo}
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5">
                  <div className="bg-stone-100 p-3.5 rounded-xl border border-stone-200">
                    <span className="text-xs font-bold text-stone-500 uppercase flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Año
                    </span>
                    <span className="text-base font-extrabold text-stone-900 mt-1 block">
                      {ficha.vehiculo.anio || "-"}
                    </span>
                  </div>

                  <div className="bg-stone-100 p-3.5 rounded-xl border border-stone-200">
                    <span className="text-xs font-bold text-stone-500 uppercase flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5" /> Kilometraje
                    </span>
                    <span className="text-base font-extrabold text-emerald-700 mt-1 block font-mono">
                      {Number(ficha.vehiculo.kilometraje).toLocaleString(
                        "es-AR",
                      )}{" "}
                      km
                    </span>
                  </div>

                  <div className="bg-stone-100 p-3.5 rounded-xl border border-stone-200 col-span-2 sm:col-span-1">
                    <span className="text-xs font-bold text-stone-500 uppercase flex items-center gap-1">
                      <History className="w-3.5 h-3.5" /> Visitas
                    </span>
                    <span className="text-base font-extrabold text-stone-900 mt-1 block">
                      {ficha.historial.length} ingresos
                    </span>
                  </div>
                </div>
              </div>

              {/* Dueño */}
              <div className="bg-white border-2 border-stone-300 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs font-extrabold uppercase text-stone-500 mb-3 block">
                    Datos del Cliente
                  </span>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-stone-200 flex items-center justify-center text-stone-800">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-stone-900">
                        {ficha.vehiculo.cliente_nombre}
                      </h4>
                      <span className="text-xs font-semibold text-stone-500">
                        Cliente #{ficha.vehiculo.cliente_id}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm font-semibold text-stone-700">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-stone-500" />
                      <span>{ficha.vehiculo.cliente_telefono}</span>
                    </div>
                    {ficha.vehiculo.cliente_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-stone-500" />
                        <span className="truncate">
                          {ficha.vehiculo.cliente_email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <a
                  href={`https://wa.me/549${String(ficha.vehiculo.cliente_telefono || "").replace(/\D/g, "")}?text=Hola%20${encodeURIComponent(ficha.vehiculo.cliente_nombre)},%20te%20escribimos%20desde%20el%20taller`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  ESCRIBIR POR WHATSAPP
                </a>
              </div>
            </div>

            {/* Historial */}
            <div className="bg-white border-2 border-stone-300 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-extrabold text-stone-900 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                Trabajos y Repuestos Anteriores
              </h3>

              {ficha.historial.length === 0 ? (
                <p className="text-sm text-stone-500 py-8 text-center font-medium">
                  Este vehículo todavía no tiene trabajos anteriores
                  registrados.
                </p>
              ) : (
                <div className="space-y-4">
                  {ficha.historial.map((ot) => (
                    <div
                      key={ot.ot_id}
                      className="bg-stone-50 border-2 border-stone-200 rounded-xl p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2.5 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold bg-stone-900 text-white px-2.5 py-0.5 rounded">
                            O.T. #{ot.ot_id}
                          </span>
                          <span className="text-xs font-bold text-stone-700">
                            {new Date(ot.fecha_ingreso).toLocaleDateString(
                              "es-AR",
                            )}
                          </span>
                          <span className="text-xs font-mono font-bold text-stone-500">
                            •{" "}
                            {Number(ot.kilometraje_ingreso).toLocaleString(
                              "es-AR",
                            )}{" "}
                            km
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-stone-200 text-stone-800">
                            {ot.estado}
                          </span>
                          <span className="text-sm font-mono font-extrabold text-stone-900">
                            ${Number(ot.total_final).toLocaleString("es-AR")}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-stone-800 font-medium mb-2">
                        <strong className="text-stone-600">Trabajo: </strong>
                        {ot.falla_declarada}
                      </p>

                      {ot.repuestos && ot.repuestos.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {ot.repuestos.map((rep, idx) => (
                            <span
                              key={idx}
                              className="bg-white border border-stone-300 text-stone-800 px-2.5 py-1 rounded-lg text-xs font-bold"
                            >
                              {rep.descripcion} (x{rep.cantidad}) — $
                              {Number(rep.subtotal).toLocaleString("es-AR")}
                            </span>
                          ))}
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

      {/* Modal Nuevo Cliente + Vehículo */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-stone-300 rounded-2xl max-w-lg w-full p-6 my-8 text-stone-900 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 text-stone-500 hover:text-stone-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-stone-900 mb-1">
              Anotar Cliente y Vehículo Nuevo
            </h3>
            <p className="text-xs text-stone-600 mb-4">
              Creá la ficha del auto para abrirle órdenes de trabajo.
            </p>

            {modalError && (
              <div className="bg-red-100 border-l-4 border-red-600 text-red-900 p-3 rounded-r-xl flex items-center gap-2 mb-4 text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Nombre y Apellido del Cliente *
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
                  className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Teléfono WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 3435123456"
                    value={formData.telefono}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Email (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@gmail.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Patente *
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
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Marca *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ford"
                    value={formData.marca}
                    onChange={(e) =>
                      setFormData({ ...formData, marca: e.target.value })
                    }
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ranger"
                    value={formData.modelo}
                    onChange={(e) =>
                      setFormData({ ...formData, modelo: e.target.value })
                    }
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Año
                  </label>
                  <input
                    type="number"
                    value={formData.anio}
                    onChange={(e) =>
                      setFormData({ ...formData, anio: e.target.value })
                    }
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Kilometraje Actual
                  </label>
                  <input
                    type="number"
                    value={formData.kilometraje}
                    onChange={(e) =>
                      setFormData({ ...formData, kilometraje: e.target.value })
                    }
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 font-bold text-stone-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submitting ? "Guardando..." : "Guardar Ficha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
