# Component Architecture

## Overview
The "Agents Corporation" isometric office is built using a modular component architecture. Each visual element is treated as an entity with a logical state and a visual representation in the isometric grid.

## Core Component Types

### 1. The Stage (`Stage`)
The root container for the office environment.
- **Responsibilities:** 
  - Manages the isometric coordinate space.
  - Handles the primary rendering loop.
  - Implements depth sorting (`Z-indexing`) based on `row + col`.
  - Manages zooming and panning behaviors.

### 2. The Grid (`IsoGrid`)
The logical and visual floor of the office.
- **Responsibilities:**
  - Renders individual floor tiles (`Tile`).
  - Provides a spatial lookup for pathfinding and collisions.
  - Highlights active or hovered tiles.

### 3. The Agent (`IsoAgent`)
The primary interactive actors in the simulation.
- **Responsibilities:**
  - Manages state (Idle, Working, Walking, Special).
  - Handles pathfinding animation between tiles.
  - Renders the sprite corresponding to the agent's direction (North, South, East, West).
  - Triggers visual effects (e.g., "On Fire" for hyper-productivity).

### 4. Furniture (`IsoProp`)
Static or semi-static decorative and functional objects.
- **Types:**
  - `Desk`: A workplace for one agent.
  - `SharedSpace`: Larger items (Meeting table, Couch).
  - `Prop`: Purely decorative items (Plants, Vending machines).
- **Responsibilities:**
  - Defines its own occupancy (which tiles it covers).
  - Provides "Interactable" points for agents.

### 5. Environment (`IsoWalls`)
The boundaries of the office.
- **Responsibilities:**
  - Renders vertical wall segments at the edge of the grid.
  - Handles occlusion (e.g., fading walls that block the view).

## Component Relationship Diagram
```text
[Stage]
  ├── [IsoGrid]
  │     └── [Tile] (0,0) ... (N,M)
  ├── [IsoWalls]
  ├── [IsoProp] (Desks, Plants)
  └── [IsoAgent] (Budi, Slamet, Jamal)
        └── [Effect] (Fire, +Points)
```

## Styling Strategy
Components utilize CSS variables (tokens) for dimensions and colors to maintain consistency. While most rendering happens via Canvas, the UI overlays (Sidebar, Header) follow a standard DOM component model.
