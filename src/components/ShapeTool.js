import React, { useState, useRef, useEffect } from 'react';
import { FaShapes } from 'react-icons/fa';
import ShapePicker from './ShapePicker';
import './ShapeTool.css';

const ShapeTool = () => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const toolRef = useRef(null);

  const handleTogglePicker = (e) => {
    e.stopPropagation();
    setIsPickerOpen(prev => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolRef.current && !toolRef.current.contains(event.target)) {
        setIsPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  return (
    <div className="tool-item-container" ref={toolRef}>
      <div
        onClick={handleTogglePicker}
        className="tool-item"
        title="Add a shape"
      >
        <span className="tool-icon"><FaShapes /></span>
        <span className="tool-text">Shapes</span>
      </div>
      {isPickerOpen && (
        // The onSelectShape prop is no longer needed here as the dragging is handled inside ShapePicker
        <ShapePicker onClose={() => setIsPickerOpen(false)} onSelectShape={() => {}} />
      )}
    </div>
  );
};

export default ShapeTool;