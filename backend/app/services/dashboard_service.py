import calendar
import uuid
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.expense import Expense
from app.models.income import Income
from app.services import pocket_service
from app.services.balance_service import get_balance_and_count_map


def resolve_period(period: str, custom_start: date | None, custom_end: date | None) -> tuple[date, date]:
    today = date.today()

    if period == "this_week":
        start = today - timedelta(days=today.weekday())
        return start, today
    if period == "this_month":
        return today.replace(day=1), today
    if period == "last_month":
        first_this_month = today.replace(day=1)
        last_day_prev = first_this_month - timedelta(days=1)
        return last_day_prev.replace(day=1), last_day_prev
    if period == "last_3_months":
        return today - timedelta(days=90), today
    if period == "this_year":
        return today.replace(month=1, day=1), today
    if period == "custom":
        if not custom_start or not custom_end:
            raise ValueError("Debes especificar start_date y end_date para el periodo personalizado")
        return custom_start, custom_end

    # Por defecto, este mes.
    return today.replace(day=1), today


def get_dashboard(db: Session, user_id: uuid.UUID, start: date, end: date) -> dict:
    pockets = pocket_service.list_pockets(db, user_id, include_inactive=False)

    # Saldos y conteos en una única consulta agrupada (sin N+1 por bolsillo).
    balances, counts = get_balance_and_count_map(db, pockets)
    total_balance = sum(
        (balances.get(p.id, Decimal("0")) for p in pockets if p.is_active),
        Decimal("0"),
    )

    # Totales del período como subconsultas escalares: se incluyen como columnas
    # de la consulta de categorías (repetidos en cada fila) para no hacer un
    # round trip aparte. Si no hay gastos en el período no vienen filas de
    # categorías y se calculan en una consulta simple.
    income_agg = (
        select(func.coalesce(func.sum(Income.amount), 0))
        .where(Income.user_id == user_id, Income.date >= start, Income.date <= end)
        .scalar_subquery()
    )
    expense_agg = (
        select(func.coalesce(func.sum(Expense.amount), 0))
        .where(Expense.user_id == user_id, Expense.date >= start, Expense.date <= end)
        .scalar_subquery()
    )

    category_rows = (
        db.query(
            Category.name,
            func.sum(Expense.amount).label("cat_total"),
            income_agg.label("period_income"),
            expense_agg.label("period_expense"),
        )
        .join(Expense, Expense.category_id == Category.id)
        .filter(Expense.user_id == user_id, Expense.date >= start, Expense.date <= end)
        .group_by(Category.name)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )

    if category_rows:
        period_income = Decimal(category_rows[0].period_income)
        period_expenses = Decimal(category_rows[0].period_expense)
        expenses_by_category = [
            {"category_name": name, "total": Decimal(total)}
            for name, total, _, _ in category_rows
        ]
    else:
        row = db.execute(select(income_agg.label("income"), expense_agg.label("expense"))).one()
        period_income = Decimal(row.income)
        period_expenses = Decimal(row.expense)
        expenses_by_category = []

    balance = period_income - period_expenses
    savings_rate = float(balance / period_income * 100) if period_income > 0 else 0.0

    pockets_out = pocket_service.pockets_to_dict_with_balance(
        db, pockets, balances=balances, counts=counts
    )

    return {
        "total_balance": total_balance,
        "period_income": period_income,
        "period_expenses": period_expenses,
        "balance": balance,
        "savings_rate": round(savings_rate, 1),
        "pockets": pockets_out,
        "expenses_by_category": expenses_by_category,
    }
