import React, { useRef, useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

import { useGLTF, useTexture, Text, Environment, Float, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Model loading order: smallest to largest file size
const MODEL_LOAD_ORDER: { id: 'cap' | 'bottle' | 'tshirt' | 'hoodie'; url: string }[] = [
    { id: 'cap', url: '/models/cap_webshop.glb' },
    { id: 'bottle', url: '/models/bottle-webshop.glb' },
    { id: 'tshirt', url: '/models/tshirt_webshop.glb' },
    { id: 'hoodie', url: '/models/hoodie-webshop.glb' },
];

const CameraHandler = ({ isFullscreen }: { isFullscreen: boolean }) => {
    const { camera } = useThree();

    useEffect(() => {
        if (!isFullscreen) {
            camera.position.set(0, 0, 10);
            camera.lookAt(0, 0, 0);
            camera.updateProjectionMatrix();
        }
    }, [isFullscreen, camera]);
    return null;
};

// Import all textures


// Colors aligned with Shop.tsx and logo filenames for auto-cycling
const AUTO_CYCLE_COLORS = [
    '#231f20', // Black
    '#d1d5db', // Grey
    '#00ab98', // Teal
    '#00aeef', // Cyan
    '#387bbf', // Blue
    '#8358a4', // Purple
    '#ffffff', // White
    '#e78fab', // Pink
    '#a1d7c0'  // Mint
];

// Design to Color Availability Map now comes from Shop.tsx via designColorMap prop\n// See: shopConfig?.design_color_map in Shop.tsx





const SHARED_COLORS = [
    '#1a1a1a', // Black
    '#cccccc', // Grey
    '#4db6ac', // Teal
    '#00bcd4', // Cyan
    '#1976d2', // Blue
    '#7b1fa2', // Purple
    '#ffffff', // White
    '#f48fb1', // Pink
    '#69f0ae'  // Mint
];

// Holographic Swipe Transition Shader
const holographicSwipeVertexShader = `
    varying vec2 vUv;
    varying vec3 vLocalPosition;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    
    void main() {
        vUv = uv;
        vLocalPosition = position; // Use local/model-space position for bounds
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

const holographicSwipeFragmentShader = `
    uniform float uRevealProgress;
    uniform vec3 uOldColor;
    uniform vec3 uNewColor;
    uniform float uTime;
    uniform float uModelHeight;
    uniform float uModelMinY;
    
    varying vec2 vUv;
    varying vec3 vLocalPosition;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    
    // HSL to RGB conversion for rainbow effect
    vec3 hsl2rgb(float h, float s, float l) {
        vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
    }
    
    void main() {
        // Use LOCAL Z position for vertical swipe (model's up axis is Z)
        float normalizedY = (vLocalPosition.z - uModelMinY) / uModelHeight;
        normalizedY = clamp(normalizedY, 0.0, 1.0);
        // Invert for bottom-to-top direction
        normalizedY = 1.0 - normalizedY;
        
        // Edge width for the transition
        float edgeWidth = 0.12;
        
        // Calculate the transition cutoff with smooth gradient
        float cutoff = uRevealProgress;
        
        // Smooth edge blend
        float blend = smoothstep(cutoff - edgeWidth, cutoff + edgeWidth * 0.2, normalizedY);
        
        // Mix between new (revealed from bottom) and old (disappearing at top)
        vec3 baseColor = mix(uNewColor, uOldColor, blend);
        
        // Holographic edge effect - rainbow glow at transition line
        float edgeDist = abs(normalizedY - cutoff);
        float edgeIntensity = 0.0;
        
        if (edgeDist < edgeWidth && uRevealProgress > 0.01 && uRevealProgress < 0.99) {
            edgeIntensity = 1.0 - (edgeDist / edgeWidth);
            edgeIntensity = pow(edgeIntensity, 1.5); // Sharpen the glow
            
            // Rainbow hue based on position and time
            float hue = fract(normalizedY * 2.0 + uTime * 0.5);
            vec3 rainbow = hsl2rgb(hue, 1.0, 0.6);
            
            // Scanline effect - digital aesthetic
            float scanline = sin(normalizedY * 80.0 + uTime * 10.0) * 0.5 + 0.5;
            scanline = pow(scanline, 4.0);
            
            // Combine rainbow glow with scanlines
            vec3 holoEffect = rainbow * edgeIntensity * 0.7;
            holoEffect += vec3(1.0, 1.0, 1.0) * scanline * edgeIntensity * 0.3;
            
            baseColor += holoEffect;
        }
        
        // Fresnel rim lighting for extra holographic feel during transition
        if (uRevealProgress > 0.01 && uRevealProgress < 0.99) {
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
            baseColor += vec3(0.2, 0.5, 1.0) * fresnel * 0.15 * (1.0 - abs(uRevealProgress - 0.5) * 2.0);
        }
        
        gl_FragColor = vec4(baseColor, 1.0);
    }
`;


interface ProductModelProps {
    modelUrl: string;
    position: [number, number, number];
    scale: number;
    onClick: () => void;
    label: string;
    price?: number;
    enableDesignCycle?: boolean;
    enableColorCycle?: boolean;
    initialColor?: string;
    rotationOffset?: number;
    isActive: boolean;
    isCustomizing: boolean;
    color?: string;
    designs?: { front: string; back: string };
    activeZone?: 'front' | 'back';
    mode?: 'showcase' | 'customizing';
    isFullscreen?: boolean;

    cycleDesignsFront?: string[];
    cycleDesignsBack?: string[];
    textYOffset?: number;
    colorToLogoMap?: Record<string, string>;
    hasUserInteracted?: boolean;
    designColorMap?: Record<string, string[]>;
    urlToFilename?: Record<string, string>;
    cycleDuration?: number;
    cycleOffset?: number;
    swipeDirection?: 'up' | 'down';
    swipeAxis?: 'x' | 'y' | 'z';

    allowedCycleColors?: string[];
    productId?: string;
    activeColorsRef?: React.MutableRefObject<Record<string, string>>;
    onDesignsUpdate?: (designs: { front: string; back: string }) => void;
    designReplacements?: Record<string, string>;
}

// Helper for bottle specific logic
const isBottle = (label: string) => label === 'BOCA';
const isCap = (label: string) => label === 'KAPA';
const isHoodie = (label: string) => label === 'HOODICA';

const ProductModel = ({
    modelUrl,
    position,
    scale,
    onClick,
    label,
    price,
    isActive,
    isCustomizing,
    enableDesignCycle = false,
    enableColorCycle = false,
    initialColor = "#1a1a1a",
    rotationOffset = 0,
    color,
    designs,
    activeZone,
    mode = 'customizing',
    isFullscreen = false,
    cycleDesignsFront,
    cycleDesignsBack,
    textYOffset = 1.2,
    isLoaded = true,
    onLoadComplete,
    colorToLogoMap,
    hasUserInteracted = false,
    designColorMap,
    urlToFilename,
    cycleDuration = 6000, // Default 6 seconds
    cycleOffset = 0,
    swipeDirection = 'down', // Default Top-to-Bottom
    swipeAxis = 'y',
    allowedCycleColors,
    productId,
    activeColorsRef,
    onDesignsUpdate,
    designReplacements
}: ProductModelProps & { isLoaded?: boolean; onLoadComplete?: () => void }) => {
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    const { scene } = useGLTF(modelUrl);

    // Entrance animation state
    const entranceProgress = useRef(0);
    const [hasAnimatedIn, setHasAnimatedIn] = useState(false);

    // Notify parent when model is loaded
    useEffect(() => {
        if (scene && onLoadComplete) {
            onLoadComplete();
        }
    }, [scene, onLoadComplete]);

    // State
    const [currentDesignIndex, setCurrentDesignIndex] = useState(() =>
        enableDesignCycle ? Math.floor(Math.random() * (cycleDesignsFront?.length || 0)) : 0
    );
    const designIndexRef = useRef(currentDesignIndex);
    useEffect(() => { designIndexRef.current = currentDesignIndex; }, [currentDesignIndex]);


    // Single source of truth for cycling state
    const isCycling = useMemo(() => {
        if (!enableDesignCycle && !enableColorCycle) return false; // Check both
        if (mode === 'showcase') return true;
        // if (isActive) return false; // Implicit
        return false;
    }, [enableDesignCycle, enableColorCycle, mode]);

    // Lerp Refs
    const currentPosition = useRef(new THREE.Vector3(...position));
    const currentScale = useRef(0); // Start at 0 for entrance animation
    const currentOpacity = useRef(mode === 'showcase' ? 1 : (isActive ? 1 : 0.05));

    // Refs for smooth transitions
    // State Ref to prevent Stale Closures in useFrame
    const stateRef = useRef({
        isActive,
        isCustomizing,
        frontUrl: null as string | null,
        backUrl: null as string | null,
        label,
        activeZone,
        mode,
        designTransitionProgress: 0,
        hasUserInteracted,
        isCycling: false
    });
    const bodyMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

    // Separate refs for Front and Back generic print areas
    const frontMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
    const backMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

    const targetColorRef = useRef(new THREE.Color(
        enableColorCycle
            ? (allowedCycleColors || AUTO_CYCLE_COLORS)[Math.floor(Math.random() * (allowedCycleColors || AUTO_CYCLE_COLORS).length)]
            : initialColor
    ));

    // Holographic Swipe Transition State (only for Hoodie)
    // Initialize to same color as target to prevent black flash on first transition
    const previousColorRef = useRef(new THREE.Color(
        enableColorCycle
            ? (allowedCycleColors || AUTO_CYCLE_COLORS)[Math.floor(Math.random() * (allowedCycleColors || AUTO_CYCLE_COLORS).length)]
            : initialColor
    ));
    const colorTransitionProgress = useRef(1); // 0 = old color, 1 = new color (complete)
    const isColorTransitioning = useRef(false);
    const holoShaderMaterialsRef = useRef<THREE.ShaderMaterial[]>([]);
    const modelBoundsRef = useRef({ minY: -1, maxY: 1, height: 2 });
    const colorTransitionTimeRef = useRef(0);

    // Separate transition state for DESIGN changes (independent from color)
    const designTransitionProgress = useRef(1);
    const isDesignTransitioning = useRef(false);
    const designTransitionTimeRef = useRef(0);
    const isGlitchingFront = useRef(false);
    const isGlitchingBack = useRef(false);

    // Clone scene - Depend on config to ensure fresh state when switching modes/axes
    // Added initialColor and swipeAxis to deps to prevent "stacking" modifications on the same clone
    const clonedScene = useMemo(() => scene.clone(), [scene, enableDesignCycle, enableColorCycle, label, swipeDirection, swipeAxis, initialColor]);

    // Setup Meshes & Materials
    useEffect(() => {
        bodyMaterialsRef.current = [];
        frontMaterialsRef.current = [];
        backMaterialsRef.current = [];
        holoShaderMaterialsRef.current = [];

        console.log(`Analyzing model: ${modelUrl}`);

        // Calculate model bounds (STABLE WORLD SPACE)
        // We calculate bounds as if the model is at (0,0,0) World, but keeping its Rotation/Scale.
        // This coordinates with the shader logic that subtracts translation.
        let stableMinY = Infinity;
        let stableMaxY = -Infinity;

        // Ensure matrices are updated
        clonedScene.updateMatrixWorld(true);

        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const m = child as THREE.Mesh;
                if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();

                if (m.geometry.boundingBox) {
                    // Create OBB (Oriented Bounding Box) logic effectively
                    const bbox = m.geometry.boundingBox!;

                    // Let's use the "Tallest Axis" logic to define Min/Max/Height of the model itself.
                    // This approximates the "Visual Height" without needing complex matrix decompose here.
                    const dx = bbox.max.x - bbox.min.x;
                    const dy = bbox.max.y - bbox.min.y;
                    const dz = bbox.max.z - bbox.min.z;

                    // Assume the main axis is the longest one (Hoodie/Bottle/Tshirt are tall).
                    let min, max;
                    // Determine dominant local axis
                    if (dy >= dx && dy >= dz) { min = bbox.min.y; max = bbox.max.y; } // Y is height
                    else if (dx >= dy && dx >= dz) { min = bbox.min.x; max = bbox.max.x; } // X is height
                    else { min = bbox.min.z; max = bbox.max.z; } // Z is height

                    stableMinY = Math.min(stableMinY, min);
                    stableMaxY = Math.max(stableMaxY, max);
                }
            }
        });

        // If Model is centered, Min is roughly -Height/2 and Max is Height/2.
        if (stableMinY === Infinity) { stableMinY = -1; stableMaxY = 1; }
        const worldHeight = stableMaxY - stableMinY;

        console.log(`Stable Bounds estimate: ${stableMinY} to ${stableMaxY} (Height: ${worldHeight})`);

        // Pass 2: Setup Materials
        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const m = child as THREE.Mesh;
                const name = m.name.toLowerCase();

                // Generic "Print Area" detection
                const isPrintArea = name.includes("print") || m.userData.is_print_area;

                if (!isPrintArea) {
                    // Body part logic
                    m.renderOrder = 0;

                    // Helper to process a single material
                    const processBodyMaterial = (material: THREE.Material) => {
                        const mat = material as THREE.MeshStandardMaterial;
                        const matName = mat.name.toLowerCase();

                        // Special Case for Bottle: BlackRing should NEVER change color
                        // BUT it should be transparent like the rest when ghosted
                        if (matName.includes('blackring')) {
                            const ringMat = mat.clone();
                            ringMat.color.set('#000000'); // Always black
                            ringMat.roughness = 0.5;
                            ringMat.metalness = 0;
                            ringMat.transparent = true;
                            ringMat.opacity = 1; // Will be controlled by animation loop
                            bodyMaterialsRef.current.push(ringMat); // Include in body materials for opacity control
                            return ringMat;
                        }

                        // For BodyColor (or any other generic body part), allow color cycling
                        // If we have specific named materials, only target "BodyColor" or fallback to everything else
                        // that isn't the ring.
                        if (matName.includes('blackring')) return mat; // Should remain caught above, but safety

                        const newMat = mat.clone();
                        // Use random color for cycling products, initialColor for others
                        const startColor = enableColorCycle ? targetColorRef.current : new THREE.Color(initialColor);
                        newMat.color.copy(startColor);

                        // For products with Color Cycle (Hoodie, T-shirt): Inject holographic transition
                        if (enableColorCycle) {
                            // Remove fabric texture to allow clean color if desired
                            newMat.map = null;

                            // Add custom uniforms for the transition
                            newMat.userData.uniforms = {
                                uRevealProgress: { value: 1.0 },
                                uOldColor: { value: new THREE.Color(targetColorRef.current) },
                                uNewColor: { value: new THREE.Color(targetColorRef.current) },
                                uTime: { value: 0 },

                                uModelHeight: { value: worldHeight * 1.05 },
                                uModelMinY: { value: stableMinY - (worldHeight * 0.025) }
                            };

                            // Inject shader code into MeshStandardMaterial
                            newMat.onBeforeCompile = (shader) => {
                                // Add our uniforms
                                shader.uniforms.uRevealProgress = newMat.userData.uniforms.uRevealProgress;
                                shader.uniforms.uOldColor = newMat.userData.uniforms.uOldColor;
                                shader.uniforms.uNewColor = newMat.userData.uniforms.uNewColor;
                                shader.uniforms.uTime = newMat.userData.uniforms.uTime;
                                shader.uniforms.uModelHeight = newMat.userData.uniforms.uModelHeight;
                                shader.uniforms.uModelMinY = newMat.userData.uniforms.uModelMinY;

                                // Inject WORLD POSITION varying
                                shader.vertexShader = shader.vertexShader.replace(
                                    '#include <common>',
                                    `#include <common>
                                    varying vec3 vWorldPos;`
                                );
                                shader.vertexShader = shader.vertexShader.replace(
                                    '#include <begin_vertex>',
                                    `#include <begin_vertex>
                                    // Calculate world position
                                    vec4 worldP = modelMatrix * vec4(position, 1.0);
                                    vWorldPos = worldP.xyz;`
                                );

                                // Fix: Check if vLocalPos.y needs to be flipped or axis swapped?
                                // If scanAxis was 'y', we use .y.
                                // If model is rotated 90deg X in object mode?
                                // Assuming standard Y-up geometry.

                                // Inject uniforms and HSL function into fragment shader
                                shader.fragmentShader = shader.fragmentShader.replace(
                                    '#include <common>',
                                    `#include <common>
                                    uniform float uRevealProgress;
                                    uniform vec3 uOldColor;
                                    uniform vec3 uNewColor;
                                    uniform float uTime;
                                    uniform float uModelHeight;
                                    uniform float uModelMinY;
                                    varying vec3 vWorldPos;
                                    
                                    vec3 hsl2rgb_holo(float h, float s, float l) {
                                        vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
                                        return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
                                    }`
                                );

                                // Inject color transition into the diffuseColor
                                shader.fragmentShader = shader.fragmentShader.replace(
                                    '#include <color_fragment>',
                                    `#include <color_fragment>
                                    
                                    // Holographic swipe transition (WORLD SPACE)
                                    // Using vWorldPos.y guarantees vertical swipe relative to the scene floor.
                                    // We update uModelMinY/Height every frame to account for Floating, preventing texture slip.
                                    
                                    float normalizedY = (vWorldPos.y - uModelMinY) / uModelHeight;
                                    normalizedY = clamp(normalizedY, 0.0, 1.0);
                                    
                                    // Direction Logic:
                                    // Default (normalizedY) is 0 at Bottom, 1 at Top.
                                    // smoothstep(cutoff...) where cutoff goes 0->1.
                                    // If normalizedY < cutoff, we get 'NewColor'.
                                    // So normalizedY (Bottom) is < cutoff first. So Bottom->Top reveals New Color.
                                    // If we want Top->Bottom ('down'), we need invert normalizedY so Top is 0.
                                    
                                    ${swipeDirection === 'down' ? 'normalizedY = 1.0 - normalizedY;' : ''}
                                     // Invert if 'down' (Top-to-Bottom), otherwise 'up' (Bottom-to-Top)
                                    
                                    float edgeWidth = 0.12;
                                    float cutoff = uRevealProgress;
                                    float blend = smoothstep(cutoff - edgeWidth, cutoff + edgeWidth * 0.2, normalizedY);
                                    
                                    // Mix colors based on transition progress
                                    vec3 transitionColor = mix(uNewColor, uOldColor, blend);
                                    diffuseColor.rgb = transitionColor;
                                    
                                    // Holographic edge glow
                                    float edgeDist = abs(normalizedY - cutoff);
                                    if (edgeDist < edgeWidth && uRevealProgress > 0.01 && uRevealProgress < 0.99) {
                                        float edgeIntensity = 1.0 - (edgeDist / edgeWidth);
                                        edgeIntensity = pow(edgeIntensity, 1.5);
                                        float hue = fract(normalizedY * 2.0 + uTime * 0.5);
                                        vec3 rainbow = hsl2rgb_holo(hue, 1.0, 0.6);
                                        float scanline = sin(normalizedY * 80.0 + uTime * 10.0) * 0.5 + 0.5;
                                        scanline = pow(scanline, 4.0);
                                        diffuseColor.rgb += rainbow * edgeIntensity * 0.5;
                                        diffuseColor.rgb += vec3(1.0) * scanline * edgeIntensity * 0.2;
                                    }`
                                );

                                // Store shader reference for updating uniforms
                                newMat.userData.shader = shader;
                            };

                            bodyMaterialsRef.current.push(newMat);
                            holoShaderMaterialsRef.current.push(newMat as any); // Store for uniform updates
                            return newMat;
                        } else {
                            // Standard material for non-hoodie products + Bottle Body logic
                            // Fix: Ensure solid materials (BodyColor) are NOT set to transparent
                            // Exception: For Bottle, BlackRing material should be transparent
                            const isBottlePart = productId === 'bottle';
                            const isBlackRing = mat.name === 'BlackRing';

                            if (isBottlePart && isBlackRing) {
                                // BlackRing material: Make it transparent like the rest of the bottle
                                newMat.transparent = true;
                                newMat.opacity = 0.3; // Match the ghosted look
                                newMat.depthWrite = false; // Helps with transparent rendering
                            } else {
                                newMat.transparent = false;
                            }
                            newMat.needsUpdate = true;

                            bodyMaterialsRef.current.push(newMat);
                            return newMat;
                        }
                    };

                    if (Array.isArray(m.material)) {
                        m.material = m.material.map(mat => processBodyMaterial(mat));
                    } else if (m.material) {
                        m.material = processBodyMaterial(m.material);
                    }
                } else {
                    m.renderOrder = 1;
                    const isBack = name.includes("back") || m.userData.print_location === 'back';

                    const setupPrintMat = () => {
                        m.visible = true;
                        const mat = m.material as THREE.MeshStandardMaterial;
                        if (mat) {
                            const newMat = mat.clone();
                            newMat.color.set('#ffffff');
                            newMat.transparent = true;
                            newMat.opacity = 1;
                            newMat.toneMapped = false;
                            newMat.roughness = 1;
                            newMat.metalness = 0;
                            newMat.polygonOffset = true;
                            newMat.polygonOffsetFactor = -1;
                            newMat.polygonOffsetUnits = -1;

                            // For ALL print areas: Add digital glitch transition
                            if (true) {
                                // Store uniforms for transition
                                newMat.userData.uniforms = {
                                    uRevealProgress: { value: 1.0 },
                                    uTime: { value: 0 },
                                    uGlitchIntensity: { value: 0 }
                                };

                                // Inject digital glitch/flicker effect for print areas
                                newMat.onBeforeCompile = (shader) => {
                                    shader.uniforms.uRevealProgress = newMat.userData.uniforms.uRevealProgress;
                                    shader.uniforms.uTime = newMat.userData.uniforms.uTime;
                                    shader.uniforms.uGlitchIntensity = newMat.userData.uniforms.uGlitchIntensity;

                                    // Add UV varying to vertex shader
                                    shader.vertexShader = shader.vertexShader.replace(
                                        '#include <common>',
                                        `#include <common>
                                        varying vec2 vGlitchUv;`
                                    );
                                    shader.vertexShader = shader.vertexShader.replace(
                                        '#include <uv_vertex>',
                                        `#include <uv_vertex>
                                        vGlitchUv = uv;`
                                    );

                                    // Add uniforms to fragment shader with glitch functions
                                    shader.fragmentShader = shader.fragmentShader.replace(
                                        '#include <common>',
                                        `#include <common>
                                        uniform float uRevealProgress;
                                        uniform float uTime;
                                        uniform float uGlitchIntensity;
                                        varying vec2 vGlitchUv;
                                        
                                        // Random hash function for glitch
                                        float glitchHash(float n) {
                                            return fract(sin(n) * 43758.5453123);
                                        }
                                        
                                        float glitchHash2D(vec2 p) {
                                            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
                                        }`
                                    );

                                    // Apply glitch effect to the diffuse color
                                    shader.fragmentShader = shader.fragmentShader.replace(
                                        '#include <color_fragment>',
                                        `#include <color_fragment>
                                        
                                        // Digital glitch/flicker effect for design transition
                                        if (uGlitchIntensity > 0.01) {
                                            // Random flicker - modulated by time
                                            float flickerSpeed = 35.0; // Slightly faster flicker
                                            float flicker = glitchHash(floor(uTime * flickerSpeed));
                                            
                                            // Horizontal glitch lines
                                            float lineNoise = glitchHash(floor(vGlitchUv.y * 35.0 + uTime * 20.0));
                                            float glitchLine = step(0.88, lineNoise) * uGlitchIntensity;
                                            
                                            // Digital noise overlay
                                            float noise = glitchHash2D(vGlitchUv * 80.0 + uTime * 6.0);
                                            float digitalNoise = step(0.75, noise) * uGlitchIntensity;
                                            
                                            // Random block glitches
                                            vec2 blockUV = floor(vGlitchUv * 6.0);
                                            float blockNoise = glitchHash2D(blockUV + floor(uTime * 10.0));
                                            float blockGlitch = step(0.85, blockNoise) * uGlitchIntensity;
                                            
                                            // FADE OUT / FADE IN based on reveal progress
                                            // Sharper curve to ensuring full fade-out at midpoint
                                            float fadeAlpha = abs(uRevealProgress * 2.0 - 1.0); // 1 -> 0 -> 1
                                            fadeAlpha = pow(fadeAlpha, 0.8); // Sharper fade curve
                                            
                                            // Enhanced flicker on alpha during transition
                                            // At peak glitch (midpoint), flicker more intensely
                                            float flickerAlpha = mix(fadeAlpha, flicker * fadeAlpha, uGlitchIntensity * 0.6);
                                            
                                            // Holographic color shift
                                            vec3 holoColor = vec3(
                                                0.4 + 0.6 * sin(uTime * 6.0),
                                                0.4 + 0.6 * sin(uTime * 6.0 + 2.094),
                                                0.4 + 0.6 * sin(uTime * 6.0 + 4.189)
                                            );
                                            
                                            // Combine effects
                                            float totalGlitch = glitchLine + digitalNoise + blockGlitch;
                                            diffuseColor.rgb += holoColor * totalGlitch * 0.8;
                                            diffuseColor.rgb = mix(diffuseColor.rgb, holoColor, blockGlitch * 0.4);
                                            
                                            // RGB shift/chromatic aberration
                                            float shift = sin(uTime * 40.0) * uGlitchIntensity * 0.12; // Slightly more shift
                                            diffuseColor.r += shift;
                                            diffuseColor.b -= shift;
                                            
                                            // Apply fade alpha
                                            diffuseColor.a *= flickerAlpha;
                                            
                                            // Scanline effect
                                            float scanline = sin(vGlitchUv.y * 120.0 + uTime * 12.0) * 0.5 + 0.5;
                                            scanline = pow(scanline, 2.0);
                                            diffuseColor.rgb += vec3(0.15, 0.4, 0.8) * scanline * uGlitchIntensity * 0.3;
                                            
                                            // White flash at peak intensity
                                            if (uGlitchIntensity > 0.92) {
                                                diffuseColor.rgb += vec3(1.0) * (uGlitchIntensity - 0.92) * 2.0;
                                            }
                                        }`
                                    );

                                    newMat.userData.shader = shader;
                                };
                            }

                            m.material = newMat;
                            return newMat;
                        }
                        return null;
                    };

                    const newMat = setupPrintMat();
                    if (newMat) {
                        if (isBack) {
                            console.log(`-> Assigned to BACK print area: ${name}`);
                            backMaterialsRef.current.push(newMat);
                        } else {
                            console.log(`-> Assigned to FRONT print area: ${name}`);
                            frontMaterialsRef.current.push(newMat);
                        }
                    }
                }
            }
        });

        // Store model bounds for hoodie and bottle (for swipe effect)
        if ((productId === 'hoodie' || productId === 'bottle' || productId === 'tshirt') && stableMinY !== Infinity) {
            modelBoundsRef.current = {
                minY: stableMinY,
                maxY: stableMaxY,
                height: worldHeight
            };
            // Update shader uniforms with bounds (via userData for MeshStandardMaterial)
            // Body materials only - print materials use glitch effect without bounds
            holoShaderMaterialsRef.current.forEach(mat => {
                if (mat.userData?.uniforms?.uModelHeight && mat.userData?.uniforms?.uModelMinY) {
                    mat.userData.uniforms.uModelHeight.value = modelBoundsRef.current.height;
                    mat.userData.uniforms.uModelMinY.value = modelBoundsRef.current.minY;
                }
            });
        }

    }, [clonedScene, initialColor, enableDesignCycle, label, swipeDirection, swipeAxis]);

    // Sync target color with prop - trigger holographic transition for hoodie
    useEffect(() => {
        if (color && (hasUserInteracted || !enableColorCycle)) {
            const newColor = new THREE.Color(color);

            // For products with color cycle: Trigger holographic swipe transition
            if (enableColorCycle && holoShaderMaterialsRef.current.length > 0) {
                // Only trigger if color actually changed
                const currentColor = targetColorRef.current;
                if (!currentColor.equals(newColor)) {
                    // Store old color and start transition
                    previousColorRef.current.copy(currentColor);
                    targetColorRef.current.copy(newColor);
                    colorTransitionProgress.current = 0; // Reset to start swipe
                    isColorTransitioning.current = true;
                    colorTransitionTimeRef.current = 0;

                    // Update shader uniforms with colors (via userData for MeshStandardMaterial)
                    holoShaderMaterialsRef.current.forEach(mat => {
                        if (mat.userData?.uniforms) {
                            mat.userData.uniforms.uOldColor.value.copy(previousColorRef.current);
                            mat.userData.uniforms.uNewColor.value.copy(newColor);
                            mat.userData.uniforms.uRevealProgress.value = 0;
                        }
                    });
                }
            } else {
                // Standard color update for other products
                targetColorRef.current.copy(newColor);

                if (isCustomizing) {
                    bodyMaterialsRef.current.forEach(mat => {
                        mat.color.copy(newColor);
                    });
                }
            }
        }
    }, [color, isCustomizing, label, hasUserInteracted, enableColorCycle]);



    // Load textures for Front and Back
    // Logic update: Only show cycle design if in showcase mode OR if this product is active.
    // Unselected products in customizing mode should have NO design.
    // isCycling is defined via useMemo above

    // Front Cycle
    const frontCycleList = cycleDesignsFront || [];
    const baseFrontCycleUrl = isCycling ? frontCycleList[currentDesignIndex % frontCycleList.length] : null;

    // Alt Swap Logic for Cycle
    const getEffectiveUrl = (url: string | null) => {
        if (!url || !designReplacements) return url;
        const replacement = designReplacements[url];
        if (replacement) {
            // Check color condition (Pink, Mint, Cyan)
            const hex = '#' + targetColorRef.current.getHexString();
            const altColors = ['#e78fab', '#a1d7c0', '#00aeef'];
            if (altColors.includes(hex)) return replacement;
        }
        return url;
    };

    const frontCycleUrl = getEffectiveUrl(baseFrontCycleUrl);

    // Back Cycle
    const backCycleList = cycleDesignsBack || null;
    const baseBackCycleUrl = isCycling && backCycleList ? backCycleList[currentDesignIndex % backCycleList.length] : null;
    const backCycleUrl = getEffectiveUrl(baseBackCycleUrl);

    // Resolve Front URL: Custom Front OR Cycle
    // Hoodie always shows logo (3) on front in customizing mode per user request
    // State for color-matched front design (Hoodie/T-shirt auto-cycle)
    // State for color-matched front design (Hoodie/T-shirt auto-cycle)
    const [colorMatchedFrontDesign, setColorMatchedFrontDesign] = useState<string | null>(null);

    // Sync pairing on re-entry to showcase (prevents stale design)
    useEffect(() => {
        if (!isCustomizing && (label === 'HOODICA' || label === 'MAJICA') && colorToLogoMap && color) {
            const logo = colorToLogoMap[color];
            if (logo) setColorMatchedFrontDesign(logo);
        }
    }, [isCustomizing, label, color, colorToLogoMap]);

    // Resolve Front URL: Strict pairing for Hoodie AND T-Shirt
    // Also use this logic if NOT customizing (showcase) but auto-cycling, to ensure match.
    // CRITICAL: If we're in customizing mode and NOT active, force null (no design visible)
    const shouldHideDesigns = isCustomizing && !isActive;

    const strictColorSyncFront = !shouldHideDesigns && ((label === 'HOODICA' || label === 'MAJICA') && colorToLogoMap) ?
        colorToLogoMap[isCustomizing && hasUserInteracted && color ? color : ('#' + targetColorRef.current.getHexString())] : null;

    const manualFront = (isCustomizing && hasUserInteracted && designs?.front) ? designs.front : null;
    const isManualDesignALogo = manualFront && colorToLogoMap && Object.values(colorToLogoMap).includes(manualFront);

    const frontUrl = shouldHideDesigns ? null :
        ((manualFront && !isManualDesignALogo) ? manualFront : (strictColorSyncFront || manualFront || colorMatchedFrontDesign || frontCycleUrl));

    // Resolve Back URL: Custom Back OR Cycle
    // Update: If customizing but NOT active (background), show NO design.
    const backUrl = shouldHideDesigns ? null :
        ((isCustomizing && hasUserInteracted && designs?.back) ? designs.back : backCycleUrl);

    const safeFrontUrl = frontUrl || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const safeBackUrl = backUrl || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

    // Track previous resolved designs to detect changes (FrontUrl/BackUrl)
    // This covers BOTH manual selection AND auto-sync changes (e.g. Logo color swap)
    const prevFrontUrlRef = useRef<string | null>(null);
    const prevBackUrlRef = useRef<string | null>(null);
    const hasInitializedUrls = useRef(false);

    // Trigger digital glitch transition when Resolved Design changes
    // NOTE: Old immediate trigger removed. Now handled by TextureLoader callback.
    useEffect(() => {
        if (!hasInitializedUrls.current) {
            hasInitializedUrls.current = true;
            prevFrontUrlRef.current = frontUrl;
            prevBackUrlRef.current = backUrl;
            return;
        }

        prevFrontUrlRef.current = frontUrl;
        prevBackUrlRef.current = backUrl;

    }, [frontUrl, backUrl]);

    // --- FLICKER FIX: Manual Texture Loading to avoid Suspense on updates ---
    // 1. Initial Load (Suspense enabled for first render) - freeze initial URL
    const [initialSafeFront] = useState(safeFrontUrl);
    const [initialSafeBack] = useState(safeBackUrl);
    const initialFrontTex = useTexture(initialSafeFront) as THREE.Texture;
    const initialBackTex = useTexture(initialSafeBack) as THREE.Texture;

    // 2. State for active textures (Dynamic updates)
    const [frontTextureBase, setFrontTextureBase] = useState<THREE.Texture>(initialFrontTex);
    const [backTextureBase, setBackTextureBase] = useState<THREE.Texture>(initialBackTex);

    // Loading Refs for Glitch Synchronization (Pending Updates)
    const pendingFrontTexRef = useRef<THREE.Texture | null>(null);
    const pendingBackTexRef = useRef<THREE.Texture | null>(null);
    const hasPendingFrontUpdate = useRef(false);
    const hasPendingBackUpdate = useRef(false);

    // 3. Effect to load new textures in background without suspending
    useEffect(() => {
        if (safeFrontUrl === initialSafeFront) {
            setFrontTextureBase(initialFrontTex);
            return;
        }

        // Load in background, DO NOT set state yet
        new THREE.TextureLoader().load(safeFrontUrl, (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            pendingFrontTexRef.current = tex;
            hasPendingFrontUpdate.current = true;

            // Trigger Glitch NOW (after load is done)
            if (frontMaterialsRef.current.length > 0) {
                designTransitionProgress.current = 0;
                isDesignTransitioning.current = true;
                isGlitchingFront.current = true;

                // Reset uniforms
                frontMaterialsRef.current.forEach(mat => {
                    if (mat.userData?.uniforms) mat.userData.uniforms.uGlitchIntensity.value = 0;
                });
            }
        });
    }, [safeFrontUrl, initialSafeFront, initialFrontTex]);

    useEffect(() => {
        if (safeBackUrl === initialSafeBack) {
            setBackTextureBase(initialBackTex);
            return;
        }

        new THREE.TextureLoader().load(safeBackUrl, (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            pendingBackTexRef.current = tex;
            hasPendingBackUpdate.current = true;

            // Trigger Glitch NOW
            if (backMaterialsRef.current.length > 0) {
                designTransitionProgress.current = 0;
                isDesignTransitioning.current = true;
                isGlitchingBack.current = true;

                backMaterialsRef.current.forEach(mat => {
                    if (mat.userData?.uniforms) mat.userData.uniforms.uGlitchIntensity.value = 0;
                });
            }
        });
    }, [safeBackUrl, initialSafeBack, initialBackTex]);

    // 4. Clone textures for unique mapping properties
    const frontTexture = useMemo(() => {
        const t = frontTextureBase.clone();
        t.needsUpdate = true;
        return t;
    }, [frontTextureBase]);

    const backTexture = useMemo(() => {
        const t = backTextureBase.clone();
        t.needsUpdate = true;
        return t;
    }, [backTextureBase]);

    // Apply Textures
    useEffect(() => {
        // Front Texture - Configuration
        frontTexture.colorSpace = THREE.SRGBColorSpace;
        frontTexture.center.set(0.5, 0.5);

        // Product Specific Tuning for Front
        if (productId === 'hoodie') {
            frontTexture.flipY = false; // Flip Vertically (relative to valid UVs)
            frontTexture.wrapS = THREE.RepeatWrapping;
            frontTexture.wrapT = THREE.RepeatWrapping;
            frontTexture.repeat.set(24.4, 24.4); // Scale UP 5% (25.6 -> 24.4)
            frontTexture.offset.set(0.21, -0.37); // Left (0.23->0.21)
        } else if (productId === 'cap') {
            frontTexture.flipY = false; // Fix upside down
            frontTexture.wrapS = THREE.ClampToEdgeWrapping; // Big spacing (no repeat)
            frontTexture.wrapT = THREE.ClampToEdgeWrapping;
            frontTexture.repeat.set(7.28, 7.28); // Scale down 5% more (6.93 -> 7.28)
            frontTexture.offset.set(0, 0.78); // Move Up (0.75 -> 0.78)
        } else if (productId === 'tshirt') {
            // T-shirt Front: Flip horizontally and vertically
            frontTexture.flipY = true;
            frontTexture.wrapS = THREE.RepeatWrapping;
            frontTexture.wrapT = THREE.RepeatWrapping;
            frontTexture.repeat.set(3.4, -3.4); // Scale UP (decrease repeat)
            // Nudge Down (+y)
            frontTexture.offset.set(-1.05, 3.00);
        } else if (productId === 'bottle') {
            // Bottle Specific Tuning
            frontTexture.flipY = false; // Blender cylinder project usually correct orientation
            frontTexture.wrapS = THREE.ClampToEdgeWrapping;
            frontTexture.wrapT = THREE.ClampToEdgeWrapping;
            frontTexture.center.set(0.5, 0.5);
            frontTexture.repeat.set(6.25, 6.25); // Scaled down 20% (5.0 -> 6.25)
            frontTexture.offset.set(-0.3, 0.18); // Moved to -0.3, Moved Up (0.1 -> 0.18)
        } else {
            // Default
            frontTexture.flipY = true;
            frontTexture.wrapS = THREE.RepeatWrapping;
            frontTexture.wrapT = THREE.RepeatWrapping;
            frontTexture.repeat.set(-1, 1);
            frontTexture.offset.set(0, 0);
        }

        frontTexture.needsUpdate = true;

        // Back Texture - Configuration
        backTexture.flipY = false;
        backTexture.colorSpace = THREE.SRGBColorSpace;
        backTexture.wrapS = THREE.ClampToEdgeWrapping;
        backTexture.wrapT = THREE.ClampToEdgeWrapping;
        backTexture.center.set(0.5, 0.5);

        // Product Specific Tuning for Back
        if (productId === 'hoodie') {
            backTexture.repeat.set(-7.26, 7.26); // Scale DOWN 10% (6.6 -> 7.26)
            backTexture.offset.set(-0.28, 1.90); // Move Right (-0.28), Move Down correction (1.90)
        } else if (productId === 'tshirt') {
            // T-shirt Back: Scaled down 5% more (5.06 -> 5.31)
            backTexture.repeat.set(5.31, 5.31);
            backTexture.offset.set(-0.25, 0.15); // Move Right (-0.25), Move Up correction (0.15)
        } else {
            backTexture.repeat.set(-1, 1);
            backTexture.offset.set(0, 0);
        }
        backTexture.needsUpdate = true;

        // Apply Front
        if (frontMaterialsRef.current.length > 0) {
            const hideDesigns = isCustomizing && !isActive;
            frontMaterialsRef.current.forEach(mat => {
                mat.map = frontTexture;
                // Fix transparency/z-fighting
                mat.transparent = true;
                mat.depthWrite = false;
                mat.polygonOffset = true;
                mat.polygonOffsetFactor = -1;

                mat.needsUpdate = true;
                mat.visible = !hideDesigns && !!frontUrl;
            });
        }

        // Apply Back
        if (backMaterialsRef.current.length > 0) {
            const hideDesigns = isCustomizing && !isActive;
            backMaterialsRef.current.forEach(mat => {
                mat.map = backTexture;
                // Fix transparency/z-fighting
                mat.transparent = true;
                mat.depthWrite = false;
                mat.polygonOffset = true;
                mat.polygonOffsetFactor = -1;

                mat.needsUpdate = true;
                mat.visible = !hideDesigns && !!backUrl;
            });
        }
    }, [frontTexture, backTexture, enableDesignCycle, isCustomizing, isActive, frontUrl, backUrl, label, productId]);

    // Combined Cycle Trigger Logic: Changes BOTH color AND design together
    useEffect(() => {
        if (!isCycling) return;

        const runCycle = () => {
            // Determine random next index
            const len = cycleDesignsFront?.length || 1;
            let nextIndex = Math.floor(Math.random() * len);

            // Ensure we don't pick the same index if possible
            const currentIndex = designIndexRef.current; // Use ref to get current value
            if (len > 1 && nextIndex === currentIndex % len) {
                nextIndex = (nextIndex + 1) % len;
            }

            // Change design index
            setCurrentDesignIndex(nextIndex);

            // For ALL models: Trigger transitions
            // Always trigger Design Glitch
            // Only trigger Color Swipe if enableColorCycle is true

            if (enableColorCycle) {
                // Universal Color Validation Logic
                // Use the PRE-CALCULATED random nextIndex for validation

                // Use allowedCycleColors if provided, otherwise default to full palette
                let validColorsSet = new Set(allowedCycleColors || AUTO_CYCLE_COLORS);

                // 1. Check Front Design Constraint (if not overridden by Color->Logo map)
                if (cycleDesignsFront && !colorToLogoMap) {
                    const url = cycleDesignsFront[nextIndex % cycleDesignsFront.length];
                    if (url) {
                        const filename = urlToFilename?.[url] || url.split('/').pop()?.split('?')[0] || '';
                        const mapped = designColorMap?.[filename];
                        if (mapped && mapped.length > 0) {
                            // Intersect
                            const currentList = Array.from(validColorsSet);
                            validColorsSet = new Set(mapped.filter(c => currentList.includes(c)));
                        }
                    }
                }

                // 2. Check Back Design Constraint
                if (cycleDesignsBack) {
                    const url = cycleDesignsBack[nextIndex % cycleDesignsBack.length];
                    if (url) {
                        const filename = urlToFilename?.[url] || url.split('/').pop()?.split('?')[0] || '';
                        const mapped = designColorMap?.[filename];
                        if (mapped && mapped.length > 0) {
                            // Intersect
                            const currentList = Array.from(validColorsSet);
                            validColorsSet = new Set(mapped.filter(c => currentList.includes(c)));
                        }
                    }
                }

                // 3. Check Color->Logo Map Constraint (Hoodie Front)
                if (colorToLogoMap) {
                    const keys = Object.keys(colorToLogoMap);
                    if (keys.length > 0) {
                        const currentList = Array.from(validColorsSet);
                        validColorsSet = new Set(keys.filter(c => currentList.includes(c)));
                    }
                }

                let allowedColors = Array.from(validColorsSet);
                // Fallback to avoid crash if intersection is empty
                if (allowedColors.length === 0) {
                    allowedColors = AUTO_CYCLE_COLORS;
                }

                // Filtering based on GLOBAL Active Colors (prevent collisions)
                if (activeColorsRef && productId) {
                    const currentlyUsedColors = Object.values(activeColorsRef.current);
                    // Filter allowedColors to remove those already in use (except by self, though self is about to change)
                    const availableUnique = allowedColors.filter(c => !currentlyUsedColors.includes(c));

                    // If we have unique options, use them. Otherwise fallback to allowedColors (better to duplicate than crash)
                    if (availableUnique.length > 0) {
                        allowedColors = availableUnique;
                    }
                }

                // Pick a new random color from Allowed List
                const currentColorHex = '#' + targetColorRef.current.getHexString();

                // Filter out current color to GUARANTEE different color
                const differentColors = allowedColors.filter(c => c.toLowerCase() !== currentColorHex.toLowerCase());

                // Use filtered list if we have options, otherwise allow same color (only 1 color available)
                const colorPool = differentColors.length > 0 ? differentColors : allowedColors;
                let newColor = colorPool[Math.floor(Math.random() * colorPool.length)];

                // Update the global ref with my new color
                if (activeColorsRef && productId) {
                    activeColorsRef.current[productId] = newColor;
                }

                // Trigger COLOR swipe transition
                previousColorRef.current.copy(targetColorRef.current);
                targetColorRef.current.set(newColor);
                colorTransitionProgress.current = 0;
                isColorTransitioning.current = true;
                colorTransitionTimeRef.current = 0;

                holoShaderMaterialsRef.current.forEach(mat => {
                    if (mat.userData?.uniforms) {
                        mat.userData.uniforms.uOldColor.value.copy(previousColorRef.current);
                        mat.userData.uniforms.uNewColor.value.set(newColor);
                        mat.userData.uniforms.uRevealProgress.value = 0;
                    }
                });

                // Update color matched front design if map exists
                if (colorToLogoMap) {
                    const logo = colorToLogoMap[newColor];
                    if (logo) {
                        setColorMatchedFrontDesign(logo);
                    } else {
                        setColorMatchedFrontDesign(null);
                    }
                }
            }

            // Trigger DESIGN glitch transition (Always)
            designTransitionProgress.current = 0;
            isDesignTransitioning.current = true;
            designTransitionTimeRef.current = 0;

            // Enable glitch for both zones during auto-cycle
            isGlitchingFront.current = true;
            isGlitchingBack.current = true;

            frontMaterialsRef.current.forEach(mat => {
                if (mat.userData?.uniforms) {
                    mat.userData.uniforms.uGlitchIntensity.value = 0;
                }
            });
            backMaterialsRef.current.forEach(mat => {
                if (mat.userData?.uniforms) {
                    mat.userData.uniforms.uGlitchIntensity.value = 0;
                }
            });


        };

        // GLOBAL SYNC: All products sync to the same clock based on Date.now()
        // This ensures all products transition together regardless of mount order
        const now = Date.now();
        const elapsed = now % cycleDuration;
        const timeUntilNextCycle = cycleDuration - elapsed;

        let intervalId: NodeJS.Timeout;

        // Wait until the next global cycle point, then run every cycleDuration
        const timeoutId = setTimeout(() => {
            runCycle(); // Run at the next global sync point
            intervalId = setInterval(runCycle, cycleDuration);
        }, timeUntilNextCycle);

        return () => {
            clearTimeout(timeoutId);
            if (intervalId) clearInterval(intervalId);
        };
    }, [isCycling, cycleDuration, enableColorCycle, cycleDesignsFront, cycleDesignsBack, colorToLogoMap, designColorMap, urlToFilename]);

    // Sync Cycle State with Parent
    // This ensures that when the user starts interacting, the React state matches the last cycled design
    const lastNotifiedDesigns = useRef({ front: '', back: '' });

    useEffect(() => {
        if (isActive && !hasUserInteracted && onDesignsUpdate) {
            const currentFront = (strictColorSyncFront || colorMatchedFrontDesign || frontCycleUrl || designs?.front || '');
            const currentBack = (backCycleUrl || designs?.back || '');

            // PREVENT INFINITE LOOPS: Only notify if actually changed
            if (lastNotifiedDesigns.current.front !== currentFront || lastNotifiedDesigns.current.back !== currentBack) {
                lastNotifiedDesigns.current = { front: currentFront, back: currentBack };
                onDesignsUpdate({ front: currentFront, back: currentBack });
            }
        }
    }, [isActive, hasUserInteracted, frontCycleUrl, backCycleUrl, strictColorSyncFront, colorMatchedFrontDesign, designs?.front, designs?.back, onDesignsUpdate]);

    // Update State Ref on every render to ensure useFrame has latest values
    stateRef.current = {
        isActive,
        isCustomizing,
        frontUrl,
        backUrl,
        label,
        activeZone,
        mode,
        designTransitionProgress: designTransitionProgress.current,
        hasUserInteracted,
        isCycling
    };

    // Animation Loop
    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // Destructure from ref to avoid stale closures
        const {
            isActive,
            isCustomizing,
            frontUrl,
            backUrl,
            label,
            activeZone,
            mode
        } = stateRef.current;

        // SAFETY OVERRIDE: Enforce suppression in animation loop
        // This guarantees background products stay hidden regardless of frontUrl glitches
        const shouldHide = isCustomizing && !isActive;
        const effectiveFrontUrl = shouldHide ? null : frontUrl;
        const effectiveBackUrl = shouldHide ? null : backUrl;

        // IMMEDIATE FORCE: If shouldHide, forcefully hide all print materials NOW
        // This runs at the very start of every frame to guarantee suppression
        if (shouldHide) {
            frontMaterialsRef.current.forEach(mat => { mat.visible = false; });
            backMaterialsRef.current.forEach(mat => { mat.visible = false; });
        }

        // Clamp delta to prevent huge jumps on lag spikes
        const clampedDelta = Math.min(delta, 0.1);

        // ENTRANCE ANIMATION: Spring-like pop-in effect
        if (!hasAnimatedIn && isLoaded) {
            entranceProgress.current += clampedDelta * 3.5; // Speed of entrance
            if (entranceProgress.current >= 1) {
                entranceProgress.current = 1;
                setHasAnimatedIn(true);
            }
        }

        // Elastic ease-out for bouncy pop-in effect
        const elasticEase = (t: number) => {
            if (t === 0 || t === 1) return t;
            const p = 0.3;
            return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
        };
        const entranceMultiplier = isLoaded ? elasticEase(entranceProgress.current) : 0;

        // 1. POSITION & SCALE INTERPOLATION
        const targetPosition = new THREE.Vector3(...position);
        currentPosition.current.lerp(targetPosition, clampedDelta * 3.0);
        groupRef.current.position.copy(currentPosition.current);

        // Uniform scale with entrance animation
        const targetScale = scale * entranceMultiplier;
        currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, clampedDelta * 4.0);
        groupRef.current.scale.set(
            currentScale.current,
            currentScale.current,
            currentScale.current
        );

        // 2. Rotation logic
        let targetRotation = rotationOffset;

        if (isFullscreen) {
            targetRotation = 0;

            // Robust Shortest Path Rotation
            let diff = (targetRotation - groupRef.current.rotation.y) % (Math.PI * 2);
            if (diff < -Math.PI) diff += Math.PI * 2;
            if (diff > Math.PI) diff -= Math.PI * 2;
            groupRef.current.rotation.y += diff * clampedDelta * 2;

            // Auto-rotate the model if user is customizing 'back' so they see it?
            // Or let them rotate manually.
            if (activeZone === 'back' && isActive) {
                // Perhaps rotate 180?
                // Let's NOT force rotation logic here to keep it simple, user has OrbitControls.
                // But usually UX expects camera or model to flip.
                // Given "isFuulScreen", user has control.
            }

        } else if (mode === 'showcase') {
            // HOVER ROTATION: If hovered, stop spinning and face camera (rotation Y = 0)
            if (hovered) {
                const targetY = 0;
                let diff = (targetY - groupRef.current.rotation.y) % (Math.PI * 2);
                if (diff < -Math.PI) diff += Math.PI * 2;
                if (diff > Math.PI) diff -= Math.PI * 2;
                groupRef.current.rotation.y += diff * clampedDelta * 4;
            } else {
                // Continue auto-rotation
                groupRef.current.rotation.y += 0.5 * clampedDelta;
            }
        } else if (isActive) {
            // ACTIVE in carousel/customizer view: Stop spinning, face the print area (based on activeZone)
            if (activeZone === 'back') {
                targetRotation = Math.PI; // 180 degrees to show back
            } else {
                targetRotation = 0; // Front-facing to show main print area
            }

            let diff = (targetRotation - groupRef.current.rotation.y) % (Math.PI * 2);
            if (diff < -Math.PI) diff += Math.PI * 2;
            if (diff > Math.PI) diff -= Math.PI * 2;
            groupRef.current.rotation.y += diff * clampedDelta * 4;
        } else {
            // Fallback (inactive others)
            let diff = (rotationOffset - groupRef.current.rotation.y) % (Math.PI * 2);
            if (diff < -Math.PI) diff += Math.PI * 2;
            if (diff > Math.PI) diff -= Math.PI * 2;
            groupRef.current.rotation.y += diff * clampedDelta * 4;
        }

        // 2. Smooth Color Transition
        if (isActive || enableColorCycle || mode === 'showcase') {
            // Standard lerp for non-hoodie products
            bodyMaterialsRef.current.forEach(mat => {
                const speed = isCustomizing ? 10 : 5;
                mat.color.lerp(targetColorRef.current, speed * clampedDelta);
            });
        }

        // 2a. DYNAMIC BOUNDS UPDATE (Stable World Space) 
        // We recalculate the World Bounding Box every frame to ensure the holographic lines 
        // "stick" to the model even when it floats or animates.
        if (holoShaderMaterialsRef.current.length > 0 && clonedScene) {
            // FIX: Force matrix update to ensure we capture the latest position from Float/Animations
            // This prevents the "swimming/wobble" of the texture effectively.
            clonedScene.updateMatrixWorld(true);

            // Calculate current World AABB
            // We use clonedScene (the model) specifically to avoid including Text/UI elements in the group.
            const bbox = new THREE.Box3().setFromObject(clonedScene);
            const worldH = bbox.max.y - bbox.min.y;
            const worldMin = bbox.min.y;

            holoShaderMaterialsRef.current.forEach(mat => {
                if (mat.userData?.uniforms) {
                    if (mat.userData.uniforms.uModelHeight) mat.userData.uniforms.uModelHeight.value = worldH;
                    if (mat.userData.uniforms.uModelMinY) mat.userData.uniforms.uModelMinY.value = worldMin;
                }
            });
        }

        // 2b. Holographic Swipe Animation - COLOR TRANSITION (Cycle-enabled products)
        if (enableColorCycle && holoShaderMaterialsRef.current.length > 0) {
            // Update time uniform for scanline animation on body materials
            colorTransitionTimeRef.current += clampedDelta;

            holoShaderMaterialsRef.current.forEach(mat => {
                if (mat.userData?.uniforms) {
                    mat.userData.uniforms.uTime.value = colorTransitionTimeRef.current;
                }
            });

            // Animate COLOR transition (body materials only)
            if (isColorTransitioning.current && colorTransitionProgress.current < 1) {
                const transitionSpeed = 1.2;
                colorTransitionProgress.current += clampedDelta * transitionSpeed;

                // Removed easeOut as per user request to fix "flicker/lag" at end
                const easedProgress = Math.min(colorTransitionProgress.current, 1);

                // Update body materials ONLY
                holoShaderMaterialsRef.current.forEach(mat => {
                    if (mat.userData?.uniforms) {
                        mat.userData.uniforms.uRevealProgress.value = easedProgress;
                    }
                });

                // Color transition complete
                if (colorTransitionProgress.current >= 1) {
                    colorTransitionProgress.current = 1;
                    isColorTransitioning.current = false;

                    holoShaderMaterialsRef.current.forEach(mat => {
                        if (mat.userData?.uniforms) {
                            mat.userData.uniforms.uOldColor.value.copy(targetColorRef.current);
                            mat.userData.uniforms.uRevealProgress.value = 1;
                        }
                    });
                }
            }
        }

        // 2c. Digital Glitch Animation - DESIGN TRANSITION (print materials only)
        if (frontMaterialsRef.current.length > 0 || backMaterialsRef.current.length > 0) {
            // Update time uniform for print materials (continues running for ambient effects)
            designTransitionTimeRef.current += clampedDelta;

            frontMaterialsRef.current.forEach(mat => {
                if (mat.userData?.uniforms) {
                    mat.userData.uniforms.uTime.value = designTransitionTimeRef.current;
                }
            });
            backMaterialsRef.current.forEach(mat => {
                if (mat.userData?.uniforms) {
                    mat.userData.uniforms.uTime.value = designTransitionTimeRef.current;
                }
            });

            // Animate DESIGN transition with glitch effect (print materials only)
            if (isDesignTransitioning.current && designTransitionProgress.current < 1) {
                // Slower transition for more visible glitch effect
                const transitionSpeed = 1.5;

                // --- DEFERRED SWAP LOGIC ---
                // We advance the glitch. When we cross 0.5 (Peak), we swap the texture.

                const prevProgress = designTransitionProgress.current;
                designTransitionProgress.current += clampedDelta * transitionSpeed;
                const currentProgress = designTransitionProgress.current;

                // Detect crossing 0.5 threshold
                if (prevProgress < 0.5 && currentProgress >= 0.5) {
                    // SWAP TEXTURES NOW (At peak blockage)
                    if (isGlitchingFront.current && hasPendingFrontUpdate.current && pendingFrontTexRef.current) {
                        setFrontTextureBase(pendingFrontTexRef.current);
                        hasPendingFrontUpdate.current = false;
                    }
                    if (isGlitchingBack.current && hasPendingBackUpdate.current && pendingBackTexRef.current) {
                        setBackTextureBase(pendingBackTexRef.current);
                        hasPendingBackUpdate.current = false;
                    }
                }

                // Bell curve for glitch intensity: peaks at 0.5, zero at 0 and 1
                const progress = Math.min(designTransitionProgress.current, 1);
                // Using a sine wave to create smooth ramp up/down
                const glitchIntensity = Math.sin(progress * Math.PI);

                // Update print materials with glitch intensity AND reveal progress
                // Conditionally apply based on which zone triggered the glitch
                if (isGlitchingFront.current) {
                    frontMaterialsRef.current.forEach(mat => {
                        if (mat.userData?.uniforms) {
                            mat.userData.uniforms.uGlitchIntensity.value = glitchIntensity;
                            mat.userData.uniforms.uRevealProgress.value = progress; // Restored fade
                        }
                    });
                }

                if (isGlitchingBack.current) {
                    backMaterialsRef.current.forEach(mat => {
                        if (mat.userData?.uniforms) {
                            mat.userData.uniforms.uGlitchIntensity.value = glitchIntensity;
                            mat.userData.uniforms.uRevealProgress.value = progress; // Restored fade
                        }
                    });
                }

                // Design transition complete
                if (designTransitionProgress.current >= 1) {
                    designTransitionProgress.current = 1;
                    isDesignTransitioning.current = false;

                    // Reset glitch intensity and set reveal to complete
                    frontMaterialsRef.current.forEach(mat => {
                        if (mat.userData?.uniforms) {
                            mat.userData.uniforms.uGlitchIntensity.value = 0;
                            mat.userData.uniforms.uRevealProgress.value = 1;
                        }
                    });
                    backMaterialsRef.current.forEach(mat => {
                        if (mat.userData?.uniforms) {
                            mat.userData.uniforms.uGlitchIntensity.value = 0;
                            mat.userData.uniforms.uRevealProgress.value = 1;
                        }
                    });
                }
            }
        }

        // 3. Hover Glow & Base Opacity
        const targetEmissive = (hovered || isActive) && !isCustomizing ? new THREE.Color(0x222222) : new THREE.Color(0x000000);
        const targetOp = mode === 'showcase' || isActive ? 1 : 0.05;
        // Slower transition for smoothness
        currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, targetOp, clampedDelta * 2.5);

        bodyMaterialsRef.current.forEach(mat => {
            mat.emissive.lerp(targetEmissive, 5 * clampedDelta);
            mat.opacity = currentOpacity.current;

            // Logic:
            // 1. If nearly opaque (> 0.99), treat as SOLID (transparent=false) for correct Z-buffer.
            // 2. If fading/ghost (< 0.99), treat as TRANSPARENT (transparent=true).
            //    - Keep depthWrite=true to ensure the model looks "solid" while fading.
            //    - Disable alphaTest so "Net" and cutouts fade smoothly.

            if (mat.opacity >= 0.99) {
                // Active / Opaque Mode
                mat.transparent = false;
                mat.depthWrite = true;

                // Restore alphaTest for mapped materials like the Cap Net
                if (mat.map || mat.alphaMap) {
                    mat.alphaTest = 0.5;
                } else {
                    mat.alphaTest = 0;
                }
            } else {
                // Fading / Ghost Mode
                mat.transparent = true;
                mat.depthWrite = true; // Keep depth write for stable fade
                mat.alphaTest = 0;     // smooth alpha blending
            }
        });

        // 4. Fade Logic REMOVED (Conflicted with Glitch)
        // We now rely purely on the Glitch Transition (triggered by URL change or runCycle)
        // to mask the design swap. Opacity stays at 1 (unless hidden by customizing logic).
        if (frontMaterialsRef.current.length > 0) {
            const shouldCycle = stateRef.current.isCycling;
            if (shouldCycle) {
                // Ensure opacity is 1 so glitch is visible
                frontMaterialsRef.current.forEach(mat => {
                    mat.opacity = 1;
                    mat.visible = !shouldHide;
                });
                backMaterialsRef.current.forEach(mat => {
                    mat.opacity = 1;
                    mat.visible = !shouldHide;
                });
            } else {
                // Ensure opacity is 1 when not cycling
                frontMaterialsRef.current.forEach(mat => {
                    mat.opacity = 1;
                    mat.visible = !!effectiveFrontUrl;
                });
                backMaterialsRef.current.forEach(mat => {
                    mat.opacity = 1;
                    mat.visible = !!effectiveBackUrl;
                });
            }
        }
    });

    return (
        <group
            ref={groupRef}
            onClick={onClick}
            onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; setHovered(false); }}
        >
            <Float
                speed={isActive || mode === 'showcase' ? 1 : 0.5}
                rotationIntensity={isActive || mode === 'showcase' ? 0.2 : 0.1}
                floatIntensity={(isActive || mode === 'showcase' ? 2.0 : 1.0) / (scale || 1)}
            >
                {/* Scale handled in parent group via useFrame */}
                <primitive object={clonedScene} />
            </Float>

            {/* Hover Labels - Product Name and Price (Showcase mode only) */}
            {mode === 'showcase' && hovered && (
                <group position={[0, textYOffset / (scale || 1) + 0.2, 2.0 / (scale || 1)]}>
                    {/* Product Name */}
                    <Text
                        font="/fonts/DynaPuff-Bold.ttf"
                        fontSize={0.25 / (scale || 1)}
                        color="#ffffff"
                        anchorX="center"
                        anchorY="bottom"
                        textAlign="center"
                        maxWidth={2}
                        lineHeight={1.1}
                    >
                        {label}
                    </Text>
                    {/* Product Price */}
                    {price && (
                        <Text
                            font="/fonts/DynaPuff-Bold.ttf"
                            fontSize={0.2 / (scale || 1)}
                            color="#ffffff"
                            anchorX="center"
                            anchorY="top"
                            position={[0, -0.05 / (scale || 1), 0]}
                        >
                            {price.toFixed(2)}€
                        </Text>
                    )}
                </group>
            )}

        </group>
    );
};

interface ShopSceneProps {
    onSelectProduct: (product: 'hoodie' | 'tshirt' | 'cap' | 'bottle') => void;
    selectedProduct: 'hoodie' | 'tshirt' | 'cap' | 'bottle' | null;
    isCustomizing: boolean;
    selectedColor: string;
    designs?: { front: string; back: string };
    selectedDesign?: string; // Legacy support
    activeZone?: 'front' | 'back';
    mode?: 'showcase' | 'customizing';
    isFullscreen?: boolean;
    products?: any; // Start receiving product data
    colorToLogoMap?: Record<string, string>;
    hasUserInteracted?: boolean;
    logoList?: string[];
    hoodieBackList?: string[];
    vintageList?: string[];
    allDesignsList?: string[];
    designColorMap?: Record<string, string[]>;
    urlToFilename?: Record<string, string>;
    onCycleDesignUpdate?: (designs: { front: string; back: string }) => void;
    designReplacements?: Record<string, string>;
    // Product-specific allowed colors from shop config
    productAllowedColors?: {
        tshirt?: string[];
        hoodie?: string[];
        cap?: string[];
        bottle?: string[];
    };
    // Product-specific restricted designs from shop config
    productRestrictedDesigns?: {
        tshirt?: string[];
        hoodie?: string[];
        cap?: string[];
        bottle?: string[];
    };
}

export const ShopScene = ({
    onSelectProduct,
    selectedProduct,
    isCustomizing,
    selectedColor,
    designs,
    selectedDesign,
    activeZone,
    mode = 'customizing',
    isFullscreen = false,
    products: productData = {},
    colorToLogoMap,
    hasUserInteracted = false,
    logoList,
    hoodieBackList,
    vintageList,
    allDesignsList,
    designColorMap,
    urlToFilename,
    onCycleDesignUpdate,
    designReplacements,
    productAllowedColors,
    productRestrictedDesigns
}: ShopSceneProps) => {


    // Memoize the clean list for Cap - filter out restricted designs from shop config
    const capCleanList = useMemo(() => {
        const restricted = productRestrictedDesigns?.cap || ['street-5.png'];
        return (allDesignsList || logoList || []).filter(d => {
            const fname = urlToFilename?.[d] || d.split('/').pop()?.split('?')[0] || '';
            return !restricted.includes(fname);
        });
    }, [allDesignsList, logoList, urlToFilename, productRestrictedDesigns]);

    // Memoize the clean list for Bottle - filter out restricted designs from shop config
    const bottleCleanList = useMemo(() => {
        const restricted = productRestrictedDesigns?.bottle || [];
        if (restricted.length === 0) {
            // Default to Logos only for Bottle if no specific restrictions are present
            return logoList || [];
        }
        return (allDesignsList || logoList || []).filter(d => {
            const fname = urlToFilename?.[d] || d.split('/').pop()?.split('?')[0] || '';
            return !restricted.includes(fname);
        });
    }, [allDesignsList, logoList, urlToFilename, productRestrictedDesigns]);

    // Memoize the clean list for T-Shirt
    const tshirtCleanFront = useMemo(() => {
        const restricted = productRestrictedDesigns?.tshirt || [];
        // T-shirt uses logos for front by default logic
        return (logoList || []).filter(d => {
            const fname = urlToFilename?.[d] || d.split('/').pop()?.split('?')[0] || '';
            return !restricted.includes(fname);
        });
    }, [logoList, urlToFilename, productRestrictedDesigns]);

    const tshirtCleanBack = useMemo(() => {
        const restricted = productRestrictedDesigns?.tshirt || [];
        // T-shirt uses vintage or back list for back by default logic
        return (vintageList || hoodieBackList || []).filter(d => {
            const fname = urlToFilename?.[d] || d.split('/').pop()?.split('?')[0] || '';
            return !restricted.includes(fname);
        });
    }, [vintageList, hoodieBackList, urlToFilename, productRestrictedDesigns]);

    // Memoize the clean list for Hoodie
    const hoodieCleanFront = useMemo(() => {
        const restricted = productRestrictedDesigns?.hoodie || [];
        return (logoList || []).filter(d => {
            const fname = urlToFilename?.[d] || d.split('/').pop()?.split('?')[0] || '';
            return !restricted.includes(fname);
        });
    }, [logoList, urlToFilename, productRestrictedDesigns]);

    const hoodieCleanBack = useMemo(() => {
        const restricted = productRestrictedDesigns?.hoodie || [];
        return (hoodieBackList || []).filter(d => {
            const fname = urlToFilename?.[d] || d.split('/').pop()?.split('?')[0] || '';
            return !restricted.includes(fname);
        });
    }, [hoodieBackList, urlToFilename, productRestrictedDesigns]);

    // Compatibility shim
    const effectiveDesigns = designs || { front: selectedDesign || "", back: "" };

    // Always default to tshirt if null, but parent should handle this.
    const activeId = selectedProduct || 'tshirt';

    // Sequential Loading State: Track which models are ready to render
    // Order: cap (smallest) -> bottle -> tshirt -> hoodie (largest)
    // Sequential Loading State: Track which models are ready to render
    // Order: cap (smallest) -> bottle -> tshirt -> hoodie (largest)
    const [loadedModels, setLoadedModels] = useState<Set<string>>(new Set());
    const [currentLoadIndex, setCurrentLoadIndex] = useState(0);

    // Initial loading overlay - show for minimum 2 seconds
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    useEffect(() => {
        const minLoadingTimer = setTimeout(() => {
            setIsInitialLoading(false);
        }, 2000);
        return () => clearTimeout(minLoadingTimer);
    }, []);

    const isFullyLoaded = loadedModels.size >= MODEL_LOAD_ORDER.length && !isInitialLoading;
    const loadingProgress = (loadedModels.size / MODEL_LOAD_ORDER.length) * 100;

    // Callback when a model finishes loading - trigger next model load
    const handleModelLoaded = useCallback((modelId: string) => {
        setLoadedModels(prev => {
            const newSet = new Set(prev);
            newSet.add(modelId);
            return newSet;
        });
        // Move to next model in queue
        setCurrentLoadIndex(prev => Math.min(prev + 1, MODEL_LOAD_ORDER.length));
    }, []);

    // Check if a specific model should render (is allowed to load)
    const shouldRenderModel = useCallback((modelId: string) => {
        const modelIndex = MODEL_LOAD_ORDER.findIndex(m => m.id === modelId);
        return modelIndex <= currentLoadIndex;
    }, [currentLoadIndex]);

    // Check if a model has finished loading (for entrance animation)
    const isModelLoaded = useCallback((modelId: string) => {
        return loadedModels.has(modelId);
    }, [loadedModels]);

    // Define products order
    const products: ('hoodie' | 'tshirt' | 'cap' | 'bottle')[] = ['hoodie', 'tshirt', 'cap', 'bottle'];

    const getProductState = (productId: 'hoodie' | 'tshirt' | 'cap' | 'bottle') => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

        // Carousel Index Math
        const activeIndex = products.indexOf(activeId);
        const myIndex = products.indexOf(productId);

        // Calculate steps from active (0 to 3) circular
        const diff = (myIndex - activeIndex + 4) % 4;

        // Base Scale Config
        let scale = 1;
        if (productId === 'hoodie') scale = isMobile ? 4.0 : 5.0;
        if (productId === 'tshirt') scale = isMobile ? 4.8 : 5.5;
        if (productId === 'cap') scale = isMobile ? 1.0 : 1.2;
        if (productId === 'bottle') scale = isMobile ? 9.0 : 12.0;

        // Base Y Position
        let yPos = 0;
        if (productId === 'hoodie') yPos = isMobile ? -1.0 : -1.2;
        if (productId === 'tshirt') yPos = isMobile ? -1.0 : -1.2;
        if (productId === 'cap') yPos = isMobile ? 0.3 : 0.5;
        if (productId === 'bottle') yPos = isMobile ? 0.2 : -0.2;

        let pos: [number, number, number] = [0, 0, 0];

        if (isFullscreen) {
            if (diff === 0) {
                // Active in Fullscreen
                pos = [0, yPos, 0];
                // Specific Adjustments
                if (productId === 'hoodie') pos = [0, -1, 0];
                if (productId === 'tshirt') pos = [0, -1, 0];
                if (productId === 'cap' && !isMobile) pos = [0, 0.5, 0];
                if (productId === 'bottle') pos = [0, -0.5, 0]; // Adjusted for new center origin
            } else {
                pos = [0, 100, 0]; // Hide offscreen
                scale = 0;
            }
        } else if (mode === 'showcase') {
            // Intro Scene: Linear Display
            if (isMobile) {
                // Mobile Showcase - Compact 2x2 Grid that fits screen
                if (productId === 'tshirt') {
                    pos = [-0.8, 1.5, -2]; scale = 3.0; // Top Left
                } else if (productId === 'hoodie') {
                    pos = [0.8, -1.2, -1]; scale = 2.8; // Bottom Right
                } else if (productId === 'bottle') {
                    pos = [-0.8, -1.2, 0]; scale = 6.5; // Bottom Left (Raised)
                } else if (productId === 'cap') {
                    pos = [1.0, 2.6, -2]; scale = 0.58; // Top Right (Left/Up adjustment)
                }
            } else {
                // Desktop Showcase - Linear but slightly tighter to center
                if (productId === 'bottle') {
                    pos = [-4.5, -0.2, 0];
                    scale = 10.0;
                } else if (productId === 'tshirt') {
                    pos = [-1.5, -1.2, 1];
                    scale = 4.5;
                } else if (productId === 'hoodie') {
                    pos = [1.5, -1.2, 1];
                    scale = 4.0;
                } else if (productId === 'cap') {
                    pos = [4.5, 0.5, 0];
                    scale = 1.0;
                }
            }
        } else {
            // Carousel Layout (Customizing)
            if (diff === 0) {
                // ACTIVE (Front)
                pos = [0, yPos, 2];
            } else if (diff === 1) {
                // RIGHT (+1 step)
                // Tightened X from 3.5 to 2.8 to keep on screen
                pos = [2.8, 0, -4];
                scale *= 0.6; // Smaller side items
            } else if (diff === 2) {
                // BACK (+2 steps, opposite) - Hide or fade far back
                // Moving back behind everything
                pos = [0, 1, -8];
                scale *= 0.4;
            } else if (diff === 3) {
                // LEFT (+3 steps, aka -1 step)
                // Tightened X from -3.5 to -2.8
                pos = [-2.8, 0, -4];
                scale *= 0.6; // Smaller side items
            }

            // Mobile Adjustments for Carousel
            if (isMobile) {
                if (diff === 1) { // Right
                    pos = [1.5, 0, -5];
                    scale *= 0.5;
                } else if (diff === 3) { // Left
                    pos = [-1.5, 0, -5];
                    scale *= 0.5;
                } else if (diff === 2) { // Back
                    pos = [0, 2, -10]; // Push further back
                    scale *= 0.3;
                }
            }
        }

        return { pos, scale, isActive: diff === 0 || mode === 'showcase' };
    };

    return (
        <div className="w-full h-full absolute inset-0">
            {/* Loading Skeleton Overlay - Individual cards fade out as models load */}
            <div className={`absolute inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${isFullyLoaded ? 'opacity-0' : 'opacity-100'}`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-7xl px-4 md:px-12 mb-8">
                    {MODEL_LOAD_ORDER.map((item, i) => {
                        const isLoaded = loadedModels.has(item.id);
                        // Show if global warmup active OR item not loaded yet
                        const isVisible = isInitialLoading || !isLoaded;
                        // Active = currently loading this specific item
                        const isActive = currentLoadIndex === i;

                        return (
                            <div
                                key={item.id}
                                className={`aspect-[3/5] rounded-3xl border border-white/10 shadow-lg relative overflow-hidden backdrop-blur-[2px] transition-all duration-700 ease-out transform
                                    ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                                    ${isActive ? 'bg-white/10 border-white/20' : 'bg-white/5'}
                                `}
                            >
                                {/* Shimmer Effect (only when active/waiting) */}
                                {isVisible && (
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                )}

                                {/* Per-Product Loading Bar (Bottom) */}
                                <div className="absolute bottom-4 left-4 right-4">
                                    <div className="h-1 bg-black/20 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ease-out ${isLoaded ? 'bg-green-400 w-full' : (isActive ? 'bg-white animate-pulse w-1/2' : 'bg-white/20 w-0')}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <Canvas shadows camera={{ position: [0, 0, 10], fov: 35 }}>
                <CameraHandler isFullscreen={isFullscreen} />
                <Suspense fallback={null}>
                    <ambientLight intensity={0.8} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                    <Environment preset="city" />

                    {isFullscreen && (
                        <OrbitControls
                            makeDefault
                            enableZoom={true}
                            minDistance={5}
                            maxDistance={20}
                            enableDamping
                            dampingFactor={0.05}
                            rotateSpeed={0.5}
                            target={[0, activeId === 'bottle' ? 0 : 0.5, 0]}
                        />
                    )}

                    {(() => {
                        const cycleLogoList = logoList || [];
                        const cycleBackList = hoodieBackList || [];
                        const activeColorsRef = useRef<Record<string, string>>({}); // Shared state for collision detection

                        return (
                            <group position={[0, -1.0, 0]}>
                                {/* Cap - Loads FIRST (smallest) */}
                                <Suspense fallback={null}>
                                    {shouldRenderModel('cap') && (() => {
                                        const { pos, scale, isActive } = getProductState('cap');
                                        return (
                                            <ProductModel
                                                key="cap"
                                                modelUrl="/models/cap_webshop.glb"
                                                position={pos}
                                                scale={scale}
                                                label={`Dišpet
kapa`}
                                                price={productData.cap?.price || 25}
                                                onClick={() => onSelectProduct('cap')}
                                                enableDesignCycle={true}
                                                enableColorCycle={false}
                                                // Cap uses all designs (filtered)
                                                cycleDesignsFront={capCleanList}
                                                isActive={isActive}
                                                isCustomizing={isCustomizing}
                                                initialColor="#231f20"
                                                rotationOffset={0}
                                                color={isActive && activeId === 'cap' ? selectedColor : undefined}
                                                designs={isActive && activeId === 'cap' ? effectiveDesigns : undefined}
                                                activeZone={activeZone}
                                                mode={mode}
                                                isFullscreen={isFullscreen}
                                                textYOffset={0.4}
                                                isLoaded={isModelLoaded('cap')}
                                                onLoadComplete={() => handleModelLoaded('cap')}
                                                hasUserInteracted={hasUserInteracted}
                                                designColorMap={designColorMap}
                                                urlToFilename={urlToFilename}
                                                cycleDuration={6000}
                                                cycleOffset={0}
                                                productId="cap"
                                                activeColorsRef={activeColorsRef}
                                                onDesignsUpdate={onCycleDesignUpdate}
                                                designReplacements={designReplacements}
                                            />
                                        );
                                    })()}
                                </Suspense>

                                {/* Bottle - Loads SECOND */}
                                <Suspense fallback={null}>
                                    {shouldRenderModel('bottle') && (() => {
                                        const { pos, scale, isActive } = getProductState('bottle');
                                        return (
                                            <ProductModel
                                                key="bottle"
                                                modelUrl="/models/bottle-webshop.glb"
                                                position={pos}
                                                scale={scale}
                                                label={`Dišpet
termosica`}
                                                price={productData.bottle?.price || 20}
                                                onClick={() => onSelectProduct('bottle')}
                                                enableDesignCycle={true}
                                                enableColorCycle={true}
                                                // Bottle uses filtered designs (shop config restrictions)
                                                cycleDesignsFront={bottleCleanList || cycleLogoList}
                                                isActive={isActive}
                                                isCustomizing={isCustomizing}
                                                initialColor="#ffffff"
                                                rotationOffset={0}
                                                color={isActive && activeId === 'bottle' ? selectedColor : undefined}
                                                designs={isActive && activeId === 'bottle' ? effectiveDesigns : undefined}
                                                activeZone={activeZone}
                                                mode={mode}
                                                isFullscreen={isFullscreen}
                                                isLoaded={isModelLoaded('bottle')}
                                                onLoadComplete={() => handleModelLoaded('bottle')}
                                                hasUserInteracted={hasUserInteracted}
                                                designColorMap={designColorMap}
                                                urlToFilename={urlToFilename}
                                                cycleDuration={6000}
                                                cycleOffset={0}
                                                swipeDirection="down"
                                                swipeAxis="y" // Reset to Y (Vertical)
                                                allowedCycleColors={productAllowedColors?.bottle || ['#231f20', '#ffffff']}
                                                productId="bottle"
                                                activeColorsRef={activeColorsRef}
                                                onDesignsUpdate={onCycleDesignUpdate}
                                                designReplacements={designReplacements}
                                                textYOffset={-0.5}
                                            />
                                        );
                                    })()}
                                </Suspense>

                                {/* T-Shirt - Loads THIRD */}
                                <Suspense fallback={null}>
                                    {shouldRenderModel('tshirt') && (() => {
                                        const { pos, scale, isActive } = getProductState('tshirt');
                                        return (
                                            <ProductModel
                                                key="tshirt"
                                                modelUrl="/models/tshirt_webshop.glb"
                                                position={pos}
                                                scale={scale}
                                                label={`Dišpet
majica`}
                                                price={productData.tshirt?.price || 35}
                                                onClick={() => onSelectProduct('tshirt')}
                                                enableDesignCycle={true}
                                                enableColorCycle={true}
                                                cycleDesignsFront={tshirtCleanFront}
                                                // T-shirt uses Vintage
                                                cycleDesignsBack={tshirtCleanBack}
                                                isActive={isActive}
                                                isCustomizing={isCustomizing}
                                                initialColor="#231f20"
                                                rotationOffset={0}
                                                color={isActive && activeId === 'tshirt' ? selectedColor : undefined}
                                                designs={isActive && activeId === 'tshirt' ? effectiveDesigns : undefined}
                                                activeZone={activeZone}
                                                mode={mode}
                                                isFullscreen={isFullscreen}
                                                isLoaded={isModelLoaded('tshirt')}
                                                onLoadComplete={() => handleModelLoaded('tshirt')}
                                                colorToLogoMap={colorToLogoMap} // Pass map for strict sync
                                                hasUserInteracted={hasUserInteracted}
                                                designColorMap={designColorMap}
                                                urlToFilename={urlToFilename}
                                                cycleDuration={6000}
                                                cycleOffset={0}
                                                swipeDirection="down"
                                                swipeAxis="y" // Reset to Y (Vertical)
                                                allowedCycleColors={productAllowedColors?.tshirt}
                                                productId="tshirt"
                                                activeColorsRef={activeColorsRef}
                                                onDesignsUpdate={onCycleDesignUpdate}
                                                designReplacements={designReplacements}
                                            />
                                        );
                                    })()}
                                </Suspense>

                                {/* Hoodie - Loads LAST (largest) */}
                                <Suspense fallback={null}>
                                    {shouldRenderModel('hoodie') && (() => {
                                        const { pos, scale, isActive } = getProductState('hoodie');
                                        return (
                                            <ProductModel
                                                key="hoodie"
                                                modelUrl="/models/hoodie-webshop.glb"
                                                position={pos}
                                                scale={scale}
                                                label={`Dišpet
duksica`}
                                                price={productData.hoodie?.price || 50}
                                                onClick={() => onSelectProduct('hoodie')}
                                                enableDesignCycle={true}
                                                enableColorCycle={true}
                                                cycleDesignsFront={hoodieCleanFront}
                                                cycleDesignsBack={hoodieCleanBack}
                                                isActive={isActive}
                                                isCustomizing={isCustomizing}
                                                initialColor="#231f20"
                                                rotationOffset={Math.PI / 8}
                                                color={isActive && activeId === 'hoodie' ? selectedColor : undefined}
                                                designs={isActive && activeId === 'hoodie' ? effectiveDesigns : undefined}
                                                activeZone={activeZone}
                                                mode={mode}
                                                isFullscreen={isFullscreen}
                                                isLoaded={isModelLoaded('hoodie')}
                                                onLoadComplete={() => handleModelLoaded('hoodie')}
                                                colorToLogoMap={colorToLogoMap}
                                                hasUserInteracted={hasUserInteracted}
                                                designColorMap={designColorMap}
                                                urlToFilename={urlToFilename}
                                                cycleDuration={6000}
                                                cycleOffset={0}
                                                swipeDirection="down"
                                                swipeAxis="y" // Retrying Y (Standard) - Suspect "Horizontal" report meant "Horizontal Line" (Correct)
                                                allowedCycleColors={productAllowedColors?.hoodie}
                                                productId="hoodie"
                                                activeColorsRef={activeColorsRef}
                                                onDesignsUpdate={onCycleDesignUpdate}
                                                designReplacements={designReplacements}
                                            />
                                        );
                                    })()}
                                </Suspense>
                            </group>
                        );
                    })()}
                </Suspense>
            </Canvas>
        </div>
    );
};
