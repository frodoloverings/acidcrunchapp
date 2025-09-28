import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle, useLayoutEffect } from 'react';
import { Tool } from '../types.js';
import Icon from './Icon.js';
// --- Constants ---
const MAX_EDIT_DIMENSION = 1500;
const ZOOM_SENSITIVITY = 0.001;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 20;
const HANDLE_SIZE = 20;
const VISUAL_HANDLE_SIZE = 8;
const ImageEditor = forwardRef(({ image, onSaveAndExit, tool, onToolChange, brushColor, brushSize, onTextEditEnd, t, onHistoryUpdate }, ref) => {
    const displayCanvasRef = useRef(null);
    const fullCanvasRef = useRef(null);
    const containerRef = useRef(null);
    const addLayerInputRef = useRef(null);
    const cursorPreviewRef = useRef(null);
    const sourceImageRef = useRef(null);
    const rafId = useRef(0);
    const [viewTransform, setViewTransform] = useState({ scale: 1, panX: 0, panY: 0 });
    const [isSpacebarDown, setIsSpacebarDown] = useState(false);
    const [cursorStyle, setCursorStyle] = useState('crosshair');
    const [textInput, setTextInput] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [localLayers, setLocalLayers] = useState([]);
    const [activeLayerId, setActiveLayerId] = useState(null);
    const [layerImageCache, setLayerImageCache] = useState(new Map());
    const actionRef = useRef('none');
    const panStartRef = useRef(null);
    const draftAnnotationRef = useRef(null);
    const actionStartRef = useRef(null);
    const needsRender = useRef(true);
    const requestRender = useCallback(() => { needsRender.current = true; }, []);
    useEffect(() => {
        onHistoryUpdate();
    }, [historyIndex, onHistoryUpdate]);
    const fitAndCenter = useCallback(() => {
        const container = containerRef.current;
        const fullCanvas = fullCanvasRef.current;
        if (!container || !fullCanvas)
            return;
        const { width: canvasWidth, height: canvasHeight } = fullCanvas;
        const { clientWidth: containerWidth, clientHeight: containerHeight } = container;
        const scaleX = containerWidth / canvasWidth;
        const scaleY = containerHeight / canvasHeight;
        const newScale = Math.min(scaleX, scaleY) * 0.95;
        setViewTransform({
            scale: newScale,
            panX: (containerWidth - canvasWidth * newScale) / 2,
            panY: (containerHeight - canvasHeight * newScale) / 2,
        });
        requestRender();
    }, [requestRender]);
    useLayoutEffect(() => {
        sourceImageRef.current = new Image();
        sourceImageRef.current.crossOrigin = "anonymous";
        let objectUrl = null;
        const currentSourceImage = sourceImageRef.current;
        currentSourceImage.onload = () => {
            const scale = Math.min(MAX_EDIT_DIMENSION / currentSourceImage.width, MAX_EDIT_DIMENSION / currentSourceImage.height, 1);
            const scaledWidth = currentSourceImage.width * scale;
            const scaledHeight = currentSourceImage.height * scale;
            const canvas = ('OffscreenCanvas' in window)
                ? new OffscreenCanvas(scaledWidth, scaledHeight)
                : document.createElement('canvas');
            canvas.width = scaledWidth;
            canvas.height = scaledHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx)
                return;
            ctx.drawImage(currentSourceImage, 0, 0, scaledWidth, scaledHeight);
            fullCanvasRef.current = canvas;
            // Initialize local history from the image prop
            const initialHistory = image.annotationHistory && image.annotationHistory.length > 0
                ? image.annotationHistory
                : [{ layers: [] }];
            const initialIndex = image.annotationHistoryIndex >= 0 && image.annotationHistoryIndex < initialHistory.length
                ? image.annotationHistoryIndex
                : initialHistory.length - 1;
            setHistory(initialHistory);
            setHistoryIndex(initialIndex);
            setLocalLayers(initialHistory[initialIndex].layers);
            fitAndCenter();
            redrawFullCanvas();
            if (objectUrl)
                URL.revokeObjectURL(objectUrl);
        };
        if (typeof image.source === 'string') {
            currentSourceImage.src = image.source;
        }
        else {
            objectUrl = URL.createObjectURL(image.source);
            currentSourceImage.src = objectUrl;
        }
    }, [image.id, image.source, image.annotationHistory, image.annotationHistoryIndex, fitAndCenter]);
    useEffect(() => {
        const newImageUrls = localLayers
            .filter((l) => l.type === 'image')
            .map(l => l.src)
            .filter(src => !layerImageCache.has(src) || !layerImageCache.get(src)?.complete);
        if (newImageUrls.length > 0) {
            let loadedCount = 0;
            const newImages = new Map(layerImageCache);
            newImageUrls.forEach(src => {
                const img = new Image();
                img.onload = () => {
                    newImages.set(src, img);
                    loadedCount++;
                    if (loadedCount === newImageUrls.length) {
                        setLayerImageCache(newImages);
                        redrawFullCanvas();
                    }
                };
                img.src = src;
            });
        }
    }, [localLayers, layerImageCache]);
    useEffect(() => {
        if (tool === Tool.Text) {
            setTextInput({ value: '', color: brushColor, align: 'left' });
        }
    }, [tool, brushColor]);
    const takeSnapshot = useCallback((newLayers) => {
        const newHistory = history.slice(0, historyIndex + 1);
        const newState = { layers: newLayers };
        newHistory.push(newState);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);
    const redrawFullCanvas = useCallback(() => {
        const fullCanvas = fullCanvasRef.current;
        const sourceImage = sourceImageRef.current;
        if (!fullCanvas || !sourceImage || !sourceImage.complete)
            return;
        const ctx = fullCanvas.getContext('2d');
        if (!ctx)
            return;
        ctx.clearRect(0, 0, fullCanvas.width, fullCanvas.height);
        ctx.drawImage(sourceImage, 0, 0, fullCanvas.width, fullCanvas.height);
        localLayers.forEach(layer => drawLayer(ctx, layer, layerImageCache));
        if (draftAnnotationRef.current) {
            drawAnnotation(ctx, draftAnnotationRef.current);
        }
        if (activeLayerId) {
            const activeLayer = localLayers.find(l => l.id === activeLayerId);
            if (activeLayer)
                drawSelectionBox(ctx, activeLayer);
        }
        requestRender();
    }, [localLayers, activeLayerId, layerImageCache, requestRender]);
    useImperativeHandle(ref, () => ({
        resetView: fitAndCenter,
        undo: () => {
            setHistoryIndex(prevIndex => {
                if (prevIndex > 0) {
                    const newIndex = prevIndex - 1;
                    setLocalLayers(history[newIndex].layers);
                    setActiveLayerId(null);
                    return newIndex;
                }
                return prevIndex;
            });
        },
        redo: () => {
            setHistoryIndex(prevIndex => {
                if (prevIndex < history.length - 1) {
                    const newIndex = prevIndex + 1;
                    setLocalLayers(history[newIndex].layers);
                    setActiveLayerId(null);
                    return newIndex;
                }
                return prevIndex;
            });
        },
        clearAnnotations: () => {
            // Filter out annotations, keeping only image layers.
            const layersToKeep = localLayers.filter(layer => layer.type === 'image');
            // Only update state and history if there were annotations to clear.
            if (layersToKeep.length < localLayers.length) {
                setLocalLayers(layersToKeep);
                setActiveLayerId(null);
                takeSnapshot(layersToKeep);
            }
        },
        addLayer: () => addLayerInputRef.current?.click(),
        canUndo: () => historyIndex > 0,
        canRedo: () => historyIndex < history.length - 1,
        saveAndExit: () => {
            onSaveAndExit({
                ...image,
                layers: localLayers,
                annotationHistory: history,
                annotationHistoryIndex: historyIndex,
            });
        },
    }), [fitAndCenter, history, historyIndex, image, onSaveAndExit, localLayers, takeSnapshot]);
    const renderDisplayCanvas = useCallback(() => {
        const displayCanvas = displayCanvasRef.current;
        const fullCanvas = fullCanvasRef.current;
        if (!displayCanvas || !fullCanvas)
            return;
        const dpr = window.devicePixelRatio || 1;
        const w = displayCanvas.clientWidth;
        const h = displayCanvas.clientHeight;
        if (displayCanvas.width !== w * dpr || displayCanvas.height !== h * dpr) {
            displayCanvas.width = w * dpr;
            displayCanvas.height = h * dpr;
        }
        const ctx = displayCanvas.getContext('2d');
        if (!ctx)
            return;
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h);
        ctx.translate(viewTransform.panX, viewTransform.panY);
        ctx.scale(viewTransform.scale, viewTransform.scale);
        ctx.drawImage(fullCanvas, 0, 0);
        ctx.restore();
    }, [viewTransform]);
    useEffect(() => {
        const tick = () => {
            if (needsRender.current) {
                renderDisplayCanvas();
                needsRender.current = false;
            }
            rafId.current = requestAnimationFrame(tick);
        };
        rafId.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId.current);
    }, [renderDisplayCanvas]);
    useEffect(() => { redrawFullCanvas(); }, [localLayers, activeLayerId, redrawFullCanvas]);
    const getMousePos = (e) => {
        const canvas = displayCanvasRef.current;
        if (!canvas)
            return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left);
        const y = (e.clientY - rect.top);
        const worldX = (x - viewTransform.panX) / viewTransform.scale;
        const worldY = (y - viewTransform.panY) / viewTransform.scale;
        return { x: worldX, y: worldY };
    };
    const handleWheel = (e) => {
        e.preventDefault();
        const canvas = displayCanvasRef.current;
        if (!canvas)
            return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left);
        const y = (e.clientY - rect.top);
        const ds = 1 - e.deltaY * ZOOM_SENSITIVITY;
        const nextScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, viewTransform.scale * ds));
        const k = nextScale / viewTransform.scale;
        setViewTransform({
            scale: nextScale,
            panX: x - k * (x - viewTransform.panX),
            panY: y - k * (y - viewTransform.panY)
        });
        requestRender();
    };
    const handlePointerDown = (e) => {
        if (e.button !== 0 || textInput)
            return;
        e.target.setPointerCapture(e.pointerId);
        const pos = getMousePos(e);
        if (isSpacebarDown || tool === Tool.Hand) {
            actionRef.current = 'pan';
            panStartRef.current = { x: e.clientX, y: e.clientY, panX: viewTransform.panX, panY: viewTransform.panY };
            return;
        }
        if (tool === Tool.Selection) {
            const activeLayer = activeLayerId ? localLayers.find(l => l.id === activeLayerId) : undefined;
            // Prevent resize handles on annotation layers
            if (activeLayer && activeLayer.type !== Tool.Brush && activeLayer.type !== Tool.Lasso && activeLayer.type !== Tool.Arrow) {
                const handle = getHandleAtPosition(pos, activeLayer, viewTransform.scale);
                if (handle) {
                    actionRef.current = 'resizeLayer';
                    actionStartRef.current = { pos, layer: activeLayer, handle, originalLayers: localLayers };
                    return;
                }
            }
            const layerAtPos = getLayerAtPosition(pos, [...localLayers].reverse());
            if (layerAtPos) {
                actionRef.current = 'moveLayer';
                setActiveLayerId(layerAtPos.id);
                // Store a deep copy of layers for robust move/resize operations
                actionStartRef.current = { pos, layer: layerAtPos, originalLayers: JSON.parse(JSON.stringify(localLayers)) };
                return;
            }
            setActiveLayerId(null);
            return;
        }
        actionRef.current = 'draw';
        setActiveLayerId(null);
        const common = { id: Date.now(), color: brushColor, size: brushSize };
        if (tool === Tool.Brush || tool === Tool.Lasso) {
            draftAnnotationRef.current = { ...common, type: tool, points: [pos] };
        }
        else if (tool === Tool.Arrow) {
            draftAnnotationRef.current = { ...common, type: tool, start: pos, end: pos };
        }
    };
    const handlePointerMove = (e) => {
        const pos = getMousePos(e);
        if (actionRef.current === 'none') {
            const isPanningTool = isSpacebarDown || tool === Tool.Hand;
            let newCursor = 'crosshair';
            if (isPanningTool) {
                newCursor = 'grab';
            }
            else if (tool === Tool.Selection) {
                const activeLayer = activeLayerId ? localLayers.find(l => l.id === activeLayerId) : undefined;
                if (activeLayer) {
                    // Prevent resize cursor for annotation layers
                    if (activeLayer.type !== Tool.Brush && activeLayer.type !== Tool.Lasso && activeLayer.type !== Tool.Arrow) {
                        const handle = getHandleAtPosition(pos, activeLayer, viewTransform.scale);
                        if (handle) {
                            newCursor = (handle === 'tl' || handle === 'br') ? 'nwse-resize' : 'nesw-resize';
                        }
                        else if (getLayerAtPosition(pos, [activeLayer])) {
                            newCursor = 'move';
                        }
                    }
                    else if (getLayerAtPosition(pos, [activeLayer])) {
                        newCursor = 'move';
                    }
                }
                if (newCursor === 'crosshair' && getLayerAtPosition(pos, localLayers)) {
                    newCursor = 'pointer';
                }
            }
            else {
                if (tool === Tool.Lasso)
                    newCursor = 'crosshair';
                else if (tool === Tool.Brush || tool === Tool.Arrow)
                    newCursor = 'none';
                else if (tool === Tool.Text)
                    newCursor = 'text';
            }
            if (cursorStyle !== newCursor) {
                setCursorStyle(newCursor);
            }
        }
        const preview = cursorPreviewRef.current;
        const container = containerRef.current;
        if (preview && container) {
            const containerRect = container.getBoundingClientRect();
            preview.style.left = `${e.clientX - containerRect.left}px`;
            preview.style.top = `${e.clientY - containerRect.top}px`;
            const scaledSize = brushSize * viewTransform.scale;
            preview.style.width = `${scaledSize}px`;
            preview.style.height = `${scaledSize}px`;
        }
        if (actionRef.current === 'pan' && panStartRef.current) {
            const startPan = panStartRef.current;
            const dx = e.clientX - startPan.x;
            const dy = e.clientY - startPan.y;
            setViewTransform(prev => ({ ...prev, panX: startPan.panX + dx, panY: startPan.panY + dy }));
            requestRender();
        }
        else if (actionRef.current === 'draw' && draftAnnotationRef.current) {
            if (draftAnnotationRef.current.type === Tool.Brush || draftAnnotationRef.current.type === Tool.Lasso) {
                draftAnnotationRef.current.points.push(pos);
            }
            else if (draftAnnotationRef.current.type === Tool.Arrow) {
                draftAnnotationRef.current.end = pos;
            }
            redrawFullCanvas();
        }
        else if (actionRef.current === 'moveLayer' && actionStartRef.current?.layer) {
            const { pos: startPos, layer, originalLayers } = actionStartRef.current;
            const originalLayer = originalLayers.find(l => l.id === layer.id);
            const dx = pos.x - startPos.x;
            const dy = pos.y - startPos.y;
            setLocalLayers(prevLayers => prevLayers.map(l => l.id === layer.id ? { ...l, x: originalLayer.x + dx, y: originalLayer.y + dy } : l));
            // No redrawFullCanvas needed here, useEffect on localLayers will handle it.
        }
        else if (actionRef.current === 'resizeLayer' && actionStartRef.current?.layer && actionStartRef.current.handle) {
            const { layer, handle } = actionStartRef.current;
            const newAttrs = calculateNewLayerAttributes(layer, handle, pos, true);
            setLocalLayers(prevLayers => prevLayers.map(l => {
                if (l.id === layer.id) {
                    const updatedLayer = { ...l, ...newAttrs };
                    if (updatedLayer.type === 'text') {
                        const scaleRatio = newAttrs.width / l.width;
                        updatedLayer.fontSize = l.fontSize * scaleRatio;
                    }
                    return updatedLayer;
                }
                return l;
            }));
            // No redrawFullCanvas needed here, useEffect on localLayers will handle it.
        }
    };
    const handlePointerUp = (e) => {
        e.target.releasePointerCapture(e.pointerId);
        let newLayers = null;
        if (actionRef.current === 'draw' && draftAnnotationRef.current) {
            const newLayer = annotationToLayer(draftAnnotationRef.current);
            draftAnnotationRef.current = null;
            if (newLayer) {
                newLayers = [...localLayers, newLayer];
                setLocalLayers(newLayers);
            }
        }
        else if (actionRef.current === 'moveLayer' || actionRef.current === 'resizeLayer') {
            newLayers = localLayers;
        }
        if (newLayers) {
            takeSnapshot(newLayers);
        }
        actionRef.current = 'none';
        actionStartRef.current = null;
        panStartRef.current = null;
        redrawFullCanvas(); // Final draw for selection box etc.
    };
    const handleCancelText = () => {
        setTextInput(null);
        onTextEditEnd();
    };
    const handleConfirmText = () => {
        if (!textInput || !textInput.value.trim() || !fullCanvasRef.current) {
            setTextInput(null);
            onTextEditEnd();
            return;
        }
        const tempCtx = ('OffscreenCanvas' in window)
            ? new OffscreenCanvas(1, 1).getContext('2d')
            : document.createElement('canvas').getContext('2d');
        if (!tempCtx)
            return;
        const newFontSize = Math.max(36, Math.round(fullCanvasRef.current.height * 0.05));
        const fontFamily = "'Space Grotesk', sans-serif";
        tempCtx.font = `${newFontSize}px ${fontFamily}`;
        const lines = textInput.value.split('\n');
        const lineHeight = newFontSize * 1.2;
        let maxWidth = 0;
        lines.forEach(line => maxWidth = Math.max(maxWidth, tempCtx.measureText(line).width));
        const totalHeight = lines.length * lineHeight;
        const newLayer = {
            id: Date.now(), type: 'text', text: textInput.value,
            x: (fullCanvasRef.current.width - maxWidth) / 2, y: (fullCanvasRef.current.height - totalHeight) / 2,
            width: maxWidth, height: totalHeight, fontSize: newFontSize,
            color: textInput.color, fontFamily, align: textInput.align,
        };
        const newLayers = [...localLayers, newLayer];
        setLocalLayers(newLayers);
        setActiveLayerId(newLayer.id);
        takeSnapshot(newLayers);
        setTextInput(null);
        onTextEditEnd();
        onToolChange(Tool.Selection);
    };
    const handleAddNewLayer = (files) => {
        if (!files || files.length === 0 || !fullCanvasRef.current)
            return;
        const file = files[0];
        if (!file.type.startsWith('image/'))
            return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const img = new Image();
            img.onload = () => {
                const canvas = fullCanvasRef.current;
                const scale = Math.min(canvas.width / 2 / img.width, canvas.height / 2 / img.height);
                const newWidth = img.width * scale;
                const newHeight = img.height * scale;
                const newLayer = {
                    id: Date.now(), type: 'image', src: dataUrl,
                    x: (canvas.width - newWidth) / 2, y: (canvas.height - newHeight) / 2,
                    width: newWidth, height: newHeight,
                };
                const newLayers = [...localLayers, newLayer];
                setLocalLayers(newLayers);
                setActiveLayerId(newLayer.id);
                takeSnapshot(newLayers);
                onToolChange(Tool.Selection);
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    };
    useEffect(() => {
        const handleKeyDown = (e) => {
            const target = e.target;
            if (['INPUT', 'TEXTAREA'].includes(target.tagName)) {
                return;
            }
            if (e.code === 'Space') {
                setIsSpacebarDown(true);
                e.preventDefault();
            }
        };
        const handleKeyUp = (e) => { if (e.code === 'Space')
            setIsSpacebarDown(false); };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);
    useEffect(() => {
        const isPanning = actionRef.current === 'pan';
        const isHandTool = tool === Tool.Hand;
        if (isSpacebarDown || isHandTool) {
            setCursorStyle(isPanning ? 'grabbing' : 'grab');
        }
        else if (tool === Tool.Selection) {
            setCursorStyle('crosshair');
        }
        else if (tool === Tool.Lasso) {
            setCursorStyle('crosshair');
        }
        else if (tool === Tool.Brush || tool === Tool.Arrow) {
            setCursorStyle('none');
        }
        else if (tool === Tool.Text) {
            setCursorStyle('text');
        }
        else {
            setCursorStyle('crosshair');
        }
        const preview = cursorPreviewRef.current;
        if (preview) {
            const showPreview = (tool === Tool.Brush || tool === Tool.Arrow) && !isHandTool && !isSpacebarDown;
            preview.style.display = showPreview ? 'block' : 'none';
            if (showPreview) {
                preview.style.backgroundColor = `${brushColor}80`;
            }
        }
    }, [tool, isSpacebarDown, actionRef.current, brushColor]);
    return (_jsxs("div", { ref: containerRef, className: "relative w-full h-full overflow-hidden bg-[#1c1c1c] rounded-2xl border-2 border-gray-700", style: { touchAction: 'none', cursor: cursorStyle }, onWheel: handleWheel, onPointerDown: handlePointerDown, onPointerMove: handlePointerMove, onPointerUp: handlePointerUp, onDoubleClick: fitAndCenter, children: [_jsx("canvas", { ref: displayCanvasRef, className: "w-full h-full" }), _jsx("div", { ref: cursorPreviewRef, className: "absolute rounded-full pointer-events-none", style: {
                    border: '1px solid white', transform: 'translate(-50%, -50%)',
                    display: 'none', zIndex: 10,
                } }), textInput && (_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50", children: _jsxs("div", { className: "relative flex flex-col bg-[#1c1c1c] rounded-2xl p-4 shadow-2xl border border-[#262626] w-96", children: [_jsx("div", { className: "absolute top-4 right-4", children: _jsxs("div", { className: "relative w-8 h-8 flex items-center justify-center", children: [_jsx("input", { type: "color", value: textInput.color, onChange: (e) => setTextInput(prev => prev ? { ...prev, color: e.target.value } : null), className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer", title: t('text_editor.color_picker_title') }), _jsx("div", { className: "w-6 h-6 rounded-full border-2 border-white/20 pointer-events-none", style: { backgroundColor: textInput.color } })] }) }), _jsx("textarea", { value: textInput.value, onChange: (e) => setTextInput({ ...textInput, value: e.target.value }), placeholder: t('text_editor.placeholder'), autoFocus: true, onKeyDown: (e) => { if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleConfirmText();
                            } }, className: "bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none flex-grow mb-4 text-xl", rows: 3, style: { color: textInput.color } }), _jsxs("div", { className: "w-full flex items-center", children: [_jsx("button", { onClick: handleCancelText, title: t('text_editor.cancel_title'), className: "p-2.5 rounded-lg transition-colors duration-200 hover:bg-[#333333] text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1c1c1c] focus:ring-gray-500", children: _jsx(Icon, { name: "x", className: "w-6 h-6" }) }), _jsx("div", { className: "flex-grow flex justify-center items-center gap-2", children: ['left', 'center', 'right'].map((align) => (_jsx("button", { onClick: () => setTextInput(prev => prev ? { ...prev, align } : null), title: t(`text_editor.align_${align}_title`), className: `p-2.5 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1c1c1c] focus:ring-[#d1fe17] ${textInput.align === align ? 'bg-[#d1fe17] text-black' : 'text-gray-400 hover:bg-white/10'}`, children: _jsx(Icon, { name: `align${align.charAt(0).toUpperCase() + align.slice(1)}`, className: "w-6 h-6" }) }, align))) }), _jsx("button", { onClick: handleConfirmText, title: t('text_editor.confirm_title'), className: "p-2.5 rounded-lg transition-colors duration-200 bg-[#d1fe17] hover:bg-lime-300 text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1c1c1c] focus:ring-[#d1fe17]", children: _jsx(Icon, { name: "check", className: "w-6 h-6" }) })] })] }) })), _jsx("input", { type: "file", ref: addLayerInputRef, className: "hidden", accept: "image/*", onChange: (e) => { handleAddNewLayer(e.target.files); if (e.target)
                    e.target.value = ''; } })] }));
});
// --- Helper Functions ---
const drawAnnotation = (ctx, ann) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (ann.type === Tool.Brush) {
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.size;
        ctx.beginPath();
        if (ann.points.length > 0) {
            ctx.moveTo(ann.points[0].x, ann.points[0].y);
            for (let i = 1; i < ann.points.length; i++)
                ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
    }
    else if (ann.type === Tool.Lasso) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = ann.color;
        const colorWithAlpha = ann.color.startsWith('#') ? `${ann.color}80` : ann.color; // 50% opacity
        ctx.fillStyle = colorWithAlpha;
        ctx.beginPath();
        if (ann.points.length > 0) {
            ctx.moveTo(ann.points[0].x, ann.points[0].y);
            for (let i = 1; i < ann.points.length; i++)
                ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    else if (ann.type === Tool.Arrow) {
        const { start, end } = ann;
        const headlen = Math.max(ann.size * 1.5, 10);
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const draw = () => {
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 7), end.y - headlen * Math.sin(angle - Math.PI / 7));
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 7), end.y - headlen * Math.sin(angle + Math.PI / 7));
            ctx.stroke();
        };
        // Outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = ann.size + 4;
        draw();
        // Fill
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.size;
        draw();
    }
};
const drawLayer = (ctx, layer, imageCache) => {
    ctx.save();
    if (layer.type === 'image') {
        const imgEl = imageCache.get(layer.src);
        if (imgEl && imgEl.complete) {
            ctx.drawImage(imgEl, layer.x, layer.y, layer.width, layer.height);
        }
    }
    else if (layer.type === 'text') {
        const textLayer = layer;
        ctx.font = `${textLayer.fontSize}px ${textLayer.fontFamily}`;
        ctx.textAlign = textLayer.align;
        ctx.textBaseline = 'top';
        const lines = textLayer.text.split('\n');
        const lineHeight = textLayer.fontSize * 1.2;
        const getXPos = (line) => {
            let xPos = textLayer.x;
            if (textLayer.align === 'center')
                xPos = textLayer.x + textLayer.width / 2;
            else if (textLayer.align === 'right')
                xPos = textLayer.x + textLayer.width;
            return xPos;
        };
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        lines.forEach((line, i) => ctx.strokeText(line, getXPos(line), textLayer.y + i * lineHeight));
        ctx.fillStyle = textLayer.color;
        lines.forEach((line, i) => ctx.fillText(line, getXPos(line), textLayer.y + i * lineHeight));
    }
    else {
        // Annotation Layers
        ctx.translate(layer.x, layer.y);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (layer.type === Tool.Brush) {
            const brushLayer = layer;
            ctx.strokeStyle = brushLayer.color;
            ctx.lineWidth = brushLayer.size;
            ctx.beginPath();
            if (brushLayer.points.length > 0) {
                ctx.moveTo(brushLayer.points[0].x, brushLayer.points[0].y);
                for (let i = 1; i < brushLayer.points.length; i++)
                    ctx.lineTo(brushLayer.points[i].x, brushLayer.points[i].y);
            }
            ctx.stroke();
        }
        else if (layer.type === Tool.Lasso) {
            const lassoLayer = layer;
            ctx.lineWidth = 2;
            ctx.strokeStyle = lassoLayer.color;
            const colorWithAlpha = lassoLayer.color.startsWith('#') ? `${lassoLayer.color}80` : lassoLayer.color;
            ctx.fillStyle = colorWithAlpha;
            ctx.beginPath();
            if (lassoLayer.points.length > 0) {
                ctx.moveTo(lassoLayer.points[0].x, lassoLayer.points[0].y);
                for (let i = 1; i < lassoLayer.points.length; i++)
                    ctx.lineTo(lassoLayer.points[i].x, lassoLayer.points[i].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        else if (layer.type === Tool.Arrow) {
            const arrowLayer = layer;
            const { start, end } = arrowLayer;
            const headlen = Math.max(arrowLayer.size * 1.5, 10);
            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            const draw = () => {
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 7), end.y - headlen * Math.sin(angle - Math.PI / 7));
                ctx.moveTo(end.x, end.y);
                ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 7), end.y - headlen * Math.sin(angle + Math.PI / 7));
                ctx.stroke();
            };
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = arrowLayer.size + 4;
            draw();
            ctx.strokeStyle = arrowLayer.color;
            ctx.lineWidth = arrowLayer.size;
            draw();
        }
    }
    ctx.restore();
};
const drawSelectionBox = (ctx, layer) => {
    ctx.strokeStyle = '#d1fe17';
    ctx.lineWidth = 2;
    ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
    // Only draw resize handles for image and text layers
    if (layer.type === 'image' || layer.type === 'text') {
        ctx.fillStyle = '#d1fe17';
        const handles = getResizeHandles(layer);
        Object.values(handles).forEach(handle => {
            ctx.fillRect(handle.x - VISUAL_HANDLE_SIZE / 2, handle.y - VISUAL_HANDLE_SIZE / 2, VISUAL_HANDLE_SIZE, VISUAL_HANDLE_SIZE);
        });
    }
};
const getLayerAtPosition = (pos, layers) => {
    for (const layer of layers) {
        if (pos.x >= layer.x && pos.x <= layer.x + layer.width && pos.y >= layer.y && pos.y <= layer.y + layer.height)
            return layer;
    }
    return null;
};
const getResizeHandles = (layer) => ({
    tl: { x: layer.x, y: layer.y },
    tr: { x: layer.x + layer.width, y: layer.y },
    bl: { x: layer.x, y: layer.y + layer.height },
    br: { x: layer.x + layer.width, y: layer.y + layer.height }
});
const getHandleAtPosition = (pos, layer, scale) => {
    if (layer.type !== 'image' && layer.type !== 'text')
        return null;
    const handles = getResizeHandles(layer);
    const margin = HANDLE_SIZE / scale;
    for (const [key, p] of Object.entries(handles)) {
        if (Math.hypot(pos.x - p.x, pos.y - p.y) < margin)
            return key;
    }
    return null;
};
const calculateNewLayerAttributes = (original, handle, pos, maintainAspect) => {
    const aspectRatio = original.width / original.height;
    const right = original.x + original.width;
    const bottom = original.y + original.height;
    const minDim = 20;
    let newX = original.x;
    let newY = original.y;
    let newWidth = original.width;
    let newHeight = original.height;
    const anchor = {
        x: handle.includes('l') ? right : original.x,
        y: handle.includes('t') ? bottom : original.y,
    };
    let tempWidth = Math.abs(pos.x - anchor.x);
    let tempHeight = Math.abs(pos.y - anchor.y);
    if (maintainAspect) {
        if (tempWidth / tempHeight > aspectRatio) {
            newWidth = tempHeight * aspectRatio;
            newHeight = tempHeight;
        }
        else {
            newWidth = tempWidth;
            newHeight = tempWidth / aspectRatio;
        }
    }
    else {
        newWidth = tempWidth;
        newHeight = tempHeight;
    }
    if (newWidth < minDim) {
        newWidth = minDim;
        if (maintainAspect)
            newHeight = newWidth / aspectRatio;
    }
    if (newHeight < minDim) {
        newHeight = minDim;
        if (maintainAspect)
            newWidth = newHeight * aspectRatio;
    }
    newX = handle.includes('l') ? anchor.x - newWidth : anchor.x;
    newY = handle.includes('t') ? anchor.y - newHeight : anchor.y;
    return { x: newX, y: newY, width: newWidth, height: newHeight };
};
const annotationToLayer = (ann) => {
    const common = { id: ann.id, color: ann.color, size: ann.size };
    if (ann.type === Tool.Brush || ann.type === Tool.Lasso) {
        if (ann.points.length < 2)
            return null;
        const xs = ann.points.map(p => p.x);
        const ys = ann.points.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        return {
            ...common,
            type: ann.type,
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            points: ann.points.map(p => ({ x: p.x - minX, y: p.y - minY })),
        };
    }
    if (ann.type === Tool.Arrow) {
        if (Math.hypot(ann.end.x - ann.start.x, ann.end.y - ann.start.y) < 5)
            return null; // Ignore tiny arrows
        const { start, end } = ann;
        const minX = Math.min(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxX = Math.max(start.x, end.x);
        const maxY = Math.max(start.y, end.y);
        return {
            ...common,
            type: ann.type,
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            start: { x: start.x - minX, y: start.y - minY },
            end: { x: end.x - minX, y: end.y - minY },
        };
    }
    return null;
};
export default ImageEditor;
