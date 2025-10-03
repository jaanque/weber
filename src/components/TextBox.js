import React, { useRef, useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Resizable } from 're-resizable';
import { ItemTypes } from './ItemTypes';
import './TextBox.css';

const TextBox = ({ id, left, top, width, height, content, style = {}, onTextChange, onResize, onSelect, isSelected }) => {
    const textareaRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
        type: ItemTypes.TEXT,
        item: { id, left, top, type: ItemTypes.TEXT, width, height, content, style },
        canDrag: !isEditing && !isResizing,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [id, left, top, width, height, isEditing, isResizing, content, style]);

    useEffect(() => {
        dragPreview(getEmptyImage(), { captureDraggingState: true });
    }, [dragPreview]);

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
        const newWidth = width + d.width;
        const newHeight = height + d.height;

        // Heuristic: Font size is roughly 25% of the box height, clamped
        const newFontSize = Math.max(12, Math.min(100, Math.round(newHeight * 0.25)));

        const newStyle = {
            fontSize: `${newFontSize}px`,
        };

        onResize(id, newWidth, newHeight, newStyle);
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
            <Resizable
                style={resizableStyle}
                size={{ width, height }}
                onResizeStart={handleResizeStart}
                onResizeStop={handleResizeStop}
                minConstraints={[100, 50]}
                maxConstraints={[800, 600]}
                handleComponent={
                    isSelected && !isEditing ? {
                        top: <div className="resizable-handle resizable-handle-top" />,
                        right: <div className="resizable-handle resizable-handle-right" />,
                        bottom: <div className="resizable-handle resizable-handle-bottom" />,
                        left: <div className="resizable-handle resizable-handle-left" />,
                        topRight: <div className="resizable-handle resizable-handle-topRight" />,
                        bottomRight: <div className="resizable-handle resizable-handle-bottomRight" />,
                        bottomLeft: <div className="resizable-handle resizable-handle-bottomLeft" />,
                        topLeft: <div className="resizable-handle resizable-handle-topLeft" />,
                    } : {}
                }
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
            </Resizable>
        </div>
    );
};

export default TextBox;