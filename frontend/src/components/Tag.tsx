import React from 'react';

interface TagProps {
    content: React.ReactNode;
    color?: string;
    textColor?: string;
}


export default function Tag({ 
    content, 
    color, 
    textColor
}: TagProps) {
    function getTagColor(type: string) {
        const typeStr = type.toLowerCase();
        switch (typeStr) {
            case 'university requirements': return '#e8edf7';
            case 'main major': return '#ffece9';
            case 'major': return '#ffb6b0';
            case 'minor': return '#c2d3ff';
            case 'program': return '#97ffb3';
            case 'planned': return '#e4e4e4';
            default: return '#cccccc';
        }
    }
    function getTagTextColor(type: string) {
        const typeStr = type.toLowerCase();
        switch (typeStr) {
            case 'university requirements': return '#1f3a5f';
            case 'main major': return '#c0392b';
            case 'major': return '#c0392b';
            case 'minor': return '#2854c5';
            case 'program': return '#1e4620';
            case 'planned': return '#666666';
            default: return '#666666';
        }
    }

    // 如果外部有傳入 color，優先使用；否則根據 content 決定顏色
    const finalColor = color || (typeof content === 'string' ? getTagColor(content) : '#cccccc');
    const finalTextColor = textColor || (typeof content === 'string' ? getTagTextColor(content) : '#666666');

    return (
        <span 
            style={{ backgroundColor: finalColor, color: finalTextColor}}
            className={`inline-flex items-center leading-none px-[5px] py-[3px] text-[10px] rounded-[3px]`}
        >
            {typeof content === 'string' && content.includes('Main Major') ? '★ ' + content : content}
        </span>
    );
}