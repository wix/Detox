const _ = require('lodash');
const latestInstanceOf = (clazz) => _.last(clazz.mock.instances);

const MOCK_GMSAAS_PATH = '/path/to/gmsaas';

const anInstance = () => ({
  uuid: 'mock-instance-uuid',
  name: 'mock-instance-name',
  adbName: 'mock-instance-adb-name',
  toString: () => 'mock-instance-toString()',
});

describe('Genymotion-cloud driver', () => {
  class MockInstanceLifecycleService {
    constructor(...args) {
      Object.assign(this, instanceLifecycleService);
      this.ctor(...args);
    }
  }

  beforeEach(mockBaseClassesDependencies);

  let logger;
  let emitter;
  let invocationManager;
  let detoxGenymotionManager;
  beforeEach(() => {
    logger = require('../../../../../utils/logger');

    jest.mock('../../../../../utils/getAbsoluteBinaryPath');

    const Emitter = jest.genMockFromModule('../../../../../utils/AsyncEmitter');
    emitter = new Emitter();

    const { InvocationManager } = jest.genMockFromModule('../../../../../invoke');
    invocationManager = new InvocationManager();

    jest.mock('../../../../../android/espressoapi/DetoxGenymotionManager');
    detoxGenymotionManager = require('../../../../../android/espressoapi/DetoxGenymotionManager');
  });

  let instanceLifecycleService;
  beforeEach(() => {
    const InstanceLifecycleService = jest.genMockFromModule('./services/GenyInstanceLifecycleService');
    instanceLifecycleService = new InstanceLifecycleService();
    instanceLifecycleService.ctor = jest.fn();
    jest.mock('./services/GenyInstanceLifecycleService', () => MockInstanceLifecycleService);
  });

  describe('instance scope', () => {
    let instance;
    let deviceCookie;
    let GenyCloudDriver;
    let uut;
    beforeEach(() => {
      instance = anInstance();
      deviceCookie = {
        instance,
      };
      GenyCloudDriver = require('./GenyCloudDriver');
      uut = new GenyCloudDriver(deviceCookie, {
        invocationManager,
        emitter,
        client: {},
      });
    });

    it('should return the adb-name as the external ID', () => {
      expect(uut.getExternalId()).toEqual(instance.adbName);
    });

    it('should return the instance description as the external ID', () => {
      expect(uut.getDeviceName()).toEqual(instance.toString());
    });

    describe('app installation', () => {
      const appInstallHelperObj = () => latestInstanceOf(AppInstallHelperClass);

      let AppInstallHelperClass;
      let getAbsoluteBinaryPath;
      beforeEach(() => {
        AppInstallHelperClass = require('../tools/AppInstallHelper');
        getAbsoluteBinaryPath = require('../../../../../utils/getAbsoluteBinaryPath');
      });

      it('should install using install helper', async () => {
        getAbsoluteBinaryPath
          .mockReturnValueOnce('bin-install-path')
          .mockReturnValueOnce('testbin-install-path');

        await uut.installApp('bin-path', 'testbin-path');
        expect(appInstallHelperObj().install).toHaveBeenCalledWith(instance.adbName, 'bin-install-path', 'testbin-install-path');
      });
    });

    describe('clean-up', () => {
      const instrumentationObj = () => latestInstanceOf(Instrumentation);

      let Instrumentation;
      beforeEach(() => {
        Instrumentation = require('../tools/MonitoredInstrumentation');
      });
      it('should kill instrumentation', async () => {
        await uut.cleanup('bundle-id');
        expect(instrumentationObj().terminate).toHaveBeenCalled();
      });
    });

    describe('setLocation', () => {
      it('should invoke `DetoxGenymotionManager.setLocation` with specified coordinates', async () => {
        const invocation = {
          method: 'setLocation'
        };
        detoxGenymotionManager.setLocation.mockReturnValue(invocation);

        await uut.setLocation('40.5', '55.5');
        expect(invocationManager.execute).toHaveBeenCalledWith(invocation);
        expect(detoxGenymotionManager.setLocation).toHaveBeenCalledWith(40.5, 55.5);
      });
    });
  });

  describe('class scope', () => {

    let signalExit;
    let environment;
    let deviceCleanupRegistry;
    let Exec;
    let GenyCloudDriver;
    beforeEach(() => {
      jest.mock('signal-exit');
      signalExit = require('signal-exit');

      jest.mock('./exec/GenyCloudExec');
      Exec = require('./exec/GenyCloudExec');

      jest.mock('./GenyDeviceRegistryFactory');

      const GenyDeviceRegistryFactory = require('./GenyDeviceRegistryFactory');
      const DeviceRegistry = jest.genMockFromModule('../../../../DeviceRegistry');
      deviceCleanupRegistry = new DeviceRegistry();
      GenyDeviceRegistryFactory.forGlobalShutdown.mockReturnValue(deviceCleanupRegistry);


      jest.mock('../../../../../utils/environment');
      environment = require('../../../../../utils/environment');
      environment.getGmsaasPath.mockReturnValue(MOCK_GMSAAS_PATH);

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
  jest.mock('../../../../../artifacts/utils/AndroidDevicePathBuilder');
  jest.mock('../../../../../android/espressoapi/UiDeviceProxy');
  jest.mock('../../../../../utils/logger');
}
