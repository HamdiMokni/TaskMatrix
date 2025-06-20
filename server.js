const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TASKS_FILE = path.join(__dirname, 'tasks.json');

app.use(express.json());
app.use(express.static(__dirname));

function loadTasks() {
  if (fs.existsSync(TASKS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
    } catch (_) {
      return { 'do-now': [], 'plan': [], 'delegate': [], 'eliminate': [] };
    }
  }
  return { 'do-now': [], 'plan': [], 'delegate': [], 'eliminate': [] };
}

function saveTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

app.get('/api/tasks', (req, res) => {
  res.json(loadTasks());
});

app.post('/api/tasks', (req, res) => {
  saveTasks(req.body);
  res.status(204).end();
});

app.delete('/api/tasks', (req, res) => {
  const empty = { 'do-now': [], 'plan': [], 'delegate': [], 'eliminate': [] };
  saveTasks(empty);
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
