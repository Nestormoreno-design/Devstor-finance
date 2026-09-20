import uuid
from datetime import date as date_type
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator


class TransferCreate(BaseModel):
    from_pocket_id: uuid.UUID
    to_pocket_id: uuid.UUID
    amount: Decimal
    date: date_type
    description: str | None = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: Decimal) -> Decimal:
        if not v.is_finite() or v <= 0:
            raise ValueError("El valor de la transferencia debe ser un número positivo")
        return v

    @model_validator(mode="after")
    def pockets_must_differ(self):
        if self.from_pocket_id == self.to_pocket_id:
            raise ValueError("El bolsillo de origen y destino no pueden ser el mismo")
        return self


class TransferOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    from_pocket_id: uuid.UUID
    to_pocket_id: uuid.UUID
    amount: Decimal
    date: date_type
    description: str | None
