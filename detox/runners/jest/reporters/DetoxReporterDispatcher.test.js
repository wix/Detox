jest.mock('../../../internals', () => ({
  config: { testRunner: {} },
  unsafe_conductEarlyTeardown: jest.fn(),
}));

describe('DetoxReporterDispatcher', () => {
  /** @type {import('./DetoxReporterDispatcher')} */
  let dispatcher;
  /** @type {any} */
  let mockGlobalConfig;
  /** @type {LegacyReporter} */
  let legacyReporter;
  /** @type {ModernReporter} */
  let modernReporter;

  class LegacyReporter {
    constructor(globalConfig) {
      if (globalConfig) {
        legacyReporter = this;
      }
    }

    getLastError = jest.fn();
    onRunStart = jest.fn();
    onTestStart = jest.fn();
    onTestCaseStart = jest.fn();
    onTestCaseResult = jest.fn();
    onTestResult = jest.fn();
    onRunComplete = jest.fn();
  }

  class ModernReporter extends LegacyReporter {
    constructor() {
      super(null);
      modernReporter = this;
    }

    onTestFileStart = jest.fn();
    onTestFileResult = jest.fn();
  }

  beforeEach(() => {
    mockGlobalConfig = { bail: 2 };

    const DetoxReporterDispatcher = require('./DetoxReporterDispatcher');
    dispatcher = new DetoxReporterDispatcher(mockGlobalConfig, {
      LegacyReporter,
      ModernReporter,
    });
  });

  it('should instantiate reporters', () => {
    expect(legacyReporter).toBeInstanceOf(LegacyReporter);
    expect(modernReporter).toBeInstanceOf(ModernReporter);
  });

  it('should return first error from getLastError method', () => {
    const [error1, error2] = [new Error('1'), new Error('2')];
    legacyReporter.getLastError.mockReturnValue(error1);
    modernReporter.getLastError.mockReturnValue(error2);
    expect(dispatcher.getLastError()).toBe(error1);
  });

  it.each([
    ['onRunStart'],
    ['onTestCaseStart'],
    ['onTestCaseResult'],
    ['onRunComplete'],
  ])('should dispatch %s calls to all reporters', async (methodName) => {
    const args = [{ path: 'test' }, { arg: 2 }, { arg: 3 }].slice(0, dispatcher[methodName].length);
    await dispatcher[methodName](...args);
    expect(legacyReporter[methodName]).toHaveBeenCalledWith(...args);
    expect(modernReporter[methodName]).toHaveBeenCalledWith(...args);
  });

  it.each([
    ['onTestFileStart', 'onTestStart'],
    ['onTestFileResult', 'onTestResult'],
  ])('should dispatch %s/%s calls to all reporters', async (modernMethod, legacyMethod) => {
    const args = [{ path: 'test' }, { arg: 2 }, { arg: 3 }].slice(0, dispatcher[modernMethod].length);

    for (const methodName of [modernMethod, legacyMethod]) {
      await dispatcher[methodName](...args);

      expect(legacyReporter[legacyMethod]).toHaveBeenCalledWith(...args);
      expect(modernReporter[modernMethod]).toHaveBeenCalledWith(...args);
      expect(modernReporter[legacyMethod]).not.toHaveBeenCalled();

      legacyReporter[legacyMethod].mockClear();
      modernReporter[modernMethod].mockClear();
    }
  });

  describe('onRunComplete', () => {
    let unsafe_conductEarlyTeardown;

    beforeEach(() => {
      jest.spyOn(console, 'warn');
      unsafe_conductEarlyTeardown = require('../../../internals').unsafe_conductEarlyTeardown;
    });

    describe('upon a regular exit', () => {
      const testContexts = new Set();
      const aggregatedResult = { numFailedTests: 1, numTotalSuites: 0, testResults: [] };

      it('should not call unsafe cleanup on regular exit', async () => {
        await dispatcher.onRunComplete(testContexts, aggregatedResult);
        expect(unsafe_conductEarlyTeardown).not.toHaveBeenCalled();
        expect(console.warn).not.toHaveBeenCalled();
      });

      it('can be called only once per reporter lifecycle', async () => {
        const promise1 = dispatcher.onRunComplete(testContexts, aggregatedResult);
        const promise2 = dispatcher.onRunComplete(testContexts, aggregatedResult);

        expect(promise1).toBe(promise2);
      });
    });

    describe('upon an early exit', () => {
      const testContexts = new Set();
      let aggregatedResult;
      let config;

      beforeEach(() => {
        // 2 > 1 (numFailedTests > bail)
        aggregatedResult = { numFailedTests: 2, numTotalTestSuites: 1, testResults: [] };
        config = require('../../../internals').config;
      });

      it('should call unsafe cleanup on early exit', async () => {
        await dispatcher.onRunComplete(testContexts, aggregatedResult);

        expect(unsafe_conductEarlyTeardown).toHaveBeenCalled();
        expect(console.warn).not.toHaveBeenCalled();
      });

      it('should wait for all test files to finish', async () => {
        await dispatcher.onTestFileStart({ path: 'a' });
        const runCompletePromise = dispatcher.onRunComplete(testContexts, aggregatedResult);
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 100, 'timeout'));

        await expect(Promise.race([runCompletePromise, timeoutPromise])).resolves.toBe('timeout');
        await dispatcher.onTestFileResult({ path: 'a' }, {});
        await expect(runCompletePromise).resolves.toBe(undefined);
      });

      it('should warn about mismatching number of failed test suites if -R, --retries > 0', async () => {
        config.testRunner.retries = 1;

        await dispatcher.onRunComplete(testContexts, aggregatedResult);
        expect(unsafe_conductEarlyTeardown).toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('aborted'));
      });
    });
  });
});
