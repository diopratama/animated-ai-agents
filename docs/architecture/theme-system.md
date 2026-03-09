# Theme System Architecture - Animated AI Agents

This document outlines the design and implementation of the theme switching system for the Animated AI Agents platform.

## 1. Overview
The theme system allows users to toggle between two distinct visual styles:
- **Dark Theme (Default):** Dark yellow and black combination.
- **Light Theme:** Brown and white combination.

## 2. Technical Stack
- **CSS Variables:** Used to define all colors and styles. Located in `css/tokens.css`.
- **JavaScript:** Handles toggle events, theme persistence via `localStorage`, and DOM updates. Located in `js/settings.js`.
- **HTML:** A UI toggle switch located in the header.

## 3. CSS Variable Mapping (Tokens)

The following design tokens are defined in `css/tokens.css` and mapped to functional variables:

| Variable | Dark Theme (Black/Yellow) | Light Theme (White/Brown) |
|----------|---------------------------|---------------------------|
| `--darker` | `#000000` (Black) | `#ffffff` (White) |
| `--dark` | `#0a0a00` (Almost black yellow) | `#fdf5e6` (Old Lace) |
| `--panel` | `#1a1a00` (Very dark yellow) | `#f5deb3` (Wheat) |
| `--panel-border` | `#333300` (Dark yellow border) | `#d2b48c` (Tan) |
| `--accent` | `#f9ca24` (Yellow) | `#8b4513` (Saddle Brown) |
| `--accent2` | `#e1b12c` (Darker yellow) | `#a0522d` (Sienna) |
| `--text` | `#ffffea` (Near white yellow) | `#3e2723` (Dark brown) |
| `--muted` | `#808000` (Olive/Muted yellow) | `#795548` (Brownish grey) |

## 4. Implementation Details

### 4.1. CSS Architecture
- **`css/tokens.css`**: Defines the root tokens and theme-specific class mappings (`body.theme-dark` and `body.theme-light`).
- **`css/base.css`**: Imports `tokens.css` and uses the variables for core layout styles.
- **`css/theme.css`**: Contains styles for the theme toggle switch UI and specific component overrides.

### 4.2. JavaScript Logic
- **`js/state.js`**: Stores the current `theme` ('dark' or 'light').
- **`js/settings.js`**: 
  - `toggleTheme()`: Switches between `theme-dark` and `theme-light` classes on `document.body` and updates the UI toggle.
  - `loadSettings()`: Restores theme preference from `localStorage`.
  - `saveSettings()`: Persists theme choice.

### 4.3. Persistence
- Theme preference is stored in `localStorage` under the key `pixel-agents-settings`.

## 5. UI Components
- **Toggle Switch:** Located in the top header, providing immediate visual feedback.
- **Transitions:** Smooth CSS transitions are applied to background and color properties to ensure a pleasant user experience when switching themes.
