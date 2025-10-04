import React, { useRef, useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Resizable } from 're-resizable';
import { ItemTypes } from './ItemTypes';
import { FaArrowsAlt, FaSyncAlt } from 'react-icons/fa';
import './TextBox.css';

const TextBox = ({ id, left, top, width, height, rotation = 0, content, style = {}, onTextChange, onResize, onRotate, onSelect, isSelected }) => {
    const textareaRef = useRef(null);
    const boxRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
    const [lockAspectRatio, setLockAspectRatio] = useState(false);

    const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
        type: ItemTypes.TEXT,
        item: { id, left, top, type: ItemTypes.TEXT, width, height, content, style, rotation },
        canDrag: !isEditing && !isResizing && !isRotating,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [id, left, top, width, height, isEditing, isResizing, isRotating, content, style, rotation]);

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

    const handleResizeStart = (e, direction) => {
        e.stopPropagation();
        setIsResizing(true);
        const cornerHandles = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
        setLockAspectRatio(cornerHandles.includes(direction));
    };

    const handleResizeStop = (e, direction, ref, d) => {
        setIsResizing(false);
        onResize(id, width + d.width, height + d.height);
    };

    const handleRotateStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsRotating(true);

        const box = boxRef.current.getBoundingClientRect();
        const centerX = box.left + box.width / 2;
        const centerY = box.top + box.height / 2;

        const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        const initialRotation = rotation;

        const handleMouseMove = (moveEvent) => {
            const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * (180 / Math.PI);
            const newRotation = initialRotation + (currentAngle - startAngle);
            onRotate(id, newRotation);
        };

        const handleMouseUp = () => {
            setIsRotating(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const containerStyle = {
        position: 'absolute',
        left,
        top,
        zIndex: isSelected ? 1 : 'auto',
        opacity: isDragging ? 0.4 : 1,
        transform: `rotate(${rotation}deg)`,
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
        cursor: isEditing ? 'text' : 'default',
        color: style.color || '#000000',
        fontFamily: style.fontFamily || 'Arial',
        fontSize: style.fontSize || '16px',
        fontWeight: style.fontWeight || 'normal',
        fontStyle: style.fontStyle || 'normal',
        textDecoration: style.textDecoration || 'none',
        textAlign: style.textAlign || 'left',
    };

    return (
        <div ref={boxRef} style={containerStyle}>
            {isSelected && !isEditing && (
                <>
                    <div
                        ref={drag}
                        className="drag-handle"
                        title="Drag to move"
                        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                    >
                        <FaArrowsAlt />
                    </div>
                    <div
                        className="rotate-handle"
                        onMouseDown={handleRotateStart}
                        title="Drag to rotate"
                    >
                        <FaSyncAlt />
                    </div>
                </>
            )}
            <Resizable
                style={resizableStyle}
                size={{ width, height }}
                onResizeStart={handleResizeStart}
                onResizeStop={handleResizeStop}
                lockAspectRatio={lockAspectRatio}
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