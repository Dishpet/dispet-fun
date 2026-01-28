# Gemini Nano Banana Image Generation Models

## Official Model IDs for Google Gemini API

This document serves as the **authoritative reference** for the Nano Banana image generation models.

---

## 🍌 Nano Banana Pro (DEFAULT)

**Official API Model ID:**
```
gemini-3-pro-image-preview
```

**What it is:**
- Built on Gemini 3 Pro architecture
- Higher fidelity output
- Better text rendering
- Stronger reasoning capabilities
- Advanced composition control
- Best quality for production use

---

## 🍌 Nano Banana (BACKUP/FALLBACK)

**Official API Model ID:**
```
gemini-2.5-flash-image
```

**What it is:**
- Original Nano Banana image model
- Fast and efficient text-to-image generation
- Good quality with low latency
- Use as fallback when Pro is unavailable

---

## Usage Priority

| Priority | Model Name                  | Model ID                      |
|----------|----------------------------|-------------------------------|
| 1 (DEFAULT) | Nano Banana Pro         | `gemini-3-pro-image-preview`  |
| 2 (BACKUP)  | Nano Banana            | `gemini-2.5-flash-image`      |

---

## Implementation Notes

1. Always try `gemini-3-pro-image-preview` first
2. Fall back to `gemini-2.5-flash-image` if Pro fails
3. Both models support:
   - Text-to-image generation
   - Image editing
   - Multi-modal input (reference images)

---

## API Configuration

```typescript
const model = genAI.getGenerativeModel({ 
    model: "gemini-3-pro-image-preview",
    generationConfig: {
        responseModalities: ["TEXT", "IMAGE"]
    }
});
```

---

*Last Updated: January 28, 2026*
