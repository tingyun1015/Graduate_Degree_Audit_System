from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .database import Base, engine, get_db  # noqa: F401

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
from .routers import auth, student

app = FastAPI(
    title="Graduate Degree Audit System API",
    description="API for verifying academic requirements for graduation.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(student.router)


@app.on_event("startup")
def on_startup() -> None:
    """Create all tables on first run (development convenience)."""
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        # Keep existing local databases usable without a full migration setup.
        connection.execute(
            text(
                "ALTER TABLE users "
                "ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)"
            )
        )


@app.get("/", tags=["General"])
def read_root():
    return {"message": "Graduate Degree Audit System backend is running"}


@app.get("/health", tags=["General"])
def read_health():
    from sqlalchemy.orm import Session
    from .database import engine
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}
