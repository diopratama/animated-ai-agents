# Isometric Pixel Art Style Guide

## Overview
This style guide defines the visual language for the "Agents Corporation" project, inspired by the retro 3D-isometric aesthetic of "Game Dev Story". The goal is to create a cohesive, charming, and readable office environment using pixel art.

## 1. Visual Style: "Kairosoft-esque"
- **Art Form:** Low-fidelity pixel art.
- **Outlines:** Clean, single-pixel black or dark-colored outlines (#222222) for all characters and interactable objects.
- **Shading:** Simple cel-shading with a primary light source from the top-left (North-West). Use 2-3 shades per color (base, shadow, highlight).
- **Detailing:** Minimalist features. Characters should have "dot" eyes and simple expressive faces.

## 2. Technical Specifications
- **Perspective:** 2.5D Isometric (2:1 ratio).
- **Tile Size:** 64x32 pixels (base floor tile).
- **Grid Alignment:** All objects must align to the 64x32 isometric grid.
- **Resolution:** Assets should be designed at "1x" scale (1 pixel = 1 screen pixel) but can be exported at "4x" for high-DPI displays.
- **File Format:** Transparent PNG (8-bit alpha).

## 3. Color Palette
Use a vibrant, "saturated retro" palette.
- **Primary Colors:** Bright blues, reds, and yellows for UI and special states.
- **Office Tones:** Warm beiges, greys, and browns for furniture and walls.
- **Agent Colors:** Diverse skin tones and hair colors; distinct clothing colors to differentiate agent roles (e.g., Blue for Backend, Pink for Frontend).

## 4. Characters (Agents)
- **Proportions:** "Chibi" style (large heads, small bodies). Approximately 24-32 pixels tall.
- **Directions:** 4-way isometric (North-East, South-East, South-West, North-West).
- **Animations:**
  - **Idle:** 2-frame "breathing" or "blinking" loop.
  - **Walk:** 4-frame walk cycle.
  - **Action:** Context-specific (e.g., typing, celebrating).

## 5. Environment & Furniture
- **Furniture:** Must be drawn from a South-East facing perspective.
- **Consistency:** Ensure all "legs" of desks and chairs hit the floor at the correct isometric coordinates.
- **Depth:** Use simple drop shadows (soft ellipses at 20% opacity) to ground objects in the 3D space.

## 6. Effects
- **Hyper-State (Fire):** 4-6 frame animated loop of stylized pixel flames. Colors: Bright Orange (#FF8C00) and Yellow (#FFD700).
- **Selection:** A pulsating white or yellow rhombic ring at the base of the agent.
