TRUNCATE TABLE course_rules, takes, enrollments, requirement_rules, courses, programs, students, staff, users, departments RESTART IDENTITY CASCADE;

INSERT INTO departments (dept_id, dept_name) VALUES
    (1, 'College of Information'),
    (2, 'College of Communication'),
    (3, 'University Wide');

INSERT INTO users (user_id, email, password_hash, role) VALUES
    (1, 'student001@university.edu.tw', 'my_password', 'student'),
    (2, 'admin001@university.edu.tw', 'admin_password', 'staff'),
    (3, 'student002@university.edu.tw', 'my_password', 'student');

INSERT INTO students (student_id, name, enrollment_year, type, dept_id) VALUES
    (1, '王小明', 2023, 'full_time', 1),
    (3, '李小八', 2024, 'full_time', 1);

INSERT INTO staff (staff_id, name) VALUES
    (2, '系統管理員');

INSERT INTO programs (
    program_id,
    program_name,
    total_credits_required,
    effective_year,
    program_type,
    is_published,
    dept_id
) VALUES
    (101, 'General Education', 30, 2023, 'University Requirements', true, 3),
    (102, 'BS Computer Science', 128, 2023, 'Main Major', true, 1),
    (103, 'Advertising', 35, 2023, 'Minor', true, 2);

INSERT INTO enrollments (student_id, program_id, is_enrolled) VALUES
    (1, 101, true),
    (1, 102, true),
    (1, 103, true),
    -- 李小八:只選 101 + 102,故意不選 103(Advertising)→ 留著測 + Add Program
    (3, 101, true),
    (3, 102, true);

INSERT INTO requirement_rules (
    rule_id,
    rule_name,
    rule_type,
    required_credits,
    program_id
) VALUES
    (201, 'Humanities', 'core', 6, 101),
    (202, 'Sciences', 'core', 9, 101),
    (203, 'Social Sciences', 'core', 9, 101),
    (204, 'Required core', 'core', 35, 102),
    (205, 'Elective', 'elective', 75, 102),
    (206, 'Free Elective', 'free_elective', 18, 102),
    (207, 'Required core', 'core', 35, 103);

INSERT INTO courses (course_id, course_code, course_name, credits) VALUES
    (301, 'HUM101', 'World Literature', 3),
    (302, 'HUM102', 'Philosophy', 3),
    (303, 'SCI101', 'Physics I', 3),
    (304, 'SCI102', 'Biology I', 3),
    (305, 'SOC101', 'Introduction to Sociology', 3),
    (306, 'CS101', 'Intro to Programming', 4),
    (307, 'CS102', 'Data Structures', 4),
    (308, 'CS201', 'Computer Organization', 4),
    (309, 'CS202', 'Discrete Mathematics', 4),
    (310, 'CS301', 'Algorithms', 4),
    (311, 'CS302', 'Operating Systems', 4),
    (312, 'CS303', 'Database Systems', 4),
    (313, 'CS304', 'Computer Networks', 4),
    (314, 'CSE401', 'Machine Learning', 3),
    (315, 'CSE402', 'Information Security', 3),
    (316, 'CSE403', 'Cloud Computing', 3),
    (317, 'FE101', 'Creative Thinking', 3),
    (318, 'FE102', 'Business Communication', 3),
    (319, 'ADV101', 'Advertising Principles', 4),
    (320, 'ADV102', 'Consumer Behavior', 4),
    (321, 'ADV201', 'Copywriting', 4),
    (322, 'ADV202', 'Media Planning', 4),
    (323, 'ADV301', 'Brand Strategy', 4),
    (324, 'ADV302', 'Digital Advertising', 4),
    (325, 'ADV401', 'Campaign Design', 4),
    (326, 'ADV402', 'Marketing Analytics', 4);

INSERT INTO course_rules (course_id, rule_id, identification_type) VALUES
    (301, 201, 'required'),
    (302, 201, 'required'),
    (303, 202, 'required'),
    (304, 202, 'required'),
    (305, 203, 'required'),
    (306, 204, 'required'),
    (307, 204, 'required'),
    (308, 204, 'required'),
    (309, 204, 'required'),
    (310, 204, 'required'),
    (311, 204, 'required'),
    (312, 204, 'required'),
    (313, 204, 'required'),
    (314, 205, 'elective'),
    (315, 205, 'elective'),
    (316, 205, 'elective'),
    (317, 206, 'elective'),
    (318, 206, 'elective'),
    (319, 207, 'required'),
    (320, 207, 'required'),
    (321, 207, 'required'),
    (322, 207, 'required'),
    (323, 207, 'required'),
    (324, 207, 'required'),
    (325, 207, 'required'),
    (326, 207, 'required');

INSERT INTO takes (
    take_id,
    student_id,
    course_id,
    semester,
    grade,
    is_passed
) VALUES
    (1, 1, 301, '2023-1', 93, true),
    (2, 1, 302, '2023-1', 93, true),
    (3, 1, 303, '2023-2', 93, true),
    (4, 1, 304, '2023-2', 93, true),
    (5, 1, 305, '2024-1', 93, true),
    (6, 1, 306, '2023-1', 93, true),
    (7, 1, 307, '2023-2', 93, true),
    (8, 1, 308, '2024-1', 93, true),
    (9, 1, 309, '2024-1', 93, true),
    (10, 1, 310, '2024-2', 93, true),
    (11, 1, 311, '2024-2', 93, true),
    (12, 1, 312, '2025-1', 93, true),
    (13, 1, 313, '2025-1', 93, true),
    (14, 1, 314, '2025-1', 94, true),
    (15, 1, 315, '2025-1', 94, true),
    (16, 1, 316, '2025-2', 94, true),
    (17, 1, 317, '2025-2', 94, true),
    (18, 1, 318, '2025-2', 94, true),
    (19, 1, 319, '2024-1', 94, true),
    (20, 1, 320, '2024-1', 94, true),
    (21, 1, 321, '2024-2', 94, true),
    (22, 1, 322, '2024-2', 94, true),
    (23, 1, 323, '2025-1', 94, true),
    (24, 1, 324, '2025-1', 94, true),
    (25, 1, 325, '2025-2', 94, true),
    (26, 1, 326, '2025-2', 94, true),
    -- ── 李小八(student 3,修課中)── 故意留 planned / missing 方便測詳細頁
    -- done(修過):301,302,303,306,307,308,314,317
    (27, 3, 301, '2024-1', 90, true),
    (28, 3, 302, '2024-1', 88, true),
    (29, 3, 303, '2024-2', 85, true),
    (31, 3, 306, '2024-1', 92, true),
    (32, 3, 307, '2024-2', 90, true),
    (33, 3, 308, '2025-1', 87, true),
    (35, 3, 314, '2025-1', 91, true),
    (37, 3, 317, '2025-1', 89, true),
    -- planned(is_passed=false,grade 留 NULL):304,309,315
    (30, 3, 304, '2024-2', NULL, false),
    (34, 3, 309, '2025-1', NULL, false),
    (36, 3, 315, '2025-2', NULL, false);
    -- missing(完全不選,不建 takes):305,310,311,312,313,316,318

-- ── 修正自動編號序列(sequence)──────────────────────────────────
-- 上面都用「明確指定 id」INSERT,Postgres 的序列不會跟著前進(加上開頭
-- TRUNCATE ... RESTART IDENTITY 把序列重設回 1)。若不修正,之後 App 自動
-- 產生 id(例如加 planned course 寫入 takes)會發出已存在的號 → 撞主鍵 → 500。
-- 這裡把每個有流水號的表推到目前最大值,下一個號就接在後面。
SELECT setval(pg_get_serial_sequence('takes','take_id'),             (SELECT MAX(take_id) FROM takes));
SELECT setval(pg_get_serial_sequence('courses','course_id'),         (SELECT MAX(course_id) FROM courses));
SELECT setval(pg_get_serial_sequence('programs','program_id'),       (SELECT MAX(program_id) FROM programs));
SELECT setval(pg_get_serial_sequence('requirement_rules','rule_id'), (SELECT MAX(rule_id) FROM requirement_rules));
SELECT setval(pg_get_serial_sequence('users','user_id'),             (SELECT MAX(user_id) FROM users));
SELECT setval(pg_get_serial_sequence('departments','dept_id'),       (SELECT MAX(dept_id) FROM departments));
