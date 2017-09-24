describe('AppleSimUtils', () => {
  let AppleSimUtils;
  let uut;
  let exec;
  let retry;

  const simUdid = `9C9ABE4D-70C7-49DC-A396-3CB1D0E82846`;
  const bundleId = 'bundle.id';

  beforeEach(() => {
    jest.mock('npmlog');
    jest.mock('../utils/exec');
    exec = require('../utils/exec');
    jest.mock('../utils/retry');
    retry = require('../utils/retry');

    AppleSimUtils = require('./AppleSimUtils');
    uut = new AppleSimUtils();
  });

  it(`appleSimUtils setPermissions`, async () => {
    uut.setPermissions(bundleId, simUdid, { permissions: { calendar: "YES" } });
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

  describe('boot', () => {
    it('waits for device by udid to be Shutdown, boots magically, then waits for state to be Booted', async () => {
      uut.findDeviceByUDID = jest.fn(() => Promise.resolve({ state: 'unknown' }));
      uut.waitForDeviceState = jest.fn(() => Promise.resolve(true));
      expect(exec.execWithRetriesAndLogs).not.toHaveBeenCalled();
      await uut.boot('some udid');
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith(expect.stringMatching('xcode-select -p'), undefined, expect.anything(), 1);
      expect(uut.waitForDeviceState).toHaveBeenCalledTimes(2);
      expect(uut.waitForDeviceState.mock.calls[0]).toEqual([`some udid`, `Shutdown`]);
      expect(uut.waitForDeviceState.mock.calls[1]).toEqual([`some udid`, `Booted`]);
    });

    it('skips if device state was already Booted', async () => {
      uut.findDeviceByUDID = jest.fn(() => Promise.resolve({ state: 'Booted' }));
      await uut.boot('udid');
      expect(uut.findDeviceByUDID).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).not.toHaveBeenCalled();
    });

    it('skips if device state was already Booting', async () => {
      uut.findDeviceByUDID = jest.fn(() => Promise.resolve({ state: 'Booting' }));
      await uut.boot('udid');
      expect(uut.findDeviceByUDID).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).not.toHaveBeenCalled();
    });
  });
});

