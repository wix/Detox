// @ts-nocheck
describe('Device allocator', () => {

  let allocDriver;
  /** @type DeviceAllocator */
  let deviceAllocator;
  beforeEach(() => {
    allocDriver = {
      allocate: jest.fn(),
      postAllocate: jest.fn(),
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

  it('should post-allocate via driver', async () => {
    const cookie = {};

    const result = await deviceAllocator.postAllocate(cookie);
    expect(allocDriver.postAllocate).toHaveBeenCalledWith(cookie);
  });

  it('should not post-allocate if the driver does not implement this function', async () => {
    delete allocDriver.postAllocate;
    await expect(deviceAllocator.postAllocate({})).resolves.not.toThrow();
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
