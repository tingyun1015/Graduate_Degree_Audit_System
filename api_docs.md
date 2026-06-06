# API Docs

## Overview

Base URL during local development:

```
http://localhost:8000
```

Swagger UI: `http://localhost:8000/docs`

---

## Auth

### POST /api/login

Student login. Staff accounts are rejected (use admin login).

**Request Body**
```json
{ "email": "student001@university.edu.tw", "password": "my_password" }
```

**200 OK**
```json
{ "success": true, "message": "登入成功", "id": 42, "name": "王小明", "role": "student" }
```

**401 Unauthorized**
```json
{ "success": false, "message": "帳號或密碼錯誤" }
```

---

### POST /api/logout

Always succeeds.

**200 OK**
```json
{ "success": true, "message": "登出成功" }
```

---

### GET /api/me

Get current user info by user ID.

**Query Params**
- `user_id` (integer, required)

**200 OK**
```json
{ "user_id": 1, "email": "student001@university.edu.tw", "role": "student", "name": "王小明", "id": 42 }
```

**404 Not Found** — user not found.

---

## Student

All endpoints take `student_id` (integer) as a query param unless noted.

### GET /api/student/dashboard-all

Full dashboard payload for the student overview page.

**Query Params** — `student_id`

**200 OK**
```json
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
      "program_id": 102,
      "program_name": "BS Computer Science",
      "program_type": "Main Major",
      "college_name": "College of Information - Sep. 2023",
      "is_main_major": true,
      "sub_rules": [
        { "rule_name": "Required core", "earned": 32, "required": 35 },
        { "rule_name": "Elective", "earned": 9, "required": 75 }
      ]
    }
  ]
}
```

**404 Not Found** — student not found.

---

### GET /api/student/audit

Graduation audit across all enrolled programs.

**Query Params**
- `student_id` (required)
- `dept_id` (optional) — filter to programs of a specific department

**200 OK**
```json
{
  "student_id": 42,
  "can_graduate": false,
  "programs": [
    {
      "program_id": 102,
      "program_name": "BS Computer Science",
      "program_type": "master",
      "can_graduate": false,
      "rules": [
        {
          "rule_id": 1,
          "rule_name": "Required core",
          "rule_type": "required",
          "required_credits": 35,
          "earned_credits": 32,
          "remaining_credits": 3
        }
      ],
      "missing_courses": [
        { "course_id": 5, "course_code": "CS301", "course_name": "Operating Systems", "credits": 3 }
      ]
    }
  ]
}
```

**Notes**
- `missing_courses` only lists courses from `required`-type rules that the student hasn't passed.
- `can_graduate` is `true` only when all rules have `remaining_credits == 0`.

---

### GET /api/student/credits/summary

Earned credits grouped by category.

**Query Params** — `student_id`

**200 OK**
```json
{ "required": 32, "elective": 9, "general_education": 12, "total": 53 }
```

---

### GET /api/student/courses

All courses the student has taken.

**Query Params** — `student_id`

**200 OK**
```json
[
  {
    "course_id": 1,
    "course_code": "CS101",
    "course_name": "Intro to Programming",
    "credits": 3,
    "semester": "2023-1",
    "grade": 88,
    "is_passed": true
  }
]
```

---

### GET /api/student/enrollments

List all programs the student is (or was) enrolled in.

**Query Params** — `student_id`

**200 OK**
```json
[
  { "program_id": 102, "program_name": "BS Computer Science", "program_type": "master", "is_enrolled": true }
]
```

---

### POST /api/student/enrollments

Enroll student in a program.

**Request Body**
```json
{ "student_id": 42, "program_id": 102 }
```

**201 Created** — returns the `EnrollmentItemResponse` above.

**404** — student or program not found.  
**409** — already enrolled.

---

### DELETE /api/student/enrollments/{program_id}

Withdraw from a program (sets `is_enrolled = false`).

**Query Params** — `student_id`

**200 OK**
```json
{ "success": true, "message": "已退出 Program" }
```

**404** — enrollment not found.

---

## Courses

### GET /api/courses

List all courses. Supports optional name search.

**Query Params**
- `name` (string, optional) — case-insensitive substring match on `course_name`

**200 OK**
```json
[
  { "course_id": 1, "course_code": "CS101", "course_name": "Intro to Programming", "credits": 3 }
]
```

---

### GET /api/courses/{course_id}

**200 OK** — single course object.  
**404** — not found.

---

### POST /api/courses

**Request Body**
```json
{ "course_code": "CS101", "course_name": "Intro to Programming", "credits": 3 }
```

**201 Created** — returns the created course.  
**409** — course code already exists.

---

### PUT /api/courses/{course_id}

Partial update (all fields optional).

**Request Body**
```json
{ "course_name": "Introduction to Programming", "credits": 3 }
```

**200 OK** — returns updated course.  
**404** — not found.

---

### DELETE /api/courses/{course_id}

**204 No Content**  
**404** — not found.

---

## Departments

### GET /api/departments

**200 OK**
```json
[{ "dept_id": 1, "dept_name": "Computer Science" }]
```

---

### GET /api/departments/{dept_id}

**200 OK** — single department.  
**404** — not found.

---

### POST /api/departments

**Request Body**
```json
{ "dept_name": "Information Management" }
```

**201 Created** — returns created department.  
**409** — name already exists.

---

### PUT /api/departments/{dept_id}

**Request Body**
```json
{ "dept_name": "New Name" }
```

**200 OK** — returns updated department.  
**404** — not found.

---

## Programs

### GET /api/programs

List all programs.

**200 OK**
```json
[
  {
    "program_id": 1,
    "program_name": "BS Computer Science",
    "program_type": "master",
    "total_credits_required": 128,
    "effective_year": 2023,
    "is_published": true,
    "dept_id": 1
  }
]
```

---

### GET /api/programs/{program_id}

**200 OK**
```json
{
  "program_id": 1,
  "program_name": "BS Computer Science",
  "program_type": "master",
  "total_credits_required": 128,
  "effective_year": 2023,
  "is_published": true,
  "dept_id": 1,
  "dept_name": "Computer Science"
}
```

**404** — not found.

---

### GET /api/programs/{program_id}/requirements

List all requirement rules for a program, each with its courses.

**200 OK**
```json
[
  {
    "rule_id": 1,
    "rule_name": "Required core",
    "rule_type": "required",
    "required_credits": 35,
    "courses": [
      { "course_id": 1, "course_code": "CS101", "course_name": "Intro to Programming", "credits": 3 }
    ]
  }
]
```

**404** — program not found.

---

### POST /api/programs

**Request Body**
```json
{
  "program_name": "BS Computer Science",
  "total_credits_required": 128,
  "effective_year": 2023,
  "program_type": "master",
  "is_published": false,
  "dept_id": 1
}
```

**201 Created** — returns created program.  
**404** — department not found.

---

### PUT /api/programs/{program_id}

Partial update (all fields optional).

**Request Body**
```json
{ "program_name": "New Name", "is_published": true }
```

**200 OK** — returns updated program.  
**404** — not found.

---

### DELETE /api/programs/{program_id}

**204 No Content**  
**404** — not found.

---

### PUT /api/programs/{program_id}/requirements

Bulk upsert requirement rules. Rules with `rule_id` are updated; rules without are created.

**Request Body**
```json
{
  "rules": [
    { "rule_id": 1, "rule_name": "Required core", "rule_type": "required", "required_credits": 35 },
    { "rule_name": "Elective", "rule_type": "elective", "required_credits": 75 }
  ]
}
```

**200 OK** — returns the full list of upserted rules (with courses).  
**404** — program or rule not found.

---

### PATCH /api/programs/{program_id}/requirements/{rule_id}

Update a single rule's name or required credits.

**Request Body**
```json
{ "rule_name": "Core Courses", "required_credits": 40 }
```

**200 OK** — returns updated rule (with courses).  
**404** — program or rule not found.

---

### POST /api/programs/{program_id}/requirements/{rule_id}/courses

Add a course to a requirement rule.

**Request Body**
```json
{ "course_id": 5 }
```

**201 Created** — returns updated rule (with all courses).  
**404** — program, rule, or course not found.  
**409** — course already in rule.

---

### DELETE /api/programs/{program_id}/requirements/{rule_id}/courses/{course_id}

Remove a course from a requirement rule.

**204 No Content**  
**404** — program, rule, or course-rule mapping not found.

---

## Admin

### POST /api/admin/login

Staff-only login. Student accounts are rejected.

**Request Body**
```json
{ "email": "admin001@university.edu.tw", "password": "admin_password" }
```

**200 OK**
```json
{
  "success": true,
  "message": "登入成功",
  "id": 2,
  "name": "系統管理員",
  "tag": "staff",
  "department_list": [
    { "id": 1, "name": "Computer Science", "college_name": "Computer Science" }
  ]
}
```

**401 Unauthorized**
```json
{ "success": false, "message": "帳號或密碼錯誤" }
{ "success": false, "message": "此帳號無管理員權限" }
```

---

### GET /api/admin/users

List all users (students and staff).

**200 OK**
```json
[
  { "user_id": 1, "email": "student001@university.edu.tw", "role": "student", "name": "王小明", "created_at": "2024-09-01T00:00:00Z" }
]
```

---

### POST /api/admin/users

Create a new user account.

**Request Body**
```json
{
  "email": "new@university.edu.tw",
  "password": "password123",
  "role": "student",
  "name": "李大華",
  "enrollment_year": 2024,
  "dept_id": 1
}
```

- `enrollment_year` and `dept_id` are required when `role` is `"student"`.

**201 Created** — returns created user.  
**400** — missing required student fields.  
**409** — email already exists.

---

### PUT /api/admin/users/{user_id}/role

Update a user's role.

**Request Body**
```json
{ "role": "staff" }
```

**200 OK** — returns updated user.  
**404** — not found.

---

### DELETE /api/admin/users/{user_id}

**204 No Content**  
**404** — not found.

---

### GET /api/admin/staff

List all staff members.

**200 OK**
```json
[{ "staff_id": 2, "name": "系統管理員", "email": "admin@university.edu.tw" }]
```
