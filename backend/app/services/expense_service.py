import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.fund_transaction import FundTransaction
from app.schemas.expense import ExpenseCreate, ExpenseUpdate
from app.services.balance_service import get_pocket_balance
from app.services.category_service import get_owned_or_default_category
from app.services.fund_service import get_fund_available, get_owned_fund
from app.services.pocket_service import get_owned_pocket


def _validate_references(db: Session, user_id: uuid.UUID, pocket_id, fund_id, category_id, amount):
    pocket = get_owned_pocket(db, user_id, pocket_id)
    if not pocket.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pueden registrar gastos en un bolsillo inactivo",
        )
    get_owned_or_default_category(db, user_id, category_id)
    if not fund_id:
        return

    fund = get_owned_fund(db, user_id, fund_id)
    if fund.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pueden registrar gastos contra un fondo inactivo o cerrado",
        )

    available = get_fund_available(db, fund)
    if amount > available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"El gasto supera el dinero disponible del fondo. "
                f"Disponible: ${available:,.2f}."
            ),
        )

    pocket_balance = get_pocket_balance(db, pocket)
    if amount > pocket_balance:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Saldo insuficiente en {pocket.name} para registrar este gasto. "
                f"Disponible: ${pocket_balance:,.2f}."
            ),
        )


def create_expense(db: Session, user_id: uuid.UUID, data: ExpenseCreate) -> Expense:
    _validate_references(db, user_id, data.pocket_id, data.fund_id, data.category_id, data.amount)

    expense = Expense(
        user_id=user_id,
        pocket_id=data.pocket_id,
        fund_id=data.fund_id,
        category_id=data.category_id,
        amount=data.amount,
        concept=data.concept,
        date=data.date,
        time=data.time,
    )
    db.add(expense)
    db.flush()  # necesitamos expense.id para el fund_transaction

    if data.fund_id:
        db.add(
            FundTransaction(
                fund_id=data.fund_id,
                type="expense",
                amount=-data.amount,
                related_expense_id=expense.id,
                date=data.date,
                description=data.concept,
            )
        )

    db.commit()
    db.refresh(expense)
    return expense


def list_expenses(
    db: Session, user_id: uuid.UUID, pocket_id: uuid.UUID | None = None, fund_id: uuid.UUID | None = None
) -> list[Expense]:
    query = db.query(Expense).filter(Expense.user_id == user_id)
    if pocket_id:
        query = query.filter(Expense.pocket_id == pocket_id)
    if fund_id:
        query = query.filter(Expense.fund_id == fund_id)
    return query.order_by(Expense.date.desc(), Expense.created_at.desc()).all()


def get_owned_expense(db: Session, user_id: uuid.UUID, expense_id: uuid.UUID) -> Expense:
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user_id).first()
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gasto no encontrado")
    return expense


def _sync_fund_transaction(db: Session, expense: Expense):
    """Mantiene el fund_transaction ligado a este gasto en sincronía con su estado actual."""
    existing = (
        db.query(FundTransaction).filter(FundTransaction.related_expense_id == expense.id).first()
    )

    if expense.fund_id is None:
        if existing:
            db.delete(existing)
        return

    if existing:
        existing.fund_id = expense.fund_id
        existing.amount = -expense.amount
        existing.date = expense.date
        existing.description = expense.concept
    else:
        db.add(
            FundTransaction(
                fund_id=expense.fund_id,
                type="expense",
                amount=-expense.amount,
                related_expense_id=expense.id,
                date=expense.date,
                description=expense.concept,
            )
        )


def update_expense(db: Session, user_id: uuid.UUID, expense_id: uuid.UUID, data: ExpenseUpdate) -> Expense:
    expense = get_owned_expense(db, user_id, expense_id)
    updates = data.model_dump(exclude_unset=True)

    new_pocket_id = updates.get("pocket_id", expense.pocket_id)
    new_fund_id = updates.get("fund_id", expense.fund_id)
    new_category_id = updates.get("category_id", expense.category_id)
    new_amount = updates.get("amount", expense.amount)
    if any(k in updates for k in ("pocket_id", "fund_id", "category_id", "amount")):
        _validate_references(db, user_id, new_pocket_id, new_fund_id, new_category_id, new_amount)

    for field, value in updates.items():
        setattr(expense, field, value)

    _sync_fund_transaction(db, expense)

    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(db: Session, user_id: uuid.UUID, expense_id: uuid.UUID) -> None:
    expense = get_owned_expense(db, user_id, expense_id)
    # ON DELETE CASCADE en fund_transactions.related_expense_id se encarga
    # de borrar el fund_transaction asociado automáticamente.
    db.delete(expense)
    db.commit()
