import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

let mockTasks = [
  { id: 1, name: 'Alpha Task', due_date: '2026-03-10', created_at: '2026-03-01', updated_at: '2026-03-01' },
  { id: 2, name: 'Beta Task', due_date: null, created_at: '2026-03-02', updated_at: '2026-03-02' },
];

const server = setupServer(
  rest.get('/api/tasks', (req, res, ctx) => {
    const sort = req.url.searchParams.get('sort');
    const ordered = [...mockTasks].sort((a, b) => {
      if (sort === 'name') {
        return a.name.localeCompare(b.name);
      }

      const aDue = a.due_date || '9999-12-31';
      const bDue = b.due_date || '9999-12-31';
      const dueSort = aDue.localeCompare(bDue);
      if (dueSort !== 0) {
        return dueSort;
      }

      return a.name.localeCompare(b.name);
    });

    return res(ctx.status(200), ctx.json(ordered));
  }),

  rest.post('/api/tasks', (req, res, ctx) => {
    const body = req.body;
    if (!body.name || body.name.trim() === '') {
      return res(ctx.status(400), ctx.json({ error: 'Task name is required' }));
    }

    const newTask = {
      id: mockTasks.length + 1,
      name: body.name,
      due_date: body.dueDate || null,
      created_at: '2026-03-03',
      updated_at: '2026-03-03',
    };
    mockTasks.push(newTask);
    return res(ctx.status(201), ctx.json(newTask));
  }),

  rest.put('/api/tasks/:id', (req, res, ctx) => {
    const body = req.body;
    const id = Number(req.params.id);
    const task = mockTasks.find((entry) => entry.id === id);
    if (!task) {
      return res(ctx.status(404), ctx.json({ error: 'Task not found' }));
    }

    task.name = body.name;
    task.due_date = body.dueDate || null;
    return res(ctx.status(200), ctx.json(task));
  }),

  rest.delete('/api/tasks/:id', (req, res, ctx) => {
    const id = Number(req.params.id);
    mockTasks = mockTasks.filter((entry) => entry.id !== id);
    return res(ctx.status(200), ctx.json({ message: 'Task deleted successfully', id }));
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  mockTasks = [
    { id: 1, name: 'Alpha Task', due_date: '2026-03-10', created_at: '2026-03-01', updated_at: '2026-03-01' },
    { id: 2, name: 'Beta Task', due_date: null, created_at: '2026-03-02', updated_at: '2026-03-02' },
  ];
});
afterAll(() => server.close());

describe('App Component', () => {
  test('renders task manager header and controls', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Task Manager' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Make Text 2x' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch to Light Palette' })).toBeInTheDocument();
  });

  test('loads and displays tasks', async () => {
    render(<App />);

    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();

    expect(await screen.findByText('Alpha Task')).toBeInTheDocument();
    expect(await screen.findByText('Beta Task')).toBeInTheDocument();
  });

  test('adds a new task', async () => {
    const user = userEvent.setup();

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });

    const input = screen.getByLabelText('Task Name');
    await user.type(input, 'New Task Item');

    const submitButton = screen.getByRole('button', { name: 'Add Task' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('New Task Item')).toBeInTheDocument();
    });
  });

  test('edits and deletes a task', async () => {
    const user = userEvent.setup();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Alpha Task')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('edit-task-1'));

    const editInput = screen.getByDisplayValue('Alpha Task');
    await user.clear(editInput);
    await user.type(editInput, 'Alpha Task Updated');
    await user.click(screen.getByLabelText('save-task'));

    await waitFor(() => {
      expect(screen.getByText('Alpha Task Updated')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('delete-task-2'));

    await waitFor(() => {
      expect(screen.queryByText('Beta Task')).not.toBeInTheDocument();
    });
  });
});