describe('Stub1', () => {
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
    throw new Error(`I'm only here to make things interesting!`);
  });

  it.skip('Skipped test', async () => {
    // Checking that skipped tests are also traced
  });

  it.todo('Check that todo tests are also traced');
});
