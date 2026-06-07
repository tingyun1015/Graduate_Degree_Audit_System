import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Tag from '../components/Tag';
import { getStudentProgramDetail } from '../api';
import type {
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
function CourseRow({ course }: { course: StudentCourseRow }) {
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
function RuleCard({ rule }: { rule: StudentProgramRule }) {
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
// 左欄:Add Planned Course 卡(搜尋框 + Add 按鈕)
// 後端還沒有「加選計畫」功能,所以 Add 先做成 disabled 灰色
// ─────────────────────────────────────────────
function AddPlannedCourseCard() {
  return (
    <section className="bg-white border border-[#cccccc] rounded-[4px] px-[25px] pt-[25px] pb-[10px] flex flex-col gap-5">
      <h3 className="text-[15px] font-bold text-[#23417d]">Add Planned Course</h3>
      <input
        type="text"
        placeholder="search course name or course id..."
        className="w-full h-10 border border-[#d9d9d9] rounded-[4px] px-3 text-[14px] placeholder:text-black/55 focus:outline-none focus:border-[#2854c5] transition-colors"
      />
      <button
        disabled
        className="w-full h-[33px] bg-[#d9d9d9] text-white text-[12px] font-semibold rounded-[4px] cursor-not-allowed"
      >
        Add
      </button>
    </section>
  );
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
  const userName = localStorage.getItem('user_name') || '王小明';

  // 用 id 去拿這個 program 的資料(目前是假資料,不同 id 回不同內容)
  const [detail, setDetail] = useState<StudentProgramDetailData | null>(null);

  useEffect(() => {
    getStudentProgramDetail(programId).then(setDetail);
  }, [programId]);

  // 資料還沒回來前先顯示載入中
  if (!detail) {
    return <p className="p-5">載入中...</p>;
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
                onClick={() => {
                  // 後端:DELETE /api/student/{sid}/programs/{pid}(只能刪 planned)
                  // 目前先做前端確認 + 退回 dashboard,接後端後再換成真的 fetch
                  if (window.confirm('確定要刪除這個計畫嗎?')) {
                    navigate('/dashboard');
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
            <AddPlannedCourseCard />
          </div>

          {/* 右欄(伸縮) */}
          <div className="flex-1 flex flex-col gap-4">
            {/* 只顯示「有課的」rule 卡(例如 Free Elective 沒課就只在左邊顯示「-」圈) */}
            {detail.rules
              .filter((rule) => rule.courses.length > 0)
              .map((rule) => (
                <RuleCard key={rule.name} rule={rule} />
              ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
