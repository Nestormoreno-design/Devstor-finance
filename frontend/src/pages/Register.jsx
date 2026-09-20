import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (form.username.trim().length < 3) {
      setError("El nombre de usuario debe tener al menos 3 caracteres");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email,
        password: form.password,
        full_name: form.full_name || undefined,
      });
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail || "No pudimos crear tu cuenta. Intenta de nuevo."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout eyebrow="Empecemos" title="Crea tu cuenta">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          required
          minLength={3}
          autoComplete="username"
          placeholder="Nombre de usuario"
          className="input-field"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="text"
          placeholder="Nombre completo (opcional)"
          className="input-field"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Correo electrónico"
          className="input-field"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <PasswordInput
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Contraseña (mínimo 8 caracteres)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <PasswordInput
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Confirmar contraseña"
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
        />

        {error && <p className="text-sm text-brick">{error}</p>}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60 dark:text-paper/60">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="font-medium text-pine">
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  );
}