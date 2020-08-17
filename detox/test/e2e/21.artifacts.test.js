const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

describe('Artifacts', () => {
  describe('screenshots', () => {
    beforeAll(async () => {
      await device.sendToHome();
      await device.takeScreenshot('Artifacts/before all').then(printDimensions);
      await device.launchApp({newInstance: true});
    });

    beforeEach(async () => {
      // implicitly taking screenshot - beforeEach.png
      await device.reloadReactNative();
      await device.takeScreenshot('in main menu').then(printDimensions);

      await element(by.text('Actions')).tap();
      await device.takeScreenshot('Actions').then(printDimensions);
    });

    it('should take screenshots inside test', async () => {
      await element(by.id('UniqueId819')).tap();
      await device.takeScreenshot('taps - 1').then(printDimensions);

      await element(by.id('UniqueId819')).tap();
      await device.takeScreenshot('taps - 2').then(printDimensions);
    });

    afterEach(async () => {
      await element(by.text('Tap Me')).tap();
      await device.takeScreenshot('tap working').then(printDimensions);

      await device.reloadReactNative();
      // implicitly taking screenshot - afterEach.png
    });

    afterAll(async () => {
      await device.sendToHome();
      await device.takeScreenshot('Artifacts/after all').then(printDimensions);
      await device.launchApp();
    });

    function printDimensions(pathToScreenshot) {
      const buffer = fs.readFileSync(pathToScreenshot);
      const filename = path.basename(pathToScreenshot);
      const {width, height} = PNG.sync.read(buffer);

      console.log(`Took a screenshot: ${filename} (${width}x${height})`);
    }
  });

  describe(':ios: View Hierarchy', () => {
    beforeAll(async () => {
      await device.launchApp({newInstance: true});

      [
        await device.captureViewHierarchy(), // = 'capture'
        await device.captureViewHierarchy('before tests'),
      ].forEach(assertDirExists);
    });

    it('should capture view hierarchies in test and upon multiple invocation failures', async () => {
      try {
        await element(by.id('nonExistentId')).tap();
        fail('should have failed');
      } catch (e) {
        [
          await device.captureViewHierarchy(), // = 'capture'
          await device.captureViewHierarchy('named capture'),
        ].forEach(assertDirExists);
      }

      try {
        await element(by.id('nonExistentId2')).tap();
        fail('should have failed too');
      } catch (e) {
        [
          await device.captureViewHierarchy(), // = 'capture'
          await device.captureViewHierarchy('named capture'),
        ].forEach(assertDirExists);
      }

      // Artifacts folder should contain the following *.viewhierarchy folders: ui, capture, named capture, ui2, capture2, named capture2
    });
  });

  function assertDirExists(dirPath) {
    if (!fs.statSync(dirPath).isDirectory()) {
      throw new Error('Expected to find a directory at path: ' + dirPath);
    }
  }
});
