# Product Requirements Document (PRD) - AI Design Studio & 3D Configurator

## 1. Project Overview
This document specifies the requirements for a **Next-Gen AI Custom Apparel Platform**. The platform focuses on a premium, highly interactive user experience where users interact with an AI Chatbot (powered by Nano Banana Pro) to generate unique designs, which are visualized on realistic 3D product models in real-time.

**Core Technology Stack:**
- **Frontend:** React, TypeScript, TailwindCSS.
- **3D Engine:** React Three Fiber (R3F) ecosystem (Three.js, Drei).
- **AI Engine:** Google Generative AI (Gemini / Nano Banana Pro).
- **Backend:** Headless WordPress (REST API).

---

## 2. 3D Technical Specification
The 3D experience is the centerpiece of the application. The system must render high-fidelity apparel models with specific material characteristics and visual transition effects.

### 2.1. Scene Architecture
The scene uses `react-three-fiber` for rendering.

**Lighting & Environment:**
- **Environment Map:** Use a studio lighting HDR setup to provide realistic reflections.
- **Lights:**
    - High-intensity Ambient Light (approx 0.5).
    - Directional Light with shadows.
    - Point Lights for rim lighting effects.

**Camera Logic:**
- **Controls:** `OrbitControls` with limited vertical angles and zoom limits.
- **Responsiveness:** Dynamic FOV adjustment based on screen size/fullscreen state.

### 2.2. Product Model Requirements
The system must be capable of loading and displaying GLB/GLTF models.

**Optimization Requirements:**
- Models must be loaded efficiently (e.g., using `useGLTF` with `Suspense`).
- The system must handle models of varying physical sizes and coordinate systems by normalizing them into a "Stable World Space" (see Section 2.4).

### 2.3. Material Properties (Visual Identity)
To achieve a premium look, all fabric-based models must use `MeshStandardMaterial` configured with the following physical parameters. These settings are crucial for approximating high-quality cotton/polyester blends.

```typescript
const FABRIC_MATERIAL_REQ = {
    roughness: 0.85,      // High roughness = Matte fabric
    metalness: 0.05,      // Almost zero = Non-metallic
    sheen: 0.3,           // 30% Sheen = Soft velvet-like highlight on edges
    sheenRoughness: 0.5,  // Spreads the sheen
    sheenColor: 0xffffff, // White sheen
    clearcoat: 0.0,       // No glossy coat
    side: THREE.FrontSide
};
```

---

### 2.4. Visual Effects & Shaders
The application requires two specific custom shader effects for transitions. These must be implemented by injecting GLSL logic into the standard materials (via `onBeforeCompile` or `shaderMaterial`).

**Prerequisite: Stable World Space Calculation**
Since 3D models may float, rotate, or animate, the shader effects (which use vertical scanning) must be anchored to the "Visual World Bounds" of the model, not its local coordinates. A system must be implemented to calculate the bounding box of the mesh in world space on every frame to drive the shader uniforms `uModelMinY` and `uModelHeight`.

#### Effect A: Holographic Swipe (Color Transitions)
Used when the user changes the base color of the product. The effect scans vertically, replacing the old color with the new one, accented by a holographic rainbow rim.

**Required Shader Logic (Fragment):**
```glsl
// Calculate normalized vertical position (0.0 at bottom, 1.0 at top) based on World Space
float normalizedY = (vWorldPos.y - uModelMinY) / uModelHeight;
normalizedY = clamp(normalizedY, 0.0, 1.0);

// Invert for Top-to-Bottom scan if needed
normalizedY = 1.0 - normalizedY; 

float edgeWidth = 0.12;
float cutoff = uRevealProgress; // Animated from 0 -> 1

// Smooth blending mask
float blend = smoothstep(cutoff - edgeWidth, cutoff + edgeWidth * 0.2, normalizedY);

// Mix Base Colors
vec3 transitionColor = mix(uNewColor, uOldColor, blend);
diffuseColor.rgb = transitionColor;

// --- HOLOGRAPHIC RIM GLOW ---
// Only visible during transition
float edgeDist = abs(normalizedY - cutoff);
if (edgeDist < edgeWidth && uRevealProgress > 0.01 && uRevealProgress < 0.99) {
    float edgeIntensity = 1.0 - (edgeDist / edgeWidth);
    edgeIntensity = pow(edgeIntensity, 1.5); // Sharpen
    
    // Rainbow Function (HSL to RGB)
    vec3 rainbow = hsl2rgb(fract(normalizedY * 2.0 + uTime * 0.5), 1.0, 0.6);
    
    // Digital Scanlines additive
    float scanline = sin(normalizedY * 80.0 + uTime * 10.0) * 0.5 + 0.5;
    
    // Additive blending
    diffuseColor.rgb += rainbow * edgeIntensity * 0.7;
    diffuseColor.rgb += vec3(1.0) * scanline * edgeIntensity * 0.3;
}
```

#### Effect B: Digital Glitch (Design Updates)
Used when a new AI-generated design is applied. The print area should "glitch out" into digital noise, swap the texture at the peak of the glitch, and then resolve.

**Required Shader Logic (Fragment):**
```glsl
// Only run if glitch intensity > 0
if (uGlitchIntensity > 0.01) {
    // 1. Digital Block Noise
    vec2 blockUV = floor(vUv * 6.0);
    float blockNoise = hash(blockUV + floor(uTime * 10.0));
    float blockGlitch = step(0.85, blockNoise) * uGlitchIntensity;

    // 2. Horizontal Line Tear
    float lineNoise = hash(floor(vUv.y * 35.0 + uTime * 20.0));
    float glitchLine = step(0.88, lineNoise) * uGlitchIntensity;
    
    // 3. Chromatic Aberration (RGB Shift)
    float shift = sin(uTime * 40.0) * uGlitchIntensity * 0.12;
    diffuseColor.r += shift;
    diffuseColor.b -= shift;

    // 4. Whiteout Effect at Peak Intensity
    if (uGlitchIntensity > 0.92) {
        diffuseColor.rgb += vec3(1.0) * (uGlitchIntensity - 0.92) * 2.0;
    }
    
    // 5. Apply the noise colors
    diffuseColor.rgb += vec3(0.0, 1.0, 1.0) * blockGlitch; // Cyan blocks
    diffuseColor.a *= mix(1.0, hash(uTime), uGlitchIntensity * 0.5); // Alpha flicker
}
```

### 2.5. Texture Mapping Features
The 3D viewer must support proper UV mapping for generated designs.
- **Square Aspect Ratio:** The AI generates 1:1 square images.
- **Dynamic Transforms:** The system must allow configuring the `repeat` (scale) and `offset` (position) of the texture map for each 3D model independently, to ensure the design sits correctly on the chest, back, or cap front panel.
- **Decal System:** Designs should be applied as decals/layers on top of the base fabric, possibly using `polygonOffset` to prevent z-fighting.

---

## 3. interactive AI Design Studio
The primary user interface for creating designs is a conversational **Chat Interface**.

### 3.1. User Flow
1.  **Product Selection:** User selects a product template (Hoodie, T-Shirt, etc.).
2.  **Prompt Entry:** User types a rough idea (e.g., "A futuristic knight").
3.  **Processing:**
    *   System refines the user's prompt into a detailed English art description using an LLM.
    *   System selects or applies a requested **Style Template** (see 3.2).
    *   System calls the **Image Generation API**.
4.  **Vizualization:** The generated image is returned and applied to the 3D model using the *Digital Glitch* effect.

### 3.2. Style Templates (Backend Logic)
The backend (or frontend logic) must use structured templates to guide the image generator. `[SUBJECT]` denotes the user's input/refined prompt.

| Style Name | API Prompt Template |
| :--- | :--- |
| **No Style** | `Create a high-resolution version of [SUBJECT], square aspect ratio. Focus purely on the likeness and requested action.` |
| **Anime** | `Create a high-resolution illustration of [SUBJECT]. Clean vector shapes, bold outlines, energetic anime effects, cel-shaded coloring, motion streaks. Style: Premium streetwear / Modern Pop-Anime.` |
| **Synthwave** | `Create a high-resolution illustration of [SUBJECT]. Clean vector shapes, neon gradients, retro 80s colors, gridlines, glowing geometric fragments. Style: Neon-retro / Synthwave poster.` |
| **GTA** | `Create a high-resolution illustration of [SUBJECT]. Clean vector shapes, bold outlines, flat comic-cell shading, sharp color blocks. Style: Loading screen artwork / Stylized poster.` |
| **Cyberpunk** | `Create a high-resolution illustration of [SUBJECT]. Holographic glows, neon lighting, electric fragments, cybernetic accents. Style: Futuristic streetwear.` |
| **Cartoon** | `Create a high-resolution illustration of [SUBJECT]. Clean vector shapes, bold outlines, playful features, graffiti splashes, fun geometric fragments. Style: Modern cartoon streetwear.` |
| **3D Render** | `Create a 3D render of [SUBJECT]. Soft cinematic lighting, glossy materials, stylized shading. Style: Collectible 3D figurine.` |
| **Retro/Vintage** | `Create a high-resolution illustration of [SUBJECT]. Muted retro palettes, halftone textures, vintage geometric fragments. Style: Classic vintage poster.` |
| **Inkpunk** | `Create a high-resolution illustration of [SUBJECT]. Aggressive ink strokes, splashes, neon drips, chaotic graffiti. Style: Expressive Inkpunk / Street-art.` |
| **Steampunk** | `Create a high-resolution illustration of [SUBJECT]. Brass and copper tones, gears, goggles, mechanical fragments. Style: Steampunk fashion.` |
| **Noir** | `Create a high-resolution illustration of [SUBJECT]. Heavy noir shadows, moody lighting, limited palette (black, white, red). Style: Dark comic / Noir.` |
| **Minimalist** | `Create a high-resolution illustration of [SUBJECT]. Clean geometric shapes, bold outlines, smooth curves, flat colors. Style: Vector poster.` |
| **Abstract** | `Surround [SUBJECT] with a dynamic explosion of abstract shapes, colorful liquid splashes, sharp geometric fragments. Style: High-contrast liquid-geometric fusion.` |

### 3.3. Image Generation API
- **Provider:** Google Generative AI (Gemini).
- **Model:** `gemini-3-pro-image-preview` (or equivalent current high-quality model).
- **Input:** Text Prompt + Optional Reference Image (Multimodal).
- **Output Requirements:** PNG format, Square aspect ratio.

---

## 4. Admin Dashboard Spec
A protected `/admin` route is required for platform management.

**Key Features:**
1.  **Admin Design Studio:** A replica of the user chat interface allowing admins to generate and curate designs efficiently.
2.  **Prompt Template Manager:** UI to edit the Style Templates (from Section 3.2) stored in the database.
3.  **Real-time Session View:** Monitoring capability to see ongoing generation requests (Prompt + Output Image).

---

## 5. Backend Architecture
- **CMS:** Headless WordPress.
- **API:** Standard REST API.
- **Configuration:** API Keys and global settings should be stored in the backend to allow runtime updates.
- **Media:** Generated designs are uploaded to the WordPress Media Library upon user confirmation.

## 6. Implementation Checklist
1.  Set up **React + Vite** frontend project.
2.  Configure **Three.js / R3F** scene with specified lighting.
3.  Implement **Material System** with `FABRIC_MATERIAL_REQ` parameters.
4.  Implement **Shaders** for Holographic and Glitch transitions.
5.  Build **Chat Interface** and integrate with Gemini API.
6.  Connect to **Headless WordPress** backend.
