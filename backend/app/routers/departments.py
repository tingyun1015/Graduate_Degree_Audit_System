from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..department_schemas import (
    DepartmentCreateRequest,
    DepartmentResponse,
    DepartmentUpdateRequest,
)
from ..models import Department

router = APIRouter(prefix="/api/departments", tags=["Departments"])


def get_department_or_404(db: Session, dept_id: int) -> Department:
    dept = db.query(Department).filter(Department.dept_id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept


@router.get("", response_model=list[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()


@router.get("/{dept_id}", response_model=DepartmentResponse)
def get_department(dept_id: int, db: Session = Depends(get_db)):
    return get_department_or_404(db, dept_id)


@router.post("", response_model=DepartmentResponse, status_code=201)
def create_department(payload: DepartmentCreateRequest, db: Session = Depends(get_db)):
    existing = db.query(Department).filter(Department.dept_name == payload.dept_name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Department name already exists")
    dept = Department(dept_name=payload.dept_name)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.put("/{dept_id}", response_model=DepartmentResponse)
def update_department(dept_id: int, payload: DepartmentUpdateRequest, db: Session = Depends(get_db)):
    dept = get_department_or_404(db, dept_id)
    dept.dept_name = payload.dept_name
    db.commit()
    db.refresh(dept)
    return dept
