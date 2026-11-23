import { useState, useEffect, useMemo } from "react";
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
  Users,
  Link2,
  Printer,
} from "lucide-react";

function limpiarKilometros(valor) {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? Math.max(0, Math.round(valor)) : 0;
  }
  if (!valor) return 0;
  const sinFormato = String(valor)
    .trim()
    .replace(/\s+/g, "")
    .replace(/[.,]/g, "");
  const num = parseInt(sinFormato, 10);
  return Number.isNaN(num) ? 0 : Math.max(0, num);
}

function mensajeClaro(err, fallback) {
  const msg = String(err?.message || "");
  if (msg.includes("expected int") || msg.includes("Invalid input")) {
    return "Revisá los números ingresados (kilometraje, año o montos) y completá los campos obligatorios.";
  }
  return msg || fallback;
}

export default function ClientesVehiculos() {
  const [searchParams] = useSearchParams();
  const patenteQuery = searchParams.get("patente");

  const [listaVehiculos, setListaVehiculos] = useState([]);
  const [loadingLista, setLoadingLista] = useState(true);
  const [patenteInput, setPatenteInput] = useState(patenteQuery || "");
  const [ficha, setFicha] = useState(null);
  const [loadingFicha, setLoadingFicha] = useState(false);
  const [error, setError] = useState(null);
  const [copiadoOk, setCopiadoOk] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: "",
    telefono: "",
    email: "",
    patente: "",
    marca: "",
    modelo: "",
    anio: new Date().getFullYear(),
    kilometraje: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const cargarTodosLosVehiculos = async () => {
    try {
      setLoadingLista(true);
      const res = await apiFetch("/gestion/vehiculos-lista");
      setListaVehiculos(res.data || []);
    } catch {
      setListaVehiculos([]);
    } finally {
      setLoadingLista(false);
    }
  };

  const buscarFicha = async (patenteTarget) => {
    const pat = String(patenteTarget || patenteInput)
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
    if (!pat) return;

    try {
      setLoadingFicha(true);
      setError(null);
      setCopiadoOk(false);
      const res = await apiFetch(`/clientes-vehiculos/patente/${pat}`);
      setFicha(res.data);
      setPatenteInput(pat);
    } catch (err) {
      setError(mensajeClaro(err, "No se encontró el vehículo solicitado."));
      setFicha(null);
    } finally {
      setLoadingFicha(false);
    }
  };

  useEffect(() => {
    cargarTodosLosVehiculos();
    if (patenteQuery) {
      buscarFicha(patenteQuery);
    }
  }, [patenteQuery]);

  const vehiculosFiltrados = useMemo(() => {
    const q = patenteInput.trim().toLowerCase();
    if (!q) return listaVehiculos;
    return listaVehiculos.filter(
      (v) =>
        v.patente?.toLowerCase().includes(q) ||
        v.cliente_nombre?.toLowerCase().includes(q) ||
        v.marca?.toLowerCase().includes(q) ||
        v.modelo?.toLowerCase().includes(q),
    );
  }, [listaVehiculos, patenteInput]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (patenteInput.trim()) {
      buscarFicha(patenteInput);
    }
  };

  const handleCopiarLinkHistorial = async () => {
    if (!ficha?.vehiculo?.patente) return;
    try {
      const res = await apiFetch("/gestion/mi-taller");
      const slugTaller = res.data?.slug || "taller";
      const link = `${window.location.origin}/p/${slugTaller}/historial/${ficha.vehiculo.patente}`;
      await navigator.clipboard.writeText(link);
      setCopiadoOk(true);
      setTimeout(() => setCopiadoOk(false), 3000);
    } catch {
      setError("No se pudo copiar el enlace al portapapeles.");
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      const nuevaPatente = formData.patente
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");

      await apiFetch("/clientes-vehiculos", {
        method: "POST",
        body: JSON.stringify({
          nombre_completo: formData.nombre_completo.trim(),
          telefono: formData.telefono.trim(),
          email: formData.email.trim() || undefined,
          patente: nuevaPatente,
          marca: formData.marca.trim(),
          modelo: formData.modelo.trim(),
          anio: limpiarKilometros(formData.anio) || undefined,
          kilometraje: limpiarKilometros(formData.kilometraje),
        }),
      });

      setModalOpen(false);
      await cargarTodosLosVehiculos();
      buscarFicha(nuevaPatente);

      setFormData({
        nombre_completo: "",
        telefono: "",
        email: "",
        patente: "",
        marca: "",
        modelo: "",
        anio: new Date().getFullYear(),
        kilometraje: "",
      });
    } catch (err) {
      setModalError(
        mensajeClaro(
          err,
          "Revisá los datos ingresados para registrar el vehículo.",
        ),
      );
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
              Clientes y Fichas de Vehículos
            </h2>
            <p className="text-sm text-stone-600">
              Seleccioná un vehículo de la lista o buscá por patente para ver su
              historial completo.
            </p>
          </div>

          <button
            onClick={() => {
              setModalError(null);
              setModalOpen(true);
            }}
            className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm px-5 py-3 rounded-xl transition flex items-center gap-2 self-start sm:self-auto shadow-md cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Ingresar Auto
          </button>
        </div>

        {/* Buscador */}
        <div className="bg-white border-2 border-stone-300 rounded-2xl p-5 mb-6 shadow-sm">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={patenteInput}
                onChange={(e) => {
                  setPatenteInput(e.target.value.toUpperCase());
                  if (!e.target.value.trim()) {
                    setFicha(null);
                    setError(null);
                  }
                }}
                placeholder="Filtrar por cliente o escribí la patente (ej: AA123BB)..."
                className="w-full bg-stone-100 border-2 border-stone-300 rounded-xl px-4 py-3 pl-12 text-base font-bold text-stone-900 focus:outline-none focus:border-amber-600"
              />
              <Search className="w-5 h-5 text-stone-500 absolute left-4 top-3.5" />
            </div>
            <button
              type="submit"
              disabled={loadingFicha}
              className="bg-stone-900 hover:bg-stone-800 text-white font-extrabold px-7 py-3 rounded-xl transition text-sm cursor-pointer"
            >
              {loadingFicha ? "Buscando..." : "ABRIR FICHA"}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-100 border-l-4 border-red-600 text-red-900 p-3.5 rounded-r-xl flex items-center gap-2 text-sm font-bold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {copiadoOk && (
            <div className="mt-4 bg-emerald-100 border-l-4 border-emerald-600 text-emerald-900 p-3.5 rounded-r-xl flex items-center gap-2 text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Enlace público del historial copiado al portapapeles.</span>
            </div>
          )}
        </div>

        {/* Lista de todos los clientes y vehículos */}
        <div className="bg-white border-2 border-stone-300 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              Todos los Clientes y Vehículos ({vehiculosFiltrados.length})
            </h3>
            {ficha && (
              <button
                onClick={() => {
                  setFicha(null);
                  setPatenteInput("");
                  setError(null);
                }}
                className="text-xs font-extrabold text-amber-700 hover:underline cursor-pointer"
              >
                Limpiar selección
              </button>
            )}
          </div>

          {loadingLista ? (
            <p className="text-sm text-stone-500 py-4">Cargando clientes...</p>
          ) : vehiculosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-stone-500 text-sm">
              Todavía no hay clientes cargados en este taller. Tocá{" "}
              <strong className="text-stone-900">"Ingresar Auto"</strong> para
              registrar el primero.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {vehiculosFiltrados.map((v) => {
                const seleccionado = ficha?.vehiculo?.patente === v.patente;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => buscarFicha(v.patente)}
                    className={`text-left p-4 rounded-xl border-2 transition flex items-center justify-between gap-3 cursor-pointer ${
                      seleccionado
                        ? "bg-amber-50 border-amber-500 shadow-sm"
                        : "bg-stone-50 border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-black text-xs bg-stone-900 text-white px-2.5 py-0.5 rounded">
                          {v.patente}
                        </span>
                        <span className="text-xs font-extrabold text-stone-900 truncate">
                          {v.marca} {v.modelo}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-stone-600 truncate">
                        {v.cliente_nombre} · {v.telefono}
                      </p>
                    </div>
                    <span className="text-[11px] font-extrabold text-amber-700 shrink-0">
                      Ver ficha →
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Ficha del vehículo seleccionado */}
        {ficha && ficha.vehiculo && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                      {Number(ficha.vehiculo.kilometraje || 0).toLocaleString(
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
                      {(ficha.historial || []).length} ingresos
                    </span>
                  </div>
                </div>

                {/* Acciones de historial en la ficha existente */}
                <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir / PDF Historial
                  </button>
                  <button
                    type="button"
                    onClick={handleCopiarLinkHistorial}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Link2 className="w-4 h-4" />
                    Copiar Link Público de Historial
                  </button>
                </div>
              </div>

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

              {(ficha.historial || []).length === 0 ? (
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
                            {Number(ot.kilometraje_ingreso || 0).toLocaleString(
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
                            $
                            {Number(ot.total_final || 0).toLocaleString(
                              "es-AR",
                            )}
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
                              {Number(rep.subtotal || 0).toLocaleString(
                                "es-AR",
                              )}
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
              className="absolute right-4 top-4 text-stone-500 hover:text-stone-900 cursor-pointer"
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
                  placeholder="Ej: Matías Pereyra"
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
                    placeholder="Ej: 3435482910"
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
                    placeholder="AB318CD"
                    maxLength={10}
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
                    placeholder="Volkswagen"
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
                    placeholder="Gol Trend"
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
                    type="text"
                    placeholder="2017"
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
                    type="text"
                    placeholder="Ej: 96.400 o 96,400"
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
                  className="px-4 py-2 rounded-xl border border-stone-300 font-bold text-stone-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
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
