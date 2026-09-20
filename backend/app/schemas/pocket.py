import uuid
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict, field_validator


class PocketCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    type: str = Field(min_length=1, max_length=60)
    initial_balance: Decimal = Field(default=Decimal("0"))
    description: str | None = None

    @field_validator("initial_balance")
    @classmethod
    def initial_balance_must_be_finite(cls, v: Decimal) -> Decimal:
        # Permitimos negativo (deuda inicial en un bolsillo), pero no NaN/Inf.
        if not v.is_finite():
            raise ValueError("El saldo inicial debe ser un número válido")
        return v


class PocketUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    type: str | None = Field(default=None, min_length=1, max_length=60)
    description: str | None = None
    is_active: bool | None = None
    # initial_balance NO se edita libremente aquí: cambiarlo retroactivamente
    # alteraría el historial financiero ya registrado. Se maneja con un
    # ajuste explícito en un módulo posterior si hace falta.


class PocketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    type: str
    initial_balance: Decimal
    description: str | None
    is_active: bool
    balance: Decimal
    movement_count: int
