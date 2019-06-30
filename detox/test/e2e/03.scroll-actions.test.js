const {scrollViewDriver} = require('./drivers/fs-scroll-driver');

describe('Fullscreen actions', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Scroll-Actions')).tap();
  });

  /**
   * This use case refers to this issue: https://github.com/wix/Detox/issues/1485
   */
  it(':android: Scrolling & tapping', async () => {
    const expectedAlertText = `Alert(Item #${scrollViewDriver.secondPageItemIndex()})`;

    await waitFor(scrollViewDriver.secondPageItem()).toBeVisible().whileElement(scrollViewDriver.byId()).scroll(100, 'down');
    await scrollViewDriver.secondPageItem().tap();
    await expect(element(by.text(expectedAlertText))).toBeVisible();
  });
});
