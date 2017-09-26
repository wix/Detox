describe('AppleSimUtils', () => {
  let AppleSimUtils;
  let uut;
  let exec;
  let retry;
  let environment;

  const simUdid = `9C9ABE4D-70C7-49DC-A396-3CB1D0E82846`;
  const bundleId = 'bundle.id';

  beforeEach(() => {
    jest.mock('npmlog');
    jest.mock('../utils/exec');
    exec = require('../utils/exec');
    jest.mock('../utils/retry');
    retry = require('../utils/retry');
    jest.mock('../utils/environment');
    environment = require('../utils/environment');

    AppleSimUtils = require('./AppleSimUtils');
    uut = new AppleSimUtils();
  });

  it(`appleSimUtils setPermissions`, async () => {
    uut.setPermissions(bundleId, simUdid, {
      permissions:
      { calendar: "YES" }
    });
    expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
  });

  describe('findDeviceUDID', () => {
    it('correct params', async () => {
      expect(exec.execWithRetriesAndLogs).not.toHaveBeenCalled();
      try {
        await uut.findDeviceUDID('iPhone 6');
      } catch (e) { }
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith('applesimutils', {
        args: `--list "iPhone 6" --maxResults=1`
      }, expect.anything(), 1, undefined);
    });

    it('adapted to new api with optional OS', async () => {
      try {
        await uut.findDeviceUDID('iPhone 6 , iOS 10.3');
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
      const result = await uut.findDeviceUDID('iPhone 7');
      expect(result).toEqual('the uuid');
    });

    it('handles stderr as if stdout', async () => {
      exec.execWithRetriesAndLogs.mockReturnValueOnce(Promise.resolve({
        stderr: JSON.stringify([
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
      const result = await uut.findDeviceUDID('iPhone 7');
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
            await uut.findDeviceUDID('iPhone 6, iOS 10');
            fail('should throw');
          } catch (e) {
            expect(e.message).toMatch(`Can't find a simulator to match with "iPhone 6, iOS 10"`);
          }
        });
      })
    });
  });

  describe('findDeviceByUDID', () => {
    it('throws when cant find device by udid', async () => {
      try {
        await uut.findDeviceByUDID('someUdid');
        fail('should throw');
      } catch (e) {
        expect(e).toEqual(new Error(`Can't find device someUdid`));
      }
    });

    it('lists devices, finds by udid', async () => {
      const device = { udid: 'someUdid' };
      exec.execWithRetriesAndLogs.mockReturnValueOnce(Promise.resolve({ stdout: JSON.stringify([device, { udid: 'other' }]) }));
      const result = await uut.findDeviceByUDID('someUdid');
      expect(result).toEqual(device);
    });
  });

  describe('waitForDeviceState', () => {
    it('findsDeviceByUdid', async () => {
      uut.findDeviceByUDID = jest.fn(() => Promise.resolve({ udid: 'the udid', state: 'the state' }));
      retry.mockImplementation((opts, fn) => Promise.resolve(fn()));
      const result = await uut.waitForDeviceState(`the udid`, `the state`);
      expect(uut.findDeviceByUDID).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ udid: 'the udid', state: 'the state' });
    });

    it('waits for state to be equal', async () => {
      uut.findDeviceByUDID = jest.fn(() => Promise.resolve({ udid: 'the udid', state: 'different state' }));
      retry.mockImplementation((opts, fn) => Promise.resolve(fn()));
      try {
        await uut.waitForDeviceState(`the udid`, `the state`);
        fail(`should throw`);
      } catch (e) {
        expect(e).toEqual(new Error(`device is in state 'different state'`));
      }
      expect(uut.findDeviceByUDID).toHaveBeenCalledTimes(1);
      expect(retry).toHaveBeenCalledTimes(1);
      expect(retry).toHaveBeenCalledWith({ retries: 10, interval: 1000 }, expect.any(Function));
    });
  });

  describe('getXcodeVersion', () => {
    it('returns xcode major version', async () => {
      exec.execWithRetriesAndLogs.mockReturnValueOnce(Promise.resolve({ stdout: 'Xcode 123.456\nBuild version 123abc123\n' }));
      const result = await uut.getXcodeVersion();
      expect(result).toEqual(123);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toBeCalledWith(`xcodebuild -version`, undefined, undefined, 1);
    });

    it('handles all sorts of results', async () => {
      exec.execWithRetriesAndLogs.mockReturnValueOnce(Promise.resolve({ stdout: 'Xcode 999' }));
      const result = await uut.getXcodeVersion();
      expect(result).toEqual(999);
    });

    it('throws when cant read version', async () => {
      try {
        await uut.getXcodeVersion();
        fail(`should throw`);
      } catch (e) {
        expect(e).toEqual(new Error(`Can't read Xcode version, got: undefined`));
      }
    });

    it('throws when invalid version', async () => {
      exec.execWithRetriesAndLogs.mockReturnValueOnce(Promise.resolve({ stdout: 'Xcode bla' }));
      try {
        await uut.getXcodeVersion();
        fail(`should throw`);
      } catch (e) {
        expect(e).toEqual(new Error(`Can't read Xcode version, got: Xcode bla`));
      }
    });
  });

  describe('boot', () => {
    it('waits for device by udid to be Shutdown, boots magically, then waits for state to be Booted', async () => {
      uut.findDeviceByUDID = jest.fn(() => Promise.resolve({ state: 'unknown' }));
      uut.waitForDeviceState = jest.fn(() => Promise.resolve(true));
      uut.getXcodeVersion = jest.fn(() => Promise.resolve(1));
      expect(exec.execWithRetriesAndLogs).not.toHaveBeenCalled();
      await uut.boot('some udid');
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(expect.stringMatching('xcode-select -p'), undefined, expect.anything(), 1);
      expect(uut.waitForDeviceState).toHaveBeenCalledTimes(2);
      expect(uut.waitForDeviceState.mock.calls[0]).toEqual([`some udid`, `Shutdown`]);
      expect(uut.waitForDeviceState.mock.calls[1]).toEqual([`some udid`, `Booted`]);
    });

    it('skips if device state was already Booted', async () => {
      uut.findDeviceByUDID = jest.fn(() => Promise.resolve({ state: 'Booted' }));
      uut.getXcodeVersion = jest.fn(() => Promise.resolve(1));
      await uut.boot('udid');
      expect(uut.findDeviceByUDID).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).not.toHaveBeenCalled();
    });

    it('skips if device state was already Booting', async () => {
      uut.findDeviceByUDID = jest.fn(() => Promise.resolve({ state: 'Booting' }));
      uut.getXcodeVersion = jest.fn(() => Promise.resolve(1));
      await uut.boot('udid');
      expect(uut.findDeviceByUDID).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).not.toHaveBeenCalled();
    });

    it('boots with xcrun simctl boot when xcode version >= 9', async () => {
      uut.findDeviceByUDID = jest.fn(() => Promise.resolve({ state: 'unknown' }));
      uut.getXcodeVersion = jest.fn(() => Promise.resolve(9));
      await uut.boot('udid');
      expect(uut.getXcodeVersion).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(expect.stringMatching('xcrun simctl boot udid'), undefined, expect.anything(), 10);

    });
  });

  describe('install', () => {
    it('calls xcrun', async () => {
      await uut.install('udid', 'somePath');
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(
        `/usr/bin/xcrun simctl install udid somePath`,
        undefined,
        expect.anything(),
        1);
    });
  });

  describe('uninstall', () => {
    it('calls xcrun', async () => {
      await uut.uninstall('udid', 'theBundleId');
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(
        `/usr/bin/xcrun simctl uninstall udid theBundleId`,
        undefined,
        expect.anything(),
        1);
    });

    it('does not throw', async () => {
      exec.execWithRetriesAndLogs.mockImplementation(() => Promise.reject('some reason'));
      await uut.uninstall('udid', 'theBundleId');
    });
  });

  describe('launch', () => {
    it('launches magically', async () => {
      await uut.launch('udid', 'theBundleId');
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(
        expect.stringMatching(/^.*xcrun simctl launch.*$/),
        undefined,
        expect.anything(),
        1);
    });

    it('concats args', async () => {
      await uut.launch('udid', 'theBundleId', { 'foo': 'bar', 'bob': 'yourUncle' });
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(
        expect.stringMatching(/^.*xcrun simctl launch.* --args foo bar bob yourUncle$/),
        undefined,
        expect.anything(),
        1);
    });

    it('asks environment for frameworkPath', async () => {
      environment.getFrameworkPath.mockReturnValueOnce(Promise.resolve('thePathToFrameworks'));
      await uut.launch('udid', 'theBundleId');
      expect(environment.getFrameworkPath).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(
        expect.stringMatching(/^.*thePathToFrameworks\/Detox.*xcrun simctl launch.*$/),
        undefined,
        expect.anything(),
        1);
    });

    it('should fail when cant locate framework path', async () => {
      environment.getFrameworkPath.mockReturnValueOnce(Promise.reject('cant find anything'));
      try {
        await uut.launch('udid', 'theBundleId');
        fail(`should throw`);
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it('returns the parsed id', async () => {
      exec.execWithRetriesAndLogs.mockReturnValueOnce(Promise.resolve({ stdout: 'appId: 12345 \n' }));
      const result = await uut.launch('udid', 'theBundleId');
      expect(result).toEqual(12345);
    });
  });

  describe('sendToHome', () => {
    it('calls xcrun', async () => {
      await uut.sendToHome('theUdid');
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(
        expect.stringMatching(/.*xcrun simctl launch theUdid.*/),
        undefined,
        expect.anything(),
        10
      );
    });
  });

  describe('getLogsPaths', () => {
    it('returns correct paths', () => {
      expect(uut.getLogsPaths('123')).toEqual({
        stdout: '$HOME/Library/Developer/CoreSimulator/Devices/123/data/tmp/detox.last_launch_app_log.out',
        stderr: '$HOME/Library/Developer/CoreSimulator/Devices/123/data/tmp/detox.last_launch_app_log.err'
      })
    });
  });

  describe('terminate', () => {
    it('calls xcrun simctl', async () => {
      await uut.terminate('theUdid', 'thebundleId');
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(
        expect.stringMatching(/.*xcrun simctl terminate theUdid thebundleId.*/),
        undefined,
        expect.anything(),
        1);
    });
  });

  describe('shutdown', () => {
    it('calls xcrun simctl', async () => {
      await uut.shutdown('theUdid');
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(
        expect.stringMatching(/.*xcrun simctl shutdown theUdid.*/),
        undefined,
        expect.anything(),
        1);
    });
  });

  describe('openUrl', () => {
    it('calls xcrun simctl', async () => {
      await uut.openUrl('theUdid', 'someUrl');
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(
        expect.stringMatching(/.*xcrun simctl openurl theUdid someUrl.*/),
        undefined,
        expect.anything(),
        1);
    });
  });

  describe('setLocation', () => {
    it('throws when no fbsimctl installed', async () => {
      try {
        await uut.setLocation('theUdid', 123.456, 789.123);
        fail(`should throw`);
      } catch (e) {
        expect(e.message).toMatch(/.*Install fbsimctl using.*/);
        expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
      }
    });

    it('calls fbsimctl set_location', async () => {
      exec.execWithRetriesAndLogs.mockReturnValueOnce(Promise.resolve({ stdout: `true` }));
      await uut.setLocation('theUdid', 123.456, 789.123);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(2);
      expect(exec.execWithRetriesAndLogs.mock.calls[1][0])
        .toMatch(/.*fbsimctl theUdid set_location 123.456 789.123.*/);
    });
  });

  describe('resetContentAndSettings', () => {
    it('shutdown, simctl erase, then boot', async () => {
      uut.shutdown = jest.fn();
      uut.boot = jest.fn();
      expect(uut.shutdown).not.toHaveBeenCalled();
      expect(uut.boot).not.toHaveBeenCalled();
      await uut.resetContentAndSettings('theUdid');
      expect(uut.shutdown).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(
        expect.stringMatching(/.*xcrun simctl erase theUdid.*/),
        undefined,
        expect.anything(),
        1);
      expect(uut.boot).toHaveBeenCalledTimes(1);
    });
  });

});

