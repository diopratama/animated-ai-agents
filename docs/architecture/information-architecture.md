# Information Architecture

## Overview
This document defines the data structures and hierarchies for the "Agents Corporation" simulation. The architecture reflects the logical organization of agents, their work, and their environment.

## 1. Hierarchy of Entities
The data model follows a nested structure:
- **`Company`**: The root container (The Office).
  - **`Environment`**: Spatial data (Grid size, Tile map, Occupancy).
  - **`Inventory`**: List of furniture and office props.
  - **`AgentRoster`**: The collection of AI Agents.
    - **`Agent`**: Individual AI entity with personal stats and state.
    - **`Role`**: Job definition (Architect, Backend Dev, etc.).
    - **`Task`**: The current unit of work assigned to an agent.
  - **`Pipeline`**: The global development workflow (Build vs. Fix mode).
    - **`Milestone`**: Progress tracking for the current user story.

## 2. Agent Data Model
An agent's internal data structure:
```json
{
  "id": "asep-01",
  "name": "Asep",
  "role": "Architect",
  "state": "WORKING",
  "location": { "col": 2, "row": 3 },
  "stats": {
    "productivity": 85,
    "speed": 10,
    "happiness": 90
  },
  "visuals": {
    "sprite": "architect_iso",
    "effect": "productivity_fire"
  },
  "currentTask": "story-001-analysis"
}
```

## 3. Environment Data Model
The layout structure for the office:
```json
{
  "gridSize": { "cols": 10, "rows": 10 },
  "furniture": [
    {
      "id": "desk-1",
      "type": "desk",
      "pos": { "col": 2, "row": 3 },
      "occupant": "asep-01"
    }
  ],
  "walls": [
    { "start": [0,0], "end": [0,10], "type": "west" },
    { "start": [0,0], "end": [10,0], "type": "north" }
  ]
}
```

## 4. Navigation & Pathfinding
The office uses a simplified A* or BFS algorithm on the cartesian grid. 
- **Walkable Tiles:** Any tile not occupied by furniture or walls.
- **Interactive Tiles:** Tiles adjacent to a desk or shared space.

## 5. UI Information Hierarchy
The user interface is divided into three layers of information:
- **Layer 1: The Stage (Contextual):** Agent activity, visual progress, "Game Dev Story" style popups (+Points, Fire).
- **Layer 2: The Dashboard (Global):** Pipeline status, overall progress, system health.
- **Layer 3: The Sidebar (Detailed):** Individual agent stats, specific log entries, settings.
