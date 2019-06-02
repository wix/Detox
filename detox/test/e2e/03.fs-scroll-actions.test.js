/**
 * A mini suite providing an alternative to tests failing due to issues found in RN 58+ on Android (see
 * https://github.com/facebook/react-native/issues/23870).
 * It basically runs similar use cases -- all of which involve visibility and scrolling, but in a
 * setup where they _can_ pass, so as to assert that the core Detox functionality (waitFor(), scroll())
 * is valid nevertheless.
 */

describe('Fullscreen scrolling Actions', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Scroll-Actions')).tap();
  });

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

    try {
      await scrollViewDriver.scrollBy(1000);
    } catch (error) {
      console.log('Expected error caught: Scrolled the list down to its very end');
    }
    await expect(scrollViewDriver.firstItem()).toBeNotVisible();
    await expect(scrollViewDriver.lastItem()).toBeVisible();
  });

  it('should find element by scrolling until it is visible', async () => {
    await expect(scrollViewDriver.lastItem()).toBeNotVisible();
    await waitFor(scrollViewDriver.lastItem()).toBeVisible().whileElement(scrollViewDriver.viewFilter()).scroll(200, 'down');
    await expect(scrollViewDriver.lastItem()).toBeVisible();
  });
});

const scrollViewDriver = {
  viewFilter: () => by.id('FSScrollActions.scrollView'),
  element: () => element(scrollViewDriver.viewFilter()),
  listItem: (index) => element(by.text(`Text${index}`)),
  firstItem: () => scrollViewDriver.listItem(1),
  secondItem: () => scrollViewDriver.listItem(2),
  lastItem: () => scrollViewDriver.listItem(20),
  scrollBy: (amount) => scrollViewDriver.element().scroll(Math.abs(amount), (amount > 0 ? 'down' : 'up')),
};
