from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..course_schemas import CourseCreateRequest, CourseResponse, CourseUpdateRequest
from ..database import get_db
from ..models import Course

router = APIRouter(prefix="/api/courses", tags=["Courses"])


def get_course_or_404(db: Session, course_id: int) -> Course:
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.get("", response_model=list[CourseResponse])
def get_courses(name: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Course)
    if name:
        query = query.filter(Course.course_name.ilike(f"%{name}%"))
    return query.all()


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    return get_course_or_404(db, course_id)


@router.post("", response_model=CourseResponse, status_code=201)
def create_course(payload: CourseCreateRequest, db: Session = Depends(get_db)):
    existing = db.query(Course).filter(Course.course_code == payload.course_code).first()
    if existing:
        raise HTTPException(status_code=409, detail="Course code already exists")
    course = Course(**payload.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.put("/{course_id}", response_model=CourseResponse)
def update_course(course_id: int, payload: CourseUpdateRequest, db: Session = Depends(get_db)):
    course = get_course_or_404(db, course_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=204)
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = get_course_or_404(db, course_id)
    db.delete(course)
    db.commit()
