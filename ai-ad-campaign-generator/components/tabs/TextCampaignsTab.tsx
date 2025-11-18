/**
 * © 2025 Matthew Robert Wesney. All Rights Reserved.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

import React, { useState } from 'react';
import { generateTextCampaigns } from '../../services/geminiService';
import NeumorphicButton from '../NeumorphicButton';
import LoadingSpinner from '../LoadingSpinner';
import { BrandGuidelines, TextCampaign } from '../../types';
import NeumorphicCard from '../GlassCard';

// --- Reusable Helper Components ---
const ControlSection: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => <div className="space-y-2"><h3 className="text-sm font-bold text-gray-700 mb-2">{title}</h3>{children}</div>;
const TextArea: React.FC<{label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder: string; rows?: number}> = ({label, value, onChange, placeholder, rows = 3}) => (
    <div className="relative">
        <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
        <textarea 
            value={value} 
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className="w-full p-2 text-sm rounded-lg bg-gray-200 text-gray-700 placeholder-gray-500/80 focus:outline-none transition resize-y shadow-[inset_2px_2px_4px_#d1d5db,inset_-2px_-2px_4px_#ffffff] focus:shadow-[inset_1px_1px_2px_#d1d5db,inset_-1px_-1px_2px_#ffffff]"
        />
    </div>
);
const SelectMenu: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: Record<string, string>, showBrandOption?: boolean}> = ({label, value, onChange, options, showBrandOption = false}) => (<div className="relative"><label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label><select value={value} onChange={onChange} className="w-full pl-3 pr-8 py-1.5 text-sm rounded-lg bg-gray-200 text-gray-700 shadow-[inset_2px_2px_4px_#d1d5db,inset_-2px_-2px_4px_#ffffff] focus:outline-none transition appearance-none"><>
{showBrandOption && <option value="use_brand_guidelines" className="font-bold text-blue-600 bg-blue-50">★ Use Brand Guidelines</option>}
{Object.entries(options).map(([key, name]) => <option key={key} value={key} className="bg-white">{name}</option>)}</></select><div className="pointer-events-none absolute inset-y-0 right-0 top-6 flex items-center px-2 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div></div>);


// --- Option Data ---
const campaignGoals = {
    awareness: "Brand Awareness",
    leads: "Lead Generation",
    sales: "Direct Sales",
    engagement: "Social Media Engagement"
};

const platforms = {
    facebook: "Facebook / Instagram",
    google: "Google Ads (Search)",
    linkedin: "LinkedIn",
    twitter: "X (Twitter)",
    email: "Email Newsletter"
};

const tones = {
    professional: "Professional",
    friendly: "Friendly & Approachable",
    witty: "Witty & Humorous",
    urgent: "Urgent & Action-Oriented",
    inspirational: "Inspirational & Aspirational",
    luxury: "Luxurious & Elegant"
};

// --- Main Text Campaigns Tab Component ---
interface TextCampaignsTabProps {
    brandGuidelines: BrandGuidelines;
    campaigns: TextCampaign[];
    setCampaigns: React.Dispatch<React.SetStateAction<TextCampaign[]>>;
}

const TextCampaignsTab: React.FC<TextCampaignsTabProps> = ({ brandGuidelines, campaigns, setCampaigns }) => {
    const [productDescription, setProductDescription] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [campaignGoal, setCampaignGoal] = useState('awareness');
    const [platform, setPlatform] = useState('facebook');
    const [tone, setTone] = useState('professional');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState('');

    const handleGenerate = async () => {
        if (!productDescription || !targetAudience) {
            setError("Please provide a product description and target audience.");
            return;
        }
        setError(null);
        setIsLoading(true);
        setCampaigns([]);

        try {
            const results = await generateTextCampaigns(
                productDescription,
                targetAudience,
                campaignGoals[campaignGoal],
                platforms[platform],
                tones[tone],
                brandGuidelines
            );
            setCampaigns(results);
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError("An unknown error occurred while generating text campaigns.");
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess(`Copied campaign ${index + 1}!`);
            setTimeout(() => setCopySuccess(''), 2000); // Clear message after 2 seconds
        }, (err) => {
            console.error('Failed to copy text: ', err);
        });
    };
    
    return (
        <div className="flex flex-col h-full bg-gray-200">
            {/* --- Main Content --- */}
            <main className="flex-1 flex flex-col p-6 overflow-hidden">
                <header className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Generated Text Campaigns</h3>
                        <p className="text-sm text-gray-500">{campaigns.length > 0 ? `3 ad variations for ${platforms[platform]} generated.` : 'Your generated ad copy will appear here.'}</p>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? <div className="h-full flex items-center justify-center"><LoadingSpinner message="Our AI is writing your ad copy..." /></div>
                    : (
                        campaigns.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {campaigns.map((campaign, index) => (
                                    <NeumorphicCard key={index} className="flex flex-col p-4">
                                        <div className="flex-grow space-y-3">
                                            <h4 className="font-bold text-md text-gray-800 border-b-2 border-gray-300 pb-2">
                                                {campaign.headline}
                                            </h4>
                                            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                                                {campaign.body}
                                            </p>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-300/70 flex justify-between items-center">
                                            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                                CTA: {campaign.cta}
                                            </span>
                                            <button
                                                onClick={() => handleCopy(`${campaign.headline}\n\n${campaign.body}\n\n${campaign.cta}`, index)}
                                                className="text-gray-500 hover:text-blue-600 transition-colors text-xs font-semibold p-2 rounded-md hover:bg-gray-300/50"
                                                title="Copy to clipboard"
                                            >
                                                {copySuccess === `Copied campaign ${index + 1}!` ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                    </NeumorphicCard>
                                ))}
                            </div>
                        ) : (
                             <div className="h-full flex items-center justify-center">
                                <div className="text-center text-gray-400 p-12 rounded-2xl shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]">
                                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                        <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                    </svg>
                                    <h3 className="text-lg font-semibold mb-2 text-gray-500">Ad Copy Studio</h3>
                                    <p>Fill out the details below and click Generate.</p>
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
                        <div className="md:col-span-2">
                             <TextArea 
                                label="Product / Service Description"
                                value={productDescription}
                                onChange={(e) => setProductDescription(e.target.value)}
                                placeholder="e.g., An artisan, single-origin coffee subscription box delivered monthly."
                                rows={4}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <TextArea 
                                label="Target Audience"
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                placeholder="e.g., Young professionals aged 25-40 who appreciate high-quality, ethical products and work from home."
                                rows={4}
                            />
                        </div>
                        <div className="space-y-4">
                            <SelectMenu label="Campaign Goal" value={campaignGoal} onChange={(e) => setCampaignGoal(e.target.value)} options={campaignGoals} />
                            <SelectMenu label="Platform" value={platform} onChange={(e) => setPlatform(e.target.value)} options={platforms} />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <SelectMenu showBrandOption label="Tone of Voice" value={tone} onChange={(e) => setTone(e.target.value)} options={tones} />
                    </div>

                    <NeumorphicButton onClick={handleGenerate} disabled={isLoading || !productDescription || !targetAudience} className="h-20 w-48 text-base">
                         {isLoading ? <><LoadingSpinner size="sm" /><span className="ml-2">Generating...</span></> : 'Generate Ad Copy'}
                    </NeumorphicButton>
                </div>

                {error && <p className="text-red-500 text-sm mt-3 p-3 bg-red-100/50 rounded-lg">{error}</p>}
            </footer>
        </div>
    );
};

export default TextCampaignsTab;