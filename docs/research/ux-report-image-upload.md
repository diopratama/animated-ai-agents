[AGENT: UX Researcher] STATUS: Done
CONTEXT FROM: Architect
---

## 🔬 UX Research Findings: Picture Upload for Build Mode

### User Personas
**Primary Persona**: **Sarah (Non-Technical Designer)**
- **Demographics**: 32, Marketing Manager at a startup.
- **Goals**: Build a landing page that looks professional without learning CSS.
- **Pain Points**: Hard to explain layout ideas ("make the hero section like Airbnb's but with a neon twist") using text only.
- **Tech Proficiency**: Comfortable with Figma/Canva, but no coding skills.

**Secondary Persona**: **Kevin (Full-Stack Developer)**
- **Demographics**: 28, Developer at a tech agency.
- **Goals**: Quickly fix UI bugs or replicate a legacy system's UI in a new stack.
- **Pain Points**: Screenshots are the fastest way to communicate UI state, but he currently has to describe them manually to the AI.
- **Tech Proficiency**: Expert in coding, but values efficiency and visual context.

### User Journey Map
| Stage | User Action | Touchpoint | Pain Point | Opportunity |
|-------|-------------|------------|------------|-------------|
| **Entry** | User starts a new Build Mode task | Main Dashboard | Lack of visual context for the AI | Add an obvious upload button |
| **Selection** | Clicks paperclip icon and selects image | OS File Picker | Multiple steps to find files | Support drag & drop and paste |
| **Preview** | Reviews thumbnails of selected images | "Paste Zone" above input | Small thumbnails might be hard to see | Add hover zoom or delete button |
| **Execution** | Types prompt and clicks "RUN ALL" | Action Buttons | Unsure if AI actually "saw" the image | Architect agent should acknowledge images in logs |
| **Outcome** | Reviews the generated code/UI | Dashboard / Deliverables | AI ignored visual cues in the image | Direct reference in Architect prompt |

### UX Requirements
1. **Immediate Visual Feedback**: Users must see a thumbnail of the uploaded image to confirm the selection (UX-03).
2. **Multi-File Support**: Users should be able to upload multiple screenshots for complex tasks (UX-02).
3. **Easy Removal**: Users must be able to remove an incorrectly uploaded image before starting the pipeline (UX-04).
4. **Contextual Awareness**: The prompt sent to agents must explicitly mention that images are for reference (UX-07).

### Accessibility Requirements
- **Keyboard Navigation**: The upload button (📎) must be focusable and triggerable via Enter/Space (WCAG 2.1.1).
- **Alt Text**: Images in the preview zone should have generated alt text (e.g., "Reference Image 1") for screen readers (WCAG 1.1.1).
- **Contrast**: The "Paste Zone" and "Remove" buttons must meet minimum contrast ratios (WCAG 1.4.3).

### Heuristic Analysis
- **Visibility of System State**: The "Paste Zone" provides clear feedback that the system has received the image.
- **Recognition rather than Recall**: Thumbnails allow users to recognize what they uploaded without having to remember file names.
- **Error Prevention**: Restricting file types to `image/*` prevents users from uploading incompatible files.

### Usability Test Scenarios
1. **Task**: Upload a screenshot by clicking the 📎 button.
   - **Success Criteria**: File picker opens, image is selected, and thumbnail appears in the UI.
2. **Task**: Paste an image directly from the clipboard (Ctrl+V).
   - **Success Criteria**: Image appears in the preview zone immediately without using the file picker.
3. **Task**: Remove one of two uploaded images.
   - **Success Criteria**: The specific image is removed from the list, and the other remains.

### Success Metrics
- **Feature Adoption**: % of "Build Mode" runs that include at least one reference image.
- **Task Success Rate**: % of users who successfully upload and run a pipeline with an image without errors.
- **User Satisfaction**: Qualitative feedback on how well the agents "understood" the visual context.

---
[HANDOFF TO: UX Architect, UI Designer]
SUMMARY: Research shows users strongly prefer visual references for UI-heavy tasks. The current implementation needs better affordances for drag-and-drop and image removal to meet high-priority UX requirements.
