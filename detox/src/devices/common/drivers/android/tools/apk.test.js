const path = require('path'); // Using path methods will normalize slashes to backslashes on win32, so tests must match.
const rootPath = process.platform === 'win32' ? 'C:\\Users\\SomeUser' : '~/somePath';

describe('APK utils', () => {

  let apkUtils;
  beforeEach(() => {
    apkUtils = require('./apk');
  });

  describe('Test-APK heuristic path resolution', () => {
    it('should properly resolve a simple path', async () => {
      const inputApkPath = path.join(rootPath, 'build/outputs/apk/debug/app-debug.apk');
      const expectedTestApkPath = path.join(rootPath, 'build/outputs/apk/androidTest/debug/app-debug-androidTest.apk');
      expect(apkUtils.getTestApkPath(inputApkPath)).toEqual(expectedTestApkPath);
    });

    it('should properly resolve given a gradle build flavor', async () => {
      const inputApkPath = path.join(rootPath, 'build/outputs/apk/development/debug/app-development-debug.apk');
      const expectedTestApkPath = path.join(rootPath, 'build/outputs/apk/androidTest/development/debug/app-development-debug-androidTest.apk');
      expect(apkUtils.getTestApkPath(inputApkPath)).toEqual(expectedTestApkPath);
    });

    it('should properly resolve given a gradle build with multiple flavors', async () => {
      const inputApkPath = path.join(rootPath, 'build/outputs/apk/pocPlayStore/debug/app-poc-playStore-debug.apk');
      const expectedTestApkPath = path.join(rootPath, 'build/outputs/apk/androidTest/pocPlayStore/debug/app-poc-playStore-debug-androidTest.apk');
      expect(apkUtils.getTestApkPath(inputApkPath)).toEqual(expectedTestApkPath);
    });
  });
});
