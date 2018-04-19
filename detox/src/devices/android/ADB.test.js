describe('ADB', () => {
  let ADB;
  let adb;
  let EmulatorTelnet;
  let exec;

  beforeEach(() => {
    jest.mock('npmlog');
    jest.mock('../../utils/environment', () => ({
      getAndroidSDKPath: () => '/dev/null',
    }));

    ADB = require('./ADB');

    jest.mock('./EmulatorTelnet');
    EmulatorTelnet = require('./EmulatorTelnet');


    jest.mock('../../utils/exec', () => {
      const exec = jest.fn();
      exec.mockReturnValue({ stdout: '' });
      return { execWithRetriesAndLogs: exec };
    });
    exec = require('../../utils/exec').execWithRetriesAndLogs;

    adb = new ADB();
  });

  it(`devices`, async () => {
    await adb.devices();
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it(`install`, async () => {
    await adb.install('path/to/app');
    expect(exec).toHaveBeenCalledTimes(2);
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

  it(`listInstrumentation`, async () => {
    await adb.listInstrumentation('deviceId');
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it(`Parse 'adb device' output`, async () => {
    const adbDevicesConsoleOutput = "List of devices attached\n"
      + "192.168.60.101:5555\tdevice\n"
      + "emulator-5556\tdevice\n"
      + "emulator-5554\tdevice\n"
      + "sx432wsds\tdevice\n"
      + "\n";

    const spyDevices = jest.spyOn(adb, 'devices');
    spyDevices.mockReturnValue(Promise.resolve(adbDevicesConsoleOutput));

    const parsedDevices = [
      { "adbName": "192.168.60.101:5555", "name": "192.168.60.101:5555", "type": "genymotion" },
      { "adbName": "emulator-5556", "name": undefined, "port": "5556", "type": "emulator" },
      { "adbName": "emulator-5554", "name": undefined, "port": "5554", "type": "emulator" },
      { "adbName": "sx432wsds", "name": "sx432wsds", "type": "device" }];

    const actual = await adb.parseAdbDevicesConsoleOutput(adbDevicesConsoleOutput);
    expect(actual).toEqual(parsedDevices);
  });

  it(`getInstrumentationRunner`, async () => {
    const adbShellPmListInstrumentationOutput =
      "instrumentation:com.android.emulator.smoketests/android.support.test.runner.AndroidJUnitRunner (target=com.android.emulator.smoketests)\n" +
      "instrumentation:com.android.smoketest.tests/com.android.smoketest.SmokeTestRunner (target=com.android.smoketest)\n" +
      "instrumentation:com.example.android.apis/.app.LocalSampleInstrumentation (target=com.example.android.apis)\n" +
      "instrumentation:org.chromium.webview_shell/.WebViewLayoutTestRunner (target=org.chromium.webview_shell)\n";

    const spyListInstrumentation = jest.spyOn(adb, 'listInstrumentation');
    spyListInstrumentation.mockReturnValue(Promise.resolve(adbShellPmListInstrumentationOutput));

    const result = await adb.getInstrumentationRunner("deviceId", "com.example.android.apis");
    expect(result).toEqual("com.example.android.apis/.app.LocalSampleInstrumentation");
  });
});

