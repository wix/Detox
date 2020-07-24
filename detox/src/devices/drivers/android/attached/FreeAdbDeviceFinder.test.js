const FreeAdbDeviceFinder = require('./FreeAdbDeviceFinder');

describe('FreeAdbDeviceFinder', () => {
  it("should test candidate's adbName against a regular expression", async () => {
    const finder = new FreeAdbDeviceFinder(undefined, undefined);
    const onlyDigits = '^\\d+$';

    expect(await finder.isDeviceMatching({ adbName: '5555' }, onlyDigits)).toBe(true);
    expect(await finder.isDeviceMatching({ adbName: 'emulator-5555' }, onlyDigits)).toBe(false);
  });
});
