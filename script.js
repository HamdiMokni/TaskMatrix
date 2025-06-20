document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('add-task');
    const input = document.getElementById('task-input');
    const select = document.getElementById('quadrant-select');
    const printBtn = document.getElementById('print');
    const clearBtn = document.getElementById('clear');

    const QUADRANTS = ['do-now', 'plan', 'delegate', 'eliminate'];
    let tasks = loadTasks();

    // populate lists from stored tasks
    QUADRANTS.forEach(q => {
        const list = document.getElementById(q).querySelector('.task-list');
        tasks[q].forEach(t => list.appendChild(createTaskItem(t)));
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
    }

    function createTaskItem(task) {
        const li = document.createElement('li');
        li.className = 'task';
        li.draggable = true;
        li.dataset.id = task.id;
        li.textContent = task.text;

        const del = document.createElement('button');
        del.textContent = '\u00D7';
        del.addEventListener('click', () => { li.remove(); saveState(); });
        li.appendChild(del);

        li.addEventListener('dragstart', () => li.classList.add('dragging'));
        li.addEventListener('dragend', () => { li.classList.remove('dragging'); saveState(); });
        return li;
    }

    function saveState() {
        QUADRANTS.forEach(q => {
            tasks[q] = [];
            const items = document.getElementById(q).querySelectorAll('.task');
            items.forEach(li => {
                tasks[q].push({ id: li.dataset.id, text: li.firstChild.textContent.trim() });
            });
        });
        localStorage.setItem('taskMatrixTasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const stored = localStorage.getItem('taskMatrixTasks');
        if (stored) return JSON.parse(stored);
        return { 'do-now': [], 'plan': [], 'delegate': [], 'eliminate': [] };
    }

    function clearAll() {
        tasks = { 'do-now': [], 'plan': [], 'delegate': [], 'eliminate': [] };
        QUADRANTS.forEach(q => {
            const list = document.getElementById(q).querySelector('.task-list');
            list.innerHTML = '';
        });
        localStorage.removeItem('taskMatrixTasks');
    }
});
