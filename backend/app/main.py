from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from .database import Base, engine, get_db

# Import ALL models so Base.metadata knows about every table before create_all
from .models import (  # noqa: F401
    User,
    Student,
    Staff,
    Department,
    Program,
    Course,
    RequirementRule,
    Enrollment,
    Takes,
    CourseRule,
)


app = FastAPI(
    title="Graduate Degree Audit System API",
    description="API for verifying academic requirements for graduation.",
    version="0.1.0",
)


@app.on_event("startup")
def on_startup() -> None:
    """Create all tables on first run (development convenience)."""
    Base.metadata.create_all(bind=engine)


@app.get("/", tags=["General"])
def read_root():
    return {"message": "Graduate Degree Audit System backend is running"}


@app.get("/health", tags=["General"])
def read_health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}
