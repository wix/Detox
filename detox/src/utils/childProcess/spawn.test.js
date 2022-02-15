// @ts-nocheck
describe('Spawn utils', () => {

  describe('spawn-and-log', () => {
    let log;
    let cpp;
    let spawn;
    beforeEach(() => {
      jest.mock('../logger');
      log = require('../logger');

      jest.mock('child-process-promise');
      cpp = require('child-process-promise');

      spawn = require('./spawn');

      const childProcess = {
        pid: 2018,
        stdout: toStream('hello'),
        stderr: toStream('world'),
      };

      const cpPromise = Promise.resolve({ code: 0, childProcess });
      cpp.spawn.mockReturnValue(Object.assign(cpPromise, {
        childProcess,
      }));
    });

    it('spawns an attached command with ignored input and piped output', () => {
      const command = 'command';
      const flags = ['--some', '--value', Math.random()];

      spawn.spawnAndLog(command, flags);

      expect(cpp.spawn).toBeCalledWith(command, flags, {
        stdio: ['ignore', 'pipe', 'pipe']
      });
    });

    it('should collect output and log it', async () => {
      jest.spyOn(log, 'child');
      await spawn.spawnAndLog('mockCommand', []);
      await nextCycle();

      expect(log.child).toHaveBeenCalledWith(expect.objectContaining({ pid: 2018 }));
      expect(log.debug).toHaveBeenCalledWith(expect.objectContaining({ event: 'SPAWN_CMD' }), 'mockCommand');
      expect(log.debug).toHaveBeenCalledWith(expect.objectContaining({ event: 'SPAWN_END' }), 'mockCommand exited with code #0');
      expect(log.trace).toHaveBeenCalledWith(expect.objectContaining({ event: 'SPAWN_STDOUT' }), 'hello');
      expect(log.error).toHaveBeenCalledWith(expect.objectContaining({ event: 'SPAWN_STDERR' }), 'world');
    });

    it('should override log levels if configured', async () => {
      jest.spyOn(log, 'child');
      await spawn.spawnAndLog('command', [], {
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
      await spawn.spawnAndLog('mockCommand', [], { silent: true });
      await nextCycle();

      expect(log.debug).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_CMD' }), 'mockCommand');
      expect(log.debug).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_END' }), 'mockCommand exited with code #0');
      expect(log.trace).not.toBeCalledWith(expect.objectContaining({ event: 'SPAWN_STDOUT', stdout: true }), expect.any(String));
      expect(log.error).not.toBeCalledWith(expect.objectContaining({ event: 'SPAWN_STDERR', stderr: true }), expect.any(String));
    });

    it('should log erroneously finished spawns', async () => {
      const childProcess = {
        pid: 8102,
        stdout: toStream(''),
        stderr: toStream('Some error.'),
      };

      cpp.spawn.mockReturnValue(Object.assign(Promise.reject({ code: -2, childProcess }), {
        childProcess
      }));

      await spawn.spawnAndLog('mockCommand', []).catch(() => {});
      await nextCycle();

      expect(log.debug).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_CMD' }), 'mockCommand');
      expect(log.debug).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_END' }), 'mockCommand exited with code #-2');
      expect(log.error).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_STDERR', stderr: true }), 'Some error.');
    });

    it('should log immediate spawn errors', async () => {
      const childProcess = {
        pid: null,
        exitCode: -2,
        stdout: toStream(''),
        stderr: toStream('Command `command` not found.'),
      };

      cpp.spawn.mockReturnValue(Object.assign(Promise.resolve({ childProcess }), {
        childProcess
      }));

      await spawn.spawnAndLog('command', []);
      await nextCycle();

      expect(log.debug).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_CMD' }), 'command');
      expect(log.error).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_ERROR' }), 'command failed with code = -2');
      expect(log.error).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_STDERR', stderr: true }), 'Command `command` not found.');
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
