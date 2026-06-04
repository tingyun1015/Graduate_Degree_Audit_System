interface ButtonProps {
    content: string;
    color?: string;
    hasArrow?: boolean;
    isFullWidth?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
}

export default function Button ({ content, color, hasArrow, isFullWidth = true, onClick, type = 'button' }: ButtonProps) {
    const sizeClasses = isFullWidth 
        ? "w-full h-[42px] text-[16px]" 
        : "text-[12px] font-semibold px-[12px] py-[9px] shrink-0";

    return (
        <button 
            type={type} 
            style={color ? { backgroundColor: color } : undefined}
            className={`group hover:brightness-95 transition-all duration-200 text-white rounded-[4px] flex items-center justify-center cursor-pointer ${sizeClasses}`}
            onClick={onClick}
        >
            {content}
            {hasArrow && (
                <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">
                    →
                </span>
            )}
        </button>
    )
}