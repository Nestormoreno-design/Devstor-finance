"""
Migración segura para agregar la columna `username` a la tabla `users`
sin perder usuarios existentes (compatibilidad de datos).

Estrategia:
1. Agrega `username` como columna (nullable primero) si no existe.
2. Rellena los usuarios existentes generando un username a partir del
   local-part del correo (deduplicado con sufijo numérico si hay colisión).
3. En PostgreSQL aplica NOT NULL + índice único; en SQLite crea el índice
   único (SQLite no permite ALTER COLUMN para NOT NULL en tablas con datos).

Uso:  python -m app.database.migrate_add_username
"""

import re

from sqlalchemy import text

from app.database.session import engine


def _table_exists(conn, name: str) -> bool:
    if engine.dialect.name == "sqlite":
        rows = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name=:n"),
            {"n": name},
        ).all()
        return len(rows) > 0
    # PostgreSQL/Supabase: busca la tabla en el esquema activo (public).
    rows = conn.execute(
        text(
            "SELECT 1 FROM information_schema.tables "
            "WHERE table_name=:n AND table_schema = ANY (current_schemas(false))"
        ),
        {"n": name},
    ).all()
    return len(rows) > 0


def _column_exists(conn, table: str, column: str) -> bool:
    if engine.dialect.name == "sqlite":
        rows = conn.execute(text(f"PRAGMA table_info({table})")).all()
        return any(row[1] == column for row in rows)
    rows = conn.execute(
        text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name=:t AND column_name=:c "
            "AND table_schema = ANY (current_schemas(false))"
        ),
        {"t": table, "c": column},
    ).all()
    return len(rows) > 0


def _sanitize_username(local_part: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9_.-]", "_", local_part or "user").strip("._-")[:80]
    return value or "user"


def main() -> None:
    dialect = engine.dialect.name

    with engine.begin() as conn:
        if not _table_exists(conn, "users"):
            print("La tabla 'users' no existe aún. Crea las tablas primero con "
                  "'python -m app.database.create_tables'.")
            return

        if not _column_exists(conn, "users", "username"):
            conn.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR(80)"))
            print("Columna 'username' agregada.")
        else:
            print("Columna 'username' ya existía.")

        rows = conn.execute(
            text("SELECT id, email FROM users WHERE username IS NULL OR username = ''")
        ).all()

        if rows:
            used = set()

            existing = conn.execute(
                text("SELECT username FROM users WHERE username IS NOT NULL AND username <> ''")
            ).scalars().all()
            used.update(existing)

            for row_id, email in rows:
                local = (email or "").split("@")[0]
                base = _sanitize_username(local).lower()
                candidate = base
                suffix = 2
                while candidate in used:
                    candidate = f"{base}_{suffix}"
                    suffix += 1
                used.add(candidate)
                conn.execute(
                    text("UPDATE users SET username = :u WHERE id = :i"),
                    {"u": candidate, "i": row_id},
                )
            print(f"{len(rows)} usuario(s) existente(s) actualizado(s) con username.")
        else:
            print("No hay usuarios pendientes de asignar username.")

        # Red de seguridad: cualquier fila que siguiera sin username
        # (p.ej. email NULL) recibe un valor único derivado del UUID.
        nulls = conn.execute(
            text("SELECT id FROM users WHERE username IS NULL OR username = ''")
        ).all()
        if nulls:
            have = set(
                conn.execute(
                    text("SELECT username FROM users WHERE username IS NOT NULL")
                ).scalars().all()
            )
            for (row_id,) in nulls:
                candidate = f"user_{str(row_id).replace('-', '')}"
                suffix = 2
                while candidate in have:
                    candidate = f"user_{str(row_id).replace('-', '')}_{suffix}"
                    suffix += 1
                have.add(candidate)
                conn.execute(
                    text("UPDATE users SET username = :u WHERE id = :i"),
                    {"u": candidate, "i": row_id},
                )
            print(f"{len(nulls)} fila(s) sin email fueron asignadas con username.")
        else:
            print("Todas las filas tienen username.")

        if dialect == "postgresql":
            conn.execute(text("ALTER TABLE users ALTER COLUMN username SET NOT NULL"))
            conn.execute(
                text("CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username ON users (username)")
            )
        else:
            conn.execute(
                text("CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username ON users (username)")
            )

    print("Migración de username completada correctamente.")


if __name__ == "__main__":
    main()