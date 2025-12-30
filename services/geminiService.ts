/**
 * © 2025 Matthew Robert Wesney. All Rights Reserved.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { ImageInput, TextCampaign, BrandGuidelines } from "../types";

// Helper to create a new GoogleGenAI instance. Called before each API call to use the latest key.
const getAiClient = () => {
    // CRITICAL: Only use localStorage. No process.env fallback to prevent crashes.
    const apiKey = localStorage.getItem('gemini_api_key');

    if (!apiKey) {
        throw new Error("API Key not found. Please set your Gemini API Key in the application settings.");
    }
    
    // Debug log to confirm key usage to the user (safely)
    console.log(`[AdGeni] Using API Key ending in: ...${apiKey.slice(-4)}`);
    
    return new GoogleGenAI({ apiKey });
};

// Utility to convert a file to an ImageInput object
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

const handleApiError = (e: unknown, context: string): Error => {
    console.error(`Error during ${context}:`, e);
    if (e instanceof Error) {
        // Specific check for "quota of 0" error, which indicates a project setup issue.
        if (e.message.includes('"limit: 0"') || e.message.includes('RESOURCE_EXHAUSTED')) {
            return new Error(
                `API Error (429): Your project's quota for this model appears to be 0. This is common for new projects.\n\n` +
                `To fix this, please ensure:\n` +
                `1. The 'Generative Language API' is enabled in your Google Cloud Console.\n` +
                `2. A valid billing account is linked to your project.`
            );
        }
        // Generic rate limit error for other 429 cases.
        if (e.message.includes('429')) {
            return new Error("Rate limit exceeded (429). Please wait a moment before trying again, or check your billing/quota in your Google Cloud project.");
        }
    }
    // Fallback for all other errors.
    return e instanceof Error ? e : new Error(`An unknown error occurred during ${context}.`);
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
                inlineData: { data: input.base64, mimeType: input.mimeType }
            }));
            parts.unshift(...imageParts);
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE] },
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        
        let errorMessage = "Image generation failed. The model did not return an image.";
        const feedback = response.promptFeedback;
        const finishReason = response.candidates?.[0]?.finishReason;
        
        if (feedback?.blockReason) {
            errorMessage += ` Reason: Request blocked (${feedback.blockReason}).`;
        } else if (finishReason && finishReason !== 'STOP') {
             errorMessage += ` Reason: Generation finished unexpectedly (${finishReason}).`;
        }
        
        throw new Error(errorMessage);
    };
    
    const imageUrls: string[] = [];
    for (let i = 0; i < count; i++) {
        try {
            const url = await generateSingleImage();
            imageUrls.push(url);
        } catch (e) {
            throw handleApiError(e, `image generation (${i + 1}/${count})`);
        }
    }
    
    return imageUrls;
};

export const generateAdImages = async (prompt: string, images: (File | ImageInput)[] = [], count: number = 4, model: string = 'gemini-2.5-flash-image'): Promise<string[]> => {
    const ai = getAiClient();
    try {
        if (model.startsWith('imagen') && images.length === 0) {
             const response = await ai.models.generateImages({
                model: model,
                prompt: prompt,
                config: { numberOfImages: count, aspectRatio: '1:1', outputMimeType: 'image/jpeg' },
             });
             return response.generatedImages.map((img: any) => `data:${img.image.mimeType || 'image/jpeg'};base64,${img.image.imageBytes}`);
        }

        const effectiveModel = (model.startsWith('imagen') && images.length > 0) ? 'gemini-2.5-flash-image' : model;
        return await generateGeminiImages(ai, prompt, images, count, effectiveModel);
    } catch (e) {
        throw handleApiError(e, 'generateAdImages');
    }
};


export const upscaleImage = async (image: ImageInput, model: string = 'gemini-2.5-flash-image'): Promise<string> => {
    const ai = getAiClient();
    try {
        const effectiveModel = model.startsWith('imagen') ? 'gemini-2.5-flash-image' : model;
        const prompt = "Please upscale this image to 4k resolution. Enhance the details, clarity, and sharpness without altering the original composition or subject matter.";

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: effectiveModel,
            contents: { parts: [{ inlineData: { data: image.base64, mimeType: image.mimeType } }, { text: prompt }] },
            config: { responseModalities: [Modality.IMAGE] },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("Upscaling failed. The model did not return an image.");
    } catch (e) {
        throw handleApiError(e, 'upscaleImage');
    }
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
    try {
        const finalTone = tone === 'use_brand_guidelines' ? `Use the following brand mood: "${brandGuidelines.mood}"` : `The tone should be: ${tone}.`;
        const systemInstruction = `You are a world-class advertising copywriter... Always generate 3 distinct variations.`;
        const prompt = `Please generate 3 ad copy variations for...`;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction,
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
                    },
                    required: ["campaigns"]
                }
            }
        });

        const jsonText = response.text;
        if (!jsonText) throw new Error("The AI returned an empty response.");
        const jsonResponse = JSON.parse(jsonText);
        return jsonResponse.campaigns || [];
    } catch (e) {
        if (e instanceof Error && e.message.includes("invalid format")) {
             throw new Error("The AI returned an invalid format. Please try again.");
        }
        throw handleApiError(e, 'generateTextCampaigns');
    }
};

export const generateVoScript = async (prompt: string, brandGuidelines?: BrandGuidelines, model: string = 'gemini-2.5-flash'): Promise<string> => {
    const ai = getAiClient();
    try {
        const systemInstruction = `You are an expert scriptwriter for advertisements... only the spoken text.`;
        const fullPrompt = `User Request: "${prompt}"...`;
        const response = await ai.models.generateContent({
            model: model,
            contents: fullPrompt,
            config: { systemInstruction }
        });
        return response.text;
    } catch (e) {
        throw handleApiError(e, 'generateVoScript');
    }
};


export const generateSpeech = async (script: string, voice: string): Promise<string> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: script }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("The AI did not return any audio data.");
        return base64Audio;
    } catch (e) {
        throw handleApiError(e, 'generateSpeech');
    }
};
