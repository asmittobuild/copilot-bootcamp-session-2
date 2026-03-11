const { test } = require('@playwright/test');
const { TaskPage } = require('./page-objects/task-page');

test.describe('Task workflow', () => {
  test('creates a task and toggles light palette', async ({ page }) => {
    const taskPage = new TaskPage(page);

    await taskPage.open();
    await taskPage.createTask('E2E Created Task', '2026-03-29');
    await taskPage.expectTaskVisible('E2E Created Task');
    await taskPage.toggleLightPalette();
  });
});
