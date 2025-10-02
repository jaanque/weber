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
            textarea.style.height = 'auto';
            const newHeight = textarea.scrollHeight;
            textarea.style.height = `${newHeight}px`;

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
        // Focus and select text for immediate editing
        textareaRef.current?.focus();
        textareaRef.current?.select();
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

    // Separate container and text styles
    const containerStyle = {
        position: 'absolute',
        left,
        top,
        width,
        height,
        cursor: isEditing ? 'text' : 'move',
        opacity: isDragging ? 0.5 : 1,
        border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
    };

    const textStyle = {
        width: '100%',
        height: '100%',
        border: 'none',
        padding: '8px',
        margin: '0',
        background: 'transparent',
        resize: 'none',
        outline: 'none',
        boxSizing: 'border-box',
        overflow: 'hidden',
        // Apply text-specific styles from the style prop
        color: style.color || '#000000',
        fontFamily: style.fontFamily || 'Arial',
        fontSize: style.fontSize || '16px',
        fontWeight: style.fontWeight || 'normal',
        fontStyle: style.fontStyle || 'normal',
        textDecoration: style.textDecoration || 'none',
        textAlign: style.textAlign || 'left',
    };

    return (
        <div
            ref={combinedRef}
            style={containerStyle}
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
                style={textStyle}
                spellCheck="false"
                readOnly={!isEditing}
            />
        </div>
    );
};

export default TextBox;