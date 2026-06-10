import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Tag from '../components/Tag';
import Button from '../components/Button';
import Modal from '../components/Modal';
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
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';

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
function Ring({ earned, planned, required, label, muted = false }: { earned: number; planned: number; required: number; label: string; muted?: boolean }) {
  const earnedPercent = required > 0 ? Math.min(100, (earned / required) * 100) : 0;
  const plannedPercent = required > 0 ? Math.min(100, ((earned + planned) / required) * 100) : 0;
  const radius = 35;
  const circ = 2 * Math.PI * radius;
  const earnedOffset = circ - (earnedPercent / 100) * circ;
  const plannedOffset = circ - (plannedPercent / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2.5 shrink-0">
      <div className="relative w-20 h-20">
        <svg width="80" height="80" className="-rotate-90">
          <circle cx="40" cy="40" r={radius} fill="none" stroke={muted ? "#d9d9d9" : "#e5e0d8"} strokeWidth="8" />
          {!muted && (
            <circle
              cx="40" cy="40" r={radius} fill="none" stroke="#BF3C32" strokeWidth="8"
              strokeDasharray={circ} strokeDashoffset={plannedOffset} strokeLinecap="round"
            />
          )}
          {!muted && (
            <circle
              cx="40" cy="40" r={radius} fill="none" stroke="#2854c5" strokeWidth="8"
              strokeDasharray={circ} strokeDashoffset={earnedOffset} strokeLinecap="round"
            />
          )}
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[13px] font-bold leading-none" style={{ color: muted ? '#999999' : '#000000', marginTop: muted ? '0' : '4px' }}>
            {muted ? '-' : `${earned}/${required}`}
          </span>
          {!muted && planned > 0 && (
            <span className="text-[10px] font-semibold text-gray-500 leading-none mt-1">+{planned}</span>
          )}
        </span>
      </div>
      <span className="text-[10.8px] text-black text-center max-w-[80px] break-words leading-tight">{label}</span>
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
      <span className="text-gray-600">◐ Planned</span>
      <span className="text-gray-600">○ Missing</span>
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
        <span className="w-[50px] text-right text-[11.6px] shrink-0 text-gray-500">-</span>
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
  const planned_credit = rule.courses.filter(c => c.status === 'planned').reduce((acc, course) => acc + Number(course.credits), 0);
  return (
    <section className="bg-white border border-[#cccccc] rounded-[4px] px-[15px] pt-[15px] pb-[10px] flex flex-col gap-[14px]">
      <div className="flex flex-col gap-[15px]">
        {/* 標題列:左名稱、右分數 */}
        <div className="flex justify-between items-end">
          <span className="text-[15px] font-bold text-[#23417d]">{rule.name}</span>
          <span className="text-[15px] font-bold text-[#23417d]">
            {rule.earned}{planned_credit > 0 && <span className="text-gray-500"> + {planned_credit} (planned)</span>} / {rule.required}
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
        className="w-full border-t border-[#d9d9d9] pt-1 text-center text-[12px] font-medium text-[#23417d] cursor-pointer hover:opacity-70"
      >
        {expanded ? 'collapse ▴' : 'expand ▾'}
      </button>
    </section>
  );
}

function ProgramSummaryCard({ detail }: { detail: StudentProgramDetailData }) {
  return (
    <section className="bg-white border border-[#cccccc] rounded-[4px] px-[30px] py-[25px] flex flex-col gap-5">
      {/* 標籤 + 標題 + 學院 */}
      <div className="flex flex-col items-start gap-[5px]">
        <Tag content={detail.programType} />
        <h2 className="text-[18px] font-bold text-[#23417d]">{detail.programName}</h2>
        <p className="text-[12px] text-black">{detail.collegeLine}</p>
      </div>

      {/* 圓環:每個 rule 一個。required 為 0 時顯示灰色「-」 */}
      <div className="flex flex-wrap gap-x-3 gap-y-4 justify-between">
        {[...detail.rules].sort((a, b) => {
          const orderMap: Record<string, number> = {
            core: 1,
            required: 1,
            elective: 2,
            free_elective: 3,
          };
          return (orderMap[a.rule_type] || 4) - (orderMap[b.rule_type] || 4);
        }).map((rule) => {
          const hasReq = rule.required > 0;
          const planned = rule.courses.filter(c => c.status === 'planned').reduce((sum, c) => sum + Number(c.credits), 0);
          return (
            <Ring
              key={rule.name}
              earned={rule.earned}
              planned={planned}
              required={rule.required}
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
      rule_type: rule.rule_type,
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
  const { userId: studentId } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);

  const [isRemoveCourseModalOpen, setIsRemoveCourseModalOpen] = useState(false);
  const [courseToRemove, setCourseToRemove] = useState<number | null>(null);
  const [isDeletePlanModalOpen, setIsDeletePlanModalOpen] = useState(false);

  const [detail, setDetail] = useState<StudentProgramDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 抽成函式,加/刪計畫課之後可以重抓刷新
  const loadDetail = useCallback(() => {
    if (studentId === null) return;
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
        setError(err instanceof Error ? err.message : '無法載入這個 program 的資料,請稍後再試');
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
        showToast(res.message || 'Failed to add planned course', 'error');
        return;
      }
      showToast('Course added to plan', 'success');
      loadDetail();
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Failed to add planned course, please try again later', 'error');
    }
  };

  // 從計畫移除一門 planned 課 (觸發 Modal)
  const handleRemovePlanned = (courseId: number) => {
    setCourseToRemove(courseId);
    setIsRemoveCourseModalOpen(true);
  };

  // 確認移除 planned 課
  const confirmRemovePlanned = async () => {
    if (!courseToRemove) return;
    try {
      const res = await deletePlannedCourse(studentId, courseToRemove);
      if (!res.success) {
        showToast(res.message || 'Failed to remove planned course', 'error');
        setIsRemoveCourseModalOpen(false);
        return;
      }
      showToast('Planned course removed', 'success');
      setIsRemoveCourseModalOpen(false);
      loadDetail();
    } catch (err) {
      console.error(err);
      showToast('Failed to remove planned course, please try again later', 'error');
      setIsRemoveCourseModalOpen(false);
    }
  };

  // 確認刪除整個學程計畫
  const confirmDeletePlan = async () => {
    try {
      const res = await deleteStudentProgram(studentId, programId);
      if (!res.success) {
        showToast(res.message || 'Failed to delete plan, please try again later', 'error');
        setIsDeletePlanModalOpen(false);
        return;
      }
      showToast('Plan deleted successfully', 'success');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete plan, please try again later', 'error');
      setIsDeletePlanModalOpen(false);
    }
  };

  // 載入失敗 / 載入中
  if (error) {
    return <p className="p-5 text-[#be3c32]">{error}</p>;
  }


  return (
    <>
      {/* 頂部列:鏡像兩欄對齊 —— 左欄上方 Back,右欄上方 Curriculum Details + Print */}
        <div className="flex gap-6 items-start">
          <div className="w-[430px] shrink-0 flex justify-between items-start">
            <Button
              content="Back"
              color="#2854c5"
              hasLeftArrow={true}
              isFullWidth={false}
              onClick={() => navigate('/dashboard')}
            />
            {/* 只有 planned(is_enrolled=false)才出現 Delete Plan */}
            {detail && !detail.isEnrolled && (
              <Button
                content="Delete Plan"
                color="#c0392b"
                isFullWidth={false}
                onClick={() => setIsDeletePlanModalOpen(true)}
              />
            )}
          </div>
          <div className="flex-1 flex justify-between items-start">
            <div>
              <h3 className="text-[18px] font-bold text-[#23417d]">Curriculum Details</h3>
              <Legend />
            </div>
            <Button
              content="Print"
              color="#2854c5"
              isFullWidth={false}
              onClick={() => window.print()}
            />
          </div>
        </div>

        {/* 左右兩欄內容(齊頭) */}
        <div className="flex gap-6 items-start">
          {/* 左欄(固定寬) */}
          <div className="w-[430px] shrink-0 flex flex-col gap-5">
            {detail && <ProgramSummaryCard detail={detail} />}
            <AddPlannedCourseCard onAdd={handleAddPlanned} />
          </div>

          {/* 右欄(伸縮) */}
          <div className="flex-1 flex flex-col gap-4">
            {/* 只顯示有學分要求的 rule 卡，並依序由 core -> elective -> free 排序 */}
            {detail?.rules
              .filter((rule) => rule.required > 0)
              .sort((a, b) => {
                const orderMap: Record<string, number> = {
                  core: 1,
                  required: 1,
                  elective: 2,
                  free_elective: 3,
                };
                return (orderMap[a.rule_type] || 4) - (orderMap[b.rule_type] || 4);
              })
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

      <Modal 
        isOpen={isRemoveCourseModalOpen} 
        onClose={() => setIsRemoveCourseModalOpen(false)} 
        title="Remove Planned Course"
      >
        <div className="flex flex-col gap-6">
          <p className="text-[14px] text-gray-700">
            Are you sure you want to remove this planned course?
          </p>
          <div className="flex justify-end gap-3">
            <Button 
              content="Cancel"
              color="#6b7280"
              variant="outline"
              isFullWidth={false}
              onClick={() => setIsRemoveCourseModalOpen(false)}
            />
            <Button 
              content="Remove"
              color="#bf3c32"
              variant="solid"
              isFullWidth={false}
              onClick={confirmRemovePlanned}
            />
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isDeletePlanModalOpen} 
        onClose={() => setIsDeletePlanModalOpen(false)} 
        title="Delete Plan"
      >
        <div className="flex flex-col gap-6">
          <p className="text-[14px] text-gray-700">
            Are you sure you want to delete this plan?
          </p>
          <div className="flex justify-end gap-3">
            <Button 
              content="Cancel"
              color="#6b7280"
              variant="outline"
              isFullWidth={false}
              onClick={() => setIsDeletePlanModalOpen(false)}
            />
            <Button 
              content="Delete"
              color="#bf3c32"
              variant="solid"
              isFullWidth={false}
              onClick={confirmDeletePlan}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
