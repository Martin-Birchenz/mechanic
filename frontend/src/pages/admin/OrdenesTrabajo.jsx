import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import AdminNavbar from "../../components/AdminNavbar";
import NuevaOTModal from "../../components/NuevaOTModal";
import {
  Plus,
  CheckCircle,
  Car,
  RefreshCw,
  MessageCircle,
  Printer,
  History,
  AlertCircle,
} from "lucide-react";

const ESTADOS = [
  { value: "INGRESADO", label: "1. Ingresado" },
  { value: "EN_DIAGNOSTICO", label: "2. En Diagnóstico" },
  { value: "ESPERANDO_REPUESTO", label: "3. Esperando Repuesto" },
  { value: "EN_REPARACION", label: "4. En Reparación" },
  { value: "LISTO", label: "5. LISTO PARA RETIRAR" },
  { value: "ENTREGADO", label: "6. Entregado" },
];

const BADGE_ESTADO = {
  INGRESADO: "bg-stone-200 text-stone-800 border-stone-300",
  EN_DIAGNOSTICO: "bg-amber-100 text-amber-900 border-amber-300",
  ESPERANDO_REPUESTO: "bg-orange-100 text-orange-900 border-orange-300",
  EN_REPARACION: "bg-blue-100 text-blue-900 border-blue-300",
  LISTO: "bg-emerald-100 text-emerald-900 border-emerald-400",
  ENTREGADO: "bg-stone-100 text-stone-500 border-stone-300",
};

export default function OrdenesTrabajo() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [notif, setNotif] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [filtro, setFiltro] = useState("ACTIVOS"); // ACTIVOS | LISTOS | TODOS

  const loadOrdenes = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await apiFetch("/ordenes");
      setOrdenes(res.data || []);
    } catch (err) {
      setErrorMsg(err.message || "Error al cargar las órdenes del taller");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrdenes();
  }, []);

  const handleCambiarEstado = async (ordenId, nuevoEstado) => {
    try {
      setErrorMsg(null);
      await apiFetch(`/ordenes/${ordenId}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      setOrdenes((prev) =>
        prev.map((o) => (o.id === ordenId ? { ...o, estado: nuevoEstado } : o)),
      );

      setNotif(
        `Orden #${ordenId} actualizada a "${nuevoEstado.replace(/_/g, " ")}"`,
      );
      setTimeout(() => setNotif(null), 3500);
    } catch (err) {
      setErrorMsg("No se pudo actualizar el estado: " + err.message);
    }
  };

  // Abre WhatsApp directo sin agendar contacto
  const abrirWhatsAppCliente = (ot) => {
    const telLimpio = String(ot.cliente_telefono || "").replace(/\D/g, "");
    const telefonoAR = telLimpio.startsWith("54")
      ? telLimpio
      : `549${telLimpio}`;
    const tallerNombre = user?.taller_nombre || "el taller";

    const texto =
      ot.estado === "LISTO"
        ? `Hola ${ot.cliente_nombre}, te avisamos desde ${tallerNombre} que tu ${ot.marca} ${ot.modelo} (${ot.patente}) ya está LISTO para retirar. Total: $${Number(ot.total_final).toLocaleString("es-AR")} (Saldo pendiente: $${Number(ot.saldo_pendiente).toLocaleString("es-AR")}).`
        : `Hola ${ot.cliente_nombre}, te escribimos desde ${tallerNombre} por tu ${ot.marca} ${ot.modelo} (${ot.patente}). Estado actual: ${ot.estado.replace(/_/g, " ")}.`;

    window.open(
      `https://wa.me/${telefonoAR}?text=${encodeURIComponent(texto)}`,
      "_blank",
    );
  };

  // Genera comprobante / presupuesto limpio para imprimir o guardar en PDF
  const imprimirOrdenPDF = (ot) => {
    const tallerNombre = user?.taller_nombre || "GestorCar Taller Mecánico";
    const ventana = window.open("", "_blank", "width=800,height=900");
    if (!ventana) return;

    ventana.document.write(`
      <html>
        <head>
          <title>Orden #${ot.id} - ${ot.patente}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #111; max-width: 720px; margin: auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #111; padding-bottom: 12px; margin-bottom: 20px; }
            .patente { font-size: 22px; font-weight: bold; border: 2px solid #111; padding: 4px 12px; letter-spacing: 2px; }
            .box { border: 1px solid #ccc; padding: 14px; border-radius: 6px; margin-bottom: 16px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; }
            .total { font-size: 18px; font-weight: bold; border-top: 2px solid #111; padding-top: 10px; margin-top: 10px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h2 style="margin:0;">${tallerNombre}</h2>
              <p style="margin:4px 0 0; font-size:13px; color:#555;">Comprobante de Orden de Trabajo / Presupuesto</p>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:bold; font-size:16px;">O.T. #${ot.id}</div>
              <div class="patente" style="margin-top:6px;">${ot.patente}</div>
            </div>
          </div>

          <div class="box">
            <div class="row"><strong>Cliente:</strong> <span>${ot.cliente_nombre}</span></div>
            <div class="row"><strong>Teléfono:</strong> <span>${ot.cliente_telefono || "-"}</span></div>
            <div class="row"><strong>Vehículo:</strong> <span>${ot.marca} ${ot.modelo}</span></div>
            <div class="row"><strong>Estado:</strong> <span>${ot.estado.replace(/_/g, " ")}</span></div>
          </div>

          <div class="box">
            <strong>Trabajo / Falla declarada:</strong>
            <p style="margin:8px 0 0; font-size:14px; line-height:1.5;">${ot.falla_declarada || "Sin observaciones"}</p>
          </div>

          <div class="box">
            <div class="row"><span>Total Presupuestado / Final:</span> <strong>$${Number(ot.total_final).toLocaleString("es-AR")}</strong></div>
            <div class="row"><span>Saldo Pendiente a Abonar:</span> <strong>$${Number(ot.saldo_pendiente).toLocaleString("es-AR")}</strong></div>
            <div class="row total"><span>TOTAL A PAGAR:</span> <span>$${Number(ot.saldo_pendiente).toLocaleString("es-AR")}</span></div>
          </div>

          <p style="font-size:11px; color:#666; text-align:center; margin-top:30px;">
            Documento emitido por GestorCar • Conserve este comprobante para el retiro de su unidad.
          </p>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  const ordenesFiltradas = ordenes.filter((o) => {
    if (filtro === "ACTIVOS") return o.estado !== "ENTREGADO";
    if (filtro === "LISTOS") return o.estado === "LISTO";
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-12">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Alertas */}
        {notif && (
          <div className="mb-5 bg-emerald-100 border-l-4 border-emerald-600 text-emerald-900 p-4 rounded-r-xl flex items-center justify-between text-sm font-bold shadow-sm">
            <span>{notif}</span>
            <CheckCircle className="w-5 h-5 shrink-0" />
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 bg-red-100 border-l-4 border-red-600 text-red-900 p-4 rounded-r-xl flex items-center gap-2 text-sm font-bold shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Cabecera y Botón Principal Grande */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Tablero de Órdenes en Taller
            </h2>
            <p className="text-sm text-stone-600">
              Anotá ingresos, avisá por WhatsApp cuando estén listos e imprimí
              comprobantes.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadOrdenes}
              className="p-3 rounded-xl bg-white border border-stone-300 text-stone-700 hover:bg-stone-200 transition shadow-sm"
              title="Actualizar tablero"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm px-5 py-3 rounded-xl transition flex items-center gap-2 shadow-md"
            >
              <Plus className="w-5 h-5" /> INGRESAR AUTO / O.T.
            </button>
          </div>
        </div>

        {/* Pestañas de Filtro Rápido */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[
            {
              id: "ACTIVOS",
              label: `En Taller (${ordenes.filter((o) => o.estado !== "ENTREGADO").length})`,
            },
            {
              id: "LISTOS",
              label: `Listos para Retirar (${ordenes.filter((o) => o.estado === "LISTO").length})`,
            },
            { id: "TODOS", label: `Todas las Órdenes (${ordenes.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltro(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition whitespace-nowrap ${
                filtro === tab.id
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-700 border-stone-300 hover:bg-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grilla de Órdenes */}
        {loading ? (
          <div className="text-center py-12 text-stone-600 font-bold">
            Cargando autos en taller...
          </div>
        ) : ordenesFiltradas.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border-2 border-dashed border-stone-300 p-8">
            <Car className="w-12 h-12 text-stone-400 mx-auto mb-3" />
            <h3 className="text-stone-900 font-extrabold text-lg">
              No hay vehículos en esta vista
            </h3>
            <p className="text-sm text-stone-600 mt-1">
              Usá el botón naranja "+ INGRESAR AUTO / O.T." para anotar un
              trabajo nuevo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ordenesFiltradas.map((ot) => (
              <div
                key={ot.id}
                className="bg-white border-2 border-stone-300 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-stone-400 transition"
              >
                <div>
                  {/* Cabecera tipo Chapa Patente */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-extrabold text-stone-700 bg-stone-200 px-2.5 py-1 rounded-lg">
                      O.T. #{ot.id}
                    </span>
                    <span className="text-sm font-mono font-black tracking-widest bg-stone-900 text-white px-3 py-1 rounded-lg border-2 border-stone-700">
                      {ot.patente}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-stone-900 leading-snug">
                    {ot.marca} {ot.modelo}
                  </h3>
                  <p className="text-xs font-semibold text-stone-600 mb-3">
                    Dueño: {ot.cliente_nombre} • {ot.cliente_telefono}
                  </p>

                  {/* Falla */}
                  <div className="bg-stone-100 p-3 rounded-xl border border-stone-200 mb-4">
                    <span className="text-[11px] font-bold text-stone-500 uppercase block mb-0.5">
                      Trabajo / Falla:
                    </span>
                    <p className="text-sm text-stone-800 font-medium line-clamp-2">
                      {ot.falla_declarada}
                    </p>
                  </div>
                </div>

                {/* Pie Operativo */}
                <div className="border-t-2 border-stone-200 pt-3 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-stone-600 font-semibold">
                      Total trabajo:
                    </span>
                    <span className="font-mono font-extrabold text-stone-900">
                      ${Number(ot.total_final).toLocaleString("es-AR")}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-stone-600 font-semibold">
                      Saldo pendiente:
                    </span>
                    <span
                      className={`font-mono font-extrabold px-2 py-0.5 rounded ${
                        ot.saldo_pendiente > 0
                          ? "bg-amber-100 text-amber-900"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      ${Number(ot.saldo_pendiente).toLocaleString("es-AR")}
                    </span>
                  </div>

                  {/* Selector Grande de Estado */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">
                      Estado del Auto
                    </label>
                    <select
                      value={ot.estado}
                      onChange={(e) =>
                        handleCambiarEstado(ot.id, e.target.value)
                      }
                      className={`w-full border-2 rounded-xl px-3 py-2 text-xs font-extrabold outline-none cursor-pointer ${
                        BADGE_ESTADO[ot.estado] ||
                        "bg-stone-100 border-stone-300"
                      }`}
                    >
                      {ESTADOS.map((est) => (
                        <option key={est.value} value={est.value}>
                          {est.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Botonera Rápida de Taller: WhatsApp + PDF + Historial */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => abrirWhatsAppCliente(ot)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 transition"
                      title="Enviar mensaje por WhatsApp al cliente"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => imprimirOrdenPDF(ot)}
                      className="bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 transition"
                      title="Imprimir comprobante o guardar PDF"
                    >
                      <Printer className="w-4 h-4 shrink-0" />
                      <span>Imprimir</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/clientes?patente=${ot.patente}`)
                      }
                      className="bg-stone-200 hover:bg-stone-300 text-stone-900 font-bold text-xs py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 transition"
                      title="Ver historial clínico de esta patente"
                    >
                      <History className="w-4 h-4 shrink-0" />
                      <span>Historial</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <NuevaOTModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadOrdenes}
      />
    </div>
  );
}
