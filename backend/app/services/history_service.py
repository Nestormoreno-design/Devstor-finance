import uuid
from datetime import date as date_type, time as time_type
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.expense import Expense
from app.models.fund import Fund
from app.models.income import Income
from app.models.pocket import Pocket
from app.models.transfer import Transfer


def get_history(
    db: Session,
    user_id: uuid.UUID,
    start: date_type | None = None,
    end: date_type | None = None,
    kind: str | None = None,  # income | expense | transfer
    pocket_id: uuid.UUID | None = None,
    category_id: uuid.UUID | None = None,
    fund_id: uuid.UUID | None = None,
    search: str | None = None,
    min_amount: Decimal | None = None,
    max_amount: Decimal | None = None,
) -> list[dict]:
    movements: list[dict] = []

    if kind in (None, "income"):
        q = db.query(Income, Pocket.name).join(Pocket, Income.pocket_id == Pocket.id).filter(
            Income.user_id == user_id
        )
        if start:
            q = q.filter(Income.date >= start)
        if end:
            q = q.filter(Income.date <= end)
        if pocket_id:
            q = q.filter(Income.pocket_id == pocket_id)
        if search:
            q = q.filter(Income.description.ilike(f"%{search}%"))
        if min_amount is not None:
            q = q.filter(Income.amount >= min_amount)
        if max_amount is not None:
            q = q.filter(Income.amount <= max_amount)

        for income, pocket_name in q.all():
            movements.append(
                {
                    "id": income.id,
                    "kind": "income",
                    "amount": income.amount,
                    "date": income.date,
                    "time": income.time,
                    "description": income.description,
                    "pocket_id": income.pocket_id,
                    "pocket_name": pocket_name,
                    "type": income.type,
                }
            )

    if kind in (None, "expense"):
        q = (
            db.query(Expense, Pocket.name, Category.name, Fund.name)
            .join(Pocket, Expense.pocket_id == Pocket.id)
            .join(Category, Expense.category_id == Category.id)
            .outerjoin(Fund, Expense.fund_id == Fund.id)
            .filter(Expense.user_id == user_id)
        )
        if start:
            q = q.filter(Expense.date >= start)
        if end:
            q = q.filter(Expense.date <= end)
        if pocket_id:
            q = q.filter(Expense.pocket_id == pocket_id)
        if category_id:
            q = q.filter(Expense.category_id == category_id)
        if fund_id:
            q = q.filter(Expense.fund_id == fund_id)
        if search:
            q = q.filter(Expense.concept.ilike(f"%{search}%"))
        if min_amount is not None:
            q = q.filter(Expense.amount >= min_amount)
        if max_amount is not None:
            q = q.filter(Expense.amount <= max_amount)

        for expense, pocket_name, category_name, fund_name in q.all():
            movements.append(
                {
                    "id": expense.id,
                    "kind": "expense",
                    "amount": expense.amount,
                    "date": expense.date,
                    "time": expense.time,
                    "description": expense.concept,
                    "pocket_id": expense.pocket_id,
                    "pocket_name": pocket_name,
                    "category_name": category_name,
                    "fund_id": expense.fund_id,
                    "fund_name": fund_name,
                }
            )

    if kind in (None, "transfer") and not category_id and not fund_id:
        from_pocket = db.query(Pocket).filter(Pocket.user_id == user_id).subquery()
        to_pocket = db.query(Pocket).filter(Pocket.user_id == user_id).subquery()

        q = (
            db.query(
                Transfer,
                from_pocket.c.name.label("from_pocket_name"),
                to_pocket.c.name.label("to_pocket_name"),
            )
            .outerjoin(from_pocket, Transfer.from_pocket_id == from_pocket.c.id)
            .outerjoin(to_pocket, Transfer.to_pocket_id == to_pocket.c.id)
            .filter(Transfer.user_id == user_id)
        )
        if start:
            q = q.filter(Transfer.date >= start)
        if end:
            q = q.filter(Transfer.date <= end)
        if pocket_id:
            q = q.filter(
                (Transfer.from_pocket_id == pocket_id) | (Transfer.to_pocket_id == pocket_id)
            )
        if search:
            q = q.filter(Transfer.description.ilike(f"%{search}%"))
        if min_amount is not None:
            q = q.filter(Transfer.amount >= min_amount)
        if max_amount is not None:
            q = q.filter(Transfer.amount <= max_amount)

        for transfer, from_pocket_name, to_pocket_name in q.all():
            movements.append(
                {
                    "id": transfer.id,
                    "kind": "transfer",
                    "amount": transfer.amount,
                    "date": transfer.date,
                    "description": transfer.description,
                    "from_pocket_name": from_pocket_name,
                    "to_pocket_name": to_pocket_name,
                }
            )

    movements.sort(key=lambda m: (m["date"], m.get("time") or time_type.min), reverse=True)
    return movements
