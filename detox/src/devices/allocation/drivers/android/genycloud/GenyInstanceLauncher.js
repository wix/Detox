const DetoxRuntimeError = require('../../../../../errors/DetoxRuntimeError');
const retry = require('../../../../../utils/retry');
const DeviceLauncher = require('../../../../common/drivers/DeviceLauncher');

class GenyInstanceLauncher extends DeviceLauncher {
  constructor({ instanceLifecycleService, instanceLookupService, deviceCleanupRegistry, eventEmitter }) {
    super(eventEmitter);

    this._instanceLifecycleService = instanceLifecycleService;
    this._instanceLookupService = instanceLookupService;
    this._deviceCleanupRegistry = deviceCleanupRegistry;
  }

  /**
   * Note:
   * In the context of Genymotion-cloud (as opposed to local emulators), emulators are
   * not launched per-se, as with local emulators. Rather, we just need to sync-up with
   * them and connect, if needed.
   *
   * @param instance {GenyInstance} The freshly allocated cloud-instance.
   * @param isNew { boolean }
   * @returns {Promise<GenyInstance>}
   */
  async launch(instance, isNew = true) {
    if (isNew) {
      await this._deviceCleanupRegistry.allocateDevice(instance.uuid, { name: instance.name });
    }
    instance = await this._waitForInstanceBoot(instance);
    instance = await this._adbConnectIfNeeded(instance);
    await this._notifyBootEvent(instance.adbName, instance.recipeName, isNew);
    return instance;
  }

  async shutdown(instance) {
    const { uuid } = instance;

    await this._notifyPreShutdown(uuid);
    await this._instanceLifecycleService.deleteInstance(uuid);
    await this._deviceCleanupRegistry.disposeDevice(uuid);
    await this._notifyShutdownCompleted(uuid);
  }

  async _waitForInstanceBoot(instance) {
    if (instance.isOnline()) {
      return instance;
    }

    const options = {
      backoff: 'none',
      retries: 25,
      interval: 5000,
      initialSleep: 45000,
    };

    return await retry(options, async () => {
      const _instance = await this._instanceLookupService.getInstance(instance.uuid);
      if (!_instance.isOnline()) {
        throw new DetoxRuntimeError(`Timeout waiting for instance ${instance.uuid} to be ready`);
      }
      return _instance;
    });
  }

  async _adbConnectIfNeeded(instance) {
    if (!instance.isAdbConnected()) {
      instance = await this._instanceLifecycleService.adbConnectInstance(instance.uuid);
    }
    return instance;
  }
}

module.exports = GenyInstanceLauncher;
