const { expect } = require('@playwright/test');

class TaskPage {
  constructor(page) {
    this.page = page;
    this.taskNameInput = page.getByLabel('Task Name').first();
    this.taskDueDateInput = page.getByLabel('Due Date').first();
    this.addTaskButton = page.getByRole('button', { name: 'Add Task' });
    this.lightPaletteButton = page.getByRole('button', { name: 'Switch to Light Palette' });
  }

  async open() {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { name: 'Task Manager' })).toBeVisible();
  }

  async createTask(name, dueDate) {
    await this.taskNameInput.fill(name);
    if (dueDate) {
      await this.taskDueDateInput.fill(dueDate);
    }
    await this.addTaskButton.click();
  }

  async expectTaskVisible(name) {
    await expect(this.page.getByText(name)).toBeVisible();
  }

  async toggleLightPalette() {
    await this.lightPaletteButton.click();
    await expect(this.page.getByRole('button', { name: 'Switch to Dark Palette' })).toBeVisible();
  }
}

module.exports = { TaskPage };
