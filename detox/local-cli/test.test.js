jest.mock('../src/utils/logger');
jest.mock('../src/configuration');
jest.mock('child_process');

const path = require('path');
const {normalize} = require('path');
const shellQuote = require('./utils/shellQuote');

describe('test', () => {
  let _argv, logger, execSync;

  beforeAll(() => {
    _argv = process.argv;
  });

  beforeEach(() => {
    process.argv = ['node', 'jest', 'test'];

    logger = require('../src/utils/logger');
    execSync = require('child_process').execSync;
  });

  afterEach(() => {
    process.argv = _argv;
  });

  const mockAndroidJestConfiguration = () => mockConfiguration('android.emulator', 'jest');
  const mockIOSJestConfiguration = () => mockConfiguration('ios.sim', 'jest');
  const mockAndroidMochaConfiguration = (overrides) => mockConfiguration('android.emulator', undefined, overrides);
  const mockIOSMochaConfiguration = () => mockConfiguration('ios.sim');
  const mockConfiguration = (deviceType, runner, overrides) => {
    require('../src/configuration').composeDetoxConfig.mockImplementation(async (options) => {
      return jest.requireActual('../src/configuration').composeDetoxConfig({
        ...options,
        override: {
          'test-runner': runner,
          configurations: {
            only: {
              type: deviceType,
              name: 'MyDevice',
            }
          },
          ...overrides
        },
      });
    });
  };

  describe('mocha', () => {
    it('runs successfully', async () => {
      mockAndroidMochaConfiguration();

      await callCli('./test', 'test');

      expect(execSync).toHaveBeenCalledWith(
        `${normalize('node_modules/.bin/mocha')} --opts e2e/mocha.opts --invert --grep :ios: --use-custom-logger "true" e2e`,
        expect.anything()
      );
    });

    it('passes custom Detox config', async () => {
      mockAndroidMochaConfiguration();

      await callCli('./test', `test -C ${path.join(__dirname, '__mocks__/detox.config.js')}`);

      expect(execSync).toHaveBeenCalledWith(
        expect.stringMatching(/mocha.* --config-path .*__mocks__.detox\.config\.js/),
        expect.anything()
      );
    });

    it('changes --opts to --config, when given non ".opts" file extension', async () => {
      mockAndroidMochaConfiguration({
        'runner-config': 'e2e/.mocharc.json'
      });

      await callCli('./test', 'test');

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining(`${normalize('node_modules/.bin/mocha')} --config e2e/.mocharc.json `),
        expect.anything()
      );
    });

    it('passes artifact recording options', async () => {
      mockAndroidMochaConfiguration({
        'runner-config': 'e2e/.mocharc.json'
      });

      await callCli('./test', 'test --record-logs none --take-screenshots manual --record-videos none --record-performance none');

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining(`--record-logs none --take-screenshots manual --record-videos none --record-performance none`),
        expect.anything()
      );
    });

    it('should pass in device-launch-args as an environment variable', async () => {
      mockAndroidMochaConfiguration();

      await callCli('./test', 'test --device-launch-args="-mocked -launched -args"');

      expect(execSync).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          env: expect.objectContaining({
            deviceLaunchArgs: '-mocked -launched -args',
          }),
        }),
      );
    });
  });

  describe('jest', () => {
    it('runs successfully', async () => {
      mockAndroidJestConfiguration();

      await callCli('./test', 'test');

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining(
          `${normalize('node_modules/.bin/jest')} --config e2e/config.json ${shellQuote('--testNamePattern=^((?!:ios:).)*$')} --maxWorkers 1 e2e`
        ),
        expect.objectContaining({
          env: expect.objectContaining({
            reportSpecs: true,
            useCustomLogger: true,
          }),
        })
      );
    });

    it('passes custom Detox config', async () => {
      mockAndroidJestConfiguration();

      await callCli('./test', `test -C ${path.join(__dirname, '__mocks__/detox.config.js')}`);

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining(
          `${normalize('node_modules/.bin/jest')} --config e2e/config.json`
        ),
        expect.objectContaining({
          env: expect.objectContaining({
            configPath: expect.stringMatching(/__mocks__.detox\.config\.js$/),
          }),
        })
      );
    });

    it('should pass in device-launch-args as an environment variable', async () => {
      mockAndroidJestConfiguration();

      await callCli('./test', 'test --device-launch-args="-mocked -launched -args"');

      expect(execSync).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          env: expect.objectContaining({
            deviceLaunchArgs: '-mocked -launched -args',
          }),
        }),
      );
    });
  });

  it('fails with a different runner', async () => {
    mockConfiguration('android.emulator', 'ava');
    await expect(callCli('./test', 'test')).rejects.toThrowErrorMatchingSnapshot();
    expect(execSync).not.toHaveBeenCalled();
  });

  describe('Jest specs reporting (propagated) switch', () => {
    const expectReportSpecsArg = ({value}) => expect(execSync).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        env: expect.objectContaining({
          reportSpecs: value,
        }),
      })
    );

    const expectWorkersArg = ({value}) => expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining(`--maxWorkers ${value}`),
      expect.anything(),
    );

    describe('ios', () => {
      beforeEach(mockIOSJestConfiguration);

      it('should use one worker', async () => {
        await callCli('./test', 'test');
        expectWorkersArg({value: '1'});
      });

      it('should still use one worker', async () => {
        await callCli('./test', 'test --workers 1');
        expectWorkersArg({value: '1'});
      });

      it('should still use two workers', async () => {
        await callCli('./test', 'test --workers 2');
        expectWorkersArg({value: '2'});
      });

      it('should use 100% workers', async () => {
        await callCli('./test', 'test --workers 100%');
        expectWorkersArg({value: '100%'});
      });

      it('should be enabled for a single worker', async () => {
        await callCli('./test', 'test --workers 1');
        expectReportSpecsArg({value: true});
      });

      it('should be disabled for multiple workers', async () => {
        await callCli('./test', 'test --workers 2');
        expectReportSpecsArg({value: false});
      });

      it('should be enabled in case no specific workers config has been specified', async () => {
        await callCli('./test', 'test');
        expectReportSpecsArg({value: true});
      });

      it('should be enabled if custom --jest-report-specs switch is specified', async () => {
        await callCli('./test', 'test --workers 2 --jest-report-specs');
        expectReportSpecsArg({value: true});
      });

      it('should be disabled if custom switch has non-true value', async () => {
        await callCli('./test', 'test --jest-report-specs meh');
        expectReportSpecsArg({value: false});
      });

      it('should be enabled if custom switch has explicit value of \'true\'', async () => {
        await callCli('./test', 'test --workers 2 --jest-report-specs true');
        expectReportSpecsArg({value: true});
      });
    });

    describe('android', () => {
      it('should adhere to custom --jest-report-specs switch, as with ios', async () => {
        mockAndroidJestConfiguration();
        await callCli('./test', 'test --workers 2 --jest-report-specs false');
        expectReportSpecsArg({value: false});
      });
    });
  });

  describe('Jest read-only mode for emulators (propagated) switch', () => {
    const expectReadOnlyEmulatorsArg = ({value}) => expect(execSync).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        env: expect.objectContaining({
          readOnlyEmu: value,
        }),
      })
    );

    const expectNoReadOnlyEmulatorsArg = () => expect(execSync).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        env: expect.not.objectContaining({
          readOnlyEmu: expect.anything(),
        }),
      })
    );

    it('should be enabled if more than 1 worker is set', async () => {
      mockAndroidJestConfiguration();
      await callCli('./test', 'test --workers 2');
      expectReadOnlyEmulatorsArg({value: true});
    });

    it('should be disabled by default', async () => {
      mockAndroidJestConfiguration();
      await callCli('./test', 'test');
      expectReadOnlyEmulatorsArg({value: false});
    });

    it('should be disabled on iOS', async () => {
      mockIOSJestConfiguration();
      await callCli('./test', 'test --workers 2');
      expectNoReadOnlyEmulatorsArg();
    });
  });

  it('sets default value for debugSynchronization', async () => {
    mockAndroidMochaConfiguration();

    try {
      await callCli('./test', 'test --debug-synchronization');
    } catch (e) {
      console.log(e);
    }
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining(
        `${normalize('node_modules/.bin/mocha')} --opts e2e/mocha.opts --debug-synchronization 3000 --invert --grep :ios:`
      ),
      expect.anything()
    );
  });

  it('passes extra args to the test runner', async () => {
    mockAndroidMochaConfiguration();

    try {
      process.argv = [...process.argv, '--unknown-property', '42', '--flag'];
      await callCli('./test', 'test --unknown-property 42 --flag');
    } catch (e) {
      console.log(e);
    }

    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('--unknown-property 42 --flag'), expect.anything());
  });
});
