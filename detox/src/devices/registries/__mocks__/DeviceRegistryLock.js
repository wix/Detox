class DeviceRegistryLock {
  constructor() {
    this._busyDevices = null;
    this._fileContents = [];

    this.lock = jest.fn().mockImplementation(this.lock.bind(this));
    this.unlock = jest.fn().mockImplementation(this.unlock.bind(this));
  }

  get busyDevices() {
    if (!this._busyDevices) {
      throw new Error('Cannot access busy devices list while not being inside the lock.');
    }

    return this._busyDevices;
  }

  async lock() {
    this._busyDevices = new Set(this._fileContents);
  }

  async unlock() {
    if (this._busyDevices) {
      this._fileContents = [...this._busyDevices.values()];
      this._busyDevices = null;
    }
  }
}

module.exports = DeviceRegistryLock;
