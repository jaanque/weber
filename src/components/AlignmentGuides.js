import React from 'react';
import './AlignmentGuides.css';

const AlignmentGuides = ({ guides }) => {
  return (
    <div className="alignment-guides">
      {guides.map((guide, index) => (
        <div
          key={index}
          className={`guide ${guide.orientation}`}
          style={{ top: guide.top, left: guide.left, width: guide.width, height: guide.height }}
        >
          {guide.distance && <span className="distance-label">{guide.distance}px</span>}
        </div>
      ))}
    </div>
  );
};

export default AlignmentGuides;