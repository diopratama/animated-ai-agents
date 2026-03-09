[AGENT: UX Researcher] STATUS: Done
CONTEXT FROM: Architect
---

## 🔬 UX Research Findings: Isometric Office & Agent Animation

### User Personas
**Primary Persona**: **Alex (Tech Project Manager)**
- **Demographics**: 35, Managing a remote team of developers.
- **Goals**: Monitor the "health" and progress of AI-driven tasks in a way that feels more "human" and less like a terminal log.
- **Pain Points**: Hard to stay engaged with long-running AI processes. Text-based logs are dry and don't show "effort" or "stalling" intuitively.
- **Tech Proficiency**: High. Uses Jira, Slack, and GitHub daily.

**Secondary Persona**: **Mia (Indie Game Developer)**
- **Demographics**: 24, Solo developer working on a simulation game.
- **Goals**: Use the platform to test "Agent AI" logic and see how they interact in a constrained environment (office).
- **Pain Points**: Existing AI tools are too abstract. She needs a visual sandbox to see "if the AI knows where the desk is."
- **Tech Proficiency**: Expert. Comfortable with Unity/Godot and Python.

### User Journey Map: "Watching the Magic Happen"
| Stage | User Action | Touchpoint | Pain Point | Opportunity |
|-------|-------------|------------|------------|-------------|
| **Deployment** | Starts a multi-agent task (Build Mode) | Main Dashboard | "Is it working?" anxiety | Show agents "walking" to their desks immediately |
| **Execution** | Observes agents "typing" at desks | Isometric Canvas | Static animations feel "fake" | Add "typing" sounds or floating "code" particles |
| **Peak Flow** | Notices an agent in "Hyper-Mode" (Fire) | Agent Sprite | Hard to tell *why* they are on fire | Tooltip or status bubble: "Writing 500 lines/min" |
| **Idle/Break** | Sees an agent walk to the water cooler | Office Props | Wasted time? | Visual cue for "Thinking" or "API Rate Limit" cooldown |
| **Completion** | Agents stand up and "cheer" or "wave" | Canvas / Notification | Abrupt end to the animation | Summary screen pops up over the office view |

### UX Requirements
1. **State-Visual Parity**: Every internal agent state (IDLE, WORKING, SUCCESS, ERROR) must have a unique isometric animation (UX-ISO-01).
2. **Depth Perception**: Objects must overlap correctly based on their grid position to maintain the 3D illusion (UX-ISO-02).
3. **Environmental Context**: Office furniture (desks, plants) must be more than decoration; they should represent functional "slots" for agents (UX-ISO-03).
4. **Dynamic Feedback**: Use "Game Dev Story" style floating numbers (+16, +151) to show "Progress Points" being generated in real-time (UX-ISO-04).

### Accessibility Requirements
- **Color Blindness**: The "Hyper-Mode" fire effect should have a distinct shape/motion, not just rely on the color red (WCAG 1.4.1).
- **Reduced Motion**: Provide a setting to disable "bouncing" animations or particle effects for users with vestibular disorders (WCAG 2.3.3).
- **Screen Reader Support**: The canvas must have an ARIA-live region that announces major agent state changes (e.g., "Budi has started coding") (WCAG 4.1.3).

### Heuristic Analysis
- **Match between System and Real World**: Using an "office" metaphor for AI agents makes the abstract process of code generation feel familiar.
- **Aesthetic and Minimalist Design**: Ensure the pixel art stays clean; too much "clutter" (too many agents in a small room) will make it hard to track progress.
- **User Control and Freedom**: Allow users to "click and drag" the canvas to pan around the office if it grows large.

### Usability Test Scenarios
1. **Task**: Identify which agent is working the "hardest" (highest productivity).
   - **Success Criteria**: User correctly identifies the agent with the "fire" effect within 2 seconds.
2. **Task**: Determine if an agent is currently "blocked" or "idle".
   - **Success Criteria**: User recognizes the "thinking" bubble or "water cooler" walk as a non-productive state.
3. **Task**: Locate a specific agent (e.g., "Asep") in a crowded office.
   - **Success Criteria**: User can find the agent either by name-tag or distinct visual features.

### Success Metrics
- **Engagement Duration**: Time spent on the "Dashboard" while agents are running (higher is better for "visual interest").
- **Clarity Score**: User survey asking "How well did the animation reflect what the AI was actually doing?" (Target: 4/5).
- **Nostalgia Factor**: Qualitative feedback on the "Kairosoft-style" aesthetic and its impact on the "fun" of the tool.

---
[HANDOFF TO: UX Architect, UI Designer]
SUMMARY: Users want a "living office" that makes AI progress tangible. The isometric view should prioritize depth sorting and state-based animations (like the "fire" effect) to maximize engagement and clarity.
