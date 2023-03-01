const TestRunnerError = require('./TestRunnerError');

describe('TestRunnerError', () => {
  let error;

  beforeAll(() => {
    error = new TestRunnerError({ command: 'foo', code: 1, signal: 'SIGINT' });
  });

  it('should format an error message', () => {
    expect(`${error}`).toMatch(/Command failed with exit code = 1:\nfoo/);
    expect(`${error.format()}`).toMatch(/Command failed with exit code = 1:\nfoo/);
  });

  it('should assign properties (code, signal)', () => {
    expect(error.code).toBe(1);
    expect(error.signal).toBe('SIGINT');
  });
});
