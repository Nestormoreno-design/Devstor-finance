import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import String, Numeric, ForeignKey, Text, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, UUIDPKMixin, TimestampMixin


class FundTransaction(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "fund_transactions"

    fund_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("funds.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # assignment | top_up | expense | adjustment
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    # positivo = entra capacidad al fondo, negativo = consumo
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    related_expense_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("expenses.id", ondelete="CASCADE"), nullable=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    fund = relationship("Fund")
