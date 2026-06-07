import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Tag from '../components/Tag';

// ─────────────────────────────────────────────
// 小元件:單一圓環(實心圈 + 中央分數 + 下方標籤)
// 設計用 border 8px 的藍圈,中間放 earned/required
// ─────────────────────────────────────────────
function Ring({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 w-20 shrink-0">
      <div className="w-20 h-20 rounded-full border-8 border-[#23417d] flex items-center justify-center">
        <span className="text-[13px] font-bold text-black">{value}</span>
      </div>
      <span className="text-[10.8px] text-black text-center">{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// 左欄:Program 摘要卡
// 目前資料寫死(mock);commit 5 會改成從 api.ts 拿
// ─────────────────────────────────────────────
function ProgramSummaryCard() {
  return (
    <section className="bg-white border border-[#cccccc] rounded-[4px] px-[30px] py-[25px] flex flex-col gap-5">
      {/* 標籤 + 標題 + 學院 */}
      <div className="flex flex-col gap-[5px]">
        <Tag content="★ Main major" color="#ffb6b0" />
        <h2 className="text-[18px] font-bold text-[#23417d]">BS Computer Science</h2>
        <p className="text-[12px] text-black">College of Information · Sep. 2023</p>
      </div>

      {/* 三個圓環 */}
      <div className="flex gap-[65px]">
        <Ring value="32/35" label="Required core" />
        <Ring value="9/75" label="Elective" />
        <Ring value="6/18" label="Free Elective" />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// 課程狀態 → 圖示/顏色/動作 的對照表
// 用一張表決定三件事,程式就不用寫一堆 if
// ─────────────────────────────────────────────
type CourseStatus = 'done' | 'planned' | 'missing';

const STATUS_META: Record<
  CourseStatus,
  { icon: string; color: string; action: string; actionColor: string }
> = {
  done: { icon: '✓', color: '#00836b', action: 'view', actionColor: '#23417d' },
  planned: { icon: '◐', color: '#23417d', action: 'remove', actionColor: '#23417d' },
  missing: { icon: '○', color: '#838383', action: 'add', actionColor: '#be3c32' },
};

// 一門課一列的資料長相
interface CourseRowData {
  status: CourseStatus;
  code: string;
  name: string;
  credits: string;
  term: string;
}

// 一個 requirement rule(含底下的課)的資料長相
interface RuleData {
  name: string;
  earned: number;
  required: number;
  courses: CourseRowData[];
}

// 假資料(mock);commit 5 會改成從 api.ts 拿
const MOCK_RULES: RuleData[] = [
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
];

// ─────────────────────────────────────────────
// 小元件:圖例(✓ Done / ◐ Planned / ○ Missing)
// ─────────────────────────────────────────────
function Legend() {
  return (
    <div className="flex gap-3 text-[10.5px] font-bold mt-1">
      <span className="text-[#00836b]">✓ Done</span>
      <span className="text-black">◐ Planned</span>
      <span className="text-black">○ Missing</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// 小元件:課程一列
// 顏色由狀態決定;欄位用固定寬度排成表格狀
// ─────────────────────────────────────────────
function CourseRow({ course }: { course: CourseRowData }) {
  const meta = STATUS_META[course.status];
  return (
    <div className="flex items-center" style={{ color: meta.color }}>
      <span className="w-6 text-center font-bold text-[12px] shrink-0">{meta.icon}</span>
      <span className="w-[90px] font-semibold text-[12px] shrink-0">{course.code}</span>
      <span className="flex-1 font-semibold text-[11.4px] truncate">{course.name}</span>
      <span className="w-[55px] font-semibold text-[11.8px] shrink-0">{course.credits}</span>
      <span className="w-[75px] font-semibold text-[11px] shrink-0">{course.term}</span>
      <span
        className="w-[50px] text-right text-[11.6px] underline shrink-0 cursor-pointer"
        style={{ color: meta.actionColor }}
      >
        {meta.action}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// 小元件:一張 rule 卡(標題 + 分數 + 課程列 + 展開)
// ─────────────────────────────────────────────
function RuleCard({ rule }: { rule: RuleData }) {
  return (
    <section className="bg-white border border-[#cccccc] rounded-[4px] px-[15px] pt-[15px] pb-[10px] flex flex-col gap-[14px]">
      <div className="flex flex-col gap-[15px]">
        {/* 標題列:左名稱、右分數 */}
        <div className="flex justify-between items-end">
          <span className="text-[15px] font-bold text-[#23417d]">{rule.name}</span>
          <span className="text-[15px] font-bold text-[#23417d]">
            {rule.earned} / {rule.required}
          </span>
        </div>
        {/* 課程列清單 */}
        <div className="flex flex-col gap-[5px]">
          {rule.courses.map((course) => (
            <CourseRow key={course.code} course={course} />
          ))}
        </div>
      </div>
      {/* 展開 footer */}
      <div className="border-t border-[#d9d9d9] pt-1 text-center text-[10px] font-medium text-[#23417d] cursor-pointer">
        expand ▾
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════
// 學生端:單一 Program 的詳細頁
// 從 Dashboard 點某個 program 的「Detail →」會進到這裡
// 網址型如 /program/102 ,102 就是 program_id
// ═════════════════════════════════════════════
export default function StudentProgramDetail() {
  // commit 5 會用 useParams 抓網址的 :id 去拿對應 program 的資料
  // 目前先用寫死的 mock 資料,所以還不需要 id
  const navigate = useNavigate();
  const userName = localStorage.getItem('user_name') || '王小明';

  return (
    <div className="min-h-screen bg-[#fff8ef] flex flex-col">
      <Header userName={userName} />

      <main className="flex-1 w-full max-w-[1120px] mx-auto px-6 py-8 flex flex-col gap-6">
        {/* 頂部列:鏡像兩欄對齊 —— 左欄上方 Back,右欄上方 Curriculum Details + Print */}
        <div className="flex gap-6 items-start">
          <div className="w-[430px] shrink-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-[#2854c5] text-white text-[13px] font-medium rounded-[4px] px-3 py-1.5 hover:brightness-95 transition"
            >
              ← Back
            </button>
          </div>
          <div className="flex-1 flex justify-between items-start">
            <div>
              <h3 className="text-[18px] font-bold text-[#23417d]">Curriculum Details</h3>
              <Legend />
            </div>
            <button
              onClick={() => window.print()}
              className="bg-[#2854c5] text-white text-[13px] font-medium rounded-[4px] px-4 py-1.5 hover:brightness-95 transition"
            >
              Print
            </button>
          </div>
        </div>

        {/* 左右兩欄:左 = 摘要/加選,右 = 課表 */}
        <div className="flex gap-6 items-start">
          {/* 左欄(固定寬) */}
          <div className="w-[430px] shrink-0 flex flex-col gap-5">
            <ProgramSummaryCard />
            {/* TODO commit 4:Add Planned Course 卡 */}
          </div>

          {/* 右欄(伸縮) —— 標題與圖例已移到上方頂部列,讓左右白卡齊頭 */}
          <div className="flex-1 flex flex-col gap-4">
            {MOCK_RULES.map((rule) => (
              <RuleCard key={rule.name} rule={rule} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
