import { useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../api/client";
import {
  Search,
  Car,
  Wrench,
  AlertCircle,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";

const ESTADOS = [
  { key: "INGRESADO", label: "Ingresado" },
  { key: "EN_DIAGNOSTICO", label: "Diagnóstico" },
  { key: "ESPERANDO_REPUESTO", label: "Repuestos" },
  { key: "EN_REPARACION", label: "En Taller" },
  { key: "LISTO", label: "Listo" },
];

export default function PublicTracker() {
  const { slug } = useParams();
  const [patente, setPatente] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Asistente virtual
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      from: "bot",
      text: "¡Hola! Escribí tu patente (ej: AF123JK) y te digo cómo viene tu vehículo.",
    },
  ]);
  const [botLoading, setBotLoading] = useState(false);

  const nombreTaller =
    data?.taller?.nombre ||
    (slug ? slug.replace(/-/g, " ").toUpperCase() : "Taller Mecánico");

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
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          from: "bot",
          text: "No pude consultar esa patente ahora. Verificá que esté bien escrita e intentá de nuevo.",
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
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col justify-between">
      {/* 1. Header del Taller */}
      <header className="bg-stone-900 text-white border-b-4 border-amber-500 sticky top-0 z-40 shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-stone-950">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold text-white tracking-tight block leading-tight">
                {nombreTaller}
              </span>
              <span className="text-xs text-stone-300 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" />
                {data?.taller?.direccion || "Seguimiento de Vehículos"}
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-5 text-xs font-semibold text-stone-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {data?.taller?.horarios || "Lun a Vie 8:00 a 18:00"}
            </span>
            {data?.taller?.telefono && (
              <a
                href={`https://wa.me/549${String(data.taller.telefono).replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold"
              >
                <Phone className="w-3.5 h-3.5" /> {data.taller.telefono}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* 2. Buscador Central */}
      <section className="bg-white border-b-2 border-stone-200 py-10 md:py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="inline-block text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 mb-3">
            Consulta en Tiempo Real
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight mb-3">
            ¿Cómo viene tu vehículo?
          </h1>
          <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto mb-7 font-medium">
            Escribí tu patente para ver el estado del trabajo, los repuestos
            colocados y el importe.
          </p>

          <form onSubmit={handleBuscar} className="max-w-md mx-auto flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={patente}
                onChange={(e) => setPatente(e.target.value.toUpperCase())}
                placeholder="Ej: AF123JK"
                maxLength={8}
                className="w-full bg-stone-100 border-2 border-stone-400 rounded-xl px-4 py-3.5 pl-11 text-lg font-mono font-black tracking-widest uppercase text-stone-900 focus:outline-none focus:border-amber-600"
              />
              <Search className="w-5 h-5 text-stone-500 absolute left-3.5 top-4" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-500 disabled:bg-stone-400 text-white font-extrabold px-6 py-3.5 rounded-xl transition text-sm shadow"
            >
              {loading ? "Buscando..." : "CONSULTAR"}
            </button>
          </form>

          {error && (
            <div className="max-w-md mx-auto mt-4 bg-red-100 border-l-4 border-red-600 text-red-900 p-3.5 rounded-r-xl flex items-center gap-2.5 text-xs font-bold text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </section>

      {/* 3. Resultado o Servicios */}
      <main className="max-w-3xl mx-auto px-4 py-8 w-full flex-1">
        {data ? (
          <div className="bg-white border-2 border-stone-300 rounded-2xl p-6 shadow-md">
            <div className="flex justify-between items-center border-b-2 border-stone-200 pb-4 mb-6">
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase block">
                  Vehículo en Taller
                </span>
                <h2 className="text-xl font-black text-stone-900 flex items-center gap-2 mt-0.5">
                  <Car className="w-6 h-6 text-amber-600" />
                  {data.vehiculo.marca} {data.vehiculo.modelo}
                </h2>
              </div>
              <div className="bg-stone-900 text-white px-3.5 py-1.5 rounded-xl text-center border-2 border-stone-700">
                <span className="text-[9px] text-stone-400 block font-bold tracking-widest">
                  PATENTE
                </span>
                <span className="font-mono font-black tracking-widest text-base">
                  {data.vehiculo.patente}
                </span>
              </div>
            </div>

            {/* Barra de Progreso */}
            <div className="mb-7">
              <span className="text-xs font-extrabold text-stone-600 uppercase block mb-3">
                Avance del Trabajo (Orden #{data.orden.id})
              </span>
              <div className="grid grid-cols-5 gap-1.5">
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
                        className={`w-full h-2.5 rounded-full mb-2 ${
                          isComplete ? "bg-amber-500" : "bg-stone-200"
                        }`}
                      />
                      <span
                        className={`text-[11px] leading-tight ${
                          isCurrent
                            ? "text-amber-800 font-black"
                            : isComplete
                              ? "text-stone-800 font-bold"
                              : "text-stone-400 font-semibold"
                        }`}
                      >
                        {est.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detalle */}
            <div className="space-y-4">
              <div className="bg-stone-100 p-4 rounded-xl border border-stone-200">
                <span className="text-xs font-extrabold text-stone-500 uppercase block mb-1">
                  Trabajo Solicitado
                </span>
                <p className="text-sm font-semibold text-stone-900">
                  {data.orden.falla_declarada}
                </p>
              </div>

              {data.orden.trabajos?.length > 0 && (
                <div>
                  <span className="text-xs font-extrabold text-stone-500 uppercase block mb-2">
                    Repuestos y Mano de Obra
                  </span>
                  <ul className="divide-y divide-stone-200 bg-stone-50 rounded-xl px-4 border border-stone-200">
                    {data.orden.trabajos.map((item, i) => (
                      <li
                        key={i}
                        className="py-2.5 flex justify-between text-sm font-semibold"
                      >
                        <span className="text-stone-800">
                          {item.descripcion} (x{item.cantidad})
                        </span>
                        <span className="font-mono font-bold text-stone-900">
                          ${Number(item.subtotal).toLocaleString("es-AR")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-stone-100 p-4 rounded-xl border border-stone-300">
                  <span className="text-xs font-bold text-stone-600 block">
                    Total del Trabajo
                  </span>
                  <span className="text-xl font-black font-mono text-stone-900">
                    ${Number(data.orden.total).toLocaleString("es-AR")}
                  </span>
                </div>
                <div
                  className={`p-4 rounded-xl border-2 ${
                    data.orden.saldo_pendiente > 0
                      ? "bg-amber-50 border-amber-400 text-amber-900"
                      : "bg-emerald-50 border-emerald-400 text-emerald-900"
                  }`}
                >
                  <span className="text-xs font-bold block">
                    Saldo Pendiente
                  </span>
                  <span className="text-xl font-black font-mono">
                    $
                    {Number(data.orden.saldo_pendiente).toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border-2 border-stone-200 p-5 rounded-2xl shadow-sm">
              <Wrench className="w-7 h-7 text-amber-600 mb-3" />
              <h3 className="text-base font-extrabold text-stone-900 mb-1">
                Mecánica Integral
              </h3>
              <p className="text-xs text-stone-600 font-medium leading-relaxed">
                Distribución, frenos, embragues, tren delantero y mantenimiento
                preventivo.
              </p>
            </div>
            <div className="bg-white border-2 border-stone-200 p-5 rounded-2xl shadow-sm">
              <ShieldCheck className="w-7 h-7 text-amber-600 mb-3" />
              <h3 className="text-base font-extrabold text-stone-900 mb-1">
                Diagnóstico y Escaneo
              </h3>
              <p className="text-xs text-stone-600 font-medium leading-relaxed">
                Lectura de fallas electrónicas, inyección y control de sensores.
              </p>
            </div>
            <div className="bg-white border-2 border-stone-200 p-5 rounded-2xl shadow-sm">
              <Clock className="w-7 h-7 text-amber-600 mb-3" />
              <h3 className="text-base font-extrabold text-stone-900 mb-1">
                Aviso por WhatsApp
              </h3>
              <p className="text-xs text-stone-600 font-medium leading-relaxed">
                Te avisamos directo a tu celular apenas el vehículo esté listo
                para retirar.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-stone-300 bg-white py-5 text-center text-xs font-semibold text-stone-500">
        Sistema de seguimiento provisto por{" "}
        <span className="text-stone-900 font-extrabold">GestorCar</span>
      </footer>

      {/* 5. Asistente Virtual Flotante */}
      <div className="fixed bottom-5 right-5 z-50">
        {chatOpen ? (
          <div className="bg-white border-2 border-stone-300 rounded-2xl shadow-2xl w-80 sm:w-96 flex flex-col overflow-hidden mb-2">
            <div className="bg-emerald-700 p-3.5 text-white flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-sm leading-tight">
                  Consulta Rápida por Patente
                </h4>
                <span className="text-[11px] text-emerald-100">
                  Respuesta automática 24 hs
                </span>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-white font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 h-60 overflow-y-auto space-y-2.5 bg-stone-100 text-xs font-medium">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                    msg.from === "bot"
                      ? "bg-white border border-stone-300 text-stone-900 mr-auto"
                      : "bg-emerald-700 text-white ml-auto"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {botLoading && (
                <div className="bg-white border border-stone-300 text-stone-600 p-2.5 rounded-xl text-xs w-28">
                  Consultando...
                </div>
              )}
            </div>

            <form
              onSubmit={handleSendChat}
              className="p-2 border-t border-stone-300 bg-white flex gap-2"
            >
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Escribí tu patente..."
                className="flex-1 bg-stone-100 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                disabled={botLoading}
                className="bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold"
              >
                Enviar
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setChatOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-3.5 rounded-full shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
          >
            <MessageSquare className="w-5 h-5 fill-current" />
            <span className="text-xs">Consultar Estado</span>
          </button>
        )}
      </div>
    </div>
  );
}
