import React from 'react';
import './DistanceLines.css';

const DistanceLines = ({ lines }) => {
    if (!lines || lines.length === 0) {
        return null;
    }

    return (
        <div className="distance-lines-container">
            {lines.map((line, index) => (
                <React.Fragment key={index}>
                    <div
                        className={`distance-line ${line.orientation}`}
                        style={{
                            top: line.top,
                            left: line.left,
                            width: line.orientation === 'horizontal' ? line.length : '1px',
                            height: line.orientation === 'vertical' ? line.length : '1px',
                        }}
                    />
                    {line.label && (
                        <div
                            className="distance-label"
                            style={{
                                top: line.label.top,
                                left: line.label.left,
                            }}
                        >
                            {line.label.text}
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default DistanceLines;