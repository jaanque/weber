import React from 'react';
import { useDragLayer } from 'react-dnd';
import { ItemTypes } from './ItemTypes';

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

function getItemStyles(initialOffset, currentOffset) {
  if (!initialOffset || !currentOffset) {
    return { display: 'none' };
  }
  const { x, y } = currentOffset;
  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform,
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