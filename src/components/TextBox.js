import React, { useRef, useEffect, useState } from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './ItemTypes';

const TextBox = ({ id, left, top, width, height, text, style = {}, onTextChange, onResize, onSelect, isSelected }) => {
    const itemRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (itemRef.current && onResize) {
            const { clientWidth, clientHeight } = itemRef.current;
            if (width !== clientWidth || height !== clientHeight) {
                onResize(id, clientWidth, clientHeight);
            }
        }
    }, [id, onResize, width, height, text]);

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
        cursor: isEditing ? 'text' : 'move',
        opacity: isDragging ? 0.5 : 1,
        border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
        padding: '8px',
        boxSizing: 'border-box',
        ...style, // Apply styles for font weight, style, size etc.
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
                value={text}
                onChange={handleTextChange}
                onBlur={handleBlur}
                className="editable-textarea"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    padding: '0',
                    margin: '0',
                    background: 'transparent',
                    resize: 'none',
                    outline: 'none',
                    color: 'inherit',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    fontStyle: 'inherit',
                }}
                spellCheck="false"
                readOnly={!isEditing}
            />
        </div>
    );
};

export default TextBox;