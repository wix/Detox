const _ = require('lodash');

describe('exec', () => {
  let exec;
  let cpp;

  beforeEach(() => {
    jest.mock('npmlog');
    jest.mock('child-process-promise');
    cpp = require('child-process-promise');
    exec = require('./exec');
  });

  it(`exec command with no arguments successfully`, async () => {
    mockCppSuccessful(cpp);
    await exec.execWithRetriesAndLogs('bin');
    expect(cpp.exec).toHaveBeenCalledWith(`bin`);
  });

  it(`exec command with arguments successfully`, async () => {
    mockCppSuccessful(cpp);

    const options = {args: `--argument 123`};
    await exec.execWithRetriesAndLogs('bin', options);

    expect(cpp.exec).toHaveBeenCalledWith(`bin --argument 123`);
  });

  it(`exec command with arguments and prefix successfully`, async () => {
    mockCppSuccessful(cpp);

    const options = {
      args: `--argument 123`,
      prefix: `export MY_PREFIX`
    };
    await exec.execWithRetriesAndLogs('bin', options);

    expect(cpp.exec).toHaveBeenCalledWith(`export MY_PREFIX && bin --argument 123`);
  });

  it(`exec command with arguments and status logs successfully`, async () => {
    mockCppSuccessful(cpp);

    const options = {args: `--argument 123`};
    const statusLogs = {
      trying: `trying status log`,
      successful: `successful status log`
    };
    await exec.execWithRetriesAndLogs('bin', options, statusLogs);

    expect(cpp.exec).toHaveBeenCalledWith(`bin --argument 123`);
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

  it(`exec command and fail`, async () => {
    const errorResult = returnErrorWithValue('error result');
    const rejectedPromise = Promise.reject(errorResult);
    cpp.exec.mockReturnValueOnce(rejectedPromise);

    try {
      await exec.execWithRetriesAndLogs('bin', null, '', 1, 1);
      fail('expected execWithRetriesAndLogs() to throw');
    } catch (object) {
      expect(cpp.exec).toHaveBeenCalledWith(`bin`);
      expect(object).toBeDefined();
    }
  });

  it(`exec command with multiple failures`, async () => {
    const errorResult = returnErrorWithValue('error result');
    const rejectedPromise = Promise.reject(errorResult);
    cpp.exec.mockReturnValueOnce(rejectedPromise)
       .mockReturnValueOnce(rejectedPromise)
       .mockReturnValueOnce(rejectedPromise)
       .mockReturnValueOnce(rejectedPromise)
       .mockReturnValueOnce(rejectedPromise)
       .mockReturnValueOnce(rejectedPromise);
    try {
      await exec.execWithRetriesAndLogs('bin', null, '', 6, 1);
      fail('expected execWithRetriesAndLogs() to throw');
    } catch (object) {
      expect(cpp.exec).toHaveBeenCalledWith(`bin`);
      expect(cpp.exec).toHaveBeenCalledTimes(6);
      expect(object).toBeDefined();
    }
  });

  it(`exec command with multiple failures and then a success`, async () => {
    const errorResult = returnErrorWithValue('error result');
    const rejectedPromise = Promise.reject(errorResult);
    const successfulResult = returnSuccessfulWithValue('successful result');
    const resolvedPromise = Promise.resolve(successfulResult);

    cpp.exec.mockReturnValueOnce(rejectedPromise)
       .mockReturnValueOnce(rejectedPromise)
       .mockReturnValueOnce(rejectedPromise)
       .mockReturnValueOnce(rejectedPromise)
       .mockReturnValueOnce(rejectedPromise)
       .mockReturnValueOnce(resolvedPromise);

    await exec.execWithRetriesAndLogs('bin', null, '', 6, 1);
    expect(cpp.exec).toHaveBeenCalledWith(`bin`);
    expect(cpp.exec).toHaveBeenCalledTimes(6);
  });
});

function returnSuccessfulWithValue(value) {
  const result = {
    stdout: JSON.stringify(value),
    stderr: "err",
    childProcess: {
      exitCode: 0
    }
  };
  return result;
}

function returnErrorWithValue(value) {
  const result = {
    stdout: "out",
    stderr: value,
    childProcess: {
      exitCode: 1
    }
  };
  return result;
}

function mockCppSuccessful(cpp) {
  const successfulResult = returnSuccessfulWithValue('successful result');
  const resolvedPromise = Promise.resolve(successfulResult);
  cpp.exec.mockReturnValueOnce(resolvedPromise);

  return successfulResult;
}

