export interface SubRule {
  rule_name: string;
  earned: number;
  required: number;
}

export interface StudentInfo {
  degree_type: string;
  enrollment_semester: string;
  current_year: string;
  expected_graduation: string;
  current_gpa: number;
  total_required_credits: number;
}

export interface Program {
  program_id: number;
  program_name: string;
  program_type: string;
  college_name: string | null;
  is_main_major: boolean;
  sub_rules: SubRule[];
}

export interface Dashboard {
  student_info: StudentInfo;
  programs: Program[];
}

export interface LoginState {
  success: boolean;
  message: string;
  account: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  id: number;
  name: string;
  role: string;
}


// Admin Pages

export interface DepartmentInfo {
  id: number;
  name: string;
  college_name: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  id: number;
  name: string;
  departmentList: DepartmentInfo[];
}

export interface ProgramInfo {
  id: number;
  type: string;
  title: string;
  college: string;
}

export interface AdminProgramListResponse {
  success: boolean;
  message: string;
  data: {
    programs: ProgramInfo[];
  }
}

export interface ProgramDetailResponse {
  success: boolean;
  message: string;
  data: {
    program: ProgramInfo;
    rules: ProgramRule[];
  }
}

export interface ProgramRule {
  id: number;
  type: 'core' | 'elective' | 'free_elective';
  name: string;
  courses?: Course[];
  requiredCredits?: number;
}
  

export interface Course {
  id: number;
  course_code: string;
  course_name: string;
  credits: number;
  term?: string;
}
  
export interface CourseListResponse {
  total_pages: number;
  page_num: number;
  courses: Course[];
}

export interface CourseResponse {
  success: boolean;
  message: string;
  data: Course;
}


// Student Program Detail (學生端 program 詳細頁)

export type CourseStatus = 'done' | 'planned' | 'missing';

export interface StudentCourseRow {
  status: CourseStatus;
  courseId: number;   // 加/刪計畫課時要用,對應 audit 的 course_id
  code: string;
  name: string;
  credits: string;
  term: string;
}

export interface StudentProgramRule {
  name: string;
  earned: number;
  required: number;
  courses: StudentCourseRow[];
}

export interface StudentProgramDetailData {
  programType: string;   // 例:Main Major / Minor(admin 設定的類型)
  programName: string;   // 例:BS Computer Science
  collegeLine: string;   // 例:College of Information · Sep. 2023
  isEnrolled: boolean;   // 對應後端 enrollment 的 is_enrolled
                         // false = 學生自己加的計畫(planned),會顯示 Planned 標籤 + Delete Plan
  rules: StudentProgramRule[];
}


// Student Program Audit(學生端 audit API 回傳,對應後端 StudentProgramAuditResponse)

export interface AuditCourse {
  course_id: number;
  course_code: string;
  course_name: string;
  credits: number;
}

export interface AuditRule {
  rule_id: number;
  rule_name: string;
  rule_type: string;        // core / elective / free_elective
  required_credits: number;
  earned_credits: number;
  remaining_credits: number;
  counted_courses: AuditCourse[];  // 已修過(is_passed)→ 前端的 done
  planned_courses: AuditCourse[];  // 已加但未修過 → 前端的 planned
  missing_courses: AuditCourse[];  // 規則需要但沒修也沒加 → 前端的 missing
}

export interface Audit {
  student_id: number;
  program_id: number;
  program_name: string;
  program_type: string | null;
  can_graduate: boolean;
  rules: AuditRule[];
}

// 所有「會改資料」的 student endpoint 共用的回傳(對應後端 StudentActionResponse)
export interface StudentActionResponse {
  success: boolean;
  message: string;
}

// 學生的單筆 program enrollment(對應後端 EnrollmentItemResponse)
// audit 回應沒有 is_enrolled,要靠這支來判斷 planned(false)/enrolled(true)
export interface StudentEnrollment {
  program_id: number;
  program_name: string;
  program_type: string | null;
  is_enrolled: boolean;
}

// 課程目錄裡的一個 program(對應 GET /api/programs 的單筆,給 Add Program 下拉用)
export interface ProgramOption {
  program_id: number;
  program_name: string;
  program_type: string | null;
  total_credits_required: number;
  effective_year: number;
  is_published: boolean;
  dept_id: number | null;
}
