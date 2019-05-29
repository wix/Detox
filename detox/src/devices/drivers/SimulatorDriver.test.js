describe('IOS simulator driver', () => {
  let uut;

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
});

class mockAppleSimUtils {
  constructor() {
    this.launch = jest.fn();
  }
}
