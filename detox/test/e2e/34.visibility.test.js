describe('visibility expectation', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Visibility Expectation')).tap();
  });

  let halfVisibleElement;

  beforeEach(() => {
    halfVisibleElement = element(by.id('halfVisible'));
  });

  it(`should be truthy when at least 50% visibility is required`, async () => {
    await expect(halfVisibleElement).toBeVisible(50);
  });

  it(`should be falsy when at least 51% visibility is required`, async () => {
    await expect(halfVisibleElement).not.toBeVisible(51);
  });

  describe(`after element location has changed`, () => {
    beforeEach(async () => {
      await element(by.id('moveHalfVisible')).tap();
    });

    it(`should be truthy when at least 25% visibility is required`, async () => {
      await waitFor(halfVisibleElement).toBeVisible(25).withTimeout(2000);
    });

    it(`should be falsy when at least 26% visibility is required`, async () => {
      await waitFor(halfVisibleElement).not.toBeVisible(26).withTimeout(2000);
    });
  });
});
