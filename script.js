document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('add-task');
    const input = document.getElementById('task-input');
    const select = document.getElementById('quadrant-select');
    const printBtn = document.getElementById('print');
    const clearBtn = document.getElementById('clear');

    const QUADRANTS = ['do-now', 'plan', 'delegate', 'eliminate'];
    let tasks = { 'do-now': [], 'plan': [], 'delegate': [], 'eliminate': [] };

    loadTasks().then(t => {
        tasks = t;
        QUADRANTS.forEach(q => {
            const list = document.getElementById(q).querySelector('.task-list');
            tasks[q].forEach(task => list.appendChild(createTaskItem(task)));
        });
        updateCounts();
    });

    addBtn.addEventListener('click', addTask);
    input.addEventListener('keypress', e => {
        if (e.key === 'Enter') addTask();
    });
    printBtn.addEventListener('click', () => window.print());
    clearBtn.addEventListener('click', clearAll);

    const lists = document.querySelectorAll('.task-list');
    lists.forEach(list => {
        list.addEventListener('dragover', e => {
            e.preventDefault();
            const dragging = document.querySelector('.dragging');
            if (dragging && e.target.classList.contains('task-list')) {
                list.appendChild(dragging);
            }
        });
        list.addEventListener('drop', saveState);
    });

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
});
