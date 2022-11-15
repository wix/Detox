// @ts-nocheck

const {
  latestInstanceOf,
  throwErrorImpl,
  withSuspendingMock,
} = global;

const DETOX_CONFIG_SNAPSHOT_PATH = 'mocked/detox.json';
const sessionState = {
  id: 'mocked-session-state',
};

const workerId = 91;

describe('DetoxSecondaryContext', () => {
  let fs;

  /** @type {import('../ipc/IPCClient')} */
  let IPCClient;
  /** @type {import('../ipc/IPCClient')} */
  let ipcClient;

  /** @type {import('./DetoxInternalsFacade')} */
  let facade;

  let env;

  const detoxWorker = () => {
    const DetoxWorker = require('../DetoxWorker');
    return latestInstanceOf(DetoxWorker);
  };

  beforeEach(_initEnv);
  afterEach(_restoreEnv);

  beforeEach(_initMocks);
  beforeEach(() => {
    const DetoxSecondaryContext = require('./DetoxSecondaryContext');
    const DetoxInternalsFacade = require('./DetoxInternalsFacade');

    const context = new DetoxSecondaryContext();
    facade = new DetoxInternalsFacade(context);
  });

  describe('when not initialized', () => {
    it('should be inactive', () => {
      expect(facade.getStatus()).toBe('inactive');
    });
  });

  describe('when initializing', () => {
    it('should create an IPC client', async () => {
      const expectedId = `secondary-${process.pid}`;

      await facade.init();

      expect(IPCClient).toHaveBeenCalledWith(expect.objectContaining({
        id: expectedId,
        state: expect.objectContaining(sessionState),
      }));
    });

    it('should initialize an IPC client', async () => {
      await facade.init();
      expect(ipcClient.init).toHaveBeenCalled();
    });

    it('should initialize a worker', async () => {
      await facade.init({ workerId });
      expect(detoxWorker().init).toHaveBeenCalled();
    });

    it('should register the worker at the client\'s', async () => {
      await facade.init({ workerId });
      expect(ipcClient.registerWorker).toHaveBeenCalledWith(workerId);
    });

    describe('given an initialization failure', () => {
      it('should report status as "init"', async () => {
        ipcClient.init.mockImplementation(() => throwErrorImpl('init error'));

        await expect(() => facade.init()).rejects.toThrow();
        expect(facade.getStatus()).toBe('init');
      });
    });
  });

  describe('when initialized', () => {
    it('should change status to "active"', async () => {
      await facade.init();
      expect(facade.getStatus()).toBe('active');
    });

    describe('then cleaned up', () => {
      it('should uninstall an assigned worker', async () => {
        await facade.init({ workerId });
        await facade.cleanup();

        expect(detoxWorker().cleanup).toHaveBeenCalled();
      });

      it('should close the ipc client', async () => {
        await facade.init();
        await facade.cleanup();

        expect(ipcClient.dispose).toHaveBeenCalled();
      });

      it('should restore status to "inactive"', async () => {
        await facade.init();
        await facade.cleanup();
        expect(facade.getStatus()).toBe('inactive');
      });

      it('should change intermediate status to "cleanup"', async () => {
        await facade.init();

        await withSuspendingMock(ipcClient, 'dispose', async ({ callSuspended }) => {
          await callSuspended(facade.cleanup(), () => {
            expect(facade.getStatus()).toBe('cleanup');
          });
        });
      });

      describe('given a worker clean-up error', () => {
        const facadeInitWithWorker = async () => facade.init({ workerId });
        const facadeCleanup = async () => expect(() => facade.cleanup()).rejects.toThrow();

        beforeEach(async () => {
          await facadeInitWithWorker();

          detoxWorker().cleanup.mockImplementation(throwErrorImpl);
        });

        it('should clean-up nonetheless', async () => {
          await facadeCleanup();
          expect(ipcClient.dispose).toHaveBeenCalled();
        });

        it('should restore status to "inactive"', async () => {
          await facadeCleanup();
          expect(facade.getStatus()).toBe('inactive');
        });
      });
    });
  });

  function _initEnv() {
    env = process.env;
    env.DETOX_CONFIG_SNAPSHOT_PATH = DETOX_CONFIG_SNAPSHOT_PATH;
  }

  function _restoreEnv() {
    process.env = { ...env };
  }

  function _initMocks() {
    jest.mock('fs-extra');
    fs = require('fs-extra');
    fs.readFileSync.mockImplementation(() => JSON.stringify(sessionState));

    // The mocking complexity here is higher than the norm so as to allow for interacting
    // with both the class and the generated instance as mocks; With the latter - even
    // before its creation by the tested-unit (i.e. in its init()).
    const _IPCClient = jest.createMockFromModule('../ipc/IPCClient');
    const mockIpcClient = ipcClient = new _IPCClient();
    const MockIpcClient = IPCClient = jest.fn().mockImplementation(() => { return mockIpcClient; });
    jest.mock('../ipc/IPCClient', () => MockIpcClient);

    jest.mock('../DetoxWorker');
  }
});
