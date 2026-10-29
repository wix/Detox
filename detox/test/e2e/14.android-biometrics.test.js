describe(':android: Android biometrics', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.setBiometricEnrollment(false).catch(() => {});
    await device.setBiometricEnrollment(false, { androidFace: true }).catch(() => {});
  });

  describe('fingerprint (default)', () => {
    it('setBiometricEnrollment(true) resolves without throwing', async () => {
      await device.setBiometricEnrollment(true);
    });

    it('matchFinger resolves without throwing after enrollment', async () => {
      await device.setBiometricEnrollment(true);
      await device.matchFinger();
    });

    it('unmatchFinger resolves without throwing after enrollment', async () => {
      await device.setBiometricEnrollment(true);
      await device.unmatchFinger();
    });

    it('setBiometricEnrollment(false) resolves without throwing', async () => {
      await device.setBiometricEnrollment(false);
    });
  });

  describe('face (Virtual Face HAL, opt-in)', () => {
    it('setBiometricEnrollment(true, { androidFace: true }) resolves without throwing (reboots emulator on first call)', async () => {
      await device.setBiometricEnrollment(true, { androidFace: true });
      await device.launchApp({ newInstance: true });
    }, 240000);

    it('matchFace resolves without throwing after face enrollment', async () => {
      await device.matchFace();
    });

    it('unmatchFace resolves without throwing after face enrollment', async () => {
      await device.unmatchFace();
    });

    it('setBiometricEnrollment(false, { androidFace: true }) resolves without throwing', async () => {
      await device.setBiometricEnrollment(false, { androidFace: true });
    });
  });
});
