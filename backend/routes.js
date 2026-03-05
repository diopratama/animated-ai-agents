import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import {
  AGENT_DEFS,
  runningAgents,
  checkGeminiInstalled,
  authHealth,
  resolveAuth,
  agentSnapshot,
  preTrustFolder,
  resolveOutputDir,
  spawnAgent,
} from "./agentManager.js";
import { broadcast, wireAgentIO } from "./wsHandler.js";

export function createRoutes(projectRoot) {
  const router = Router();

  function buildPrompt(agentId, story, outputDir) {
    const def = AGENT_DEFS[agentId];
    if (!def) return "";

    const rolePath = path.resolve(projectRoot, def.roleFile);
    const roleContent = fs.existsSync(rolePath)
      ? fs.readFileSync(rolePath, "utf8")
      : "";

    return [
      `You are running as ${def.name}.`,
      `Project root: ${projectRoot}`,
      `Write all output files under: ${outputDir}`,
      `User story: ${story || "As a user I want to login with Google"}`,
      "",
      "--- Role instructions ---",
      roleContent,
      "",
      "Start working now. Acknowledge what you will do, then produce the deliverables for your role.",
    ].join("\n");
  }

  router.get("/api/health", (_req, res) => {
    const gemini = checkGeminiInstalled();
    const auth = authHealth();
    res.json({
      ok: gemini.ok,
      gemini,
      auth,
      runningAgents: [...Object.keys(AGENT_DEFS)].map(agentSnapshot),
    });
  });

  router.get("/api/agents", (_req, res) => {
    res.json({
      agents: [...Object.keys(AGENT_DEFS)].map(agentSnapshot),
    });
  });

  router.post("/api/agents/start", (req, res) => {
    const { agentId, authMode, apiKey } = req.body || {};
    if (!AGENT_DEFS[agentId]) {
      return res.status(400).json({ ok: false, error: "Unknown agentId." });
    }

    const authResult = resolveAuth(authMode, apiKey);
    if (!authResult.ok) {
      return res.status(400).json({ ok: false, error: authResult.error });
    }

    runningAgents.set(agentId, {
      child: null,
      env: authResult.childEnv,
      cwd: null,
      authMode: authResult.resolvedAuthMode,
    });
    broadcast({ type: "agent-status", agentId, status: "running" });
    broadcast({
      type: "agent-log",
      agentId,
      stream: "system",
      message: `${AGENT_DEFS[agentId].name} ready (auth: ${authResult.resolvedAuthMode}).`,
    });

    return res.json({ ok: true, agent: agentSnapshot(agentId) });
  });

  router.post("/api/agents/:agentId/run", (req, res) => {
    const { agentId } = req.params;
    const { prompt, outputDir, model } = req.body || {};
    const entry = runningAgents.get(agentId);
    if (!entry) {
      return res.status(404).json({ ok: false, error: "Agent is not enabled. Click START first." });
    }

    const text = (prompt || "").trim();
    if (!text) {
      return res.status(400).json({ ok: false, error: "Empty prompt." });
    }

    if (entry.child && !entry.child.killed && entry.child.exitCode === null) {
      return res.status(409).json({ ok: false, error: "Agent is still processing a previous prompt." });
    }

    const resolvedOutputDir = resolveOutputDir(outputDir, projectRoot);
    preTrustFolder(resolvedOutputDir);
    fs.mkdirSync(resolvedOutputDir, { recursive: true });

    const args = ["-p", text, "-y", "-s", "false"];
    if (model && typeof model === "string" && model.trim()) {
      args.push("--model", model.trim());
    }

    const child = spawnAgent(agentId, args, resolvedOutputDir, entry.env);
    entry.child = child;
    entry.cwd = resolvedOutputDir;

    broadcast({ type: "agent-status", agentId, status: "working" });
    broadcast({
      type: "agent-log",
      agentId,
      stream: "system",
      message: `Running prompt (${text.length} chars) in ${resolvedOutputDir}${model ? ` [model: ${model}]` : ""}`,
    });

    wireAgentIO(agentId, child);

    return res.json({ ok: true });
  });

  router.post("/api/agents/:agentId/stop", (req, res) => {
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

  return router;
}
