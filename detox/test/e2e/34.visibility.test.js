const { scrollViewDriver } = require('./drivers/fs-scroll-driver');
const jestExpect = require('expect').default;


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

describe(':ios: visibility expectation memory', () => {
  async function memoryMB() {
    await element(by.id('measureMemory')).tap();
    const attributes = await element(by.id('memoryMB')).getAttributes();
    return Number(attributes.text);
  }

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Visibility Expectation')).tap();
  });

  // Each visibility check renders the window and crops it to the element. The cropped CGImage must be
  // released, or every check leaks it (~0.6 MB per check here; a long suite that polls with waitFor
  // makes thousands of checks and grows the app by gigabytes). Measured on iPhone 17 Pro / iOS 26.1:
  // 100 checks grow the app by ~60 MB without the release, by ~5 MB with it.
  it(`should not grow the app's memory with repeated visibility checks`, async () => {
    const before = await memoryMB();
    for (let i = 0; i < 100; i++) {
      await expect(element(by.id('moveHalfVisible'))).toBeVisible();
    }
    const after = await memoryMB();
    jestExpect(after - before).toBeLessThan(30);
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

  it(`:ios: should not detect scroll view cell until default visibility threshold (75%) is met`, async () => {
    const item = scrollViewDriver.listItem(16);
    await waitFor(item).toBeVisible().whileElement(scrollViewDriver.byId()).scroll(10, 'down');
    await expect(item).toBeVisible(75);
  });
});
