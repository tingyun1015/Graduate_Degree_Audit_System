import Logo from './Logo';
import Tag from './Tag';

interface HeaderProps {
    userName: string
}

export default function Header({ userName }: HeaderProps) {
    const isAdmin = localStorage.getItem('admin_id')
    return (
        <header className="bg-[#1f3a5f] text-white flex items-center justify-between px-8 h-16 shrink-0 sticky top-0 z-50">
            <div className="flex items-center gap-2">
                <Logo className="text-white fill-current" />
                {isAdmin && <Tag content='Admin/Staff' />}
            </div>
            <div className="flex items-center gap-3">
            <span className="font-medium">{userName}</span>
            <div className="w-9 h-9 rounded-full bg-white text-[#1f3a5f] flex items-center justify-center font-bold">
                {userName.charAt(0)}
            </div>
            </div>
        </header>
    )
}