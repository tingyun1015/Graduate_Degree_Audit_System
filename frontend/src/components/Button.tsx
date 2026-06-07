interface ButtonProps {
    content: string;
    color?: string;
    hasArrow?: boolean;
    hasLeftArrow?: boolean;
    isFullWidth?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'solid' | 'outline';
}

export default function Button ({ content, color, hasArrow, hasLeftArrow, isFullWidth = true, onClick, type = 'button', variant = 'solid' }: ButtonProps) {
    const sizeClasses = isFullWidth 
        ? "w-full h-[42px] text-[16px]" 
        : "text-[12px] font-semibold px-[12px] py-[9px] shrink-0";

    const baseClasses = "group transition-all duration-200 rounded-[4px] flex items-center justify-center cursor-pointer";
    
    // Default styling for solid
    let variantClasses = "text-white hover:brightness-95";
    const styles: React.CSSProperties = {};

    if (variant === 'solid') {
        if (color) styles.backgroundColor = color;
    } else if (variant === 'outline') {
        variantClasses = "bg-transparent hover:bg-black/5";
        if (color) {
            styles.borderColor = color;
            styles.color = color;
            styles.borderWidth = '1px';
            styles.borderStyle = 'solid';
        } else {
            variantClasses += " border border-gray-300 text-gray-700";
        }
    }

    return (
        <button 
            type={type} 
            style={Object.keys(styles).length > 0 ? styles : undefined}
            className={`${baseClasses} ${variantClasses} ${sizeClasses}`}
            onClick={onClick}
        >
            {hasLeftArrow && (
                <span className="mr-2 transition-transform duration-200 group-hover:-translate-x-1">
                    ←
                </span>
            )}
            {content}
            {hasArrow && (
                <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">
                    →
                </span>
            )}
        </button>
    )
}