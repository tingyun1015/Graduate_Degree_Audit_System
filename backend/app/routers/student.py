from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Enrollment, Program, Student
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
    AuditProgramResponse,
    AuditRuleResponse,
    CourseRecordResponse,
    CreditsSummaryResponse,
    DashboardProgramResponse,
    EnrollmentCreateRequest,
    EnrollmentItemResponse,
    MissingCourseResponse,
    StudentAuditResponse,
    StudentDashboardAllResponse,
    StudentInfoResponse,
)
from ..student_service import (
    build_program_sub_rules,
    get_active_programs,
    get_primary_program,
    get_student_for_audit,
    get_student_for_courses,
    get_student_with_related_data,
    sum_earned_credits_for_course_ids,
)

router = APIRouter(prefix="/api/v1/students", tags=["Student"])


def get_student_or_404(db, student_id: int, loader=get_student_with_related_data):
    student = loader(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


# ── Dashboard ──────────────────────────────────────────────────────────────────

@router.get("/{student_id}/dashboard-all", response_model=StudentDashboardAllResponse)
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


# ── Audit ──────────────────────────────────────────────────────────────────────

@router.get("/{student_id}/audit", response_model=StudentAuditResponse)
def get_student_audit(
    student_id: int, dept_id: int | None = None, db: Session = Depends(get_db)
):
    student = get_student_or_404(db, student_id, loader=get_student_for_audit)
    passed_course_credits = get_passed_course_credits(student)
    passed_course_ids = set(passed_course_credits.keys())
    active_programs = get_active_programs(student)

    if dept_id is not None:
        active_programs = [p for p in active_programs if p.dept_id == dept_id]

    audit_programs: list[AuditProgramResponse] = []
    all_can_graduate = True

    for program in active_programs:
        audit_rules: list[AuditRuleResponse] = []
        missing_courses: list[MissingCourseResponse] = []
        program_can_graduate = True

        for rule in program.requirement_rules:
            rule_course_ids = {cr.course_id for cr in rule.course_rules}
            earned = sum_earned_credits_for_course_ids(passed_course_credits, rule_course_ids)
            remaining = max(0, rule.required_credits - earned)

            if remaining > 0:
                program_can_graduate = False

            if rule.rule_type == "required":
                for cr in rule.course_rules:
                    if cr.course_id not in passed_course_ids and cr.course:
                        missing_courses.append(
                            MissingCourseResponse(
                                course_id=cr.course.course_id,
                                course_code=cr.course.course_code,
                                course_name=cr.course.course_name,
                                credits=cr.course.credits,
                            )
                        )

            audit_rules.append(
                AuditRuleResponse(
                    rule_id=rule.rule_id,
                    rule_name=rule.rule_name,
                    rule_type=rule.rule_type,
                    required_credits=rule.required_credits,
                    earned_credits=earned,
                    remaining_credits=remaining,
                )
            )

        if not program_can_graduate:
            all_can_graduate = False

        audit_programs.append(
            AuditProgramResponse(
                program_id=program.program_id,
                program_name=program.program_name,
                program_type=program.program_type,
                can_graduate=program_can_graduate,
                rules=audit_rules,
                missing_courses=missing_courses,
            )
        )

    return StudentAuditResponse(
        student_id=student_id,
        can_graduate=all_can_graduate,
        programs=audit_programs,
    )


# ── Credits summary ────────────────────────────────────────────────────────────

@router.get("/{student_id}/credits/summary", response_model=CreditsSummaryResponse)
def get_credits_summary(student_id: int, db: Session = Depends(get_db)):
    student = get_student_or_404(db, student_id)
    passed_course_credits = get_passed_course_credits(student)
    active_programs = get_active_programs(student)

    required = 0
    elective = 0
    general_education = 0

    for program in active_programs:
        for rule in program.requirement_rules:
            rule_course_ids = {cr.course_id for cr in rule.course_rules}
            earned = sum_earned_credits_for_course_ids(passed_course_credits, rule_course_ids)
            if is_university_program(program):
                general_education += earned
            elif rule.rule_type == "required":
                required += earned
            else:
                elective += earned

    return CreditsSummaryResponse(
        required=required,
        elective=elective,
        general_education=general_education,
        total=required + elective + general_education,
    )


# ── Courses taken ──────────────────────────────────────────────────────────────

@router.get("/{student_id}/courses", response_model=list[CourseRecordResponse])
def get_student_courses(student_id: int, db: Session = Depends(get_db)):
    student = get_student_or_404(db, student_id, loader=get_student_for_courses)
    return [
        CourseRecordResponse(
            course_id=take.course.course_id,
            course_code=take.course.course_code,
            course_name=take.course.course_name,
            credits=take.course.credits,
            semester=take.semester,
            grade=take.grade,
            is_passed=take.is_passed,
        )
        for take in student.takes
        if take.course
    ]


# ── Enrollments ────────────────────────────────────────────────────────────────

@router.get("/{student_id}/enrollments", response_model=list[EnrollmentItemResponse])
def get_student_enrollments(student_id: int, db: Session = Depends(get_db)):
    student = get_student_or_404(db, student_id)
    return [
        EnrollmentItemResponse(
            program_id=e.program_id,
            program_name=e.program.program_name,
            program_type=e.program.program_type,
            is_enrolled=e.is_enrolled,
        )
        for e in student.enrollments
        if e.program
    ]


@router.post("/{student_id}/enrollments", response_model=EnrollmentItemResponse, status_code=201)
def add_enrollment(student_id: int, payload: EnrollmentCreateRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    program = db.query(Program).filter(Program.program_id == payload.program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.student_id == student_id,
            Enrollment.program_id == payload.program_id,
        )
        .first()
    )
    if existing:
        if existing.is_enrolled:
            raise HTTPException(status_code=409, detail="Already enrolled in this program")
        existing.is_enrolled = True
        db.commit()
    else:
        db.add(Enrollment(
            student_id=student_id,
            program_id=payload.program_id,
            is_enrolled=True,
        ))
        db.commit()

    return EnrollmentItemResponse(
        program_id=program.program_id,
        program_name=program.program_name,
        program_type=program.program_type,
        is_enrolled=True,
    )


@router.delete("/{student_id}/enrollments/{program_id}")
def remove_enrollment(student_id: int, program_id: int, db: Session = Depends(get_db)):
    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.student_id == student_id,
            Enrollment.program_id == program_id,
        )
        .first()
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    enrollment.is_enrolled = False
    db.commit()
    return {"success": True, "message": "已退出 Program"}
