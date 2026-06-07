import type { Dashboard, LoginResponse, LoginAdminResponse, CourseResponse, AdminProgramListResponse, ProgramDetailResponse, Program, Course, StudentProgramDetailData } from './types';
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

// 學生端 program 詳細頁的假資料,用 program_id 當 key
// 不同 program 點進來會看到不同內容
const MOCK_PROGRAM_DETAILS: Record<number, StudentProgramDetailData> = {
  101: {
    programType: 'University Requirements',
    programName: 'General Education',
    collegeLine: 'University Wide · Sep. 2023',
    isEnrolled: true,
    rules: [
      {
        name: 'Humanities',
        earned: 6,
        required: 6,
        courses: [
          { status: 'done', code: 'HUM101', name: 'World Literature', credits: '3 cr', term: 'Y1·Fall' },
          { status: 'done', code: 'HUM102', name: 'Philosophy', credits: '3 cr', term: 'Y1·Spring' },
        ],
      },
      {
        name: 'Sciences',
        earned: 6,
        required: 9,
        courses: [
          { status: 'done', code: 'SCI101', name: 'Physics I', credits: '3 cr', term: 'Y1·Fall' },
          { status: 'done', code: 'SCI102', name: 'Biology I', credits: '3 cr', term: 'Y2·Fall' },
          { status: 'missing', code: 'SCI103', name: 'Chemistry I', credits: '3 cr', term: '—' },
        ],
      },
    ],
  },
  102: {
    programType: 'Main Major',
    programName: 'BS Computer Science',
    collegeLine: 'College of Information · Sep. 2023',
    isEnrolled: true,
    rules: [
      {
        name: 'Required core',
        earned: 32,
        required: 35,
        courses: [
          { status: 'done', code: 'CS1101', name: 'Intro to Programming', credits: '3 cr', term: 'Y1·Fall' },
          { status: 'done', code: 'CS2210', name: 'Data Structures', credits: '3 cr', term: 'Y1·Spring' },
          { status: 'done', code: 'CS3001', name: 'Algorithms', credits: '3 cr', term: 'Y2·Spring' },
          { status: 'planned', code: 'CS3210', name: 'Operating Systems', credits: '3 cr', term: 'Y3·Fall' },
          { status: 'missing', code: 'CS3500', name: 'Software Engineering', credits: '3 cr', term: '—' },
        ],
      },
      {
        name: 'Elective',
        earned: 9,
        required: 75,
        courses: [
          { status: 'done', code: 'CS5103', name: 'Machine Learning', credits: '3 cr', term: 'Y1·Fall' },
          { status: 'done', code: 'CS5210', name: 'Computer Vision', credits: '3 cr', term: 'Y1·Spring' },
          { status: 'done', code: 'CS5021', name: 'Database Systems', credits: '3 cr', term: 'Y2·Spring' },
          { status: 'planned', code: 'CS5310', name: 'Distributed Systems', credits: '3 cr', term: '—' },
          { status: 'missing', code: 'CS5503', name: 'Software Testing', credits: '3 cr', term: '—' },
        ],
      },
      {
        name: 'Free Elective',
        earned: 6,
        required: 18,
        courses: [
          { status: 'done', code: 'DE1204', name: 'Design Thinking', credits: '3 cr', term: 'Y1·Fall' },
          { status: 'done', code: 'DE5310', name: 'User Experience Design', credits: '3 cr', term: 'Y1·Spring' },
        ],
      },
    ],
  },
  103: {
    programType: 'Minor',
    programName: 'Advertising',
    collegeLine: 'College of Communication · Sep. 2023',
    isEnrolled: true,
    rules: [
      {
        name: 'Minor Required',
        earned: 12,
        required: 35,
        courses: [
          { status: 'done', code: 'ADV101', name: 'Advertising Principles', credits: '4 cr', term: 'Y2·Fall' },
          { status: 'done', code: 'ADV102', name: 'Consumer Behavior', credits: '4 cr', term: 'Y2·Spring' },
          { status: 'planned', code: 'ADV201', name: 'Copywriting', credits: '4 cr', term: '—' },
          { status: 'missing', code: 'ADV202', name: 'Media Planning', credits: '4 cr', term: '—' },
        ],
      },
    ],
  },
  // 104:planned(學生自己加的計畫,is_enrolled=false)
  104: {
    programType: 'Credit Program',
    programName: 'Design Certificate',
    collegeLine: 'College of Design',
    isEnrolled: false,
    rules: [
      {
        name: 'Required core',
        earned: 32,
        required: 35,
        courses: [
          { status: 'done', code: 'DC1101', name: 'Design Fundamentals', credits: '3 cr', term: 'Y1·Fall' },
          { status: 'done', code: 'DC1202', name: 'Visual Communication', credits: '3 cr', term: 'Y1·Spring' },
          { status: 'done', code: 'DC2103', name: 'Typography', credits: '3 cr', term: 'Y2·Fall' },
          { status: 'planned', code: 'DC2204', name: 'Interaction Design', credits: '3 cr', term: '—' },
          { status: 'missing', code: 'DC3105', name: 'Design Studio', credits: '3 cr', term: '—' },
        ],
      },
      {
        name: 'Elective',
        earned: 9,
        required: 75,
        courses: [
          { status: 'done', code: 'DC5101', name: 'Motion Graphics', credits: '3 cr', term: 'Y2·Spring' },
          { status: 'planned', code: 'DC5202', name: 'Service Design', credits: '3 cr', term: '—' },
          { status: 'missing', code: 'DC5303', name: 'Design Research', credits: '3 cr', term: '—' },
        ],
      },
      {
        name: 'Free Elective',
        earned: 0,
        required: 0,
        courses: [],
      },
    ],
  },
};

export async function getStudentProgramDetail(programId: number): Promise<StudentProgramDetailData> {
  // TODO: 後端好了之後改成
  //   const res = await fetch(`${BASE_URL}/api/student/program/${programId}`);
  //   return res.json();
  // 找不到對應 id 就先回 102 當預設,避免畫面壞掉
  return MOCK_PROGRAM_DETAILS[programId] ?? MOCK_PROGRAM_DETAILS[102];
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
      throw new Error('無法取得 audit 資料');
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
export async function addStudentProgram(studentId: number, programId: number): Promise<Audit> {
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
export async function deleteStudentProgram(studentId: number, programId: number): Promise<Audit> {
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
export async function deletePlannedCourse(studentId: number, courseId: number): Promise<{
  success: boolean,
  message: string,
}> {
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

export async function getAllPrograms(): Promise<{
  success: boolean,
  message: string,
  data: {
    programs: Program[]
  }
}> {
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
export async function loginAdmin(email: string, password: string): Promise<LoginAdminResponse> {
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

export async function addNewProgram(adminId: number, program: Program): Promise<ProgramDetailResponse> {
  // TODO
  return fetch(`${BASE_URL}/api/admin/${adminId}/programs`, {
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
