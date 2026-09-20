from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Configuración central de la aplicación.
    Todo lo sensible viene de variables de entorno (.env), nunca hardcodeado.
    """

    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 días
    CORS_ORIGINS: str = "http://localhost:5173"

    # Recuperación de contraseña.
    # FRONTEND_URL: base del frontend para construir el enlace /reset-password?token=...
    # Sin configuración de email (EMAIL_* vacías), el enlace NO se envía por SMTP:
    # se registra en el log del backend en modo desarrollo/consola para poder probar.
    FRONTEND_URL: str = "http://localhost:5173"
    RESET_TOKEN_EXPIRE_MINUTES: int = 60
    EMAIL_HOST: str = ""
    EMAIL_PORT: int = 587
    EMAIL_USER: str = ""
    EMAIL_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    EMAIL_USE_TLS: bool = True

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def email_configured(self) -> bool:
        """SMTP configurado de verdad: host, usuario, contraseña y remitente."""
        return bool(
            self.EMAIL_HOST
            and self.EMAIL_USER
            and self.EMAIL_PASSWORD
            and self.EMAIL_FROM
        )


settings = Settings()
