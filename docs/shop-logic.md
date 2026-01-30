# Shop Logic & Product Rules

This document defines the logic, rules, and behaviors for the Shop page on a **per-product** basis. It serves as the single source of truth for refactoring the `Shop.tsx` and `ShopScene.tsx` logic.

## 1. Product Configuration
Rules regarding availability, colors, and print areas.

| Product | ID | Allowed Colors | Print Areas | Views Supported | Special Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **T-Shirt** | `tshirt` | **All** (See Design Compatibility) | **Front**: Fixed (Logo)<br>**Back**: Customizable | Showcase, Customize, Expanded | Front design must match body color (see *Logo Sync*). |
| **Hoodie** | `hoodie` | **All** (See Design Compatibility) | **Front**: Fixed (Logo)<br>**Back**: Customizable | Showcase, Customize, Expanded | Front design must match body color (see *Logo Sync*). |
| **Cap** | `cap` | **Black Only** (`#231f20`) | **Front**: Customizable | Showcase, Customize, Expanded | Restricted designs (e.g., no vertical prints). |
| **Bottle** | `bottle` | **Black** (`#231f20`), **White** (`#ffffff`) | **Front**: Customizable | Showcase, Customize, Expanded | "Black Ring" material always remains black/transparent. |

### Color Definitions
*   **Black**: `#1a1a1a` (or `#231f20` in older map)
*   **Grey**: `#cccccc` / `#d1d5db`
*   **Teal**: `#4db6ac` / `#00ab98`
*   **Cyan**: `#00bcd4` / `#00aeef`
*   **Blue**: `#1976d2` / `#387bbf`
*   **Purple**: `#7b1fa2` / `#8358a4`
*   **White**: `#ffffff`
*   **Pink**: `#f48fb1` / `#e78fab`
*   **Mint**: `#69f0ae` / `#a1d7c0`

---

## 2. Design & Print Area Logic
How designs are applied to specific zones.

| Product | Active Zone Logic | Front Logic | Back Logic | Allowed Designs |
| :--- | :--- | :--- | :--- | :--- |
| **T-Shirt** | Default to **Back** on select. | **LOCKED**. Displays `COLOR_TO_LOGO_MAP[bodyColor]`. User cannot change this directly. | **UNLOCKED**. User selects from `Ulična`, `Vintage`, `Logotip`. | All, except hidden global list. |
| **Hoodie** | Default to **Back** on select. | **LOCKED**. Displays `COLOR_TO_LOGO_MAP[bodyColor]`. User cannot change this directly. | **UNLOCKED**. User selects from `Ulična`, `Vintage`, `Logotip`. | All, except hidden global list. |
| **Cap** | Default to **Front**. | **UNLOCKED**. User selects from available designs. | N/A | Exclude `street-5.png` and large vertical designs. |
| **Bottle** | Default to **Front**. | **UNLOCKED**. User selects from available designs. | N/A | All. |

### Logo Sync Logic (T-Shirt & Hoodie)
When the user selects a body color, the **Front Design** must automatically update to the corresponding color-coded logo file to ensure contrast.
*   **Map**: `src/assets/design-collections/color-coded-logo/`
*   **Logic**: `FrontDesign = ColorCodedLogos[CurrentBodyColor]`

---

## 3. View States & Transitions
How the application behaves in different view modes.

| View Mode | User Interaction | Camera Behavior | Auto-Cycle | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Showcase** | User swipes/clicks arrows to change product. | Fixed Distance (e.g., `z=10`). Orthographic-like feel. | **Active**. Designs and Colors cycle automatically every 6s. | Initial Landing State. "Attract Mode". |
| **Customize** | User clicks a product or "Customize" button. | Zoom in focused on product. Controls enabled (Orbit). | **Stops** on first interaction (click/change color). | Main interaction mode for selecting colors/designs. |
| **Expanded (3D)** | User clicks Fullscreen/Expand icon. | Fullscreen canvas. | **Inactive**. | Detailed inspection mode. |

### Transition Rules
1.  **Color Change**: 
    - **Method**: Holographic Swipe (Shader).
    - **Direction**: Bottom-to-Top (or configured per product).
    - **Duration**: ~0.8s.
2.  **Design Change**:
    - **Method**: Crossfade or Glitch Effect.
    - **Trigger**: User click or Auto-Cycle timer.
3.  **Product Switch (Showcase)**:
    - **Method**: React Spring / Framer Motion slide.
    - **State**: New product starts with Default Color/Design (or random if cycling).

---

## 4. Implementation Checklist
- [ ] Refactor `INITIAL_PRODUCTS` to include `allowedColors` and `restrictedDesigns` arrays.
- [ ] Update `Customizer.tsx` (or `Shop.tsx`) to disable Color Picker options that are not in `allowedColors`.
- [ ] Update `ShopScene.tsx` -> `ProductModel` to enforce `allowedColors` (e.g., if Bottle is loaded, ignore "Pink" requests).
- [ ] Centralize `DESIGN_COLOR_MAP` and `SHARED_COLORS` into a config file (`src/config/shopConfig.ts`).
- [ ] Implement `Logo Sync` hook that runs *only* for Hoodie/T-shirt products.
