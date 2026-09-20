import uuid
from datetime import date as date_type
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import case, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.fund import Fund
from app.models.fund_transaction import FundTransaction
from app.schemas.fund import FundCreate, FundUpdate


def get_funds_metrics(db: Session, funds: list[Fund]) -> tuple[dict, dict]:
    """
    Disponible y gastado de TODOS los fondos en UNA sola consulta
    (agregación condicional por fund_id), eliminando el N+1 del listado
    (antes: 2 consultas por fondo).
    """
    ids = [f.id for f in funds]
    available_map: dict = {}
    spent_map: dict = {}
    if not ids:
        return available_map, spent_map

    rows = (
        db.execute(
            select(
                FundTransaction.fund_id.label("fund_id"),
                func.sum(FundTransaction.amount).label("available"),
                func.sum(
                    case(
                        (FundTransaction.type == "expense", FundTransaction.amount),
                        else_=0,
                    )
                ).label("expense_sum"),
            )
            .where(FundTransaction.fund_id.in_(ids))
            .group_by(FundTransaction.fund_id)
        )
        .all()
    )
    for fund_id, available, expense_sum in rows:
        available_map[fund_id] = Decimal(available)
        spent_map[fund_id] = Decimal(expense_sum if expense_sum is not None else 0) * -1
    return available_map, spent_map


def _fund_dict(available: Decimal, spent: Decimal, fund: Fund) -> dict:
    return {
        "id": fund.id,
        "name": fund.name,
        "description": fund.description,
        "assigned_amount": fund.assigned_amount,
        "default_pocket_id": fund.default_pocket_id,
        "start_date": fund.start_date,
        "end_date": fund.end_date,
        "status": fund.status,
        "available": available,
        "spent": spent,
        "utilization_pct": float(spent / fund.assigned_amount * 100) if fund.assigned_amount else 0.0,
    }


def fund_to_dict(db: Session, fund: Fund) -> dict:
    available = get_fund_available(db, fund)
    spent = get_fund_spent(db, fund)
    return _fund_dict(available, spent, fund)


def funds_to_dict(db: Session, funds: list[Fund]) -> list[dict]:
    available_map, spent_map = get_funds_metrics(db, funds)
    return [
        _fund_dict(
            available_map.get(f.id, Decimal("0")),
            spent_map.get(f.id, Decimal("0")),
            f,
        )
        for f in funds
    ]


def get_fund_spent(db: Session, fund: Fund) -> Decimal:
    """Dinero realmente gastado contra el fondo (suma de fund_transactions tipo expense)."""
    total = (
        db.query(func.coalesce(func.sum(-FundTransaction.amount), 0))
        .filter(FundTransaction.fund_id == fund.id, FundTransaction.type == "expense")
        .scalar()
    )
    return Decimal(total)


def get_fund_available(db: Session, fund: Fund) -> Decimal:
    """
    Disponible = suma de todos los fund_transactions del fondo.
    La asignación inicial se registra como un fund_transaction positivo
    (ver create_fund), así que este es el ÚNICO cálculo de disponible —
    igual que el saldo de un bolsillo, nunca se guarda, siempre se deriva.
    """
    total = (
        db.query(func.coalesce(func.sum(FundTransaction.amount), 0))
        .filter(FundTransaction.fund_id == fund.id)
        .scalar()
    )
    return Decimal(total)


def create_fund(db: Session, user_id: uuid.UUID, data: FundCreate) -> Fund:
    if data.default_pocket_id:
        from app.services.pocket_service import get_owned_pocket

        get_owned_pocket(db, user_id, data.default_pocket_id)

    fund = Fund(
        user_id=user_id,
        name=data.name,
        description=data.description,
        assigned_amount=data.assigned_amount,
        default_pocket_id=data.default_pocket_id,
        start_date=data.start_date,
        end_date=data.end_date,
        status="active",
    )
    db.add(fund)
    db.flush()  # necesitamos fund.id antes de crear el fund_transaction

    db.add(
        FundTransaction(
            fund_id=fund.id,
            type="assignment",
            amount=data.assigned_amount,
            date=data.start_date,
            description="Asignación inicial del fondo",
        )
    )
    db.commit()
    db.refresh(fund)
    return fund


def list_funds(db: Session, user_id: uuid.UUID, include_inactive: bool = True) -> list[Fund]:
    query = db.query(Fund).filter(Fund.user_id == user_id)
    if not include_inactive:
        query = query.filter(Fund.status == "active")
    return query.order_by(Fund.created_at.desc()).all()


def get_owned_fund(db: Session, user_id: uuid.UUID, fund_id: uuid.UUID) -> Fund:
    fund = db.query(Fund).filter(Fund.id == fund_id, Fund.user_id == user_id).first()
    if fund is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fondo no encontrado")
    return fund


def update_fund(db: Session, user_id: uuid.UUID, fund_id: uuid.UUID, data: FundUpdate) -> Fund:
    fund = get_owned_fund(db, user_id, fund_id)
    updates = data.model_dump(exclude_unset=True)

    # Un top-up (aumentar el monto asignado) se registra como un
    # fund_transaction nuevo, nunca sobrescribiendo assigned_amount,
    # para no perder el rastro de auditoría.
    if "assigned_amount" in updates:
        new_amount = updates.pop("assigned_amount")
        if new_amount < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El monto asignado debe ser un número positivo",
            )
        # Protección financiera: no se puede bajar el asignado por debajo
        # de lo ya gastado, o el fondo quedaría "negativo" (disponible < 0).
        spent = get_fund_spent(db, fund)
        if new_amount < spent:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El monto asignado no puede ser inferior al monto ya gastado.",
            )
        delta = new_amount - fund.assigned_amount
        if delta != 0:
            db.add(
                FundTransaction(
                    fund_id=fund.id,
                    type="top_up" if delta > 0 else "adjustment",
                    amount=delta,
                    date=date_type.today(),
                    description="Ajuste del monto asignado",
                )
            )
        fund.assigned_amount = new_amount

    for field, value in updates.items():
        setattr(fund, field, value)

    db.commit()
    db.refresh(fund)
    return fund


def close_fund(db: Session, user_id: uuid.UUID, fund_id: uuid.UUID) -> Fund:
    fund = get_owned_fund(db, user_id, fund_id)
    fund.status = "closed"
    db.commit()
    db.refresh(fund)
    return fund


def delete_fund(db: Session, user_id: uuid.UUID, fund_id: uuid.UUID) -> None:
    """
    Elimina el fondo de forma segura:
    - Los gastos históricos NUNCA se borran: si algún gasto está etiquetado
      contra este fondo, se le quita la etiqueta (fund_id = NULL) para que
      queden como gastos personales.
    - Los fund_transactions se eliminan en cascada (FK fund_id ON DELETE
      CASCADE) sin dejar registros huérfanos.
    - Toda la operación es transaccional.
    """
    fund = get_owned_fund(db, user_id, fund_id)
    try:
        db.query(Expense).filter(Expense.fund_id == fund.id, Expense.user_id == user_id).update(
            {"fund_id": None}, synchronize_session=False
        )
        # Rompe la cascada fund_transactions.related_expense_id (ON DELETE CASCADE):
        # si no ponemos NULL, borrar el fondo borraría también los gastos que
        # quedaron des-etiquetados, y eso NUNCA debe pasar.
        db.query(FundTransaction).filter(FundTransaction.fund_id == fund.id).update(
            {"related_expense_id": None}, synchronize_session=False
        )
        db.delete(fund)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este fondo no se pudo eliminar debido a movimientos asociados.",
        )


def fund_to_dict(db: Session, fund: Fund) -> dict:
    available = get_fund_available(db, fund)
    spent = get_fund_spent(db, fund)
    return _fund_dict(available, spent, fund)


def funds_to_dict(db: Session, funds: list[Fund]) -> list[dict]:
    available_map, spent_map = get_funds_metrics(db, funds)
    return [
        _fund_dict(
            available_map.get(f.id, Decimal("0")),
            spent_map.get(f.id, Decimal("0")),
            f,
        )
        for f in funds
    ]
