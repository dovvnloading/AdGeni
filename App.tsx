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
import NeumorphicCard from './components/GlassCard'; // Renamed GlassCard to NeumorphicCard conceptually
import NeumorphicButton from './components/NeumorphicButton';
import LoadingSpinner from './components/LoadingSpinner';
import Workspace from './components/Workspace';

// Fix: Moved AIStudio interface inside `declare global` to correctly augment the global scope
// and resolve the "Subsequent property declarations must have the same type" error.
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

    useEffect(() => {
        const checkApiKey = async () => {
            setIsCheckingKey(true);
            setError(null);
            try {
                if (window.aistudio) {
                    const hasKey = await window.aistudio.hasSelectedApiKey();
                    setApiKeyReady(hasKey);
                } else {
                    console.warn("aistudio context not found. Assuming API key is set via environment.");
                    setApiKeyReady(true); 
                }
            } catch (e) {
                console.error("Error checking for API key:", e);
                setError("Could not verify API key status. Please try selecting one.");
                setApiKeyReady(false);
            } finally {
                setIsCheckingKey(false);
            }
        };
        checkApiKey();
    }, []);

    const handleSelectKey = async () => {
        if (!window.aistudio) {
            alert("API Key selection is not available in this environment.");
            return;
        }
        try {
            await window.aistudio.openSelectKey();
            // Fix for race condition: assume key selection is successful after opening the dialog.
            setApiKeyReady(true);
            setError(null);
        } catch(e) {
            console.error("Failed to open key selection:", e);
            setError("Could not open the API key selection dialog.");
        }
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
                    <p className="mb-6 text-gray-600">Please select your Google AI API key to continue. This is required for all features.</p>
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm mb-6 block">Learn about billing</a>
                    <NeumorphicButton onClick={handleSelectKey} className="w-full">Select API Key</NeumorphicButton>
                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                </NeumorphicCard>
            </div>
        );
    }

    return <Workspace />;
};

export default App;