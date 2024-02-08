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
      `Test Failed: XCUITest executor failed to handle request: Failed to hit element with identifier`,
    );
  });

  afterAll(async () => {
    await waitUntilArtifactsManagerIsIdle();

    assertArtifactExists('✓ _ios_ Visibility Debug Artifacts should not be able to tap an overlayed button/ImageScreenshot_debug_visibility_screen_*.png');
    assertArtifactExists('✓ _ios_ Visibility Debug Artifacts should not be able to tap an overlayed button/ImageScreenshot_debug_visibility_element_rect_*.png');
  });
});
