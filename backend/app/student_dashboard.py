from datetime import datetime

from .models import Program, Student


def _ordinal(value: int) -> str:
    if 10 <= value % 100 <= 20:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(value % 10, "th")
    return f"{value}{suffix}"


def normalize_degree_type(program_type: str | None) -> str:
    if not program_type:
        return "Undergraduate"

    normalized = program_type.strip().lower()
    if "phd" in normalized or "doctor" in normalized:
        return "Doctoral"
    if "master" in normalized or "graduate" in normalized:
        return "Graduate"
    if "undergrad" in normalized or "bachelor" in normalized:
        return "Undergraduate"
    if "minor" in normalized or "major" in normalized:
        return "Undergraduate"
    return program_type.strip().title()


def is_university_program(program: Program) -> bool:
    fields = " ".join(filter(None, [program.program_name, program.program_type])).lower()
    return "general" in fields or "university" in fields


def is_main_major_program(program: Program) -> bool:
    return (program.program_type or "").strip().lower() == "main major"


def choose_primary_program(student: Student, active_programs: list[Program]) -> Program | None:
    explicit_main_major = next(
        (program for program in active_programs if is_main_major_program(program)),
        None,
    )
    if explicit_main_major:
        return explicit_main_major

    department_match = next(
        (program for program in active_programs if program.dept_id == student.dept_id),
        None,
    )
    if department_match:
        return department_match

    non_university_program = next(
        (program for program in active_programs if not is_university_program(program)),
        None,
    )
    if non_university_program:
        return non_university_program

    return active_programs[0] if active_programs else None


def format_enrollment_semester(enrollment_year: int) -> str:
    return f"Sep. {enrollment_year}"


def calculate_current_year_label(enrollment_year: int) -> str:
    now = datetime.now()
    academic_year = now.year - enrollment_year + (1 if now.month >= 9 else 0)
    return f"{_ordinal(max(academic_year, 1))} year"


def calculate_expected_graduation(enrollment_year: int, degree_type: str) -> str:
    duration_by_degree_type = {
        "Undergraduate": 4,
        "Graduate": 2,
        "Doctoral": 4,
    }
    duration_years = duration_by_degree_type.get(degree_type, 4)
    return f"Jun. {enrollment_year + duration_years}"


def calculate_current_gpa(student: Student) -> float:
    graded_scores = [take.grade for take in student.takes if take.grade is not None]
    if not graded_scores:
        return 0.0

    average_score = sum(graded_scores) / len(graded_scores)
    return round((average_score / 100) * 4.3, 2)


def get_passed_course_credits(student: Student) -> dict[int, int]:
    passed_course_credits: dict[int, int] = {}
    for take in student.takes:
        if take.is_passed and take.course:
            passed_course_credits[take.course_id] = take.course.credits
    return passed_course_credits
