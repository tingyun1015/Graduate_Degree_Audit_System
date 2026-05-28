# API Docs

## Overview

This project currently exposes a minimal authentication API for logging a user into the Graduate Degree Audit System.

Base URL during local development:

```text
http://localhost:8000
```

Swagger UI is also available at:

```text
http://localhost:8000/docs
```

## POST /api/login

Authenticate a user with email and password.

### Request Body

```json
{
  "email": "student001@university.edu.tw",
  "password": "my_password"
}
```

### Success Response

Status: `200 OK`

```json
{
  "success": true,
  "message": "登入成功",
  "id": 42,
  "name": "王小明",
  "role": "student"
}
```

### Response Fields

- `success`: Whether login succeeded.
- `message`: Result message for the frontend to display.
- `id`: Student ID or staff ID. The frontend can store and pass this value to later APIs.
- `name`: Display name for the logged-in user.
- `role`: Current user role. Expected values are `student` or `staff`.

### Error Responses

#### 401 Unauthorized

Returned when the email does not exist or the password is incorrect.

```json
{
  "success": false,
  "message": "帳號或密碼錯誤"
}
```

## Database Notes

The login API depends on the `users.password_hash` column.

- Fresh databases will create this column from the SQLAlchemy model.
- Existing local databases are patched on app startup with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
- Current implementation compares the submitted password directly with `users.password_hash`.

## Current Frontend Flow

1. Call `POST /api/login`.
2. If `success` is `true`, store the returned `id`, `name`, and `role` on the frontend.
3. Call later APIs with that `id`, for example `GET /api/my-grades?student_id=42`.

## GET /api/student/dashboard-all

Return the full student dashboard payload in one request.

### Query Params

- `student_id` (integer, required)

### Success Response

Status: `200 OK`

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
      "program_id": 101,
      "program_name": "General Education",
      "program_type": "University Requirements",
      "college_name": null,
      "is_main_major": false,
      "sub_rules": [
        { "rule_name": "Humanities", "earned": 6, "required": 6 },
        { "rule_name": "Sciences", "earned": 6, "required": 9 },
        { "rule_name": "Social Sciences", "earned": 3, "required": 9 }
      ]
    },
    {
      "program_id": 102,
      "program_name": "BS Computer Science",
      "program_type": "Main Major",
      "college_name": "College of Information - Sep. 2023",
      "is_main_major": true,
      "sub_rules": [
        { "rule_name": "Required core", "earned": 32, "required": 35 },
        { "rule_name": "Elective", "earned": 9, "required": 75 },
        { "rule_name": "Free Elective", "earned": 6, "required": 18 }
      ]
    },
    {
      "program_id": 103,
      "program_name": "Advertising",
      "program_type": "Minor",
      "college_name": "College of Communication - Sep. 2023",
      "is_main_major": false,
      "sub_rules": [
        { "rule_name": "Minor Required", "earned": 32, "required": 35 }
      ]
    }
  ]
}
```

### Notes

- `student_info.total_required_credits` comes from the student's main-major program.
- `current_gpa` is inferred from numeric grades using a simple 4.3 scale conversion.
- `earned` currently counts passed courses only.
- `Programs: 2` on the frontend should count non-university programs only.
- Total earned credits on the frontend should be derived by summing all `sub_rules[].earned`.

### Error Response

#### 404 Not Found

```json
{
  "detail": "Student not found"
}
```
