# Marketing URL Deep-Linking Guide

## Overview
The shop now supports deep-linking to specific products, designs, colors, and print zones via URL parameters. This allows you to create targeted marketing campaigns that send users directly to a pre-configured product.

## URL Parameters

| Parameter | Values | Description |
|-----------|--------|-------------|
| `product` | `hoodie`, `tshirt`, `cap`, `bottle` | Selects the product type |
| `mode` | `customizing` | Opens the product in customize mode |
| `design` | Filename (e.g., `street-1.png`, `vintage-2.png`) | Sets the design |
| `color` | URL-encoded hex (e.g., `%23e78fab` for #e78fab) | Sets the product color |
| `zone` | `front`, `back` | Sets which print area (front/back) |

## Design Filenames

### Street Collection (`street-*.png`)
- `street-1.png` - Character with halo (donkey)
- `street-3.png` - Character in red jacket
- `street-5.png` - Character with crossed arms
- `street-6.png` - Character with crown
- `street-7.png` - Multiple characters
- `street-9.png` - Urban style (hidden)

### Vintage Collection (`vintage-*.png`)
- `vintage-1.png` - Retro logo
- `vintage-2.png` - Colorful Dišpet text
- `vintage-3.png` - Classic badge
- `vintage-4.png` - Vintage character
- `vintage-5.png` - Retro style

### Logo Collection (`logo-*.png`)
- `logo-1.png` - Classic logo
- `logo-2.png` - Alternative logo
- `logo-3.png` - Main logo (default front for hoodie/tshirt)
- `logo-231f20.png` - Black color-matched
- `logo-e78fab.png` - Pink color-matched
- `logo-8358a4.png` - Purple color-matched
- etc.

## Available Colors (Hex Codes)

| Color | Hex | URL-encoded |
|-------|-----|-------------|
| Crna (Black) | `#231f20` | `%23231f20` |
| Siva (Grey) | `#d1d5db` | `%23d1d5db` |
| Tirkizna (Teal) | `#00ab98` | `%2300ab98` |
| Cijan (Cyan) | `#00aeef` | `%2300aeef` |
| Plava (Blue) | `#387bbf` | `%23387bbf` |
| Ljubičasta (Purple) | `#8358a4` | `%238358a4` |
| Bijela (White) | `#ffffff` | `%23ffffff` |
| Roza (Pink) | `#e78fab` | `%23e78fab` |
| Mint | `#98d5c1` | `%2398d5c1` |

## Example Marketing URLs

### Product Only
Send users directly to a specific product in customize mode:
```
https://your-site.com/shop?product=hoodie&mode=customizing
https://your-site.com/shop?product=tshirt&mode=customizing
https://your-site.com/shop?product=cap&mode=customizing
https://your-site.com/shop?product=bottle&mode=customizing
```

### Product + Color
Send users to a product with a specific color:
```
https://your-site.com/shop?product=hoodie&mode=customizing&color=%238358a4
https://your-site.com/shop?product=tshirt&mode=customizing&color=%23e78fab
https://your-site.com/shop?product=cap&mode=customizing&color=%23231f20
```

### Product + Design
Send users to a product with a specific design:
```
https://your-site.com/shop?product=hoodie&mode=customizing&design=street-1.png
https://your-site.com/shop?product=tshirt&mode=customizing&design=vintage-2.png
https://your-site.com/shop?product=cap&mode=customizing&design=logo-3.png
```

### Complete Configuration
Send users to a fully configured product:
```
https://your-site.com/shop?product=hoodie&mode=customizing&design=street-1.png&color=%238358a4&zone=back
https://your-site.com/shop?product=tshirt&mode=customizing&design=vintage-2.png&color=%23e78fab&zone=back
https://your-site.com/shop?product=cap&mode=customizing&design=logo-3.png&color=%23231f20&zone=front
```

## Usage Notes

1. **Color Encoding**: The `#` in hex colors must be URL-encoded as `%23`
2. **Zone Behavior**: 
   - For `hoodie` and `tshirt`: Default zone is `back` (designs usually go on back)
   - For `cap` and `bottle`: Default zone is `front`
3. **Design Compatibility**: If a design doesn't support the specified color, the system will automatically find a compatible design in the same collection
4. **URL Updates**: As users customize the product, the URL automatically updates to reflect their choices (using `replaceState` to avoid history spam)

## Creating Marketing Links

### For Facebook/Instagram Ads
Use the complete configuration URL to showcase a specific product look:
```
https://your-site.com/shop?product=hoodie&mode=customizing&design=street-1.png&color=%238358a4
```

### For Email Campaigns
Link to different products based on user preferences:
- Street style fans: `?product=hoodie&design=street-3.png`
- Vintage lovers: `?product=tshirt&design=vintage-2.png`
- Minimalists: `?product=cap&design=logo-3.png`

### For QR Codes
Create QR codes that link directly to pre-configured products for print materials.

## Testing Links

To test a marketing link, simply paste it in your browser. The shop will:
1. Load the specified product
2. Apply the specified design and color
3. Set the correct print zone
4. Show the customize interface immediately

The user can then adjust the configuration before adding to cart.
