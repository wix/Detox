describe('Allocation driver for Genymotion cloud emulators', () => {
  const deviceConfig = {
    device: {
      query: 'mock',
    },
  };

  let recipeQuerying;
  let allocationHelper;
  let instanceLauncher;
  let GenyInstance;
  let adb;
  beforeEach(() => {
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
  });

  let allocDriver;
  beforeEach(() => {
    jest.mock('../../../../cookies/GenycloudEmulatorCookie');

    const GenyAllocDriver = require('./GenyAllocDriver');
    allocDriver = new GenyAllocDriver({ recipeQuerying, allocationHelper, instanceLauncher, adb });
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
  };

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

    it('should obtain recipe from recipes service', async () => {
      givenRecipe(aRecipe());
      givenReallocationResult(anInstance());

      await allocDriver.allocate(deviceConfig);
      expect(recipeQuerying.getRecipeFromQuery).toHaveBeenCalledWith(deviceConfig.device);
    });

    it('should throw a descriptive error if recipe not found', async () => {
      givenNoRecipe();
      givenReallocationResult(anInstance());

      try {
        await allocDriver.allocate(deviceConfig);
      } catch (e) {
        expect(e.toString()).toContain('No Genymotion-Cloud template found to match the configured lookup query');
        expect(e.toString()).toContain(JSON.stringify(deviceConfig.device));
        expect(e.toString()).toContain('HINT: Revisit your detox configuration');
        expect(e.toString()).toContain('https://cloud.geny.io/recipes#custom');
        return;
      }
      throw new Error('Expected an error');
    });

    it('should allocate a cloud instance based on the recipe', async () => {
      const recipe = aRecipe();
      givenRecipe(recipe);
      givenReallocationResult(anInstance());

      await allocDriver.allocate(deviceConfig);
      expect(allocationHelper.allocateDevice).toHaveBeenCalledWith(recipe);
    });

    describe('given an allocation of a fresh cloud instance', () => {
      it('should launch it', async () => {
        const expectedIsNew = false;
        const instance = anInstance();
        givenRecipe(aRecipe());
        givenReallocationResult(instance);

        await allocDriver.allocate(deviceConfig);

        expect(instanceLauncher.launch).toHaveBeenCalledWith(instance, expectedIsNew);
      });

      it('should fail if launch fails', async () => {
        givenRecipe(aRecipe());
        givenFreshAllocationResult(anInstance());
        givenLaunchError('alloc error mock');

        await expect(allocDriver.allocate(deviceConfig)).rejects.toThrowError('alloc error mock');
      });

      it('should deallocate the instance if launch fails', async () => {
        const instance = anInstance();

        givenRecipe(aRecipe());
        givenFreshAllocationResult(instance);
        givenLaunchError('alloc error mock');

        try {
          await allocDriver.allocate(deviceConfig);
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

        await allocDriver.allocate(deviceConfig);

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

      const result = await allocDriver.allocate(deviceConfig);
      expect(result.constructor.name).toEqual('GenycloudEmulatorCookie');
      expect(GenycloudEmulatorCookie).toHaveBeenCalledWith(launchedInstance);
    });

    it('should prepare the emulators itself', async () => {
      const instance = anInstance();
      givenRecipe(aRecipe());
      givenReallocationResult(instance);

      await allocDriver.allocate(deviceConfig);

      expect(adb.disableAndroidAnimations).toHaveBeenCalledWith(instance.adbName);
      expect(adb.setWiFiToggle).toHaveBeenCalledWith(instance.adbName, true);
    });

    it('should inquire the API level', async () => {
      const instance = anInstance();
      givenRecipe(aRecipe());
      givenReallocationResult(instance);

      await allocDriver.allocate(deviceConfig);

      expect(adb.apiLevel).toHaveBeenCalledWith(instance.adbName);
    });
  });

  describe('deallocation', () => {
    let instance;
    let cookie;
    beforeEach(() => {
      jest.unmock('../../../../cookies/GenycloudEmulatorCookie');

      instance = anInstance();

      const Cookie = require('../../../../cookies/GenycloudEmulatorCookie');
      cookie = new Cookie(instance);
    });

    it('should deallocate the cloud instance', async () => {
      await allocDriver.free(cookie);
      expect(allocationHelper.deallocateDevice).toHaveBeenCalledWith(instance.uuid);
    });

    it('should shut the instance down if specified', async () => {
      await allocDriver.free(cookie, { shutdown: true });

      expect(instanceLauncher.shutdown).toHaveBeenCalledWith(instance);
    });

    it('should not shut the instance down, by default', async () => {
      await allocDriver.free(cookie, undefined);
      expect(instanceLauncher.shutdown).not.toHaveBeenCalled();
    });
  });
});
