const _ = require('lodash');
const environment = require('../../../../utils/environment');

const latestInstanceOf = (clazz) => _.last(clazz.mock.instances);

describe('Genymotion-cloud custom device-registry', () => {
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

    const GenyCloudDeviceRegistry = require('./GenyCloudDeviceRegistry');
    uut = new GenyCloudDeviceRegistry(deviceRegistry);
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
    deviceRegistry.includes.mockResolvedValue(true);

    const result = await uut.includes(instance);
    expect(result).toEqual(true);
    expect(deviceRegistry.includes).toHaveBeenCalledWith(instanceUUID);
  });

  it('should return registered instance UUIDs from delegated registry', async () => {
    deviceRegistry.getRegisteredDevices.mockResolvedValue([instanceUUID]);

    const result = await uut.getRegisteredInstanceUUIDs();
    expect(result).toEqual([instanceUUID]);
  });
});

describe('Genymotion-cloud custom device-registry instantiation methods', () => {
  let DeviceRegistry;
  let GenyCloudDeviceRegistry;
  beforeEach(() => {
    jest.mock('../../../DeviceRegistry');
    DeviceRegistry = require('../../../DeviceRegistry');

    GenyCloudDeviceRegistry = require('./GenyCloudDeviceRegistry');
  });

  it('should expose method for genymotion clean-up registry instantiation', () => {
    const result = GenyCloudDeviceRegistry.forGlobalCleanup();
    expect(DeviceRegistry).toHaveBeenCalledWith({
      lockfilePath: environment.getGenyCloudPostCleanupFilePath(),
    });
    expect(result).toBeInstanceOf(DeviceRegistry);
    expect(result).toEqual(latestInstanceOf(DeviceRegistry));
  });
});
