describe('Genymotion-Cloud device allocator', () => {
  const recipeUUID = 'mock-recipe-uuid';

  let log;
  let retry;
  let deviceRegistry;
  let deviceCleanupRegistry;
  let instanceLookupService;
  let instanceLifecycleService;
  let GenyInstance;
  let uut;
  beforeEach(() => {
    jest.mock('../../../../utils/logger');
    log = require('../../../../utils/logger');

    jest.mock('../../../../utils/retry');
    retry = require('../../../../utils/retry');
    retry.mockImplementation((options, func) => func());

    const DeviceRegistry = jest.genMockFromModule('../../../../devices/DeviceRegistry');
    deviceRegistry = new DeviceRegistry();
    deviceRegistry.allocateDevice.mockImplementation((func) => func());
    deviceCleanupRegistry = new DeviceRegistry();

    const InstanceLookupService = jest.genMockFromModule('./services/GenyInstanceLookupService');
    instanceLookupService = new InstanceLookupService();

    const InstanceLifecycleService = jest.genMockFromModule('./services/GenyInstanceLifecycleService');
    instanceLifecycleService = new InstanceLifecycleService();

    GenyInstance = jest.genMockFromModule('./services/dto/GenyInstance');

    const DeviceAllocator = require('./GenyCloudDeviceAllocator');
    uut = new DeviceAllocator(deviceRegistry, deviceCleanupRegistry, instanceLookupService, instanceLifecycleService);
  });

  const aRecipe = () => ({
    uuid: recipeUUID,
    toString: () => 'mock-recipe-toString()',
  });

  const anOfflineInstance = () => {
    const instance = new GenyInstance();
    instance.uuid = 'mock-instance-uuid';
    instance.isAdbConnected.mockReturnValue(false);
    instance.isOnline.mockReturnValue(false);
    instance.adbName = '0.0.0.0';
    return instance;
  };

  const anOnlineInstance = () => {
    const instance = anOfflineInstance();
    instance.isOnline.mockReturnValue(true);
    return instance;
  };

  const aFullyConnectedInstance = () => {
    const instance = anOnlineInstance();
    instance.isAdbConnected.mockReturnValue(true);
    instance.adbName = 'localhost:1234';
    return instance;
  };

  const aDisconnectedInstance = () => {
    const instance = anOnlineInstance();
    instance.isAdbConnected.mockReturnValue(false);
    return instance;
  };

  const givenFreeInstance = (instance) => instanceLookupService.findFreeInstance.mockResolvedValueOnce(instance)
  const givenNoFreeInstances = () => instanceLookupService.findFreeInstance.mockResolvedValue(undefined);
  const givenCreatedInstance = (instance) => instanceLifecycleService.createInstance.mockResolvedValueOnce(instance);
  const givenConnectionInstance = (instance) => instanceLifecycleService.adbConnectInstance.mockResolvedValue(instance);
  const givenRefreshedInstance = (instance) => instanceLookupService.getInstance.mockReturnValueOnce(instance);

  it('should return a free device', async () => {
    const connectedInstance = aFullyConnectedInstance();
    givenFreeInstance(connectedInstance);
    givenConnectionInstance(connectedInstance);

    const result = await uut.allocateDevice(aRecipe());
    expect(result.instance).toEqual(connectedInstance);
    expect(instanceLookupService.findFreeInstance).toHaveBeenCalledWith(recipeUUID);
  });

  it('should adb-connect device if disconnected', async () => {
    const connectedInstance = aFullyConnectedInstance();
    const disconnectedInstance = aDisconnectedInstance();
    givenFreeInstance(disconnectedInstance);
    givenConnectionInstance(connectedInstance);

    const result = await uut.allocateDevice(aRecipe());
    expect(result.instance).toEqual(connectedInstance);

    expect(instanceLifecycleService.adbConnectInstance).toHaveBeenCalledWith(disconnectedInstance.uuid);
  });

  it('should not connect a connected device', async () => {
    const connectedInstance = aFullyConnectedInstance();
    givenFreeInstance(connectedInstance);

    await uut.allocateDevice(aRecipe());

    expect(instanceLifecycleService.adbConnectInstance).not.toHaveBeenCalled();
  });

  it('should not connect inside locking callback (!!!)', async () => {
    const connectedInstance = aFullyConnectedInstance();
    const disconnectedInstance = aDisconnectedInstance();
    givenFreeInstance(disconnectedInstance);
    givenConnectionInstance(connectedInstance);

    deviceRegistry.allocateDevice.mockImplementation(async (func) => {
      const result = await func();
      expect(instanceLifecycleService.adbConnectInstance).not.toHaveBeenCalled();
      return result;
    });

    await uut.allocateDevice(aRecipe());
  });

  it('should create a device if no free one is available', async () => {
    const instance = aFullyConnectedInstance();
    givenNoFreeInstances();
    givenCreatedInstance(instance);

    const result = await uut.allocateDevice(aRecipe());
    expect(result.instance).toEqual(instance);
    expect(instanceLifecycleService.createInstance).toHaveBeenCalledWith(recipeUUID);
  });

  it('should wait for a created device to become online', async () => {
    const instance = anOfflineInstance();
    const onlineInstance = aFullyConnectedInstance();
    givenNoFreeInstances();
    givenCreatedInstance(instance);
    givenRefreshedInstance(onlineInstance);
    givenConnectionInstance(onlineInstance);

    retry.mockImplementationOnce(async (options, func) => {
      const instance = await func();
      expect(instanceLookupService.getInstance).toHaveBeenCalledWith(instance.uuid);
      return instance;
    });

    const result = await uut.allocateDevice(aRecipe());
    expect(result.instance).toEqual(onlineInstance);
    expect(retry).toHaveBeenCalled();
  });

  it('should fail if device never becomes online', async () => {
    const instance = anOfflineInstance();
    givenNoFreeInstances();
    givenCreatedInstance(instance);
    givenRefreshedInstance(instance);

    try {
      await uut.allocateDevice(aRecipe());
      fail('Expected an error');
    } catch (e) {
      expect(e.toString()).toContain(`Timeout waiting for instance ${instance.uuid} to be ready`);
    }
  });

  it('should not wait for created device to become online if already online', async () => {
    const instance = aFullyConnectedInstance();
    givenNoFreeInstances();
    givenCreatedInstance(instance);
    givenRefreshedInstance(instance);

    await uut.allocateDevice(aRecipe());
    expect(instanceLookupService.getInstance).not.toHaveBeenCalled();
    expect(retry).not.toHaveBeenCalled();
  });

  it('should not wait for device to become online, inside locking callback (!!!)', async () => {
    const instance = anOfflineInstance();
    const onlineInstance = aFullyConnectedInstance();
    givenNoFreeInstances();
    givenCreatedInstance(instance);
    givenRefreshedInstance(onlineInstance);

    deviceRegistry.allocateDevice.mockImplementation(async (func) => {
      const result = await func();
      expect(instanceLookupService.getInstance).not.toHaveBeenCalled();
      return result;
    });

    await uut.allocateDevice(aRecipe());
  });

  it('should return created=true if new device was allocated', async () => {
    const instance = aFullyConnectedInstance();
    givenNoFreeInstances();
    givenCreatedInstance(instance);

    const result = await uut.allocateDevice(aRecipe());
    expect(result.isNew).toEqual(true);
  });

  it('should return created=false if a device was reused', async () => {
    const instance = aFullyConnectedInstance();
    givenFreeInstance(instance);

    const result = await uut.allocateDevice(aRecipe());
    expect(result.isNew).toEqual(false);
  });

  it('should return the instance to device registry (potentially different than the final value returned by allocation)', async () => {
    const instance = aFullyConnectedInstance();
    givenFreeInstance(instance);

    deviceRegistry.allocateDevice.mockImplementation(async (func) => {
      const result = await func();
      expect(result).toEqual(instance);
      return result;
    });

    await uut.allocateDevice(aRecipe());
    expect(deviceRegistry.allocateDevice).toHaveBeenCalled();
  });

  it('should log pre-allocate event', async () => {
    givenFreeInstance(aFullyConnectedInstance());
    await uut.allocateDevice(aRecipe());
    expect(log.debug).toHaveBeenCalledWith({ event: 'ALLOCATE_DEVICE' }, expect.stringContaining('Trying to allocate'));
    expect(log.debug).toHaveBeenCalledWith({ event: 'ALLOCATE_DEVICE' }, expect.stringContaining('mock-recipe-toString()'));
  });

  it('should log post-allocate event', async () => {
    const instance = aFullyConnectedInstance();
    givenFreeInstance(instance);
    await uut.allocateDevice(aRecipe());
    expect(log.debug).toHaveBeenCalledWith({ event: 'ALLOCATE_DEVICE' }, expect.stringContaining(`Settled on GenyCloud:${instance.uuid}`));
  });
});
