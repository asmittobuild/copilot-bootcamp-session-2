const {
  app,
  db,
  buildSortClause,
  validateTaskPayload,
  parseTaskId,
} = require('../src/app');
const request = require('supertest');

function resetTasks() {
  db.prepare('DELETE FROM tasks').run();
  db.prepare('INSERT INTO tasks (name, due_date) VALUES (?, ?)').run('Alpha', '2026-03-10');
  db.prepare('INSERT INTO tasks (name, due_date) VALUES (?, ?)').run('Beta', '2026-03-10');
  db.prepare('INSERT INTO tasks (name, due_date) VALUES (?, ?)').run('Gamma', '2026-03-09');
  db.prepare('INSERT INTO tasks (name, due_date) VALUES (?, ?)').run('No Due Date', null);
}

beforeEach(() => {
  resetTasks();
});

describe('Task helper functions', () => {
  test('buildSortClause returns alphabetical sort for name mode', () => {
    expect(buildSortClause('name')).toContain('LOWER(name) ASC');
  });

  test('buildSortClause defaults to due date sort', () => {
    expect(buildSortClause('dueDate')).toContain('due_date ASC');
    expect(buildSortClause('unsupported')).toContain('due_date ASC');
  });

  test('validateTaskPayload accepts valid name and null due date', () => {
    const result = validateTaskPayload('  Write tests  ', null);
    expect(result.valid).toBe(true);
    expect(result.normalizedName).toBe('Write tests');
    expect(result.normalizedDueDate).toBeNull();
  });

  test('validateTaskPayload rejects invalid due date format', () => {
    const result = validateTaskPayload('Write tests', '03/11/2026');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Due date must be a valid ISO date string (YYYY-MM-DD)');
  });

  test('validateTaskPayload rejects non-string due date', () => {
    const result = validateTaskPayload('Write tests', 12345);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Due date must be a valid ISO date string (YYYY-MM-DD)');
  });

  test('parseTaskId validates and parses ids', () => {
    expect(parseTaskId('42')).toEqual({ valid: true, id: 42 });
    expect(parseTaskId('abc')).toEqual({ valid: false, error: 'Valid task ID is required' });
  });
});

describe('Task API endpoints', () => {
  test('health endpoint returns ok', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', message: 'Backend server is running' });
  });

  test('GET /api/tasks sorts by due date then name', async () => {
    const response = await request(app).get('/api/tasks?sort=dueDate');
    expect(response.status).toBe(200);
    expect(response.body.map((task) => task.name)).toEqual(['Gamma', 'Alpha', 'Beta', 'No Due Date']);
  });

  test('GET /api/tasks sorts by name', async () => {
    const response = await request(app).get('/api/tasks?sort=name');
    expect(response.status).toBe(200);
    expect(response.body.map((task) => task.name)).toEqual(['Alpha', 'Beta', 'Gamma', 'No Due Date']);
  });

  test('POST /api/tasks creates task with due date', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ name: 'Ship v1', dueDate: '2026-03-21' });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Ship v1');
    expect(response.body.due_date).toBe('2026-03-21');
  });

  test('POST /api/tasks rejects empty name', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ name: '', dueDate: '2026-03-21' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Task name is required');
  });

  test('POST /api/tasks rejects invalid due date', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ name: 'Bad date', dueDate: '03/11/2026' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Due date must be a valid ISO date string (YYYY-MM-DD)');
  });

  test('PUT /api/tasks updates existing task', async () => {
    const list = await request(app).get('/api/tasks?sort=name');
    const task = list.body.find((entry) => entry.name === 'Alpha');

    const response = await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ name: 'Alpha Updated', dueDate: '2026-03-22' });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Alpha Updated');
    expect(response.body.due_date).toBe('2026-03-22');
  });

  test('PUT /api/tasks validates id and payload', async () => {
    const invalidId = await request(app)
      .put('/api/tasks/not-a-number')
      .send({ name: 'Anything', dueDate: null });
    expect(invalidId.status).toBe(400);
    expect(invalidId.body.error).toBe('Valid task ID is required');

    const badPayload = await request(app)
      .put('/api/tasks/1')
      .send({ name: '', dueDate: null });
    expect(badPayload.status).toBe(400);
    expect(badPayload.body.error).toBe('Task name is required');
  });

  test('PUT /api/tasks returns 404 for missing task', async () => {
    const response = await request(app)
      .put('/api/tasks/99999')
      .send({ name: 'Missing', dueDate: null });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Task not found');
  });

  test('DELETE /api/tasks deletes and validates id', async () => {
    const list = await request(app).get('/api/tasks?sort=name');
    const task = list.body.find((entry) => entry.name === 'Beta');

    const deleted = await request(app).delete(`/api/tasks/${task.id}`);
    expect(deleted.status).toBe(200);
    expect(deleted.body).toEqual({ message: 'Task deleted successfully', id: task.id });

    const invalid = await request(app).delete('/api/tasks/nope');
    expect(invalid.status).toBe(400);
    expect(invalid.body.error).toBe('Valid task ID is required');
  });

  test('DELETE /api/tasks returns 404 for missing task', async () => {
    const response = await request(app).delete('/api/tasks/99999');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Task not found');
  });
});

describe('Compatibility item endpoints', () => {
  test('GET /api/items returns items list', async () => {
    const response = await request(app).get('/api/items');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  test('POST /api/items creates item and validates input', async () => {
    const created = await request(app)
      .post('/api/items')
      .send({ name: 'Legacy Item' });
    expect(created.status).toBe(201);
    expect(created.body.name).toBe('Legacy Item');

    const invalid = await request(app)
      .post('/api/items')
      .send({ name: '' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error).toBe('Item name is required');
  });

  test('DELETE /api/items deletes, validates id, and handles missing item', async () => {
    const created = await request(app)
      .post('/api/items')
      .send({ name: 'Delete Me' });

    const removed = await request(app).delete(`/api/items/${created.body.id}`);
    expect(removed.status).toBe(200);
    expect(removed.body).toEqual({ message: 'Item deleted successfully', id: created.body.id });

    const invalidId = await request(app).delete('/api/items/not-a-number');
    expect(invalidId.status).toBe(400);
    expect(invalidId.body.error).toBe('Valid item ID is required');

    const missing = await request(app).delete('/api/items/99999');
    expect(missing.status).toBe(404);
    expect(missing.body.error).toBe('Item not found');
  });
});

describe('Error and edge branch coverage', () => {
  test('GET /api/tasks returns 500 when task query throws', async () => {
    const originalPrepare = db.prepare.bind(db);
    const prepareSpy = jest.spyOn(db, 'prepare').mockImplementation((sql) => {
      if (sql.includes('SELECT * FROM tasks')) {
        throw new Error('forced task query failure');
      }
      return originalPrepare(sql);
    });

    const response = await request(app).get('/api/tasks?sort=dueDate');
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to fetch tasks');

    prepareSpy.mockRestore();
  });

  test('POST /api/tasks returns 500 when reading created task fails', async () => {
    const originalPrepare = db.prepare.bind(db);
    const prepareSpy = jest.spyOn(db, 'prepare').mockImplementation((sql) => {
      if (sql === 'SELECT * FROM tasks WHERE id = ?') {
        throw new Error('forced post task failure');
      }
      return originalPrepare(sql);
    });

    const response = await request(app)
      .post('/api/tasks')
      .send({ name: 'Trigger post catch', dueDate: '2026-03-21' });
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to create task');

    prepareSpy.mockRestore();
  });

  test('PUT /api/tasks returns 500 when update statement preparation fails', async () => {
    const list = await request(app).get('/api/tasks?sort=name');
    const existingTaskId = list.body[0].id;

    const originalPrepare = db.prepare.bind(db);
    const prepareSpy = jest.spyOn(db, 'prepare').mockImplementation((sql) => {
      if (sql.includes('UPDATE tasks')) {
        throw new Error('forced update failure');
      }
      return originalPrepare(sql);
    });

    const response = await request(app)
      .put(`/api/tasks/${existingTaskId}`)
      .send({ name: 'Trigger put catch', dueDate: '2026-03-25' });
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to update task');

    prepareSpy.mockRestore();
  });

  test('DELETE /api/tasks handles zero-row delete and thrown delete error', async () => {
    const list = await request(app).get('/api/tasks?sort=name');
    const existingTaskId = list.body[0].id;

    const originalPrepare = db.prepare.bind(db);
    const zeroDeleteSpy = jest.spyOn(db, 'prepare').mockImplementation((sql) => {
      if (sql === 'SELECT * FROM tasks WHERE id = ?') {
        return { get: () => ({ id: existingTaskId, name: 'Existing' }) };
      }
      if (sql === 'DELETE FROM tasks WHERE id = ?') {
        return { run: () => ({ changes: 0 }) };
      }
      return originalPrepare(sql);
    });

    const zeroDeleteResponse = await request(app).delete(`/api/tasks/${existingTaskId}`);
    expect(zeroDeleteResponse.status).toBe(404);
    expect(zeroDeleteResponse.body.error).toBe('Task not found');
    zeroDeleteSpy.mockRestore();

    const thrownDeleteSpy = jest.spyOn(db, 'prepare').mockImplementation((sql) => {
      if (sql === 'DELETE FROM tasks WHERE id = ?') {
        throw new Error('forced delete failure');
      }
      return originalPrepare(sql);
    });

    const thrownResponse = await request(app).delete(`/api/tasks/${existingTaskId}`);
    expect(thrownResponse.status).toBe(500);
    expect(thrownResponse.body.error).toBe('Failed to delete task');
    thrownDeleteSpy.mockRestore();
  });

  test('Compatibility endpoints return 500 and zero-change branches', async () => {
    const list = await request(app).get('/api/items');
    const existingItemId = list.body[0].id;

    const originalPrepare = db.prepare.bind(db);

    const itemsGetSpy = jest.spyOn(db, 'prepare').mockImplementation((sql) => {
      if (sql.includes('ORDER BY created_at DESC')) {
        throw new Error('forced items get failure');
      }
      return originalPrepare(sql);
    });
    const getResponse = await request(app).get('/api/items');
    expect(getResponse.status).toBe(500);
    expect(getResponse.body.error).toBe('Failed to fetch items');
    itemsGetSpy.mockRestore();

    const itemsPostSpy = jest.spyOn(db, 'prepare').mockImplementation((sql) => {
      if (sql === 'SELECT * FROM tasks WHERE id = ?') {
        throw new Error('forced items post failure');
      }
      return originalPrepare(sql);
    });
    const postResponse = await request(app)
      .post('/api/items')
      .send({ name: 'Legacy trigger' });
    expect(postResponse.status).toBe(500);
    expect(postResponse.body.error).toBe('Failed to create item');
    itemsPostSpy.mockRestore();

    const itemsDeleteZeroSpy = jest.spyOn(db, 'prepare').mockImplementation((sql) => {
      if (sql === 'SELECT * FROM tasks WHERE id = ?') {
        return { get: () => ({ id: 1, name: 'Legacy Existing' }) };
      }
      if (sql === 'DELETE FROM tasks WHERE id = ?') {
        return { run: () => ({ changes: 0 }) };
      }
      return originalPrepare(sql);
    });
    const zeroDeleteResponse = await request(app).delete(`/api/items/${existingItemId}`);
    expect(zeroDeleteResponse.status).toBe(404);
    expect(zeroDeleteResponse.body.error).toBe('Item not found');
    itemsDeleteZeroSpy.mockRestore();

    const itemsDeleteCatchSpy = jest.spyOn(db, 'prepare').mockImplementation((sql) => {
      if (sql === 'DELETE FROM tasks WHERE id = ?') {
        throw new Error('forced items delete failure');
      }
      return originalPrepare(sql);
    });
    const deleteCatchResponse = await request(app).delete(`/api/items/${existingItemId}`);
    expect(deleteCatchResponse.status).toBe(500);
    expect(deleteCatchResponse.body.error).toBe('Failed to delete item');
    itemsDeleteCatchSpy.mockRestore();
  });
});