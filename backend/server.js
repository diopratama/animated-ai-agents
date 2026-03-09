import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initWebSocket } from "./wsHandler.js";
import { createRoutes } from "./routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = process.env.PROJECT_ROOT
  ? path.resolve(process.env.PROJECT_ROOT)
  : path.resolve(__dirname, "..");

const PORT = Number(process.env.PORT || 3003);

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const server = createServer(app);

initWebSocket(server);
app.use(createRoutes(PROJECT_ROOT));

app.use(express.static(PROJECT_ROOT));
app.use("/uploads", express.static(path.resolve(PROJECT_ROOT, "uploads")));
app.get("/", (_req, res) => {
  res.sendFile(path.resolve(PROJECT_ROOT, "index.html"));
});

server.listen(PORT, () => {
  console.log(`Agent bridge server running on http://localhost:${PORT}`);
});
