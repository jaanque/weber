import React, { useRef, useState, useLayoutEffect } from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './ItemTypes';

const TextBox = ({ id, left, top, width, height, content, style = {}, onTextChange, onResize, onSelect, isSelected }) => {
    const itemRef = useRef(null);
    const textareaRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);

    // Auto-resize height based on content
    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            // Temporarily reset height to calculate the new scrollHeight
            textarea.style.height = 'auto';
            const newHeight = textarea.scrollHeight;

            // Set the new height on the textarea itself to make the parent div grow
            textarea.style.height = `${newHeight}px`;

            // Notify parent if the container's height needs to be updated
            if (height !== newHeight) {
                onResize(id, width, newHeight);
            }
        }
    }, [content, width, id, height, onResize]);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.TEXT,
        item: { id, left, top, type: ItemTypes.TEXT, width, height },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [id, left, top, width, height]);

    const handleTextChange = (e) => {
        onTextChange(id, e.target.value);
    };

    const handleDoubleClick = () => {
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
    };

    const handleClick = (e) => {
        e.stopPropagation();
        onSelect(id);
    }

    const combinedRef = (node) => {
        drag(node);
        itemRef.current = node;
    };

    const boxStyle = {
        position: 'absolute',
        left,
        top,
        width,
        height,
        cursor: isEditing ? 'text' : 'move',
        opacity: isDragging ? 0.5 : 1,
        border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
        boxSizing: 'border-box',
        ...style,
    };

    return (
        <div
            ref={combinedRef}
            style={boxStyle}
            className="dropped-item"
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
        >
            <textarea
                ref={textareaRef}
                value={content || ''}
                onChange={handleTextChange}
                onBlur={handleBlur}
                className="editable-textarea"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    padding: '8px',
                    margin: '0',
                    background: 'transparent',
                    resize: 'none',
                    outline: 'none',
                    color: 'inherit',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    fontStyle: 'inherit',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                }}
                spellCheck="false"
                readOnly={!isEditing}
            />
        </div>
    );
};

export default TextBox;