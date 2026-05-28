from pydantic import BaseModel


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
