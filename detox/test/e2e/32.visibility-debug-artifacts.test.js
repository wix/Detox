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
      `View does not pass visibility percent threshold (100%)`,
    );
  });

  afterAll(async () => {
    await waitUntilArtifactsManagerIsIdle();

    assertArtifactExists('✓ _ios_ Visibility Debug Artifacts should not be able to tap an overlayed button/DETOX_VISIBILITY_RCTTextView__0x*__SCREEN.png');
    assertArtifactExists('✓ _ios_ Visibility Debug Artifacts should not be able to tap an overlayed button/DETOX_VISIBILITY_RCTTextView__0x*__TEST.png');
  });
});
