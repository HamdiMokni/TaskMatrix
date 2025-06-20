# TaskMatrix

TaskMatrix is a lightweight tool for managing tasks with the Eisenhower priority matrix. It provides a modern web interface backed by a small Node.js server so your tasks are persisted between sessions. The interface has been rewritten in **React** to make the UI easier to extend.

## Installation

1. Make sure you have Node.js installed.
2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm start
```

Open <http://localhost:3000> in your browser to use the app.

Create an account via the sign‑up form to start using TaskMatrix. Each user has their own task list stored in `tasks.json` alongside credentials in `users.json`.

## Features

- Four quadrants: **DO NOW**, **PLAN**, **DELEGATE**, and **ELIMINATE**
- Add tasks to any quadrant
- Optional projects with custom icons to group tasks
- Drag and drop tasks between quadrants
- Reorder tasks within a quadrant using drag and drop
- Delete tasks with the × button
- Persist tasks to disk using the included Node.js server
- User accounts with sign-up and sign-in
- Clear all tasks via the **Clear All** button
- Print-friendly view via the **Print** button
- Responsive design for desktop and mobile devices

## File Overview

- `index.html` – Application markup
- `style.css` – Styling for the matrix
- `script.js` – Front-end logic and drag-and-drop handling
- `server.js` – Express server serving static files and saving tasks
- `tasks.json` – Generated storage file for your tasks
- `projects.json` – Generated storage file for your projects

## Contributing

Issues and pull requests are welcome. Feel free to submit improvements or bug fixes.
