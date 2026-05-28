interface TagProps {
    content: string;
    color?: string;
}

export default function Tag({ content, color = "#ffb6b0" }: TagProps){
    return (
        <div 
            style={{ backgroundColor: color }}
            className={`text-black text-[10px] px-[5px] py-[3px] rounded-[3px] leading-none`}>
            {content}
        </div>
    )
}