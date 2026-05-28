# Graduate_Degree_Audit_System

Verifying academic requirements for graduation.

## Project Structure

```text
.
├── backend
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app
│       ├── __init__.py
│       ├── database.py
│       ├── main.py
│       └── models.py
└── docker-compose.yml
```

## Run

```bash
# 1. 先啟動資料庫
docker compose up -d db

# 2. 初始化資料庫 schema
docker compose run --rm db-init

# 3. 啟動後端
docker compose up --build -d backend

# 4. 匯入 dashboard 測試資料
docker exec -i graduate_audit_db psql -U postgres -d graduate_audit < scripts/seed_dashboard_test.sql
```

## get schema

```bash
# 查看所有 table
docker exec graduate_audit_db psql -U postgres -d graduate_audit -c "\dt"
# 查看 takes table
docker exec graduate_audit_db psql -U postgres -d graduate_audit -c "\d takes"
# 查看所有 table 的欄位結構
docker exec graduate_audit_db psql -U postgres -d graduate_audit -c "\d+"
```

## Database Schema

The database schema is currently defined in `backend/app/models.py` and created on backend startup with SQLAlchemy.

### users

| Column | Type | Constraints |
| --- | --- | --- |
| `user_id` | integer | PK, auto increment |
| `email` | varchar(200) | unique, not null |
| `password_hash` | varchar(255) | nullable |
| `role` | varchar(50) | not null |
| `created_at` | datetime with timezone | not null, default `now()` |

### students

| Column | Type | Constraints |
| --- | --- | --- |
| `student_id` | integer | PK, FK -> `users.user_id`, on delete cascade |
| `name` | varchar(100) | not null |
| `enrollment_year` | integer | not null |
| `type` | varchar(50) | nullable |
| `dept_id` | integer | FK -> `departments.dept_id`, not null, on delete restrict |

### staff

| Column | Type | Constraints |
| --- | --- | --- |
| `staff_id` | integer | PK, FK -> `users.user_id`, on delete cascade |
| `name` | varchar(100) | not null |

### departments

| Column | Type | Constraints |
| --- | --- | --- |
| `dept_id` | integer | PK, auto increment |
| `dept_name` | varchar(100) | unique, not null |

### programs

| Column | Type | Constraints |
| --- | --- | --- |
| `program_id` | integer | PK, auto increment |
| `program_name` | varchar(200) | not null |
| `total_credits_required` | integer | not null |
| `effective_year` | integer | not null |
| `program_type` | varchar(50) | nullable |
| `is_published` | boolean | not null, default `false` |
| `dept_id` | integer | FK -> `departments.dept_id`, not null, on delete restrict |

### courses

| Column | Type | Constraints |
| --- | --- | --- |
| `course_id` | integer | PK, auto increment |
| `course_code` | varchar(20) | unique, not null |
| `course_name` | varchar(200) | not null |
| `credits` | integer | not null |

### requirement_rules

| Column | Type | Constraints |
| --- | --- | --- |
| `rule_id` | integer | PK, auto increment |
| `rule_name` | varchar(200) | not null |
| `rule_type` | varchar(100) | not null |
| `required_credits` | integer | not null |
| `program_id` | integer | FK -> `programs.program_id`, not null, on delete cascade |

### enrollments

| Column | Type | Constraints |
| --- | --- | --- |
| `student_id` | integer | PK, FK -> `students.student_id`, on delete cascade |
| `program_id` | integer | PK, FK -> `programs.program_id`, on delete cascade |
| `is_enrolled` | boolean | not null, default `true` |

### takes

| Column | Type | Constraints |
| --- | --- | --- |
| `take_id` | integer | PK, auto increment |
| `student_id` | integer | FK -> `students.student_id`, not null, on delete cascade |
| `course_id` | integer | FK -> `courses.course_id`, not null, on delete cascade |
| `semester` | varchar(20) | not null |
| `grade` | integer | nullable |
| `is_passed` | boolean | not null, default `false` |

Additional constraint:

- Unique: `student_id + course_id + semester`

### course_rules

| Column | Type | Constraints |
| --- | --- | --- |
| `course_id` | integer | PK, FK -> `courses.course_id`, on delete cascade |
| `rule_id` | integer | PK, FK -> `requirement_rules.rule_id`, on delete cascade |
| `identification_type` | varchar(100) | nullable |

### Relationship Summary

- `users` 1:1 `students`
- `users` 1:1 `staff`
- `departments` 1:N `students`
- `departments` 1:N `programs`
- `programs` 1:N `requirement_rules`
- `students` M:N `programs` through `enrollments`
- `students` M:N `courses` through `takes`
- `courses` M:N `requirement_rules` through `course_rules`

## Endpoints

- `GET /`
- `GET /health`
- `POST /api/login`
- `GET /api/student/dashboard-all?student_id=42`
