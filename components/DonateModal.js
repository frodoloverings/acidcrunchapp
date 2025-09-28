import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useRef, useEffect, useState } from 'react';
import Icon from './Icon.js';
const DonateModal = ({ isOpen, onClose, t }) => {
    const modalRef = useRef(null);
    const [activeTab, setActiveTab] = useState('sber');
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
    return (_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4", children: _jsxs("div", { ref: modalRef, className: "relative flex flex-col bg-[#1c1c1c] rounded-2xl p-6 shadow-2xl border border-[#262626] w-full max-w-md", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-2xl font-bold text-white", children: t('donate_modal.title') }), _jsx("button", { onClick: onClose, className: "p-2 rounded-full hover:bg-white/10 text-gray-400", children: _jsx(Icon, { name: "x", className: "w-6 h-6" }) })] }), _jsx("p", { className: "text-gray-400 mb-6", children: t('donate_modal.description') }), _jsxs("div", { className: "flex border-b border-gray-700 mb-4", children: [_jsx("button", { onClick: () => setActiveTab('sber'), className: `py-2 px-4 font-semibold ${activeTab === 'sber' ? 'text-[#d1fe17] border-b-2 border-[#d1fe17]' : 'text-gray-400'}`, children: t('donate_modal.tab_sber') }), _jsx("button", { onClick: () => setActiveTab('yandex'), className: `py-2 px-4 font-semibold ${activeTab === 'yandex' ? 'text-[#d1fe17] border-b-2 border-[#d1fe17]' : 'text-gray-400'}`, children: t('donate_modal.tab_yandex') })] }), _jsxs("div", { children: [activeTab === 'sber' && (_jsx("div", { className: "text-center", children: _jsx("img", { src: "https://raw.githubusercontent.com/frodoloverings/qr-storage/main/image.png", alt: "Sber QR Code", className: "w-64 h-64 mx-auto rounded-lg" }) })), activeTab === 'yandex' && (_jsx("div", { className: "text-center", children: _jsx("a", { href: "https://tips.yandex.ru/guest/payment/3556182", target: "_blank", rel: "noopener noreferrer", className: "inline-block w-64 h-64", children: _jsx("button", { className: "w-full h-full bg-red-600 hover:bg-red-700 text-white text-3xl font-bold rounded-lg transition-colors flex items-center justify-center", children: t('donate_modal.yandex_pay_button') }) }) }))] })] }) }));
};
export default DonateModal;
