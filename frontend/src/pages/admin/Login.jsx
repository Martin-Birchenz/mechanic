import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Wrench, Lock, Mail, AlertCircle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      localStorage.removeItem("superadmin_taller_id");
      const loggedUser = await login(email, password);

      if (loggedUser?.rol === "SUPERADMIN") {
        navigate("/superadmin", { replace: true });
      } else {
        navigate("/admin/ordenes", { replace: true });
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Email o contraseña incorrectos",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-200 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white border-2 border-stone-300 rounded-2xl p-8 shadow-xl">
        {/* Cabecera GestorCar */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-14 h-14 bg-amber-500 border-2 border-stone-900 rounded-2xl flex items-center justify-center mb-3 shadow">
            <Wrench className="w-7 h-7 text-stone-950" />
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            GestoCar
          </h1>
          <p className="text-sm font-semibold text-stone-600 mt-1">
            Ingreso al Sistema del Taller
          </p>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-600 text-red-900 p-3.5 rounded-r-xl flex items-center gap-2.5 mb-6 text-sm font-bold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase text-stone-700 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="taller@gmail.com"
                className="w-full bg-stone-100 border-2 border-stone-300 rounded-xl px-4 py-3 pl-11 text-stone-900 text-sm font-semibold focus:outline-none focus:border-amber-600 transition-colors"
              />
              <Mail className="w-5 h-5 text-stone-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase text-stone-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-100 border-2 border-stone-300 rounded-xl px-4 py-3 pl-11 text-stone-900 text-sm font-semibold focus:outline-none focus:border-amber-600 transition-colors"
              />
              <Lock className="w-5 h-5 text-stone-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-extrabold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center mt-2 shadow-md"
          >
            {loading ? "Ingresando..." : "ENTRAR AL PANEL"}
          </button>
        </form>

        <div className="mt-7 text-center border-t border-stone-200 pt-4">
          <p className="text-xs font-semibold text-stone-500">
            GestoCar • Administración de Talleres Mecánicos
          </p>
        </div>
      </div>
    </div>
  );
}
