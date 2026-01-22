import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { Canvas, createPortal } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, Decal, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface ProductViewerProps {
    modelUrl: string;
    decalUrl: string | null;
    decalScale?: number;
    decalPosition?: [number, number, number];
    textureSettings?: {
        repeat?: [number, number];
        center?: [number, number];
        offset?: [number, number];
        flipX?: boolean;
    };
}

const ModelWithPortal = ({
    modelUrl,
    decalUrl,
    decalScale = 0.2,
    decalPosition = [0, 0.2, 0.15],
    color,
    textureSettings
}: ProductViewerProps & { color: string }) => {
    const { scene } = useGLTF(modelUrl);
    // Clone scene so we can mutate it (add decal child) without affecting cache
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    // Load texture for both Decal and Direct Mapping
    const texture = useTexture(decalUrl || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');

    // Configure Texture
    useEffect(() => {
        // Defaults
        const repeat = textureSettings?.repeat || [1, 1];
        const center = textureSettings?.center || [0.5, 0.5];
        // FORCE default flipX to FALSE to prevent mirroring
        const flipX = textureSettings?.flipX !== undefined ? textureSettings.flipX : false;

        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.center.set(center[0], center[1]);

        // Match Direct Mapping logic - Flip Y by default
        texture.flipY = true;

        if (flipX) {
            texture.repeat.set(-Math.abs(repeat[0]), repeat[1]);
        } else {
            texture.repeat.set(Math.abs(repeat[0]), repeat[1]);
        }

        if (textureSettings?.offset) {
            texture.offset.set(textureSettings.offset[0], textureSettings.offset[1]);
        }

        texture.needsUpdate = true;
    }, [texture, textureSettings]);

    const [targetMesh, setTargetMesh] = useState<THREE.Mesh | null>(null);
    const [useDirectMapping, setUseDirectMapping] = useState(false);

    useEffect(() => {
        let bestForDecal: THREE.Mesh | null = null;
        let maxVolume = 0;
        let foundProxy = false;

        clonedScene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
                const m = obj as THREE.Mesh;
                const normalizeName = m.name.toLowerCase();
                // Strictly target Front Print Area for now to solve "stretching/duplication" issues
                const isPrintArea = normalizeName.includes("print_area_front") || (m.userData.is_print_area === true && m.userData.print_location === 'front');

                // Handle Materials
                if (m.material) {
                    const mat = Array.isArray(m.material) ? m.material[0] : m.material;

                    if (isPrintArea) {
                        // Direct Mapping for Print Area
                        m.material = mat.clone();

                        // Clone texture to ensure unique transform settings per mesh
                        const localTexture = texture.clone();
                        localTexture.needsUpdate = true;

                        // Apply Settings to local texture
                        const repeat = textureSettings?.repeat || [1, 1];
                        const center = textureSettings?.center || [0.5, 0.5];
                        const flipX = textureSettings?.flipX !== undefined ? textureSettings.flipX : true; // FORCE FLIP X

                        localTexture.wrapS = THREE.RepeatWrapping;
                        localTexture.wrapT = THREE.RepeatWrapping;
                        localTexture.center.set(center[0], center[1]);

                        // FIX: Color and Mirroring
                        localTexture.flipY = true;
                        localTexture.colorSpace = THREE.SRGBColorSpace; // Fix "pale" colors

                        (m.material as THREE.MeshStandardMaterial).color.set('#ffffff');
                        (m.material as THREE.MeshStandardMaterial).toneMapped = false; // Disable tone mapping

                        if (flipX) {
                            localTexture.repeat.set(-Math.abs(repeat[0]), repeat[1]);
                        } else {
                            localTexture.repeat.set(Math.abs(repeat[0]), repeat[1]);
                        }

                        if (textureSettings?.offset) {
                            localTexture.offset.set(textureSettings.offset[0], textureSettings.offset[1]);
                        }

                        (m.material as THREE.MeshStandardMaterial).map = localTexture;
                        (m.material as THREE.MeshStandardMaterial).transparent = true;
                        (m.material as THREE.MeshStandardMaterial).needsUpdate = true;

                        foundProxy = true;
                    } else {
                        // Body or other parts - Apply Tint
                        if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                            m.material = mat.clone();
                            (m.material as THREE.MeshStandardMaterial).color.set(color);
                        }
                    }
                }

                // Fallback Decal Logic: Find best mesh for projection if NO proxy found
                if (!foundProxy && !isPrintArea) {
                    // Check bounding box volume
                    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
                    const box = m.geometry.boundingBox;
                    if (box) {
                        const size = new THREE.Vector3();
                        box.getSize(size);
                        const volume = size.x * size.y * size.z;
                        if (volume > maxVolume) {
                            maxVolume = volume;
                            bestForDecal = m;
                        }
                    }
                }
            }
        });

        if (foundProxy) {
            setUseDirectMapping(true);
            setTargetMesh(null); // No decal needed
        } else {
            setUseDirectMapping(false);
            setTargetMesh(bestForDecal);
        }
    }, [clonedScene, color, texture]); // Re-run if texture changes

    return (
        <>
            <primitive object={clonedScene} />

            {/* ONLY render Decal if we are NOT using direct mapping and have a target mesh */}
            {!useDirectMapping && targetMesh && decalUrl && createPortal(
                <Decal
                    debug={false}
                    position={decalPosition}
                    rotation={[0, 0, 0]}
                    scale={decalScale}
                    map={texture}
                />,
                targetMesh
            )}
        </>
    );
};

// Predefined hoodie colors based on user image
const PRODUCT_COLORS = [
    { name: 'Crna', hex: '#1a1a1a' },
    { name: 'Siva', hex: '#808080' },
    { name: 'Tirkizna', hex: '#00695c' },
    { name: 'Cijan', hex: '#00bcd4' },
    { name: 'Plava', hex: '#1976d2' },
    { name: 'Ljubičasta', hex: '#7b1fa2' },
    { name: 'Bijela', hex: '#ffffff' },
    { name: 'Roza', hex: '#ec407a' },
    { name: 'Mint', hex: '#69f0ae' },
];

export default function ProductViewer({ modelUrl, decalUrl, decalScale, decalPosition, textureSettings, colorOverride }: ProductViewerProps & { colorOverride?: string }) {
    const [productColor, setProductColor] = useState(PRODUCT_COLORS[6].hex);

    const activeColor = colorOverride || productColor;

    return (
        <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #00ffbf 0%, #0089cd 100%)' }}>

            {/* Embedded Color Picker Removed - Controls are now external */}

            <Canvas shadows dpr={[1, 2]} camera={{ fov: 45 }}>
                <Suspense fallback={null}>
                    <Stage environment="city" intensity={0.6}>
                        <ModelWithPortal
                            modelUrl={modelUrl}
                            decalUrl={decalUrl}
                            decalScale={decalScale}
                            decalPosition={decalPosition}
                            textureSettings={textureSettings}
                            color={activeColor}
                        />
                    </Stage>
                    <OrbitControls makeDefault />
                </Suspense>
            </Canvas>
        </div>
    );
}

// Preload models
['/models/hoodie-webshop.glb', '/models/cap_webshop.glb', '/models/tshirt_webshop.glb'].forEach(url => useGLTF.preload(url));
