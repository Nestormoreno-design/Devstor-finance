import time
import uuid
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.dashboard import MovementOut
from app.services.history_service import get_history

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=list[MovementOut])
def history(
    start_date: date | None = None,
    end_date: date | None = None,
    kind: str | None = None,
    pocket_id: uuid.UUID | None = None,
    category_id: uuid.UUID | None = None,
    fund_id: uuid.UUID | None = None,
    search: str | None = None,
    min_amount: Decimal | None = None,
    max_amount: Decimal | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    t0 = time.perf_counter()
    print(f"[BACKEND][HISTORY] endpoint start", flush=True)
    t1 = time.perf_counter()
    print(f"[BACKEND][HISTORY] antes de consultar DB", flush=True)
    result = get_history(
        db,
        current_user.id,
        start_date,
        end_date,
        kind,
        pocket_id,
        category_id,
        fund_id,
        search,
        min_amount,
        max_amount,
    )
    t2 = time.perf_counter()
    print(f"[BACKEND][HISTORY] después de consultar DB", flush=True)
    t3 = time.perf_counter()
    print(f"[BACKEND][HISTORY] endpoint end total={(t3-t0)*1000:.1f}ms db_query={(t2-t1)*1000:.1f}ms serialize={(t3-t2)*1000:.1f}ms", flush=True)
    return result
