/**
 * © 2025 Matthew Robert Wesney. All Rights Reserved.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { ImageInput, TextCampaign, BrandGuidelines } from "../types";

// --- Centralized API Error Handler ---
function handleGoogleApiError(error: any): string {
    let detailedMessage = "An unexpected error occurred with the AI service.";
    let userAction = "Please try again later. If the problem persists, check your browser's developer console for more details.";

    if (error instanceof Error && error.message) {
        const errorMessage = error.message;
        // Attempt to find and parse a JSON object within the error string
        const jsonStartIndex = errorMessage.indexOf('{');
        if (jsonStartIndex !== -1) {
            try {
                const jsonString = errorMessage.substring(jsonStartIndex);
                const apiError = JSON.parse(jsonString);
                const status = apiError.error?.status;
                const message = apiError.error?.message || "No specific message provided.";

                if (status === "RESOURCE_EXHAUSTED") {
                    detailedMessage = "API Quota Exceeded.";
                    userAction = "Your project has run out of free tier quota or has hit a spending limit. This can happen even on the first request if the free tier is fully used. Please check your billing status and quota limits in your Google AI Studio dashboard.";
                    return `${detailedMessage} ${userAction}`;
                } 
                if (status === "PERMISSION_DENIED") {
                    detailedMessage = "API Permission Denied.";
                    userAction = "Your API key may be invalid, expired, or the 'Generative Language API' is not enabled for your project. Please verify your key and check your Google Cloud project settings.";
                    return `${detailedMessage} ${userAction}`;
                } 
                if (status === "INVALID_ARGUMENT") {
                     detailedMessage = "Invalid API Key or Request.";
                     userAction = "The API key appears to be invalid or malformed. Please ensure you have copied the entire key correctly. It should start with 'AIza...'.";
                     return `${detailedMessage} ${userAction}`;
                }
                
                // For other structured errors, be specific
                detailedMessage = `API Error (${status || 'Unknown Status'}): ${message}`;
                return detailedMessage;

            } catch (e) {
                // JSON parsing failed, fall back to raw message below.
            }
        }
        
        // Fallback for non-JSON errors or parsing failures
        if (errorMessage.includes("API key not valid")) {
             detailedMessage = "Invalid API Key Provided.";
             userAction = "Please check that your API key is correct and has not expired.";
             return `${detailedMessage} ${userAction}`;
        }
        
        // Return the raw error if no specific rules match
        return errorMessage;
    }

    return detailedMessage;
}


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

        // Add image parts before the text part so the prompt can refer to them
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
        
        let errorMessage = "Image generation failed. The model did not return an image.";
        throw new Error(errorMessage);
    };
    
    // Execute requests sequentially
    const imageUrls: string[] = [];
    for (let i = 0; i < count; i++) {
        try {
            const url = await generateSingleImage();
            imageUrls.push(url);
        } catch (e) {
            console.error(`Error generating image ${i + 1}/${count}:`, e);
            throw new Error(handleGoogleApiError(e));
        }
    }
    
    return imageUrls;
};

export const generateAdImages = async (prompt: string, images: (File | ImageInput)[] = [], count: number = 4, model: string = 'imagen-3.0-generate-001'): Promise<string[]> => {
    const ai = getAiClient();

    // Prefer Imagen if selected and appropriate (no input images for now, as T2I is standard)
    if (model.startsWith('imagen') && images.length === 0) {
         try {
            const response = await ai.models.generateImages({
                model: model,
                prompt: prompt,
                config: {
                    numberOfImages: count,
                    aspectRatio: '1:1',
                    outputMimeType: 'image/jpeg',
                },
            });

            // Map Imagen response to array of data URLs
            return response.generatedImages.map((img: any) => `data:${img.image.mimeType || 'image/jpeg'};base64,${img.image.imageBytes}`);
         } catch(e) {
             throw new Error(handleGoogleApiError(e));
         }
    }

    // Fallback logic sanitized: Use a real model (gemini-1.5-pro) instead of hallucinated '2.5'.
    // Note: Gemini 1.5 Pro may not output images depending on region/access.
    const effectiveModel = (model.startsWith('imagen') && images.length > 0) 
        ? 'gemini-1.5-pro' 
        : model;

    return generateGeminiImages(ai, prompt, images, count, effectiveModel);
};


export const upscaleImage = async (image: ImageInput, model: string = 'imagen-3.0-generate-001'): Promise<string> => {
    const ai = getAiClient();
    
    // Upscaling is currently an experimental feature often requiring specific models.
    // Defaulting to a high-capacity model if 'imagen' is passed (since Imagen 3 is T2I).
    const effectiveModel = model.startsWith('imagen') ? 'gemini-1.5-pro' : model;

    const prompt = "Please upscale this image to 4k resolution. Enhance the details, clarity, and sharpness without altering the original composition or subject matter.";

    const imagePart = {
        inlineData: {
            data: image.base64,
            mimeType: image.mimeType,
        }
    };
    const textPart = { text: prompt };

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: effectiveModel,
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("Upscaling failed: The model did not return an image.");

    } catch (e) {
        console.error("Upscale Error:", e);
        throw new Error(handleGoogleApiError(e));
    }
};


export const generateTextCampaigns = async (
    productDescription: string,
    targetAudience: string,
    campaignGoal: string,
    platform: string,
    tone: string,
    brandGuidelines: BrandGuidelines,
    model: string = 'gemini-1.5-flash'
): Promise<TextCampaign[]> => {
    const ai = getAiClient();
    
    const finalTone = tone === 'use_brand_guidelines' 
        ? `Use the following brand mood: "${brandGuidelines.mood}"`
        : `The tone should be: ${tone}.`;

    const systemInstruction = `You are a world-class advertising copywriter. Your task is to generate compelling ad copy based on the user's specifications. 
    You must adhere to the specified platform, goal, and tone. The output must be in JSON format, following the provided schema precisely.
    Always generate 3 distinct variations.`;
    
    const prompt = `
        Please generate 3 ad copy variations for the following campaign:

        - **Product/Service:** ${productDescription}
        - **Target Audience:** ${targetAudience}
        - **Campaign Goal:** ${campaignGoal}
        - **Platform:** ${platform}
        - **Tone of Voice:** ${finalTone}

        For each variation, provide a headline, body text, and a call to action.
    `;
    try {
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
                                    headline: { type: Type.STRING, description: 'A short, catchy headline for the ad.' },
                                    body: { type: Type.STRING, description: 'The main body text of the ad.' },
                                    cta: { type: Type.STRING, description: 'A clear call to action, e.g., "Shop Now", "Learn More".' }
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
        if (!jsonText) {
            throw new Error("The AI returned an empty response.");
        }
        const jsonResponse = JSON.parse(jsonText);
        return jsonResponse.campaigns || [];

    } catch (e) {
        console.error("Failed to generate or parse text campaigns:", e);
        throw new Error(handleGoogleApiError(e));
    }
};

export const generateVoScript = async (prompt: string, brandGuidelines?: BrandGuidelines, model: string = 'gemini-1.5-flash'): Promise<string> => {
    const ai = getAiClient();

    const systemInstruction = `You are an expert scriptwriter for advertisements. Your task is to write a short, compelling ad script based on the user's request.
    If the user has provided brand guidelines, subtly incorporate their mood and style into the script.
    The script should be concise and ready for a voiceover. Do not include scene directions or camera movements, only the spoken text.`;
    
    const fullPrompt = `
        User Request: "${prompt}"

        Brand Guidelines for reference (if available):
        - Style: ${brandGuidelines?.styles || 'Not specified'}
        - Mood: ${brandGuidelines?.mood || 'Not specified'}
        - Colors (for thematic inspiration): ${brandGuidelines?.color || 'Not specified'}

        Please generate the voiceover script.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: fullPrompt,
            config: {
                systemInstruction,
            }
        });
        return response.text;
    } catch (e) {
        console.error("Failed to generate VO script:", e);
        throw new Error(handleGoogleApiError(e));
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
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!base64Audio) {
            throw new Error("The AI did not return any audio data. This might be due to a safety policy or an empty response.");
        }

        return base64Audio;
    } catch (e) {
        console.error("Failed to generate speech:", e);
        throw new Error(handleGoogleApiError(e));
    }
};
