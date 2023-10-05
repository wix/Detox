const { config, session } = require('detox/internals');
const { default: expect } = require('expect');

describe('Sandbox', () => {
  test('detox/internals should be accessible from the sandbox', () => {
    expect(session.testSessionIndex).toBe(0);
    expect(config.configurationName).toBe('stub');
  });
});
