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
    const takenDevices = await this.deviceRegistry.getRegisteredDevices();
    const isRelevant = (instance) =>
      instance.recipeUUID === recipeUUID && // TODO isn't this redundant, as we check for familiality?
      !instance.isTerminated() &&
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
