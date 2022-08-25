// @ts-nocheck
describe('Exec utils', () => {
  let logger;
  let exec;
  let cpp;
  beforeEach(() => {
    jest.mock('../logger');
    logger = require('../logger');

    jest.mock('child-process-promise');
    cpp = require('child-process-promise');

    jest.mock('../trace');

    exec = require('./exec');
  });

  const advanceOpsCounter = (count) => {
    const opsCounter = require('./opsCounter');
    for (let i = 0; i < count; i++) opsCounter.inc();
  };

  it(`exec command with no arguments ends successfully`, async () => {
    mockCppSuccessful(cpp);
    await exec.execWithRetriesAndLogs('bin');
    expect(cpp.exec).toHaveBeenCalledWith(`bin`, { timeout: 0 });
  });

  it(`exec command with arguments ends successfully`, async () => {
    mockCppSuccessful(cpp);

    const options = { args: `--argument 123` };
    await exec.execWithRetriesAndLogs('bin', options);

    expect(cpp.exec).toHaveBeenCalledWith(`bin --argument 123`, { timeout: 0 });
  });

  it(`exec command with env-vars pass-through (i.e. no custom env-vars specification`, async () => {
    mockCppSuccessful(cpp);
    await exec.execWithRetriesAndLogs('bin');
    const usedOptions = cpp.exec.mock.calls[0][1];
    expect(usedOptions).not.toHaveProperty('env');
    expect(cpp.exec).toHaveBeenCalledTimes(1);
  });

  it(`exec command with arguments and prefix ends successfully`, async () => {
    mockCppSuccessful(cpp);

    const options = {
      args: `--argument 123`,
      prefix: `export MY_PREFIX`
    };
    await exec.execWithRetriesAndLogs('bin', options);

    expect(cpp.exec).toHaveBeenCalledWith(`export MY_PREFIX && bin --argument 123`, { timeout: 0 });
  });

  it(`exec command with prefix (no args) ends successfully`, async () => {
    mockCppSuccessful(cpp);

    const options = { prefix: `export MY_PREFIX` };
    await exec.execWithRetriesAndLogs('bin', options);

    expect(cpp.exec).toHaveBeenCalledWith(`export MY_PREFIX && bin`, { timeout: 0 });
  });

  it(`exec command log using a custom logger`, async () => {
    const trackingId = 4;
    advanceOpsCounter(trackingId);

    jest.spyOn(logger, 'child');
    mockCppSuccessful(cpp);
    await exec.execWithRetriesAndLogs('bin');
    expect(logger.child).toHaveBeenCalledWith({ fn: 'execWithRetriesAndLogs', trackingId, cmd: 'bin' });
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
    expect(logger.debug).toHaveBeenCalledWith({ event: 'EXEC_TRY', retryNumber: 1 }, options.statusLogs.trying);
    expect(logger.debug).toHaveBeenCalledWith({ event: 'EXEC_TRY', retryNumber: 2 }, options.statusLogs.trying);
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

    logger.debug.mockClear();

    await exec.execWithRetriesAndLogs('bin', options);

    expect(cpp.exec).toHaveBeenCalledWith(`bin --argument 123`, { timeout: 0 });
    expect(logger.debug).toHaveBeenCalledWith({ event: 'EXEC_RETRY' }, '(Retry #1)', 'bin --argument 123');
    expect(logger.debug).not.toHaveBeenCalledWith({ event: 'EXEC_RETRY' }, expect.stringContaining('Retry #0'), expect.any(String));
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
    expect(logger.trace).not.toHaveBeenCalledWith(expect.objectContaining({ event: 'EXEC_SUCCESS' }), expect.anything());
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
      expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ event: 'EXEC_FAIL' }), expect.anything());
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

  it(`execAsync command with no arguments runs successfully`, async () => {
    mockCppSuccessful(cpp);
    await exec.execAsync('bin');
    expect(cpp.exec).toHaveBeenCalledWith(`bin`);
  });
});

const returnSuccessfulWithValue = (value) => ({
    stdout: JSON.stringify(value),
    stderr: 'err',
    childProcess: {
      exitCode: 0
    }
  });

const returnErrorWithValue = (value) => ({
    stdout: 'out',
    stderr: value,
    childProcess: {
      exitCode: 1
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
