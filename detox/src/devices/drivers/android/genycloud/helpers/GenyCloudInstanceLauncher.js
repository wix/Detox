const AndroidDeviceLauncher = require('../../AndroidDeviceLauncher');
const GenyCloudInstanceHandle = require('../GenyCloudInstanceHandle');

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
    const instanceHandle = new GenyCloudInstanceHandle(instance);
    await this._deviceCleanupRegistry.allocateDevice(instanceHandle);
  }

  async shutdown(instance) {
    const instanceHandle = new GenyCloudInstanceHandle(instance);

    await this._notifyPreShutdown(instance.adbName);
    await this._instanceLifecycleService.deleteInstance(instance.uuid);
    await this._deviceCleanupRegistry.disposeDevice(instanceHandle);
    await this._notifyShutdownCompleted(instance.adbName);
  }
}

module.exports = GenyCloudInstanceLauncher;
