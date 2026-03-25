// @ts-nocheck
jest.mock('../../../../../utils/childProcess');
jest.mock('../../../../../utils/environment');

describe('AppleSimUtils', () => {
  let AppleSimUtils;
  let uut;
  let childProcess;
  let environment;

  beforeEach(() => {
    childProcess = require('../../../../../utils/childProcess');
    environment = require('../../../../../utils/environment');
    environment.getFrameworkPath.mockResolvedValue('/mock/framework');

    AppleSimUtils = require('./AppleSimUtils');
    uut = new AppleSimUtils();
  });

  describe('.launch', () => {
    const udid = 'UD-1D';
    const bundleId = 'com.test.app';

    beforeEach(() => {
      childProcess.execWithRetriesAndLogs.mockResolvedValue({
        stdout: `${bundleId}: 12345`,
      });
    });

    function givenArchArgumentAccessible(accessible) {
      jest.spyOn(uut, '_isArchArgumentAccessible').mockResolvedValue(accessible);
    }

    it('should pass --arch=x86_64 when arch is set and iOS >= 26', async () => {
      givenArchArgumentAccessible(true);
      await uut.launch(udid, bundleId, {}, '', 'x86_64');

      const launchCmd = childProcess.execWithRetriesAndLogs.mock.calls[0][0];
      expect(launchCmd).toContain(`simctl launch --arch=x86_64 ${udid} ${bundleId}`);
    });

    it('should strip --arch when arch is set but iOS < 26', async () => {
      givenArchArgumentAccessible(false);
      await uut.launch(udid, bundleId, {}, '', 'x86_64');

      const launchCmd = childProcess.execWithRetriesAndLogs.mock.calls[0][0];
      expect(launchCmd).toContain(`simctl launch ${udid} ${bundleId}`);
      expect(launchCmd).not.toContain('--arch');
    });

    it('should omit --arch when arch is undefined', async () => {
      await uut.launch(udid, bundleId, {}, '');

      const launchCmd = childProcess.execWithRetriesAndLogs.mock.calls[0][0];
      expect(launchCmd).toContain(`simctl launch ${udid} ${bundleId}`);
      expect(launchCmd).not.toContain('--arch');
    });

    it('should not query device version when arch is undefined', async () => {
      const spy = jest.spyOn(uut, '_isArchArgumentAccessible');
      await uut.launch(udid, bundleId, {}, '');

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
