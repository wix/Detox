describe('ADB', () => {
  const deviceId = 'mockEmulator';
  const adbBinPath = `/Android/sdk-mock/platform-tools/adb`;

  let ADB;
  let adb;
  let DeviceHandle;
  let EmulatorHandle;
  let exec;
  let spawn;

  beforeEach(() => {
    jest.mock('../../../../utils/logger');
    jest.mock('../../../../utils/environment');
    require('../../../../utils/environment').getAdbPath.mockReturnValue(adbBinPath);

    jest.mock('../../../../utils/encoding', () => ({
      encodeBase64: (text) => `base64(${text})`,
    }));

    jest.mock('../tools/DeviceHandle');
    DeviceHandle = require('../tools/DeviceHandle');

    jest.mock('../tools/EmulatorHandle');
    EmulatorHandle = require('../tools/EmulatorHandle');

    jest.mock('../../../../utils/exec', () => ({
      execWithRetriesAndLogs: jest.fn().mockReturnValue({ stdout: '' }),
      spawnAndLog: jest.fn(),
    }));
    exec = require('../../../../utils/exec').execWithRetriesAndLogs;
    spawn = require('../../../../utils/exec').spawnAndLog;

    ADB = require('./ADB');
    adb = new ADB();
  });

  describe('devices', () => {
    const mockDevices = [
      'MOCK_SERIAL\tdevice',
      '192.168.60.101:6666\tdevice',
      'emulator-5554\tdevice',
      'emulator-5556\toffline',
    ];
    const adbDevices = ['List of devices attached', ...mockDevices, ''].join('\n');

    it(`should invoke ADB`, async () => {
      await adb.devices();
      expect(exec).toHaveBeenCalledWith(`"${adbBinPath}"  devices`, { verbosity: 'high', retries: 1 });
      expect(exec).toHaveBeenCalledTimes(1);
    });

    it('should return proper, type-based device handles', async () => {
      exec.mockReturnValue({ stdout: adbDevices });

      const { devices, stdout } = await adb.devices();

      expect(stdout).toBe(adbDevices);
      expect(devices).toHaveLength(4);
      expect(devices).toEqual([
        DeviceHandle.mock.instances[0],
        DeviceHandle.mock.instances[1],
        EmulatorHandle.mock.instances[0],
        EmulatorHandle.mock.instances[1],
      ]);
      expect(DeviceHandle).toHaveBeenCalledWith(mockDevices[0]);
      expect(DeviceHandle).toHaveBeenCalledWith(mockDevices[1]);
      expect(EmulatorHandle).toHaveBeenCalledWith(mockDevices[2]);
      expect(EmulatorHandle).toHaveBeenCalledWith(mockDevices[3]);
    });

    it(`should return an empty list if no devices are available`, async () => {
      exec.mockReturnValue({
        stdout: 'List of devices attached\n'
      });

      const { devices } = await adb.devices();
      expect(devices.length).toEqual(0);
    });
  });

  it(`install`, async () => {
    await adb.install('emulator-5556', 'path inside "quotes" to/app');

    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining('adb" -s emulator-5556 shell "getprop ro.build.version.sdk"'),
      { retries: 5 });
  });

  it(`install api 22`, async () => {
    jest.spyOn(adb, 'apiLevel').mockImplementation(async () => 22);
    await adb.install('emulator-5556', 'path inside "quotes" to/app');

    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining('adb" -s emulator-5556 install -rg "path inside \\"quotes\\" to/app"'),
      { retries: 1 });
  });

  it(`install api 23`, async () => {
    jest.spyOn(adb, 'apiLevel').mockImplementation(async () => 23);
    await adb.install('emulator-5556', 'path inside "quotes" to/app');

    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining('adb" -s emulator-5556 install -r -g -t "path inside \\"quotes\\" to/app"'),
      { retries: 1 });
  });

  it(`uninstall`, async () => {
    await adb.uninstall('com.package');
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it(`terminate`, async () => {
    await adb.terminate('com.package');
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it(`sets location both with commas and dots due to the locale issue`, async () => {
    const lat = 30.5;
    const lon = -70.5;

    await adb.setLocation(deviceId, lat, lon);

    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining(`-s mockEmulator emu "geo fix -70.5 30.5"`),
      expect.anything());

    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining(`-s mockEmulator emu "geo fix -70,5 30,5"`),
      expect.anything());
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

  it('push', async () => {
    const sourceFile = '/mock-source/file.xyz';
    const destFile = '/sdcard/file.abc';
    await adb.push(deviceId, sourceFile, destFile);

    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining(`-s mockEmulator push "${sourceFile}" "${destFile}"`),
      expect.anything());
  });

  it('remote-install api 22', async () => {
    jest.spyOn(adb, 'apiLevel').mockImplementation(async () => 22);
    const binaryPath = '/mock-path/filename.mock';
    await adb.remoteInstall(deviceId, binaryPath);

    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining(`-s mockEmulator shell "pm install -rg ${binaryPath}"`),
      expect.anything());
  });

  it('remote-install api 23', async () => {
    jest.spyOn(adb, 'apiLevel').mockImplementation(async () => 23);
    const binaryPath = '/mock-path/filename.mock';
    await adb.remoteInstall(deviceId, binaryPath);

    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining(`-s mockEmulator shell "pm install -r -g -t ${binaryPath}"`),
      expect.anything());
  });

  it('global text-typing', async () => {
    const text = 'some-text-with spaces';
    const expectedText = 'some-text-with%sspaces';
    await adb.typeText(deviceId, text);
    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining(`-s mockEmulator shell "input text ${expectedText}"`),
      expect.anything());
  });

  describe('unlockScreen', () => {
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

  describe('spawnInstrumentation', () => {
    const testRunner = 'aTestRunner';

    it('should spawn instrumentation', async () => {
      const userArgs = [];
      const expectedArgs = ['-s', deviceId, 'shell', 'am', 'instrument', '-w', '-r', testRunner];
      await adb.spawnInstrumentation(deviceId, userArgs, testRunner);
      expect(spawn).toHaveBeenCalledWith(adbBinPath, expectedArgs, expect.any(Object));
    });

    it('should pass through additional args', async () => {
      const userArgs = ['-mock', '-args'];
      await adb.spawnInstrumentation(deviceId, userArgs, testRunner);
      expect(spawn).toHaveBeenCalledWith(adbBinPath, expect.arrayContaining([...userArgs, testRunner]), expect.any(Object));
    });

    it('should set detaching=false as spawn-options', async () => {
      const expectedOptions = {
        detached: false,
      };
      const userArgs = [];

      await adb.spawnInstrumentation(deviceId, userArgs, testRunner);

      expect(spawn).toHaveBeenCalledWith(adbBinPath, expect.any(Array), expectedOptions);
    });

    it('should chain-return the promise from spawn util', async () => {
      const userArgs = [];
      const mockPromise = Promise.resolve('mock');
      spawn.mockReturnValue(mockPromise);

      const childProcessPromise = adb.spawnInstrumentation(deviceId, userArgs, testRunner);
      expect(childProcessPromise).toEqual(mockPromise);
    });
  });

  it(`listInstrumentation passes the right deviceId`, async () => {
    const deviceId = 'aDeviceId';
    jest.spyOn(adb, 'shell');

    await adb.listInstrumentation(deviceId);

    expect(adb.shell).toBeCalledWith(deviceId, 'pm list instrumentation');
  });

  it(`getInstrumentationRunner parses the correct runner for the package`, async () => {
    const expectedRunner = 'com.example.android.apis/.app.LocalSampleInstrumentation';
    const expectedPackage = 'com.example.android.apis';
    const instrumentationRunnersShellOutput =
      'instrumentation:com.android.emulator.smoketests/android.support.test.runner.AndroidJUnitRunner (target=com.android.emulator.smoketests)\n' +
      'instrumentation:com.android.smoketest.tests/com.android.smoketest.SmokeTestRunner (target=com.android.smoketest)\n' +
      `instrumentation:${expectedRunner} (target=${expectedPackage})\n` +
      'instrumentation:org.chromium.webview_shell/.WebViewLayoutTestRunner (target=org.chromium.webview_shell)\n';

    jest.spyOn(adb, 'shell').mockImplementation(async () => instrumentationRunnersShellOutput);

    const result = await adb.getInstrumentationRunner('aDeviceId', expectedPackage);

    expect(adb.shell).toBeCalledWith('aDeviceId', 'pm list instrumentation');
    expect(result).toEqual(expectedRunner);
  });

  describe('animation disabling', () => {
    it('should disable animator (e.g. ObjectAnimator) animations', async () => {
      await adb.disableAndroidAnimations();
      expect(exec).toHaveBeenCalledWith(`"${adbBinPath}"  shell "settings put global animator_duration_scale 0"`, { retries: 1 });
    });

    it('should disable window animations', async () => {
      await adb.disableAndroidAnimations();
      expect(exec).toHaveBeenCalledWith(`"${adbBinPath}"  shell "settings put global window_animation_scale 0"`, { retries: 1 });
    });

    it('should disable transition (e.g. activity launch) animations', async () => {
      await adb.disableAndroidAnimations();
      expect(exec).toHaveBeenCalledWith(`"${adbBinPath}"  shell "settings put global transition_animation_scale 0"`, { retries: 1 });
    });
  });
});
