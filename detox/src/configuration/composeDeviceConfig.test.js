const _ = require('lodash');

const DetoxConfigErrorComposer = require('../errors/DetoxConfigErrorComposer');

describe('composeDeviceConfig', () => {
  /** @type {Function} */
  let composeDeviceConfig;
  /** @type {*} */
  let cliConfig;
  /** @type {Detox.DetoxConfiguration} */
  let localConfig;
  /** @type {Detox.DetoxDeviceConfig} */
  let deviceConfig;
  /** @type {Detox.DetoxConfig} */
  let globalConfig;
  /** @type {DetoxConfigErrorComposer} */
  let errorComposer;
  /** @type {DriverRegistry} */
  let driverRegistry;
  /** @type {Logger} */
  let logger;

  const compose = () => composeDeviceConfig({
    errorComposer,
    globalConfig,
    localConfig,
    cliConfig,
  });

  const KNOWN_CONFIGURATIONS = [['plain'], ['inline'], ['aliased']];

  const KNOWN_DEVICES = [
    'ios.none',
    'ios.simulator',
    'android.attached',
    'android.emulator',
    'android.genycloud',
    './customDriver'
  ];

  const KNOWN_GPU_MODES = ['auto', 'host', 'swiftshader_indirect', 'angle_indirect', 'guest'];

  /**
   * @param {'ios.none' | 'ios.simulator' | 'android.attached' | 'android.emulator' | 'android.genycloud' | './customDriver'} deviceType
   * @param {'plain' | 'inline' | 'aliased' } configType
   */
  function setConfig(deviceType, configType = 'aliased') {
    const mixins = {
      bootArgs: { bootArgs: '--someArg' },
      forceAdbInstall: { forceAdbInstall: false },
      utilBinaryPaths: { utilBinaryPaths: ['/path/to/apk'] },
      iosDevice: {
        device: {
          type: 'iPhone 7 Plus',
          os: 'iOS 10.2',
        },
      },
    };

    const deviceTemplates = {
      'ios.none': {
        type: 'ios.none',
        ...mixins.iosDevice,
      },
      'ios.simulator': {
        type: 'ios.simulator',
        ...mixins.iosDevice,
        ...mixins.bootArgs,
      },
      'android.attached': {
        type: 'android.attached',
        device: { adbName: 'emulator-5554' },
        ...mixins.utilBinaryPaths,
        ...mixins.forceAdbInstall,
      },
      'android.emulator': {
        type: 'android.emulator',
        device: { avdName: 'Pixel_API_28' },
        gpu: 'auto',
        headless: true,
        readonly: true,
        ...mixins.bootArgs,
        ...mixins.utilBinaryPaths,
        ...mixins.forceAdbInstall,
      },
      'android.genycloud': {
        type: 'android.genycloud',
        device: { recipeName: 'myRecipe' },
        ...mixins.utilBinaryPaths,
        ...mixins.forceAdbInstall,
      },
      './customDriver': {
        type: './customDriver',
        device: 'firefox',
        binaryPath: 'https://example.com',
      },
    };

    const deviceId = _.uniqueId('device');
    deviceConfig = _.cloneDeep(deviceTemplates[deviceType] || deviceTemplates[undefined]);

    if (deviceType === './customDriver') {
      driverRegistry.resolve = () => (class SomeDriver {});
    }

    switch (configType) {
      case 'plain':
        Object.assign(localConfig, deviceConfig);
        localConfig.binaryPath = deviceConfig.binaryPath || _.uniqueId('/path/to/app');
        break;
      case 'inline':
        localConfig.device = deviceConfig;
        break;
      case 'aliased':
        localConfig.device = deviceId;
        globalConfig.devices = { [deviceId]: deviceConfig };
        break;
    }
 }

  beforeEach(() => {
    jest.mock('../utils/logger');
    logger = require('../utils/logger');

    jest.mock('../devices/DriverRegistry', () => {
      const DriverRegistry = jest.requireActual('../devices/DriverRegistry');
      driverRegistry = DriverRegistry.default;
      return DriverRegistry;
    });

    cliConfig = {};
    localConfig = {};
    deviceConfig = null;
    globalConfig = {
      configurations: {
        someConfig: localConfig,
      },
    };

    errorComposer = new DetoxConfigErrorComposer()
      .setDetoxConfig(globalConfig)
      .setConfigurationName('someConfig');

    composeDeviceConfig = require('./composeDeviceConfig');
  });

  describe('by config type', () => {
    describe.each(KNOWN_DEVICES)('given a device (%j)', (deviceType) => {
      describe('plain', () => {
        beforeEach(() => {
          setConfig(deviceType, 'plain');

          // NOTE: these properties are ignored for plain configurations
          delete deviceConfig.bootArgs;
          delete deviceConfig.forceAdbInstall;
          delete deviceConfig.gpu;
          delete deviceConfig.headless;
          delete deviceConfig.readonly;
        });

        it('should extract type and device', () =>
          expect(compose()).toEqual(deviceConfig));

        // region supported devices
        if (deviceType === './customDriver') return;

        it('should have a fallback for known devices: .name -> .device', () => {
          const expected = compose();

          localConfig.name = localConfig.device;
          delete localConfig.device;

          const actual = compose();
          expect(actual).toEqual(expected);
        });

        it('should extract type, utilBinaryPaths and unpack device query', () => {
          localConfig.device = Object.values(deviceConfig.device).join(', ');

          expect(compose()).toEqual({
            type: deviceConfig.type,
            device: deviceConfig.device,
            utilBinaryPaths: deviceConfig.utilBinaryPaths,
          });
        });
        // endregion
      });

      describe('inlined', () => {
        beforeEach(() => setConfig(deviceType, 'inline'));

        it('should extract type and device', () =>
          expect(compose()).toEqual(deviceConfig));

        describe('unhappy scenarios', () => {
          test('should throw if device config is not found', () => {
            delete localConfig.device;
            expect(compose).toThrow(errorComposer.deviceConfigIsUndefined());
          });

          test('should throw on no .type in device config', () => {
            delete deviceConfig.type;
            expect(compose).toThrow(errorComposer.missingDeviceType(undefined));
          });
        });
      });

      describe('aliased', () => {
        beforeEach(() => setConfig(deviceType, 'aliased'));

        it('should extract type and device', () =>
          expect(compose()).toEqual(deviceConfig));

        describe('unhappy scenarios', () => {
          test('should throw if devices are not declared', () => {
            globalConfig.devices = {};
            expect(compose).toThrow(errorComposer.thereAreNoDeviceConfigs(localConfig.device));
          });

          test('should throw if device config is not found', () => {
            localConfig.device = 'unknownDevice';
            expect(compose).toThrow(errorComposer.cantResolveDeviceAlias('unknownDevice'));
          });

          test('should throw on no .type in device config', () => {
            delete deviceConfig.type;
            expect(compose).toThrow(errorComposer.missingDeviceType(localConfig.device));
          });
        });
      });
    });
  });

  describe('by device type', () => {
    describe.each(KNOWN_CONFIGURATIONS)('given %s configuration', (configType) => {
      let alias = () => configType === 'aliased' ? localConfig.device : undefined;

      describe('CLI overrides', () => {
        describe('--device-name', () => {
          describe.each([
            ['ios.none'],
            ['ios.simulator'],
          ])('given iOS (%s) device', (deviceType) => {
            beforeEach(() => setConfig(deviceType, configType));

            test('should override .type', () => {
              cliConfig.deviceName = 'iPad';
              expect(compose().device).toEqual({ type: 'iPad' });
            });

            test('should override .type and .os', () => {
              cliConfig.deviceName = 'iPhone SE, iOS 9.3.5';
              expect(compose().device).toEqual({ type: 'iPhone SE', os: 'iOS 9.3.5' });
            });
          });

          describe('given android.emulator device', () => {
            beforeEach(() => setConfig('android.emulator', configType));

            test('should override .avdName', () => {
              cliConfig.deviceName = 'Galaxy_S100';
              expect(compose().device).toEqual({ avdName: 'Galaxy_S100' });
            });
          });

          describe('given android.attached device', () => {
            beforeEach(() => setConfig('android.attached', configType));

            test('should override .adbName', () => {
              cliConfig.deviceName = 'emu.*tor';
              expect(compose().device).toEqual({ adbName: 'emu.*tor' });
            });
          });

          describe('given android.genycloud device', () => {
            beforeEach(() => setConfig('android.genycloud', configType));

            test('should override .recipeName', () => {
              cliConfig.deviceName = 'anotherRecipe';
              expect(compose().device).toEqual({ recipeName: 'anotherRecipe' });
            });
          });

          describe('given a custom device', () => {
            beforeEach(() => setConfig('./customDriver', configType));

            test('should override .device', () => {
              cliConfig.deviceName = 'aCustomValue';
              expect(compose().device).toEqual('aCustomValue');
            });
          });
        });

        describe('--device-boot-args', () => {
          describe.each([
            ['ios.simulator'],
            ['android.emulator'],
          ])('given a supported device (%j)', (deviceType) => {
            beforeEach(() => setConfig(deviceType, configType));

            it('should override .bootArgs without warnings', () => {
              cliConfig.deviceBootArgs = '--example';
              expect(compose()).toEqual(expect.objectContaining({
                bootArgs: '--example'
              }));

              expect(logger.warn).not.toHaveBeenCalled();
            });
          });

          describe.each([
            ['ios.none'],
            ['android.attached'],
            ['android.genycloud'],
            ['./customDriver'],
          ])('given a non-supported device (%j)', (deviceType) => {
            beforeEach(() => setConfig(deviceType, configType));

            it('should print a warning and refuse to override .bootArgs', () => {
              cliConfig.deviceBootArgs = '--example';
              expect(compose()).not.toEqual(expect.objectContaining({
                bootArgs: '--example'
              }));

              expect(logger.warn).toHaveBeenCalledWith(expect.stringMatching(/--device-boot-args.*not supported/));
            });
          });
        });

        describe('--force-adb-install', () => {
          describe.each([
            ['android.attached'],
            ['android.emulator'],
            ['android.genycloud'],
          ])('given an Android device (%j)', (deviceType) => {
            beforeEach(() => setConfig(deviceType, configType));

            it('should override .forceAdbInstall without warnings', () => {
              cliConfig.forceAdbInstall = true;
              expect(compose()).toEqual(expect.objectContaining({
                forceAdbInstall: true,
              }));

              expect(logger.warn).not.toHaveBeenCalled();
            });
          });

          describe.each([
            ['ios.none'],
            ['ios.simulator'],
            ['./customDriver'],
          ])('given a non-supported device (%j)', (deviceType) => {
            beforeEach(() => setConfig(deviceType, configType));

            it('should print a warning and refuse to override .forceAdbInstall', () => {
              cliConfig.forceAdbInstall = true;
              expect(compose()).not.toEqual(expect.objectContaining({
                forceAdbInstall: true,
              }));

              expect(logger.warn).toHaveBeenCalledWith(expect.stringMatching(/--force-adb-install.*not supported/));
            });
          });
        });

        describe('--headless', () => {
          describe('given android.emulator device', () => {
            beforeEach(() => setConfig('android.emulator', configType));

            it('should override .headless without warnings', () => {
              cliConfig.headless = true;
              expect(compose()).toEqual(expect.objectContaining({
                headless: true,
              }));

              expect(logger.warn).not.toHaveBeenCalled();
            });
          });

          describe.each([
            ['ios.none'],
            ['ios.simulator'],
            ['android.attached'],
            ['android.genycloud'],
            ['./customDriver'],
          ])('given a non-supported device (%j)', (deviceType) => {
            beforeEach(() => setConfig(deviceType, configType));

            it('should print a warning and refuse to override .headless', () => {
              cliConfig.headless = true;
              expect(compose()).not.toEqual(expect.objectContaining({
                headless: true,
              }));

              expect(logger.warn).toHaveBeenCalledWith(expect.stringMatching(/--headless.*not supported/));
            });
          });
        });

        describe('--gpu', () => {
          describe('given android.emulator device', () => {
            beforeEach(() => setConfig('android.emulator', configType));

            it('should override .gpuMode without warnings', () => {
              cliConfig.gpu = 'auto';
              expect(compose()).toEqual(expect.objectContaining({
                gpuMode: 'auto',
              }));

              expect(logger.warn).not.toHaveBeenCalled();
            });
          });

          describe.each([
            ['ios.none'],
            ['ios.simulator'],
            ['android.attached'],
            ['./customDriver'],
          ])('given a non-supported device (%j)', (deviceType) => {
            beforeEach(() => setConfig(deviceType, configType));

            it('should print a warning and refuse to override .gpuMode', () => {
              cliConfig.gpu = 'auto';
              expect(compose()).not.toEqual(expect.objectContaining({
                gpuMode: 'auto',
              }));

              expect(logger.warn).toHaveBeenCalledWith(expect.stringMatching(/--gpu.*not supported/));
            });
          });
        });

        describe('--readonlyEmu', () => {
          describe('given android.emulator device', () => {
            beforeEach(() => setConfig('android.emulator', configType));

            it('should override .readonly without warnings', () => {
              cliConfig.readonlyEmu = true;
              expect(compose()).toEqual(expect.objectContaining({
                readonly: true
              }));

              expect(logger.warn).not.toHaveBeenCalled();
            });
          });

          describe.each([
            ['ios.none'],
            ['ios.simulator'],
            ['android.attached'],
            ['android.genycloud'],
            ['./customDriver'],
          ])('given a non-supported device (%j)', (deviceType) => {
            beforeEach(() => setConfig(deviceType, configType));

            it('should print a warning and refuse to override .readonly', () => {
              cliConfig.readonlyEmu = true;
              expect(compose()).not.toEqual(expect.objectContaining({
                readonly: true
              }));

              expect(logger.warn).toHaveBeenCalledWith(expect.stringMatching(/--readonly-emu.*not supported/));
            });
          });
        });
      });

      describe('Unhappy scenarios', () => {
        describe('missing device matcher properties', () => {
          test.each([
            [['type', 'name', 'id'], 'ios.simulator'],
            [['adbName'], 'android.attached'],
            [['avdName'], 'android.emulator'],
            [['recipeUUID', 'recipeName'], 'android.genycloud'],
          ])('should throw for missing %s for "%s" device', (expectedProps, deviceType) => {
            setConfig(deviceType, configType);
            for (const key of expectedProps) {
              delete deviceConfig.device[key];
            }
            deviceConfig.device.misspelled = 'value';

            expect(compose).toThrowError(errorComposer.missingDeviceMatcherProperties(alias(), expectedProps));

            // ...and now prove the opposite:
            deviceConfig.device[_.sample(expectedProps)] = 'someValue';
            expect(compose).not.toThrowError();
          });
        });

        test('should throw if a device type cannot be resolved', () => {
          setConfig('./customDriver', configType);
          const someError = new Error('Some error');
          driverRegistry.resolve = () => {
            throw someError;
          };

          expect(compose).toThrow(errorComposer.invalidDeviceType(
            alias(),
            deviceConfig,
            someError
          ));
        });

        //region separate device config validation
        if (configType === 'plain') return;

        describe('.bootArgs validation', () => {
          test.each([
            'ios.none',
            'android.attached',
            'android.genycloud',
          ])('cannot be used for %j device', (deviceType) => {
            setConfig(deviceType, configType);
            deviceConfig.bootArgs = '--someArg';
            expect(compose).toThrow(errorComposer.unsupportedDeviceProperty(alias(), 'bootArgs'));
          });

          describe.each([
            'ios.simulator',
            'android.emulator',
          ])('for a supported device (%j)', (deviceType) => {
            beforeEach(() => setConfig(deviceType, configType));

            it('should throw if .bootArgs are malformed (e.g., array)', () => {
              deviceConfig.bootArgs = ['--someArg'];

              expect(compose).toThrowError(
                errorComposer.malformedDeviceProperty(alias(), 'bootArgs')
              );
            });
          });

          test('should be disabled for custom devices', () => {
            setConfig('./customDriver', configType);
            deviceConfig.bootArgs = [0xAC, 0xDC];
            expect(compose).not.toThrowError();
          });
        });

        describe('.forceAdbInstall validation', () => {
          test.each([
            'ios.none',
            'ios.simulator',
          ])('cannot be used for iOS device (%j)', (deviceType) => {
            setConfig(deviceType, configType);
            deviceConfig.forceAdbInstall = false;
            expect(compose).toThrow(errorComposer.unsupportedDeviceProperty(alias(), 'forceAdbInstall'));
          });

          describe.each([
            'android.attached',
            'android.emulator',
            'android.genycloud',
          ])('for Android device (%j)', (deviceType) => {
            beforeEach(() => setConfig(deviceType, configType));

            it('should throw if .forceAdbInstall is malformed (e.g., string)', () => {
              deviceConfig.forceAdbInstall = 'yes';

              expect(compose).toThrowError(
                errorComposer.malformedDeviceProperty(alias(), 'forceAdbInstall')
              );
            });
          });

          test('should be disabled for custom devices', () => {
            setConfig('./customDriver', configType);
            deviceConfig.forceAdbInstall = /anything/;
            expect(compose).not.toThrowError();
          });
        });

        describe('.gpuMode validation', () => {
          test.each([
            'ios.none',
            'ios.simulator',
            'android.attached',
            'android.genycloud',
          ])('cannot be used for a non-emulator device (%j)', (deviceType) => {
            setConfig(deviceType, configType);
            deviceConfig.gpuMode = 'auto';
            expect(compose).toThrow(errorComposer.unsupportedDeviceProperty(alias(), 'gpuMode'));
          });

          describe('given android.emulator device', () => {
            beforeEach(() => setConfig('android.emulator', configType));

            test(`should throw if value is not a string`, () => {
              deviceConfig.gpuMode = ['auto'];
              expect(compose).toThrowError(errorComposer.malformedDeviceProperty(alias(), 'gpuMode'));
            });

            test(`should throw if value is not in (${KNOWN_GPU_MODES})`, () => {
              for (const gpuMode of KNOWN_GPU_MODES) {
                deviceConfig.gpuMode = gpuMode;
                expect(compose).not.toThrowError();

                deviceConfig.gpuMode = gpuMode.slice(1);
                expect(compose).toThrowError(errorComposer.malformedDeviceProperty(alias(), 'gpuMode'));
              }
            });
          });

          test('should be disabled for custom devices', () => {
            setConfig('./customDriver', configType);
            deviceConfig.gpuMode = class Whatever {};
            expect(compose).not.toThrowError();
          });
        });

        describe('.headless validation', () => {
          test.each([
            'ios.none',
            'ios.simulator',
            'android.attached',
            'android.genycloud',
          ])('cannot be used for a non-emulator device (%j)', (deviceType) => {
            setConfig(deviceType, configType);
            deviceConfig.headless = true;
            expect(compose).toThrow(errorComposer.unsupportedDeviceProperty(alias(), 'headless'));
          });

          describe('given android.emulator device', () => {
            beforeEach(() => setConfig('android.emulator', configType));

            test(`should throw if value is not a boolean (e.g., string)`, () => {
              deviceConfig.headless = `${Math.random() > 0.5}`; // string
              expect(compose).toThrowError(errorComposer.malformedDeviceProperty(alias(), 'headless'));
            });
          });

          test('should be disabled for custom devices', () => {
            setConfig('./customDriver', configType);
            deviceConfig.headless = NaN;
            expect(compose).not.toThrowError();
          });
        });

        describe('.readonly validation', () => {
          test.each([
            'ios.none',
            'ios.simulator',
            'android.attached',
            'android.genycloud',
          ])('cannot be used for a non-emulator device (%j)', (deviceType) => {
            setConfig(deviceType, configType);
            deviceConfig.readonly = true;
            expect(compose).toThrow(errorComposer.unsupportedDeviceProperty(alias(), 'readonly'));
          });

          describe('given android.emulator device', () => {
            beforeEach(() => setConfig('android.emulator', configType));

            test(`should throw if value is not a boolean (e.g., string)`, () => {
              deviceConfig.readonly = `${Math.random() > 0.5}`; // string
              expect(compose).toThrowError(errorComposer.malformedDeviceProperty(alias(), 'readonly'));
            });
          });

          test('should be disabled for custom devices', () => {
            setConfig('./customDriver', configType);
            deviceConfig.readonly = () => {};
            expect(compose).not.toThrowError();
          });
        });

        describe('.utilBinaryPaths validation', () => {
          test.each([
            'ios.none',
            'ios.simulator',
          ])('cannot be used for a non-Android device (%j)', (deviceType) => {
            setConfig(deviceType, configType);
            deviceConfig.utilBinaryPaths = [];
            expect(compose).toThrow(errorComposer.unsupportedDeviceProperty(alias(), 'utilBinaryPaths'));
          });

          describe.each([
            'android.attached',
            'android.emulator',
            'android.genycloud',
          ])('for Android device (%j)', (deviceType) => {
            beforeEach(() => setConfig(deviceType, configType));

            it('should throw if .utilBinaryPaths are malformed (array of non-strings)', () => {
              deviceConfig.utilBinaryPaths = [{ path: 'valid/path/not/in/array' }];

              expect(compose).toThrowError(
                errorComposer.malformedDeviceProperty(alias(), 'utilBinaryPaths')
              );
            });

            it('should throw if device.utilBinaryPaths are malformed (string)', () => {
              deviceConfig.utilBinaryPaths = 'valid/path/not/in/array';

              expect(compose).toThrowError(
                errorComposer.malformedDeviceProperty(alias(), 'utilBinaryPaths')
              );
            });
          });

          test('should be disabled for custom devices', () => {
            setConfig('./customDriver', configType);
            deviceConfig.utilBinaryPaths = 42;
            expect(compose).not.toThrowError();
          });
        });
      });
    });
  });
});
