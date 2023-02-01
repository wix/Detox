// @ts-nocheck
const testSummaries = require('./artifacts/__mocks__/testSummaries.mock');
const configuration = require('./configuration');
const Deferred = require('./utils/Deferred');

jest.mock('./utils/logger');
jest.mock('./client/Client');
jest.mock('./utils/AsyncEmitter');
jest.mock('./invoke');
jest.mock('./utils/wrapWithStackTraceCutter');
jest.mock('./environmentFactory');

describe('DetoxWorker', () => {
  const fakeCookie = {
    chocolate: 'yum',
  };

  const client = () => Client.mock.instances[0];
  const invocationManager = () => invoke.InvocationManager.mock.instances[0];
  const eventEmitter = () => AsyncEmitter.mock.instances[0];
  eventEmitter.errorCallback = () => AsyncEmitter.mock.calls[0][0].onError;

  let detoxConfig;
  let detoxContext;

  let envValidatorFactory;
  let artifactsManagerFactory;
  let deviceAllocatorFactory;
  let matchersFactory;
  let runtimeDeviceFactory;
  let artifactsManager;

  let logger;
  let Client;
  let AsyncEmitter;
  let invoke;
  let envValidator;
  let deviceAllocator;
  let runtimeDevice;
  let Detox;
  let detox;

  beforeEach(() => {
    mockEnvironmentFactories();

    const environmentFactory = require('./environmentFactory');
    environmentFactory.createFactories.mockReturnValue({
      envValidatorFactory,
      deviceAllocatorFactory,
      artifactsManagerFactory,
      matchersFactory,
      runtimeDeviceFactory,
    });
  });

  beforeEach(async () => {
    detoxConfig = await configuration.composeDetoxConfig({
      override: {
        configurations: {
          test: {
            device: {
              type: 'fake.device',
              device: 'a device',
            },
            app: {
              type: 'fake.app',
              binaryPath: '/tmp/fake/path',
            },
          },
        },
      },
    });

    logger = require('./utils/logger');
    invoke = require('./invoke');
    Client = require('./client/Client');
    AsyncEmitter = require('./utils/AsyncEmitter');

    Detox = require('./DetoxWorker');
    const symbols = require('./realms/symbols');
    detoxContext = { log: logger, [symbols.config]: detoxConfig };
  });

  describe('when DetoxWorker#init() is called', () => {
    let mockGlobalMatcher;

    const init = async () => {
      detox = await new Detox(detoxContext).init();
    };

    beforeEach(() => {
      mockGlobalMatcher = jest.fn();
      matchersFactory.createMatchers.mockReturnValue({
        globalMatcher: mockGlobalMatcher,
      });
    });

    afterEach(() => {
      // cleanup spilled globals after detox.init()
      delete global.device;
      delete global.globalMatcher;
    });

    describe('', () => {
      beforeEach(init);

      it('should create a new Client', () =>
        expect(Client).toHaveBeenCalled());

      it('should create an invocation manager', () =>
        expect(invoke.InvocationManager).toHaveBeenCalledWith(client()));

      it('should connect a client to the server', () =>
        expect(client().connect).toHaveBeenCalled());

      it('should inject terminateApp method into client', async () => {
        await client().terminateApp();
        expect(runtimeDevice._isAppRunning).toHaveBeenCalled();
        expect(runtimeDevice.terminateApp).not.toHaveBeenCalled();

        runtimeDevice._isAppRunning.mockReturnValue(true);
        await client().terminateApp();
        expect(runtimeDevice.terminateApp).toHaveBeenCalled();
      });

      it('should pre-validate the using the environment validator', () =>
        expect(envValidator.validate).toHaveBeenCalled());

      it('should allocate a device', () => {
        expect(deviceAllocator.allocate).toHaveBeenCalledWith(detoxConfig.device);
      });

      it('should create a runtime-device based on the allocation result (cookie)', () =>
        expect(runtimeDeviceFactory.createRuntimeDevice).toHaveBeenCalledWith(
          fakeCookie,
          {
            invocationManager: invocationManager(),
            eventEmitter: eventEmitter(),
            client: client(),
            runtimeErrorComposer: expect.any(Object),
          },
          {
            appsConfig: detoxConfig.apps,
            behaviorConfig: detoxConfig.behavior,
            deviceConfig: detoxConfig.device,
            sessionConfig: expect.any(Object),
          },
        ));

      it('should create matchers', () => {
        expect(matchersFactory.createMatchers).toHaveBeenCalledWith({
          invocationManager: invocationManager(),
          eventEmitter: eventEmitter(),
          runtimeDevice,
        });
      });

      it('should take the matchers from the matchers-registry to Detox', () =>
        expect(detox.globalMatcher).toBe(mockGlobalMatcher));

      it('should take device to Detox', () =>
        expect(detox.device).toBe(runtimeDevice));

      it('should expose device to global', () =>
        expect(global.device).toBe(runtimeDevice));

      it('should expose matchers to global', () =>
        expect(global.globalMatcher).toBe(mockGlobalMatcher));

      it('should create artifacts manager', () =>
        expect(artifactsManagerFactory.createArtifactsManager).toHaveBeenCalledWith(detoxConfig.artifacts, expect.objectContaining({
          client: client(),
          eventEmitter: eventEmitter(),
        })));

      it('should select and reinstall the app', () => {
        expect(runtimeDevice.selectApp).toHaveBeenCalledWith('default');
        expect(runtimeDevice.uninstallApp).toHaveBeenCalled();
        expect(runtimeDevice.installApp).toHaveBeenCalled();
      });

      it('should not unselect the app if it is the only one', () => {
        expect(runtimeDevice.selectApp).not.toHaveBeenCalledWith(null);
      });

      it('should return itself', async () =>
        expect(await detox.init()).toBeInstanceOf(Detox));
    });

    describe('with multiple apps', () => {
      beforeEach(() => {
        detoxConfig.apps['extraApp'] = {
          type: 'ios.app',
          binaryPath: 'path/to/app',
        };

        detoxConfig.apps['extraAppWithAnotherArguments'] = {
          type: 'ios.app',
          binaryPath: 'path/to/app',
          launchArgs: {
            overrideArg: 2,
          },
        };
      });

      beforeEach(init);

      it('should install only apps with unique binary paths, and deselect app on device', () => {
        expect(runtimeDevice.uninstallApp).toHaveBeenCalledTimes(2);
        expect(runtimeDevice.installApp).toHaveBeenCalledTimes(2);

        expect(runtimeDevice.selectApp).toHaveBeenCalledTimes(5);
        expect(runtimeDevice.selectApp.mock.calls[0]).toEqual(['default']);
        expect(runtimeDevice.selectApp.mock.calls[1]).toEqual(['extraApp']);
        expect(runtimeDevice.selectApp.mock.calls[2]).toEqual(['default']);
        expect(runtimeDevice.selectApp.mock.calls[3]).toEqual(['extraApp']);
        expect(runtimeDevice.selectApp.mock.calls[4]).toEqual([null]);
      });
    });

    describe('with behavior.init.exposeGlobals = false', () => {
      beforeEach(() => {
        detoxConfig.behavior.init.exposeGlobals = false;
      });

      beforeEach(init);

      it('should take the matchers from the matchers-registry to Detox', () =>
        expect(detox.globalMatcher).toBe(mockGlobalMatcher));

      it('should take device to Detox', () => {
        expect(detox.device).toBe(runtimeDevice);
      });

      it('should not expose device to globals', () =>
        expect(global.device).toBe(undefined));

      it('should not expose matchers to globals', () =>
        expect(global.globalMatcher).toBe(undefined));
    });

    describe('with behavior.init.reinstallApp = false', () => {
      beforeEach(() => {
        detoxConfig.behavior.init.reinstallApp = false;
      });

      beforeEach(init);

      it('should not reinstall the app', () => {
        expect(runtimeDevice.uninstallApp).not.toHaveBeenCalled();
        expect(runtimeDevice.installApp).not.toHaveBeenCalled();
      });
    });

    describe('and it gets an error event', () => {
      beforeEach(init);

      it(`should log EMIT_ERROR if the internal emitter throws an error`, async () => {
        const emitterErrorCallback = eventEmitter.errorCallback();

        const error = new Error();
        emitterErrorCallback({ error, eventName: 'mockEvent' });

        expect(logger.error).toHaveBeenCalledWith(
          { event: 'EMIT_ERROR', fn: 'mockEvent' },
          expect.stringMatching(/^Caught an exception.*mockEvent/),
          error
        );
      });
    });

    describe('and environment validation fails', () => {
      it('should fail with an error', async () => {
        envValidator.validate.mockRejectedValue(new Error('Mock validation failure'));
        await expect(init).rejects.toThrowError('Mock validation failure');
      });
    });

    describe('and allocation fails', () => {
      it('should fail with an error', async () => {
        deviceAllocator.allocate.mockRejectedValue(new Error('Mock validation failure'));
        await expect(init).rejects.toThrowError('Mock validation failure');
      });
    });
  });

  describe('when DetoxWorker#@onTestStart() is called', () => {
    beforeEach(async () => {
      detox = await new Detox(detoxContext).init();
    });

    it('should validate test summary object', async () => {
      await expect(detox.onTestStart('Test')).rejects.toThrowError(
        /Invalid test summary was passed/
      );
    });

    it('should validate test summary status', async () => {
      await expect(detox.onTestStart({
        ...testSummaries.running(),
        status: undefined,
      })).rejects.toThrowError(/Invalid test summary status/);
    });

    it('should validate test summary status', async () => {
      await expect(detox.onTestStart({
        ...testSummaries.running(),
        status: undefined,
      })).rejects.toThrowError(/Invalid test summary status/);
    });

    describe('with a valid test summary', () => {
      beforeEach(() => detox.onTestStart(testSummaries.running()));

      it('should notify artifacts manager about "testStart', () =>
        expect(artifactsManager.onTestStart).toHaveBeenCalledWith(testSummaries.running()));

      it('should not relaunch app', async () => {
        await detox.onTestStart(testSummaries.running());
        expect(runtimeDevice.launchApp).not.toHaveBeenCalled();
      });

      it('should not dump pending network requests', async () => {
        await detox.onTestStart(testSummaries.running());
        expect(client().dumpPendingRequests).not.toHaveBeenCalled();
      });
    });
  });

  describe('when DetoxWorker#@onTestDone() is called', () => {
    beforeEach(async () => {
      detox = await new Detox(detoxContext).init();
      await detox.onTestStart(testSummaries.running());
    });

    it('should validate non-object test summary', () =>
      expect(detox.onTestDone).rejects.toThrowError(/Invalid test summary was passed/));

    it('should validate against invalid test summary status', () =>
      expect(detox.onTestDone({})).rejects.toThrowError(/Invalid test summary status/));

    describe('with a passing test summary', () => {
      beforeEach(() => detox.onTestDone(testSummaries.passed()));

      it('should notify artifacts manager about "testDone"', () =>
        expect(artifactsManager.onTestDone).toHaveBeenCalledWith(testSummaries.passed()));
    });

    describe('with a failed test summary (due to failed asseration)', () => {
      beforeEach(() => detox.onTestDone(testSummaries.failed()));

      it('should not dump pending network requests', () =>
        expect(client().dumpPendingRequests).not.toHaveBeenCalled());
    });

    describe('with a failed test summary (due to a timeout)', () => {
      beforeEach(() => detox.onTestDone(testSummaries.timedOut()));

      it('should dump pending network requests', () =>
        expect(client().dumpPendingRequests).toHaveBeenCalled());
    });
  });

  describe('when DetoxWorker#cleanup() is called', () => {
    let deferred;
    let initPromise;

    const startInit = () => {
      detox = new Detox(detoxContext);
      initPromise = detox.init();
    };

    beforeEach(() => {
      deferred = new Deferred();
    });

    describe('before detox.init()', () => {
      describe('has been called', () => {
        it(`should not throw`, async () => {
          await expect(new Detox(detoxContext).cleanup()).resolves.not.toThrowError();
        });

        it(`should not try to create a Websocket client`, async () => {
          detox = new Detox(detoxContext);
          await expect(Promise.all([detox.cleanup(), detox.init()])).resolves.not.toThrowError();
          await expect(Client).not.toHaveBeenCalled();
        });
      });

      describe('connects WS client', () => {
        beforeEach(() => Client.setInfiniteConnect());
        beforeEach(startInit);

        it(`should stop the execution and skip creation of the invocation manager`, async () => {
          await expect(detox.cleanup()).resolves.not.toThrow();
          await expect(initPromise).resolves.not.toThrow();
          await expect(invocationManager()).not.toBeDefined();
        });
      });

      describe('validates the config', () => {
        beforeEach(() => {
          envValidator.validate.mockReturnValue(deferred.promise);
        });

        beforeEach(startInit);

        it(`should stop the execution and skip allocating the device`, async () => {
          await expect(detox.cleanup()).resolves.not.toThrowError();
          deferred.resolve();
          await expect(initPromise).resolves.toBe(detox);
          await expect(deviceAllocator.allocate).not.toHaveBeenCalled();
        });
      });

      describe('allocates the device', () => {
        beforeEach(() => {
          deviceAllocator.allocate.mockReturnValue(deferred.promise);
        });

        beforeEach(startInit);

        it(`should stop the execution and skip uninstall the app`, async () => {
          await expect(detox.cleanup()).resolves.not.toThrowError();
          deferred.resolve();
          await expect(initPromise).resolves.toBe(detox);
          await expect(runtimeDevice.installUtilBinaries).not.toHaveBeenCalled();
        });
      });

      describe('before util binaries have been installed', () => {
        beforeEach(() => {
          runtimeDevice.installUtilBinaries.mockReturnValue(deferred.promise);
        });

        beforeEach(startInit);

        it(`should stop the execution and skip uninstalling the app`, async () => {
          await expect(detox.cleanup()).resolves.not.toThrowError();
          deferred.resolve();
          await expect(initPromise).resolves.toBe(detox);
          await expect(runtimeDevice.uninstallApp).not.toHaveBeenCalled();
        });
      });

      describe('before app has been uninstalled', () => {
        beforeEach(() => {
          runtimeDevice.uninstallApp.mockReturnValue(deferred.promise);
        });

        beforeEach(startInit);

        it(`should stop the execution and skip installing the app`, async () => {
          await expect(detox.cleanup()).resolves.not.toThrowError();
          deferred.resolve();
          await expect(initPromise).resolves.not.toThrowError();
          await expect(runtimeDevice.installApp).not.toHaveBeenCalled();
        });
      });

      describe('before app has been installed', () => {
        beforeEach(() => {
          runtimeDevice.installApp.mockReturnValue(deferred.promise);
        });

        beforeEach(startInit);

        it(`should not throw, but should reject detox.init() promise`, async () => {
          await expect(detox.cleanup()).resolves.not.toThrowError();
          deferred.resolve();
          await expect(initPromise).resolves.not.toThrowError();
        });
      });
    });

    describe('after detox.init()', () => {
      beforeEach(async () => {
        detox = new Detox(detoxContext);
        await detox.init();
      });

      describe('if the device has not been allocated', () => {
        beforeEach(async () => {
          await detox.cleanup();
        });

        it(`should omit calling runtimeDevice._cleanup()`, async () => {
          await detox.cleanup();
          expect(runtimeDevice._cleanup).toHaveBeenCalledTimes(1);
        });
      });

      describe('if the device has been allocated', function() {
        beforeEach(async () => {
          await detox.cleanup();
        });

        it(`should call runtimeDevice._cleanup()`, () =>
          expect(runtimeDevice._cleanup).toHaveBeenCalled());

        it(`should not shutdown the device`, () =>
          expect(deviceAllocator.free).toHaveBeenCalledWith(fakeCookie, { shutdown: false }));

        it(`should trigger artifactsManager.onBeforeCleanup()`, () =>
          expect(artifactsManager.onBeforeCleanup).toHaveBeenCalled());

        it(`should dump pending network requests`, () =>
          expect(client().dumpPendingRequests).toHaveBeenCalled());

        it(`should clean up the exposed globals`, () =>
          expect(global).not.toHaveProperty('device'));
      });
    });

    describe('when behavior.cleanup.shutdownDevice = true', () => {
      beforeEach(async () => {
        detoxConfig.behavior.cleanup.shutdownDevice = true;
        detox = await new Detox(detoxContext).init();
      });

      it(`should shut the device down on detox.cleanup()`, async () => {
        await detox.cleanup();
        expect(deviceAllocator.free).toHaveBeenCalledWith(fakeCookie, { shutdown: true });
      });

      describe('if the device has not been allocated', () => {
        beforeEach(() => detox.cleanup());

        it(`should omit the shutdown`, async () => {
          await detox.cleanup();
          expect(deviceAllocator.free).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('when behavior.init.exposeGlobals = false', () => {
      beforeEach(async () => {
        detoxConfig.behavior.init.exposeGlobals = false;
        detox = await new Detox(detoxContext).init();
      });

      it(`should not clean up the existing global properties`, async () => {
        global.device = 'foo';
        await detox.cleanup();
        expect(global.device).toBe('foo');
      });
    });
  });

  describe.each([
    ['onRunDescribeStart', { name: 'testSuiteName' }],
    ['onTestStart', testSummaries.running()],
    ['onHookFailure', { error: new Error() }],
    ['onTestFnFailure', { error: new Error() }],
    ['onTestDone', testSummaries.passed()],
    ['onRunDescribeFinish', { name: 'testSuiteName' }],
  ])('when DetoxWorker#@%s(%j) is called', (method, arg) => {
    beforeEach(async () => {
      detox = await new Detox(detoxContext).init();
    });

    it(`should pass it through to artifactsManager.${method}()`, async () => {
      await detox[method](arg);
      expect(artifactsManager[method]).toHaveBeenCalledWith(arg);
    });
  });

  function mockEnvironmentFactories() {
    const EnvValidator = jest.genMockFromModule('./validation/EnvironmentValidatorBase');
    const EnvValidatorFactory = jest.genMockFromModule('./validation/factories').External;
    envValidator = new EnvValidator();
    envValidatorFactory = new EnvValidatorFactory();
    envValidatorFactory.createValidator.mockReturnValue(envValidator);

    const ArtifactsManager = jest.genMockFromModule('./artifacts/ArtifactsManager');
    const ArtifactsManagerFactory = jest.genMockFromModule('./artifacts/factories').External;
    artifactsManager = new ArtifactsManager();
    artifactsManagerFactory = new ArtifactsManagerFactory();
    artifactsManagerFactory.createArtifactsManager.mockReturnValue(artifactsManager);

    const MatchersFactory = jest.genMockFromModule('./matchers/factories/index').External;
    matchersFactory = new MatchersFactory();

    const DeviceAllocator = jest.genMockFromModule('./devices/allocation/DeviceAllocator');
    const DeviceAllocatorFactory = jest.genMockFromModule('./devices/allocation/factories').External;
    deviceAllocator = new DeviceAllocator();
    deviceAllocatorFactory = new DeviceAllocatorFactory();
    deviceAllocatorFactory.createDeviceAllocator.mockReturnValue(deviceAllocator);
    deviceAllocator.allocate.mockResolvedValue(fakeCookie);

    const RuntimeDevice = jest.genMockFromModule('./devices/runtime/RuntimeDevice');
    const RuntimeDeviceFactory = jest.genMockFromModule('./devices/runtime/factories').External;
    runtimeDevice = new RuntimeDevice();
    runtimeDeviceFactory = new RuntimeDeviceFactory();
    runtimeDeviceFactory.createRuntimeDevice.mockReturnValue(runtimeDevice);
  }
});
