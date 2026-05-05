// @ts-nocheck
describe('Emulator driver', () => {
  const adbName = 'mock-emulator-5554';
  const avdName = 'Pixel_API_34';

  let adb;
  let instrumentation;
  let uut;

  beforeEach(() => {
    jest.mock('../../../../../utils/logger');

    jest.mock('../../../../common/drivers/android/exec/ADB');
    const ADB = jest.requireMock('../../../../common/drivers/android/exec/ADB');
    adb = new ADB();

    jest.mock('../../../../common/drivers/android/tools/MonitoredInstrumentation');
    const MonitoredInstrumentation = jest.requireMock('../../../../common/drivers/android/tools/MonitoredInstrumentation');
    instrumentation = new MonitoredInstrumentation();

    const Emitter = jest.createMockFromModule('../../../../../utils/AsyncEmitter');
    const eventEmitter = new Emitter();

    const { InvocationManager } = jest.createMockFromModule('../../../../../invoke');
    const invocationManager = new InvocationManager();

    const EmulatorDriver = require('./EmulatorDriver');
    uut = new EmulatorDriver({
      adb,
      instrumentation,
      invocationManager,
      eventEmitter,
      client: {},
    }, { adbName, avdName, forceAdbInstall: false });
  });

  describe('biometrics', () => {
    it('setBiometricEnrollment("YES") delegates to adb with enabled=true', async () => {
      await uut.setBiometricEnrollment('YES');
      expect(adb.setBiometricEnrollment).toHaveBeenCalledWith(adbName, true);
    });

    it('setBiometricEnrollment("NO") delegates to adb with enabled=false', async () => {
      await uut.setBiometricEnrollment('NO');
      expect(adb.setBiometricEnrollment).toHaveBeenCalledWith(adbName, false);
    });

    it('matchFinger delegates to adb.matchFinger', async () => {
      await uut.matchFinger();
      expect(adb.matchFinger).toHaveBeenCalledWith(adbName);
    });

    it('unmatchFinger delegates to adb.unmatchFinger', async () => {
      await uut.unmatchFinger();
      expect(adb.unmatchFinger).toHaveBeenCalledWith(adbName);
    });

    it('matchFace delegates to adb.matchFace', async () => {
      await uut.matchFace();
      expect(adb.matchFace).toHaveBeenCalledWith(adbName);
    });

    it('unmatchFace delegates to adb.unmatchFace', async () => {
      await uut.unmatchFace();
      expect(adb.unmatchFace).toHaveBeenCalledWith(adbName);
    });

    it('setBiometricEnrollment with { androidFace: true } delegates to adb.setFaceEnrollment', async () => {
      await uut.setBiometricEnrollment('YES', { androidFace: true });
      expect(adb.setFaceEnrollment).toHaveBeenCalledWith(adbName, true);
      expect(adb.setBiometricEnrollment).not.toHaveBeenCalled();
    });

    it('setBiometricEnrollment with { androidFace: true } clears instrumentation termination callback before the potentially-rebooting setup', async () => {
      await uut.setBiometricEnrollment('YES', { androidFace: true });
      expect(instrumentation.setTerminationFn).toHaveBeenCalledWith(null);
    });

    it('setBiometricEnrollment("NO") with { androidFace: true } delegates to adb.setFaceEnrollment(false)', async () => {
      await uut.setBiometricEnrollment('NO', { androidFace: true });
      expect(adb.setFaceEnrollment).toHaveBeenCalledWith(adbName, false);
    });

    it('setBiometricEnrollment without options still delegates to adb.setBiometricEnrollment (fingerprint path)', async () => {
      await uut.setBiometricEnrollment('YES');
      expect(adb.setBiometricEnrollment).toHaveBeenCalledWith(adbName, true);
      expect(adb.setFaceEnrollment).not.toHaveBeenCalled();
    });
  });
});
