describe('AppleSimUtils', () => {
  let AppleSimUtils;
  let appSimUtils;
  let exec;

  const simUdid = `9C9ABE4D-70C7-49DC-A396-3CB1D0E82846`;
  const bundleId = 'bundle.id';

  beforeEach(() => {
    jest.mock('npmlog');
    jest.mock('../utils/exec');
    exec = require('../utils/exec');

    AppleSimUtils = require('./AppleSimUtils');
    appSimUtils = new AppleSimUtils();
  });

  it(`appleSimUtils setPermissions`, async () => {
    appSimUtils.setPermissions(bundleId, simUdid, { permissions: { calendar: "YES" } });
    expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
  });

  describe('findDeviceUUID', () => {
    it('correct params', async () => {
      expect(exec.execWithRetriesAndLogs).not.toHaveBeenCalled();
      try {
        await appSimUtils.findDeviceUUID('iPhone 6');
      } catch (e) { }
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith('applesimutils', {
        args: `--list "iPhone 6" --maxResults=1`
      }, expect.anything(), 1, undefined);
    });

    it('adapted to new api with optional OS', async () => {
      try {
        await appSimUtils.findDeviceUUID('iPhone 6 , iOS 10.3');
      } catch (e) { }
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith('applesimutils', {
        args: `--list "iPhone 6, OS=iOS 10.3" --maxResults=1`
      }, expect.anything(), 1, undefined);
    });

    it('returns udid from found device', async () => {
      exec.execWithRetriesAndLogs.mockReturnValueOnce(Promise.resolve({
        stdout: JSON.stringify([
          {
            "state": "Shutdown",
            "availability": "(available)",
            "name": "iPhone 6",
            "udid": "the uuid",
            "os": {
              "version": "10.3.1",
              "availability": "(available)",
              "name": "iOS 10.3",
              "identifier": "com.apple.CoreSimulator.SimRuntime.iOS-10-3",
              "buildversion": "14E8301"
            }
          }
        ])
      }));
      const result = await appSimUtils.findDeviceUUID('iPhone 7');
      expect(result).toEqual('the uuid');
    });

    describe('throws on bad response', () => {
      const args = [
        null,
        {},
        { stdout: '' },
        { stdout: '[]' },
        { stdout: '[{}]' },
        { stdout: '[{ "udid": "" }]' }
      ];
      args.forEach((arg) => {
        it(`invalid input ${JSON.stringify(arg)}`, async () => {
          exec.execWithRetriesAndLogs.mockReturnValueOnce(Promise.resolve(arg));
          try {
            await appSimUtils.findDeviceUUID('iPhone 6, iOS 10');
            fail('should throw');
          } catch (e) {
            expect(e.message).toMatch(`Can't find a simulator to match with "iPhone 6, iOS 10"`);
          }
        });
      })
    });

  });
});

