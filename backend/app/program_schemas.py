from pydantic import BaseModel, ConfigDict


class RequirementRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rule_id: int
    rule_name: str
    rule_type: str
    required_credits: int


class ProgramResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    program_id: int
    program_name: str
    program_type: str | None
    total_credits_required: int
    effective_year: int
    is_published: bool
    dept_id: int


class ProgramDetailResponse(BaseModel):
    program_id: int
    program_name: str
    program_type: str | None
    total_credits_required: int
    effective_year: int
    is_published: bool
    dept_id: int
    dept_name: str | None


class ProgramCreateRequest(BaseModel):
    program_name: str
    total_credits_required: int
    effective_year: int
    program_type: str | None = None
    is_published: bool = False
    dept_id: int


class ProgramUpdateRequest(BaseModel):
    program_name: str | None = None
    total_credits_required: int | None = None
    effective_year: int | None = None
    program_type: str | None = None
    is_published: bool | None = None


class RequirementRuleUpsertItem(BaseModel):
    rule_id: int | None = None  # None = create new
    rule_name: str
    rule_type: str
    required_credits: int


class ProgramRequirementsUpdateRequest(BaseModel):
    rules: list[RequirementRuleUpsertItem]
