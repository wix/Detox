const DeviceHandle = require('./DeviceHandle');

class GenymotionHandle extends DeviceHandle {
  constructor(deviceString) {
    super(deviceString);

    this.port = this.adbName.split(':')[1];
  }

  /* async */ queryName() {
    return this._namePromise;
  }
}

module.exports = GenymotionHandle;
