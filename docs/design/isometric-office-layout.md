# Isometric Office Layout Specification

## Overview
This document specifies the visual layout of the "Agents Corporation" office, inspired by the reference image from "Game Dev Story". The office is designed as a single open-plan room with clusters of desks and functional zones.

## 1. Grid Definition
- **Room Dimensions:** 12x12 Logical Tiles.
- **Isometric Dimensions:** 768px x 384px (at 1:1 scale).
- **Origin (0,0):** The top-most corner of the isometric rhombus.

## 2. Floor Plan & Zones

### Zone A: The Production Hub (Center)
- **Description:** Two clusters of four desks each, arranged back-to-back.
- **Layout:**
  - Cluster 1: (3,3), (3,4), (4,3), (4,4)
  - Cluster 2: (7,3), (7,4), (8,3), (8,4)
- **Props:** Each tile has an `IsoDesk` with a computer and chair.

### Zone B: The Creative Lounge (North Corner)
- **Description:** A relaxed area for collaboration.
- **Layout:** (1,1) to (3,3)
- **Props:** 
  - `SharedSpace`: A large meeting table at (1,1).
  - `Prop`: Two plants at (2,0) and (0,2).

### Zone C: The Refreshment Corner (West Corner)
- **Description:** Essential for agent happiness.
- **Layout:** (0,8) to (2,11)
- **Props:**
  - `Prop`: Vending machine (red) at (0,9).
  - `Prop`: Coffee machine at (1,10).

### Zone D: The Storage/Archive (East Corner)
- **Description:** Storage for "data" and records.
- **Layout:** (9,9) to (11,11)
- **Props:**
  - `Prop`: Bookshelves (tall) along the (11, X) wall.

## 3. Visual Styling
- **Floor:** Light gray/beige tiles with a subtle 1px border.
- **Walls:** Off-white vertical planes (height: 64px) on the North-West (0,X) and North-East (X,0) boundaries.
- **Windows:** Horizontal blue-tinted strips on the upper half of the walls to suggest an office building context.

## 4. Agent Placement
- **Architect (Asep):** Desk at (3,3).
- **Backend Dev (Budi):** Desk at (3,4).
- **Frontend Dev (Slamet):** Desk at (4,3).
- **DB Designer (Jamal):** Desk at (4,4).
- **QA Agent (Mulyono):** Desk at (7,3).
- **DevOps (Ade):** Desk at (7,4).
- **Security (Trisno):** Desk at (8,3).

## 5. Visual Feedback (The "Game Dev Story" Feel)
To replicate the dynamic feel of the reference image, the following effects are triggered:
- **Productivity Fire:** When an agent is in "Build Mode", a flame particle emitter is anchored to their sprite.
- **Floating Numbers:** Success/Point gains (e.g., "+15 Bugs Fixed") float upward from the agent's tile.
- **Status Icons:** Small icons above agent heads (e.g., "!") when they need attention.
