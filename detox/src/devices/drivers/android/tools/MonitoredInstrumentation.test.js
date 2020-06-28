describe('Monitored instrumentation', () => {
  const deviceId = 'mock-device-id';
  const bundleId = 'mock-bundle-id';

  class MockInstrumentationClass {
    constructor(...args) {
      instrumentation.mockCtor(...args);
      Object.assign(this, instrumentation);
    }
  }

  class MockInstrumentationLogsParserClass {
    constructor() {
      Object.assign(this, instrumentationLogsParser);
    }
  }
  MockInstrumentationLogsParserClass.INSTRUMENTATION_STACKTRACE_MOCK = 'Stacktrace mock';

  let adb;
  let logger;
  beforeEach(() => {
    const ADB = jest.genMockFromModule('../exec/ADB');
    adb = new ADB();

    logger = {};
  });

  let instrumentation;
  let instrumentationLogsParser;
  beforeEach(() => {

    const Instrumentation = jest.genMockFromModule('./Instrumentation');
    instrumentation = new Instrumentation();
    instrumentation.mockCtor = jest.fn();
    jest.mock('./Instrumentation', () => MockInstrumentationClass);

    const { InstrumentationLogsParser } = jest.genMockFromModule('./InstrumentationLogsParser');
    instrumentationLogsParser = new InstrumentationLogsParser();
    instrumentationLogsParser.getStackTrace.mockReturnValue(MockInstrumentationLogsParserClass.INSTRUMENTATION_STACKTRACE_MOCK);
    jest.mock('./InstrumentationLogsParser', () => ({
      InstrumentationLogsParser: MockInstrumentationLogsParserClass,
    }));
  });

  let uut;
  beforeEach(() => {
    const MonitoredInstrumentation = require('./MonitoredInstrumentation');
    uut = new MonitoredInstrumentation(adb, logger);
  });

  it('should properly init the underlying instrumentation', () => {
    expect(instrumentation.mockCtor).toHaveBeenCalledWith(adb, logger, expect.any(Function), expect.any(Function));
  });

  describe('launch', () => {
    it('should launch the underlying instrumentation', async () => {
      const launchArgs = {};
      await uut.launch(deviceId, bundleId, launchArgs);
      expect(instrumentation.launch).toHaveBeenCalledWith(deviceId, bundleId, launchArgs);
    });

    it('should break if underlying launch fails', async () => {
      instrumentation.launch.mockRejectedValue(new Error());

      try {
        await uut.launch(deviceId, bundleId, {});
        fail();
      } catch (e) {}
    });
  });

  describe('Unexpected termination', () => {
    it('should invoke user termination callback', async () => {
      const terminationFn = jest.fn();
      uut.setTerminationFn(terminationFn);
      await uut.launch(deviceId, bundleId, {});
      await invokeUnderlyingTerminationCallback();
      expect(terminationFn).toHaveBeenCalled();
    });
  });

  describe('Initiation termination', () => {
    it('should terminate the underlying instrumentation', async () => {
      await uut.launch(deviceId, bundleId, {});
      await uut.terminate();
      expect(instrumentation.terminate).toHaveBeenCalled();
    });

    it('should break if underlying termination fails', async () => {
      instrumentation.terminate.mockRejectedValue(new Error());

      await uut.launch(deviceId, bundleId, {});

      try {
        await uut.terminate();
        fail();
      } catch (e) {}
    });

    it('should allow for termination without launch', async () => {
      await uut.terminate();
      expect(instrumentation.terminate).toHaveBeenCalled();
    });
  });

  it('should allow for user-initiated clearing of termination callback function', async () => {
    const terminationFn = jest.fn();
    uut.setTerminationFn(terminationFn);
    await uut.launch(deviceId, bundleId, {});

    uut.setTerminationFn(null);
    await invokeUnderlyingTerminationCallback();
    expect(terminationFn).not.toHaveBeenCalled();
  });

  it('should query underlying instrumentation for status', async () => {
    mockUnderlyingInstrumentationRunning();
    expect(uut.isRunning()).toEqual(true);

    mockUnderlyingInstrumentationDead();
    expect(uut.isRunning()).toEqual(false);
  });

  describe('Crash monitoring', () => {
    let onReject;
    beforeEach(() => {
      onReject = jest.fn();

      mockUnderlyingInstrumentationRunning();
    });

    it('should signal termination due to unexpected underlying termination, if waited-for', async () => {
      await uut.launch(deviceId, bundleId, {});
      uut.waitForCrash().catch(onReject);

      await invokeUnderlyingTerminationCallback();
      expect(onReject).toHaveBeenCalled();
    });

    it('should signal termination due to initiated termination, if waited-for', async () => {
      await uut.launch(deviceId, bundleId, {});
      uut.waitForCrash().catch(onReject);

      await uut.terminate();
      expect(onReject).toHaveBeenCalled();
    });

    it('should signal termination with a parsed stack-trace', async () => {
      instrumentationLogsParser.containsStackTraceLog.mockReturnValue(true);

      await uut.launch(deviceId, bundleId, {});
      uut.waitForCrash().catch(onReject);

      await invokeUnderlyingLogListenerCallbackWith('mock data');
      await invokeUnderlyingTerminationCallback();

      assertRejectedWithNativeStacktrace();
    });

    it('should signal termination with no stack-trace, if none available', async () => {
      instrumentationLogsParser.containsStackTraceLog.mockReturnValue(false);

      await uut.launch(deviceId, bundleId, {});
      uut.waitForCrash().catch(onReject);

      await invokeUnderlyingLogListenerCallbackWith('mock data');
      await invokeUnderlyingTerminationCallback();

      expect(instrumentationLogsParser.parse).toHaveBeenCalledWith('mock data');

      assertRejectedWithoutStacktrace();
    });

    it('should allow for user-initiated clearing of app-wait', async () => {
      const onResolve = jest.fn();

      await uut.launch(deviceId, bundleId, {});
      const promise = uut.waitForCrash().then(onResolve);
      uut.abortWaitForCrash();

      await promise;
      expect(onResolve).toHaveBeenCalled();
    });

    it('should immediately signal termination if already terminated', async () => {
      await uut.launch(deviceId, bundleId, {});

      mockUnderlyingInstrumentationDead();
      await uut.waitForCrash().catch(onReject);

      expect(onReject).toHaveBeenCalled();
    });

    it('should account for all waiting crash-wait clients', async () => {
      await uut.launch(deviceId, bundleId, {});

      uut.waitForCrash().catch(onReject);
      uut.waitForCrash().catch(onReject);

      await uut.terminate();

      expect(onReject).toHaveBeenCalledTimes(2);
    });

    const assertRejectedWithNativeStacktrace = () => {
      const e = onReject.mock.calls[0][0];
      expect(e.toString()).toContain('DetoxRuntimeError: Failed to run application on the device');
      expect(e.toString()).toContain(`Native stacktrace dump: ${MockInstrumentationLogsParserClass.INSTRUMENTATION_STACKTRACE_MOCK}`);
    };

    const assertRejectedWithoutStacktrace = () => {
      const e = onReject.mock.calls[0][0];
      expect(e.toString()).toContain('DetoxRuntimeError: Failed to run application on the device');
      expect(e.toString()).not.toContain('Native stacktrace dump');
    };
  });

  const extractUnderlyingTerminationCallback = () => instrumentation.mockCtor.mock.calls[0][2];
  const invokeUnderlyingTerminationCallback = async () => {
    const fn = extractUnderlyingTerminationCallback();
    await fn();
  }
  const extractUnderlyingLogListenerCallback = () => instrumentation.mockCtor.mock.calls[0][3];
  const invokeUnderlyingLogListenerCallbackWith = async (data) => {
    const fn = extractUnderlyingLogListenerCallback();
    await fn(data);
  }

  const mockUnderlyingInstrumentationRunning = () => instrumentation.isRunning.mockReturnValue(true);
  const mockUnderlyingInstrumentationDead = () => instrumentation.isRunning.mockReturnValue(false);
});
