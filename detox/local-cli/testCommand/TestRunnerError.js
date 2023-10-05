const { DetoxError } = require('../../src/errors');

class TestRunnerError extends DetoxError {
  constructor({ command, code, signal }) {
    super(`Command failed with exit code = ${code}:\n${command}`);

    this.code = code;
    this.signal = signal;
    this.name = 'TestRunnerError';
  }
}

module.exports = TestRunnerError;
