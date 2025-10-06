import React, { useState } from 'react';
import './PublicationModal.css';
import { FaCopy, FaCheckCircle } from 'react-icons/fa';

const PublicationModal = ({ isOpen, onClose, publicUrl }) => {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Project Published!</h2>
        <p>Your project is now live and can be viewed by anyone with the link.</p>

        <div className="url-container">
          <input type="text" value={publicUrl} readOnly />
          <button onClick={handleCopy} className="copy-button">
            {isCopied ? <FaCheckCircle /> : <FaCopy />}
          </button>
        </div>

        <button onClick={onClose} className="close-button">
          Close
        </button>
      </div>
    </div>
  );
};

export default PublicationModal;