from sqlalchemy.orm import Session, selectinload

from .models import CourseRule, Enrollment, Program, RequirementRule, Student, Takes
from .student_dashboard import (
    choose_primary_program,
    is_university_program,
)
from .student_schemas import (
    AuditProgramResponse,
    AuditRuleResponse,
    MissingCourseResponse,
    RequirementSubRuleResponse,
)


def get_student_with_related_data(db: Session, student_id: int) -> Student | None:
    return (
        db.query(Student)
        .options(
            selectinload(Student.department),
            selectinload(Student.takes).selectinload(Takes.course),
            selectinload(Student.enrollments)
            .selectinload(Enrollment.program)
            .selectinload(Program.department),
            selectinload(Student.enrollments)
            .selectinload(Enrollment.program)
            .selectinload(Program.requirement_rules)
            .selectinload(RequirementRule.course_rules),
        )
        .filter(Student.student_id == student_id)
        .first()
    )


<<<<<<< Updated upstream
def get_student_with_audit_data(db: Session, student_id: int) -> Student | None:
=======
def get_student_for_courses(db: Session, student_id: int) -> Student | None:
    """Load student with takes + course info for the courses endpoint."""
    return (
        db.query(Student)
        .options(selectinload(Student.takes).selectinload(Takes.course))
        .filter(Student.student_id == student_id)
        .first()
    )


def get_student_for_audit(db: Session, student_id: int) -> Student | None:
    """Load student with all data needed for graduation audit."""
>>>>>>> Stashed changes
    return (
        db.query(Student)
        .options(
            selectinload(Student.takes).selectinload(Takes.course),
            selectinload(Student.enrollments)
            .selectinload(Enrollment.program)
            .selectinload(Program.requirement_rules)
            .selectinload(RequirementRule.course_rules)
            .selectinload(CourseRule.course),
        )
        .filter(Student.student_id == student_id)
        .first()
    )


def get_active_programs(student: Student) -> list[Program]:
    return [
        enrollment.program
        for enrollment in student.enrollments
        if enrollment.is_enrolled and enrollment.program
    ]


def get_primary_program(student: Student, active_programs: list[Program]) -> Program | None:
    return choose_primary_program(student, active_programs)


def get_non_university_programs(active_programs: list[Program]) -> list[Program]:
    return [program for program in active_programs if not is_university_program(program)]


def get_program_course_ids(program: Program) -> set[int]:
    return {
        course_rule.course_id
        for rule in program.requirement_rules
        for course_rule in rule.course_rules
    }


def sum_earned_credits_for_course_ids(
    passed_course_credits: dict[int, int], course_ids: set[int]
) -> int:
    return sum(
        credits
        for course_id, credits in passed_course_credits.items()
        if course_id in course_ids
    )


def build_program_sub_rules(
    program: Program, passed_course_credits: dict[int, int]
) -> tuple[list[RequirementSubRuleResponse], set[int]]:
    sub_rules: list[RequirementSubRuleResponse] = []
    program_course_ids: set[int] = set()

    for rule in program.requirement_rules:
        rule_course_ids = {course_rule.course_id for course_rule in rule.course_rules}
        earned_credits = sum_earned_credits_for_course_ids(
            passed_course_credits, rule_course_ids
        )
        sub_rules.append(
            RequirementSubRuleResponse(
                rule_name=rule.rule_name,
                earned=earned_credits,
                required=rule.required_credits,
            )
        )
        program_course_ids.update(rule_course_ids)

    return sub_rules, program_course_ids


def build_audit_programs(
    student: Student, active_programs: list[Program]
) -> list[AuditProgramResponse]:
    passed_course_ids = {take.course_id for take in student.takes if take.is_passed}
    passed_course_credits = {
        take.course_id: take.course.credits
        for take in student.takes
        if take.is_passed and take.course
    }

    result = []
    for program in active_programs:
        rules_data: list[AuditRuleResponse] = []
        missing_courses: list[MissingCourseResponse] = []
        can_graduate = True

        for rule in program.requirement_rules:
            rule_course_ids = {cr.course_id for cr in rule.course_rules}
            completed_credits = sum_earned_credits_for_course_ids(
                passed_course_credits, rule_course_ids
            )
            remaining = max(0, rule.required_credits - completed_credits)
            if remaining > 0:
                can_graduate = False

            rules_data.append(
                AuditRuleResponse(
                    rule_id=rule.rule_id,
                    rule_name=rule.rule_name,
                    rule_type=rule.rule_type,
                    required_credits=rule.required_credits,
                    completed_credits=completed_credits,
                    remaining=remaining,
                )
            )

            # 只有 required 型的規則才列出缺哪些具體課程
            # elective 規則沒有「必修某門課」，只要學分達標即可
            if rule.rule_type == "required":
                for cr in rule.course_rules:
                    if cr.course_id not in passed_course_ids:
                        missing_courses.append(
                            MissingCourseResponse(
                                course_id=cr.course_id,
                                course_name=cr.course.course_name,
                                credits=cr.course.credits,
                            )
                        )

        result.append(
            AuditProgramResponse(
                program_id=program.program_id,
                program_name=program.program_name,
                program_type=program.program_type,
                can_graduate=can_graduate,
                rules=rules_data,
                missing_courses=missing_courses,
            )
        )

    return result
