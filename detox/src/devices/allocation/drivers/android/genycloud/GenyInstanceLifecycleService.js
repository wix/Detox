const Instance = require('./GenyInstance');
const internals = () => require('../../../../../../internals');

class GenyInstanceLifecycleService {
  constructor(genyCloudExec) {
    this.counter = 0;
    this.genyCloudExec = genyCloudExec;
  }

  async createInstance(recipeUUID) {
    const { session } = internals();
    const instanceName = `Detox.${session.id}.${++this.counter}`;
    const result = await this.genyCloudExec.startInstance(recipeUUID, instanceName);
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
