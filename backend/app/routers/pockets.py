import time
import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.pocket import PocketCreate, PocketOut, PocketUpdate
from app.services import pocket_service
from app.services.balance_service import get_total_balance

router = APIRouter(prefix="/pockets", tags=["pockets"])


@router.get("", response_model=list[PocketOut])
def list_pockets(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    t0 = time.perf_counter()
    print(f"[BACKEND][POCKETS] endpoint start", flush=True)
    t1 = time.perf_counter()
    print(f"[BACKEND][POCKETS] antes de consultar DB", flush=True)
    pockets = pocket_service.list_pockets(db, current_user.id, include_inactive)
    t2 = time.perf_counter()
    print(f"[BACKEND][POCKETS] después de consultar DB", flush=True)
    result = pocket_service.pockets_to_dict_with_balance(db, pockets)
    t3 = time.perf_counter()
    print(f"[BACKEND][POCKETS] endpoint end total={(t3-t0)*1000:.1f}ms db_query={(t2-t1)*1000:.1f}ms serialize={(t3-t2)*1000:.1f}ms", flush=True)
    return result


@router.post("", response_model=PocketOut, status_code=201)
def create_pocket(
    data: PocketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pocket = pocket_service.create_pocket(db, current_user.id, data)
    return pocket_service.pocket_to_dict_with_balance(db, pocket)


@router.get("/total", response_model=dict)
def total_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pockets = pocket_service.list_pockets(db, current_user.id, include_inactive=False)
    total: Decimal = get_total_balance(db, pockets)
    return {"total": total}


@router.get("/{pocket_id}", response_model=PocketOut)
def get_pocket(
    pocket_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pocket = pocket_service.get_owned_pocket(db, current_user.id, pocket_id)
    return pocket_service.pocket_to_dict_with_balance(db, pocket)


@router.put("/{pocket_id}", response_model=PocketOut)
def update_pocket(
    pocket_id: uuid.UUID,
    data: PocketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pocket = pocket_service.update_pocket(db, current_user.id, pocket_id, data)
    return pocket_service.pocket_to_dict_with_balance(db, pocket)


@router.delete("/{pocket_id}", status_code=204)
def delete_pocket(
    pocket_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pocket_service.delete_pocket(db, current_user.id, pocket_id)
