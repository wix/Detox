const AndroidDeviceLauncher = require('../../AndroidDeviceLauncher');

class InstanceHandle {
  constructor(uuid, name) {
    this.uuid = uuid;
    this.name = name;
  }
}

class GenyCloudInstanceLauncher extends AndroidDeviceLauncher {
  constructor(instanceLifecycleService, deviceCleanupRegistry, eventEmitter) {
    super(eventEmitter);
    this._instanceLifecycleService = instanceLifecycleService;
    this._deviceCleanupRegistry = deviceCleanupRegistry;
  }

  /**
   * Note:
   * In the context of Genymotion-cloud (as opposed to local emulators), the "launching"
   * effectively only boils down to book-keeping associated with it, rather than the
   * launch itself. That it because the actual launching (creation) of it is done in a synchronized,
   * isolated means beforehand.
   *
   * @param instance {GenyInstance} The freshly allocated cloud-instance.
   * @returns {Promise<void>}
   */
  async launch(instance) {
    const instanceHandle = new InstanceHandle(instance.uuid, instance.name);
    await this._deviceCleanupRegistry.allocateDevice(instanceHandle);
  }

  /**
   * @param deviceId {GenyCloudDeviceId}
   * @returns {Promise<void>}
   */
  async shutdown(deviceId) {
    const { adbName, instanceUUID, instanceName } = deviceId;
    const instanceHandle = new InstanceHandle(instanceUUID, instanceName);

    await this._notifyPreShutdown(adbName);
    await this._instanceLifecycleService.deleteInstance(instanceUUID);
    await this._deviceCleanupRegistry.disposeDevice(instanceHandle);
    await this._notifyShutdownCompleted(adbName);
  }
}

module.exports = GenyCloudInstanceLauncher;
