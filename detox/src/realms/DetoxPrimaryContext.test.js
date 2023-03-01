const _ = require('lodash');

const {
  backupProcessEnv,
  latestInstanceOf,
  lastCallTo,
} = require('../../__tests__/helpers');

describe('DetoxPrimaryContext', () => {
  //#region Fixtures and constants
  const UUID_REGEXP_STR = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
  const UUID_REGEXP = new RegExp(`^${UUID_REGEXP_STR}$`);
  const TEMP_FILE_REGEXP = new RegExp(`.*${UUID_REGEXP_STR}.detox.json$`);
  const WORKER_ID = 19;
  const DETOX_CONFIG_BASE = Object.freeze({
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
  const FIRST_ARGUMENT = 0;
  //#endregion

  let detoxConfigDriver;

  //#region Mocks
  /** @type {jest.Mocked<import('fs-extra')>} */
  let fs;
  /** @type {jest.Mocked<import('signal-exit')>} */
  let signalExit;
  /** @type {jest.Mocked<import('../logger')>} */
  let logger;
  /** @type {jest.Mocked<import('../configuration')>} */
  let configuration;
  /** @type {jest.Mock<import('../ipc/IPCServer')>} */
  let IPCServer;
  /** @type {jest.Mocked<import('../devices/lifecycle/GenyGlobalLifecycleHandler')>} */
  let globalLifecycleHandler;
  /** @type {jest.Mocked<import('../environmentFactory')>} */
  let environmentFactory;
  /** @type {jest.Mocked<import('../devices/DeviceRegistry')>} */
  let deviceRegistryIOS;
  /** @type {jest.Mocked<import('../devices/DeviceRegistry')>} */
  let deviceRegistryAndroid;
  /** @type {jest.Mocked<import('../devices/DeviceRegistry')>} */
  let deviceRegistryGenyCloud;
  /** @type {jest.Mock<import('../server/DetoxServer')>} */
  let DetoxServer;
  /** @type {jest.Mock<import('../DetoxWorker')>} */
  let DetoxWorker;
  //#endregion

  /** @type {import('./DetoxInternalsFacade')} */
  let facade;

  const detoxServer = () => latestInstanceOf(DetoxServer);
  const ipcServer = () => latestInstanceOf(IPCServer);
  const detoxWorker = () => latestInstanceOf(DetoxWorker);
  const logFinalizer = () => latestInstanceOf(logger.DetoxLogFinalizer);
  const getSignalHandler = () => lastCallTo(signalExit)[FIRST_ARGUMENT];
  const facadeInit = () => facade.init({ workerId: null });

  backupProcessEnv();

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
      expect(facade.session.id).toMatch(UUID_REGEXP);
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

      await facadeInit();

      expect(IPCServer).toHaveBeenCalledWith(expect.objectContaining({
        sessionState: expect.objectContaining({
          id: expect.stringMatching(UUID_REGEXP),
          detoxIPCServer: expect.stringMatching(expectedIPCServerName)
        }),
      }));
    });

    it('should init the IPC server', async () => {
      await facadeInit();
      expect(ipcServer().init).toHaveBeenCalled();
    });

    it('should init the global lifecycle handler', async () => {
      await facadeInit();
      expect(globalLifecycleHandler.globalInit).toHaveBeenCalled();
    });

    it('should reset the device registry', async () => {
      detoxConfigDriver.givenIosSimulatorDevice();
      await facadeInit();
      expect(deviceRegistryIOS.reset).toHaveBeenCalled();
    });

    it('should not reset the device registry if opted-out of', async () => {
      detoxConfigDriver.givenKeepLockFile(true);
      await facadeInit();
      expect(deviceRegistryIOS.reset).not.toHaveBeenCalled();
    });

    it('should reset the genymotion global-shutdown device-registry', async () => {
      detoxConfigDriver.givenGenyCloudDevice();
      await facadeInit();
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

        await facadeInit();
        expect(DetoxServer).toHaveBeenCalledWith(expectedServerArgs);
      });

      it('should create the Detox server based on a specified port', async () => {
        const port = '666';
        detoxConfigDriver.givenDetoxServerPort(port);

        const expectedServerArgs = {
          port,
          standalone: false,
        };
        await facadeInit();
        expect(DetoxServer).toHaveBeenCalledWith(expectedServerArgs);
      });

      it('should start the server', async () => {
        await facadeInit();
        expect(detoxServer().open).toHaveBeenCalled();
      });
    });

    describe('given detox-server auto-start disabled via config', () => {
      it('should not create a server', async () => {
        await facadeInit();
        expect(DetoxServer).not.toHaveBeenCalled();
      });
    });

    it('should save the session state onto the context-shared file', async () => {
      await facadeInit();

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(TEMP_FILE_REGEXP),
        expect.any(String),
      );

      const [, _sessionState] = lastCallTo(fs.writeFile);
      const sessionState = JSON.parse(_sessionState);
      expect(sessionState).toBeDefined();
      expect(sessionState).toEqual(facade.session);
    });

    it('should export context-shared file via DETOX_CONFIG_SNAPSHOT_PATH', async () => {
      await facadeInit();

      expect(process.env.DETOX_CONFIG_SNAPSHOT_PATH).toBeDefined();
      expect(process.env.DETOX_CONFIG_SNAPSHOT_PATH).toMatch(TEMP_FILE_REGEXP);
    });

    it('should install a worker if called without options', async () => {
      await facade.init();
      expect(facade.session).toEqual(expect.objectContaining({ workerId: 'worker' }));
      expect(detoxWorker().init).toHaveBeenCalled();
    });

    it('should install a worker if worker ID has been specified', async () => {
      await facade.init({ workerId: WORKER_ID });
      expect(facade.session).toEqual(expect.objectContaining({ workerId: WORKER_ID }));
      expect(detoxWorker().init).toHaveBeenCalled();
    });

    it('should register the worker at the IPC server\'s', async () => {
      await facade.init({ workerId: WORKER_ID });
      expect(ipcServer().onRegisterWorker).toHaveBeenCalledWith({ workerId: WORKER_ID });
    });

    describe('given an initialization failure', () => {
      it('should report status as "init"', async () => {
        IPCServer.prototype.init = jest.fn().mockRejectedValue(new Error('init failed'));

        await expect(() => facadeInit()).rejects.toThrow();
        expect(facade.getStatus()).toBe('init');
      });
    });
  });

  describe('when initialized', () => {
    it('should reject further initializations', async () => {
      await facadeInit();
      await expect(() => facadeInit()).rejects.toThrowErrorMatchingSnapshot();
    });

    it('should change status to "active"', async () => {
      await facadeInit();
      expect(facade.getStatus()).toBe('active');
    });

    describe('then cleaned-up', () => {
      it('should uninstall an assigned worker', async () => {
        await facade.init({ workerId: WORKER_ID });
        await facade.cleanup();

        expect(detoxWorker().cleanup).toHaveBeenCalled();
      });

      it('should clean up the lifecycle handler', async () => {
        await facadeInit();
        await facade.cleanup();

        expect(globalLifecycleHandler.globalCleanup).toHaveBeenCalled();
      });

      it('should close the detox server', async () => {
        detoxConfigDriver.givenDetoxServerAutostart();

        await facadeInit();
        await facade.cleanup();

        expect(detoxServer().close).toHaveBeenCalled();
      });

      it('should close the ipc server', async () => {
        await facadeInit();
        await facade.cleanup();

        expect(ipcServer().dispose).toHaveBeenCalled();
      });

      it('should delete the context-shared file', async () => {
        await facadeInit();
        await facade.cleanup();

        expect(fs.remove).toHaveBeenCalledWith(expect.stringMatching(TEMP_FILE_REGEXP));
      });

      it('should finalize the logger', async () => {
        await facadeInit();
        await facade.cleanup();
        expect(logFinalizer().finalize).toHaveBeenCalled();
      });

      it('should change intermediate status to "cleanup"', async () => {
        expect.assertions(1);
        await facadeInit();

        ipcServer().dispose.mockImplementation(async () => {
          expect(facade.getStatus()).toBe('cleanup');
        });

        await facade.cleanup();
      });

      it('should restore status to "inactive"', async () => {
        await facadeInit();
        await facade.cleanup();
        expect(facade.getStatus()).toBe('inactive');
      });

      describe('given a worker clean-up error', () => {
        const facadeInitWithWorker = async () => facade.init({ workerId: WORKER_ID });
        const facadeCleanup = async () => expect(() => facade.cleanup()).rejects.toThrow();

        beforeEach(async () => {
          detoxConfigDriver.givenDetoxServerAutostart();
          await facadeInitWithWorker();

          detoxWorker().cleanup.mockRejectedValue(new Error(''));
        });

        it('should clean-up nonetheless', async () => {
          await facadeCleanup();
          expect(detoxServer().close).toHaveBeenCalled();
          expect(ipcServer().dispose).toHaveBeenCalled();
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

        await facadeInit();

        const signalHandler = getSignalHandler();
        signalHandler(123, 'SIGSMT');
      });

      it('should *emergency* cleanup the global lifecycle handler', () =>
        expect(globalLifecycleHandler.emergencyCleanup).toHaveBeenCalled());

      it('should close the detox server', async () =>
        expect(detoxServer().close).toHaveBeenCalled());

      it('should close the ipc server', async () =>
        expect(ipcServer().dispose).toHaveBeenCalled());

      it('should delete the context-shared file', () =>
        expect(fs.removeSync).toHaveBeenCalledWith(expect.stringMatching(TEMP_FILE_REGEXP)));

      it('should finalize the logger', async () =>
        expect(logFinalizer().finalizeSync).toHaveBeenCalled());
    });

    describe('given a broken exit signal', () => {
      let signalHandler;
      beforeEach(async () => {
        detoxConfigDriver.givenDetoxServerAutostart();
        await facadeInit();

        signalHandler = getSignalHandler();
      });

      it('should do nothing', () => {
        signalHandler(123, undefined);

        expect(globalLifecycleHandler.emergencyCleanup).not.toHaveBeenCalled();
        expect(detoxServer().close).not.toHaveBeenCalled();
        expect(ipcServer().dispose).not.toHaveBeenCalled();
      });
    });
  });


  function _initDetoxConfig() {
    detoxConfigDriver = new DetoxConfigDriver(_.cloneDeep(DETOX_CONFIG_BASE));

    jest.mock('../configuration');
    configuration = jest.requireMock('../configuration');
    configuration.composeDetoxConfig.mockResolvedValue(detoxConfigDriver.detoxConfig);
  }

  function _initExternalMocks() {
    jest.mock('signal-exit');
    signalExit = jest.requireMock('signal-exit');
    jest.mock('fs-extra');
    fs = jest.requireMock('fs-extra');
  }

  function _initInternalMocks() {
    jest.mock('../logger');
    logger = jest.requireMock('../logger');

    jest.mock('../devices/DeviceRegistry');
    const DeviceRegistry = jest.requireMock('../devices/DeviceRegistry');
    deviceRegistryIOS = new DeviceRegistry();
    DeviceRegistry.forIOS.mockReturnValue(deviceRegistryIOS);

    deviceRegistryAndroid = new DeviceRegistry();
    DeviceRegistry.forAndroid.mockReturnValue(deviceRegistryAndroid);

    jest.mock('../devices/allocation/drivers/android/genycloud/GenyDeviceRegistryFactory');
    const genycloudDeviceRegistryFactory = jest.requireMock('../devices/allocation/drivers/android/genycloud/GenyDeviceRegistryFactory');
    deviceRegistryGenyCloud = new DeviceRegistry();
    genycloudDeviceRegistryFactory.forGlobalShutdown.mockReturnValue(deviceRegistryGenyCloud);

    jest.mock('../ipc/IPCServer');
    IPCServer = jest.requireMock('../ipc/IPCServer');

    const GenyGlobalLifecycleHandler = jest.createMockFromModule('../devices/lifecycle/GenyGlobalLifecycleHandler');
    globalLifecycleHandler = new GenyGlobalLifecycleHandler();

    jest.mock('../environmentFactory');
    environmentFactory = jest.requireMock('../environmentFactory');
    environmentFactory.createGlobalLifecycleHandler.mockReturnValue(globalLifecycleHandler);

    jest.mock('../server/DetoxServer');
    DetoxServer = jest.requireMock('../server/DetoxServer');

    jest.mock('../DetoxWorker');
    DetoxWorker = jest.requireMock('../DetoxWorker');
  }

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
});
