const { session } = require('detox/internals');

describe('Flaky', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await detox.traceCall('Navigate to sanity', element(by.text('Sanity')).tap());
  });

  it('should have welcome screen', async () => {
    try {
      detox.trace.startSection('Asserting various texts');
      await expect(element(by.text('Welcome'))).toBeVisible();
      await expect(element(by.text('Say Hello'))).toBeVisible();
      await expect(element(by.text('Say World'))).toBeVisible();
    } finally {
      detox.trace.endSection('Asserting various texts');
    }

    if (session.testSessionIndex === 0) {
      throw new Error(`I'm only here to make things interesting!`);
    }
  });

});
