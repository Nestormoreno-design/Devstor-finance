import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Numeric, ForeignKey, Text, Date, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, UUIDPKMixin, TimestampMixin


class Transfer(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "transfers"
    __table_args__ = (
        CheckConstraint("from_pocket_id <> to_pocket_id", name="ck_transfer_different_pockets"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    from_pocket_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pockets.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    to_pocket_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pockets.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    user = relationship("User")
    from_pocket = relationship("Pocket", foreign_keys=[from_pocket_id])
    to_pocket = relationship("Pocket", foreign_keys=[to_pocket_id])
