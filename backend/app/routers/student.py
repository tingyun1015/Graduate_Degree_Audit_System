from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Course, Enrollment, Program, Student, Takes
from ..student_dashboard import (
    calculate_current_gpa,
    calculate_current_year_label,
    calculate_expected_graduation,
    format_enrollment_semester,
    get_passed_course_credits,
    infer_planned_course_semester,
    is_main_major_program,
    is_university_program,
    normalize_degree_type,
)
from ..student_schemas import (
    AuditCourseResponse,
    AuditRuleResponse,
    AuditRuleSummaryResponse,
    CourseRecordResponse,
    CreditsSummaryResponse,
    DashboardProgramResponse,
    EnrollmentCreateRequest,
    EnrollmentItemResponse,
    PlannedCourseCreateRequest,
    ProgramAuditSummaryResponse,
    StudentActionResponse,
    StudentAuditResponse,
    StudentDashboardAllResponse,
    StudentInfoResponse,
    StudentProgramAuditResponse,
)
from ..student_service import (
    build_program_sub_rules,
    get_active_programs,
    get_planned_programs,
    get_primary_program,
    get_student_with_audit_data,
    get_student_with_related_data,
)

router = APIRouter(prefix="/api/student", tags=["Student"])


def get_student_or_404(db: Session, student_id: int) -> Student:
    student = get_student_with_related_data(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


# ── Dashboard ──────────────────────────────────────────────────────────────────

@router.get("/dashboard-all", response_model=StudentDashboardAllResponse)
def get_student_dashboard_all(student_id: int, db: Session = Depends(get_db)):
    student = get_student_or_404(db, student_id)
    active_programs = get_active_programs(student)
    planned_programs = get_planned_programs(student)
    primary_program = get_primary_program(student, active_programs)
    passed_course_credits = get_passed_course_credits(student)
    degree_type = normalize_degree_type(
        primary_program.program_type if primary_program else None
    )

    programs = []
    for program in active_programs + planned_programs:
        sub_rules, _ = build_program_sub_rules(program, passed_course_credits)

        is_main_major = bool(
            is_main_major_program(student, program)
            or (primary_program and program.program_id == primary_program.program_id)
        )
        if is_university_program(program):
            program_type = "University Requirements"
        elif is_main_major:
            program_type = "Main Major"
        elif program in planned_programs:
            program_type = "Planned"
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

@router.get("/audit", response_model=StudentAuditResponse)
def get_student_audit_all(
    student_id: int,
    dept_id: int | None = None,
    db: Session = Depends(get_db),
):
    student = get_student_with_audit_data(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    take_by_course: dict[int, Takes] = {}
    for take in student.takes:
        if not take.course:
            continue
        current = take_by_course.get(take.course_id)
        if current is None or (take.is_passed and not current.is_passed):
            take_by_course[take.course_id] = take

    active_enrollments = [e for e in student.enrollments if e.is_enrolled and e.program]
    if dept_id is not None:
        active_enrollments = [e for e in active_enrollments if e.program.dept_id == dept_id]

    program_summaries: list[ProgramAuditSummaryResponse] = []
    overall_can_graduate = True

    for enrollment in active_enrollments:
        program = enrollment.program
        rules_summary: list[AuditRuleSummaryResponse] = []
        program_can_graduate = True
        missing_courses: list[AuditCourseResponse] = []

        consumed_course_ids = set()
        for rule in program.requirement_rules:
            if rule.rule_type != "free_elective":
                for cr in rule.course_rules:
                    if cr.course and cr.course.course_id in take_by_course:
                        consumed_course_ids.add(cr.course.course_id)

        for rule in program.requirement_rules:
            earned = 0
            if rule.rule_type == "free_elective":
                explicit_course_ids = {cr.course_id for cr in rule.course_rules if cr.course}
                leftover_course_ids = {
                    cid for cid in take_by_course.keys()
                    if cid not in consumed_course_ids and cid not in explicit_course_ids
                }
                all_eval_ids = explicit_course_ids.union(leftover_course_ids)

                for cid in all_eval_ids:
                    take = take_by_course.get(cid)
                    if take and take.is_passed and take.course:
                        earned += take.course.credits
            else:
                for cr in rule.course_rules:
                    course = cr.course
                    if not course:
                        continue
                    take = take_by_course.get(course.course_id)
                    if take and take.is_passed:
                        earned += course.credits
                    elif rule.rule_type in ("required", "core", "elective"):
                        missing_courses.append(
                            AuditCourseResponse(
                                course_id=course.course_id,
                                course_code=course.course_code,
                                course_name=course.course_name,
                                credits=course.credits,
                            )
                        )

            remaining = max(0, rule.required_credits - earned)
            if remaining > 0:
                program_can_graduate = False

            rules_summary.append(
                AuditRuleSummaryResponse(
                    rule_id=rule.rule_id,
                    rule_name=rule.rule_name,
                    rule_type=rule.rule_type,
                    required_credits=rule.required_credits,
                    earned_credits=earned,
                    remaining_credits=remaining,
                )
            )

        if not program_can_graduate:
            overall_can_graduate = False

        program_summaries.append(
            ProgramAuditSummaryResponse(
                program_id=program.program_id,
                program_name=program.program_name,
                program_type=program.program_type,
                can_graduate=program_can_graduate,
                rules=rules_summary,
                missing_courses=missing_courses,
            )
        )

    return StudentAuditResponse(
        student_id=student_id,
        can_graduate=overall_can_graduate,
        programs=program_summaries,
    )


@router.get(
    "/{student_id}/programs/{program_id}/audit",
    response_model=StudentProgramAuditResponse,
)
def get_student_program_audit(
    student_id: int, program_id: int, db: Session = Depends(get_db)
):
    student = get_student_with_audit_data(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    enrollment = next(
        (e for e in student.enrollments if e.program_id == program_id and e.program),
        None,
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Program enrollment not found")

    program = enrollment.program

    # One Takes record per course: a passed attempt wins over a planned one.
    take_by_course: dict[int, Takes] = {}
    for take in student.takes:
        if not take.course:
            continue
        current = take_by_course.get(take.course_id)
        if current is None or (take.is_passed and not current.is_passed):
            take_by_course[take.course_id] = take

    audit_rules: list[AuditRuleResponse] = []
    program_can_graduate = True

    consumed_course_ids = set()
    for rule in program.requirement_rules:
        if rule.rule_type != "free_elective":
            for cr in rule.course_rules:
                if cr.course and cr.course.course_id in take_by_course:
                    consumed_course_ids.add(cr.course.course_id)

    for rule in program.requirement_rules:
        counted_courses: list[AuditCourseResponse] = []
        planned_courses: list[AuditCourseResponse] = []
        missing_courses: list[AuditCourseResponse] = []
        earned = 0

        if rule.rule_type == "free_elective":
            explicit_course_ids = {cr.course_id for cr in rule.course_rules if cr.course}
            leftover_course_ids = {
                cid for cid in take_by_course.keys()
                if cid not in consumed_course_ids and cid not in explicit_course_ids
            }
            all_eval_ids = explicit_course_ids.union(leftover_course_ids)

            for cid in all_eval_ids:
                take = take_by_course.get(cid)
                if take:
                    course = take.course
                else:
                    course = next((cr.course for cr in rule.course_rules if cr.course_id == cid), None)
                
                if not course:
                    continue

                course_response = AuditCourseResponse(
                    course_id=course.course_id,
                    course_code=course.course_code,
                    course_name=course.course_name,
                    credits=course.credits,
                )

                if take and take.is_passed:
                    counted_courses.append(course_response)
                    earned += course.credits
                elif take:
                    planned_courses.append(course_response)
        else:
            for course_rule in rule.course_rules:
                course = course_rule.course
                if not course:
                    continue

                course_response = AuditCourseResponse(
                    course_id=course.course_id,
                    course_code=course.course_code,
                    course_name=course.course_name,
                    credits=course.credits,
                )
                take = take_by_course.get(course.course_id)
                if take and take.is_passed:
                    counted_courses.append(course_response)
                    earned += course.credits
                elif take:
                    planned_courses.append(course_response)
                elif rule.rule_type in ("required", "core", "elective"):
                    missing_courses.append(course_response)

        remaining = max(0, rule.required_credits - earned)
        if remaining > 0:
            program_can_graduate = False

        audit_rules.append(
            AuditRuleResponse(
                rule_id=rule.rule_id,
                rule_name=rule.rule_name,
                rule_type=rule.rule_type,
                required_credits=rule.required_credits,
                earned_credits=earned,
                remaining_credits=remaining,
                counted_courses=counted_courses,
                planned_courses=planned_courses,
                missing_courses=missing_courses,
            )
        )

    active_programs = get_active_programs(student)
    primary_program = get_primary_program(student, active_programs)

    is_main_major = bool(
        is_main_major_program(student, program)
        or (primary_program and program.program_id == primary_program.program_id)
    )

    if is_university_program(program):
        program_type = "University Requirements"
    elif is_main_major:
        program_type = "Main Major"
    elif not enrollment.is_enrolled:
        program_type = "Planned"
    else:
        program_type = program.program_type

    return StudentProgramAuditResponse(
        student_id=student_id,
        program_id=program.program_id,
        program_name=program.program_name,
        program_type=program_type,
        can_graduate=program_can_graduate,
        rules=audit_rules,
    )


# ── Credits summary ────────────────────────────────────────────────────────────

@router.get("/credits/summary", response_model=CreditsSummaryResponse)
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
            earned = sum(
                credits
                for course_id, credits in passed_course_credits.items()
                if course_id in rule_course_ids
            )
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

@router.get("/courses", response_model=list[CourseRecordResponse])
def get_student_courses(student_id: int, db: Session = Depends(get_db)):
    student = get_student_or_404(db, student_id)
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

@router.get("/enrollments", response_model=list[EnrollmentItemResponse])
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


@router.post("/enrollments", response_model=StudentActionResponse, status_code=201)
def add_enrollment(payload: EnrollmentCreateRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    program = db.query(Program).filter(Program.program_id == payload.program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.student_id == payload.student_id,
            Enrollment.program_id == payload.program_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Program already added")

    # Student-initiated enrollments start out as planned (is_enrolled=False);
    # becoming an active enrollment is a separate, non-student-driven step.
    db.add(Enrollment(
        student_id=payload.student_id,
        program_id=payload.program_id,
        is_enrolled=False,
    ))
    db.commit()

    return StudentActionResponse(success=True, message="Enrollment created successfully.")


@router.delete("/enrollments/{program_id}", response_model=StudentActionResponse)
def withdraw_from_program(
    program_id: int,
    student_id: int,
    db: Session = Depends(get_db),
):
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
    return StudentActionResponse(success=True, message="已退出 Program")


@router.delete("/{student_id}/programs/{program_id}", response_model=StudentActionResponse)
def remove_planned_program(student_id: int, program_id: int, db: Session = Depends(get_db)):
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

    if enrollment.is_enrolled:
        raise HTTPException(status_code=400, detail="Cannot delete an active enrollment")

    db.delete(enrollment)
    db.commit()
    return StudentActionResponse(success=True, message="Program enrollment deleted successfully.")


# ── Planned courses ────────────────────────────────────────────────────────────

@router.post("/{student_id}/courses", response_model=StudentActionResponse, status_code=201)
def add_planned_course(
    student_id: int, payload: PlannedCourseCreateRequest, db: Session = Depends(get_db)
):
    student = get_student_or_404(db, student_id)

    course = db.query(Course).filter(Course.course_id == payload.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = (
        db.query(Takes)
        .filter(Takes.student_id == student_id, Takes.course_id == payload.course_id)
        .first()
    )
    if existing:
        if existing.is_passed:
            raise HTTPException(status_code=409, detail="Course already completed")
        raise HTTPException(status_code=409, detail="Course already planned")

    db.add(Takes(
        student_id=student_id,
        course_id=payload.course_id,
        semester=infer_planned_course_semester(),
        is_passed=False,
    ))
    db.commit()
    return StudentActionResponse(success=True, message="Planned course added successfully.")


@router.delete("/{student_id}/courses/{course_id}", response_model=StudentActionResponse)
def remove_planned_course(student_id: int, course_id: int, db: Session = Depends(get_db)):
    take = (
        db.query(Takes)
        .filter(
            Takes.student_id == student_id,
            Takes.course_id == course_id,
            Takes.is_passed.is_(False),
        )
        .first()
    )
    if not take:
        raise HTTPException(status_code=404, detail="Planned course not found")

    db.delete(take)
    db.commit()
    return StudentActionResponse(success=True, message="Planned course deleted successfully.")
