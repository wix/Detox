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
      () => super.adbCmd(deviceId, params, options),
    );
  }

  async adbCmdSpawned(deviceId, command, spawnOption) {
    return this._doAdbCmdAndReconnect(
      deviceId,
      () => super.adbCmdSpawned(deviceId, command, spawnOption)
    );
  }

  async _doAdbCmdAndReconnect(deviceId, doAdbCmd) {
    if (!deviceId) {
      return await doAdbCmd();
    }

    try {
      return await doAdbCmd();
    } catch (err) {
      if (!this._isDeviceNotFoundError(err)) {
        throw err;
      }
    }

    log.warn(GENYCLOUD_RECONNECT, `Device disconnected unexpectedly, trying to ADB-reconnect (ADB name: "${deviceId}", instanceId: "${this._instanceId}"`);
    try {
      const instance = await this._tryReconnect();
      this._onReconnect({ adbName: instance.adbName });
    } catch (err) {
      throw new Error(`Failed to reconnect to Genymotion Cloud instance: ${err.message}`);
    }

    log.warn(GENYCLOUD_RECONNECT, `Reconnect success, retrying ADB command... (ADB name: "${deviceId}", instanceId: "${this._instanceId}"`);
    return await doAdbCmd();
  }

  async _tryReconnect() {
    return this._instanceLifecycleService.adbConnectInstance(this._instanceId);
  }

  _isDeviceNotFoundError(err) {
    const { message } = err;
    return message.startsWith('adb: device') && message.trim().endsWith('not found');
  }
}

module.exports = GenyCloudADB;
