import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../api/client";
import {
  Wrench,
  Car,
  History,
  CheckCircle2,
  Printer,
  AlertCircle,
} from "lucide-react";

export default function PublicHistorial() {
  const { slug, patente } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/public/${slug}/historial/${patente}`);
        setData(res.data);
      } catch (err) {
        setError(err.message || "No se encontró el historial solicitado.");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [slug, patente]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-600">
        Cargando libreta de mantenimiento...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <h2 className="font-extrabold text-lg text-slate-900">
            Historial no disponible
          </h2>
          <p className="text-sm text-slate-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const { taller, vehiculo, historial } = data;

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen bg-slate-100 text-slate-900 pb-12"
    >
      <header className="bg-slate-950 text-white py-5 px-4 border-b-4 border-amber-500">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-slate-950 p-2 rounded-xl">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg leading-tight">
                {taller.nombre}
              </h1>
              <span className="text-xs text-slate-400">
                Libreta Digital de Mantenimiento Verificada
              </span>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="bg-white text-slate-900 hover:bg-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 print:hidden"
          >
            <Printer className="w-4 h-4" />
            Guardar / Imprimir PDF
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Car className="w-8 h-8 text-amber-600" />
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {vehiculo.marca} {vehiculo.modelo}{" "}
                {vehiculo.anio ? `(${vehiculo.anio})` : ""}
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Último kilometraje registrado:{" "}
                {Number(vehiculo.kilometraje || 0).toLocaleString("es-AR")} km
              </p>
            </div>
          </div>
          <span
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            className="bg-slate-900 text-white font-extrabold text-base px-4 py-1.5 rounded-xl tracking-widest"
          >
            {vehiculo.patente}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-600" />
            Services y Reparaciones Realizadas ({historial.length})
          </h3>

          {historial.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              Sin servicios registrados aún.
            </p>
          ) : (
            <div className="space-y-4">
              {historial.map((h) => (
                <div
                  key={h.orden_id}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50"
                >
                  <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        {new Date(h.fecha_ingreso).toLocaleDateString("es-AR")}
                      </span>
                      <span className="text-slate-500">
                        •{" "}
                        {Number(h.kilometraje_ingreso || 0).toLocaleString(
                          "es-AR",
                        )}{" "}
                        km
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded">
                      {h.estado.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 mb-2">
                    {h.falla_declarada}
                  </p>
                  {h.repuestos?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {h.repuestos.map((r, i) => (
                        <span
                          key={i}
                          className="bg-white border border-slate-300 text-xs font-semibold px-2.5 py-1 rounded-lg"
                        >
                          {r.cantidad}x {r.descripcion}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
