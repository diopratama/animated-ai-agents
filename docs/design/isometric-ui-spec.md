# Isometric UI Design Specification

## Overview
The goal is to create a UI that complements the "Game Dev Story" inspired isometric office animation. The UI should feel retro, pixelated, and "alive," providing real-time feedback on agent activities and pipeline progress.

## 1. Visual Style
- **Aesthetic:** 8-bit/16-bit retro game style.
- **Typography:** 
  - Primary: `'Press Start 2P'`, cursive/monospace (for headers, stats, levels).
  - Secondary: `'Inter'`, sans-serif (for long text, logs).
- **Colors:**
  - `Accent`: #6c63ff (Soft Purple)
  - `Success`: #43e97b (Green)
  - `Warning`: #f9ca24 (Yellow)
  - `Danger`: #ff4757 (Red)
  - `Panel`: rgba(30, 30, 46, 0.9) (Deep Blue/Grey)

## 2. HUD (Heads-Up Display)
The HUD sits on top of the canvas and provides global information.

### 2.1. Resource Bar (Top Right)
- **Data Points:**
  - 💾 **DELIVERABLES:** Count of files created.
  - ⚡ **ENERGY:** Global pipeline status or speed.
  - 🏆 **MILESTONES:** Completed user stories.
- **Style:** Semi-transparent dark bar with pixelated icons.

### 2.2. Agent Info Tooltip (Floating)
- Triggered on hover or selection of an agent in the isometric grid.
- **Content:**
  - Agent Name & Role Icon.
  - Current Task (e.g., "Designing UI...").
  - Progress Bar (Pixelated).
  - Level/XP.

## 3. Component Specifications

### 3.1. Floating Stats (+XP, +Files)
When an agent finishes a sub-task, floating text should rise from their position.
- **Animation:** Upward float with fade-out (2 seconds).
- **Color:** Green for success, Blue for info.

### 3.2. Selection Ring
An isometric rhombic ring that appears at the base of the selected agent.
- **Style:** Pulsing 2px dashed border.
- **Math:** Uses the same `cartToIso` projection to stay aligned with the tile.

### 3.3. "Hyper-Productivity" Fire Effect
Visual indicator for when an agent is working at maximum efficiency (Fix Mode or High-Priority task).
- **Visual:** Animated pixel-art flames behind/around the agent sprite.
- **CSS Class:** `.effect-fire`

## 4. Interaction Details

### 4.1. Hover State
- Cursor changes to a "point" pixel hand.
- Agent sprite slightly brightens (CSS filter: `brightness(1.2)`).
- Minimalist label appears above head: `[Role Name]`.

### 4.2. Selection State
- Selection ring appears at base.
- Sidebar scrolls to the corresponding agent card.
- Floating "Action Menu" appears (e.g., [Pause], [Inspect], [Boost]).

### 4.3. Drag-and-Drop
- Dropping an image onto an agent in the office assigns it as a reference for their task.
- Visual feedback: The agent's tile highlights in Yellow during the drag-over.

## 5. Animation Curves
- **UI Transitions:** `cubic-bezier(0.175, 0.885, 0.32, 1.275)` (Back Out) for a "poppy" feel.
- **Floating Labels:** Linear movement with `opacity` decay.
