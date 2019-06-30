const {scrollViewDriver} = require('./drivers/fs-scroll-driver');
const {expectToThrow} = require('./utils/custom-expects');

/**
 * A mini suite providing an alternative to tests failing due to issues found in RN 58+ on Android (see
 * https://github.com/facebook/react-native/issues/23870).
 * It basically runs similar use cases -- all of which involve visibility and scrolling, but in a
 * setup where they <i>can</i> pass, so as to assert that the core Detox functionality (waitFor(), scroll())
 * is valid nevertheless.
 */
describe('Visibility-bug workaround', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Scroll-Actions')).tap();
  });

  describe('actions', () => {
    it('should scroll for a small amount in direction', async () => {
      await expect(scrollViewDriver.element()).toBeVisible();
      await expect(scrollViewDriver.firstItem()).toBeVisible();
      await expect(scrollViewDriver.lastItem()).toBeNotVisible();

      await scrollViewDriver.scrollBy(60);
      await expect(scrollViewDriver.firstItem()).toBeNotVisible();
      await expect(scrollViewDriver.secondItem()).toBeVisible();

      await scrollViewDriver.scrollBy(-60);
      await expect(scrollViewDriver.firstItem()).toBeVisible();
      await expect(scrollViewDriver.lastItem()).toBeNotVisible();
    });

    it('should scroll for a large amount in direction', async () => {
      await expect(scrollViewDriver.element()).toBeVisible();
      await expect(scrollViewDriver.firstItem()).toBeVisible();
      await expect(scrollViewDriver.lastItem()).toBeNotVisible();

      await expectToThrow(() => scrollViewDriver.scrollBy(1000));

      await expect(scrollViewDriver.firstItem()).toBeNotVisible();
      await expect(scrollViewDriver.lastItem()).toBeVisible();
    });
  });

  describe('waitFor()', () => {
    it('should find element by scrolling until it is visible', async () => {
      await expect(scrollViewDriver.lastItem()).toBeNotVisible();
      await waitFor(scrollViewDriver.lastItem()).toBeVisible().whileElement(scrollViewDriver.byId()).scroll(200, 'down');
      await expect(scrollViewDriver.lastItem()).toBeVisible();
    });

    it('should abort scrolling if element was not found', async () => {
      await expect(scrollViewDriver.fakeItem()).toBeNotVisible();
      await expectToThrow(() => waitFor(scrollViewDriver.fakeItem()).toBeVisible().whileElement(scrollViewDriver.byId()).scroll(1000, 'down'));
      await expect(scrollViewDriver.fakeItem()).toBeNotVisible();
      await expect(scrollViewDriver.lastItem()).toBeVisible();
    });
  });
});
