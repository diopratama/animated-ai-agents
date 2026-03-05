import { WebSocketServer } from "ws";
import { stripAnsi } from "./agentManager.js";

/** @type {WebSocketServer|null} */
let wss = null;

export function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket) => {
    socket.send(
      JSON.stringify({ type: "welcome", message: "Agent bridge connected." })
    );
  });

  return wss;
}

export function broadcast(payload) {
  if (!wss) return;
  const body = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(body);
    }
  });
}

export function wireAgentIO(agentId, child) {
  child.stdout.on("data", (chunk) => {
    const clean = stripAnsi(chunk.toString());
    if (clean.trim()) {
      broadcast({ type: "agent-log", agentId, stream: "stdout", message: clean });
    }
  });

  child.stderr.on("data", (chunk) => {
    const clean = stripAnsi(chunk.toString());
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
