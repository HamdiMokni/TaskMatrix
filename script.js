document.addEventListener('DOMContentLoaded', function() {
    const addBtn = document.getElementById('add-task');
    const input = document.getElementById('task-input');
    const select = document.getElementById('quadrant-select');
    const printBtn = document.getElementById('print');

    addBtn.addEventListener('click', addTask);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });
    printBtn.addEventListener('click', () => window.print());

    function addTask() {
        const text = input.value.trim();
        if (!text) return;
        const quadrant = document.getElementById(select.value);
        const list = quadrant.querySelector('.task-list');
        const item = createTaskItem(text);
        list.appendChild(item);
        input.value = '';
    }

    function createTaskItem(text) {
        const li = document.createElement('li');
        li.className = 'task';
        li.draggable = true;
        li.textContent = text;

        const del = document.createElement('button');
        del.textContent = '\u00D7';
        del.addEventListener('click', () => li.remove());
        li.appendChild(del);

        li.addEventListener('dragstart', () => li.classList.add('dragging'));
        li.addEventListener('dragend', () => li.classList.remove('dragging'));
        return li;
    }

    const lists = document.querySelectorAll('.task-list');
    lists.forEach(list => {
        list.addEventListener('dragover', function(e) {
            e.preventDefault();
            const dragging = document.querySelector('.dragging');
            if (dragging && e.target.classList.contains('task-list')) {
                list.appendChild(dragging);
            }
        });
    });
});
