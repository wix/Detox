// @ts-nocheck
describe('Monitored instrumentation', () => {
  const deviceId = 'mock-device-id';
  const bundleId = 'mock-bundle-id';
  const INSTRUMENTATION_STACKTRACE_MOCK = 'Stacktrace mock';

  let adb;
  let logger;
  beforeEach(() => {
    jest.mock('../../../../../utils/logger');
    logger = require('../../../../../utils/logger');

    const ADB = jest.genMockFromModule('../exec/ADB');
    adb = new ADB();
  });

  let InstrumentationClass;
  let InstrumentationLogsParserClass;
  beforeEach(() => {
    jest.mock('./Instrumentation');
    InstrumentationClass = require('./Instrumentation');

    jest.mock('./InstrumentationLogsParser');
    InstrumentationLogsParserClass = require('./InstrumentationLogsParser').InstrumentationLogsParser;
    InstrumentationLogsParserClass.mockImplementation(() => {
      const instances = InstrumentationLogsParserClass.mock.instances;
      const _this = instances[instances.length - 1];
      _this.getStackTrace.mockReturnValue(INSTRUMENTATION_STACKTRACE_MOCK);
    });
  });

  const instrumentationObj = () => InstrumentationClass.mock.instances[0];
  const instrumentationLogsParserObj = () => InstrumentationLogsParserClass.mock.instances[0];

  let uut;
  beforeEach(() => {
    const MonitoredInstrumentation = require('./MonitoredInstrumentation');
    uut = new MonitoredInstrumentation(adb);
  });

  it('should properly init the underlying instrumentation', () => {
    expect(InstrumentationClass).toHaveBeenCalledWith(adb, logger, expect.any(Function), expect.any(Function));
  });

  describe('launch', () => {
    it('should launch the underlying instrumentation', async () => {
      const launchArgs = {};
      await uut.launch(deviceId, bundleId, launchArgs);
      expect(instrumentationObj().launch).toHaveBeenCalledWith(deviceId, bundleId, launchArgs);
    });

    it('should break if underlying launch fails', async () => {
      instrumentationObj().launch.mockRejectedValue(new Error());

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
      expect(instrumentationObj().terminate).toHaveBeenCalled();
    });

    it('should break if underlying termination fails', async () => {
      instrumentationObj().terminate.mockRejectedValue(new Error());

      await uut.launch(deviceId, bundleId, {});

      try {
        await uut.terminate();
        fail();
      } catch (e) {}
    });

    it('should allow for termination without launch', async () => {
      await uut.terminate();
      expect(instrumentationObj().terminate).toHaveBeenCalled();
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
    beforeEach(async () => {
      onReject = jest.fn();

      await uut.launch(deviceId, bundleId, {});
      mockUnderlyingInstrumentationRunning();
    });

    it('should signal termination due to unexpected underlying termination, if waited-for', async () => {
      uut.waitForCrash().catch(onReject);

      await invokeUnderlyingTerminationCallback();
      expect(onReject).toHaveBeenCalled();
    });

    it('should signal termination due to initiated termination, if waited-for', async () => {
      uut.waitForCrash().catch(onReject);

      await uut.terminate();
      expect(onReject).toHaveBeenCalled();
    });

    it('should signal termination with a parsed stack-trace', async () => {
      mockLogsParserHasStacktrace();

      uut.waitForCrash().catch(onReject);

      await invokeUnderlyingLogListenerCallbackWith('mock data');
      await invokeUnderlyingTerminationCallback();

      assertRejectedWithNativeStacktrace();
    });

    it('should signal termination with no stack-trace, if none available', async () => {
      mockLogsParserHasNoStacktrace();

      uut.waitForCrash().catch(onReject);

      await invokeUnderlyingLogListenerCallbackWith('mock data');
      await invokeUnderlyingTerminationCallback();

      expect(instrumentationLogsParserObj().parse).toHaveBeenCalledWith('mock data');

      assertRejectedWithoutStacktrace();
    });

    it('should allow for user-initiated clearing of app-wait', async () => {
      const onResolve = jest.fn();

      const promise = uut.waitForCrash().then(onResolve);
      uut.abortWaitForCrash();

      await promise;
      expect(onResolve).toHaveBeenCalled();
    });

    it('should immediately signal termination if already terminated', async () => {
      mockUnderlyingInstrumentationDead();
      await uut.waitForCrash().catch(onReject);

      expect(onReject).toHaveBeenCalled();
    });

    it('should account for all waiting crash-wait clients', async () => {
      uut.waitForCrash().catch(onReject);
      uut.waitForCrash().catch(onReject);

      await uut.terminate();

      expect(onReject).toHaveBeenCalledTimes(2);
    });

    const assertRejectedWithNativeStacktrace = () => {
      const e = onReject.mock.calls[0][0];
      expect(e.toString()).toContain('DetoxRuntimeError: Failed to run application on the device');
      expect(e.toString()).toContain(`Native stacktrace dump:\n${INSTRUMENTATION_STACKTRACE_MOCK}`);
    };

    const assertRejectedWithoutStacktrace = () => {
      const e = onReject.mock.calls[0][0];
      expect(e.toString()).toContain('DetoxRuntimeError: Failed to run application on the device');
      expect(e.toString()).not.toContain('Native stacktrace dump');
    };
  });

  const extractUnderlyingTerminationCallback = () => InstrumentationClass.mock.calls[0][2];
  const invokeUnderlyingTerminationCallback = async () => {
    const fn = extractUnderlyingTerminationCallback();
    await fn();
  };
  const extractUnderlyingLogListenerCallback = () => InstrumentationClass.mock.calls[0][3];
  const invokeUnderlyingLogListenerCallbackWith = async (data) => {
    const fn = extractUnderlyingLogListenerCallback();
    await fn(data);
  };

  const mockUnderlyingInstrumentationRunning = () => instrumentationObj().isRunning.mockReturnValue(true);
  const mockUnderlyingInstrumentationDead = () => instrumentationObj().isRunning.mockReturnValue(false);

  const mockLogsParserHasStacktrace = () => instrumentationLogsParserObj().containsStackTraceLog.mockReturnValue(true);
  const mockLogsParserHasNoStacktrace = () => instrumentationLogsParserObj().containsStackTraceLog.mockReturnValue(false);
});
