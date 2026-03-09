# AI Image Generation Prompts

These prompts are optimized for generating assets that match the "Kairosoft/Game Dev Story" style.

## Master Style Prompt (Prepend to all)
"Retro 2.5D isometric pixel art, Kairosoft Game Dev Story style, clean single-pixel outlines, vibrant saturated colors, 16-bit aesthetic, flat lighting, minimalist features, transparent background --v 6.0"

---

## 1. Environment Tiles (Rhombic 2:1)
**Prompt:**
"Isometric rhombic floor tile, 64x32 pixels, [MATERIAL] texture, 2.5D perspective, pixel-art style, clean edges, tiling pattern, high contrast. --no shadows"
- **Materials:** "polished warm wood grain", "dark teal office carpet", "light grey industrial concrete".

## 2. Office Furniture (Isometric South-East)
**Prompt:**
"Isometric 2.5D office furniture sprite, [OBJECT] facing South-East, retro pixel-art style, single-pixel black outlines, vibrant colors, minimalist design, transparent background. --v 6.0"
- **Objects:**
  - "Modern rectangular office desk, light wood top, grey metal legs."
  - "Blue padded office chair, ergonomic design."
  - "Tall server rack with small blinking red and green pixel lights."
  - "Classic red vending machine with pixelated 'Soda' sign."
  - "Green leafy potted plant in a terracotta pot."

## 3. Agent Characters (Chibi Style)
**Prompt:**
"Isometric 2.5D character sprite, [ROLE/DESCRIPTION], facing South-East, chibi style, large head small body, retro pixel-art, dot eyes, single-pixel outlines, standing on transparent background. --v 6.0"
- **Roles:**
  - "Male software developer in a blue hoodie and jeans."
  - "Female designer in a pink sweater and glasses."
  - "Project manager in a sharp grey suit."
  - "Security engineer in a black jacket and beanie."

## 4. Special Effects
**Prompt:**
"Pixel art special effect sprite sheet, [EFFECT], 2D flat style, vibrant orange and yellow colors, stylized flames, high contrast, transparent background."
- **Effects:** "Animated stylized fire loop, 6 frames, pixel-art flames."

## 5. UI Elements
**Prompt:**
"Pixel art UI button, [COLOR] color, rounded corners, chunky retro aesthetic, glossy finish, 'OK' text in pixel font, high resolution sprite."
- **Colors:** "vibrant green", "bright red".

---

## Tips for Best Results
- **Stable Diffusion:** Use LoRAs for "isometric pixel art" or "16-bit retro" if available.
- **DALL-E 3:** Explicitly state "isometric 2:1 perspective" and "single-pixel outlines" to avoid muddy gradients.
- **Midjourney:** Use `--tile` for floor patterns and `--no 3d render` to maintain flat pixel aesthetics.
