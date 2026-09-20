import uuid
from datetime import date as date_type
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict, field_validator


class FundCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    assigned_amount: Decimal
    default_pocket_id: uuid.UUID | None = None
    start_date: date_type
    end_date: date_type | None = None

    @field_validator("assigned_amount")
    @classmethod
    def assigned_amount_must_be_positive(cls, v: Decimal) -> Decimal:
        if not v.is_finite() or v <= 0:
            raise ValueError("El monto asignado debe ser un número positivo")
        return v


class FundUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    assigned_amount: Decimal | None = None
    default_pocket_id: uuid.UUID | None = None
    end_date: date_type | None = None
    status: str | None = None


class FundOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    assigned_amount: Decimal
    default_pocket_id: uuid.UUID | None
    start_date: date_type
    end_date: date_type | None
    status: str
    available: Decimal
    spent: Decimal
    utilization_pct: float
