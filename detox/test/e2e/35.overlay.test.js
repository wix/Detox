const { expectToThrow } = require('./utils/custom-expects');

describe(':ios: Overlay', () => {
  let showAlertButton;
  let showOverlayWindowButton;
  let showOverlayViewButton;
  let verticalScrollView;

  beforeEach(async () => {
    await device.reloadReactNative();
    await device.launchApp({newInstance: true});

    await element(by.text('Overlay')).tap();

    showOverlayWindowButton = await element(by.id('ShowOverlayWindowButton'));
    await expect(showOverlayWindowButton).toBeVisible();

    showOverlayViewButton = await element(by.id('ShowOverlayViewButton'));
    await expect(showOverlayViewButton).toBeVisible();

    showAlertButton = await element(by.id('ShowDismissibleAlertButton'));
    await expect(showAlertButton).toBeVisible();

    verticalScrollView = await element(by.id('VerticalScrollView'));
  });

  describe('default behaviour', () => {
    it('should be able to scroll elements', async () => {
      await verticalScrollView.scrollTo('bottom');
      await expect(showOverlayWindowButton).not.toBeVisible();
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
        await expectToThrow(() => showOverlayWindowButton.tap());
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
        await showOverlayWindowButton.tap();
      });

      it('should be able to scroll elements', async () => {
        await verticalScrollView.scrollTo('bottom');
        await expect(showOverlayWindowButton).not.toBeVisible();
      });
    });
  });

  describe('overlay window', () => {
    describe('when shown', () => {
      beforeEach(async () => {
        await showOverlayWindowButton.tap();
      });

      it('should not be able to tap on elements', async () => {
        await expectToThrow(() => showOverlayWindowButton.tap());
      });

      it('should not be able to scroll elements', async () => {
        await expectToThrow(() => verticalScrollView.scrollTo('bottom'));
      });
    });
  });

  describe('overlay view', () => {
    describe('when shown', () => {
      beforeEach(async () => {
        await showOverlayViewButton.tap();
      });

      it('should be hittable', async () => {
        const overlayView = await element(by.id('OverlayView'));
        await overlayView.tap();
      });

      it('should not be able to tap on elements', async () => {
        await expectToThrow(() => showOverlayViewButton.tap());
      });

      it('should not be able to scroll elements', async () => {
        await expectToThrow(() => showOverlayViewButton.scrollTo('bottom'));
      });
    });
  });
});
