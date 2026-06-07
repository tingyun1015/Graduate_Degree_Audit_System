from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Department, User
from ..schemas import AdminLoginResponse, DepartmentInfo, LoginErrorResponse, LoginRequest, LoginResponse

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

    if user.role != "student":
        return build_login_error_response(401, "請使用管理員頁面登入")

    if not user.student:
        return build_login_error_response(500, "使用者資料不完整")

    user_name = user.student.name
    user_id = user.student.student_id

    return LoginResponse(
        success=True,
        message="登入成功",
        id=user_id,
        name=user_name,
        role=user.role,
    )


@router.post(
    "/admin/login",
    response_model=AdminLoginResponse,
    responses={401: {"model": LoginErrorResponse}},
)
def admin_login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not user.password_hash:
        return build_login_error_response(401, "帳號或密碼錯誤")

    if user.password_hash != payload.password:
        return build_login_error_response(401, "帳號或密碼錯誤")

    if user.role != "staff" or not user.staff:
        return build_login_error_response(401, "此帳號無管理員權限")

    departments = db.query(Department).all()
    department_list = [
        DepartmentInfo(id=d.dept_id, name=d.dept_name)
        for d in departments
    ]

    return AdminLoginResponse(
        success=True,
        message="登入成功",
        id=user.staff.staff_id,
        name=user.staff.name,
        tag=user.role,
        department_list=department_list,
    )


@router.post("/logout")
def logout():
    return {"success": True, "message": "登出成功"}


@router.get("/me")
def get_me(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == "student" and user.student:
        name = user.student.name
        profile_id = user.student.student_id
    elif user.role == "staff" and user.staff:
        name = user.staff.name
        profile_id = user.staff.staff_id
    else:
        name = None
        profile_id = user.user_id

    return {
        "user_id": user.user_id,
        "email": user.email,
        "role": user.role,
        "name": name,
        "id": profile_id,
    }
