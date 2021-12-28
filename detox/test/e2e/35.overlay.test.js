const { expectToThrow } = require('./utils/custom-expects');

describe(':ios: Overlay', () => {
  let showAlertButton;
  let showOverlayButton;
  let verticalScrollView;

  beforeEach(async () => {
    await device.reloadReactNative();
    await device.launchApp({newInstance: true});

    await element(by.text('Overlay')).tap();

    showOverlayButton = await element(by.id('ShowOverlayButton'));
    await expect(showOverlayButton).toBeVisible();

    showAlertButton = await element(by.id('ShowDismissibleAlertButton'));
    await expect(showAlertButton).toBeVisible();

    verticalScrollView = await element(by.id('VerticalScrollView'));
  });

  describe('default behaviour', () => {
    it('should be able to scroll elements', async () => {
      await verticalScrollView.scrollTo('bottom');
      await expect(showOverlayButton).not.toBeVisible();
    });
  });

  describe('alert window', () => {
    let dismissAlertButton;

    beforeEach(async () => {
      await showAlertButton.tap();
      dismissAlertButton = await element(by.text('Dismiss'));
    });

    describe('when shown', () => {
      it('should not be able to tap on elements', async () => {
        await expectToThrow(() => showOverlayButton.tap());
      });

      it('should not be able to scroll elements', async () => {
        await expectToThrow(() => verticalScrollView.scrollTo('bottom'));
      });
    });

    describe('after dismiss', () => {
      beforeEach(async () => {
        await dismissAlertButton.tap();
      });

      it('should be able to tap on elements', async () => {
        await showOverlayButton.tap();
      });

      it('should be able to scroll elements', async () => {
        await verticalScrollView.scrollTo('bottom');
        await expect(showOverlayButton).not.toBeVisible();
      });
    });
  });

  describe('overlay window', () => {
    describe('when shown', () => {
      beforeEach(async () => {
        await showOverlayButton.tap();
      });

      it('should not be able to tap on elements', async () => {
        await expectToThrow(() => showOverlayButton.tap());
      });

      it('should not be able to scroll elements', async () => {
        await expectToThrow(() => verticalScrollView.scrollTo('bottom'));
      });
    });
  });
});
