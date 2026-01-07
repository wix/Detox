const DeviceList = require('../../DeviceList');

const FreeDeviceFinder = require('./FreeDeviceFinder');
const { deviceOffline, emulator5556, ip5557, localhost5555 } = require('./__mocks__/handles');

describe('FreeDeviceFinder', () => {
  /** @type {DeviceList} */
  let fakeDeviceList;
  let mockDeviceRegistry;
  let uut;

  beforeEach(() => {
    fakeDeviceList = new DeviceList();
    const DeviceRegistry = jest.createMockFromModule('../../DeviceRegistry');
    mockDeviceRegistry = new DeviceRegistry();
    mockDeviceRegistry.getTakenDevicesSync.mockImplementation(() => fakeDeviceList);

    const mockAdb = /** @type {any} */ ({});
    uut = new FreeDeviceFinder(mockAdb, mockDeviceRegistry);
  });

  it('should return the only device when it matches, is online and not already taken by other workers', async () => {
    const result = await uut.findFreeDevice([emulator5556], emulator5556.adbName);
    expect(result).toEqual(emulator5556);
  });

  it('should return null when there are no devices', async () => {
    const result = await uut.findFreeDevice([], emulator5556.adbName);
    expect(result).toEqual(null);
  });

  it('should return null when device is already taken by other workers', async () => {
    mockAllDevicesTaken();

    expect(await uut.findFreeDevice([emulator5556], emulator5556.adbName)).toEqual(null);
  });

  it('should return null when device is offline', async () => {
    expect(await uut.findFreeDevice([deviceOffline], deviceOffline.adbName)).toEqual(null);
  });

  it('should return first device that matches a regular expression', async () => {
    const localhost = '^localhost:\\d+$';
    expect(await uut.findFreeDevice([emulator5556, localhost5555, ip5557], localhost)).toBe(localhost5555);
  });

  const mockAllDevicesTaken = () => {
    fakeDeviceList.add(emulator5556.adbName, { busy: true });
    fakeDeviceList.add(localhost5555.adbName, { busy: true });
    fakeDeviceList.add(ip5557.adbName, { busy: true });
  };
});
