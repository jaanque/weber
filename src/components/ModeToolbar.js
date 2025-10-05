import React from 'react';
import { FaMousePointer, FaHandPaper } from 'react-icons/fa';
import './ModeToolbar.css';

const ModeToolbar = ({ toolMode, setToolMode }) => {
  return (
    <div className="mode-toolbar-container">
      <button
        className={`mode-button ${toolMode === 'select' ? 'active' : ''}`}
        onClick={() => setToolMode('select')}
        title="Select & Edit Tool (V)"
      >
        <FaMousePointer />
      </button>
      <button
        className={`mode-button ${toolMode === 'pan' ? 'active' : ''}`}
        onClick={() => setToolMode('pan')}
        title="Pan Tool (H)"
      >
        <FaHandPaper />
      </button>
    </div>
  );
};

export default ModeToolbar;