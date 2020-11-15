describe('Genymotion-cloud device-registry wrapper', () => {
  const instanceUUID = 'mock-instance-uuid';
  const instance = {
    uuid: instanceUUID,
  };

  let deviceRegistry;
  let uut;
  beforeEach(() => {
    const DeviceRegistry = jest.genMockFromModule('../../../DeviceRegistry');
    deviceRegistry = new DeviceRegistry();
    deviceRegistry.allocateDevice.mockImplementation((fn) => fn());

    const GenyDeviceRegistryWrapper = require('./GenyDeviceRegistryWrapper');
    uut = new GenyDeviceRegistryWrapper(deviceRegistry);
  });

  it('should return the instance allocated by the user\'s function', async () => {
    const result = await uut.allocateDevice(() => instance);
    expect(result).toEqual(instance);
  });

  it('should reduce instance allocated by user-function to the instance UUID, for locking', async () => {
    const userAllocationFunc = () => instance;

    await deviceRegistry.allocateDevice.mockImplementation(async (userFunc) => {
      const result = await userFunc();
      expect(result).toEqual(instanceUUID);
    });

    await uut.allocateDevice(userAllocationFunc);

    expect(deviceRegistry.allocateDevice).toHaveBeenCalled();
  });

  it('should dispose an instance in delegated registry based on its UUID', async () => {
    await uut.disposeDevice(instance);
    expect(deviceRegistry.disposeDevice).toHaveBeenCalledWith(instanceUUID);
  });

  it('should throw if delegated device-registry fail', async () => {
    const error = new Error('mocked-error');
    deviceRegistry.disposeDevice.mockRejectedValue(error);
    try {
      await uut.disposeDevice(instance);
      fail('Expected an error');
    } catch (e) {
      expect(e).toEqual(error);
    }
  });

  it('should query instance inclusion in delegated registry based on its UUID', async () => {
    deviceRegistry.includes.mockReturnValue(true);

    const result = uut.includes(instance);
    expect(result).toEqual(true);
    expect(deviceRegistry.includes).toHaveBeenCalledWith(instanceUUID);
  });

  it('should return registered instance UUIDs from delegated registry', async () => {
    deviceRegistry.getRegisteredDevices.mockReturnValue([instanceUUID]);

    const result = uut.getRegisteredInstanceUUIDs();
    expect(result).toEqual([instanceUUID]);
  });
});
