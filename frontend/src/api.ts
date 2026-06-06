import type { Dashboard, LoginResponse, CourseListResponse, LoginAdminResponse, AdminProgramListResponse, ProgramDetailResponse, Program, Course } from './types';
const BASE_URL = 'http://localhost:8000';

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

// Admin
export async function loginAdmin(email: string, password: string): Promise<LoginAdminResponse> {
  // TODO: mock data using user api
  const response = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json().then((data) => {
    data.departmentList = [{ id: 1, name: "Computer Science", college_name: "College of Information" }, { id: 2, name: "Information Management", college_name: "College of Information" }, { id: 3, name: "Computer Science", college_name: "College of Information" }];
    return data;
  })
}

export async function getAdminProgramList(adminId: number, collegeId: number): Promise<AdminProgramListResponse> {
  // TODO: mock data
  return {
    success: true,
    message: "取得 program list 成功",
    data: {
      programs: [
        {
          id: 1,
          type: 'Major',
          title: 'B.S. Computer Science - 2020',
          college: 'College of Information'
        },
        {
          id: 2,
          type: 'Major',
          title: 'B.S. Computer Science - 2023',
          college: 'College of Information'
        },
        {
          id: 3,
          type: 'Major',
          title: 'M.S. Computer Science',
          college: 'College of Information'
        },
        {
          id: 4,
          type: 'Major',
          title: 'Ph.D. Computer Science',
          college: 'College of Information'
        },
        {
          id: 5,
          type: 'Minor',
          title: 'BS Computer Science',
          college: 'College of Information'
        },
        {
          id: 6,
          type: 'Program',
          title: 'Data Science Credit Program',
          college: 'College of Information'
        },
        {
          id: 7,
          type: 'Planned',
          title: 'Applied Artificial Intelligence Credit Program',
          college: 'College of Information'
        }
      ]
    }
  };
}

export async function getAdminCourseList(adminId: number, departmentId: number): Promise<CourseListResponse> {
  // TODO: mock data
  return {
    success: true,
    message: "取得 course list 成功",
    data: {
      courses: [
        {
          id: 1,
          code: "CS1101",
          name: "Intro to Programming",
          credit: 3,
          term: "Fall, 2025"
        },
        {
          id: 2,
          code: "CS1102",
          name: "Data Structures",
          credit: 3,
          term: "Spring, 2026"
        },
        {
          id: 3,
          code: "CS1103",
          name: "Algorithms",
          credit: 3,
          term: "Fall, 2026"
        },
        {
          id: 4,
          code: "CS1104",
          name: "Operating Systems",
          credit: 3,
          term: "Spring, 2027"
        },
        {
          id: 5,
          code: "CS1105",
          name: "Computer Networks",
          credit: 3,
          term: "Fall, 2027"
        }
      ]
    }
  };
}

export async function getAdminProgramDetail(adminId: number, programId: number): Promise<ProgramDetailResponse> {
  // TODO: mock data
  return {
    success: true,
    message: "取得 program detail 成功",
    data: {
      program: {
        id: 1,
        type: 'Major',
        title: 'B.S. Computer Science - 2020',
        college: 'College of Information',
      },
      rules: [
        {
          name: 'Core Courses',
          type: 'core',
          courses: [
            {
              id: 2010101,
              code: "ML_101",
              name: "機器學習概論",
              credit: 3
            },
            {
              id: 2010102,
              code: "DL_101",
              name: "深度學習基礎",
              credit: 3
            },
            {
              id: 2010103,
              code: "ALGO_101",
              name: "演算法設計",
              credit: 3
            },
            {
              id: 2010104,
              code: "PROB_101",
              name: "機率與統計",
              credit: 3
            }
          ]
        },
        {
          name: 'Elective Courses',
          type: 'elective',
          requiredCredits: 3,
          courses: [
            {
              id: 2020201,
              code: "NLP_101",
              name: "自然語言處理",
              credit: 3
            },
            {
              id: 2020202,
              code: "CV_101",
              name: "電腦視覺",
              credit: 3
            },
            {
              id: 2020203,
              code: "RL_101",
              name: "強化學習",
              credit: 3
            }
          ]
        },
        {
          name: 'Free Elective Courses',
          type: 'free_elective',
          requiredCredits: 6
        } 
      ]
    }
  };
}
}

export async function addNewProgram(adminId: number, program: Program): Promise<ProgramDetailResponse> {
  // TODO
  return fetch(`${BASE_URL}/api/admin/${adminId}/program`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(program),
  }).then(res => res.json());
}

export async function addNewCourse(adminId: number, course: Course): Promise<any> {
  // TODO
  return fetch(`${BASE_URL}/api/admin/${adminId}/course`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(course),
  }).then(res => res.json());
}

export async function deleteProgram(adminId: number, programId: number): Promise<any> {
  // TODO
  return fetch(`${BASE_URL}/api/admin/${adminId}/program/${programId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function deleteCourse(adminId: number, courseId: number): Promise<any> {
  // TODO
  return fetch(`${BASE_URL}/api/admin/${adminId}/course/${courseId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function editCourse(adminId: number, courseId: number, course: Course): Promise<any> {
  // TODO
  return fetch(`${BASE_URL}/api/admin/${adminId}/course/${courseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(course),
  }).then(res => res.json());
}
