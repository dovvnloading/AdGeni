# Graphite-AdGeni

![Graphite-AdGeni Banner](https://placehold.co/1200x300/e5e7eb/1f2937?text=Graphite-AdGeni+AI+Advertising+Suite)

**© 2025 Matthew Robert Wesney. All Rights Reserved.**
**Unauthorized use, reproduction, or distribution is prohibited.**

---

## Overview

Graphite-AdGeni is an enterprise-grade, AI-powered advertising suite designed to streamline the creation of visual, textual, and auditory marketing assets. Built on the latest Google Gemini models, this application provides a unified workspace for creative professionals to generate product photography, packaging concepts, set designs, ad copy, and voiceovers, culminating in a timeline-based video composition tool.

The platform leverages a custom neumorphic design system to provide a tactile, focused user interface, integrating advanced generative capabilities directly into the creative workflow.

**Lead Developer:** Matthew Robert Wesney

## Key Features

### 1. Advanced Visual Generation
*   **Product & Scene Synthesis:** Utilizes `gemini-2.5-flash-image` to generate high-fidelity marketing visuals.
*   **Smart Mode:** A proprietary two-step generation process that creates separate "driver" images for the scene and the product before compositing them, ensuring higher consistency and control.
*   **Professional Photography Presets:** Extensive control over virtual camera parameters, including lens types (35mm to Telephoto), shot angles (Eye-level, Dutch angle), focus depth, and lighting setups (Rembrandt, Volumetric, Studio).
*   **Upscaling:** Integrated image enhancement to increase resolution and clarity of generated assets.

### 2. Specialized Design Modules
*   **Packaging Design Studio:** Dedicated interface for generating packaging concepts (boxes, bottles, pouches) with specific material textures and label styles.
*   **Set Design Studio:** Generates photorealistic background environments (infinity cycloramas, industrial lofts, nature scenes) to serve as backdrops for product placement.

### 3. Brand Identity Hub
*   **Centralized Guidelines:** Allows users to define core brand attributes including visual style, color palettes, and emotional mood.
*   **Contextual Injection:** These guidelines can be dynamically referenced across all generation modules to ensure brand consistency across different media types.

### 4. Ad Editor
*   **AI-Assisted Inpainting:** A canvas-based editor allowing users to annotate specific regions of an image with brushes, boxes, arrows, or text.
*   **Generative Editing:** Users can describe changes via text prompts, which the AI applies to the annotated regions while preserving the integrity of the original image.

### 5. Copywriting & Voiceover
*   **Multi-Platform Text Campaigns:** Generates targeted ad copy (headlines, body text, CTAs) optimized for specific platforms (Facebook, LinkedIn, Google Ads) and campaign goals.
*   **Script Generation:** AI-assisted scriptwriting based on product descriptions and brand tone.
*   **Text-to-Speech Synthesis:** Utilizes `gemini-2.5-flash-preview-tts` to generate broadcast-quality voiceovers with selectable voice profiles (e.g., Zephyr, Kore, Fenrir).

### 6. Video Composition & Export
*   **Timeline Editor:** A non-linear editing timeline to sequence generated images, text overlays, and audio tracks.
*   **Animation Engine:** Supports keyframe-like animations for static images (Zoom In/Out, Pan Left/Right).
*   **Format Control:** Configurable output settings for resolution (720p, 1080p) and aspect ratio (16:9, 9:16, 1:1, 4:5).
*   **Client-Side Rendering:** Exports final compositions to MP4 or WebM formats directly in the browser.

## Technical Architecture

Graphite-AdGeni is a Single Page Application (SPA) built with modern web technologies:

*   **Frontend Framework:** React 19 (TypeScript)
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS (Custom Neumorphic Design System)
*   **AI Integration:** Google GenAI SDK (`@google/genai`)
*   **Canvas Rendering:** Native HTML5 Canvas API for image manipulation and video rendering.
*   **State Management:** React Hooks and Context API.

### Supported Models
The application requires access to the following Google Gemini models:
*   `gemini-2.5-flash-image` (Image Generation & Editing)
*   `gemini-2.5-flash` (Text Generation & Logic)
*   `gemini-2.5-flash-preview-tts` (Text-to-Speech)

## Installation and Setup

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn
*   A valid Google Gemini API Key

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/dovvnloading/AdGeni.git
    cd AdGeni
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    The application expects the API key to be available via `process.env.API_KEY` or selected via the AI Studio window interface.

4.  **Start the development server:**
    ```bash
    npm run dev
    ```

5.  **Build for production:**
    ```bash
    npm run build
    ```

## Usage Guide

### 1. Generating Images
Navigate to the **Image Generation** tab. Upload a reference product image (optional). Select your desired camera, lighting, and style presets. Enable "Smart Mode" for complex compositions. Click "Generate" to create assets.

### 2. Defining Brand Guidelines
Navigate to the **Branding** tab. Input your brand's color palette, style description, and mood. In other tabs, select "Use Brand Guidelines" from the dropdown menus to apply these settings automatically.

### 3. Creating a Video Ad
1.  Generate necessary assets (Images in Image Gen tab, Audio in Voiceover tab, Text in Campaigns tab).
2.  Navigate to the **Composition** tab.
3.  Drag and drop assets from the library panel onto the timeline tracks (Video, Audio, Text).
4.  Adjust timing, duration, and apply animations via the properties panel.
5.  Select the desired output resolution and aspect ratio.
6.  Click "Export Video" to render and download the file.

## License

This project is proprietary software. All rights reserved.

## Contact

**Matthew Robert Wesney**
*   GitHub: [https://github.com/dovvnloading](https://github.com/dovvnloading)
*   Repository: [https://github.com/dovvnloading/AdGeni](https://github.com/dovvnloading/AdGeni)
