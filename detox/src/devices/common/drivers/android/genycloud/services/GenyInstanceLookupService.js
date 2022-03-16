const Instance = require('./dto/GenyInstance');

class GenyInstanceLookupService {
  constructor(genyCloudExec, instanceNaming, genyCloudDeviceRegistry) {
    this.genyCloudExec = genyCloudExec;
    this.instanceNaming = instanceNaming;
    this.deviceRegistry = genyCloudDeviceRegistry;
  }

  async findFreeInstance() {
    const freeInstances = await this._getRelevantInstances();
    return (freeInstances[0] || null);
  }

  async getInstance(instanceUUID) {
    const { instance } = await this.genyCloudExec.getInstance(instanceUUID);
    return new Instance(instance);
  }

  async _getRelevantInstances() {
    const takenInstances = this.deviceRegistry.getRegisteredDevices();
    const isRelevant = (instance) =>
      (instance.isOnline() || instance.isInitializing()) &&
      this.instanceNaming.isFamilial(instance.name) &&
      !takenInstances.includes(instance.uuid);

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
