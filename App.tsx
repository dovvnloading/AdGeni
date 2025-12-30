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

import React, { useState, useEffect } from 'react';
import NeumorphicCard from './components/GlassCard';
import NeumorphicButton from './components/NeumorphicButton';
import LoadingSpinner from './components/LoadingSpinner';
import Workspace from './components/Workspace';

declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}

const App: React.FC = () => {
    const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
    const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [manualKey, setManualKey] = useState<string>('');

    useEffect(() => {
        const checkApiKey = async () => {
            setIsCheckingKey(true);
            setError(null);
            try {
                // 1. Check LocalStorage
                const storedKey = localStorage.getItem('gemini_api_key');
                if (storedKey && storedKey.length > 0) {
                    setApiKeyReady(true);
                    setIsCheckingKey(false);
                    return;
                }

                // 2. Check for Window AI Studio context (Google IDX)
                if (window.aistudio) {
                    const hasKey = await window.aistudio.hasSelectedApiKey();
                    setApiKeyReady(hasKey);
                    setIsCheckingKey(false);
                    return;
                } 
                
                // No key found - force manual entry
                setApiKeyReady(false);

            } catch (e) {
                console.error("Error checking for API key:", e);
                setError("Could not verify API key status.");
                setApiKeyReady(false);
            } finally {
                setIsCheckingKey(false);
            }
        };
        checkApiKey();
    }, []);

    const handleSelectKey = async () => {
        if (!window.aistudio) return;
        try {
            await window.aistudio.openSelectKey();
            setApiKeyReady(true);
            setError(null);
        } catch(e) {
            console.error("Failed to open key selection:", e);
            setError("Could not open the API key selection dialog.");
        }
    };

    const handleSaveManualKey = () => {
        if (!manualKey.trim()) {
            setError("Please enter a valid API key.");
            return;
        }
        localStorage.setItem('gemini_api_key', manualKey.trim());
        setApiKeyReady(true);
        setError(null);
    };

    if (isCheckingKey) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-200">
                <LoadingSpinner message="Initializing Application..." />
            </div>
        );
    }

    if (!apiKeyReady) {
        return (
            <div className="fixed inset-0 bg-gray-200/95 flex items-center justify-center z-50">
                <NeumorphicCard className="p-8 text-center max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">API Key Required</h2>
                    <p className="mb-6 text-gray-600">To use AdGeni, you need a Google Gemini API key. Your key is stored locally in your browser.</p>
                    
                    {window.aistudio ? (
                        <NeumorphicButton onClick={handleSelectKey} className="w-full mb-4">Select API Key (IDX)</NeumorphicButton>
                    ) : (
                        <div className="space-y-4">
                            <input 
                                type="password" 
                                placeholder="Paste your API Key here (starts with AIza...)"
                                value={manualKey}
                                onChange={(e) => setManualKey(e.target.value)}
                                className="w-full p-3 rounded-xl bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <NeumorphicButton onClick={handleSaveManualKey} className="w-full">
                                Save & Continue
                            </NeumorphicButton>
                        </div>
                    )}
                    
                    <div className="mt-6 pt-4 border-t border-gray-300">
                         <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm block">
                            Get a free Gemini API Key here
                        </a>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-4 p-2 bg-red-100 rounded">{error}</p>}
                </NeumorphicCard>
            </div>
        );
    }

    return <Workspace />;
};

export default App;
