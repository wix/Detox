const {scrollViewDriver} = require('./drivers/fs-scroll-driver');

describe(':android: Integrative actions', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  /**
   * This use case refers to this issue: https://github.com/wix/Detox/issues/1485
   */
  it('Should be able to tap a specific item after scroll-searching for it', async () => {
    await element(by.text('FS Scroll Actions')).tap();

    const expectedAlertText = `Alert(Item #${scrollViewDriver.secondPageItemIndex()})`;

    await waitFor(scrollViewDriver.secondPageItem()).toBeVisible().whileElement(scrollViewDriver.byId()).scroll(100, 'down');
    await scrollViewDriver.secondPageItem().tap();
    await expect(element(by.text(expectedAlertText))).toBeVisible();
  });

});
