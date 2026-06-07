from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from .database import get_db
from .models import Staff, User


def require_admin(user_id: int, db: Session = Depends(get_db)) -> Staff:
    """Resolve `user_id` to a Staff record, rejecting non-admin callers."""
    user = (
        db.query(User)
        .options(selectinload(User.staff))
        .filter(User.user_id == user_id)
        .first()
    )
    if not user or user.role != "staff" or not user.staff:
        raise HTTPException(status_code=403, detail="需要管理員權限")
    return user.staff
