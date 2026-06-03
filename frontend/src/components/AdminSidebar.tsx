import { useState } from 'react';

interface AdminSidebarProps {
    activeTab?: 'programs' | 'courses';
}

const MOCK_DEPARTMENTS = [
    { id: 'cs', college: 'College of Information', name: 'Department of Computer Science' },
    { id: 'im', college: 'College of Commerce', name: 'Department of Information Management' },
    { id: 'math', college: 'College of Science', name: 'Department of Mathematics' }
];

export default function AdminSidebar({ activeTab = 'programs' }: AdminSidebarProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedDept, setSelectedDept] = useState(MOCK_DEPARTMENTS[0]);

    return (
        <aside className="w-[230px] shrink-0 bg-[#fff8ef] border-r border-[#d9d9d9] flex flex-col pt-[17px] sticky top-16 h-[calc(100vh-86.5px)] overflow-y-auto self-start">
            {/* Department Selector */}
            <div className="relative px-[21px] mb-8">
                <div 
                    className="flex flex-col cursor-pointer group"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    <span className="text-[11px] text-black mb-1">{selectedDept.college}</span>
                    <div className="flex items-center justify-between">
                        <span className="text-[16px] text-[#23417d] font-semibold leading-tight pr-2">
                            {/* 將 Department of 與後面的字稍微分行，模擬原設計的排版 */}
                            {selectedDept.name.replace('Department of ', 'Department of\n').split('\n').map((line, i) => (
                                <span key={i} className="block">{line}</span>
                            ))}
                        </span>
                        <span className={`text-[17px] text-black group-hover:text-[#23417d] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                            ▼
                        </span>
                    </div>
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute top-full left-[10px] right-[10px] mt-2 bg-white border border-[#ccc] rounded-[4px] shadow-lg z-50 overflow-hidden">
                        {MOCK_DEPARTMENTS.map(dept => (
                            <div 
                                key={dept.id}
                                className={`px-3 py-2 cursor-pointer transition-colors hover:bg-[#fff8ef] ${
                                    selectedDept.id === dept.id ? 'bg-[#fcf9f5] border-l-2 border-[#23417d]' : 'border-l-2 border-transparent'
                                }`}
                                onClick={() => {
                                    setSelectedDept(dept);
                                    setIsDropdownOpen(false);
                                }}
                            >
                                <div className="text-[9px] text-gray-500 mb-0.5">{dept.college}</div>
                                <div className="text-[12px] text-[#23417d] font-semibold">{dept.name}</div>
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
                        activeTab === 'programs' ? 'text-[#23417d]' : 'text-gray-500 hover:text-[#23417d]'
                    } transition-colors`}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 15.99L12 18.72L7 15.99V12.27L12 15L17 12.27V15.99Z"/>
                    </svg>
                    <span className={`text-[15px] font-semibold ${activeTab === 'programs' ? 'underline decoration-2 underline-offset-4' : ''}`}>
                        Programs
                    </span>
                </a>

                <a 
                    href="/admin/course" 
                    className={`flex items-center px-[32px] py-2 gap-[14px] ${
                        activeTab === 'courses' ? 'text-[#23417d]' : 'text-gray-500 hover:text-[#23417d]'
                    } transition-colors`}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V4C20 2.9 19.1 2 18 2ZM18 20H6V4H18V20ZM16 11H8V9H16V11ZM16 15H8V13H16V15ZM16 7H8V5H16V7Z"/>
                    </svg>
                    <span className={`text-[15px] font-semibold ${activeTab === 'courses' ? 'underline decoration-2 underline-offset-4' : ''}`}>
                        Courses
                    </span>
                </a>
            </nav>
        </aside>
    );
}
