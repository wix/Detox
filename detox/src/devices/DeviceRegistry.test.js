const fs = require('fs-extra');
const tempfile = require('tempfile');
const DeviceRegistry = require('./DeviceRegistry');

describe('DeviceRegistry', () => {
  let lockfilePath;
  let registry;

  beforeEach(() => {
    lockfilePath = tempfile('.test');
    registry = new DeviceRegistry({ lockfilePath });
  });

  afterEach(async () => {
    await fs.remove(lockfilePath);
  });

  it('should throw on attempt to checking if device is busy outside of allocation/disposal context', async () => {
    const deviceId = 'emulator-5554';

    const assertForbiddenOutOfContext = () =>
      expect(() => registry.isDeviceBusy(deviceId)).toThrowError();

    assertForbiddenOutOfContext();
    const result = await registry.allocateDevice(() => {
      expect(registry.isDeviceBusy(deviceId)).toBe(false);
      return deviceId;
    });

    expect(result).toBe(deviceId);

    assertForbiddenOutOfContext();
    await registry.disposeDevice(() => {
      expect(registry.isDeviceBusy(deviceId)).toBe(true);
      return deviceId;
    });

    assertForbiddenOutOfContext();
    await registry.allocateDevice(() => {
      expect(registry.isDeviceBusy(deviceId)).toBe(false);
      throw new Error();
    }).catch(() => {});

    assertForbiddenOutOfContext();
  });
});
