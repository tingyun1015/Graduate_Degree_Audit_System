# API Docs

## Overview

Base URL during local development:

```
http://localhost:8000
```

Swagger UI (interactive):

```
http://localhost:8000/docs
```

### Auth & Identity

- No JWT. After login, store the returned `id` in `sessionStorage` and pass it as `?student_id=` or `?user_id=` on subsequent requests.
- Passwords are currently stored and compared as plain text.

### Error Format

All errors follow FastAPI's standard format:

```json
{ "detail": "error message here" }
```

Common HTTP codes: `400` validation, `401` unauthorized, `404` not found, `409` conflict.

---

## 1. Auth

### POST /api/login

```json
// Request
{ "email": "student001@university.edu.tw", "password": "my_password" }

// 200 OK
{ "success": true, "message": "登入成功", "id": 1, "name": "王小明", "role": "student" }

// 401
{ "success": false, "message": "帳號或密碼錯誤" }
```

> `id` is the student_id or staff_id. Store it and use it for all subsequent API calls.

### POST /api/admin/login

```json
// Request
{ "email": "admin001@university.edu.tw", "password": "admin_password" }

// 200 OK
{
  "success": true,
  "message": "登入成功",
  "id": 2,
  "name": "系統管理員",
  "tag": "staff",
  "department_list": [
    { "id": 1, "name": "College of Information", "college_name": "College of Information" },
    { "id": 2, "name": "College of Communication", "college_name": "College of Communication" }
  ]
}

// 401 — 帳號或密碼錯誤
{ "success": false, "message": "帳號或密碼錯誤" }

// 401 — 非 staff 帳號
{ "success": false, "message": "此帳號無管理員權限" }
```

> `department_list` 回傳系統中所有 department，供 admin 前端篩選使用。

### POST /api/logout

```json
// 200 OK
{ "success": true, "message": "登出成功" }
```

### GET /api/me?user_id=

```json
// 200 OK
{ "user_id": 1, "email": "student001@...", "role": "student", "name": "王小明", "id": 1 }
```

---

## 2. Student

All student endpoints require `?student_id=<id>` as a query parameter.

### GET /api/student/dashboard-all?student_id=

學生儀表板，一次回傳所有基本資訊與修課進度。

```json
// 200 OK
{
  "student_info": {
    "degree_type": "Undergraduate",
    "enrollment_semester": "Sep. 2023",
    "current_year": "3rd year",
    "expected_graduation": "Jun. 2027",
    "current_gpa": 4.02,
    "total_required_credits": 128
  },
  "programs": [
    {
      "program_id": 101,
      "program_name": "General Education",
      "program_type": "University Requirements",
      "college_name": null,
      "is_main_major": false,
      "sub_rules": [
        { "rule_name": "Humanities", "earned": 6, "required": 6 },
        { "rule_name": "Sciences", "earned": 6, "required": 9 }
      ]
    }
  ]
}
```

> - `total_required_credits` comes from the main-major program.
> - `earned` counts passed courses only (`is_passed = true`).
> - Total earned credits = sum of all `sub_rules[].earned`.
> - Non-university programs count = programs where `program_type != "University Requirements"`.

### GET /api/student/audit?student_id=&dept_id=

畢業審查。`dept_id` 選填，傳入時只審查該科系的 program（用於模擬雙主修/輔系）。

```json
// 200 OK
{
  "student_id": 1,
  "can_graduate": false,
  "programs": [
    {
      "program_id": 102,
      "program_name": "BS Computer Science",
      "program_type": "Main Major",
      "can_graduate": false,
      "rules": [
        {
          "rule_id": 204,
          "rule_name": "Required core",
          "rule_type": "required",
          "required_credits": 35,
          "earned_credits": 32,
          "remaining_credits": 3
        }
      ],
      "missing_courses": [
        { "course_id": 313, "course_code": "CS304", "course_name": "Computer Networks", "credits": 4 }
      ]
    }
  ]
}
```

> - `missing_courses` 只列出 `rule_type = "required"` 且學生尚未通過的課程。
> - `can_graduate`（program level）= 該 program 所有 rule 都滿足。
> - `can_graduate`（top level）= 所有 program 都可畢業。

### GET /api/student/credits/summary?student_id=

已修學分總覽，依類別分組。

```json
// 200 OK
{ "required": 32, "elective": 18, "general_education": 15, "total": 65 }
```

> - `general_education`：University Requirements program 的學分。
> - `required`：其他 program 中 `rule_type = "required"` 的學分。
> - `elective`：其他 program 中 `rule_type = "elective"` 的學分。

### GET /api/student/courses?student_id=

學生修課紀錄清單。

```json
// 200 OK
[
  {
    "course_id": 306,
    "course_code": "CS101",
    "course_name": "Intro to Programming",
    "credits": 4,
    "semester": "2023-1",
    "grade": 93,
    "is_passed": true
  }
]
```

### GET /api/student/enrollments?student_id=

學生已加入的 Program 清單（含退出的）。

```json
// 200 OK
[
  { "program_id": 102, "program_name": "BS Computer Science", "program_type": "Main Major", "is_enrolled": true },
  { "program_id": 103, "program_name": "Advertising", "program_type": "Minor", "is_enrolled": false }
]
```

### POST /api/student/enrollments

加入一個 Program（雙主修／輔系）。

```json
// Request
{ "student_id": 1, "program_id": 103 }

// 201 Created
{ "program_id": 103, "program_name": "Advertising", "program_type": "Minor", "is_enrolled": true }

// 409 — 已加入
{ "detail": "Already enrolled in this program" }
```

### DELETE /api/student/enrollments/{program_id}?student_id=

退出一個 Program（軟刪除，`is_enrolled` 設為 false）。

```json
// 200 OK
{ "success": true, "message": "已退出 Program" }
```

---

## 3. Courses

### GET /api/courses?name=

搜尋課程。`name` 選填，支援部分比對。

```json
// 200 OK
[
  { "course_id": 306, "course_code": "CS101", "course_name": "Intro to Programming", "credits": 4 }
]
```

### GET /api/courses/{course_id}

取得單一課程詳細資訊。

```json
// 200 OK
{ "course_id": 306, "course_code": "CS101", "course_name": "Intro to Programming", "credits": 4 }
```

### POST /api/courses　`Staff`

新增課程。

```json
// Request
{ "course_code": "CS999", "course_name": "New Course", "credits": 3 }

// 201 Created
{ "course_id": 400, "course_code": "CS999", "course_name": "New Course", "credits": 3 }

// 409 — course_code 重複
{ "detail": "Course code already exists" }
```

### PUT /api/courses/{course_id}　`Staff`

修改課程，只傳要改的欄位。

```json
// Request (all fields optional)
{ "course_name": "Updated Name", "credits": 4 }

// 200 OK
{ "course_id": 400, "course_code": "CS999", "course_name": "Updated Name", "credits": 4 }
```

### DELETE /api/courses/{course_id}　`Staff`

刪除課程。回傳 `204 No Content`。

---

## 4. Programs

### GET /api/programs

列出所有 program。

```json
// 200 OK
[
  { "program_id": 102, "program_name": "BS Computer Science", "program_type": "Main Major",
    "total_credits_required": 128, "effective_year": 2023, "is_published": true, "dept_id": 1 }
]
```

### GET /api/programs/{program_id}

Program 詳細資訊（含科系名稱）。

```json
// 200 OK
{
  "program_id": 102, "program_name": "BS Computer Science", "program_type": "Main Major",
  "total_credits_required": 128, "effective_year": 2023, "is_published": true,
  "dept_id": 1, "dept_name": "College of Information"
}
```

### GET /api/programs/{program_id}/requirements

取得該 program 的畢業規定清單。

```json
// 200 OK
[
  { "rule_id": 204, "rule_name": "Required core", "rule_type": "required", "required_credits": 35 },
  { "rule_id": 205, "rule_name": "Elective", "rule_type": "elective", "required_credits": 75 }
]
```

### POST /api/programs　`Admin`

新增 program。

```json
// Request
{ "program_name": "MS Data Science", "total_credits_required": 36,
  "effective_year": 2024, "program_type": "master", "is_published": false, "dept_id": 1 }

// 201 Created — same fields as GET response
```

### PUT /api/programs/{program_id}　`Admin`

修改 program，只傳要改的欄位。

```json
// Request (all fields optional)
{ "is_published": true, "total_credits_required": 40 }

// 200 OK — same fields as GET response
```

### PUT /api/programs/{program_id}/requirements　`Staff`

更新畢業規定（upsert）。有 `rule_id` → 更新現有；無 `rule_id` → 新增。

```json
// Request
{
  "rules": [
    { "rule_id": 204, "rule_name": "Required core", "rule_type": "required", "required_credits": 40 },
    { "rule_id": null, "rule_name": "Thesis", "rule_type": "required", "required_credits": 6 }
  ]
}

// 200 OK — updated rule list
```

---

## 5. Departments

### GET /api/departments

```json
// 200 OK
[ { "dept_id": 1, "dept_name": "College of Information" } ]
```

### GET /api/departments/{dept_id}

```json
// 200 OK
{ "dept_id": 1, "dept_name": "College of Information" }
```

### POST /api/departments　`Admin`

```json
// Request
{ "dept_name": "College of Law" }

// 201 Created
{ "dept_id": 4, "dept_name": "College of Law" }
```

### PUT /api/departments/{dept_id}　`Admin`

```json
// Request
{ "dept_name": "College of Law (Updated)" }

// 200 OK
{ "dept_id": 4, "dept_name": "College of Law (Updated)" }
```

---

## 6. Admin

> 以下 API 目前沒有 middleware 保護，權限需前端自行控制（依 `role` 判斷）。

### GET /api/admin/users

列出所有用戶。

```json
// 200 OK
[
  { "user_id": 1, "email": "student001@...", "role": "student", "name": "王小明", "created_at": "2024-01-01T00:00:00" }
]
```

### POST /api/admin/users

新增用戶（學生或 Staff）。

```json
// Request — student
{ "email": "new@university.edu.tw", "password": "pass", "role": "student",
  "name": "李大華", "enrollment_year": 2024, "dept_id": 1 }

// Request — staff
{ "email": "staff@university.edu.tw", "password": "pass", "role": "staff", "name": "陳老師" }

// 201 Created
{ "user_id": 10, "email": "new@...", "role": "student", "name": "李大華", "created_at": "..." }
```

### PUT /api/admin/users/{user_id}/role

```json
// Request
{ "role": "staff" }

// 200 OK — updated user object
```

### DELETE /api/admin/users/{user_id}

刪除用戶（含 cascade 刪除 student/staff 資料）。回傳 `204 No Content`。

### GET /api/admin/staff

列出所有 Staff。

```json
// 200 OK
[ { "staff_id": 2, "name": "陳老師", "email": "staff@university.edu.tw" } ]
```
