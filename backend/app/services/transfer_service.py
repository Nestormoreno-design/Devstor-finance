import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.transfer import Transfer
from app.schemas.transfer import TransferCreate
from app.services.balance_service import get_pocket_balance
from app.services.pocket_service import get_owned_pocket


def create_transfer(db: Session, user_id: uuid.UUID, data: TransferCreate) -> Transfer:
    from_pocket = get_owned_pocket(db, user_id, data.from_pocket_id)
    to_pocket = get_owned_pocket(db, user_id, data.to_pocket_id)

    if not from_pocket.is_active or not to_pocket.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ambos bolsillos deben estar activos para transferir",
        )

    current_balance = get_pocket_balance(db, from_pocket)
    if data.amount > current_balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Saldo insuficiente en {from_pocket.name} para esta transferencia",
        )

    transfer = Transfer(
        user_id=user_id,
        from_pocket_id=data.from_pocket_id,
        to_pocket_id=data.to_pocket_id,
        amount=data.amount,
        date=data.date,
        description=data.description,
    )
    db.add(transfer)
    db.commit()
    db.refresh(transfer)
    return transfer


def list_transfers(db: Session, user_id: uuid.UUID, pocket_id: uuid.UUID | None = None) -> list[Transfer]:
    query = db.query(Transfer).filter(Transfer.user_id == user_id)
    if pocket_id:
        query = query.filter(
            (Transfer.from_pocket_id == pocket_id) | (Transfer.to_pocket_id == pocket_id)
        )
    return query.order_by(Transfer.date.desc(), Transfer.created_at.desc()).all()


def get_owned_transfer(db: Session, user_id: uuid.UUID, transfer_id: uuid.UUID) -> Transfer:
    transfer = db.query(Transfer).filter(Transfer.id == transfer_id, Transfer.user_id == user_id).first()
    if transfer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transferencia no encontrada")
    return transfer


def delete_transfer(db: Session, user_id: uuid.UUID, transfer_id: uuid.UUID) -> None:
    transfer = get_owned_transfer(db, user_id, transfer_id)
    db.delete(transfer)
    db.commit()
