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

    const QUADRANTS = ['do-now', 'plan', 'delegate', 'eliminate'];
    let tasks = { 'do-now': [], 'plan': [], 'delegate': [], 'eliminate': [] };

    checkAuth();

    addBtn.addEventListener('click', addTask);
    input.addEventListener('keypress', e => {
        if (e.key === 'Enter') addTask();
    });
    printBtn.addEventListener('click', () => window.print());
    clearBtn.addEventListener('click', clearAll);
    authBtn.addEventListener('click', authSubmit);
    logoutBtn.addEventListener('click', logout);

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
        const list = document.getElementById(q).querySelector('.task-list');
        const item = createTaskItem({ id: Date.now().toString(), text });
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
        li.textContent = task.text;

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
                tasks[q].push({ id: li.dataset.id, text: li.firstChild.textContent.trim() });
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
            loadTasks().then(renderTasks);
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
