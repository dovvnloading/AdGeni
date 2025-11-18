<p align="center">
  <a href="https://dovvnloading.github.io/AdGeni/">
    <strong>▶ Website </strong>
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-Apache_2.0-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Open%20Source-0f766e?style=for-the-badge" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-38bdf8?style=for-the-badge&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Gemini-2.5-4285F4?style=for-the-badge&logo=google" />
  <img src="https://img.shields.io/badge/Models-Flash%20%7C%20Flash--Image%20%7C%20TTS-1d4ed8?style=for-the-badge" />
  <img src="https://img.shields.io/badge/GenAI-SDK-16a34a?style=for-the-badge&logo=google" />
</p>

# Graphite-AdGeni  

## Overview

Graphite-AdGeni is an open-source, AI-powered advertising suite for generating complete marketing assets:  
product photography, packaging concepts, set designs, ad copy, voiceovers, and export-ready video compositions.

Built with **React 19**, **TypeScript**, **Tailwind**, and the **Google Gemini 2.5** models.

---

## Feature Gallery

A visual overview of Graphite-AdGeni’s major tools and creative workflows.

<table>
  <tr>
    <td align="center">
      <strong>Voiceover Script</strong><br>
      <img src="https://github.com/user-attachments/assets/f27cd76f-d2c6-4398-986b-88d9c7bc89a4" width="100%" />
    </td>
    <td align="center">
      <strong>Text Ad Campaign</strong><br>
      <img src="https://github.com/user-attachments/assets/9df8e663-a90c-4848-a8db-110ed827a692" width="100%" />
    </td>
    <td align="center">
      <strong>Set Design</strong><br>
      <img src="https://github.com/user-attachments/assets/f1374f41-f179-42f0-93ba-69bd3f59706d" width="100%" />
    </td>
  </tr>

  <tr>
    <td align="center">
      <strong>Packaging Editor</strong><br>
      <img src="https://github.com/user-attachments/assets/cb219433-b5cb-4478-a3f2-f92b9ed88ec6" width="100%" />
    </td>
    <td align="center">
      <strong>Package Design</strong><br>
      <img src="https://github.com/user-attachments/assets/c9e73623-614e-4491-9e9e-9f400dee0285" width="100%" />
    </td>
    <td align="center">
      <strong>Generated Preview</strong><br>
      <img src="https://github.com/user-attachments/assets/c11f4af4-c7ad-4c6e-8756-c6c99bb045b6" width="100%" />
    </td>
  </tr>

  <tr>
    <td align="center">
      <strong>Composition Workspace</strong><br>
      <img src="https://github.com/user-attachments/assets/6e87e6ef-6229-4734-983d-ab408dd7edd3" width="100%" />
    </td>
    <td align="center">
      <strong>Brand Identity</strong><br>
      <img src="https://github.com/user-attachments/assets/1e527bcb-5c97-4dff-b4ee-4ee436fbdda6" width="100%" />
    </td>
    <td align="center">
      <strong>Ad Generation</strong><br>
      <img src="https://github.com/user-attachments/assets/ef152382-d876-4c3b-a09e-7151dde0704c" width="100%" />
    </td>
  </tr>
</table>




# Key Features

## 1. Advanced Visual Generation
- Product & Scene synthesis via `gemini-2.5-flash-image`
- Smart Mode (two-stage composition using driver images)
- Professional virtual photography controls
- Built-in upscaling

---

## 2. Specialized Design Modules
### Packaging Design Studio
Generate boxes, bottles, pouches, and label concepts.

### Set Design Studio
Create photorealistic environments:
- Cycloramas  
- Industrial lofts  
- Nature scenes  

---

## 3. Brand Identity Hub
Centralized brand palette, tone, and styling  
applied across all generation modules.

---

## 4. Ad Editor
- AI-assisted inpainting  
- Annotation tools  
- Text-driven region editing  

---

## 5. Copywriting & Voiceover
- Multi-platform ad copy  
- Script generation  
- High-quality TTS via `gemini-2.5-flash-preview-tts`  

---

## 6. Video Composition & Export
- Non-linear timeline  
- Keyframe-style animations  
- 720p & 1080p output  
- Browser-only MP4 / WebM rendering  

---

# Technical Architecture

- **React 19 SPA**
- **Vite** build system  
- **TailwindCSS** custom neumorphic UI  
- **Google GenAI SDK** integration  
- **HTML5 Canvas** video compositor  
- State: React Hooks + Context API  

---

# Supported Models
- `gemini-2.5-flash-image`
- `gemini-2.5-flash`
- `gemini-2.5-flash-preview-tts`

---

# Installation & Setup

## Prerequisites
- Node.js 18+  
- npm / yarn  
- A **Gemini API Key** (user-provided)

## Clone
```bash
git clone https://github.com/dovvnloading/AdGeni.git
cd AdGeni
````

## Install

```bash
npm install
```

## Start Dev Server

```bash
npm run dev
```

## Build

```bash
npm run build
```

---

# Usage

## 1. Generating Images

* Open **Image Generation**
* Configure camera/lighting presets
* (Optional) Upload reference
* Enable **Smart Mode**
* Generate

## 2. Brand Guidelines

Set palette + tone in **Branding** and enable
**Use Brand Guidelines** in other modules.

## 3. Video Ads

* Generate images, audio, text
* Drag to timeline
* Edit timing + animations
* Export to video

---

# License

This project is licensed under the **Apache License 2.0**.

You **must** retain attribution:
**© 2025 Matthew Robert Wesney**

See the `LICENSE` file for details.

---

# Credits

* **Matthew Robert Wesney** – creator & lead developer
* Google Gemini team — generative models
* React / Vite / Tailwind communities

