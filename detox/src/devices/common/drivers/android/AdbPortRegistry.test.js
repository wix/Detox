describe('AdbPortRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = require('./AdbPortRegistry');
    registry._registry.clear();
  });

  it('should register a device with a port', () => {
    registry.register('emulator-5554', 5038);
    expect(registry.getPort('emulator-5554')).toEqual(5038);
  });

  it('should allow registering multiple devices', () => {
    registry.register('emulator-5554', 5038);
    registry.register('emulator-5556', 5039);
    registry.register('localhost:5555', 5040);

    expect(registry.getPort('emulator-5554')).toEqual(5038);
    expect(registry.getPort('emulator-5556')).toEqual(5039);
    expect(registry.getPort('localhost:5555')).toEqual(5040);
  });

  it('should overwrite existing registration when registering the same device again', () => {
    registry.register('emulator-5554', 5038);
    registry.register('emulator-5554', 5040);
    expect(registry.getPort('emulator-5554')).toEqual(5040);
  });

  describe('unregister', () => {
    it('should remove a registered device', () => {
      registry.register('emulator-5554', 5038);
      registry.register('emulator-5556', 5039);

      registry.unregister('emulator-5554');
      expect(registry.getPort('emulator-5554')).toBeUndefined();
      expect(registry.getPort('emulator-5556')).toEqual(5039);
    });

    it('should not throw when unregistering a non-existent device', () => {
      expect(() => {
        registry.unregister('non-existent-device');
      }).not.toThrow();
    });
  });
});
