const log = require('../../../../../../utils/logger').child({ cat: 'device' });
const retry = require('../../../../../../utils/retry');

const Instance = require('./dto/GenyInstance');

class GenyInstanceLifecycleService {
  /**
   * @param { import('../exec/GenyCloudExec') } genyCloudExec
   * @param { import('../../../../../common/drivers/android/exec/ADB') } adb
   */
  constructor(genyCloudExec, adb) {
    this._genyCloudExec = genyCloudExec;
    this._adb = adb;
  }

  async createInstance(recipeUUID, instanceName) {
    const result = await this._genyCloudExec.startInstance(recipeUUID, instanceName);
    return new Instance(result.instance);
  }

  async adbConnectInstance(instanceUUID){
    const doAdbConnect = async () =>
      this._genyCloudExec.adbConnect(instanceUUID);
    const beforeEachRetry = async () => {
      try {
        const { stdout } = await this._adb.devices({ retries: 0, verbosity: 'low' });
        log.warn('adb-connect command failed, current ADB devices list:\n', stdout);
      } catch (e) {
        log.warn('adb-connect command failed; couldn\'t get the list of current devices (see error)', e);
      }
      return true;
    };
    const options = {
      conditionFn: beforeEachRetry,
      retries: 2,
    };

    const result = await retry(options, doAdbConnect);
    return new Instance(result.instance);
  }

  async deleteInstance(instanceUUID) {
    const result = await this._genyCloudExec.stopInstance(instanceUUID);
    return new Instance(result.instance);
  }
}

module.exports = GenyInstanceLifecycleService;
