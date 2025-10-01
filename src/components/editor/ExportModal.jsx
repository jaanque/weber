import React from 'react';

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalContentStyle = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  width: '80%',
  maxWidth: '700px',
  maxHeight: '80vh',
  overflowY: 'auto',
};

const textareaStyle = {
  width: '100%',
  height: '200px',
  marginTop: '10px',
  fontFamily: 'monospace',
};

const ExportModal = ({ htmlCode, cssCode, onClose }) => {
  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    alert('Copied to clipboard!');
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2>Export Code</h2>

        <h3>HTML (index.html)</h3>
        <button onClick={() => handleCopy(htmlCode)}>Copy HTML</button>
        <textarea style={textareaStyle} value={htmlCode} readOnly />

        <h3 style={{ marginTop: '20px' }}>CSS (styles.css)</h3>
        <button onClick={() => handleCopy(cssCode)}>Copy CSS</button>
        <textarea style={textareaStyle} value={cssCode} readOnly />

        <button style={{ marginTop: '20px' }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default ExportModal;