class GenyInstanceNaming {
  constructor(nowProvider = () => new Date().getTime()) {
    this.uniqueSessionId = Number(process.env.DETOX_START_TIMESTAMP);
    this.nowProvider = nowProvider;
  }

  generateName() {
    const uniqueDeviceId = process.env.JEST_WORKER_ID || (this.nowProvider() - this.uniqueSessionId);
    return `Detox-${this.uniqueSessionId}.${uniqueDeviceId}`;
  }

  isFamilial(name) {
    return name.startsWith(`Detox-${this.uniqueSessionId}.`);
  }
}

module.exports = GenyInstanceNaming;
