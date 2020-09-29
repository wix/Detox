describe('Visibility Cases', () => {
  beforeEach(async() => {
    await device.reloadReactNative();
    await element(by.text('Visibility Cases')).tap();
  });

  it('should be able to scroll tab bar strip with a gradient overlay', async () => {
    await expect(element(by.text('Tab 7'))).not.toBeVisible();

    await waitFor(element(by.text('Tab 7')))
      .toBeVisible()
      .whileElement(by.id('tabBarWithGradient'))
      .scroll(200, 'right');
  });

  it(':ios: should be able to tap on the main ScrollView in a blind way, on the center, when the on-screen keyboard is enabled', async () => {
    await element(by.id('inputExample')).tap();

    const { elementSafeBounds: bounds } = await element(by.id('screenScroll')).getAttributes();

    await element(by.id('screenScroll')).tap({
      x: Math.floor(0.5 * bounds.width),
      y: Math.floor(0.5 * bounds.height),
    });
  });

  it(':ios: should be able to dismiss the keyboard by scrolling down in the ScrollView', async () => {
    await expect(element(by.id('screenScroll'))).toBeVisible();

    await element(by.id('inputExample')).tap();
    await expect(element(by.id('screenScroll'))).not.toBeVisible();

    await element(by.id('screenScroll')).scroll(50, 'down');
    await expect(element(by.id('screenScroll'))).toBeVisible();
  });

  it(':android: should be able to tap on the main ScrollView regardless of the on-screen keyboard', async () => {
    await element(by.id('inputExample')).tap();
    await element(by.id('screenScroll')).tap();
  });

  it('should be able to tap on the badged button', async () => {
    await expect(element(by.id('badgeButtonExample.badge'))).toBeVisible();
    await element(by.id('badgeButtonExample')).tap();
    await expect(element(by.id('badgeButtonExample.badge'))).not.toBeVisible();
  });
});
