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
  /** @type {import('../logger')} */
  let logger;
  /** @type {jest.Mocked<import('../configuration')>} */
  let configuration;
  /** @type {jest.Mock<import('../ipc/IPCServer')>} */
  let IPCServer;
  /** @type {jest.Mocked<import('../environmentFactory')>} */
  let environmentFactory;

  /** @type {jest.Mocked<import('../devices/allocation/DeviceAllocator').AllocationDriverBase>} */
  let deviceAllocator;
  /** @type {jest.Mocked<import('../server/DetoxServer')>} */
  let DetoxServer;
  /** @type {jest.Mocked<import('../DetoxWorker')>} */
  let DetoxWorker;
  //#endregion

  /** @type {import('./DetoxPrimaryContext')} */
  let context;
  /** @type {import('./DetoxInternalsFacade')} */
  let facade;
  /** @type {import('./symbols')} */
  let symbols;
  /** @type {jest.Mock<import('../utils/retry')>} */
  let retry;

  const detoxServer = () => latestInstanceOf(DetoxServer);
  const ipcServer = () => latestInstanceOf(IPCServer);
  const detoxWorker = () => latestInstanceOf(DetoxWorker);
  // @ts-ignore
  const log = () => logger.DetoxLogger.instances[0];
  const logFinalizer = () => latestInstanceOf(logger.DetoxLogFinalizer);
  const getSignalHandler = () => lastCallTo(signalExit)[FIRST_ARGUMENT];
  const facadeInit = () => facade.init({ workerId: null });
  const facadeInitWithWorker = async () => facade.init({ workerId: WORKER_ID });

  backupProcessEnv();

  beforeEach(_initDetoxConfig);
  beforeEach(_initExternalMocks);
  beforeEach(_initInternalMocks);
  beforeEach(() => {
    const DetoxPrimaryContext = require('./DetoxPrimaryContext');
    const DetoxInternalsFacade = require('./DetoxInternalsFacade');

    context = new DetoxPrimaryContext();
    facade = new DetoxInternalsFacade(context);
    symbols = require('./symbols');
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

  describe('when initialized', () => {
    beforeEach(facadeInit);

    it('should create an IPC server with a valid session state', async () => {
      const expectedIPCServerName = `primary-${process.pid}`;

      expect(IPCServer).toHaveBeenCalledWith(expect.objectContaining({
        sessionState: expect.objectContaining({
          id: expect.stringMatching(UUID_REGEXP),
          detoxIPCServer: expect.stringMatching(expectedIPCServerName)
        }),
      }));
    });

    it('should init the IPC server', async () => {
      expect(ipcServer().init).toHaveBeenCalled();
    });

    it('should save the session state onto the context-shared file', async () => {
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
      expect(process.env.DETOX_CONFIG_SNAPSHOT_PATH).toBeDefined();
      expect(process.env.DETOX_CONFIG_SNAPSHOT_PATH).toMatch(TEMP_FILE_REGEXP);
    });

    it('should reject further initializations', async () => {
      await expect(() => facadeInit()).rejects.toThrowErrorMatchingSnapshot();
    });

    it('should change status to "active"', async () => {
      expect(facade.getStatus()).toBe('active');
    });

    describe('when a device is being allocated', () => {
      let cookie;

      beforeEach(async () => {
        cookie = await allocateSomeDevice();
      });

      it('should return a cookie', async () => {
        expect(cookie).toEqual({ id: 'a-device-id' });
      });

      it('should call the device allocator', async () => {
        expect(deviceAllocator.init).toHaveBeenCalled();
        expect(deviceAllocator.allocate).toHaveBeenCalled();
        expect(deviceAllocator.postAllocate).toHaveBeenCalled();
      });

      it('can be deallocated', async () => {
        await expect(deallocateDevice(cookie)).resolves.toBeUndefined();
      });

      it('should throw on attempt to deallocate a cookie that does not belong to this context', async () => {
        await expect(deallocateDevice({ id: 'some-other-device' })).rejects.toThrowErrorMatchingSnapshot();
      });

      it('cannot be deallocated twice', async () => {
        await deallocateDevice(cookie);
        await expect(deallocateDevice(cookie)).rejects.toThrowError(/Cannot deallocate device/);
      });

      describe('and then the context has been cleaned up', () => {
        beforeEach(async () => {
          await facade.cleanup();
        });

        it('should clean up the allocation driver', async () => {
          expect(deviceAllocator.cleanup).toHaveBeenCalled();
        });

        it('should not be able to find that cookie anymore', async () => {
          await expect(deallocateDevice(cookie)).rejects.toThrowError(/Cannot deallocate device/);
        });
      });

      describe('and then the context has been cleaned up with an allocator cleanup error', () => {
        let error = new Error('cleanup failed');

        beforeEach(async () => {
          deviceAllocator.cleanup.mockRejectedValue(error);
        });

        it('should log the error but not throw', async () => {
          await expect(facade.cleanup()).resolves.toBeUndefined();
          expect(log().error).toHaveBeenCalledWith({ cat: 'device', err: error }, `Failed to cleanup the device allocation driver for some.device`);
        });
      });

      describe('on emergency context cleanup', () => {
        beforeEach(async () => {
          const signalHandler = getSignalHandler();
          signalHandler(123, 'SIGSMT');
        });

        it('should call emergencyCleanup in allocation driver', async () => {
          expect(deviceAllocator.emergencyCleanup).toHaveBeenCalled();
        });
      });

      describe('on emergency context cleanup with an allocator cleanup error', () => {
        let error = new Error('cleanup failed');

        beforeEach(async () => {
          deviceAllocator.emergencyCleanup.mockImplementation(() => { throw error; });
        });

        it('should log the error but not throw', async () => {
          const signalHandler = getSignalHandler();
          expect(() => signalHandler(123, 'SIGSMT')).not.toThrow();
          expect(log().error).toHaveBeenCalledWith({ cat: 'device', err: error }, `Failed to clean up the device allocation driver for some.device in emergency mode`);
        });
      });
    });

    describe('when a device is being allocated using a faulty driver', () => {
      beforeEach(() => {
        deviceAllocator.init.mockRejectedValue(new Error('init failed'));
      });

      it('should destroy the allocation driver immediately', async () => {
        await expect(allocateSomeDevice()).rejects.toThrow(/init failed/);
        expect(deviceAllocator.cleanup).toHaveBeenCalled();
      });

      describe('and the driver fails to clean up', () => {
        beforeEach(() => {
          deviceAllocator.cleanup.mockRejectedValue(new Error('cleanup failed'));
        });

        it('should log the error', async () => {
          await expect(allocateSomeDevice()).rejects.toThrow(/init failed/);
          expect(log().error).toHaveBeenCalledWith({ cat: 'device', err: new Error('cleanup failed') }, `Failed to cleanup the device allocation driver for some.device after a failed initialization`);
        });
      });
    });

    describe('when a faulty device is being allocated', () => {
      beforeEach(async () => {
        deviceAllocator.postAllocate.mockRejectedValue(new Error('postAllocate failed'));
      });

      it('should free the device after an error', async () => {
        await expect(allocateSomeDevice()).rejects.toThrow(/postAllocate failed/);
        expect(deviceAllocator.free).toHaveBeenCalled();
      });

      describe('and cannot be freed properly', () => {
        let error = new Error('free failed');

        beforeEach(async () => {
          deviceAllocator.free.mockRejectedValue(error);
        });

        it('should throw the original allocation error', async () => {
          await expect(allocateSomeDevice()).rejects.toThrow(/postAllocate failed/);
          expect(log().error).toHaveBeenCalledWith({ cat: 'device', err: error }, `Failed to free a-device-id after a failed allocation attempt`);
        });
      });
    });

    describe('and cleaning up', () => {
      it('should change intermediate status to "cleanup"', async () => {
        expect.assertions(1);
        ipcServer().dispose.mockImplementation(async () => {
          expect(facade.getStatus()).toBe('cleanup');
        });
        await facade.cleanup();
      });
    });

    describe('and cleaned up', () => {
      beforeEach(async () => facade.cleanup());

      it('should close the ipc server', async () => {
        expect(ipcServer().dispose).toHaveBeenCalled();
      });

      it('should delete the context-shared file', async () => {
        expect(fs.remove).toHaveBeenCalledWith(expect.stringMatching(TEMP_FILE_REGEXP));
      });

      it('should finalize the logger', async () => {
        expect(logFinalizer().finalize).toHaveBeenCalled();
      });

      it('should restore status to "inactive"', async () => {
        expect(facade.getStatus()).toBe('inactive');
      });
    });

    describe('given an exit signal', () => {
      beforeEach(async () => {
        const signalHandler = getSignalHandler();
        signalHandler(123, 'SIGSMT');
      });

      it('should close the ipc server', async () =>
        expect(ipcServer().dispose).toHaveBeenCalled());

      it('should delete the context-shared file', () =>
        expect(fs.removeSync).toHaveBeenCalledWith(expect.stringMatching(TEMP_FILE_REGEXP)));

      it('should finalize the logger', async () =>
        expect(logFinalizer().finalizeSync).toHaveBeenCalled());
    });
  });

  describe('when initialized with no options', () => {
    beforeEach(async () => facade.init());

    it('should also install a worker', async () => {
      expect(detoxWorker().init).toHaveBeenCalled();
      expect(facade.session).toEqual(expect.objectContaining({ workerId: 'worker' }));
    });
  });

  describe('when initialized with auto-start of Detox server', () => {
    beforeEach(() => detoxConfigDriver.givenDetoxServerAutostart());
    beforeEach(facadeInit);

    it('should create the Detox server', async () => {
      expect(DetoxServer).toHaveBeenCalledWith({
        port: 0,
        standalone: false,
      });
    });

    it('should start the server', async () => {
      expect(detoxServer().open).toHaveBeenCalled();
    });

    describe('and cleaned up', () => {
      beforeEach(async () => facade.cleanup());

      it('should close the detox server', async () => {
        expect(detoxServer().close).toHaveBeenCalled();
      });
    });

    describe('given a non-conforming exit signal', () => {
      beforeEach(async () => {
        const signalHandler = getSignalHandler();
        signalHandler(123, undefined);
      });

      it('should do nothing', () => {
        expect(deviceAllocator.emergencyCleanup).not.toHaveBeenCalled();
        expect(detoxServer().close).not.toHaveBeenCalled();
        expect(ipcServer().dispose).not.toHaveBeenCalled();
      });
    });
  });

  describe('when initialized with Detox server on a certain port', () => {
    const port = '666';

    beforeEach(() => detoxConfigDriver.givenDetoxServerAutostart(port));
    beforeEach(() => detoxConfigDriver.givenDetoxServerPort(port));
    beforeEach(facadeInit);

    it('should create it', async () => {
      expect(DetoxServer).toHaveBeenCalledWith({
        port,
        standalone: false,
      });
    });
  });

  describe('when initialized without auto-start of Detox server', () => {
    beforeEach(facadeInit);

    it('should not create a server', async () => {
      expect(DetoxServer).not.toHaveBeenCalled();
    });
  });

  describe('when initialized not successfully', () => {
    it('should report status as "init"', async () => {
      IPCServer.prototype.init = jest.fn().mockRejectedValue(new Error('init failed'));

      await expect(() => facadeInit()).rejects.toThrow();
      expect(facade.getStatus()).toBe('init');
    });
  });

  describe('when initialized with a worker', () => {
    beforeEach(() => detoxConfigDriver.givenDetoxServerAutostart());
    beforeEach(facadeInitWithWorker);

    it('should install a worker if worker ID has been specified', async () => {
      expect(facade.session).toEqual(expect.objectContaining({ workerId: WORKER_ID }));
      expect(detoxWorker().init).toHaveBeenCalled();
    });

    it('should register the worker at the IPC server\'s', async () => {
      expect(ipcServer().onRegisterWorker).toHaveBeenCalledWith({ workerId: WORKER_ID });
    });

    describe('and cleaned up', () => {
      beforeEach(async () => facade.cleanup());

      it('should uninstall an assigned worker', async () => {
        expect(detoxWorker().cleanup).toHaveBeenCalled();
      });
    });

    describe('and cleaned up with an error', () => {
      beforeEach(async () => {
        detoxWorker().cleanup.mockRejectedValue(new Error(''));
        await expect(() => facade.cleanup()).rejects.toThrow();
      });

      it('should clean-up nonetheless', async () => {
        expect(detoxServer().close).toHaveBeenCalled();
        expect(ipcServer().dispose).toHaveBeenCalled();
      });

      it('should restore status to "inactive"', async () => {
        expect(facade.getStatus()).toBe('inactive');
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

    jest.mock('../ipc/IPCServer');
    IPCServer = jest.requireMock('../ipc/IPCServer');

    deviceAllocator = {
      init: jest.fn(),
      allocate: jest.fn().mockResolvedValue({ id: 'a-device-id' }),
      postAllocate: jest.fn().mockResolvedValue({ id: 'a-device-id' }),
      free: jest.fn(),
      cleanup: jest.fn(),
      emergencyCleanup: jest.fn(),
      isRecoverableError: jest.fn().mockReturnValue(true)
    };

    jest.mock('../environmentFactory');
    environmentFactory = jest.requireMock('../environmentFactory');
    environmentFactory.createFactories.mockReturnValue({
      deviceAllocatorFactory: {
        createDeviceAllocator: () => deviceAllocator,
      }
    });

    jest.mock('../server/DetoxServer');
    DetoxServer = jest.requireMock('../server/DetoxServer');

    jest.mock('../DetoxWorker');
    DetoxWorker = jest.requireMock('../DetoxWorker');

    jest.mock('../utils/retry');
    retry = jest.requireMock('../utils/retry');
    retry.mockImplementation((opts, callback) => callback());
  }

  async function allocateSomeDevice() {
    return context[symbols.allocateDevice]({ type: 'some.device' });
  }

  async function deallocateDevice(cookie) {
    return context[symbols.deallocateDevice](cookie);
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
