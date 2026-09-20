"""
Crea las tablas definidas en app.models directamente desde los modelos.
Uso: python -m app.database.create_tables

Nota: esto es suficiente para el MVP. Cuando el esquema esté más estable,
migraremos a Alembic (ya está en requirements.txt) para versionar cambios
de esquema sin perder datos en producción.
"""

from app.database.base import Base
from app.database.session import engine
import app.models  # noqa: F401  (registra todos los modelos en Base.metadata)


def main():
    Base.metadata.create_all(bind=engine)
    print("Tablas creadas correctamente.")


if __name__ == "__main__":
    main()
