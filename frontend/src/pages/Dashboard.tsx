import { useEffect, useState } from 'react';
import { getDashboard } from '../api';
import type { Dashboard, Program } from '../types';

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
// 小元件:學程類型標籤(Main Major 紅 / Minor 藍)
// ─────────────────────────────────────────────
function ProgramTag({ type }: { type: string }) {
  const isMain = type === 'Main Major';
  return (
    <span
      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
        isMain ? 'bg-[#ffece9] text-[#c0392b]' : 'bg-[#e8edf7] text-[#2854c5]'
      }`}
    >
      {isMain ? '★ Main Major' : type}
    </span>
  );
}

// ─────────────────────────────────────────────
// 小元件:Detail 按鈕
// (Program Detail 頁的後端 API 還沒有,所以先當佔位、不跳轉)
// ─────────────────────────────────────────────
function DetailButton() {
  return (
    <button className="bg-[#2854c5] text-white text-sm font-medium px-4 py-1.5 rounded hover:bg-[#1f43a0] transition-colors">
      Detail →
    </button>
  );
}

// ═════════════════════════════════════════════
// 主畫面
// ═════════════════════════════════════════════
export default function Dashboard() {
  const [data, setData] = useState<Dashboard | null>(null);

  // 從登入時存進 localStorage 的資料讀取;
  // 若沒有(例如直接打開 /dashboard 沒先登入),就退回測試用的 1 號 / 王小明
  const studentId = Number(localStorage.getItem('student_id')) || 1;
  const userName = localStorage.getItem('user_name') || '王小明';

  useEffect(() => {
    getDashboard(studentId).then((result) => {
      setData(result);
    });
  }, [studentId]);

  if (!data) {
    return <p className="p-5">載入中...</p>;
  }

  const { student_info, programs } = data;

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
    <div className="min-h-screen bg-[#fff8ef] flex flex-col">

      {/* ① 頂部導覽列 */}
      <header className="bg-[#1f3a5f] text-white flex items-center justify-between px-8 h-16 shrink-0">
        <div className="flex items-center gap-2 font-bold text-lg">
          <span>✦</span>
          <span>Degree Audit</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-medium">{userName}</span>
          <div className="w-9 h-9 rounded-full bg-white text-[#1f3a5f] flex items-center justify-center font-bold">
            {userName.charAt(0)}
          </div>
        </div>
      </header>

      {/* 主內容區(置中、限制最大寬度) */}
      <main className="flex-1 w-full max-w-[1120px] mx-auto px-6 py-8 flex flex-col gap-6">

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
                  <DetailButton />
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
              <ProgramTag type={program.program_type ?? ''} />
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
            <DetailButton />
          </section>
        ))}

        {/* ⑤ Additional Programs 區(輔系環圈 + 新增學程) */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Additional Programs
          </h3>
          <div className="grid grid-cols-2 gap-6">
            {/* 其他學程(如 Minor):用環圈呈現 */}
            {otherPrograms.map((program) => {
              const { earned, required } = programTotals(program);
              return (
                <div
                  key={program.program_id}
                  className="bg-white border border-[#e5e0d8] rounded-lg px-6 py-5 flex items-center gap-5"
                >
                  <div className="flex-1">
                    <ProgramTag type={program.program_type ?? ''} />
                    <h4 className="text-[#1f3a5f] font-bold mt-2">{program.program_name}</h4>
                    {program.college_name && (
                      <p className="text-xs text-gray-500 mt-0.5">{program.college_name}</p>
                    )}
                  </div>
                  <ProgressRing earned={earned} required={required} />
                  <DetailButton />
                </div>
              );
            })}

            {/* 新增學程的佔位卡(虛線框;後端 API 還沒有,先不接功能) */}
            <button className="border-2 border-dashed border-[#d9d4cc] rounded-lg px-6 py-5 flex items-center justify-center text-gray-500 hover:border-[#2854c5] hover:text-[#2854c5] transition-colors">
              + Add Program
            </button>
          </div>
        </section>

      </main>

      {/* 頁尾 */}
      <footer className="text-center text-[10.5px] text-gray-400 py-3 shrink-0">
        v0.1 · NCCU DBMS Group 8
      </footer>
    </div>
  );
}
