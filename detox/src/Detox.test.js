const configuration = require('./configuration');
const schemes = require('./configurations.mock');
const testSummaries = require('./artifacts/__mocks__/testSummaries.mock');

describe.skip('Detox', () => {
  let client;
  let mockLogger;
  let fs;
  let Detox;
  let detox;

  let artifactsConfig;
  let behaviorConfig;
  let deviceConfig;
  let sessionConfig;

  let configuration;

  beforeEach(async () => {
    jest.mock('./utils/logger');
    jest.mock('./devices/Device');
    jest.mock('./client/Client');
    jest.mock('./server/DetoxServer');
  });

  describe('', () => {
    beforeEach(() => {
      const detoxConfig = {
        selectedConfiguration: 'test',
        configurations: {
          test: {

          },
        },
      };

      deviceConfig = configuration.composeDeviceConfig(detoxConfig);
      artifactsConfig = configuration.composeArtifactsConfig({
        configurationName: detoxConfig.selectedConfiguration,
        deviceConfig,
        detoxConfig,
        cliConfig: {},
      });
      behaviorConfig = configuration.composeBehaviorConfig({
        detoxConfig,
        deviceConfig,
      });
      sessionConfig = configuration.composeSessionConfig({
        detoxConfig,
        deviceConfig,
      });

    });

  });

  it(`Calling detox.cleanup() before .init() should pass without exceptions`, async () => {
    process.env.cleanup = true;
    Detox = require('./Detox');

    detox = new Detox({deviceConfig: validDeviceConfig});
    expect(() => detox.cleanup()).not.toThrowError();
  });

  it(`Calling detox.init() twice returns the same promise`, async () => {
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfig});
    const promise1 = await detox.init();
    const promise2 = await detox.init();
    expect(promise1).toBe(promise2);
  });

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

  it(`One valid device, detox should init with generated session config and default to this device`, async () => {
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfig});
    await detox.init();
    expect(clientMockData.lastConstructorArguments[0]).toBeDefined();
  });

  it(`throws if device type is not supported`, async () => {
    let exception = undefined;

    try {
      Detox = require('./Detox');
      detox = new Detox({deviceConfig: invalidDeviceTypeConfig});
      await detox.init();
    } catch (e) {
      exception = e;
    }

    expect(exception).toBeDefined();
  });

  it(`One valid device, detox should use session config and default to this device`, async () => {
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfig, session: validSession});
    await detox.init();

    expect(clientMockData.lastConstructorArguments[0]).toBe(validSession);
  });

  it(`cleanup on a non initialized detox should not throw`, async () => {
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: invalidDeviceConfig});
    detox.cleanup();
  });

  it(`Detox should use session defined per configuration `, async () => {
    process.env.configuration = 'ios.sim.none';
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfigWithSession});
    await detox.init();

    const expectedSession = validDeviceConfigWithSession.session;
    expect(clientMockData.lastConstructorArguments[0]).toBe(expectedSession);
  });

  it(`Detox should prefer session defined per configuration over common session`, async () => {
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfigWithSession, session: {}});
    await detox.init();

    const expectedSession = validDeviceConfigWithSession.session;
    expect(clientMockData.lastConstructorArguments[0]).toBe(expectedSession);
  });

  it('exports globals by default', async () => {
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfigWithSession});
    await detox.init();
    expect(global.device).toBeDefined();
  });

  it(`doesn't exports globals if requested`, async () => {
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfigWithSession});
    await detox.init({initGlobals: false});
    expect(global.device).not.toBeDefined();
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

  it(`should register an async nonresponsiveness listener`, async () => {
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfigWithSession});

    await detox.init();

    expect(client.setNonresponsivenessListener).toHaveBeenCalled();
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
    let artifactsManager;

    beforeEach(async () => {
      jest.mock('./artifacts/ArtifactsManager');
      Detox = require('./Detox');
      detox = new Detox({deviceConfig: validDeviceConfig});
      await detox.init();
      artifactsManager = detox._artifactsManager; // TODO: rewrite to avoid accessing private fields
    });

    it(`Calling detox.beforeEach() will trigger artifacts manager .onTestStart`, async () => {
      const testSummary = testSummaries.running();
      await detox.beforeEach(testSummary);

      expect(artifactsManager.onTestStart).toHaveBeenCalledWith(testSummary);
    });

    it(`Calling detox.beforeEach() and detox.afterEach() with a deprecated signature will throw an exception`, async () => {
      const { title, fullName, status } = testSummaries.running();

      await expect(detox.beforeEach(title, fullName, status)).rejects.toThrowError();
      expect(artifactsManager.onTestStart).not.toHaveBeenCalled();

      await expect(detox.afterEach(title, fullName, status)).rejects.toThrowError();
      expect(artifactsManager.onTestDone).not.toHaveBeenCalled();
    });

    it(`Calling detox.beforeEach() and detox.afterEach() with incorrect test status will throw an exception`, async () => {
      const testSummary = { ...testSummaries.running(), status: 'incorrect status' };

      await expect(detox.beforeEach(testSummary)).rejects.toThrowError();
      expect(artifactsManager.onTestStart).not.toHaveBeenCalled();

      await expect(detox.afterEach(testSummary)).rejects.toThrowError();
      expect(artifactsManager.onTestDone).not.toHaveBeenCalled();
    });

    it(`Calling detox.afterEach() should trigger artifactsManager.onTestDone`, async () => {
      const testSummary = testSummaries.passed();
      await detox.afterEach(testSummary);

      expect(artifactsManager.onTestDone).toHaveBeenCalledWith(testSummary);
    });

    it(`Calling detox.cleanup() should trigger artifactsManager.onBeforeCleanup()`, async () => {
      await detox.cleanup();
      expect(artifactsManager.onBeforeCleanup).toHaveBeenCalledTimes(1);
    });

    it(`should trigger artifactsManager.onSuiteStart`, async() => {
      const suite = {name: 'testSuiteName'};

      await detox.suiteStart(suite);

      expect(artifactsManager.onSuiteStart).toHaveBeenCalledWith(suite);
    });

    it(`should trigger artifactsManager.onSuiteEnd`, async() => {
      const suite = {name: 'testSuiteName'};

      await detox.suiteEnd(suite);

      expect(artifactsManager.onSuiteEnd).toHaveBeenCalledWith(suite);
    });
  });

  describe('.behaviorConfig', () => {
    let behaviorConfig;

    beforeEach(() => {
      behaviorConfig = {};
    });

    function getDetox() {
      Detox = require('./Detox');
      detox = new Detox({
        behaviorConfig,
        deviceConfig: validDeviceConfig,
      });
    }

    describe('.init', () => {
      describe('.exposeGlobals', () => {
        beforeEach(() => {

        })

      });

      describe('.reinstallApp', () => {

      });

      describe('.launchApp', () => {

      });

    });

  });
});
