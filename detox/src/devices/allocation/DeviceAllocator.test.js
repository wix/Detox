describe('Device allocator', () => {

  let allocDriver;
  let deallocDriver;
  /** @type DeviceAllocator */
  let deviceAllocator;
  /** @type DeviceDeallocator */
  let deviceDeallocator;
  beforeEach(() => {
    jest.mock('../../utils/trace');
    const { traceCall } = require('../../utils/trace');
    traceCall.mockImplementation((__, func) => func());

    allocDriver = {
      allocate: jest.fn(),
    };

    deallocDriver = {
      free: jest.fn(),
    };

    const { DeviceAllocator, DeviceDeallocator } = require('./DeviceAllocator');
    deviceAllocator = new DeviceAllocator(allocDriver);
    deviceDeallocator = new DeviceDeallocator(deallocDriver);
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
    const options = { shutdown: true };
    const device = {
      mock: 'device',
    };

    deallocDriver.free.mockResolvedValue(device);

    await deviceDeallocator.free(options);
    expect(deallocDriver.free).toHaveBeenCalledWith(options);
  });
});
