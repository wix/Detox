const AndroidDeviceLauncher = require('../../AndroidDeviceLauncher');

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
    await this._deviceCleanupRegistry.allocateDevice(instance.uuid, { name: instance.name });
  }

  async shutdown(instance) {
    const { uuid } = instance;

    await this._notifyPreShutdown(uuid);
    await this._instanceLifecycleService.deleteInstance(uuid);
    await this._deviceCleanupRegistry.disposeDevice(uuid);
    await this._notifyShutdownCompleted(uuid);
  }
}

module.exports = GenyCloudInstanceLauncher;
