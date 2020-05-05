const _ = require('lodash');
const configuration = require('./configuration');
const testSummaries = require('./artifacts/__mocks__/testSummaries.mock');

jest.mock('./utils/logger');
jest.mock('./devices/DriverRegistry');
jest.mock('./artifacts/ArtifactsManager');
jest.mock('./client/Client');
jest.mock('./devices/Device');

jest.mock('./server/DetoxServer', () => {
  const FakeServer = jest.genMockFromModule('./server/DetoxServer');
  return jest.fn().mockImplementation(() => new FakeServer());
});

describe('Detox', () => {
  let detoxConfig;

  let Device;
  let FakeDriverRegistry;
  let Client;
  let DetoxServer;
  let ArtifactsManager;
  let Detox;
  let detox;

  function client() {
    return Client.mock.instances[0];
  }

  function device() {
    return Device.mock.instances[0];
  }

  function artifactsManager() {
    return ArtifactsManager.mock.instances[0];
  }

  beforeEach(async () => {
    detoxConfig = await configuration.composeDetoxConfig({
      configurations: {
        test: {
          type: 'fake.device',
          binaryPath: '/tmp/fake/path',
          device: 'a device',
        },
      },
    });

    Device = require('./devices/Device');
    FakeDriverRegistry = require('./devices/DriverRegistry');
    ArtifactsManager = require('./artifacts/ArtifactsManager');
    Client = require('./client/Client');
    DetoxServer = require('./server/DetoxServer');
    Detox = require('./Detox');

    onClientCreate = () => {};
    onDeviceCreate = () => {};
  });

  describe('when detox.init() is called', () => {
    let globalMatcher;

    const init = async () => {
      detox = await new Detox(detoxConfig).init();
    };

    beforeEach(() => {
      FakeDriverRegistry.FakeDriver.matchers.globalMatcher = globalMatcher = jest.fn();
    });

    afterEach(() => {
      delete FakeDriverRegistry.FakeDriver.matchers.globalMatcher;

      // cleanup spilled globals after detox.init()
      delete global.device;
      delete global.globalMatcher;
    });

    describe('', () => {
      beforeEach(init);

      it('should create a DetoxServer automatically', () =>
        expect(DetoxServer).toHaveBeenCalledWith(
          expect.objectContaining({
            port: expect.anything(),
          })));

      it('should create a new Client', () =>
        expect(Client).toHaveBeenCalledWith(expect.objectContaining({
          server: expect.any(String),
          sessionId: expect.any(String),
        })));

      it('should add a non-responsiveness listener to client ', () =>
        expect(client().setNonresponsivenessListener).toHaveBeenCalledWith(
          expect.any(Function)
        ));

      it('should connect a client to the server', () =>
        expect(client().connect).toHaveBeenCalled());

      it('should resolve a device driver from the registry', () =>
        expect(FakeDriverRegistry.default.resolve).toHaveBeenCalledWith(
          detoxConfig.deviceConfig.type,
          expect.objectContaining({
            client: expect.anything(),
            emitter: expect.anything(),
          })
        ));

      it('should take device driver matchers to Detox', () =>
        expect(detox.globalMatcher).toBe(globalMatcher));

      it('should take device to Detox', () =>
        expect(detox.device).toBe(device()));

      it('should instantiate Device', () =>
        expect(Device).toHaveBeenCalledWith(expect.objectContaining({
          deviceConfig: detoxConfig.deviceConfig,
          emitter: expect.anything(),
          deviceDriver: expect.anything(),
          sessionConfig: expect.anything(),
        })));

      it('should expose device to global', () =>
        expect(global.device).toBe(device()));

      it('should expose device driver matchers to global', () =>
        expect(global.globalMatcher).toBe(globalMatcher));

      it('should create artifacts manager', () =>
        expect(ArtifactsManager).toHaveBeenCalledWith(detoxConfig.artifactsConfig));

      it('should subscribe artifacts manager to device events', () =>
        expect(artifactsManager().subscribeToDeviceEvents).toHaveBeenCalledWith(
          expect.objectContaining({ on: expect.any(Function) })
        ));

      it('should register plugins in the artifacts manager', () =>
        expect(artifactsManager().registerArtifactPlugins).toHaveBeenCalledWith(
          FakeDriverRegistry.FakeDriver.artifactsPlugins
        ));

      it('should prepare the device', () =>
        expect(device().prepare).toHaveBeenCalled());

      it('should reinstall the app', () => {
        expect(device().uninstallApp).toHaveBeenCalled();
        expect(device().installApp).toHaveBeenCalled();
      });

      it('should launch the app', () => {
        expect(device().launchApp).toHaveBeenCalledWith({
          newInstance: true,
        });
      });

      it('should return itself', () =>
        expect(detox).toBeInstanceOf(Detox));
    });

    it('should return the same promise on consequent calls', () => {
      detox = new Detox(detoxConfig);

      const initPromise1 = detox.init();
      const initPromise2 = detox.init();

      expect(initPromise1).toBe(initPromise2);
    });

    describe('with no sessionConfig.autoStart', () => {
      beforeEach(() => { delete detoxConfig.sessionConfig.autoStart; });
      beforeEach(init);

      it('should not start DetoxServer', () =>
        expect(DetoxServer).not.toHaveBeenCalled());
    });

    describe('with behaviorConfig.init.exposeGlobals = false', () => {
      beforeEach(() => {
        detoxConfig.behaviorConfig.init.exposeGlobals = false;
      });

      beforeEach(init);

      it('should take device driver matchers to Detox', () =>
        expect(detox.globalMatcher).toBe(globalMatcher));

      it('should take device to Detox', () =>
        expect(detox.device).toBe(device()));

      it('should not expose device to globals', () =>
        expect(global.device).toBe(undefined));

      it('should not expose globalMatcher to globals', () =>
        expect(global.globalMatcher).toBe(undefined));
    });

    describe('with behaviorConfig.init.reinstallApp = false', () => {
      beforeEach(() => {
        detoxConfig.behaviorConfig.init.reinstallApp = false;
      });

      beforeEach(init);

      it('should prepare the device', () =>
        expect(device().prepare).toHaveBeenCalled());

      it('should not reinstall the app', () => {
        expect(device().uninstallApp).not.toHaveBeenCalled();
        expect(device().installApp).not.toHaveBeenCalled();
      });

      it('should launch the app', () =>
        expect(device().launchApp).toHaveBeenCalledWith({
          newInstance: true
        }));
    });

    describe('with behaviorConfig.init.launchApp = false', () => {
      beforeEach(() => {
        detoxConfig.behaviorConfig.init.launchApp = false;
      });

      beforeEach(init);

      it('should prepare the device', () =>
        expect(device().prepare).toHaveBeenCalled());

      it('should reinstall the app', () => {
        expect(device().uninstallApp).toHaveBeenCalled();
        expect(device().installApp).toHaveBeenCalled();
      });

      it('should not launch the app', () =>
        expect(device().launchApp).not.toHaveBeenCalled());
    });
  });

  describe.skip('when detox.beforeEach() is called', () => {

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
    })

    describe('before device has been prepared', () => {
      beforeEach(() => Device.setInfiniteMethod('prepare'));
      beforeEach(startInit);

      it(`should not throw, but should reject detox.init() promise`, async () => {
        await expect(detox.cleanup()).resolves.not.toThrowError();
        await expect(initPromise).rejects.toThrowError(/Aborted detox.init.*execution/);
      });
    });

    describe('before app has been uninstalled', () => {
      beforeEach(() => Device.setInfiniteMethod('uninstallApp'));
      beforeEach(startInit);

      it(`should not throw, but should reject detox.init() promise`, async () => {
        await expect(detox.cleanup()).resolves.not.toThrowError();
        await expect(initPromise).rejects.toThrowError(/Aborted detox.init.*execution/);
      });
    });

    describe('before app has been installed', () => {
      beforeEach(() => Device.setInfiniteMethod('installApp'));
      beforeEach(startInit);

      it(`should not throw, but should reject detox.init() promise`, async () => {
        await expect(detox.cleanup()).resolves.not.toThrowError();
        await expect(initPromise).rejects.toThrowError(/Aborted detox.init.*execution/);
      });
    });

    describe('before app has been launched', () => {
      beforeEach(() => Device.setInfiniteMethod('launchApp'));
      beforeEach(startInit);

      it(`should not throw, but should reject detox.init() promise`, async () => {
        await expect(detox.cleanup()).resolves.not.toThrowError();
        await expect(initPromise).rejects.toThrowError(/Aborted detox.init.*execution/);
      });
    });

    describe('after detox.init()', () => {
      beforeEach(startInit);
      beforeEach(() => detox.init());

      it(`should not throw`, async () =>
        await expect(detox.cleanup()).resolves.not.toThrowError());

      it(`should not shutdown the device`, async () => {
        await detox.cleanup();
        expect(device().shutdown).not.toHaveBeenCalled();
      });
    });

    describe('when behaviorConfig.cleanup.shutdownDevice = true', () => {
      beforeEach(async () => {
        detoxConfig.behaviorConfig.cleanup.shutdownDevice = true;
        detox = await new Detox(detoxConfig).init();
      });

      it(`should shutdown the device on detox.cleanup()`, async () => {
        await detox.cleanup();
        expect(device().shutdown).toHaveBeenCalled();
      });
    });
  });

  describe.skip('todo', () => {

    it(`Calling detox.beforeEach() before detox.init() completes, throws error`, async () => {
      Detox = require('./Detox');
      detox = new Detox({deviceConfig: validDeviceConfig});
      const detoxInitPromise = detox.init();
      await expect(detox.beforeEach(testSummaries.running())).rejects.toThrowError(/Aborted detox.init/);
      await expect(detoxInitPromise).rejects.toThrowError(/Aborted detox.init/);
    });

    it(`Calling detox.afterEach() before detox.init() completes, throws error`, async () => {
      Detox = require('./Detox');
      detox = new Detox({deviceConfig: validDeviceConfig});
      const detoxInitPromise = detox.init();
      await expect(detox.afterEach(testSummaries.failed())).rejects.toThrowError(/Aborted detox.init/);
      await expect(detoxInitPromise).rejects.toThrowError(/Aborted detox.init/);
    });

    it(`Calling detox.cleanup() before detox.init() completes makes that .init() throw an error`, async () => {
      Detox = require('./Detox');
      detox = new Detox({deviceConfig: validDeviceConfig});
      const detoxInitPromise = detox.init();
      await detox.cleanup();
      await expect(detoxInitPromise).rejects.toThrowError(/Aborted detox.init/);
    });

    it(`Not passing --cleanup should keep the currently running device up`, async () => {
      Detox = require('./Detox');
      detox = new Detox({deviceConfig: validDeviceConfig});
      await detox.init();
      const device = detox.device;
      await detox.cleanup();
      expect(device.shutdown).toHaveBeenCalledTimes(0);
    });

    it(`cleanup on a non initialized detox should not throw`, async () => {
      Detox = require('./Detox');
      detox = new Detox({deviceConfig: invalidDeviceConfig});
      detox.cleanup();
    });

    it(`Detox should prefer session defined per configuration over common session`, async () => {
      Detox = require('./Detox');
      detox = new Detox({deviceConfig: validDeviceConfigWithSession, session: {}});
      await detox.init();

      const expectedSession = validDeviceConfigWithSession.session;
      expect(clientMockData.lastConstructorArguments[0]).toBe(expectedSession);
    });

    it(`handleAppCrash if client has a pending crash`, async () => {
      client.getPendingCrashAndReset.mockReturnValueOnce('crash');

      Detox = require('./Detox');
      detox = new Detox({deviceConfig: validDeviceConfigWithSession});
      await detox.init();
      await detox.afterEach(testSummaries.failed());
      expect(device.launchApp).toHaveBeenCalledTimes(1);
    });

    it(`handleAppCrash should not dump pending requests if testSummary has no timeout flag`, async () => {
      Detox = require('./Detox');
      detox = new Detox({deviceConfig: validDeviceConfigWithSession});

      await detox.init();
      await detox.afterEach(testSummaries.failed());

      expect(client.dumpPendingRequests).not.toHaveBeenCalled();
    });

    it(`handleAppCrash should dump pending requests if testSummary has timeout flag`, async () => {
      Detox = require('./Detox');
      detox = new Detox({deviceConfig: validDeviceConfigWithSession});

      await detox.init();
      await detox.afterEach(testSummaries.timedOut());
      expect(client.dumpPendingRequests).toHaveBeenCalled();
    });

    it(`should log thread-dump provided by a nonresponsiveness event`, async () => {
      const callbackParams = {
        threadDump: 'mockThreadDump',
      };
      const expectedMessage = [
        'Application nonresponsiveness detected!',
        'On Android, this could imply an ANR alert, which evidently causes tests to fail.',
        'Here\'s the native main-thread stacktrace from the device, to help you out (refer to device logs for the complete thread dump):',
        callbackParams.threadDump,
        'Refer to https://developer.android.com/training/articles/perf-anr for further details.'
      ].join('\n');

      Detox = require('./Detox');
      detox = new Detox({deviceConfig: validDeviceConfigWithSession});

      await detox.init();
      await invokeDetoxCallback();

      expect(mockLogger.warn).toHaveBeenCalledWith({ event: 'APP_NONRESPONSIVE' }, expectedMessage);

      async function invokeDetoxCallback() {
        const callback = client.setNonresponsivenessListener.mock.calls[0][0];
        await callback(callbackParams);
      }
    });

    it('properly instantiates configuration pointing to a plugin driver', async () => {
      let instantiated = false;
      class MockDriverPlugin {
        constructor(config) {
          instantiated = true;
        }
        on() {}
        declareArtifactPlugins() {}
      }
      jest.mock('driver-plugin', () => MockDriverPlugin, { virtual: true });
      const pluginDeviceConfig = {
        "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
        "type": "driver-plugin",
        "name": "MyPlugin"
      };

      Detox = require('./Detox');
      detox = new Detox({deviceConfig: pluginDeviceConfig});
      await detox.init();

      expect(instantiated).toBe(true);
    });

    it(`should log EMIT_ERROR if the internal emitter throws an error`, async () => {
      Detox = require('./Detox');
      detox = new Detox({deviceConfig: validDeviceConfigWithSession});

      const emitter = detox._eventEmitter;
      emitter.on('launchApp', () => { throw new Error('TestError'); });
      await emitter.emit('launchApp');

      expect(mockLogger.error).toHaveBeenCalledWith(
        { event: 'EMIT_ERROR', fn: 'launchApp' },
        expect.stringMatching(/Caught an exception in.*emit.*launchApp.*undefined/),
        expect.any(Error),
      )
    });

    describe('.artifactsManager', () => {
      it(`Calling detox.beforeEach() will trigger artifacts manager .onTestStart`, async () => {
        const testSummary = testSummaries.running();
        await detox.beforeEach(testSummary);

        expect(artifactsManager().onTestStart).toHaveBeenCalledWith(testSummary);
      });

      it(`Calling detox.beforeEach() and detox.afterEach() with a deprecated signature will throw an exception`, async () => {
        const { title, fullName, status } = testSummaries.running();

        await expect(detox.beforeEach(title, fullName, status)).rejects.toThrowError();
        expect(artifactsManager().onTestStart).not.toHaveBeenCalled();

        await expect(detox.afterEach(title, fullName, status)).rejects.toThrowError();
        expect(artifactsManager().onTestDone).not.toHaveBeenCalled();
      });

      it(`Calling detox.beforeEach() and detox.afterEach() with incorrect test status will throw an exception`, async () => {
        const testSummary = { ...testSummaries.running(), status: 'incorrect status' };

        await expect(detox.beforeEach(testSummary)).rejects.toThrowError();
        expect(artifactsManager().onTestStart).not.toHaveBeenCalled();

        await expect(detox.afterEach(testSummary)).rejects.toThrowError();
        expect(artifactsManager().onTestDone).not.toHaveBeenCalled();
      });

      it(`Calling detox.afterEach() should trigger artifactsManager.onTestDone`, async () => {
        const testSummary = testSummaries.passed();
        await detox.afterEach(testSummary);

        expect(artifactsManager().onTestDone).toHaveBeenCalledWith(testSummary);
      });

      it(`Calling detox.cleanup() should trigger artifactsManager.onBeforeCleanup()`, async () => {
        await detox.cleanup();
        expect(artifactsManager().onBeforeCleanup).toHaveBeenCalledTimes(1);
      });

      it(`should trigger artifactsManager.onSuiteStart`, async() => {
        const suite = {name: 'testSuiteName'};

        await detox.suiteStart(suite);

        expect(artifactsManager().onSuiteStart).toHaveBeenCalledWith(suite);
      });

      it(`should trigger artifactsManager.onSuiteEnd`, async() => {
        const suite = {name: 'testSuiteName'};

        await detox.suiteEnd(suite);

        expect(artifactsManager().onSuiteEnd).toHaveBeenCalledWith(suite);
      });
    });
  });
});
