import React from 'react';
import { useDrag } from 'react-dnd';

const DraggableComponent = ({ type, children }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: type, // El tipo de ítem que estamos arrastrando (ej: 'heading', 'paragraph')
    item: { type }, // Los datos que se pasan cuando se suelta el ítem
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        padding: '8px',
        margin: '4px 0',
        border: '1px solid #ccc',
        borderRadius: '4px',
        cursor: 'move',
        backgroundColor: 'white',
      }}
    >
      {children}
    </div>
  );
};

export default DraggableComponent;