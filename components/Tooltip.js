import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
const Tooltip = ({ text, children, position = 'right', className = '' }) => {
    const getPositionClasses = () => {
        switch (position) {
            case 'top':
                return 'bottom-full mb-2 left-1/2 -translate-x-1/2 origin-bottom';
            case 'left':
                return 'right-full mr-4 origin-right';
            case 'right':
            default:
                return 'left-full ml-4 origin-left';
        }
    };
    return (_jsxs("div", { className: `relative group flex items-center ${className}`, children: [children, _jsx("div", { className: `absolute w-auto p-2 min-w-max rounded-md shadow-md text-white bg-[#111111] border border-gray-700 text-xs font-bold transition-all duration-100 scale-0 group-hover:scale-100 z-50 pointer-events-none ${getPositionClasses()}`, children: text })] }));
};
export default Tooltip;
