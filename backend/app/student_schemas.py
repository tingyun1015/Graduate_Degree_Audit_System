from pydantic import BaseModel


<<<<<<< Updated upstream
# ── Audit ─────────────────────────────────────────────────────────────────────

class MissingCourseResponse(BaseModel):
    course_id: int
    course_code: str
=======
class CourseRecordResponse(BaseModel):
    take_id: int
    course_code: str
    course_name: str
    credits: int
    semester: str
    grade: int | None
    is_passed: bool


class StudentCoursesResponse(BaseModel):
    student_id: int
    courses: list[CourseRecordResponse]


class MissingCourseResponse(BaseModel):
    course_id: int
>>>>>>> Stashed changes
    course_name: str
    credits: int


class AuditRuleResponse(BaseModel):
    rule_id: int
    rule_name: str
    rule_type: str
    required_credits: int
<<<<<<< Updated upstream
    earned_credits: int
    remaining_credits: int
=======
    completed_credits: int
    remaining: int
>>>>>>> Stashed changes


class AuditProgramResponse(BaseModel):
    program_id: int
    program_name: str
    program_type: str | None
    can_graduate: bool
    rules: list[AuditRuleResponse]
    missing_courses: list[MissingCourseResponse]


class StudentAuditResponse(BaseModel):
    student_id: int
<<<<<<< Updated upstream
    can_graduate: bool
    programs: list[AuditProgramResponse]


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


# ── Dashboard (existing) ───────────────────────────────────────────────────────

=======
    programs: list[AuditProgramResponse]


>>>>>>> Stashed changes
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
