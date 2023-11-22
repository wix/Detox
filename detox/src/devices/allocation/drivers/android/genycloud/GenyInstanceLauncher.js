const DetoxRuntimeError = require('../../../../../errors/DetoxRuntimeError');
const logger = require('../../../../../utils/logger').child({ cat: 'device' });
const retry = require('../../../../../utils/retry');

const GenyInstance = require('./services/dto/GenyInstance');

const events = {
  CREATE_DEVICE: { event: 'CREATE_DEVICE' },
};

class GenyInstanceLauncher {
  constructor({ genyCloudExec, instanceLifecycleService }) {
    this._genyCloudExec = genyCloudExec;
    this._instanceLifecycleService = instanceLifecycleService;
  }

  /**
   * @param {import('./services/dto/GenyRecipe')} recipe
   * @param {string} instanceName
   * @returns {Promise<GenyInstance>}
   */
  async launch(recipe, instanceName) {
    logger.debug(events.CREATE_DEVICE, `Trying to create a device based on "${recipe}"`);
    const instance = await this._instanceLifecycleService.createInstance(recipe.uuid, instanceName);
    const { name, uuid } = instance;
    logger.info(events.CREATE_DEVICE, `Allocating Genymotion Cloud instance ${name} for testing. To access it via a browser, go to: https://cloud.geny.io/instance/${uuid}`);

    return instance;
  }

  /**
   * @param {GenyInstance} instance The freshly allocated cloud-instance.
   * @returns {Promise<GenyInstance>}
   */
  async connect(instance) {
    const bootedInstance = await this._waitForInstanceBoot(instance);
    const connectedInstance = await this._adbConnectIfNeeded(bootedInstance);

    return connectedInstance;
  }

  /**
   * @param {string} instanceId
   */
  async shutdown(instanceId) {
    await this._instanceLifecycleService.deleteInstance(instanceId);
  }

  async _waitForInstanceBoot(instance) {
    if (instance.isOnline()) {
      return instance;
    }

    const options = {
      backoff: 'none',
      retries: 20,
      interval: 5000,
      initialSleep: 45000,
      shouldUnref: true,
    };

    return await retry(options, async () => {
      const { instance: _instance } = await this._genyCloudExec.getInstance(instance.uuid);
      const anInstance = new GenyInstance(_instance);

      if (!anInstance.isOnline()) {
        throw new DetoxRuntimeError(`Timeout waiting for instance ${instance.uuid} to be ready`);
      }

      return anInstance;
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
