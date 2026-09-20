import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.income import Income
from app.schemas.income import IncomeCreate, IncomeUpdate
from app.services.pocket_service import get_owned_pocket


def create_income(db: Session, user_id: uuid.UUID, data: IncomeCreate) -> Income:
    pocket = get_owned_pocket(db, user_id, data.pocket_id)
    if not pocket.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pueden registrar ingresos en un bolsillo inactivo",
        )

    income = Income(
        user_id=user_id,
        pocket_id=data.pocket_id,
        amount=data.amount,
        type=data.type,
        description=data.description,
        date=data.date,
        time=data.time,
    )
    db.add(income)
    db.commit()
    db.refresh(income)
    return income


def list_income(db: Session, user_id: uuid.UUID, pocket_id: uuid.UUID | None = None) -> list[Income]:
    query = db.query(Income).filter(Income.user_id == user_id)
    if pocket_id:
        query = query.filter(Income.pocket_id == pocket_id)
    return query.order_by(Income.date.desc(), Income.created_at.desc()).all()


def get_owned_income(db: Session, user_id: uuid.UUID, income_id: uuid.UUID) -> Income:
    income = db.query(Income).filter(Income.id == income_id, Income.user_id == user_id).first()
    if income is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingreso no encontrado")
    return income


def update_income(db: Session, user_id: uuid.UUID, income_id: uuid.UUID, data: IncomeUpdate) -> Income:
    income = get_owned_income(db, user_id, income_id)
    updates = data.model_dump(exclude_unset=True)

    if "pocket_id" in updates:
        # Verificamos que el nuevo bolsillo también le pertenezca al usuario.
        get_owned_pocket(db, user_id, updates["pocket_id"])

    for field, value in updates.items():
        setattr(income, field, value)

    db.commit()
    db.refresh(income)
    return income


def delete_income(db: Session, user_id: uuid.UUID, income_id: uuid.UUID) -> None:
    income = get_owned_income(db, user_id, income_id)
    db.delete(income)
    db.commit()
