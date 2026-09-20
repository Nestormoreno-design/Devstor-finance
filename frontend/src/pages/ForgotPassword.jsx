import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { forgotPasswordRequest } from "../services/auth.service";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await forgotPasswordRequest(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || "No pudimos procesar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout eyebrow="Recupera el acceso" title="Recuperar contraseña">
      {submitted ? (
        <div className="space-y-4">
          <p className="text-sm text-ink/70 dark:text-paper/70">
            Si existe una cuenta asociada a este correo, recibirás instrucciones
            para restablecer tu contraseña.
          </p>
          <Link to="/login" className="btn-primary block text-center">
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            autoComplete="email"
            autoFocus
            placeholder="Correo electrónico"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {error && <p className="text-sm text-brick">{error}</p>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Enviando…" : "Enviar enlace de recuperación"}
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