
const _ = require('lodash');

xdescribe('Fbsimctl', () => {
  let fbsimctl;
  let exec;
  let fs;

  const simUdid = `9C9ABE4D-70C7-49DC-A396-3CB1D0E82846`;
  const bundleId = 'bundle.id';

  beforeEach(() => {
    // jest.mock('npmlog');
    // jest.mock('fs');
    // fs = require('fs');
    // jest.mock('../utils/exec');
    // exec = require('../utils/exec').execWithRetriesAndLogs;
    // jest.setMock('../utils/retry', async (options, func) => {
    //   return await func(1);
    // });
  });

  it(`resetContentAndSettings() - is triggering shutdown, exec and boot`, async() => {
    fs.existsSync.mockReturnValue(true);
    exec.mockReturnValue({stdout: "appId: 22 \n"});
    fbsimctl.shutdown = jest.fn();
    fbsimctl.boot = jest.fn();
    await fbsimctl.resetContentAndSettings(simUdid);
    expect(fbsimctl.shutdown).toHaveBeenCalledTimes(1);
    expect(exec).toHaveBeenCalledTimes(1);
    expect(fbsimctl.boot).toHaveBeenCalledTimes(1);
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
    const successfulResult = returnSuccessfulWithValue('successful result');
    const resolvedPromise = Promise.resolve(successfulResult);

    exec.mockReturnValueOnce(resolvedPromise);

    const options = {args: `an argument`};
    expect(await fbsimctl._execFbsimctlCommand(options, '', 10, 1)).toEqual(successfulResult);
  });
});

// async function validateFbsimctlisCalledOn(fbsimctl, func) {
//   fbsimctl._execFbsimctlCommand = jest.fn();
//   func();
//   expect(fbsimctl._execFbsimctlCommand).toHaveBeenCalledTimes(1);
// }

// function listAsimUdidAtState(udid, state) {
//   return {
//     "event_type": "discrete",
//     "timestamp": 1485328213,
//     "subject": {
//       "state": state,
//       "os": "iOS 10.1",
//       "name": "iPhone 7",
//       "udid": udid,
//       "device-name": "iPhone 7"
//     },
//     "event_name": "list"
//   };
// }

// function returnSuccessfulWithValue(value) {
//   const result = {
//     stdout: JSON.stringify(value),
//     stderr: "",
//     childProcess: {
//       exitCode: 0
//     }
//   };
//   return result;
// }

// function returnErrorWithValue(value) {
//   const result = {
//     stdout: "",
//     stderr: value,
//     childProcess: {
//       exitCode: 1
//     }
//   };
//   return result;
// }
