describe('Allocation driver for Genymotion cloud emulators', () => {
  let logger;
  let recipeQuerying;
  let allocationHelper;
  let instanceLauncher;
  let GenyInstance;
  let adb;
  beforeEach(() => {
    jest.mock('../../../../../utils/logger');
    logger = require('../../../../../utils/logger');

    jest.mock('../../../../common/drivers/android/genycloud/services/GenyInstanceLookupService');
    jest.mock('../../../../common/drivers/android/genycloud/services/GenyInstanceLifecycleService');

    const RecipeQuerying = jest.genMockFromModule('./GenyRecipeQuerying');
    recipeQuerying = new RecipeQuerying();

    const InstanceAllocationHelper = jest.genMockFromModule('./GenyInstanceAllocationHelper');
    allocationHelper = new InstanceAllocationHelper();

    const InstanceLauncher = jest.genMockFromModule('./GenyInstanceLauncher');
    instanceLauncher = new InstanceLauncher();
    instanceLauncher.launch.mockImplementation((instance, __) => instance);

    GenyInstance = jest.genMockFromModule('../../../../common/drivers/android/genycloud/services/dto/GenyInstance');

    jest.mock('../../../../common/drivers/android/exec/ADB');
    const ADB = require('../../../../common/drivers/android/exec/ADB');
    adb = new ADB();

    jest.mock('../../../../cookies/GenycloudEmulatorCookie');
  });

  const aDeviceQuery = () => ({
    query: 'mock',
  });

  const aRecipe = () => ({
    uuid: 'mock-recipe-uuid',
    name: 'mock-recipe-name',
    toString: () => 'mock-recipe-toString()',
  });

  const anInstance = () => {
    const instance = new GenyInstance();
    instance.uuid = 'mock-instance-uuid';
    instance.name = 'mock-instance-name';
    instance.toString = () => 'mock-instance-toString()';
    return instance;
  }

  const aLaunchedInstance = () => {
    const instance = anInstance();
    instance.isAdbConnected.mockReturnValue(true);
    instance.adbName = 'localhost:1234';
    return instance;
  };

  const givenRecipe = (recipe) => recipeQuerying.getRecipeFromQuery.mockResolvedValue(recipe);
  const givenNoRecipe = () => givenRecipe(undefined);
  const givenAllocationResult = ({ instance, isNew }) => allocationHelper.allocateDevice.mockResolvedValue({ instance, isNew });
  const givenReallocationResult = (instance) => givenAllocationResult({ instance, isNew: false });
  const givenFreshAllocationResult = (instance) => givenAllocationResult({ instance, isNew: true });
  const givenLaunchError = (message) => instanceLauncher.launch.mockRejectedValue(new Error(message));
  const givenLaunchResult = (instance) => instanceLauncher.launch.mockResolvedValue(instance);

  describe('allocation', () => {
    let deviceQuery;
    let allocDriver;
    beforeEach(() => {
      deviceQuery = aDeviceQuery();

      const { GenyAllocDriver } = require('./GenyAllocDriver');
      allocDriver = new GenyAllocDriver({ recipeQuerying, allocationHelper, instanceLauncher, adb });
    });

    it('should obtain recipe from recipes service', async () => {
      givenRecipe(aRecipe());
      givenReallocationResult(anInstance());

      await allocDriver.allocate(deviceQuery);
      expect(recipeQuerying.getRecipeFromQuery).toHaveBeenCalledWith(deviceQuery);
    });

    it('should throw a descriptive error if recipe not found', async () => {
      givenNoRecipe();
      givenReallocationResult(anInstance());

      try {
        await allocDriver.allocate(deviceQuery);
      } catch (e) {
        expect(e.toString()).toContain('No Genymotion-Cloud template found to match the configured lookup query');
        expect(e.toString()).toContain(JSON.stringify(deviceQuery));
        expect(e.toString()).toContain('HINT: Revisit your detox configuration');
        expect(e.toString()).toContain('https://cloud.geny.io/app/shared-devices');
        return;
      }
      throw new Error('Expected an error');
    });

    it('should allocate a cloud instance based on the recipe', async () => {
      const recipe = aRecipe();
      givenRecipe(recipe);
      givenReallocationResult(anInstance());

      await allocDriver.allocate(deviceQuery);
      expect(allocationHelper.allocateDevice).toHaveBeenCalledWith(recipe);
    });

    describe('given an allocation of a fresh cloud instance', () => {
      it('should launch it', async () => {
        const expectedIsNew = false;
        const instance = anInstance();
        givenRecipe(aRecipe());
        givenReallocationResult(instance);

        await allocDriver.allocate(deviceQuery);

        expect(instanceLauncher.launch).toHaveBeenCalledWith(instance, expectedIsNew);
      });

      it('should fail if launch fails', async () => {
        givenRecipe(aRecipe());
        givenFreshAllocationResult(anInstance());
        givenLaunchError('alloc error mock');

        await expect(allocDriver.allocate(deviceQuery)).rejects.toThrowError('alloc error mock');
      });

      it('should deallocate the instance if launch fails', async () => {
        const instance = anInstance();

        givenRecipe(aRecipe());
        givenFreshAllocationResult(instance);
        givenLaunchError('alloc error mock');

        try {
          await allocDriver.allocate(deviceQuery);
        } catch (e) {}
        expect(allocationHelper.deallocateDevice).toHaveBeenCalledWith(instance.uuid);
      });
    });

    describe('given an allocation of an existing cloud instance (reused)', () => {
      it('should launch it', async () => {
        const expectedIsNew = true;
        const instance = anInstance();
        givenRecipe(aRecipe());
        givenFreshAllocationResult(instance);

        await allocDriver.allocate(deviceQuery);

        expect(instanceLauncher.launch).toHaveBeenCalledWith(instance, expectedIsNew);
      });
    });

    it('should return a cookie based on the launched instance and recipe', async () => {
      const GenycloudEmulatorCookie = require('../../../../cookies/GenycloudEmulatorCookie');
      const instance = anInstance();
      const launchedInstance = aLaunchedInstance();
      givenRecipe(aRecipe());
      givenReallocationResult(instance);
      givenLaunchResult(launchedInstance);

      const result = await allocDriver.allocate(deviceQuery);
      expect(result.constructor.name).toEqual('GenycloudEmulatorCookie');
      expect(GenycloudEmulatorCookie).toHaveBeenCalledWith(launchedInstance);
    });

    it('should prepare the emulators itself', async () => {
      const instance = anInstance();
      givenRecipe(aRecipe());
      givenReallocationResult(instance);

      await allocDriver.allocate(deviceQuery);

      expect(adb.disableAndroidAnimations).toHaveBeenCalledWith(instance.adbName);
    });

    it('should inquire the API level', async () => {
      const instance = anInstance();
      givenRecipe(aRecipe());
      givenReallocationResult(instance);

      await allocDriver.allocate(deviceQuery);

      expect(adb.apiLevel).toHaveBeenCalledWith(instance.adbName);
    });
  });

  describe('deallocation', () => {
    let instance;
    let deallocDriver;
    beforeEach(() => {
      instance = anInstance();
      const { GenyDeallocDriver } = require('./GenyAllocDriver');
      deallocDriver = new GenyDeallocDriver(instance, { allocationHelper, instanceLauncher });
    });

    it('should deallocate the cloud instance', async () => {
      await deallocDriver.free();
      expect(allocationHelper.deallocateDevice).toHaveBeenCalledWith(instance.uuid);
    });

    it('should shut the instance down if specified', async () => {
      await deallocDriver.free({ shutdown: true });

      expect(instanceLauncher.shutdown).toHaveBeenCalledWith(instance);
    });

    it('should not shut the instance down, by default', async () => {
      await deallocDriver.free(undefined);
      expect(instanceLauncher.shutdown).not.toHaveBeenCalled();
    });
  });
});
