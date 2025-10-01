import React from 'react';
import DraggableComponent from './DraggableComponent';
import { ItemTypes } from './types';

const Sidebar = () => {
  return (
    <div style={{ padding: '10px' }}>
      <h4>Drag these to the canvas</h4>
      <DraggableComponent type={ItemTypes.HEADING}>
        Heading
      </DraggableComponent>
      <DraggableComponent type={ItemTypes.PARAGRAPH}>
        Paragraph
      </DraggableComponent>
      <DraggableComponent type={ItemTypes.IMAGE}>
        Image
      </DraggableComponent>
    </div>
  );
};

export default Sidebar;