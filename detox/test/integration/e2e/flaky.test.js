const { session } = require('detox/internals');
const log = detox.log.child({ cat: 'lifecycle' });

describe('Flaky', () => {
  beforeEach(async () => {
    await log.trace.complete('Navigate to sanity', navigateToSanity);
  });

  it('should have welcome screen', async () => {
    try {
      detox.trace.startSection('Asserting various texts');
      await detox.traceCall('by.text()', async () => {
        await expect(element(by.text('Welcome'))).toBeVisible();
        await expect(element(by.text('Say Hello'))).toBeVisible();
        await expect(element(by.text('Say World'))).toBeVisible();
      });
    } finally {
      detox.trace.endSection('Asserting various texts');
    }

    if (session.testSessionIndex === 0) {
      throw new Error(`I'm only here to make things interesting!`);
    }
  });

  async function navigateToSanity() {
    log.trace('Reloading app');
    await device.reloadReactNative();
    log.trace('Tap on Sanity');
    await element(by.text('Sanity')).tap();
    log.trace('I am on Sanity screen');
  }
});
