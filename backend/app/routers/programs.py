from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Department, Program, RequirementRule
from ..program_schemas import (
    ProgramCreateRequest,
    ProgramDetailResponse,
    ProgramRequirementsUpdateRequest,
    ProgramResponse,
    ProgramUpdateRequest,
    RequirementRuleResponse,
)

router = APIRouter(prefix="/api/programs", tags=["Programs"])


def get_program_or_404(db: Session, program_id: int) -> Program:
    program = (
        db.query(Program)
        .options(
            selectinload(Program.department),
            selectinload(Program.requirement_rules),
        )
        .filter(Program.program_id == program_id)
        .first()
    )
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


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
    return program.requirement_rules


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
    return result
