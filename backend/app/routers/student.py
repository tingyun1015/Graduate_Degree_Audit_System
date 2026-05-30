from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student
from ..student_dashboard import (
    calculate_current_gpa,
    calculate_current_year_label,
    calculate_expected_graduation,
    format_enrollment_semester,
    get_passed_course_credits,
    is_main_major_program,
    is_university_program,
    normalize_degree_type,
)
from ..student_schemas import (
    DashboardProgramResponse,
    StudentDashboardAllResponse,
    StudentInfoResponse,
)
from ..student_service import (
    build_program_sub_rules,
    get_active_programs,
    get_primary_program,
    get_student_with_related_data,
)

router = APIRouter(prefix="/api/student", tags=["Student"])


def get_student_or_404(db: Session, student_id: int) -> Student:
    student = get_student_with_related_data(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.get("/dashboard-all", response_model=StudentDashboardAllResponse)
def get_student_dashboard_all(student_id: int, db: Session = Depends(get_db)):
    student = get_student_or_404(db, student_id)
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
