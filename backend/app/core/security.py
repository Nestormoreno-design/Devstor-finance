from datetime import datetime, timedelta, timezone
from hashlib import sha256
from secrets import token_urlsafe
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

# Usamos bcrypt directo, sin passlib: passlib 1.7.4 (última versión, sin
# mantenimiento desde 2020) intenta leer bcrypt.__about__.__version__ para
# detectar el backend, atributo que bcrypt>=4.1 eliminó. El resultado NO es
# un fallo silencioso ni una caída de rendimiento por request (se dispara
# una sola vez, al primer hash/verify del proceso), pero sí un traceback
# "(trapped) error reading bcrypt version" en cada arranque y una dependencia
# de un paquete abandonado que puede romperse peor con futuras versiones de
# bcrypt. Llamar a bcrypt directamente evita el problema de raíz.
#
# BCRYPT_ROUNDS: medido en este entorno, 12 rounds cuestan ~240ms por
# verificación (CPU puro, sin red) — con 10 rounds baja a ~60ms. 10 sigue
# siendo el mínimo recomendado por OWASP en 2024+; solo súbelo si tu
# amenaza específica lo justifica.
BCRYPT_ROUNDS = 10


def hash_password(plain_password: str) -> str:
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except ValueError:
        # Hash corrupto o con formato inválido en la BD.
        return False


def create_access_token(subject: str, extra_claims: dict[str, Any] | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode: dict[str, Any] = {"sub": subject, "exp": expire}
    if extra_claims:
        to_encode.update(extra_claims)
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None


def create_reset_token() -> str:
    """Token de recuperación aleatorio y criptográficamente seguro (URL-safe)."""
    return token_urlsafe(32)


def hash_reset_token(token: str) -> str:
    """Hash del token para NO almacenar el valor en claro en la base de datos."""
    return sha256(token.encode("utf-8")).hexdigest()