describe('IOS simulator driver', () => {

  const deviceId = 'device-id-mock';
  const bundleId = 'bundle-id-mock';

  describe('launch args', () => {

    let uut;
    beforeEach(() => {
      jest.mock('../ios/AppleSimUtils', () => mockAppleSimUtils);

      const SimulatorDriver = require('./SimulatorDriver');
      uut = new SimulatorDriver({
        client: {},
      });
    });

    it('should inject a prefix to arg keys', async () => {
      const launchArgs = {
        'dog1': 'dharma',
        'dog2': 'karma',
      };

      await uut.launchApp(deviceId, bundleId, launchArgs, '');

      const simUtilsLaunchAllArgs = uut.applesimutils.launch.mock.calls[0];
      const simUtilsLaunchArgs = simUtilsLaunchAllArgs[2];
      expect(simUtilsLaunchArgs).toEqual({
        '-dog1': 'dharma',
        '-dog2': 'karma',
      });
    });
  });
});

class mockAppleSimUtils {
  constructor() {
    this.launch = jest.fn();
  }
}
