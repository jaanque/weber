import React from 'react';
import './StylingToolbar.css';
import { FaBold, FaItalic } from 'react-icons/fa';

const StylingToolbar = ({ selectedItem, onStyleChange }) => {
    if (!selectedItem) {
        return null;
    }

    const { style = {} } = selectedItem;

    const handleBoldClick = () => {
        onStyleChange({ ...style, fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold' });
    };

    const handleItalicClick = () => {
        onStyleChange({ ...style, fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' });
    };

    const handleFontSizeChange = (e) => {
        const newSize = e.target.value;
        onStyleChange({ ...style, fontSize: `${newSize}px` });
    };

    // Extract numeric value from fontSize string (e.g., "16px")
    const currentFontSize = style.fontSize ? parseInt(style.fontSize.replace('px', '')) : 16;

    // The toolbar will be positioned relative to the canvas based on the selected item's position.
    // For now, we'll just define the component and its functions. Positioning will be handled in Canvas.js.
    return (
        <div className="styling-toolbar">
            <button
                onClick={handleBoldClick}
                className={style.fontWeight === 'bold' ? 'active' : ''}
            >
                <FaBold />
            </button>
            <button
                onClick={handleItalicClick}
                className={style.fontStyle === 'italic' ? 'active' : ''}
            >
                <FaItalic />
            </button>
            <input
                type="number"
                value={currentFontSize}
                onChange={handleFontSizeChange}
                className="font-size-input"
                min="8"
                max="120"
            />
        </div>
    );
};

export default StylingToolbar;