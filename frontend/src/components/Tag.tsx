import React from 'react';

interface TagProps {
    content: React.ReactNode;
    color?: string;
    textColor?: string;
}


export default function Tag({ 
    content, 
    color, 
    textColor = "#000000"
}: TagProps) {
    function getTagColor(type: string) {
        switch (type) {
            case 'Major': return '#ffb6b0';
            case 'Minor': return '#c2d3ff';
            case 'Program': return '#97ffb3';
            case 'Planned': return '#d0cac2';
            default: return '#cccccc';
        }
    }
    
    // 如果外部有傳入 color，優先使用；否則根據 content 決定顏色
    const finalColor = color || (typeof content === 'string' ? getTagColor(content) : '#cccccc');

    return (
        <span 
            style={{ backgroundColor: finalColor, color: textColor }}
            className={`inline-flex items-center leading-none px-[5px] py-[3px] text-[10px] rounded-[3px]`}
        >
            {content}
        </span>
    );
}