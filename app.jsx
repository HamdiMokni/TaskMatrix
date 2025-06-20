// React version of TaskMatrix
const QUADRANTS = [
  { id: 'do-now', icon: '🔥', title: 'DO NOW', subtitle: 'Urgent + Important' },
  { id: 'plan', icon: '📅', title: 'PLAN', subtitle: 'Important, Not Urgent' },
  { id: 'delegate', icon: '👥', title: 'DELEGATE', subtitle: 'Urgent, Not Important' },
  { id: 'eliminate', icon: '🗑️', title: 'ELIMINATE', subtitle: 'Not Urgent, Not Important' }
];

function Task({ task, onDelete }) {
  const proj = task.project || {};
  return (
    <li className="task">
      <span className="task-project-icon">{proj.icon || ''}</span>
      <span className="task-project-name">{proj.name || ''}</span>
      <span className="task-text">{task.text}</span>
      <button onClick={onDelete}>×</button>
    </li>
  );
}

function Quadrant({ qid, tasks, onDelete }) {
  const q = QUADRANTS.find(x => x.id === qid);
  return (
    <div className="quadrant" id={qid}>
      <div className="quadrant-header">
        <div className="quadrant-icon">{q.icon}</div>
        <div>
          <div className="quadrant-title">{q.title}</div>
          <div className="quadrant-subtitle">{q.subtitle}</div>
        </div>
        <div className="task-count" id={`count-${qid}`}>{tasks.length}</div>
      </div>
      <ul className="task-list">
        {tasks.map(t => (
          <Task key={t.id} task={t} onDelete={() => onDelete(qid, t.id)} />
        ))}
      </ul>
    </div>
  );
}

function ProjectModal({ visible, onAdd, onCancel }) {
  const [name, setName] = React.useState('');
  const [icon, setIcon] = React.useState('');
  if (!visible) return null;
  const icons = ['📚','💼','💡','🛠️','📝','🌐','📈','🎨','🤖','🐛'];
  return (
    <div className="modal" style={{ display: 'flex' }}>
      <div className="modal-content">
        <h2>Add Project</h2>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Project name" maxLength="100" />
        <input type="hidden" value={icon} />
        <div className="icon-options">
          {icons.map(ic => (
            <button type="button" key={ic} className={`icon-option ${icon===ic?'selected':''}`} onClick={() => setIcon(ic)}>{ic}</button>
          ))}
        </div>
        <div className="modal-actions">
          <button className="add-btn" onClick={() => { onAdd(name.trim(), icon); setName(''); setIcon(''); }}>Add</button>
          <button className="control-btn" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = React.useState(null);
  const [tasks, setTasks] = React.useState({ 'do-now': [], plan: [], delegate: [], eliminate: [] });
  const [projects, setProjects] = React.useState([]);
  const [authUser, setAuthUser] = React.useState('');
  const [authPass, setAuthPass] = React.useState('');
  const [authError, setAuthError] = React.useState('');
  const [showProjectModal, setShowProjectModal] = React.useState(false);
  const [taskText, setTaskText] = React.useState('');
  const [taskQuadrant, setTaskQuadrant] = React.useState('do-now');
  const [taskProject, setTaskProject] = React.useState('');

  React.useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    const res = await fetch('/api/me');
    const data = await res.json();
    if (data.user) {
      setUser(data.user);
      const [t, p] = await Promise.all([loadTasks(), loadProjects()]);
      setTasks(t);
      setProjects(p);
    } else {
      setUser(null);
    }
  }

  async function loadTasks() {
    const res = await fetch('/api/tasks');
    if (res.ok) return await res.json();
    return { 'do-now': [], plan: [], delegate: [], eliminate: [] };
  }

  async function loadProjects() {
    const res = await fetch('/api/projects');
    if (res.ok) return await res.json();
    return [];
  }

  async function saveTasks(updated) {
    await fetch('/api/tasks', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(updated) });
  }

  async function authSubmit() {
    if (!authUser || !authPass) { setAuthError('Username and password are required.'); return; }
    let res = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username:authUser, password:authPass }) });
    if (!res.ok && res.status === 401) {
      res = await fetch('/api/signup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username:authUser, password:authPass }) });
    }
    if (res.ok) {
      setAuthUser('');
      setAuthPass('');
      setAuthError('');
      checkAuth();
    } else {
      let msg = 'Authentication failed.';
      try { const d = await res.json(); if (d.error) msg = d.error; } catch(e){}
      setAuthError(msg);
    }
  }

  async function logout() {
    await fetch('/api/logout', { method:'POST' });
    setUser(null);
    setTasks({ 'do-now': [], plan: [], delegate: [], eliminate: [] });
  }

  function addTask() {
    const text = taskText.trim();
    if (!text) return;
    const newTask = { id: Date.now().toString(), text, projectId: taskProject };
    const proj = projects.find(p => p.id === taskProject);
    const updated = { ...tasks, [taskQuadrant]: [...tasks[taskQuadrant], { ...newTask, project: proj }] };
    setTasks(updated);
    setTaskText('');
    saveTasks({ 'do-now': updated['do-now'].map(stripProj), plan: updated.plan.map(stripProj), delegate: updated.delegate.map(stripProj), eliminate: updated.eliminate.map(stripProj) });
  }

  function stripProj(t) { return { id: t.id, text: t.text, projectId: t.projectId || '' }; }

  function deleteTask(qid, id) {
    const updated = { ...tasks, [qid]: tasks[qid].filter(t => t.id !== id) };
    setTasks(updated);
    saveTasks({ 'do-now': updated['do-now'].map(stripProj), plan: updated.plan.map(stripProj), delegate: updated.delegate.map(stripProj), eliminate: updated.eliminate.map(stripProj) });
  }

  async function clearAll() {
    const empty = { 'do-now': [], plan: [], delegate: [], eliminate: [] };
    setTasks(empty);
    await fetch('/api/tasks', { method:'DELETE' });
  }

  async function addProject(name, icon) {
    if (!name) return;
    const res = await fetch('/api/projects', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, icon }) });
    if (res.ok) {
      const data = await res.json();
      setProjects([...projects, { id: data.id, name, icon }]);
      setShowProjectModal(false);
    }
  }

  async function removeProject(id) {
    await fetch(`/api/projects/${id}`, { method:'DELETE' });
    setProjects(projects.filter(p => p.id !== id));
    setTasks(qs => {
      const upd = { ...qs };
      Object.keys(upd).forEach(q => {
        upd[q] = upd[q].map(t => t.projectId === id ? { ...t, projectId:'', project: null } : t);
      });
      saveTasks({ 'do-now': upd['do-now'].map(stripProj), plan: upd.plan.map(stripProj), delegate: upd.delegate.map(stripProj), eliminate: upd.eliminate.map(stripProj) });
      return upd;
    });
  }

  if (!user) {
    return (
      <div id="auth" className="container fade-in">
        <h1>TaskMatrix</h1>
        <div className="task-input">
          <input type="text" value={authUser} onChange={e=>setAuthUser(e.target.value)} placeholder="Username" maxLength="30" />
          <input type="password" value={authPass} onChange={e=>setAuthPass(e.target.value)} placeholder="Password" maxLength="100" />
          <button className="add-btn" onClick={authSubmit}>Log In / Sign Up</button>
        </div>
        {authError && <div className="error-msg">{authError}</div>}
      </div>
    );
  }

  return (
    <>
      <button id="logout" className="control-btn" onClick={logout}>Log Out</button>
      <div id="matrix" className="container fade-in">
        <h1>Priority vs Urgency Matrix</h1>
        <div className="project-input">
          <button className="add-btn" onClick={()=>setShowProjectModal(true)}>Add Project</button>
        </div>
        <div id="project-list" className="project-list">
          {projects.map(p => (
            <div key={p.id} className="project-item">
              <span className="project-item-icon">{p.icon}</span>
              <span className="project-item-name">{p.name}</span>
              <button onClick={()=>removeProject(p.id)}>×</button>
            </div>
          ))}
        </div>
        <div className="task-input">
          <input type="text" value={taskText} onChange={e=>setTaskText(e.target.value)} placeholder="Enter a new task..." maxLength="200" />
          <select value={taskQuadrant} onChange={e=>setTaskQuadrant(e.target.value)}>
            {QUADRANTS.map(q => <option key={q.id} value={q.id}>{q.icon} {q.title} ({q.subtitle})</option>)}
          </select>
          <select value={taskProject} onChange={e=>setTaskProject(e.target.value)}>
            <option value="">No Project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.icon ? p.icon+' ' : ''}{p.name}</option>)}
          </select>
          <button className="add-btn" onClick={addTask}>Add Task</button>
        </div>
        <div className="controls">
          <button className="control-btn" onClick={clearAll}>Clear All</button>
          <button className="control-btn" onClick={()=>window.print()}>Print Matrix</button>
        </div>
        <div className="matrix">
          {QUADRANTS.map(q => (
            <Quadrant key={q.id} qid={q.id} tasks={tasks[q.id] || []} onDelete={deleteTask} />
          ))}
        </div>
      </div>
      <ProjectModal visible={showProjectModal} onAdd={addProject} onCancel={()=>setShowProjectModal(false)} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
