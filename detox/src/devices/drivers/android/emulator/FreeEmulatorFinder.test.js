const FreeEmulatorFinder = require('./FreeEmulatorFinder');
const { mockAvdName, emulator5556, localhost5555 } = require('../tools/__mocks__/handles');

describe('FreeEmulatorFinder', () => {
  let uut;
  beforeEach(() => (uut = new FreeEmulatorFinder(undefined, undefined)));

  it('should match when is an emulator and avdName matches', async () => {
    expect(await uut.isDeviceMatching(emulator5556, mockAvdName)).toBe(true);
  });

  it('should not match when avdName does not match', async () => {
    expect(await uut.isDeviceMatching(emulator5556, 'wrongAvdName')).toBe(false);
  });

  it('should not match when not an emulator', async () => {
    expect(await uut.isDeviceMatching(localhost5555, mockAvdName)).toBe(false);
  });
});
