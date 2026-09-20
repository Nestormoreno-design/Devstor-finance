import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import { resetPasswordRequest } from "../services/auth.service";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get("token") || "";

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPasswordRequest(tokenParam, form.password);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.detail || "No pudimos restablecer la contraseña.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout eyebrow="Crea una contraseña nueva" title="Restablecer contraseña">
      {!tokenParam ? (
        <div className="space-y-4">
          <p className="text-sm text-brick">
            El enlace de recuperación no es válido. Solicita uno nuevo.
          </p>
          <Link to="/forgot-password" className="btn-primary block text-center">
            Solicitar nuevo enlace
          </Link>
        </div>
      ) : done ? (
        <div className="space-y-4">
          <p className="text-sm text-ink/70 dark:text-paper/70">
            Tu contraseña se restableció correctamente. Ya puedes iniciar sesión.
          </p>
          <Link to="/login" className="btn-primary block text-center">
            Iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Nueva contraseña (mínimo 8 caracteres)"
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
            {submitting ? "Restableciendo…" : "Restablecer contraseña"}
          </button>

          <p className="mt-2 text-center text-sm text-ink/60 dark:text-paper/60">
            <Link to="/login" className="font-medium text-pine">
              Volver a iniciar sesión
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}