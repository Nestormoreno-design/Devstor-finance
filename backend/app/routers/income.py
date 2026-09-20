import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.income import IncomeCreate, IncomeOut, IncomeUpdate
from app.services import income_service

router = APIRouter(prefix="/income", tags=["income"])


@router.get("", response_model=list[IncomeOut])
def list_income(
    pocket_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return income_service.list_income(db, current_user.id, pocket_id)


@router.post("", response_model=IncomeOut, status_code=201)
def create_income(
    data: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return income_service.create_income(db, current_user.id, data)


@router.get("/{income_id}", response_model=IncomeOut)
def get_income(
    income_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return income_service.get_owned_income(db, current_user.id, income_id)


@router.put("/{income_id}", response_model=IncomeOut)
def update_income(
    income_id: uuid.UUID,
    data: IncomeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return income_service.update_income(db, current_user.id, income_id, data)


@router.delete("/{income_id}", status_code=204)
def delete_income(
    income_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    income_service.delete_income(db, current_user.id, income_id)
