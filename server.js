const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

// Temporary "database"
let tasks = [
  { id: 1, title: "Physics II lab report", course: "Physics II", dueDate: "2026-10-21", completed: false },
];
let nextId = 2;

// READ: get all tasks
app.get("/api/tasks", (req, res) => {
  res.json(tasks);
});

// CREATE: add a task
app.post("/api/tasks", (req, res) => {
  const { title, course, dueDate } = req.body;

  if (!title || !dueDate) {
    return res.status(400).json({ error: "title and dueDate are required" });
  }

  const task = { id: nextId++, title, course, dueDate, completed: false };
  tasks.push(task);
  res.status(201).json(task);
});

// UPDATE: change a task (e.g. mark it complete)
app.patch("/api/tasks/:id", (req, res) => {
  const task = tasks.find((t) => t.id === Number(req.params.id));

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  if (req.body.title !== undefined) task.title = req.body.title;
  if (req.body.completed !== undefined) task.completed = req.body.completed;
  res.json(task);
});

// DELETE: remove a task
app.delete("/api/tasks/:id", (req, res) => {
  const index = tasks.findIndex((t) => t.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  tasks.splice(index, 1);
  res.status(204).end();
});

app.listen(3000, () => console.log("Running on http://localhost:3000"));