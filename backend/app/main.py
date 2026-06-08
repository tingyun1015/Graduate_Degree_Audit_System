from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import get_db  # noqa: F401

# Import ALL models so SQLAlchemy relationship metadata is fully registered.
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
from .routers import admin, admin_programs, auth, courses, departments, programs, student

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
app.include_router(courses.router)
app.include_router(programs.router)
app.include_router(departments.router)
app.include_router(admin.router)
app.include_router(admin_programs.router)

@app.get("/", tags=["General"])
def read_root():
    return {"message": "Graduate Degree Audit System backend is running"}


@app.get("/health", tags=["General"])
def read_health():
    from sqlalchemy import text
    from .database import engine
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}
