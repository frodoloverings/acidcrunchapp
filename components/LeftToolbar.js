import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Tool } from '../types.js';
import Icon from './Icon.js';
import Tooltip from './Tooltip.js';
const ToolButton = ({ name, iconName, isActive, isDisabled, onClick, hotkey }) => (_jsx(Tooltip, { text: hotkey ? `${name} (${hotkey})` : name, position: "right", children: _jsx("button", { onClick: onClick, "aria-label": name, disabled: isDisabled, className: `p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-[#d1fe17] w-full h-10 flex items-center justify-center 
                ${isActive ? 'bg-[#d1fe17] text-black' : 'hover:bg-white/10 text-gray-300'}
                ${isDisabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}`, children: _jsx(Icon, { name: iconName, className: "w-6 h-6" }) }) }));
const LeftToolbar = ({ activeTool, onToolChange, brushColor, onBrushColorChange, brushSize, onBrushSizeChange, onConfirmEdits, onAddLayer, t, }) => {
    const sliderTrackRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const min = 2;
    const max = 50;
    const [inputValue, setInputValue] = useState(brushSize.toString());
    useEffect(() => {
        setInputValue(brushSize.toString());
    }, [brushSize]);
    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };
    const handleInputCommit = () => {
        let value = parseInt(inputValue, 10);
        if (isNaN(value)) {
            value = min;
        }
        const clampedValue = Math.max(min, Math.min(max, value));
        onBrushSizeChange(clampedValue);
        setInputValue(clampedValue.toString());
    };
    const handleValueChange = useCallback((e) => {
        if (!sliderTrackRef.current)
            return;
        const rect = sliderTrackRef.current.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        const percentage = Math.max(0, Math.min(1, relativeY / rect.height));
        const value = Math.round(min + percentage * (max - min));
        onBrushSizeChange(value);
    }, [onBrushSizeChange, min, max]);
    useEffect(() => {
        const handleMouseMove = (e) => { if (isDragging) {
            e.preventDefault();
            handleValueChange(e);
        } };
        const handleMouseUp = () => setIsDragging(false);
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleValueChange]);
    const handleMouseDown = (e) => {
        if (e.target.tagName.toLowerCase() === 'input')
            return;
        setIsDragging(true);
        handleValueChange(e);
    };
    const thumbPositionPercent = ((brushSize - min) / (max - min)) * 100;
    return (_jsxs("div", { className: `w-14 bg-[#1c1c1c] rounded-2xl p-2 shadow-2xl flex flex-col items-center gap-2 border border-[#262626]`, children: [_jsx(ToolButton, { name: t('editor.confirm_edits'), iconName: "check", isActive: true, onClick: onConfirmEdits, isDisabled: false }), _jsx(Tooltip, { text: t('toolbar.left.add_layer'), position: "right", children: _jsx("button", { onClick: onAddLayer, "aria-label": t('toolbar.left.add_layer'), className: `p-2 rounded-lg transition-colors duration-200 hover:bg-white/10 text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-[#d1fe17] w-full h-10 flex items-center justify-center`, children: _jsx(Icon, { name: "plus", className: "w-6 h-6" }) }) }), _jsx("div", { className: "w-full h-px bg-white/20 my-1" }), _jsxs("div", { className: `flex flex-col items-center gap-2 w-full`, children: [_jsx(ToolButton, { name: t('toolbar.left.brush'), iconName: "brush", isActive: activeTool === Tool.Brush, onClick: () => onToolChange(Tool.Brush), hotkey: "B" }), _jsx(ToolButton, { name: t('toolbar.left.lasso'), iconName: "lasso", isActive: activeTool === Tool.Lasso, onClick: () => onToolChange(Tool.Lasso), hotkey: "L" }), _jsx(ToolButton, { name: t('toolbar.left.arrow'), iconName: "arrow", isActive: activeTool === Tool.Arrow, onClick: () => onToolChange(Tool.Arrow), hotkey: "A" }), _jsx(ToolButton, { name: t('toolbar.left.text'), iconName: "text", isActive: activeTool === Tool.Text, onClick: () => onToolChange(Tool.Text), hotkey: "I" }), _jsx("div", { className: "w-full h-px bg-white/20 my-1" }), _jsxs("div", { onMouseDown: handleMouseDown, className: `relative bg-[#2a2a2a] p-2 rounded-xl flex flex-col items-center gap-2 select-none w-full cursor-pointer`, children: [_jsxs("div", { className: "relative w-8 h-8 flex items-center justify-center", children: [_jsx("input", { type: "color", value: brushColor, onChange: (e) => onBrushColorChange(e.target.value), className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer", "aria-label": t('toolbar.left.color_picker_title') }), _jsx("div", { className: "w-6 h-6 rounded-full border-2 border-black/20 pointer-events-none", style: { backgroundColor: brushColor } })] }), _jsxs("div", { ref: sliderTrackRef, className: "relative h-12 w-full flex justify-center", children: [_jsx("div", { className: "w-1.5 h-full bg-gray-500 rounded-full" }), _jsx("div", { className: "absolute w-5 h-5 bg-[#d1fe17] rounded-full border-2 border-gray-900 pointer-events-none", style: {
                                            top: `calc(${thumbPositionPercent}% - 10px)`,
                                            left: '50%',
                                            transform: 'translateX(-50%)'
                                        } })] }), _jsx("input", { type: "number", value: inputValue, onChange: handleInputChange, onBlur: handleInputCommit, onKeyDown: (e) => { if (e.key === 'Enter')
                                    handleInputCommit(); }, onMouseDown: (e) => e.stopPropagation(), className: "w-full bg-gray-800 text-white text-center rounded text-xs font-mono p-1 border-transparent focus:ring-1 focus:ring-[#d1fe17] focus:border-transparent appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none", min: min, max: max })] })] })] }));
};
export default LeftToolbar;
