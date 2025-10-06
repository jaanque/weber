import React from 'react';
import { useDrag } from 'react-dnd';
import { Resizable } from 're-resizable';
import { ItemTypes } from './ItemTypes'; // Assuming a new item type might be needed
import './PublicationFrame.css';

const PublicationFrame = ({ left, top, width, height, onResize, onDrag }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.PUBLICATION_FRAME, // A unique type for the frame
    item: { type: ItemTypes.PUBLICATION_FRAME, left, top },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [left, top]);

  const handleResizeStop = (e, direction, ref, d) => {
    onResize(width + d.width, height + d.height);
  };

  return (
    <div
      ref={drag}
      className="publication-frame-wrapper"
      style={{
        position: 'absolute',
        left,
        top,
        opacity: isDragging ? 0.7 : 1,
      }}
    >
      <Resizable
        size={{ width, height }}
        onResizeStop={handleResizeStop}
        className="publication-frame"
      >
        <div className="publication-frame-content">
          <span className="publication-frame-label">Public View</span>
        </div>
      </Resizable>
    </div>
  );
};

export default PublicationFrame;