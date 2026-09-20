import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form);
      navigate("/", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        setError(err.response?.data?.detail || "Esta cuenta está desactivada.");
      } else if (status === 401) {
        setError("Usuario o contraseña incorrectos.");
      } else if (status >= 500) {
        setError("Ocurrió un error en el servidor. Intenta de nuevo.");
      } else {
        setError(err.response?.data?.detail || "No pudimos iniciar sesión. Intenta de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout eyebrow="Bienvenido de nuevo" title="Inicia sesión">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          required
          autoComplete="username"
          placeholder="Usuario"
          className="input-field"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <PasswordInput
          required
          autoComplete="current-password"
          placeholder="Contraseña"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <div className="-mt-1 text-right">
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-pine transition-colors hover:text-pine-dark"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {error && <p className="text-sm text-brick">{error}</p>}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Ingresando…" : "Ingresar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60 dark:text-paper/60">
        ¿No tienes cuenta?{" "}
        <Link to="/register" className="font-medium text-pine">
          Regístrate
        </Link>
      </p>
    </AuthLayout>
  );
}
