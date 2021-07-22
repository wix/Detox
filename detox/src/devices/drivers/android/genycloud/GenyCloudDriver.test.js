const _ = require('lodash');

const latestInstanceOf = (clazz) => _.last(clazz.mock.instances);

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
  toString: () => 'mock-instance-toString()',
});

const aDeviceQuery = () => ({
  query: 'mock',
});

describe('Genymotion-cloud driver', () => {
  class MockInstanceLifecycleService {
    constructor(...args) {
      Object.assign(this, instanceLifecycleService);
      this.ctor(...args);
    }
  }

  beforeEach(mockBaseClassesDependencies);
  beforeEach(mockDirectDependencies);

  let signalExit;
  let logger;
  let emitter;
  let invocationManager;
  let environment;
  let adbObj;
  let Exec;
  let execObj;
  let recipeQuerying;
  let deviceRegistry;
  let deviceCleanupRegistry;
  let instanceLauncher;
  let instanceAllocation;
  let authServiceObj;
  let detoxGenymotionManager;

  beforeEach(() => {
    signalExit = require('signal-exit');

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
    execObj = () => latestInstanceOf(Exec);

    const GenyDeviceRegistryFactory = require('./GenyDeviceRegistryFactory');
    const DeviceRegistry = jest.genMockFromModule('../../../DeviceRegistry');
    deviceRegistry = new DeviceRegistry();
    deviceRegistry.allocateDevice.mockImplementation((doAllocateFn) => doAllocateFn());
    GenyDeviceRegistryFactory.forRuntime.mockReturnValue(deviceRegistry);

    deviceCleanupRegistry = new DeviceRegistry();
    GenyDeviceRegistryFactory.forGlobalShutdown.mockReturnValue(deviceCleanupRegistry);

    jest.mock('./helpers/GenyRecipeQuerying');
    const GenyRecipeQuerying = require('./helpers/GenyRecipeQuerying');
    recipeQuerying = () => latestInstanceOf(GenyRecipeQuerying);

    jest.mock('./helpers/GenyCloudInstanceLauncher');
    const InstanceLauncher = require('./helpers/GenyCloudInstanceLauncher');
    instanceLauncher = () => latestInstanceOf(InstanceLauncher);

    jest.mock('./helpers/GenyCloudInstanceAllocation');
    const InstanceAllocation = require('./helpers/GenyCloudInstanceAllocation');
    instanceAllocation = () => latestInstanceOf(InstanceAllocation);

    const AuthService = require('./services/GenyAuthService');
    authServiceObj = () => latestInstanceOf(AuthService);

    jest.mock('../../../../android/espressoapi/DetoxGenymotionManager');
    detoxGenymotionManager = require('../../../../android/espressoapi/DetoxGenymotionManager');
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
      expect(uut.name).toEqual('Unspecified GMSaaS Emulator');
    });

    it('should initialize the common executable using the path set by the environment', () => {
      expect(Exec).toHaveBeenCalledWith(MOCK_GMSAAS_PATH);
    });

    it('should return the adb-name as the external ID', () => {
      const instance = anInstance();
      expect(uut.getExternalId(instance)).toEqual(instance.adbName);
    });

    describe('preparation', () => {
      const givenProperGmsaasLogin = () => authServiceObj().getLoginEmail.mockResolvedValue('detox@wix.com');
      const givenGmsaasLoggedOut = () => authServiceObj().getLoginEmail.mockResolvedValue(null);
      const givenGmsaasExecVersion = (version) => execObj().getVersion.mockResolvedValue({ version });
      const givenProperGmsaasExecVersion = () => givenGmsaasExecVersion('1.6.0');

      it('should throw an error if gmsaas exec is too old (minor version < 6)', async () => {
        givenProperGmsaasLogin();
        givenGmsaasExecVersion('1.5.9');

        try {
          await uut.prepare();
        } catch (e) {
          expect(e.constructor.name).toEqual('DetoxRuntimeError');
          expect(e.toString()).toContain(`Your Genymotion-Cloud executable (found in ${MOCK_GMSAAS_PATH}) is too old! (version 1.5.9)`);
          expect(e.toString()).toContain(`HINT: Detox requires version 1.6.0, or newer. To use 'android.genycloud' type devices, you must upgrade it, first.`);
          return;
        }
        throw new Error('Expected an error');
      });

      it('should accept the gmsaas exec if version is sufficiently new', async () => {
        givenProperGmsaasLogin();
        givenGmsaasExecVersion('1.6.0');
        await uut.prepare();
      });

      it('should accept the gmsaas exec if version is more than sufficiently new', async () => {
        givenProperGmsaasLogin();
        givenGmsaasExecVersion('1.7.2');
        await uut.prepare();
      });

      it('should throw an error if gmsaas exec is too old (major version < 1)', async () => {
        givenProperGmsaasLogin();
        givenGmsaasExecVersion('0.6.0');

        await expect(uut.prepare())
          .rejects
          .toThrowError(`Your Genymotion-Cloud executable (found in ${MOCK_GMSAAS_PATH}) is too old! (version 0.6.0)`);
      });

      it('should throw an error if not logged-in to gmsaas', async () => {
        givenProperGmsaasExecVersion();
        givenGmsaasLoggedOut();

        try {
          await uut.prepare();
        } catch (e) {
          expect(e.constructor.name).toEqual('DetoxRuntimeError');
          expect(e.toString()).toContain(`Cannot run tests using 'android.genycloud' type devices, because Genymotion was not logged-in to!`);
          expect(e.toString()).toContain(`HINT: Log-in to Genymotion-cloud by running this command (and following instructions):\n${MOCK_GMSAAS_PATH} auth login --help`);
          return;
        }
        throw new Error('Expected an error');
      });

      it('should not throw an error if properly logged in to gmsaas', async () => {
        givenProperGmsaasExecVersion();
        givenProperGmsaasLogin();

        await uut.prepare();
      });
    });

    describe('device (instance) allocation', () => {
      const givenNoRecipes = () => recipeQuerying().getRecipeFromQuery.mockResolvedValue(null);
      const givenResolvedRecipeForQuery = (recipe) => recipeQuerying().getRecipeFromQuery.mockResolvedValue(recipe);
      const givenDeviceAllocationResult = (instance) => instanceAllocation().allocateDevice.mockResolvedValue(instance);

      it('should get a recipe and allocate a device', async () => {
        const recipe = aRecipe();
        const instance = anInstance();
        givenResolvedRecipeForQuery(recipe);
        givenDeviceAllocationResult(instance);

        const deviceQuery = aDeviceQuery();
        const result = await uut.acquireFreeDevice(deviceQuery);

        expect(result).toEqual(instance);
        expect(recipeQuerying().getRecipeFromQuery).toHaveBeenCalledWith(deviceQuery);
        expect(instanceAllocation().allocateDevice).toHaveBeenCalledWith(recipe);
      });

      it('should throw a descriptive error recipe not found', async () => {
        const deviceQuery = aDeviceQuery();
        givenNoRecipes();
        givenDeviceAllocationResult(anInstance());

        try {
          await uut.acquireFreeDevice(deviceQuery);
        } catch (e) {
          expect(e.toString()).toContain('No Genymotion-Cloud template found to match the configured lookup query');
          expect(e.toString()).toContain(JSON.stringify(deviceQuery));
          expect(e.toString()).toContain('HINT: Revisit your detox configuration');
          expect(e.toString()).toContain('https://cloud.geny.io/app/shared-devices');
          return;
        }
        throw new Error('Expected an error');
      });

      it('should return a descriptive device name in post-allocation state', async () => {
        const instance = anInstance();
        givenResolvedRecipeForQuery(aRecipe());
        givenDeviceAllocationResult(instance);

        await uut.acquireFreeDevice(aDeviceQuery());

        expect(uut.name).toEqual('mock-instance-toString()');
      });

      it('should init ADB\'s API-level', async () => {
        const instance = anInstance();
        givenResolvedRecipeForQuery(aRecipe());
        givenDeviceAllocationResult(instance);

        await uut.acquireFreeDevice(aDeviceQuery());

        expect(adbObj().apiLevel).toHaveBeenCalledWith(instance.adbName);
      });

      it('should disable native animations', async () => {
        const instance = anInstance();
        givenResolvedRecipeForQuery(aRecipe());
        givenDeviceAllocationResult(instance);

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

      it('should no-op if there is no instance given', async () => {
        await uut.cleanup(undefined, 'bundle-id');
        expect(instanceAllocation().deallocateDevice).not.toHaveBeenCalled();
      });

      it('should deallocate an instance based on its UUID', async () => {
        const instance = anInstance();
        await uut.cleanup(instance, 'bundle-id');
        expect(instanceAllocation().deallocateDevice).toHaveBeenCalledWith(instance.uuid);
      });

      it('should kill instrumentation', async () => {
        await uut.cleanup(anInstance(), 'bundle-id');
        expect(instrumentationObj().terminate).toHaveBeenCalled();
      });

      it('should deallocate the instance even if instrumentation termination fails', async () => {
        const instance = anInstance();

        instrumentationObj().terminate.mockRejectedValue(new Error());

        try {
          await uut.cleanup(instance, 'bundle-id');
        } catch (e) {}
        expect(instanceAllocation().deallocateDevice).toHaveBeenCalledWith(instance.uuid);
      });
    });

    describe('shutdown', () => {
      it('should deallocate the instance', async () => {
        const instance = anInstance();
        await uut.shutdown(instance);
        expect(instanceLauncher().shutdown).toHaveBeenCalledWith(instance);
      });
    });

    describe('setLocation', () => {
      it('should invoke `DetoxGenymotionManager.setLocation` with specified coordinates', async () => {
        const invocation = {
          method: 'setLocation'
        };
        detoxGenymotionManager.setLocation.mockReturnValue(invocation);

        const instance = anInstance();
        await uut.setLocation(instance, '40.5', '55.5');
        expect(invocationManager.execute).toHaveBeenCalledWith(invocation);
        expect(detoxGenymotionManager.setLocation).toHaveBeenCalledWith(40.5, 55.5);
      });
    });
  });

  describe('class scope', () => {
    let GenyCloudDriver;
    beforeEach(() => {
      GenyCloudDriver = require('./GenyCloudDriver');
    });

    // As typically returned by the DeviceRegistry
    const aPendingRawDevice = (name, uuid) => ({
      id: uuid,
      data: { name },
    });

    describe('global clean-up', () => {
      const givenDeletionPendingDevices = (rawDevices) => deviceCleanupRegistry.readRegisteredDevices.mockResolvedValue({ rawDevices });
      const givenNoDeletionPendingDevices = () => givenDeletionPendingDevices([]);
      const givenDeletionPendingInstances = (instances) => givenDeletionPendingDevices( _.map(instances, ({ uuid, name }) => aPendingRawDevice(name, uuid)) );
      const givenDeletionResult = (deletedInstance) => instanceLifecycleService.deleteInstance.mockResolvedValue(deletedInstance);

      const anAssertablePendingPromise = () => {
        let promiseAck = jest.fn();
        const promise = new Promise(resolve => setTimeout(resolve, 1)).then(promiseAck);
        promise.assertResolved = () => expect(promiseAck).toHaveBeenCalled();
        return promise;
      };

      it('should kill all deletion-pending device', async () => {
        const killPromise1 = anAssertablePendingPromise();
        const killPromise2 = anAssertablePendingPromise();
        instanceLifecycleService.deleteInstance
          .mockReturnValueOnce(killPromise1)
          .mockReturnValueOnce(killPromise2);

        givenDeletionPendingDevices([
          aPendingRawDevice('device1', 'uuid1'),
          aPendingRawDevice('device2', 'uuid2'),
        ]);

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
          aPendingRawDevice('failing1', 'uuid1'),
          aPendingRawDevice('nonfailing', 'uuid'),
          aPendingRawDevice('failing2', 'uuid2'),
        ]);

        await GenyCloudDriver.globalCleanup();

        expect(logger.warn).toHaveBeenCalledWith({ event: 'GENYCLOUD_TEARDOWN' }, 'WARNING! Detected a Genymotion cloud instance leakage, for the following instances:');
        expect(logger.warn).toHaveBeenCalledWith({ event: 'GENYCLOUD_TEARDOWN' }, expect.stringMatching(/failing1 \(uuid1\): .*mock-error1/));
        expect(logger.warn).toHaveBeenCalledWith({ event: 'GENYCLOUD_TEARDOWN' }, expect.stringMatching(/failing2 \(uuid2\): .*mock-error2/));
        expect(logger.warn).toHaveBeenCalledWith({ event: 'GENYCLOUD_TEARDOWN' }, expect.stringMatching(/Kill it .* https:\/\/cloud.geny.io\/app\/instance\/uuid1/));
        expect(logger.warn).toHaveBeenCalledWith({ event: 'GENYCLOUD_TEARDOWN' }, expect.stringMatching(/gmsaas instances stop uuid1/));
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

    describe('global *emergency* clean-up', () => {
      const signalExitCallback = () => signalExit.mock.calls[0][0];
      const invokeExitCallback = (signal = 'SIGINT') => signalExitCallback()(null, signal);
      const givenCleanupPendingDevices = (rawDevices) => deviceCleanupRegistry.readRegisteredDevicesUNSAFE.mockReturnValue({ rawDevices });
      const givenNoCleanupPendingDevices = () => givenCleanupPendingDevices([]);

      it('should register a callback on global init via signal-exit, for an emergency global clean-up', async () => {
        await GenyCloudDriver.globalInit();
        expect(signalExit).toHaveBeenCalled();
        expect(signalExitCallback()).toBeDefined();
      });

      it('should warn of leaking instances in signal-exit callback', async () => {
        givenCleanupPendingDevices([
          aPendingRawDevice('aDevice', 'uuid'),
        ]);

        await GenyCloudDriver.globalInit();
        invokeExitCallback();

        expect(logger.warn).toHaveBeenCalledWith({ event: 'GENYCLOUD_TEARDOWN' }, 'WARNING! Detected a Genymotion cloud instance leakage, for the following instances:');
        expect(logger.warn).toHaveBeenCalledWith({ event: 'GENYCLOUD_TEARDOWN' }, expect.stringMatching(/aDevice \(uuid\)\n/));
      });

      it('should not warn if no instances were registered', async () => {
        givenNoCleanupPendingDevices();

        await GenyCloudDriver.globalInit();
        invokeExitCallback();

        expect(logger.warn).not.toHaveBeenCalled();
        expect(logger.info).not.toHaveBeenCalled();
      });

      it('should not warn if called with no signal', async () => {
        givenCleanupPendingDevices([
          aPendingRawDevice('aDevice', 'uuid'),
        ]);

        await GenyCloudDriver.globalInit();
        invokeExitCallback(null);

        expect(logger.warn).not.toHaveBeenCalled();
        expect(logger.info).not.toHaveBeenCalled();
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
  jest.mock('signal-exit');
}
