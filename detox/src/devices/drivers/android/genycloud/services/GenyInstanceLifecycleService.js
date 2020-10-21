const Instance = require('./dto/GenyInstance');

class GenyInstanceLifecycleService {
  constructor(genyCloudExec, instanceNaming) {
    this.genyCloudExec = genyCloudExec;
    this.instanceNaming = instanceNaming;
  }

  async createInstance(recipeUUID) {
    const result = await this.genyCloudExec.startInstance(recipeUUID, this.instanceNaming.generateName());
    return new Instance(result.instance);
  }

  async adbConnectInstance(instanceUUID) {
    const result = (await this.genyCloudExec.adbConnect(instanceUUID));
    return new Instance(result.instance);
  }

  async deleteInstance(instanceUUID) {
    const result = await this.genyCloudExec.stopInstance(instanceUUID);
    return new Instance(result.instance);
  }
}

module.exports = GenyInstanceLifecycleService;
