describe('Genymotion-cloud instance allocation helper', () => {
  const recipeUUID = 'mock-recipe-uuid';

  let instanceLookupService;
  let instanceLifecycleService;
  let GenyInstance;
  let uut;
  beforeEach(() => {
    const InstanceLookupService = jest.genMockFromModule('../services/GenyInstanceLookupService');
    instanceLookupService = new InstanceLookupService();

    const InstanceLifecycleService = jest.genMockFromModule('../services/GenyInstanceLifecycleService');
    instanceLifecycleService = new InstanceLifecycleService();

    GenyInstance = jest.genMockFromModule('../services/dto/GenyInstance');

    const GenyAllocationHelper = require('./GenyAllocationHelper');
    uut = new GenyAllocationHelper(instanceLookupService, instanceLifecycleService);
  });

  const aConnectedInstance = () => {
    const instance = new GenyInstance();
    instance.uuid = 'mock-instance-uuid';
    instance.isAdbConnected.mockReturnValue(true);
    instance.adbName = 'mock-adb-name';
    return instance;
  };

  const aDisconnectedInstance = () => {
    const instance = new GenyInstance();
    instance.uuid = 'mock-instance-uuid';
    instance.isAdbConnected.mockReturnValue(false);
    instance.adbName = '0.0.0.0';
    return instance;
  };

  const givenFreeInstance = (instance) => instanceLookupService.findFreeInstance.mockResolvedValueOnce(instance)
  const givenNoFreeInstances = () => instanceLookupService.findFreeInstance.mockResolvedValue(undefined);
  const givenCreatedInstance = (instance) => instanceLifecycleService.createInstance.mockResolvedValueOnce(instance);
  const givenConnectionInstance = (instance) => instanceLifecycleService.adbConnectInstance.mockResolvedValue(instance);
  const givenConnectError = (error) => instanceLifecycleService.adbConnectInstance.mockRejectedValue(error);

  it('should find and return a ready-to-use instance', async () => {
    const connectedInstance = aConnectedInstance();
    givenFreeInstance(connectedInstance);

    const result = await uut.allocateInstance(recipeUUID);
    expect(result.instance).toEqual(connectedInstance);
    expect(instanceLookupService.findFreeInstance).toHaveBeenCalledWith(recipeUUID);
  });

  it('should create an instance if no such is available', async () => {
    const connectedInstance = aConnectedInstance();
    givenNoFreeInstances();
    givenCreatedInstance(connectedInstance);

    const result = await uut.allocateInstance(recipeUUID);
    expect(result.instance).toEqual(connectedInstance);
    expect(instanceLifecycleService.createInstance).toHaveBeenCalledWith(recipeUUID);
  });

  it('should adb-connect a disconnected, newly-created instance', async () => {
    const connectedInstance = aConnectedInstance();
    const disconnectedInstance = aDisconnectedInstance();
    givenNoFreeInstances();
    givenCreatedInstance(disconnectedInstance);
    givenConnectionInstance(connectedInstance);

    const result = await uut.allocateInstance(recipeUUID);
    expect(result.instance).toEqual(connectedInstance);
    expect(instanceLifecycleService.adbConnectInstance).toHaveBeenCalledWith(disconnectedInstance.uuid);
  });

  it('should adb-connect a disconnected, free (preexisting) instance', async () => {
    const connectedInstance = aConnectedInstance();
    const disconnectedInstance = aDisconnectedInstance();
    givenFreeInstance(disconnectedInstance);
    givenConnectionInstance(connectedInstance);

    const result = await uut.allocateInstance(recipeUUID);
    expect(result.instance).toEqual(connectedInstance);
    expect(instanceLifecycleService.adbConnectInstance).toHaveBeenCalledWith(disconnectedInstance.uuid);
  });

  it('should throw if adb-connect fails', async () => {
    const error = new Error('mocked adb-connect failure');
    const disconnectedInstance = aDisconnectedInstance();
    givenFreeInstance(disconnectedInstance);
    givenConnectError(error);

    try {
      await uut.allocateInstance(recipeUUID);
      fail('Expected an error');
    } catch(e) {
      expect(e).toEqual(error);
    }
  });

  it('should not adb-connect an already-connected instance', async () => {
    const connectedInstance = aConnectedInstance('mock-adb-name');
    givenFreeInstance(connectedInstance);

    await uut.allocateInstance(recipeUUID);
    expect(instanceLifecycleService.adbConnectInstance).not.toHaveBeenCalled();
  });

  it('should indicate no cold-booting took place', async () => {
    givenFreeInstance(aConnectedInstance());

    const result = await uut.allocateInstance(recipeUUID);
    expect(result.coldBooted).toEqual(false);
  });

  it('should indicate cold-booting took place if new instance created', async () => {
    givenNoFreeInstances();
    givenCreatedInstance(aConnectedInstance());

    const result = await uut.allocateInstance(recipeUUID);
    expect(result.coldBooted).toEqual(true);
  });
});
