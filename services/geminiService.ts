/**
 * © 2025 Matthew Robert Wesney. All Rights Reserved.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { ImageInput, TextCampaign, BrandGuidelines } from "../types";

// Helper to create a new GoogleGenAI instance. Called before each API call to use the latest key.
const getAiClient = () => {
    // CRITICAL FIX: Only check LocalStorage. Removed process.env to prevent crashes.
    const apiKey = localStorage.getItem('gemini_api_key');

    if (!apiKey) {
        throw new Error("API Key not found. Please set your Gemini API Key in the application settings.");
    }
    return new GoogleGenAI({ apiKey });
};

// ... [The rest of the file remains exactly the same as previous versions] ...
// I will provide the rest of the utility functions to ensure the file is complete.

const fileToImageInput = (file: File): Promise<ImageInput> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve({
                base64: result.split(',')[1],
                mimeType: file.type,
            });
        };
        reader.onerror = error => reject(error);
    });
};

const generateGeminiImages = async (ai: any, prompt: string, images: (File | ImageInput)[], count: number, model: string): Promise<string[]> => {
    const imageInputs: ImageInput[] = [];
    for (const img of images) {
        if (img instanceof File) {
            imageInputs.push(await fileToImageInput(img));
        } else {
            imageInputs.push(img);
        }
    }

    const generateSingleImage = async (): Promise<string> => {
        const parts: any[] = [{ text: prompt }];

        if (imageInputs.length > 0) {
            const imageParts = imageInputs.map(input => ({
                inlineData: {
                    data: input.base64,
                    mimeType: input.mimeType,
                }
            }));
            parts.unshift(...imageParts);
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        
        let errorMessage = "Image generation failed.";
        throw new Error(errorMessage);
    };
    
    const imagePromises = Array(count).fill(0).map(() => generateSingleImage());
    return await Promise.all(imagePromises);
};

export const generateAdImages = async (prompt: string, images: (File | ImageInput)[] = [], count: number = 4, model: string = 'gemini-2.5-flash-image'): Promise<string[]> => {
    const ai = getAiClient();
    if (model.startsWith('imagen') && images.length === 0) {
         const response = await ai.models.generateImages({
            model: model,
            prompt: prompt,
            config: { numberOfImages: count, aspectRatio: '1:1', outputMimeType: 'image/jpeg' },
         });
         return response.generatedImages.map((img: any) => `data:${img.image.mimeType || 'image/jpeg'};base64,${img.image.imageBytes}`);
    }
    const effectiveModel = (model.startsWith('imagen') && images.length > 0) ? 'gemini-2.5-flash-image' : model;
    return generateGeminiImages(ai, prompt, images, count, effectiveModel);
};

export const upscaleImage = async (image: ImageInput, model: string = 'gemini-2.5-flash-image'): Promise<string> => {
    const ai = getAiClient();
    const effectiveModel = model.startsWith('imagen') ? 'gemini-2.5-flash-image' : model;
    const prompt = "Upscale this image to 4k resolution.";
    const imagePart = { inlineData: { data: image.base64, mimeType: image.mimeType } };
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: effectiveModel,
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("Upscaling failed.");
};

export const generateTextCampaigns = async (
    productDescription: string,
    targetAudience: string,
    campaignGoal: string,
    platform: string,
    tone: string,
    brandGuidelines: BrandGuidelines,
    model: string = 'gemini-2.5-flash'
): Promise<TextCampaign[]> => {
    const ai = getAiClient();
    const finalTone = tone === 'use_brand_guidelines' ? `Use mood: "${brandGuidelines.mood}"` : `Tone: ${tone}.`;
    const prompt = `Generate 3 ad copy variations for: Product: ${productDescription}, Audience: ${targetAudience}, Goal: ${campaignGoal}, Platform: ${platform}, Tone: ${finalTone}. Return JSON with "campaigns" array containing "headline", "body", "cta".`;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    campaigns: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                headline: { type: Type.STRING },
                                body: { type: Type.STRING },
                                cta: { type: Type.STRING }
                            },
                            required: ["headline", "body", "cta"]
                        }
                    }
                }
            }
        }
    });

    try {
        return JSON.parse(response.text!).campaigns || [];
    } catch (e) {
        throw new Error("Failed to parse AI response.");
    }
};

export const generateVoScript = async (prompt: string, brandGuidelines?: BrandGuidelines, model: string = 'gemini-2.5-flash'): Promise<string> => {
    const ai = getAiClient();
    const fullPrompt = `Write a VO script for: "${prompt}". Style: ${brandGuidelines?.styles}. Mood: ${brandGuidelines?.mood}.`;
    const response = await ai.models.generateContent({ model: model, contents: fullPrompt });
    return response.text!;
};

export const generateSpeech = async (script: string, voice: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: script }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio returned.");
    return base64Audio;
};
