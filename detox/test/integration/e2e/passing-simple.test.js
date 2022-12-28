describe('Stub2', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Sanity')).tap();
  });

  it('should have welcome screen', async () => {
    await expect(element(by.text('Welcome'))).toBeVisible();
    await expect(element(by.text('Say Hello'))).toBeVisible();
    await expect(element(by.text('Say World'))).toBeVisible();
  });

  it('should show hello screen after tap', async () => {
    await element(by.text('Say Hello')).tap();
    await expect(element(by.text('Hello!!!'))).toBeVisible();
  });
});
