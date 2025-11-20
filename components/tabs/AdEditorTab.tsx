/**
 * © 2025 Matthew Robert Wesney. All Rights Reserved.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateAdImages } from '../../services/geminiService';
import { ImageInput, AdEditorState } from '../../types';
import NeumorphicButton from '../NeumorphicButton';
import LoadingSpinner from '../LoadingSpinner';

interface AdEditorTabProps {
    adEditorState: AdEditorState;
    setAdEditorState: (state: AdEditorState) => void;
    onApplyEdit: (newImageUrl: string) => void;
    imageModel: string;
}

// --- SVG Icons for Toolbar ---
const BrushIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>);
const BoxIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>);
const ArrowIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>);
const TextIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>);
const ZoomInIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>;
const ZoomOutIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>;
const ResetViewIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M1 1v6h6M23 23v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 1"/><path d="M3.51 15a9 9 0 0 0 14.85 3.36L23 23"/></svg>;


const AdEditorTab: React.FC<AdEditorTabProps> = ({ adEditorState, setAdEditorState, onApplyEdit, imageModel }) => {
    const { originalImage, prompt, editedImage } = adEditorState;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(new Image());
    const annotationCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas')); // For permanent drawings
    const textInputRef = useRef<HTMLInputElement>(null);
    const lastPosRef = useRef({ x: 0, y: 0 });
    const startPosRef = useRef({ x: 0, y: 0 });

    const [transform, setTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
    const [isInteracting, setIsInteracting] = useState(false); // Drawing, panning, etc.
    const [isPanning, setIsPanning] = useState(false);
    
    const [toolSize, setToolSize] = useState(10);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<'brush' | 'box' | 'arrow' | 'text'>('brush');
    const [toolColor, setToolColor] = useState('#ef4444'); // red-500
    const [isTexting, setIsTexting] = useState(false);
    const [textInput, setTextInput] = useState({ x: 0, y: 0, value: '' });
    
    const setPrompt = (newPrompt: string) => {
        setAdEditorState({ ...adEditorState, prompt: newPrompt });
    };

    // --- Main Drawing Loop ---
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const image = imageRef.current;
        if (!ctx || !canvas || !image.complete) return;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(transform.offsetX, transform.offsetY);
        ctx.scale(transform.scale, transform.scale);
        
        ctx.drawImage(image, 0, 0);
        
        const annotationCanvas = annotationCanvasRef.current;
        if (annotationCanvas.width > 0) {
            ctx.drawImage(annotationCanvas, 0, 0);
        }

        ctx.restore();
    }, [transform]);
    
    useEffect(draw, [draw]);

    // --- View Reset & Image Loading ---
    const resetView = useCallback((canvas: HTMLCanvasElement, image: HTMLImageElement) => {
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;
        const imageWidth = image.naturalWidth;
        const imageHeight = image.naturalHeight;

        const scaleX = canvasWidth / imageWidth;
        const scaleY = canvasHeight / imageHeight;
        const scale = Math.min(scaleX, scaleY) * 0.95; // 95% padding

        const offsetX = (canvasWidth - imageWidth * scale) / 2;
        const offsetY = (canvasHeight - imageHeight * scale) / 2;
        
        setTransform({ scale, offsetX, offsetY });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let animationFrameId: number;

        const observer = new ResizeObserver(() => {
            // Defer resize handling to the next animation frame to avoid the "ResizeObserver loop" error.
            animationFrameId = window.requestAnimationFrame(() => {
                if (canvas && imageRef.current.complete) {
                     if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                        canvas.width = canvas.clientWidth;
                        canvas.height = canvas.clientHeight;
                        resetView(canvas, imageRef.current);
                    }
                }
            });
        });
        observer.observe(canvas);
        return () => {
            observer.disconnect();
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [resetView, originalImage]);
    
    useEffect(() => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        if (originalImage && canvas) {
            image.crossOrigin = "anonymous";
            image.src = originalImage;
            image.onload = () => {
                const annotationCanvas = annotationCanvasRef.current;
                annotationCanvas.width = image.naturalWidth;
                annotationCanvas.height = image.naturalHeight;
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
                resetView(canvas, image);
            };
        }
    }, [originalImage, resetView]);
    
    // --- Coordinate Transformation ---
    const getCanvasPos = (e: React.MouseEvent | React.WheelEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        return {
            x: (x - transform.offsetX) / transform.scale,
            y: (y - transform.offsetY) / transform.scale
        };
    };

    // --- Interaction Handlers (Zoom, Pan, Draw) ---
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const { x, y } = getCanvasPos(e);
        const delta = e.deltaY > 0 ? 0.9 : 1.1; // Zoom factor
        const newScale = Math.max(0.1, Math.min(10, transform.scale * delta));
        
        const newOffsetX = transform.offsetX + (x * transform.scale) - (x * newScale);
        const newOffsetY = transform.offsetY + (y * transform.scale) - (y * newScale);

        setTransform({ scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY });
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        // If a text input is focused, don't hijack the spacebar
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            return;
        }

        if (e.key === ' ' && !isPanning) {
            e.preventDefault();
            setIsPanning(true);
        }
    }, [isPanning]);

    const handleKeyUp = useCallback((e: KeyboardEvent) => {
        if (e.key === ' ') {
            setIsPanning(false);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    const handleMouseDown = (e: React.MouseEvent) => {
        const pos = getCanvasPos(e);
        lastPosRef.current = pos;
        startPosRef.current = pos;
        setIsInteracting(true);

        if (isTexting) {
            handleTextSubmit();
            return;
        }

        if (activeTool === 'text') {
            setIsTexting(true);
            setTextInput({ x: pos.x, y: pos.y, value: '' });
            return;
        }

        if (activeTool === 'brush') {
            const ctx = annotationCanvasRef.current.getContext('2d');
            if (!ctx) return;
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isInteracting) return;
        const pos = getCanvasPos(e);
        lastPosRef.current = pos; // Update last position for all tools

        if (isPanning) {
            setTransform(t => ({
                ...t,
                offsetX: t.offsetX + (e.movementX),
                offsetY: t.offsetY + (e.movementY),
            }));
            return;
        }
        
        const ctx = annotationCanvasRef.current.getContext('2d');
        if (!ctx) return;
        
        const setupCtx = (context: CanvasRenderingContext2D) => {
            context.strokeStyle = toolColor;
            context.lineWidth = toolSize / transform.scale;
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.fillStyle = toolColor;
        };
        
        if (activeTool === 'brush') {
            setupCtx(ctx);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            draw(); // Real-time update of the main canvas
        } else { // Live preview for box/arrow
            draw(); // Redraw base + permanent annotations
            const liveCtx = canvasRef.current?.getContext('2d');
            if (!liveCtx) return;
            liveCtx.save();
            liveCtx.translate(transform.offsetX, transform.offsetY);
            liveCtx.scale(transform.scale, transform.scale);
            setupCtx(liveCtx);
            liveCtx.beginPath();
            const start = startPosRef.current;
            if (activeTool === 'box') {
                liveCtx.strokeRect(start.x, start.y, pos.x - start.x, pos.y - start.y);
            } else if (activeTool === 'arrow') {
                 const headlen = (toolSize * 2) / transform.scale;
                const dx = pos.x - start.x;
                const dy = pos.y - start.y;
                const angle = Math.atan2(dy, dx);
                liveCtx.moveTo(start.x, start.y);
                liveCtx.lineTo(pos.x, pos.y);
                liveCtx.lineTo(pos.x - headlen * Math.cos(angle - Math.PI / 6), pos.y - headlen * Math.sin(angle - Math.PI / 6));
                liveCtx.moveTo(pos.x, pos.y);
                liveCtx.lineTo(pos.x - headlen * Math.cos(angle + Math.PI / 6), pos.y - headlen * Math.sin(angle + Math.PI / 6));
                liveCtx.stroke();
            }
            liveCtx.restore();
        }
    };

    const handleMouseUp = () => {
        if (!isInteracting || isPanning) {
            setIsInteracting(false);
            return;
        }
        setIsInteracting(false);

        const ctx = annotationCanvasRef.current.getContext('2d');
        if (!ctx) return;
        const start = startPosRef.current;
        const pos = lastPosRef.current;

        if (activeTool === 'box' || activeTool === 'arrow') {
             // Redraw with the final shape on the permanent canvas
            setupCtx(ctx);
            ctx.beginPath();
             if (activeTool === 'box') {
                ctx.strokeRect(start.x, start.y, pos.x - start.x, pos.y - start.y);
            } else if (activeTool === 'arrow') {
                const headlen = (toolSize * 2) / transform.scale;
                const dx = pos.x - start.x;
                const dy = pos.y - start.y;
                const angle = Math.atan2(dy, dx);
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(pos.x, pos.y);
                ctx.lineTo(pos.x - headlen * Math.cos(angle - Math.PI / 6), pos.y - headlen * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x - headlen * Math.cos(angle + Math.PI / 6), pos.y - headlen * Math.sin(angle + Math.PI / 6));
                ctx.stroke();
            }
        }
        draw();
    };

    const handleTextSubmit = () => {
        if (!textInput.value) {
            setIsTexting(false);
            return;
        }
        const ctx = annotationCanvasRef.current.getContext('2d');
        if (ctx) {
            const fontSize = (toolSize * 2) / transform.scale;
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillStyle = toolColor;
            ctx.textBaseline = 'top';
            ctx.fillText(textInput.value, textInput.x, textInput.y);
            draw();
        }
        setIsTexting(false);
        setTextInput({x: 0, y: 0, value: ''});
    };
    
    // Helper for final drawing
    const setupCtx = (context: CanvasRenderingContext2D) => {
        context.strokeStyle = toolColor;
        context.lineWidth = toolSize / transform.scale;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.fillStyle = toolColor;
    };

    const clearCanvas = () => {
        const canvas = annotationCanvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        draw();
    };
    
    // --- API Call ---
    const handleGenerate = async () => {
        if (!prompt || !originalImage) {
            setError('Please provide an image and a prompt describing the edit.');
            return;
        }
        const image = imageRef.current;
        const annotationCanvas = annotationCanvasRef.current;
        if (!image.complete) return;

        setIsLoading(true);
        setError(null);
        setAdEditorState({ ...adEditorState, editedImage: null });

        try {
            // Create a new canvas to merge the original image and annotations at full resolution
            const mergedCanvas = document.createElement('canvas');
            mergedCanvas.width = image.naturalWidth;
            mergedCanvas.height = image.naturalHeight;
            const ctx = mergedCanvas.getContext('2d');
            if (!ctx) throw new Error("Could not create merged canvas context");

            ctx.drawImage(image, 0, 0); // Draw original image
            ctx.drawImage(annotationCanvas, 0, 0); // Draw annotations on top

            const mergedDataUrl = mergedCanvas.toDataURL('image/jpeg', 0.9);
            const mergedBase64 = mergedDataUrl.split(',')[1];
            
            const annotatedImageInput: ImageInput = { base64: mergedBase64, mimeType: 'image/jpeg' };

            const resultUrls = await generateAdImages(prompt, [annotatedImageInput], 1, imageModel);
            
            if (resultUrls.length > 0) {
                setAdEditorState({ ...adEditorState, editedImage: resultUrls[0] });
            } else {
                throw new Error("AI did not return an image.");
            }
            clearCanvas();

        } catch (e: unknown) {
            let errorMessage = 'An unknown error occurred during image editing.';
            if (e instanceof Error) {
                errorMessage = e.message;
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleApplyEdit = () => {
        if (!adEditorState.editedImage) return;

        // Call the callback to update the main gallery
        onApplyEdit(adEditorState.editedImage);

        // Clear the annotations from the previous edit session
        clearCanvas();

        // Update the state to make the edited image the new original
        setAdEditorState({
            originalImage: adEditorState.editedImage,
            editedImage: null, // Clear the result pane
            prompt: '', // Clear the prompt for the next edit
        });
        
        // The useEffect for originalImage will handle reloading the canvas
    };

    // --- Render Logic ---
    if (!originalImage) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-200">
                <div className="text-center text-gray-400 p-12 rounded-2xl shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
                    <h3 className="text-lg font-semibold mb-2 text-gray-500">Ad Editor</h3>
                    <p>Go to the 'Ad Generation' tab, generate an image, and click 'Edit' to start.</p>
                </div>
            </div>
        );
    }
    
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#000000'];

    return (
        <div className="h-full flex flex-col p-6 bg-gray-200 gap-4">
            <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
                {/* Editor Canvas Panel */}
                <div className="flex flex-col p-4 bg-gray-200 rounded-lg shadow-[inset_3px_3px_6px_#d1d5db,inset_-3px_-3px_6px_#ffffff] gap-2">
                    {/* Toolbar */}
                    <div className="flex-shrink-0 flex items-center justify-between gap-4 p-2 rounded-lg bg-gray-200 shadow-[3px_3px_6px_#d1d5db,-3px_-3px_6px_#ffffff]">
                         <div className="flex items-center gap-2">
                            <ToolButton onClick={() => setTransform(t => ({...t, scale: t.scale * 1.2}))} title="Zoom In"><ZoomInIcon/></ToolButton>
                            <ToolButton onClick={() => setTransform(t => ({...t, scale: t.scale / 1.2}))} title="Zoom Out"><ZoomOutIcon/></ToolButton>
                            <ToolButton onClick={() => resetView(canvasRef.current!, imageRef.current)} title="Reset View"><ResetViewIcon/></ToolButton>
                            <div className="w-px h-6 bg-gray-300 mx-1"></div>
                            <ToolButton onClick={() => setActiveTool('brush')} isActive={activeTool === 'brush'} title="Brush"><BrushIcon/></ToolButton>
                            <ToolButton onClick={() => setActiveTool('box')} isActive={activeTool === 'box'} title="Box"><BoxIcon/></ToolButton>
                            <ToolButton onClick={() => setActiveTool('arrow')} isActive={activeTool === 'arrow'} title="Arrow"><ArrowIcon/></ToolButton>
                            <ToolButton onClick={() => setActiveTool('text')} isActive={activeTool === 'text'} title="Text"><TextIcon/></ToolButton>
                        </div>
                        <div className="flex-grow flex items-center justify-center gap-2">
                             {colors.map(color => (
                                <ColorSwatch key={color} color={color} isSelected={toolColor === color} onClick={() => setToolColor(color)} />
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="tool-size" className="text-xs font-semibold text-gray-600 w-16 text-right pr-2">Size: <span style={{display: 'inline-block', width: '1.2em', textAlign: 'left'}}>{toolSize}</span></label>
                            <input id="tool-size" type="range" min="2" max="50" value={toolSize} onChange={(e) => setToolSize(parseInt(e.target.value))} className="w-24"/>
                        </div>
                        <NeumorphicButton onClick={clearCanvas} size="sm" title="Clear Annotations">Clear</NeumorphicButton>
                    </div>

                    {/* Canvas Container */}
                    <div className="flex-1 w-full min-h-0 relative bg-gray-800/5 rounded-md overflow-hidden">
                        <canvas 
                            ref={canvasRef}
                            className={`w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-crosshair'}`}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={() => isInteracting && handleMouseUp()}
                            onWheel={handleWheel}
                        />
                         {isTexting && (
                            <input
                                ref={textInputRef}
                                type="text"
                                value={textInput.value}
                                onChange={(e) => setTextInput({...textInput, value: e.target.value})}
                                onBlur={handleTextSubmit}
                                onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                                style={{
                                    position: 'absolute',
                                    left: textInput.x * transform.scale + transform.offsetX,
                                    top: textInput.y * transform.scale + transform.offsetY,
                                    fontSize: `${(toolSize * 2)}px`,
                                    lineHeight: 1,
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    border: `1px solid ${toolColor}`,
                                    color: toolColor,
                                    outline: 'none',
                                    fontFamily: 'sans-serif',
                                    fontWeight: 'bold',
                                    padding: '2px 4px',
                                    zIndex: 10,
                                    transformOrigin: 'top left',
                                    transform: `scale(${transform.scale})`
                                }}
                                className="rounded"
                            />
                        )}
                        <div className="absolute bottom-2 right-2 text-xs bg-black/50 text-white rounded px-2 py-0.5 pointer-events-none">
                           {(transform.scale * 100).toFixed(0)}%
                        </div>
                        <div className="absolute bottom-2 left-2 text-xs bg-black/50 text-white rounded px-2 py-0.5 pointer-events-none">
                            Hold [Space] to Pan
                        </div>
                    </div>
                </div>

                {/* Result Viewer */}
                <div className="grid grid-rows-[1fr_auto] justify-items-center p-4 bg-gray-200 rounded-lg shadow-[inset_3px_3px_6px_#d1d5db,inset_-3px_-3px_6px_#ffffff] gap-4">
                    {isLoading ? (
                        <div className="row-span-2 flex items-center justify-center">
                            <LoadingSpinner message="Applying AI edits..."/>
                        </div>
                    ) : editedImage ? (
                        <>
                            <div className="relative w-full h-full min-h-0">
                                <img src={editedImage} alt="Edited result" className="absolute inset-0 w-full h-full object-contain rounded-md" />
                            </div>
                            <NeumorphicButton onClick={handleApplyEdit} size="sm" className="w-full max-w-xs">
                                Apply & Continue Editing
                            </NeumorphicButton>
                        </>
                    ) : (
                        <div className="row-span-2 flex items-center justify-center">
                            <div className="text-center text-gray-500">Your edited image will appear here.</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <footer className="flex-shrink-0 bg-gray-200 p-4 rounded-xl shadow-[5px_5px_10px_#d1d5db,-5px_-5px_10px_#ffffff]">
                <div className="flex items-center gap-4">
                     <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the changes for the annotated image..."
                        className="flex-1 h-20 p-3 rounded-lg bg-gray-200 text-gray-700 placeholder-gray-500 focus:outline-none transition resize-none shadow-[inset_3px_3px_6px_#d1d5db,inset_-3px_-3px_6px_#ffffff] focus:shadow-[inset_1px_1px_2px_#d1d5db,inset_-1px_-1px_2px_#ffffff]"
                    />
                    <NeumorphicButton onClick={handleGenerate} disabled={isLoading || !prompt} className="h-20 w-32 text-base">
                        {isLoading ? <><LoadingSpinner size="sm" /><span className="ml-2">Editing</span></> : 'Generate Edit'}
                    </NeumorphicButton>
                </div>
                 {error && <p className="text-red-500 text-sm mt-3 p-3 bg-red-100/50 rounded-lg">{error}</p>}
            </footer>
        </div>
    );
};

const ToolButton: React.FC<{onClick: () => void, isActive?: boolean, title: string, children: React.ReactNode}> = ({onClick, isActive = false, title, children}) => (<button onClick={onClick} title={title} className={`p-2.5 rounded-lg transition-all duration-200 ${isActive ? 'text-blue-600 shadow-[inset_2px_2px_4px_#d1d5db,inset_-2px_-2px_4px_#ffffff]' : 'bg-gray-200 text-gray-600 shadow-[3px_3px_6px_#d1d5db,-3px_-3px_6px_#ffffff] hover:shadow-[1px_1px_2px_#d1d5db,-1px_-1px_2px_#ffffff]'}`}>{children}</button>);
const ColorSwatch: React.FC<{color: string, isSelected: boolean, onClick: () => void}> = ({color, isSelected, onClick}) => (<button onClick={onClick} className={`w-6 h-6 rounded-full transition-all duration-200 border-2 ${isSelected ? 'border-blue-500 scale-110 shadow-md' : 'border-white/50 hover:scale-110'}`} style={{backgroundColor: color}}></button>);

export default AdEditorTab;