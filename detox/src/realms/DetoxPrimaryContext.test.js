// @ts-nocheck
const _ = require('lodash');

const {
  latestInstanceOf,
  lastCallTo,
  throwErrorImpl,
  suspendCall,
  doBeforeResolved,
  uuidRegexp,
  tempFileRegexp,
} = global;

const workerId = 19;

describe('DetoxPrimaryContext', () => {
  let detoxConfigDriver;

  let fs;
  /** @type {import('../utils/logger')} */
  let logger;

  /** @type {import('../configuration')} */
  let configuration;
  /** @type {import('../ipc/IPCServer')} */
  let IPCServer;
  /** @type {import('../ipc/IPCServer')} */
  let ipcServer;

  let globalLifecycleHandler;
  /** @type {import('../environmentFactory')} */
  let environmentFactory;
  /** @type {import('../devices/DeviceRegistry')} */
  let deviceRegistryIOS;
  /** @type {import('../devices/DeviceRegistry')} */
  let deviceRegistryAndroid;
  /** @type {import('../devices/DeviceRegistry')} */
  let deviceRegistryGenyCloud;
  /** @type {import('../server/DetoxServer')} */
  let DetoxServer;

  /** @type {import('./DetoxInternalsFacade')} */
  let facade;

  let env;

  const detoxServer = () => latestInstanceOf(DetoxServer);
  const detoxWorker = () => {
    const DetoxWorker = require('../DetoxWorker');
    return latestInstanceOf(DetoxWorker);
  };
  const logFinalizer = () => latestInstanceOf(logger.DetoxLogFinalizer);
  const getSignalHandler = () => {
    const onSignalExit = require('signal-exit');
    const [signalHandler] = lastCallTo(onSignalExit);
    return signalHandler;
  };

  beforeEach(() => env = process.env);
  afterEach(() => process.env = { ...env });

  beforeEach(_initDetoxConfig);
  beforeEach(_initExternalMocks);
  beforeEach(_initInternalMocks);
  beforeEach(() => {
    const DetoxPrimaryContext = require('./DetoxPrimaryContext');
    const DetoxInternalsFacade = require('./DetoxInternalsFacade');

    const context = new DetoxPrimaryContext();
    facade = new DetoxInternalsFacade(context);
  });

  describe('when not initialized', () => {
    it('should report status as "inactive"', () => {
      expect(facade.getStatus()).toBe('inactive');
    });

    it('should have a basic session with a random id (GUID)', () => {
      expect(facade.session.id).toMatch(uuidRegexp);
    });

    it('should have an empty config', () => {
      expect(facade.config).toEqual({});
    });

    it('should throw on attempt to get a worker', () => {
      expect(() => facade.worker.id).toThrowErrorMatchingSnapshot();
    });
  });

  describe('when initializing', () => {
    it('should create an IPC server with a valid session state', async () => {
      const expectedIPCServerName = `primary-${process.pid}`;

      await facade.init();

      expect(IPCServer).toHaveBeenCalledWith(expect.objectContaining({
        sessionState: expect.objectContaining({
          id: expect.stringMatching(uuidRegexp),
          detoxIPCServer: expect.stringMatching(expectedIPCServerName)
        }),
      }));
    });

    it('should init the IPC server', async () => {
      await facade.init();
      expect(ipcServer.init).toHaveBeenCalled();
    });

    it('should init the global lifecycle handler', async () => {
      await facade.init();
      expect(globalLifecycleHandler.globalInit).toHaveBeenCalled();
    });

    it('should reset the device registry', async () => {
      detoxConfigDriver.givenIosSimulatorDevice();
      await facade.init();
      expect(deviceRegistryIOS.reset).toHaveBeenCalled();
    });

    it('should not reset the device registry if opted-out of', async () => {
      detoxConfigDriver.givenKeepLockFile(true);
      await facade.init();
      expect(deviceRegistryIOS.reset).not.toHaveBeenCalled();
    });

    it('should reset the genymotion global-shutdown device-registry', async () => {
      detoxConfigDriver.givenGenyCloudDevice();
      await facade.init();
      expect(deviceRegistryAndroid.reset).toHaveBeenCalled();
      expect(deviceRegistryGenyCloud.reset).toHaveBeenCalled();
    });

    describe('given detox-server auto-start enabled via config', () => {
      beforeEach(() => detoxConfigDriver.givenDetoxServerAutostart());

      it('should create the Detox server', async () => {
        const expectedServerArgs = {
          port: 0,
          standalone: false,
        };

        await facade.init();
        expect(DetoxServer).toHaveBeenCalledWith(expectedServerArgs);
      });

      it('should create the Detox server based on a specified port', async () => {
        const port = '666';
        detoxConfigDriver.givenDetoxServerPort(port);

        const expectedServerArgs = {
          port,
          standalone: false,
        };
        await facade.init();
        expect(DetoxServer).toHaveBeenCalledWith(expectedServerArgs);
      });

      it('should start the server', async () => {
        await facade.init();
        expect(detoxServer().open).toHaveBeenCalled();
      });
    });

    describe('given detox-server auto-start disabled via config', () => {
      it('should not create a server', async () => {
        await facade.init();
        expect(DetoxServer).not.toHaveBeenCalled();
      });
    });

    it('should save the session state onto the context-shared file', async () => {
      await facade.init();

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(tempFileRegexp),
        expect.any(String),
      );

      const [, _sessionState] = lastCallTo(fs.writeFile);
      const sessionState = JSON.parse(_sessionState);
      expect(sessionState).toBeDefined();
      expect(sessionState).toEqual(facade.session);
    });

    it('should export context-shared file via DETOX_CONFIG_SNAPSHOT_PATH', async () => {
      await facade.init();

      expect(process.env.DETOX_CONFIG_SNAPSHOT_PATH).toBeDefined();
      expect(process.env.DETOX_CONFIG_SNAPSHOT_PATH).toMatch(tempFileRegexp);
    });

    it('should install a worker if worker ID has been specified', async () => {
      await facade.init({ workerId });
      expect(facade.session).toEqual(expect.objectContaining({ workerId }));
      expect(detoxWorker().init).toHaveBeenCalled();
    });

    it('should register the worker at the IPC server\'s', async () => {
      await facade.init({ workerId });
      expect(ipcServer.onRegisterWorker).toHaveBeenCalledWith({ workerId });
    });

    describe('given an initialization failure', () => {
      it('should report status as "init"', async () => {
        ipcServer.init.mockImplementation(() => throwErrorImpl('init error'));

        await expect(() => facade.init()).rejects.toThrow();
        expect(facade.getStatus()).toBe('init');
      });
    });
  });

  describe('when initialized', () => {
    it('should reject further initializations', async () => {
      await facade.init();
      await expect(() => facade.init()).rejects.toThrowErrorMatchingSnapshot();
    });

    it('should change status to "active"', async () => {
      await facade.init();
      expect(facade.getStatus()).toBe('active');
    });

    describe('then cleaned-up', () => {
      it('should uninstall an assigned worker', async () => {
        await facade.init({ workerId });
        await facade.cleanup();

        expect(detoxWorker().cleanup).toHaveBeenCalled();
      });

      it('should clean up the lifecycle handler', async () => {
        await facade.init();
        await facade.cleanup();

        expect(globalLifecycleHandler.globalCleanup).toHaveBeenCalled();
      });

      it('should close the detox server', async () => {
        detoxConfigDriver.givenDetoxServerAutostart();

        await facade.init();
        await facade.cleanup();

        expect(detoxServer().close).toHaveBeenCalled();
      });

      it('should close the ipc server', async () => {
        await facade.init();
        await facade.cleanup();

        expect(ipcServer.dispose).toHaveBeenCalled();
      });

      it('should delete the context-shared file', async () => {
        await facade.init();
        await facade.cleanup();

        expect(fs.remove).toHaveBeenCalledWith(expect.stringMatching(tempFileRegexp));
      });

      it('should finalize the logger', async () => {
        await facade.init();
        await facade.cleanup();
        expect(logFinalizer().finalize).toHaveBeenCalled();
      });

      it('should change intermediate status to "cleanup"', async () => {
        const suspended = suspendCall(ipcServer, 'dispose');

        await facade.init();

        await doBeforeResolved(facade.cleanup(), () => {
          expect(facade.getStatus()).toBe('cleanup');
          suspended.resolve();
        });
      });

      it('should restore status to "inactive"', async () => {
        await facade.init();
        await facade.cleanup();
        expect(facade.getStatus()).toBe('inactive');
      });

      describe('given a worker clean-up error', () => {
        const facadeInitWithWorker = async () => facade.init({ workerId });
        const facadeCleanup = async () => expect(() => facade.cleanup()).rejects.toThrow();

        beforeEach(async () => {
          detoxConfigDriver.givenDetoxServerAutostart();
          await facadeInitWithWorker();

          detoxWorker().cleanup.mockImplementation(throwErrorImpl);
        });

        it('should clean-up nonetheless', async () => {
          await facadeCleanup();
          expect(detoxServer().close).toHaveBeenCalled();
          expect(ipcServer.dispose).toHaveBeenCalled();
        });

        it('should restore status to "inactive"', async () => {
          await facadeCleanup();
          expect(facade.getStatus()).toBe('inactive');
        });
      });
    });

    describe('given an exit signal', () => {
      beforeEach(async () => {
        detoxConfigDriver.givenDetoxServerAutostart();

        await facade.init();

        const signalHandler = getSignalHandler();
        signalHandler(123, 'SIGSMT');
      });

      it('should *emergency* cleanup the global lifecycle handler', () =>
        expect(globalLifecycleHandler.emergencyCleanup).toHaveBeenCalled());

      it('should close the detox server', async () =>
        expect(detoxServer().close).toHaveBeenCalled());

      it('should close the ipc server', async () =>
        expect(ipcServer.dispose).toHaveBeenCalled());

      it('should delete the context-shared file', () =>
        expect(fs.removeSync).toHaveBeenCalledWith(expect.stringMatching(tempFileRegexp)));

      it('should finalize the logger', async () =>
        expect(logFinalizer().finalizeSync).toHaveBeenCalled());
    });

    describe('given a broken exit signal', () => {
      let signalHandler;
      beforeEach(async () => {
        detoxConfigDriver.givenDetoxServerAutostart();
        await facade.init();

        signalHandler = getSignalHandler();
      });

      it('should do nothing', () => {
        signalHandler(123, undefined);

        expect(globalLifecycleHandler.emergencyCleanup).not.toHaveBeenCalled();
        expect(detoxServer().close).not.toHaveBeenCalled();
        expect(ipcServer.dispose).not.toHaveBeenCalled();
      });
    });
  });


  function _initDetoxConfig() {
    detoxConfigDriver = new DetoxConfigDriver(_.cloneDeep(detoxConfigBase));

    jest.mock('../configuration');
    configuration = require('../configuration');
    configuration.composeDetoxConfig.mockResolvedValue(detoxConfigDriver.detoxConfig);
  }

  function _initExternalMocks() {
    jest.mock('signal-exit');
    jest.mock('fs-extra');
    fs = require('fs-extra');
  }

  function _initInternalMocks() {
    const MockedDetoxLogger = require('../logger/DetoxLogger'); // Already mocked using stub
    const MockedDetoxLogFinalizer = jest.createMockFromModule('../logger/utils/DetoxLogFinalizer');
    jest.mock('../logger', () => ({
      DetoxLogger: MockedDetoxLogger,
      DetoxLogFinalizer: MockedDetoxLogFinalizer,
      installLegacyTracerInterface: jest.fn(),
    }));
    logger = require('../logger');

    jest.mock('../devices/DeviceRegistry');
    const DeviceRegistry = require('../devices/DeviceRegistry');
    deviceRegistryIOS = new DeviceRegistry();
    DeviceRegistry.forIOS.mockReturnValue(deviceRegistryIOS);

    deviceRegistryAndroid = new DeviceRegistry();
    DeviceRegistry.forAndroid.mockReturnValue(deviceRegistryAndroid);

    jest.mock('../devices/allocation/drivers/android/genycloud/GenyDeviceRegistryFactory');
    const genycloudDeviceRegistryFactory = require('../devices/allocation/drivers/android/genycloud/GenyDeviceRegistryFactory');
    deviceRegistryGenyCloud = new DeviceRegistry();
    genycloudDeviceRegistryFactory.forGlobalShutdown.mockReturnValue(deviceRegistryGenyCloud);

    // The mocking complexity here is higher than the norm so as to allow for interacting
    // with both the class and the generated instance as mocks; With the latter - even
    // before its creation by the tested-unit (i.e. in its init()).
    const _IPCServer = jest.createMockFromModule('../ipc/IPCServer');
    const mockIpcServer = ipcServer = new _IPCServer();
    const MockIpcServer = IPCServer = jest.fn().mockImplementation(() => { return mockIpcServer; });
    jest.mock('../ipc/IPCServer', () => MockIpcServer);

    globalLifecycleHandler = {
      globalInit: jest.fn(),
      emergencyCleanup: jest.fn(),
      globalCleanup: jest.fn(),
    };
    jest.mock('../environmentFactory');
    environmentFactory = require('../environmentFactory');
    environmentFactory.createGlobalLifecycleHandler.mockReturnValue(globalLifecycleHandler);

    jest.mock('../server/DetoxServer');
    DetoxServer = require('../server/DetoxServer');

    jest.mock('../DetoxWorker');
  }
});

const detoxConfigBase = Object.freeze({
  behavior: {
    init: {
      keepLockFile: false,
    }
  },
  device: {
    type: '',
  },
  logger: {},
  session: {
    autoStart: false,
  },
});

class DetoxConfigDriver {
  constructor(detoxConfig) {
    this.detoxConfig = detoxConfig;
  }

  givenKeepLockFile = (value) => (this.detoxConfig.behavior.init.keepLockFile = value);
  givenIosSimulatorDevice = () => (this.detoxConfig.device.type = 'ios.simulator');
  givenGenyCloudDevice = () => (this.detoxConfig.device.type = 'android.genycloud');
  givenDetoxServerAutostart = () => (this.detoxConfig.session.autoStart = true);
  givenDetoxServerPort = (port) => (this.detoxConfig.session.server = `http://localhost:${port}`);
}
