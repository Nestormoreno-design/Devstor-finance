import uuid
from datetime import date, time
from decimal import Decimal

from sqlalchemy import String, Numeric, ForeignKey, Text, Date, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, UUIDPKMixin, TimestampMixin


class Expense(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "expenses"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Origen físico del dinero: SIEMPRE obligatorio, incluso si el gasto
    # también está etiquetado contra un fondo (ver fund_id).
    pocket_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pockets.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    # Etiqueta opcional de presupuesto. NULL = gasto personal normal.
    # Se conecta a app.models.fund.Fund cuando el módulo de Fondos se agrega.
    fund_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("funds.id", ondelete="RESTRICT"), nullable=True, index=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    concept: Mapped[str] = mapped_column(String(255), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    time: Mapped[time | None] = mapped_column(Time, nullable=True)

    user = relationship("User")
    pocket = relationship("Pocket")
    category = relationship("Category")
