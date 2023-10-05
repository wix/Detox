const os = require('os');
const path = require('path');

const fs = require('fs-extra');
const _ = require('lodash');
const tempfile = require('tempfile');

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

    describe('getAvdHome', () => {
      const testCases = [
        [path.join(os.homedir(), '.android', 'avd'), null, null, null],
        [path.join('homedir', '.android', 'avd'), null, null, 'homedir'],
        [path.join('emu', 'avd'), null, 'emu', 'homedir'],
        ['AVD', 'AVD', 'emu', 'homedir'],
      ];

      it.each(testCases)('should return %j ' + [
        'if $ANDROID_AVD_HOME = %j',
        'if $ANDROID_EMULATOR_HOME = %j',
        'if $ANDROID_SDK_HOME = %j',
      ].join(' and '), (...args) => {

        process.env['ANDROID_AVD_HOME'] = args[1];
        process.env['ANDROID_EMULATOR_HOME'] = args[2];
        process.env['ANDROID_SDK_HOME'] = args[3];

        expect(Environment.getAvdHome()).toBe(args[0]);
      });
    });

    describe('getAvdDir', () => {
      let avdHome;

      beforeEach(async () => {
        avdHome = process.env['ANDROID_AVD_HOME'] = tempfile();
        await fs.mkdir(avdHome);
      });

      afterEach(async () => {
        await fs.remove(avdHome);
      });

      it('should throw error if ${avdHome}/${avdName}.ini does not exist', () => {
        expect(() => Environment.getAvdDir('nonExistent')).toThrow(/Failed.*INI.*at path:/);
      });

      it('should throw error if path specified in INI file does not exist', () => {
        fs.writeFileSync(path.join(avdHome, 'MyAVD.ini'), `path=randomPath${Math.random()}`);
        expect(() => Environment.getAvdDir('MyAVD')).toThrow(/Failed to find.*randomPath0\./);
      });

      it('should return path specified in INI file if it exists', () => {
        fs.writeFileSync(path.join(avdHome, 'MyAVD.ini'), `path=${avdHome}`);
        expect(Environment.getAvdDir('MyAVD')).toBe(avdHome);
      });
    });

    describe('getAndroidSDKPath', () => {
      it(`should return empty string if $ANDROID_SDK_ROOT and $ANDROID_HOME both are not set`, () => {
        delete process.env.ANDROID_SDK_ROOT;
        delete process.env.ANDROID_HOME;

        const sdkPath = Environment.getAndroidSDKPath();
        expect(sdkPath).toBe('');
      });

      it(`should return $ANDROID_HOME if it is set`, () => {
        delete process.env.ANDROID_SDK_ROOT;
        process.env.ANDROID_HOME = path.normalize('path/to/android/home');

        const sdkPath = Environment.getAndroidSDKPath();
        expect(sdkPath).toBe(process.env.ANDROID_HOME);
      });

      it(`should return $ANDROID_SDK_ROOT if it is set`, () => {
        delete process.env.ANDROID_HOME;
        process.env.ANDROID_SDK_ROOT = path.normalize('path/to/sdk/root');

        const sdkPath = Environment.getAndroidSDKPath();
        expect(sdkPath).toBe(process.env.ANDROID_SDK_ROOT);
      });

      it(`should prefer $ANDROID_SDK_ROOT, if both $ANDROID_SDK_ROOT and $ANDROID_HOME are set`, () => {
        process.env.ANDROID_SDK_ROOT = path.normalize('path/to/sdk/root');
        process.env.ANDROID_HOME = path.normalize('path/to/android/home');

        const sdkPath = Environment.getAndroidSDKPath();
        expect(sdkPath).toBe(process.env.ANDROID_SDK_ROOT);
      });
    });

    describe('getAvdManagerPath', () => {
      it('should return path to AVD-manager executable', () => {
        process.env.ANDROID_SDK_ROOT = path.normalize('mock/path/to/sdk');

        const avdManagerPath = Environment.getAvdManagerPath();
        expect(avdManagerPath).toBe(path.join(process.env.ANDROID_SDK_ROOT, 'cmdline-tools/latest/bin/avdmanager'));
      });

      it('should fall back to using ANDROID_HOME instead of ANDROID_SDK_ROOT', () => {
        delete process.env.ANDROID_SDK_ROOT;
        process.env.ANDROID_HOME = path.normalize('mock/path/to/sdk');

        const avdManagerPath = Environment.getAvdManagerPath();
        expect(avdManagerPath).toBe(path.join(process.env.ANDROID_HOME, 'cmdline-tools/latest/bin/avdmanager'));
      });
    });

    describe('getAndroidSdkManagerPath', () => {
      it('should return path to SDK-manager executable', () => {
        process.env.ANDROID_SDK_ROOT = path.normalize('mock/path/to/sdk');

        const sdkManagerPath = Environment.getAndroidSdkManagerPath();
        expect(sdkManagerPath).toBe(path.join(process.env.ANDROID_SDK_ROOT, 'cmdline-tools/latest/bin/sdkmanager'));
      });

      it('should fall back to using ANDROID_HOME instead of ANDROID_SDK_ROOT', () => {
        delete process.env.ANDROID_SDK_ROOT;
        process.env.ANDROID_HOME = path.normalize('mock/path/to/sdk');

        const sdkManagerPath = Environment.getAndroidSdkManagerPath();
        expect(sdkManagerPath).toBe(path.join(process.env.ANDROID_HOME, 'cmdline-tools/latest/bin/sdkmanager'));
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

        it('should throw error if aapt is missing inside (a valid) build-tools/<sdk-version> directory', async () => {
          const validBuildToolsPath = 'build-tools/20.0.0';
          const expectedErrPath = path.join(tempSdkPath, validBuildToolsPath);

          await genExec(`${validBuildToolsPath}/not-aapt`);
          await expect(Environment.getAaptPath()).rejects.toThrow(`There was no "aapt" executable file in directory: ${expectedErrPath}`);
        });

        it('should throw error if there are no inner <sdk-version> directories where aapt could reside', async () => {
          await genExec('build-tools/dummy');
          await expect(Environment.getAaptPath()).rejects.toThrow('Failed to find the "aapt" tool under the Android SDK: No build-tools are installed!');
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
          const expectedErrPath = path.join(tempSdkPath, 'platform-tools');

          expect(() => Environment.getAdbPath()).toThrow(`There was no "adb" executable file in directory: ${expectedErrPath}`);
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

    describe('Genymotion SaaS executable - getGmsaasPath', () => {
      it('should resolve based on $PATH', async () => {
        const executable = 'gmsaas';
        process.env.PATH = path.join(tempSdkPath, 'somewhere');
        await genExec(`somewhere/${executable}`);
        expect(Environment.getGmsaasPath()).toMatch(path.join(tempSdkPath, `somewhere/${executable}`));
      });

      it('should throw error if gmsaas is not in $PATH', async () => {
        const pathToNowhere = path.join('one', 'mock', 'directory');
        process.env.PATH = pathToNowhere;
        await expect(async () => Environment.getGmsaasPath()).rejects.toThrow(`Failed to locate Genymotion's gmsaas executable. Please add it to your $PATH variable!\nPATH is currently set to: ${pathToNowhere}`);
      });
    });
  });
});
