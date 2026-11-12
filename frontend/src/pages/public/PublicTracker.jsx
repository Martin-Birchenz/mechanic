import { useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../api/client";
import {
  Search,
  Car,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  MessageSquare,
  Sparkles,
} from "lucide-react";

const ESTADOS = [
  { key: "INGRESADO", label: "Ingresado" },
  { key: "EN_DIAGNOSTICO", label: "En Diagnóstico" },
  { key: "ESPERANDO_REPUESTO", label: "Repuestos" },
  { key: "EN_REPARACION", label: "En Reparación" },
  { key: "LISTO", label: "Listo para Retirar" },
];

export default function PublicTracker() {
  const { slug } = useParams();
  const [patente, setPatente] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Estado del simulador de WhatsApp Bot
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      from: "bot",
      text: "¡Hola! Soy el asistente virtual del taller. Si querés saber el estado de tu auto, escribí acá tu patente (ej: AF123JK).",
    },
  ]);
  const [botLoading, setBotLoading] = useState(false);

  const handleBuscar = async (e) => {
    e.preventDefault();
    if (!patente.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await apiFetch(
        `/public/${slug}/patente/${patente.trim().toUpperCase()}`,
      );
      setData(res.data);
    } catch (err) {
      setError(err.message || "No se encontró el vehículo en el taller.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || botLoading) return;

    const userText = chatMessage;
    setChatMessage("");
    setChatHistory((prev) => [...prev, { from: "user", text: userText }]);
    setBotLoading(true);

    try {
      const res = await apiFetch(`/public/${slug}/whatsapp-webhook`, {
        method: "POST",
        body: JSON.stringify({
          telefono: "3435987654",
          mensaje: userText,
        }),
      });

      setChatHistory((prev) => [
        ...prev,
        { from: "bot", text: res.data.reply },
      ]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Hubo un inconveniente al consultar el estado. Verificá la patente e intentá nuevamente.",
        },
      ]);
    } finally {
      setBotLoading(false);
    }
  };

  const getStepIndex = (estado) => {
    if (estado === "ENTREGADO") return 5;
    return ESTADOS.findIndex((e) => e.key === estado);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* 1. Header Institucional del Taller */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-wide block leading-tight">
                Taller Mecánico Central
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500" /> Nogoyá, Entre Ríos
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" /> Lun a Vie 08:00 -
              18:00
            </span>
            <a
              href="https://wa.me/5493435123456"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-emerald-400 font-medium hover:text-emerald-300 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> +54 9 3435 123456
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero Section & Presentación */}
      <section className="relative overflow-hidden py-12 md:py-16 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/40 to-slate-950">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Portal Oficial del Cliente
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            Servicio Mecánico Profesional con{" "}
            <span className="text-blue-500">Seguimiento en Vivo</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mb-8">
            Ingresá tu patente a continuación para conocer el diagnóstico
            técnico, avance de reparaciones y saldo pendiente de tu vehículo en
            tiempo real.
          </p>

          {/* Buscador de Patente */}
          <form onSubmit={handleBuscar} className="max-w-lg mx-auto flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={patente}
                onChange={(e) => setPatente(e.target.value.toUpperCase())}
                placeholder="Ingresá la patente (ej: AF123JK)"
                maxLength={8}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 pl-11 text-base font-mono font-bold tracking-wider uppercase text-white focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-4" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors flex items-center justify-center min-w-[130px] shadow-lg shadow-blue-600/20 text-sm"
            >
              {loading ? "Buscando..." : "Consultar"}
            </button>
          </form>

          {error && (
            <div className="max-w-lg mx-auto mt-4 bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl flex items-center gap-2.5 text-xs text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </section>

      {/* 3. Resultado del Seguimiento (si se consultó una patente) */}
      <main className="max-w-3xl mx-auto px-4 py-10 w-full flex-1">
        {data ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            {/* Cabecera del auto */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-6">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">
                  Vehículo registrado
                </span>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-400" />
                  {data.vehiculo.marca} {data.vehiculo.modelo}
                </h2>
              </div>
              <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-center">
                <span className="text-[10px] text-slate-500 block leading-tight font-sans">
                  ARGENTINA
                </span>
                <span className="font-mono font-bold tracking-widest text-sm text-slate-200">
                  {data.vehiculo.patente}
                </span>
              </div>
            </div>

            {/* Tracker de Estados */}
            <div className="mb-8">
              <span className="text-xs text-slate-400 block mb-3">
                Progreso de la Orden #{data.orden.id}
              </span>
              <div className="grid grid-cols-5 gap-1">
                {ESTADOS.map((est, idx) => {
                  const currentIdx = getStepIndex(data.orden.estado);
                  const isComplete = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div
                      key={est.key}
                      className="flex flex-col items-center text-center"
                    >
                      <div
                        className={`w-full h-1.5 rounded-full mb-2 transition-all ${
                          isComplete ? "bg-blue-500" : "bg-slate-800"
                        }`}
                      />
                      <span
                        className={`text-[10px] sm:text-xs font-medium leading-tight ${
                          isCurrent
                            ? "text-blue-400 font-bold"
                            : isComplete
                              ? "text-slate-300"
                              : "text-slate-500"
                        }`}
                      >
                        {est.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detalle y Precios */}
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <span className="text-xs text-slate-400 block mb-1">
                  Motivo de Ingreso
                </span>
                <p className="text-sm text-slate-200">
                  {data.orden.falla_declarada}
                </p>
              </div>

              {data.orden.trabajos?.length > 0 && (
                <div>
                  <span className="text-xs text-slate-400 block mb-2">
                    Detalle de Trabajos y Repuestos
                  </span>
                  <ul className="divide-y divide-slate-800/80 bg-slate-950 rounded-xl px-4 border border-slate-800/80">
                    {data.orden.trabajos.map((item, i) => (
                      <li
                        key={i}
                        className="py-2.5 flex justify-between text-xs sm:text-sm"
                      >
                        <span className="text-slate-300">
                          {item.descripcion} (x{item.cantidad})
                        </span>
                        <span className="font-mono text-slate-200">
                          ${Number(item.subtotal).toLocaleString("es-AR")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">
                    Total del Trabajo
                  </span>
                  <span className="text-lg font-bold font-mono text-white">
                    ${data.orden.total.toLocaleString("es-AR")}
                  </span>
                </div>
                <div
                  className={`p-3.5 rounded-xl border ${
                    data.orden.saldo_pendiente > 0
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  }`}
                >
                  <span className="text-xs block opacity-80">
                    Saldo Pendiente
                  </span>
                  <span className="text-lg font-bold font-mono">
                    ${data.orden.saldo_pendiente.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Cuadrícula de Servicios del Taller si aún no buscó */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl">
              <Wrench className="w-6 h-6 text-blue-400 mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">
                Mecánica General
              </h3>
              <p className="text-xs text-slate-400">
                Distribución, frenos, embragues y suspensión con repuestos de
                primera línea.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-blue-400 mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">
                Diagnóstico Computarizado
              </h3>
              <p className="text-xs text-slate-400">
                Escaneo de inyección electrónica, sensores y reseteo de service
                oficial.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl">
              <Clock className="w-6 h-6 text-blue-400 mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">
                Avisos por WhatsApp
              </h3>
              <p className="text-xs text-slate-400">
                Te notificamos directamente a tu celular en cuanto el auto esté
                listo para retirar.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/30 py-6 text-center text-xs text-slate-500">
        Plataforma provista por{" "}
        <span className="text-slate-400 font-semibold">TallerFlow</span> ·
        Sistema de Gestión Inteligente
      </footer>

      {/* 5. Widget / Chatbot Flotante de WhatsApp */}
      <div className="fixed bottom-6 right-6 z-50">
        {chatOpen ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-80 sm:w-96 flex flex-col overflow-hidden mb-2">
            <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm leading-tight">
                  Asistente Virtual del Taller
                </h4>
                <span className="text-[10px] text-emerald-100 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />{" "}
                  En línea las 24 hs
                </span>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-white/80 hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 h-64 overflow-y-auto space-y-3 bg-slate-950 text-xs">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                    msg.from === "bot"
                      ? "bg-slate-800 text-slate-200 self-start mr-auto"
                      : "bg-emerald-600 text-white self-end ml-auto"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {botLoading && (
                <div className="bg-slate-800 text-slate-400 p-2 rounded-xl text-xs w-24">
                  Consultando...
                </div>
              )}
            </div>

            <form
              onSubmit={handleSendChat}
              className="p-2 border-t border-slate-800 bg-slate-900 flex gap-2"
            >
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Escribí tu patente..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={botLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-semibold"
              >
                Enviar
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setChatOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold p-3.5 rounded-full shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-transform hover:scale-105"
            title="Consultar por WhatsApp"
          >
            <MessageSquare className="w-6 h-6 fill-current" />
            <span className="text-xs font-bold hidden sm:inline text-slate-950 pr-1">
              Consultar Estado
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
