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

const StylingToolbar = ({ selectedItem, onStyleChange, onRotate }) => {
    if (!selectedItem || selectedItem.type !== 'text') {
        return null;
    }

    const { style = {}, rotation = 0 } = selectedItem;

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
                aria-label="Toggle bold text"
                aria-pressed={style.fontWeight === 'bold'}
            >
                <FaBold />
            </button>
            <button
                onClick={() => handleStyleToggle('fontStyle', 'italic')}
                className={style.fontStyle === 'italic' ? 'active' : ''}
                title="Italic"
                aria-label="Toggle italic text"
                aria-pressed={style.fontStyle === 'italic'}
            >
                <FaItalic />
            </button>
            <button
                onClick={() => handleStyleToggle('textDecoration', 'underline', 'none')}
                className={style.textDecoration === 'underline' ? 'active' : ''}
                title="Underline"
                aria-label="Toggle underline text"
                aria-pressed={style.textDecoration === 'underline'}
            >
                <FaUnderline />
            </button>

            <div className="toolbar-divider"></div>

            {/* Font Family Selector */}
            <select
                value={style.fontFamily || 'Arial'}
                onChange={(e) => handleStyleValueChange('fontFamily', e.target.value)}
                className="toolbar-select"
                aria-label="Select font family"
            >
                {FONT_FACES.map(font => <option key={font} value={font}>{font}</option>)}
            </select>

            {/* Font Size and Rotation Inputs */}
            <div className="toolbar-input-group">
                <input
                    type="number"
                    value={currentFontSize}
                    onChange={(e) => handleStyleValueChange('fontSize', `${e.target.value}px`)}
                    className="toolbar-input"
                    min="8"
                    max="120"
                    title="Font size"
                    aria-label="Set font size"
                />
                <input
                    type="number"
                    value={Math.round(rotation)}
                    onChange={(e) => onRotate(selectedItem.id, parseFloat(e.target.value))}
                    className="toolbar-input"
                    min="-360"
                    max="360"
                    title="Rotation"
                    aria-label="Set rotation"
                />
            </div>

            {/* Color Picker */}
            <input
              type="color"
              value={style.color || '#000000'}
              onChange={(e) => handleStyleValueChange('color', e.target.value)}
              className="toolbar-color-picker"
              title="Text color"
              aria-label="Select text color"
            />

            <div className="toolbar-divider"></div>

            {/* Text Align Buttons */}
            <button
                onClick={() => handleStyleValueChange('textAlign', 'left')}
                className={style.textAlign === 'left' ? 'active' : ''}
                title="Align left"
                aria-label="Align text left"
                aria-pressed={style.textAlign === 'left'}
            >
                <FaAlignLeft />
            </button>
            <button
                onClick={() => handleStyleValueChange('textAlign', 'center')}
                className={style.textAlign === 'center' ? 'active' : ''}
                title="Align center"
                aria-label="Align text center"
                aria-pressed={style.textAlign === 'center'}
            >
                <FaAlignCenter />
            </button>
            <button
                onClick={() => handleStyleValueChange('textAlign', 'right')}
                className={style.textAlign === 'right' ? 'active' : ''}
                title="Align right"
                aria-label="Align text right"
                aria-pressed={style.textAlign === 'right'}
            >
                <FaAlignRight />
            </button>
        </div>
    );
};

export default StylingToolbar;