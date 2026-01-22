# 3D Decal Projection System - Technical Documentation

This document explains in complete detail how the decal projection system works in this hoodie configurator application. Use this as a reference to rebuild the system elsewhere.

---

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Core Concept: DecalGeometry](#core-concept-decalgeometry)
4. [Print Zone Configuration](#print-zone-configuration)
5. [State Management (Zustand)](#state-management-zustand)
6. [3D Model Setup](#3d-model-setup)
7. [Decal Rendering Component](#decal-rendering-component)
8. [Camera System](#camera-system)
9. [Canvas & Scene Setup](#canvas--scene-setup)
10. [Position Calibration Guide](#position-calibration-guide)

---

## Technology Stack

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.3.1 | UI Framework |
| `three` | ^0.160.0 | 3D Graphics Library |
| `@react-three/fiber` | ^8.18.0 | React renderer for Three.js |
| `@react-three/drei` | ^9.111.5 | Useful helpers for R3F (useGLTF, useTexture, OrbitControls, etc.) |
| `zustand` | ^4.5.0 | State management |
| `vite` | ^5.4.19 | Build tool |

### Key Three.js Import
```typescript
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
```

This is the core class that projects textures onto mesh surfaces.

---

## Project Structure

```
src/
├── components/
│   └── 3d/
│       ├── Experience.tsx    # Canvas, lighting, camera, scene setup
│       └── HoodieModel.tsx   # Model loading, decal rendering
├── store/
│   └── configuratorStore.ts  # Zustand store with print zones config
└── pages/
    └── Index.tsx             # Main page combining UI + 3D view
```

---

## Core Concept: DecalGeometry

`DecalGeometry` from Three.js projects a flat texture onto a 3D mesh surface. It creates a new geometry that conforms to the target mesh's shape.

### Constructor Signature
```typescript
new DecalGeometry(
  targetMesh: THREE.Mesh,      // The mesh to project onto
  position: THREE.Vector3,     // World position of decal center
  rotation: THREE.Euler,       // Orientation of the decal
  size: THREE.Vector3          // Width, height, depth of projection box
)
```

### How It Works
1. Takes a mesh and a position/rotation/size
2. Projects a "box" from that position through the mesh
3. Creates new triangulated geometry that follows the mesh surface
4. You then apply a texture to this geometry

---

## Print Zone Configuration

Located in: `src/store/configuratorStore.ts`

### Type Definitions
```typescript
export type PrintZone = 'front' | 'back';

export interface PrintZoneConfig {
  id: PrintZone;
  name: string;
  position: THREE.Vector3;    // Base position (before model scaling)
  rotation: THREE.Euler;      // Orientation of decal projection
  defaultScale: number;       // Size multiplier for the decal
  color: string;              // UI indicator color (not used for decal)
}
```

### Exact Zone Positions (CRITICAL VALUES)

```typescript
export const PRINT_ZONES: PrintZoneConfig[] = [
  {
    id: 'front',
    name: 'Front Center',
    position: new THREE.Vector3(0, 0.28, 0.12),
    //                          X  Y     Z
    //                          |  |     └── Depth: positive = towards camera (front)
    //                          |  └── Height: 0.28 = upper chest area
    //                          └── Horizontal: 0 = centered
    rotation: new THREE.Euler(0, 0, 0),
    //                        X  Y  Z (radians)
    //                        All 0 = facing forward
    defaultScale: 0.26,
    color: '#22c55e',
  },
  {
    id: 'back',
    name: 'Back Center',
    position: new THREE.Vector3(0, 0.28, -0.1),
    //                          X  Y     Z
    //                          |  |     └── Depth: negative = away from camera (back)
    //                          |  └── Height: same as front
    //                          └── Horizontal: centered
    rotation: new THREE.Euler(0, Math.PI, 0),
    //                        X  Y        Z
    //                        |  └── PI radians (180°) = rotated to face backwards
    //                        └── No tilt
    defaultScale: 0.30,
    color: '#06b6d4',
  },
];
```

### Position Transformation Formula

The model is scaled 2x and offset, so positions must be transformed:

```typescript
// Original zone position from config
const zonePosition = new THREE.Vector3(0, 0.28, 0.12);

// Apply model scale (2x)
const scaledPosition = zonePosition.clone().multiplyScalar(2);
// Result: (0, 0.56, 0.24)

// Apply model offset and centering
scaledPosition.y = scaledPosition.y - 1 + 0.5;
// Result: (0, 0.06, 0.24)
// The -1 accounts for model's Y position, +0.5 centers the decal vertically
```

---

## State Management (Zustand)

### Store State
```typescript
interface ConfiguratorState {
  zoneDesigns: ZoneDesign[];        // Array of applied designs
  selectedZone: PrintZone | null;   // Currently selected zone
  currentTextureUrl: string | null; // Last uploaded image (data URL)
  hoodieColor: string;              // Hex color for hoodie material
  cameraTarget: 'front' | 'back';   // Which side camera points to
}
```

### Zone Design Object
```typescript
interface ZoneDesign {
  zoneId: PrintZone;      // 'front' or 'back'
  textureUrl: string;     // Base64 data URL of image
  scale: number;          // Size of the decal (default from zone config)
}
```

### Key Actions
```typescript
setZoneDesign: (zoneId, textureUrl) => void  // Apply design to zone
removeZoneDesign: (zoneId) => void           // Remove design from zone
selectZone: (zoneId) => void                 // Select zone (auto-moves camera)
setHoodieColor: (color) => void              // Change hoodie color
setCameraTarget: (target) => void            // Move camera to front/back
```

---

## 3D Model Setup

Located in: `src/components/3d/HoodieModel.tsx`

### Model Loading
```typescript
const { scene } = useGLTF('/models/hoodie.glb');
```

The model file is at: `public/models/hoodie.glb`

### Scene Cloning (Important!)
The scene is cloned ONCE and materials are stored for later updates:

```typescript
const clonedScene = useMemo(() => {
  const clone = scene.clone(true);
  let foundMesh: THREE.Mesh | null = null;
  const materials: THREE.MeshStandardMaterial[] = [];

  clone.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Store FIRST mesh for decal projection
      if (!foundMesh) {
        foundMesh = mesh;
      }

      // Clone material for independent color control
      if (mesh.material?.isMeshStandardMaterial) {
        const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
        mat.roughness = 0.8;
        mat.metalness = 0.1;
        mesh.material = mat;
        materials.push(mat);
      }
    }
  });

  materialsRef.current = materials;
  setMainMesh(foundMesh);
  return clone;
}, [scene]); // Only re-run when model changes, NOT on color change
```

### Why Clone Once?
- Changing `hoodieColor` should NOT recreate the scene
- Recreating scene = new mesh reference = decals break
- Color updates happen separately via `useEffect`:

```typescript
useEffect(() => {
  materialsRef.current.forEach((mat) => {
    mat.color.set(hoodieColor);
  });
}, [hoodieColor]);
```

### Model Rendering
```typescript
<primitive 
  object={clonedScene} 
  scale={2}              // Model is scaled 2x
  position={[0, -1, 0]}  // Moved down 1 unit
/>
```

---

## Decal Rendering Component

Located in: `src/components/3d/HoodieModel.tsx` (`ZoneDecal` component)

### Component Props
```typescript
interface ZoneDecalProps {
  design: {
    zoneId: PrintZone;
    textureUrl: string;
    scale: number;
  };
  zoneConfig: PrintZoneConfig;  // From PRINT_ZONES
  targetMesh: THREE.Mesh;       // The hoodie mesh
  isSelected: boolean;
}
```

### Decal Creation Process

```typescript
function ZoneDecal({ design, zoneConfig, targetMesh }) {
  // 1. Load texture from data URL
  const texture = useTexture(design.textureUrl);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  // 2. Create DecalGeometry when dependencies change
  useEffect(() => {
    if (!targetMesh || !targetMesh.geometry) return;

    // CRITICAL: Update mesh world matrix first
    targetMesh.updateMatrixWorld(true);

    // Transform position for model scale/offset
    const scaledPosition = zoneConfig.position.clone().multiplyScalar(2);
    scaledPosition.y = scaledPosition.y - 1 + 0.5;

    // Create size vector (same for all dimensions)
    const size = new THREE.Vector3(
      design.scale * 2, 
      design.scale * 2, 
      design.scale * 2
    );

    // Create the decal geometry
    const decalGeometry = new DecalGeometry(
      targetMesh,
      scaledPosition,
      zoneConfig.rotation,
      size
    );

    setGeometry(decalGeometry);

    // Cleanup on unmount
    return () => decalGeometry.dispose();
  }, [targetMesh, zoneConfig.position, zoneConfig.rotation, design.scale]);

  // 3. Configure texture color space
  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }
  }, [texture]);

  if (!geometry) return null;

  // 4. Render the decal mesh
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        map={texture}
        transparent
        polygonOffset           // Prevents z-fighting
        polygonOffsetFactor={-4}
        depthTest={true}
        depthWrite={false}
        roughness={0.5}
        toneMapped={false}      // Preserves image colors
      />
    </mesh>
  );
}
```

### Key Material Properties

| Property | Value | Purpose |
|----------|-------|---------|
| `transparent` | `true` | Allow transparent PNGs |
| `polygonOffset` | `true` | Enable polygon offset |
| `polygonOffsetFactor` | `-4` | Push decal slightly forward (prevents z-fighting) |
| `depthTest` | `true` | Respect depth buffer |
| `depthWrite` | `false` | Don't write to depth buffer (allows overlapping) |
| `toneMapped` | `false` | Preserve original image colors |

---

## Camera System

Located in: `src/components/3d/Experience.tsx`

### Camera Positions
- **Front view**: `(0, 0, 4)` - Looking at origin from +Z
- **Back view**: `(0, 0, -4)` - Looking at origin from -Z

### Camera Controller (Animated Transitions)

```typescript
function CameraController() {
  const { cameraTarget } = useConfiguratorStore();
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3(0, 0, 4));
  const isAnimatingRef = useRef(false);
  const prevTargetRef = useRef(cameraTarget);
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Skip animation on first mount
    if (isFirstMount.current) {
      isFirstMount.current = false;
      camera.position.set(0, 0, 4);
      camera.lookAt(0, 0, 0);
      return;
    }

    // Only animate if target actually changed
    if (prevTargetRef.current !== cameraTarget) {
      prevTargetRef.current = cameraTarget;
      
      if (cameraTarget === 'front') {
        targetRef.current.set(0, 0, 4);
      } else {
        targetRef.current.set(0, 0, -4);
      }
      isAnimatingRef.current = true;
    }
  }, [cameraTarget, camera]);

  // Animate camera movement
  useFrame(() => {
    if (!isAnimatingRef.current) return;

    const distance = camera.position.distanceTo(targetRef.current);
    if (distance < 0.1) {
      camera.position.copy(targetRef.current);
      camera.lookAt(0, 0, 0);
      isAnimatingRef.current = false;
      return;
    }

    camera.position.lerp(targetRef.current, 0.08);
    camera.lookAt(0, 0, 0);
  });

  return null;
}
```

### Why This Approach?
- **Skip first mount**: Prevents animation on page load
- **Track previous target**: Only animate on actual change (not re-renders)
- **Stop flag**: Once within 0.1 units, snap to position and stop
- **Lerp factor 0.08**: Smooth but not too slow

### OrbitControls Configuration
```typescript
<OrbitControls
  makeDefault
  minPolarAngle={Math.PI / 4}    // Limit looking up (45°)
  maxPolarAngle={Math.PI / 1.5}  // Limit looking down (120°)
  minDistance={2}                 // Min zoom
  maxDistance={8}                 // Max zoom
  enablePan={false}              // Disable panning
/>
```

---

## Canvas & Scene Setup

Located in: `src/components/3d/Experience.tsx`

### Full Canvas Configuration
```typescript
<Canvas
  shadows                        // Enable shadow maps
  dpr={[1, 2]}                  // Device pixel ratio range
  gl={{
    antialias: true,            // Smooth edges
    alpha: true,                // Transparent background support
    preserveDrawingBuffer: true // Required for screenshots
  }}
>
  <color attach="background" args={['#0a0a12']} />
  <fog attach="fog" args={['#0a0a12', 5, 15]} />
  <Scene />
</Canvas>
```

### Lighting Setup
```typescript
// Ambient (base illumination)
<ambientLight intensity={0.4} />

// Main directional light with shadows
<directionalLight
  position={[5, 5, 5]}
  intensity={1}
  castShadow
  shadow-mapSize={[2048, 2048]}
/>

// Fill light from opposite side
<directionalLight position={[-5, 3, -5]} intensity={0.3} />

// Top spotlight
<spotLight
  position={[0, 5, 0]}
  intensity={0.5}
  angle={0.5}
  penumbra={1}
  castShadow
/>

// Environment map for reflections
<Environment preset="city" />
```

### Ground Shadow
```typescript
<ContactShadows
  position={[0, -1.5, 0]}
  opacity={0.4}
  scale={8}
  blur={2.5}
  far={4}
/>
```

---

## Position Calibration Guide

When adapting to a different 3D model:

### Step 1: Find the Model's Bounds
Load model and log its bounding box:
```typescript
const box = new THREE.Box3().setFromObject(scene);
console.log('Model bounds:', box.min, box.max);
console.log('Center:', box.getCenter(new THREE.Vector3()));
```

### Step 2: Identify Target Mesh
Log all meshes to find the main body:
```typescript
scene.traverse((child) => {
  if (child.isMesh) {
    console.log('Mesh:', child.name, child.geometry.boundingBox);
  }
});
```

### Step 3: Test Zone Positions
Start with approximate values and adjust:
```typescript
// Front center chest area (typical values)
position: new THREE.Vector3(0, 0.2-0.3, 0.1-0.2)

// Back center (mirror Z, rotate Y by PI)
position: new THREE.Vector3(0, 0.2-0.3, -0.1 to -0.2)
rotation: new THREE.Euler(0, Math.PI, 0)
```

### Step 4: Account for Model Transformations
If your model uses different scale/position:
```typescript
// Your transformation
const modelScale = 2;
const modelYOffset = -1;

// Adjust zone position
const scaledPosition = zoneConfig.position.clone().multiplyScalar(modelScale);
scaledPosition.y = scaledPosition.y + modelYOffset + 0.5; // 0.5 for centering
```

### Step 5: Adjust Scale
The `defaultScale` value determines decal size:
- Smaller values = smaller decal
- Typical range: 0.2 - 0.5
- Size is multiplied by model scale in rendering

---

## Quick Reference: Key Values

| Setting | Value | Location |
|---------|-------|----------|
| Model scale | `2` | HoodieModel.tsx line 68 |
| Model Y offset | `-1` | HoodieModel.tsx line 69 |
| Front zone position | `(0, 0.28, 0.12)` | configuratorStore.ts |
| Back zone position | `(0, 0.28, -0.1)` | configuratorStore.ts |
| Front zone scale | `0.26` | configuratorStore.ts |
| Back zone scale | `0.30` | configuratorStore.ts |
| Camera front position | `(0, 0, 4)` | Experience.tsx |
| Camera back position | `(0, 0, -4)` | Experience.tsx |
| Camera FOV | `45°` | Experience.tsx line 89 |
| Min zoom distance | `2` | Experience.tsx line 136 |
| Max zoom distance | `8` | Experience.tsx line 137 |
| Default hoodie color | `#1a1a2e` | configuratorStore.ts |

---

## Dependencies Installation

```bash
npm install three @react-three/fiber @react-three/drei zustand
```

For TypeScript:
```bash
npm install -D @types/three
```

---

## Minimal Implementation Checklist

1. ☐ Set up Canvas with react-three-fiber
2. ☐ Load 3D model with useGLTF
3. ☐ Clone scene and find target mesh
4. ☐ Create Zustand store with zone configs
5. ☐ Implement ZoneDecal component with DecalGeometry
6. ☐ Configure material (transparent, polygonOffset, etc.)
7. ☐ Add OrbitControls
8. ☐ Add camera animation for front/back views
9. ☐ Wire up file upload to set texture URL
10. ☐ Store designs in state and render decals

---

*Document generated: December 20, 2024*
