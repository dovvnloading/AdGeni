/**
 * © 2025 Matthew Robert Wesney. All Rights Reserved.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

import React from 'react';

export const ShotEyeLevelIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 mx-auto mb-1">
    <rect x="3" y="5" width="18" height="14" rx="2"></rect>
    <line x1="3" y1="12" x2="21" y2="12"></line>
  </svg>
);

export const ShotHighAngleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 mx-auto mb-1">
    <rect x="3" y="5" width="18" height="14" rx="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <path d="M7 9L10 5"></path>
    <path d="M17 9L14 5"></path>
  </svg>
);

export const ShotLowAngleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 mx-auto mb-1">
    <rect x="3" y="5" width="18" height="14" rx="2"></rect>
    <line x1="3" y1="15" x2="21" y2="15"></line>
    <path d="M7 15L10 19"></path>
    <path d="M17 15L14 19"></path>
  </svg>
);

export const ShotCloseupIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 mx-auto mb-1">
    <rect x="3" y="5" width="18" height="14" rx="2"></rect>
    <rect x="8" y="9" width="8" height="6" rx="1"></rect>
  </svg>
);

export const ShotWideIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 mx-auto mb-1">
        <rect x="1" y="5" width="22" height="14" rx="2"></rect>
        <circle cx="12" cy="12" r="2"></circle>
    </svg>
);

export const ShotDutchAngleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 mx-auto mb-1">
       <rect x="1.67" y="7.16" width="20.66" height="13.31" rx="2" transform="rotate(-15 12 12)"></rect>
       <line x1="4" y1="14" x2="20" y2="10" transform="rotate(-15 12 12)"></line>
    </svg>
);

export const FocusShallowIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 mx-auto mb-1">
        <circle cx="12" cy="12" r="3"></circle>
        <line x1="12" y1="2" x2="12" y2="5"></line>
        <line x1="12" y1="19" x2="12" y2="22"></line>
        <line x1="2" y1="12" x2="5" y2="12"></line>
        <line x1="19" y1="12" x2="22" y2="12"></line>
        <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" opacity="0.3"></line>
        <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" opacity="0.3"></line>
        <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" opacity="0.3"></line>
        <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" opacity="0.3"></line>
    </svg>
);

export const FocusDeepIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 mx-auto mb-1">
        <circle cx="12" cy="12" r="3"></circle>
        <line x1="12" y1="2" x2="12" y2="5"></line>
        <line x1="12" y1="19" x2="12" y2="22"></line>
        <line x1="2" y1="12" x2="5" y2="12"></line>
        <line x1="19" y1="12" x2="22" y2="12"></line>
        <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"></line>
        <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"></line>
        <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"></line>
        <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"></line>
    </svg>
);