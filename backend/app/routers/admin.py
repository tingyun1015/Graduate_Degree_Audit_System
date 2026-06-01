from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from ..admin_schemas import RoleUpdateRequest, StaffResponse, UserCreateRequest, UserResponse
from ..database import get_db
from ..models import Staff, Student, User

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def _user_name(user: User) -> str | None:
    if user.student:
        return user.student.name
    if user.staff:
        return user.staff.name
    return None


def _load_users(db: Session) -> list[User]:
    return (
        db.query(User)
        .options(selectinload(User.student), selectinload(User.staff))
        .all()
    )


@router.get("/users", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return [
        UserResponse(
            user_id=u.user_id,
            email=u.email,
            role=u.role,
            name=_user_name(u),
            created_at=u.created_at,
        )
        for u in _load_users(db)
    ]


@router.post("/users", response_model=UserResponse, status_code=201)
def create_user(payload: UserCreateRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already exists")

    if payload.role == "student" and (
        payload.enrollment_year is None or payload.dept_id is None
    ):
        raise HTTPException(
            status_code=400, detail="enrollment_year and dept_id required for student"
        )

    user = User(email=payload.email, password_hash=payload.password, role=payload.role)
    db.add(user)
    db.flush()

    if payload.role == "student":
        db.add(Student(
            student_id=user.user_id,
            name=payload.name,
            enrollment_year=payload.enrollment_year,
            dept_id=payload.dept_id,
        ))
    elif payload.role == "staff":
        db.add(Staff(staff_id=user.user_id, name=payload.name))

    db.commit()
    db.refresh(user)
    return UserResponse(
        user_id=user.user_id,
        email=user.email,
        role=user.role,
        name=payload.name,
        created_at=user.created_at,
    )


@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(user_id: int, payload: RoleUpdateRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .options(selectinload(User.student), selectinload(User.staff))
        .filter(User.user_id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = payload.role
    db.commit()
    return UserResponse(
        user_id=user.user_id,
        email=user.email,
        role=user.role,
        name=_user_name(user),
        created_at=user.created_at,
    )


@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()


@router.get("/staff", response_model=list[StaffResponse])
def get_staff(db: Session = Depends(get_db)):
    staff_list = (
        db.query(Staff)
        .options(selectinload(Staff.user))
        .all()
    )
    return [
        StaffResponse(
            staff_id=s.staff_id,
            name=s.name,
            email=s.user.email,
        )
        for s in staff_list
    ]
