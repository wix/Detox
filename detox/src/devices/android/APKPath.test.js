describe('APKPath', () => {
  let APKPath;

  beforeEach(() => {
    APKPath = require('./APKPath');
  });

  it(`simple path`, async () => {
    const inputApkPath = '~/somePath/build/outputs/apk/debug/app-debug.apk';
    const expectedTestApkPath = '~/somePath/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk';
    expect(APKPath.getTestApkPath(inputApkPath)).toEqual(expectedTestApkPath);
  });

  it(`path for a gradle build flavor`, async () => {
    const inputApkPath = '~/somePath/build/outputs/apk/development/debug/app-development-debug.apk';
    const expectedTestApkPath = '~/somePath/build/outputs/apk/androidTest/development/debug/app-development-debug-androidTest.apk';
    expect(APKPath.getTestApkPath(inputApkPath)).toEqual(expectedTestApkPath);
  });

});

