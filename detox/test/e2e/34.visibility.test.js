const { scrollViewDriver } = require('./drivers/fs-scroll-driver');


describe('visibility expectation', () => {
  let halfVisibleElement;

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Visibility Expectation')).tap();
    halfVisibleElement = await element(by.id('halfVisible'));
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

describe('visibility expectation in ScrollView', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('FS Scroll Actions')).tap();
  });

  it(`should be truthy when at least 50% visibility is required`, async () => {
    const item = scrollViewDriver.listItem(16);
    await waitFor(item).toBeVisible(50).whileElement(scrollViewDriver.byId()).scroll(10, 'down');

    // We are not sure how much percentage of the item is visible because of the scrolling speed. It shouldn't be visible after scrolling for 100%.
    await expect(item).not.toBeVisible(80);
  });

  it(`should be truthy when at least 100% visibility is required`, async () => {
    const item = scrollViewDriver.listItem(16);
    await waitFor(item).toBeVisible(100).whileElement(scrollViewDriver.byId()).scroll(10, 'down');
  });
});
