"""
Cálculo de saldos. Este es el ÚNICO lugar donde se calcula el saldo de un
bolsillo — ningún router ni ningún otro service debe sumar/restar montos
por su cuenta. Así garantizamos la consistencia que pide la especificación
(punto 7): el saldo nunca se guarda, siempre se deriva de los movimientos.

Una transferencia NUNCA se cuenta como ingreso ni como gasto (punto 29):
vive en su propia tabla y solo mueve dinero entre bolsillos del propio
usuario, así que el patrimonio total no cambia al transferir.

Un gasto con fund_id sigue restando del bolsillo igual que cualquier otro
gasto — el fondo es solo una etiqueta de presupuesto sobre ese mismo
dinero, nunca una fuente de dinero aparte (ver fund_service para el
detalle de cómo se evita la duplicación).
"""

from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.income import Income
from app.models.pocket import Pocket
from app.models.transfer import Transfer


def _sum(db: Session, model, amount_col, **filters) -> Decimal:
    query = db.query(func.coalesce(func.sum(amount_col), 0))
    for field, value in filters.items():
        query = query.filter(getattr(model, field) == value)
    return Decimal(query.scalar())


def get_pocket_balance(db: Session, pocket: Pocket) -> Decimal:
    balance = pocket.initial_balance
    balance += _sum(db, Income, Income.amount, pocket_id=pocket.id)
    balance -= _sum(db, Expense, Expense.amount, pocket_id=pocket.id)
    balance -= _sum(db, Transfer, Transfer.amount, from_pocket_id=pocket.id)
    balance += _sum(db, Transfer, Transfer.amount, to_pocket_id=pocket.id)
    return balance


def get_balance_map(db: Session, pockets: list[Pocket]) -> dict:
    """
    Saldo calculado de TODOS los bolsillos en una ÚNICA consulta (UNION ALL de
    los 4 agregados), en lugar de 4 consultas por bolsillo (N+1) ni tampoco
    4 consultas separadas. Produce exactamente el mismo resultado que
    get_pocket_balance: saldo inicial + ingresos - gastos - trans salientes +
    trans entrantes. Las columnas se etiquetan igual para que PostgreSQL/SQLite
    puedan resolver el UNION sin ambigüedad.
    """
    ids = [p.id for p in pockets]
    balances = {p.id: p.initial_balance for p in pockets}
    if not ids:
        return balances

    income_s = (
        select(Income.pocket_id.label("pocket_id"), func.sum(Income.amount).label("delta"))
        .where(Income.pocket_id.in_(ids))
        .group_by(Income.pocket_id)
    )
    expense_s = (
        select(Expense.pocket_id.label("pocket_id"), (-func.sum(Expense.amount)).label("delta"))
        .where(Expense.pocket_id.in_(ids))
        .group_by(Expense.pocket_id)
    )
    transfer_from_s = (
        select(Transfer.from_pocket_id.label("pocket_id"), (-func.sum(Transfer.amount)).label("delta"))
        .where(Transfer.from_pocket_id.in_(ids))
        .group_by(Transfer.from_pocket_id)
    )
    transfer_to_s = (
        select(Transfer.to_pocket_id.label("pocket_id"), func.sum(Transfer.amount).label("delta"))
        .where(Transfer.to_pocket_id.in_(ids))
        .group_by(Transfer.to_pocket_id)
    )

    query = income_s.union_all(expense_s, transfer_from_s, transfer_to_s)
    for pocket_id, delta in db.execute(query).all():
        balances[pocket_id] += Decimal(delta)
    return balances


def get_balance_and_count_map(db: Session, pockets: list[Pocket]) -> tuple[dict, dict]:
    """
    Saldo + conteo de movimientos de todos los bolsillos en UNA SOLA consulta
    (UNION ALL de los 4 agregados, re-agrupado por bolsillo). Combina lo que
    antes eran dos round-trips (get_balance_map + get_movement_count_map) con
    resultados idénticos.
    """
    ids = [p.id for p in pockets]
    balances = {p.id: p.initial_balance for p in pockets}
    counts = {p.id: 0 for p in pockets}
    if not ids:
        return balances, counts

    income_s = select(
        Income.pocket_id.label("pocket_id"),
        func.sum(Income.amount).label("delta"),
        func.count().label("total"),
    ).where(Income.pocket_id.in_(ids)).group_by(Income.pocket_id)

    expense_s = select(
        Expense.pocket_id.label("pocket_id"),
        (-func.sum(Expense.amount)).label("delta"),
        func.count().label("total"),
    ).where(Expense.pocket_id.in_(ids)).group_by(Expense.pocket_id)

    transfer_from_s = select(
        Transfer.from_pocket_id.label("pocket_id"),
        (-func.sum(Transfer.amount)).label("delta"),
        func.count().label("total"),
    ).where(Transfer.from_pocket_id.in_(ids)).group_by(Transfer.from_pocket_id)

    transfer_to_s = select(
        Transfer.to_pocket_id.label("pocket_id"),
        func.sum(Transfer.amount).label("delta"),
        func.count().label("total"),
    ).where(Transfer.to_pocket_id.in_(ids)).group_by(Transfer.to_pocket_id)

    parts = income_s.union_all(expense_s, transfer_from_s, transfer_to_s).subquery()
    query = select(
        parts.c.pocket_id,
        func.sum(parts.c.delta).label("delta"),
        func.sum(parts.c.total).label("total"),
    ).group_by(parts.c.pocket_id)

    for pocket_id, delta, total in db.execute(query).all():
        balances[pocket_id] += Decimal(delta)
        counts[pocket_id] += total
    return balances, counts


def get_movement_count_map(db: Session, pocket_ids: list) -> dict:
    """
    Cantidad de movimientos por bolsillo (ingresos + gastos + transferencias en
    ambas direcciones) en UNA ÚNICA consulta (UNION ALL de 4 agregados), sin N+1.
    """
    ids = list(pocket_ids)
    counts = {pid: 0 for pid in ids}
    if not ids:
        return counts

    parts = []
    for model, col in ((Income, "pocket_id"), (Expense, "pocket_id")):
        parts.append(
            select(getattr(model, col).label("pocket_id"), func.count().label("total"))
            .where(getattr(model, col).in_(ids))
            .group_by(getattr(model, col))
        )
    for col in ("from_pocket_id", "to_pocket_id"):
        parts.append(
            select(getattr(Transfer, col).label("pocket_id"), func.count().label("total"))
            .where(getattr(Transfer, col).in_(ids))
            .group_by(getattr(Transfer, col))
        )

    query = parts[0].union_all(*parts[1:])
    for pocket_id, total in db.execute(query).all():
        counts[pocket_id] += total
    return counts


def get_total_balance(db: Session, pockets: list[Pocket]) -> Decimal:
    """Patrimonio total = suma de bolsillos activos únicamente (nunca incluye fondos)."""
    balances = get_balance_map(db, pockets)
    total = Decimal("0")
    for pocket in pockets:
        if pocket.is_active:
            total += balances.get(pocket.id, Decimal("0"))
    return total
