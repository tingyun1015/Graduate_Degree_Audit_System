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
  type: 'core' | 'elective' | 'free_elective';
  name: string;
  courses?: Course[];
  requiredCredits?: number;
}
  

export interface Course {
  id: number;
  code: string;
  name: string;
  credit: number;
}
  
