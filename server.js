const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const TASKS_FILE = path.join(__dirname, 'tasks.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const PROJECTS_FILE = path.join(__dirname, 'projects.json');

app.use(express.json());
app.use(session({
  secret: 'taskmatrix-secret',
  resave: false,
  saveUninitialized: false
}));
app.use(express.static(__dirname));

function loadTasks() {
  if (fs.existsSync(TASKS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
    } catch (_) {
      return {};
    }
  }
  return {};
}

function saveTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

function loadUsers() {
  if (fs.existsSync(USERS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (_) {
      return {};
    }
  }
  return {};
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function loadProjects() {
  if (fs.existsSync(PROJECTS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
    } catch (_) {
      return {};
    }
  }
  return {};
}

function saveProjects(projects) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

app.get('/api/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

app.post('/api/signup', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  const users = loadUsers();
  if (users[username]) {
    return res.status(409).json({ error: 'User already exists.' });
  }
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  users[username] = hash;
  saveUsers(users);
  req.session.user = username;
  res.status(201).end();
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  const users = loadUsers();
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  if (users[username] !== hash) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }
  req.session.user = username;
  res.status(204).end();
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.status(204).end());
});

app.get('/api/tasks', (req, res) => {
  if (!req.session.user) return res.status(401).end();
  const tasks = loadTasks();
  res.json(tasks[req.session.user] || { 'do-now': [], 'plan': [], 'delegate': [], 'eliminate': [] });
});

app.post('/api/tasks', (req, res) => {
  if (!req.session.user) return res.status(401).end();
  const tasks = loadTasks();
  tasks[req.session.user] = req.body;
  saveTasks(tasks);
  res.status(204).end();
});

app.delete('/api/tasks', (req, res) => {
  if (!req.session.user) return res.status(401).end();
  const tasks = loadTasks();
  tasks[req.session.user] = { 'do-now': [], 'plan': [], 'delegate': [], 'eliminate': [] };
  saveTasks(tasks);
  res.status(204).end();
});

app.get('/api/projects', (req, res) => {
  if (!req.session.user) return res.status(401).end();
  const projects = loadProjects();
  res.json(projects[req.session.user] || []);
});

app.post('/api/projects', (req, res) => {
  if (!req.session.user) return res.status(401).end();
  const { name, icon } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name required' });
  const projects = loadProjects();
  const userProjects = projects[req.session.user] || [];
  const id = Date.now().toString();
  userProjects.push({ id, name, icon });
  projects[req.session.user] = userProjects;
  saveProjects(projects);
  res.status(201).json({ id });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
