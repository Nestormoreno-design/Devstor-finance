"""
Migración de rendimiento: índices compuestos (user_id, date) sobre income y
expenses para acelerar las consultas agregadas del dashboard.

Idempotente (CREATE INDEX IF NOT EXISTS), no toca datos ni tablas.
Funciona en PostgreSQL/Supabase y en SQLite (dev/tes}.

Uso:  python -m app.database.migrate_user_date_indexes
"""

from sqlalchemy import text

from app.database.session import engine


def main() -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_income_user_date "
                "ON income (user_id, date)"
            )
        )
        conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_expenses_user_date "
                "ON expenses (user_id, date)"
            )
        )
    print("Índices compuestos (user_id, date) creados correctamente.")


if __name__ == "__main__":
    main()