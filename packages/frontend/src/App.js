import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  CssBaseline,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskName, setTaskName] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [largeText, setLargeText] = useState(false);
  const [lightPalette, setLightPalette] = useState(false);

  const theme = useMemo(() => createTheme({
    typography: {
      fontFamily: 'Poppins, Trebuchet MS, Verdana, sans-serif',
      fontSize: largeText ? 28 : 14,
      button: {
        textTransform: 'none',
        fontWeight: 700,
      },
    },
    shape: {
      borderRadius: 10,
    },
    palette: lightPalette
      ? {
          mode: 'light',
          primary: { main: '#4f7f5f' },
          secondary: { main: '#79a874' },
          background: {
            default: '#f4fbf4',
            paper: '#ffffff',
          },
        }
      : {
          mode: 'dark',
          primary: { main: '#1f6b3d' },
          secondary: { main: '#66a182' },
          background: {
            default: '#0d2017',
            paper: '#153325',
          },
        },
  }), [largeText, lightPalette]);

  // Fetch tasks based on the selected sort mode.
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks?sort=${sortBy}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setTasks(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data: ' + err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create task with optional due date.
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskName.trim()) {
      setError('Task name is required');
      return;
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: taskName,
          dueDate: taskDueDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const result = await response.json();
      setTasks((prev) => [...prev, result]);
      setTaskName('');
      setTaskDueDate('');
      setError(null);
      await fetchData();
    } catch (err) {
      setError('Error creating task: ' + err.message);
      console.error('Error creating task:', err);
    }
  };

  const startEditTask = (task) => {
    setEditingTaskId(task.id);
    setEditName(task.name);
    setEditDueDate(task.due_date || '');
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditName('');
    setEditDueDate('');
  };

  // Update an existing task.
  const saveEditTask = async (taskId) => {
    if (!editName.trim()) {
      setError('Task name is required');
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editName, dueDate: editDueDate || null }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      setError(null);
      cancelEditTask();
      await fetchData();
    } catch (err) {
      setError('Error updating task: ' + err.message);
      console.error('Error updating task:', err);
    }
  };

  // Delete a task.
  const handleDelete = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      setError(null);
    } catch (err) {
      setError('Error deleting task: ' + err.message);
      console.error('Error deleting task:', err);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="app-shell">
        <Container maxWidth="md" className="app-container">
          <Paper elevation={4} className="app-panel">
            <Stack spacing={2}>
              <Typography variant="h3" component="h1" fontWeight={800}>
                Task Manager
              </Typography>
              <Typography variant="body1">
                Plan, prioritize, and ship with a deadline-aware workflow.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button variant="contained" color="secondary" onClick={() => setLargeText((value) => !value)}>
                  {largeText ? 'Use Normal Text' : 'Make Text 2x'}
                </Button>
                <Button variant="contained" color="primary" onClick={() => setLightPalette((value) => !value)}>
                  {lightPalette ? 'Switch to Dark Palette' : 'Switch to Light Palette'}
                </Button>
              </Stack>

              <Paper elevation={0} className="task-form-panel">
                <Stack component="form" spacing={2} onSubmit={handleCreateTask}>
                  <Typography variant="h5" component="h2">Create Task</Typography>
                  <TextField
                    label="Task Name"
                    value={taskName}
                    onChange={(event) => setTaskName(event.target.value)}
                    placeholder="Enter task name"
                    fullWidth
                  />
                  <TextField
                    label="Due Date"
                    type="date"
                    value={taskDueDate}
                    onChange={(event) => setTaskDueDate(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <Button type="submit" variant="contained" color="primary">Add Task</Button>
                </Stack>
              </Paper>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <Typography variant="h5" component="h2">Tasks</Typography>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel id="sort-select-label">Sort By</InputLabel>
                  <Select
                    labelId="sort-select-label"
                    value={sortBy}
                    label="Sort By"
                    onChange={(event) => setSortBy(event.target.value)}
                  >
                    <MenuItem value="name">Alphabetical</MenuItem>
                    <MenuItem value="dueDate">Due Date</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {loading && <Typography>Loading tasks...</Typography>}
              {error && <Alert severity="error">{error}</Alert>}

              {!loading && !error && (
                <List>
                  {tasks.length > 0 ? (
                    tasks.map((task) => (
                      <ListItem key={task.id} className="task-row">
                        {editingTaskId === task.id ? (
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} width="100%" alignItems={{ md: 'center' }}>
                            <TextField
                              label="Task Name"
                              value={editName}
                              onChange={(event) => setEditName(event.target.value)}
                              fullWidth
                            />
                            <TextField
                              label="Due Date"
                              type="date"
                              value={editDueDate}
                              onChange={(event) => setEditDueDate(event.target.value)}
                              InputLabelProps={{ shrink: true }}
                            />
                            <IconButton aria-label="save-task" color="success" onClick={() => saveEditTask(task.id)}>
                              <SaveIcon />
                            </IconButton>
                            <IconButton aria-label="cancel-edit" color="inherit" onClick={cancelEditTask}>
                              <CancelIcon />
                            </IconButton>
                          </Stack>
                        ) : (
                          <Stack direction={{ xs: 'column', md: 'row' }} width="100%" justifyContent="space-between" alignItems={{ md: 'center' }} spacing={1}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={700}>{task.name}</Typography>
                              <Typography variant="body2">
                                Due: {task.due_date ? task.due_date : 'No due date'}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1}>
                              <IconButton aria-label={`edit-task-${task.id}`} color="secondary" onClick={() => startEditTask(task)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton aria-label={`delete-task-${task.id}`} color="error" onClick={() => handleDelete(task.id)}>
                                <DeleteIcon />
                              </IconButton>
                            </Stack>
                          </Stack>
                        )}
                      </ListItem>
                    ))
                  ) : (
                    <Typography>No tasks found. Create your first one.</Typography>
                  )}
                </List>
              )}
            </Stack>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;