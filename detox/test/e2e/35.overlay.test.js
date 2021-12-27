const { expectToThrow } = require('./utils/custom-expects');

describe(':ios: Overlay', () => {
  let showOverlayButton;
  let verticalScrollView;

  beforeEach(async () => {
    await device.reloadReactNative();
    await device.launchApp({newInstance: true});

    await element(by.text('Overlay')).tap();

    showOverlayButton = await element(by.id('ShowOverlayButton'));
    await expect(showOverlayButton).toBeVisible();

    verticalScrollView = await element(by.id('VerticalScrollView'));
  });

  describe('button', () => {
    it('should not be hittable when overlay is shown', async () => {
      await showOverlayButton.tap();
      await expectToThrow(() => showOverlayButton.tap());
    });
  });

  describe('scroll view', () => {
    it('should be scrollable when overlay is not shown', async () => {
      await verticalScrollView.scrollTo('bottom');
      await expect(showOverlayButton).not.toBeVisible();
    });

    it('should not be scrollable when overlay is shown', async () => {
      await showOverlayButton.tap();
      await expectToThrow(() => verticalScrollView.scrollTo('bottom'));
    });
  });
});
