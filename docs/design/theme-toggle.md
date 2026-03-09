# Design Specification: Theme Toggle System

## Overview
This document specifies the implementation of a theme switching system for the Agents Corporation platform. The system allows users to switch between a high-contrast Dark Theme and a warm Light Theme.

## Color Palettes

### 1. Dark Theme (Default)
**Concept:** Black and Dark Yellow (Gold) - High contrast, technical, and modern.

| Variable | Value | Description |
|----------|-------|-------------|
| `--darker` | `#050505` | Main background (Black) |
| `--panel` | `#1a1a00` | Section backgrounds (Dark Yellow/Black mix) |
| `--panel-border` | `#4d4d00` | Borders and dividers (Olive/Gold mix) |
| `--accent` | `#ffd700` | Primary buttons and highlights (Gold) |
| `--accent2` | `#ccac00` | Hover states / Secondary accent |
| `--text` | `#ffffcc` | Main text (Pale Yellow) |
| `--muted` | `#999900` | Secondary/muted text (Olive) |

### 2. Light Theme
**Concept:** White and Brown - Warm, approachable, and paper-like.

| Variable | Value | Description |
|----------|-------|-------------|
| `--darker` | `#ffffff` | Main background (Pure White) |
| `--panel` | `#f5deb3` | Section backgrounds (Wheat/Tan) |
| `--panel-border` | `#d2b48c` | Borders and dividers (Tan) |
| `--accent` | `#8b4513` | Primary buttons and highlights (Saddle Brown) |
| `--accent2` | `#a0522d` | Hover states / Secondary accent |
| `--text` | `#3e2723` | Main text (Deep Brown) |
| `--muted` | `#795548` | Secondary/muted text (Brownish Grey) |

## UI Components

### Theme Toggle Switch
- **Location:** Settings Panel > THEME section.
- **Visuals:** A standard iOS-style toggle switch.
- **States:**
  - **OFF (Dark):** Slider is gold, background is olive.
  - **ON (Light):** Slider is white, background is brown.
- **Transitions:** `0.3s ease` on all color changes for a smooth experience.

## Interaction Details
- Theme preference is persisted in `localStorage` under `pixel-agents-settings`.
- Theme changes are applied immediately to the `document.body` class (`.theme-light`).
- CSS Variables are used to ensure all components update simultaneously.

## Accessibility Checklist
- [x] **Contrast:** Gold on Black and Brown on White meet WCAG 2.1 AA standards for readability.
- [x] **State Indication:** The toggle switch provides clear visual feedback of the current state.
- [x] **Persistence:** Users don't need to re-select their theme on every visit.
- [x] **Keyboard Nav:** The toggle switch should be focusable (Standard input[type=checkbox] behavior).
