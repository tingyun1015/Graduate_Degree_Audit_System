from datetime import datetime

from pydantic import BaseModel


class UserResponse(BaseModel):
    user_id: int
    email: str
    role: str
    name: str | None
    created_at: datetime


class UserCreateRequest(BaseModel):
    email: str
    password: str
    role: str  # "student" | "staff"
    name: str
    enrollment_year: int | None = None  # student only
    dept_id: int | None = None          # student only


class RoleUpdateRequest(BaseModel):
    role: str


class StaffResponse(BaseModel):
    staff_id: int
    name: str
    email: str
