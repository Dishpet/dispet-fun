import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userPrompt, style, characterImages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Translate Croatian user prompt to English
    console.log('Translating user prompt from Croatian to English...');
    const translationResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a translator. Translate the following Croatian text to English. Only return the translated text, nothing else. If the text is already in English, return it as is.'
          },
          {
            role: 'user',
            content: userPrompt
          }
        ]
      }),
    });

    let translatedPrompt = userPrompt; // Fallback to original if translation fails
    if (translationResponse.ok) {
      const translationData = await translationResponse.json();
      translatedPrompt = translationData.choices?.[0]?.message?.content?.trim() || userPrompt;
      console.log('Original prompt:', userPrompt);
      console.log('Translated prompt:', translatedPrompt);
    } else {
      console.warn('Translation failed, using original prompt');
    }

    // Map style names to their prompts
    const stylePrompts: Record<string, string> = {
      synthwave: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, neon gradients ON THE CHARACTER ONLY, retro 80s colors, gridlines, glowing geometric fragments, and synthwave sun elements.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have bold neon edge lighting and strong outlines to separate clearly from the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics similar to premium streetwear, neon-retro artwork, or modern synthwave poster design.\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",
      gta: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, flat comic-cell shading, sharp color blocks, and minimal background elements inspired by GTA loading screen artwork.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have thick black outlines and strong color separation to stand out clearly from the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics similar to premium streetwear or stylized GTA poster graphics.\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",

      cyberpunk: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, holographic glows ON THE CHARACTER, neon lighting, electric fragments, cybernetic accents, and futuristic color palettes.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have bright neon edge lighting and strong glowing outlines to separate clearly from the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics similar to futuristic streetwear or modern neon cyberpunk posters.\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",

      cartoon: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold black outlines (3-4px thick), playful cartoon features, graffiti splashes, fun geometric fragments, and colorful dynamic highlights.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have thick black outlines and strong color separation to pop off the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics similar to premium mascot logos or modern cartoon streetwear graphics.\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",

      retro: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, muted retro color palettes, halftone textures ON THE CHARACTER, and vintage geometric fragments.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have clear outlines and distinct color separation from the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics inspired by classic vintage posters, ads and retro graphic design elements.\\n\\nRETRO / VINTAGE STYLE\\n\\nDesign requirements:\\n• SQUARE (1:1)\\n• Print-ready, high-resolution vector-like finish\\n• Central figure with dynamic depth\\n• Retro halftones, muted colors, vintage poster shapes and graphic design elements\\n• Balanced color blocking and strong contrast\\n• Clean separation between foreground and background\\n• PURE BLACK BACKGROUND ONLY - NO GRADIENTS\\n• No random artifacts, no borders, no watermarks\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",

      inkpunk: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, aggressive ink strokes, splashes, neon drips ON THE CHARACTER, expressive brush fragments, and chaotic graffiti elements.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have strong ink outlines and dramatic color separation to stand out from the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics inspired by expressive inkpunk and street-art fusion posters.\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",

      fantasy: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, magical glows ON THE CHARACTER, enchanted particles, ornate fantasy fragments, and dramatic lighting.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have bright magical edge lighting and strong outlines to separate clearly from the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics similar to heroic fantasy posters and RPG character art.\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",

      "abstract-geometry": "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, abstract geometric fragments AROUND THE CHARACTER, sharp angular shards, layered polygonal forms, floating particles, and dynamic composition.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have thick outlines and the geometric shapes should have strong color separation to create clear depth layers against the black background.\\n\\nThe design must focus on strong abstract geometry: triangles, rectangles, splinters, clusters, explosive directional shapes, and overlapping layers that create motion and depth behind the character.\\n\\nEnsure the illustration has a clear silhouette and a bold, distinct sticker-like cut-out shape, with crisp edge separation between the donkey and the geometric background.\\n\\nUse balanced color blocking, strong contrast, and a professional streetwear / modern graphic-art aesthetic.\\n\\nABSTRACT SHAPES & GEOMETRY STYLE\\n\\nDesign requirements:\\n• SQUARE (1:1)\\n• Print-ready, high-resolution vector-like finish\\n• Central figure with dynamic depth\\n• Abstract geometric fragments, shards, and layered shapes\\n• Balanced color blocking and strong contrast\\n• Clean separation between foreground and background\\n• PURE BLACK BACKGROUND ONLY - NO GRADIENTS\\n• No random artifacts, no borders, no watermarks\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",

      training: "Create a cute, high-quality 3D render of Roko the donkey performing the following exercise: {prompt}. Roko should be wearing his sports jersey (as shown in the reference images). The character should look energetic, happy, and encouraging for children. The style should be like a high-end animated movie character.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR with NO GRADIENTS. Keep the background completely clean and simple. Ensure the pose is clear and easy to understand as a demonstration of the exercise.\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT."
    };

    const stylePrompt = stylePrompts[style] || stylePrompts.cartoon;
    const finalPrompt = stylePrompt.replace('{prompt}', translatedPrompt);

    // Build the content array with text prompt and reference images
    const contentParts: any[] = [
      {
        type: "text",
        text: finalPrompt
      }
    ];

    // Add character reference images
    if (characterImages && characterImages.length > 0) {
      characterImages.forEach((imgData: string) => {
        contentParts.push({
          type: "image_url",
          image_url: {
            url: imgData
          }
        });
      });
    }

    console.log('Generating image with Lovable AI...');

    // Call Lovable AI Gateway with image generation model
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: contentParts
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('AI Gateway response received');

    // Extract generated image from response
    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      console.error('Response structure:', JSON.stringify(data, null, 2));
      throw new Error('No image generated in response');
    }

    // --- Background Removal Integration DISABLED ---
    // Since we want black backgrounds, we'll skip the background removal step
    // and return the generated image directly
    console.log('Background removal disabled - returning generated image with black background');
    
    // Verify that we have a valid image URL before returning
    if (!generatedImage) {
      throw new Error('Generated image URL is missing');
    }
    
    console.log('Returning image with URL:', generatedImage);
    
    return new Response(
      JSON.stringify({ image: generatedImage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

    /*
    // Original background removal code (commented out)
    console.log('Removing background with Replicate...');
    const REPLICATE_API_TOKEN = "r8_Aw8OWVu7EnkkgvK7fRBew0fQR2Avm360IwT0M"; // User provided key

    // Fetch the image and convert to base64 to avoid URL accessibility issues with Replicate
    console.log('Downloading generated image for background removal...');
    const imageResponse = await fetch(generatedImage);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download generated image: ${imageResponse.statusText}`);
    }
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const base64 = encode(imageArrayBuffer);
    const dataUri = `data:${imageResponse.headers.get('content-type') || 'image/png'};base64,${base64}`;

    const rembgResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
        input: {
          image: dataUri,
        },
      }),
    });

    if (!rembgResponse.ok) {
      const errorText = await rembgResponse.text();
      console.error("Replicate API error:", rembgResponse.status, errorText);
      // Fallback to original image if background removal fails, or throw error?
      // Let's return original image but log error to avoid breaking flow completely
      return new Response(
        JSON.stringify({ image: generatedImage, warning: "Background removal failed" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rembgData = await rembgResponse.json();
    const predictionId = rembgData.id;
    let processedImage = null;

    // Poll for completion
    let attempts = 0;
    while (attempts < 30) { // Timeout after ~30-60 seconds
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        },
      });

      if (!statusResponse.ok) break;

      const statusData = await statusResponse.json();
      if (statusData.status === "succeeded") {
        processedImage = statusData.output;
        break;
      } else if (statusData.status === "failed" || statusData.status === "canceled") {
        console.error("Background removal failed:", statusData.error);
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
      attempts++;
    }

    if (!processedImage) {
      console.warn("Background removal timed out or failed, returning original");
      processedImage = generatedImage;
    }

    return new Response(
      JSON.stringify({ image: processedImage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } } }
    );
    */
  } catch (error) {
    console.error('Error in generate-design function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
