const { backupProcessEnv, latestInstanceOf } = require('../../__tests__/helpers');

describe('DetoxSecondaryContext', () => {
  const DETOX_CONFIG_SNAPSHOT_PATH = 'mocked/detox.json';
  const WORKER_ID = 91;

  /** @type {import('./DetoxInternalsFacade')} */
  let facade;

  /** @type {jest.Mocked<import('fs-extra')>} */
  let fs;

  /** @type {import('../ipc/SessionState')} */
  let sessionState;

  /** @type {jest.Mock<import('../ipc/IPCClient')>} */
  let IPCClient;

  /** @type {jest.Mock<import('../DetoxWorker')>} */
  let DetoxWorker;

  const detoxWorker = () => latestInstanceOf(DetoxWorker);
  const ipcClient = () => latestInstanceOf(IPCClient);

  backupProcessEnv();

  beforeEach(() => {
    Object.assign(process.env, { DETOX_CONFIG_SNAPSHOT_PATH });
  });

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
        sessionState: expect.objectContaining(sessionState),
      }));
    });

    it('should initialize an IPC client', async () => {
      await facade.init();
      expect(ipcClient().init).toHaveBeenCalled();
    });

    it('should initialize a worker', async () => {
      await facade.init({ workerId: WORKER_ID });
      expect(detoxWorker().init).toHaveBeenCalled();
    });

    it('should register the worker at the client\'s', async () => {
      await facade.init({ workerId: WORKER_ID });
      expect(ipcClient().registerWorker).toHaveBeenCalledWith(WORKER_ID);
    });

    describe('given an initialization failure', () => {
      it('should report status as "init"', async () => {
        IPCClient.prototype.init = jest.fn().mockRejectedValue(new Error('init error'));

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
        await facade.init({ workerId: WORKER_ID });
        await facade.cleanup();

        expect(detoxWorker().cleanup).toHaveBeenCalled();
      });

      it('should close the ipc client', async () => {
        await facade.init();
        await facade.cleanup();

        expect(ipcClient().dispose).toHaveBeenCalled();
      });

      it('should restore status to "inactive"', async () => {
        await facade.init();
        await facade.cleanup();
        expect(facade.getStatus()).toBe('inactive');
      });

      it('should change intermediate status to "cleanup"', async () => {
        expect.assertions(1);
        await facade.init();

        ipcClient().dispose.mockImplementation(async () => {
          expect(facade.getStatus()).toBe('cleanup');
        });

        await facade.cleanup();
      });

      describe('given a worker clean-up error', () => {
        const facadeInitWithWorker = async () => facade.init({ workerId: WORKER_ID });
        const facadeCleanup = async () => expect(() => facade.cleanup()).rejects.toThrow();

        beforeEach(async () => {
          await facadeInitWithWorker();

          detoxWorker().cleanup.mockRejectedValue(new Error(''));
        });

        it('should clean-up nonetheless', async () => {
          await facadeCleanup();
          expect(ipcClient().dispose).toHaveBeenCalled();
        });

        it('should restore status to "inactive"', async () => {
          await facadeCleanup();
          expect(facade.getStatus()).toBe('inactive');
        });
      });
    });
  });

  function _initMocks() {
    jest.mock('fs-extra');
    fs = jest.requireMock('fs-extra');

    const SessionState = require('../ipc/SessionState');
    sessionState = new SessionState({ id: 'mocked-session-state' });
    fs.readFileSync.mockImplementation((filename) => {
      if (filename === DETOX_CONFIG_SNAPSHOT_PATH) {
        return sessionState.stringify();
      }

      return '';
    });

    jest.mock('../ipc/IPCClient');
    IPCClient = jest.requireMock('../ipc/IPCClient');

    jest.mock('../DetoxWorker');
    DetoxWorker = jest.requireMock('../DetoxWorker');
  }
});
