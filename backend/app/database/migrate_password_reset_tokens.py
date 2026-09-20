"""
Migración segura para crear la tabla `password_reset_tokens`
(recuperación de contraseña). Idempotente y sin DROP de nada.

Uso:  python -m app.database.migrate_password_reset_tokens
"""

from sqlalchemy import text

from app.database.session import engine


def _table_exists(conn, name: str) -> bool:
    if engine.dialect.name == "sqlite":
        rows = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name=:n"),
            {"n": name},
        ).all()
        return len(rows) > 0
    rows = conn.execute(
        text(
            "SELECT 1 FROM information_schema.tables "
            "WHERE table_name=:n AND table_schema = ANY (current_schemas(false))"
        ),
        {"n": name},
    ).all()
    return len(rows) > 0


def main() -> None:
    dialect = engine.dialect.name

    with engine.begin() as conn:
        if _table_exists(conn, "password_reset_tokens"):
            print("La tabla 'password_reset_tokens' ya existía.")
            return

        if dialect == "sqlite":
            conn.execute(
                text(
                    "CREATE TABLE password_reset_tokens ("
                    "  id CHAR(36) PRIMARY KEY,"
                    "  user_id CHAR(36) NOT NULL REFERENCES users (id) ON DELETE CASCADE,"
                    "  token_hash VARCHAR(64) NOT NULL UNIQUE,"
                    "  expires_at DATETIME NOT NULL,"
                    "  used_at DATETIME,"
                    "  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                    "  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"
                    ")"
                )
            )
            conn.execute(
                text(
                    "CREATE UNIQUE INDEX uq_password_reset_tokens_token_hash "
                    "ON password_reset_tokens (token_hash)"
                )
            )
            conn.execute(
                text(
                    "CREATE INDEX ix_password_reset_tokens_user_id "
                    "ON password_reset_tokens (user_id)"
                )
            )
        else:
            conn.execute(
                text(
                    "CREATE TABLE password_reset_tokens ("
                    "  id UUID PRIMARY KEY,"
                    "  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,"
                    "  token_hash VARCHAR(64) NOT NULL UNIQUE,"
                    "  expires_at TIMESTAMPTZ NOT NULL,"
                    "  used_at TIMESTAMPTZ,"
                    "  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),"
                    "  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()"
                    ")"
                )
            )
            conn.execute(
                text(
                    "CREATE UNIQUE INDEX uq_password_reset_tokens_token_hash "
                    "ON password_reset_tokens (token_hash)"
                )
            )
            conn.execute(
                text(
                    "CREATE INDEX ix_password_reset_tokens_user_id "
                    "ON password_reset_tokens (user_id)"
                )
            )

    print("Tabla 'password_reset_tokens' creada correctamente.")


if __name__ == "__main__":
    main()