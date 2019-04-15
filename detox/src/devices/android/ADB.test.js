describe('ADB', () => {
  let ADB;
  let adb;
  let EmulatorTelnet;
  let exec;

  beforeEach(() => {
    jest.mock('../../utils/logger');
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
    await adb.install('emulator-5556', 'path inside "quotes" to/app');

    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining('adb -s emulator-5556 shell "getprop ro.build.version.sdk"'),
      undefined, undefined, 1
    );

    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining('adb -s emulator-5556 install -rg "path inside \\"quotes\\" to/app"'),
      undefined, undefined, 1);
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
    jest.spyOn(adb, 'shell').mockImplementation(async () =>
      `u0_a19        2199  1701 3554600  70264 0                   0 s com.google.android.ext.services `);

    expect(await adb.pidof('', 'com.google.android.ext.services')).toBe(2199);
  });

  it(`pidof (failure)`, async () => {
    jest.spyOn(adb, 'shell').mockImplementation(async () => '');
    expect(await adb.pidof('', 'com.google.android.ext.services')).toBe(NaN);
  });

  describe('unlockScreen', () => {
    const deviceId = 'mockEmulator';

    async function unlockScreenWithPowerStatus(mWakefulness, mUserActivityTimeoutOverrideFromWindowManager) {
      jest.spyOn(adb, 'shell').mockImplementation(async () => `
        mWakefulness=${mWakefulness}
        mWakefulnessChanging=false
        mWakeLockSummary=0x0
        mUserActivitySummary=0x1
        mWakeUpWhenPluggedOrUnpluggedConfig=false
        mWakeUpWhenPluggedOrUnpluggedInTheaterModeConfig=false
        mUserActivityTimeoutOverrideFromWindowManager=${mUserActivityTimeoutOverrideFromWindowManager}
        mUserInactiveOverrideFromWindowManager=false
      `);

      await adb.unlockScreen(deviceId);
    }

    describe('when unlocking an awake and unlocked device', function() {
      beforeEach(async () => unlockScreenWithPowerStatus('Awake', '-1'));

      it('should not press power button', () =>
        expect(adb.shell).not.toHaveBeenCalledWith(deviceId, 'input keyevent KEYCODE_POWER'));

      it('should not press menu button', () =>
        expect(adb.shell).not.toHaveBeenCalledWith(deviceId, 'input keyevent KEYCODE_MENU'));
    });

    describe('when unlocking a sleeping and locked device', function() {
      beforeEach(async () => unlockScreenWithPowerStatus('Asleep', '10000'));

      it('should press power button first', () =>
        expect(adb.shell.mock.calls[1]).toEqual([deviceId, 'input keyevent KEYCODE_POWER']));

      it('should press menu afterwards', () =>
        expect(adb.shell.mock.calls[2]).toEqual([deviceId, 'input keyevent KEYCODE_MENU']));
    });

    describe('when unlocking an awake but locked device', function() {
      beforeEach(async () => unlockScreenWithPowerStatus('Awake', '10000'));

      it('should not press power button', () =>
        expect(adb.shell).not.toHaveBeenCalledWith(deviceId, 'input keyevent KEYCODE_POWER'));

      it('should press menu button', () =>
        expect(adb.shell).toHaveBeenCalledWith(deviceId, 'input keyevent KEYCODE_MENU'));
    });

    describe('when unlocking a sleeping but unlocked device', function() {
      beforeEach(async () => unlockScreenWithPowerStatus('Asleep', '-1'));

      it('should press power button', () =>
        expect(adb.shell).toHaveBeenCalledWith(deviceId, 'input keyevent KEYCODE_POWER'));

      it('should not press menu button', () =>
        expect(adb.shell).not.toHaveBeenCalledWith(deviceId, 'input keyevent KEYCODE_MENU'));
    });
  });

  it(`listInstrumentation passes the right deviceId`, async () => {
    const deviceId = 'aDeviceId';
    jest.spyOn(adb, 'shell');

    await adb.listInstrumentation(deviceId);

    expect(adb.shell).toBeCalledWith(deviceId, 'pm list instrumentation');
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

  it(`getInstrumentationRunner parses the correct runner for the package`, async () => {
    const expectedRunner = "com.example.android.apis/.app.LocalSampleInstrumentation";
    const expectedPackage = "com.example.android.apis";
    const instrumentationRunnersShellOutput =
      "instrumentation:com.android.emulator.smoketests/android.support.test.runner.AndroidJUnitRunner (target=com.android.emulator.smoketests)\n" +
      "instrumentation:com.android.smoketest.tests/com.android.smoketest.SmokeTestRunner (target=com.android.smoketest)\n" +
      `instrumentation:${expectedRunner} (target=${expectedPackage})\n` +
      "instrumentation:org.chromium.webview_shell/.WebViewLayoutTestRunner (target=org.chromium.webview_shell)\n";

    jest.spyOn(adb, 'shell').mockImplementation(async () => instrumentationRunnersShellOutput);

    const result = await adb.getInstrumentationRunner('aDeviceId', expectedPackage);

    expect(adb.shell).toBeCalledWith('aDeviceId', 'pm list instrumentation');
    expect(result).toEqual(expectedRunner);
  });
});

