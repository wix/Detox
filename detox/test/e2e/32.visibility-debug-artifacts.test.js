const { expectToThrow } = require('./utils/custom-expects');
const {
  assertArtifactExists,
  waitUntilArtifactsManagerIsIdle,
} = require('./utils/artifactUtils');

describe(':ios: Visibility Debug Artifacts', () => {
  beforeEach(async() => {
    await device.reloadReactNative();
    await element(by.text('Visibility Debug Artifacts')).tap();
  });

  it('should not be able to tap an overlayed button', async () => {
    await expectToThrow(
      () => element(by.text('Button 1')).tap(),
      `View does not pass visibility percent threshold`,
    );
  });

  afterAll(async () => {
    await waitUntilArtifactsManagerIsIdle();

    assertArtifactExists('✓ _ios_ Visibility Debug Artifacts should not be able to tap an overlayed button/visibilityFailingRects');
    assertArtifactExists('✓ _ios_ Visibility Debug Artifacts should not be able to tap an overlayed button/visibilityFailingScreenshots');
  });
});
