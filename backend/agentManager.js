import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const GEMINI_CMD = process.env.GEMINI_CMD || "gemini";
const GEMINI_BOOT_ARGS = (process.env.GEMINI_BOOT_ARGS || "")
  .split(" ")
  .map((v) => v.trim())
  .filter(Boolean);
const DEFAULT_AUTH_MODE = process.env.GEMINI_AUTH_MODE || "api_key";
const AUTH_MODES = new Set(["api_key", "google_login"]);

export const AGENT_DEFS = {
  arch: { name: "Architect", roleFile: "agents/architect.md" },
  db: { name: "DB Designer", roleFile: "agents/db-designer.md" },
  be: { name: "Backend Dev", roleFile: "agents/backend-dev.md" },
  fe: { name: "Frontend Dev", roleFile: "agents/frontend-dev.md" },
  qa: { name: "QA Engineer", roleFile: "agents/qa-agent.md" },
  devops: { name: "DevOps Engineer", roleFile: "agents/devops-engineer.md" },
  sec: { name: "Security Engineer", roleFile: "agents/security-engineer.md" },
};

/** @type {Map<string, { child: import("node:child_process").ChildProcessWithoutNullStreams|null, env: Record<string,string>, cwd: string|null, authMode: string }>} */
export const runningAgents = new Map();

export function checkGeminiInstalled() {
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

export function detectGoogleLoginCredentials() {
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

export function authHealth() {
  const google = detectGoogleLoginCredentials();
  const apiKeyConfigured = Boolean((process.env.GEMINI_API_KEY || "").trim());
  const envDefaultMode = AUTH_MODES.has(DEFAULT_AUTH_MODE) ? DEFAULT_AUTH_MODE : "";
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

export function resolveAuth(authMode, apiKey) {
  const auth = authHealth();
  const resolvedAuthMode = AUTH_MODES.has(authMode) ? authMode : auth.defaultMode;
  const childEnv = { ...process.env };

  if (resolvedAuthMode === "api_key") {
    const resolvedKey = (apiKey || process.env.GEMINI_API_KEY || "").trim();
    if (!resolvedKey) {
      return {
        ok: false,
        error: "API key mode selected but no key provided. Set GEMINI_API_KEY or provide key in UI.",
      };
    }
    childEnv.GEMINI_API_KEY = resolvedKey;
  } else {
    if (!auth.googleLoginDetected) {
      return {
        ok: false,
        error: "Google login mode selected, but no Gemini CLI login credentials are available in container.",
      };
    }
    delete childEnv.GEMINI_API_KEY;
  }

  return { ok: true, childEnv, resolvedAuthMode };
}

export function agentSnapshot(agentId) {
  const def = AGENT_DEFS[agentId];
  return {
    id: agentId,
    name: def.name,
    running: runningAgents.has(agentId),
  };
}

export function preTrustFolder(folderPath) {
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
      fs.writeFileSync(trustFile, JSON.stringify(config, null, 2), { mode: 0o600 });
    }
  } catch {
    // Non-fatal
  }
}

export function resolveOutputDir(outputDirRaw, projectRoot) {
  if (!outputDirRaw) return projectRoot;
  if (path.isAbsolute(outputDirRaw)) return outputDirRaw;
  return path.resolve(projectRoot, outputDirRaw);
}

export function stripAnsi(text) {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "");
}

export function spawnAgent(agentId, args, cwd, env) {
  return spawn(GEMINI_CMD, [...args, ...GEMINI_BOOT_ARGS], {
    cwd,
    env: { ...env, FORCE_COLOR: "0", NO_COLOR: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
}
