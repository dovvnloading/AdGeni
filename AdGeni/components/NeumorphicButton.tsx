/**
 * © 2025 Matthew Robert Wesney. All Rights Reserved.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

import React from 'react';

interface NeumorphicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

const NeumorphicButton: React.FC<NeumorphicButtonProps> = ({ children, className = '', size = 'md', ...props }) => {
  const sizeClasses = size === 'sm' ? 'px-4 py-2 text-sm' : 'px-6 py-3';
  return (
    <button
      {...props}
      className={`rounded-xl font-semibold text-gray-700 bg-gray-200
                 shadow-[5px_5px_10px_#d1d5db,-5px_-5px_10px_#ffffff]
                 active:shadow-[inset_2px_2px_5px_#d1d5db,inset_-2px_-2px_5px_#ffffff]
                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50
                 transition-shadow duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-inner
                 flex items-center justify-center ${sizeClasses} ${className}`}
    >
      {children}
    </button>
  );
};

export default NeumorphicButton;