import React, { useState, useRef } from 'react';
import './StylingToolbar.css';
import {
    FaBold,
    FaItalic,
    FaUnderline,
    FaAlignLeft,
    FaAlignCenter,
    FaAlignRight,
    FaUpload
} from 'react-icons/fa';

const FONT_FACES = ['Arial', 'Georgia', 'Helvetica', 'Times New Roman', 'Verdana'];

const StylingToolbar = ({ selectedItem, onStyleChange }) => {
    const [fontFaces, setFontFaces] = useState(FONT_FACES);
    const fileInputRef = useRef(null);

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

    const handleFontUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const fontUrl = event.target.result;
            const fontName = file.name.split('.').slice(0, -1).join('.').replace(/[-_]/g, ' ');

            const newStyle = document.createElement('style');
            newStyle.appendChild(document.createTextNode(`
                @font-face {
                    font-family: "${fontName}";
                    src: url(${fontUrl});
                }
            `));
            document.head.appendChild(newStyle);

            if (!fontFaces.includes(fontName)) {
                setFontFaces(prev => [...prev, fontName]);
            }
            handleStyleValueChange('fontFamily', fontName);
        };
        reader.readAsDataURL(file);
    };

    const triggerFontUpload = () => {
        fileInputRef.current.click();
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
                {fontFaces.map(font => <option key={font} value={font}>{font}</option>)}
            </select>

            {/* Font Upload */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFontUpload}
                style={{ display: 'none' }}
                accept=".ttf,.otf,.woff,.woff2"
                aria-hidden="true"
            />
            <button onClick={triggerFontUpload} title="Upload font" aria-label="Upload custom font">
                <FaUpload />
            </button>

            {/* Font Size Input */}
            <input
                type="number"
                value={currentFontSize}
                onChange={(e) => handleStyleValueChange('fontSize', `${e.target.value}px`)}
                className="font-size-input"
                min="8"
                max="120"
                title="Font size"
                aria-label="Set font size"
            />

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