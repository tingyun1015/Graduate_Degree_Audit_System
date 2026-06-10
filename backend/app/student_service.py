from sqlalchemy.orm import Session, selectinload

from .models import CourseRule, Enrollment, Program, RequirementRule, Student, Takes
from .student_dashboard import (
    choose_primary_program,
    is_university_program,
)
from .student_schemas import RequirementSubRuleResponse


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


def get_student_with_audit_data(db: Session, student_id: int) -> Student | None:
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

def get_planned_programs(student: Student) -> list[Program]:
    return [
        enrollment.program
        for enrollment in student.enrollments
        if not enrollment.is_enrolled and enrollment.program
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


def get_globally_consumed_course_ids(
    student: Student, take_by_course: dict[int, Takes]
) -> set[int]:
    """Course IDs claimed by a required/core/elective rule in any program
    the student is enrolled in (active or planned).

    Shared across programs so a course already fulfilling a requirement in
    one program isn't also counted as a "leftover" Free Elective in another.
    """
    consumed_course_ids: set[int] = set()
    for enrollment in student.enrollments:
        if not enrollment.program:
            continue
        for rule in enrollment.program.requirement_rules:
            if rule.rule_type == "free_elective":
                continue
            for course_rule in rule.course_rules:
                if course_rule.course and course_rule.course.course_id in take_by_course:
                    consumed_course_ids.add(course_rule.course.course_id)
    return consumed_course_ids


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
