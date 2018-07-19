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

    jest.mock('./EmulatorTelnet');
    EmulatorTelnet = require('./EmulatorTelnet');


    jest.mock('../../utils/exec', () => {
      const exec = jest.fn();
      exec.mockReturnValue({ stdout: '' });
      return { execWithRetriesAndLogs: exec };
    });
    exec = require('../../utils/exec').execWithRetriesAndLogs;

    ADB = require('./ADB');
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

  it(`pidof (success)`, async () => {
    adb.shell = async () => `u0_a19        2199  1701 3554600  70264 0                   0 s com.google.android.ext.services `;
    expect(await adb.pidof('', 'com.google.android.ext.services')).toBe(2199);
  });

  it(`pidof (failure)`, async () => {
    adb.shell = async () => ``;
    expect(await adb.pidof('', 'com.google.android.ext.services')).toBe(NaN);
  });

  it(`unlockScreen`, async () => {
    await adb.unlockScreen('deviceId');
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it(`listInstrumentation passes the right deviceId`, async () => {
    const deviceId = 'aDeviceId';
    const spyShell = jest.spyOn(adb, 'shell');

    await adb.listInstrumentation(deviceId);

    expect(spyShell).toBeCalledWith(deviceId, expect.any(String));
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

  it(`getInstrumentationRunner passes the right deviceId`, async () => {
    const deviceId = 'aDeviceId';
    const spyRunnerForBundle = jest.spyOn(adb, 'instrumentationRunnerForBundleId');
    spyRunnerForBundle.mockReturnValue('');
    const spyShell = jest.spyOn(adb, 'shell');

    await adb.getInstrumentationRunner(deviceId, 'com.whatever.package');

    expect(spyShell).toBeCalledWith(deviceId, expect.any(String));
  });

  it(`instrumentationRunnerForBundleId parses the correct runner for the package`, async () => {
    const expectedRunner = "com.example.android.apis/.app.LocalSampleInstrumentation";
    const expectedPackage = "com.example.android.apis";
    const instrumentationRunnersShellOutput =
      "instrumentation:com.android.emulator.smoketests/android.support.test.runner.AndroidJUnitRunner (target=com.android.emulator.smoketests)\n" +
      "instrumentation:com.android.smoketest.tests/com.android.smoketest.SmokeTestRunner (target=com.android.smoketest)\n" +
      `instrumentation:${expectedRunner} (target=${expectedPackage})\n` +
      "instrumentation:org.chromium.webview_shell/.WebViewLayoutTestRunner (target=org.chromium.webview_shell)\n";

    const result = await adb.instrumentationRunnerForBundleId(instrumentationRunnersShellOutput, expectedPackage);

    expect(result).toEqual(expectedRunner);
  });
});

