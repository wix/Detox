describe.skip('Allocation driver for Genymotion SaaS emulators', () => {
  const deviceConfig = {
    device: {
      query: 'mock',
    },
  };

  let recipeQuerying;
  let instanceLifecycleService;
  let instanceLauncher;
  let GenyInstance;
  let adb;

  beforeEach(() => {
    jest.mock('./services/GenyInstanceLookupService');
    jest.mock('./services/GenyInstanceLifecycleService');

    const RecipeQuerying = jest.genMockFromModule('./GenyRecipeQuerying');
    recipeQuerying = new RecipeQuerying();

    const InstanceLifecyleService = jest.genMockFromModule('./services/GenyInstanceLifecycleService');
    instanceLifecycleService = new InstanceLifecyleService();

    const InstanceLauncher = jest.genMockFromModule('./GenyInstanceLauncher');
    instanceLauncher = new InstanceLauncher();
    instanceLauncher.launch.mockImplementation((instance, __) => instance);

    GenyInstance = jest.genMockFromModule('./services/dto/GenyInstance');

    jest.mock('../../../../common/drivers/android/exec/ADB');
    const ADB = require('../../../../common/drivers/android/exec/ADB');
    adb = new ADB();
  });

  let allocDriver;
  beforeEach(() => {
    const GenyAllocDriver = require('./GenyAllocDriver');
    allocDriver = new GenyAllocDriver({
      adb,
      instanceLauncher,
      instanceLifecycleService,
      recipeQuerying,
    });
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
  const givenLaunchResult = (instance) => instanceLauncher.launch.mockResolvedValue(instance);
  const givenLaunchError = (message) => instanceLauncher.launch.mockRejectedValue(new Error(message));
  const givenAllocationResult = (instance) => instanceLauncher.connect.mockResolvedValue(instance);
  const givenReallocationResult = () => givenAllocationResult(aLaunchedInstance());
  const givenFreshAllocationResult = () => givenAllocationResult(anInstance());

  describe('allocation', () => {
    it('should obtain recipe from recipes service', async () => {
      givenRecipe(aRecipe());
      givenReallocationResult();

      await allocDriver.allocate(deviceConfig);
      expect(recipeQuerying.getRecipeFromQuery).toHaveBeenCalledWith(deviceConfig.device);
    });

    it('should throw a descriptive error if recipe not found', async () => {
      givenNoRecipe();
      givenReallocationResult();

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
      givenReallocationResult();

      await allocDriver.allocate(deviceConfig);
      expect(allocationHelper.allocateDevice).toHaveBeenCalledWith(recipe);
    });

    describe('post-allocation', () => {
      describe('given a fresh cloud instance', () => {
        it('should launch it', async () => {
          const expectedIsNew = true;
          const instance = anInstance();
          givenRecipe(aRecipe());
          givenFreshAllocationResult(instance);

          const cookie = await allocDriver.allocate(deviceConfig);
          await allocDriver.postAllocate(cookie);

          expect(instanceLauncher.launch).toHaveBeenCalledWith(instance, expectedIsNew);
        });

        it('should fail if launch fails', async () => {
          givenRecipe(aRecipe());
          givenFreshAllocationResult(anInstance());
          givenLaunchError('alloc error mock');

          const cookie = await allocDriver.allocate(deviceConfig);
          await expect(allocDriver.postAllocate(cookie)).rejects.toThrowError('alloc error mock');
        });
      });

      describe('given an existing cloud instance (reused)', () => {
        it('should launch it', async () => {
          const expectedIsNew = false;
          const instance = anInstance();
          givenRecipe(aRecipe());
          givenReallocationResult(instance);

          const cookie = await allocDriver.allocate(deviceConfig);
          await allocDriver.postAllocate(cookie);

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
        expect(result).toBeInstanceOf(GenycloudEmulatorCookie);
        expect(result.instance).toBe(instance);
        expect(result.adbName).toBeUndefined();

        await allocDriver.postAllocate(result);
        expect(result.adbName).toBe('localhost:1234');
      });

      it('should prepare the emulators itself', async () => {
        const instance = anInstance();
        givenRecipe(aRecipe());
        givenReallocationResult(instance);

        const cookie = await allocDriver.allocate(deviceConfig);
        await allocDriver.postAllocate(cookie);

        expect(adb.disableAndroidAnimations).toHaveBeenCalledWith(instance.adbName);
        expect(adb.setWiFiToggle).toHaveBeenCalledWith(instance.adbName, true);
      });

      it('should inquire the API level', async () => {
        const instance = anInstance();
        givenRecipe(aRecipe());
        givenReallocationResult(instance);

        const cookie = await allocDriver.allocate(deviceConfig);
        await allocDriver.postAllocate(cookie);
        expect(adb.apiLevel).toHaveBeenCalledWith(instance.adbName);
      });
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
