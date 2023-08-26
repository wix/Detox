class DeviceListReadonly {
  constructor(devices = []) {
    this._devices = new Map(devices.map(device => [device.id, device]));
  }

  concat(other) {
    return new DeviceListReadonly([...this, ...other]);
  }

  getIds() {
    return [...this._devices.keys()];
  }

  [Symbol.iterator]() {
    return this._devices.values();
  }

  /**
   * @param {string} deviceId
   * @returns {boolean}
   */
  includes(deviceId) {
    return this._devices.has(deviceId);
  }
}

class DeviceList extends DeviceListReadonly {
  filter(predicate) {
    return new DeviceListReadonly([...this].filter(predicate));
  }

  add(deviceId, data) {
    this._devices.set(deviceId, {
      id: deviceId,
      ...data,
    });
  }

  delete(deviceId) {
    this._devices.delete(deviceId);
  }
}

module.exports = DeviceList;
