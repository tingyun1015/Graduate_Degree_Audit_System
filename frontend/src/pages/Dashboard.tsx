import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, getAllPrograms, addStudentProgram } from '../api';
import type { Dashboard, Program, ProgramOption } from '../types';
import Tag from '../components/Tag';
import Button from '../components/Button';
import { useAuthStore } from '../store/useAuthStore';

// ─────────────────────────────────────────────
// 小工具:算出單一 program 的 earned / required 總和
// (把該 program 底下所有 sub_rule 的數字加起來)
// ─────────────────────────────────────────────
function programTotals(program: Program) {
  const earned = program.sub_rules.reduce((sum, r) => sum + r.earned, 0);
  const required = program.sub_rules.reduce((sum, r) => sum + r.required, 0);
  return { earned, required };
}

// ─────────────────────────────────────────────
// 小元件:水平進度條
// props(傳進來的參數):earned 已修、required 需要
// ─────────────────────────────────────────────
function ProgressBar({ earned, required }: { earned: number; required: number }) {
  // 算百分比;required 為 0 時避免除以 0,最多 100%
  const percent = required > 0 ? Math.min(100, Math.round((earned / required) * 100)) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-[#e5e0d8] overflow-hidden">
      {/* 內層藍條:寬度用 style 動態設定成百分比 */}
      <div className="h-full rounded-full bg-[#2854c5]" style={{ width: `${percent}%` }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// 小元件:環圈進度(用 SVG 畫圓)
// ─────────────────────────────────────────────
function ProgressRing({ earned, required }: { earned: number; required: number }) {
  const percent = required > 0 ? Math.min(100, (earned / required) * 100) : 0;
  const radius = 30;                          // 圓半徑
  const circ = 2 * Math.PI * radius;          // 圓周長
  const offset = circ - (percent / 100) * circ; // 用「空白長度」來表現進度

  return (
    <div className="relative w-[78px] h-[78px] shrink-0">
      {/* -rotate-90 讓進度從 12 點鐘方向開始 */}
      <svg width="78" height="78" className="-rotate-90">
        {/* 背景灰圈 */}
        <circle cx="39" cy="39" r={radius} fill="none" stroke="#e5e0d8" strokeWidth="7" />
        {/* 前景藍圈(進度) */}
        <circle
          cx="39" cy="39" r={radius} fill="none" stroke="#2854c5" strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        />
      </svg>
      {/* 圓中央的數字(用絕對定位疊在圓上) */}
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
        {earned}/{required}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// 小元件:Detail 按鈕
// 點下去跳到該 program 的詳細頁 /program/:id
// ─────────────────────────────────────────────
function DetailButton({ programId }: { programId: number }) {
  const navigate = useNavigate();
  return (
    <Button 
      content="Detail"
      color="#2854c5"
      hasArrow={true}
      isFullWidth={false}
      onClick={() => navigate(`/program/${programId}`)}
    />
  );
}

// ─────────────────────────────────────────────
// 小元件:新增學程的彈出視窗(+ New Program)
// 選一個尚未加入的已發布 program → Create → 建立 planned enrollment
// ─────────────────────────────────────────────
function NewProgramModal({
  options,
  onClose,
  onCreate,
}: {
  options: ProgramOption[];
  onClose: () => void;
  onCreate: (programId: number) => void;
}) {
  const [selectedId, setSelectedId] = useState<number | ''>('');

  return (
    // 半透明遮罩;點遮罩關閉,點視窗本身不關(stopPropagation)
    <div
      className="fixed inset-0 z-100 bg-black/30 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-[640px] p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題列 */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-[#1f3a5f]">+ New Program</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 下拉:可加入的 program */}
        <label className="block text-sm text-gray-600 mb-1.5">Select Program</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : '')}
          className="w-full h-11 border border-[#d9d4cc] rounded px-3 text-sm bg-white focus:outline-none focus:border-[#2854c5] transition-colors"
        >
          <option value="">
            {options.length ? '— Select —' : 'No available programs to join'}
          </option>
          {options.map((p) => (
            <option key={p.program_id} value={p.program_id}>
              {p.program_name}
              {p.program_type ? ` (${p.program_type})` : ''}
            </option>
          ))}
        </select>

        {/* Create */}
        <div className="flex justify-end mt-8">
          <button
            onClick={() => selectedId !== '' && onCreate(selectedId)}
            disabled={selectedId === ''}
            className={`text-white text-sm font-semibold rounded px-6 py-2 ${
              selectedId !== ''
                ? 'bg-[#2854c5] hover:bg-[#1f43a0] cursor-pointer'
                : 'bg-[#d9d9d9] cursor-not-allowed'
            }`}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════
// 主畫面
// ═════════════════════════════════════════════
export default function Dashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [programOptions, setProgramOptions] = useState<ProgramOption[]>([]);

  const { userId: studentId } = useAuthStore();

  const loadDashboard = () => {
    getDashboard(studentId!)
      .then(setData)
      .catch((err) => {
        console.error(err);
        window.alert('無法取得 dashboard 資料');
        
      })
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (!data) {
    return <p className="p-5">載入中...</p>;
  }

  const { student_info, programs } = data;

  // 開啟視窗:抓所有 program,只留「已發布且尚未加入」的當選項
  const openAddProgram = async () => {
    try {
      const all = await getAllPrograms();
      const enrolledIds = new Set(programs.map((p) => p.program_id));
      setProgramOptions(all.filter((p) => p.is_published && !enrolledIds.has(p.program_id)));
      setModalOpen(true);
    } catch (err) {
      console.error(err);
      window.alert('無法取得可加入的 program');
    }
  };

  // 送出:建立 planned enrollment(is_enrolled=false)→ 關窗 + 刷新
  const handleCreate = async (programId: number) => {
    try {
      const res = await addStudentProgram(studentId, programId);
      if (!res.success) {
        window.alert(res.message || '加入失敗');
        return;
      }
      setModalOpen(false);
      loadDashboard();
    } catch (err) {
      console.error(err);
      window.alert('加入 program 失敗,請稍後再試');
    }
  };

  // ── 衍生計算 ──
  // 已修總學分 = 所有 program 所有 sub_rule 的 earned 加總
  const totalEarned = programs
    .flatMap((p) => p.sub_rules)
    .reduce((sum, r) => sum + r.earned, 0);

  // 把 programs 分成三類,方便分區顯示
  const universityPrograms = programs.filter((p) => p.program_type === 'University Requirements');
  const mainMajorPrograms = programs.filter((p) => p.is_main_major);
  const otherPrograms = programs.filter(
    (p) => p.program_type !== 'University Requirements' && !p.is_main_major
  );

  // 學程數 = 非校定必修的數量(Main Major + 其他)
  const programCount = mainMajorPrograms.length + otherPrograms.length;

  return (
    <>
      {/* ② 總覽卡片 */}
        <section className="bg-white border border-[#e5e0d8] rounded-lg px-8 py-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-[#1f3a5f] text-xl font-bold">{student_info.degree_type}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {student_info.enrollment_semester} · {student_info.current_year}
            </p>
          </div>
          <div>
            <span className="text-2xl font-bold">{totalEarned}</span>
            <span className="text-gray-500"> / {student_info.total_required_credits} cr</span>
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">Programs</p>
            <p className="text-xl font-bold">{programCount}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">GPA</p>
            <p className="text-xl font-bold">{student_info.current_gpa}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">Expected grad.</p>
            <p className="text-xl font-bold">{student_info.expected_graduation}</p>
          </div>
        </section>

        {/* ③ University Requirements 區 */}
        {universityPrograms.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              University Requirements
            </h3>
            {universityPrograms.map((program) => {
              const { earned, required } = programTotals(program);
              return (
                <div
                  key={program.program_id}
                  className="bg-white border border-[#e5e0d8] rounded-lg px-8 py-5 flex items-center gap-8"
                >
                  {/* 左:名稱 + 整體進度條 */}
                  <div className="w-[260px] shrink-0">
                    <h4 className="text-[#1f3a5f] font-bold">{program.program_name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5 mb-2">
                      {earned} / {required} credits
                    </p>
                    <ProgressBar earned={earned} required={required} />
                  </div>

                  {/* 中:每個子規則的小數字 */}
                  <div className="flex-1 flex gap-10">
                    {program.sub_rules.map((rule) => (
                      <div key={rule.rule_name}>
                        <p className="text-xs text-gray-500">{rule.rule_name}</p>
                        <p className="font-bold">
                          {rule.earned}/{rule.required}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* 右:Detail 按鈕 */}
                  <DetailButton programId={program.program_id} />
                </div>
              );
            })}
          </section>
        )}

        {/* ④ Main Major 卡片(每個子規則一條進度條) */}
        {mainMajorPrograms.map((program) => (
          <section
            key={program.program_id}
            className="bg-white border border-[#e5e0d8] rounded-lg px-8 py-5 flex items-center gap-8"
          >
            {/* 左:標籤 + 名稱 + 學院 */}
            <div className="w-[260px] shrink-0">
              <Tag content={program.program_type ?? ''} />
              <h4 className="text-[#1f3a5f] font-bold mt-2">{program.program_name}</h4>
              {program.college_name && (
                <p className="text-xs text-gray-500 mt-0.5">{program.college_name}</p>
              )}
            </div>

            {/* 中:子規則的進度條清單 */}
            <div className="flex-1 flex flex-col gap-2">
              {program.sub_rules.map((rule) => (
                <div key={rule.rule_name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-28 shrink-0">{rule.rule_name}</span>
                  <ProgressBar earned={rule.earned} required={rule.required} />
                  <span className="text-xs text-gray-600 w-12 text-right shrink-0">
                    {rule.earned}/{rule.required}
                  </span>
                </div>
              ))}
            </div>

            {/* 右:Detail 按鈕 */}
            <DetailButton programId={program.program_id} />
          </section>
        ))}

        {/* ⑤ Additional Programs 區(輔系環圈 + 新增學程) */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Additional Programs
          </h3>
          <div className="grid grid-cols-2 gap-6 auto-rows-fr">
            {/* 其他學程(如 Minor):用環圈呈現 */}
            {otherPrograms.map((program) => {
              const { earned, required } = programTotals(program);
              return (
                <div
                  key={program.program_id}
                  className="bg-white border border-[#e5e0d8] rounded-lg px-6 py-5 flex items-center gap-5 h-full"
                >
                  <div className="flex-1">
                    <Tag 
                      content={program.program_type ?? ''}
                    />
                    <h4 className="text-[#1f3a5f] font-bold mt-2">{program.program_name}</h4>
                    {program.college_name && (
                      <p className="text-xs text-gray-500 mt-0.5">{program.college_name}</p>
                    )}
                  </div>
                  <ProgressRing earned={earned} required={required} />
                  <DetailButton programId={program.program_id} />
                </div>
              );
            })}

            {/* 新增學程:點擊開啟 + New Program 視窗 */}
            <button
              onClick={openAddProgram}
              className="border-2 border-dashed border-[#d9d4cc] rounded-lg px-6 py-5 flex items-center justify-center text-gray-500 hover:border-[#2854c5] hover:text-[#2854c5] transition-colors cursor-pointer h-full"
            >
              + Add Program
            </button>
          </div>
        </section>

      {/* 彈跳視窗:Add Program */}
      {isModalOpen && (
        <NewProgramModal
          options={programOptions}
          onClose={() => setModalOpen(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  );
}
