import { useEffect, useState } from 'react';
import Header from "../components/Header";
import Footer from "../components/Footer";
import AdminSidebar from "../components/AdminSidebar";
import Tag from "../components/Tag";
import Button from "../components/Button";
import { getAdminProgramList } from "../api";
import type { ProgramInfo } from "../types";
import { useNavigate } from 'react-router-dom';


// 小工具：取得對應標籤的背景色
function getTagColor(type: string) {
    switch (type) {
        case 'Major': return '#ffb6b0';
        case 'Minor': return '#c2d3ff';
        case 'Program': return '#97ffb3';
        case 'Planned': return '#d0cac2';
        default: return '#cccccc';
    }
}

export default function AdminProgramList() {
    const userName = localStorage.getItem("user_name") || "";
    const adminId = localStorage.getItem("admin_id") || "";
    const collegeId = localStorage.getItem("college_id") || "";
    const [data, setData] = useState<ProgramInfo[] | []>([]);
    const navigate = useNavigate();
    useEffect(() => {
        getAdminProgramList(Number(adminId), Number(collegeId)).then((result) => {
        setData(result.data.programs);
    });
  }, [adminId]);

    return (
        <div className="min-h-screen flex flex-col bg-[#fff8ef]">
            <Header userName={userName} />
            
            {/* 畫面主體 (側邊欄 + 右側內容) */}
            <div className="flex-1 flex w-full mx-auto">
                <AdminSidebar activeTab="programs" />
                
                <main className="flex-1 flex flex-col items-center pt-[50px] pb-10 px-[60px]">
                    <div className="w-full flex items-center justify-between mb-8">
                       <div className="flex items-center gap-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#23417d">
                                <path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 15.99L12 18.72L7 15.99V12.27L12 15L17 12.27V15.99Z"/>
                            </svg>
                            <h1 className="text-[19px] font-semibold text-[#23417d]">Programs</h1>
                        </div>  
                    </div>

                    {/* 卡片 Grid 列表 */}
                    <div className="grid grid-cols-2 gap-x-[40px] gap-y-[20px] w-full">
                        {data.map((prog) => (
                            <div key={prog.id} className="bg-white border border-[#ccc] rounded-[4px] px-[30px] py-[35px] flex items-center gap-[10px] w-full h-[126px]">
                                <div className="flex flex-col items-start gap-[5px] flex-1">
                                    <Tag 
                                        content={prog.type} 
                                        color={getTagColor(prog.type)} 
                                        textColor="black"
                                    />
                                    <h4 className="text-[#23417d] text-[14.4px] font-bold mt-1 leading-tight">{prog.title}</h4>
                                    <p className="text-[10.3px] text-black mt-0.5">{prog.college}</p>
                                </div>
                                <Button 
                                    content="Details"
                                    color="#2854c5"
                                    hasArrow={true}
                                    isFullWidth={false}
                                    onClick={() => navigate(`/admin/program/${prog.id}`)}
                                />
                            </div>
                        ))}

                        {/* 新增 Program 卡片 */}
                        <div className="bg-white/50 border border-[#ccc] rounded-[4px] px-[30px] py-[35px] flex items-center justify-center w-full h-[126px] cursor-pointer hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-[6px] text-black/70 font-bold">
                                <span className="text-[20px] leading-none mb-1">+</span>
                                <span className="text-[13px] leading-none">Add Program</span>
                            </div>
                        </div>
                    </div>

                </main>
            </div>
            
            <Footer />
        </div>
    );
}