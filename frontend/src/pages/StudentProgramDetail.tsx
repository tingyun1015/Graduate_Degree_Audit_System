import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

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

        {/* TODO commit 2:左欄 Program 摘要卡(標籤、標題、3 個圓環、View) */}
        {/* TODO commit 3:右欄 Curriculum Details(rule 卡 + 課程列 + 圖例) */}
        {/* TODO commit 4:左欄 Add Planned Course */}
        <p className="text-gray-500">Program Detail(program #{programId})— 建置中</p>
      </main>

      <Footer />
    </div>
  );
}
