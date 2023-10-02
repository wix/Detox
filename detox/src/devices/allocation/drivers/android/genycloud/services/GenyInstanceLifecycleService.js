const Instance = require('./dto/GenyInstance');

class GenyInstanceLifecycleService {
  constructor(genyCloudExec) {
    this._genyCloudExec = genyCloudExec;
  }

  async createInstance(recipeUUID, instanceName) {
    const result = await this._genyCloudExec.startInstance(recipeUUID, instanceName);
    return new Instance(result.instance);
  }

  async adbConnectInstance(instanceUUID) {
    const result = (await this._genyCloudExec.adbConnect(instanceUUID));
    return new Instance(result.instance);
  }

  async deleteInstance(instanceUUID) {
    const result = await this._genyCloudExec.stopInstance(instanceUUID);
    return new Instance(result.instance);
  }
}

module.exports = GenyInstanceLifecycleService;
