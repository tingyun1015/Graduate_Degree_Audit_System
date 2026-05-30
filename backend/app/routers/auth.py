from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import LoginErrorResponse, LoginRequest, LoginResponse

router = APIRouter(prefix="/api", tags=["Auth"])


def build_login_error_response(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "message": message},
    )


@router.post(
    "/login",
    response_model=LoginResponse,
    responses={401: {"model": LoginErrorResponse}},
)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not user.password_hash:
        return build_login_error_response(401, "帳號或密碼錯誤")

    if user.password_hash != payload.password:
        return build_login_error_response(401, "帳號或密碼錯誤")

    if user.role == "student" and user.student:
        user_name = user.student.name
        user_id = user.student.student_id
    elif user.role == "staff" and user.staff:
        user_name = user.staff.name
        user_id = user.staff.staff_id
    else:
        return build_login_error_response(500, "使用者資料不完整")

    return LoginResponse(
        success=True,
        message="登入成功",
        id=user_id,
        name=user_name,
        role=user.role,
    )
