jest.setTimeout(1000);
jest.mock('../utils/logger');

const IPCClient = require('./IPCClient');
const IPCServer = require('./IPCServer');
const SessionState = require('./SessionState');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('IPC', () => {
  /** @type {*} */
  let sessionState;

  /** @type {IPCServer} */
  let ipcServer;

  /** @type {IPCClient} */
  let ipcClient1;

  /** @type {IPCClient} */
  let ipcClient2;

  beforeEach(() => {
    const logger = require('../utils/logger');

    sessionState = {
      id: 'session-1',
      detoxIPCServer: 'foo',
    };

    ipcServer = new IPCServer({
      logger,
      sessionState: new SessionState(sessionState),
    });

    ipcClient1 = new IPCClient({
      id: 'bar',
      logger,
      sessionState: new SessionState(sessionState),
    });

    ipcClient2 = new IPCClient({
      id: 'baz',
      logger,
      sessionState: new SessionState(sessionState)
    });
  });

  afterEach(async () => {
    await ipcClient1.dispose();
    await ipcClient2.dispose();
    await ipcServer.dispose();
  });

  describe('server', () => {
    it('should have a correct session state', () => {
      expect(ipcServer.sessionState).toEqual(new SessionState(sessionState));
    });

    it('should have a correct id', () => {
      expect(ipcServer.id).toEqual(sessionState.detoxIPCServer);
    });

    describe('onRegisterContext', () => {
      beforeEach(() => ipcServer.init());

      it('cannot be called directly, only via IPC', async () => {
        expect(() => ipcServer.onRegisterContext({ id: 'foo' })).toThrow();
      });
    });

    describe('onRegisterWorker', () => {
      beforeEach(() => ipcServer.init());

      it('when called directly, should register a worker', async () => {
        await ipcServer.onRegisterWorker({ workerId: 'worker-1' });
        expect(ipcServer.sessionState.workersCount).toEqual(1);

        await ipcServer.onRegisterWorker({ workerId: 'worker-2' });
        expect(ipcServer.sessionState.workersCount).toEqual(2);
      });

      it('should not count the same worker twice', async () => {
        await ipcServer.onRegisterWorker({ workerId: 'worker-1' });
        expect(ipcServer.sessionState.workersCount).toEqual(1);

        await ipcServer.onRegisterWorker({ workerId: 'worker-1' });
        expect(ipcServer.sessionState.workersCount).toEqual(1);
      });
    });

    describe('onReportTestResults', () => {
      beforeEach(() => ipcServer.init());

      const success = (testFilePath) => ({ testFilePath, success: true });
      const failure = (testFilePath) => ({ testFilePath, success: false, testExecError: { message: 'error' } });

      it('when called directly, should add test results', async () => {
        const testResults = [success('test-1'), failure('test-2')];
        await ipcServer.onReportTestResults({ testResults });
        expect(ipcServer.sessionState.testResults).toEqual(testResults);
      });

      it('when called more than one time, should merge test results', async () => {
        const testResults = [failure('test-1'), success('test-2')];
        await ipcServer.onReportTestResults({ testResults });
        await ipcServer.onReportTestResults({ testResults: [success('test-1')] });

        expect(ipcServer.sessionState.testResults).toEqual([
          success('test-1'),
          success('test-2'),
        ]);
      });
    });

    describe('dispose()', () => {
      it('should resolve if there are no connected clients', async () => {
        await ipcServer.init();
        await expect(ipcServer.dispose()).resolves.toBeUndefined();
      });

      it('should wait for connected clients to disconnect', async () => {
        await ipcServer.init();
        await ipcClient1.init();

        const disposePromise = ipcServer.dispose();
        const waitPromise = sleep(100).then(() => 'waited');
        await expect(Promise.race([disposePromise, waitPromise])).resolves.toBe('waited');

        await ipcClient1.dispose();
        await expect(disposePromise).resolves.toBeUndefined();
      });

      it('should resolve if all clients have disconnected', async () => {
        await ipcServer.init();

        await ipcClient1.init();
        await ipcClient2.init();

        await ipcClient1.dispose();
        await ipcClient2.dispose();

        await ipcServer.dispose();
      });
    });
  });

  describe('client', () => {
    beforeEach(async () => {
      await ipcServer.init();
    });

    it('should have a session state', () => {
      expect(ipcClient1.sessionState).toEqual(new SessionState(sessionState));
    });

    it('should return the correct IPC server id', () => {
      expect(ipcClient1.serverId).toEqual(sessionState.detoxIPCServer);
    });

    describe('before init', () => {
      it('should throw on attempt to report test results', async () => {
        const expected = 'IPC server foo has unexpectedly disconnected';
        await expect(ipcClient1.reportTestResults([])).rejects.toThrow(expected);
      });

      it('should throw on attempt to register the worker', async () => {
        const expected = 'IPC server foo has unexpectedly disconnected';
        await expect(ipcClient1.registerWorker('foo')).rejects.toThrow(expected);
      });
    });

    describe('upon init', function() {
      it('should register context', async () => {
        await ipcClient1.init();
        expect(ipcServer.contexts).toEqual(['bar']);

        await ipcClient2.init();
        expect(ipcServer.contexts).toEqual(['bar', 'baz']);
      });
    });

    describe('after init', () => {
      beforeEach(async () => {
        await ipcClient1.init();
        await ipcClient2.init();
      });

      describe('reportTestResults', () => {
        it('should report test results and synchronize test results', async () => {
          const testResults = [
            {
              testFilePath: 'file1',
              success: true,
            },
          ];

          await ipcClient1.reportTestResults(testResults);
          expect(ipcServer.sessionState.testResults).toEqual(testResults);
          expect(ipcClient1.sessionState.testResults).toEqual(testResults);

          await sleep(10); // broadcasting happens with a delay
          expect(ipcClient2.sessionState.testResults).toEqual(testResults);
        });

        it('should update test results with tests from another clients', async () => {
          const testResults1 = [{
            testFilePath: 'file1',
            success: true,
          }];

          const testResults2 = [
            {
              testFilePath: 'file2',
              success: false,
              testExecError: { name: 'baz', message: 'qux', stack: 'quux' },
              isPermanentFailure: false,
            },
          ];

          await ipcClient1.reportTestResults(testResults1);
          await ipcClient2.reportTestResults(testResults2);
          await sleep(10); // broadcasting might happen with a delay

          const expected = [...testResults2, ...testResults1];
          expect(ipcServer.sessionState.testResults).toEqual(expected);
          expect(ipcClient1.sessionState.testResults).toEqual(expected);
          expect(ipcClient2.sessionState.testResults).toEqual(expected);
        });

        it('should update test results with retried tests', async () => {
          const testResultsFailure = [
            {
              testFilePath: 'file2',
              success: false,
              testExecError: { name: 'baz', message: 'qux', stack: 'quux' },
              isPermanentFailure: false,
            },
          ];

          const testResultsRetry = [
            {
              testFilePath: 'file2',
              success: true,
            },
          ];

          await ipcClient1.reportTestResults(testResultsFailure);
          await ipcClient2.reportTestResults(testResultsRetry);

          await sleep(10); // broadcasting might happen with a delay

          const expected = testResultsRetry;
          expect(ipcServer.sessionState.testResults).toEqual(expected);
          expect(ipcClient1.sessionState.testResults).toEqual(expected);
          expect(ipcClient2.sessionState.testResults).toEqual(expected);
        });
      });

      describe('registerWorker', () => {
        it('should register worker', async () => {
          await ipcClient1.registerWorker('foo');

          expect(ipcServer.sessionState.workersCount).toEqual(1);
          expect(ipcClient1.sessionState.workersCount).toEqual(1);
          await sleep(10); // broadcasting might happen with a delay
          expect(ipcClient2.sessionState.workersCount).toEqual(1);

          await ipcClient2.registerWorker('bar');
          await ipcClient2.registerWorker('baz');

          expect(ipcServer.sessionState.workersCount).toEqual(3);
          expect(ipcClient2.sessionState.workersCount).toEqual(3);
          await sleep(10); // broadcasting might happen with a delay
          expect(ipcClient1.sessionState.workersCount).toEqual(3);
        });
      });

      describe('and after dispose', () => {
        beforeEach(async () => {
          await ipcClient1.dispose();
        });

        it('should throw upon reporting test results', async () => {
          const expected = 'IPC server foo has unexpectedly disconnected';
          await expect(ipcClient1.reportTestResults([])).rejects.toThrow(expected);
        });

        it('should throw upon registering worker', async () => {
          const expected = 'IPC server foo has unexpectedly disconnected';
          await expect(ipcClient1.registerWorker('foo')).rejects.toThrow(expected);
        });
      });
    });
  });
});
