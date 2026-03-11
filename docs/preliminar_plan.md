# Preliminary Implementation Plan: TODO App Expansion

Based on the project guidance and linked docs, this plan expands the current app from basic items to a full Task Manager.

## Guidance Sources

- Functional scope from `docs/functional-requirements.md`
- UI direction from `docs/ui-guidelines.md`
- Test strategy from `docs/testing-guidelines.md`
- Code quality standards from `docs/coding-guidelines.md`

## Current Baseline

- Backend supports list/create/delete for items.
- Frontend supports list/create/delete UI for items.
- Unit and integration tests exist and need extension for task-specific behavior.

## Phase 1: Data Model and API Design

1. Rename the domain from item to task in API payloads and UI labels.
2. Update DB schema to include: `id`, `name`, `due_date` (nullable), `created_at`, `updated_at`.
3. Define API contract:
   - `GET /api/tasks?sort=name|dueDate`
   - `POST /api/tasks`
   - `PUT /api/tasks/:id`
   - `DELETE /api/tasks/:id`
4. Implement due-date sort tie-break behavior:
   - Primary: `due_date` ascending
   - Secondary (same due date): `name` ascending
   - Define behavior for null due dates (recommended: nulls last)

## Phase 2: Backend Implementation

1. Add route handlers for task CRUD.
2. Add validation:
   - `name` required, trimmed, non-empty
   - `due_date` optional but valid date format if present
   - `id` must be numeric
3. Keep environment-based port config with default `3030`.
4. Add quick function summaries above route handlers and helpers.

## Phase 3: Frontend UI Upgrade (Material + Theme Controls)

1. Add Material UI dependencies.
2. Refactor UI to Material components (for example: TextField, Button, Select, List).
3. Build task form with task name and due date input.
4. Add edit flow (inline or modal).
5. Add sorting controls:
   - Alphabetical
   - Due date
6. Add required UI configuration buttons:
   - One button to toggle 2x text size
   - One button to switch to a lighter palette
7. Apply dark-green palette and slightly rounded button styling.

## Phase 4: Frontend State and API Layer

1. Add shared API helper module for DRY request handling.
2. Centralize fetch/create/update/delete logic and error handling.
3. Ensure UI updates remain consistent with active sort mode.

## Phase 5: Testing Implementation

1. Backend unit/integration tests:
   - Cover create, edit, delete, sort by name, sort by due date, tie-break, validation errors
2. Frontend unit tests:
   - Cover form validation, edit behavior, sorting controls, theme toggle, text-size toggle
3. E2E tests with Playwright:
   - Use one browser only
   - Use Page Object Model (POM)
   - Add 5-8 critical user journeys (happy paths + key edge cases)

## Phase 6: Linting and Quality Gates

1. Standardize ESLint usage at workspace/package level.
2. Add lint scripts for frontend and backend.
3. Enforce checks in CI sequence:
   - lint
   - unit
   - integration
   - e2e

## Phase 7: Migration and Compatibility

1. Use temporary compatibility strategy for `/api/items` to `/api/tasks` migration or deploy frontend/backend atomically.
2. Replace sample seeded items with realistic task seeds including due dates (or remove seeds when stable).

## Phase 8: Documentation and Definition of Done

1. Update README with API endpoints, run/test commands, sorting rules, and UI configuration controls.
2. Definition of done:
   - Functional requirements implemented
   - UI guidelines implemented
   - Test layers passing
   - Lint passing
   - Function summaries added
   - Core logic kept DRY

## Suggested Delivery Order

1. Backend schema + endpoints + backend tests
2. Frontend migration to task model
3. Frontend edit + due date + sorting
4. Theme and text-size controls + visual polish
5. E2E suite + lint/CI finalization
