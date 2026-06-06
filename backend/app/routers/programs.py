from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Course, CourseRule, Department, Program, RequirementRule
from ..program_schemas import (
    CourseInRuleResponse,
    CourseRuleAddRequest,
    ProgramCreateRequest,
    ProgramDetailResponse,
    ProgramRequirementsUpdateRequest,
    ProgramResponse,
    ProgramUpdateRequest,
    RequirementRuleResponse,
    RequirementRuleUpdateRequest,
)

router = APIRouter(prefix="/api/programs", tags=["Programs"])


def get_program_or_404(db: Session, program_id: int) -> Program:
    program = (
        db.query(Program)
        .options(
            selectinload(Program.department),
            selectinload(Program.requirement_rules).selectinload(
                RequirementRule.course_rules
            ).selectinload(CourseRule.course),
        )
        .filter(Program.program_id == program_id)
        .first()
    )
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


def get_rule_or_404(db: Session, program_id: int, rule_id: int) -> RequirementRule:
    rule = (
        db.query(RequirementRule)
        .filter(
            RequirementRule.rule_id == rule_id,
            RequirementRule.program_id == program_id,
        )
        .first()
    )
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


def _rule_to_response(rule: RequirementRule) -> RequirementRuleResponse:
    courses = [
        CourseInRuleResponse(
            course_id=cr.course.course_id,
            course_code=cr.course.course_code,
            course_name=cr.course.course_name,
            credits=cr.course.credits,
        )
        for cr in rule.course_rules
    ]
    return RequirementRuleResponse(
        rule_id=rule.rule_id,
        rule_name=rule.rule_name,
        rule_type=rule.rule_type,
        required_credits=rule.required_credits,
        courses=courses,
    )


@router.get("", response_model=list[ProgramResponse])
def get_programs(db: Session = Depends(get_db)):
    return db.query(Program).all()


@router.get("/{program_id}", response_model=ProgramDetailResponse)
def get_program(program_id: int, db: Session = Depends(get_db)):
    program = get_program_or_404(db, program_id)
    return ProgramDetailResponse(
        program_id=program.program_id,
        program_name=program.program_name,
        program_type=program.program_type,
        total_credits_required=program.total_credits_required,
        effective_year=program.effective_year,
        is_published=program.is_published,
        dept_id=program.dept_id,
        dept_name=program.department.dept_name if program.department else None,
    )


@router.get("/{program_id}/requirements", response_model=list[RequirementRuleResponse])
def get_program_requirements(program_id: int, db: Session = Depends(get_db)):
    program = get_program_or_404(db, program_id)
    return [_rule_to_response(r) for r in program.requirement_rules]


@router.post("", response_model=ProgramResponse, status_code=201)
def create_program(payload: ProgramCreateRequest, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.dept_id == payload.dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    program = Program(**payload.model_dump())
    db.add(program)
    db.commit()
    db.refresh(program)
    return program


@router.put("/{program_id}", response_model=ProgramResponse)
def update_program(program_id: int, payload: ProgramUpdateRequest, db: Session = Depends(get_db)):
    program = get_program_or_404(db, program_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(program, field, value)
    db.commit()
    db.refresh(program)
    return program


@router.delete("/{program_id}", status_code=204)
def delete_program(program_id: int, db: Session = Depends(get_db)):
    program = db.query(Program).filter(Program.program_id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    db.delete(program)
    db.commit()


@router.patch("/{program_id}/requirements/{rule_id}", response_model=RequirementRuleResponse)
def update_rule(
    program_id: int,
    rule_id: int,
    payload: RequirementRuleUpdateRequest,
    db: Session = Depends(get_db),
):
    rule = get_rule_or_404(db, program_id, rule_id)
    if payload.required_credits is not None:
        rule.required_credits = payload.required_credits
    if payload.rule_name is not None:
        rule.rule_name = payload.rule_name
    db.commit()
    db.refresh(rule)
    db.expire(rule, ["course_rules"])
    rule = (
        db.query(RequirementRule)
        .options(selectinload(RequirementRule.course_rules).selectinload(CourseRule.course))
        .filter(RequirementRule.rule_id == rule_id)
        .first()
    )
    return _rule_to_response(rule)


@router.post(
    "/{program_id}/requirements/{rule_id}/courses",
    response_model=RequirementRuleResponse,
    status_code=201,
)
def add_course_to_rule(
    program_id: int,
    rule_id: int,
    payload: CourseRuleAddRequest,
    db: Session = Depends(get_db),
):
    get_rule_or_404(db, program_id, rule_id)
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
    db.commit()
    rule = (
        db.query(RequirementRule)
        .options(selectinload(RequirementRule.course_rules).selectinload(CourseRule.course))
        .filter(RequirementRule.rule_id == rule_id)
        .first()
    )
    return _rule_to_response(rule)


@router.delete("/{program_id}/requirements/{rule_id}/courses/{course_id}", status_code=204)
def remove_course_from_rule(
    program_id: int,
    rule_id: int,
    course_id: int,
    db: Session = Depends(get_db),
):
    get_rule_or_404(db, program_id, rule_id)
    cr = (
        db.query(CourseRule)
        .filter(CourseRule.rule_id == rule_id, CourseRule.course_id == course_id)
        .first()
    )
    if not cr:
        raise HTTPException(status_code=404, detail="Course not in this rule")
    db.delete(cr)
    db.commit()


@router.put("/{program_id}/requirements", response_model=list[RequirementRuleResponse])
def update_program_requirements(
    program_id: int,
    payload: ProgramRequirementsUpdateRequest,
    db: Session = Depends(get_db),
):
    program = get_program_or_404(db, program_id)
    result: list[RequirementRule] = []

    for item in payload.rules:
        if item.rule_id is not None:
            rule = (
                db.query(RequirementRule)
                .filter(
                    RequirementRule.rule_id == item.rule_id,
                    RequirementRule.program_id == program_id,
                )
                .first()
            )
            if not rule:
                raise HTTPException(
                    status_code=404, detail=f"Rule {item.rule_id} not found in this program"
                )
            rule.rule_name = item.rule_name
            rule.rule_type = item.rule_type
            rule.required_credits = item.required_credits
        else:
            rule = RequirementRule(
                rule_name=item.rule_name,
                rule_type=item.rule_type,
                required_credits=item.required_credits,
                program_id=program_id,
            )
            db.add(rule)
        result.append(rule)

    db.commit()
    for rule in result:
        db.refresh(rule)
    rule_ids = [r.rule_id for r in result]
    refreshed = (
        db.query(RequirementRule)
        .options(selectinload(RequirementRule.course_rules).selectinload(CourseRule.course))
        .filter(RequirementRule.rule_id.in_(rule_ids))
        .all()
    )
    return [_rule_to_response(r) for r in refreshed]
