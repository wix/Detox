const _ = require('lodash');
const tempfile = require('tempfile');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

describe('Environment', () => {
  let Environment;
  let originalProcessEnv = _.cloneDeep(process.env);

  beforeEach(() => {
    process.env = _.cloneDeep(originalProcessEnv);
    Environment = require('./environment');
  });

  afterAll(() => {
    process.env = originalProcessEnv;
  });

  describe('(android)', () => {
    let tempSdkPath;

    async function genExec(relativePath) {
      const extension = (os.platform() === 'win32') ? '.cmd' : '';
      const filePath = path.join(tempSdkPath, relativePath) + extension;

      await fs.ensureFile(filePath);
      await fs.chmod(filePath, 0o755);
    }

    beforeEach(async () => {
      tempSdkPath = tempfile();
      await fs.mkdirp(tempSdkPath);
    });

    afterEach(async () => {
      await fs.remove(tempSdkPath);
    });

    describe('getAndroidSDKPath', () => {
      it(`should return empty string if $ANDROID_SDK_ROOT and $ANDROID_HOME both are not set`, () => {
        delete process.env.ANDROID_SDK_ROOT;
        delete process.env.ANDROID_HOME;

        const sdkPath = Environment.getAndroidSDKPath();
        expect(sdkPath).toEqual('');
      });

      it(`should return $ANDROID_HOME if it is set`, () => {
        delete process.env.ANDROID_SDK_ROOT;
        process.env.ANDROID_HOME = 'path/to/android/home';

        const sdkPath = Environment.getAndroidSDKPath();
        expect(sdkPath).toEqual('path/to/android/home');
      });

      it(`should return $ANDROID_SDK_ROOT if it is set`, () => {
        delete process.env.ANDROID_HOME;
        process.env.ANDROID_SDK_ROOT = 'path/to/sdk/root';

        const sdkPath = Environment.getAndroidSDKPath();
        expect(sdkPath).toEqual('path/to/sdk/root');
      });

      it(`should prefer $ANDROID_SDK_ROOT, if both $ANDROID_SDK_ROOT and $ANDROID_HOME are set`, () => {
        process.env.ANDROID_SDK_ROOT = 'path/to/sdk/root';
        process.env.ANDROID_HOME = 'path/to/android/home';

        const sdkPath = Environment.getAndroidSDKPath();
        expect(sdkPath).toEqual('path/to/sdk/root');
      });
    });

    describe('getAndroidEmulatorPath', () => {
      describe('if $ANDROID_SDK_ROOT is set', () => {
        beforeEach(() => {
          process.env.ANDROID_SDK_ROOT = tempSdkPath;
        });

        it('should return emulator if it is in $ANDROID_SDK_ROOT/emulator dir', async () => {
          await genExec('emulator/emulator');
          expect(Environment.getAndroidEmulatorPath()).toMatch(/.emulator.emulator/);
        });

        it('should return emulator if it is in $ANDROID_SDK_ROOT/tools dir', async () => {
          await genExec('tools/emulator');
          expect(Environment.getAndroidEmulatorPath()).toMatch(/.tools.emulator/);
        });

        it('should prefer $ANDROID_SDK_ROOT/emulator over $ANDROID_SDK_ROOT/tools', async () => {
          await genExec('tools/emulator');
          await genExec('emulator/emulator');

          expect(Environment.getAndroidEmulatorPath()).toMatch(/.emulator.emulator/);
        });

        it('should throw error if there are no executables at those locations', async () => {
          expect(Environment.getAndroidEmulatorPath).toThrow(/There was no.*file in directory:/);
        });
      });

      ifAndroidSdkRootAndHomeAreNotSet(() => {
        itShouldFallBackToPathResolution(() => Environment.getAndroidEmulatorPath(), 'emulator');
        itShouldThrowErrorIfThereAreNoExecutables(() => Environment.getAndroidEmulatorPath());
      });
    });

    describe('getAaptPath', () => {
      describe('if $ANDROID_SDK_ROOT is set', () => {
        beforeEach(() => {
          process.env.ANDROID_SDK_ROOT = tempSdkPath;
        });

        it('should return aapt from build-tools/<latest>', async () => {
          await genExec('build-tools/19.0.0/aapt');
          await genExec('build-tools/20.0.0/aapt');

          expect(await Environment.getAaptPath()).toMatch(/.build-tools.20.0.0.aapt/);
        });

        it('should throw error if aapt is not found inside build-tools/<someDir>', async () => {
          await genExec('build-tools/aapt');
          await expect(Environment.getAaptPath()).rejects.toThrow(/There was no.*file in directory:/);
        });
      });

      ifAndroidSdkRootAndHomeAreNotSet(() => {
        itShouldFallBackToPathResolution(() => Environment.getAaptPath(), 'aapt');
        itShouldThrowErrorIfThereAreNoExecutables(() => Environment.getAaptPath());
      });
    });

    describe('getAdbPath', () => {
      describe('if $ANDROID_SDK_ROOT is set', () => {
        beforeEach(() => {
          process.env.ANDROID_SDK_ROOT = tempSdkPath;
        });

        it('should return adb from platform-tools', async () => {
          await genExec('platform-tools/adb');
          expect(Environment.getAdbPath()).toMatch(/.platform-tools.adb/);
        });

        it('should throw error if adb is not found in platform-tools/', async () => {
          await expect(Environment.getAaptPath()).rejects.toThrow(/There was no.*file in directory:/);
        });
      });

      ifAndroidSdkRootAndHomeAreNotSet(() => {
        itShouldFallBackToPathResolution(() => Environment.getAdbPath(), 'adb');
        itShouldThrowErrorIfThereAreNoExecutables(() => Environment.getAdbPath());
      });
    });

    function ifAndroidSdkRootAndHomeAreNotSet(fn) {
      describe('if $ANDROID_SDK_ROOT and $ANDROID_HOME are not set', () => {
        beforeEach(() => {
          delete process.env.ANDROID_SDK_ROOT;
          delete process.env.ANDROID_HOME;
        });

        fn();
      });
    }

    function itShouldFallBackToPathResolution(getter, executable) {
        it('should fall back to $PATH resolution', async () => {
          process.env.PATH = path.join(tempSdkPath, 'somewhere');
          await genExec(`somewhere/${executable}`);
          expect(await getter()).toMatch(new RegExp(`somewhere.${executable}`));
        });
    }

    function itShouldThrowErrorIfThereAreNoExecutables(getter) {
      const asyncGetter = async () => getter();

      it('should throw error if there are no executables on $PATH', async () => {
        delete process.env.PATH;
        await expect(asyncGetter()).rejects.toThrow(/\$ANDROID_SDK_ROOT is not defined/);
      });
    }
  });
});
