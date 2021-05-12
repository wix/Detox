const { expectToThrow } = require('./utils/custom-expects');
const {
  assertArtifactExists,
  waitUntilArtifactsManagerIsIdle,
} = require('./utils/artifactUtils');

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

  it('should dismiss the on-screen keyboard upon a tap on the main ScrollView', async () => {
    await element(by.id('inputExample')).tap();
    await element(by.id('screenScroll')).tap();
  });

  it('should be able to tap on the badged button', async () => {
    await expect(element(by.id('badgeButtonExample.badge'))).toBeVisible();
    await element(by.id('badgeButtonExample')).tap();
    await expect(element(by.id('badgeButtonExample.badge'))).not.toBeVisible();
  });

  it('should not be able to tap an overlayed button', async () => {
    await expectToThrow(
      () => element(by.text('Button 1')).tap(),
      `view does not pass visibility threshold`,
    );
  });

  afterAll(async () => {
    await waitUntilArtifactsManagerIsIdle();

    assertArtifactExists('✓ Visibility Cases should not be able to tap an overlayed button/visibilityFailingRects');
    assertArtifactExists('✓ Visibility Cases should not be able to tap an overlayed button/visibilityFailingScreenshots');
  });
});
