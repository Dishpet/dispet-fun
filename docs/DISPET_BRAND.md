# DISPET — Brand Guidelines (AI-Readable)

Source: Dispet Brand Book (Knjiga standarda) fileciteturn0file0

---

## 1. Purpose
These guidelines define the **visual identity rules** for the Dispet brand.
They must be followed strictly to preserve brand consistency and recognizability
across **digital, print, and physical media**.

---

## 2. Logo
The logo is the central brand identifier and must be used consistently.

---

## 3. Logo Versions
Approved versions:
- **Color Positive** (full color, light backgrounds)
- **Monochrome Negative** (white logo, dark backgrounds)
- **Monochrome Positive** (black logo, light backgrounds)

Rules:
- ❌ No recoloring
- ❌ No distortion
- ❌ No added effects (shadows, outlines, gradients)

---

## 4. Logo Clear Space
A mandatory clear space must surround the logo.

- Clear space = **2x** unit on all sides
- Logo height reference = **12x** unit

No other elements may enter this area (text, icons, shapes, images).

---

## 5. Color System

### 5.1 Primary Colors (Core Palette)
Use these as the primary brand palette.

| Token | HEX |
|---|---|
| pink | `#e83e70` |
| blue | `#43bfe6` |
| yellow | `#ffcd07` |
| green | `#73b72b` |
| lightPink | `#f39fbd` |
| lightBlue | `#8fd2e8` |
| lightYellow | `#fff5b1` |
| lightGreen | `#c8da80` |
| black | `#111519` |
| lightGray | `#f1f1f0` |

---

### 5.2 Secondary Colors (Background / UI / Dark Mode)
These colors are intended primarily for **backgrounds**. The brand book notes that,
depending on context, you should apply a **specific gradient** or a **dark mode** background. fileciteturn0file0L1-L4

| Token | HEX | Intended use |
|---|---|---|
| bgBlue | `#0089cd` | gradient/background |
| navy | `#0d142a` | dark mode/background |
| purple | `#ad00e9` | gradient/background |
| deepBlue | `#0044bf` | gradient/background |
| mint | `#00ffbf` | gradient/background |

---

## 5.3 Gradients (Implementation Guidance)
The PDF shows the logo presented on gradient/dark backgrounds but does **not** specify exact
gradient formulas (angles/stop positions). fileciteturn0file0

Use these rules:

### Allowed gradient inputs
- Gradients should use **only secondary colors** listed above.
- Keep gradients smooth (no harsh banding) and avoid adding extra colors.

### Recommended gradient pairs (safe defaults)
These are **implementation defaults** derived from the shown background usage (not explicitly specified as formulas in the PDF):
- `purple → deepBlue` (vibrant gradient background)
- `navy` as a solid dark mode background (preferred for dark UI)
- `bgBlue → mint` (fresh/cyan gradient background)

### Agent rule
If your system supports design-token gradients:
- Store gradients as **named tokens**, and avoid ad-hoc gradients per screen/component.

Example names (suggested):
- `gradient.vibrant = [#ad00e9, #0044bf]`
- `gradient.aqua = [#0089cd, #00ffbf]`
- `surface.dark = #0d142a`

---

## 6. Typography

Primary Typeface:
- **Nunito** (Black, SemiBold)
  - Use for body text and headlines

Secondary Typeface:
- **DynaPuff** (Bold)
  - Use as display type for short text / large headings (not long body text)

---

## 7. Graphic Elements
Use only provided graphic elements.
- ❌ Do not modify shapes or colors
- ✅ Keep playful, dynamic compositions aligned with the primary palette

---

## 8. Application Rules
- ✅ Maintain proportions, spacing, colors, and typography at all times.
- ✅ Use the correct logo version for background contrast.
- ❌ No arbitrary overrides.

---

## 9. For AI / Coding Agents (Enforcement Notes)
Treat these rules as strict constraints:
- Colors must come from tokens only
- Typography must be locked to approved families/weights
- Background gradients must be from approved secondary colors only
- Logo must always respect clear space
