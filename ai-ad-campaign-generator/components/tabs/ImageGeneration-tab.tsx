import React, { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { generateAdImages, upscaleImage } from '../../services/geminiService';
import NeumorphicButton from '../NeumorphicButton';
import LoadingSpinner from '../LoadingSpinner';
import { ShotEyeLevelIcon, ShotHighAngleIcon, ShotLowAngleIcon, ShotCloseupIcon, ShotWideIcon, ShotDutchAngleIcon, FocusShallowIcon, FocusDeepIcon } from '../IconComponents';
import { UploadedFile, ImageInput, BrandGuidelines } from '../../types';
import { presets } from '../../data/presets';

const placeholderPrompts = [
    // --- Luxury & High Fashion ---
    "Macro product shot of the 'Aethelred Chrono' watch, its skeleton face revealing intricate golden gears. The watch rests on a dark, wet slate rock, with misty Scottish highlands in the background. The brand name is in sharp focus.",
    "Editorial shot for 'Vero Cuoio' handbags. A deep burgundy leather tote bag sits on a polished wooden bench in an empty art gallery. Soft, directional light from a skylight highlights the bag's texture and gold hardware.",
    "A bottle of 'Nuit Étoilée' perfume on a vintage silver vanity tray, next to a string of pearls. The background is a dark, out-of-focus boudoir with dim lighting, suggesting evening elegance. The label is clearly legible.",
    "Lifestyle ad for 'Stridetech' luxury sneakers. The sneakers are worn by a person sitting on the steps of a modern architectural building. The shot is low-angle, emphasizing the shoe's clean lines and the brand's logo against the concrete texture.",
    "A pair of 'Spectre' designer sunglasses resting on the edge of an infinity pool, overlooking a sunset sea. The reflection of the sunset is perfectly captured in the lenses. The brand name is subtly etched into one corner of a lens.",

    // --- Technology & Gadgets ---
    "Ad for the 'Neuron 7' noise-cancelling headphones. They are placed on a marble kitchen island next to a steaming espresso cup. Morning light streams in, highlighting the headphones' matte black finish and brushed metal accents. The 'Neuron 7' logo is subtly debossed on the earcup.",
    "Launch ad for the 'Prism X1' smartphone. The phone is shown from a 3/4 angle, floating over a pristine water surface that reflects a starry night sky. The phone's screen displays a vibrant, glowing abstract UI. Emphasizes the 'edge-to-edge' display.",
    "Action shot of the 'Apex' drone, hovering mid-air, capturing a breathtaking shot of a surfer riding a massive wave. The drone is crisp and in focus, while the wave has a slight motion blur. The 'Apex' branding is clearly visible on its body.",
    "Product shot for a 'Symbio' smart speaker. It's placed on a bookshelf between a stack of design books and a small succulent plant. Soft, warm light illuminates the speaker's fabric texture. A subtle glowing light ring at its base indicates it's active.",

    // --- Food & Beverage ---
    "Ad for 'Artisan Roast' coffee. A bag of whole bean coffee, with the label 'Ethiopian Yirgacheffe' clearly visible, sits next to a glass pour-over coffee maker. Steam rises from the freshly brewed coffee. Set in a rustic kitchen with warm, morning light.",
    "A 'Juice Burst' pomegranate and acai smoothie in a clear glass, with condensation dripping down the side. Fresh pomegranate seeds and blueberries are scattered on the wooden table around the glass. The vibrant purple color of the smoothie is the focus.",
    "Packaging shot for 'Melt' artisanal dark chocolate. The bar, with its elegant wrapper, is placed on a dark slate surface. One square is broken off, revealing a rich texture and whole almonds inside. Cocoa powder is lightly dusted around it.",
    "Ad for 'The Good Fork' plant-based sausages. The sausages are shown sizzling in a pan with olive oil, garlic, and cherry tomatoes. The focus is on the delicious browning and texture. The packaging is visible but slightly out-of-focus in the background.",
    "A bottle of 'Summit' craft gin with a minimalist label, next to a crystal glass with a large, clear ice cube and a twist of grapefruit peel. The background is a dark, moody bar with glowing bottles on the shelves.",

    // --- Beauty & Wellness ---
    "Product shot for 'Terra' Vitamin C serum. The amber glass bottle with its white dropper is placed on a mossy stone, surrounded by slices of fresh orange. The lighting is bright and clean, emphasizing natural ingredients. 'Terra' logo is crisp on the label.",
    "Lifestyle shot for a 'Zenith' yoga mat. The mat is rolled out on the wooden floor of a sun-drenched studio with large windows overlooking a green forest. A person is in a relaxed pose, not the main focus. Emphasizes tranquility and space.",
    "Macro shot of a swirl of 'Petal' moisturizing cream. The texture of the cream is the hero, showing its rich, whipped consistency. A single, delicate pink rose petal rests on the edge of the swirl. The background is a clean, soft white.",
    "A collection of 'Chroma' matte lipsticks arranged in a neat row on a white marble surface. One lipstick is uncapped, its tip pristine and untouched, showing the vibrant red color. The 'Chroma' logo is elegantly printed in gold on the black tubes.",

    // --- Automotive & Adventure ---
    "A 'Nomad' 4x4 off-road vehicle is parked on a rocky outcrop at dawn, covered in a light layer of dust from its journey. The dramatic landscape of a desert canyon unfolds below. The car's powerful LED headlights are on, cutting through the morning mist.",
    "Shot of the 'Volt' electric city car, charging at a sleek, futuristic charging station at night. The city's neon lights reflect on its polished, dark blue paint. The car's glowing charge port is the focal point.",
    "A 'Trailblazer' waterproof backpack, leaning against a large boulder next to a cascading waterfall in a lush forest. The shot emphasizes the backpack's rugged material and sealed zippers. The 'Trailblazer' logo is stitched clearly on the front.",

    // --- Home & Lifestyle ---
    "An ad for 'Everflame' smart candles. A set of three realistic LED candles are placed on a fireplace mantelpiece in a cozy, dimly lit living room. Their \"flames\" are flickering warmly, casting a soft glow on the surrounding decor. The remote control is subtly placed nearby.",
    "Lifestyle shot of the 'Slumber' weighted blanket. The dark grey blanket is draped over a neatly made bed in a minimalist bedroom. The texture of the blanket's quilting is clearly visible in the soft morning light. A book lies open on the pillow.",
    "An action shot for the 'Blade' chef's knife. The knife is captured in motion, perfectly slicing a ripe tomato. The focus is on the sharpness of the blade and the spray of juice. The brand name 'Blade' is elegantly etched on the steel.",
    "Ad for 'Sprout' indoor smart garden. The device is on a kitchen counter, with vibrant green basil and parsley growing under its integrated LED light. The scene is clean, modern, and suggests freshness and technology working together."
];


// --- Inlined Helper Components ---

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

const UploadIcon = () => (
    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
    </svg>
);

const CompactFileUpload: React.FC<{ onFileSelect: (file: UploadedFile | null) => void; uploadedFile: UploadedFile | null; placeholderText: string; inputId: string; }> = ({ onFileSelect, uploadedFile, placeholderText, inputId }) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) processFile(file);
        event.target.value = ''; // Allow re-uploading the same file
    };

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            const previewUrl = URL.createObjectURL(file);
            const base64 = (reader.result as string).split(',')[1];
            onFileSelect({ file, previewUrl, base64 });
        };
        reader.readAsDataURL(file);
    };

    const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault(); event.stopPropagation();
        if (event.dataTransfer.files?.[0]) {
            processFile(event.dataTransfer.files[0]);
            event.dataTransfer.clearData();
        }
    }, []);

    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); };
    const handleClear = (e: React.MouseEvent) => { e.stopPropagation(); onFileSelect(null); }

    return (
        <div className="relative flex-shrink-0 w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer transition-shadow group shadow-[inset_3px_3px_6px_#d1d5db,inset_-3px_-3px_6px_#ffffff] hover:shadow-[inset_1px_1px_2px_#d1d5db,inset_-1px_-1px_2px_#ffffff]"
            onClick={() => document.getElementById(inputId)?.click()} onDrop={onDrop} onDragOver={onDragOver}>
            <input id={inputId} type="file" className="hidden" accept="image/*" onChange={handleFileChange}/>
            {uploadedFile ? (
                <>
                    <img src={uploadedFile.previewUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs text-center p-1">Change Image</span>
                    </div>
                    <button onClick={handleClear} className="absolute -top-2 -right-2 w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors shadow-lg" aria-label="Remove image">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-500 text-center p-2"><UploadIcon/><p className="text-xs mt-1">{placeholderText}</p></div>
            )}
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

const NeumorphicSwitch: React.FC<{ checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; id: string; children: React.ReactNode; title?: string }> = ({ checked, onChange, id, children, title }) => (
    <div className="flex items-center space-x-3" title={title}>
        <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
            <input type="checkbox" id={id} checked={checked} onChange={onChange} className="sr-only peer" />
            <label htmlFor={id} className="block overflow-hidden h-6 rounded-full bg-gray-200 cursor-pointer shadow-[inset_2px_2px_4px_#d1d5db,inset_-2px_-2px_4px_#ffffff] peer-checked:bg-blue-500 peer-checked:shadow-none"></label>
            <label htmlFor={id} className="absolute left-0 top-0.5 ml-1 w-5 h-5 bg-white rounded-full shadow-[2px_2px_4px_#d1d5db,-2px_-2px_4px_#ffffff] transition-transform duration-300 transform peer-checked:translate-x-full cursor-pointer"></label>
        </div>
        <label htmlFor={id} className="text-xs font-semibold text-gray-600 cursor-pointer flex items-center">
            {children}
        </label>
    </div>
);

// --- Presets and Data ---
const cameraShots = { eye_level: { name: 'Eye-Level', prompt: ', eye-level shot, medium shot', icon: <ShotEyeLevelIcon /> }, high_angle: { name: 'High-Angle', prompt: ', high-angle shot, from above', icon: <ShotHighAngleIcon /> }, low_angle: { name: 'Low-Angle', prompt: ', low-angle shot, from below', icon: <ShotLowAngleIcon /> }, closeup: { name: 'Close-Up', prompt: ', detailed close-up shot, macro', icon: <ShotCloseupIcon /> }, wide: { name: 'Wide Shot', prompt: ', full wide shot, establishing shot', icon: <ShotWideIcon /> }, dutch: { name: 'Dutch Angle', prompt: ', dutch angle shot, tilted frame', icon: <ShotDutchAngleIcon /> }, };
const lenses = { '35mm': { name: '35mm Wide', prompt: ', shot on a 35mm lens', description: 'Context & scene' }, '50mm': { name: '50mm Standard', prompt: ', shot on a 50mm standard lens', description: 'Natural view' }, '85mm': { name: '85mm Portrait', prompt: ', shot on an 85mm portrait lens, beautiful bokeh', description: 'Blurs background' }, '100mm': { name: '100mm Macro', prompt: ', shot on a 100mm macro lens, extreme close-up detail', description: 'Detailed shots' }, 'telephoto': { name: '200mm Telephoto', prompt: ', shot on a 200mm telephoto lens, compressed background', description: 'Distant subjects' }, };
const focusOptions = { shallow: { name: 'Shallow Focus', prompt: ', shallow depth of field, sharp subject, blurry background, bokeh', icon: <FocusShallowIcon /> }, deep: { name: 'Deep Focus', prompt: ', deep depth of field, everything in sharp focus, f/16', icon: <FocusDeepIcon /> }, };
const sceneModifiers = {
    none: { name: 'Default', prompt: '' },
    day: { name: 'Daytime', prompt: ', daytime, bright natural light' },
    night: { name: 'Nighttime', prompt: ', nighttime, dark, artificial or moonlight' },
    indoors: { name: 'Indoors', prompt: ', interior shot, indoors' },
    outdoors: { name: 'Outdoors', prompt: ', exterior shot, outdoors' },
};
type PresetCategory = keyof typeof presets;

// --- Main Image Generation Tab Component ---
interface ImageGenerationTabProps {
    importedProductImage: UploadedFile | null;
    onProductImportConsumed: () => void;
    importedSceneImage: UploadedFile | null;
    onSceneImportConsumed: () => void;
    brandGuidelines: BrandGuidelines;
    onEditImage: (imageUrl: string) => void;
    images: string[];
    setImages: React.Dispatch<React.SetStateAction<string[]>>;
}


const ImageGenerationTab: React.FC<ImageGenerationTabProps> = ({ importedProductImage, onProductImportConsumed, importedSceneImage, onSceneImportConsumed, brandGuidelines, onEditImage, images, setImages }) => {
    const [prompt, setPrompt] = useState('');
    const [placeholder, setPlaceholder] = useState(placeholderPrompts[0]);
    const [productImage, setProductImage] = useState<UploadedFile | null>(null);
    const [sceneImage, setSceneImage] = useState<UploadedFile | null>(null);
    const [selectedPresets, setSelectedPresets] = useState({ styles: 'photography', scenes: 'infinity_studio', objects: 'none', lighting: 'studio', lightQuality: 'none', lightDirection: 'none', color: 'vibrant', composition: 'rule_of_thirds', mood: 'none', texture: 'none', detail: 'none', medium: 'none' });
    const [cameraShot, setCameraShot] = useState('eye_level');
    const [lens, setLens] = useState('85mm');
    const [focus, setFocus] = useState('shallow');
    const [sceneModifier, setSceneModifier] = useState<string>('none');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
    const [isDownloading, setIsDownloading] = useState(false);
    const [activeImage, setActiveImage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [numImages, setNumImages] = useState(4);
    const [activeControlTab, setActiveControlTab] = useState('style');
    const [isSmartMode, setIsSmartMode] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [sceneDriverImage, setSceneDriverImage] = useState<string | null>(null);
    const [productDriverImage, setProductDriverImage] = useState<string | null>(null);
    const [upscalingImage, setUpscalingImage] = useState<string | null>(null);


    useEffect(() => {
        let currentIndex = 0;
        const intervalId = setInterval(() => {
            currentIndex = (currentIndex + 1) % placeholderPrompts.length;
            setPlaceholder(placeholderPrompts[currentIndex]);
        }, 7000); // Change placeholder every 7 seconds

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, []);

    useEffect(() => {
        if (importedProductImage) {
            setProductImage(importedProductImage);
            onProductImportConsumed(); // Notify parent that the image has been consumed
        }
    }, [importedProductImage, onProductImportConsumed]);
    
    useEffect(() => {
        if (importedSceneImage) {
            setSceneImage(importedSceneImage);
            onSceneImportConsumed(); // Notify parent that the image has been consumed
        }
    }, [importedSceneImage, onSceneImportConsumed]);
    
    const buildFinalPrompt = useCallback(() => {
        // Fix: Use type assertion to avoid "unknown" type error when accessing dynamic keys on presets union type.
        const getPresetPrompt = (category: PresetCategory, key: string) => {
            const item = (presets[category] as any)[key];
            return (item?.prompt as string) || '';
        };
        
        const getPromptFor = (category: keyof BrandGuidelines, selectedValue: string) => {
            if (selectedValue === 'use_brand_guidelines') {
                return brandGuidelines[category] ? `, ${brandGuidelines[category]}` : '';
            }
            return getPresetPrompt(category, selectedValue);
        };

        const otherPrompts = [
            getPresetPrompt('scenes', selectedPresets.scenes),
            getPresetPrompt('objects', selectedPresets.objects),
            getPresetPrompt('lighting', selectedPresets.lighting),
            getPresetPrompt('lightQuality', selectedPresets.lightQuality),
            getPresetPrompt('lightDirection', selectedPresets.lightDirection),
            getPresetPrompt('composition', selectedPresets.composition),
            getPresetPrompt('texture', selectedPresets.texture),
            getPresetPrompt('detail', selectedPresets.detail),
            getPresetPrompt('medium', selectedPresets.medium),
            cameraShots[cameraShot as keyof typeof cameraShots]?.prompt || '',
            lenses[lens as keyof typeof lenses]?.prompt || '',
            focusOptions[focus as keyof typeof focusOptions]?.prompt || '',
            sceneModifiers[sceneModifier as keyof typeof sceneModifiers]?.prompt || ''
        ].join('');

        return `${prompt}${getPromptFor('styles', selectedPresets.styles)}${getPromptFor('color', selectedPresets.color)}${getPromptFor('mood', selectedPresets.mood)}${otherPrompts}`;
    }, [prompt, selectedPresets, cameraShot, lens, focus, sceneModifier, brandGuidelines]);


    const dataUrlToImageInput = (dataUrl: string): ImageInput | null => {
        const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
        if (!match) return null;
        return { mimeType: match[1], base64: match[2] };
    };

    // Helper to safely extract prompt string from presets when using dynamic keys
    // Fix: Changed key type to 'any' to avoid "unknown is not assignable to string" errors when called with dynamic/state values
    const getSafePrompt = (collection: any, key: any) => {
        const item = collection[key];
        return (item?.prompt as string) || '';
    };

    const handleGenerate = async () => {
        if (!prompt) { setError('Please enter a prompt to generate images.'); return; }
        setError(null); setIsLoading(true); setImages([]); setSelectedImages(new Set());
        setSceneDriverImage(null); setProductDriverImage(null);

        try {
            if (isSmartMode) {
                // --- SMART MODE ---
                let sceneImg: string;
                if (sceneImage) {
                    setLoadingMessage('Using uploaded scene...');
                    sceneImg = `data:${sceneImage.file.type};base64,${sceneImage.base64}`;
                } else {
                    setLoadingMessage('Generating background scene...');
                    // Use getSafePrompt helper to avoid type errors
                    const scenePrompt = `A background scene for a product advertisement. ${getSafePrompt(presets.scenes, selectedPresets.scenes)}${getSafePrompt(presets.objects, selectedPresets.objects)}${getSafePrompt(presets.lighting, selectedPresets.lighting)}${getSafePrompt(presets.color, selectedPresets.color)}${getSafePrompt(presets.composition, selectedPresets.composition)}${cameraShots[cameraShot as keyof typeof cameraShots]?.prompt || ''}${lenses[lens as keyof typeof lenses]?.prompt || ''}${focusOptions[focus as keyof typeof focusOptions]?.prompt || ''}`;
                    const sceneResult = await generateAdImages(scenePrompt, [], 1);
                    sceneImg = sceneResult[0];
                }
                setSceneDriverImage(sceneImg);

                setLoadingMessage('Generating product asset...');
                const productPrompt = `${prompt}${(presets.styles as any)[selectedPresets.styles]?.prompt || ''}, product shot on a plain white studio background, isolated subject`;
                const productAssets = productImage ? [productImage.file] : [];
                const productResult = await generateAdImages(productPrompt, productAssets, 1);
                const productImg = productResult[0];
                setProductDriverImage(productImg);

                setLoadingMessage('Compositing final images...');
                const finalPrompt = buildFinalPrompt();
                const sceneInput = dataUrlToImageInput(sceneImg);
                const productInput = dataUrlToImageInput(productImg);
                const driverInputs = [sceneInput, productInput].filter((i): i is ImageInput => i !== null);
                
                const result = await generateAdImages(finalPrompt, driverInputs, numImages);
                setImages(result);

            } else {
                 // --- NORMAL MODE ---
                setLoadingMessage('Our AI is crafting your visuals...');
                const finalPrompt = buildFinalPrompt();
                const assets: File[] = [];
                if (productImage) assets.push(productImage.file);
                if (sceneImage) assets.push(sceneImage.file);
                const result = await generateAdImages(finalPrompt, assets, numImages);
                setImages(result);
            }
           
        } catch (e) {
            let errorMessage = 'An unknown error occurred during image generation.';
            if (e instanceof Error) {
                errorMessage = e.message;
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleUpscaleImage = async (imageSrc: string) => {
        if (upscalingImage) return; // Already upscaling something
        setUpscalingImage(imageSrc);
        setError(null);
        try {
            const imageInput = dataUrlToImageInput(imageSrc);
            if (!imageInput) {
                throw new Error("Could not process the image for upscaling.");
            }
            const upscaledUrl = await upscaleImage(imageInput);
            setImages(prevImages => prevImages.map(img => img === imageSrc ? upscaledUrl : img));
        } catch (e) {
            let errorMessage = "An unknown error occurred during upscaling.";
            if (e instanceof Error) {
                errorMessage = e.message;
            }
            setError(`Upscale failed: ${errorMessage}`);
        } finally {
            setUpscalingImage(null);
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
                if (blob) zip.file(`ad-image-${i + 1}.${blob.type.split('/')[1] || 'png'}`, blob);
            });
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, 'ad-campaign-images.zip');
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
        setSelectedPresets(p => ({...p, [category]: value}));
    };

    return (
       <>
        <div className="flex flex-col h-full bg-gray-200">
            {/* --- Main Content (Gallery) --- */}
            <main className="flex-1 flex flex-col p-6 overflow-hidden">
                <header className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Generated Assets</h3>
                        <p className="text-sm text-gray-500">{images.length > 0 ? `${images.length} image${images.length === 1 ? '' : 's'} generated. Select images to download.` : 'Your generated images will appear here.'}</p>
                    </div>
                     <NeumorphicButton onClick={handleDownload} disabled={selectedImages.size === 0 || isDownloading} size="sm">{getButtonText()}</NeumorphicButton>
                </header>
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? <div className="h-full flex items-center justify-center"><LoadingSpinner message={loadingMessage || "Our AI is crafting your visuals..."} /></div>
                    : (
                        <>
                            { (sceneDriverImage || productDriverImage) && (
                                <div className="mb-4 p-3 bg-gray-200/50 rounded-lg">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Smart Mode Drivers</h4>
                                    <div className="flex items-center gap-4">
                                        {sceneDriverImage && (
                                            <div className="text-center">
                                                <img src={sceneDriverImage} className="w-24 h-24 object-cover rounded-md border-2 border-white/50 shadow-md" alt="Scene driver"/>
                                                <p className="text-xs text-gray-600 mt-1 font-semibold">Scene</p>
                                            </div>
                                        )}
                                        {productDriverImage && (
                                            <div className="text-center">
                                                <img src={productDriverImage} className="w-24 h-24 object-cover rounded-md border-2 border-white/50 shadow-md" alt="Product driver"/>
                                                <p className="text-xs text-gray-600 mt-1 font-semibold">Product</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                             )}

                            {images.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {images.map((src, i) => (
                                        <div key={i} className="relative group aspect-square bg-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-[5px_5px_10px_#d1d5db,-5px_-5px_10px_#ffffff] hover:shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff]">
                                            <img src={src} className="w-full h-full object-cover cursor-pointer" alt={`Generated ad image ${i+1}`} onClick={() => { setActiveImage(src); setIsModalOpen(true); }}/>
                                            
                                            {upscalingImage === src && (
                                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                                                    <div className="text-white">
                                                        <LoadingSpinner message="Upscaling..." textColor="text-white" />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                            <div onClick={(e) => { e.stopPropagation(); toggleImageSelection(src); }} title="Select image" className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 border-2 z-10 cursor-pointer ${selectedImages.has(src) ? 'bg-blue-500 border-blue-600 scale-110' : 'bg-white/70 border-gray-300 group-hover:bg-white group-hover:scale-110'}`}>
                                                 {selectedImages.has(src) && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                            </div>
                                             <button onClick={() => { setActiveImage(src); setIsModalOpen(true); }} className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm text-gray-800 px-3 py-1 text-xs font-bold rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">View</button>
                                             
                                             <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <button onClick={() => handleUpscaleImage(src)} disabled={!!upscalingImage} title="Upscale Image" className="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 text-xs font-bold rounded-full transition-all duration-300 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed">
                                                    Upscale
                                                </button>
                                                <button onClick={() => onEditImage(src)} title="Edit in Ad Editor" className="bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 text-xs font-bold rounded-full transition-all duration-300 hover:bg-green-600">
                                                    Edit
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                 <div className="h-full flex items-center justify-center">
                                    <div className="text-center text-gray-400 p-12 rounded-2xl shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]">
                                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                        <h3 className="text-lg font-semibold mb-2 text-gray-500">Workspace Canvas</h3>
                                        <p>Configure your prompt and click Generate.</p>
                                    </div>
                                 </div>
                            )}
                        </>
                    )}
                </div>
            </main>
            
            {/* --- Controls Footer --- */}
            <footer className="bg-gray-200 p-4 flex-shrink-0 z-10">
                <div className="flex items-start space-x-4">
                    <CompactFileUpload onFileSelect={setProductImage} uploadedFile={productImage} placeholderText="Product" inputId="product-file-input" />
                    <CompactFileUpload onFileSelect={setSceneImage} uploadedFile={sceneImage} placeholderText="Scene" inputId="scene-file-input" />
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
                </div>
                
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center">
                             <TabButton onClick={() => setActiveControlTab('style')} isActive={activeControlTab === 'style'}>Style</TabButton>
                             <TabButton onClick={() => setActiveControlTab('scene')} isActive={activeControlTab === 'scene'}>Scene</TabButton>
                             <TabButton onClick={() => setActiveControlTab('camera')} isActive={activeControlTab === 'camera'}>Camera</TabButton>
                             <TabButton onClick={() => setActiveControlTab('lighting')} isActive={activeControlTab === 'lighting'}>Lighting</TabButton>
                         </div>
                        <div className="flex items-center space-x-4">
                            <NeumorphicSwitch
                                id="smart-mode-toggle"
                                checked={isSmartMode}
                                onChange={(e) => setIsSmartMode(e.target.checked)}
                                title="Generates a separate scene and product, then combines them for more consistent results."
                            >
                                Smart Mode
                                <svg className="w-3.5 h-3.5 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </NeumorphicSwitch>
                            <ImageCountSelector 
                                selected={numImages} 
                                onSelect={setNumImages} 
                                options={[1, 4, 8]}
                            />
                        </div>
                    </div>
                    <div className="p-3 bg-gray-200 rounded-b-lg rounded-tr-lg shadow-[inset_3px_3px_6px_#d1d5db,inset_-3px_-3px_6px_#ffffff] h-48 overflow-y-auto">
                        {activeControlTab === 'style' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <ControlSection title="Creative Style">
                                    <SelectMenu showBrandOption label="Style" value={selectedPresets.styles} onChange={(e) => handlePresetChange('styles', e.target.value)} options={presets.styles} />
                                </ControlSection>
                                <ControlSection title="Color & Tone">
                                    <SelectMenu showBrandOption label="Color Palette" value={selectedPresets.color} onChange={(e) => handlePresetChange('color', e.target.value)} options={presets.color} />
                                </ControlSection>
                                <ControlSection title="Mood & Emotion">
                                    <SelectMenu showBrandOption label="Mood" value={selectedPresets.mood} onChange={(e) => handlePresetChange('mood', e.target.value)} options={presets.mood} />
                                </ControlSection>
                                <ControlSection title="Texture & Material">
                                    <SelectMenu label="Texture" value={selectedPresets.texture} onChange={(e) => handlePresetChange('texture', e.target.value)} options={presets.texture} />
                                </ControlSection>
                                <ControlSection title="Detail Level">
                                    <SelectMenu label="Detail" value={selectedPresets.detail} onChange={(e) => handlePresetChange('detail', e.target.value)} options={presets.detail} />
                                </ControlSection>
                                <ControlSection title="Artistic Medium">
                                    <SelectMenu label="Medium" value={selectedPresets.medium} onChange={(e) => handlePresetChange('medium', e.target.value)} options={presets.medium} />
                                </ControlSection>
                            </div>
                        )}
                        {activeControlTab === 'scene' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <ControlSection title="Scene & Environment">
                                        <SelectMenu label="Scene" value={selectedPresets.scenes} onChange={(e) => handlePresetChange('scenes', e.target.value)} options={presets.scenes} />
                                    </ControlSection>
                                    <ControlSection title="Contextual Objects">
                                        <SelectMenu label="Contextual Objects" value={selectedPresets.objects} onChange={(e) => handlePresetChange('objects', e.target.value)} options={presets.objects} />
                                    </ControlSection>
                                    <ControlSection title="Composition">
                                        <SelectMenu label="Composition" value={selectedPresets.composition} onChange={(e) => handlePresetChange('composition', e.target.value)} options={presets.composition} />
                                    </ControlSection>
                                </div>
                                <div className="mt-4">
                                    <ControlSection title="Quick Modifiers">
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(sceneModifiers).map(([key, { name }]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setSceneModifier(key)}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                                                        sceneModifier === key
                                                        ? 'text-blue-600 bg-gray-200 shadow-[inset_2px_2px_4px_#d1d5db,inset_-2px_-2px_4px_#ffffff]'
                                                        : 'text-gray-600 bg-gray-200 shadow-[3px_3px_6px_#d1d5db,-3px_-3px_6px_#ffffff] hover:shadow-[1px_1px_2px_#d1d5db,-1px_-1px_2px_#ffffff]'
                                                    }`}
                                                >
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    </ControlSection>
                                </div>
                            </>
                        )}
                        {activeControlTab === 'camera' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ControlSection title="Camera & Shot">
                                    <h4 className="text-xs font-semibold text-gray-600 mb-2">Shot Type</h4>
                                    <div className="grid grid-cols-3 gap-2">{Object.entries(cameraShots).map(([k, { name, icon }]) => <IconButton key={k} onClick={() => setCameraShot(k)} isActive={cameraShot === k} title={name}>{icon}<span className="text-[10px] font-semibold">{name}</span></IconButton>)}</div>
                                    <h4 className="text-xs font-semibold text-gray-600 mt-4 mb-2">Focus & Depth</h4>
                                    <div className="grid grid-cols-2 gap-2">{Object.entries(focusOptions).map(([k, { name, icon }]) => <IconButton key={k} onClick={() => setFocus(k)} isActive={focus === k} title={name}>{icon}<span className="text-xs font-semibold">{name}</span></IconButton>)}</div>
                                </ControlSection>
                                <ControlSection title="Lens Type">
                                    <div className="grid grid-cols-2 gap-2 h-full">{Object.entries(lenses).map(([k, { name, description }]) => <IconButton key={k} onClick={() => setLens(k)} isActive={lens === k} title={description}><span className="text-sm font-bold">{name}</span><span className="text-xs block text-gray-500">{description}</span></IconButton>)}</div>
                                </ControlSection>
                            </div>
                        )}
                        {activeControlTab === 'lighting' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <ControlSection title="Lighting Style">
                                    <SelectMenu label="Style" value={selectedPresets.lighting} onChange={(e) => handlePresetChange('lighting', e.target.value)} options={presets.lighting} />
                                </ControlSection>
                                <ControlSection title="Light Quality">
                                    <SelectMenu label="Quality" value={selectedPresets.lightQuality} onChange={(e) => handlePresetChange('lightQuality', e.target.value)} options={presets.lightQuality} />
                                </ControlSection>
                                <ControlSection title="Light Direction">
                                    <SelectMenu label="Direction" value={selectedPresets.lightDirection} onChange={(e) => handlePresetChange('lightDirection', e.target.value)} options={presets.lightDirection} />
                                </ControlSection>
                            </div>
                        )}
                    </div>
                </div>
                {error && <p className="text-red-500 text-sm mt-3 p-3 bg-red-100/50 rounded-lg">{error}</p>}
            </footer>
        </div>
        {isModalOpen && activeImage && <ImagePreviewModal imageUrl={activeImage} onClose={() => setIsModalOpen(false)} />}
       </>
    );
};

const ControlSection: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => <div className="space-y-2"><h3 className="text-sm font-bold text-gray-700 mb-2">{title}</h3>{children}</div>;
const SelectMenu: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: Record<string, {name: string}>, showBrandOption?: boolean}> = ({label, value, onChange, options, showBrandOption = false}) => (<div className="relative"><label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label><select value={value} onChange={onChange} className="w-full pl-3 pr-8 py-1.5 text-sm rounded-lg bg-gray-200 text-gray-700 shadow-[inset_2px_2px_4px_#d1d5db,inset_-2px_-2px_4px_#ffffff] focus:outline-none transition appearance-none"><>
{showBrandOption && <option value="use_brand_guidelines" className="font-bold text-blue-600 bg-blue-50">★ Use Brand Guidelines</option>}
{Object.keys(options).map((key) => <option key={key} value={key} className="bg-white">{options[key].name}</option>)}</></select><div className="pointer-events-none absolute inset-y-0 right-0 top-6 flex items-center px-2 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div></div>);
const IconButton: React.FC<{onClick: () => void, isActive: boolean, title: string, children: React.ReactNode}> = ({onClick, isActive, title, children}) => (<button onClick={onClick} title={title} className={`p-1.5 rounded-lg text-center transition-all duration-200 h-full flex flex-col justify-center items-center ${isActive ? 'text-blue-600 shadow-[inset_2px_2px_4px_#d1d5db,inset_-2px_-2px_4px_#ffffff]' : 'bg-gray-200 text-gray-600 shadow-[3px_3px_6px_#d1d5db,-3px_-3px_6px_#ffffff] hover:shadow-[1px_1px_2px_#d1d5db,-1px_-1px_2px_#ffffff]'}`}>{children}</button>);

const TabButton: React.FC<{ onClick: () => void; isActive: boolean; children: React.ReactNode; }> = ({ onClick, isActive, children }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all duration-200 focus:outline-none ${isActive ? 'bg-gray-200 text-blue-600 shadow-[inset_3px_3px_6px_#d1d5db,inset_-3px_-3px_6px_#ffffff]' : 'text-gray-500 hover:text-gray-700'}`}>
        {children}
    </button>
);


export default ImageGenerationTab;