const FreeAdbDeviceFinder = require('./FreeAdbDeviceFinder');

describe('FreeAdbDeviceFinder', () => {
  it("should test candidate's adbName against a regular expression", async () => {
    const mockRegExpTest = jest.fn();
    const mockRegExpConstructor = jest.fn(() => ({ test: mockRegExpTest }));
    global.RegExp = mockRegExpConstructor;

    const freeAdbDeviceFinder = new FreeAdbDeviceFinder(undefined, undefined);
    const candidate = { adbName: 'mockAdbName' };
    const adbNamePattern = 'mockAdbNamePattern';

    await freeAdbDeviceFinder.isDeviceMatching(candidate, adbNamePattern);
    expect(mockRegExpConstructor).toHaveBeenCalledWith(adbNamePattern);
    expect(mockRegExpTest).toHaveBeenCalledWith(candidate.adbName);
  });
});
