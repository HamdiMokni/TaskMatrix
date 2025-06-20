# TaskMatrix

This project provides an interactive Priority vs Urgency matrix (also called an Eisenhower Matrix) for managing tasks. It now includes a small Node.js server so your tasks are saved to `tasks.json` on disk. Start the server and open `http://localhost:3000` in a modern web browser to get started.

## Features

- Four quadrants: **DO NOW**, **PLAN**, **DELEGATE**, and **ELIMINATE**
- Add tasks to any quadrant
- Drag and drop tasks between quadrants
- Delete tasks with the × button
- Tasks persist on disk using the included Node.js server
- Clear all tasks via the **Clear All** button
- Print-friendly view via the **Print** button
- Responsive design that works on desktop and mobile

Run `node server.js` and visit `http://localhost:3000` to use the app.
