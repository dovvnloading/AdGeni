/**
 * © 2025 Matthew Robert Wesney. All Rights Reserved.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

export interface UploadedFile {
    file: File;
    previewUrl: string;
    base64: string;
}

export interface ImageInput {
    base64: string;
    mimeType: string;
}

export interface BrandGuidelines {
    styles: string;
    color: string;
    mood: string;
}

export interface AdEditorState {
    originalImage: string | null;
    prompt: string;
    editedImage: string | null;
}

export interface TextCampaign {
    headline: string;
    body: string;
    cta: string; // Call to Action
}

export interface VoScriptState {
    prompt: string;
    generatedScript: string;
    isGenerating: boolean;
}

export interface GeneratedAudio {
    name: string;
    url: string; // Blob URL
}

// --- Composition Timeline Types ---

export type CanvasAspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

export const ASPECT_RATIO_DIMENSIONS: Record<CanvasAspectRatio, { width: number; height: number }> = {
    '16:9': { width: 1280, height: 720 },
    '9:16': { width: 720, height: 1280 },
    '1:1': { width: 1080, height: 1080 },
    '4:5': { width: 1080, height: 1350 },
};

export type OutputResolution = '720p' | '1080p';

export const RESOLUTION_DIMENSIONS: Record<OutputResolution, { width: number; height: number }> = {
    '720p': { width: 1280, height: 720 },
    '1080p': { width: 1920, height: 1080 },
};


export type ClipType = 'video' | 'audio' | 'text';
export type AnimationType = 'none' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right';

export interface Clip {
    id: string;
    type: ClipType;
    assetId: string; // Corresponds to the original asset URL or text ID
    track: 'video' | 'audio' | 'text';
    startTime: number; // in seconds
    duration: number; // in seconds
    layer: number; // z-index on the track
}

export interface VideoClip extends Clip {
    type: 'video';
    src: string;
    imageElement: HTMLImageElement;
    animation: AnimationType;
}

export interface AudioClip extends Clip {
    type: 'audio';
    src: string; // The blob URL
    name: string;
}

export interface TextClip extends Clip {
    type: 'text';
    text: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    textAlign: 'left' | 'center' | 'right';
    width: number;
    x: number;
    y: number;
}

export type TimelineClip = VideoClip | AudioClip | TextClip;