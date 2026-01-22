import { GoogleGenerativeAI } from "@google/generative-ai";

const CONFIG_SLUG = "config-api-keys";

// Fetch API Key from WordPress Config
// Fetch API Key from WordPress Config
// Fetch API Key (Hardcoded for testing as per user request to ensure it works)
export const getGoogleApiKey = async (): Promise<string | null> => {
    // User provided specific key to use
    return "AIzaSyDdsLw_A1aoC7xvnuSk-GgyUu59VzyNeQ4";
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
    // Combine prompts and enforce background removal instructions
    const backgroundInstruction = " CRITICAL: Generate the image with a TRANSPARENT background if possible, or a solid white background that is easy to remove. The subject must be strictly isolated. NO background elements.";
    const finalPrompt = stylePrompt.replace("{prompt}", prompt) + backgroundInstruction;

    // Prepare input parts
    const parts: any[] = [{ text: finalPrompt }];

    // Add reference images if provided
    if (referenceImages && referenceImages.length > 0) {
        for (const imgData of referenceImages) {
            const match = imgData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
            if (match) {
                parts.push({
                    inlineData: {
                        mimeType: match[1],
                        data: match[2]
                    }
                });
            }
        }
    }

    // Helper function to execute generation with Retry Logic
    const executeGeneration = async (modelName: string, retries = 3, delay = 1000) => {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                console.log(`Attempting generation with model: ${modelName} (Attempt ${attempt + 1}/${retries + 1})`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(parts);
                const response = await result.response;

                if (response.candidates && response.candidates[0].content.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        }
                        if (part.text) {
                            throw new Error(`Model Refusal (${modelName}): ${part.text}`);
                        }
                    }
                }
                throw new Error(`No image found in ${modelName} response.`);
            } catch (error: any) {
                const isRetryable = error.message?.includes("503") || error.message?.includes("overloaded") || error.code === 503;
                if (isRetryable && attempt < retries) {
                    console.warn(`Attempt ${attempt + 1} failed with 503/Overloaded. Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                    continue;
                }
                throw error; // Not retryable or max retries reached
            }
        }
        throw new Error(`Max retries exceeded for ${modelName}`);
    };

    try {
        // Try Primary: Gemini 2.5 Flash ("Regular Nano Banana") as requested
        return await executeGeneration("gemini-2.5-flash-image");
    } catch (error: any) {
        console.warn("Nano Banana (2.5) failed, attempting upgrade to Pro (3.0)...", error);

        // Fallback to Pro (3.0)
        try {
            return await executeGeneration("gemini-3-pro-image-preview");
        } catch (fallbackError: any) {
            console.error("Fallback Pro (3.0) also failed:", fallbackError);
            throw new Error(`Both 'Nano Banana' (2.5) and 'Nano Banana Pro' (3.0) failed. Last error: ${fallbackError.message}`);
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

    const modelName = "gemini-3-pro-image-preview"; // Use user's preferred model
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
        const result = await model.generateContent(parts);
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
