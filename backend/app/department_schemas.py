from pydantic import BaseModel, ConfigDict


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    dept_id: int
    dept_name: str


class DepartmentCreateRequest(BaseModel):
    dept_name: str


class DepartmentUpdateRequest(BaseModel):
    dept_name: str
