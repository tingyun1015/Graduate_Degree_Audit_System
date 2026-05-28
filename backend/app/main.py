from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import JSONResponse
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
from .schemas import LoginErrorResponse, LoginRequest, LoginResponse
from .student_dashboard import (
    calculate_current_gpa,
    calculate_current_year_label,
    calculate_expected_graduation,
    format_enrollment_semester,
    get_passed_course_credits,
    is_main_major_program,
    is_university_program,
    normalize_degree_type,
)
from .student_service import (
    build_program_sub_rules,
    get_active_programs,
    get_primary_program,
    get_student_with_related_data,
)
from .student_schemas import (
    DashboardProgramResponse,
    StudentDashboardAllResponse,
    StudentInfoResponse,
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
def read_health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}


def get_student_with_dashboard_data(db: Session, student_id: int) -> Student:
    student = get_student_with_related_data(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


def build_login_error_response(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
        },
    )


@app.post(
    "/api/login",
    response_model=LoginResponse,
    responses={401: {"model": LoginErrorResponse}},
    tags=["Auth"],
)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not user.password_hash:
        return build_login_error_response(401, "帳號或密碼錯誤")

    if user.password_hash != payload.password:
        return build_login_error_response(401, "帳號或密碼錯誤")

    if user.role == "student" and user.student:
        user_name = user.student.name
        user_id = user.student.student_id
    elif user.role == "staff" and user.staff:
        user_name = user.staff.name
        user_id = user.staff.staff_id
    else:
        return build_login_error_response(500, "使用者資料不完整")

    return LoginResponse(
        success=True,
        message="登入成功",
        id=user_id,
        name=user_name,
        role=user.role,
    )


@app.get(
    "/api/student/dashboard-all",
    response_model=StudentDashboardAllResponse,
    tags=["Student"],
)
def get_student_dashboard_all(student_id: int, db: Session = Depends(get_db)):
    student = get_student_with_dashboard_data(db, student_id)
    active_programs = get_active_programs(student)
    primary_program = get_primary_program(student, active_programs)
    passed_course_credits = get_passed_course_credits(student)
    degree_type = normalize_degree_type(
        primary_program.program_type if primary_program else None
    )

    programs = []
    for program in active_programs:
        sub_rules, _ = build_program_sub_rules(program, passed_course_credits)

        is_main_major = bool(
            is_main_major_program(program)
            or (primary_program and program.program_id == primary_program.program_id)
        )
        if is_university_program(program):
            program_type = "University Requirements"
        elif is_main_major:
            program_type = "Main Major"
        else:
            program_type = program.program_type

        programs.append(
            DashboardProgramResponse(
                program_id=program.program_id,
                program_name=program.program_name,
                program_type=program_type,
                college_name=(
                    None
                    if is_university_program(program) or not program.department
                    else f"{program.department.dept_name} - Sep. {program.effective_year}"
                ),
                is_main_major=is_main_major,
                sub_rules=sub_rules,
            )
        )

    return StudentDashboardAllResponse(
        student_info=StudentInfoResponse(
            degree_type=degree_type,
            enrollment_semester=format_enrollment_semester(student.enrollment_year),
            current_year=calculate_current_year_label(student.enrollment_year),
            expected_graduation=calculate_expected_graduation(
                student.enrollment_year, degree_type
            ),
            current_gpa=calculate_current_gpa(student),
            total_required_credits=(
                primary_program.total_credits_required if primary_program else 0
            ),
        ),
        programs=programs,
    )
