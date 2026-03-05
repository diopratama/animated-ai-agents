# Animated AI Agents + Gemini Bridge

This project now includes a local backend bridge that allows the web UI to start and stop role-based Gemini CLI workers.

## What is included

- Web UI role toggles (ACTIVE/PAUSED) per agent card.
- `RUN` button starts only the active agents.
- Backend API to spawn/stop Gemini CLI processes by role.
- WebSocket stream for realtime agent logs/status in the UI.
- Header status now reflects real bridge + Gemini CLI health.

## Run with Docker (Local)

1. Copy env file:

```bash
cp .env.example .env
```

2. Choose auth mode in `.env`:

```bash
GEMINI_AUTH_MODE=api_key
GEMINI_API_KEY=your_key_here
```

Or default to Google login mode:

```bash
GEMINI_AUTH_MODE=google_login
```

3. Build and run (local compose):

```bash
docker compose -f docker-compose.local.yml up --build
```

If your Docker uses legacy command, run:

```bash
docker-compose -f docker-compose.local.yml up --build
```

4. Open:

```text
http://localhost:3003
```

## API endpoints

- `GET /api/health` - checks Gemini CLI availability and running agents.
- `GET /api/agents` - current running state for each agent.
- `POST /api/agents/start` - start one agent process.
- `POST /api/agents/:agentId/stop` - stop a running agent process.
- `WS /ws` - realtime logs and status updates.

## Notes

- This architecture runs Gemini workers inside the container.
- The output directory used in the UI is passed as process `cwd`.
- You can switch auth in UI at runtime:
  - `Gemini API Key`
  - `Google Login (Gemini CLI)`
- For Google login mode in Docker, the compose file mounts:
  - `${HOME}/.gemini -> /root/.gemini` (read-write, so CLI can refresh OAuth tokens)
- If your Gemini CLI invocation requires extra flags, use:
  - `GEMINI_CMD`
  - `GEMINI_BOOT_ARGS`

## Portainer deployment

Use `docker-compose.portainer.yml` as your Portainer stack file.

- Image expected from GHCR:
  - `ghcr.io/<owner>/<repo>:latest`
- You can override image in stack env:
  - `GHCR_IMAGE=<owner>/<repo>`
- Set credentials/env in Portainer:
  - `GEMINI_AUTH_MODE`
  - `GEMINI_API_KEY` (if API key mode)
  - `GEMINI_HOME_DIR` (path to `.gemini` credentials folder)

## GitHub Actions: build/push to GHCR

Workflow file: `.github/workflows/ghcr-image.yml`

Trigger:
- Push to `main`/`master`
- Tag push like `v1.0.0`
- Manual run (`workflow_dispatch`)

Published image:
- `ghcr.io/<owner>/<repo>`
- Tags include branch/tag/sha and `latest` on default branch
