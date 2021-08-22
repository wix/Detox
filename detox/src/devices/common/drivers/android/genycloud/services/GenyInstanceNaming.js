const getWorkerId = require('../../../../../../utils/getWorkerId');

class GenyInstanceNaming {
  constructor(nowProvider = () => new Date().getTime()) {
    this.uniqueSessionId = Number(process.env.DETOX_START_TIMESTAMP);
    this.nowProvider = nowProvider;
    this._workerId = getWorkerId() || (this.nowProvider() - this.uniqueSessionId);
  }

  generateName() {
    return `Detox-${this.uniqueSessionId}.${this._workerId}`;
  }

  isFamilial(name) {
    return name.startsWith(`Detox-${this.uniqueSessionId}.${this._workerId}`);
  }
}

module.exports = GenyInstanceNaming;
