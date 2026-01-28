import { GoogleGenerativeAI } from "@google/generative-ai";

// Fetch API Key from environment variable
export const getGoogleApiKey = async (): Promise<string | null> => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("VITE_GOOGLE_API_KEY not set in .env");
        return null;
    }
    return apiKey;
};

// Initialize Gemini Client
const initGemini = async () => {
    const apiKey = await getGoogleApiKey();
    if (!apiKey) {
        throw new Error("Google API Key not configured. Please set it in Admin > Settings.");
    }
    return new GoogleGenerativeAI(apiKey);
};

// Translate / Refine Prompt
export const refinePrompt = async (userPrompt: string): Promise<string> => {
    const genAI = await initGemini();
    // Use gemini-2.5-flash as requested by user
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const instructions = `
    You are a professional prompt engineer. 
    1. Translate the following user prompt from Croatian (or any language) to English.
    2. Enhance it slightly for an image generator, keeping the original intent but adding clarity.
    3. Return ONLY the final English prompt text. No explanations.
    
    User Prompt: "${userPrompt}"
    `;

    const result = await model.generateContent(instructions);
    const response = await result.response;
    return response.text().trim();
};

// Generate Image (Simulating via Text-to-Image if available or using specific model)
// Note: As of late 2024, the primary JS SDK for Gemini might not fully expose Imagen 3 directly via the same class structure 
// depending on the release. 
// However, assuming the user wants "Gemini to do it all", we will use the best available model.
// If the standard SDK doesn't support image generation directly yet, we might need to use the REST API with the same key.
// **CRITICAL**: For this implementation, we will try to use a direct fetch to the Google REST API for Imagen if the SDK is text-only,
// OR use a multimodal model if it supports outputting images (rare).
// 
// UPDATE: Google's "Imagen on Vertex AI" is standard, but "Gemini API" (AI Studio) recently added image generation capabilities.
// We will implement a direct REST call to the `models/imagen-3.0-generate-001:predict` or similar endpoint if SDK fails, 
// BUT for simplicity and standardized access, let's try the SDK or a direct fetch to the generous beta endpoint.

// Generate Image using Gemini / Imagen 3.0 (Nano Banana Pro)
// This model native supports text + reference images -> image generation
// Generate Image using Gemini 3 Pro Image (Nano Banana Pro) with fallback to 2.5 (Nano Banana)
export const generateImageWithGemini = async (prompt: string, stylePrompt: string, referenceImages?: string[]): Promise<string> => {
    const apiKey = await getGoogleApiKey();
    if (!apiKey) throw new Error("API Key missing");

    const genAI = new GoogleGenerativeAI(apiKey);

    // Combine prompts
    const finalPrompt = stylePrompt.replace("{prompt}", prompt);

    // Prepare input parts - Start with the text instructions
    const parts: any[] = [{ text: finalPrompt }];
    console.log("📝 Main prompt added to Gemini request parts.");

    // Add reference images with explicit labels so the model can correlate with "IMAGE 1", "IMAGE 2" etc.
    if (referenceImages && referenceImages.length > 0) {
        console.log(`📡 Adding ${referenceImages.length} reference images to Gemini multipart request...`);
        referenceImages.forEach((imgData, index) => {
            const match = imgData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
            if (match) {
                // Add a text label before each image part
                parts.push({ text: `CHARACTER REFERENCE IMAGE ${index + 1}:` });
                parts.push({
                    inlineData: {
                        mimeType: match[1],
                        data: match[2]
                    }
                });
            } else {
                console.warn(`⚠️ Reference image ${index + 1} did not match expected base64 format!`);
            }
        });

        // Final emphasis after images
        parts.push({ text: `FINAL INSTRUCTION: Use the character provided in the images above EXACTLY. Match face, colors, and features from IMAGE 1.` });
    } else {
        console.warn("⚠️ No reference images provided to generateImageWithGemini!");
    }

    // Helper function to execute generation with Retry Logic
    const executeGeneration = async (modelName: string, retries = 3, delay = 1000) => {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                console.log(`Attempting generation with model: ${modelName} (Attempt ${attempt + 1}/${retries + 1})`);

                // Configure model with image generation capability
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        responseModalities: ["TEXT", "IMAGE"],
                    } as any
                });

                const result = await model.generateContent(parts as any);
                const response = await result.response;

                if (response.candidates && response.candidates[0].content.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        }
                        if (part.text) {
                            console.warn(`Model returned text instead of image (${modelName}):`, part.text);
                            // If text is returned, it might be a refusal or a description.
                            // We only throw if it's the last attempt or a hard error.
                        }
                    }
                }
                throw new Error(`No image found in ${modelName} response.`);
            } catch (error: any) {
                const isRetryable = error.message?.includes("503") || error.message?.includes("overloaded") || error.code === 503;
                if (isRetryable && attempt < retries) {
                    console.warn(`Attempt ${attempt + 1} failed with 503/Overloaded. Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2;
                    continue;
                }
                throw error;
            }
        }
        throw new Error(`Max retries exceeded for ${modelName}`);
    };

    try {
        // Try Primary: Nano Banana Pro (Gemini 3 Pro Image)
        return await executeGeneration("gemini-3-pro-image-preview");
    } catch (error: any) {
        console.warn("Nano Banana Pro failed, attempting fallback...", error);

        try {
            // Fallback 1: Nano Banana (Gemini 2.5 Flash Image)
            return await executeGeneration("gemini-2.5-flash-image");
        } catch (fallbackError: any) {
            console.warn("Nano Banana failed, attempting stable fallback...", fallbackError);

            try {
                // Fallback 2: Stable multimodal model (Gemini 1.5 Pro)
                // Note: Image gen support varies by region/tier for 1.5 Pro
                return await executeGeneration("gemini-1.5-pro-002");
            } catch (stableError: any) {
                console.error("All generation models failed:", stableError);
                throw new Error(`Image generation failed across all models. Error: ${stableError.message}`);
            }
        }
    }
};

// Remove Background using Gemini (Simulated via image editing prompt)
export const removeBackgroundWithGemini = async (base64Image: string): Promise<string> => {
    const apiKey = await getGoogleApiKey();
    if (!apiKey) throw new Error("API Key missing");

    const genAI = new GoogleGenerativeAI(apiKey);

    // Extract mime type and data
    const match = base64Image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid image format");

    const mimeType = match[1];
    const data = match[2];

    const modelName = "gemini-3-pro-image-preview";
    const model = genAI.getGenerativeModel({ model: modelName });

    console.log("Requesting background removal from Gemini...");

    const prompt = "Remove the background from this image. The output must be the SAME subject but with a transparent background. Strictly isolated.";

    // Prepare input: Text + Image
    const parts = [
        { text: prompt },
        {
            inlineData: {
                mimeType,
                data
            }
        }
    ];

    try {
        const result = await model.generateContent(parts as any);
        const response = await result.response;

        // Parse response for image
        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("Gemini returned no image content for background removal.");
    } catch (error: any) {
        console.error("Background removal failed:", error);
        // Fallback? Maybe return original if failed so flow doesn't break, or throw.
        // Let's throw so user knows.
        throw new Error(`Background removal failed: ${error.message || error}`);
    }
};
