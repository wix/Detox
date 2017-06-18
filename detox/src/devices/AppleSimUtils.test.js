
const _ = require('lodash');

describe('AppleSimUtils', () => {
  let AppleSimUtils;
  let appleSimUtils;
  let exec;
  let fs;

  const simUdid = `9C9ABE4D-70C7-49DC-A396-3CB1D0E82846`;
  const bundleId = 'bundle.id';

  beforeEach(() => {
    jest.mock('npmlog');
    jest.mock('fs');
    fs = require('fs');
    jest.mock('../utils/exec');
    exec = require('../utils/exec').execWithRetriesAndLogs;
    AppleSimUtils = require('./AppleSimUtils');
    appleSimUtils = new AppleSimUtils();
  });

  it(`setLocationPermission() - is triggering appleSimUtils --setPermission`, async() => {
    await validateAppleSimUtilsCalledOn(appleSimUtils, async () => appleSimUtils.setLocationPermission(simUdid, bundleId, "always"));
  });

  it(`exec simulator command successfully`, async() => {
    const result = returnSuccessfulWithValue("");
    exec.mockReturnValue(Promise.resolve(result));
    const options = {args: `an argument`};
    expect(await appleSimUtils._execAppleSimUtilsCommand(options)).toEqual(result);
  });

  it(`exec simulator command with error`, async() => {
    const errorResult = returnErrorWithValue('');
    exec.mockReturnValue(Promise.reject(errorResult));
    const options = {args: `an argument`};
    
    try {
      await appleSimUtils._execAppleSimUtilsCommand(options, '', 10, 1);
    } catch (object) {
      expect(object).toEqual(errorResult);
    }
  });

  it(`exec simulator command with multiple errors and then a success`, async() => {
    const successfulResult = returnSuccessfulWithValue('successful result');
    const resolvedPromise = Promise.resolve(successfulResult);

    exec.mockReturnValueOnce(resolvedPromise);
  
    const options = {args: `an argument`};
    expect(await appleSimUtils._execAppleSimUtilsCommand(options, '', 10, 1)).toEqual(successfulResult);
  });
});

async function validateAppleSimUtilsCalledOn(appleSimUtils, func) {
  appleSimUtils._execAppleSimUtilsCommand = jest.fn();
  func();
  expect(appleSimUtils._execAppleSimUtilsCommand).toHaveBeenCalledTimes(1);
}

function returnSuccessfulWithValue(value) {
  const result = {
    stdout: JSON.stringify(value),
    stderr: "",
    childProcess: {
      exitCode: 0
    }
  };
  return result;
}

function returnErrorWithValue(value) {
  const result = {
    stdout: "",
    stderr: value,
    childProcess: {
      exitCode: 1
    }
  };
  return result;
}
