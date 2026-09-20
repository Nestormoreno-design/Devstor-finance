import uuid
from datetime import date as date_type, time as time_type
from decimal import Decimal

from pydantic import BaseModel


class MovementOut(BaseModel):
    id: uuid.UUID
    kind: str  # "income" | "expense" | "transfer"
    amount: Decimal
    date: date_type
    time: time_type | None = None
    description: str | None = None
    pocket_id: uuid.UUID | None = None
    pocket_name: str | None = None
    from_pocket_name: str | None = None
    to_pocket_name: str | None = None
    category_name: str | None = None
    fund_id: uuid.UUID | None = None
    fund_name: str | None = None
    type: str | None = None  # tipo de ingreso, o None para gasto/transferencia


class CategoryBreakdown(BaseModel):
    category_name: str
    total: Decimal


class DashboardOut(BaseModel):
    total_balance: Decimal
    period_income: Decimal
    period_expenses: Decimal
    balance: Decimal
    savings_rate: float
    pockets: list[dict]
    expenses_by_category: list[CategoryBreakdown]
