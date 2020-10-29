describe('exec', () => {
  let logger;
  let exec;
  let cpp;

  beforeEach(() => {
    jest.mock('./logger');
    logger = require('./logger');

    jest.mock('child-process-promise');
    cpp = require('child-process-promise');

    exec = require('./exec');
  });

  it(`exec command with no arguments successfully`, async () => {
    mockCppSuccessful(cpp);
    await exec.execWithRetriesAndLogs('bin');
    expect(cpp.exec).toHaveBeenCalledWith(`bin`, { timeout: 0 });
  });

  it(`exec command with no arguments successfully`, async () => {
    mockCppSuccessful(cpp);
    await exec.execWithRetriesAndLogs('bin');
    expect(cpp.exec).toHaveBeenCalledWith(`bin`, { timeout: 0 });
  });

  it(`exec command with arguments successfully`, async () => {
    mockCppSuccessful(cpp);

    const options = {args: `--argument 123`};
    await exec.execWithRetriesAndLogs('bin', options);

    expect(cpp.exec).toHaveBeenCalledWith(`bin --argument 123`, { timeout: 0 });
  });

  it(`exec command with arguments and prefix successfully`, async () => {
    mockCppSuccessful(cpp);

    const options = {
      args: `--argument 123`,
      prefix: `export MY_PREFIX`
    };
    await exec.execWithRetriesAndLogs('bin', options);

    expect(cpp.exec).toHaveBeenCalledWith(`export MY_PREFIX && bin --argument 123`, { timeout: 0 });
  });

  it(`exec command with prefix (no args) successfully`, async () => {
    mockCppSuccessful(cpp);

    const options = {prefix: `export MY_PREFIX`};
    await exec.execWithRetriesAndLogs('bin', options);

    expect(cpp.exec).toHaveBeenCalledWith(`export MY_PREFIX && bin`, { timeout: 0 });
  });

  it(`exec command with arguments and try-based status logs successfully, with status logging`, async () => {
    cpp.exec
      .mockRejectedValueOnce(returnErrorWithValue('error result'))
      .mockResolvedValueOnce(returnSuccessfulWithValue('successful result'));

    const options = {
      args: `--argument 123`,
      statusLogs: {
        trying: 'trying status log',
        successful: 'successful status log',
      },
    };
    await exec.execWithRetriesAndLogs('bin', options);

    expect(cpp.exec).toHaveBeenCalledWith(`bin --argument 123`, { timeout: 0 });
    expect(logger.debug).toHaveBeenCalledWith({ event: 'EXEC_TRY', retryNumber: 1}, options.statusLogs.trying);
    expect(logger.debug).toHaveBeenCalledWith({ event: 'EXEC_TRY', retryNumber: 2}, options.statusLogs.trying);
    expect(logger.trace).toHaveBeenCalledWith({ event: 'EXEC_TRY_FAIL' }, 'error result');
  });

  it(`exec command with arguments and retry-based status logs successfully, with status logging`, async () => {
    cpp.exec
      .mockRejectedValueOnce(returnErrorWithValue('error result'))
      .mockResolvedValueOnce(returnSuccessfulWithValue('successful result'));

    const options = {
      args: `--argument 123`,
      statusLogs: {
        retrying: true,
      },
    };
    await exec.execWithRetriesAndLogs('bin', options);

    expect(cpp.exec).toHaveBeenCalledWith(`bin --argument 123`, { timeout: 0 });
    expect(logger.debug).toHaveBeenCalledWith({ event: 'EXEC_RETRY', retryNumber: 2}, '(Retry #1)', 'bin --argument 123');
    expect(logger.debug).not.toHaveBeenCalledWith({ event: 'EXEC_RETRY', retryNumber: 1}, expect.any(String), expect.any(String));
    expect(logger.trace).toHaveBeenCalledWith({ event: 'EXEC_TRY_FAIL' }, 'error result');
  });

  it(`exec command should output success and err logs`, async () => {
    mockCppSuccessful(cpp);
    await exec.execWithRetriesAndLogs('bin');

    expect(logger.trace).toHaveBeenCalledWith({ event: 'EXEC_SUCCESS', stdout: true }, '"successful result"');
    expect(logger.trace).toHaveBeenCalledWith({ event: 'EXEC_SUCCESS', stderr: true }, 'err');
  });

  it(`exec command should output a plain success if no output was made`, async () => {
    const cppResult = {
      childProcess: {
        exitCode: 0
      }
    };
    cpp.exec.mockResolvedValueOnce(cppResult);

    await exec.execWithRetriesAndLogs('bin');

    expect(logger.trace).toHaveBeenCalledWith({ event: 'EXEC_SUCCESS' }, '');
    expect(logger.trace).toHaveBeenCalledTimes(1);
  });

  it(`exec command should output success with high severity if verbosity set to high`, async () => {
    mockCppSuccessful(cpp);
    await exec.execWithRetriesAndLogs('bin', { verbosity: 'high' });

    expect(logger.debug).toHaveBeenCalledWith({ event: 'EXEC_SUCCESS', stdout: true }, '"successful result"');
    expect(logger.debug).toHaveBeenCalledWith({ event: 'EXEC_SUCCESS', stderr: true }, 'err');
    expect(logger.trace).not.toHaveBeenCalledWith(expect.objectContaining({event: 'EXEC_SUCCESS'}), expect.anything());
  });

  it(`exec command with undefined return should throw`, async () => {
    cpp.exec.mockReturnValueOnce(undefined);
    try {
      await exec.execWithRetriesAndLogs('bin');
      fail('should throw');
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`exec command and fail with error code`, async () => {
    mockCppFailure(cpp);

    try {
      await exec.execWithRetriesAndLogs('bin', { retries: 0, interval: 1 });
      fail('expected execWithRetriesAndLogs() to throw');
    } catch (object) {
      expect(cpp.exec).toHaveBeenCalledWith(`bin`, { timeout: 0 });
      expect(logger.error.mock.calls).toHaveLength(3);
      expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({event: 'EXEC_FAIL'}), expect.anything());
    }
  });

  it(`exec command and fail with error code, report only to debug log if verbosity is low`, async () => {
    mockCppFailure(cpp);

    try {
      await exec.execWithRetriesAndLogs('bin', { verbosity: 'low', retries: 0, interval: 1 });
      fail('expected execWithRetriesAndLogs() to throw');
    } catch (object) {
      expect(cpp.exec).toHaveBeenCalledWith(`bin`, { timeout: 0 });
      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.debug.mock.calls).toHaveLength(4);
    }
  });

  it(`exec command and fail with timeout`, async () => {
    mockCppFailure(cpp);

    try {
      await exec.execWithRetriesAndLogs('bin', { timeout: 1, retries: 0, interval: 1 });
      fail('expected execWithRetriesAndLogs() to throw');
    } catch (object) {
      expect(cpp.exec).toHaveBeenCalledWith(`bin`, { timeout: 1 });
      expect(logger.error.mock.calls).toHaveLength(3);
    }
  });

  it(`exec command with multiple failures`, async () => {
    const errorResult = returnErrorWithValue('error result');
    cpp.exec
      .mockRejectedValueOnce(errorResult)
      .mockRejectedValueOnce(errorResult)
      .mockRejectedValueOnce(errorResult)
      .mockRejectedValueOnce(errorResult)
      .mockRejectedValueOnce(errorResult)
      .mockRejectedValueOnce(errorResult);

    try {
      await exec.execWithRetriesAndLogs('bin', { retries: 5, interval: 1 });
      fail('expected execWithRetriesAndLogs() to throw');
    } catch (object) {
      expect(cpp.exec).toHaveBeenCalledWith(`bin`, { timeout: 0 });
      expect(cpp.exec).toHaveBeenCalledTimes(6);
      expect(object).toBeDefined();
    }
  });

  it(`exec command with multiple failures and then a success`, async () => {
    const errorResult = returnErrorWithValue('error result');
    const successfulResult = returnSuccessfulWithValue('successful result');

    cpp.exec
      .mockRejectedValueOnce(errorResult)
      .mockRejectedValueOnce(errorResult)
      .mockRejectedValueOnce(errorResult)
      .mockRejectedValueOnce(errorResult)
      .mockRejectedValueOnce(errorResult)
      .mockResolvedValueOnce(successfulResult);

    await exec.execWithRetriesAndLogs('bin', { retries: 6, interval: 1 });
    expect(cpp.exec).toHaveBeenCalledWith(`bin`, { timeout: 0 });
    expect(cpp.exec).toHaveBeenCalledTimes(6);
  });
});

describe('spawn', () => {
  let exec;
  let cpp;
  let log;

  beforeEach(() => {
    jest.mock('./logger');
    jest.mock('child-process-promise');
    cpp = require('child-process-promise');
    exec = require('./exec');
    log = require('./logger');

    const childProcess = {
      pid: 2018,
      stdout: toStream('hello'),
      stderr: toStream('world'),
    };

    const cpPromise = Promise.resolve({ code: 0, childProcess });
    cpp.spawn.mockReturnValue(Object.assign(cpPromise, {
      childProcess
    }));
  });

  it('spawns an attached command with ignored input and piped output', () => {
    const command = 'command';
    const flags = ['--some', '--value', Math.random()];

    exec.spawnAndLog(command, flags);

    expect(cpp.spawn).toBeCalledWith(command, flags, {
      stdio: ['ignore', 'pipe', 'pipe']
    });
  });

  it('should collect output and log it', async () => {
    await exec.spawnAndLog('command', []);
    await nextCycle();

    expect(log.debug).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_CMD' }), '[pid=2018] command');
    expect(log.trace).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_END' }), 'command finished with code = 0');
    expect(log.trace).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_STDOUT', stdout: true }), 'hello');
    expect(log.error).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_STDERR', stderr: true }), 'world');
  });

  it('should not log output if silent: true', async () => {
    await exec.spawnAndLog('command', [], { silent: true });
    await nextCycle();

    expect(log.debug).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_CMD' }), '[pid=2018] command');
    expect(log.trace).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_END' }), 'command finished with code = 0');
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

    await exec.spawnAndLog('command', []).catch(() => {});
    await nextCycle();

    expect(log.debug).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_CMD' }), '[pid=8102] command');
    expect(log.trace).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_END' }), 'command finished with code = -2');
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

    await exec.spawnAndLog('command', []);
    await nextCycle();

    expect(log.debug).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_CMD' }), '[pid=null] command');
    expect(log.error).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_ERROR' }), 'command failed with code = -2');
    expect(log.error).toBeCalledWith(expect.objectContaining({ event: 'SPAWN_STDERR', stderr: true }), 'Command `command` not found.');
  });

  it(`execAsync command with no arguments successfully`, async () => {
    mockCppSuccessful(cpp);
    await exec.execAsync('bin');
    expect(cpp.exec).toHaveBeenCalledWith(`bin`);
  });
});

function nextCycle() {
  return new Promise(resolve => setTimeout(resolve));
}

function toStream(string) {
  const {Readable} = require('stream');
  const stream = new Readable();
  stream._read = () => {};
  stream.push(string);
  stream.push(null);
  return stream;
}

const returnSuccessfulWithValue = (value) => ({
    stdout: JSON.stringify(value),
    stderr: "err",
    childProcess: {
      exitCode: 0
    }
  });

const returnErrorWithValue = (value) => ({
    stdout: "out",
    stderr: value,
    childProcess: {
      exitCode: 1
    }
  });

const returnSuccessfulNoValue = () => ({
    childProcess: {
      exitCode: 0
    }
  });

function mockCppSuccessful(cpp) {
  const successfulResult = returnSuccessfulWithValue('successful result');
  cpp.exec.mockResolvedValueOnce(successfulResult);
  return successfulResult;
}

function mockCppFailure(cpp) {
  const errorResult = returnErrorWithValue('error result');
  cpp.exec.mockRejectedValueOnce(errorResult);
  return errorResult;
}
