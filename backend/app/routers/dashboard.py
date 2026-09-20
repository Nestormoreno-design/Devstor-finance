import time
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardOut
from app.services.dashboard_service import get_dashboard, resolve_period

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardOut)
def dashboard(
    period: str = "this_month",
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    t0 = time.perf_counter()
    print(f"[BACKEND][DASHBOARD] endpoint start", flush=True)
    try:
        start, end = resolve_period(period, start_date, end_date)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    t1 = time.perf_counter()
    print(f"[BACKEND][DASHBOARD] antes de consultar DB", flush=True)
    result = get_dashboard(db, current_user.id, start, end)
    t2 = time.perf_counter()
    print(f"[BACKEND][DASHBOARD] después de consultar DB", flush=True)
    t3 = time.perf_counter()
    print(f"[BACKEND][DASHBOARD] endpoint end total={(t3-t0)*1000:.1f}ms resolve_period={(t1-t0)*1000:.1f}ms db_query={(t2-t1)*1000:.1f}ms serialize={(t3-t2)*1000:.1f}ms", flush=True)
    return result
