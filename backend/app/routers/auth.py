from time import perf_counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.user import (
    ForgotPasswordRequest,
    PasswordChange,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserOut,
    UserUpdate,
)
from app.services.auth_service import (
    authenticate_user,
    build_token_for_user,
    change_password,
    register_user,
    request_password_reset,
    reset_password,
    update_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    user = register_user(db, data)
    token = build_token_for_user(user)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    t0 = perf_counter()
    print(f"[BACKEND][LOGIN] endpoint start", flush=True)
    t1 = perf_counter()
    print(f"[BACKEND][LOGIN] before user DB query", flush=True)
    user = authenticate_user(db, data)
    t2 = perf_counter()
    print(f"[BACKEND][LOGIN] after user DB query", flush=True)
    t3 = perf_counter()
    print(f"[BACKEND][LOGIN] before JWT creation", flush=True)
    token = build_token_for_user(user)
    t4 = perf_counter()
    print(f"[BACKEND][LOGIN] after JWT creation", flush=True)
    t5 = perf_counter()
    print(f"[BACKEND][LOGIN] endpoint end total={(t5-t0)*1000:.1f}ms", flush=True)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    t0 = perf_counter()
    print(f"[BACKEND][AUTH_ME] endpoint start", flush=True)
    t1 = perf_counter()
    print(f"[BACKEND][AUTH_ME] endpoint end total={(t1-t0)*1000:.1f}ms", flush=True)
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_user(db, current_user.id, data)


@router.put("/me/password", status_code=204)
def change_my_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    change_password(db, current_user.id, data)


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Respuesta SIEMPRE idéntica, exista o no la cuenta (anti-enumeración).
    request_password_reset(db, data.email)
    return {
        "message": (
            "Si existe una cuenta asociada a este correo, recibirás "
            "instrucciones para restablecer tu contraseña."
        )
    }


@router.post("/reset-password")
def reset_my_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    reset_password(db, data.token, data.new_password)
    return {"message": "Tu contraseña se restableció correctamente."}