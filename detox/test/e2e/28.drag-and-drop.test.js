describe('Drag And Drop', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Drag And Drop')).tap();
  });

  it('should have drag and drop screen', async () => {
    await expect(element(by.text('Drag And Drop Screen'))).toBeVisible();
  });
});
