const _ = require('lodash');
const Instance = require('./dto/GenyInstance');

class GenyInstanceLookupService {
  constructor(genyCloudExec, instanceNaming, genyCloudDeviceRegistry) {
    this.genyCloudExec = genyCloudExec;
    this.instanceNaming = instanceNaming;
    this.deviceRegistry = genyCloudDeviceRegistry;
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
    const takenDevices = await this.deviceRegistry.getRegisteredInstanceUUIDs();
    const isRelevant = (instance) =>
      instance.recipeUUID === recipeUUID && // TODO isn't this redundant, as we check for familiality?
      !instance.isTerminated() && // TODO Add use cases for states "DELETING", "OFFLINE"
      this.instanceNaming.isFamilial(instance.name) &&
      !takenDevices.includes(instance.uuid);

    const instances = await this._getAllInstances();
    return instances.filter(isRelevant);
  }

  async _getAllInstances() {
    return (await this.genyCloudExec.getInstances())
      .instances
      .map((rawInstance) => new Instance(rawInstance));
  }
}

module.exports = GenyInstanceLookupService;
