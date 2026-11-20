import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../api/client";
import {
  Wrench,
  Search,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Car,
  ShieldCheck,
  MessageCircle,
  ExternalLink,
  AlertCircle,
  Sparkles,
  FileText,
  HelpCircle,
} from "lucide-react";

const ESTADOS_ORDEN = [
  { key: "INGRESADO", label: "Recibido" },
  { key: "EN_DIAGNOSTICO", label: "Diagnóstico" },
  { key: "ESPERANDO_REPUESTOS", label: "Repuestos" },
  { key: "EN_REPARACION", label: "En Taller" },
  { key: "LISTO", label: "Listo" },
];

export default function PublicTracker() {
  const { slug } = useParams();
  const [taller, setTaller] = useState(null);
  const [loadingTaller, setLoadingTaller] = useState(true);
  const [errorTaller, setErrorTaller] = useState(null);

  const [patente, setPatente] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [orden, setOrden] = useState(null);
  const [errorBusqueda, setErrorBusqueda] = useState(null);

  useEffect(() => {
    const cargarTaller = async () => {
      setLoadingTaller(true);
      setErrorTaller(null);
      try {
        const res = await apiFetch(`/public/${slug}`);
        setTaller(res.data);
      } catch (err) {
        setErrorTaller(
          err.message || "Este taller no existe o no tiene el portal activo.",
        );
      } finally {
        setLoadingTaller(false);
      }
    };
    if (slug) cargarTaller();
  }, [slug]);

  const handleBuscarPatente = async (e) => {
    e.preventDefault();
    const cleanPatente = patente.trim().toUpperCase().replace(/\s+/g, "");
    if (!cleanPatente) return;

    setBuscando(true);
    setErrorBusqueda(null);
    setOrden(null);

    try {
      const res = await apiFetch(`/public/${slug}/patente/${cleanPatente}`);
      setOrden(res.data);
    } catch (err) {
      setErrorBusqueda(
        err.message ||
          "No encontramos una orden activa o reciente para esa patente en este taller.",
      );
    } finally {
      setBuscando(false);
    }
  };

  const formatTelefonoWa = (tel) => {
    if (!tel) return null;
    const digits = tel.replace(/\D/g, "");
    if (!digits) return null;
    return digits.startsWith("54") ? digits : `549${digits}`;
  };

  if (loadingTaller) {
    return (
      <div
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        className="min-h-screen bg-slate-50 flex items-center justify-center p-6"
      >
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto animate-pulse">
            <Wrench className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-600">
            Cargando portal del taller...
          </p>
        </div>
      </div>
    );
  }

  if (errorTaller || !taller) {
    return (
      <div
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        className="min-h-screen bg-slate-50 flex items-center justify-center p-6"
      >
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">
            Portal no disponible
          </h1>
          <p className="text-sm text-slate-600">{errorTaller}</p>
        </div>
      </div>
    );
  }

  const waNumber = formatTelefonoWa(taller.telefono);
  const waTurnoUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(
        `Hola ${taller.nombre}, quisiera consultar por un turno para mi vehículo.`,
      )}`
    : null;

  const mapsUrl = taller.direccion
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        taller.direccion,
      )}`
    : null;

  const serviciosLista = taller.descripcion_servicios
    ? taller.descripcion_servicios
        .split(/\n|,|•|-/)
        .map((s) => s.trim())
        .filter((s) => s.length > 2)
    : [
        "Service completo de aceite y filtros",
        "Diagnóstico computarizado y escaneo",
        "Frenos, tren delantero y suspensión",
        "Distribución, embrague y mecánica general",
      ];

  const estadoIndex = orden
    ? ESTADOS_ORDEN.findIndex((e) => e.key === orden.estado)
    : -1;

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen bg-slate-50 text-slate-800 flex flex-col"
    >
      {/* Top Bar Institucional */}
      <header className="bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {taller.logo_url ? (
              <img
                src={taller.logo_url}
                alt={taller.nombre}
                className="w-11 h-11 rounded-xl object-cover border border-slate-700 bg-white"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-sm">
                <Wrench className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight">
                {taller.nombre}
              </h1>
              <span className="text-xs text-slate-400 font-medium">
                Portal Oficial de Atención y Seguimiento
              </span>
            </div>
          </div>

          {waTurnoUrl && (
            <a
              href={waTurnoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Pedir Turno por WhatsApp
            </a>
          )}
        </div>
      </header>

      {/* Hero + Buscador de Patente */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white pt-10 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Seguimiento en Tiempo Real
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight mb-3">
            Consultá el estado de tu vehículo al instante
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
            Ingresá la patente de tu auto para ver en qué etapa se encuentra el
            trabajo, el detalle de repuestos y el presupuesto actualizado.
          </p>

          {/* Caja de búsqueda */}
          <form
            onSubmit={handleBuscarPatente}
            className="max-w-xl mx-auto bg-white p-2 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1 flex items-center">
              <Car className="w-5 h-5 text-slate-400 ml-3.5 flex-shrink-0" />
              <input
                type="text"
                value={patente}
                onChange={(e) => setPatente(e.target.value.toUpperCase())}
                placeholder="INGRESÁ TU PATENTE (EJ: AA123BB)"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                className="w-full px-3 py-3 text-base sm:text-lg font-extrabold tracking-widest text-slate-900 placeholder:text-slate-400 placeholder:font-sans placeholder:text-xs placeholder:tracking-normal outline-none uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={buscando}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-extrabold text-sm px-6 py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              {buscando ? "Buscando..." : "Consultar Estado"}
            </button>
          </form>

          {errorBusqueda && (
            <div className="max-w-xl mx-auto mt-4 bg-red-500/15 border border-red-400/40 text-red-200 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-300" />
              <span>{errorBusqueda}</span>
            </div>
          )}
        </div>
      </section>

      {/* Resultado de la Orden Encontrada */}
      {orden && (
        <section className="max-w-3xl mx-auto w-full px-4 sm:px-6 -mt-8 mb-10">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
            {/* Cabecera de la ficha */}
            <div className="bg-slate-900 text-white px-6 py-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <span
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    className="bg-amber-500 text-slate-950 font-extrabold text-sm px-3 py-1 rounded-lg tracking-wider"
                  >
                    {orden.patente}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    Orden #{orden.orden_id}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  {orden.marca} {orden.modelo}
                </h3>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-bold">
                  Estado Actual
                </span>
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold text-xs px-3 py-1.5 rounded-lg mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {orden.estado?.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Línea de progreso visual */}
              {orden.estado !== "ENTREGADO" && estadoIndex >= 0 && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                    Progreso de la reparación
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {ESTADOS_ORDEN.map((step, idx) => {
                      const completado = idx <= estadoIndex;
                      return (
                        <div key={step.key} className="space-y-1.5">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              completado ? "bg-amber-500" : "bg-slate-200"
                            }`}
                          />
                          <span
                            className={`block text-[10px] sm:text-xs font-bold text-center ${
                              completado ? "text-slate-900" : "text-slate-400"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Trabajo / Falla */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  Trabajo Solicitado
                </span>
                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                  {orden.falla_declarada}
                </p>
              </div>

              {/* Repuestos e insumos si existen */}
              {Array.isArray(orden.trabajos_realizados) &&
                orden.trabajos_realizados.length > 0 && (
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                      Detalle de Repuestos e Insumos
                    </span>
                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                      {orden.trabajos_realizados.map((item, i) => (
                        <div
                          key={i}
                          className="px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm"
                        >
                          <span className="font-medium text-slate-700">
                            {item.cantidad}x {item.descripcion}
                          </span>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                            className="font-bold text-slate-900"
                          >
                            $
                            {Number(item.subtotal || 0).toLocaleString("es-AR")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Resumen Económico */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <span className="text-[11px] font-bold uppercase text-slate-500 block">
                    Total Presupuestado
                  </span>
                  <span
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    className="text-lg font-extrabold text-slate-900"
                  >
                    ${Number(orden.total_final || 0).toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                  <span className="text-[11px] font-bold uppercase text-emerald-700 block">
                    Seña / Abonado
                  </span>
                  <span
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    className="text-lg font-extrabold text-emerald-800"
                  >
                    ${Number(orden.total_pagado || 0).toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                  <span className="text-[11px] font-bold uppercase text-amber-800 block">
                    Saldo Pendiente
                  </span>
                  <span
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    className="text-lg font-extrabold text-amber-950"
                  >
                    $
                    {Number(orden.saldo_pendiente || 0).toLocaleString("es-AR")}
                  </span>
                </div>
              </div>

              {/* Botón de consulta directa sobre esta orden */}
              {waNumber && (
                <div className="pt-2 flex justify-end">
                  <a
                    href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                      `Hola ${taller.nombre}, te consulto por mi ${orden.marca} ${orden.modelo} (Patente ${orden.patente} - Orden #${orden.orden_id}).`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    Consultar sobre esta orden por WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Información del Taller, Servicios y Preguntas Frecuentes */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 space-y-10 flex-1">
        {/* Tarjetas de Ubicación, Horarios y Contacto */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-1">
              Dónde Estamos
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              {taller.direccion || "Consultanos nuestra dirección por WhatsApp"}
            </p>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
              >
                Abrir en Google Maps <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-1">
              Horarios de Atención
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {taller.horarios ||
                "Lunes a Viernes de 8:00 a 12:30 y 15:30 a 19:30 hs."}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-1">
              Turnos y Presupuestos
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              {taller.telefono || "Atención directa con el taller"}
            </p>
            {waTurnoUrl && (
              <a
                href={waTurnoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                Escribir por WhatsApp <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Especialidades del Taller + Preguntas Frecuentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-extrabold text-slate-900">
                Servicios y Especialidades
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {serviciosLista.map((srv, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl p-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm font-semibold text-slate-700">
                    {srv}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <HelpCircle className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-extrabold text-slate-900">
                Preguntas Frecuentes
              </h3>
            </div>
            <div className="space-y-3.5 text-sm">
              <div>
                <h4 className="font-bold text-slate-900">
                  ¿Cómo sé cuándo está listo mi vehículo?
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Podés consultar tu patente en esta misma página las 24 hs o
                  recibir nuestro aviso directo por WhatsApp apenas finalice el
                  trabajo.
                </p>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-bold text-slate-900">
                  ¿Se realizan presupuestos previos?
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Sí, revisamos la falla, detallamos mano de obra y repuestos en
                  tu orden digital y avanzamos con tu confirmación.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-6 px-4 text-center text-xs border-t border-slate-800">
        <p className="font-semibold text-slate-300">
          {taller.nombre} · Todos los derechos reservados
        </p>
        <p className="mt-1 text-slate-500">
          Gestión y seguimiento digital impulsado por{" "}
          <span className="text-amber-500 font-bold">GestorCar</span>
        </p>
      </footer>
    </div>
  );
}
