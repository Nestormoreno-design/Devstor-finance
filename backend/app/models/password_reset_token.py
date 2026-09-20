import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base, UUIDPKMixin, TimestampMixin


class PasswordResetToken(Base, UUIDPKMixin, TimestampMixin):
    """
    Token de recuperación de contraseña, de un solo uso y con expiración.

    Se almacena ÚNICAMENTE su hash (sha256), nunca el valor en claro, para que
    el token sea inútil si la base de datos se filtrara. El valor en claro se
    genera de forma segura (secrets.token_urlsafe) y se envía por el enlace de
    recuperación.
    """

    __tablename__ = "password_reset_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)