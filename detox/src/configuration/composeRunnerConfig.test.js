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
      return require('./composeRunnerConfig')({
        globalConfig,
        localConfig,
        cliConfig,
        testRunnerArgv,
        errorComposer: new DetoxConfigErrorComposer(),
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
        initTimeout: 300000,
        retryAfterCircusRetries: false,
        reportSpecs: undefined,
        reportWorkerAssign: true,
      },
      retries: 0,
      inspectBrk: false,
    });
  });

  it('should take overrides from globalConfig', () => {
    globalConfig.testRunner = {
      args: { $0: 'nyc jest' },
      jest: {
        initTimeout: 5000,
        retryAfterCircusRetries: true,
        reportSpecs: false,
      },
      retries: 1,
      inspectBrk: true,
    };

    expect(composeRunnerConfig()).toEqual({
      args: {
        $0: 'nyc jest',
        _: [],
      },
      jest: {
        initTimeout: 5000,
        retryAfterCircusRetries: true,
        reportSpecs: false,
        reportWorkerAssign: true,
      },
      retries: 1,
      inspectBrk: true,
    });
  });

  it('should take overrides from localConfig', () => {
    localConfig.testRunner = {
      args: { $0: 'nyc jest' },
      jest: {
        initTimeout: 120000,
        retryAfterCircusRetries: true,
        reportSpecs: true,
      },
      retries: 1,
      inspectBrk: true,
    };

    expect(composeRunnerConfig()).toEqual({
      args: {
        $0: 'nyc jest',
        _: [],
      },
      jest: {
        initTimeout: 120000,
        retryAfterCircusRetries: true,
        reportSpecs: true,
        reportWorkerAssign: true,
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
    cliConfig.inspectBrk = true;

    expect(composeRunnerConfig()).toEqual(expect.objectContaining({
      args: expect.objectContaining({
        $0: expect.stringMatching(/--inspect-brk.*jest/),
        runInBand: true,
      }),
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
        initTimeout: 300000,
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
        initTimeout: 300_000,
        retryAfterCircusRetries: false,
        reportSpecs: false,
        reportWorkerAssign: true,
      },
      retries: 3,
      inspectBrk: false,
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
});
