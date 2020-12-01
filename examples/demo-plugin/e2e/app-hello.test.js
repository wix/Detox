describe('Example (hello)', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should have welcome', async () => {
    await expect(element(by.id('welcome'))).toBeVisible();
  });

  it('should not have unwelcome', async () => {
    let success = true;
    try {
      await expect(element(by.id('unwelcome'))).toBeVisible();
      success = false;
    } catch (e) {}

    if (!success) throw new Error("test failed");
  });
});
