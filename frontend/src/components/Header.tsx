import Logo from './Logo';

interface HeaderProps {
    userName: string
}

export default function Header({ userName }: HeaderProps) {
    return (
        <header className="bg-[#1f3a5f] text-white flex items-center justify-between px-8 h-16 shrink-0">
            <div className="flex items-center gap-2 font-bold text-lg">
                <Logo className="text-white fill-current" />
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