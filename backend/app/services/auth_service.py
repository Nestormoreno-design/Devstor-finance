import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_reset_token,
    hash_password,
    hash_reset_token,
    verify_password,
)
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.schemas.user import PasswordChange, UserCreate, UserLogin, UserUpdate
from app.services.email_service import send_reset_email


def register_user(db: Session, data: UserCreate) -> User:
    username = data.username.strip()
    email = data.email.strip().lower()

    existing_username = (
        db.query(User).filter(func.lower(User.username) == username.lower()).first()
    )
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El nombre de usuario ya está en uso",
        )

    existing_email = db.query(User).filter(func.lower(User.email) == email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta con este correo",
        )

    user = User(
        username=username,
        email=email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, data: UserLogin) -> User:
    from time import perf_counter
    t0 = perf_counter()
    print(f"[BACKEND][LOGIN] authenticate_user start", flush=True)
    username = data.username.strip()
    t1 = perf_counter()
    print(f"[BACKEND][LOGIN] before user DB query", flush=True)
    user = (
        db.query(User).filter(func.lower(User.username) == username.lower()).first()
    )
    t2 = perf_counter()
    print(f"[BACKEND][LOGIN] user DB query total={(t2-t1)*1000:.1f}ms", flush=True)
    t3 = perf_counter()
    print(f"[BACKEND][LOGIN] before password verification", flush=True)
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
        )
    t4 = perf_counter()
    print(f"[BACKEND][LOGIN] password verification total={(t4-t3)*1000:.1f}ms", flush=True)
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta cuenta está desactivada",
        )
    t5 = perf_counter()
    print(f"[BACKEND][LOGIN] authenticate_user end total={(t5-t0)*1000:.1f}ms", flush=True)
    return user


def build_token_for_user(user: User) -> str:
    from time import perf_counter
    t0 = perf_counter()
    print(f"[BACKEND][LOGIN] build_token_for_user start", flush=True)
    token = create_access_token(subject=str(user.id))
    t1 = perf_counter()
    print(f"[BACKEND][LOGIN] build_token_for_user end total={(t1-t0)*1000:.1f}ms", flush=True)
    return token


def update_user(db: Session, user_id: uuid.UUID, data: UserUpdate) -> User:
    """
    Edición de perfil: username, email y nombre completo.
    Solo afecta al usuario autenticado; la sesión (JWT con sub=user.id) se
    mantiene intacta.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    updates = data.model_dump(exclude_unset=True)

    new_username = updates.get("username")
    if new_username is not None:
        new_username = new_username.strip()
        existing = (
            db.query(User)
            .filter(
                func.lower(User.username) == new_username.lower(),
                User.id != user.id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El nombre de usuario ya está en uso",
            )
        user.username = new_username

    new_email = updates.get("email")
    if new_email is not None:
        new_email = new_email.strip().lower()
        existing = (
            db.query(User)
            .filter(
                func.lower(User.email) == new_email,
                User.id != user.id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe una cuenta con este correo",
            )
        user.email = new_email

    if "full_name" in updates:
        user.full_name = updates["full_name"]

    db.commit()
    db.refresh(user)
    return user


def change_password(db: Session, user_id: uuid.UUID, data: PasswordChange) -> None:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La contraseña actual no es correcta",
        )

    user.password_hash = hash_password(data.new_password)
    db.commit()


def request_password_reset(db: Session, email: str) -> str:
    """
    Solicitud de recuperación de contraseña.

    SIEMPRE responde de forma genérica (nunca revela si el correo existe para
    evitar enumeración de cuentas). Si existe el usuario, se genera un token de
    un solo uso con expiración, se guarda solo su hash y se envía el enlace.
    """
    email = (email or "").strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email).first()

    token_value = ""
    if user is not None:
        token_value = create_reset_token()
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.RESET_TOKEN_EXPIRE_MINUTES
        )
        db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=hash_reset_token(token_value),
                expires_at=expires_at,
            )
        )
        db.commit()

        display_name = user.full_name or user.username
        send_reset_email(user.email, token_value, display_name=display_name)

    return token_value


def reset_password(db: Session, token: str, new_password: str) -> None:
    """
    Restablece la contraseña con un token válido.

    - El token debe existir, no estar usado y no haber expirado.
    - Se actualiza SOLO password_hash (nunca texto plano).
    - El token se invalida al usarse (de un solo uso).
    """
    token_hash = hash_reset_token((token or "").strip())
    record = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used_at.is_(None),
        )
        .first()
    )
    # Postgres (TIMESTAMPTZ) devuelve datetime con timezone; SQLite devuelve
    # naive (UTC). Normalizamos para poder comparar de forma portable.
    expires_at = record.expires_at if record is not None else None
    if expires_at is not None and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if record is None or expires_at <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace de recuperación no es válido o ha caducado.",
        )

    user = db.query(User).filter(User.id == record.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace de recuperación no es válido o ha caducado.",
        )

    user.password_hash = hash_password(new_password)
    record.used_at = datetime.now(timezone.utc)
    db.commit()
