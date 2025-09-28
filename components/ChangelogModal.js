import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useRef, useEffect, useState } from 'react';
import Icon from './Icon.js';
const ChangeLogEntry = ({ version, subtitle, features, isOpen, onToggle }) => (_jsxs("div", { children: [_jsxs("button", { onClick: onToggle, className: "w-full text-left p-3 bg-[#2a2a2a] hover:bg-[#383838] rounded-lg transition-colors text-gray-200 flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-xl font-bold text-[#d1fe17]", children: version }), _jsx("p", { className: "text-lg text-white mt-1", children: subtitle })] }), _jsx(Icon, { name: isOpen ? 'chevron-up' : 'chevron-down', className: "w-6 h-6 transition-transform" })] }), _jsx("div", { className: "overflow-hidden transition-all duration-300 ease-in-out", style: { maxHeight: isOpen ? '1000px' : '0px' }, children: _jsx("div", { className: "pt-4 pl-4 ml-4 border-l-2 border-gray-700", children: _jsx("div", { className: "space-y-3 text-gray-300", children: features.trim().split('\n').map((line, index) => (_jsx("p", { children: line.trim().replace(/^- /, '') }, index))) }) }) })] }));
const ChangelogModal = ({ isOpen, onClose, t }) => {
    const modalRef = useRef(null);
    const [openVersion, setOpenVersion] = useState('v2_0');
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    const handleToggle = (version) => {
        setOpenVersion(prev => (prev === version ? null : version));
    };
    const versions = ['v2_0', 'v1_5_1', 'v1_5', 'v1_4', 'v1_3', 'v1_2', 'v1_1', 'v1_0'];
    return (_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4", children: _jsxs("div", { ref: modalRef, className: "relative flex flex-col bg-[#1c1c1c] rounded-2xl p-6 shadow-2xl border border-[#262626] w-full max-w-2xl max-h-[85vh]", children: [_jsxs("div", { className: "flex justify-between items-center mb-6 flex-shrink-0", children: [_jsx("h3", { className: "text-2xl font-bold text-white", children: t('changelog.title') }), _jsx("button", { onClick: onClose, className: "p-2 rounded-full hover:bg-white/10 text-gray-400", children: _jsx(Icon, { name: "x", className: "w-6 h-6" }) })] }), _jsx("div", { className: "flex-grow overflow-y-auto pr-4", children: versions.map(version => (_jsx("div", { className: "mb-2", children: _jsx(ChangeLogEntry, { version: t(`changelog.${version}.title`), subtitle: t(`changelog.${version}.subtitle`), features: t(`changelog.${version}.features`), isOpen: openVersion === version, onToggle: () => handleToggle(version) }) }, version))) })] }) }));
};
export default ChangelogModal;
