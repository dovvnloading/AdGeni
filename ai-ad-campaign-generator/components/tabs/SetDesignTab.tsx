/**
 * © 2025 Matthew Robert Wesney. All Rights Reserved.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

import React, { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { generateAdImages } from '../../services/geminiService';
import NeumorphicButton from '../NeumorphicButton';
import LoadingSpinner from '../LoadingSpinner';
import { setDesignPresets, presets } from '../../data/presets';
import { BrandGuidelines } from '../../types';


// --- Reusable Helper Components ---

const ImagePreviewModal: React.FC<{ imageUrl: string; onClose: () => void; }> = ({ imageUrl, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="relative bg-white rounded-xl shadow-2xl p-2" onClick={e => e.stopPropagation()}>
                <img src={imageUrl} alt="Generated ad preview" className="object-contain rounded-lg max-h-[80vh] max-w-[80vw]"/>
                <button onClick={onClose} className="absolute -top-3 -right-3 w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800" aria-label="Close image preview">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        </div>
    );
};


const ImageCountSelector: React.FC<{ selected: number; onSelect: (count: number) => void; options: number[] }> = ({ selected, onSelect, options }) => (
    <div className="flex items-center space-x-2">
        <label className="text-xs font-semibold text-gray-600">Images:</label>
        <div className="flex items-center space-x-2">
            {options.map(count => (
                <button
                    key={count}
                    onClick={() => onSelect(count)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                        selected === count
                        ? 'text-blue-600 bg-gray-200 shadow-[inset_2px_2px_4px_#d1d5db,inset_-2px_-2px_4px_#ffffff]'
                        : 'text-gray-600 bg-gray-200 shadow-[3px_3px_6px_#d1d5db,-3px_-3px_6px_#ffffff] hover:shadow-[1px_1px_2px_#d1d5db,-1px_-1px_2px_#ffffff]'
                    }`}
                >
                    {count}
                </button>
            ))}
        </div>
    </div>
);


// --- Set Design Specific Data ---

const placeholderPrompts = [
    "A spacious, minimalist loft apartment with high ceilings, large windows letting in morning light, and a view of the city skyline. Polished concrete floors and simple, modern furniture.",
    "The interior of a cozy, dimly lit cafe on a rainy day. Warm lighting, comfortable armchairs, the smell of coffee, and rain visible on the window panes.",
    "A tranquil Japanese zen garden with carefully raked sand, moss-covered stones, bamboo elements, and a small koi pond. The atmosphere is serene and peaceful.",
    "The bridge of a sleek starship, with holographic displays, panoramic view of a colorful nebula outside the main viewport, and a captain's chair in the center.",
    "A gritty, industrial warehouse with exposed brick walls, concrete floors, large windows with metal frames, and shafts of light cutting through the dusty air.",
    "Deep within a lush tropical jungle, with dense foliage, vibrant exotic flowers, and shafts of sunlight breaking through the thick canopy above."
];

// --- Main Set Design Tab Component ---

interface SetDesignTabProps {
    onUseAsScene: (imageUrl: string) => void;
    brandGuidelines: BrandGuidelines;
}

const SetDesignTab: React.FC<SetDesignTabProps> = ({ onUseAsScene, brandGuidelines }) => {
    const [prompt, setPrompt] = useState('');
    const [placeholder, setPlaceholder] = useState(placeholderPrompts[0]);
    const [selectedPresets, setSelectedPresets] = useState({ sceneType: 'infinity_cyclorama', style: 'modern', lighting: 'bright', color: 'none', mood: 'none' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [images, setImages] = useState<string[]>([]);
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
    const [isDownloading, setIsDownloading] = useState(false);
    const [activeImage, setActiveImage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [numImages, setNumImages] = useState(4);

    useEffect(() => {
        let currentIndex = 0;
        const intervalId = setInterval(() => {
            currentIndex = (currentIndex + 1) % placeholderPrompts.length;
            setPlaceholder(placeholderPrompts[currentIndex]);
        }, 7000);
        return () => clearInterval(intervalId);
    }, []);

    // Helper to safely extract prompt string from presets
    // Fix: Changed key type to 'any' to avoid "unknown is not assignable to string" errors when called with dynamic/state values
    const getSafePrompt = (collection: any, key: any) => {
        const item = collection[key];
        return (item?.prompt as string) || '';
    };

    const buildFinalPrompt = useCallback(() => {
        const basePrompt = "Professional, high-quality photograph of a scene, empty of people, wide establishing shot, sharp focus, 8k.";
        
        const stylePrompt = selectedPresets.style === 'use_brand_guidelines' 
            ? (brandGuidelines.styles ? `, ${brandGuidelines.styles}` : '')
            : getSafePrompt(setDesignPresets.style, selectedPresets.style);

        const colorPrompt = selectedPresets.color === 'use_brand_guidelines'
            ? (brandGuidelines.color ? `, ${brandGuidelines.color}` : '')
            : getSafePrompt(presets.color, selectedPresets.color);

        const moodPrompt = selectedPresets.mood === 'use_brand_guidelines'
            ? (brandGuidelines.mood ? `, ${brandGuidelines.mood}` : '')
            : getSafePrompt(presets.mood, selectedPresets.mood);
        
        const sceneTypePrompt = getSafePrompt(setDesignPresets.sceneType, selectedPresets.sceneType);
        const lightingPrompt = getSafePrompt(setDesignPresets.lighting, selectedPresets.lighting);
        
        return `${prompt}${sceneTypePrompt}${stylePrompt}${lightingPrompt}${colorPrompt}${moodPrompt}, ${basePrompt}`;
    }, [prompt, selectedPresets, brandGuidelines]);

    const handleGenerate = async () => {
        if (!prompt) { setError('Please enter a description for your set.'); return; }
        setError(null); setIsLoading(true); setImages([]); setSelectedImages(new Set());
        
        try {
            const finalPrompt = buildFinalPrompt();
            const result = await generateAdImages(finalPrompt, [], numImages);
            setImages(result);
        } catch (e) {
            let errorMessage = 'An unknown error occurred during image generation.';
            if (e instanceof Error) {
                errorMessage = e.message;
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleImageSelection = (imageSrc: string) => {
        setSelectedImages(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(imageSrc)) newSelected.delete(imageSrc); else newSelected.add(imageSrc);
            return newSelected;
        });
    };

    const handleDownload = async () => {
        if (selectedImages.size === 0 || isDownloading) return;
        setIsDownloading(true); setError(null);
        const dataURLtoBlob = (dataurl: string) => {
            const arr = dataurl.split(','), mimeMatch = arr[0].match(/:(.*?);/);
            if (!mimeMatch) return null;
            const bstr = atob(arr[1]); let n = bstr.length; const u8arr = new Uint8Array(n);
            while (n--) u8arr[n] = bstr.charCodeAt(n);
            return new Blob([u8arr], { type: mimeMatch[1] });
        };
        try {
            const zip = new JSZip();
            Array.from(selectedImages).forEach((imageUrl, i) => {
                const blob = dataURLtoBlob(imageUrl);
                if (blob) zip.file(`set-design-image-${i + 1}.${blob.type.split('/')[1] || 'png'}`, blob);
            });
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, 'set-design-images.zip');
        } catch (e: any) {
            const errorMessage = e.message || "Could not create the zip file.";
            setError(errorMessage);
        } finally {
            setIsDownloading(false);
        }
    };

    const getButtonText = () => {
        if (isDownloading) return 'Zipping...';
        if (selectedImages.size === 0) return 'Download Selected';
        return `Download ${selectedImages.size} Image${selectedImages.size > 1 ? 's' : ''}`;
    };

    const handlePresetChange = (category: keyof typeof selectedPresets, value: string) => {
        setSelectedPresets(p => ({ ...p, [category]: value }));
    };
    
    return (
       <>
        <div className="flex flex-col h-full bg-gray-200">
            {/* --- Main Content (Gallery) --- */}
            <main className="flex-1 flex flex-col p-6 overflow-hidden">
                <header className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Generated Set Designs</h3>
                        <p className="text-sm text-gray-500">{images.length > 0 ? `${images.length} design${images.length === 1 ? '' : 's'} generated. Select designs to download.` : 'Your generated set designs will appear here.'}</p>
                    </div>
                     <NeumorphicButton onClick={handleDownload} disabled={selectedImages.size === 0 || isDownloading} size="sm">{getButtonText()}</NeumorphicButton>
                </header>
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? <div className="h-full flex items-center justify-center"><LoadingSpinner message="Our AI is building your set..." /></div>
                    : (
                        images.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {images.map((src, i) => (
                                    <div key={i} className="relative group aspect-square bg-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-[5px_5px_10px_#d1d5db,-5px_-5px_10px_#ffffff] hover:shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff]">
                                        <img src={src} className="w-full h-full object-cover cursor-pointer" alt={`Generated set design ${i+1}`} onClick={() => { setActiveImage(src); setIsModalOpen(true); }}/>
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                        <div onClick={(e) => { e.stopPropagation(); toggleImageSelection(src); }} title="Select image" className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 border-2 z-10 cursor-pointer ${selectedImages.has(src) ? 'bg-blue-500 border-blue-600 scale-110' : 'bg-white/70 border-gray-300 group-hover:bg-white group-hover:scale-110'}`}>
                                             {selectedImages.has(src) && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                        </div>
                                         <button onClick={() => { setActiveImage(src); setIsModalOpen(true); }} className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm text-gray-800 px-3 py-1 text-xs font-bold rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">View</button>
                                         <button onClick={() => onUseAsScene(src)} className="absolute bottom-3 right-3 bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 text-xs font-bold rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-600">
                                            Use as Scene
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="h-full flex items-center justify-center">
                                <div className="text-center text-gray-400 p-12 rounded-2xl shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]">
                                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                                    <h3 className="text-lg font-semibold mb-2 text-gray-500">Set Design Studio</h3>
                                    <p>Describe your scene and click Generate.</p>
                                </div>
                             </div>
                        )
                    )}
                </div>
            </main>
            
            {/* --- Controls Footer --- */}
            <footer className="bg-gray-200 p-4 flex-shrink-0 z-10">
                <div className="p-3 bg-gray-200 rounded-lg shadow-[inset_3px_3px_6px_#d1d5db,inset_-3px_-3px_6px_#ffffff] mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <ControlSection title="Scene Type">
                            <SelectMenu label="Type" value={selectedPresets.sceneType} onChange={(e) => handlePresetChange('sceneType', e.target.value)} options={setDesignPresets.sceneType} />
                        </ControlSection>
                        <ControlSection title="Overall Style">
                            <SelectMenu showBrandOption label="Style" value={selectedPresets.style} onChange={(e) => handlePresetChange('style', e.target.value)} options={setDesignPresets.style} />
                        </ControlSection>
                        <ControlSection title="Lighting">
                            <SelectMenu label="Lighting" value={selectedPresets.lighting} onChange={(e) => handlePresetChange('lighting', e.target.value)} options={setDesignPresets.lighting} />
                        </ControlSection>
                        <ControlSection title="Color Palette">
                             <SelectMenu showBrandOption label="Color" value={selectedPresets.color} onChange={(e) => handlePresetChange('color', e.target.value)} options={presets.color} />
                        </ControlSection>
                        <ControlSection title="Mood">
                             <SelectMenu showBrandOption label="Mood" value={selectedPresets.mood} onChange={(e) => handlePresetChange('mood', e.target.value)} options={presets.mood} />
                        </ControlSection>
                    </div>
                </div>
                
                <div className="flex items-start space-x-4">
                    <div className="relative w-full">
                         <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
                            placeholder={placeholder}
                            className="w-full h-20 p-3 pr-10 rounded-lg bg-gray-200 text-gray-700 placeholder-gray-500 focus:outline-none transition resize-none shadow-[inset_3px_3px_6px_#d1d5db,inset_-3px_-3px_6px_#ffffff] focus:shadow-[inset_1px_1px_2px_#d1d5db,inset_-1px_-1px_2px_#ffffff]"
                        />
                         <button
                            onClick={() => setPrompt(placeholder)}
                            title="Use this prompt idea"
                            className="absolute top-2.5 right-2.5 p-1 text-gray-400 hover:text-blue-500 transition-colors rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            aria-label="Use placeholder prompt"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h.5a1.5 1.5 0 010 3h-.5a1 1 0 00-1 1v.5a1.5 1.5 0 01-3 0V8a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3h.5a1 1 0 001-1v-.5zM6.5 6.5a1.5 1.5 0 013 0V7a1 1 0 001 1h.5a1.5 1.5 0 010 3h-.5a1 1 0 00-1 1v.5a1.5 1.5 0 01-3 0V11a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3h.5a1 1 0 001-1v-.5zM10 12.5a1.5 1.5 0 013 0V13a1 1 0 001 1h.5a1.5 1.5 0 010 3h-.5a1 1 0 00-1 1v.5a1.5 1.5 0 01-3 0V16a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3h.5a1 1 0 001-1v-.5z"></path></svg>
                        </button>
                    </div>

                    <NeumorphicButton onClick={handleGenerate} disabled={isLoading || !prompt} className="h-20 w-32 text-base">
                         {isLoading ? <><LoadingSpinner size="sm" /><span className="ml-2">Generating</span></> : 'Generate'}
                    </NeumorphicButton>

                     <div className="flex flex-col justify-around h-20">
                        <ImageCountSelector 
                            selected={numImages} 
                            onSelect={setNumImages} 
                            options={[1, 4, 8]}
                        />
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm mt-3 p-3 bg-red-100/50 rounded-lg">{error}</p>}
            </footer>
        </div>
        {isModalOpen && activeImage && <ImagePreviewModal imageUrl={activeImage} onClose={() => setIsModalOpen(false)} />}
       </>
    );
};

// --- Inlined Helper Components ---
const ControlSection: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => <div className="space-y-2"><h3 className="text-sm font-bold text-gray-700 mb-2">{title}</h3>{children}</div>;
const SelectMenu: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: Record<string, {name: string}>, showBrandOption?: boolean}> = ({label, value, onChange, options, showBrandOption = false}) => (<div className="relative"><label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label><select value={value} onChange={onChange} className="w-full pl-3 pr-8 py-1.5 text-sm rounded-lg bg-gray-200 text-gray-700 shadow-[inset_2px_2px_4px_#d1d5db,inset_-2px_-2px_4px_#ffffff] focus:outline-none transition appearance-none"><>
{showBrandOption && <option value="use_brand_guidelines" className="font-bold text-blue-600 bg-blue-50">★ Use Brand Guidelines</option>}
{Object.keys(options).map((key) => <option key={key} value={key} className="bg-white">{options[key].name}</option>)}</></select><div className="pointer-events-none absolute inset-y-0 right-0 top-6 flex items-center px-2 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div></div>);

export default SetDesignTab;