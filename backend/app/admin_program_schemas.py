from pydantic import BaseModel


# ── Shared pieces ──────────────────────────────────────────────────────────────

class AdminProgramSummary(BaseModel):
    id: int
    type: str | None
    title: str


class AdminCourseInRule(BaseModel):
    id: int
    course_code: str
    course_name: str
    credits: int


class AdminRequirementRule(BaseModel):
    id: int
    type: str
    name: str
    courses: list[AdminCourseInRule] | None = None
    required_credits: int | None = None


class AdminMessageResponse(BaseModel):
    success: bool
    message: str


# ── Program list ───────────────────────────────────────────────────────────────

class AdminProgramListData(BaseModel):
    programs: list[AdminProgramSummary]


class AdminProgramListResponse(BaseModel):
    success: bool
    message: str
    data: AdminProgramListData


# ── Program create ─────────────────────────────────────────────────────────────

class AdminProgramCreateRequest(BaseModel):
    type: str
    title: str


class AdminProgramCreateData(BaseModel):
    program: AdminProgramSummary


class AdminProgramCreateResponse(BaseModel):
    success: bool
    message: str
    data: AdminProgramCreateData


# ── Program requirements / rules ───────────────────────────────────────────────

class AdminProgramRequirementsData(BaseModel):
    program: AdminProgramSummary
    rules: list[AdminRequirementRule]


class AdminProgramRequirementsResponse(BaseModel):
    success: bool
    message: str
    data: AdminProgramRequirementsData


class AdminRuleUpdateRequest(BaseModel):
    required_credits: int


class AdminCourseRuleAddRequest(BaseModel):
    course_id: int


# ── Publish toggle ─────────────────────────────────────────────────────────────

class AdminProgramPublishRequest(BaseModel):
    is_published: bool
