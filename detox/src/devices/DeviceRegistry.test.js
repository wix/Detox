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
    const deviceId = 'mock-deviceId';

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

  it('should allow for querying the entire list of registered devices', async () => {
    const deviceId = 'mock-deviceId';
    const deviceId2 = 'mock-deviceId2';
    await registry.allocateDevice(() => {
      expect(registry.readAll()).toEqual([]);
      return deviceId;
    });

    await registry.allocateDevice(() => {
      expect(registry.readAll()).toEqual([deviceId]);
      return deviceId2;
    });

    await registry.disposeDevice(() => {
      expect(registry.readAll()).toEqual([deviceId, deviceId2]);
      return deviceId;
    });
  });

  it('should throw on attempt to query registered devices outside of allocation/disposal context', async () => {
    expect(() => registry.readAll()).toThrowError();
  });
});
