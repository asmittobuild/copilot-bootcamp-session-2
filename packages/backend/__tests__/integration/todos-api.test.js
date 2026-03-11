const request = require('supertest');
const { app, db } = require('../../src/app');

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

describe('Tasks API integration', () => {
  test('creates a task with due date', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ name: 'Ship v1', dueDate: '2026-03-21' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Ship v1');
    expect(response.body.due_date).toBe('2026-03-21');
  });

  test('edits an existing task', async () => {
    const tasks = await request(app).get('/api/tasks?sort=name');
    const target = tasks.body.find((task) => task.name === 'Alpha');

    const response = await request(app)
      .put(`/api/tasks/${target.id}`)
      .send({ name: 'Alpha Updated', dueDate: '2026-03-22' });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Alpha Updated');
    expect(response.body.due_date).toBe('2026-03-22');
  });

  test('deletes an existing task', async () => {
    const tasks = await request(app).get('/api/tasks?sort=name');
    const target = tasks.body.find((task) => task.name === 'Beta');

    const response = await request(app).delete(`/api/tasks/${target.id}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Task deleted successfully', id: target.id });

    const verify = await request(app).get('/api/tasks?sort=name');
    expect(verify.body.find((task) => task.id === target.id)).toBeUndefined();
  });

  test('sorts tasks alphabetically by name', async () => {
    const response = await request(app).get('/api/tasks?sort=name');
    expect(response.status).toBe(200);

    const names = response.body.map((task) => task.name);
    expect(names).toEqual(['Alpha', 'Beta', 'Gamma', 'No Due Date']);
  });

  test('sorts by due date then alphabetical for same date', async () => {
    const response = await request(app).get('/api/tasks?sort=dueDate');
    expect(response.status).toBe(200);

    const names = response.body.map((task) => task.name);
    expect(names[0]).toBe('Gamma');
    expect(names[1]).toBe('Alpha');
    expect(names[2]).toBe('Beta');
    expect(names[3]).toBe('No Due Date');
  });
});
