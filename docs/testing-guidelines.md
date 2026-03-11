# Testing Guidelines

These guidelines define the testing principles and standards for the Task Manager application.

## Unit Testing

- Use Jest to test individual functions and React components in isolation.
- Unit tests should use the naming convention `*.test.js` or `*.test.ts`.
- Backend unit tests should be placed in `packages/backend/__tests__/`.
- Frontend unit tests should be placed in `packages/frontend/src/__tests__/`.
- Name unit test files to match what they are testing (for example, `app.test.js` for testing `app.js`).

## Integration Testing

- Use Jest + Supertest to test backend API endpoints with real HTTP requests.
- Integration tests should be placed in `packages/backend/__tests__/integration/`.
- Integration tests should also use the naming convention `*.test.js` or `*.test.ts`.
- Name integration test files based on what they test (for example, `todos-api.test.js` for TODO API endpoints).

## End-to-End (E2E) Testing

- Use Playwright (required framework) to test complete UI workflows through browser automation.
- E2E tests should be placed in `tests/e2e/`.
- E2E tests should use the naming convention `*.spec.js` or `*.spec.ts`.
- Name E2E test files based on the user journey they test (for example, `todo-workflow.spec.js`).
- Playwright tests must use one browser only.
- Playwright tests must use the Page Object Model (POM) pattern for maintainability.
- Limit E2E tests to 5-8 critical user journeys, focusing on happy paths and key edge cases rather than exhaustive coverage.

## Port Configuration

- Always use environment variables with sensible defaults for port configuration.
- Backend example:

```js
const PORT = process.env.PORT || 3030;
```

- Frontend: React's default port is `3000`, but it can be overridden with the `PORT` environment variable.
- This approach allows CI/CD workflows to dynamically detect ports.

## Test Isolation, Reliability, and Maintenance

- All tests must be isolated and independent. Each test should set up its own data and should not rely on other tests.
- Setup and teardown hooks are required. Tests must succeed consistently across multiple runs.
- All new features should include appropriate tests.
- Tests should be maintainable and follow best practices.
