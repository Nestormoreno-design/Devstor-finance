import uuid
from datetime import date as date_type, time as time_type
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict, field_validator


class ExpenseCreate(BaseModel):
    pocket_id: uuid.UUID  # origen físico del dinero — siempre obligatorio
    fund_id: uuid.UUID | None = None  # etiqueta de presupuesto opcional
    category_id: uuid.UUID
    amount: Decimal
    concept: str = Field(min_length=1, max_length=255)
    date: date_type
    time: time_type | None = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: Decimal) -> Decimal:
        if not v.is_finite() or v <= 0:
            raise ValueError("El valor del gasto debe ser un número positivo")
        return v


class ExpenseUpdate(BaseModel):
    pocket_id: uuid.UUID | None = None
    fund_id: uuid.UUID | None = None
    category_id: uuid.UUID | None = None
    amount: Decimal | None = None
    concept: str | None = Field(default=None, min_length=1, max_length=255)
    date: date_type | None = None
    time: time_type | None = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: Decimal | None) -> Decimal | None:
        if v is not None and (not v.is_finite() or v <= 0):
            raise ValueError("El valor del gasto debe ser un número positivo")
        return v


class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    pocket_id: uuid.UUID
    fund_id: uuid.UUID | None
    category_id: uuid.UUID
    amount: Decimal
    concept: str
    date: date_type
    time: time_type | None
