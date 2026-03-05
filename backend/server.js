import express from "express";
import { WebSocketServer } from "ws";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = process.env.PROJECT_ROOT
  ? path.resolve(process.env.PROJECT_ROOT)
  : path.resolve(__dirname, "..");

const PORT = Number(process.env.PORT || 3000);
const GEMINI_CMD = process.env.GEMINI_CMD || "gemini";
const GEMINI_BOOT_ARGS = (process.env.GEMINI_BOOT_ARGS || "")
  .split(" ")
  .map((v) => v.trim())
  .filter(Boolean);
const DEFAULT_AUTH_MODE = process.env.GEMINI_AUTH_MODE || "api_key";
const AUTH_MODES = new Set(["api_key", "google_login"]);

const AGENT_DEFS = {
  arch: { name: "Architect", roleFile: "agents/architect.md" },
  db: { name: "DB Designer", roleFile: "agents/db-designer.md" },
  be: { name: "Backend Dev", roleFile: "agents/backend-dev.md" },
  fe: { name: "Frontend Dev", roleFile: "agents/frontend-dev.md" },
  qa: { name: "QA Engineer", roleFile: "agents/qa-agent.md" },
};

const app = express();
app.use(express.json({ limit: "1mb" }));

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

/**
 * @typedef {{ child: import("node:child_process").ChildProcessWithoutNullStreams, env: Record<string,string>, cwd: string }} AgentProcess
 * @type {Map<string, AgentProcess>}
 */
const runningAgents = new Map();

function broadcast(payload) {
  const body = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(body);
    }
  });
}

function resolveOutputDir(outputDirRaw) {
  if (!outputDirRaw) return PROJECT_ROOT;
  if (path.isAbsolute(outputDirRaw)) return outputDirRaw;
  return path.resolve(PROJECT_ROOT, outputDirRaw);
}

function buildPrompt(agentId, story, outputDir) {
  const def = AGENT_DEFS[agentId];
  if (!def) return "";

  const rolePath = path.resolve(PROJECT_ROOT, def.roleFile);
  const roleContent = fs.existsSync(rolePath)
    ? fs.readFileSync(rolePath, "utf8")
    : "";

  return [
    `You are running as ${def.name}.`,
    `Project root: ${PROJECT_ROOT}`,
    `Write all output files under: ${outputDir}`,
    `User story: ${story || "As a user I want to login with Google"}`,
    "",
    "--- Role instructions ---",
    roleContent,
    "",
    "Start working now. Acknowledge what you will do, then produce the deliverables for your role.",
  ].join("\n");
}

function checkGeminiInstalled() {
  const result = spawnSync(GEMINI_CMD, ["--version"], {
    encoding: "utf8",
    timeout: 5000,
  });

  if (result.error) return { ok: false, reason: result.error.message };
  if (result.status !== 0) {
    return {
      ok: false,
      reason: (result.stderr || result.stdout || "gemini command failed").trim(),
    };
  }
  return { ok: true, version: (result.stdout || "").trim() };
}

function detectGoogleLoginCredentials() {
  const home = process.env.HOME || "/root";
  const candidateDirs = [
    path.resolve(home, ".gemini"),
    path.resolve(home, ".config", "gemini"),
    "/root/.gemini",
    "/root/.config/gemini",
  ];

  for (const dir of candidateDirs) {
    const oauthFile = path.join(dir, "oauth_creds.json");
    if (fs.existsSync(oauthFile)) {
      return { detected: true, path: dir, hasOAuth: true };
    }
  }

  for (const dir of candidateDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      if (files.length > 0) {
        return { detected: true, path: dir, hasOAuth: false };
      }
    }
  }

  return { detected: false, path: null, hasOAuth: false };
}

function authHealth() {
  const google = detectGoogleLoginCredentials();
  const apiKeyConfigured = Boolean((process.env.GEMINI_API_KEY || "").trim());
  const envDefaultMode = AUTH_MODES.has(DEFAULT_AUTH_MODE)
    ? DEFAULT_AUTH_MODE
    : "";
  let defaultMode = "api_key";
  if (envDefaultMode) defaultMode = envDefaultMode;
  if (defaultMode === "api_key" && !apiKeyConfigured && google.detected) {
    defaultMode = "google_login";
  }

  return {
    defaultMode,
    apiKeyConfigured,
    googleLoginDetected: google.detected,
    googleLoginPath: google.path,
    googleLoginHasOAuth: google.hasOAuth,
    availableModes: { api_key: true, google_login: google.detected },
  };
}

function agentSnapshot(agentId) {
  const def = AGENT_DEFS[agentId];
  return {
    id: agentId,
    name: def.name,
    running: runningAgents.has(agentId),
  };
}

function preTrustFolder(folderPath) {
  const home = process.env.HOME || "/root";
  const geminiDir = path.resolve(home, ".gemini");
  const trustFile = path.join(geminiDir, "trustedFolders.json");

  try {
    fs.mkdirSync(geminiDir, { recursive: true });

    let config = {};
    if (fs.existsSync(trustFile)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(trustFile, "utf8"));
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          config = parsed;
        }
      } catch {
        config = {};
      }
    }

    const resolved = path.resolve(folderPath);
    if (!config[resolved]) {
      config[resolved] = "TRUST_FOLDER";
      fs.writeFileSync(trustFile, JSON.stringify(config, null, 2), {
        mode: 0o600,
      });
    }
  } catch {
    // Non-fatal — the interactive fallback will handle it.
  }
}

function resolveAuth(authMode, apiKey) {
  const auth = authHealth();
  const resolvedAuthMode = AUTH_MODES.has(authMode)
    ? authMode
    : auth.defaultMode;
  const childEnv = { ...process.env };

  if (resolvedAuthMode === "api_key") {
    const resolvedKey = (apiKey || process.env.GEMINI_API_KEY || "").trim();
    if (!resolvedKey) {
      return {
        ok: false,
        error:
          "API key mode selected but no key provided. Set GEMINI_API_KEY or provide key in UI.",
      };
    }
    childEnv.GEMINI_API_KEY = resolvedKey;
  } else {
    if (!auth.googleLoginDetected) {
      return {
        ok: false,
        error:
          "Google login mode selected, but no Gemini CLI login credentials are available in container.",
      };
    }
    delete childEnv.GEMINI_API_KEY;
  }

  return { ok: true, childEnv, resolvedAuthMode };
}

function stripAnsi(text) {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "");
}

function wireAgentIO(agentId, child) {
  child.stdout.on("data", (chunk) => {
    const text = chunk.toString();
    const clean = stripAnsi(text);
    if (clean.trim()) {
      broadcast({ type: "agent-log", agentId, stream: "stdout", message: clean });
    }
  });

  child.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    const clean = stripAnsi(text);
    if (clean.trim()) {
      broadcast({ type: "agent-log", agentId, stream: "stderr", message: clean });
    }
  });

  child.on("spawn", () => {
    broadcast({ type: "agent-status", agentId, status: "working" });
  });

  child.on("error", (err) => {
    broadcast({
      type: "agent-log",
      agentId,
      stream: "system",
      message: `Process error: ${err.message}`,
    });
    broadcast({ type: "agent-status", agentId, status: "error" });
  });

  child.on("close", (code, signal) => {
    broadcast({
      type: "agent-log",
      agentId,
      stream: "system",
      message: `Finished (code=${code ?? "null"}, signal=${signal ?? "none"})`,
    });
    broadcast({ type: "agent-status", agentId, status: "done" });
  });
}

// ─── Routes ───

app.get("/api/health", (req, res) => {
  const gemini = checkGeminiInstalled();
  const auth = authHealth();
  res.json({
    ok: gemini.ok,
    gemini,
    auth,
    runningAgents: [...Object.keys(AGENT_DEFS)].map(agentSnapshot),
  });
});

app.get("/api/agents", (req, res) => {
  res.json({
    agents: [...Object.keys(AGENT_DEFS)].map(agentSnapshot),
  });
});

// Mark an agent as enabled (ready to receive work via /run).
app.post("/api/agents/start", (req, res) => {
  const { agentId, authMode, apiKey } = req.body || {};
  if (!AGENT_DEFS[agentId]) {
    return res.status(400).json({ ok: false, error: "Unknown agentId." });
  }

  const authResult = resolveAuth(authMode, apiKey);
  if (!authResult.ok) {
    return res.status(400).json({ ok: false, error: authResult.error });
  }

  // Store auth config so /run can use it later.
  runningAgents.set(agentId, { child: null, env: authResult.childEnv, cwd: null, authMode: authResult.resolvedAuthMode });
  broadcast({ type: "agent-status", agentId, status: "running" });
  broadcast({
    type: "agent-log",
    agentId,
    stream: "system",
    message: `${AGENT_DEFS[agentId].name} ready (auth: ${authResult.resolvedAuthMode}).`,
  });

  return res.json({ ok: true, agent: agentSnapshot(agentId) });
});

// Run a prompt on an agent — spawns a one-shot gemini process.
app.post("/api/agents/:agentId/run", (req, res) => {
  const { agentId } = req.params;
  const { prompt, outputDir } = req.body || {};
  const entry = runningAgents.get(agentId);
  if (!entry) {
    return res.status(404).json({ ok: false, error: "Agent is not enabled. Click START first." });
  }

  const text = (prompt || "").trim();
  if (!text) {
    return res.status(400).json({ ok: false, error: "Empty prompt." });
  }

  // If a previous process is still running, reject.
  if (entry.child && !entry.child.killed && entry.child.exitCode === null) {
    return res.status(409).json({ ok: false, error: "Agent is still processing a previous prompt." });
  }

  const resolvedOutputDir = resolveOutputDir(outputDir);
  preTrustFolder(resolvedOutputDir);

  fs.mkdirSync(resolvedOutputDir, { recursive: true });

  // Headless mode: -p "prompt" --yolo (auto-approve tools) -s false (no sandbox).
  const args = ["-p", text, "-y", "-s", "false", ...GEMINI_BOOT_ARGS];
  const child = spawn(GEMINI_CMD, args, {
    cwd: resolvedOutputDir,
    env: { ...entry.env, FORCE_COLOR: "0", NO_COLOR: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  entry.child = child;
  entry.cwd = resolvedOutputDir;

  broadcast({ type: "agent-status", agentId, status: "working" });
  broadcast({
    type: "agent-log",
    agentId,
    stream: "system",
    message: `Running prompt (${text.length} chars) in ${resolvedOutputDir}`,
  });

  wireAgentIO(agentId, child);

  return res.json({ ok: true });
});

app.post("/api/agents/:agentId/stop", (req, res) => {
  const { agentId } = req.params;
  const entry = runningAgents.get(agentId);
  if (!entry) {
    return res.status(404).json({ ok: false, error: "Agent is not running." });
  }

  if (entry.child && !entry.child.killed && entry.child.exitCode === null) {
    entry.child.kill("SIGTERM");
    setTimeout(() => {
      try {
        if (entry.child && entry.child.exitCode === null) entry.child.kill("SIGKILL");
      } catch { /* already gone */ }
    }, 3000);
  }

  runningAgents.delete(agentId);
  broadcast({ type: "agent-status", agentId, status: "stopped" });
  return res.json({ ok: true });
});

app.use(express.static(PROJECT_ROOT));
app.get("/", (req, res) => {
  res.sendFile(path.resolve(PROJECT_ROOT, "index.html"));
});

wss.on("connection", (socket) => {
  socket.send(
    JSON.stringify({ type: "welcome", message: "Agent bridge connected." })
  );
});

server.listen(PORT, () => {
  console.log(`Agent bridge server running on http://localhost:${PORT}`);
});
