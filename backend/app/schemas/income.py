import uuid
from datetime import date as date_type, time as time_type
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict, field_validator


class IncomeCreate(BaseModel):
    pocket_id: uuid.UUID
    amount: Decimal
    type: str = Field(min_length=1, max_length=60)
    description: str | None = None
    date: date_type
    time: time_type | None = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: Decimal) -> Decimal:
        if not v.is_finite() or v <= 0:
            raise ValueError("El valor del ingreso debe ser un número positivo")
        return v


class IncomeUpdate(BaseModel):
    pocket_id: uuid.UUID | None = None
    amount: Decimal | None = None
    type: str | None = Field(default=None, min_length=1, max_length=60)
    description: str | None = None
    date: date_type | None = None
    time: time_type | None = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: Decimal | None) -> Decimal | None:
        if v is not None and (not v.is_finite() or v <= 0):
            raise ValueError("El valor del ingreso debe ser un número positivo")
        return v


class IncomeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    pocket_id: uuid.UUID
    amount: Decimal
    type: str
    description: str | None
    date: date_type
    time: time_type | None
