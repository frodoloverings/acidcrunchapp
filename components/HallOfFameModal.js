import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useRef, useEffect, useState } from 'react';
import Icon from './Icon.js';
const FameEntry = ({ name, link, desc, isOpen, onToggle }) => {
    return (_jsxs("div", { children: [_jsxs("button", { onClick: onToggle, className: "w-full text-left p-4 bg-[#2a2a2a] hover:bg-[#383838] rounded-lg transition-colors text-gray-200 flex justify-between items-center", children: [_jsxs("a", { href: link, target: "_blank", rel: "noopener noreferrer", onClick: (e) => e.stopPropagation(), className: "flex items-center gap-3 text-lg text-white hover:text-cyan-300 transition-colors group", children: [_jsx(Icon, { name: "link", className: "w-5 h-5 text-gray-500 group-hover:text-cyan-300 transition-colors" }), _jsx("span", { className: "group-hover:underline", children: name })] }), _jsx(Icon, { name: isOpen ? 'chevron-up' : 'chevron-down', className: "w-6 h-6 transition-transform" })] }), _jsx("div", { className: "overflow-hidden transition-all duration-300 ease-in-out", style: { maxHeight: isOpen ? '1000px' : '0px' }, children: _jsx("div", { className: "pt-4 pl-4 ml-4 border-l-2 border-gray-700", children: _jsx("p", { className: "text-gray-300", children: desc }) }) })] }));
};
const HallOfFameModal = ({ isOpen, onClose, t }) => {
    const modalRef = useRef(null);
    const [openEntry, setOpenEntry] = useState(null);
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
    const handleToggle = (name) => {
        setOpenEntry(prev => (prev === name ? null : name));
    };
    const creator = { name: 'Волков Фёдор (aka AcidCrunch)', link: 'https://t.me/acidcrunch', desc: t('hall_of_fame.creator_desc') };
    const upgraders = [{ name: 'Islam Ibrakhimzhanov', link: 'https://t.me/shumbola_ai', desc: t('hall_of_fame.islam_desc') }];
    const boosters = [
        { name: 'Max Kim (Нейромания)', link: 'https://t.me/NeuromaniacMAX', desc: t('hall_of_fame.max_kim_desc') },
        { name: 'Сергей Беляк', link: 'https://t.me/belyakAi', desc: t('hall_of_fame.belyak_desc') },
        { name: 'Нейросетевые мемы', link: 'https://t.me/stdif_kos', desc: t('hall_of_fame.memes_desc') },
    ];
    return (_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4", children: _jsxs("div", { ref: modalRef, className: "relative flex flex-col bg-[#1c1c1c] rounded-2xl p-6 shadow-2xl border border-[#262626] w-full max-w-2xl max-h-[80vh]", children: [_jsxs("div", { className: "flex justify-between items-center mb-6 flex-shrink-0", children: [_jsx("h3", { className: "text-2xl font-bold text-white", children: t('hall_of_fame.title') }), _jsx("button", { onClick: onClose, className: "p-2 rounded-full hover:bg-white/10 text-gray-400", children: _jsx(Icon, { name: "x", className: "w-6 h-6" }) })] }), _jsxs("div", { className: "flex-grow overflow-y-auto space-y-5 pr-2", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-xl font-bold text-[#d1fe17] mb-3", children: t('hall_of_fame.creator') }), _jsx("div", { className: "space-y-2", children: _jsx(FameEntry, { name: creator.name, link: creator.link, desc: creator.desc, isOpen: openEntry === creator.name, onToggle: () => handleToggle(creator.name) }) })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-xl font-bold text-[#d1fe17] mb-3", children: t('hall_of_fame.upgraders') }), _jsx("div", { className: "space-y-2", children: upgraders.map(person => (_jsx(FameEntry, { name: person.name, link: person.link, desc: person.desc, isOpen: openEntry === person.name, onToggle: () => handleToggle(person.name) }, person.name))) })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-xl font-bold text-[#d1fe17] mb-3", children: t('hall_of_fame.boosters') }), _jsx("div", { className: "space-y-2", children: boosters.map(person => (_jsx(FameEntry, { name: person.name, link: person.link, desc: person.desc, isOpen: openEntry === person.name, onToggle: () => handleToggle(person.name) }, person.name))) })] })] })] }) }));
};
export default HallOfFameModal;
