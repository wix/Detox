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

  it('should allocate the first device', async () => {
    const deviceId = 'mock-device';
    const getDeviceIdFn = jest.fn().mockResolvedValue(deviceId);
    await registry.allocateDevice(getDeviceIdFn);

    const fileContent = await fs.readFile(lockfilePath);
    expect(JSON.parse(fileContent)).toEqual([deviceId]);
  });

  it('should return device and \'index\' upon allocation', async () => {
    const deviceId1 = 'mock-device';
    const deviceId2 = 'mock-device2';

    const result1 = await registry.allocateDevice(jest.fn().mockResolvedValue(deviceId1));
    expect(result1).toEqual({ deviceId: deviceId1, deviceIndex: 0 });

    const result2 = await registry.allocateDevice(jest.fn().mockResolvedValue(deviceId2));
    expect(result2).toEqual({ deviceId: deviceId2, deviceIndex: 1 });
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

    expect(result.deviceId).toBe(deviceId);

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
