const { DetoxError } = require('../../src/errors');

const TestRunnerError = require('./TestRunnerError');

describe('TestRunnerError', () => {
  let error;

  beforeAll(() => {
    error = new TestRunnerError({ command: 'foo', code: 1, signal: null });
  });

  it('should format an error message', () => {
    expect(`${error}`).toMatch(/Command failed with exit code = 1:\nfoo/);
  });

  it('should assign properties (code, signal)', () => {
    expect(error.code).toBe(1);
    expect(error.signal).toBe(null);
  });

  it('should be formatted to an empty string', () => {
    // So that the try-catch block in cli.js will not print it for the second time
    expect(DetoxError.format(error)).toBe('');
  });
});
