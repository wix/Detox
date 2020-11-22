const _ = require('lodash');

const latestInstanceOf = (clazz) => _.last(clazz.mock.instances);

describe('Genymotion-cloud driver', () => {
  class MockInstanceLifecycleService {
    constructor(...args) {
      Object.assign(this, instanceLifecycleService);
      this.ctor(...args);
    }
  }

  const MOCK_GMSAAS_PATH = '/path/to/gmsaas';

  const aRecipe = () => ({
    uuid: 'mock-recipe-uuid',
    name: 'mock-recipe-name',
    toString: () => 'mock-recipe-toString()-result',
  });

  const anInstance = () => ({
    uuid: 'mock-instance-uuid',
    name: 'mock-instance-name',
    adbName: 'mock-instance-adb-name',
  });

  const aDeviceQuery = () => ({
    query: 'mock',
  });

  beforeEach(mockBaseClassesDependencies);
  beforeEach(mockDirectDependencies);

  let logger;
  let emitter;
  let invocationManager;
  let environment;
  let adbObj;
  let Exec;
  let deviceQueryHelper;
  let deviceRegistry;
  let deviceCleanupRegistry;
  let deviceAllocator;
  let authServiceObj;
  beforeEach(() => {
    logger = require('../../../../utils/logger');

    const Emitter = jest.genMockFromModule('../../../../utils/AsyncEmitter');
    emitter = new Emitter();

    environment = require('../../../../utils/environment');
    environment.getGmsaasPath.mockReturnValue(MOCK_GMSAAS_PATH);

    const { InvocationManager } = jest.genMockFromModule('../../../../invoke');
    invocationManager = new InvocationManager();

    const ADB = require('../exec/ADB');
    adbObj = () => latestInstanceOf(ADB);

    Exec = require('./exec/GenyCloudExec');

    const GenyDeviceRegistryFactory = require('./GenyDeviceRegistryFactory');
    const DeviceRegistry = jest.genMockFromModule('../../../DeviceRegistry');
    deviceRegistry = new DeviceRegistry();
    deviceRegistry.allocateDevice.mockImplementation((doAllocateFn) => doAllocateFn());
    GenyDeviceRegistryFactory.forRuntime.mockReturnValue(deviceRegistry);

    deviceCleanupRegistry = new DeviceRegistry();
    GenyDeviceRegistryFactory.forGlobalShutdown.mockReturnValue(deviceCleanupRegistry);

    jest.mock('./helpers/GenyDeviceQueryHelper');
    const DeviceQueryHelper = require('./helpers/GenyDeviceQueryHelper');
    deviceQueryHelper = () => latestInstanceOf(DeviceQueryHelper);

    jest.mock('./GenyCloudDeviceAllocator');
    const DeviceAllocator = require('./GenyCloudDeviceAllocator');
    deviceAllocator = () => latestInstanceOf(DeviceAllocator);

    const AuthService = require('./services/GenyAuthService');
    authServiceObj = () => latestInstanceOf(AuthService);
  });

  let instanceLifecycleService;
  beforeEach(() => {
    const InstanceLifecycleService = jest.genMockFromModule('./services/GenyInstanceLifecycleService');
    instanceLifecycleService = new InstanceLifecycleService();
    instanceLifecycleService.ctor = jest.fn();
    jest.mock('./services/GenyInstanceLifecycleService', () => MockInstanceLifecycleService);
  });

  describe('instance scope', () => {
    let GenyCloudDriver;
    let uut;
    beforeEach(() => {
      GenyCloudDriver = require('./GenyCloudDriver');
      uut = new GenyCloudDriver({
        invocationManager,
        emitter,
        client: {},
      });
    });

    it('should return a generic name at pre-init', () => {
      expect(uut.name).toEqual('Unspecified Genymotion Cloud Emulator');
    });

    it('should initialize the common executable using the path set by the environment', async () => {
      expect(Exec).toHaveBeenCalledWith(MOCK_GMSAAS_PATH);
    });

    describe('preparation', () => {
      it('should throw error if not logged-in to gmsaas', async () => {
        authServiceObj().getLoginEmail.mockResolvedValue(null);

        try {
          await uut.prepare();
          fail('Expected an error');
        } catch (e) {
          expect(e.constructor.name).toEqual('DetoxRuntimeError');
          expect(e.toString()).toContain('Cannot run tests using a Genymotion-cloud emulator, because Genymotion was not logged-in to!');
          expect(e.toString()).toContain(`HINT: Log-in to Genymotion-cloud by running this command (and following instructions):\n${MOCK_GMSAAS_PATH} auth login --help`);
        }
      });

      it('should not throw an error if properly logged in to gmsaas', async () => {
        authServiceObj().getLoginEmail.mockResolvedValue('detox@wix.com');
        await uut.prepare();
      });
    });

    describe('device (instance) allocation', () => {
      const givenNoRecipes = () => deviceQueryHelper().getRecipeFromQuery.mockResolvedValue(null);
      const givenResolvedRecipeForQuery = (recipe) => deviceQueryHelper().getRecipeFromQuery.mockResolvedValue(recipe);
      const givenDeviceAllocationResult = ({ instance, isNew = false }) => deviceAllocator().allocateDevice.mockResolvedValue({ instance, isNew });

      it('should get a recipe and allocate a device', async () => {
        const recipe = aRecipe();
        const instance = anInstance();
        givenResolvedRecipeForQuery(recipe);
        givenDeviceAllocationResult({ instance });

        const deviceQuery = aDeviceQuery();
        const result = await uut.acquireFreeDevice(deviceQuery);

        expect(result).toEqual(expect.objectContaining({
          adbName: instance.adbName,
          uuid: instance.uuid,
        }));
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
        givenDeviceAllocationResult({ instance, isNew: true });

        await uut.acquireFreeDevice(aDeviceQuery());

        expect(emitter.emit).toHaveBeenCalledWith('bootDevice', { coldBoot: true, deviceId: instance.adbName, type: recipe.name });
      });

      it('should return a descriptive device name in post-allocation state', async () => {
        const instance = anInstance();
        givenResolvedRecipeForQuery(aRecipe());
        givenDeviceAllocationResult({ instance });

        await uut.acquireFreeDevice(aDeviceQuery());

        expect(uut.name).toEqual(`GenyCloud:${instance.name} (${instance.uuid} ${instance.adbName})`);
      });

      it('should init ADB\'s API-level', async () => {
        const instance = anInstance();
        givenResolvedRecipeForQuery(aRecipe());
        givenDeviceAllocationResult({ instance });

        await uut.acquireFreeDevice(aDeviceQuery());

        expect(adbObj().apiLevel).toHaveBeenCalledWith(instance.adbName);
      });

      it('should disable native animations', async () => {
        const instance = anInstance();
        givenResolvedRecipeForQuery(aRecipe());
        givenDeviceAllocationResult({ instance });

        await uut.acquireFreeDevice(aDeviceQuery());

        expect(adbObj().disableAndroidAnimations).toHaveBeenCalledWith(instance.adbName);
      });
    });

    describe('app installation', () => {
      const appInstallHelperObj = () => latestInstanceOf(AppInstallHelperClass);

      let AppInstallHelperClass;
      let getAbsoluteBinaryPath;
      beforeEach(() => {
        AppInstallHelperClass = require('../tools/AppInstallHelper');
        getAbsoluteBinaryPath = require('../../../../utils/getAbsoluteBinaryPath');
      });

      it('should install using install helper', async () => {
        getAbsoluteBinaryPath
          .mockReturnValueOnce('bin-install-path')
          .mockReturnValueOnce('testbin-install-path');

        const deviceId = anInstance();
        await uut.installApp(deviceId, 'bin-path', 'testbin-path');
        expect(appInstallHelperObj().install).toHaveBeenCalledWith(deviceId.adbName, 'bin-install-path', 'testbin-install-path');
      });
    });

    describe('clean-up', () => {
      const instrumentationObj = () => latestInstanceOf(Instrumentation);

      let Instrumentation;
      beforeEach(() => {
        Instrumentation = require('../tools/MonitoredInstrumentation');
      });

      it('should dispose an instance based on its UUID', async () => {
        const instance = anInstance();
        await uut.cleanup(instance, 'bundle-id');
        expect(deviceRegistry.disposeDevice).toHaveBeenCalledWith(instance.uuid);
      });

      it('should kill instrumentation', async () => {
        await uut.cleanup(anInstance(), 'bundle-id');
        expect(instrumentationObj().terminate).toHaveBeenCalled();
      });
    });

    describe('shutdown', () => {
      const givenAnInstanceDeletionError = () => instanceLifecycleService.deleteInstance.mockRejectedValue(new Error());

      it('should delete the instance', async () => {
        const instance = anInstance();
        await uut.shutdown(instance);
        expect(instanceLifecycleService.deleteInstance).toHaveBeenCalledWith(instance.uuid);
      });

      it('should throw if deletion fails', async () => {
        givenAnInstanceDeletionError();

        try {
          await uut.shutdown(anInstance());
          fail('Expected an error');
        } catch (e) {}
      });

      it('should emit associated events', async () => {
        const instance = anInstance();
        await uut.shutdown(instance);
        expect(emitter.emit).toHaveBeenCalledWith('beforeShutdownDevice', { deviceId: instance.adbName });
        expect(emitter.emit).toHaveBeenCalledWith('shutdownDevice', { deviceId: instance.adbName });
      });

      it('should not emit shutdown even in case of failure', async () => {
        givenAnInstanceDeletionError();

        try {
          await uut.shutdown(anInstance());
          fail('Expected an error');
        } catch (e) {
          expect(emitter.emit).toHaveBeenCalledWith('beforeShutdownDevice', expect.anything());
          expect(emitter.emit).not.toHaveBeenCalledWith('shutdownDevice', expect.anything());
        }
      });

      it('should remove instance from device-registry', async () => {
        const instance = anInstance();
        await uut.shutdown(instance);
        expect(deviceCleanupRegistry.disposeDevice).toHaveBeenCalledWith(instance.uuid);
      });
    });

  });

  describe('class scope', () => {
    let GenyCloudDriver;
    beforeEach(() => {
      GenyCloudDriver = require('./GenyCloudDriver');
    });

    describe('global clean-up', () => {
      const givenDeletionPendingDevices = (devicesHandles) => deviceCleanupRegistry.readRegisteredDevices.mockResolvedValue(devicesHandles);
      const givenNoDeletionPendingDevices = () => givenDeletionPendingDevices([]);
      const givenDeletionPendingInstances = (instances) => givenDeletionPendingDevices( _.map(instances, ({ uuid, name }) => ({ uuid, name }) ));
      const givenDeletionResult = (deletedInstance) => instanceLifecycleService.deleteInstance.mockResolvedValue(deletedInstance);

      const anAssertablePendingPromise = () => {
        let promiseAck = jest.fn();
        const promise = new Promise(resolve => setTimeout(resolve, 1)).then(promiseAck);
        promise.assertResolved = () => expect(promiseAck).toHaveBeenCalled();
        return promise;
      };

      const aPendingDevice = (name, uuid) => ({ name, uuid });

      it('should kill all deletion-pending device', async () => {
        const killPromise1 = anAssertablePendingPromise();
        const killPromise2 = anAssertablePendingPromise();
        instanceLifecycleService.deleteInstance
          .mockReturnValueOnce(killPromise1)
          .mockReturnValueOnce(killPromise2);

        const deviceHandles = [
          aPendingDevice('device1', 'uuid1'),
          aPendingDevice('device2', 'uuid2'),
        ];
        givenDeletionPendingDevices(deviceHandles);

        await GenyCloudDriver.globalCleanup();

        killPromise1.assertResolved();
        killPromise2.assertResolved();
        expect(instanceLifecycleService.deleteInstance).toHaveBeenCalledWith('uuid1');
        expect(instanceLifecycleService.deleteInstance).toHaveBeenCalledWith('uuid2');
      });

      it('should warn of instances deletion rejects', async () => {
        instanceLifecycleService.deleteInstance
          .mockRejectedValueOnce(new Error('mock-error1'))
          .mockResolvedValueOnce(anInstance())
          .mockRejectedValueOnce(new Error('mock-error2'));

        givenDeletionPendingDevices([
          aPendingDevice('failing1', 'uuid1'),
          aPendingDevice('nonfailing', 'uuid'),
          aPendingDevice('failing2', 'uuid2'),
        ]);

        await GenyCloudDriver.globalCleanup();

        expect(logger.warn).toHaveBeenCalledWith({ event: 'GENYCLOUD_TEARDOWN' }, 'WARNING! Detected a Genymotion cloud instance leakage, for the following instances:');
        expect(logger.warn).toHaveBeenCalledWith({ event: 'GENYCLOUD_TEARDOWN' }, expect.stringMatching(/failing1 \(uuid1\): .*mock-error1/));
        expect(logger.warn).toHaveBeenCalledWith({ event: 'GENYCLOUD_TEARDOWN' }, expect.stringMatching(/failing2 \(uuid2\): .*mock-error2/));
        expect(logger.warn).toHaveBeenCalledTimes(3);
      });

      it('should not warn of deletion rejects if all went well', async () => {
        const instance = anInstance();
        givenDeletionPendingInstances([instance]);
        givenDeletionResult(instance);

        await GenyCloudDriver.globalCleanup();

        expect(logger.warn).not.toHaveBeenCalled();
      });

      it('should properly init the instances service and the delegated exec', async () => {
        const instance = anInstance();
        givenDeletionPendingInstances([instance]);
        givenDeletionResult(instance);

        await GenyCloudDriver.globalCleanup();

        expect(instanceLifecycleService.ctor).toHaveBeenCalledWith(latestInstanceOf(Exec), null);
        expect(Exec).toHaveBeenCalledWith(MOCK_GMSAAS_PATH);
      });

      it('should not init the instances service and its delegates if there are no deletion-pending devices', async () => {
        givenNoDeletionPendingDevices();

        await GenyCloudDriver.globalCleanup();

        expect(Exec).not.toHaveBeenCalled();
        expect(environment.getGmsaasPath).not.toHaveBeenCalled();
        expect(instanceLifecycleService.ctor).not.toHaveBeenCalled();
      });
    });
  });

});

function mockBaseClassesDependencies() {
  jest.mock('../exec/ADB');
  jest.mock('../exec/AAPT');
  jest.mock('../tools/APKPath');
  jest.mock('../tools/TempFileXfer');
  jest.mock('../tools/AppInstallHelper');
  jest.mock('../tools/AppUninstallHelper');
  jest.mock('../tools/MonitoredInstrumentation');
  jest.mock('../../../../artifacts/utils/AndroidDevicePathBuilder');
  jest.mock('../../../../android/espressoapi/UiDeviceProxy');
  jest.mock('../../../../utils/logger');
}

function mockDirectDependencies() {
  jest.mock('../../../../utils/environment');
  jest.mock('./exec/GenyCloudExec');
  jest.mock('./GenyDeviceRegistryFactory');
  jest.mock('./services/GenyRecipesService');
  jest.mock('./services/GenyInstanceLookupService');
  jest.mock('./services/GenyAuthService');
  jest.mock('./services/GenyInstanceNaming');
  jest.mock('../../../../utils/getAbsoluteBinaryPath');
};
