import uuid
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.income import Income
from app.models.pocket import Pocket
from app.models.transfer import Transfer
from app.schemas.pocket import PocketCreate, PocketUpdate
from app.services.balance_service import get_balance_and_count_map, get_pocket_balance


def create_pocket(db: Session, user_id: uuid.UUID, data: PocketCreate) -> Pocket:
    pocket = Pocket(
        user_id=user_id,
        name=data.name,
        type=data.type,
        initial_balance=data.initial_balance,
        description=data.description,
    )
    db.add(pocket)
    db.commit()
    db.refresh(pocket)
    return pocket


def list_pockets(db: Session, user_id: uuid.UUID, include_inactive: bool = False) -> list[Pocket]:
    query = db.query(Pocket).filter(Pocket.user_id == user_id)
    if not include_inactive:
        query = query.filter(Pocket.is_active.is_(True))
    return query.order_by(Pocket.created_at.asc()).all()


def get_owned_pocket(db: Session, user_id: uuid.UUID, pocket_id: uuid.UUID) -> Pocket:
    pocket = (
        db.query(Pocket)
        .filter(Pocket.id == pocket_id, Pocket.user_id == user_id)
        .first()
    )
    if pocket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bolsillo no encontrado")
    return pocket


def update_pocket(db: Session, user_id: uuid.UUID, pocket_id: uuid.UUID, data: PocketUpdate) -> Pocket:
    pocket = get_owned_pocket(db, user_id, pocket_id)
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(pocket, field, value)
    db.commit()
    db.refresh(pocket)
    return pocket


def count_pocket_movements(db: Session, pocket_id: uuid.UUID) -> int:
    """Movimientos reales de un bolsillo: ingresos + gastos + transferencias (como origen o destino)."""
    incomes = db.query(Income).filter(Income.pocket_id == pocket_id).count()
    expenses = db.query(Expense).filter(Expense.pocket_id == pocket_id).count()
    transfers = (
        db.query(Transfer)
        .filter(
            (Transfer.from_pocket_id == pocket_id) | (Transfer.to_pocket_id == pocket_id)
        )
        .count()
    )
    return incomes + expenses + transfers


def delete_pocket(db: Session, user_id: uuid.UUID, pocket_id: uuid.UUID) -> None:
    """
    Elimina un bolsillo siguiendo reglas de seguridad financiera:

    - Si el saldo es MAYOR que 0 se bloquea la eliminación (tanto desde la API
      como si alguien intenta llamar directamente al endpoint). El saldo se
      calcula con la lógica financiera existente (balance_service), nunca de un
      campo almacenado.
    - Si el saldo es 0, se eliminan de forma transaccional todos sus movimientos
      (ingresos, gastos y transferencias en ambas direcciones) y luego el propio
      bolsillo. O se elimina todo o no se elimina nada.

    Nota: los gastos ligados a un fondo arrastran su fund_transaction (ON DELETE
    CASCADE en related_expense_id), por lo que el "disponible" del fondo se
    restaura coherentemente con el historial borrado.
    """
    pocket = get_owned_pocket(db, user_id, pocket_id)
    balance = get_pocket_balance(db, pocket)

    if balance > 0:
        amount_str = f"{balance:,.2f}"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Este bolsillo no se puede eliminar. El bolsillo todavía tiene "
                f"${amount_str} disponibles. Para eliminarlo, primero debes retirar "
                f"o transferir todo el dinero a otro bolsillo."
            ),
        )

    try:
        db.query(Income).filter(Income.pocket_id == pocket_id).delete(
            synchronize_session=False
        )
        db.query(Expense).filter(Expense.pocket_id == pocket_id).delete(
            synchronize_session=False
        )
        db.query(Transfer).filter(
            (Transfer.from_pocket_id == pocket_id) | (Transfer.to_pocket_id == pocket_id)
        ).delete(synchronize_session=False)
        db.delete(pocket)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este bolsillo tiene movimientos asociados que impiden su eliminación.",
        )


def pocket_to_dict_with_balance(db: Session, pocket: Pocket) -> dict:
    return {
        "id": pocket.id,
        "name": pocket.name,
        "type": pocket.type,
        "initial_balance": pocket.initial_balance,
        "description": pocket.description,
        "is_active": pocket.is_active,
        "balance": get_pocket_balance(db, pocket),
        "movement_count": count_pocket_movements(db, pocket.id),
    }


def pockets_to_dict_with_balance(
    db: Session,
    pockets: list[Pocket],
    balances: dict | None = None,
    counts: dict | None = None,
) -> list[dict]:
    """
    Versión por lote de pocket_to_dict_with_balance: calcula saldos y conteos
    de movimientos para todos los bolsillos con un número fijo de consultas
    (sin N+1) cuando se pasan los mapas precargados (get_balance_map /
    get_movement_count_map) o se calculan aquí.
    """
    if balances is None or counts is None:
        balances, counts = get_balance_and_count_map(db, pockets)

    return [
        {
            "id": pocket.id,
            "name": pocket.name,
            "type": pocket.type,
            "initial_balance": pocket.initial_balance,
            "description": pocket.description,
            "is_active": pocket.is_active,
            "balance": balances.get(pocket.id, Decimal("0")),
            "movement_count": counts.get(pocket.id, 0),
        }
        for pocket in pockets
    ]
