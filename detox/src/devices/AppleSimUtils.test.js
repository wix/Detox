const _ = require('lodash');

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

  describe('findDevicesUDID', () => {

    it('return multiple devices', async () => {
      exec.execWithRetriesAndLogs.mockReturnValueOnce(Promise.resolve({
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
    it('correct params', async () => {
      expect(exec.execWithRetriesAndLogs).not.toHaveBeenCalled();
      try {
        await uut.findDeviceUDID('iPhone 6');
      } catch (e) { }
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith('applesimutils', {
        args: `--list "iPhone 6"`
      }, expect.anything(), 1, undefined);
    });

    it('adapted to new api with optional OS', async () => {
      try {
        await uut.findDeviceUDID('iPhone 6 , iOS 10.3');
      } catch (e) { }
      expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith('applesimutils', {
        args: `--list "iPhone 6, OS=iOS 10.3"`
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

    const simctlList = {
        "devicetypes" : [
          {
            "name" : "iPhone 4s",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPhone-4s"
          },
          {
            "name" : "iPhone 5",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPhone-5"
          },
          {
            "name" : "iPhone 5s",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPhone-5s"
          },
          {
            "name" : "iPhone 6",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPhone-6"
          },
          {
            "name" : "iPhone 6 Plus",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPhone-6-Plus"
          },
          {
            "name" : "iPhone 6s",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPhone-6s"
          },
          {
            "name" : "iPhone 6s Plus",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPhone-6s-Plus"
          },
          {
            "name" : "iPhone 7",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPhone-7"
          },
          {
            "name" : "iPhone 7 Plus",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPhone-7-Plus"
          },
          {
            "name" : "iPhone SE",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPhone-SE"
          },
          {
            "name" : "iPhone2017-A",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPhone-8"
          },
          {
            "name" : "iPhone2017-B",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPhone-8-Plus"
          },
          {
            "name" : "iPhone2017-C",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPhone-X"
          },
          {
            "name" : "iPad 2",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPad-2"
          },
          {
            "name" : "iPad Retina",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPad-Retina"
          },
          {
            "name" : "iPad Air",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPad-Air"
          },
          {
            "name" : "iPad Air 2",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPad-Air-2"
          },
          {
            "name" : "iPad (5th generation)",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPad--5th-generation-"
          },
          {
            "name" : "iPad Pro (9.7-inch)",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPad-Pro--9-7-inch-"
          },
          {
            "name" : "iPad Pro (12.9-inch)",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPad-Pro"
          },
          {
            "name" : "iPad Pro (12.9-inch) (2nd generation)",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPad-Pro--12-9-inch---2nd-generation-"
          },
          {
            "name" : "iPad Pro (10.5-inch)",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.iPad-Pro--10-5-inch-"
          },
          {
            "name" : "Apple TV",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.Apple-TV-1080p"
          },
          {
            "name" : "Apple TV 4K",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.Apple-TV-4K-4K"
          },
          {
            "name" : "Apple TV 4K (at 1080p)",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.Apple-TV-4K-1080p"
          },
          {
            "name" : "Apple Watch - 38mm",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.Apple-Watch-38mm"
          },
          {
            "name" : "Apple Watch - 42mm",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.Apple-Watch-42mm"
          },
          {
            "name" : "Apple Watch Series 2 - 38mm",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.Apple-Watch-Series-2-38mm"
          },
          {
            "name" : "Apple Watch Series 2 - 42mm",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.Apple-Watch-Series-2-42mm"
          },
          {
            "name" : "Watch2017 - 38mm",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.Apple-Watch-Series-3-38mm"
          },
          {
            "name" : "Watch2017 - 42mm",
            "identifier" : "com.apple.CoreSimulator.SimDeviceType.Apple-Watch-Series-3-42mm"
          }
        ],
        "runtimes" : [
          {
            "buildversion" : "13C75",
            "availability" : "(available)",
            "name" : "iOS 9.2",
            "identifier" : "com.apple.CoreSimulator.SimRuntime.iOS-9-2",
            "version" : "9.2"
          },
          {
            "buildversion" : "15A372",
            "availability" : "(available)",
            "name" : "iOS 11.0",
            "identifier" : "com.apple.CoreSimulator.SimRuntime.iOS-11-0",
            "version" : "11.0"
          },
          {
            "buildversion" : "15J380",
            "availability" : "(available)",
            "name" : "tvOS 11.0",
            "identifier" : "com.apple.CoreSimulator.SimRuntime.tvOS-11-0",
            "version" : "11.0"
          },
          {
            "buildversion" : "15R372",
            "availability" : "(available)",
            "name" : "watchOS 4.0",
            "identifier" : "com.apple.CoreSimulator.SimRuntime.watchOS-4-0",
            "version" : "4.0"
          }
        ],
        "devices" : {
          "com.apple.CoreSimulator.SimRuntime.iOS-10-3" : [
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 5",
              "udid" : "D4D2213B-1A98-4EBD-8E03-F52B4E739B45"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 5s",
              "udid" : "F069D970-41D1-44C6-A1B1-8C0E3A10D5A0"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 6",
              "udid" : "15DD6668-072D-444E-BD56-C143665F6CD6"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 6 Plus",
              "udid" : "908DC74E-FA0B-48FE-AD88-6FBBCB017250"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 6s",
              "udid" : "6609FFB6-08C8-4195-ADBE-D1EDC4004ECF"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 6s Plus",
              "udid" : "08E4145F-5AE4-4BD2-8937-169F7793E6E2"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 7",
              "udid" : "1187FB7A-61B9-4892-B812-4E97C950C1A9"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 7 Plus",
              "udid" : "D12A1E7C-3E50-4168-8731-AE8DFB702C6C"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone SE",
              "udid" : "ABDC82BE-A1AA-4AC3-AC63-20C3200CA868"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Air",
              "udid" : "36E04E65-EDC4-4199-9B8D-F5F20D907BE9"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Air 2",
              "udid" : "9B5CEB84-A78B-471D-BCDF-A5406A2C78B9"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad (5th generation)",
              "udid" : "EE27F2B8-4ECA-48D5-9AAA-5B6B71E4B47A"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Pro (9.7 inch)",
              "udid" : "DF67BCEB-1E98-4862-8E29-4262E45C36DD"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Pro (12.9 inch)",
              "udid" : "464C614E-0B52-459E-81F8-5D48E6726A01"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Pro (12.9-inch) (2nd generation)",
              "udid" : "4243CB58-55C7-4668-8F75-868B6FC1E411"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Pro (10.5-inch)",
              "udid" : "FA595536-1EFD-412E-8FC8-4E9945CF59A1"
            }
          ],
          "com.apple.CoreSimulator.SimRuntime.tvOS-9-2" : [
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "Apple TV 1080p",
              "udid" : "86C23AE7-E9E0-4358-91EB-DEA118CF5B4C"
            }
          ],
          "com.apple.CoreSimulator.SimRuntime.watchOS-3-2" : [
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "Apple Watch - 38mm",
              "udid" : "65216D2D-8329-4720-B7B7-56DE1DA223DE"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "Apple Watch - 42mm",
              "udid" : "B288646D-8B92-4799-A5F8-55ACF7EAB4FC"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "Apple Watch Series 2 - 38mm",
              "udid" : "C41A6B35-7FBD-4A25-BC59-A11DD490E543"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "Apple Watch Series 2 - 42mm",
              "udid" : "1089EFA6-E851-42DD-B88F-945193DBC47C"
            }
          ],
          "iOS 9.2" : [
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPhone 6s Plus",
              "udid" : "9E22FA5C-1225-4BB0-9883-03AA139BA731"
            }
          ],
          "com.apple.CoreSimulator.SimRuntime.tvOS-10-0" : [
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "Apple TV 1080p",
              "udid" : "9EC2F2E1-3FCC-4635-BC69-7558AB64E2B8"
            }
          ],
          "tvOS 11.0" : [
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "Apple TV 1080p",
              "udid" : "4F521FFA-99FF-4815-B1FE-0B19AC2A740D"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "Apple TV 4K",
              "udid" : "C0A6390F-C364-4922-AE22-C983A46409A3"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "Apple TV 4K (at 1080p)",
              "udid" : "8C1B1F1E-5FED-449F-A918-6C0E808EAA3D"
            }
          ],
          "com.apple.CoreSimulator.SimRuntime.iOS-9-3" : [
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 4s",
              "udid" : "A0C05A53-04A7-4D19-BEC9-5BF961483DD9"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 5",
              "udid" : "6AEBE78B-E6B3-443B-8B8F-D91F8E766A23"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 5s",
              "udid" : "F2132AC3-CECF-4EAF-9763-58CE584A1C94"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 6",
              "udid" : "A26635FD-0DCA-4679-9934-19AA7DEC59DB"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 6 Plus",
              "udid" : "03743681-7CA5-47C2-B4F8-CF8D03272FB6"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 6s",
              "udid" : "291E8BFF-2576-43A1-9B14-AF07937BED6A"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 6s Plus",
              "udid" : "FA4ACAFA-8CA1-4EF0-B594-6A856C006B51"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad 2",
              "udid" : "FEF98A7E-0630-4C4C-83C1-1FB7F2129D83"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Retina",
              "udid" : "FBCD1D2D-B9AC-4201-B850-BB6363CA2D7C"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Air",
              "udid" : "85D3A5F6-E982-4751-8C2F-3FB68A6ED2E4"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Air 2",
              "udid" : "CAE43B00-1766-4804-8D4B-99A48B8D7858"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Pro",
              "udid" : "880C4E47-C6DC-45F8-BDF6-8B167561C274"
            }
          ],
          "com.apple.CoreSimulator.SimRuntime.tvOS-10-1" : [
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "Apple TV 1080p",
              "udid" : "95A9A35D-9C9D-4360-A266-1AB1D5D0A8CA"
            }
          ],
          "watchOS 4.0" : [
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "Apple Watch - 38mm",
              "udid" : "98631D9A-A2B3-4752-8A3E-92E990BAE106"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "Apple Watch - 42mm",
              "udid" : "79E7E680-0D9F-40A2-9EE4-2F7EB351A094"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "Apple Watch Series 2 - 38mm",
              "udid" : "6812D5A9-2931-467F-A349-7F46953B0F32"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "Apple Watch Series 2 - 42mm",
              "udid" : "70FB6CDE-A5CB-4995-9CCB-9288E93C7308"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "Apple Watch Series 3 - 38mm",
              "udid" : "F080A29E-2615-46D3-B32E-D0C27EAC7D58"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "Apple Watch Series 3 - 42mm",
              "udid" : "2F5B3F90-3279-4542-A08E-0A10578DBDE7"
            }
          ],
          "com.apple.CoreSimulator.SimRuntime.watchOS-2-2" : [
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "Apple Watch - 38mm",
              "udid" : "631E3AFD-DDB4-406A-A668-556D4FEDF07C"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "Apple Watch - 42mm",
              "udid" : "6E2F9E53-7659-476A-9C14-5E48C428BC36"
            }
          ],
          "com.apple.CoreSimulator.SimRuntime.tvOS-10-2" : [
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "Apple TV 1080p",
              "udid" : "40EDC654-D61C-4B8D-B277-95D67D543DD3"
            }
          ],
          "com.apple.CoreSimulator.SimRuntime.watchOS-3-1" : [
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "Apple Watch - 38mm",
              "udid" : "240C26E6-FE33-41A3-8EF0-7858DA2F53B6"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "Apple Watch - 42mm",
              "udid" : "C5366104-3578-4E59-9212-F2B3138D7A9E"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "Apple Watch Series 2 - 38mm",
              "udid" : "06636736-4EE6-4CBF-9D5F-436CF2260448"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "Apple Watch Series 2 - 42mm",
              "udid" : "DA3753BB-0B7D-4745-9530-9F2A08356A75"
            }
          ],
          "iOS 11.0" : [
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPhone 5s",
              "udid" : "0A66E373-5A8D-4C43-9E67-DF88CAE6263C"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPhone 6",
              "udid" : "739D456A-A219-411E-8F11-409B5B9C76E7"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPhone 6 Plus",
              "udid" : "2F84EC3D-ED0E-4D8A-9902-1F3FC1A9851A"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPhone 6s",
              "udid" : "08973AB7-9BDB-4BC0-9DF1-CA8D01B59E03"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPhone 6s Plus",
              "udid" : "912DA237-CB50-4DC9-AF8E-3371C55CC39D"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPhone 7",
              "udid" : "551A4179-C45E-44BF-82CD-235D410ECAC3"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPhone 7 (Detox)",
              "udid" : "E3F13477-6650-45D7-A1F2-A46AC8CA7221"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPhone 7 (Detox2)",
              "udid" : "EF229C34-34B8-47E8-92A1-0722BB056338"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPhone 7 (Detox3)",
              "udid" : "722DC993-CF3E-4F02-99DC-C942E24D45E9"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPhone 7 Plus",
              "udid" : "07F56D62-25E9-4119-95CE-69E87350D1D4"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPhone 7 Plus (Detox)",
              "udid" : "4A23F40C-34B8-42CD-A81D-AB10ABB60C58"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPhone SE",
              "udid" : "095EBCAC-5BF3-4B1E-83BD-483B9AEA25AE"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPhone 8",
              "udid" : "A84142C2-3E25-49C2-AFA3-EF7046AB55D6"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPhone 8 Plus",
              "udid" : "E8170B7C-98DC-4EA2-AA76-DF41CC546634"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPhone 8 Plus-temp",
              "udid" : "79AA5C43-6C65-43BF-9FDB-48AC834853B2"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPhone X",
              "udid" : "D53474CF-7DD1-4673-8517-E75DAD6C34D6"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPad Air",
              "udid" : "9FB9BBB8-A04E-4FEA-83A4-769243D3047A"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPad Air 2",
              "udid" : "9DEBD82B-4F4D-4FBF-8612-44440C2F1130"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPad (5th generation)",
              "udid" : "EEC5C875-1E7F-430D-BE85-AB77C713C7CC"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPad Pro (9.7-inch)",
              "udid" : "054F9054-251E-4748-98A9-247F95CFE324"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPad Pro (12.9-inch)",
              "udid" : "49AD50FC-8201-43F3-8AFB-03A80B9910D4"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPad Pro (12.9-inch) (2nd generation)",
              "udid" : "BA18412F-5BB4-40B6-8C0C-D49E88343632"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "iPad Pro (10.5-inch)",
              "udid" : "A8E67E06-D791-46E8-835D-9EA26900166A"
            }
          ],
          "com.apple.CoreSimulator.SimRuntime.tvOS-9-1" : [
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "Apple TV 1080p",
              "udid" : "3727084D-1D11-4D5F-B1C9-AE12D9EA25D0"
            }
          ],
          "com.apple.CoreSimulator.SimRuntime.iOS-10-2" : [
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 5",
              "udid" : "601A6052-401B-4D5F-9969-D1B252BFB63A"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 5s",
              "udid" : "AC2800F6-6B9F-4952-BDAD-28A0F43B621C"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 6",
              "udid" : "5FE03940-89F3-4DED-B924-9DD0630C5D3B"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 6 Plus",
              "udid" : "4E51342E-1F41-45ED-A6EA-6313FDED9E27"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 6s",
              "udid" : "D39174C7-0DCB-4881-BD1C-18A7C82B1DC4"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 6s Plus",
              "udid" : "BE906158-376A-4733-A6ED-65E2B79B2351"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 7",
              "udid" : "A3C93900-6D17-4830-8FBE-E102E4BBCBB9"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 7 Plus",
              "udid" : "AE64887B-7B6F-439E-8039-99D43FD1FD8C"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone SE",
              "udid" : "109BD1B5-21D0-491C-998D-98EC6F2E6AD3"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Retina",
              "udid" : "555728C2-B1FF-410B-B096-83EC1F491BE2"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Air",
              "udid" : "21A8B777-4B51-4A7B-9788-1A0E39727614"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Air - 2",
              "udid" : "0A607DDB-9785-430E-8561-2E0B4B367E0E"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Air 2",
              "udid" : "95F63516-E360-49CF-B576-FB93EEFE0A1F"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Pro (9.7 inch)",
              "udid" : "B3E96CEE-622A-4B36-8D19-5FB3165155CB"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Pro (12.9 inch)",
              "udid" : "FACC38D5-1F64-4081-9078-378C4B51C582"
            }
          ],
          "com.apple.CoreSimulator.SimRuntime.iOS-10-1" : [
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 5",
              "udid" : "69E9738A-271D-409E-AAF8-F843C2C9CB3B"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 5s",
              "udid" : "6CA27F3D-0F40-4BDF-81F7-D5799181F1F7"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 6",
              "udid" : "CB66B6DD-393A-436A-A52D-9D22A332CC65"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 6 Plus",
              "udid" : "F2A4AE49-FC71-43F2-B9C4-2BF0398549A7"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 6s",
              "udid" : "2828C5F5-540F-470C-A17D-82A3E401E855"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 6s Plus",
              "udid" : "6249369E-BBE7-4A27-B1AC-B079209C74EC"
            },
            {
              "state" : "Creating",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 7",
              "udid" : "9C9ABE4D-70C7-49DC-A396-3CB1D0E82846"
            },
            {
              "state" : "Creating",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone 7 Plus",
              "udid" : "8C2A47A6-A415-4A5F-8372-4FF4CA232BD8"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPhone SE",
              "udid" : "39CDBD89-A8CB-42E9-B4EB-E28E2958E4C9"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Retina",
              "udid" : "9C029A8A-7096-4CA1-94DD-EA8F720C5FD9"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Air",
              "udid" : "D1CE0B39-B724-438B-935D-97C915817B19"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Air 2",
              "udid" : "193D0394-2580-44DC-8A04-F5823FB039CC"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Pro (9.7 inch)",
              "udid" : "518D94EB-75B2-453D-A141-7A1E1F49F382"
            },
            {
              "state" : "Shutdown",
              "availability" : " (unavailable, runtime profile not found)",
              "name" : "iPad Pro (12.9 inch)",
              "udid" : "058A009B-4348-4281-8B9C-B5C0CE06EFF8"
            }
          ]
        },
        "pairs" : {
          "997DB5F5-8B56-4DE6-A753-B56E8719FA18" : {
            "watch" : {
              "name" : "Apple Watch - 42mm",
              "udid" : "B288646D-8B92-4799-A5F8-55ACF7EAB4FC",
              "state" : "Shutdown"
            },
            "phone" : {
              "name" : "iPhone 6s Plus",
              "udid" : "08E4145F-5AE4-4BD2-8937-169F7793E6E2",
              "state" : "Shutdown"
            },
            "state" : "(unavailable)"
          },
          "D5FF253C-4716-4335-81E5-5205D108DD90" : {
            "watch" : {
              "name" : "Apple Watch Series 2 - 42mm",
              "udid" : "70FB6CDE-A5CB-4995-9CCB-9288E93C7308",
              "state" : "Shutdown"
            },
            "phone" : {
              "name" : "iPhone 7 Plus",
              "udid" : "07F56D62-25E9-4119-95CE-69E87350D1D4",
              "state" : "Shutdown"
            },
            "state" : "(active, disconnected)"
          },
          "43CCD05A-9B61-42BF-8609-83CEFF47C683" : {
            "watch" : {
              "name" : "Apple Watch Series 3 - 38mm",
              "udid" : "F080A29E-2615-46D3-B32E-D0C27EAC7D58",
              "state" : "Shutdown"
            },
            "phone" : {
              "name" : "iPhone 8",
              "udid" : "A84142C2-3E25-49C2-AFA3-EF7046AB55D6",
              "state" : "Shutdown"
            },
            "state" : "(active, disconnected)"
          },
          "5B8FD9F2-1A06-403A-9B70-588D3ECA304E" : {
            "watch" : {
              "name" : "Apple Watch - 38mm",
              "udid" : "631E3AFD-DDB4-406A-A668-556D4FEDF07C",
              "state" : "Shutdown"
            },
            "phone" : {
              "name" : "iPhone 6s",
              "udid" : "291E8BFF-2576-43A1-9B14-AF07937BED6A",
              "state" : "Shutdown"
            },
            "state" : "(unavailable)"
          },
          "77ADF31D-FFBC-4415-B5F7-CB1C17B822F2" : {
            "watch" : {
              "name" : "Apple Watch Series 2 - 38mm",
              "udid" : "6812D5A9-2931-467F-A349-7F46953B0F32",
              "state" : "Shutdown"
            },
            "phone" : {
              "name" : "iPhone 7",
              "udid" : "551A4179-C45E-44BF-82CD-235D410ECAC3",
              "state" : "Shutdown"
            },
            "state" : "(active, disconnected)"
          },
          "83D9FFEA-D9E0-4A24-A65C-3B3DE9ECBD34" : {
            "watch" : {
              "name" : "Apple Watch - 38mm",
              "udid" : "65216D2D-8329-4720-B7B7-56DE1DA223DE",
              "state" : "Shutdown"
            },
            "phone" : {
              "name" : "iPhone 6s",
              "udid" : "6609FFB6-08C8-4195-ADBE-D1EDC4004ECF",
              "state" : "Shutdown"
            },
            "state" : "(unavailable)"
          },
          "B6D42DDC-5779-401D-BA30-6BECB6CCAF95" : {
            "watch" : {
              "name" : "Apple Watch Series 2 - 42mm",
              "udid" : "1089EFA6-E851-42DD-B88F-945193DBC47C",
              "state" : "Shutdown"
            },
            "phone" : {
              "name" : "iPhone 7 Plus",
              "udid" : "D12A1E7C-3E50-4168-8731-AE8DFB702C6C",
              "state" : "Shutdown"
            },
            "state" : "(unavailable)"
          },
          "BDB6FE82-D93B-4979-9559-C570C176FBF0" : {
            "watch" : {
              "name" : "Apple Watch Series 2 - 42mm",
              "udid" : "DA3753BB-0B7D-4745-9530-9F2A08356A75",
              "state" : "Shutdown"
            },
            "phone" : {
              "name" : "iPhone 7 Plus",
              "udid" : "AE64887B-7B6F-439E-8039-99D43FD1FD8C",
              "state" : "Shutdown"
            },
            "state" : "(unavailable)"
          },
          "395AFC29-C727-404F-ACBA-6D81A7D499EC" : {
            "watch" : {
              "name" : "Apple Watch Series 3 - 42mm",
              "udid" : "2F5B3F90-3279-4542-A08E-0A10578DBDE7",
              "state" : "Shutdown"
            },
            "phone" : {
              "name" : "iPhone 8 Plus",
              "udid" : "E8170B7C-98DC-4EA2-AA76-DF41CC546634",
              "state" : "Shutdown"
            },
            "state" : "(active, disconnected)"
          },
          "AF4B7649-054B-40A6-A5BC-F2A0915863A3" : {
            "watch" : {
              "name" : "Apple Watch Series 2 - 38mm",
              "udid" : "06636736-4EE6-4CBF-9D5F-436CF2260448",
              "state" : "Shutdown"
            },
            "phone" : {
              "name" : "iPhone 7",
              "udid" : "A3C93900-6D17-4830-8FBE-E102E4BBCBB9",
              "state" : "Shutdown"
            },
            "state" : "(unavailable)"
          },
          "21CC02B2-F853-40BE-96D1-B9607EBFDE31" : {
            "watch" : {
              "name" : "Apple Watch - 42mm",
              "udid" : "6E2F9E53-7659-476A-9C14-5E48C428BC36",
              "state" : "Shutdown"
            },
            "phone" : {
              "name" : "iPhone 6s Plus",
              "udid" : "FA4ACAFA-8CA1-4EF0-B594-6A856C006B51",
              "state" : "Shutdown"
            },
            "state" : "(unavailable)"
          },
          "A5DC73DC-7CFB-4B28-8EC4-F403BDDA3E73" : {
            "watch" : {
              "name" : "Apple Watch - 38mm",
              "udid" : "98631D9A-A2B3-4752-8A3E-92E990BAE106",
              "state" : "Shutdown"
            },
            "phone" : {
              "name" : "iPhone 6s",
              "udid" : "08973AB7-9BDB-4BC0-9DF1-CA8D01B59E03",
              "state" : "Shutdown"
            },
            "state" : "(active, disconnected)"
          },
          "796D06AE-3671-4D9B-A241-B694DE1623F4" : {
            "watch" : {
              "name" : "Apple Watch - 42mm",
              "udid" : "79E7E680-0D9F-40A2-9EE4-2F7EB351A094",
              "state" : "Shutdown"
            },
            "phone" : {
              "name" : "iPhone 6s Plus",
              "udid" : "912DA237-CB50-4DC9-AF8E-3371C55CC39D",
              "state" : "Shutdown"
            },
            "state" : "(active, disconnected)"
          },
          "0CFC50E9-BABF-47C0-8668-BAA97E8CCB83" : {
            "watch" : {
              "name" : "Apple Watch Series 2 - 38mm",
              "udid" : "C41A6B35-7FBD-4A25-BC59-A11DD490E543",
              "state" : "Shutdown"
            },
            "phone" : {
              "name" : "iPhone 7",
              "udid" : "1187FB7A-61B9-4892-B812-4E97C950C1A9",
              "state" : "Shutdown"
            },
            "state" : "(unavailable)"
          }
        }
      }
    ;

    it('calls xcrun to get a list of runtimes/devicetypes/devices', async () => {
      exec.execWithRetriesAndLogs.mockReturnValueOnce(Promise.resolve({stdout: JSON.stringify(simctlList)}));

      const created = await uut.create('iPhone 8 Plus');
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

