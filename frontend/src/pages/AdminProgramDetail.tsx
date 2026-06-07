import { useEffect, useState } from 'react';
import Header from "../components/Header";
import Footer from "../components/Footer";
import AdminSidebar from "../components/AdminSidebar";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { getAdminProgramDetail, deleteProgram, removeCourseFromProgramRule } from "../api";
import type { ProgramInfo, ProgramRule, Course } from "../types";
import { useParams, useNavigate } from "react-router-dom";
import EditProgramRuleModal from "../components/EditProgramRuleModal";
import AddCourseToRuleModal from "../components/AddCourseToRuleModal";


// 單一課程列元件
function CourseRow({ course, ruleId, onRemove }: { course: Course, ruleId: number, onRemove: (rId: number, cId: number) => void}) {
    return (
        <div className="flex items-center justify-between w-full py-1">
            <div className="flex items-center gap-3">
                <span className="text-[12px] text-black font-semibold">{course.course_code}</span>
                <span className="text-[12px] text-black">{course.course_name}</span>
            </div>
            <div className="flex items-center gap-5">
                <span className="text-[12px] text-black">{course.credits} cr</span>
                <button 
                    onClick={() => onRemove(ruleId, course.id)}
                    className="text-[12px] text-[#bf3c32] underline decoration-solid hover:text-red-700 transition-colors cursor-pointer"
                >
                    remove
                </button>
            </div>
        </div>
    );
}

export default function AdminProgramDetail() {
    const [programDetail, setProgramDetail] = useState<ProgramInfo | null>(null);
    const [programRules, setProgramRules] = useState<ProgramRule[] | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
    const [isEditRuleModalOpen, setIsEditRuleModalOpen] = useState(false);
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    
    const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
    const [selectedRuleCredits, setSelectedRuleCredits] = useState<number>(0);

    const { id: programId } = useParams();
    const navigate = useNavigate();

    const fetchProgramData = () => {
        if (!programId) return;
        getAdminProgramDetail(Number(programId)).then((res) => {
            setProgramDetail(res.data.program);
            setProgramRules(res.data.rules);
        })
        .catch((error) => {
            console.error("Failed to fetch program detail:", error);
        });
    };

    const handleRemoveCourse = async (ruleId: number, courseId: number) => {
        try {
            await removeCourseFromProgramRule(ruleId, courseId);
            fetchProgramData();
        } catch (error) {
            console.error("Failed to remove course:", error);
            alert("Failed to remove course.");
        }
    };

    const handleDeleteProgram = async () => {
        if (!programId) return;
        setIsDeleting(true);
        try {
            await deleteProgram(Number(programId));
            setIsDeleteModalOpen(false);
            navigate('/admin/program');
        } catch (error) {
            console.error("Failed to delete program:", error);
            alert("Failed to delete program.");
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        fetchProgramData();
    }, [programId]);

    if (!programDetail || !programRules) return null;

    return (
        <div className="min-h-screen flex flex-col bg-[#fff8ef]">
            <Header />
            <div className="flex-1 flex w-full mx-auto">
                <AdminSidebar activeTab="program" />
                <main className="flex-1 flex flex-col items-center pt-[50px] pb-10 px-[60px]">
                    <div className="w-full flex items-center justify-between mb-8  h-[36px]">
                        <div className="flex items-center gap-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#23417d">
                                <path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 15.99L12 18.72L7 15.99V12.27L12 15L17 12.27V15.99Z"/>
                            </svg>
                            <h1 className="text-[19px] font-semibold text-[#23417d]">{programDetail.title}</h1>
                        </div>
                        <Button 
                            content="Add Requirement"
                            color="#2854c5"
                            hasArrow={false}
                            isFullWidth={false}
                            onClick={() => setIsAddRuleModalOpen(true)}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-6 w-full mb-8">
                        {/* Required core */}
                        <div className="bg-white border border-[#ccc] rounded-[4px] px-[30px] py-[35px] flex items-end justify-between">
                            <span className="text-[#23417d] text-[15px] font-bold">Required core</span>
                            <span className="text-[#23417d] text-[15px] font-bold">
                                {programRules?.find(r => r.type === 'core')?.courses?.length || 0} courses
                            </span>
                        </div>
                        
                        {/* Elective */}
                        <div className="bg-white border border-[#ccc] rounded-[4px] px-[30px] py-[35px] flex items-end justify-between">
                            <span className="text-[#23417d] text-[15px] font-bold">Elective</span>
                            <div className="flex items-end gap-2">
                                <span className="text-[#23417d] text-[15px] font-bold">{programRules?.find(r => r.type === 'elective')?.requiredCredits || 0} cr</span>
                                <button 
                                  className="text-[13px] text-black font-medium underline hover:text-gray-600 transition-colors cursor-pointer"
                                  onClick={() => {
                                      const r = programRules?.find(r => r.type === 'elective');
                                      if (r) {
                                          setSelectedRuleId(r.id);
                                          setSelectedRuleCredits(r.requiredCredits || 0);
                                          setIsEditRuleModalOpen(true);
                                      }
                                  }}
                                >
                                  edit
                                </button>
                            </div>
                        </div>

                        {/* Free Elective */}
                        <div className="bg-white border border-[#ccc] rounded-[4px] px-[30px] py-[35px] flex items-end justify-between">
                            <span className="text-[#23417d] text-[15px] font-bold">Free Elective</span>
                            <div className="flex items-end gap-2">
                                <span className="text-[#23417d] text-[15px] font-bold">{programRules?.find(r => r.type === 'free_elective')?.requiredCredits || 0} cr</span>
                                <button 
                                  className="text-[13px] text-black font-medium underline hover:text-gray-600 transition-colors cursor-pointer"
                                  onClick={() => {
                                      const r = programRules?.find(r => r.type === 'free_elective');
                                      if (r) {
                                          setSelectedRuleId(r.id);
                                          setSelectedRuleCredits(r.requiredCredits || 0);
                                          setIsEditRuleModalOpen(true);
                                      }
                                  }}
                                >
                                  edit
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-[40px] w-full mb-[40px]">
                        
                        {/* 左欄: Required core */}
                        <div className="bg-white border border-[#ccc] rounded-[4px] p-5 flex flex-col gap-[25px]">
                            <div className="flex items-end justify-between w-full border-b border-transparent pb-1">
                                <h2 className="text-[#23417d] text-[15px] font-bold">Required core</h2>
                                <button 
                                  className="text-[#0054fb] text-[13px] underline font-medium hover:text-blue-800 transition-colors cursor-pointer"
                                  onClick={() => {
                                      const r = programRules?.find(r => r.type === 'core');
                                      if (r) {
                                          setSelectedRuleId(r.id);
                                          setIsAddCourseModalOpen(true);
                                      }
                                  }}
                                >
                                    add course
                                </button>
                            </div>
                            <div className="flex flex-col gap-[15px] w-full">
                                {programRules?.find((rule) => rule.type === 'core')?.courses?.map((course, idx) => (
                                    <CourseRow key={`req-${idx}`} course={course} ruleId={programRules.find((rule) => rule.type === 'core')!.id} onRemove={handleRemoveCourse} />
                                ))}
                            </div>
                        </div>

                        {/* 右欄: Elective */}
                        <div className="bg-white border border-[#ccc] rounded-[4px] p-5 flex flex-col gap-[25px]">
                            <div className="flex items-end justify-between w-full border-b border-transparent pb-1">
                                <h2 className="text-[#23417d] text-[15px] font-bold">Elective</h2>
                                <button 
                                  className="text-[#0054fb] text-[13px] underline font-medium hover:text-blue-800 transition-colors cursor-pointer"
                                  onClick={() => {
                                      const r = programRules?.find(r => r.type === 'elective');
                                      if (r) {
                                          setSelectedRuleId(r.id);
                                          setIsAddCourseModalOpen(true);
                                      }
                                  }}
                                >
                                    add course
                                </button>
                            </div>
                            <div className="flex flex-col gap-[15px] w-full">
                                {programRules?.find((rule) => rule.type === 'elective')?.courses?.map((course, idx) => (
                                    <CourseRow key={`elec-${idx}`} course={course} ruleId={programRules.find((rule) => rule.type === 'elective')!.id} onRemove={handleRemoveCourse} />
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* 最下方的刪除按鈕 */}
                    <div className="w-full max-w-[1000px] flex justify-center mb-8">
                        <Button 
                            content="Delete Program"
                            color="#bf3c32"
                            variant="outline"
                            isFullWidth={false}
                            onClick={() => setIsDeleteModalOpen(true)}
                        />
                    </div>

                </main>
            </div>
            
            <Footer />

            <Modal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
                title="Delete Program"
            >
                <div className="flex flex-col gap-6">
                    <p className="text-[14px] text-gray-700">
                        Are you sure you want to delete this program?
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button 
                            content="Cancel"
                            color="#6b7280"
                            variant="outline"
                            isFullWidth={false}
                            onClick={() => setIsDeleteModalOpen(false)}
                        />
                        <Button 
                            content={isDeleting ? "Deleting..." : "Delete"}
                            color="#bf3c32"
                            variant="solid"
                            isFullWidth={false}
                            onClick={handleDeleteProgram}
                        />
                    </div>
                </div>
            </Modal>
            <EditProgramRuleModal 
                isOpen={isEditRuleModalOpen}
                onClose={() => setIsEditRuleModalOpen(false)}
                ruleId={selectedRuleId}
                currentCredits={selectedRuleCredits}
                onSuccess={fetchProgramData}
            />

            <AddCourseToRuleModal 
                isOpen={isAddCourseModalOpen}
                onClose={() => setIsAddCourseModalOpen(false)}
                ruleId={selectedRuleId}
                onSuccess={fetchProgramData}
            />
        </div>
    );
}
