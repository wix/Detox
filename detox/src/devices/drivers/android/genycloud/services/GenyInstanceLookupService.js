const Instance = require('./dto/GenyInstance');

class GenyInstanceLookupService {
  constructor(genyCloudExec, instanceNaming, deviceRegistry) {
    this.genyCloudExec = genyCloudExec;
    this.instanceNaming = instanceNaming;
    this.deviceRegistry = deviceRegistry;
  }

  async findFreeInstance(recipeUUID) {
    const freeInstances = await this._getRelevantInstances(recipeUUID);
    return (freeInstances[0] || null);
  }

  async _getRelevantInstances(recipeUUID) {
    const isRelevant = (instance) =>
      instance.recipeUUID === recipeUUID &&
      !instance.isTerminated() &&
      this.instanceNaming.isFamilial(instance.name) &&
      this._isInstanceFree(instance);

    const result = await this._getAllInstances();
    return result.filter(isRelevant);
  }

  async _getAllInstances() {
    return (await this.genyCloudExec.getInstances())
      .instances
      .map((rawInstance) => new Instance(rawInstance));
  }

  _isInstanceFree(instance) {
    if (!instance.isAdbConnected()) {
      return instance;
    }
    return !this.deviceRegistry.isDeviceBusy(instance.adbName);
  }
}

module.exports = GenyInstanceLookupService;
