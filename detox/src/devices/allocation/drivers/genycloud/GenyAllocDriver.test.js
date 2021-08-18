describe('Allocation driver for Genymotion cloud emulators', () => {

  let logger;
  let eventEmitter;
  let recipeQuerying;
  let instanceAllocation;
  let instanceLauncher;
  let GenyInstance;
  let adb;
  beforeEach(() => {
    jest.mock('../../../../utils/logger');
    logger = require('../../../../utils/logger');

    jest.mock('../../../../utils/AsyncEmitter');
    const AsyncEmitter = require('../../../../utils/AsyncEmitter');
    eventEmitter = new AsyncEmitter();

    // TODO ASDASD Relocate all genycloud services?
    jest.mock('../../../runtime/drivers/android/genycloud/services/GenyInstanceLookupService');
    jest.mock('../../../runtime/drivers/android/genycloud/services//GenyInstanceLifecycleService');

    const RecipeQuerying = jest.genMockFromModule('./GenyRecipeQuerying');
    recipeQuerying = new RecipeQuerying();

    const InstanceAllocation = jest.genMockFromModule('./GenyInstanceAllocation');
    instanceAllocation = new InstanceAllocation();

    const InstanceLauncher = jest.genMockFromModule('./GenyInstanceLauncher');
    instanceLauncher = new InstanceLauncher();
    instanceLauncher.launch.mockImplementation((instance, __) => instance);

    GenyInstance = jest.genMockFromModule('../../../runtime/drivers/android/genycloud/services//dto/GenyInstance');

    jest.mock('../../../runtime/drivers/android/exec/ADB');
    const ADB = require('../../../runtime/drivers/android/exec/ADB');
    adb = new ADB();

    jest.mock('../../../cookies/GenycloudEmulatorCookie');
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
  const givenAllocationResult = ({ instance, isNew }) => instanceAllocation.allocateDevice.mockResolvedValue({ instance, isNew });
  const givenReallocationResult = (instance) => givenAllocationResult({ instance, isNew: false });
  const givenFreshAllocationResult = (instance) => givenAllocationResult({ instance, isNew: true });
  const givenLaunchError = (message) => instanceLauncher.launch.mockRejectedValue(new Error(message));
  const givenLaunchResult = (instance) => instanceLauncher.launch.mockResolvedValue(instance);

  const expectDeviceBootEvent = (instance, recipe, coldBoot) =>
    expect(eventEmitter.emit).toHaveBeenCalledWith('bootDevice', {
      coldBoot,
      deviceId: instance.adbName,
      type: recipe.name,
    });

  describe('allocation', () => {
    let deviceQuery;
    let allocDriver;
    beforeEach(() => {
      deviceQuery = aDeviceQuery();

      const { GenyAllocDriver } = require('./GenyAllocDriver');
      allocDriver = new GenyAllocDriver({ recipeQuerying, instanceAllocation, instanceLauncher, eventEmitter, adb });
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
      expect(instanceAllocation.allocateDevice).toHaveBeenCalledWith(recipe);
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
        expect(instanceAllocation.deallocateDevice).toHaveBeenCalledWith(instance.uuid);
      });

      it('should emit a boot event with coldBoot=true', async () => {
        const instance = anInstance();
        const recipe = aRecipe();
        givenRecipe(recipe);
        givenFreshAllocationResult(instance);

        await allocDriver.allocate(deviceQuery);
        expectDeviceBootEvent(instance, recipe, true);
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

      it('should emit a boot event with coldBoot=true', async () => {
        const instance = anInstance();
        const recipe = aRecipe();
        givenRecipe(recipe);
        givenReallocationResult(instance);

        await allocDriver.allocate(deviceQuery);
        expectDeviceBootEvent(instance, recipe, false);
      });
    });

    it('should return a cookie based on the launched instance and recipe', async () => {
      const GenycloudEmulatorCookie = require('../../../cookies/GenycloudEmulatorCookie');
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
      deallocDriver = new GenyDeallocDriver(instance, { instanceAllocation, instanceLauncher });
    });

    it('should deallocate the cloud instance', async () => {
      await deallocDriver.free();
      expect(instanceAllocation.deallocateDevice).toHaveBeenCalledWith(instance.uuid);
    });

    // TODO ASDASD revisit why this is needed
    it('should not deallocate if instance isnt available', async () => {
      const { GenyDeallocDriver } = require('./GenyAllocDriver');
      const driver = new GenyDeallocDriver(undefined, { instanceAllocation, instanceLauncher });
      await driver.free();
      expect(instanceAllocation.deallocateDevice).not.toHaveBeenCalled();
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

// TODO ASDASD
// describe('preparation', () => {
//   const givenProperGmsaasLogin = () => authServiceObj().getLoginEmail.mockResolvedValue('detox@wix.com');
//   const givenGmsaasLoggedOut = () => authServiceObj().getLoginEmail.mockResolvedValue(null);
//   const givenGmsaasExecVersion = (version) => execObj().getVersion.mockResolvedValue({ version });
//   const givenProperGmsaasExecVersion = () => givenGmsaasExecVersion('1.6.0');
//
//   it('should throw an error if gmsaas exec is too old (minor version < 6)', async () => {
//     givenProperGmsaasLogin();
//     givenGmsaasExecVersion('1.5.9');
//
//     try {
//       await uut.prepare();
//     } catch (e) {
//       expect(e.constructor.name).toEqual('DetoxRuntimeError');
//       expect(e.toString()).toContain(`Your Genymotion-Cloud executable (found in ${MOCK_GMSAAS_PATH}) is too old! (version 1.5.9)`);
//       expect(e.toString()).toContain(`HINT: Detox requires version 1.6.0, or newer. To use 'android.genycloud' type devices, you must upgrade it, first.`);
//       return;
//     }
//     throw new Error('Expected an error');
//   });
//
//   it('should accept the gmsaas exec if version is sufficiently new', async () => {
//     givenProperGmsaasLogin();
//     givenGmsaasExecVersion('1.6.0');
//     await uut.prepare();
//   });
//
//   it('should accept the gmsaas exec if version is more than sufficiently new', async () => {
//     givenProperGmsaasLogin();
//     givenGmsaasExecVersion('1.7.2');
//     await uut.prepare();
//   });
//
//   it('should throw an error if gmsaas exec is too old (major version < 1)', async () => {
//     givenProperGmsaasLogin();
//     givenGmsaasExecVersion('0.6.0');
//
//     await expect(uut.prepare())
//       .rejects
//       .toThrowError(`Your Genymotion-Cloud executable (found in ${MOCK_GMSAAS_PATH}) is too old! (version 0.6.0)`);
//   });
//
//   it('should throw an error if not logged-in to gmsaas', async () => {
//     givenProperGmsaasExecVersion();
//     givenGmsaasLoggedOut();
//
//     try {
//       await uut.prepare();
//     } catch (e) {
//       expect(e.constructor.name).toEqual('DetoxRuntimeError');
//       expect(e.toString()).toContain(`Cannot run tests using 'android.genycloud' type devices, because Genymotion was not logged-in to!`);
//       expect(e.toString()).toContain(`HINT: Log-in to Genymotion-cloud by running this command (and following instructions):\n${MOCK_GMSAAS_PATH} auth login --help`);
//       return;
//     }
//     throw new Error('Expected an error');
//   });
//
//   it('should not throw an error if properly logged in to gmsaas', async () => {
//     givenProperGmsaasExecVersion();
//     givenProperGmsaasLogin();
//
//     await uut.prepare();
//   });
// });
