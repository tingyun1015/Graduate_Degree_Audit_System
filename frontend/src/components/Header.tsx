import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import Tag from './Tag';
import { useAuthStore } from '../store/useAuthStore';
import { logout as apiLogout } from '../api';

export default function Header() {
    const { userName, role, userId, logout } = useAuthStore();
    const navigate = useNavigate();
    const isAdmin = role === 'admin';

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
        <header className="bg-[#1f3a5f] text-white flex items-center justify-between px-8 h-16 shrink-0 sticky top-0 z-50">
            <div className="flex items-center gap-2">
                <Logo className="text-white fill-current" />
                {isAdmin && <Tag content='Admin/Staff' color="#ffb6b0" textColor="#2a2a2a" />}
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <span className="font-medium">{userName || 'User'}</span>
                    <div className="w-9 h-9 rounded-full bg-white text-[#1f3a5f] flex items-center justify-center font-bold">
                        {(userName || 'U').charAt(0)}
                    </div>
                </div>
                <button 
                    onClick={handleLogout}
                    className="text-sm font-medium hover:text-gray-300 transition-colors underline underline-offset-2"
                >
                    Logout
                </button>
            </div>
        </header>
    );
}