import React from 'react';
import { useDragLayer } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import GeometricShape from './GeometricShape'; // Import the component to use for preview

const layerStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 100,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
};

const TextBoxPreview = ({ item }) => {
  const previewStyle = {
    width: `${item.width}px`,
    height: `${item.height}px`,
    border: '1px dashed #3b82f6',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: '8px',
    boxSizing: 'border-box',
    ...item.style,
  };

  return <div style={previewStyle}>{item.content}</div>;
};

const ShapePreview = ({ item }) => {
    // Replicating the ShapeContent logic from GeometricShape.js for a clean preview
    const ShapeContent = ({ shapeType, width, height, style }) => {
        const commonProps = {
            fill: style?.color || '#cccccc',
            stroke: style?.borderColor || '#333333',
            strokeWidth: style?.borderWidth || 2,
        };
        switch (shapeType) {
            case 'rectangle': return <rect x="0" y="0" width={width} height={height} {...commonProps} />;
            case 'circle': return <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) / 2} {...commonProps} />;
            case 'triangle': return <polygon points={`${width / 2},0 ${width},${height} 0,${height}`} {...commonProps} />;
            case 'oval': return <ellipse cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} {...commonProps} />;
            case 'star':
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
            default: return <rect x="0" y="0" width={width} height={height} {...commonProps} />;
        }
    };

    return (
        <div style={{ width: `${item.width}px`, height: `${item.height}px` }}>
            <svg width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <ShapeContent shapeType={item.shapeType} width={item.width} height={item.height} style={item.style} />
            </svg>
        </div>
    );
};


function getItemStyles(initialOffset, currentOffset) {
  if (!initialOffset || !currentOffset) {
    return { display: 'none' };
  }
  const { x, y } = currentOffset;
  // Add scaling to the transform
  const transform = `translate(${x}px, ${y}px) scale(0.95)`;
  return {
    transform,
    WebkitTransform: transform,
    transition: 'transform 0.1s ease-in-out', // Smooth transition for the scale effect
  };
}

const CustomDragLayer = () => {
  const { itemType, isDragging, item, initialOffset, currentOffset } = useDragLayer(
    (monitor) => ({
      item: monitor.getItem(),
      itemType: monitor.getItemType(),
      initialOffset: monitor.getInitialSourceClientOffset(),
      currentOffset: monitor.getSourceClientOffset(),
      isDragging: monitor.isDragging(),
    })
  );

  function renderItem() {
    switch (itemType) {
      case ItemTypes.TEXT:
        return <TextBoxPreview item={item} />;
      case ItemTypes.SHAPE:
        return <ShapePreview item={item} />;
      default:
        return null;
    }
  }

  if (!isDragging) {
    return null;
  }

  return (
    <div style={layerStyles}>
      <div style={getItemStyles(initialOffset, currentOffset)}>{renderItem()}</div>
    </div>
  );
};

export default CustomDragLayer;