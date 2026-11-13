import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "tasks.json");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

async function readTasks() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
      await fs.writeFile(DATA_FILE, "[]", "utf8");
      return [];
    }
    throw error;
  }
}

async function writeTasks(tasks) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2) + "\n", "utf8");
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "mern-practice-api" });
});

app.get("/api/tasks", async (_req, res, next) => {
  try { res.json(await readTasks()); } catch (error) { next(error); }
});

app.post("/api/tasks", async (req, res, next) => {
  try {
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    if (!title) return res.status(400).json({ message: "Task title is required." });
    if (title.length > 120) return res.status(400).json({ message: "Title must be 120 characters or fewer." });
    const tasks = await readTasks();
    const task = { id: randomUUID(), title, completed: false, createdAt: new Date().toISOString() };
    tasks.unshift(task);
    await writeTasks(tasks);
    res.status(201).json(task);
  } catch (error) { next(error); }
});

app.patch("/api/tasks/:id", async (req, res, next) => {
  try {
    const tasks = await readTasks();
    const task = tasks.find((item) => item.id === req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found." });
    task.completed = !task.completed;
    await writeTasks(tasks);
    res.json(task);
  } catch (error) { next(error); }
});

app.delete("/api/tasks/:id", async (req, res, next) => {
  try {
    const tasks = await readTasks();
    const remaining = tasks.filter((item) => item.id !== req.params.id);
    if (remaining.length === tasks.length) return res.status(404).json({ message: "Task not found." });
    await writeTasks(remaining);
    res.status(204).end();
  } catch (error) { next(error); }
});

// Serve the built React app when running in production.
const clientDist = path.resolve(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(clientDist, "index.html"), (error) => {
    if (error) res.status(404).send("Frontend not built. Run npm run build.");
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API and app listening on http://0.0.0.0:${PORT}`);
});
