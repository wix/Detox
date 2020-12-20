class GenyCloudInstanceHandle {
  constructor(instance) {
    this.uuid = instance.uuid;
    this.name = instance.name;
  }

  toString() {
    return `GenyCloud:${this.name} (${this.uuid})`;
  }
}

module.exports = GenyCloudInstanceHandle;
