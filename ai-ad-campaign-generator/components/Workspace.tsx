/**
 * © 2025 Matthew Robert Wesney. All Rights Reserved.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

/**
 * Graphite-AdGeni
 * 
 * Lead and Main Developer: Matthew Robert Wesney
 * GitHub Profile: https://github.com/dovvnloading
 * Project Repository: https://github.com/dovvnloading/AdGeni
 */

import React, { useState } from 'react';
import ImageGenerationTab from './tabs/ImageGenerationTab';
import PackagingTab from './tabs/PackagingTab';
import SetDesignTab from './tabs/SetDesignTab';
import BrandingTab from './tabs/BrandingTab';
import AdEditorTab from './tabs/AdEditorTab';
import TextCampaignsTab from './tabs/TextCampaignsTab';
import CampaignVoTab from './tabs/CampaignVoTab';
import CompositionTab from './tabs/CompositionTab';
import { UploadedFile, BrandGuidelines, AdEditorState, TextCampaign, GeneratedAudio, AppSettings, TEXT_MODELS, IMAGE_MODELS } from '../types';
import NeumorphicButton from './NeumorphicButton';
import NeumorphicCard from './GlassCard';

const Logo = () => (
    <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0
                        shadow-[2px_2px_4px_#d1d5db,-2px_-2px_4px_#ffffff]">
             <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.32 0L12 2.69z"></path>
                <path d="M12 12l-2 2.5 2 2.5 2-2.5-2-2.5z"></path>
             </svg>
        </div>
        <h1 className="font-bold text-xl text-gray-800 tracking-tighter">Graphite-AdGeni</h1>
    </div>
);

const MainTabButton: React.FC<{ onClick: () => void; isActive: boolean; children: React.ReactNode; }> = ({ onClick, isActive, children }) => (
    <button
        onClick={onClick}
        className={`px-5 py-2 text-sm font-bold transition-all duration-300 focus:outline-none rounded-t-lg
                    ${isActive
                        ? 'text-blue-600 bg-gray-200 shadow-[inset_3px_2px_5px_#d1d5db,inset_-3px_-2px_5px_#ffffff]'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
    >
        {children}
    </button>
);

const IconButton: React.FC<{ onClick: () => void; title: string; children: React.ReactNode }> = ({ onClick, title, children }) => (
    <button 
        onClick={onClick} 
        className="ml-2 p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-300/50 focus:outline-none"
        title={title}
    >
        {children}
    </button>
);

const SettingsModal: React.FC<{ 
    onClose: () => void; 
    settings: AppSettings; 
    setSettings: (s: AppSettings) => void; 
}> = ({ onClose, settings, setSettings }) => {
    const handleChange = (key: keyof AppSettings, value: string) => {
        setSettings({ ...settings, [key]: value });
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-200 p-8 rounded-2xl shadow-[5px_5px_10px_#d1d5db,-5px_-5px_10px_#ffffff] max-w-md w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-gray-800 mb-6">Model Settings</h2>
                
                <div className="space-y-6 mb-8">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">Text Generation Model</label>
                        <div className="relative">
                            <select 
                                value={settings.textModel} 
                                onChange={(e) => handleChange('textModel', e.target.value)}
                                className="w-full p-3 rounded-xl bg-gray-200 text-gray-700 shadow-[inset_3px_3px_6px_#d1d5db,inset_-3px_-3px_6px_#ffffff] focus:outline-none appearance-none"
                            >
                                {TEXT_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 ml-1">Used for Ad Copy and Scripts.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">Image Generation Model</label>
                        <div className="relative">
                             <select 
                                value={settings.imageModel} 
                                onChange={(e) => handleChange('imageModel', e.target.value)}
                                className="w-full p-3 rounded-xl bg-gray-200 text-gray-700 shadow-[inset_3px_3px_6px_#d1d5db,inset_-3px_-3px_6px_#ffffff] focus:outline-none appearance-none"
                            >
                                {IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 ml-1">Used for Ad Images, Packaging, and Sets.</p>
                    </div>
                </div>

                <NeumorphicButton onClick={onClose} className="w-full">Done</NeumorphicButton>
            </div>
        </div>
    );
};

const CreditsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-200 p-8 rounded-2xl shadow-[5px_5px_10px_#d1d5db,-5px_-5px_10px_#ffffff] max-w-md w-full text-center relative" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Graphite-AdGeni</h2>
                <p className="text-gray-600 mb-8 text-sm">AI-Powered Ad Campaign Generator</p>
                
                <div className="space-y-6 mb-8">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Lead & Main Developer</p>
                        <p className="text-lg font-semibold text-gray-800">Matthew Robert Wesney</p>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <a href="https://github.com/dovvnloading" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors p-2 rounded-lg hover:bg-gray-300/30">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                            <span>GitHub Profile</span>
                        </a>
                        <a href="https://github.com/dovvnloading/AdGeni" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors p-2 rounded-lg hover:bg-gray-300/30">
                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                            <span>Project Repository</span>
                        </a>
                    </div>
                </div>

                <NeumorphicButton onClick={onClose} className="w-full">Close</NeumorphicButton>
            </div>
        </div>
    );
}


// --- Header Navigation ---
const Header: React.FC<{ 
    activeTab: string; 
    setActiveTab: (tab: string) => void; 
    onInfoClick: () => void;
    onSettingsClick: () => void; 
}> = ({ activeTab, setActiveTab, onInfoClick, onSettingsClick }) => {
    return (
        <header className="flex-shrink-0 bg-gray-200 z-20 shadow-[4px_4px_8px_#d1d5db,-4px_-4px_8px_#ffffff]">
            <div className="mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    <Logo />
                    <div className="flex items-end h-full space-x-2">
                        <MainTabButton onClick={() => setActiveTab('composition')} isActive={activeTab === 'composition'}>Composition</MainTabButton>
                        <MainTabButton onClick={() => setActiveTab('ad-generation')} isActive={activeTab === 'ad-generation'}>Ad Generation</MainTabButton>
                        <MainTabButton onClick={() => setActiveTab('ad-editor')} isActive={activeTab === 'ad-editor'}>Ad Editor</MainTabButton>
                        <MainTabButton onClick={() => setActiveTab('text-campaigns')} isActive={activeTab === 'text-campaigns'}>Text Campaigns</MainTabButton>
                        <MainTabButton onClick={() => setActiveTab('campaign-vo')} isActive={activeTab === 'campaign-vo'}>Campaign-Vo</MainTabButton>
                        <MainTabButton onClick={() => setActiveTab('set-design')} isActive={activeTab === 'set-design'}>Set Design</MainTabButton>
                        <MainTabButton onClick={() => setActiveTab('packaging')} isActive={activeTab === 'packaging'}>Packaging</MainTabButton>
                        <MainTabButton onClick={() => setActiveTab('branding')} isActive={activeTab === 'branding'}>Branding</MainTabButton>
                        <div className="pb-1 pl-2 border-l border-gray-300 ml-2 flex items-center">
                             <IconButton onClick={onSettingsClick} title="Settings">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                             </IconButton>
                             <IconButton onClick={onInfoClick} title="About">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                </svg>
                            </IconButton>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

// --- Main Workspace ---

const Workspace: React.FC = () => {
    const [activeTab, setActiveTab] = useState('composition');
    const [packagingAsProduct, setPackagingAsProduct] = useState<UploadedFile | null>(null);
    const [setDesignAsScene, setSetDesignAsScene] = useState<UploadedFile | null>(null);
    const [brandGuidelines, setBrandGuidelines] = useState<BrandGuidelines>({ styles: '', color: '', mood: '' });
    const [adEditorState, setAdEditorState] = useState<AdEditorState>({
        originalImage: null,
        prompt: '',
        editedImage: null,
    });
    // --- LIFTED STATE FOR COMPOSITION TAB ---
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [textCampaigns, setTextCampaigns] = useState<TextCampaign[]>([]);
    const [audioFiles, setAudioFiles] = useState<GeneratedAudio[]>([]);
    
    const [editingImageIdentifier, setEditingImageIdentifier] = useState<string | null>(null);
    const [showCredits, setShowCredits] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    
    // --- APP SETTINGS STATE ---
    const [settings, setSettings] = useState<AppSettings>({
        textModel: 'gemini-2.5-flash',
        imageModel: 'gemini-2.5-flash-image'
    });


    const dataURLtoFile = (dataurl: string, filename: string): File | null => {
        const arr = dataurl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) return null;

        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const handleSetPackagingAsProduct = (imageUrl: string) => {
        const file = dataURLtoFile(imageUrl, 'packaging-as-product.png');
        if (file) {
            const uploadedFile: UploadedFile = {
                file: file,
                previewUrl: imageUrl,
                base64: imageUrl.split(',')[1],
            };
            setPackagingAsProduct(uploadedFile);
            setActiveTab('ad-generation');
        } else {
            console.error("Failed to convert data URL to file.");
        }
    };
    
    const handleSetDesignAsScene = (imageUrl: string) => {
        const file = dataURLtoFile(imageUrl, 'set-design-as-scene.png');
        if (file) {
            const uploadedFile: UploadedFile = {
                file: file,
                previewUrl: imageUrl,
                base64: imageUrl.split(',')[1],
            };
            setSetDesignAsScene(uploadedFile);
            setActiveTab('ad-generation');
        } else {
            console.error("Failed to convert data URL to file.");
        }
    };

    const handleProductImportConsumed = () => {
        setPackagingAsProduct(null);
    };

    const handleSceneImportConsumed = () => {
        setSetDesignAsScene(null);
    };

    const handleEditImage = (imageUrl: string) => {
        setEditingImageIdentifier(imageUrl); // Keep track of which image we're editing
        setAdEditorState({
            originalImage: imageUrl,
            prompt: '', // Reset prompt for new image
            editedImage: null, // Reset edited image
        });
        setActiveTab('ad-editor');
    };
    
    const handleApplyEditToGallery = (newImageUrl: string) => {
        if (editingImageIdentifier) {
            setGeneratedImages(prevImages =>
                prevImages.map(img =>
                    img === editingImageIdentifier ? newImageUrl : img
                )
            );
        }
        setEditingImageIdentifier(null);
    };

    const handleAddAudioFile = (newAudio: GeneratedAudio) => {
        setAudioFiles(prev => [...prev, newAudio]);
    };


    return (
        <div className="flex flex-col h-screen w-screen bg-gray-200 font-sans overflow-hidden">
            <Header 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                onInfoClick={() => setShowCredits(true)} 
                onSettingsClick={() => setShowSettings(true)}
            />
            
            {showCredits && <CreditsModal onClose={() => setShowCredits(false)} />}
            {showSettings && <SettingsModal settings={settings} setSettings={setSettings} onClose={() => setShowSettings(false)} />}

            <main className="flex-1 flex flex-col overflow-hidden">
                <div className={`${activeTab === 'composition' ? 'flex flex-col h-full' : 'hidden'}`}>
                    <CompositionTab
                        images={generatedImages}
                        texts={textCampaigns}
                        audios={audioFiles}
                    />
                </div>
                <div className={`${activeTab === 'ad-generation' ? 'flex flex-col h-full' : 'hidden'}`}>
                    <ImageGenerationTab 
                        importedProductImage={packagingAsProduct} 
                        onProductImportConsumed={handleProductImportConsumed}
                        importedSceneImage={setDesignAsScene}
                        onSceneImportConsumed={handleSceneImportConsumed}
                        brandGuidelines={brandGuidelines}
                        onEditImage={handleEditImage}
                        images={generatedImages}
                        setImages={setGeneratedImages}
                        imageModel={settings.imageModel}
                    />
                </div>
                <div className={`${activeTab === 'ad-editor' ? 'flex flex-col h-full' : 'hidden'}`}>
                    <AdEditorTab 
                        adEditorState={adEditorState} 
                        setAdEditorState={setAdEditorState} 
                        onApplyEdit={handleApplyEditToGallery}
                        imageModel={settings.imageModel}
                    />
                </div>
                 <div className={`${activeTab === 'text-campaigns' ? 'flex flex-col h-full' : 'hidden'}`}>
                    <TextCampaignsTab 
                        brandGuidelines={brandGuidelines}
                        campaigns={textCampaigns}
                        setCampaigns={setTextCampaigns}
                        textModel={settings.textModel}
                    />
                </div>
                <div className={`${activeTab === 'campaign-vo' ? 'flex flex-col h-full' : 'hidden'}`}>
                    <CampaignVoTab 
                        brandGuidelines={brandGuidelines}
                        onAddAudioFile={handleAddAudioFile}
                        textModel={settings.textModel}
                    />
                </div>
                <div className={`${activeTab === 'set-design' ? 'flex flex-col h-full' : 'hidden'}`}>
                    <SetDesignTab 
                        onUseAsScene={handleSetDesignAsScene} 
                        brandGuidelines={brandGuidelines} 
                        imageModel={settings.imageModel}
                    />
                </div>
                <div className={`${activeTab === 'packaging' ? 'flex flex-col h-full' : 'hidden'}`}>
                    <PackagingTab 
                        onUseAsProduct={handleSetPackagingAsProduct} 
                        brandGuidelines={brandGuidelines} 
                        imageModel={settings.imageModel}
                    />
                </div>
                 <div className={`${activeTab === 'branding' ? 'flex flex-col h-full' : 'hidden'}`}>
                    <BrandingTab brandGuidelines={brandGuidelines} setBrandGuidelines={setBrandGuidelines} />
                </div>
            </main>
        </div>
    );
};

export default Workspace;