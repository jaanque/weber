import React, { useState } from 'react';
import { FaMousePointer, FaHandPaper } from 'react-icons/fa';
import './ModeToolbar.css';

const ModeToolbar = ({ toolMode, setToolMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMouseEnter = () => setIsMenuOpen(true);
  const handleMouseLeave = () => setIsMenuOpen(false);

  const activeIcon = toolMode === 'select' ? <FaMousePointer /> : <FaHandPaper />;

  return (
    <div
      className="mode-toolbar-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isMenuOpen && (
        <div className="mode-options-popup">
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
      )}
      <div className="mode-toolbar-trigger">
        {activeIcon}
      </div>
    </div>
  );
};

export default ModeToolbar;