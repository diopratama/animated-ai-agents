# Responsive Strategy

## Overview
The "Agents Corporation" interface must remain usable and visually appealing across multiple device types. The core of this strategy is the "Fluid Stage" approach for the isometric office.

## 1. The Fluid Stage (Isometric Canvas)
The isometric office is rendered on a HTML5 Canvas. To handle different screen sizes, we use a combination of viewport-aware scaling and a "centered stage" strategy.

- **Viewport Anchoring:** The canvas always fills the available space between the Sidebar and Header.
- **Auto-Zoom:** When the window is resized, the stage automatically adjusts its zoom level to keep the entire office grid visible (with a minimum zoom threshold to prevent extreme shrinking).
- **Panning:** On smaller viewports (mobile/tablet), the user can pan the stage by dragging.
- **Canvas Scaling:** We use the `window.devicePixelRatio` to ensure the isometric pixel art remains sharp on high-DPI (Retina) screens.

## 2. Layout Breakpoints

### Desktop (1200px and up)
- **Sidebar:** Fixed width (e.g., 350px) on the left or right.
- **Stage:** Occupies the majority of the screen.
- **Dashboard:** Persistent at the bottom.

### Tablet (768px - 1199px)
- **Sidebar:** Collapsible (Slide-out menu).
- **Stage:** Full width (filling the space under the header).
- **Dashboard:** Miniaturized or swipeable.

### Mobile (767px and below)
- **Sidebar:** Full-screen overlay when opened.
- **Stage:** Full-screen rendering. The office grid defaults to a higher zoom level to ensure agents are visible.
- **Controls:** HUD-style buttons overlaying the stage for quick actions.

## 3. Pixel-Perfect Assets
To maintain the "Game Dev Story" aesthetic:
- **Image Smoothing:** Set `image-rendering: pixelated;` and `context.imageSmoothingEnabled = false;` on the canvas to prevent blurring of sprites during scaling.
- **Discrete Zoom Levels:** Zooming happens in discrete steps (e.g., 0.5x, 1x, 2x) to maintain pixel integrity.

## 4. CSS Implementation
We utilize CSS Grid and Flexbox for the high-level layout, ensuring the Canvas container is truly fluid.

```css
.app-container {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar stage"
    "dashboard dashboard";
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
}

@media (max-width: 768px) {
  .app-container {
    grid-template-areas:
      "header"
      "stage"
      "dashboard";
    grid-template-columns: 1fr;
  }
}
```
