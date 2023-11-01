describe('composeRunnerConfig', () => {
  let composeRunnerConfig;
  let globalConfig, localConfig, cliConfig, testRunnerArgv;

  beforeEach(() => {
    globalConfig = {};
    localConfig = {};
    cliConfig = {};
    testRunnerArgv = undefined;

    composeRunnerConfig = () => {
      const { DetoxConfigErrorComposer } = require('../errors');
      const errorComposer = new DetoxConfigErrorComposer()
        .setConfigurationName('default')
        .setDetoxConfig({
          ...globalConfig,
          configurations: {
            default: {
              ...localConfig,
            },
          },
        });

      return require('./composeRunnerConfig')({
        globalConfig,
        localConfig,
        cliConfig,
        testRunnerArgv,
        errorComposer,
      });
    };
  });

  it('should return default test runner args as if it is Jest', () => {
    expect(composeRunnerConfig()).toEqual({
      args: {
        $0: 'jest',
        _: [],
      },
      jest: {
        setupTimeout: 300000,
        teardownTimeout: 30000,
        retryAfterCircusRetries: false,
        reportSpecs: undefined,
        reportWorkerAssign: true,
      },
      retries: 0,
      bail: false,
      detached: false,
      forwardEnv: false,
    });
  });

  it('should take overrides from globalConfig', () => {
    globalConfig.testRunner = {
      args: { $0: 'nyc jest' },
      jest: {
        setupTimeout: 5000,
        retryAfterCircusRetries: true,
        reportSpecs: false,
      },
      bail: true,
      retries: 1,
      detached: true,
      forwardEnv: true,
    };

    expect(composeRunnerConfig()).toEqual({
      args: {
        $0: 'nyc jest',
        _: [],
      },
      jest: {
        setupTimeout: 5000,
        teardownTimeout: 30000,
        retryAfterCircusRetries: true,
        reportSpecs: false,
        reportWorkerAssign: true,
      },
      bail: true,
      retries: 1,
      detached: true,
      forwardEnv: true,
    });
  });

  it('should take overrides from localConfig', () => {
    localConfig.testRunner = {
      args: { $0: 'nyc jest' },
      jest: {
        setupTimeout: 120000,
        teardownTimeout: 30000,
        retryAfterCircusRetries: true,
        reportSpecs: true,
      },
      bail: true,
      retries: 1,
      detached: true,
      forwardEnv: true,
    };

    expect(composeRunnerConfig()).toEqual({
      args: {
        $0: 'nyc jest',
        _: [],
      },
      jest: {
        setupTimeout: 120000,
        teardownTimeout: 30000,
        retryAfterCircusRetries: true,
        reportSpecs: true,
        reportWorkerAssign: true,
      },
      bail: true,
      retries: 1,
      detached: true,
      forwardEnv: true,
    });
  });

  it('should take --retries overrides from cliConfig', () => {
    localConfig.testRunner = {
      retries: 1,
    };

    cliConfig.retries = 5;

    expect(composeRunnerConfig()).toEqual(expect.objectContaining({
      retries: 5,
    }));
  });

  it('should take --inspect-brk overrides from cliConfig', () => {
    globalConfig.testRunner = {
      forwardEnv: false,
      retries: 1,
    };

    cliConfig.inspectBrk = true;

    expect(composeRunnerConfig()).toEqual(expect.objectContaining({
      args: expect.objectContaining({
        $0: expect.stringMatching(/--inspect-brk.*jest/),
        runInBand: true,
      }),
      retries: 0,
      forwardEnv: true,
    }));
  });

  it('should not do anything if inspectBrk hook is nullified', () => {
    globalConfig.testRunner = {
      args: { $0: 'jest' },
      retries: 1,
      inspectBrk: null,
    };

    cliConfig.inspectBrk = true;

    expect(composeRunnerConfig()).toEqual(expect.objectContaining({
      args: expect.objectContaining({
        $0: 'jest',
      }),
      retries: 1,
    }));
  });

  it('should provide inspectBrk hook customization', () => {
    const inspectBrk = jest.fn((config) => {
      config.hello = true;
    });

    globalConfig.testRunner = { inspectBrk };
    cliConfig.inspectBrk = true;
    const runnerConfig = composeRunnerConfig();

    expect(runnerConfig).not.toHaveProperty('inspectBrk');
    expect(runnerConfig.hello).toBe(true);
    expect(inspectBrk).toHaveBeenCalledWith(runnerConfig);
  });

  it('should apply --jest-report-specs overrides from cliConfig onto globalConfig and localConfig', () => {
    globalConfig.testRunner = {
      jest: { customProperty: 1 },
    };

    localConfig.testRunner = {
      jest: { otherProperty: true },
    };

    cliConfig.jestReportSpecs = true;

    expect(composeRunnerConfig()).toEqual(expect.objectContaining({
      jest: {
        customProperty: 1,
        setupTimeout: 300000,
        teardownTimeout: 30000,
        otherProperty: true,
        retryAfterCircusRetries: false,
        reportSpecs: true,
        reportWorkerAssign: true,
      },
    }));
  });

  it('should take overrides from testRunnerArgv', () => {
    testRunnerArgv = {
      listFiles: true,
    };

    expect(composeRunnerConfig().args).toEqual({
      $0: 'jest',
      listFiles: true,
      _: [],
    });
  });

  it('should prefer localConfig to globalConfig when overriding', () => {
    globalConfig.testRunner = {
      _privateGlobalProperty: false,
      args: {
        $0: 'nyc jest',
        _: ['first.test.js'],
        maxWorkers: 3,
      },
      jest: {
        reportSpecs: true,
      },
      bail: true,
      detached: true,
      retries: 1,
    };

    localConfig.testRunner = {
      _privateLocalProperty: null,
      args: {
        $0: 'jest2',
        bail: true,
        _: ['second.test.js'],
      },
      jest: {
        reportSpecs: false,
      },
      bail: false,
      detached: false,
      retries: 3,
    };

    expect(composeRunnerConfig()).toEqual({
      _privateGlobalProperty: false,
      _privateLocalProperty: null,
      args: {
        $0: 'jest2',
        bail: true,
        maxWorkers: 3,
        _: ['second.test.js'],
      },
      jest: {
        setupTimeout: 300000,
        teardownTimeout: 30000,
        retryAfterCircusRetries: false,
        reportSpecs: false,
        reportWorkerAssign: true,
      },
      bail: false,
      detached: false,
      retries: 3,
      forwardEnv: false,
    });
  });

  it('should support positional CLI args override', () => {
    localConfig.testRunner = {
      args: {
        _: ['default.test.js'],
        verbose: true,
      },
    };

    testRunnerArgv = {
      _: [],
      debug: true,
    };

    expect(composeRunnerConfig().args).toEqual({
      $0: 'jest',
      debug: true,
      verbose: true,
      _: ['default.test.js'],
    });

    testRunnerArgv._[0] = 'specific.test.js';
    expect(composeRunnerConfig().args._).toEqual(['specific.test.js']);
  });

  it('should also support simple positional arguments merging with CLI args', () => {
    localConfig.testRunner = {
      args: {
        _: ['fallback.test.js']
      },
    };

    testRunnerArgv = { _: [] };
    expect(composeRunnerConfig().args._).toEqual(['fallback.test.js']);

    testRunnerArgv = { _: undefined };
    expect(composeRunnerConfig().args._).toEqual(['fallback.test.js']);

    testRunnerArgv = { _: ['override.test.js'] };
    expect(composeRunnerConfig().args._).toEqual(['override.test.js']);
  });

  describe('legacy fallbacks', () => {
    let log;

    beforeEach(() => {
      jest.mock('../utils/logger');
      log = require('../utils/logger');
    });

    test('deprecated "test-runner"', () => {
      globalConfig['test-runner'] = 'nyc jest';
      expect(composeRunnerConfig().args).toEqual({ $0: 'nyc jest', _: [] });
      expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('"test-runner" property'));
    });

    test('deprecated "testRunner"', () => {
      globalConfig['testRunner'] = 'nyc jest';
      expect(composeRunnerConfig().args).toEqual({ $0: 'nyc jest', _: [] });
      expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('"testRunner" property'));
    });

    test('deprecated "runner-config"', () => {
      globalConfig['runner-config'] = 'e2e/config.json';
      expect(composeRunnerConfig().args).toEqual({ $0: 'jest', config: 'e2e/config.json', _: [] });
      expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('"runner-config" property'));
    });

    test('deprecated "runnerConfig"', () => {
      globalConfig['runnerConfig'] = 'e2e/config.json';
      expect(composeRunnerConfig().args).toEqual({ $0: 'jest', config: 'e2e/config.json', _: [] });
      expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('"runnerConfig" property'));
    });

    test('deprecated "specs"', () => {
      globalConfig['specs'] = '.';
      expect(composeRunnerConfig().args).toEqual({ $0: 'jest', _: ['.'] });
      expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('"specs" property'));
    });

    test('deprecated "specs": empty array workaround', () => {
      globalConfig['specs'] = [];
      expect(composeRunnerConfig().args).toEqual({ $0: 'jest', _: [] });
      expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('"specs" property'));
    });
  });

  describe('unhappy scenarios', () => {
    test('non-string and non-object "testRunner" in global config', () => {
      globalConfig['testRunner'] = 0;
      expect(composeRunnerConfig).toThrowErrorMatchingSnapshot();
    });

    test('deprecated "testRunner" in local config', () => {
      localConfig['testRunner'] = 'nyc jest';
      expect(composeRunnerConfig).toThrowErrorMatchingSnapshot();
    });
  });

});
