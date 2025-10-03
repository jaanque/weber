import React, { useState, useEffect } from 'react';
import './SaveStatus.css';

const SaveStatus = ({ lastSaved }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (lastSaved) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000); // Hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [lastSaved]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className={`save-status ${visible ? 'visible' : ''}`}>
      {lastSaved ? `Project saved at ${formatTimestamp(lastSaved)}` : 'Project saved automatically'}
    </div>
  );
};

export default SaveStatus;