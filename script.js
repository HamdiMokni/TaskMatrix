document.addEventListener('DOMContentLoaded', () => {
    const authBtn = document.getElementById('auth-btn');
    const logoutBtn = document.getElementById('logout');
    const authBox = document.getElementById('auth');
    const matrixBox = document.getElementById('matrix');
    const authError = document.getElementById('auth-error');

    const addBtn = document.getElementById('add-task');
    const input = document.getElementById('task-input');
    const select = document.getElementById('quadrant-select');
    const printBtn = document.getElementById('print');
    const clearBtn = document.getElementById('clear');

    const openProjectModalBtn = document.getElementById('open-project-modal');
    const projectModal = document.getElementById('project-modal');
    const addProjectBtn = document.getElementById('add-project');
    const cancelProjectBtn = document.getElementById('cancel-add-project');
    const projectNameInput = document.getElementById('project-name');
    const projectIconInput = document.getElementById('project-icon');
    const projectSelect = document.getElementById('project-select');
    const projectList = document.getElementById('project-list');
    const iconOptionButtons = document.querySelectorAll('.icon-option');

    const QUADRANTS = ['do-now', 'plan', 'delegate', 'eliminate'];
    let tasks = { 'do-now': [], 'plan': [], 'delegate': [], 'eliminate': [] };
    let projects = [];

    checkAuth();

    addBtn.addEventListener('click', addTask);
    input.addEventListener('keypress', e => {
        if (e.key === 'Enter') addTask();
    });
    printBtn.addEventListener('click', () => window.print());
    clearBtn.addEventListener('click', clearAll);
    authBtn.addEventListener('click', authSubmit);
    logoutBtn.addEventListener('click', logout);

    openProjectModalBtn.addEventListener('click', () => {
        projectModal.style.display = 'flex';
    });

    cancelProjectBtn.addEventListener('click', () => {
        projectModal.style.display = 'none';
    });

    iconOptionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            iconOptionButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            projectIconInput.value = btn.textContent.trim();
        });
    });

    addProjectBtn.addEventListener('click', addProject);

    const lists = document.querySelectorAll('.task-list');
    lists.forEach(list => {
        list.addEventListener('dragover', e => {
            e.preventDefault();
            const dragging = document.querySelector('.dragging');
            if (!dragging) return;
            const after = getDragAfterElement(list, e.clientY);
            if (after == null) {
                list.appendChild(dragging);
            } else {
                list.insertBefore(dragging, after);
            }
        });

        list.addEventListener('dragenter', () => {
            list.parentElement.classList.add('drag-over');
        });

        list.addEventListener('dragleave', e => {
            if (!list.contains(e.relatedTarget)) {
                list.parentElement.classList.remove('drag-over');
            }
        });

        list.addEventListener('drop', e => {
            e.preventDefault();
            list.parentElement.classList.remove('drag-over');
            saveState();
        });
    });

    function getDragAfterElement(list, y) {
        const items = [...list.querySelectorAll('.task:not(.dragging)')];
        return items.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function addTask() {
        const text = input.value.trim();
        if (!text) return;
        const q = select.value;
        const projectId = projectSelect.value;
        const list = document.getElementById(q).querySelector('.task-list');
        const item = createTaskItem({ id: Date.now().toString(), text, projectId });
        list.appendChild(item);
        input.value = '';
        saveState();
        updateCounts();
    }

    function createTaskItem(task) {
        const li = document.createElement('li');
        li.className = 'task';
        li.draggable = true;
        li.dataset.id = task.id;
        li.dataset.project = task.projectId || '';

        const iconSpan = document.createElement('span');
        iconSpan.className = 'task-project-icon';
        const proj = projects.find(p => p.id === task.projectId);
        iconSpan.textContent = proj ? proj.icon || '' : '';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'task-project-name';
        nameSpan.textContent = proj ? proj.name : '';

        const textSpan = document.createElement('span');
        textSpan.className = 'task-text';
        textSpan.textContent = task.text;

        li.appendChild(iconSpan);
        li.appendChild(nameSpan);
        li.appendChild(textSpan);

        const del = document.createElement('button');
        del.textContent = '\u00D7';
        del.addEventListener('click', () => { li.remove(); saveState(); updateCounts(); });
        li.appendChild(del);

        li.addEventListener('dragstart', () => li.classList.add('dragging'));
        li.addEventListener('dragend', () => { li.classList.remove('dragging'); saveState(); });
        return li;
    }

    async function saveState() {
        QUADRANTS.forEach(q => {
            tasks[q] = [];
            const items = document.getElementById(q).querySelectorAll('.task');
            items.forEach(li => {
                tasks[q].push({
                    id: li.dataset.id,
                    text: li.querySelector('.task-text').textContent.trim(),
                    projectId: li.dataset.project || ''
                });
            });
        });
        await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tasks)
        });
        updateCounts();
    }

    async function loadTasks() {
        try {
            const res = await fetch('/api/tasks');
            if (res.ok) return await res.json();
        } catch (e) {}
        return { 'do-now': [], 'plan': [], 'delegate': [], 'eliminate': [] };
    }

    async function loadProjects() {
        try {
            const res = await fetch('/api/projects');
            if (res.ok) return await res.json();
        } catch (e) {}
        return [];
    }

    async function addProject() {
        const name = projectNameInput.value.trim();
        if (!name) return;
        const icon = projectIconInput.value.trim();
        const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, icon })
        });
        if (res.ok) {
            const data = await res.json();
            projects.push({ id: data.id, name, icon });
            renderProjectOptions();
            projectNameInput.value = '';
            projectIconInput.value = '';
            iconOptionButtons.forEach(b => b.classList.remove('selected'));
            projectModal.style.display = 'none';
        }
    }

    function renderProjectOptions() {
        projectSelect.innerHTML = '<option value="">No Project</option>';
        projects.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.icon ? p.icon + ' ' : ''}${p.name}`;
            projectSelect.appendChild(opt);
        });
        renderProjectList();
    }

    function renderProjectList() {
        if (!projectList) return;
        projectList.innerHTML = '';
        projects.forEach(p => {
            const div = document.createElement('div');
            div.className = 'project-item';
            const span = document.createElement('span');
            span.textContent = `${p.icon ? p.icon + ' ' : ''}${p.name}`;
            const btn = document.createElement('button');
            btn.textContent = '\u00D7';
            btn.addEventListener('click', () => removeProject(p.id));
            div.appendChild(span);
            div.appendChild(btn);
            projectList.appendChild(div);
        });
    }

    async function removeProject(id) {
        const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        if (res.ok) {
            projects = projects.filter(p => p.id !== id);
            // remove project from tasks in UI
            document.querySelectorAll(`.task[data-project='${id}']`).forEach(li => {
                li.dataset.project = '';
                const iconSpan = li.querySelector('.task-project-icon');
                const nameSpan = li.querySelector('.task-project-name');
                if (iconSpan) iconSpan.textContent = '';
                if (nameSpan) nameSpan.textContent = '';
            });
            renderProjectOptions();
            saveState();
        }
    }

    async function clearAll() {
        tasks = { 'do-now': [], 'plan': [], 'delegate': [], 'eliminate': [] };
        QUADRANTS.forEach(q => {
            const list = document.getElementById(q).querySelector('.task-list');
            list.innerHTML = '';
        });
        await fetch('/api/tasks', { method: 'DELETE' });
        updateCounts();
    }

    function updateCounts() {
        QUADRANTS.forEach(q => {
            const count = document.getElementById(`count-${q}`);
            if (count) {
                const len = document.getElementById(q).querySelectorAll('.task').length;
                count.textContent = len;
            }
        });
    }

    function showAuthError(msg) {
        authError.textContent = msg;
        authError.style.display = msg ? '' : 'none';
    }

    async function checkAuth() {
        const res = await fetch('/api/me');
        const data = await res.json();
        if (data.user) {
            authBox.style.display = 'none';
            logoutBtn.style.display = '';
            matrixBox.style.display = '';
            showAuthError('');
            Promise.all([loadTasks(), loadProjects()]).then(([t, p]) => {
                renderTasks(t);
                projects = p;
                renderProjectOptions();
            });
        } else {
            authBox.style.display = '';
            logoutBtn.style.display = 'none';
            matrixBox.style.display = 'none';
            showAuthError('');
        }
    }

    function renderTasks(t) {
        tasks = t;
        QUADRANTS.forEach(q => {
            const list = document.getElementById(q).querySelector('.task-list');
            list.innerHTML = '';
            tasks[q].forEach(task => list.appendChild(createTaskItem(task)));
        });
        updateCounts();
    }

    async function authSubmit() {
        const username = document.getElementById('auth-user').value.trim();
        const password = document.getElementById('auth-pass').value;
        if (!username || !password) {
            showAuthError('Username and password are required.');
            return;
        }
        let res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok && res.status === 401) {
            res = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
        }
        if (res.ok) {
            checkAuth();
        } else {
            let msg = 'Authentication failed.';
            try { const data = await res.json(); if (data.error) msg = data.error; } catch (e) {}
            showAuthError(msg);
        }
    }

    async function logout() {
        await fetch('/api/logout', { method: 'POST' });
        checkAuth();
    }
});
