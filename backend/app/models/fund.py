import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import String, Numeric, ForeignKey, Text, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, UUIDPKMixin, TimestampMixin


class Fund(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "funds"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    # Bolsillo sugerido de donde sale el dinero al gastar de este fondo
    # (no es obligatorio: el gasto siempre puede elegir otro bolsillo).
    default_pocket_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pockets.id", ondelete="SET NULL"), nullable=True
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")

    user = relationship("User")
    default_pocket = relationship("Pocket")
