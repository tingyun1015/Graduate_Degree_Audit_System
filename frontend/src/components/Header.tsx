import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import Tag from './Tag';
import Modal from './Modal';
import Button from './Button';
import { useAuthStore } from '../store/useAuthStore';
import { logout as apiLogout } from '../api';

export default function Header() {
    const { userName, role, userId, logout } = useAuthStore();
    const navigate = useNavigate();
    const isAdmin = role === 'admin';
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            logout();
            if (userId) {
                await apiLogout(userId);
            }
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            if (isAdmin) {
                navigate('/admin');
            } else {
                navigate('/');
            }
        }
    };

    return (
        <header className="bg-[#1f3a5f] text-white flex items-center justify-between px-8 h-16 shrink-0 sticky top-0 z-[50]">
            <div className="flex items-center gap-2">
                <Logo className="text-white fill-current" />
                {isAdmin && <Tag content='Admin/Staff' color="#ffb6b0" textColor="#2a2a2a" />}
            </div>
            <div className="flex items-center gap-4 relative" ref={dropdownRef}>
                <button 
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    <span className="font-medium">{userName || 'User'}</span>
                    <div className="w-9 h-9 rounded-full bg-white text-[#1f3a5f] flex items-center justify-center font-bold">
                        {(userName || 'U').charAt(0)}
                    </div>
                    {/* Caret icon */}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>

                {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200 text-black">
                        <button 
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => {
                                setIsDropdownOpen(false);
                                setIsLogoutModalOpen(true);
                            }}
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>

            {/* Logout Confirmation Modal */}
            <Modal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                title="Confirm Logout"
            >
                <div className="flex flex-col gap-6 mt-4">
                    <p className="text-[14px] text-gray-700">
                        Are you sure you want to log out?
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button 
                            content="Cancel"
                            color="#6b7280"
                            variant="outline"
                            isFullWidth={false}
                            onClick={() => setIsLogoutModalOpen(false)} 
                        />
                        <Button 
                            content="Logout"
                            color="#bf3c32"
                            variant="solid"
                            isFullWidth={false}
                            onClick={() => {
                                setIsLogoutModalOpen(false);
                                handleLogout();
                            }} 
                        />
                    </div>
                </div>
            </Modal>
        </header>
    );
}