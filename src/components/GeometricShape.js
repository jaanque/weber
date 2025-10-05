import React, { useRef, useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Resizable } from 're-resizable';
import { motion } from 'framer-motion';
import { ItemTypes } from './ItemTypes';
import { FaArrowsAlt, FaSyncAlt } from 'react-icons/fa';
import './GeometricShape.css';

const ShapeContent = ({ shapeType, width, height, style }) => {
  const commonProps = {
    fill: style?.color || '#cccccc',
    stroke: style?.borderColor || '#333333',
    strokeWidth: style?.borderWidth || 2,
  };

  switch (shapeType) {
    case 'rectangle':
      return <rect x="0" y="0" width={width} height={height} {...commonProps} />;
    case 'circle':
      return <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) / 2} {...commonProps} />;
    case 'triangle':
      return <polygon points={`${width / 2},0 ${width},${height} 0,${height}`} {...commonProps} />;
    case 'oval':
        return <ellipse cx={width / 2} cy={height / 2} rx={width / 2} ry={height/2} {...commonProps} />;
    case 'star':
        // A bit more complex to scale a star correctly within the bounding box
        const starPoints = (w, h) => {
            const R = Math.min(w, h) / 2;
            const r = R / 2;
            const cx = w / 2;
            const cy = h / 2;
            let points = "";
            for (let i = 0; i < 5; i++) {
                points += `${cx + R * Math.cos(2 * Math.PI * i / 5 - Math.PI/2)},${cy + R * Math.sin(2 * Math.PI * i / 5 - Math.PI/2)} `;
                points += `${cx + r * Math.cos(2 * Math.PI * (i + 0.5) / 5 - Math.PI/2)},${cy + r * Math.sin(2 * Math.PI * (i + 0.5) / 5 - Math.PI/2)} `;
            }
            return points;
        };
        return <polygon points={starPoints(width, height)} {...commonProps} />;
    default:
      return <rect x="0" y="0" width={width} height={height} {...commonProps} />;
  }
};


const GeometricShape = ({ id, left, top, width, height, rotation = 0, zIndex = 0, shapeType, style = {}, onResize, onRotate, onSelect, isSelected }) => {
    const boxRef = useRef(null);
    const [isResizing, setIsResizing] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
    const [lockAspectRatio, setLockAspectRatio] = useState(false);

    const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
        type: ItemTypes.SHAPE,
        item: { id, left, top, type: ItemTypes.SHAPE, width, height, shapeType, style, rotation },
        canDrag: !isResizing && !isRotating,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [id, left, top, width, height, isResizing, isRotating, shapeType, style, rotation]);

    useEffect(() => {
        dragPreview(getEmptyImage(), { captureDraggingState: true });
    }, [dragPreview]);

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


    const resizableStyle = {
        border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const animationProps = {
        initial: { opacity: 0, scale: 0.95 },
        animate: {
            left,
            top,
            rotate: rotation,
            opacity: isDragging ? 0.5 : 1,
            scale: 1,
        },
        transition: { type: 'spring', stiffness: 300, damping: 30 },
        style: {
            position: 'absolute',
            zIndex: isSelected ? zIndex + 1 : zIndex,
        },
    };

    return (
        <motion.div ref={boxRef} {...animationProps} onClick={handleClick}>
            {isSelected && (
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
                minConstraints={[30, 30]}
                handleComponent={
                    isSelected ? {
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
                <svg
                    width="100%"
                    height="100%"
                    preserveAspectRatio="none"
                    style={{ overflow: 'visible' }}
                >
                  <ShapeContent shapeType={shapeType} width={width} height={height} style={style} />
                </svg>
            </Resizable>
        </motion.div>
    );
};

export default GeometricShape;