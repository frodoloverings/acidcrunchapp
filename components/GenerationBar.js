import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Icon from './Icon.js';
import Tooltip from './Tooltip.js';
const MIN_HEIGHT = 175;
const MAX_HEIGHT = 500;
const MIN_WIDTH = 600;
const MAX_WIDTH = 1200;
const ReferenceThumbnail = ({ image, index, onClick }) => {
    const [imageUrl, setImageUrl] = useState('');
    useEffect(() => {
        let objectUrl = null;
        if (typeof image.source === 'string') {
            setImageUrl(image.source);
        }
        else {
            objectUrl = URL.createObjectURL(image.source);
            setImageUrl(objectUrl);
        }
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [image.source]);
    if (!imageUrl)
        return null;
    return (_jsxs("div", { onClick: onClick, className: "relative w-16 h-16 rounded-lg overflow-hidden border-2 border-transparent group cursor-pointer", children: [_jsx("img", { src: imageUrl, alt: `Reference ${index + 1}`, className: "w-full h-full object-cover" }), _jsxs("div", { className: "absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg", children: ["@", index + 1] })] }));
};
const GenerationBar = ({ userPrompt, onUserPromptChange, onGenerate, onReasoning, loadingAction, canGenerate, language, isMagicPromptEnabled, onMagicPromptToggle, selectedImages, workspaceImages, highlightedRefs, t, onExpandPromptEditor, onClearPrompt, onAddImage, onShowPresets, onFocusOnImage, }) => {
    const [barHeight, setBarHeight] = useState(MIN_HEIGHT);
    const [barWidth, setBarWidth] = useState(730);
    const isResizingRef = useRef(null);
    const startYRef = useRef(0);
    const startHeightRef = useRef(0);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);
    const barRef = useRef(null);
    const textareaRef = useRef(null);
    const rendererRef = useRef(null);
    const isLoading = loadingAction !== null;
    const isGenerating = loadingAction === 'generate';
    const isReasoning = loadingAction === 'reasoning';
    const [isHoverIndicatorVisible, setIsHoverIndicatorVisible] = useState(false);
    const [hoverPos, setHoverPos] = useState({ x: null, y: null });
    const indicatorTimeoutRef = useRef(null);
    useEffect(() => {
        setBarHeight(currentHeight => Math.max(currentHeight, MIN_HEIGHT));
    }, []);
    const syncScroll = () => {
        if (textareaRef.current && rendererRef.current) {
            rendererRef.current.scrollTop = textareaRef.current.scrollTop;
            rendererRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };
    const renderHighlightedPrompt = useMemo(() => {
        const parts = userPrompt.split(/(@[1-9][0-9]*)/g);
        return (_jsxs(_Fragment, { children: [parts.map((part, index) => {
                    if (part.match(/^@[1-9][0-9]*$/)) {
                        const refNum = parseInt(part.substring(1));
                        const isHighlighted = highlightedRefs.includes(refNum);
                        return (_jsx("span", { className: isHighlighted ? 'text-[#d1fe17]' : 'text-gray-200', children: part }, index));
                    }
                    return _jsx("span", { children: part }, index);
                }), userPrompt.length === 0 && '\u00A0'] }));
    }, [userPrompt, highlightedRefs]);
    const handleVerticalMouseDown = useCallback((e) => {
        e.preventDefault();
        if (indicatorTimeoutRef.current)
            clearTimeout(indicatorTimeoutRef.current);
        isResizingRef.current = 'vertical';
        startYRef.current = e.clientY;
        startHeightRef.current = barHeight;
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
        setIsHoverIndicatorVisible(false);
        indicatorTimeoutRef.current = window.setTimeout(() => setHoverPos({ x: null, y: null }), 300);
    }, [barHeight]);
    const handleHorizontalMouseDown = useCallback((e, side) => {
        e.preventDefault();
        if (indicatorTimeoutRef.current)
            clearTimeout(indicatorTimeoutRef.current);
        isResizingRef.current = side === 'left' ? 'horizontal-left' : 'horizontal-right';
        startXRef.current = e.clientX;
        startWidthRef.current = barWidth;
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        setIsHoverIndicatorVisible(false);
        indicatorTimeoutRef.current = window.setTimeout(() => setHoverPos({ x: null, y: null }), 300);
    }, [barWidth]);
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizingRef.current)
                return;
            if (isResizingRef.current === 'vertical') {
                const deltaY = e.clientY - startYRef.current;
                const newHeight = startHeightRef.current - deltaY;
                setBarHeight(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight)));
            }
            else if (isResizingRef.current === 'horizontal-left') {
                const deltaX = e.clientX - startXRef.current;
                const newWidth = startWidthRef.current - deltaX * 2;
                setBarWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)));
            }
            else if (isResizingRef.current === 'horizontal-right') {
                const deltaX = e.clientX - startXRef.current;
                const newWidth = startWidthRef.current + deltaX * 2;
                setBarWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)));
            }
        };
        const handleMouseUp = () => {
            if (isResizingRef.current) {
                isResizingRef.current = null;
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            if (indicatorTimeoutRef.current)
                clearTimeout(indicatorTimeoutRef.current);
        };
    }, []);
    const handleHoverMove = (e, side) => {
        if (indicatorTimeoutRef.current)
            clearTimeout(indicatorTimeoutRef.current);
        if (!isResizingRef.current && barRef.current) {
            const rect = barRef.current.getBoundingClientRect();
            if (side === 'top') {
                setHoverPos({ x: e.clientX - rect.left, y: 0 });
            }
            else if (side === 'left') {
                setHoverPos({ x: 0, y: e.clientY - rect.top });
            }
            else { // right
                setHoverPos({ x: rect.width, y: e.clientY - rect.top });
            }
            setIsHoverIndicatorVisible(true);
        }
    };
    const handleHoverLeave = () => {
        setIsHoverIndicatorVisible(false);
        indicatorTimeoutRef.current = window.setTimeout(() => setHoverPos({ x: null, y: null }), 300);
    };
    const isReasoningDisabled = isLoading || !userPrompt.trim() || selectedImages.length !== 1;
    const showTopIndicator = isHoverIndicatorVisible && !isResizingRef.current && hoverPos.y === 0;
    const showLeftIndicator = isHoverIndicatorVisible && !isResizingRef.current && hoverPos.x === 0;
    const showRightIndicator = isHoverIndicatorVisible && !isResizingRef.current && hoverPos.x !== null && hoverPos.x > 0;
    return (_jsxs("div", { className: `relative ${selectedImages.length > 0 ? 'pt-[72px]' : ''}`, style: { width: `${barWidth}px` }, children: [selectedImages.length > 0 && (_jsx("div", { className: "absolute top-2 left-[24px] z-10 flex items-center flex-wrap gap-2", children: selectedImages.map((image) => {
                    const globalIndex = workspaceImages.findIndex(wsImg => wsImg.id === image.id);
                    if (globalIndex === -1)
                        return null;
                    return _jsx(ReferenceThumbnail, { image: image, index: globalIndex, onClick: () => onFocusOnImage(image.id) }, image.id);
                }) })), _jsxs("div", { ref: barRef, className: "w-full bg-[#1c1c1c] border border-[#262626] rounded-[40px] p-[24px] flex flex-col relative", style: { height: `${barHeight}px` }, children: [_jsx("div", { className: "absolute inset-x-0 -top-2 h-5 cursor-ns-resize z-20", onMouseDown: handleVerticalMouseDown, onMouseMove: (e) => handleHoverMove(e, 'top'), onMouseLeave: handleHoverLeave }), _jsx("div", { className: "absolute inset-y-0 -left-2 w-5 cursor-ew-resize z-20", onMouseDown: (e) => handleHorizontalMouseDown(e, 'left'), onMouseMove: (e) => handleHoverMove(e, 'left'), onMouseLeave: handleHoverLeave }), _jsx("div", { className: "absolute inset-y-0 -right-2 w-5 cursor-ew-resize z-20", onMouseDown: (e) => handleHorizontalMouseDown(e, 'right'), onMouseMove: (e) => handleHoverMove(e, 'right'), onMouseLeave: handleHoverLeave }), _jsx("div", { className: "absolute inset-0 rounded-[40px] border-[#d1fe17] pointer-events-none transition-opacity duration-300", style: {
                            opacity: isHoverIndicatorVisible && !isResizingRef.current ? 1 : 0,
                            borderTopWidth: showTopIndicator ? '3px' : '0px',
                            borderLeftWidth: showLeftIndicator ? '3px' : '0px',
                            borderRightWidth: showRightIndicator ? '3px' : '0px',
                            maskImage: (showTopIndicator && `radial-gradient(80px 40px at ${hoverPos.x}px top, black 40%, transparent 90%)`) ||
                                (showLeftIndicator && `radial-gradient(40px 80px at left ${hoverPos.y}px, black 40%, transparent 90%)`) ||
                                (showRightIndicator && `radial-gradient(40px 80px at right ${hoverPos.y}px, black 40%, transparent 90%)`) || 'none',
                            WebkitMaskImage: (showTopIndicator && `radial-gradient(80px 40px at ${hoverPos.x}px top, black 40%, transparent 90%)`) ||
                                (showLeftIndicator && `radial-gradient(40px 80px at left ${hoverPos.y}px, black 40%, transparent 90%)`) ||
                                (showRightIndicator && `radial-gradient(40px 80px at right ${hoverPos.y}px, black 40%, transparent 90%)`) || 'none',
                        } }), _jsxs("div", { className: "flex-grow grid grid-cols-1 md:grid-cols-[1fr_188px] gap-6 min-h-0", children: [_jsxs("div", { className: "flex flex-col justify-between gap-3 min-h-0", children: [_jsxs("div", { className: "relative w-full flex-grow min-h-0", children: [_jsx("textarea", { ref: textareaRef, value: userPrompt, onChange: (e) => {
                                                    onUserPromptChange(e.target.value);
                                                    syncScroll();
                                                }, onScroll: syncScroll, placeholder: t('generate_bar.placeholder'), className: "prompt-textarea absolute inset-0 w-full bg-transparent border-none p-3 pr-20 text-transparent placeholder:text-gray-500 focus:outline-none focus:ring-0 resize-none caret-white" }), _jsx("div", { ref: rendererRef, className: "prompt-textarea absolute inset-0 w-full border-none p-3 pr-20 text-gray-200 resize-none overflow-auto pointer-events-none whitespace-pre-wrap break-words", children: renderHighlightedPrompt }), _jsx(Tooltip, { text: t('generate_bar.clear_prompt'), position: "left", children: _jsx("button", { onClick: onClearPrompt, className: "absolute top-2 right-9 p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors", style: { visibility: userPrompt ? 'visible' : 'hidden' }, children: _jsx(Icon, { name: "trash", className: "w-4 h-4" }) }) }), _jsx(Tooltip, { text: `${t('generate_bar.expand_prompt')} (T)`, position: "left", children: _jsx("button", { onClick: onExpandPromptEditor, className: "absolute top-2 right-2 p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors", children: _jsx(Icon, { name: "arrows-pointing-out", className: "w-4 h-4" }) }) })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 flex-shrink-0", children: [_jsx(Tooltip, { text: `${t('generate_bar.add_image')} (+)`, position: "top", children: _jsx("button", { onClick: onAddImage, "aria-label": t('generate_bar.add_image'), className: "flex items-center justify-center w-10 h-10 bg-[#222222] hover:bg-[#333333] rounded-full transition-colors duration-200", children: _jsx(Icon, { name: "plus", className: "w-5 h-5 text-white" }) }) }), _jsx(Tooltip, { text: `${t('generate_bar.presets_beta')} (P)`, position: "top", children: _jsx("button", { onClick: onShowPresets, "aria-label": t('generate_bar.presets_beta'), className: "flex items-center justify-center w-10 h-10 bg-[#222222] hover:bg-[#333333] rounded-full transition-colors duration-200", children: _jsx(Icon, { name: "list", className: "w-5 h-5 text-white" }) }) }), _jsx("div", { className: "w-px h-6 bg-white/10 mx-1" }), _jsx(Tooltip, { text: `${t('generate_bar.magic_prompt')} (M)`, position: "top", children: _jsxs("button", { onClick: onMagicPromptToggle, role: "switch", "aria-checked": isMagicPromptEnabled, className: `flex items-center gap-3 bg-[#222222] hover:bg-[#333333] font-semibold py-2 px-3 rounded-full transition-colors duration-200 h-10`, children: [_jsx("span", { className: `transition-colors ${isMagicPromptEnabled ? 'text-[#D1FE17]' : 'text-gray-400'}`, children: "Magic" }), _jsx("div", { className: "relative w-10 h-5 flex-shrink-0 bg-black rounded-full", children: _jsx("span", { className: `absolute top-[2px] left-[2px] block w-4 h-4 rounded-full transform transition-transform duration-300 ease-in-out ${isMagicPromptEnabled ? 'bg-[#D1FE17] translate-x-5' : 'bg-gray-500 translate-x-0'}` }) })] }) })] })] }), _jsxs("div", { className: "flex flex-col gap-[4px] h-full", children: [_jsx(Tooltip, { text: `${t('generate_bar.button_generate')} (Shift+Enter)`, position: "top", className: "flex-grow h-full", children: _jsx("button", { onClick: onGenerate, disabled: isLoading || !canGenerate, className: "w-full h-full bg-[#d1fe17] text-black rounded-[16px] flex items-center justify-center text-xl font-bold transition-colors duration-200 hover:bg-lime-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[#d1fe17] disabled:bg-[#2D2F31] disabled:text-[#6B7280] disabled:cursor-not-allowed", children: _jsx("span", { children: isGenerating ? t('generate_bar.button_generating') : t('generate_bar.button_generate') }) }) }), _jsx(Tooltip, { text: `${t('generate_bar.reasoning')} (R)`, position: "top", className: "flex-grow h-full", children: _jsx("button", { onClick: onReasoning, disabled: isReasoningDisabled, className: "w-full h-full text-white rounded-[16px] flex items-center justify-center text-xl font-bold transition-opacity duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white disabled:bg-[#2D2F31] disabled:text-[#6B7280] disabled:cursor-not-allowed", style: !isReasoningDisabled ? { background: 'radial-gradient(186.79% 132.24% at 3.47% 6.79%, #AF99FF 0%, #FFA8B9 76.02%, #AEE5FF 100%)' } : {}, children: _jsx("span", { children: isReasoning ? t('generate_bar.button_reasoning_loading') : t('generate_bar.reasoning') }) }) })] })] })] })] }));
};
export default GenerationBar;
