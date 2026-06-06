from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(..., examples=["student001@university.edu.tw"])
    password: str = Field(..., examples=["my_password"])


class LoginResponse(BaseModel):
    success: bool
    message: str
    name: str
    role: str
    id: int


class LoginErrorResponse(BaseModel):
    success: bool
    message: str


class DepartmentInfo(BaseModel):
    id: int
    name: str
    college_name: str


class AdminLoginResponse(BaseModel):
    success: bool
    message: str
    id: int
    name: str
    tag: str
    department_list: list[DepartmentInfo]
