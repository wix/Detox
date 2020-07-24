const FreeAdbDeviceFinder = require('./FreeAdbDeviceFinder');
const { localhost5555, ip5557 } = require('../tools/__mocks__/handles');

describe('FreeAdbDeviceFinder', () => {
  it("should test candidate's adbName against a regular expression", async () => {
    const finder = new FreeAdbDeviceFinder(undefined, undefined);
    const localhost = '^localhost:\\d+$';

    expect(await finder.isDeviceMatching(localhost5555, localhost)).toBe(true);
    expect(await finder.isDeviceMatching(ip5557, localhost)).toBe(false);
  });
});
