# Isometric Office System Architecture

## Overview
This document outlines the architectural shift from a flat 2D grid-based rendering engine to a 3D isometric layout, mimicking the aesthetic of "Game Dev Story". The system will maintain a logical 2D grid for pathfinding and state management while using an isometric projection for visual rendering.

## Core Components

### 1. Isometric Projection Engine (`engine.js` Refactor)
The rendering engine will be updated to support isometric coordinates.
- **Tile Dimensions:** 64x32 pixels (2:1 ratio).
- **Coordinate Transformation:**
  ```javascript
  function cartToIso(col, row) {
    const x = (col - row) * (TILE_WIDTH / 2);
    const y = (col + row) * (TILE_HEIGHT / 2);
    return { x, y };
  }
  ```
- **Depth Sorting:** Entities must be rendered in order of their `row + col` sum to ensure proper overlapping (Z-indexing).

### 2. Assets & Sprites
- **Isometric Tiles:** Floor tiles will be rhombic (64x32).
- **Building/Furniture Sprites:** Furniture needs to be redrawn or adjusted for isometric perspective (e.g., desks angled at 30/150 degrees).
- **Agent Sprites:** Agents will require 8-directional or 4-directional isometric walk/idle cycles (North-East, South-East, South-West, North-West).

### 3. Layout Manager
- **Grid-to-Iso Mapping:** The `ROOM_DEFS` and `furniture` arrays will remain in cartesian grid coordinates (e.g., `col: 2, row: 3`) but will be passed through the `cartToIso` function during the draw loop.
- **Wall Rendering:** Walls will be rendered as vertical planes meeting at 120-degree angles.

### 4. Animation System
- **State-Based Effects:** Implementation of "Hyper-Productivity" effects (e.g., the "fire" effect from the reference image) as particle emitters anchored to the agent's isometric position.

## Technical Stack
- **Rendering:** HTML5 Canvas 2D API (existing).
- **State Management:** `state.js` (existing).
- **Physics/Pathfinding:** Cartesian BFS (existing, logic unchanged).

## Implementation Phases
1. **Phase 1: Math Layer:** Implement coordinate conversion and update the rendering loop to sort by depth.
2. **Phase 2: Visual Assets:** Replace flat sprites with isometric pixel art.
3. **Phase 3: Environment:** Implement isometric walls and floor grid.
4. **Phase 4: Polish:** Add "fire" animations and office props.
