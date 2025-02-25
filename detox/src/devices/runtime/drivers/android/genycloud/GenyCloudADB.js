const log = require('../../../../../utils/logger').child({ cat: 'device' });
const ADB = require('../../../../common/drivers/android/exec/ADB');

const GENYCLOUD_RECONNECT = {
  event: 'GENYCLOUD_RECONNECT',
};

class GenyCloudADB extends ADB {

  /**
   * @param { object } deps
   * @param { string } instanceId
   */
  constructor({ instanceLifecycleService }, instanceId) {
    super();

    this._instanceLifecycleService = instanceLifecycleService;
    this._instanceId = instanceId;

    /**
     * @type { function({ adbName: string }): void }
     * @private
     */
    this._onReconnect = (_updatedInstance) => {};
  }

  /**
   * @param { function({ adbName: string }): void } callback
   */
  setOnReconnect(callback) {
    this._onReconnect = callback;
  }

  async adbCmd(deviceId, params, options) {
    return this._doAdbCmdAndReconnect(
      deviceId,
      (deviceId) => super.adbCmd(deviceId, params, options),
    );
  }

  async adbCmdSpawned(deviceId, command, spawnOption) {
    return this._doAdbCmdAndReconnect(
      deviceId,
      (deviceId) => super.adbCmdSpawned(deviceId, command, spawnOption)
    );
  }

  /**
   * @param { string } deviceId
   * @param { function(string): Promise<*> } doAdbCmd
   * @returns {Promise<*>}
   * @private
   */
  async _doAdbCmdAndReconnect(deviceId, doAdbCmd) {
    if (!deviceId) {
      return await doAdbCmd(deviceId);
    }

    try {
      return await doAdbCmd(deviceId);
    } catch (err) {
      if (!this._isDeviceNotFoundError(err)) {
        throw err;
      }
    }

    log.warn(GENYCLOUD_RECONNECT, `Device disconnected unexpectedly! Trying to ADB-reconnect... (ADB name: "${deviceId}", instanceId: "${this._instanceId}")`);
    let newDeviceId = null;
    try {
      const { adbName } = await this._tryReconnect();
      log.warn(GENYCLOUD_RECONNECT, `Reconnect success! Retrying ADB command... (ADB name: "${deviceId}"-->"${adbName}", instanceId: "${this._instanceId}")`);

      this._onReconnect({ adbName });
      newDeviceId = adbName;
    } catch (err) {
      log.error(GENYCLOUD_RECONNECT, `Reconnect failed! (ADB name: "${deviceId}", instanceId: "${this._instanceId}")`, err);
      throw new Error(`Failed to reconnect to Genymotion Cloud instance (ADB name: "${deviceId}", instanceId: "${this._instanceId}"): ${err.message}`);
    }

    return await doAdbCmd(newDeviceId);
  }

  async _tryReconnect() {
    return this._instanceLifecycleService.adbConnectInstance(this._instanceId);
  }

  _isDeviceNotFoundError(err) {
    const { stderr = '' } = err;
    return !!stderr.trim().match(/.*device '.+' not found$/);
  }
}

module.exports = GenyCloudADB;
