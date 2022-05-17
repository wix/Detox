// @ts-nocheck
const testSummaries = require('../../../src/artifacts/__mocks__/testSummaries.mock');
const configuration = require('../../../src/configuration');

jest.mock('../../../src/utils/logger');
jest.mock('../../../src/client/Client');
jest.mock('../../../src/utils/AsyncEmitter');
jest.mock('../../../src/invoke');
jest.mock('../../../src/utils/wrapWithStackTraceCutter');
jest.mock('../../../src/environmentFactory');

describe('Detox', () => {
  const fakeCookie = {
    chocolate: 'yum',
  };

  const client = () => Client.mock.instances[0];
  const invocationManager = () => invoke.InvocationManager.mock.instances[0];
  const eventEmitter = () => AsyncEmitter.mock.instances[0];
  eventEmitter.errorCallback = () => AsyncEmitter.mock.calls[0][0].onError;

  const suspendMethod = (obj, methodName) => {
    let releaseFn;
    const promise = new Promise((resolve) => { releaseFn = resolve; });
    obj[methodName].mockReturnValue(promise);
    return releaseFn;
  };
  const suspendAllocation = () => suspendMethod(deviceAllocator, 'allocate');
  const suspendAppUninstall = () => suspendMethod(runtimeDevice, 'uninstallApp');
  const suspendAppInstall = () => suspendMethod(runtimeDevice, 'installApp');

  let detoxConfig;

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
  let lifecycleSymbols;

  beforeEach(() => {
    mockEnvironmentFactories();

    const environmentFactory = require('../../../src/environmentFactory');
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

    logger = require('../../../src/utils/logger');
    invoke = require('../../../src/invoke');
    Client = require('../../../src/client/Client');
    AsyncEmitter = require('../../../src/utils/AsyncEmitter');
    lifecycleSymbols = require('../integration').lifecycle;

    Detox = require('./DetoxWorkerContext');
  });

  describe('when detox.init() is called', () => {
    let mockGlobalMatcher;

    const init = async () => {
      detox = await new Detox(detoxConfig).init();
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

      it('should create a new Client with a random sessionId', () =>
        expect(Client).toHaveBeenCalledWith(expect.objectContaining({
          server: process.env.DETOX_WSS_ADDRESS,
          sessionId: expect.any(String),
        })));

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
        expect(deviceAllocator.allocate).toHaveBeenCalledWith(detoxConfig.deviceConfig);
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
            appsConfig: detoxConfig.appsConfig,
            behaviorConfig: detoxConfig.behaviorConfig,
            deviceConfig: detoxConfig.deviceConfig,
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
        expect(artifactsManagerFactory.createArtifactsManager).toHaveBeenCalledWith(detoxConfig.artifactsConfig, expect.objectContaining({
          client: client(),
          eventEmitter: eventEmitter(),
        })));

      it('should prepare the device', () =>
        expect(runtimeDevice._prepare).toHaveBeenCalled());

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

    it('should return the same promise on consequent calls', () => {
      detox = new Detox(detoxConfig);

      const initPromise1 = detox.init();
      const initPromise2 = detox.init();

      expect(initPromise1).toBe(initPromise2);
    });

    describe('with multiple apps', () => {
      beforeEach(() => {
        detoxConfig.appsConfig['extraApp'] = {
          type: 'ios.app',
          binaryPath: 'path/to/app',
        };

        detoxConfig.appsConfig['extraAppWithAnotherArguments'] = {
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

        expect(runtimeDevice.selectApp).toHaveBeenCalledTimes(3);
        expect(runtimeDevice.selectApp.mock.calls[0]).toEqual(['default']);
        expect(runtimeDevice.selectApp.mock.calls[1]).toEqual(['extraApp']);
        expect(runtimeDevice.selectApp.mock.calls[2]).toEqual([null]);
      });
    });

    describe('with behaviorConfig.init.exposeGlobals = false', () => {
      beforeEach(() => {
        detoxConfig.behaviorConfig.init.exposeGlobals = false;
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

    describe('with behaviorConfig.init.reinstallApp = false', () => {
      beforeEach(() => {
        detoxConfig.behaviorConfig.init.reinstallApp = false;
      });

      beforeEach(init);

      it('should prepare the device', () =>
        expect(runtimeDevice._prepare).toHaveBeenCalled());

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

  describe('when detox.beforeEach() is called', () => {
    describe('before detox.init() is called', () => {
      beforeEach(() => {
        detox = new Detox(detoxConfig);
      });

      it('should throw an error', () =>
        expect(detox.beforeEach(testSummaries.running())).rejects.toThrowError(/of null/));
    });

    describe('before detox.init() is finished', () => {
      beforeEach(() => {
        detox = new Detox(detoxConfig);
      });

      it('should throw an error', async () => {
        const initPromise = detox.init();
        await expect(detox.beforeEach(testSummaries.running())).rejects.toThrowError(/Aborted detox.init/);
        await expect(initPromise).rejects.toThrowError(/Aborted detox.init/);
      });
    });

    describe('after detox.init() is finished', () => {
      beforeEach(async () => {
        detox = await new Detox(detoxConfig).init();
      });

      it('should validate test summary object', async () => {
        await expect(detox.beforeEach('Test')).rejects.toThrowError(
          /Invalid test summary was passed/
        );
      });

      it('should validate test summary status', async () => {
        await expect(detox.beforeEach({
          ...testSummaries.running(),
          status: undefined,
        })).rejects.toThrowError(/Invalid test summary status/);
      });

      it('should validate test summary status', async () => {
        await expect(detox.beforeEach({
          ...testSummaries.running(),
          status: undefined,
        })).rejects.toThrowError(/Invalid test summary status/);
      });

      describe('with a valid test summary', () => {
        beforeEach(() => detox.beforeEach(testSummaries.running()));

        it('should trace DETOX_BEFORE_EACH event', () =>
          expect(logger.trace).toHaveBeenCalledWith(
            expect.objectContaining({ event: 'DETOX_BEFORE_EACH' }),
            expect.any(String)
          ));

        it('should notify artifacts manager about "testStart', () =>
          expect(artifactsManager.onTestStart).toHaveBeenCalledWith(testSummaries.running()));

        it('should not relaunch app', async () => {
          await detox.beforeEach(testSummaries.running());
          expect(runtimeDevice.launchApp).not.toHaveBeenCalled();
        });

        it('should not dump pending network requests', async () => {
          await detox.beforeEach(testSummaries.running());
          expect(client().dumpPendingRequests).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('when detox.afterEach() is called', () => {
    describe('before detox.init() is called', () => {
      beforeEach(() => {
        detox = new Detox(detoxConfig);
      });

      it('should throw an error', () =>
        expect(detox.afterEach(testSummaries.running())).rejects.toThrowError(/of null/));
    });

    describe('before detox.init() is finished', () => {
      beforeEach(() => {
        detox = new Detox(detoxConfig);
      });

      it('should throw an error', async () => {
        const initPromise = detox.init();
        await expect(detox.afterEach(testSummaries.running())).rejects.toThrowError(/Aborted detox.init/);
        await expect(initPromise).rejects.toThrowError(/Aborted detox.init/);
      });
    });

    describe('after detox.init() is finished', () => {
      beforeEach(async () => {
        detox = await new Detox(detoxConfig).init();
        await detox.beforeEach(testSummaries.running());
      });

      it('should validate non-object test summary', () =>
        expect(detox.afterEach()).rejects.toThrowError(/Invalid test summary was passed/));

      it('should validate against invalid test summary status', () =>
        expect(detox.afterEach({})).rejects.toThrowError(/Invalid test summary status/));

      describe('with a passing test summary', () => {
        beforeEach(() => detox.afterEach(testSummaries.passed()));

        it('should trace DETOX_AFTER_EACH event', () =>
          expect(logger.trace).toHaveBeenCalledWith(
            expect.objectContaining({ event: 'DETOX_AFTER_EACH' }),
            expect.any(String)
          ));

        it('should notify artifacts manager about "testDone"', () =>
          expect(artifactsManager.onTestDone).toHaveBeenCalledWith(testSummaries.passed()));
      });

      describe('with a failed test summary (due to failed asseration)', () => {
        beforeEach(() => detox.afterEach(testSummaries.failed()));

        it('should not dump pending network requests', () =>
          expect(client().dumpPendingRequests).not.toHaveBeenCalled());
      });

      describe('with a failed test summary (due to a timeout)', () => {
        beforeEach(() => detox.afterEach(testSummaries.timedOut()));

        it('should dump pending network requests', () =>
          expect(client().dumpPendingRequests).toHaveBeenCalled());
      });
    });
  });

  describe('when detox.cleanup() is called', () => {
    let initPromise;

    const startInit = () => {
      detox = new Detox(detoxConfig);
      initPromise = detox.init();
    };

    describe('before detox.init() has been called', () => {
      it(`should not throw`, async () =>
        await expect(new Detox(detoxConfig).cleanup()).resolves.not.toThrowError());
    });

    describe('before client has connected', () => {
      beforeEach(() => Client.setInfiniteConnect());
      beforeEach(startInit);

      it(`should not throw, but should reject detox.init() promise`, async () => {
        await expect(detox.cleanup()).resolves.not.toThrowError();
        await expect(initPromise).rejects.toThrowError(/Aborted detox.init.*execution/);
      });
    });

    describe('before device has been allocated', () => {
      let releaseFn;
      beforeEach(() => { releaseFn = suspendAllocation(); });
      beforeEach(startInit);
      afterEach(() => releaseFn());

      it(`should not throw, but should reject detox.init() promise`, async () => {
        await expect(detox.cleanup()).resolves.not.toThrowError();
        await expect(initPromise).rejects.toThrowError(/Aborted detox.init.*execution/);
      });
    });

    describe('before app has been uninstalled', () => {
      let releaseFn;
      beforeEach(() => { releaseFn = suspendAppUninstall(); });
      beforeEach(startInit);
      afterEach(() => releaseFn());

      it(`should not throw, but should reject detox.init() promise`, async () => {
        await expect(detox.cleanup()).resolves.not.toThrowError();
        await expect(initPromise).rejects.toThrowError(/Aborted detox.init.*execution/);
      });
    });

    describe('before app has been installed', () => {
      let releaseFn;
      beforeEach(() => { releaseFn = suspendAppInstall(); });
      beforeEach(startInit);
      afterEach(() => releaseFn());

      it(`should not throw, but should reject detox.init() promise`, async () => {
        await expect(detox.cleanup()).resolves.not.toThrowError();
        await expect(initPromise).rejects.toThrowError(/Aborted detox.init.*execution/);
      });
    });

    describe('after detox.init()', () => {
      beforeEach(async () => {
        detox = new Detox(detoxConfig);
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
      });
    });

    describe('when behaviorConfig.cleanup.shutdownDevice = true', () => {
      beforeEach(async () => {
        detoxConfig.behaviorConfig.cleanup.shutdownDevice = true;
        detox = await new Detox(detoxConfig).init();
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
  });

  describe.each([
    ['onRunStart', null],
    ['onRunDescribeStart', { name: 'testSuiteName' }],
    ['onTestStart', testSummaries.running()],
    ['onHookStart', null],
    ['onHookFailure', { error: new Error() }],
    ['onHookSuccess', null],
    ['onTestFnStart', null],
    ['onTestFnFailure', { error: new Error() }],
    ['onTestFnSuccess', null],
    ['onTestDone', testSummaries.passed()],
    ['onRunDescribeFinish', { name: 'testSuiteName' }],
    ['onRunFinish', null],
  ])('when detox[symbols.%s](%j) is called', (method, arg) => {
    beforeEach(async () => {
      detox = await new Detox(detoxConfig).init();
    });

    it(`should pass it through to artifactsManager.${method}()`, async () => {
      await detox[lifecycleSymbols[method]](arg);
      expect(artifactsManager[method]).toHaveBeenCalledWith(arg);
    });
  });

  describe('global context', () => {
    const configs = {
      deviceConfig: {
        mock: 'config',
      },
    };

    let environmentFactory;
    let lifecycleHandler;
    beforeEach(() => {
      environmentFactory = require('../../../src/environmentFactory');

      lifecycleHandler = {
        globalInit: jest.fn(),
        globalCleanup: jest.fn(),
      };
    });

    const givenGlobalLifecycleHandler = () => environmentFactory.createGlobalLifecycleHandler.mockReturnValue(lifecycleHandler);
    const givenNoGlobalLifecycleHandler = () => environmentFactory.createGlobalLifecycleHandler.mockReturnValue(undefined);

    it(`should invoke the handler's init`, async () => {
      givenGlobalLifecycleHandler();

      await Detox.globalInit(configs);
      expect(lifecycleHandler.globalInit).toHaveBeenCalled();
      expect(environmentFactory.createGlobalLifecycleHandler).toHaveBeenCalledWith(configs.deviceConfig);
    });

    it(`should not invoke init if no handler was resolved`, async () => {
      givenNoGlobalLifecycleHandler();
      await Detox.globalInit(configs);
    });

    it(`should invoke the handler's cleanup`, async () => {
      givenGlobalLifecycleHandler();

      await Detox.globalCleanup(configs);
      expect(lifecycleHandler.globalCleanup).toHaveBeenCalled();
      expect(environmentFactory.createGlobalLifecycleHandler).toHaveBeenCalledWith(configs.deviceConfig);
    });

    it(`should not invoke cleanup if no handler was resolved`, async () => {
      givenNoGlobalLifecycleHandler();
      await Detox.globalCleanup(configs);
    });
  });

  function mockEnvironmentFactories() {
    const EnvValidator = jest.genMockFromModule('../../../src/validation/EnvironmentValidatorBase');
    const EnvValidatorFactory = jest.genMockFromModule('../../../src/validation/factories').External;
    envValidator = new EnvValidator();
    envValidatorFactory = new EnvValidatorFactory();
    envValidatorFactory.createValidator.mockReturnValue(envValidator);

    const ArtifactsManager = jest.genMockFromModule('../../../src/artifacts/ArtifactsManager');
    const ArtifactsManagerFactory = jest.genMockFromModule('../../../src/artifacts/factories').External;
    artifactsManager = new ArtifactsManager();
    artifactsManagerFactory = new ArtifactsManagerFactory();
    artifactsManagerFactory.createArtifactsManager.mockReturnValue(artifactsManager);

    const MatchersFactory = jest.genMockFromModule('../../../src/matchers/factories/index').External;
    matchersFactory = new MatchersFactory();

    const DeviceAllocator = jest.genMockFromModule('../../../src/devices/allocation/DeviceAllocator');
    const DeviceAllocatorFactory = jest.genMockFromModule('../../../src/devices/allocation/factories').External;
    deviceAllocator = new DeviceAllocator();
    deviceAllocatorFactory = new DeviceAllocatorFactory();
    deviceAllocatorFactory.createDeviceAllocator.mockReturnValue(deviceAllocator);
    deviceAllocator.allocate.mockResolvedValue(fakeCookie);

    const RuntimeDevice = jest.genMockFromModule('../../../src/devices/runtime/RuntimeDevice');
    const RuntimeDeviceFactory = jest.genMockFromModule('../../../src/devices/runtime/factories').External;
    runtimeDevice = new RuntimeDevice();
    runtimeDeviceFactory = new RuntimeDeviceFactory();
    runtimeDeviceFactory.createRuntimeDevice.mockReturnValue(runtimeDevice);
  }
});
