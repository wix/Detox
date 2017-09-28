//Disabled until we can create a build environment for Android in CI
xdescribe('ADB', () => {
  let ADB;
  let adb;
  let EmulatorTelnet;
  let exec;

  beforeEach(() => {
    jest.mock('npmlog');
    ADB = require('./ADB');

    jest.mock('./EmulatorTelnet');
    EmulatorTelnet = require('./EmulatorTelnet');

    jest.mock('../../utils/exec');
    exec = require('../../utils/exec').execWithRetriesAndLogs;
    adb = new ADB();
  });

  it(`Parse 'adb device' output`, async () => {
    const adbDevicesConsoleOutput = "List of devices attached\n"
                                    + "192.168.60.101:5555\tdevice\n"
                                    + "emulator-5556\tdevice\n"
                                    + "emulator-5554\tdevice\n"
                                    + "sx432wsds\tdevice\n"
                                    + "\n";
    exec.mockReturnValue(Promise.resolve({stdout: adbDevicesConsoleOutput}));

    const parsedDevices = [
      {"adbName": "192.168.60.101:5555", "name": "192.168.60.101:5555", "type": "genymotion"},
      {"adbName": "emulator-5556", "name": undefined, "port": "5556", "type": "emulator"},
      {"adbName": "emulator-5554", "name": undefined, "port": "5554", "type": "emulator"},
      {"adbName": "sx432wsds", "name": "sx432wsds", "type": "device"}];

    const devices = await adb.devices();
    expect(devices).toEqual(parsedDevices);
  });

  it(`install`, async () => {
    await adb.install('path/to/app');
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it(`uninstall`, async () => {
    await adb.uninstall('com.package');
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it(`terminate`, async () => {
    await adb.terminate('com.package');
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it(`unlockScreen`, async () => {
    await adb.unlockScreen('deviceId');
    expect(exec).toHaveBeenCalledTimes(1);
  });
});

