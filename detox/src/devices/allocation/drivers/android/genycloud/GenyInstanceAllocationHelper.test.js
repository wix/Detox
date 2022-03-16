describe('Genymotion-Cloud instance allocation helper', () => {
  const recipeUUID = 'mock-recipe-uuid';
  const recipeName = 'mock-recipe-name';

  let logger;
  let deviceRegistry;
  let instanceLookupService;
  let instanceLifecycleService;
  let GenyInstance;
  let uut;
  beforeEach(() => {
    jest.mock('../../../../../utils/logger');
    logger = require('../../../../../utils/logger');

    const DeviceRegistry = jest.genMockFromModule('../../../../DeviceRegistry');
    deviceRegistry = new DeviceRegistry();
    deviceRegistry.allocateDevice.mockImplementation((func) => func());

    const InstanceLookupService = jest.genMockFromModule('../../../../common/drivers/android/genycloud/services/GenyInstanceLookupService');
    instanceLookupService = new InstanceLookupService();

    const InstanceLifecycleService = jest.genMockFromModule('../../../../common/drivers/android/genycloud/services//GenyInstanceLifecycleService');
    instanceLifecycleService = new InstanceLifecycleService();

    GenyInstance = jest.genMockFromModule('../../../../common/drivers/android/genycloud/services//dto/GenyInstance');

    const InstanceAllocationHelper = require('./GenyInstanceAllocationHelper');
    uut = new InstanceAllocationHelper({ deviceRegistry, instanceLookupService, instanceLifecycleService });
  });

  const aRecipe = () => ({
    uuid: recipeUUID,
    name: recipeName,
    toString: () => 'mock-recipe-toString()',
  });

  const anInstance = () => {
    const instance = new GenyInstance();
    instance.uuid = 'mock-instance-uuid';
    instance.name = 'mock-instance-name';
    instance.toString = () => 'mock-instance-toString()';
    return instance;
  };

  const givenFreeInstance = (instance) => instanceLookupService.findFreeInstance.mockResolvedValueOnce(instance);
  const givenNoFreeInstances = () => instanceLookupService.findFreeInstance.mockResolvedValue(undefined);
  const givenCreatedInstance = (instance) => instanceLifecycleService.createInstance.mockResolvedValueOnce(instance);

  describe('allocation', () => {
    it('should return a free (already running) instance', async () => {
      const freeInstance = anInstance();
      givenFreeInstance(freeInstance);

      const result = await uut.allocateDevice(aRecipe());
      expect(result.instance).toEqual(freeInstance);
      expect(result.isNew).toEqual(false);
      expect(instanceLookupService.findFreeInstance).toHaveBeenCalled();
    });

    it('should allocate instance based on the instance\'s UUID', async () => {
      const instance = anInstance();
      givenFreeInstance(instance);

      deviceRegistry.allocateDevice.mockImplementation(async (func) => {
        const result = await func();
        expect(result).toEqual(instance.uuid);
        return result;
      });

      await uut.allocateDevice(aRecipe());
      expect(deviceRegistry.allocateDevice).toHaveBeenCalled();
    });

    it('should create an instance if no free one is available', async () => {
      const newInstance = anInstance();
      givenNoFreeInstances();
      givenCreatedInstance(newInstance);

      const result = await uut.allocateDevice(aRecipe());
      expect(result.instance).toEqual(newInstance);
      expect(result.isNew).toEqual(true);
      expect(instanceLifecycleService.createInstance).toHaveBeenCalledWith(recipeUUID);
    });

    it('should log pre-allocate message', async () => {
      givenFreeInstance(anInstance());
      await uut.allocateDevice(aRecipe());
      expect(logger.debug).toHaveBeenCalledWith({ event: 'ALLOCATE_DEVICE' }, expect.stringContaining('Trying to allocate'));
      expect(logger.debug).toHaveBeenCalledWith({ event: 'ALLOCATE_DEVICE' }, expect.stringContaining('mock-recipe-toString()'));
    });

    it('should log post-allocate message', async () => {
      const instance = anInstance();
      givenFreeInstance(instance);

      await uut.allocateDevice(aRecipe());

      expect(logger.info).toHaveBeenCalledWith({ event: 'ALLOCATE_DEVICE' }, `Allocating Genymotion-Cloud instance ${instance.name} for testing. To access it via a browser, go to: https://cloud.geny.io/instance/${instance.uuid}`);
    });
  });

  describe('deallocation', () => {
    it('should dispose the instance from the standard device registry', async () => {
      const instance = anInstance();
      await uut.deallocateDevice(instance.uuid);
      expect(deviceRegistry.disposeDevice).toHaveBeenCalledWith(instance.uuid);
    });

    it('should fail if registry fails', async () => {
      const instance = anInstance();
      deviceRegistry.disposeDevice.mockRejectedValue(new Error());

      await expect(uut.deallocateDevice(instance.uuid)).rejects.toThrowError();
    });
  });
});
