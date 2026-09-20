import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.transfer import TransferCreate, TransferOut
from app.services import transfer_service

router = APIRouter(prefix="/transfers", tags=["transfers"])


@router.get("", response_model=list[TransferOut])
def list_transfers(
    pocket_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return transfer_service.list_transfers(db, current_user.id, pocket_id)


@router.post("", response_model=TransferOut, status_code=201)
def create_transfer(
    data: TransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return transfer_service.create_transfer(db, current_user.id, data)


@router.delete("/{transfer_id}", status_code=204)
def delete_transfer(
    transfer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transfer_service.delete_transfer(db, current_user.id, transfer_id)
