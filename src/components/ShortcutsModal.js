import React from 'react';
import './ShortcutsModal.css';

const ShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          <ul className="shortcuts-list">
            <li>
              <span className="shortcut-key">Ctrl/Cmd + Z</span>
              <span className="shortcut-action">Undo last action</span>
            </li>
            <li>
              <span className="shortcut-key">Ctrl/Cmd + Y</span>
              <span className="shortcut-action">Redo last action</span>
            </li>
             <li>
              <span className="shortcut-key">Shift + Ctrl/Cmd + Z</span>
              <span className="shortcut-action">Redo last action</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;