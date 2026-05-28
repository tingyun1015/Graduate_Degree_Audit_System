interface ButtonProps {
    content: string;
    color: string;
    hasArrow?: boolean;
}

export default function Button ({ content, color, hasArrow }: ButtonProps) {
    return (
        <button 
            type="submit" 
            style={{ backgroundColor: color }}
            className="group w-full hover:brightness-95 transition-all duration-200 text-white h-[42px] rounded-[4px] flex items-center justify-center text-[16px] cursor-pointer"
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