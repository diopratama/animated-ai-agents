# Isometric Pixel Art Asset Specification

## Visual Style: "Kairosoft-style" Retro Pixel Art
Inspired by "Game Dev Story", the visual style should use vibrant, high-contrast colors with clean, single-pixel outlines for key features.

## Isometric Grid Specifications
- **Perspective:** 2.5D Isometric (dimetric).
- **Tile Base:** 64x32 pixels.
- **Angle:** ~26.57 degrees (standard "2-over, 1-down" pixel line).

## Required Assets

### 1. Ground/Floor Tiles
- **Materials:** Wood floor, carpet (teal/blue), concrete hallway, and "void" (dark background).
- **Size:** 64x32 pixels, rhombic.

### 2. Office Furniture (Isometric)
All furniture must be drawn from a South-East facing isometric perspective.
- **Desks:** Rectangular desks (approx. 2x1 grid size, 64x64px sprite).
- **Chairs:** Small task chairs, ideally with a swivel animation.
- **Plants:** Potted office plants with varying heights.
- **Bookcases/Servers:** Tall vertical elements that add depth to the walls.
- **Equipment:** Computers (isometric monitors), water coolers.

### 3. Agent Sprites (8-Way/4-Way Isometric)
Agents need 4 primary directions (NE, SE, SW, NW).
- **States:**
  - **Idle:** Minimal movement (e.g., slight bobbing).
  - **Walking:** 4-frame walk cycle.
  - **Typing:** Hands moving on a desk at an isometric angle.
  - **Hyper-State:** "Fire" particle effect overlay (pixel-art flames).

### 4. Interactive Elements
- **Selection Highlight:** An isometric rhombic ring around the base of a selected agent.
- **Speech Bubbles:** Angled bubbles with pixelated tails pointing to agents.

## Technical Details
- **Transparency:** Use 8-bit alpha (PNG) for clean edges and shadows.
- **Shadows:** Soft ellipses at the base of characters and furniture, rendered with ~20% black opacity.
- **Palette:** Standardize on a retro color palette (e.g., Pico-8 or similar) to ensure stylistic consistency across all agents.
