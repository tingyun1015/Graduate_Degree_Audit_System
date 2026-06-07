import { useEffect, useState } from 'react';
import Header from "../components/Header";
import Footer from "../components/Footer";
import AdminSidebar from "../components/AdminSidebar";
import Tag from "../components/Tag";
import Button from "../components/Button";
import AddProgramModal from "../components/AddProgramModal";
import { getAdminProgramList } from "../api";
import type { ProgramInfo } from "../types";
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useAdminStore } from '../store/useAdminStore';

export default function AdminProgramList() {
    const { userId, departmentList: departments } = useAuthStore();
    const { activeDepartment, setActiveDepartment } = useAdminStore();
    const [data, setData] = useState<ProgramInfo[] | []>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!activeDepartment && departments?.length > 0) {
            setActiveDepartment(departments[0]);
        }
    }, [departments, activeDepartment, setActiveDepartment]);

    const fetchPrograms = () => {
        if (!activeDepartment?.id) return;
        getAdminProgramList(Number(userId), Number(activeDepartment.id)).then((result) => {
            setData(result.data.programs || []);
        }).catch(err => {
            console.error("Failed to fetch programs:", err);
            setData([]);
        });
    };

    useEffect(() => {
        fetchPrograms();
    }, [activeDepartment?.id]);

    return (
        <div className="min-h-screen flex flex-col bg-[#fff8ef]">
            <Header />
            <div className="flex-1 flex w-full mx-auto">
                <AdminSidebar activeTab="program" />
                
                <main className="flex-1 flex flex-col items-center pt-[50px] pb-10 px-[60px]">
                    <div className="w-full flex items-center justify-between mb-8">
                       <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="#23417d">
                                    <path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 15.99L12 18.72L7 15.99V12.27L12 15L17 12.27V15.99Z"/>
                                </svg>
                                <h1 className="text-[19px] font-semibold text-[#23417d]">Programs</h1>
                            </div>
                            
                            <div className="relative">
                                {activeDepartment ? (
                                    <div 
                                        className="flex items-center gap-3 cursor-pointer group bg-white border border-[#ccc] px-4 py-1.5 rounded-[4px] hover:border-[#23417d] transition-colors"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    >
                                        <div className="flex flex-col w-[280px] py-2">
                                            <span className="text-[14px] text-[#23417d] font-semibold leading-tight truncate">
                                                {activeDepartment.name}
                                            </span>
                                        </div>
                                        <span className={`text-[10px] text-black group-hover:text-[#23417d] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                                            ▼
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col cursor-wait opacity-50 px-4 py-1.5 border border-transparent">
                                        <span className="text-[14px] text-black">Loading...</span>
                                    </div>
                                )}

                                {/* Dropdown Menu */}
                                {isDropdownOpen && departments?.length > 0 && (
                                    <div className="absolute top-full left-0 w-[280px] bg-white border border-[#ccc] rounded-[4px] shadow-lg mt-1 z-10 overflow-hidden">
                                        {departments.map(dept => (
                                            <div 
                                                key={dept.id}
                                                className={`px-4 py-4 cursor-pointer transition-colors hover:bg-[#fff8ef] ${
                                                    activeDepartment?.id === dept.id ? 'bg-[#fcf9f5] border-l-2 border-[#23417d]' : 'border-l-2 border-transparent'
                                                }`}
                                                onClick={() => {
                                                    setActiveDepartment(dept);
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                <div className="text-[13px] text-[#23417d] font-semibold line-clamp-2">{dept.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>  
                    </div>

                    {/* 卡片 Grid 列表 */}
                    <div className="grid lg:grid-cols-2 gap-x-[40px] gap-y-[20px] w-full md:grid-cols-1">
                        {data.map((prog) => (
                            <div key={prog.id} className="bg-white border border-[#ccc] rounded-[4px] px-[30px] py-[35px] flex items-center gap-[10px] w-full min-h-[126px]">
                                <div className="flex flex-col items-start gap-[5px] flex-1 justify-center">
                                    <Tag 
                                        content={prog.type} 
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
                        <div 
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-white/50 border border-[#ccc] rounded-[4px] px-[30px] py-[35px] flex items-center justify-center w-full min-h-[126px] cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-[6px] text-black/70 font-bold">
                                <span className="text-[20px] leading-none mb-1">+</span>
                                <span className="text-[13px] leading-none">Add Program</span>
                            </div>
                        </div>
                    </div>

                </main>
            </div>
            
            <Footer />

            <AddProgramModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                departmentId={Number(activeDepartment?.id)}
                onSuccess={fetchPrograms}
            />
        </div>
    );
}