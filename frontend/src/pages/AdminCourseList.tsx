import { useEffect, useState } from 'react';
import Header from "../components/Header";
import AdminSidebar from "../components/AdminSidebar";
import Footer from '../components/Footer';
import Button from "../components/Button";
import AddCourseModal from "../components/AddCourseModal";
import EditCourseModal from "../components/EditCourseModal";
import Modal from "../components/Modal";
import { getAdminCourseList, deleteCourse } from "../api";
import type { Course } from "../types";
import { useNavigate } from 'react-router-dom';

export default function AdminCourseList() {
    const userName = localStorage.getItem("user_name") || "";
    const adminId = localStorage.getItem("admin_id") || "";
    const collegeId = localStorage.getItem("college_id") || "";
    const [data, setData] = useState<Course[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();

    const handleDeleteCourse = async () => {
        if (!selectedCourse) return;
        setIsDeleting(true);
        try {
            await deleteCourse(Number(adminId), selectedCourse.id);
            setIsDeleteModalOpen(false);
            fetchCourses();
        } catch (error) {
            console.error("Failed to delete course:", error);
            alert("Failed to delete course.");
        } finally {
            setIsDeleting(false);
        }
    };

    const fetchCourses = () => {
        getAdminCourseList(Number(adminId), Number(collegeId)).then((result) => {
            setData(result.data.courses);
        });
    };

    useEffect(() => {
        fetchCourses();
    }, [adminId, collegeId]);

    return (
        <div className="min-h-screen flex flex-col bg-[#fff8ef]">
            <Header userName={userName} />
            
            <div className="flex-1 flex w-full mx-auto">
                <AdminSidebar activeTab="course" />
                
                <main className="flex-1 flex flex-col items-center pt-[50px] pb-10 px-[60px]">
                    <div className="w-full flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#23417d">
                                <path d="M12 20C11.2 19.3667 10.3333 18.875 9.4 18.525C8.46667 18.175 7.5 18 6.5 18C5.8 18 5.11267 18.0917 4.438 18.275C3.76333 18.4583 3.11733 18.7167 2.5 19.05C2.15 19.2333 1.81267 19.225 1.488 19.025C1.16333 18.825 1.00067 18.5333 1 18.15V6.1C1 5.91667 1.046 5.74167 1.138 5.575C1.23 5.40833 1.36733 5.28333 1.55 5.2C2.31667 4.8 3.11667 4.5 3.95 4.3C4.78333 4.1 5.63333 4 6.5 4C7.73333 4 8.78333 4.14167 9.65 4.425C10.5167 4.70833 11.45 5.14167 12.45 5.725C12.6333 5.825 12.771 5.94167 12.863 6.075C12.955 6.20833 13.0007 6.38333 13 6.6V17.05C13.7333 16.7 14.471 16.4373 15.213 16.262C15.955 16.0867 16.7173 15.9993 17.5 16C18.1 16 18.6877 16.05 19.263 16.15C19.8383 16.25 20.4173 16.4 21 16.6V4.575C21.25 4.65833 21.496 4.75 21.738 4.85C21.98 4.95 22.2173 5.06667 22.45 5.2C22.6333 5.28333 22.771 5.40833 22.863 5.575C22.955 5.74167 23.0007 5.91667 23 6.1V18.15C23 18.5333 22.8373 18.825 22.512 19.025C22.1867 19.225 21.8493 19.2333 21.5 19.05C20.8833 18.7167 20.2377 18.4583 19.563 18.275C18.8883 18.0917 18.2007 18 17.5 18C16.5 18 15.5333 18.175 14.6 18.525C13.6667 18.875 12.8 19.3667 12 20ZM15.5 14V3L18.5 2V13L15.5 14Z" fill="#23417D"/>
                            </svg>
                            <h1 className="text-[19px] font-semibold text-[#23417d]">Courses</h1>
                        </div>
                        <Button 
                            content="Add Course"
                            color="#2854c5"
                            hasArrow={false}
                            isFullWidth={false}
                            onClick={() => setIsAddModalOpen(true)}
                        />
                    </div>

                    <div className="w-full bg-white border border-[#ccc] rounded-[4px] p-[30px] flex flex-col min-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#ccc] text-[#23417d] text-[14px]">
                                    <th className="pb-3 font-semibold w-[15%]">Code</th>
                                    <th className="pb-3 font-semibold w-[45%]">Name</th>
                                    <th className="pb-3 font-semibold w-[15%]">Credits</th>
                                    <th className="pb-3 font-semibold w-[15%]">Term</th>
                                    <th className="pb-3 font-semibold text-right w-[10%]" />
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((course) => (
                                    <tr key={course.id} className="border-b border-dashed border-[#ccc] text-[14px] text-black">
                                        <td className="py-4">{course.code}</td>
                                        <td className="py-4">{course.name}</td>
                                        <td className="py-4">{course.credit}</td>
                                        <td className="py-4">{course.term || '-'}</td>
                                        <td className="py-4 text-right flex justify-end items-center gap-4">
                                            <button 
                                                className="text-[13px] text-[#2854c5] hover:underline cursor-pointer"
                                                onClick={() => {
                                                    setSelectedCourse(course);
                                                    setIsEditModalOpen(true);
                                                }}
                                            >
                                                edit
                                            </button>
                                            <button 
                                                className="text-[13px] text-[#bf3c32] decoration-solid hover:text-red-700 transition-colors cursor-pointer"
                                                onClick={() => {
                                                    setSelectedCourse(course);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                            >
                                                <svg viewBox="0,0,24,24" xmlns="http://www.w3.org/2000/svg" width="16" height="16" stroke-width="1" transform="rotate(0) matrix(1 0 0 1 0 0)"><path fill="#1a1a1a" d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zM9 17h2V8H9zm4 0h2V8h-2zM7 6v13z"></path></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-gray-500">No courses found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        
                        <div className="mt-auto pt-6 flex justify-center items-center gap-2 text-[#2854c5] text-[14px]">
                            <span className="cursor-pointer font-bold">1</span>
                            <span className="cursor-pointer hover:underline">2</span>
                            <span className="cursor-pointer hover:underline">3</span>
                            <span className="cursor-pointer hover:underline">4</span>
                            <span className="cursor-pointer hover:underline">5</span>
                            <span className="cursor-pointer hover:underline ml-1">›</span>
                        </div>
                    </div>
                </main>
            </div>
            
            <Footer />

            <AddCourseModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                adminId={Number(adminId)}
                onSuccess={fetchCourses}
            />

            <EditCourseModal 
                isOpen={isEditModalOpen} 
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedCourse(null);
                }} 
                adminId={Number(adminId)}
                course={selectedCourse}
                onSuccess={fetchCourses}
            />

            <Modal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
                title="Delete Course"
            >
                <div className="flex flex-col gap-6">
                    <p className="text-[14px] text-gray-700">
                        Are you sure you want to delete the course <strong>{selectedCourse?.code}</strong>?
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
                            onClick={handleDeleteCourse}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}