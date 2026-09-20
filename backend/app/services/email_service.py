"""
Envío de emails transaccionales (recuperación de contraseña).

Sin configuración SMTP (env EMAIL_*), NO se intenta enviar correo: el enlace
se escribe en el log del backend para desarrollo/pruebas. Nunca se inventan
credenciales y un fallo de SMTP nunca rompe la petición (se registra y ya).

Variables necesarias para enviar correo de verdad:
    FRONTEND_URL   -> base del frontend (para el enlace /reset-password?token=...)
    EMAIL_HOST     -> servidor SMTP (ej. smtp.gmail.com / SMTP del proveedor)
    EMAIL_PORT     -> 587 (STARTTLS)
    EMAIL_USER     -> cuenta SMTP
    EMAIL_PASSWORD -> contraseña / app password del SMTP
    EMAIL_FROM     -> remitente visible (puede ser distinto de EMAIL_USER)
    EMAIL_USE_TLS  -> True (587/STARTTLS) o False (conexión SSL directa, puerto 465)
"""

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("devstor.email")


def build_reset_url(token: str) -> str:
    base = settings.FRONTEND_URL.rstrip("/")
    return f"{base}/reset-password?token={token}"


def send_reset_email(email: str, token: str, *, display_name: str | None = None) -> None:
    """Envía (o registra en log) el enlace de recuperación para un correo."""
    link = build_reset_url(token)
    greeting = f"Hola {display_name}," if display_name else "Hola,"

    if not settings.email_configured:
        # Modo desarrollo: no hay SMTP configurado. El enlace queda en el log
        # para poder probar el flujo completo localmente. La respuesta al
        # usuario SIEMPRE es genérica (no revela si el correo existe).
        logger.warning(
            "Enlace de recuperación (SMTP sin configurar, solo para desarrollo): "
            "usuario=%s email=%s link=%s",
            display_name,
            email,
            link,
        )
        return

    try:
        message = EmailMessage()
        message["Subject"] = "Devstor Finance — Restablece tu contraseña"
        message["From"] = settings.EMAIL_FROM
        message["To"] = email
        message.set_content(
            f"{greeting}\n\n"
            "Recibimos una solicitud para restablecer la contraseña de tu cuenta "
            f"de Devstor Finance.\n\n"
            f"Abre el siguiente enlace para crear una nueva contraseña:\n{link}\n\n"
            "Este enlace es válido por una sola vez y expira en "
            f"{settings.RESET_TOKEN_EXPIRE_MINUTES} minutos.\n\n"
            "Si no solicitaste este cambio, ignora este correo.\n\n"
            "— Devstor Finance"
        )

        if settings.EMAIL_USE_TLS:
            with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=15) as server:
                server.starttls()
                server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
                server.send_message(message)
        else:
            with smtplib.SMTP_SSL(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=15) as server:
                server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
                server.send_message(message)

        logger.info("Enlace de recuperación enviado a %s", email)
    except Exception:  # noqa: BLE001 — el envío no debe romper la petición
        logger.exception("No se pudo enviar el email de recuperación a %s", email)