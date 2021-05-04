const AndroidDeviceId = require('../AndroidDeviceId');

class GenyCloudDeviceId extends AndroidDeviceId {
  static create(instance) {
    return new GenyCloudDeviceId(instance.uuid, instance.name, instance.adbName);
  }

  constructor(instanceUUID, instanceName, adbName) {
    super(adbName);
    this.instanceUUID = instanceUUID;
    this.instanceName = instanceName;
  }

  toString() {
    return `GenyCloud:${this.instanceName} (${this.instanceUUID} ${this.adbName})`;
  }
}

module.exports = GenyCloudDeviceId;
