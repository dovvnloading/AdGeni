/**
 * © 2025 Matthew Robert Wesney. All Rights Reserved.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { ImageInput, TextCampaign, BrandGuidelines } from "../types";

// Helper to create a new GoogleGenAI instance. Called before each API call to use the latest key.
const getAiClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
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

export const generateAdImages = async (prompt: string, images: (File | ImageInput)[] = [], count: number = 4): Promise<string[]> => {
    const ai = getAiClient();

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
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        // Use optional chaining to safely access nested properties and avoid the crash
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        
        // If we reach here, no image was returned. Provide a more detailed error.
        let errorMessage = "Image generation failed. The model did not return an image.";
        const feedback = response.promptFeedback;
        const finishReason = response.candidates?.[0]?.finishReason;
        
        if (feedback?.blockReason) {
            errorMessage += ` Reason: Request blocked (${feedback.blockReason}).`;
            if (feedback.blockReasonMessage) {
                errorMessage += ` Message: ${feedback.blockReasonMessage}`;
            }
        } else if (finishReason && finishReason !== 'STOP') {
             errorMessage += ` Reason: Generation finished unexpectedly (${finishReason}).`;
        }
        
        const safetyRatings = feedback?.safetyRatings || response.candidates?.[0]?.safetyRatings;
        if (safetyRatings && safetyRatings.length > 0) {
            const concerningRatings = safetyRatings.filter(r => r.probability !== 'NEGLIGIBLE' && r.probability !== 'LOW').map(r => `${r.category}: ${r.probability}`).join(', ');
            if (concerningRatings) {
                 errorMessage += ` Detected safety concerns: ${concerningRatings}.`;
            }
        }
        
        throw new Error(errorMessage);
    };
    
    // Generate images in parallel based on the count parameter
    const imagePromises = Array(count).fill(0).map(() => generateSingleImage());

    const imageUrls = await Promise.all(imagePromises);
    return imageUrls;
};


export const upscaleImage = async (image: ImageInput): Promise<string> => {
    const ai = getAiClient();
    const prompt = "Please upscale this image to 4k resolution. Enhance the details, clarity, and sharpness without altering the original composition or subject matter.";

    const imagePart = {
        inlineData: {
            data: image.base64,
            mimeType: image.mimeType,
        }
    };
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
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

    // Add robust error handling similar to generateAdImages
    let errorMessage = "Image upscaling failed. The model did not return an image.";
    const feedback = response.promptFeedback;
    const finishReason = response.candidates?.[0]?.finishReason;
    
    if (feedback?.blockReason) {
        errorMessage += ` Reason: Request blocked (${feedback.blockReason}).`;
        if (feedback.blockReasonMessage) {
            errorMessage += ` Message: ${feedback.blockReasonMessage}`;
        }
    } else if (finishReason && finishReason !== 'STOP') {
         errorMessage += ` Reason: Generation finished unexpectedly (${finishReason}).`;
    }
    
    const safetyRatings = feedback?.safetyRatings || response.candidates?.[0]?.safetyRatings;
    if (safetyRatings && safetyRatings.length > 0) {
        const concerningRatings = safetyRatings.filter(r => r.probability !== 'NEGLIGIBLE' && r.probability !== 'LOW').map(r => `${r.category}: ${r.probability}`).join(', ');
        if (concerningRatings) {
             errorMessage += ` Detected safety concerns: ${concerningRatings}.`;
        }
    }
    
    throw new Error(errorMessage);
};


export const generateTextCampaigns = async (
    productDescription: string,
    targetAudience: string,
    campaignGoal: string,
    platform: string,
    tone: string,
    brandGuidelines: BrandGuidelines
): Promise<TextCampaign[]> => {
    const ai = getAiClient();
    
    // Determine if we should use brand guidelines for the tone
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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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

    try {
        // FIX: Use the recommended `response.text` accessor to get the text from the response.
        const jsonText = response.text;
        if (!jsonText) {
            throw new Error("The AI returned an empty response.");
        }
        const jsonResponse = JSON.parse(jsonText);
        return jsonResponse.campaigns || [];
    } catch (e) {
        console.error("Failed to parse JSON response from Gemini:", response.text, e);
        throw new Error("The AI returned an invalid format. Please try again.");
    }
};

export const generateVoScript = async (prompt: string, brandGuidelines?: BrandGuidelines): Promise<string> => {
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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
            systemInstruction,
        }
    });

    return response.text;
};


export const generateSpeech = async (script: string, voice: string): Promise<string> => {
    const ai = getAiClient();

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
};