
const _ = require('lodash');

describe('Fbsimctl', () => {
  let Fbsimctl;
  let fbsimctl;
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
    jest.setMock('../utils/retry', async (options, func) => {
      return await func(1);
    });
    Fbsimctl = require('./Fbsimctl');
    fbsimctl = new Fbsimctl();
  });

  it(`list() - specify a valid simulator should return that simulator's UDID`, async() => {
    const result = returnSuccessfulWithValue(listAsimUdidAtState(simUdid, "Shutdown"));
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
      expect(object).toBeDefined();
    }
  });

  it(`list() - when something goes wrong in the list retrival process, log the given error error`, async() => {
    const returnValue = {};
    const result = returnErrorWithValue(returnValue);
    exec.mockReturnValue(Promise.reject(result));

    try {
      await fbsimctl.list('iPhone 7');
      fail('expected list() to throw');
    } catch (object) {
      expect(object).toBeDefined();
    }
  });

  it(`boot() - when shutting down, should wait for the device`, async() => {
    fbsimctl._execFbsimctlCommand = jest.fn(() => ({stdout: `{"subject": {"state": "Shutting Down"}}`}));
    
    try {
      await fbsimctl.boot(simUdid);
      fail('should throw');
    } catch (ex) {
      expect(ex).toBe("The device is in 'Shutting Down' state");
    }
  });

  it(`boot() - when state is undefined, should wait for the device`, async() => {
    fbsimctl._execFbsimctlCommand = jest.fn(() => ({}));
    
    try {
      await fbsimctl.boot(simUdid);
      fail('should throw');
    } catch (ex) {
      expect(ex).toBe("Couldn't get the state of the device");
    }
  });

  it(`boot() - when booted, should not wait for the device to boot`, async() => {
    fbsimctl._execFbsimctlCommand = jest.fn(() => ({stdout: `{"subject": {"state": "Booted"}}`}));
    await fbsimctl.boot(simUdid);
    expect(exec).toHaveBeenCalledTimes(0);
  });

  it(`boot() - when booting, should not call exec`, async() => {
    fbsimctl._execFbsimctlCommand = jest.fn(() => ({stdout: `{"subject": {"state": "Booting"}}`}));
    await fbsimctl.boot(simUdid);
    expect(exec).toHaveBeenCalledTimes(0);
  });

  it(`boot() - when shutdown, should call exec`, async() => {
    fbsimctl._execFbsimctlCommand = jest.fn(() => ({stdout: `{"subject": {"state": "Shutdown"}}`}));
    await fbsimctl.boot(simUdid);
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it(`install() - is triggering fbsimctl install`, async() => {
    await validateFbsimctlisCalledOn(fbsimctl, async () => fbsimctl.install(simUdid, bundleId, {}));
  });

  it(`uninstall() - is triggering fbsimctl uninstall`, async() => {
    await validateFbsimctlisCalledOn(fbsimctl, async () => fbsimctl.uninstall(simUdid, bundleId));
  });

  it(`launch() - is triggering exec`, async() => {
    fs.existsSync.mockReturnValue(true);
    exec.mockReturnValue({stdout: "appId: 22 \n"});
    await fbsimctl.launch(simUdid, bundleId, []);
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it(`launch() - is triggering exec with custom launch args`, async() => {
    fs.existsSync.mockReturnValue(true);
    exec.mockReturnValue({stdout: "appId: 22 \n"});
    await fbsimctl.launch(simUdid, bundleId, [{param: "param1"}]);
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it(`launch() - should throw when no Detox.framework exists`, async() => {
    fs.existsSync.mockReturnValue(false);
    try {
      await fbsimctl.launch(simUdid, bundleId, []);
      fail(`should fail when Detox.framework doesn't exist`);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`sendToHome() - is triggering exec`, async() => {
    fs.existsSync.mockReturnValue(true);
    exec.mockReturnValue({stdout: "appId: 22 \n"});
    await fbsimctl.sendToHome(simUdid, bundleId, []);
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it(`terminate() - is triggering exec`, async() => {
    await fbsimctl.terminate(simUdid, bundleId);
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it(`shutdown() - is triggering fbsimctl shutdown`, async() => {
    await validateFbsimctlisCalledOn(fbsimctl, async () => fbsimctl.shutdown(simUdid));
  });

  it(`open() - is triggering fbsimctl open`, async() => {
    await validateFbsimctlisCalledOn(fbsimctl, async () => fbsimctl.open(simUdid, bundleId));
  });

  it(`isDeviceBooted() - specify a shutdown simulator`, async() => {
    fbsimctl._execFbsimctlCommand = jest.fn(() => {
      return returnSuccessfulWithValue(listAsimUdidAtState(simUdid, `Shutdown`));
    });
    const isDeviceBooted = await fbsimctl.isDeviceBooted(simUdid);
    expect(isDeviceBooted).toBe(true);
  });

  it(`isDeviceBooted() - specify a booted simulator`, async() => {
    fbsimctl._execFbsimctlCommand = jest.fn(() => {
      return returnSuccessfulWithValue(listAsimUdidAtState(simUdid, `Booted`));
    });
    const isDeviceBooted = await fbsimctl.isDeviceBooted(simUdid);
    expect(isDeviceBooted).toBe(false);
  });

  it(`setLocation() - is triggering fbsimctl set_location`, async() => {
    await validateFbsimctlisCalledOn(fbsimctl, async () => fbsimctl.setLocation(simUdid));
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

  it(`getLogsPath() should return proper paths`, () => {
    expect(fbsimctl.getLogsPaths('123')).toEqual({
      stdout: '$HOME/Library/Developer/CoreSimulator/Devices/123/data/tmp/detox.last_launch_app_log.out',
      stderr: '$HOME/Library/Developer/CoreSimulator/Devices/123/data/tmp/detox.last_launch_app_log.err'
    })
  });
});

async function validateFbsimctlisCalledOn(fbsimctl, func) {
  fbsimctl._execFbsimctlCommand = jest.fn();
  func();
  expect(fbsimctl._execFbsimctlCommand).toHaveBeenCalledTimes(1);
}

function listAsimUdidAtState(udid, state) {
  return {
    "event_type": "discrete",
    "timestamp": 1485328213,
    "subject": {
      "state": state,
      "os": "iOS 10.1",
      "name": "iPhone 7",
      "udid": udid,
      "device-name": "iPhone 7"
    },
    "event_name": "list"
  };
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
