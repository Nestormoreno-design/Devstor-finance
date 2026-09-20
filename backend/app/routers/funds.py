import time
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.fund import FundCreate, FundOut, FundUpdate
from app.services import fund_service

router = APIRouter(prefix="/funds", tags=["funds"])


@router.get("", response_model=list[FundOut])
def list_funds(
    include_inactive: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    t0 = time.perf_counter()
    print(f"[BACKEND][FUNDS] endpoint start", flush=True)
    t1 = time.perf_counter()
    print(f"[BACKEND][FUNDS] antes de consultar DB", flush=True)
    funds = fund_service.list_funds(db, current_user.id, include_inactive)
    t2 = time.perf_counter()
    print(f"[BACKEND][FUNDS] después de consultar DB", flush=True)
    result = fund_service.funds_to_dict(db, funds)
    t3 = time.perf_counter()
    print(f"[BACKEND][FUNDS] endpoint end total={(t3-t0)*1000:.1f}ms db_query={(t2-t1)*1000:.1f}ms serialize={(t3-t2)*1000:.1f}ms", flush=True)
    return result


@router.post("", response_model=FundOut, status_code=201)
def create_fund(
    data: FundCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fund = fund_service.create_fund(db, current_user.id, data)
    return fund_service.fund_to_dict(db, fund)


@router.get("/{fund_id}", response_model=FundOut)
def get_fund(
    fund_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fund = fund_service.get_owned_fund(db, current_user.id, fund_id)
    return fund_service.fund_to_dict(db, fund)


@router.put("/{fund_id}", response_model=FundOut)
def update_fund(
    fund_id: uuid.UUID,
    data: FundUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fund = fund_service.update_fund(db, current_user.id, fund_id, data)
    return fund_service.fund_to_dict(db, fund)


@router.delete("/{fund_id}", status_code=204)
def delete_fund(
    fund_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fund_service.delete_fund(db, current_user.id, fund_id)


@router.post("/{fund_id}/close", response_model=FundOut)
def close_fund(
    fund_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fund = fund_service.close_fund(db, current_user.id, fund_id)
    return fund_service.fund_to_dict(db, fund)
