from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from ..admin_deps import require_admin
from ..admin_program_schemas import (
    AdminCourseInRule,
    AdminCourseRuleAddRequest,
    AdminMessageResponse,
    AdminProgramCreateData,
    AdminProgramCreateRequest,
    AdminProgramCreateResponse,
    AdminProgramListData,
    AdminProgramListResponse,
    AdminProgramPublishRequest,
    AdminProgramRequirementsData,
    AdminProgramRequirementsResponse,
    AdminProgramSummary,
    AdminRequirementRule,
    AdminRuleUpdateRequest,
)
from ..database import get_db
from ..models import Course, CourseRule, Department, Program, RequirementRule, Staff

router = APIRouter(prefix="/api/admin", tags=["Admin: Programs"])


# ── Loading helpers ────────────────────────────────────────────────────────────

def _load_program_with_rules(db: Session, program_id: int) -> Program:
    program = (
        db.query(Program)
        .options(
            selectinload(Program.requirement_rules)
            .selectinload(RequirementRule.course_rules)
            .selectinload(CourseRule.course)
        )
        .filter(Program.program_id == program_id)
        .first()
    )
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


def _get_rule_or_404(db: Session, rule_id: int) -> RequirementRule:
    rule = db.query(RequirementRule).filter(RequirementRule.rule_id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


# ── Derived-value bookkeeping ──────────────────────────────────────────────────
# `core` rules don't carry an admin-set credit target: the requirement *is* the
# set of listed courses, so its required_credits mirrors the sum of their
# credits. `elective`/`free_elective` rules keep whatever the admin set via PUT.
# The program total is just the sum of every rule's required_credits, so it
# always reflects the current core/elective/free_elective configuration.

def _sync_and_recompute(program: Program) -> None:
    for rule in program.requirement_rules:
        if rule.rule_type == "core":
            rule.required_credits = sum(
                cr.course.credits for cr in rule.course_rules if cr.course
            )
    program.total_credits_required = sum(
        rule.required_credits for rule in program.requirement_rules
    )


# ── Response builders ──────────────────────────────────────────────────────────

def _program_summary(program: Program) -> AdminProgramSummary:
    return AdminProgramSummary(
        id=program.program_id,
        type=program.program_type,
        title=program.program_name,
        is_published=program.is_published,
    )


def _rule_to_admin_response(rule: RequirementRule) -> AdminRequirementRule:
    courses = None
    required_credits = None
    if rule.rule_type in ("core", "elective"):
        courses = [
            AdminCourseInRule(
                id=cr.course.course_id,
                course_code=cr.course.course_code,
                course_name=cr.course.course_name,
                credits=cr.course.credits,
            )
            for cr in rule.course_rules
            if cr.course
        ]
    if rule.rule_type in ("elective", "free_elective"):
        required_credits = rule.required_credits
    return AdminRequirementRule(
        id=rule.rule_id,
        type=rule.rule_type,
        name=rule.rule_name,
        courses=courses,
        required_credits=required_credits,
    )


def _requirements_response(program: Program, message: str) -> AdminProgramRequirementsResponse:
    return AdminProgramRequirementsResponse(
        success=True,
        message=message,
        data=AdminProgramRequirementsData(
            program=_program_summary(program),
            rules=[_rule_to_admin_response(rule) for rule in program.requirement_rules],
        ),
    )


# ── Program list / create / delete ─────────────────────────────────────────────

@router.get(
    "/departments/{department_id}/programs",
    response_model=AdminProgramListResponse,
)
def list_department_programs(
    department_id: int,
    db: Session = Depends(get_db),
    _admin: Staff = Depends(require_admin),
):
    dept = db.query(Department).filter(Department.dept_id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    programs = db.query(Program).filter(Program.dept_id == department_id).all()
    return AdminProgramListResponse(
        success=True,
        message="Program list retrieved successfully",
        data=AdminProgramListData(programs=[_program_summary(p) for p in programs]),
    )


@router.post(
    "/departments/{department_id}/programs",
    response_model=AdminProgramCreateResponse,
    status_code=201,
)
def create_department_program(
    department_id: int,
    payload: AdminProgramCreateRequest,
    db: Session = Depends(get_db),
    _admin: Staff = Depends(require_admin),
):
    dept = db.query(Department).filter(Department.dept_id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    program = Program(
        program_name=payload.title,
        program_type=payload.type,
        total_credits_required=0,
        effective_year=datetime.now().year,
        is_published=False,
        dept_id=department_id,
    )
    db.add(program)
    db.flush()

    # The admin UI always shows exactly these three requirement categories,
    # and there's no separate "create rule" endpoint, so scaffold them here.
    for rule_type, rule_name in (
        ("core", "Required core"),
        ("elective", "Elective"),
        ("free_elective", "Free Elective"),
    ):
        db.add(RequirementRule(
            rule_name=rule_name,
            rule_type=rule_type,
            required_credits=0,
            program_id=program.program_id,
        ))

    db.commit()
    db.refresh(program)

    return AdminProgramCreateResponse(
        success=True,
        message="Program created successfully",
        data=AdminProgramCreateData(program=_program_summary(program)),
    )


@router.delete("/programs/{program_id}", response_model=AdminMessageResponse)
def delete_admin_program(
    program_id: int,
    db: Session = Depends(get_db),
    _admin: Staff = Depends(require_admin),
):
    program = db.query(Program).filter(Program.program_id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    db.delete(program)
    db.commit()
    return AdminMessageResponse(success=True, message="Program deleted successfully")


# ── Publish toggle ─────────────────────────────────────────────────────────────

@router.put("/programs/{program_id}/publish", response_model=AdminProgramCreateResponse)
def set_program_published(
    program_id: int,
    payload: AdminProgramPublishRequest,
    db: Session = Depends(get_db),
    _admin: Staff = Depends(require_admin),
):
    program = db.query(Program).filter(Program.program_id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    program.is_published = payload.is_published
    db.commit()
    db.refresh(program)

    return AdminProgramCreateResponse(
        success=True,
        message="Program publish status updated successfully",
        data=AdminProgramCreateData(program=_program_summary(program)),
    )


# ── Requirements / rules ───────────────────────────────────────────────────────

@router.get(
    "/programs/{program_id}/requirements",
    response_model=AdminProgramRequirementsResponse,
)
def get_admin_program_requirements(
    program_id: int,
    db: Session = Depends(get_db),
    _admin: Staff = Depends(require_admin),
):
    program = _load_program_with_rules(db, program_id)
    return _requirements_response(program, "Program requirements retrieved successfully")


@router.put("/programs/{rule_id}", response_model=AdminProgramRequirementsResponse)
def update_program_rule(
    rule_id: int,
    payload: AdminRuleUpdateRequest,
    db: Session = Depends(get_db),
    _admin: Staff = Depends(require_admin),
):
    rule = _get_rule_or_404(db, rule_id)
    if rule.rule_type == "core":
        raise HTTPException(
            status_code=400,
            detail="Core rule credits are automatically calculated from courses and cannot be edited directly",
        )

    rule.required_credits = payload.required_credits
    db.flush()

    program = _load_program_with_rules(db, rule.program_id)
    _sync_and_recompute(program)
    db.commit()

    program = _load_program_with_rules(db, program.program_id)
    return _requirements_response(program, "Rule updated successfully")


@router.post(
    "/programs/{rule_id}/courses",
    response_model=AdminProgramRequirementsResponse,
    status_code=201,
)
def add_course_to_program_rule(
    rule_id: int,
    payload: AdminCourseRuleAddRequest,
    db: Session = Depends(get_db),
    _admin: Staff = Depends(require_admin),
):
    rule = _get_rule_or_404(db, rule_id)
    if rule.rule_type not in ("core", "elective"):
        raise HTTPException(
            status_code=400,
            detail="Courses can only be added to core or elective rules",
        )

    course = db.query(Course).filter(Course.course_id == payload.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = (
        db.query(CourseRule)
        .filter(CourseRule.rule_id == rule_id, CourseRule.course_id == payload.course_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Course already in this rule")

    db.add(CourseRule(course_id=payload.course_id, rule_id=rule_id))
    db.flush()

    program = _load_program_with_rules(db, rule.program_id)
    _sync_and_recompute(program)
    db.commit()

    program = _load_program_with_rules(db, program.program_id)
    return _requirements_response(program, "Course added to rule successfully")


@router.delete(
    "/programs/{rule_id}/course/{course_id}",
    response_model=AdminProgramRequirementsResponse,
)
def remove_course_from_program_rule(
    rule_id: int,
    course_id: int,
    db: Session = Depends(get_db),
    _admin: Staff = Depends(require_admin),
):
    rule = _get_rule_or_404(db, rule_id)
    course_rule = (
        db.query(CourseRule)
        .filter(CourseRule.rule_id == rule_id, CourseRule.course_id == course_id)
        .first()
    )
    if not course_rule:
        raise HTTPException(status_code=404, detail="Course not in this rule")

    db.delete(course_rule)
    db.flush()

    program = _load_program_with_rules(db, rule.program_id)
    _sync_and_recompute(program)
    db.commit()

    program = _load_program_with_rules(db, program.program_id)
    return _requirements_response(program, "Course removed from rule successfully")
