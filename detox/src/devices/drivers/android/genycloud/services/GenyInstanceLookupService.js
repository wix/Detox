const _ = require('lodash');
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

  async getInstance(instanceUUID) {
    const instances = await this._getAllInstances();
    return _.find(instances, (instance) => instance.uuid === instanceUUID);
  }

  async _getRelevantInstances(recipeUUID) {
    const busyDevices = this.deviceRegistry.getBusyDevices();
    const isRelevant = (instance) =>
      instance.recipeUUID === recipeUUID &&
      !instance.isTerminated() &&
      this.instanceNaming.isFamilial(instance.name) &&
      this._isInstanceFree(instance, busyDevices);

    const instances = await this._getAllInstances();
    return instances.filter(isRelevant);
  }

  async _getAllInstances() {
    return (await this.genyCloudExec.getInstances())
      .instances
      .map((rawInstance) => new Instance(rawInstance));
  }

  _isInstanceFree(instance, busyDevices) {
    return !_.some(busyDevices, { uuid: instance.uuid });
  }
}

module.exports = GenyInstanceLookupService;
