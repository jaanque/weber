import React, { useRef, useState } from 'react';
import { useDrag } from 'react-dnd';
import { ResizableBox } from 're-resizable';
import { ItemTypes } from './ItemTypes';
import 're-resizable/css/styles.css';

const TextBox = ({ id, left, top, width, height, content, style = {}, onTextChange, onResize, onSelect, isSelected }) => {
    const textareaRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.TEXT,
        item: { id, left, top, type: ItemTypes.TEXT, width, height },
        canDrag: !isEditing && !isResizing,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [id, left, top, width, height, isEditing, isResizing]);

    const handleTextChange = (e) => {
        onTextChange(id, e.target.value);
    };

    const handleDoubleClick = () => {
        setIsEditing(true);
        textareaRef.current?.focus();
        textareaRef.current?.select();
    };

    const handleBlur = () => {
        setIsEditing(false);
    };

    const handleClick = (e) => {
        e.stopPropagation();
        onSelect(id);
    };

    const handleResizeStart = (e) => {
        e.stopPropagation();
        setIsResizing(true);
    };

    const handleResizeStop = (e, direction, ref, d) => {
        setIsResizing(false);
        onResize(id, width + d.width, height + d.height);
    };

    const containerStyle = {
        position: 'absolute',
        left,
        top,
        zIndex: isSelected ? 1 : 'auto',
        opacity: isDragging ? 0.4 : 1,
    };

    const resizableStyle = {
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
        cursor: isEditing ? 'text' : (isResizing ? 'auto' : 'move'),
        color: style.color || '#000000',
        fontFamily: style.fontFamily || 'Arial',
        fontSize: style.fontSize || '16px',
        fontWeight: style.fontWeight || 'normal',
        fontStyle: style.fontStyle || 'normal',
        textDecoration: style.textDecoration || 'none',
        textAlign: style.textAlign || 'left',
    };

    return (
        <div ref={drag} style={containerStyle}>
            <ResizableBox
                style={resizableStyle}
                width={width}
                height={height}
                onResizeStart={handleResizeStart}
                onResizeStop={handleResizeStop}
                minConstraints={[100, 50]}
                maxConstraints={[800, 600]}
                handle={
                    isSelected && !isEditing ? (
                        <span className="react-resizable-handle" />
                    ) : null
                }
                handleSize={[8, 8]}
            >
                <div
                    className="dropped-item"
                    onClick={handleClick}
                    onDoubleClick={handleDoubleClick}
                    style={{ width: '100%', height: '100%'}}
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
            </ResizableBox>
        </div>
    );
};

export default TextBox;