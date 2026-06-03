import React from 'react';

interface TagProps {
    content: React.ReactNode;
    color?: string;
    textColor?: string;
}

export default function Tag({ 
    content, 
    color = "#ffb6b0", 
    textColor = "#000000"
}: TagProps) {
    return (
        <span 
            style={{ backgroundColor: color, color: textColor }}
            className={`inline-flex items-center leading-none px-[5px] py-[3px] text-[10px] rounded-[3px]`}
        >
            {content}
        </span>
    );
}