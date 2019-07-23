const {scrollViewDriver} = require('./drivers/fs-scroll-driver');
const {scrollingTextInputsDriver, scrollingTextsDriver} = require('./drivers/integ-actions-drivers');

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

  it('should scroll various distances accurately, and tap scroll targets', async () => {
    const iterations = 10;
    const textHeight = 40;
    const baseMargin = 20;

    await element(by.text('Integrative Actions')).tap();
    for (let i = 1; i <= iterations; i++) {
      await scrollingTextsDriver.tapOnText(i);
      await scrollingTextsDriver.assertTextTappedOnce(i);
      await scrollingTextsDriver.scrollDown(textHeight + (baseMargin * i));
    }
  });

  /**
   * This use case refers to this issue: https://github.com/wix/Detox/issues/1495
   */
  it('should scroll various distances accurately, and type text into text fields', async () => {
    const iterations = 10;
    const inputHeight = 40;
    const baseMargin = 20;

    await element(by.text('Integrative Actions')).tap();

    for (let i = 1; i <= iterations; i++) {
      await scrollingTextInputsDriver.typeInField(i);
      await scrollingTextInputsDriver.assertFieldText(i);
      await scrollingTextInputsDriver.scrollDown(inputHeight + (baseMargin * i));
    }
  });
});
