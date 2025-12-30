/**
 * © 2025 Matthew Robert Wesney. All Rights Reserved.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TextCampaign, GeneratedAudio, TimelineClip, VideoClip, AudioClip, TextClip, CanvasAspectRatio, OutputResolution, ASPECT_RATIO_DIMENSIONS } from '../../types';
import NeumorphicButton from '../NeumorphicButton';
import LoadingSpinner from '../LoadingSpinner';

// --- Icons ---
const PlayIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M8 5v14l11-7z"/></svg>;
const PauseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;
const StopIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M6 6h12v12H6z"/></svg>;
const TrashIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const DownloadIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;

// --- Constants ---
const PIXELS_PER_SECOND = 60; 
const RULER_HEIGHT = 40;
const HEADER_PADDING_TOP = 40; // Safe zone for playhead handle/bubble

interface CompositionTabProps {
    images: string[];
    texts: TextCampaign[];
    audios: GeneratedAudio[];
}

const CompositionTab: React.FC<CompositionTabProps> = ({ images, texts, audios }) => {
    // --- State ---
    const [timeline, setTimeline] = useState<TimelineClip[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<CanvasAspectRatio>('16:9');
    const [isExporting, setIsExporting] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    
    // Drag & Drop State (New Assets)
    const [draggedAsset, setDraggedAsset] = useState<{ type: 'image' | 'text' | 'audio', data: any } | null>(null);
    
    // Interaction State (Timeline)
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [draggingClipState, setDraggingClipState] = useState<{ id: string; startX: number; originalStartTime: number } | null>(null);

    // --- Refs ---
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const timelineScrollContainerRef = useRef<HTMLDivElement>(null); // The outer scrollable div
    const timelineContentRef = useRef<HTMLDivElement>(null); // The inner div with actual width
    
    const requestRef = useRef<number>();
    const audioContextRef = useRef<AudioContext | null>(null);
    const activeAudioSources = useRef<Map<string, AudioBufferSourceNode>>(new Map());
    const audioBuffers = useRef<Map<string, AudioBuffer>>(new Map());

    // --- Dimensions ---
    const canvasDims = ASPECT_RATIO_DIMENSIONS[aspectRatio];

    // --- Helpers ---
    const generateId = () => Math.random().toString(36).substr(2, 9);

    // Initialize Audio Context
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
            audioContextRef.current?.close();
        };
    }, []);

    // Track Window Resize
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Preload Audio Buffers
    useEffect(() => {
        audios.forEach(async (audio) => {
            if (!audioBuffers.current.has(audio.url)) {
                try {
                    const response = await fetch(audio.url);
                    const arrayBuffer = await response.arrayBuffer();
                    if (audioContextRef.current) {
                        const decodedBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
                        audioBuffers.current.set(audio.url, decodedBuffer);
                    }
                } catch (e) {
                    console.error("Failed to load audio:", audio.name, e);
                }
            }
        });
    }, [audios]);

    // --- Mouse Interactions (Global Listeners for Dragging) ---
    useEffect(() => {
        const handleWindowMouseMove = (e: MouseEvent) => {
            if (isScrubbing) {
                if (timelineContentRef.current) {
                    const rect = timelineContentRef.current.getBoundingClientRect();
                    // Calculate position relative to the start of the timeline content
                    let x = e.clientX - rect.left;
                    // Clamp to 0
                    x = Math.max(0, x);
                    // Clamp to right edge (Prevent scrubbing off the UI)
                    x = Math.min(x, rect.width);

                    const t = x / PIXELS_PER_SECOND;
                    
                    setCurrentTime(t);
                }
            } else if (draggingClipState) {
                const deltaX = e.clientX - draggingClipState.startX;
                const deltaT = deltaX / PIXELS_PER_SECOND;
                const newStart = Math.max(0, draggingClipState.originalStartTime + deltaT);
                
                setTimeline(prev => prev.map(c => 
                    c.id === draggingClipState.id ? { ...c, startTime: newStart } : c
                ));
            }
        };

        const handleWindowMouseUp = () => {
            if (isScrubbing) setIsScrubbing(false);
            if (draggingClipState) setDraggingClipState(null);
        };

        if (isScrubbing || draggingClipState) {
            window.addEventListener('mousemove', handleWindowMouseMove);
            window.addEventListener('mouseup', handleWindowMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [isScrubbing, draggingClipState, timeline]);

    // --- Drawing Logic ---
    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Filter & Sort
        const visibleClips = timeline
            .filter(clip => currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration)
            .sort((a, b) => a.layer - b.layer);

        visibleClips.forEach(clip => {
            const progress = (currentTime - clip.startTime) / clip.duration;

            if (clip.type === 'video') {
                const videoClip = clip as VideoClip;
                const img = videoClip.imageElement;
                if (img.complete && img.naturalWidth > 0) {
                    let x = 0, y = 0, w = canvas.width, h = canvas.height;
                    
                    // Simple Animation Logic
                    const scaleFactor = 1.2;
                    if (videoClip.animation === 'zoom-in') {
                        const scale = 1 + (progress * (scaleFactor - 1));
                        w = canvas.width * scale; h = canvas.height * scale;
                        x = (canvas.width - w) / 2; y = (canvas.height - h) / 2;
                    } else if (videoClip.animation === 'zoom-out') {
                        const scale = scaleFactor - (progress * (scaleFactor - 1));
                        w = canvas.width * scale; h = canvas.height * scale;
                        x = (canvas.width - w) / 2; y = (canvas.height - h) / 2;
                    } else if (videoClip.animation === 'pan-left') {
                         const scale = 1.2; w = canvas.width * scale; h = canvas.height * scale; y = (canvas.height - h) / 2;
                         x = -(progress * (w - canvas.width)); 
                    } else if (videoClip.animation === 'pan-right') {
                         const scale = 1.2; w = canvas.width * scale; h = canvas.height * scale; y = (canvas.height - h) / 2;
                         x = -(w - canvas.width) + (progress * (w - canvas.width));
                    }
                    ctx.drawImage(img, x, y, w, h);
                }
            } else if (clip.type === 'text') {
                const textClip = clip as TextClip;
                ctx.save();
                ctx.font = `${textClip.fontSize * (canvas.width / 1000)}px ${textClip.fontFamily}`;
                ctx.fillStyle = textClip.color;
                ctx.textAlign = textClip.textAlign;
                ctx.textBaseline = 'middle';
                ctx.shadowColor = "rgba(0,0,0,0.5)";
                ctx.shadowBlur = 4;
                const x = textClip.x * canvas.width;
                const y = textClip.y * canvas.height;
                const lines = textClip.text.split('\n');
                const lineHeight = textClip.fontSize * (canvas.width / 1000) * 1.2;
                lines.forEach((line, i) => {
                    ctx.fillText(line, x, y + (i - (lines.length - 1) / 2) * lineHeight);
                });
                ctx.restore();
            }
        });
    }, [timeline, currentTime, aspectRatio]);

    // --- Playback Loop ---
    const animate = (time: number) => {
        if (isPlaying) {
             setCurrentTime(prev => {
                 const next = prev + 0.016; 
                 const maxDuration = Math.max(...timeline.map(c => c.startTime + c.duration), 0);
                 if (next >= maxDuration && maxDuration > 0) {
                     setIsPlaying(false);
                     return 0;
                 }
                 return next;
             });
             requestRef.current = requestAnimationFrame(animate);
        }
    };

    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isPlaying, timeline]);

    useEffect(() => {
        drawCanvas();
        manageAudioPlayback();
    }, [currentTime, drawCanvas]);

    // --- Audio Logic ---
    const manageAudioPlayback = () => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;

        if (!isPlaying) {
            activeAudioSources.current.forEach(source => { try { source.stop(); } catch(e) {} });
            activeAudioSources.current.clear();
            return;
        }

        const clipsToPlay = timeline.filter(clip => 
            clip.type === 'audio' && 
            currentTime >= clip.startTime && 
            currentTime < clip.startTime + clip.duration
        ) as AudioClip[];

        clipsToPlay.forEach(clip => {
            if (!activeAudioSources.current.has(clip.id)) {
                const buffer = audioBuffers.current.get(clip.src);
                if (buffer) {
                    const source = ctx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(ctx.destination);
                    const offset = currentTime - clip.startTime;
                    source.start(0, offset);
                    activeAudioSources.current.set(clip.id, source);
                    source.onended = () => { activeAudioSources.current.delete(clip.id); };
                }
            }
        });

        activeAudioSources.current.forEach((source, id) => {
            const clip = clipsToPlay.find(c => c.id === id);
            if (!clip) {
                try { source.stop(); } catch(e) {}
                activeAudioSources.current.delete(id);
            }
        });
    };

    // --- Handlers ---
    const handleTimelineDrop = (e: React.DragEvent, trackType: 'video' | 'audio' | 'text') => {
        e.preventDefault();
        if (!draggedAsset || !timelineContentRef.current) return;

        const rect = timelineContentRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const dropTime = Math.max(0, offsetX / PIXELS_PER_SECOND);

        let newClip: TimelineClip | null = null;

        if (draggedAsset.type === 'image' && trackType === 'video') {
            const img = new Image();
            img.src = draggedAsset.data;
            newClip = {
                id: generateId(),
                type: 'video',
                assetId: draggedAsset.data,
                track: 'video',
                startTime: dropTime,
                duration: 5,
                layer: 1,
                src: draggedAsset.data,
                imageElement: img,
                animation: 'none'
            };
        } else if (draggedAsset.type === 'text' && trackType === 'text') {
             newClip = {
                id: generateId(),
                type: 'text',
                assetId: 'text-template',
                track: 'text',
                startTime: dropTime,
                duration: 5,
                layer: 2,
                text: draggedAsset.data.text,
                fontSize: 60,
                fontFamily: 'Arial',
                color: '#ffffff',
                textAlign: 'center',
                width: 0.8,
                x: 0.5,
                y: 0.5
            };
        } else if (draggedAsset.type === 'audio' && trackType === 'audio') {
            newClip = {
                id: generateId(),
                type: 'audio',
                assetId: draggedAsset.data.url,
                track: 'audio',
                startTime: dropTime,
                duration: 10,
                layer: 0,
                src: draggedAsset.data.url,
                name: draggedAsset.data.name
            };
            const buffer = audioBuffers.current.get(draggedAsset.data.url);
            if (buffer && newClip) {
                newClip.duration = buffer.duration;
            }
        }

        if (newClip) {
            setTimeline([...timeline, newClip]);
            setSelectedClipId(newClip.id);
            setDraggedAsset(null);
        }
    };

    const handleClipMouseDown = (e: React.MouseEvent, clip: TimelineClip) => {
        e.stopPropagation(); // Prevent ruler scrub
        setSelectedClipId(clip.id);
        setDraggingClipState({
            id: clip.id,
            startX: e.clientX,
            originalStartTime: clip.startTime
        });
    };

    const handleRulerMouseDown = (e: React.MouseEvent) => {
        setIsScrubbing(true);
        // Immediate update on click
        if (timelineContentRef.current) {
            const rect = timelineContentRef.current.getBoundingClientRect();
            const t = Math.max(0, (e.clientX - rect.left) / PIXELS_PER_SECOND);
            setCurrentTime(t);
        }
    };

    const handleDeleteClip = () => {
        if (selectedClipId) {
            setTimeline(timeline.filter(c => c.id !== selectedClipId));
            setSelectedClipId(null);
        }
    };

    const updateSelectedClip = (updates: Partial<TimelineClip>) => {
        if (!selectedClipId) return;
        setTimeline(timeline.map(clip => clip.id === selectedClipId ? { ...clip, ...updates } : clip));
    };

    const handleExport = async () => {
        setIsExporting(true); setIsPlaying(false); setCurrentTime(0);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
        const chunks: Blob[] = [];
        
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ad-campaign.webm`;
            a.click();
            URL.revokeObjectURL(url);
            setIsExporting(false); setCurrentTime(0);
        };

        recorder.start();
        const maxDuration = Math.max(...timeline.map(c => c.startTime + c.duration), 0);
        const startTime = performance.now();
        const recordLoop = () => {
            const now = performance.now();
            const time = (now - startTime) / 1000;
            if (time >= maxDuration) { recorder.stop(); } 
            else { setCurrentTime(time); requestAnimationFrame(recordLoop); }
        };
        requestAnimationFrame(recordLoop);
    };

    // --- Timeline Width Calculation ---
    const maxClipTime = Math.max(...timeline.map(c => c.startTime + c.duration), 0);
    const containerWidth = Math.max(windowWidth, (maxClipTime + 10) * PIXELS_PER_SECOND); // Dynamic width + buffer

    const selectedClip = timeline.find(c => c.id === selectedClipId);

    return (
        <div className="flex flex-col h-full bg-gray-200 overflow-hidden select-none">
            {/* --- Top Section --- */}
            <div className="flex-1 flex min-h-0">
                {/* Left: Assets */}
                <div className="w-64 flex-shrink-0 bg-gray-200 border-r border-gray-300 p-4 overflow-y-auto">
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Assets</h3>
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Images</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {images.map((src, i) => (
                                    <div key={i} draggable onDragStart={() => setDraggedAsset({ type: 'image', data: src })} className="aspect-square bg-gray-300 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all hover:scale-105">
                                        <img src={src} className="w-full h-full object-cover" alt="asset" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Text</h4>
                            <div className="space-y-2">
                                {texts.map((txt, i) => (
                                    <div key={i} draggable onDragStart={() => setDraggedAsset({ type: 'text', data: { text: txt.headline } })} className="p-2 bg-white rounded-md shadow-sm cursor-grab text-xs border border-gray-200 truncate hover:border-blue-300">Aa: {txt.headline}</div>
                                ))}
                                <div draggable onDragStart={() => setDraggedAsset({ type: 'text', data: { text: "Headline" } })} className="p-2 bg-white rounded-md shadow-sm cursor-grab text-xs border border-gray-200 hover:border-blue-300">Aa: Headline Text</div>
                            </div>
                        </div>
                         <div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Audio</h4>
                            <div className="space-y-2">
                                 {audios.map((audio, i) => (
                                    <div key={i} draggable onDragStart={() => setDraggedAsset({ type: 'audio', data: audio })} className="p-2 bg-blue-50 rounded-md shadow-sm cursor-grab text-xs border border-blue-100 flex items-center truncate hover:border-blue-300">
                                        <span className="mr-2">🎵</span> {audio.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center: Canvas (FIXED LAYOUT) */}
                <div className="flex-1 bg-gray-300 flex flex-col relative shadow-inner overflow-hidden">
                    
                    {/* 1. Canvas Area - Expands to fill available space, prevents overflow */}
                    <div className="flex-1 w-full min-h-0 flex items-center justify-center p-6 overflow-hidden">
                        <div className="relative w-full h-full flex items-center justify-center">
                            {/* Inner container scales the canvas while maintaining constraints */}
                            <div className="bg-gray-200 p-4 rounded-2xl shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff] inline-flex items-center justify-center max-w-full max-h-full">
                                <canvas 
                                    ref={canvasRef} 
                                    width={canvasDims.width} 
                                    height={canvasDims.height} 
                                    className="bg-black shadow-2xl object-contain max-w-full max-h-full"
                                    style={{ 
                                        width: 'auto', 
                                        height: 'auto',
                                        maxWidth: '100%', 
                                        maxHeight: '100%',
                                        aspectRatio: aspectRatio.replace(':', '/')
                                    }} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. Controls Area - Fixed height at bottom, doesn't get squashed */}
                    <div className="flex-shrink-0 h-20 flex items-center justify-center bg-gray-300/50 backdrop-blur-sm z-10">
                        <div className="flex items-center gap-6 bg-gray-200 px-8 py-3 rounded-2xl shadow-[5px_5px_10px_#bebebe,-5px_-5px_10px_#ffffff]">
                             <button onClick={() => { setIsPlaying(false); setCurrentTime(0); }} className="text-gray-600 hover:text-red-500 transition-colors"><StopIcon /></button>
                             <button onClick={() => setIsPlaying(!isPlaying)} className="text-blue-600 hover:text-blue-800 transition-colors transform hover:scale-110">{isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
                             <div className="text-lg font-mono text-gray-700 w-20 text-center font-bold">{currentTime.toFixed(1)}s</div>
                        </div>
                    </div>

                    {isExporting && <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm"><LoadingSpinner message="Rendering Video..." textColor="text-white" /></div>}
                </div>

                {/* Right: Properties */}
                <div className="w-72 bg-gray-200 border-l border-gray-300 p-4 overflow-y-auto">
                     <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Properties</h3>
                     <div className="mb-6 space-y-3 p-3 bg-gray-200 rounded-xl shadow-[inset_2px_2px_5px_#d1d5db,inset_-2px_-2px_5px_#ffffff]">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Resolution</label>
                        <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as CanvasAspectRatio)} className="w-full p-2 text-sm rounded-lg bg-gray-100 border-none focus:ring-2 focus:ring-blue-400">
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="9:16">9:16 (Portrait)</option>
                            <option value="1:1">1:1 (Square)</option>
                            <option value="4:5">4:5 (Social)</option>
                        </select>
                        <NeumorphicButton onClick={handleExport} disabled={timeline.length === 0 || isExporting} size="sm" className="w-full gap-2 mt-2">
                            <DownloadIcon /> Export Video
                        </NeumorphicButton>
                     </div>

                     <hr className="border-gray-300 my-4" />

                     {selectedClip ? (
                         <div className="space-y-4 animate-fade-in">
                             <div className="flex justify-between items-center">
                                 <span className="text-xs font-bold text-blue-600 uppercase bg-blue-100 px-2 py-1 rounded">{selectedClip.type} Clip</span>
                                 <button onClick={handleDeleteClip} className="text-red-500 hover:bg-red-100 p-1 rounded transition-colors"><TrashIcon /></button>
                             </div>
                             <div><label className="text-xs text-gray-500 block mb-1 font-semibold">Duration (s)</label><input type="number" value={selectedClip.duration} onChange={(e) => updateSelectedClip({ duration: parseFloat(e.target.value) })} className="w-full p-2 rounded-lg bg-white text-sm shadow-sm"/></div>
                             <div><label className="text-xs text-gray-500 block mb-1 font-semibold">Start Time (s)</label><input type="number" value={selectedClip.startTime} onChange={(e) => updateSelectedClip({ startTime: parseFloat(e.target.value) })} className="w-full p-2 rounded-lg bg-white text-sm shadow-sm"/></div>
                             {selectedClip.type === 'video' && (
                                 <div><label className="text-xs text-gray-500 block mb-1 font-semibold">Animation</label><select value={(selectedClip as VideoClip).animation} onChange={(e) => updateSelectedClip({ animation: e.target.value as any })} className="w-full p-2 rounded-lg bg-white text-sm shadow-sm"><option value="none">None</option><option value="zoom-in">Zoom In</option><option value="zoom-out">Zoom Out</option><option value="pan-left">Pan Left</option><option value="pan-right">Pan Right</option></select></div>
                             )}
                             {selectedClip.type === 'text' && (
                                 <>
                                     <div><label className="text-xs text-gray-500 block mb-1 font-semibold">Text</label><textarea value={(selectedClip as TextClip).text} onChange={(e) => updateSelectedClip({ text: e.target.value })} className="w-full p-2 rounded-lg bg-white text-sm shadow-sm" rows={3}/></div>
                                     <div className="grid grid-cols-2 gap-2">
                                         <div><label className="text-xs text-gray-500 block mb-1 font-semibold">Size</label><input type="number" value={(selectedClip as TextClip).fontSize} onChange={(e) => updateSelectedClip({ fontSize: parseInt(e.target.value) })} className="w-full p-2 rounded-lg bg-white text-sm shadow-sm"/></div>
                                         <div><label className="text-xs text-gray-500 block mb-1 font-semibold">Color</label><input type="color" value={(selectedClip as TextClip).color} onChange={(e) => updateSelectedClip({ color: e.target.value })} className="w-full h-9 p-1 rounded-lg bg-white shadow-sm cursor-pointer"/></div>
                                     </div>
                                     <div className="grid grid-cols-2 gap-2">
                                         <div><label className="text-xs text-gray-500 block mb-1 font-semibold">Pos X</label><input type="number" step="0.1" value={(selectedClip as TextClip).x} onChange={(e) => updateSelectedClip({ x: parseFloat(e.target.value) })} className="w-full p-2 rounded-lg bg-white text-sm shadow-sm"/></div>
                                         <div><label className="text-xs text-gray-500 block mb-1 font-semibold">Pos Y</label><input type="number" step="0.1" value={(selectedClip as TextClip).y} onChange={(e) => updateSelectedClip({ y: parseFloat(e.target.value) })} className="w-full p-2 rounded-lg bg-white text-sm shadow-sm"/></div>
                                     </div>
                                 </>
                             )}
                         </div>
                     ) : <p className="text-xs text-gray-400 text-center mt-10 italic">Select a clip to edit</p>}
                </div>
            </div>

            {/* --- Timeline Bottom Section (Reduced height) --- */}
            <div className="h-72 bg-gray-200 border-t border-gray-300 flex flex-col shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-10">
                {/* Scroll Container */}
                {/* FIX: Added padding-top (pt-10) to create a safe zone for the playhead handle and time bubble to render without clipping. */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar pt-12 pb-4" ref={timelineScrollContainerRef}>
                    <div 
                        ref={timelineContentRef}
                        className="h-full relative" 
                        style={{ width: `${containerWidth}px` }}
                    >
                         {/* 1. Ruler Layer - positioned relative to the content, but slightly down to clear the playhead handle area */}
                        <div 
                            className="absolute top-0 left-0 right-0 h-8 bg-gray-300 border-b border-gray-400 cursor-ew-resize hover:bg-gray-300/80 transition-colors"
                            onMouseDown={handleRulerMouseDown}
                        >
                            {Array.from({ length: Math.ceil(containerWidth / (PIXELS_PER_SECOND * 5)) }).map((_, i) => (
                                <div key={i} className="absolute bottom-0 border-l border-gray-500 h-3 text-[9px] pl-1 text-gray-600 select-none font-mono pointer-events-none" style={{ left: i * PIXELS_PER_SECOND * 5 }}>
                                    {i * 5}s
                                </div>
                            ))}
                            {Array.from({ length: Math.ceil(containerWidth / PIXELS_PER_SECOND) }).map((_, i) => (
                                <div key={`sub-${i}`} className="absolute bottom-0 border-l border-gray-400 h-1.5 pointer-events-none" style={{ left: i * PIXELS_PER_SECOND }}></div>
                            ))}
                        </div>

                        {/* 2. Playhead (Fixed to time, absolute in container) */}
                        {/* FIX: Playhead container spans full height. Negative top margin allows the handle to sit ABOVE the ruler in the safe zone. */}
                        <div 
                            className="absolute top-0 bottom-0 w-0 z-50 pointer-events-none transition-none"
                            style={{ left: currentTime * PIXELS_PER_SECOND }}
                        >
                             {/* Line */}
                             <div className="absolute top-0 bottom-0 border-l-2 border-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]"></div>
                             
                             {/* Handle & Time Indicator Bubble - Moved UP into the padding safe zone */}
                            <div className="absolute -top-10 -left-[40px] w-[80px] flex flex-col items-center group">
                                {/* Floating Time Bubble */}
                                <div className="bg-red-500 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full mb-1 shadow-md opacity-100 transition-opacity">
                                    {currentTime.toFixed(2)}s
                                </div>
                                {/* Handle Triangle */}
                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500 drop-shadow-sm"></div>
                            </div>
                        </div>

                        {/* 3. Tracks */}
                        <div className="pt-10 px-2 space-y-3">
                             {/* Video Track */}
                            <div 
                                className="h-24 bg-gray-300/30 rounded-lg relative border-2 border-dashed border-gray-400/20 hover:bg-gray-300/50 transition-colors"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleTimelineDrop(e, 'video')}
                            >
                                <span className="absolute left-2 top-1 text-[10px] font-bold text-gray-400 pointer-events-none select-none tracking-widest">VIDEO TRACK</span>
                                {timeline.filter(c => c.track === 'video').map(clip => (
                                    <ClipItem key={clip.id} clip={clip} isSelected={selectedClipId === clip.id} onMouseDown={(e) => handleClipMouseDown(e, clip)} height="h-16 top-6" color="bg-blue-200" borderColor="border-blue-400" />
                                ))}
                            </div>

                            {/* Text Track */}
                            <div 
                                className="h-16 bg-gray-300/30 rounded-lg relative border-2 border-dashed border-gray-400/20 hover:bg-gray-300/50 transition-colors"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleTimelineDrop(e, 'text')}
                            >
                                <span className="absolute left-2 top-1 text-[10px] font-bold text-gray-400 pointer-events-none select-none tracking-widest">TEXT TRACK</span>
                                {timeline.filter(c => c.track === 'text').map(clip => (
                                    <ClipItem key={clip.id} clip={clip} isSelected={selectedClipId === clip.id} onMouseDown={(e) => handleClipMouseDown(e, clip)} height="h-8 top-6" color="bg-purple-200" borderColor="border-purple-400" />
                                ))}
                            </div>

                            {/* Audio Track */}
                            <div 
                                className="h-16 bg-gray-300/30 rounded-lg relative border-2 border-dashed border-gray-400/20 hover:bg-gray-300/50 transition-colors"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleTimelineDrop(e, 'audio')}
                            >
                                <span className="absolute left-2 top-1 text-[10px] font-bold text-gray-400 pointer-events-none select-none tracking-widest">AUDIO TRACK</span>
                                {timeline.filter(c => c.track === 'audio').map(clip => (
                                    <ClipItem key={clip.id} clip={clip} isSelected={selectedClipId === clip.id} onMouseDown={(e) => handleClipMouseDown(e, clip)} height="h-8 top-6" color="bg-green-200" borderColor="border-green-400" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ClipItem: React.FC<{ clip: TimelineClip; isSelected: boolean; onMouseDown: (e: React.MouseEvent) => void; height?: string; color?: string; borderColor?: string; }> = ({ clip, isSelected, onMouseDown, height = "h-16", color = "bg-blue-200", borderColor = "border-blue-400" }) => {
    return (
        <div
            onMouseDown={onMouseDown}
            className={`absolute rounded-md border shadow-sm cursor-grab active:cursor-grabbing overflow-hidden whitespace-nowrap px-2 flex items-center text-xs font-semibold text-gray-700 select-none transition-shadow
                ${height} 
                ${isSelected ? `ring-2 ring-white ring-opacity-100 z-20 shadow-lg ${color}` : `${color} opacity-90 hover:opacity-100 hover:shadow-md`} 
                ${borderColor}`}
            style={{ left: clip.startTime * PIXELS_PER_SECOND, width: clip.duration * PIXELS_PER_SECOND }}
            title={clip.type}
        >
            {clip.type === 'video' && <img src={(clip as VideoClip).src} className="h-full w-auto object-cover mr-2 opacity-50 pointer-events-none rounded-sm" alt="thumb"/>}
            <span className="truncate pointer-events-none relative z-10 mix-blend-multiply">{clip.type === 'text' ? (clip as TextClip).text : (clip.type === 'audio' ? (clip as AudioClip).name : 'Image')}</span>
        </div>
    );
}

export default CompositionTab;
