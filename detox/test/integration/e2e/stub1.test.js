describe('Stub1', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Sanity')).tap();
  });

  it('should have welcome screen', async () => {
    await expect(element(by.text('Welcome'))).toBeVisible();
    await expect(element(by.text('Say Hello'))).toBeVisible();
    await expect(element(by.text('Say World'))).toBeVisible();
    throw new Error(`I'm only here to make things interesting!`);
  });
});
