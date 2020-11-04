const _ = require('lodash');
const latestInstanceOf = (clazz) => _.last(clazz.mock.instances);

const mockBaseClassesDependencies = () => {
  jest.mock('../exec/ADB');
  jest.mock('../exec/AAPT');
  jest.mock('../tools/APKPath');
  jest.mock('../tools/TempFileXfer');
  jest.mock('../tools/AppInstallHelper');
  jest.mock('../tools/AppUninstallHelper');
  jest.mock('../tools/MonitoredInstrumentation');
  jest.mock('../../../../artifacts/utils/AndroidDevicePathBuilder');
  jest.mock('../../../../android/espressoapi/UiDeviceProxy');
  jest.mock('../../../DeviceRegistry');
  jest.mock('../../../../utils/logger');
};

const mockDirectDependencies = () => {
  jest.mock('./exec/GenyCloudExec');
  jest.mock('./services/GenyRecipesService');
  jest.mock('./services/GenyInstanceLookupService');
  jest.mock('./services/GenyInstanceLifecycleService');
  jest.mock('./services/GenyInstanceNaming');
};

const aRecipe = () => ({
  uuid: 'mock-recipe-uuid',
  name: 'mock-recipe-name',
  toString: () => 'mock-recipe-toString()-result',
});

const anInstance = () => ({
  uuid: 'mock-instance-uuid',
  adbName: 'mock-instance-adb-name',
});

const aDeviceQuery = () => ({
  query: 'mock',
});

describe('Genymotion-cloud driver', () => {
  beforeEach(mockBaseClassesDependencies);
  beforeEach(mockDirectDependencies);

  let emitter;
  let adb;
  let deviceQueryHelper;
  let deviceAllocator;
  let uut;
  beforeEach(() => {
    const Emitter = jest.genMockFromModule('../../../../utils/AsyncEmitter');
    emitter = new Emitter();

    const { InvocationManager } = jest.genMockFromModule('../../../../invoke');
    const invocationManager = new InvocationManager();

    const ADB = require('../exec/ADB');
    adb = () => latestInstanceOf(ADB);

    const DeviceRegistry = require('../../../DeviceRegistry');
    const deviceRegistry = new DeviceRegistry();
    deviceRegistry.allocateDevice.mockImplementation((doAllocateFn) => doAllocateFn());
    DeviceRegistry.forAndroid.mockReturnValue(deviceRegistry);

    jest.mock('./helpers/GenyDeviceQueryHelper');
    const DeviceQueryHelper = require('./helpers/GenyDeviceQueryHelper');
    deviceQueryHelper = () => latestInstanceOf(DeviceQueryHelper);

    jest.mock('./GenyCloudDeviceAllocator');
    const DeviceAllocator = require('./GenyCloudDeviceAllocator');
    deviceAllocator = () => latestInstanceOf(DeviceAllocator);

    const GenyCloudDriver = require('./GenyCloudDriver');
    uut = new GenyCloudDriver({
      invocationManager,
      emitter,
      client: {},
    });
  });

  it('should return a generic name at pre-init', () => {
    expect(uut.name).toEqual('Unspecified Genymotion Cloud Emulator');
  });

  describe('device (instance) allocation', () => {
    const givenNoRecipes = () => deviceQueryHelper().getRecipeFromQuery.mockResolvedValue(null);
    const givenResolvedRecipeForQuery = (recipe) => deviceQueryHelper().getRecipeFromQuery.mockResolvedValue(recipe);
    const givenDeviceAllocationResult = ({ instance, created = false }) => deviceAllocator().allocateDevice.mockResolvedValue({ instance, created });

    it('should get a recipe and allocate a device', async () => {
      const recipe = aRecipe();
      const instance = anInstance();
      givenResolvedRecipeForQuery(recipe);
      givenDeviceAllocationResult({ instance });

      const deviceQuery = aDeviceQuery();
      const result = await uut.acquireFreeDevice(deviceQuery);

      expect(result).toEqual({
        adbName: instance.adbName,
        uuid: instance.uuid,
      });
      expect(deviceQueryHelper().getRecipeFromQuery).toHaveBeenCalledWith(deviceQuery);
      expect(deviceAllocator().allocateDevice).toHaveBeenCalledWith(recipe);
    });

    it('should throw a descriptive error recipe not found', async () => {
      const deviceQuery = aDeviceQuery();
      givenNoRecipes();
      givenDeviceAllocationResult({ instance: anInstance() });

      try {
        await uut.acquireFreeDevice(deviceQuery);
        fail('Expected an error');
      } catch (e) {
        expect(e.toString()).toContain('No Genycloud devices found for recipe!');
        expect(e.toString()).toContain('HINT: Check that your Genycloud account has a template associated with your Detox device configuration: ' + JSON.stringify(deviceQuery));
      }
    });

    it('should emit a bootDevice event', async () => {
      const recipe = aRecipe();
      const instance = anInstance();
      givenResolvedRecipeForQuery(recipe);
      givenDeviceAllocationResult({ instance });

      await uut.acquireFreeDevice(aDeviceQuery());

      expect(emitter.emit).toHaveBeenCalledWith('bootDevice', { coldBoot: false, deviceId: instance.adbName, type: recipe.name });
    });

    it('should fail if even emission fails', async () => {
      const recipe = aRecipe();
      const instance = anInstance();
      givenResolvedRecipeForQuery(recipe);
      givenDeviceAllocationResult({ instance });

      const error = new Error('mocked error');
      try {
        emitter.emit.mockRejectedValue(error);
        await uut.acquireFreeDevice(aDeviceQuery());
        fail('Expected an error');
      } catch (e) {
        expect(e).toEqual(error);
      }
    });

    it('should emit coldBoot=true in bootDevice event', async () => {
      const recipe = aRecipe();
      const instance = anInstance();
      givenResolvedRecipeForQuery(recipe);
      givenDeviceAllocationResult({ instance, created: true });

      await uut.acquireFreeDevice(aDeviceQuery());

      expect(emitter.emit).toHaveBeenCalledWith('bootDevice', { coldBoot: true, deviceId: instance.adbName, type: recipe.name });
    });

    it('should return a descriptive device name in post-allocation state', async () => {
      const instance = anInstance();
      givenResolvedRecipeForQuery(aRecipe());
      givenDeviceAllocationResult({ instance });

      await uut.acquireFreeDevice(aDeviceQuery());

      expect(uut.name).toEqual(`GenyCloud:${instance.uuid} (${instance.adbName})`);
    });

    it('should init ADB\'s API-level', async () => {
      const instance = anInstance();
      givenResolvedRecipeForQuery(aRecipe());
      givenDeviceAllocationResult({ instance });

      await uut.acquireFreeDevice(aDeviceQuery());

      expect(adb().apiLevel).toHaveBeenCalledWith(instance.adbName);
    });

    it('should disable native animations', async () => {
      const instance = anInstance();
      givenResolvedRecipeForQuery(aRecipe());
      givenDeviceAllocationResult({ instance });

      await uut.acquireFreeDevice(aDeviceQuery());

      expect(adb().disableAndroidAnimations).toHaveBeenCalledWith(instance.adbName);
    });
  });
});
