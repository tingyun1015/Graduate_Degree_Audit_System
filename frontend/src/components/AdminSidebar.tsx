import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useAdminStore } from '../store/useAdminStore';

interface AdminSidebarProps {
    activeTab?: 'program' | 'course';
}

export default function AdminSidebar({ activeTab = 'program' }: AdminSidebarProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { departmentList: departments } = useAuthStore();
    const { activeDepartment: selectedDept, setActiveDepartment: setSelectedDept } = useAdminStore();

    useEffect(() => {
        if (!selectedDept && departments?.length > 0) {
            setSelectedDept(departments[0]);
        }
    }, [departments, selectedDept, setSelectedDept]);

    return (
        <aside className="w-[230px] shrink-0 bg-[#fff8ef] border-r border-[#d9d9d9] flex flex-col pt-[17px] sticky top-16 h-[calc(100vh-86.5px)] overflow-y-auto self-start">
            {/* Department Selector */}
            <div className="relative px-[21px] mb-8">
                {selectedDept ? (
                    <div 
                        className="flex flex-col cursor-pointer group"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <span className="text-[11px] text-black mb-1 truncate">{selectedDept.college_name}</span>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[15px] text-[#23417d] font-semibold leading-tight line-clamp-2 pr-2" title={selectedDept.name}>
                                {selectedDept.name}
                            </span>
                            <span className={`text-[10px] pt-[2px] shrink-0 -scale-x-120 text-black group-hover:text-[#23417d] transition-transform duration-400 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                                ▼
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col cursor-wait opacity-50">
                        <span className="text-[11px] text-black mb-1">Loading...</span>
                    </div>
                )}

                {/* Dropdown Menu */}
                {isDropdownOpen && departments?.length > 0 && (
                    <div className="absolute top-full left-[21px] right-[21px] bg-white border border-[#ccc] rounded-[4px] shadow-lg mt-1 z-10 overflow-hidden">
                        {departments.map(dept => (
                            <div 
                                key={dept.id}
                                className={`px-3 py-2 cursor-pointer transition-colors hover:bg-[#fff8ef] ${
                                    selectedDept?.id === dept.id ? 'bg-[#fcf9f5] border-l-2 border-[#23417d]' : 'border-l-2 border-transparent'
                                }`}
                                onClick={() => {
                                    setSelectedDept(dept);
                                    setIsDropdownOpen(false);
                                }}
                            >
                                <div className="text-[9px] text-gray-500 mb-0.5 truncate">{dept.college_name}</div>
                                <div className="text-[12px] text-[#23417d] font-semibold line-clamp-2">{dept.name}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-[#ccc] mb-8"></div>

            {/* Navigation Menu */}
            <nav className="flex flex-col gap-4">
                <a 
                    href="/admin/program" 
                    className={`flex items-center px-[32px] py-2 gap-[14px] ${
                        activeTab === 'program' ? 'text-[#23417d]' : 'text-gray-500 hover:text-[#23417d]'
                    } transition-colors`}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 15.99L12 18.72L7 15.99V12.27L12 15L17 12.27V15.99Z"/>
                    </svg>
                    <span className={`text-[15px] font-semibold ${activeTab === 'program' ? 'underline decoration-2 underline-offset-4' : ''}`}>
                        Programs
                    </span>
                </a>

                <a 
                    href="/admin/course" 
                    className={`flex items-center px-[32px] py-2 gap-[14px] ${
                        activeTab === 'course' ? 'text-[#23417d]' : 'text-gray-500 hover:text-[#23417d]'
                    } transition-colors`}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 20C11.2 19.3667 10.3333 18.875 9.4 18.525C8.46667 18.175 7.5 18 6.5 18C5.8 18 5.11267 18.0917 4.438 18.275C3.76333 18.4583 3.11733 18.7167 2.5 19.05C2.15 19.2333 1.81267 19.225 1.488 19.025C1.16333 18.825 1.00067 18.5333 1 18.15V6.1C1 5.91667 1.046 5.74167 1.138 5.575C1.23 5.40833 1.36733 5.28333 1.55 5.2C2.31667 4.8 3.11667 4.5 3.95 4.3C4.78333 4.1 5.63333 4 6.5 4C7.73333 4 8.78333 4.14167 9.65 4.425C10.5167 4.70833 11.45 5.14167 12.45 5.725C12.6333 5.825 12.771 5.94167 12.863 6.075C12.955 6.20833 13.0007 6.38333 13 6.6V17.05C13.7333 16.7 14.471 16.4373 15.213 16.262C15.955 16.0867 16.7173 15.9993 17.5 16C18.1 16 18.6877 16.05 19.263 16.15C19.8383 16.25 20.4173 16.4 21 16.6V4.575C21.25 4.65833 21.496 4.75 21.738 4.85C21.98 4.95 22.2173 5.06667 22.45 5.2C22.6333 5.28333 22.771 5.40833 22.863 5.575C22.955 5.74167 23.0007 5.91667 23 6.1V18.15C23 18.5333 22.8373 18.825 22.512 19.025C22.1867 19.225 21.8493 19.2333 21.5 19.05C20.8833 18.7167 20.2377 18.4583 19.563 18.275C18.8883 18.0917 18.2007 18 17.5 18C16.5 18 15.5333 18.175 14.6 18.525C13.6667 18.875 12.8 19.3667 12 20ZM15.5 14V3L18.5 2V13L15.5 14Z" fill="currentColor"/>
                    </svg>
                    <span className={`text-[15px] font-semibold ${activeTab === 'course' ? 'underline decoration-2 underline-offset-4' : ''}`}>
                        Courses
                    </span>
                </a>
            </nav>
        </aside>
    );
}
