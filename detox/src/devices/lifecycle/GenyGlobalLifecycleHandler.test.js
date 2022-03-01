// @ts-nocheck
const _ = require('lodash');

describe('Global-context lifecycle handler for Genymotion cloud emulators', () => {
  const anInstance = () => {
    const instance = new GenyInstance();
    instance.uuid = 'mock-instance-uuid';
    instance.name = 'mock-instance-name';
    instance.toString = () => 'mock-instance-toString()';
    return instance;
  };

  let GenyInstance;
  let signalExit;
  let logger;
  let deviceCleanupRegistry;
  let instanceLifecycleService;
  let lifecycleHandler;
  beforeEach(() => {
    jest.mock('signal-exit');
    signalExit = require('signal-exit');

    jest.mock('../../utils/logger');
    logger = require('../../utils/logger');

    GenyInstance = jest.genMockFromModule('../common/drivers/android/genycloud/services/dto/GenyInstance');

    const DeviceRegistry = jest.genMockFromModule('../DeviceRegistry');
    deviceCleanupRegistry = new DeviceRegistry();

    const InstanceLifecycleService = jest.genMockFromModule('../common/drivers/android/genycloud/services/GenyInstanceLifecycleService');
    instanceLifecycleService = new InstanceLifecycleService();

    const GenyGlobalLifecycleHandler = require('./GenyGlobalLifecycleHandler');
    lifecycleHandler = new GenyGlobalLifecycleHandler({ deviceCleanupRegistry, instanceLifecycleService });
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

      await lifecycleHandler.globalCleanup();

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

      await lifecycleHandler.globalCleanup();

      expect(logger.warn).toHaveBeenCalledWith({ event: 'GENYCLOUD_TEARDOWN' }, 'WARNING! Detected a Genymotion cloud instance leakage, for the following instances:');
      expect(logger.warn).toHaveBeenCalledWith({ event: 'GENYCLOUD_TEARDOWN' }, expect.stringMatching(/failing1 \(uuid1\): .*mock-error1/));
      expect(logger.warn).toHaveBeenCalledWith({ event: 'GENYCLOUD_TEARDOWN' }, expect.stringMatching(/failing2 \(uuid2\): .*mock-error2/));
      expect(logger.warn).toHaveBeenCalledWith({ event: 'GENYCLOUD_TEARDOWN' }, expect.stringMatching(/Kill it .* https:\/\/cloud.geny.io\/instance\/uuid1/));
      expect(logger.warn).toHaveBeenCalledWith({ event: 'GENYCLOUD_TEARDOWN' }, expect.stringMatching(/gmsaas instances stop uuid1/));
      expect(logger.warn).toHaveBeenCalledTimes(3);
    });

    it('should not warn of deletion rejects if all went well', async () => {
      const instance = anInstance();
      givenDeletionPendingInstances([instance]);
      givenDeletionResult(instance);

      await lifecycleHandler.globalCleanup();

      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should not warn or report anything if there are no devices to kill', async () => {
      givenNoDeletionPendingDevices();

      await lifecycleHandler.globalCleanup();

      expect(logger.info).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('global *emergency* clean-up', () => {
    const signalExitCallback = () => signalExit.mock.calls[0][0];
    const invokeExitCallback = (signal = 'SIGINT') => signalExitCallback()(null, signal);
    const givenCleanupPendingDevices = (rawDevices) => deviceCleanupRegistry.readRegisteredDevicesUNSAFE.mockReturnValue({ rawDevices });
    const givenNoCleanupPendingDevices = () => givenCleanupPendingDevices([]);

    it('should register a callback on global init via signal-exit, for an emergency global clean-up', async () => {
      await lifecycleHandler.globalInit();
      expect(signalExit).toHaveBeenCalled();
      expect(signalExitCallback()).toBeDefined();
    });

    it('should warn of leaking instances in signal-exit callback', async () => {
      givenCleanupPendingDevices([
        aPendingRawDevice('aDevice', 'uuid'),
      ]);

      await lifecycleHandler.globalInit();
      invokeExitCallback();

      expect(logger.warn).toHaveBeenCalledWith({ event: 'GENYCLOUD_TEARDOWN' }, 'WARNING! Detected a Genymotion cloud instance leakage, for the following instances:');
      expect(logger.warn).toHaveBeenCalledWith({ event: 'GENYCLOUD_TEARDOWN' }, expect.stringMatching(/aDevice \(uuid\)\n/));
    });

    it('should not warn if no instances were registered', async () => {
      givenNoCleanupPendingDevices();

      await lifecycleHandler.globalInit();
      invokeExitCallback();

      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should not warn if called with no signal', async () => {
      givenCleanupPendingDevices([
        aPendingRawDevice('aDevice', 'uuid'),
      ]);

      await lifecycleHandler.globalInit();
      invokeExitCallback(null);

      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });
  });
});
