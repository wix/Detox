describe('composeRunnerConfig', () => {
  let composeRunnerConfig;
  let globalConfig, localConfig, cliConfig, testRunnerArgv;

  beforeEach(() => {
    globalConfig = {};
    localConfig = {};
    cliConfig = {};
    testRunnerArgv = undefined;

    composeRunnerConfig = () => require('./composeRunnerConfig')({
      globalConfig,
      localConfig,
      cliConfig,
      testRunnerArgv,
    });
  });

  it('should return default test runner args as if it is Jest', () => {
    expect(composeRunnerConfig()).toEqual({
      args: {
        $0: 'jest',
        _: [],
      },
      retries: 0,
      inspectBrk: false,
    });
  });

  it('should take overrides from globalConfig', () => {
    globalConfig.testRunner = {
      args: { $0: 'nyc jest' },
      retries: 1,
      inspectBrk: true,
    };

    expect(composeRunnerConfig()).toEqual({
      args: {
        $0: 'nyc jest',
        _: [],
      },
      retries: 1,
      inspectBrk: true,
    });
  });

  it('should take overrides from localConfig', () => {
    localConfig.testRunner = {
      args: { $0: 'nyc jest' },
      retries: 1,
      inspectBrk: true,
    };

    expect(composeRunnerConfig()).toEqual({
      args: {
        $0: 'nyc jest',
        _: [],
      },
      retries: 1,
      inspectBrk: true,
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
    localConfig.testRunner = {
      inspectBrk: false,
    };

    cliConfig.inspectBrk = true;

    expect(composeRunnerConfig()).toEqual(expect.objectContaining({
      inspectBrk: true,
    }));
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
        reportSpecs: true,
        otherProperty: true,
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
      retries: 1,
    };

    localConfig.testRunner = {
      _privateLocalProperty: null,
      args: {
        $0: 'jest2',
        bail: true,
        _: ['second.test.js'],
      },
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
      retries: 3,
      inspectBrk: false,
    });
  });

  it('should support dynamic merging with CLI args', () => {
    localConfig.testRunner = {
      args: {
        _: jest.fn((specs) => [...specs, 'second.test.js']),
        verbose: true,
      },
    };

    testRunnerArgv = {
      _: ['first.test.js'],
      debug: true,
    };

    expect(composeRunnerConfig().args).toEqual({
      $0: 'jest',
      debug: true,
      verbose: true,
      _: ['first.test.js', 'second.test.js'],
    });

    expect(localConfig.testRunner.args._).toHaveBeenCalledTimes(1);
    expect(localConfig.testRunner.args._).toHaveBeenCalledWith(testRunnerArgv._);
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
});
