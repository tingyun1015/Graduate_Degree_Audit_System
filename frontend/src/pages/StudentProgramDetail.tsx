import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Tag from '../components/Tag';
import {
  getStudentAudit,
  getStudentEnrollments,
  deleteStudentProgram,
  addPlannedCourse,
  deletePlannedCourse,
  getCourses,
} from '../api';
import type {
  Audit,
  AuditCourse,
  CourseStatus,
  StudentCourseRow,
  StudentProgramRule,
  StudentProgramDetailData,
} from '../types';

// ─────────────────────────────────────────────
// 課程狀態 → 圖示/顏色/動作 的對照表
// 用一張表決定三件事,程式就不用寫一堆 if
// ─────────────────────────────────────────────
const STATUS_META: Record<
  CourseStatus,
  { icon: string; color: string; action: string; actionColor: string }
> = {
  done: { icon: '✓', color: '#00836b', action: 'view', actionColor: '#23417d' },
  planned: { icon: '◐', color: '#23417d', action: 'remove', actionColor: '#23417d' },
  missing: { icon: '○', color: '#838383', action: 'add', actionColor: '#be3c32' },
};

// ─────────────────────────────────────────────
// 小元件:單一圓環(實心圈 + 中央分數 + 下方標籤)
// ─────────────────────────────────────────────
function Ring({ value, label, muted = false }: { value: string; label: string; muted?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2.5 w-20 shrink-0">
      <div
        className="w-20 h-20 rounded-full border-8 flex items-center justify-center"
        style={{ borderColor: muted ? '#d9d9d9' : '#23417d' }}
      >
        <span className="text-[13px] font-bold" style={{ color: muted ? '#999999' : '#000000' }}>
          {value}
        </span>
      </div>
      <span className="text-[10.8px] text-black text-center">{label}</span>
    </div>
  );
}

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
// 小元件:課程一列。顏色由狀態決定;欄位用固定寬度排成表格狀
// ─────────────────────────────────────────────
function CourseRow({
  course,
  onAdd,
  onRemove,
}: {
  course: StudentCourseRow;
  onAdd: (courseId: number) => void;
  onRemove: (courseId: number) => void;
}) {
  const meta = STATUS_META[course.status];
  return (
    <div className="flex items-center" style={{ color: meta.color }}>
      <span className="w-6 text-center font-bold text-[12px] shrink-0">{meta.icon}</span>
      <span className="w-[90px] font-semibold text-[12px] shrink-0">{course.code}</span>
      <span className="flex-1 font-semibold text-[11.4px] truncate">{course.name}</span>
      <span className="w-[55px] font-semibold text-[11.8px] shrink-0">{course.credits}</span>
      <span className="w-[75px] font-semibold text-[11px] shrink-0">{course.term}</span>
      {/* done 沒有動作;missing→add(加計畫)、planned→remove(移除計畫) */}
      {course.status === 'done' ? (
        <span className="w-[50px] shrink-0" />
      ) : (
        <button
          onClick={() =>
            course.status === 'missing'
              ? onAdd(course.courseId)
              : onRemove(course.courseId)
          }
          className="w-[50px] text-right text-[11.6px] underline shrink-0 cursor-pointer hover:opacity-70"
          style={{ color: meta.actionColor }}
        >
          {meta.action}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 小元件:一張 rule 卡(標題 + 分數 + 課程列 + 展開)
// ─────────────────────────────────────────────
function RuleCard({
  rule,
  onAdd,
  onRemove,
}: {
  rule: StudentProgramRule;
  onAdd: (courseId: number) => void;
  onRemove: (courseId: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
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
        {/* 課程列清單(收合時隱藏) */}
        {expanded && (
          <div className="flex flex-col gap-[5px]">
            {rule.courses.map((course) => (
              <CourseRow key={course.courseId} course={course} onAdd={onAdd} onRemove={onRemove} />
            ))}
          </div>
        )}
      </div>
      {/* 展開/收合 footer */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full border-t border-[#d9d9d9] pt-1 text-center text-[10px] font-medium text-[#23417d] cursor-pointer hover:opacity-70"
      >
        {expanded ? 'collapse ▴' : 'expand ▾'}
      </button>
    </section>
  );
}

// ─────────────────────────────────────────────
// 左欄:Program 摘要卡。圓環直接從 rules 算出來(每個 rule 一個圈)
// ─────────────────────────────────────────────
// 標籤樣式:planned(is_enrolled=false)→灰色 Planned;否則顯示類型
// Main Major→粉紅★ / Minor 等→淺藍(跟 Dashboard 一致)
function tagStyleFor(detail: StudentProgramDetailData): {
  content: string;
  color: string;
  textColor: string;
} {
  if (!detail.isEnrolled) {
    return { content: 'Planned', color: '#e4e4e4', textColor: '#555555' };
  }
  if (detail.programType === 'Main Major') {
    return { content: `★ ${detail.programType}`, color: '#ffb6b0', textColor: '#000000' };
  }
  // Minor 及其他類型
  return { content: detail.programType, color: '#e8edf7', textColor: '#2854c5' };
}

function ProgramSummaryCard({ detail }: { detail: StudentProgramDetailData }) {
  const tag = tagStyleFor(detail);
  return (
    <section className="bg-white border border-[#cccccc] rounded-[4px] px-[30px] py-[25px] flex flex-col gap-5">
      {/* 標籤 + 標題 + 學院 */}
      <div className="flex flex-col items-start gap-[5px]">
        <Tag content={tag.content} color={tag.color} textColor={tag.textColor} />
        <h2 className="text-[18px] font-bold text-[#23417d]">{detail.programName}</h2>
        <p className="text-[12px] text-black">{detail.collegeLine}</p>
      </div>

      {/* 圓環:每個 rule 一個。required 為 0 時顯示灰色「-」 */}
      <div className="flex flex-wrap gap-x-[65px] gap-y-4">
        {detail.rules.map((rule) => {
          const hasReq = rule.required > 0;
          return (
            <Ring
              key={rule.name}
              value={hasReq ? `${rule.earned}/${rule.required}` : '-'}
              label={rule.name}
              muted={!hasReq}
            />
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// 左欄:Add Planned Course 卡(搜尋框 + 下拉 + Add 按鈕)
// 打字 → GET /api/courses?name= 搜尋 → 點選一筆 → Add 送出
// ─────────────────────────────────────────────
function AddPlannedCourseCard({ onAdd }: { onAdd: (courseId: number) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AuditCourse[]>([]);
  const [selected, setSelected] = useState<AuditCourse | null>(null);

  // 打字就搜尋(簡單版,不做 debounce);清空就收起清單
  const handleChange = async (value: string) => {
    setQuery(value);
    setSelected(null);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    try {
      const courses = await getCourses(value.trim());
      setResults(courses.slice(0, 8));
    } catch (err) {
      console.error(err);
      setResults([]);
    }
  };

  const pick = (course: AuditCourse) => {
    setSelected(course);
    setQuery(`${course.course_code} ${course.course_name}`);
    setResults([]);
  };

  const handleAdd = () => {
    if (!selected) return;
    onAdd(selected.course_id);
    setQuery('');
    setSelected(null);
    setResults([]);
  };

  return (
    <section className="bg-white border border-[#cccccc] rounded-[4px] px-[25px] pt-[25px] pb-[10px] flex flex-col gap-5">
      <h3 className="text-[15px] font-bold text-[#23417d]">Add Planned Course</h3>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="search course name..."
          className="w-full h-10 border border-[#d9d9d9] rounded-[4px] px-3 text-[14px] placeholder:text-black/55 focus:outline-none focus:border-[#2854c5] transition-colors"
        />
        {results.length > 0 && (
          <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-[#d9d9d9] rounded-[4px] max-h-52 overflow-auto shadow">
            {results.map((c) => (
              <li
                key={c.course_id}
                onClick={() => pick(c)}
                className="px-3 py-2 text-[12px] hover:bg-[#f0f4fb] cursor-pointer"
              >
                <span className="font-semibold">{c.course_code}</span> {c.course_name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        onClick={handleAdd}
        disabled={!selected}
        className={`w-full h-[33px] text-white text-[12px] font-semibold rounded-[4px] ${
          selected
            ? 'bg-[#2854c5] hover:brightness-95 cursor-pointer'
            : 'bg-[#d9d9d9] cursor-not-allowed'
        }`}
      >
        Add
      </button>
    </section>
  );
}

// ─────────────────────────────────────────────
// 把後端 audit 回應 + enrollment 的 is_enrolled
// 組成畫面要的 StudentProgramDetailData
//  counted_courses → done / planned_courses → planned / missing_courses → missing
//  collegeLine、term 後端不提供(QA 已確認)→ 留空
// ─────────────────────────────────────────────
function auditToDetail(audit: Audit, isEnrolled: boolean): StudentProgramDetailData {
  const toRow = (status: CourseStatus) => (c: AuditCourse): StudentCourseRow => ({
    status,
    courseId: c.course_id,
    code: c.course_code,
    name: c.course_name,
    credits: String(c.credits),
    term: '',
  });

  return {
    programType: audit.program_type ?? '',
    programName: audit.program_name,
    collegeLine: '',
    isEnrolled,
    rules: audit.rules.map((rule) => ({
      name: rule.rule_name,
      earned: rule.earned_credits,
      required: rule.required_credits,
      courses: [
        ...rule.counted_courses.map(toRow('done')),
        ...rule.planned_courses.map(toRow('planned')),
        ...rule.missing_courses.map(toRow('missing')),
      ],
    })),
  };
}

// ═════════════════════════════════════════════
// 學生端:單一 Program 的詳細頁
// 從 Dashboard 點某個 program 的「Detail →」會進到這裡
// 網址型如 /program/102 ,102 就是 program_id
// ═════════════════════════════════════════════
export default function StudentProgramDetail() {
  // useParams 把網址裡的 :id 抓出來(字串)→ 轉成數字
  const { id } = useParams();
  const programId = Number(id);

  const navigate = useNavigate();
  // 登入時存進 localStorage 的資料(跟 Dashboard 用同一組 key)
  const studentId = Number(localStorage.getItem('student_id')) || 1;
  const userName = localStorage.getItem('user_name') || '王小明';

  const [detail, setDetail] = useState<StudentProgramDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 抽成函式,加/刪計畫課之後可以重抓刷新
  const loadDetail = useCallback(() => {
    // audit 沒有 is_enrolled,所以同時打 enrollments,用 program_id 對起來
    Promise.all([
      getStudentAudit(studentId, programId),
      getStudentEnrollments(studentId),
    ])
      .then(([audit, enrollments]) => {
        const match = enrollments.find((e) => e.program_id === programId);
        const isEnrolled = match?.is_enrolled ?? true;
        setDetail(auditToDetail(audit, isEnrolled));
      })
      .catch((err) => {
        console.error(err);
        setError('無法載入這個 program 的資料,請稍後再試');
      });
  }, [studentId, programId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // 把一門 missing 課加進計畫
  const handleAddPlanned = async (courseId: number) => {
    try {
      const res = await addPlannedCourse(studentId, courseId);
      if (!res.success) {
        window.alert(res.message || '加入失敗');
        return;
      }
      loadDetail();
    } catch (err) {
      console.error(err);
      window.alert(err instanceof Error ? err.message : 'Failed to add planned course, please try again later');
    }
  };

  // 從計畫移除一門 planned 課
  const handleRemovePlanned = async (courseId: number) => {
    if (!window.confirm('Remove the planned course?')) return;
    try {
      const res = await deletePlannedCourse(studentId, courseId);
      if (!res.success) {
        window.alert(res.message || 'remove failed');
        return;
      }
      loadDetail();
    } catch (err) {
      console.error(err);
      window.alert('Failed to remove planned course, please try again later');
    }
  };

  // 載入失敗 / 載入中
  if (error) {
    return <p className="p-5 text-[#be3c32]">{error}</p>;
  }
  if (!detail) {
    return <p className="p-5">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-[#fff8ef] flex flex-col">
      <Header userName={userName} />

      <main className="flex-1 w-full max-w-[1120px] mx-auto px-6 py-8 flex flex-col gap-6">
        {/* 頂部列:鏡像兩欄對齊 —— 左欄上方 Back,右欄上方 Curriculum Details + Print */}
        <div className="flex gap-6 items-start">
          <div className="w-[430px] shrink-0 flex justify-between items-start">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-[#2854c5] text-white text-[13px] font-medium rounded-[4px] px-3 py-1.5 hover:brightness-95 transition"
            >
              ← Back
            </button>
            {/* 只有 planned(is_enrolled=false)才出現 Delete Plan */}
            {!detail.isEnrolled && (
              <button
                onClick={async () => {
                  // 後端:DELETE /api/student/{sid}/programs/{pid}(只能刪 planned,已 enrolled 會被後端拒絕)
                  if (!window.confirm('Are you sure you want to delete this plan?')) return;
                  try {
                    const res = await deleteStudentProgram(studentId, programId);
                    if (!res.success) {
                      window.alert(res.message || 'Failed to delete plan, please try again later');
                      return;
                    }
                    navigate('/dashboard');
                  } catch (err) {
                    console.error(err);
                    window.alert('Failed to delete plan, please try again later');
                  }
                }}
                className="bg-[#c0392b] text-white text-[13px] font-medium rounded-[4px] px-3 py-1.5 hover:brightness-95 transition"
              >
                Delete Plan
              </button>
            )}
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

        {/* 左右兩欄內容(齊頭) */}
        <div className="flex gap-6 items-start">
          {/* 左欄(固定寬) */}
          <div className="w-[430px] shrink-0 flex flex-col gap-5">
            <ProgramSummaryCard detail={detail} />
            <AddPlannedCourseCard onAdd={handleAddPlanned} />
          </div>

          {/* 右欄(伸縮) */}
          <div className="flex-1 flex flex-col gap-4">
            {/* 只顯示「有課的」rule 卡(例如 Free Elective 沒課就只在左邊顯示「-」圈) */}
            {detail.rules
              .filter((rule) => rule.courses.length > 0)
              .map((rule) => (
                <RuleCard
                  key={rule.name}
                  rule={rule}
                  onAdd={handleAddPlanned}
                  onRemove={handleRemovePlanned}
                />
              ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
