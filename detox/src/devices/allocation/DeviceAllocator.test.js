// @ts-nocheck
describe('Device allocator', () => {

  let allocDriver;
  /** @type DeviceAllocator */
  let deviceAllocator;
  beforeEach(() => {
    jest.mock('../../utils/trace');

    allocDriver = {
      allocate: jest.fn(),
      free: jest.fn(),
    };

    const DeviceAllocator = require('./DeviceAllocator');
    deviceAllocator = new DeviceAllocator(allocDriver);
  });

  it('should allocate via driver', async () => {
    const query = 'mock query';
    const device = {
      mock: 'device',
    };

    allocDriver.allocate.mockResolvedValue(device);

    const result = await deviceAllocator.allocate(query);
    expect(result).toEqual(device);
    expect(allocDriver.allocate).toHaveBeenCalledWith(query);
  });

  it('should deallocate via driver', async () => {
    const cookie = { cookie: 'mock' };
    const options = { shutdown: true };
    const device = {
      mock: 'device',
    };

    allocDriver.free.mockResolvedValue(device);

    await deviceAllocator.free(cookie, options);
    expect(allocDriver.free).toHaveBeenCalledWith(cookie, options);
  });
});
