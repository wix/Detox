
const _ = require('lodash');

describe('Fbsimctl', () => {
  let Fbsimctl;
  let fbsimctl;
  let exec;

  const simUdid = `9C9ABE4D-70C7-49DC-A396-3CB1D0E82846`;

  beforeAll(() => {
  });

  beforeEach(() => {
    const log = require('npmlog');
    //log.level = 'verbose';
    jest.mock('../utils/exec');
    exec = require('../utils/exec').execWithRetriesAndLogs;
    FBsimctl = require('./Fbsimctl');
    fbsimctl = new FBsimctl();
  });

  it(`list() - specify a valid simulator should return that simulator's UDID`, async() => {
    const returnValue = {
      "event_type": "discrete",
      "timestamp": 1485328213,
      "subject": {
        "state": "Shutdown",
        "os": "iOS 10.1",
        "name": "iPhone 7",
        "udid": simUdid,
        "device-name": "iPhone 7"
      },
      "event_name": "list"
    };

    const result = returnSuccessfulWithValue(returnValue);
    exec.mockReturnValue(Promise.resolve(result));

    expect(await fbsimctl.list('iPhone 7')).toEqual(simUdid);
  });

  it(`list() - specify an invalid simulator should throw an Error`, async() => {
    const returnValue = {};
    const result = returnSuccessfulWithValue(returnValue);
    exec.mockReturnValue(Promise.resolve(result));

    try {
      await fbsimctl.list('iPhone 7');
      fail('expected list() to throw');
    } catch (object) {
      //expect(object).toBeDefined(Error);
    }
  });

  it(`exec simulator command successfully`, async() => {
    const result = returnSuccessfulWithValue("");
    exec.mockReturnValue(Promise.resolve(result));
    const options = {args: `an argument`};
    expect(await fbsimctl._execFbsimctlCommand(options)).toEqual(result);
  });

  it(`exec simulator command with error`, async() => {
    const errorResult = returnErrorWithValue('');
    exec.mockReturnValue(Promise.reject(errorResult));
    const options = {args: `an argument`};
    
    try {
      await fbsimctl._execFbsimctlCommand(options, '', 10, 1);
    } catch (object) {
      expect(object).toEqual(errorResult);
    }
  });

  it(`exec simulator command with multiple errors and then a success`, async() => {
    const errorResult = Promise.reject(returnErrorWithValue('error result'));
    const rejectedPromise = Promise.reject(errorResult);

    const successfulResult = returnSuccessfulWithValue('successful result');
    const resolvedPromise = Promise.resolve(successfulResult);
    
    exec.mockReturnValueOnce(resolvedPromise);
  
    const options = {args: `an argument`};
    expect(await fbsimctl._execFbsimctlCommand(options, '', 10, 1)).toEqual(successfulResult);
  });
});

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
