import type { Dashboard, LoginResponse, CourseListResponse, LoginAdminResponse, AdminProgramListResponse, ProgramDetailResponse, Program, Course, StudentProgramDetailData } from './types';
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

// Admin
export async function loginAdmin(email: string, password: string): Promise<LoginAdminResponse> {
  const response = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  return {
    ...data,
    departmentList: data.department_list ?? [],
  };
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
