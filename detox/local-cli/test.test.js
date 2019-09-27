jest.mock('../src/utils/logger');
const {normalize} = require('path');
const shellQuote = require('./utils/shellQuote');

describe('test', () => {
  let mockExec;
  let argv;
  let logger;

  beforeAll(() => {
    argv = process.argv;
  });

  beforeEach(() => {
    process.argv = ['node', 'jest', 'test'];

    logger = require('../src/utils/logger');
    mockExec = jest.fn();
    jest.mock('child_process', () => ({
      execSync: mockExec
    }));
  });

  afterEach(() => {
    process.argv = argv;
  });

  const mockAndroidJestConfiguration = () => mockConfiguration('android.emulator', 'jest');
  const mockIOSJestConfiguration = () => mockConfiguration('ios.sim', 'jest');
  const mockAndroidMochaConfiguration = () => mockConfiguration('android.emulator');
  const mockIOSMochaConfiguration = () => mockConfiguration('ios.sim');
  const mockConfiguration = (deviceType, runner) => mockPackageJson({
    'test-runner': runner,
    configurations: {
      only: {
        type: deviceType,
      }
    }
  });

  describe('mocha', () => {
    it('runs successfully', async () => {
      mockAndroidMochaConfiguration();

      await callCli('./test', 'test');

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(`${normalize('node_modules/.bin/mocha')} --opts e2e/mocha.opts --configuration only --grep :ios: --invert --artifacts-location "${normalize('artifacts/only.')}`),
        expect.anything()
      );

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringMatching(/ "e2e"$/),
        expect.anything()
      );
    });

    it('should warn about deprecated options', async () => {
      mockAndroidMochaConfiguration();
      await callCli('./test', 'test --specs e2e');
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('migration guide'));
    });

    it('should pass in device-launch-args as an environment variable', async () => {
      mockAndroidMochaConfiguration();

      await callCli('./test', 'test --device-launch-args="-mocked -launched -args"');

      expect(mockExec).toHaveBeenCalledWith(
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

      const mockExec = jest.fn();
      jest.mock('child_process', () => ({
        execSync: mockExec
      }));

      await callCli('./test', 'test');

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `${normalize('node_modules/.bin/jest')} --config=e2e/config.json --maxWorkers=1 ${shellQuote('--testNamePattern=^((?!:ios:).)*$')} "e2e"`
        ),
        expect.objectContaining({
          env: expect.objectContaining({
            configuration: 'only',
            recordLogs: 'none',
            takeScreenshots: 'manual',
            recordVideos: 'none',
            artifactsLocation: expect.stringContaining(normalize('artifacts/only.')),
          }),
        })
      );
    });

    it('should pass in device-launch-args as an environment variable', async () => {
      mockAndroidJestConfiguration();

      await callCli('./test', 'test --device-launch-args="-mocked -launched -args"');

      expect(mockExec).toHaveBeenCalledWith(
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
    expect(mockExec).not.toHaveBeenCalled();
  });

  describe('Jest specs reporting (propagated) switch', () => {
    const expectReportSpecsArg = ({value}) => expect(mockExec).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        env: expect.objectContaining({
          reportSpecs: value,
        }),
      })
    );

    describe('ios', () => {
      beforeEach(mockIOSJestConfiguration);

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
    const expectReadOnlyEmulatorsArg = ({value}) => expect(mockExec).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        env: expect.objectContaining({
          readOnlyEmu: value,
        }),
      })
    );

    const expectNoReadOnlyEmulatorsArg = () => expect(mockExec).toHaveBeenCalledWith(
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
    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining(
        `${normalize('node_modules/.bin/mocha')} --opts e2e/mocha.opts --configuration only --debug-synchronization 3000 --grep :ios: --invert --artifacts-location "${normalize('artifacts/only.')}`
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

    expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('--unknown-property 42 --flag'), expect.anything());
  });
});
