jest.mock('../utils/logger');

const IPCClient = require('./IPCClient');
const IPCServer = require('./IPCServer');
const SessionState = require('./SessionState');

describe('IPC', () => {
  /** @type {SessionState} */
  let sessionState;

  /** @type {IPCServer} */
  let ipcServer;

  /** @type {IPCClient} */
  let ipcClient1;

  /** @type {IPCClient} */
  let ipcClient2;

  beforeEach(async () => {
    sessionState = new SessionState({
      id: 'foo',
      detoxIPCServer: 'bar',
    });

    const logger = require('../utils/logger');

    ipcServer = new IPCServer({ sessionState, logger });
    await ipcServer.init();

    ipcClient1 = new IPCClient({ id: 'foo', logger, sessionState });
    ipcClient2 = new IPCClient({ id: 'bar', logger, sessionState });
  });

  describe('server', () => {
    it('should return the correct session state', () => {
      expect(ipcServer.sessionState).toEqual(sessionState);
    });

    it('should return the correct id', () => {
      expect(ipcServer.id).toEqual(sessionState.detoxIPCServer);
    });

    it('should wait upon dispose if clients are still connected', async () => {
      await ipcClient1.init();

      const disposePromise = ipcServer.dispose();
      disposePromise.then(() => {
        fail('dispose() should not resolve before all clients are disconnected');
      });

      await new Promise(resolve => setTimeout(resolve, 500));
    });

    it('should resolve dispose() if no clients are connected', async () => {
      setTimeout(() => {
        throw new Error('dispose() should have resolved by now');
      }, 500);

      await ipcServer.dispose();
    });

    it('should resolve dispose() if all clients have disconnected', async () => {
      await ipcClient1.init();
      await ipcClient2.init();

      await ipcClient1.dispose();
      await ipcClient2.dispose();

      setTimeout(() => {
        throw new Error('dispose() should have resolved by now');
      }, 500);

      await ipcServer.dispose();
    });
  });

  describe('client', () => {
    it('should return the correct session state', () => {
      expect(ipcClient1.sessionState).toEqual(sessionState);
    });

    it('should return the correct IPC server id', () => {
      expect(ipcClient1.serverId).toEqual(sessionState.detoxIPCServer);
    });

    it('should throw if test results are reported before init', async () => {
      const expected = 'IPC server bar has unexpectedly disconnected';
      await expect(ipcClient1.reportTestResults([])).rejects.toThrow(expected);
    });

    it('should throw if worker is registered before init', async () => {
      const expected = 'IPC server bar has unexpectedly disconnected';
      await expect(ipcClient1.registerWorker('foo')).rejects.toThrow(expected);
    });

    it('should register context upon init', async () => {
      await ipcClient1.init();

      let expected = ['foo'];
      expect(ipcServer.sessionState.contexts).toEqual(expected);
      expect(ipcClient1.sessionState.contexts).toEqual(expected);
      expect(ipcClient2.sessionState.contexts).toEqual(expected);

      await ipcClient2.init();

      expected = ['foo', 'bar'];
      expect(ipcServer.sessionState.contexts).toEqual(expected);
      expect(ipcClient1.sessionState.contexts).toEqual(expected);
      expect(ipcClient2.sessionState.contexts).toEqual(expected);
    });

    describe('after init', () => {
      beforeEach(async () => {
        await ipcClient1.init();
        await ipcClient2.init();
      });

      it('should report test results', async () => {
        const testResults1 = [
          {
            testFilePath: 'file1',
            success: true,
          },
          {
            testFilePath: 'file2',
            success: false,
            testExecError: { name: 'baz', message: 'qux', stack: 'quux' },
            isPermanentFailure: true,
          },
        ];

        await ipcClient1.reportTestResults(testResults1);

        let expected = testResults1;
        expect(ipcServer.sessionState.testResults).toEqual(expected);
        expect(ipcClient1.sessionState.testResults).toEqual(expected);
        expect(ipcClient2.sessionState.testResults).toEqual(expected);

        const testResults2 = [
          {
            testFilePath: 'file3',
            success: true,
          },
        ];

        await ipcClient2.reportTestResults(testResults2);

        expected = [...testResults2, ...testResults1];
        expect(ipcServer.sessionState.testResults).toEqual(expected);
        expect(ipcClient1.sessionState.testResults).toEqual(expected);
        expect(ipcClient2.sessionState.testResults).toEqual(expected);
      });

      it('should register worker', async () => {
        await ipcClient1.registerWorker('foo');

        expect(ipcServer.sessionState.workersCount).toEqual(1);
        expect(ipcClient1.sessionState.workersCount).toEqual(1);
        expect(ipcClient2.sessionState.workersCount).toEqual(1);

        await ipcClient2.registerWorker('bar');
        await ipcClient2.registerWorker('baz');

        expect(ipcServer.sessionState.workersCount).toEqual(3);
        expect(ipcClient1.sessionState.workersCount).toEqual(3);
        expect(ipcClient2.sessionState.workersCount).toEqual(3);
      });

      describe('after dispose', () => {
        beforeEach(async () => {
          await ipcClient1.dispose();
        });

        it('should throw upon reporting test results', async () => {
          const expected = 'IPC server bar has unexpectedly disconnected';
          await expect(ipcClient1.reportTestResults([])).rejects.toThrow(expected);
        });

        it('should throw upon registering worker', async () => {
          const expected = 'IPC server bar has unexpectedly disconnected';
          await expect(ipcClient1.registerWorker('foo')).rejects.toThrow(expected);
        });
      });
    });
  });
});
