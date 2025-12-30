/**
 * © 2025 Matthew Robert Wesney. All Rights Reserved.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

import React from 'react';
import { BrandGuidelines } from '../../types';

// --- Reusable Helper Components (simplified for this tab) ---
const ControlSection: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => <div className="space-y-2"><h3 className="text-sm font-bold text-gray-700 mb-2">{title}</h3>{children}</div>;
const TextArea: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, placeholder: string}> = ({label, value, onChange, placeholder}) => (
    <div className="relative">
        <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
        <textarea 
            value={value} 
            onChange={onChange}
            placeholder={placeholder}
            rows={4}
            className="w-full p-2 text-sm rounded-lg bg-gray-200 text-gray-700 placeholder-gray-500/80 focus:outline-none transition resize-y shadow-[inset_2px_2px_4px_#d1d5db,inset_-2px_-2px_4px_#ffffff] focus:shadow-[inset_1px_1px_2px_#d1d5db,inset_-1px_-1px_2px_#ffffff]"
        />
    </div>
);


// --- Main Branding Tab Component ---
interface BrandingTabProps {
    brandGuidelines: BrandGuidelines;
    setBrandGuidelines: (guidelines: BrandGuidelines) => void;
}

const BrandingTab: React.FC<BrandingTabProps> = ({ brandGuidelines, setBrandGuidelines }) => {

    const handleTextChange = (category: keyof BrandGuidelines, value: string) => {
        setBrandGuidelines({ ...brandGuidelines, [category]: value });
    };

    return (
        <div className="flex flex-col h-full bg-gray-200 p-6 items-center">
            <div className="w-full max-w-4xl">
                <header className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">Brand Identity Hub</h2>
                    <p className="text-md text-gray-600 mt-2">
                        Manually enter your core visual identity here. You can then select these guidelines from the dropdowns in other tabs to ensure brand consistency.
                    </p>
                </header>

                <main className="p-6 bg-gray-200 rounded-2xl shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ControlSection title="Primary Brand Style">
                             <TextArea 
                                label="Style Description"
                                value={brandGuidelines.styles}
                                onChange={(e) => handleTextChange('styles', e.target.value)}
                                placeholder="e.g., A clean, Scandinavian-inspired aesthetic with natural wood and white tones, emphasizing simplicity and light."
                            />
                        </ControlSection>

                        <ControlSection title="Brand Color Palette">
                            <TextArea 
                                label="Color Palette Description"
                                value={brandGuidelines.color}
                                onChange={(e) => handleTextChange('color', e.target.value)}
                                placeholder="e.g., Primary colors are #F5F5DC (beige) and #2F4F4F (dark slate grey), with an accent of #DAA520 (goldenrod)."
                            />
                        </ControlSection>

                        <ControlSection title="Brand Mood & Emotion">
                           <TextArea 
                                label="Mood Description"
                                value={brandGuidelines.mood}
                                onChange={(e) => handleTextChange('mood', e.target.value)}
                                placeholder="e.g., The mood should feel calm, trustworthy, and premium, evoking a sense of quiet confidence and nature."
                            />
                        </ControlSection>
                    </div>
                </main>

                <footer className="text-center mt-8">
                     <div className="text-center text-gray-400 p-8 rounded-2xl">
                         <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                         </svg>
                        <p className="text-sm text-gray-500">Your selections are saved automatically. Navigate to another tab and select the <br/> <span className="font-semibold text-gray-600">'★ Use Brand Guidelines'</span> option from any style dropdown to use them.</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default BrandingTab;