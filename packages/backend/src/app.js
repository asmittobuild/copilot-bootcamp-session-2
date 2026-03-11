const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize in-memory SQLite database
const db = new Database(':memory:');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    due_date TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert initial tasks so a fresh app has visible data.
const initialTasks = [
  { name: 'Draft project plan', dueDate: '2026-03-20' },
  { name: 'Prepare demo checklist', dueDate: '2026-03-18' },
  { name: 'Organize backlog', dueDate: null },
];
const insertTaskStmt = db.prepare(
  'INSERT INTO tasks (name, due_date) VALUES (?, ?)'
);

initialTasks.forEach(({ name, dueDate }) => {
  insertTaskStmt.run(name, dueDate);
});

console.log('In-memory database initialized with sample tasks');

// Validate task payload and normalize optional due date.
function validateTaskPayload(name, dueDate) {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return { valid: false, error: 'Task name is required' };
  }

  if (dueDate === undefined || dueDate === null || dueDate === '') {
    return { valid: true, normalizedDueDate: null, normalizedName: name.trim() };
  }

  if (typeof dueDate !== 'string') {
    return { valid: false, error: 'Due date must be a valid ISO date string (YYYY-MM-DD)' };
  }

  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(dueDate);
  if (!isValidDate || Number.isNaN(Date.parse(dueDate))) {
    return { valid: false, error: 'Due date must be a valid ISO date string (YYYY-MM-DD)' };
  }

  return { valid: true, normalizedDueDate: dueDate, normalizedName: name.trim() };
}

// Build SQL ORDER BY clause for supported task sort modes.
function buildSortClause(sortBy) {
  if (sortBy === 'name') {
    return 'ORDER BY LOWER(name) ASC, id ASC';
  }

  return `
    ORDER BY
      CASE WHEN due_date IS NULL THEN 1 ELSE 0 END ASC,
      due_date ASC,
      LOWER(name) ASC,
      id ASC
  `;
}

// Shared integer id validation for task routes.
function parseTaskId(id) {
  const parsedId = parseInt(id, 10);
  if (!id || Number.isNaN(parsedId)) {
    return { valid: false, error: 'Valid task ID is required' };
  }

  return { valid: true, id: parsedId };
}

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running' });
});

// API Routes
app.get('/api/tasks', (req, res) => {
  try {
    const sortBy = req.query.sort === 'name' ? 'name' : 'dueDate';
    const orderClause = buildSortClause(sortBy);
    const tasks = db.prepare(`SELECT * FROM tasks ${orderClause}`).all();

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const { name, dueDate } = req.body;
    const validation = validateTaskPayload(name, dueDate);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const result = insertTaskStmt.run(validation.normalizedName, validation.normalizedDueDate);
    const id = result.lastInsertRowid;

    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const parsed = parseTaskId(req.params.id);
    if (!parsed.valid) {
      return res.status(400).json({ error: parsed.error });
    }

    const { name, dueDate } = req.body;
    const validation = validateTaskPayload(name, dueDate);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(parsed.id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updateStmt = db.prepare(`
      UPDATE tasks
      SET name = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(validation.normalizedName, validation.normalizedDueDate, parsed.id);

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(parsed.id);
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const parsed = parseTaskId(req.params.id);
    if (!parsed.valid) {
      return res.status(400).json({ error: parsed.error });
    }

    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(parsed.id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const deleteStmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = deleteStmt.run(parsed.id);

    if (result.changes > 0) {
      res.json({ message: 'Task deleted successfully', id: parsed.id });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Backward compatibility routes to avoid breaking existing clients.
app.get('/api/items', (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/api/items', (req, res) => {
  try {
    const validation = validateTaskPayload(req.body?.name, null);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const result = insertTaskStmt.run(validation.normalizedName, null);
    const id = result.lastInsertRowid;
    const newItem = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.delete('/api/items/:id', (req, res) => {
  try {
    const parsed = parseTaskId(req.params.id);
    if (!parsed.valid) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existingItem = db.prepare('SELECT * FROM tasks WHERE id = ?').get(parsed.id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const deleteStmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = deleteStmt.run(parsed.id);
    if (result.changes > 0) {
      res.json({ message: 'Item deleted successfully', id: parsed.id });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = {
  app,
  db,
  buildSortClause,
  validateTaskPayload,
  parseTaskId,
};