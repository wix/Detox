describe('Artifacts', () => {
  beforeAll(async () => {
    await device.takeScreenshot('artifacts-beforeAll');
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Sanity')).tap();
    await device.takeScreenshot('sanity screen');
  });

  it('should take screenshots inside test', async () => {
    await device.takeScreenshot('before tap');
    await element(by.text('Say Hello')).tap();
    await device.takeScreenshot('after tap');
  });
});
