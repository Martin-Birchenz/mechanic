import { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";
import AdminNavbar from "../../components/AdminNavbar";
import {
  Package,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

export default function StockRepuestos() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    marca: "",
    stock_actual: 1,
    stock_minimo: 2,
    precio_costo: 0,
    precio_venta: 0,
  });

  const cargarStock = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/gestion/stock");
      setItems(res.data || []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarStock();
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      await apiFetch("/gestion/stock", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setModalOpen(false);
      setForm({
        codigo: "",
        nombre: "",
        marca: "",
        stock_actual: 1,
        stock_minimo: 2,
        precio_costo: 0,
        precio_venta: 0,
      });
      cargarStock();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleAjustar = async (id, delta) => {
    try {
      await apiFetch(`/gestion/stock/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ delta }),
      });
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, stock_actual: Math.max(0, it.stock_actual + delta) }
            : it,
        ),
      );
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const bajosDeStock = items.filter((i) => i.stock_actual <= i.stock_minimo);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-12">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {errorMsg && (
          <div className="mb-5 bg-red-100 border-l-4 border-red-600 text-red-900 p-4 rounded-r-xl flex items-center gap-2 text-sm font-bold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {bajosDeStock.length > 0 && (
          <div className="mb-5 bg-amber-100 border-l-4 border-amber-600 text-amber-950 p-4 rounded-r-xl flex items-center gap-2.5 text-sm font-bold">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            <span>
              Atención: Tenés {bajosDeStock.length} repuesto(s) en stock mínimo
              o sin unidades ({bajosDeStock.map((b) => b.nombre).join(", ")}).
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Stock de Repuestos y Lubricantes
            </h2>
            <p className="text-sm text-stone-600">
              Controlá aceites, filtros y repuestos propios de la estantería.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm px-5 py-3 rounded-xl flex items-center gap-2 shadow-md self-start"
          >
            <Plus className="w-5 h-5" />+ AGREGAR REPUESTO
          </button>
        </div>

        <div className="bg-white border-2 border-stone-300 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center font-bold text-stone-500">
              Cargando inventario...
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <h3 className="text-lg font-extrabold text-stone-900">
                Estantería vacía
              </h3>
              <p className="text-sm text-stone-600 mt-1">
                Cargá tus aceites, filtros o repuestos frecuentes para controlar
                el stock.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-200 text-stone-800 text-xs uppercase font-extrabold border-b-2 border-stone-300">
                    <th className="p-4">Repuesto / Insumo</th>
                    <th className="p-4">Marca / Cód.</th>
                    <th className="p-4">Precio Venta</th>
                    <th className="p-4">Stock Actual</th>
                    <th className="p-4 text-right">Ajustar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-sm">
                  {items.map((it) => {
                    const alerta = it.stock_actual <= it.stock_minimo;
                    return (
                      <tr
                        key={it.id}
                        className={
                          alerta ? "bg-amber-50/70" : "hover:bg-stone-50"
                        }
                      >
                        <td className="p-4 font-extrabold text-stone-900">
                          {it.nombre}
                        </td>
                        <td className="p-4 text-xs font-semibold text-stone-600">
                          {it.marca || "-"} {it.codigo ? `(${it.codigo})` : ""}
                        </td>
                        <td className="p-4 font-mono font-extrabold text-stone-900">
                          ${Number(it.precio_venta).toLocaleString("es-AR")}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-black ${
                              alerta
                                ? "bg-red-100 text-red-900 border border-red-300"
                                : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            }`}
                          >
                            {it.stock_actual} unid. {alerta ? "(BAJO)" : ""}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleAjustar(it.id, -1)}
                            className="bg-stone-200 hover:bg-stone-300 text-stone-900 font-black px-3 py-1.5 rounded-lg text-xs"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => handleAjustar(it.id, 1)}
                            className="bg-stone-900 hover:bg-stone-700 text-white font-black px-3 py-1.5 rounded-lg text-xs"
                          >
                            +1
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-stone-300 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 text-stone-500 hover:text-stone-900"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-extrabold text-stone-900 mb-4">
              Cargar Repuesto al Stock
            </h3>
            <form onSubmit={handleCrear} className="space-y-3 text-sm">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Nombre del Repuesto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Aceite Elaion F50 10W40 4L"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    placeholder="YPF / Bosch / Fram"
                    value={form.marca}
                    onChange={(e) =>
                      setForm({ ...form, marca: e.target.value })
                    }
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    placeholder="Opcional"
                    value={form.codigo}
                    onChange={(e) =>
                      setForm({ ...form, codigo: e.target.value })
                    }
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Cantidad Inicial
                  </label>
                  <input
                    type="number"
                    value={form.stock_actual}
                    onChange={(e) =>
                      setForm({ ...form, stock_actual: e.target.value })
                    }
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Alerta Stock Mínimo
                  </label>
                  <input
                    type="number"
                    value={form.stock_minimo}
                    onChange={(e) =>
                      setForm({ ...form, stock_minimo: e.target.value })
                    }
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Precio Costo ($)
                  </label>
                  <input
                    type="number"
                    value={form.precio_costo}
                    onChange={(e) =>
                      setForm({ ...form, precio_costo: e.target.value })
                    }
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Precio Venta ($)
                  </label>
                  <input
                    type="number"
                    value={form.precio_venta}
                    onChange={(e) =>
                      setForm({ ...form, precio_venta: e.target.value })
                    }
                    className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-5 py-2.5 rounded-xl flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
