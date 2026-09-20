import uuid

from sqlalchemy import String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, UUIDPKMixin, TimestampMixin


class Category(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "categories"

    # user_id NULL = categoría del sistema (visible para todos los usuarios).
    # user_id con valor = categoría personalizada, solo visible para ese usuario.
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(80), nullable=False)

    user = relationship("User")
