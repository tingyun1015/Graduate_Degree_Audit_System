export function env(name, fallback) {
  const value = __ENV[name];
  return value === undefined || value === "" ? fallback : value;
}

export function intEnv(name, fallback) {
  return Number(env(name, String(fallback)));
}

export const config = {
  baseUrl: env("BASE_URL", "http://localhost:8000"),
  studentEmail: env("STUDENT_EMAIL", "student001@university.edu.tw"),
  studentPassword: env("STUDENT_PASSWORD", "my_password"),
  studentId: intEnv("STUDENT_ID", 1),
  writeStudentBaseId: intEnv("WRITE_STUDENT_BASE_ID", 3),
  auditProgramId: intEnv("AUDIT_PROGRAM_ID", 102),
  plannedProgramId: intEnv("PLANNED_PROGRAM_ID", 103),
  plannedCourseId: intEnv("PLANNED_COURSE_ID", 305),
  adminEmail: env("ADMIN_EMAIL", "admin001@university.edu.tw"),
  adminPassword: env("ADMIN_PASSWORD", "admin_password"),
  adminUserId: intEnv("ADMIN_USER_ID", 2),
  adminDeptId: intEnv("ADMIN_DEPT_ID", 1),
  studentDeptId: intEnv("STUDENT_DEPT_ID", 1),
};

export function getVuStudentId(vuId) {
  return config.writeStudentBaseId + vuId - 1;
}
