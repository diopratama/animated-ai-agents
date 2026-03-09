# Agents Corporation — Gemini CLI Agent Team

An AI-powered software development team that uses Gemini CLI to build, fix, and ship software. Each agent runs as an independent Gemini CLI process, coordinated by a Node.js backend with real-time WebSocket updates.

---

## Team

| Agent | Role | Role File |
|-------|------|-----------|
| 🏛️ Asep — Architect | Analyzes user stories, designs system architecture, selects which agents to dispatch | `agents/architect.md` |
| 🗄️ Jamal — DB Designer | Designs database schemas, migrations, indexes, and data models | `agents/db-designer.md` |
| ⚙️ Budi — Backend Dev | Implements APIs, services, middleware, auth, and server-side logic | `agents/backend-dev.md` |
| 🎨 Slamet — Frontend Dev | Builds UI components, pages, forms, styles, and client-side logic | `agents/frontend-dev.md` |
| 🧪 Mulyono — QA Engineer | Writes unit tests, integration tests, E2E tests, and QA reports | `agents/qa-agent.md` |
| 🐳 Ade — DevOps Engineer | Creates Dockerfiles, compose files, CI/CD pipelines, and deployment scripts | `agents/devops-engineer.md` |
| 🔒 Trisno — Security Engineer | Audits code for vulnerabilities, performs security testing, OWASP compliance | `agents/security-engineer.md` |

---

## Pipeline Modes

### Build Mode (new features)

Two-phase Architect-led pipeline:

```
User Story → Architect analyzes → Selects needed agents → Agents execute in parallel
```

1. User enters a story (e.g. "As a user I want to") and output folder
2. Architect runs first, analyzes the task, and outputs `REQUIRED_AGENTS: fe, devops`
3. Only the selected agents are dispatched — simple tasks skip unnecessary agents
4. Each agent writes real files to the output directory using Gemini CLI tools

### Fix Mode (bugs & errors)

Direct dispatch, no Architect overhead:

```
Bug description → Smart Detect picks agent → Agent reads existing code → Fixes the issue
```

1. User switches to Fix mode and describes the bug or pastes the error
2. Smart Detect analyzes keywords to pick the right agent (or user picks manually)
3. The agent reads existing code in the target folder, identifies root cause, and fixes it
4. Agent only modifies affected files — no rewriting unrelated code

---

## How Agents Run

Each agent is spawned as a Gemini CLI headless process:

```
gemini -p "<prompt>" -y -s false [--model <model>]
```

- `-p` — the full prompt including role, task, and output directory
- `-y` — auto-accept all tool use (file writes, reads, etc.)
- `-s false` — disable safety prompts for unattended operation
- `--model` — optional model override (e.g. `gemini-2.5-flash`, `gemini-2.5-pro`)

Agents have full tool access and can read/write files, run commands, and create project structures.

---

## Output Directory

The output folder is specified in the web UI. All agents write their files under this path.

- Selected via the **Browse** button or typed manually in the output field
- The path is passed to each agent's prompt as the working directory
- Agents are instructed to create all files under this directory

---

## Agent Rules

1. **Produce real, working code** — no pseudocode or placeholder comments.
2. **Actually create files** on disk — use `write_file` and `mkdir` tools.
3. **Keep files small and modular** — follow single-responsibility principle.
4. **Include error handling** in every function.
5. **Security first** — validate inputs, sanitize outputs, use env vars for secrets.
6. **In Fix mode** — read existing code first, fix only what's broken, explain what changed.
7. When blocked, state clearly what is needed — don't guess.

---

## Architecture

```
Browser (index.html)
  ├── Canvas: pixel art office animation
  ├── Input: user story / bug description + output folder
  ├── Sidebar: agent cards, start/stop controls, activity log
  └── Dashboard: pipeline progress, security findings, deliverables
       │
       │ WebSocket + REST API
       ▼
Node.js Backend (server.js)
  ├── routes.js: /api/agents/start, /run, /stop, /summary
  ├── agentManager.js: spawn Gemini CLI processes
  └── wsHandler.js: broadcast agent logs and status updates
       │
       │ Child processes
       ▼
Gemini CLI (one per agent)
  └── Reads role file, executes task, writes files to output dir
```

---

*Agent role files: `agents/*.md` — each contains the agent's responsibilities, output format, troubleshooting guide, and code patterns.*
