describe('IOS simulator driver', () => {
  let uut, sim;

  const deviceId = 'device-id-mock';
  const bundleId = 'bundle-id-mock';

  beforeEach(() => {
    jest.mock('../ios/AppleSimUtils', () => mockAppleSimUtils);
  });

  describe('launch args', () => {
    let launchArgs, languageAndLocale;

    beforeEach(() => {
      launchArgs = {
        'dog1': 'dharma',
        'dog2': 'karma',
      };

      languageAndLocale = '';

      const SimulatorDriver = require('./SimulatorDriver');
      uut = new SimulatorDriver({ client: {} });
    });

    it('should be passed to AppleSimUtils', async () => {
      await uut.launchApp(deviceId, bundleId, launchArgs, languageAndLocale);
      expect(uut.applesimutils.launch).toHaveBeenCalledWith(deviceId, bundleId, launchArgs, languageAndLocale);
    });

    it('should be passed to AppleSimUtils even if some of them were received from `beforeLaunchApp` phase', async () => {
      uut.emitter.on('beforeLaunchApp', ({ launchArgs }) => {
        launchArgs.dog3 = 'Chika, from plugin';
      });

      await uut.launchApp(deviceId, bundleId, launchArgs, languageAndLocale);
      expect(uut.applesimutils.launch).toHaveBeenCalledWith(deviceId, bundleId, {
        ...launchArgs,
        dog3: 'Chika, from plugin',
      }, '');
    });
  });

  describe('biometrics', () => {
    beforeEach(() => {
      languageAndLocale = '';

      const SimulatorDriver = require('./SimulatorDriver');
      sim = new SimulatorDriver({ client: {} });
    });

    it('enrolls in biometrics by passing to AppleSimUtils', async () => {
      await sim.setBiometricEnrollment(deviceId, 'YES');
      expect(sim.applesimutils.setBiometricEnrollment).toHaveBeenCalledWith(deviceId, 'YES');
    });

    it('disenrolls in biometrics by passing to AppleSimUtils', async () => {
      await sim.setBiometricEnrollment(deviceId, 'NO');
      expect(sim.applesimutils.setBiometricEnrollment).toHaveBeenCalledWith(deviceId, 'NO');
    });

    it('matches a face by passing to AppleSimUtils', async () => {
      await sim.matchFace(deviceId);
      expect(sim.applesimutils.matchBiometric).toHaveBeenCalledWith(deviceId, 'Face');
    });

    it('fails to match a face by passing to AppleSimUtils', async () => {
      await sim.unmatchFace(deviceId);
      expect(sim.applesimutils.unmatchBiometric).toHaveBeenCalledWith(deviceId, 'Face');
    });

    it('matches a face by passing to AppleSimUtils', async () => {
      await sim.matchFinger(deviceId);
      expect(sim.applesimutils.matchBiometric).toHaveBeenCalledWith(deviceId, 'Finger');
    });

    it('fails to match a face by passing to AppleSimUtils', async () => {
      await sim.unmatchFinger(deviceId);
      expect(sim.applesimutils.unmatchBiometric).toHaveBeenCalledWith(deviceId, 'Finger');
    })
  });
});

class mockAppleSimUtils {
  constructor() {
    this.launch = jest.fn();
    this.setBiometricEnrollment = jest.fn();
    this.matchBiometric = jest.fn();
    this.unmatchBiometric = jest.fn();
  }
}
