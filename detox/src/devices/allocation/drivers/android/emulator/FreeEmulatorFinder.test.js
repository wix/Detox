const DeviceList = require('../../../DeviceList');
const { emulator5556, localhost5555, mockAvdName } = require('../__mocks__/handles');

describe('FreeEmulatorFinder', () => {
  /** @type {DeviceList} */
  let fakeDeviceList;
  /** @type {jest.Mocked<import('../../../DeviceRegistry')>} */
  let mockDeviceRegistry;
  let uut;

  beforeEach(() => {
    fakeDeviceList = new DeviceList();

    const DeviceRegistry = jest.createMockFromModule('../../../DeviceRegistry');
    mockDeviceRegistry = new DeviceRegistry();
    mockDeviceRegistry.getTakenDevicesSync.mockImplementation(() => fakeDeviceList);

    const FreeEmulatorFinder = require('./FreeEmulatorFinder');
    const mockAdb = /** @type {any} */ ({});
    uut = new FreeEmulatorFinder(mockAdb, mockDeviceRegistry);
  });

  it('should return device when it is an emulator and avdName matches', async () => {
    const result = await uut.findFreeDevice([emulator5556], mockAvdName);
    expect(result).toBe(emulator5556);
  });

  it('should return null when avdName does not match', async () => {
    expect(await uut.findFreeDevice([emulator5556], 'wrongAvdName')).toBe(null);
  });

  it('should return null when not an emulator', async () => {
    expect(await uut.findFreeDevice([localhost5555], mockAvdName)).toBe(null);
  });
});
