// @ts-nocheck
describe('Spawn utils', () => {

  describe('spawning', () => {
    let retry;
    let log;
    let cpp;
    let spawn;
    beforeEach(() => {
      jest.mock('../logger');
      log = require('../logger');

      jest.mock('child-process-promise');
      cpp = require('child-process-promise');

      jest.mock('../retry');
      retry = require('../retry');
      retry.mockImplementation((opts, callback) => callback());

      spawn = require('./spawn');

      mockSpawnResult(0, {
        pid: 2018,
        stdout: toStream('hello'),
        stderr: toStream('world'),
      });
    });

    const mockSpawnResult = (code, childProcess) => {
      const cpPromise = Promise.resolve({ code, childProcess });
      cpp.spawn.mockReturnValue(Object.assign(cpPromise, { childProcess }));
    };

    const mockSpawnResults = (childProcess1, childProcess2) => {
      const cpPromise1 = Promise.resolve({ childProcess: childProcess1 });
      const cpPromise2 = Promise.resolve({ childProcess: childProcess2 });
      cpp.spawn
        .mockReturnValueOnce(Object.assign(cpPromise1, { childProcess: childProcess1 }))
        .mockReturnValueOnce(Object.assign(cpPromise2, { childProcess: childProcess2 }));
    };

    const advanceOpsCounter = (count) => {
      const opsCounter = require('./opsCounter');
      for (let i = 0; i < count; i++) opsCounter.inc();
    };

    [
      'spawnAndLog',
      'spawnWithRetriesAndLogs',
    ].forEach((func) => {
      describe(func, () => {
        it('should spawn an attached command with ignored input and piped output', async () => {
          const command = 'command';
          const flags = ['--some', '--value', Math.random()];

          await spawn[func](command, flags);

          expect(cpp.spawn).toBeCalledWith(command, flags, expect.objectContaining({
            stdio: ['ignore', 'pipe', 'pipe']
          }));
        });

        it('should log spawn command upon child-process start and finish', async () => {
          jest.spyOn(log, 'child');
          await spawn[func]('mockCommand', []);

          expect(log.debug).toHaveBeenCalledWith(expect.objectContaining({ event: 'SPAWN_CMD' }), 'mockCommand');
          expect(log.debug).toHaveBeenCalledWith(expect.objectContaining({ event: 'SPAWN_END' }), 'mockCommand exited with code #0');
        });

        it('should collect output and log it', async () => {
          await spawn[func]('mockCommand', []);
          await nextCycle();

          expect(log.trace).toHaveBeenCalledWith(expect.objectContaining({ event: 'SPAWN_STDOUT', stdout: true }), 'hello');
          expect(log.error).toHaveBeenCalledWith(expect.objectContaining({ event: 'SPAWN_STDERR', stderr: true }), 'world');
        });

        it('should form and use a child-logger', async () => {
          const trackingId = 7;
          advanceOpsCounter(trackingId);

          jest.spyOn(log, 'child');
          await spawn[func]('mockCommand', []);

          expect(log.child).toHaveBeenCalledWith(expect.objectContaining({ trackingId, command: 'mockCommand', fn: func }));
          expect(log.child).toHaveBeenCalledWith(expect.objectContaining({ cpid: 2018 }));
        });

        it('should override log levels if configured', async () => {
          jest.spyOn(log, 'child');
          await spawn[func]('command', [], {
            logLevelPatterns: {
              debug: [/hello/],
              warn: [/world/],
            },
          });

          await nextCycle();

          expect(log.debug).toHaveBeenCalledWith(expect.objectContaining({ event: 'SPAWN_STDOUT' }), 'hello');
          expect(log.warn).toHaveBeenCalledWith(expect.objectContaining({ event: 'SPAWN_STDERR' }), 'world');
        });

        it('should not log output if silent: true', async () => {
          await spawn[func]('mockCommand', [], { silent: true });
          await nextCycle();

          expect(log.debug).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_CMD' }), 'mockCommand');
          expect(log.debug).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_END' }), 'mockCommand exited with code #0');
          expect(log.trace).not.toBeCalledWith(expect.objectContaining(expect.objectContaining({ event: 'SPAWN_STDOUT' })), expect.any(String));
          expect(log.error).not.toBeCalledWith(expect.objectContaining(expect.objectContaining({ event: 'SPAWN_STDERR' })), expect.any(String));
        });

        it('should log erroneously finished spawns', async () => {
          mockSpawnResult(-2, {
            pid: 8102,
            stdout: toStream(''),
            stderr: toStream('Some error.'),
          });

          await spawn[func]('mockCommand', []).catch(() => {});
          await nextCycle();

          expect(log.debug).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_CMD' }), 'mockCommand');
          expect(log.debug).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_END' }), 'mockCommand exited with code #-2');
          expect(log.error).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_STDERR', stderr: true }), 'Some error.');
        });

        it('should log immediate spawn errors', async () => {
          mockSpawnResult(undefined, {
            pid: null,
            exitCode: -2,
            stdout: toStream(''),
            stderr: toStream('Command `command` not found.'),
          });

          await spawn[func]('command', []);
          await nextCycle();

          expect(log.debug).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_CMD' }), 'command');
          expect(log.error).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_ERROR' }), 'command failed with code = -2');
          expect(log.error).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_STDERR', stderr: true }), 'Command `command` not found.');
        });
      });
    });

    describe('spawnWithRetriesAndLogs', () => {
      const command = 'mockCommand';
      const flags = ['--mock', 'flag'];

      const spawnTryError = (stderr) => {
        const tryError = new Error();
        tryError.stderr = stderr;
        return tryError;
      };

      it('should spawn an attached command with stderr capturing, by default', async () => {
        await spawn.spawnWithRetriesAndLogs(command, flags);
        expect(cpp.spawn).toBeCalledWith(command, flags, expect.objectContaining({
          capture: ['stderr'],
        }));
      });

      it('should retry once, by default', async () => {
        await spawn.spawnWithRetriesAndLogs(command, flags);
        expect(retry).toHaveBeenCalledWith({ retries: 1, interval: 100 }, expect.any(Function));
      });

      it('should log retry attempts', async () => {
        const tryCount = 2;
        const tryError = spawnTryError('std error dump');
        retry.mockImplementation((opts, callback) => callback(tryCount, tryError));

        await spawn.spawnWithRetriesAndLogs(command, flags);

        expect(log.trace).toHaveBeenCalledWith({ event: 'SPAWN_TRY_FAIL' }, tryError.stderr);
        expect(log.debug).toHaveBeenCalledWith({ event: 'SPAWN_CMD' }, expect.stringContaining('(Retry #1)'));
      });

      it('should not log the 1st try', async () => {
        const tryCount = 1;
        const tryError = undefined;
        retry.mockImplementation((opts, callback) => callback(tryCount, tryError));

        await spawn.spawnWithRetriesAndLogs(command, flags);

        expect(log.trace).not.toHaveBeenCalledWith({ event: 'SPAWN_TRY_FAIL' }, expect.anything());
      });

      it('should honor retry options', async () => {
        const retries = 456456;
        const interval = 123123;
        await spawn.spawnWithRetriesAndLogs(command, flags, { retries, interval });
        expect(retry).toHaveBeenCalledWith({ retries, interval }, expect.any(Function));
      });

      it('should honor output-capturing options, but force stderr', async () => {
        await spawn.spawnWithRetriesAndLogs(command, flags, { capture: ['stdout'] });
        expect(cpp.spawn).toBeCalledWith(command, flags, expect.objectContaining({
          capture: ['stdout', 'stderr'],
        }));
      });

      it('should return result of last retry attempt', async () => {
        const childProcess1 = {
          pid: 100,
          exitCode: 1,
          stderr: toStream(''),
        };
        const childProcess2 = {
          pid: 101,
          exitCode: 0,
          stdout: toStream('okay great'),
        };
        mockSpawnResults(childProcess1, childProcess2);

        retry.mockImplementation(async (opts, callback) => {
          await callback(1);
          await callback(2, spawnTryError('mocked stderr'));
        });

        const result = await spawn.spawnWithRetriesAndLogs(command, flags);
        expect(result.childProcess).toEqual(expect.objectContaining({
          pid: 101,
          exitCode: 0,
        }));
        expect(cpp.spawn).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('interruptProcess', () => {
    jest.mock('../logger');
    const { interruptProcess, spawnAndLog } = require('./spawn');

    it('should interrupt a child process promise', async () => {
      await interruptProcess(spawnAndLog('sleep', ['3']));
    }, 500);

    it('should throw exception if child process exited with an error', async () => {
      const script =
        "process.on('SIGINT', () => {});" +
        'setTimeout(()=>process.exit(1), 100);';

      await interruptProcess(spawnAndLog('node', ['-e', script]));
    }, 1000);

    it('should SIGTERM a stuck process after specified time', async () => {
      const script =
        "process.on('SIGINT', () => {});" +
        'setTimeout(()=>process.exit(1), 10000);';

      const theProcess = spawnAndLog('node', ['-e', script]);
      await interruptProcess(theProcess, {
        SIGTERM: 500
      });
    }, 1000);
  });
});

function nextCycle() {
  return new Promise(resolve => setTimeout(resolve));
}

function toStream(string) {
  const { Readable } = require('stream');
  const stream = new Readable();
  stream._read = () => {};
  stream.push(string);
  stream.push(null);
  return stream;
}
