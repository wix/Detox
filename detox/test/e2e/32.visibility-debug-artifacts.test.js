const { expectToThrow } = require('./utils/custom-expects');
const { isRNNewArch } = require('../../src/utils/rn-consts/rn-consts');

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
      `View is not hittable at its visible point. Error: View is not visible around point.`,
    );
  });

  afterAll(async () => {
    await waitUntilArtifactsManagerIsIdle();

    const className = isRNNewArch ? "RCTParagraphComponentView" : "RCTTextView";
    assertArtifactExists(`✓ _ios_ Visibility Debug Artifacts should not be able to tap an overlayed button/DETOX_VISIBILITY_${className}__0x*__SCREEN.png`);
    assertArtifactExists(`✓ _ios_ Visibility Debug Artifacts should not be able to tap an overlayed button/DETOX_VISIBILITY_${className}__0x*__TEST.png`);
  });
});
