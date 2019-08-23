const _ = require('lodash');
const tempfile = require('tempfile');
const fs = require('fs-extra');
const path = require('path');

describe('Environment', () => {
  let Environment;
  let originalProcessEnv;

  beforeEach(() => {
    originalProcessEnv = _.cloneDeep(process.env);
    Environment = require('./environment');
  });

  beforeEach(() => {
    process.env = _.cloneDeep(originalProcessEnv);
    Environment = require('./environment');
  });

  it(`ANDROID_SDK_ROOT and ANDROID_HOME are defined, prefer ANDROID_SDK_ROOT`, () => {
    process.env.ANDROID_SDK_ROOT = 'path/to/sdk/root';
    process.env.ANDROID_HOME = 'path/to/android/home';

    const path = Environment.getAndroidSDKPath();
    expect(path).toEqual('path/to/sdk/root');
  });

  it(`ANDROID_HOME is defined`, () => {
    process.env.ANDROID_SDK_ROOT = undefined;
    process.env.ANDROID_HOME = 'path/to/android/home';

    const path = Environment.getAndroidSDKPath();
    expect(path).toEqual('path/to/android/home');
  });

  it(`ANDROID_SDK_ROOT and ANDROID_HOME are not defined`, () => {
    process.env.ANDROID_SDK_ROOT = undefined;
    process.env.ANDROID_HOME = undefined;

    expect(Environment.getAndroidSDKPath()).toEqual('');
  });

  it('throws error when android tools are not found', async () => {
    process.env.ANDROID_SDK_ROOT = undefined;
    process.env.ANDROID_HOME = undefined;
    process.env.PATH = '/dev/null';

    expect(Environment.getAndroidEmulatorPath).toThrow(Environment.MISSING_SDK_ERROR);

    await expect(Environment.getAaptPath()).rejects.toThrow(Environment.MISSING_SDK_ERROR);

    expect(Environment.getAdbPath).toThrow(Environment.MISSING_SDK_ERROR);
  });

  it('finds tools on path', async () => {
    const tempDir = path.dirname(tempfile());
    const dirOnPath = path.join(tempDir, 'dirOnPath');
    const fakeAndroidSdkRoot = path.join(tempDir, 'fakeAndroidSdkRoot');
    const fakeAndroidHomeRoot = path.join(tempDir, 'fakeAndroidHomeRoot');

    [fakeAndroidSdkRoot, fakeAndroidHomeRoot, dirOnPath].forEach((p) => createMockAndroidToolsForDir(p));

    process.env.ANDROID_SDK_ROOT = fakeAndroidSdkRoot;
    process.env.ANDROID_HOME = fakeAndroidHomeRoot;
    process.env.PATH = [
      path.join(dirOnPath, 'emulator'),
      path.join(dirOnPath, 'platform-tools'),
      path.join(dirOnPath, 'build-tools', '2.0.0')
    ].join(path.delimiter);

    await assertToolsOnPath(fakeAndroidSdkRoot);

    process.env.ANDROID_SDK_ROOT = undefined;
    await assertToolsOnPath(fakeAndroidHomeRoot);

    process.env.ANDROID_HOME = undefined;
    await assertToolsOnPath(dirOnPath);

    function createMockAndroidToolsForDir(rootPath) {
      createTool(path.join(rootPath, 'build-tools', '1.0.0', 'aapt'));
      createTool(path.join(rootPath, 'build-tools', '2.0.0', 'aapt'));
      createTool(path.join(rootPath, 'emulator', 'emulator'));
      createTool(path.join(rootPath, 'platform-tools', 'adb'));

      function createTool(toolPath) {
        const parentDir = path.dirname(toolPath);
        fs.ensureDirSync(parentDir);
        const options = { mode: 0o755 };
        try {
          fs.unlinkSync(toolPath);
        } catch (e) {}
        fs.writeFileSync(toolPath, '', options);
      }
    }

    async function assertToolsOnPath(rootPath) {
      expect(Environment.getAndroidEmulatorPath()).toEqual(path.join(rootPath, 'emulator', 'emulator'));
      expect(Environment.getAdbPath()).toEqual(path.join(rootPath, 'platform-tools', 'adb'));
      expect(await Environment.getAaptPath()).toEqual(path.join(rootPath, 'build-tools', '2.0.0', 'aapt'));
    }
  });
});
