from pydantic import BaseModel, ConfigDict


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    course_id: int
    course_code: str
    course_name: str
    credits: int


class CourseCreateRequest(BaseModel):
    course_code: str
    course_name: str
    credits: int


class CourseUpdateRequest(BaseModel):
    course_code: str | None = None
    course_name: str | None = None
    credits: int | None = None
