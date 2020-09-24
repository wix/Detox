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
});
