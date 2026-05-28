# 前端元件規格（Frontend Component Spec）

> 本文件的「元件結構」與「型別」皆由後端 API 回傳格式推導而來（見文末對照表）。
> 元件的「樣式」（顏色、間距、排版）依 UI 設計稿補充，尚待確認。

---

## 定義 component 元件

### 元件樹

```
App
├── LoginPage
│   └── LoginForm
└── DashboardPage
    ├── StudentInfoCard
    └── ProgramCard（重複 N 次）
        └── SubRuleProgress（重複 M 次）
```

### 元件清單

| 元件 | 用途 | 接收的資料 (Props) | 被誰使用 |
| --- | --- | --- | --- |
| App | 根元件。判斷有沒有登入，決定顯示 LoginPage 或 DashboardPage | 無 | 入口 |
| LoginPage | 登入頁版面 | 無 | App |
| LoginForm | email/密碼輸入框 + 登入鈕，呼叫 `POST /api/login` | `onLoginSuccess(user)`：登入成功後通知 App | LoginPage |
| DashboardPage | 主頁。用 studentId 呼叫 `dashboard-all` 並分配資料 | `studentId: number` | App |
| StudentInfoCard | 上方摘要卡：學位別、入學、年級、預計畢業、GPA、總學分 | `info: StudentInfo` | DashboardPage |
| ProgramCard | 單一學程卡：標題 + 底下多條規則進度 | `program: Program` | DashboardPage（用 `.map` 重複） |
| SubRuleProgress | 單條規則的進度條（已修 / 需求） | `subRule: SubRule` | ProgramCard（用 `.map` 重複） |

### 設計重點

- `programs` 是陣列 → ProgramCard 用 `.map()` 重複渲染。
- 每個 program 的 `sub_rules` 也是陣列 → SubRuleProgress 再 `.map()` 重複。
- 登入拿到的 `id` 要往下傳給 DashboardPage 當作 `studentId`。

---

## 定義使用範例

### TypeScript 型別（`src/types.ts`）

```ts
export interface LoginResponse {
  success: boolean;
  message: string;
  id: number;
  name: string;
  role: 'student' | 'staff';
}

export interface SubRule {
  rule_name: string;
  earned: number;
  required: number;
}

export interface Program {
  program_id: number;
  program_name: string;
  program_type: string | null;
  college_name: string | null;
  is_main_major: boolean;
  sub_rules: SubRule[];
}

export interface StudentInfo {
  degree_type: string;
  enrollment_semester: string;
  current_year: string;
  expected_graduation: string;
  current_gpa: number;
  total_required_credits: number;
}

export interface DashboardData {
  student_info: StudentInfo;
  programs: Program[];
}
```

### 各元件使用範例

LoginForm —— 登入成功時把使用者資料往上傳：

```tsx
<LoginForm onLoginSuccess={(user) => setCurrentUser(user)} />
```

DashboardPage —— 拿登入後的 id 當 studentId：

```tsx
<DashboardPage studentId={currentUser.id} />
```

StudentInfoCard —— 接整包學生摘要：

```tsx
<StudentInfoCard info={data.student_info} />
```

ProgramCard + SubRuleProgress —— 用 `.map()` 重複渲染：

```tsx
{data.programs.map((program) => (
  <ProgramCard key={program.program_id} program={program} />
))}

// ProgramCard 內部：
{program.sub_rules.map((rule) => (
  <SubRuleProgress key={rule.rule_name} subRule={rule} />
))}
```

### 資料流

```
登入成功 → 存下 id/name/role → DashboardPage 用 id 打 API
→ 拿到 DashboardData → 分給 StudentInfoCard 和各 ProgramCard 顯示
```

---

## 附錄：前端型別 ← 後端來源對照

| 前端型別 | 後端來源 | 檔案 |
| --- | --- | --- |
| `LoginResponse` | `LoginResponse` | `backend/app/schemas.py` |
| `StudentInfo` | `StudentInfoResponse` | `backend/app/student_schemas.py` |
| `SubRule` | `RequirementSubRuleResponse` | `backend/app/student_schemas.py` |
| `Program` | `DashboardProgramResponse` | `backend/app/student_schemas.py` |
| `DashboardData` | `StudentDashboardAllResponse` | `backend/app/student_schemas.py` |

型別轉換規則：`str → string`、`int → number`、`bool → boolean`。後端回傳的 JSON key 與前端型別欄位名稱必須一致。
</content>
</invoke>
