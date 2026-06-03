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
