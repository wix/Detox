// @ts-nocheck
describe('ADB', () => {
  const deviceId = 'mockEmulator';
  const adbBinPath = `/Android/sdk-mock/platform-tools/adb`;

  let ADB;
  let adb;
  let DeviceHandle;
  let EmulatorHandle;
  let execWithRetriesAndLogs;
  let spawnAndLog;
  let spawnWithRetriesAndLogs;

  beforeEach(() => {
    jest.mock('../../../../../utils/logger');
    jest.mock('../../../../../utils/environment');
    require('../../../../../utils/environment').getAdbPath.mockReturnValue(adbBinPath);

    jest.mock('../../../../../utils/encoding', () => ({
      encodeBase64: (text) => `base64(${text})`,
    }));

    jest.mock('../tools/DeviceHandle');
    DeviceHandle = require('../tools/DeviceHandle');

    jest.mock('../tools/EmulatorHandle');
    EmulatorHandle = require('../tools/EmulatorHandle');

    jest.mock('../../../../../utils/childProcess', () => ({
      execWithRetriesAndLogs: jest.fn().mockReturnValue({ stdout: '' }),
      spawnAndLog: jest.fn(),
      spawnWithRetriesAndLogs: jest.fn().mockReturnValue({ stdout: '' }),
    }));
    execWithRetriesAndLogs = require('../../../../../utils/childProcess').execWithRetriesAndLogs;
    spawnAndLog = require('../../../../../utils/childProcess').spawnAndLog;
    spawnWithRetriesAndLogs = require('../../../../../utils/childProcess').spawnWithRetriesAndLogs;

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
      expect(execWithRetriesAndLogs).toHaveBeenCalledWith(`"${adbBinPath}"  devices`, { verbosity: 'high', retries: 1 });
      expect(execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
    });

    it('should return proper, type-based device handles', async () => {
      execWithRetriesAndLogs.mockReturnValue({ stdout: adbDevices });

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
      execWithRetriesAndLogs.mockReturnValue({
        stdout: 'List of devices attached\n'
      });

      const { devices } = await adb.devices();
      expect(devices.length).toEqual(0);
    });
  });

  it('should install an APK (api≤22)', async () => {
    jest.spyOn(adb, 'apiLevel').mockImplementation(async () => 22);
    await adb.install(deviceId, 'path/to/bin.apk');

    expect(spawnWithRetriesAndLogs).toHaveBeenCalledWith(
      adbBinPath,
      ['-s', deviceId, 'install', '-rg', 'path/to/bin.apk'],
      expect.any(Object));
  });

  it('should install an APK (api≥23)', async () => {
    jest.spyOn(adb, 'apiLevel').mockImplementation(async () => 23);
    await adb.install(deviceId, 'path/to/bin.apk');

    expect(spawnWithRetriesAndLogs).toHaveBeenCalledWith(
      adbBinPath,
      ['-s', deviceId, 'install', '-r', '-g', '-t', 'path/to/bin.apk'],
      expect.any(Object));
  });

  it('should install with proper spawning/retry options', async () => {
    const expectedOptions = {
      retries: 3,
      timeout: 45000,
      capture: ['stdout'],
    };
    await adb.install(deviceId, 'path/to/bin.apk');

    expect(spawnWithRetriesAndLogs).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expectedOptions);
  });

  it(`uninstall`, async () => {
    await adb.uninstall('com.package');
    expect(execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
  });

  it(`terminate`, async () => {
    await adb.terminate('com.package');
    expect(execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
  });

  it(`sets location both with commas and dots due to the locale issue`, async () => {
    const lat = 30.5;
    const lon = -70.5;

    await adb.setLocation(deviceId, lat, lon);

    expect(execWithRetriesAndLogs).toHaveBeenCalledWith(
      expect.stringContaining(`-s mockEmulator emu "geo fix -70.5 30.5"`),
      expect.anything());

    expect(execWithRetriesAndLogs).toHaveBeenCalledWith(
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

    expect(execWithRetriesAndLogs).toHaveBeenCalledWith(
      expect.stringContaining(`-s mockEmulator push "${sourceFile}" "${destFile}"`),
      expect.anything());
  });

  it('should remote-install (api≤22)', async () => {
    jest.spyOn(adb, 'apiLevel').mockImplementation(async () => 22);
    const binaryPath = '/mock-path/filename.mock';
    await adb.remoteInstall(deviceId, binaryPath);

    expect(spawnWithRetriesAndLogs).toHaveBeenCalledWith(
      adbBinPath,
      ['-s', deviceId, 'shell', 'pm', 'install', '-rg', binaryPath],
      expect.any(Object));
  });

  it('should remote-install (api≥22)', async () => {
    jest.spyOn(adb, 'apiLevel').mockImplementation(async () => 23);
    const binaryPath = '/mock-path/filename.mock';
    await adb.remoteInstall(deviceId, binaryPath);

    expect(spawnWithRetriesAndLogs).toHaveBeenCalledWith(
      adbBinPath,
      ['-s', deviceId, 'shell', 'pm', 'install', '-r', '-g', '-t', binaryPath],
      expect.any(Object));
  });

  it('should remote-install with proper spawning/retry options', async () => {
    const expectedOptions = {
      retries: 3,
      timeout: 45000,
      capture: ['stdout'],
    };
    const binaryPath = '/mock-path/filename.mock';
    await adb.install(deviceId, binaryPath);

    expect(spawnWithRetriesAndLogs).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expectedOptions);
  });

  it('global text-typing', async () => {
    const text = 'some-text-with spaces';
    const expectedText = 'some-text-with%sspaces';
    await adb.typeText(deviceId, text);
    expect(execWithRetriesAndLogs).toHaveBeenCalledWith(
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
      expect(spawnAndLog).toHaveBeenCalledWith(adbBinPath, expectedArgs, expect.any(Object));
    });

    it('should pass through additional args', async () => {
      const userArgs = ['-mock', '-args'];
      await adb.spawnInstrumentation(deviceId, userArgs, testRunner);
      expect(spawnAndLog).toHaveBeenCalledWith(adbBinPath, expect.arrayContaining([...userArgs, testRunner]), expect.any(Object));
    });

    it('should set detaching=false as spawn-options', async () => {
      const expectedOptions = {
        detached: false,
      };
      const userArgs = [];

      await adb.spawnInstrumentation(deviceId, userArgs, testRunner);

      expect(spawnAndLog).toHaveBeenCalledWith(adbBinPath, expect.any(Array), expectedOptions);
    });

    it('should chain-return the promise from spawn util', async () => {
      const userArgs = [];
      const mockPromise = Promise.resolve('mock');
      spawnAndLog.mockReturnValue(mockPromise);

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
      await adb.disableAndroidAnimations(deviceId);
      expect(execWithRetriesAndLogs).toHaveBeenCalledWith(`"${adbBinPath}" -s ${deviceId} shell "settings put global animator_duration_scale 0"`, { retries: 1 });
    });

    it('should disable window animations', async () => {
      await adb.disableAndroidAnimations(deviceId);
      expect(execWithRetriesAndLogs).toHaveBeenCalledWith(`"${adbBinPath}" -s ${deviceId} shell "settings put global window_animation_scale 0"`, { retries: 1 });
    });

    it('should disable transition (e.g. activity launch) animations', async () => {
      await adb.disableAndroidAnimations(deviceId);
      expect(execWithRetriesAndLogs).toHaveBeenCalledWith(`"${adbBinPath}" -s ${deviceId} shell "settings put global transition_animation_scale 0"`, { retries: 1 });
    });
  });

  describe('WiFi toggle', () => {
    it('should enable wifi', async () => {
      await adb.setWiFiToggle(deviceId, true);
      expect(execWithRetriesAndLogs).toHaveBeenCalledWith(`"${adbBinPath}" -s ${deviceId} shell "svc wifi enable"`, { retries: 1 });
    });

    it('should disable wifi', async () => {
      await adb.setWiFiToggle(deviceId, false);
      expect(execWithRetriesAndLogs).toHaveBeenCalledWith(`"${adbBinPath}" -s ${deviceId} shell "svc wifi disable"`, { retries: 1 });
    });
  });
});
