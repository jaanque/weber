import React from 'react';
import './StylingToolbar.css';
import {
    FaBold,
    FaItalic,
    FaUnderline,
    FaAlignLeft,
    FaAlignCenter,
    FaAlignRight
} from 'react-icons/fa';

const FONT_FACES = ['Arial', 'Georgia', 'Helvetica', 'Times New Roman', 'Verdana'];

const StylingToolbar = ({ selectedItem, onStyleChange }) => {
    if (!selectedItem) {
        return null;
    }

    const { style = {} } = selectedItem;

    const handleStyleToggle = (property, activeValue, defaultValue = 'normal') => {
        onStyleChange({ ...style, [property]: style[property] === activeValue ? defaultValue : activeValue });
    };

    const handleStyleValueChange = (property, value) => {
        onStyleChange({ ...style, [property]: value });
    };

    const currentFontSize = style.fontSize ? parseInt(style.fontSize.replace('px', '')) : 16;

    return (
        <div className="styling-toolbar">
            {/* Font Style Buttons */}
            <button
                onClick={() => handleStyleToggle('fontWeight', 'bold')}
                className={style.fontWeight === 'bold' ? 'active' : ''}
                title="Bold"
            >
                <FaBold />
            </button>
            <button
                onClick={() => handleStyleToggle('fontStyle', 'italic')}
                className={style.fontStyle === 'italic' ? 'active' : ''}
                title="Italic"
            >
                <FaItalic />
            </button>
            <button
                onClick={() => handleStyleToggle('textDecoration', 'underline', 'none')}
                className={style.textDecoration === 'underline' ? 'active' : ''}
                title="Underline"
            >
                <FaUnderline />
            </button>

            <div className="toolbar-divider"></div>

            {/* Font Family Selector */}
            <select
                value={style.fontFamily || 'Arial'}
                onChange={(e) => handleStyleValueChange('fontFamily', e.target.value)}
                className="toolbar-select"
            >
                {FONT_FACES.map(font => <option key={font} value={font}>{font}</option>)}
            </select>

            {/* Font Size Input */}
            <input
                type="number"
                value={currentFontSize}
                onChange={(e) => handleStyleValueChange('fontSize', `${e.target.value}px`)}
                className="font-size-input"
                min="8"
                max="120"
                title="Font size"
            />

            {/* Color Picker */}
            <input
              type="color"
              value={style.color || '#000000'}
              onChange={(e) => handleStyleValueChange('color', e.target.value)}
              className="toolbar-color-picker"
              title="Text color"
            />

            <div className="toolbar-divider"></div>

            {/* Text Align Buttons */}
            <button
                onClick={() => handleStyleValueChange('textAlign', 'left')}
                className={style.textAlign === 'left' ? 'active' : ''}
                title="Align left"
            >
                <FaAlignLeft />
            </button>
            <button
                onClick={() => handleStyleValueChange('textAlign', 'center')}
                className={style.textAlign === 'center' ? 'active' : ''}
                title="Align center"
            >
                <FaAlignCenter />
            </button>
            <button
                onClick={() => handleStyleValueChange('textAlign', 'right')}
                className={style.textAlign === 'right' ? 'active' : ''}
                title="Align right"
            >
                <FaAlignRight />
            </button>
        </div>
    );
};

export default StylingToolbar;