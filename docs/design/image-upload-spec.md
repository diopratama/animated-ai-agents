# UX Specification: Reference Image Upload Feature

## Overview
As a user of Agents Corporation, I want to provide visual context to the AI agents by uploading reference images in **Build Mode**. This helps the Architect and Design Team understand specific layout requirements, brand guidelines, or visual styles mentioned in the User Story.

## Information Architecture
- **Location**: Build Mode input area (Story Input).
- **Triggers**: 
  - Click on the "Upload" button (📎 icon).
  - Drag and drop image files directly onto the User Story input area.
  - Paste images directly from the clipboard.

## Component: Image Drop Zone
The entire `story-input-area` will act as a drop zone. When a user drags a file over the area:
- A visual overlay or border change indicates the area is ready to accept files.
- Multiple images can be uploaded simultaneously.

## Interaction Details
1. **Drag & Drop**:
   - `dragover`: Change border color to `var(--accent)`.
   - `dragleave`: Revert border color.
   - `drop`: Process files and add to `_pastedImages` list.
2. **Clipboard Paste**:
   - Intercept `paste` event on the `textarea`.
   - Extract image data and add to the list.
3. **Manual Upload**:
   - Standard file input (`accept="image/*"`).
4. **Visual Feedback**:
   - Previews are shown as 60x60 thumbnails with a remove (×) button.
   - Thumbnails are displayed below the textarea but within the input block.

## Design System Tokens
No new tokens required, using existing:
- `--accent`: For active drop state.
- `--panel-border`: For idle state.
- `--red`: For remove button.

## Accessibility
- File input remains hidden but accessible via label/button.
- Preview thumbnails have `alt="Reference image"` tags.
- Remove buttons have clear visual contrast.
