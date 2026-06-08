from pydantic import BaseModel


# ── Audit ─────────────────────────────────────────────────────────────────────

class AuditCourseResponse(BaseModel):
    course_id: int
    course_code: str
    course_name: str
    credits: int


class AuditRuleResponse(BaseModel):
    rule_id: int
    rule_name: str
    rule_type: str
    required_credits: int
    earned_credits: int
    remaining_credits: int
    counted_courses: list[AuditCourseResponse]
    planned_courses: list[AuditCourseResponse]
    missing_courses: list[AuditCourseResponse]


class StudentProgramAuditResponse(BaseModel):
    student_id: int
    program_id: int
    program_name: str
    program_type: str | None
    can_graduate: bool
    rules: list[AuditRuleResponse]


# ── Credits summary ────────────────────────────────────────────────────────────

class CreditsSummaryResponse(BaseModel):
    required: int
    elective: int
    general_education: int
    total: int


# ── Courses taken ──────────────────────────────────────────────────────────────

class CourseRecordResponse(BaseModel):
    course_id: int
    course_code: str
    course_name: str
    credits: int
    semester: str
    grade: int | None
    is_passed: bool


# ── Enrollments ────────────────────────────────────────────────────────────────

class EnrollmentItemResponse(BaseModel):
    program_id: int
    program_name: str
    program_type: str | None
    is_enrolled: bool


class EnrollmentCreateRequest(BaseModel):
    student_id: int
    program_id: int


# ── Shared action result (used by every mutating student endpoint) ────────────

class StudentActionResponse(BaseModel):
    success: bool
    message: str


# ── Planned courses ────────────────────────────────────────────────────────────

class PlannedCourseCreateRequest(BaseModel):
    course_id: int


# ── Dashboard (existing) ───────────────────────────────────────────────────────

class StudentInfoResponse(BaseModel):
    degree_type: str
    enrollment_semester: str
    current_year: str
    expected_graduation: str
    current_gpa: float
    total_required_credits: int


class RequirementSubRuleResponse(BaseModel):
    rule_name: str
    earned: int
    required: int


class DashboardProgramResponse(BaseModel):
    program_id: int
    program_name: str
    program_type: str | None
    college_name: str | None
    is_main_major: bool
    sub_rules: list[RequirementSubRuleResponse]


class StudentDashboardAllResponse(BaseModel):
    student_info: StudentInfoResponse
    programs: list[DashboardProgramResponse]


# ── Full graduation audit (all enrolled programs) ──────────────────────────────

class AuditRuleSummaryResponse(BaseModel):
    rule_id: int
    rule_name: str
    rule_type: str
    required_credits: int
    earned_credits: int
    remaining_credits: int


class ProgramAuditSummaryResponse(BaseModel):
    program_id: int
    program_name: str
    program_type: str | None
    can_graduate: bool
    rules: list[AuditRuleSummaryResponse]
    missing_courses: list[AuditCourseResponse]


class StudentAuditResponse(BaseModel):
    student_id: int
    can_graduate: bool
    programs: list[ProgramAuditSummaryResponse]
