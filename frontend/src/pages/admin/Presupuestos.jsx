import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import AdminNavbar from "../../components/AdminNavbar";
import {
  FileText,
  Plus,
  MessageCircle,
  Printer,
  CheckCircle2,
  XCircle,
  ArrowRightCircle,
  Search,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";

export default function Presupuestos() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [presupuestos, setPresupuestos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Modal Nuevo Presupuesto
  const [modalOpen, setModalOpen] = useState(false);
  const [busquedaAuto, setBusquedaAuto] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    vehiculo_id: "",
    falla_declarada: "",
    observaciones: "",
    validez_dias: 15,
    total_mano_obra: "",
  });

  const [items, setItems] = useState([
    { descripcion: "", cantidad: 1, precio_unitario: "" },
  ]);

  const cargarTodo = async () => {
    try {
      setLoading(true);
      const [resPres, resVeh] = await Promise.all([
        apiFetch("/presupuestos"),
        apiFetch("/gestion/vehiculos-lista"),
      ]);
      setPresupuestos(resPres.data || []);
      setVehiculos(resVeh.data || []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const vehiculosFiltrados = useMemo(() => {
    const q = busquedaAuto.trim().toLowerCase();
    if (!q) return vehiculos.slice(0, 8);
    return vehiculos
      .filter(
        (v) =>
          v.patente?.toLowerCase().includes(q) ||
          v.cliente_nombre?.toLowerCase().includes(q) ||
          v.marca?.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [vehiculos, busquedaAuto]);

  const totalRepuestos = items.reduce(
    (acc, it) =>
      acc + (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0),
    0,
  );
  const totalPresupuesto = (Number(form.total_mano_obra) || 0) + totalRepuestos;

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!form.vehiculo_id) {
      setErrorMsg("Seleccioná un vehículo de la lista.");
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg(null);
      await apiFetch("/presupuestos", {
        method: "POST",
        body: JSON.stringify({ ...form, items }),
      });
      setModalOpen(false);
      setBusquedaAuto("");
      setForm({
        vehiculo_id: "",
        falla_declarada: "",
        observaciones: "",
        validez_dias: 15,
        total_mano_obra: "",
      });
      setItems([{ descripcion: "", cantidad: 1, precio_unitario: "" }]);
      setNotif(
        "Presupuesto guardado. Ya podés enviarlo por WhatsApp o imprimirlo.",
      );
      setTimeout(() => setNotif(null), 4000);
      cargarTodo();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertirAOrden = async (pres) => {
    try {
      setErrorMsg(null);
      const res = await apiFetch(`/presupuestos/${pres.id}/convertir`, {
        method: "POST",
      });
      setNotif(res.message || "Convertido a Orden de Trabajo");
      setTimeout(() => navigate("/admin/ordenes"), 1200);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleRechazar = async (id) => {
    try {
      await apiFetch(`/presupuestos/${id}/rechazar`, { method: "PATCH" });
      cargarTodo();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const enviarPresupuestoWhatsApp = (p) => {
    const tel = String(p.cliente_telefono || "").replace(/\D/g, "");
    const telAR = tel.startsWith("54") ? tel : `549${tel}`;
    const taller = user?.taller_nombre || "el taller";

    const detalleItems =
      p.items?.length > 0
        ? p.items
            .map(
              (it) =>
                `• ${it.cantidad}x ${it.descripcion}: $${Number(it.subtotal).toLocaleString("es-AR")}`,
            )
            .join("\n")
        : "• Sin repuestos detallados";

    const msg = `Hola ${p.cliente_nombre}, te pasamos el presupuesto desde *${taller}* para tu *${p.marca} ${p.modelo} (${p.patente})*:\n\n*Trabajo:* ${p.falla_declarada}\n\n*Repuestos estimados:*\n${detalleItems}\n\n*Mano de obra:* $${Number(p.total_mano_obra).toLocaleString("es-AR")}\n*TOTAL ESTIMADO:* $${Number(p.total_final).toLocaleString("es-AR")}\n_(Validez: ${p.validez_dias} días)_\n\n¿Confirmás para que avancemos con el trabajo?`;

    window.open(
      `https://wa.me/${telAR}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };

  const imprimirPresupuestoPDF = (p) => {
    const taller = user?.taller_nombre || "GestorCar Taller Mecánico";
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;

    const filasItems = (p.items || [])
      .map(
        (it) => `
        <tr>
          <td style="padding:8px; border-bottom:1px solid #ddd;">${it.descripcion}</td>
          <td style="padding:8px; border-bottom:1px solid #ddd; text-align:center;">${it.cantidad}</td>
          <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">$${Number(it.precio_unitario).toLocaleString("es-AR")}</td>
          <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right; font-weight:bold;">$${Number(it.subtotal).toLocaleString("es-AR")}</td>
        </tr>`,
      )
      .join("");

    win.document.write(`
      <html>
        <head>
          <title>Presupuesto #${p.id} - ${p.patente}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #111; max-width: 740px; margin: auto; }
            .top { display: flex; justify-content: space-between; border-bottom: 3px solid #111; padding-bottom: 12px; margin-bottom: 20px; }
            .patente { font-size: 20px; font-weight: bold; border: 2px solid #111; padding: 4px 12px; letter-spacing: 2px; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
            th { background: #f3f4f6; text-align: left; padding: 8px; border-bottom: 2px solid #111; }
            .totales { text-align: right; margin-top: 16px; font-size: 15px; }
            .final { font-size: 20px; font-weight: bold; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="top">
            <div>
              <h2 style="margin:0;">${taller}</h2>
              <p style="margin:4px 0 0; font-size:13px; color:#555;">PRESUPUESTO PREVIO DE REPARACIÓN</p>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:bold;">Presupuesto #${p.id}</div>
              <div class="patente" style="margin-top:6px;">${p.patente}</div>
            </div>
          </div>
          <p><strong>Cliente:</strong> ${p.cliente_nombre} (${p.cliente_telefono || "-"})</p>
          <p><strong>Vehículo:</strong> ${p.marca} ${p.modelo}</p>
          <p><strong>Trabajo presupuestado:</strong> ${p.falla_declarada}</p>

          <table>
            <thead>
              <tr>
                <th>Repuesto / Insumo</th>
                <th style="text-align:center;">Cant.</th>
                <th style="text-align:right;">Unitario</th>
                <th style="text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${filasItems || '<tr><td colspan="4" style="padding:8px; color:#666;">Sin repuestos detallados</td></tr>'}
            </tbody>
          </table>

          <div class="totales">
            <div>Repuestos estimados: <strong>$${Number(p.total_repuestos).toLocaleString("es-AR")}</strong></div>
            <div>Mano de obra: <strong>$${Number(p.total_mano_obra).toLocaleString("es-AR")}</strong></div>
            <div class="final">TOTAL PRESUPUESTADO: $${Number(p.total_final).toLocaleString("es-AR")}</div>
            <p style="font-size:12px; color:#555;">Validez del presupuesto: ${p.validez_dias} días corridos.</p>
          </div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-12">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {notif && (
          <div className="mb-5 bg-emerald-100 border-l-4 border-emerald-600 text-emerald-900 p-4 rounded-r-xl flex items-center justify-between text-sm font-bold shadow-sm">
            <span>{notif}</span>
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 bg-red-100 border-l-4 border-red-600 text-red-900 p-4 rounded-r-xl flex items-center gap-2 text-sm font-bold shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Presupuestos Previos
            </h2>
            <p className="text-sm text-stone-600">
              Cotizá trabajos antes de arrancar, mandalos por WhatsApp y pasalos
              a Orden de Trabajo en 1 clic.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm px-5 py-3 rounded-xl flex items-center gap-2 shadow-md self-start"
          >
            <Plus className="w-5 h-5" />
            Nuevo Presupuesto
          </button>
        </div>

        {loading ? (
          <p className="font-bold text-stone-600 py-8 text-center">
            Cargando presupuestos...
          </p>
        ) : presupuestos.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-stone-300 rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-stone-400 mx-auto mb-3" />
            <h3 className="text-lg font-extrabold text-stone-900">
              Sin presupuestos previos
            </h3>
            <p className="text-sm text-stone-600 mt-1">
              Creá una cotización sin descontar stock ni abrir orden hasta que
              el cliente te dé el OK.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {presupuestos.map((p) => (
              <div
                key={p.id}
                className="bg-white border-2 border-stone-300 rounded-2xl p-5 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-extrabold bg-stone-200 text-stone-800 px-2.5 py-1 rounded-lg">
                      Presup. #{p.id}
                    </span>
                    <span className="font-mono font-black text-xs bg-stone-900 text-white px-3 py-1 rounded-lg">
                      {p.patente}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-extrabold text-stone-900">
                      {p.marca} {p.modelo}
                    </h3>
                    <span
                      className={`text-[11px] font-black px-2 py-0.5 rounded uppercase ${
                        p.estado === "APROBADO"
                          ? "bg-emerald-100 text-emerald-800"
                          : p.estado === "RECHAZADO"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {p.estado}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-stone-600 mb-3">
                    {p.cliente_nombre} • {p.cliente_telefono}
                  </p>

                  <div className="bg-stone-100 p-3 rounded-xl border border-stone-200 mb-4">
                    <p className="text-sm text-stone-800 font-medium line-clamp-2">
                      {p.falla_declarada}
                    </p>
                  </div>
                </div>

                <div className="border-t-2 border-stone-200 pt-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-stone-500 uppercase">
                      Total Cotizado:
                    </span>
                    <span className="font-mono text-lg font-black text-stone-900">
                      ${Number(p.total_final).toLocaleString("es-AR")}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => enviarPresupuestoWhatsApp(p)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Enviar WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => imprimirPresupuestoPDF(p)}
                      className="bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir PDF
                    </button>
                  </div>

                  {p.estado === "PENDIENTE" && (
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleConvertirAOrden(p)}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <ArrowRightCircle className="w-4 h-4" />
                        Aprobar → Pasar a O.T.
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRechazar(p.id)}
                        className="bg-stone-200 hover:bg-red-100 text-stone-700 hover:text-red-700 p-2.5 rounded-xl"
                        title="Marcar como rechazado"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {p.estado === "APROBADO" && p.orden_generada_id && (
                    <div className="text-center text-xs font-extrabold text-emerald-700 bg-emerald-50 py-2 rounded-lg border border-emerald-200">
                      Convertido a Orden #{p.orden_generada_id}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Nuevo Presupuesto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-stone-300 rounded-2xl max-w-2xl w-full p-6 my-8 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 text-stone-500 hover:text-stone-900"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-extrabold text-stone-900 mb-4">
              Armar Presupuesto Previo
            </h3>

            <form onSubmit={handleCrear} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 relative">
                  <label className="block font-bold text-stone-700 mb-1">
                    Vehículo (Patente o Cliente) *
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Buscar patente o dueño..."
                      value={busquedaAuto}
                      onFocus={() => setMostrarLista(true)}
                      onChange={(e) => {
                        setBusquedaAuto(e.target.value);
                        setForm({ ...form, vehiculo_id: "" });
                        setMostrarLista(true);
                      }}
                      className="w-full border-2 border-stone-300 rounded-xl pl-9 pr-3 py-2 font-semibold"
                    />
                  </div>
                  {mostrarLista && (
                    <div className="absolute z-20 mt-1 w-full bg-white border-2 border-stone-300 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {vehiculosFiltrados.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, vehiculo_id: v.id });
                            setBusquedaAuto(
                              `${v.patente} — ${v.marca} ${v.modelo}`,
                            );
                            setMostrarLista(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-amber-50 border-b border-stone-100 flex justify-between text-xs"
                        >
                          <span>
                            <strong>{v.patente}</strong> · {v.marca} {v.modelo}{" "}
                            ({v.cliente_nombre})
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Validez (días)
                  </label>
                  <input
                    type="number"
                    value={form.validez_dias}
                    onChange={(e) =>
                      setForm({ ...form, validez_dias: e.target.value })
                    }
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Detalle del Trabajo a Cotizar *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ej: Cambio de kit de distribución + bomba de agua"
                  value={form.falla_declarada}
                  onChange={(e) =>
                    setForm({ ...form, falla_declarada: e.target.value })
                  }
                  className="w-full border-2 border-stone-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-stone-700">
                    Repuestos Estimados
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setItems([
                        ...items,
                        { descripcion: "", cantidad: 1, precio_unitario: "" },
                      ])
                    }
                    className="text-xs bg-stone-200 hover:bg-stone-300 px-2.5 py-1 rounded-lg font-bold"
                  >
                    + Agregar Repuesto
                  </button>
                </div>
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Repuesto"
                        value={it.descripcion}
                        onChange={(e) => {
                          const copy = [...items];
                          copy[idx].descripcion = e.target.value;
                          setItems(copy);
                        }}
                        className="flex-1 border-2 border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Cant"
                        value={it.cantidad}
                        onChange={(e) => {
                          const copy = [...items];
                          copy[idx].cantidad = e.target.value;
                          setItems(copy);
                        }}
                        className="w-16 border-2 border-stone-300 rounded-lg px-2 py-1.5 text-xs text-center font-mono"
                      />
                      <input
                        type="number"
                        placeholder="Precio $"
                        value={it.precio_unitario}
                        onChange={(e) => {
                          const copy = [...items];
                          copy[idx].precio_unitario = e.target.value;
                          setItems(copy);
                        }}
                        className="w-28 border-2 border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-right font-mono"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setItems(items.filter((_, i) => i !== idx))
                          }
                          className="text-stone-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Mano de Obra ($)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.total_mano_obra}
                  onChange={(e) =>
                    setForm({ ...form, total_mano_obra: e.target.value })
                  }
                  className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-mono font-bold"
                />
              </div>

              <div className="bg-stone-100 p-4 rounded-xl border border-stone-200 flex justify-between items-center">
                <span className="font-bold text-stone-700">
                  Total Presupuesto:
                </span>
                <span className="text-2xl font-black font-mono text-stone-900">
                  ${totalPresupuesto.toLocaleString("es-AR")}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-5 py-2.5 rounded-xl"
                >
                  {submitting ? "Guardando..." : "Guardar Presupuesto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
