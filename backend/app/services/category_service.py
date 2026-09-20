import uuid

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate


def list_categories(db: Session, user_id: uuid.UUID) -> list[Category]:
    """Categorías del sistema (user_id NULL) + personalizadas de este usuario."""
    return (
        db.query(Category)
        .filter(or_(Category.user_id.is_(None), Category.user_id == user_id))
        .order_by(Category.user_id.is_(None).desc(), Category.name.asc())
        .all()
    )


def create_category(db: Session, user_id: uuid.UUID, data: CategoryCreate) -> Category:
    existing = (
        db.query(Category)
        .filter(
            or_(Category.user_id.is_(None), Category.user_id == user_id),
            Category.name.ilike(data.name.strip()),
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una categoría con ese nombre",
        )

    category = Category(user_id=user_id, name=data.name.strip())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def category_to_dict(category: Category) -> dict:
    return {
        "id": category.id,
        "name": category.name,
        "is_default": category.user_id is None,
    }


def get_owned_or_default_category(db: Session, user_id: uuid.UUID, category_id: uuid.UUID) -> Category:
    category = (
        db.query(Category)
        .filter(
            Category.id == category_id,
            or_(Category.user_id.is_(None), Category.user_id == user_id),
        )
        .first()
    )
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
    return category
