# Isometric Interface Accessibility Checklist

As the office shifts to a complex isometric layout, ensuring accessibility for all users is critical.

## 1. Keyboard Navigation
- [ ] **Tab Focus:** Users should be able to tab through agents in the isometric grid using standard `Tab` / `Shift+Tab`.
- [ ] **Selection:** Pressing `Enter` or `Space` while an agent is focused should select them and trigger the floating info menu.
- [ ] **Movement:** `Arrow Keys` or `WASD` should allow "stepping" focus between adjacent isometric tiles.
- [ ] **Global Shortcuts:**
  - `P` -> Toggle Pipeline (Start/Stop).
  - `A` -> Cycle through agents.
  - `Esc` -> Clear selection.

## 2. Screen Reader Support (ARIA)
- [ ] **Canvas Role:** Use `<canvas role="img" aria-label="Animated isometric office where AI agents work on software.">`.
- [ ] **Hidden Descriptions:** Maintain a visually hidden `aria-live` region (`.sr-only`) that announces agent activities (e.g., "Architect is now designing the system architecture").
- [ ] **Status Announcements:** Floating stats (+XP) should be announced via ARIA live regions if they are critical to the user's understanding of progress.

## 3. Visual & Color Contrast
- [ ] **Contrast Ratio:** Ensure floating text (stats, labels) maintains at least a 4.5:1 contrast ratio against the canvas background. Use text shadows or dark outlines to improve readability.
- [ ] **Focus Indicator:** The selection ring must be high-contrast and thick enough (at least 2px) to be visible to low-vision users.
- [ ] **Color Independence:** Do not rely solely on the "Fire" effect color to indicate hyper-productivity; use a corresponding label or icon (e.g., a "Lightning" symbol).

## 4. Interaction Hazards
- [ ] **Animation Control:** Provide a setting to disable the "Fire" effect and other rapid animations for users with motion sensitivity (vestibular disorders).
- [ ] **Target Size:** Ensure the interactive area for agents is large enough (min 44x44px), even if the visual sprite is smaller.

## 5. Alternative Views
- [ ] **List View:** Always provide a sidebar agent list as a non-spatial alternative to the isometric grid.
- [ ] **Dashboard Integration:** Critical pipeline metrics shown on the canvas should also be available in the text-based "Monitoring Dashboard".
