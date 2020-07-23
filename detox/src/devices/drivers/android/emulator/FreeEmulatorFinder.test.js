const FreeEmulatorFinder = require('./FreeEmulatorFinder');

describe('FreeEmulatorFinder', () => {
  const avdName = 'mockAvdName';

  let uut;
  beforeEach(() => {
    uut = new FreeEmulatorFinder(undefined, undefined);
  });

  it('should match when is an emulator and avdName matches', async () => {
    const candidate = createDevice(avdName);
    expect(await uut.isDeviceMatching(candidate, avdName)).toBe(true);
  });

  it('should not match when not an emulator', async () => {
    const candidate = createDevice(avdName, 'device');
    expect(await uut.isDeviceMatching(candidate, avdName)).toBe(false);
  });

  it('should not match when avdName does not match', async () => {
    const candidate = createDevice(avdName);
    expect(await uut.isDeviceMatching(candidate, 'wrongAvdName')).toBe(false);
  });

  const createDevice = (avdName, type = 'emulator') => ({
    type,
    async queryName() {
      return avdName;
    }
  });
});
