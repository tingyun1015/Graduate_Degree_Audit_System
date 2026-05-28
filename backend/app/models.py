"""
SQLAlchemy ORM models for the Graduate Degree Audit System.

ER Model → Table mapping:
  User              → users
  Student (IS-A)    → students          (student_id FK → users.user_id)
  Staff   (IS-A)    → staff             (staff_id   FK → users.user_id)
  Department        → departments
  Program           → programs          (dept_id FK → departments.dept_id)
  Course            → courses
  RequirementRule   → requirement_rules (program_id FK → programs.program_id)

  BELONGS_TO  (Student M:1 Department)  → FK on students.dept_id
  ENROLLS_IN  (Student M:N Program)     → enrollments (junction table)
  TAKES       (Student M:N Course)      → takes       (junction table)
  APPLY_ON    (Course  M:N RequirementRule) → course_rules (junction table)
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from .database import Base


# ============================================================
# User  ── generalization base for Student & Staff
# ============================================================
class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # "student" | "staff"  – mirrors the IS-A specialisation in the ER diagram
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # IS-A back-references (at most one of these will be non-None per row)
    student: Mapped[Optional["Student"]] = relationship(
        "Student", back_populates="user", uselist=False
    )
    staff: Mapped[Optional["Staff"]] = relationship(
        "Staff", back_populates="user", uselist=False
    )


# ============================================================
# Student  ── IS-A User
# ============================================================
class Student(Base):
    __tablename__ = "students"

    # PK is also a FK that references users (joined-table inheritance)
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    enrollment_year: Mapped[int] = mapped_column(Integer, nullable=False)
    # e.g. "full_time" / "part_time" – confirm the actual domain values
    type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # BELONGS_TO  (Student M → 1 Department)
    dept_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("departments.dept_id", ondelete="RESTRICT"),
        nullable=False,
    )

    # ── relationships ──────────────────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="student")
    department: Mapped["Department"] = relationship(
        "Department", back_populates="students"
    )
    enrollments: Mapped[list["Enrollment"]] = relationship(
        "Enrollment", back_populates="student", cascade="all, delete-orphan"
    )
    takes: Mapped[list["Takes"]] = relationship(
        "Takes", back_populates="student", cascade="all, delete-orphan"
    )


# ============================================================
# Staff  ── IS-A User
# ============================================================
class Staff(Base):
    __tablename__ = "staff"

    staff_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # ── relationships ──────────────────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="staff")


# ============================================================
# Department
# ============================================================
class Department(Base):
    __tablename__ = "departments"

    dept_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    dept_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    # ── relationships ──────────────────────────────────────
    # BELONGS_TO reverse
    students: Mapped[list["Student"]] = relationship(
        "Student", back_populates="department"
    )
    # DEFINES  (Department 1 → N Program)
    programs: Mapped[list["Program"]] = relationship(
        "Program", back_populates="department"
    )


# ============================================================
# Program
# ============================================================
class Program(Base):
    __tablename__ = "programs"

    program_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    program_name: Mapped[str] = mapped_column(String(200), nullable=False)
    total_credits_required: Mapped[int] = mapped_column(Integer, nullable=False)
    effective_year: Mapped[int] = mapped_column(Integer, nullable=False)
    # e.g. "master" / "phd" / "professional" – confirm the actual domain values
    program_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_published: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # DEFINES FK  (Department 1 → N Program)
    dept_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("departments.dept_id", ondelete="RESTRICT"),
        nullable=False,
    )

    # ── relationships ──────────────────────────────────────
    department: Mapped["Department"] = relationship(
        "Department", back_populates="programs"
    )
    # HAS  (Program 1 → N RequirementRule)
    requirement_rules: Mapped[list["RequirementRule"]] = relationship(
        "RequirementRule",
        back_populates="program",
        cascade="all, delete-orphan",
    )
    # ENROLLS_IN reverse
    enrollments: Mapped[list["Enrollment"]] = relationship(
        "Enrollment", back_populates="program", cascade="all, delete-orphan"
    )


# ============================================================
# Course
# ============================================================
class Course(Base):
    __tablename__ = "courses"

    course_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    course_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    course_name: Mapped[str] = mapped_column(String(200), nullable=False)
    credits: Mapped[int] = mapped_column(Integer, nullable=False)

    # ── relationships ──────────────────────────────────────
    takes: Mapped[list["Takes"]] = relationship(
        "Takes", back_populates="course", cascade="all, delete-orphan"
    )
    # APPLY_ON reverse
    course_rules: Mapped[list["CourseRule"]] = relationship(
        "CourseRule", back_populates="course", cascade="all, delete-orphan"
    )


# ============================================================
# RequirementRule
# ============================================================
class RequirementRule(Base):
    __tablename__ = "requirement_rules"

    rule_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    rule_name: Mapped[str] = mapped_column(String(200), nullable=False)
    # e.g. "required" / "elective" / "thesis" – confirm the actual domain values
    rule_type: Mapped[str] = mapped_column(String(100), nullable=False)
    required_credits: Mapped[int] = mapped_column(Integer, nullable=False)

    # HAS FK  (Program 1 → N RequirementRule)
    program_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("programs.program_id", ondelete="CASCADE"),
        nullable=False,
    )

    # ── relationships ──────────────────────────────────────
    program: Mapped["Program"] = relationship(
        "Program", back_populates="requirement_rules"
    )
    course_rules: Mapped[list["CourseRule"]] = relationship(
        "CourseRule", back_populates="rule", cascade="all, delete-orphan"
    )


# ============================================================
# ENROLLS_IN  ── Student M:N Program  (junction table)
# ============================================================
class Enrollment(Base):
    __tablename__ = "enrollments"

    student_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("students.student_id", ondelete="CASCADE"),
        primary_key=True,
    )
    program_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("programs.program_id", ondelete="CASCADE"),
        primary_key=True,
    )
    # Relationship attribute from the ER diagram
    # True = currently enrolled / active;  False = withdrawn / completed
    is_enrolled: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

    # ── relationships ──────────────────────────────────────
    student: Mapped["Student"] = relationship(
        "Student", back_populates="enrollments"
    )
    program: Mapped["Program"] = relationship(
        "Program", back_populates="enrollments"
    )


# ============================================================
# TAKES  ── Student M:N Course  (junction table)
# ============================================================
class Takes(Base):
    __tablename__ = "takes"

    # Surrogate PK so the same student can retake a course in a different semester
    take_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    student_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("students.student_id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("courses.course_id", ondelete="CASCADE"),
        nullable=False,
    )
    # e.g. "2024-1" / "2024-2"  – semester identifier
    semester: Mapped[str] = mapped_column(String(20), nullable=False)
    # 0–100 integer score; NULL while grade is not yet issued
    grade: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_passed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        # Prevent duplicate records for the same (student, course, semester)
        UniqueConstraint(
            "student_id", "course_id", "semester", name="uq_takes_student_course_sem"
        ),
    )

    # ── relationships ──────────────────────────────────────
    student: Mapped["Student"] = relationship("Student", back_populates="takes")
    course: Mapped["Course"] = relationship("Course", back_populates="takes")


# ============================================================
# APPLY_ON  ── Course M:N RequirementRule  (junction table)
# ============================================================
class CourseRule(Base):
    __tablename__ = "course_rules"

    course_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("courses.course_id", ondelete="CASCADE"),
        primary_key=True,
    )
    rule_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("requirement_rules.rule_id", ondelete="CASCADE"),
        primary_key=True,
    )
    # Relationship attribute from the ER diagram
    # e.g. "required" / "elective" / "substitution"
    identification_type: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )

    # ── relationships ──────────────────────────────────────
    course: Mapped["Course"] = relationship("Course", back_populates="course_rules")
    rule: Mapped["RequirementRule"] = relationship(
        "RequirementRule", back_populates="course_rules"
    )
