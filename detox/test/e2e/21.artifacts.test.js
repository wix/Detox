const fs = require('fs');
const path = require('path');

const { PNG } = require('pngjs');

const {
  assertArtifactExists,
  assertDirExists,
  waitUntilArtifactsManagerIsIdle,
} = require('./utils/artifactUtils');

describe('Artifacts', () => {
  describe('screenshots', () => {
    beforeAll(async () => {
      await device.sendToHome();
      await device.takeScreenshot('Artifacts/before all').then(printPNGDimensions);
      await device.launchApp({ newInstance: true });
    });

    beforeEach(async () => {
      // implicitly taking screenshot - beforeEach.png
      await device.reloadReactNative();
      await device.takeScreenshot('in main menu').then(printPNGDimensions);

      await element(by.text('Actions')).tap();
      await device.takeScreenshot('Actions').then(printPNGDimensions);
    });

    it('should take screenshots inside test', async () => {
      await element(by.id('UniqueId819')).tap();
      await device.takeScreenshot('taps - 1').then(printPNGDimensions);

      await element(by.id('UniqueId819')).tap();
      await device.takeScreenshot('taps - 2').then(printPNGDimensions);
    });

    afterEach(async () => {
      await element(by.text('Tap Me')).tap();
      await device.takeScreenshot('tap working').then(printPNGDimensions);

      await device.reloadReactNative();
      // implicitly taking screenshot - afterEach.png
    });

    afterAll(async () => {
      await device.sendToHome();
      await device.takeScreenshot('Artifacts/after all').then(printPNGDimensions);
      await device.launchApp();
    });

    afterAll(async () => {
      await waitUntilArtifactsManagerIsIdle();

      assertArtifactExists('Artifacts_before all.png');
      assertArtifactExists('✓ Artifacts screenshots should take screenshots inside test/taps - 1.png');
      assertArtifactExists('✓ Artifacts screenshots should take screenshots inside test/taps - 2.png');
    });

    function printPNGDimensions(pathToScreenshot) {
      const buffer = fs.readFileSync(pathToScreenshot);
      const filename = path.basename(pathToScreenshot);
      const { width, height } = PNG.sync.read(buffer);

      console.log(`Took a screenshot: ${filename} (${width}x${height})`);
    }
  });

  describe(':ios: View Hierarchy', () => {
    beforeAll(async () => {
      await device.launchApp({ newInstance: true });
      await device.captureViewHierarchy('before tests').then(assertDirExists);
    });

    it('should capture anonymous view hierarchies upon manual request', async () => {
      await device.captureViewHierarchy().then(assertDirExists);
      await device.captureViewHierarchy().then(assertDirExists);
    });

    it('should capture named view hierarchies upon manual request', async () => {
      await device.captureViewHierarchy('named capture').then(assertDirExists);
      await device.captureViewHierarchy('named capture').then(assertDirExists);
    });

    it('should capture hierarchy upon multiple invocation failures', async () => {
      for (let i = 0; i < 2; i++) {
        try {
          await element(by.id('nonExistentId')).tap();
          fail('should have failed');
        } catch (e) {
        }
      }
    });

    afterAll(async () => {
      await waitUntilArtifactsManagerIsIdle();
      assertArtifactExists('before tests.viewhierarchy');
      assertArtifactExists('✓ Artifacts _ios_ View Hierarchy should capture anonymous view hierarchies upon manual request/capture.viewhierarchy');
      assertArtifactExists('✓ Artifacts _ios_ View Hierarchy should capture anonymous view hierarchies upon manual request/capture.viewhierarchy');
      assertArtifactExists('✓ Artifacts _ios_ View Hierarchy should capture named view hierarchies upon manual request/named capture.viewhierarchy');
      assertArtifactExists('✓ Artifacts _ios_ View Hierarchy should capture named view hierarchies upon manual request/named capture2.viewhierarchy');
      assertArtifactExists('✓ Artifacts _ios_ View Hierarchy should capture hierarchy upon multiple invocation failures/ui.viewhierarchy');
      assertArtifactExists('✓ Artifacts _ios_ View Hierarchy should capture hierarchy upon multiple invocation failures/ui2.viewhierarchy');
    });

    describe('edge uninstall case', () => {
      it('should capture hierarchy regardless', async () => {
          try {
            await element(by.id('nonExistentId')).tap();
            fail('should have failed');
          } catch (e) {
            await device.uninstallApp();
          }
      });

      afterAll(async () => {
        await waitUntilArtifactsManagerIsIdle();
        assertArtifactExists('✓ Artifacts _ios_ View Hierarchy edge uninstall case should capture hierarchy regardless/ui3.viewhierarchy');
      });

      afterAll(async () => {
        await device.installApp();
      });
    });
  });
});
