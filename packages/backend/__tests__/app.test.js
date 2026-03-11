const {
  buildSortClause,
  validateTaskPayload,
  parseTaskId,
} = require('../src/app');

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

  test('parseTaskId validates and parses ids', () => {
    expect(parseTaskId('42')).toEqual({ valid: true, id: 42 });
    expect(parseTaskId('abc')).toEqual({ valid: false, error: 'Valid task ID is required' });
  });
});