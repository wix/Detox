const _ = require('lodash');
const simctlList = require('./xcrunSimctlList.mock.json');

describe('AppleSimUtils', () => {
  let AppleSimUtils;
  let uut;
  let exec;
  let retry;
  let environment;
  let tempfile;

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
    jest.mock('tempfile');
    tempfile = require('tempfile');

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

  describe('findDevicesUDID', () => {

    it('return multiple devices', async () => {
      exec.execWithRetriesAndLogs
          .mockReturnValueOnce(Promise.resolve({
            stdout: JSON.stringify(simctlList)}))
          .mockReturnValueOnce(Promise.resolve({
        stdout: JSON.stringify([
          {
            "state": "Shutdown",
            "availability": "(available)",
            "name": "iPhone 6",
            "udid": "the uuid1",
            "os": {
              "version": "10.3.1",
              "availability": "(available)",
              "name": "iOS 10.3",
              "identifier": "com.apple.CoreSimulator.SimRuntime.iOS-10-3",
              "buildversion": "14E8301"
            }
          },
          {
            "state": "Shutdown",
            "availability": "(available)",
            "name": "iPhone 6",
            "udid": "the uuid2",
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
      const result = await uut.findDevicesUDID('iPhone 7');
      expect(result).toEqual(['the uuid1', 'the uuid2']);
    });
  });


  describe('findDeviceUDID', () => {

    it('adapted to new api with optional OS', async () => {
      try {
        await uut.findDeviceUDID('iPhone 6 , iOS 10.3');
      } catch (e) { }
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith('applesimutils', {
        args: `--list --byType "iPhone 6" --byOS "iOS 10.3"`
      }, expect.anything(), 1, undefined);
    });

    it('returns udid from found device', async () => {
      exec.execWithRetriesAndLogs
          .mockReturnValueOnce(Promise.resolve({
            stdout: JSON.stringify(simctlList)}))
          .mockReturnValueOnce(Promise.resolve({
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
      exec.execWithRetriesAndLogs
          .mockReturnValueOnce(Promise.resolve({
            stdout: JSON.stringify(simctlList)}))
          .mockReturnValueOnce(Promise.resolve({
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
      });

      it('invalid input, not parseable', async () => {
        exec.execWithRetriesAndLogs.mockReturnValueOnce(Promise.resolve({ stdout: '/' }));
        try {
          await uut.findDeviceUDID('iPhone 6, iOS 10');
          fail('should throw');
        } catch (e) {
          expect(e.message).toMatch(`Could not parse response from applesimutils, please update applesimutils and try again.
      'brew uninstall applesimutils && brew tap wix/brew && brew install applesimutils'`);
        }
      });
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
        expect(e).toEqual(new Error(`Can't read Xcode version, got: 'undefined'`));
      }
    });

    it('throws when invalid version', async () => {
      exec.execWithRetriesAndLogs.mockReturnValueOnce(Promise.resolve({ stdout: 'Xcode bla' }));
      try {
        await uut.getXcodeVersion();
        fail(`should throw`);
      } catch (e) {
        expect(e).toEqual(new Error(`Can't read Xcode version, got: 'Xcode bla'`));
      }
    });
  });

  describe('boot', () => {

    it('waits for device by udid to be Shutdown, boots magically, then waits for state to be Booted', async () => {
      uut.findDeviceByUDID = jest.fn(() => Promise.resolve({ state: 'unknown' }));
      uut.getXcodeVersion = jest.fn(() => Promise.resolve(1));
      expect(exec.execWithRetriesAndLogs).not.toHaveBeenCalled();
      await uut.boot('some-udid');
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(expect.stringMatching('xcode-select -p'), undefined, expect.anything(), 1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(expect.stringMatching('bootstatus some-udid'), undefined, expect.anything(), 1);
    });

    it('skips if device state was already Booted', async () => {
      uut.findDeviceByUDID = jest.fn(() => Promise.resolve({ state: 'Booted' }));
      uut.getXcodeVersion = jest.fn(() => Promise.resolve(1));
      await uut.boot('udid');
      expect(uut.findDeviceByUDID).toHaveBeenCalledTimes(1);
      expect(uut.findDeviceByUDID).toHaveBeenCalledWith('udid');
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
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(expect.stringMatching('xcrun simctl boot udid'), undefined, expect.anything(), 10);

    });
  });

  describe('create', () => {

    it('calls xcrun to get a list of runtimes/devicetypes/devices', async () => {
      exec.execWithRetriesAndLogs.mockReturnValue(Promise.resolve({stdout: JSON.stringify(simctlList)}));

      const created = await uut.create('iPhone X');
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(2);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(
        `/usr/bin/xcrun simctl list -j`,
        undefined,
        expect.anything(),
        1);
    });

    it('errors when there is no runtime available', async () => {
      exec.execWithRetriesAndLogs.mockReturnValueOnce(Promise.resolve({stdout: "{}"}));
      try {
        await uut.create('iPhone 7 Plus');
        fail(`should throw`);
      }
      catch (e) {
        expect(`${e}`).toEqual('Error: Unable to create device. No runtime found for iPhone 7 Plus');
      }
    });


    xit('creates using the newest runtime version', async () => {
      exec.execWithRetriesAndLogs.mockReturnValueOnce(Promise.resolve({stdout: JSON.stringify(simctlList)}));

      const created = await uut.create('iPhone 7 Plus');

      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(
        `/usr/bin/xcrun simctl create "iPhone  7 Plus" "iPhone 7 Plus" "com.apple.CoreSimulator.SimRuntime.iOS-11-3`,
        undefined,
        expect.anything(),
        1);
      expect(created).toEqual(true);
    });
  });


  describe('install', () => {
    it('calls xcrun', async () => {
      await uut.install('udid', 'somePath');
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(
        `/usr/bin/xcrun simctl install udid "somePath"`,
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
      const HOME = process.env.HOME;
      expect(uut.getLogsPaths('123')).toEqual({
        stdout: `${HOME}/Library/Developer/CoreSimulator/Devices/123/data/tmp/detox.last_launch_app_log.out`,
        stderr: `${HOME}/Library/Developer/CoreSimulator/Devices/123/data/tmp/detox.last_launch_app_log.err`,
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

  describe('takeScreenshot', () => {
    it('executes simctl screenshot command', async () => {
      const udid = Math.random();
      const dest = '/tmp/' + Math.random();

      await uut.takeScreenshot(udid, dest);

      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`xcrun simctl io ${udid} screenshot "${dest}"`)),
        undefined,
        expect.anything(),
        1
      );
    });
  });

  describe('recordVideo', () => {
    it('spawns simctl process with recordVideo command', async () => {
      const childProcessPromise = Object.assign(Promise.resolve(), { childProcess: {} });
      const udid = Math.random();
      const dest = '/tmp/' + Math.random();
      exec.spawnAndLog.mockReturnValueOnce(childProcessPromise);

      const result = uut.recordVideo(udid, dest);

      expect(exec.spawnAndLog).toHaveBeenCalledTimes(1);
      expect(exec.spawnAndLog).toHaveBeenCalledWith(
        expect.stringMatching(/xcrun/),
        ['simctl', 'io', udid, 'recordVideo', dest]
      );

      expect(result).toEqual(childProcessPromise);
    });
  });
});

