import { useEffect, useState } from 'react';
import Header from "../components/Header";
import Footer from "../components/Footer";
import AdminSidebar from "../components/AdminSidebar";
import Button from "../components/Button";
import { getAdminProgramDetail } from "../api";
import type { ProgramInfo, ProgramRule, Course } from "../types";
import { useParams } from "react-router-dom";


// 單一課程列元件
function CourseRow({ course }: { course: Course}) {
    return (
        <div className="flex items-center justify-between w-full py-1">
            <div className="flex items-center gap-3">
                <span className="text-[12px] text-black font-semibold">{course.id}</span>
                <span className="text-[11.4px] text-black">{course.name}</span>
            </div>
            <div className="flex items-center gap-5">
                <span className="text-[11.8px] text-black">{course.credit} cr</span>
                <button className="text-[10px] text-[#bf3c32] underline decoration-solid hover:text-red-700 transition-colors cursor-pointer">
                    remove
                </button>
            </div>
        </div>
    );
}

export default function AdminProgramDetail() {
    const userName = localStorage.getItem("user_name") || "";
    const adminId = localStorage.getItem("admin_id") || "";
    const [programDetail, setProgramDetail] = useState<ProgramInfo | null>(null);
    const [programRules, setProgramRules] = useState<ProgramRule[] | null>(null);
    const { id: programId } = useParams();

    useEffect(() => {
        getAdminProgramDetail(Number(adminId), Number(programId)).then((res) => {
            setProgramDetail(res.data.program);
            setProgramRules(res.data.rules);
            console.log(res.data);
        })
        .catch((error) => {
            console.error("Failed to fetch course list:", error);
        });
    }, []);

    if (!programDetail || !programRules) return null;

    return (
        <div className="min-h-screen flex flex-col bg-[#fff8ef]">
            <Header userName={userName} />
            <div className="flex-1 flex w-full mx-auto">
                <AdminSidebar activeTab="program" />
                <main className="flex-1 flex flex-col items-center pt-[50px] pb-10 px-[60px]">
                    <div className="w-full flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#23417d">
                                <path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 15.99L12 18.72L7 15.99V12.27L12 15L17 12.27V15.99Z"/>
                            </svg>
                            <h1 className="text-[19px] font-semibold text-[#23417d]">{programDetail.title}</h1>
                        </div>
                        {/* <button className="bg-[#2854c5] text-white text-[12px] font-semibold px-4 py-[9px] rounded-[4px] hover:bg-[#1f43a0] transition-colors cursor-pointer">
                            Print
                        </button> */}
                    </div>

                    <div className="grid grid-cols-3 gap-6 w-full mb-8">
                        {/* Required core */}
                        <div className="bg-white border border-[#ccc] rounded-[4px] px-[30px] py-[35px] flex items-end justify-between">
                            <span className="text-[#23417d] text-[15px] font-bold">Required core</span>
                            <span className="text-[#23417d] text-[15px] font-bold">35 of 35</span>
                        </div>
                        
                        {/* Elective */}
                        <div className="bg-white border border-[#ccc] rounded-[4px] px-[30px] py-[35px] flex items-end justify-between">
                            <span className="text-[#23417d] text-[15px] font-bold">Elective</span>
                            <div className="flex items-end gap-2">
                                <span className="text-[#23417d] text-[15px] font-bold">75 of 90</span>
                                <button className="text-[13px] text-black font-medium underline hover:text-gray-600 transition-colors cursor-pointer">edit</button>
                            </div>
                        </div>

                        {/* Free Elective */}
                        <div className="bg-white border border-[#ccc] rounded-[4px] px-[30px] py-[35px] flex items-end justify-between">
                            <span className="text-[#23417d] text-[15px] font-bold">Free Elective</span>
                            <div className="flex items-end gap-2">
                                <span className="text-[#23417d] text-[15px] font-bold">18</span>
                                <button className="text-[13px] text-black font-medium underline hover:text-gray-600 transition-colors cursor-pointer">edit</button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-[40px] w-full mb-[40px]">
                        
                        {/* 左欄: Required core */}
                        <div className="bg-white border border-[#ccc] rounded-[4px] p-5 flex flex-col gap-[25px]">
                            <div className="flex items-end justify-between w-full border-b border-transparent pb-1">
                                <h2 className="text-[#23417d] text-[15px] font-bold">Required core</h2>
                                <button className="text-[#0054fb] text-[13px] underline font-medium hover:text-blue-800 transition-colors cursor-pointer">
                                    add course
                                </button>
                            </div>
                            <div className="flex flex-col gap-[15px] w-full">
                                {programRules.find((rule) => rule.type === 'core')?.courses?.map((course, idx) => (
                                    <CourseRow key={`req-${idx}`} course={course} />
                                ))}
                            </div>
                        </div>

                        {/* 右欄: Elective */}
                        <div className="bg-white border border-[#ccc] rounded-[4px] p-5 flex flex-col gap-[25px]">
                            <div className="flex items-end justify-between w-full border-b border-transparent pb-1">
                                <h2 className="text-[#23417d] text-[15px] font-bold">Elective</h2>
                                <button className="text-[#0054fb] text-[13px] underline font-medium hover:text-blue-800 transition-colors cursor-pointer">
                                    add course
                                </button>
                            </div>
                            <div className="flex flex-col gap-[15px] w-full">
                                {programRules.find((rule) => rule.type === 'elective')?.courses?.map((course, idx) => (
                                    <CourseRow key={`elec-${idx}`} course={course} />
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* 最下方的刪除按鈕 */}
                    <div className="w-full max-w-[1000px] flex justify-center mb-8">
                        <button className="border border-[#bf3c32] text-[#bf3c32] text-[12px] font-semibold px-[12px] py-[9px] rounded-[4px] hover:bg-red-50 transition-colors cursor-pointer">
                            Delete Program
                        </button>
                    </div>

                </main>
            </div>
            
            <Footer />
        </div>
    );
}
