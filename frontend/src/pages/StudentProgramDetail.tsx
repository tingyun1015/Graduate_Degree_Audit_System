import { useParams, useNavigate } from 'react-router-dom';
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

      {/* View 按鈕 */}
      <button className="self-start bg-[#2854c5] text-white text-[12px] font-semibold rounded-[4px] px-3 py-[9px] hover:brightness-95 transition">
        View →
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
  // useParams 會把網址裡的 :id 抓出來(字串),再轉成數字
  const { id } = useParams();
  const programId = Number(id);

  const navigate = useNavigate();
  const userName = localStorage.getItem('user_name') || '王小明';

  return (
    <div className="min-h-screen bg-[#fff8ef] flex flex-col">
      <Header userName={userName} />

      <main className="flex-1 w-full max-w-[1120px] mx-auto px-6 py-8 flex flex-col gap-6">
        {/* 返回 Dashboard 的連結 */}
        <button
          onClick={() => navigate('/dashboard')}
          className="self-start text-sm text-[#23417d] hover:underline"
        >
          ← Back to Dashboard
        </button>

        {/* 左右兩欄:左 = 摘要/加選,右 = 課表 */}
        <div className="flex gap-6 items-start">
          {/* 左欄(固定寬) */}
          <div className="w-[430px] shrink-0 flex flex-col gap-5">
            <ProgramSummaryCard />
            {/* TODO commit 4:Add Planned Course 卡 */}
          </div>

          {/* 右欄(伸縮) */}
          <div className="flex-1 flex flex-col gap-4">
            {/* TODO commit 3:Curriculum Details(rule 卡 + 課程列 + 圖例) */}
            <p className="text-gray-400 text-sm">右欄 Curriculum Details(program #{programId})— 建置中</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
