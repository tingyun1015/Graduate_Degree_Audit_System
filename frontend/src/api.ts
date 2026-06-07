import type { Dashboard, LoginResponse, CourseListResponse, AdminLoginResponse, CourseResponse, AdminProgramListResponse, ProgramDetailResponse, Course, Audit, AuditCourse, StudentActionResponse, StudentEnrollment, ProgramOption } from './types';
const BASE_URL = 'http://localhost:8000';


/**
 * ============================
 * Student
 * ============================
*/
export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

export async function getDashboard(studentId: number): Promise<Dashboard> {
  const response = await fetch(`${BASE_URL}/api/student/dashboard-all?student_id=${studentId}`);
  if (!response.ok) {
    throw new Error('無法取得 dashboard 資料');
  }
  return response.json();
}

// TODO: 取得某個 student 在某個 program 下的 audit 結果
// GET /api/student/{student_id}/programs/{program_id}/audit or GET /api/student/programs/audit?student_id=0&program_id=0&program_id=1
// {
//   "student_id": 0,
//   "can_graduate": true,
//   "programs": [
//     {
//       "program_id": 0,
//       "program_name": "string",
//       "program_type": "string",
//       "can_graduate": true,
//       "rules": [
//         {
//           "rule_id": 0,
//           "rule_type": "string", // 課程類別：core、elective、free_elective
//           "required_credits": 0,
//           "earned_credits": 0,
//           "remaining_credits": 0,
//           "counted_courses": [ // student has already taken courses
//             {
//               "course_id": 0,
//               "course_code": "string",
//               "course_name": "string",
//               "credits": 0
//             }
//           ],
//           "planned_courses": [ // student plan to take courses, but not yet taken
//             {
//               "course_id": 0,
//               "course_code": "string",
//               "course_name": "string",
//               "credits": 0
//             }
//           ],
//           "missing_courses": [ // if rule_type === 'core' or 'elective', show courses that student has not taken and not planned to take
//             {
//               "course_id": 0,
//               "course_code": "string",
//               "course_name": "string",
//               "credits": 0
//             }
//           ]
//         }
//       ],
//     }
//   ]
// }
export async function getStudentAudit(studentId: number, programId: number): Promise<Audit> {
  return await fetch(`${BASE_URL}/api/student/${studentId}/programs/${programId}/audit`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => {
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('You are not enrolled in this program. Please add it from the Dashboard first.');
      }
      throw new Error('無法取得 audit 資料');
    }
    return res.json();
  });
}

// 取得某 student 的所有 enrollment(含 is_enrolled,用來判斷 planned/enrolled)
// GET /api/student/enrollments?student_id=X
export async function getStudentEnrollments(studentId: number): Promise<StudentEnrollment[]> {
  return await fetch(`${BASE_URL}/api/student/enrollments?student_id=${studentId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => {
    if (!res.ok) {
      throw new Error('無法取得 enrollment 資料');
    }
    return res.json();
  });
}

// TODO: 建立 student 的 program enrollment
// POST /api/student/enrollments
// payload: {
//   "student_id": 0,
//   "program_id": 0,
//   "enrollment_semester": "string",
//   "expected_graduation": "2026-01-01",
//   "current_gpa": 0,
//   "total_required_credits": 0
// }
// return 
// {
//   "success": true,
//   "message": "Enrollment created successfully.",
//   "data": {
//     "enrollment": {
//       "id": 0,
//       "student_id": 0,
//       "program_id": 0,
//       "is_enrolled": true, 
//       "is_planned": true,
//     }
//   }
// }
export async function addStudentProgram(studentId: number, programId: number): Promise<StudentActionResponse> {
  return await fetch(`${BASE_URL}/api/student/enrollments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId, program_id: programId }),
  }).then((res) => {
    if (!res.ok) {
      throw new Error('無法取得 audit 資料');
    }
    return res.json();
  });
}


// TODO: 刪除已 planned 的 program
// DELETE /api/student/${student_id}/programs/${program_id}
// payload: {}
// return
// {
//   "success": true,
//   "message": "Program enrollment deleted successfully."
// }
export async function deleteStudentProgram(studentId: number, programId: number): Promise<StudentActionResponse> {
  return await fetch(`${BASE_URL}/api/student/${studentId}/programs/${programId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => {
    if (!res.ok) {
      throw new Error('無法刪除 program 資料');
    }
    return res.json();
  });
}

// TODO: 刪除已 planned 的 course
// DELETE /api/student/${student_id}/courses/${course_id}
// payload: {}
// return
// {
//   "success": true,
//   "message": "Planned course deleted successfully."
// }
export async function deletePlannedCourse(studentId: number, courseId: number): Promise<StudentActionResponse> {
  return await fetch(`${BASE_URL}/api/student/${studentId}/courses/${courseId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => {
    if (!res.ok) {
      throw new Error('無法刪除 course 資料');
    }
    return res.json();
  });
}

// 加一門計畫課(建立 is_passed=false 的 takes 紀錄)
// POST /api/student/{student_id}/courses  body: { course_id }
export async function addPlannedCourse(studentId: number, courseId: number): Promise<StudentActionResponse> {
  return await fetch(`${BASE_URL}/api/student/${studentId}/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course_id: courseId }),
  }).then(async (res) => {
    if (!res.ok) {
      // 把後端訊息撈出來(例:Course already planned / already completed)
      const data = await res.json().catch(() => null);
      throw new Error(data?.detail || '無法加入計畫課程');
    }
    return res.json();
  });
}

// 搜尋課程(Add Planned Course 卡片用)。name 為空字串時回全部
// GET /api/courses?name=...
export async function getCourses(name = ''): Promise<AuditCourse[]> {
  const query = name ? `?name=${encodeURIComponent(name)}` : '';
  return await fetch(`${BASE_URL}/api/courses${query}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => {
    if (!res.ok) {
      throw new Error('無法取得課程清單');
    }
    return res.json();
  });
}

// 取得所有 program(GET /api/programs 回扁平陣列,含 is_published;published 與否由前端篩)
export async function getAllPrograms(): Promise<ProgramOption[]> {
  return await fetch(`${BASE_URL}/api/programs`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => {
    if (!res.ok) {
      throw new Error('無法取得 programs 資料');
    }
    return res.json();
  });
}


/**
 * ============================
 * Admin/Staff
 * ============================
*/

// Admin Login
export async function loginAdmin(email: string, password: string): Promise<AdminLoginResponse> {
  const response = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, isAdminPage: true }),
  });
  return response.json().then((data) => {
    if (data.success && data.department_list) {
      data.departmentList = data.department_list
    }
    return data;
  })
}

export async function getAdminProgramList(adminId: number, departmentId: number): Promise<AdminProgramListResponse> {
  return await fetch(`${BASE_URL}/api/admin/departments/${departmentId}/programs?user_id=${adminId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => {
    if (!res.ok) {
      throw new Error('無法取得 program list 資料');
    }
    return res.json();
  });
}

export async function publishProgram(adminId: number, programId: number, isPublished: boolean): Promise<{ success: boolean; message: string }> {
  return await fetch(`${BASE_URL}/api/admin/programs/${programId}/publish?user_id=${adminId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_published: isPublished }),
  }).then((res) => {
    if (!res.ok) {
      throw new Error('Failed to publish program');
    }
    return res.json();
  });
}

export async function getProgramDetail(programId: number): Promise<ProgramDetailResponse> {
  return await fetch(`${BASE_URL}/api/programs/${programId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => {
    if (!res.ok) {
      throw new Error('無法取得 program detail 資料');
    }
    return res.json();
  });
}

export async function addNewProgram(adminId: number,departmentId: number, program: Program): Promise<ProgramDetailResponse> {
  return fetch(`${BASE_URL}/api/admin/departments/${departmentId}/programs?user_id=${adminId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(program),
  }).then((res) => {
    if (!res.ok) {
      throw new Error('無法新增 program 資料');
    }
    return res.json();
  });
};

// TODO: 刪除某個 program
// DELETE /api/admin/programs/${program_id}
export async function deleteProgram(adminId: number, programId: number): Promise<ProgramDetailResponse> {
  return await fetch(`${BASE_URL}/api/admin/programs/${programId}?user_id=${adminId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => {
    if (!res.ok) {
      throw new Error('無法刪除 program 資料');
    }
    return res.json();
  });
};

export async function getAdminProgramDetail(adminId: number, programId: number): Promise<ProgramDetailResponse> {
  return await fetch(`${BASE_URL}/api/admin/programs/${programId}/requirements?user_id=${adminId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => {
    if (!res.ok) {
      throw new Error('無法取得 program detail 資料');
    }
    return res.json();
  });
};

export async function editAdminProgramRule(adminId: number, ruleId: number, requiredCredits: number): Promise<ProgramDetailResponse> {
  return await fetch(`${BASE_URL}/api/admin/programs/${ruleId}?user_id=${adminId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ required_credits: requiredCredits }),
  }).then((res) => {
    if (!res.ok) throw new Error('無法更新 rule 資料');
    return res.json();
  });
};

export async function addCourseIntoProgramRule(adminId: number, ruleId: number, courseId: number): Promise<ProgramDetailResponse> {
  return await fetch(`${BASE_URL}/api/admin/programs/${ruleId}/courses?user_id=${adminId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course_id: courseId }),
  }).then((res) => {
    if (!res.ok) throw new Error('無法新增課程至 rule');
    return res.json();
  });
};

export async function removeCourseFromProgramRule(adminId: number, ruleId: number, courseId: number): Promise<ProgramDetailResponse> {
  return await fetch(`${BASE_URL}/api/admin/programs/${ruleId}/course/${courseId}?user_id=${adminId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => {
    if (!res.ok) throw new Error('無法移除課程');
    return res.json();
  });
};

export async function logout(userId: number): Promise<{success: boolean, message: string}> {
  return await fetch(`${BASE_URL}/api/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  }).then((res) => {
    if (!res.ok) {
      throw new Error('登出失敗');
    }
    return res.json();
  });
};

export async function getAdminCourseList(page: number): Promise<Course[]> {
  const response = await fetch(`${BASE_URL}/api/courses?page=${page}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  return data;
}

export async function addNewCourse(course: Course): Promise<CourseResponse> {
  const response = await fetch(`${BASE_URL}/api/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(course),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || '無法新增課程');
  }
  return data;
}

export async function deleteCourse(courseId: number): Promise<any> {
  return fetch(`${BASE_URL}/api/courses/${courseId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
}

// TODO: 編輯某一個 department 的課程
// PUT /api/admin/courses/${course_id}
// payload: {"course_name": "Computer Science", "credit": 3, "term": "1" }
// return: {"course_id": 1, "course_code": "CS101", "course_name": "Computer Science", "credit": 3, "term": "1", "department_id": 1 }
export async function editCourse(courseId: number, course: Course): Promise<CourseResponse> {
  return fetch(`${BASE_URL}/api/admin/courses/${courseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(course),
  }).then(res => res.json());
}
