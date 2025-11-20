/**
 * © 2025 Matthew Robert Wesney. All Rights Reserved.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

import React from 'react';

interface LoadingSpinnerProps {
    message?: string;
    size?: 'sm' | 'md';
    textColor?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, size = 'md', textColor = 'text-gray-600' }) => {
    const sizeClasses = size === 'sm' ? 'w-6 h-6 border-2' : 'w-10 h-10 border-4';
    return (
        <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className={`border-gray-300 border-t-blue-500 rounded-full animate-spin ${sizeClasses}`}></div>
            {message && <p className={`mt-3 text-sm font-semibold ${textColor}`}>{message}</p>}
        </div>
    );
};

export default LoadingSpinner;