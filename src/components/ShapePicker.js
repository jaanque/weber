import React, { useState, useMemo } from 'react';
import { useDrag } from 'react-dnd';
import { shapes } from './ShapeData';
import { ItemTypes } from './ItemTypes';
import './ShapePicker.css';

const DraggableShape = ({ shape, onSelect }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.SHAPE,
    item: { type: ItemTypes.SHAPE, shapeType: shape.type, width: 100, height: 100 },
    end: (item, monitor) => {
      if (monitor.didDrop()) {
        onSelect(shape);
      }
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className="shape-item-preview"
      style={{ opacity: isDragging ? 0.5 : 1, cursor: 'grab' }}
      title={shape.name}
    >
      <div className="shape-icon-container">{shape.icon}</div>
      <span className="shape-name">{shape.name}</span>
    </div>
  );
};

const ShapePicker = ({ onSelectShape, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredShapes = useMemo(() => {
    return shapes.filter(shape =>
      shape.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="shape-picker-popover" onClick={(e) => e.stopPropagation()}>
      <div className="shape-picker-header">
        <input
          type="text"
          placeholder="Search shapes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="shape-search-input"
          autoFocus
        />
      </div>
      <div className="shape-grid">
        {filteredShapes.map(shape => (
          <DraggableShape
            key={shape.name}
            shape={shape}
            onSelect={onSelectShape}
          />
        ))}
      </div>
    </div>
  );
};

export default ShapePicker;