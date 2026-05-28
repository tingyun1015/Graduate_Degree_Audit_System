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
