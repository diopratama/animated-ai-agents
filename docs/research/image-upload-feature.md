# UX Research: Picture Upload for Build Mode

## Overview
This document outlines the research, requirements, and user journey for the image upload feature in "Build Mode". This feature allows users to provide visual references (screenshots, mockups, or inspiration) to the AI agents to guide their creative and implementation process.

## 1. User Personas

### 1.1. "Non-Technical Designer" (Sarah)
- **Background**: Sarah is a marketing manager who has a clear vision of how the app should look but doesn't know how to code.
- **Pain Point**: It's hard to describe complex UI layouts using only words.
- **Goal**: Upload a mockup she made in Figma or a screenshot of a website she likes so the agents can replicate the style.

### 1.2. "Developer with a Bug" (Kevin)
- **Background**: Kevin is a full-stack dev who has a UI glitch he can't quite describe.
- **Pain Point**: Describing a "misaligned button that only happens on mobile" in text is tedious.
- **Goal**: Upload a screenshot of the bug so the Fix mode (or a Build mode refactor) can see the visual issue.

### 1.3. "System Architect" (Alex)
- **Background**: Alex likes to draw system diagrams on a whiteboard.
- **Pain Point**: Re-typing all the component relationships from a photo is time-consuming.
- **Goal**: Upload a photo of the whiteboard diagram as a reference for the Architect agent to parse.

## 2. User Journey Map: "Uploading a Reference Image"

1.  **Entry**: User opens the "Build Mode" dashboard.
2.  **Trigger**: User has a specific visual style or diagram they want the agents to follow.
3.  **Action**: User clicks the 📎 (paperclip) icon next to the "RUN ALL" button.
4.  **Feedback**: System opens the file picker.
5.  **Selection**: User selects one or more image files (PNG, JPG, etc.).
6.  **Preview**: User sees thumbnail previews of the uploaded images in the "Paste Zone" above the prompt.
7.  **Execution**: User types a prompt like "Build a landing page like the attached screenshot" and clicks "RUN ALL".
8.  **Processing**: Agents receive the image data (base64) along with the text prompt.
9.  **Outcome**: The Architect agent acknowledges the image reference and the Frontend Dev implements a UI that matches the style.

## 3. UX Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| UX-01 | Support for common image formats (PNG, JPG, WEBP, GIF). | High |
| UX-02 | Ability to upload multiple images at once. | High |
| UX-03 | Visual feedback (thumbnails) immediately after selection. | High |
| UX-04 | Option to remove/delete an image before running the pipeline. | Medium |
| UX-05 | Drag and drop support directly into the story input area. | Medium |
| UX-06 | Copy-paste support (Ctrl+V) from the clipboard. | Medium |
| UX-07 | Clear indication to the user that images are being used as "reference only". | Low |

## 4. Usability Test Scenarios

### Scenario A: Basic Upload
- **Task**: Upload a single screenshot and verify it appears in the preview zone.
- **Success Criteria**: Thumbnail is visible; file input is cleared; "RUN ALL" includes the image in its payload.

### Scenario B: Multiple File Selection
- **Task**: Select 3 different images from the file picker at once.
- **Success Criteria**: All 3 thumbnails are displayed; user can see which images are currently staged.

### Scenario C: Reference Logic
- **Task**: Upload a mockup of a "Blue Header" and prompt "Build this".
- **Success Criteria**: The agents (Architect/Frontend) specifically mention the "Blue Header" from the image in their logs or output.

## 5. Technical Constraints (UX Perspective)
- **Payload Size**: Large images (4K+) should be resized or compressed before sending to avoid hitting Gemini API context limits or slowing down the UI.
- **Privacy**: Ensure images are only stored in-memory during the session and not permanently uploaded to a public server (security requirement).

---
*Created by Asep (Architect) via UX Researcher agent.*
