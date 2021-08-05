describe('Multi-apps sandbox', () => {
  beforeEach(async () => {
    console.log('ASDASD beforeEach')

    await device.reloadReactNative();
    await detox.traceCall('Navigate to sanity', () => element(by.text('Sanity')).tap());
  });

  it('should', async () => {
    await expect(element(by.text('Welcome'))).toBeVisible();
  });
});
