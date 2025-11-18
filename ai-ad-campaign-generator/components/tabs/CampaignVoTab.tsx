/**
 * © 2025 Matthew Robert Wesney. All Rights Reserved.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import { generateVoScript, generateSpeech } from '../../services/geminiService';
import NeumorphicButton from '../NeumorphicButton';
import LoadingSpinner from '../LoadingSpinner';
import { BrandGuidelines, VoScriptState, GeneratedAudio } from '../../types';
import NeumorphicCard from '../GlassCard';

// --- Reusable Helper Components ---
const TextArea: React.FC<{label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder: string; rows?: number; className?: string;}> = ({label, value, onChange, placeholder, rows = 3, className = ''}) => (
    <div className="relative h-full flex flex-col">
        <label className="text-xs font-semibold text-gray-600 mb-1 block flex-shrink-0">{label}</label>
        <textarea 
            value={value} 
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className={`w-full p-2 text-sm rounded-lg bg-gray-200 text-gray-700 placeholder-gray-500/80 focus:outline-none transition resize-y shadow-[inset_2px_2px_4px_#d1d5db,inset_-2px_-2px_4px_#ffffff] focus:shadow-[inset_1px_1px_2px_#d1d5db,inset_-1px_-1px_2px_#ffffff] ${className}`}
        />
    </div>
);
const SelectMenu: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: Record<string, string>}> = ({label, value, onChange, options}) => (<div className="relative"><label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label><select value={value} onChange={onChange} className="w-full pl-3 pr-8 py-1.5 text-sm rounded-lg bg-gray-200 text-gray-700 shadow-[inset_2px_2px_4px_#d1d5db,inset_-2px_-2px_4px_#ffffff] focus:outline-none transition appearance-none"><>
{Object.entries(options).map(([key, name]) => <option key={key} value={key} className="bg-white">{name}</option>)}</></select><div className="pointer-events-none absolute inset-y-0 right-0 top-6 flex items-center px-2 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div></div>);

// --- Option Data ---
const voices = {
    'Zephyr': "Zephyr (Calm, Male)",
    'Puck': "Puck (Energetic, Male)",
    'Kore': "Kore (Warm, Female)",
    'Charon': "Charon (Deep, Male)",
    'Fenrir': "Fenrir (Authoritative, Male)"
};

// Helper function to convert raw PCM data (from base64) to a WAV blob URL.
const createWavUrl = (base64Pcm: string): string => {
    // 1. Decode base64 to Uint8Array
    const binaryString = atob(base64Pcm);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const pcmData = bytes;

    // 2. Create WAV header
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcmData.byteLength;
    const chunkSize = 36 + dataSize;
    
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // RIFF chunk size
    view.setUint32(4, chunkSize, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // FMT identifier
    writeString(view, 12, 'fmt ');
    // FMT chunk size
    view.setUint32(16, 16, true);
    // Audio format (1 for PCM)
    view.setUint16(20, 1, true);
    // Number of channels
    view.setUint16(22, numChannels, true);
    // Sample rate
    view.setUint32(24, sampleRate, true);
    // Byte rate
    view.setUint32(28, byteRate, true);
    // Block align
    view.setUint16(32, blockAlign, true);
    // Bits per sample
    view.setUint16(34, bitsPerSample, true);
    // data identifier
    writeString(view, 36, 'data');
    // data chunk size
    view.setUint32(40, dataSize, true);

    // 3. Combine header and PCM data
    const wavBlob = new Blob([view.buffer, pcmData], { type: 'audio/wav' });

    // 4. Create Object URL
    return URL.createObjectURL(wavBlob);
};

// --- Main Component ---
interface CampaignVoTabProps {
    brandGuidelines: BrandGuidelines;
    onAddAudioFile: (audio: GeneratedAudio) => void;
}

const CampaignVoTab: React.FC<CampaignVoTabProps> = ({ brandGuidelines, onAddAudioFile }) => {
    const [script, setScript] = useState('');
    const [selectedVoice, setSelectedVoice] = useState('Zephyr');
    const [scriptGuideState, setScriptGuideState] = useState<VoScriptState>({ prompt: '', generatedScript: '', isGenerating: false });
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);

    // Cleanup object URL when component unmounts or URL changes
    useEffect(() => {
        const url = generatedAudioUrl;
        return () => {
            if (url) {
                URL.revokeObjectURL(url);
            }
        };
    }, [generatedAudioUrl]);

    const handleGenerateScript = async () => {
        if (!scriptGuideState.prompt) return;
        setScriptGuideState(prev => ({ ...prev, isGenerating: true, generatedScript: '' }));
        setError(null);
        try {
            const result = await generateVoScript(scriptGuideState.prompt, brandGuidelines);
            setScriptGuideState(prev => ({ ...prev, generatedScript: result }));
        } catch (e) {
            if (e instanceof Error) setError(e.message);
            else setError("Failed to generate script.");
        } finally {
            setScriptGuideState(prev => ({ ...prev, isGenerating: false }));
        }
    };
    
    const handleGenerateVo = async () => {
        if (!script) {
            setError("Please enter a script to generate a voiceover.");
            return;
        }
        setError(null);
        setIsLoading(true);
        setGeneratedAudioUrl(null);

        try {
            const base64Audio = await generateSpeech(script, selectedVoice);
            const wavUrl = createWavUrl(base64Audio);
            setGeneratedAudioUrl(wavUrl);

            // Add to shared state for Composition tab
            const fileName = `VO_${selectedVoice}_${new Date().getTime()}.wav`;
            onAddAudioFile({ name: fileName, url: wavUrl });

        } catch (e) {
            if (e instanceof Error) setError(e.message);
            else setError("An unknown error occurred while generating audio.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col h-full bg-gray-200 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                {/* Left Panel: Scripting */}
                <div className="flex flex-col gap-4 min-h-0">
                    <header className="flex-shrink-0">
                        <h3 className="text-lg font-bold text-gray-800">Voiceover Script</h3>
                        <p className="text-sm text-gray-500">Write your script here or use the generative guide below.</p>
                    </header>
                    <div className="flex-1 flex flex-col min-h-0">
                        <TextArea 
                            label="Script Editor"
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                            placeholder="Paste or write your voiceover script here..."
                            className="flex-1 text-base leading-relaxed"
                        />
                    </div>
                     <NeumorphicCard className="p-4 flex-shrink-0">
                        <h4 className="text-sm font-bold text-gray-700 mb-2">Generative Script Guide</h4>
                        <div className="flex items-start gap-3">
                           <div className="flex-1">
                               <TextArea 
                                    label="Describe your ad"
                                    value={scriptGuideState.prompt}
                                    onChange={(e) => setScriptGuideState(p => ({...p, prompt: e.target.value}))}
                                    placeholder="e.g., A 15-second ad for a new brand of sparkling water called 'Crisp'. The mood is refreshing and natural."
                                    rows={3}
                                />
                           </div>
                            <div className="flex flex-col gap-2 mt-5">
                                <NeumorphicButton size="sm" onClick={handleGenerateScript} disabled={scriptGuideState.isGenerating || !scriptGuideState.prompt}>
                                    {scriptGuideState.isGenerating ? <LoadingSpinner size="sm" /> : 'Write Script'}
                                </NeumorphicButton>
                                {scriptGuideState.generatedScript && (
                                     <NeumorphicButton size="sm" onClick={() => setScript(scriptGuideState.generatedScript)} title="Use this script">
                                        Use
                                    </NeumorphicButton>
                                )}
                            </div>
                        </div>
                        {scriptGuideState.generatedScript && (
                             <div className="mt-3 p-3 bg-gray-200 rounded-lg shadow-[inset_2px_2px_4px_#d1d5db,inset_-2px_-2px_4px_#ffffff]">
                                 <p className="text-xs text-gray-700 whitespace-pre-wrap">{scriptGuideState.generatedScript}</p>
                             </div>
                        )}
                    </NeumorphicCard>
                </div>
                
                {/* Right Panel: Generation & Output */}
                <div className="flex flex-col gap-4 min-h-0">
                    <header className="flex-shrink-0">
                        <h3 className="text-lg font-bold text-gray-800">Generate Audio</h3>
                        <p className="text-sm text-gray-500">Select a voice and generate your voiceover.</p>
                    </header>
                     <NeumorphicCard className="p-4 flex-shrink-0">
                         <div className="space-y-4">
                            <SelectMenu label="Select Voice" value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} options={voices} />
                             {error && <p className="text-red-500 text-sm p-3 bg-red-100/50 rounded-lg">{error}</p>}
                         </div>

                        <div className="mt-4">
                             <NeumorphicButton onClick={handleGenerateVo} disabled={isLoading || !script} className="w-full text-base">
                                {isLoading ? <><LoadingSpinner size="sm" /><span className="ml-2">Generating...</span></> : 'Generate Voiceover'}
                            </NeumorphicButton>
                        </div>
                    </NeumorphicCard>
                    
                    <NeumorphicCard className="p-4 flex-1 flex flex-col">
                        <h4 className="text-sm font-bold text-gray-700 mb-2 flex-shrink-0">Result</h4>
                        <div className="flex-1 h-full flex items-center justify-center">
                            {generatedAudioUrl ? (
                                <div className="w-full flex flex-col items-center gap-4">
                                    <audio controls src={generatedAudioUrl} className="w-full"></audio>
                                    <a href={generatedAudioUrl} download={`voiceover_${selectedVoice}.wav`} className="text-sm text-blue-600 hover:underline">
                                        Download WAV file
                                    </a>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 p-8 rounded-2xl">
                                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                    <p>Your generated audio will appear here.</p>
                                </div>
                            )}
                        </div>
                    </NeumorphicCard>
                </div>
            </div>
        </div>
    );
};

export default CampaignVoTab;