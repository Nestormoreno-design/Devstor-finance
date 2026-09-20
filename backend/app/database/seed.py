"""
Crea las categorías por defecto del sistema (user_id = NULL, visibles para
todos los usuarios). Es idempotente: si ya existen, no las duplica.

Uso: python -m app.database.seed
"""

from app.database.session import SessionLocal
from app.models.category import Category

DEFAULT_CATEGORIES = [
    "Alimentación",
    "Transporte",
    "Hogar",
    "Compras",
    "Salud",
    "Entretenimiento",
    "Educación",
    "Servicios",
    "Deudas",
    "Otros",
]


def seed_default_categories():
    db = SessionLocal()
    try:
        existing_names = {
            c.name.lower() for c in db.query(Category).filter(Category.user_id.is_(None)).all()
        }
        created = 0
        for name in DEFAULT_CATEGORIES:
            if name.lower() not in existing_names:
                db.add(Category(user_id=None, name=name))
                created += 1
        db.commit()
        print(f"Categorías por defecto: {created} creadas, {len(DEFAULT_CATEGORIES) - created} ya existían.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_default_categories()
