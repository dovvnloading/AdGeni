/**
 * © 2025 Matthew Robert Wesney. All Rights Reserved.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

import React from 'react';

interface NeumorphicCardProps {
  children: React.ReactNode;
  className?: string;
}

const NeumorphicCard: React.FC<NeumorphicCardProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`bg-gray-200 rounded-2xl
                  shadow-[7px_7px_14px_#d1d5db,-7px_-7px_14px_#ffffff]
                  overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};

export default NeumorphicCard;