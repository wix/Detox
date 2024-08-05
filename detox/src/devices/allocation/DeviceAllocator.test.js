describe('Device allocator', () => {
  let allocDriver;

  /** @type {import('./DeviceAllocator')} */
  let deviceAllocator;

  beforeEach(() => {
    allocDriver = {
      allocate: jest.fn(),
      free: jest.fn(),
    };

    const DeviceAllocator = require('./DeviceAllocator');
    deviceAllocator = new DeviceAllocator(allocDriver);
  });

  describe('#init()', function() {
    test('should not init if the driver does not implement this function', async () => {
      delete allocDriver.init;
      await expect(deviceAllocator.init()).resolves.not.toThrow();
    });

    test('should init via driver', async () => {
      allocDriver.init = jest.fn();
      await deviceAllocator.init();
      expect(allocDriver.init).toHaveBeenCalled();
    });
  });

  describe('#allocate()', function() {
    test('should allocate via driver', async () => {
      const cookie = { id: 'mock', };
      const deviceConfig = {
        type: 'some-device-type',
        device: 'some query',
      };

      allocDriver.allocate.mockResolvedValue(cookie);

      const result = await deviceAllocator.allocate(deviceConfig);

      expect(result).toEqual(cookie);
      expect(allocDriver.allocate).toHaveBeenCalledWith(deviceConfig);
    });
  });

  describe('#postAllocate()', function() {
    test('should post-allocate via driver', async () => {
      const cookie = { id: 'mock' };

      allocDriver.postAllocate = jest.fn();
      await expect(deviceAllocator.postAllocate(cookie)).resolves.toBe(cookie);
      expect(allocDriver.postAllocate).toHaveBeenCalledWith(cookie);
    });

    test('should replace the cookie if the driver returns a new one', async () => {
      const cookie = { id: 'mock' };
      const newCookie = { id: 'new mock' };

      allocDriver.postAllocate = jest.fn().mockResolvedValue(newCookie);
      await expect(deviceAllocator.postAllocate(cookie)).resolves.toBe(newCookie);
      expect(allocDriver.postAllocate).toHaveBeenCalledWith(cookie);
    });

    test('should not post-allocate if the driver does not implement this function', async () => {
      delete allocDriver.postAllocate;
      await expect(deviceAllocator.postAllocate({ id: 'mock' })).resolves.not.toThrow();
    });
  });

  describe('#free()', function() {
    test('should deallocate via driver', async () => {
      const cookie = { id: 'mock' };
      const options = { shutdown: true };
      const device = {
        mock: 'device',
      };

      allocDriver.free.mockResolvedValue(device);

      await deviceAllocator.free(cookie, options);
      expect(allocDriver.free).toHaveBeenCalledWith(cookie, options);
      await deviceAllocator.free(cookie); // no options
      expect(allocDriver.free).toHaveBeenCalledWith(cookie, {});
    });
  });

  describe('#cleanup()', function() {
    test('should not cleanup if the driver does not implement this function', async () => {
      delete allocDriver.cleanup;
      await expect(deviceAllocator.cleanup()).resolves.not.toThrow();
    });

    test('should cleanup via driver', async () => {
      allocDriver.cleanup = jest.fn();
      await deviceAllocator.cleanup();
      expect(allocDriver.cleanup).toHaveBeenCalled();
    });
  });

  describe('#emergencyCleanup()', function() {
    test('should not emergencyCleanup if the driver does not implement this function', () => {
      delete allocDriver.emergencyCleanup;
      expect(() => deviceAllocator.emergencyCleanup()).not.toThrow();
    });

    test('should emergencyCleanup via driver', () => {
      allocDriver.emergencyCleanup = jest.fn();
      deviceAllocator.emergencyCleanup();
      expect(allocDriver.emergencyCleanup).toHaveBeenCalled();
    });
  });

  describe('#isRecoverableError()', function() {
    test('should return false if the driver does not implement this function', () => {
      delete allocDriver.isRecoverableError;
      expect(deviceAllocator.isRecoverableError(new Error())).toBe(false);
    });

    test('should return the driver\'s isRecoverableError result', () => {
      allocDriver.isRecoverableError = jest.fn().mockReturnValue(true);
      expect(deviceAllocator.isRecoverableError(new Error())).toBe(true);
      expect(allocDriver.isRecoverableError).toHaveBeenCalled();
    });
  });
});
