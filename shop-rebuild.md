# Shop Rebuild: Absolute Technical Specification

This document is the definitive source of truth for every variable, constant, and logic fork in the shop system.

## 1. Scene Fundamentals & Camera
- **Viewport**: `<Canvas shadow-map />`.
- **Primary Camera**: Position `[0, 0, 10]`, looking at `[0, 0, 0]`.
- **Lighting**: `<Environment preset="city" />`.
- **Sequential Loading**:
  - Queue: `cap` -> `bottle` -> `tshirt` -> `hoodie`.
  - Logic: Next model starts loading only when `onLoadComplete` is triggered for the current one.

## 2. Product Intelligence & Defaults

### 2.1 Default Configurations
| Product | Mesh Key | Init Color | Base Price |
| :--- | :--- | :--- | :--- |
| **Kapa** (Cap) | `cap` | `#231f20` | 25.00€ |
| **Boca** (Bottle) | `bottle` | `#ffffff` | 20.00€ |
| **Majica** (T-shirt)| `tshirt` | `#231f20` | 35.00€ |
| **Hoodica** (Hoodie)| `hoodie` | `#231f20` | 50.00€ |

### 2.2 Technical Product Specifications (UI Info)
- **Bottle**: 500ml, Inox (Stainless Steel), 12h Hot / 24h Cold, 283g, dimensions: ø70×263 mm.
- **Apparel**: 100% Cotton, 2% max shrinkage, 40°C machine wash.

---

## 3. The Carousel Engine (Math)

### 3.1 Linear-to-Circular Mapping
Indices are mapped using: `diff = (myIndex - activeIndex + 4) % 4`.
- `diff 0`: Active Focus.
- `diff 1`: Right Background.
- `diff 2`: Hidden/Rear.
- `diff 3`: Left Background.

### 3.2 Design Sorting Algorithm
- **Logic**: Numeric alphanumeric sort using `localeCompare(undefined, { numeric: true, sensitivity: 'base' })`.
- **Special Rule**: Files with "BADGE" in the name are prioritized to the **end** of the array.

---

## 4. Advanced Shader Math

### 4.1 Fresnel Rim Logic
Applied to bodies during color transitions:
- **Formula**: `pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0)`.
- **Intensity Modifier**: `0.15 * (1.0 - abs(uRevealProgress - 0.5) * 2.0)`. (Peaks at midpoint).

### 4.2 Rainbow Sweep (Holographic)
- **Holo Edge Weight**: `1.5` exponent.
- **Mix Ratio**: `0.7` Rainbow Glow / `0.3` Scanline Noise.
- **Color Space**: `hsl2rgb` conversion in fragment shader for smooth temporal shifts.

### 4.3 Digital Design Glitch
- **Flicker Alpha Curve**: `pow(abs(uRevealProgress * 2.0 - 1.0), 0.8)`.
- **Block UV Grid**: `floor(vGlitchUv * 6.0)`.
- **Scanline Frequency**: `120.0` for design overlays.

---

## 5. UI Architecture & Styling

### 5.1 Color Variables (Tailwind/CSS)
- **Active Accent**: `#e83e70` (Pink-Red).
- **Background Gradient**: `from-[#00ffbf]` to `to-[#0089cd]`.
- **Dark Mode Overlays**: `bg-black/80` with `backdrop-blur-md`.
- **Light Mode Panels**: `bg-white/80` with `backdrop-blur-md`.

### 5.2 Responsive Layout Logic
- **Showcase 2x2 Grid (Mobile)**:
  - T-shirt: `[-0.8, 1.5, -2]` (Scale 3.0)
  - Cap: `[1.0, 2.6, -2]` (Scale 0.58)
  - Bottle: `[-0.8, -1.2, 0]` (Scale 6.5)
  - Hoodie: `[0.8, -1.2, -1]` (Scale 2.8)

---

## 6. Detailed Logic Gates

### 6.1 Hoodie Customization Exclusion
- **Rule**: `handleDesignSelect(designUrl)` check:
  - `if (product === 'hoodie')`: Update `designs.back` ONLY.
  - `else`: Update `designs[activeZone]`.

### 6.2 Ghost Mode Transition
- **Trigger**: When `!isActive` in Customizing mode.
- **Target Opacity**: `0.05`.
- **State Switch**: If `opacity < 0.99`, `material.transparent = true`. If `opacity >= 0.99`, `material.transparent = false` (to fix Z-order issues for fabric textures).
